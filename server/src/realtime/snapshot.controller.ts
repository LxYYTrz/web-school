/**
 * ============================================================================
 * 文件作用：产线快照 REST 接口（前端首屏 / 断线重连的数据来源）
 * 所属模块：server/src/realtime/
 * ============================================================================
 *
 * 【它解决什么问题】
 *   前端打开页面时：
 *     - WebSocket 建立连接需要几十~几百毫秒；
 *     - 即便连上了，也要等下一帧 MQTT 数据才能看到画面（0.1~1 秒）。
 *   如果这段时间页面空白，用户体验很差（尤其是产线已经停机时，永远不会有下一帧）。
 *   所以前端在建立 WebSocket 的同时，并行发一个 REST 请求拿快照，
 *   立刻就能渲染出「当前状态」。
 *
 * 【接口定义】
 *   方法：GET
 *   路径：/api/lines/{lineId}/snapshot
 *   完整：GET http://<后端>:3000/api/lines/line-01/snapshot
 *   返回：见下方 LineStateService.getLineSnapshot 的注释
 *
 * 【生产环境下的完整访问路径】
 *   浏览器 → http://云服务器IP/api/lines/line-01/snapshot
 *          → 云端 Nginx（location /api/ 反向代理）
 *          → 127.0.0.1:3300（SSH 反向隧道入口）
 *          → 工控机 NestJS（本控制器）
 *          → Redis 查询快照
 *          → 原路返回
 */

import { Controller, Get, Param } from '@nestjs/common';
import { LineStateService } from '../state/line-state.service';

/**
 * 快照控制器：对外暴露产线快照查询接口。
 */
@Controller('api/lines') // 路由前缀：所有方法都在 /api/lines 下
export class SnapshotController {
  /**
   * 构造函数：注入状态服务（由 RealtimeModule imports 的 StateModule 提供）
   */
  constructor(private readonly state: LineStateService) {}

  /**
   * GET /api/lines/:lineId/snapshot —— 获取产线当前快照。
   *
   * @Param('lineId') 把路径里的 {lineId} 取出来。
   *   例如请求 /api/lines/line-01/snapshot，这里 lineId = 'line-01'
   *
   * 直接 return 一个普通对象，NestJS 会自动序列化成 JSON 响应。
   * 不需要手动 res.json()。
   */
  @Get(':lineId/snapshot')
  snapshot(@Param('lineId') lineId: string) {
    return this.state.getLineSnapshot(lineId);
  }
}
