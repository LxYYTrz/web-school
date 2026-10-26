/**
 // 这一段负责配置和实现 server/src/realtime/snapshot.controller.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
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
 *   浏览器 → http://云服务器IP:8081/api/lines/line-01/snapshot
 *          → 云端 Nginx（location /api/ 反向代理）
 *          → 127.0.0.1:3300（云端 SSH 反向隧道入口）
 *          → 工控机 NestJS（本控制器）
 *          → Redis 查询快照
 *          → 原路返回
 */
import { Controller, Get, Param } from '@nestjs/common';
// 从 @nestjs/common 导入这一行列出的符号，供本文件调用。
// Controller：NestJS 声明 HTTP 控制器及公共路由前缀的装饰器；Get：NestJS 将方法绑定到 HTTP GET 路由的装饰器；Param：NestJS 从 URL 路径提取参数的装饰器
import { LineStateService } from '../state/line-state.service';
// 从 ../state/line-state.service 导入这一行列出的符号，供本文件调用。
// LineStateService：后端实时状态服务，将产线、机器人和 IO 快照存入 Redis

// 产线快照:前端首屏/断线重连时一次性拉取当前状态(数据来自 Redis)
/**
 * 快照控制器：对外暴露产线快照查询接口。
 */
// 这一段声明 SnapshotController，用于SnapshotController 的相关数据和行为。
@Controller('api/lines')
// 装饰器 Controller：声明 HTTP 控制器及路由前缀。
// Controller：NestJS 声明 HTTP 控制器及公共路由前缀的装饰器
export class SnapshotController {
// 定义 SnapshotController，约束或实现本模块涉及的数据和行为。
// SnapshotController 是本文件声明的类；其装饰器、字段和方法由下面的代码定义
  // 这一段定义 constructor，用于初始化 snapshot.controller 使用的实例状态和依赖。
  constructor(private readonly state: LineStateService) {}
  // 开始声明当前类的构造函数，列出创建服务实例时注入的依赖。
  // state：当前状态值或实时状态服务实例，以所在对象为准；LineStateService：后端实时状态服务，将产线、机器人和 IO 快照存入 Redis
  // 这一段提供了初始化 snapshot.controller 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 snapshot，用于向调用方返回指定产线的实时快照。
  @Get(':lineId/snapshot')
  // 装饰器 Get：把方法绑定到 GET 路由。
  // Get：NestJS 将方法绑定到 HTTP GET 路由的装饰器
  snapshot(@Param('lineId') lineId: string) {
  // 定义方法 snapshot；括号中声明参数，花括号内实现逻辑。
  // snapshot：向调用方返回指定产线的实时快照；Param：NestJS 从 URL 路径提取参数的装饰器；lineId：产线标识，接口通常使用 line-01 等编码
    return this.state.getLineSnapshot(lineId);
    // 把this.state.getLineSnapshot(lineId)作为当前函数的结果返回。
    // state：当前状态值或实时状态服务实例，以所在对象为准；getLineSnapshot：读取并汇总产线状态、IO、边缘在线信息和机器人最新帧；lineId：产线标识，接口通常使用 line-01 等编码
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了向调用方返回指定产线的实时快照的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/realtime/snapshot.controller.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 SnapshotController 的字段或服务能力，供项目其他模块使用。
