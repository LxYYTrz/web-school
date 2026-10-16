import {
  BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseIntPipe,
  Post, Res, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as fs from 'node:fs';
import { AuthGuard } from '../auth/auth.guard';
import { config } from '../config/configuration';
import { VisionService, type VisionUpload } from './vision.service';
import { VisionTokenGuard } from './vision-token.guard';

// 图片 MIME:浏览器 <img> 按 Content-Type 决定怎么渲染
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.tif': 'image/tiff', '.tiff': 'image/tiff',
  '.gif': 'image/gif', '.heic': 'image/heic', '.img': 'application/octet-stream',
};

@Controller('api/vision/images')
export class VisionController {
  constructor(private readonly vision: VisionService) {}

  /**
   * 视觉机上传(契约 §4 第 1 步)。multipart/form-data:
   *   file        图片二进制(必填)
   *   sn          工件序列号(必填,只允许字母数字与 . _ -)
   *   cameraId    可选,不传用 VISION_DEFAULT_CAMERA_ID
   *   result      可选 ok|ng,默认 ok
   *   capturedAt  可选 epoch 毫秒,不传用服务端当前时间
   *   defects     可选,JSON 数组字符串
   *
   * 鉴权走 X-Vision-Token(见 VisionTokenGuard),**不用**登录 session ——
   * 视觉机是无人值守采集端,不该持有人类账号密码。
   */
  @Post()
  @UseGuards(VisionTokenGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: config.vision.maxUploadBytes } }))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, string>,
  ) {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException({
        code: 400,
        msg: `缺少图片文件(表单字段名必须是 "file");max ${config.vision.maxUploadBytes} 字节`,
      });
    }

    // defects 走 JSON 字符串,解析失败不该让整张图丢掉
    let defects: unknown[] = [];
    if (body.defects) {
      try {
        const parsed = JSON.parse(body.defects);
        if (Array.isArray(parsed)) defects = parsed;
      } catch {
        // 留空数组即可,缺陷框是展示增强,不是硬要求
      }
    }

    let capturedAt: number | undefined;
    if (body.capturedAt) {
      const n = Number(body.capturedAt);
      if (Number.isFinite(n) && n > 0) capturedAt = n;
    }

    const upload: VisionUpload = {
      buffer: file.buffer,
      originalName: file.originalname ?? '',
      sn: String(body.sn ?? ''),
      cameraId: body.cameraId || undefined,
      result: body.result || undefined,
      capturedAt,
      defects,
    };

    const saved = await this.vision.save(upload);
    return {
      ok: true,
      id: saved.id,
      sn: saved.sn,
      imageUrl: `/api/vision/images/${saved.id}/raw`,
      thumbUrl: `/api/vision/images/${saved.id}/thumb`,
    };
  }

  /** 读取原图 / 缩略图(前端 VisionView 用)——校验登录态 */
  @Get(':id/:variant')
  @UseGuards(AuthGuard)
  async read(
    @Param('id', ParseIntPipe) id: number,
    @Param('variant') variant: string,
    @Res() res: Response,
  ): Promise<void> {
    if (variant !== 'raw' && variant !== 'thumb') {
      throw new NotFoundException();
    }
    const keys = await this.vision.findKeys(id);
    if (!keys) throw new NotFoundException({ code: 404, msg: '图片不存在' });

    const path = variant === 'raw' ? keys.objectKey : keys.thumbKey;
    const abs = this.vision.readPath(path);
    if (!abs || !fs.existsSync(abs)) {
      // 记录已过期或文件被误删。返回 404 而不是 500:前端 <img> 本来就容得下
      throw new NotFoundException({ code: 404, msg: '图片文件已不在(可能已过保留期)' });
    }

    // 注意:扩展名要带点,与上面 MIME 表的键一致 —— 否则永远查不到,
    // 浏览器会拿到 application/octet-stream,把 <img> 当下载而不是显示图片。
    const dot = abs.lastIndexOf('.');
    const ext = dot >= 0 ? abs.slice(dot).toLowerCase() : '';
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=300');
    fs.createReadStream(abs).pipe(res);
  }
}
