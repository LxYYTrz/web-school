// 这一段负责配置和实现 server/src/command/command-contract.ts 对应的项目模块，为后续代码提供当前文件的处理入口。
import contract from './command-contract.json';
// 从 ./command-contract.json 导入这一行列出的符号，供本文件调用。
// contract：从 ./command-contract.json 导入的对象，用于本文件的调用或类型约束

// 契约 v1.2 白名单(对齐 docs/contract/README.md §3.6,扩展项仅追加不删)
// 数据在 command-contract.json —— 后端与 AI 的只读 MCP server 共读同一份,
// 避免「AI 建议的白名单」与「真实下发的白名单」漂移。
// 注:reset / changeover / alarm_clear 在现场 PLC 无对应寄存器,
//     edge 会回 rejected;保留在白名单是为契约完整性,不等于可执行。
export const ALLOWED_TYPES = new Set<string>(contract.allowedTypes);
// 导出这一行声明的符号，供项目其他模块使用。
// ALLOWED_TYPES：从控制契约加载的合法指令类型集合；Set：JavaScript 不重复元素集合；contract：从 ./command-contract.json 导入的对象，用于本文件的调用或类型约束；allowedTypes：contract 对象上的字段或操作

// 现场真有寄存器、能真正下发的指令。AI 提建议时应当只在这几个里选,
// 否则等于建议一个必然被 edge 拒掉的指令,浪费人的一次确认。
export const EXECUTABLE_TYPES = new Set<string>(contract.executableTypes);
// 导出这一行声明的符号，供项目其他模块使用。
// EXECUTABLE_TYPES：控制契约中已有现场写点支持的指令类型集合；Set：JavaScript 不重复元素集合；contract：从 ./command-contract.json 导入的对象，用于本文件的调用或类型约束；executableTypes：contract 对象上的字段或操作

// 各指令的 params 校验表(值域以现场 DB3-Modbus-映射表.xls 为准)
//   mode_set.params.action: 'acquire'(1) | 'release'(2)   ← PLC word 8,脉冲
//   conveyor.params.action: 'forward'(1) | 'stop'(0)       ← PLC word 10,电平
export const PARAM_ENUMS: Record<string, Record<string, number>> = contract.paramEnums;
// 导出这一行声明的符号，供项目其他模块使用。
// PARAM_ENUMS：本处保存 contract.paramEnums 的结果，类型为 Record<string, Record<string, number>>；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容；contract：从 ./command-contract.json 导入的对象，用于本文件的调用或类型约束；paramEnums：contract 对象上的字段或操作

// 这一段定义 validateParams，用于按控制契约校验指令附加参数。
export function validateParams(type: string, params: Record<string, unknown> | undefined):
// 定义函数 validateParams。
// validateParams：按控制契约校验指令附加参数；type：当前报文、指令或对象的类别字段；params：指令附加参数对象；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容
  { ok: true } | { ok: false; error: string } {
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // ok：操作是否成功的布尔结果；error：失败原因或错误对象
  const enumMap = PARAM_ENUMS[type];
  // 根据 PARAM_ENUMS[type] 设置 enumMap，供当前流程后续使用。
  // enumMap：本处保存 PARAM_ENUMS[type] 的结果；PARAM_ENUMS：本处保存 contract.paramEnums 的结果，类型为 Record<string, Record<string, number>>；type：当前报文、指令或对象的类别字段
  if (!enumMap) return { ok: true };               // 无参数约束的指令
  // 检查(!enumMap) return { ok: true }; // 无参数约束的指令，按判断结果进入对应的处理分支。
  // enumMap：本处保存 PARAM_ENUMS[type] 的结果；ok：操作是否成功的布尔结果
  const act = (params ?? {}).action;
  // 根据 (params ?? {}).action 设置 act，供当前流程后续使用。
  // act：本处保存 (params ?? {}).action 的结果；params：指令附加参数对象；action：(params ?? {}) 对象上的字段或操作
  if (typeof act !== 'string' || !(act in enumMap)) {
  // 检查(typeof act !== 'string' || !(act in enumMap))，按判断结果进入对应的处理分支。
  // act：本处保存 (params ?? {}).action 的结果；enumMap：本处保存 PARAM_ENUMS[type] 的结果
    return {
    // 开始组装当前函数要返回的对象，下方逐项给出结果字段。
    // 下方各属性共同组成返回对象，调用方按字段名读取结果
      ok: false,
      // 声明或设置 ok，用于操作是否成功的布尔结果。
      // ok：操作是否成功的布尔结果
      error: `${type}.params.action 必须是 ${Object.keys(enumMap).join('|')},收到 ${JSON.stringify(act)}`,
      // 把对象编码为 JSON 文本。
      // error：失败原因或错误对象；type：当前报文、指令或对象的类别字段；Object：JavaScript 对象辅助 API；keys：取得字典或对象中的所有键；enumMap：本处保存 PARAM_ENUMS[type] 的结果；join：把 Socket.IO 客户端加入产线房间，或按分隔符连接数组，以接收对象为准；JSON：JavaScript 原生 JSON 编解码 API；stringify：把对象编码为 JSON 文本；act：本处保存 (params ?? {}).action 的结果
    };
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  return { ok: true };
  // 把{ ok: true }作为当前函数的结果返回。
  // ok：操作是否成功的布尔结果
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了配置和实现 server/src/command/command-contract.ts 对应的项目模块所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段提供了按控制契约校验指令附加参数的实现；实际结果由运行时输入和执行分支决定。
