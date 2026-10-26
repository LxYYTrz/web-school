# server/src/realtime/telemetry.gateway.ts 逐行注释

[打开源码](../../../../../server/src/realtime/telemetry.gateway.ts) · 119 行 · 41 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 47 行**

```text
import {
// 注释：导入或导出模块符号。 关键字：`import`＝导入模块或符号。
```

**源码第 48 行**

```text
  ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer,
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 49 行**

```text
} from '@nestjs/websockets';
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`from`＝指定导入来源。
```

**源码第 50 行**

```text
import { Server, Socket } from 'socket.io';
// 注释：从 socket.io 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 51 行**

```text
import { config } from '../config/configuration';
// 注释：从 ../config/configuration 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 55 行**

```text
@WebSocketGateway({ cors: { origin: config.http.corsOrigin } })
// 注释：装饰器 WebSocketGateway：声明 WebSocket 网关。
```

**源码第 56 行**

```text
export class TelemetryGateway {
// 注释：声明 `TelemetryGateway` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。
```

**源码第 58 行**

```text
  @WebSocketServer() server: Server;
// 注释：装饰器 WebSocketServer：给后面的类、方法或参数附加元数据。
```

**源码第 64 行**

```text
  @SubscribeMessage('subscribe')
// 注释：装饰器 SubscribeMessage：订阅指定 WebSocket 消息。
```

**源码第 65 行**

```text
  handleSubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { lineId?: string }) {
// 注释：定义方法 handleSubscribe；括号中声明参数，花括号内实现逻辑。
```

**源码第 67 行**

```text
    if (!body?.lineId) return { ok: false, error: 'lineId required' };
// 注释：判断 if (!body?.lineId) return { ok: false, error: 'lineId required' }; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`return`＝返回结果并结束当前函数；`false`＝布尔假值。
```

**源码第 70 行**

```text
    void client.join(`line:${body.lineId}`);
// 注释：调用 client.join；括号中的表达式是传入的参数。 关键字：`void`＝表示没有返回值。
```

**源码第 72 行**

```text
    return { ok: true, lineId: body.lineId };
// 注释：返回 { ok: true, lineId: body.lineId } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 73 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 78 行**

```text
  @SubscribeMessage('unsubscribe')
// 注释：装饰器 SubscribeMessage：订阅指定 WebSocket 消息。
```

**源码第 79 行**

```text
  handleUnsubscribe(@ConnectedSocket() client: Socket, @MessageBody() body: { lineId?: string }) {
// 注释：定义方法 handleUnsubscribe；括号中声明参数，花括号内实现逻辑。
```

**源码第 80 行**

```text
    if (body?.lineId) void client.leave(`line:${body.lineId}`);
// 注释：判断 if (body?.lineId) void client.leave(`line:${body.lineId}`); 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`void`＝表示没有返回值。
```

**源码第 81 行**

```text
    return { ok: true };
// 注释：返回 { ok: true } 的值，结束当前函数。 关键字：`return`＝返回结果并结束当前函数；`true`＝布尔真值。
```

**源码第 82 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 84 行**

```text
  broadcastRobot(lineId: string, msg: unknown) {
// 注释：定义方法 broadcastRobot；括号中声明参数，花括号内实现逻辑。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 85 行**

```text
    this.server?.to(`line:${lineId}`).emit('robot_state', msg);
// 注释：调用 .to，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 86 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 88 行**

```text
  broadcastLineStatus(lineId: string, msg: unknown) {
// 注释：定义方法 broadcastLineStatus；括号中声明参数，花括号内实现逻辑。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 89 行**

```text
    this.server?.to(`line:${lineId}`).emit('line_status', msg);
// 注释：调用 .to，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 90 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 93 行**

```text
  broadcastIo(lineId: string, msg: unknown) {
// 注释：定义方法 broadcastIo；括号中声明参数，花括号内实现逻辑。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 94 行**

```text
    this.server?.to(`line:${lineId}`).emit('io_state', msg);
// 注释：调用 .to，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 95 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 100 行**

```text
  broadcastEvent(lineId: string, msg: unknown) {
// 注释：定义方法 broadcastEvent；括号中声明参数，花括号内实现逻辑。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 101 行**

```text
    this.server?.to(`line:${lineId}`).emit('event', msg);
// 注释：调用 .to，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 102 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 104 行**

```text
  broadcastEdge(lineId: string, msg: unknown) {
// 注释：定义方法 broadcastEdge；括号中声明参数，花括号内实现逻辑。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 105 行**

```text
    this.server?.to(`line:${lineId}`).emit('edge_status', msg);
// 注释：调用 .to，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 106 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 109 行**

```text
  broadcastCommandAck(lineId: string, msg: unknown) {
// 注释：定义方法 broadcastCommandAck；括号中声明参数，花括号内实现逻辑。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 110 行**

```text
    this.server?.to(`line:${lineId}`).emit('command_ack', msg);
// 注释：调用 .to，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 111 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 116 行**

```text
  broadcastAiProposal(lineId: string, msg: unknown) {
// 注释：定义方法 broadcastAiProposal；括号中声明参数，花括号内实现逻辑。 关键字：`unknown`＝需检查后才能使用的类型。
```

**源码第 117 行**

```text
    this.server?.to(`line:${lineId}`).emit('ai_proposal', msg);
// 注释：调用 .to，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 118 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 119 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
