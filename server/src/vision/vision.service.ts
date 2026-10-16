import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import sharp from 'sharp';
import { config } from '../config/configuration';
import { CatalogService } from '../infra/catalog.service';
import { PG_POOL } from '../infra/tokens';
import { TelemetryGateway } from '../realtime/telemetry.gateway';

export interface VisionUpload {
  buffer: Buffer;
  originalName: string;
  sn: string;
  cameraId?: string;
  result?: string;
  capturedAt?: number;
  defects?: unknown[];
}

/** 前端 VisionView 消费的 vision_result 形状(契约 §3.4) */
interface VisionResultBroadcast {
  ts: number;
  lineId: string;
  cameraId: string;
  sn: string;
  result: 'ok' | 'ng';
  defects: unknown[];
  imageUrl: string | null;
  thumbUrl: string | null;
}

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private readonly root = path.resolve(config.vision.storageDir);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly catalog: CatalogService,
    private readonly gateway: TelemetryGateway,
  ) {}

  async onModuleInit() {
    await fs.mkdir(this.root, { recursive: true });
    this.logger.log(`图片存储根目录: ${this.root}(原图保留 ${config.vision.retentionHours}h)`);
  }

  /**
   * sn 来自视觉机的文件名,属于外部输入。
   * 只放行 [A-Za-z0-9._-],并显式拒掉 . / \ ..,防止路径穿越写到存储根之外。
   */
  private safeSn(sn: string): string {
    const s = sn.trim();
    if (!s) throw new BadRequestException({ code: 400, msg: 'sn 不能为空' });
    if (s.length > 128) throw new BadRequestException({ code: 400, msg: 'sn 过长(>128)' });
    if (!/^[A-Za-z0-9._-]+$/.test(s) || s === '.' || s === '..') {
      throw new BadRequestException({
        code: 400,
        msg: `sn 只允许字母数字与 . _ -,收到: ${JSON.stringify(s)}`,
      });
    }
    return s;
  }

  /** 把 key 解析成绝对路径,并确认仍在存储根内 —— 纵深防御(即使 DB 被改坏也越不出去) */
  private resolveWithinRoot(key: string): string {
    const p = path.resolve(this.root, key);
    if (p !== this.root && !p.startsWith(this.root + path.sep)) {
      throw new BadRequestException({ code: 400, msg: '非法的对象 key' });
    }
    return p;
  }

  async save(upload: VisionUpload) {
    const sn = this.safeSn(upload.sn);
    const lineCode = config.vision.defaultLineId;
    const cameraCode = upload.cameraId || config.vision.defaultCameraId;
    const lineId = this.catalog.lineId(lineCode);
    if (lineId === undefined) {
      // 产线编码解析不到就不能落库(外键约束会失败),早失败给出可读原因
      throw new BadRequestException({
        code: 400,
        msg: `未知产线编码 ${lineCode},检查 production_lines 种子数据`,
      });
    }
    const cameraId = this.catalog.deviceId(cameraCode) ?? null;

    const result = upload.result === 'ng' ? 'ng' : 'ok';
    // 契约里 ts 是 epoch 毫秒;入库的 captured_at 是 TIMESTAMPTZ —— 必须转 Date,
    // 直接塞裸数字 pg 会当字符串解析,报"日期/时间值超出范围"(与 history-writer.toTime 同约定)
    const capturedAtMs = upload.capturedAt ?? Date.now();
    const capturedAt = new Date(capturedAtMs);
    const defects = Array.isArray(upload.defects) ? upload.defects : [];

    // 按天分目录,清理时只需按 mtime 扫目录,不用查全表
    const day = capturedAt;
    const dayKey = [
      day.getFullYear(),
      String(day.getMonth() + 1).padStart(2, '0'),
      String(day.getDate()).padStart(2, '0'),
    ].join('-');
    const relDir = dayKey;
    const absDir = this.resolveWithinRoot(relDir);
    await fs.mkdir(absDir, { recursive: true });

    // 原图:保留原扩展名(视觉机可能给 jpg/png/tif);扩展名由内容嗅探结果决定,不信原文件名
    const ext = (await this.sniffExt(upload.buffer)) ?? '.img';
    const objectKey = `${relDir}/${sn}${ext}`;
    const thumbKey = `${relDir}/_thumb/${sn}.jpg`;

    const absOriginal = this.resolveWithinRoot(objectKey);
    await fs.writeFile(absOriginal, upload.buffer);

    // 缩略图:长边 thumbMaxEdge,转 JPEG。失败不致命 —— 原图已经落盘,
    // 缩略图没了顶多前端显示不出图,不该让整个上传失败丢原图。
    try {
      await fs.mkdir(this.resolveWithinRoot(`${relDir}/_thumb`), { recursive: true });
      await sharp(upload.buffer)
        .rotate()                       // 按 EXIF 摆正,相机竖拍时不会躺倒
        .resize({
          width: config.vision.thumbMaxEdge,
          height: config.vision.thumbMaxEdge,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: config.vision.thumbQuality })
        .toFile(this.resolveWithinRoot(thumbKey));
    } catch (e) {
      this.logger.warn(`缩略图生成失败 sn=${sn}: ${(e as Error).message}(原图已存)`);
    }

    // 同一 sn 重复上传 = 同一件工件的补拍/重传,更新而不是再插一行
    const existing = await this.pool.query(
      `SELECT id FROM vision_images
        WHERE line_id = $1 AND sn = $2
        ORDER BY captured_at DESC LIMIT 1`,
      [lineId, sn],
    );

    let rowId: number;
    if (existing.rows.length) {
      rowId = Number(existing.rows[0].id);
      await this.pool.query(
        `UPDATE vision_images
            SET camera_id = $1, result = $2, defects = $3,
                object_key = $4, thumb_key = $5, captured_at = $6
          WHERE id = $7`,
        [cameraId, result, JSON.stringify(defects), objectKey, thumbKey, capturedAt, rowId],
      );
    } else {
      const ins = await this.pool.query(
        `INSERT INTO vision_images
           (line_id, camera_id, sn, result, defects, object_key, thumb_key, captured_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [lineId, cameraId, sn, result, JSON.stringify(defects),
         objectKey, thumbKey, capturedAt],
      );
      rowId = Number(ins.rows[0].id);
    }

    // 复用 vision_result 事件(契约 §3.4),只是把 imageUrl/thumbUrl 填上 ——
    // 前端 VisionView 早就在等这两个字段,所以前端零改动。
    this.gateway.broadcastVision(lineCode, {
      ts: Date.now(),
      lineId: lineCode,
      cameraId: cameraCode,
      sn,
      result,
      defects,
      imageUrl: `/api/vision/images/${rowId}/raw`,
      thumbUrl: `/api/vision/images/${rowId}/thumb`,
    } satisfies VisionResultBroadcast);

    this.logger.log(`已存图 sn=${sn} ${objectKey} ${(upload.buffer.length / 1024).toFixed(0)}KB`);
    return { id: rowId, sn, objectKey, thumbKey };
  }

  async findKeys(id: number): Promise<{ objectKey: string | null; thumbKey: string | null } | null> {
    const r = await this.pool.query(
      'SELECT object_key, thumb_key FROM vision_images WHERE id = $1',
      [id],
    );
    if (!r.rows.length) return null;
    return { objectKey: r.rows[0].object_key ?? null, thumbKey: r.rows[0].thumb_key ?? null };
  }

  readPath(key: string | null): string | null {
    if (!key) return null;
    return this.resolveWithinRoot(key);
  }

  /**
   * 按内容嗅探扩展名,不采信客户端给的 filename ——
   * 传进来的东西一律当不可信输入处理。
   */
  private async sniffExt(buf: Buffer): Promise<string | null> {
    try {
      const meta = await sharp(buf).metadata();
      const map: Record<string, string> = {
        jpeg: '.jpg', png: '.png', webp: '.webp', tiff: '.tif', gif: '.gif', heif: '.heic',
      };
      return map[meta.format ?? ''] ?? null;
    } catch {
      return null;
    }
  }
}
