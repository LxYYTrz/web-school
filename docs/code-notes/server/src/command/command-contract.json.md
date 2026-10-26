# server/src/command/command-contract.json 逐行注释

[打开源码](../../../../../server/src/command/command-contract.json) · 31 行 · 31 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
{
/* 注释：开始一个对象或数组；对象按键保存配置，数组按顺序保存条目。 */
```

**源码第 2 行**

```text
  "_comment": "控制指令契约的单一数据源。后端 CommandService 以 TS import 读取,AI 的只读 MCP server(mcp/line-twin-mcp.js,独立进程)以 require 直接读取本文件 —— 两边共用一份定义,避免 AI 建议白名单与真实下发白名单漂移。改这里等于改两处。",
/* 注释：_comment：指定该项的值；当前值为 "控制指令契约的单一数据源。后端 CommandService 以 TS import 读取,AI 的只读 MCP server(mcp/line-twin-mcp.js,独立进程)以 require 直接读取本文件 —— 两边共用一份定义,避免 AI 建议白名单与真实下发白名单漂移。改这里等于改两处。"。 */
```

**源码第 3 行**

```text
  "_source": "契约 v1.2,docs/contract/README.md §3.6",
/* 注释：_source：指定该项的值；当前值为 "契约 v1.2,docs/contract/README.md §3.6"。 */
```

**源码第 4 行**

```text
  "allowedTypes": [
/* 注释：allowedTypes：可被系统识别的控制指令类型；当前值为 [。 */
```

**源码第 5 行**

```text
    "start",
/* 注释：在 allowedTypes 中加入值 "start"。 */
```

**源码第 6 行**

```text
    "stop",
/* 注释：在 allowedTypes 中加入值 "stop"。 */
```

**源码第 7 行**

```text
    "reset",
/* 注释：在 allowedTypes 中加入值 "reset"。 */
```

**源码第 8 行**

```text
    "changeover",
/* 注释：在 allowedTypes 中加入值 "changeover"。 */
```

**源码第 9 行**

```text
    "mode_set",
/* 注释：在 allowedTypes 中加入值 "mode_set"。 */
```

**源码第 10 行**

```text
    "alarm_clear",
/* 注释：在 allowedTypes 中加入值 "alarm_clear"。 */
```

**源码第 11 行**

```text
    "conveyor"
/* 注释：在 allowedTypes 中加入值 "conveyor"。 */
```

**源码第 12 行**

```text
  ],
/* 注释：结束当前对象或数组；末尾逗号表示后面还有同级条目。 */
```

**源码第 13 行**

```text
  "executableTypes": ["start", "stop", "mode_set", "conveyor"],
/* 注释：executableTypes：现场有 PLC 写点、允许执行的指令类型；当前值为 ["start", "stop", "mode_set", "conveyor"]。 */
```

**源码第 14 行**

```text
  "paramEnums": {
/* 注释：paramEnums：控制参数到 PLC 数值的枚举映射；当前值为 {。 */
```

**源码第 15 行**

```text
    "mode_set": {
/* 注释：mode_set：指定该项的值；当前值为 {。 */
```

**源码第 16 行**

```text
      "acquire": 1,
/* 注释：acquire：指定该项的值；当前值为 1。 */
```

**源码第 17 行**

```text
      "release": 2
/* 注释：release：指定该项的值；当前值为 2。 */
```

**源码第 18 行**

```text
    },
/* 注释：结束当前对象或数组；末尾逗号表示后面还有同级条目。 */
```

**源码第 19 行**

```text
    "conveyor": {
/* 注释：conveyor：指定该项的值；当前值为 {。 */
```

**源码第 20 行**

```text
      "forward": 1,
/* 注释：forward：指定该项的值；当前值为 1。 */
```

**源码第 21 行**

```text
      "stop": 0
/* 注释：stop：指定该项的值；当前值为 0。 */
```

**源码第 22 行**

```text
    }
/* 注释：结束当前对象或数组；末尾逗号表示后面还有同级条目。 */
```

**源码第 23 行**

```text
  },
/* 注释：结束当前对象或数组；末尾逗号表示后面还有同级条目。 */
```

**源码第 24 行**

```text
  "notes": {
/* 注释：notes：控制类型的现场语义说明；当前值为 {。 */
```

**源码第 25 行**

```text
    "mode_set": "PLC word 8,脉冲型(写完自动回 0)",
/* 注释：mode_set：指定该项的值；当前值为 "PLC word 8,脉冲型(写完自动回 0)"。 */
```

**源码第 26 行**

```text
    "conveyor": "PLC word 10,电平型(1=正转 0=停止,需显式回 0)",
/* 注释：conveyor：指定该项的值；当前值为 "PLC word 10,电平型(1=正转 0=停止,需显式回 0)"。 */
```

**源码第 27 行**

```text
    "reset": "现场 PLC 无对应寄存器,edge 会回 rejected",
/* 注释：reset：指定该项的值；当前值为 "现场 PLC 无对应寄存器,edge 会回 rejected"。 */
```

**源码第 28 行**

```text
    "changeover": "现场 PLC 无对应寄存器,edge 会回 rejected",
/* 注释：changeover：指定该项的值；当前值为 "现场 PLC 无对应寄存器,edge 会回 rejected"。 */
```

**源码第 29 行**

```text
    "alarm_clear": "现场 PLC 无对应寄存器,edge 会回 rejected"
/* 注释：alarm_clear：指定该项的值；当前值为 "现场 PLC 无对应寄存器,edge 会回 rejected"。 */
```

**源码第 30 行**

```text
  }
/* 注释：结束当前对象或数组；末尾逗号表示后面还有同级条目。 */
```

**源码第 31 行**

```text
}
/* 注释：结束当前对象或数组；末尾逗号表示后面还有同级条目。 */
```
