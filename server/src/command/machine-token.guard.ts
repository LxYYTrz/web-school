/**
 * ============================================================================
 * 文件作用：机器通道守卫（x-machine-token）
 * 所属模块：server/src/command/
 * ============================================================================
 *
 * 【为什么需要它】
 *   网页控制走的是「session + level>=2」这套（AuthGuard + CommandGuard）。
 *   但演示阶段要让**飞书里的 AI**直接下发指令 —— AI 不是浏览器,没有 session。
 *   所以另开一条「机器对机器」的通道:带一个共享密钥(x-machine-token)即可,
 *   下发逻辑仍然复用同一个 CommandService.issue()，
 *   白名单 / params 枚举 / 审计 / MQTT 一条都不少。
 *
 * 【安全边界】
 *   - 密钥来自环境变量 MACHINE_COMMAND_TOKEN,**没配就是关闭**(直接 503)。
 *     不做「默认密钥」,也不做「配了就全放开」以外的任何隐式行为。
 *   - 用 sha256 + timingSafeEqual 比较,避免比较耗时泄露信息。
 *   - 这条通道**不接公网**:只允许从本机(127.0.0.1)调用,密钥不进仓库。
 *     真正的投产收紧见 CLAUDE.md §4.7。
 */
import {
// 导入或导出模块符号。 关键字：import＝导入模块或符号。
  CanActivate,
  // 把变量 CanActivate 作为同名对象字段加入当前对象。
  ExecutionContext,
  // 把变量 ExecutionContext 作为同名对象字段加入当前对象。
  ForbiddenException,
  // 把变量 ForbiddenException 作为同名对象字段加入当前对象。
  Injectable,
  // 把变量 Injectable 作为同名对象字段加入当前对象。
  Logger,
  // 把变量 Logger 作为同名对象字段加入当前对象。
  ServiceUnavailableException,
  // 把变量 ServiceUnavailableException 作为同名对象字段加入当前对象。
  UnauthorizedException,
  // 把变量 UnauthorizedException 作为同名对象字段加入当前对象。
} from '@nestjs/common';
// 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：from＝指定导入来源。
import { createHash, timingSafeEqual } from 'crypto';
// 从 crypto 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { Request } from 'express';
// 从 express 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { config } from '../config/configuration';
// 从 ../config/configuration 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

@Injectable()
// 装饰器 Injectable：标记为可由 NestJS 依赖注入的服务。
export class MachineTokenGuard implements CanActivate {
// 声明 MachineTokenGuard 的结构。 关键字：export＝向其他模块开放符号；class＝定义类；implements＝实现接口。
  private readonly logger = new Logger(MachineTokenGuard.name);
  // 调用 Logger；括号中的表达式是传入的参数。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值；new＝创建对象实例。

  canActivate(context: ExecutionContext): boolean {
  // 定义方法 canActivate；括号中声明参数，花括号内实现逻辑。
    const token = config.machine.commandToken;
    // 声明 token，初始值由 config.machine.commandToken 计算得到。 关键字：const＝声明不可重新绑定的变量。
    // 通道没配置 = 关闭。不是 403,是 503 —— 语义是「这个功能没开」,
    // 调用方能区分「凭据错了」和「压根没启用」。
    if (!token) {
    // 判断 if (!token) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      throw new ServiceUnavailableException({
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
        code: 503,
        // 设置字段 code。
        msg: '机器通道未启用(后端未配置 MACHINE_COMMAND_TOKEN)',
        // 设置字段 msg。
      });
      // 结束当前回调或对象，并完成外层函数调用。
    }
    // 结束当前对象、函数或条件代码块。

    const req = context.switchToHttp().getRequest<Request>();
    // 声明 req，初始值由 context.switchToHttp().getRequest<Request>() 计算得到。 关键字：const＝声明不可重新绑定的变量。
    const remote = req.socket.remoteAddress;
    // 声明 remote，初始值由 req.socket.remoteAddress 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (remote !== '127.0.0.1' && remote !== '::1' && remote !== '::ffff:127.0.0.1') {
    // 判断 if (remote !== '127.0.0.1' && remote !== '::1' && remote !== '::ffff:127.0.0.1') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      throw new ForbiddenException({ code: 403, msg: '机器通道仅允许本机调用' });
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。
    const provided = String(req.headers['x-machine-token'] ?? '');
    // 声明 provided，初始值由 String(req.headers['x-machine-token'] ?? '') 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (!provided) {
    // 判断 if (!provided) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      throw new UnauthorizedException({ code: 401, msg: '缺少 x-machine-token' });
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。

    // 先 sha256 再比:保证两个摘要等长,timingSafeEqual 才不会因长度不同抛异常
    const a = createHash('sha256').update(provided).digest();
    // 声明 a，初始值由 createHash('sha256').update(provided).digest() 计算得到。 关键字：const＝声明不可重新绑定的变量。
    const b = createHash('sha256').update(token).digest();
    // 声明 b，初始值由 createHash('sha256').update(token).digest() 计算得到。 关键字：const＝声明不可重新绑定的变量。
    if (!timingSafeEqual(a, b)) {
    // 判断 if (!timingSafeEqual(a, b)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      this.logger.warn(`机器通道凭据校验失败,来源 IP=${req.ip ?? 'unknown'}`);
      // 调用 this.logger.warn，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      throw new UnauthorizedException({ code: 401, msg: '机器凭据无效' });
      // 抛出异常供调用方处理。 关键字：throw＝抛出错误；new＝创建对象实例。
    }
    // 结束当前对象、函数或条件代码块。
    return true;
    // 返回 true 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
