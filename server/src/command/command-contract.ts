import contract from './command-contract.json';
// 从 ./command-contract.json 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

// 契约 v1.2 白名单(对齐 docs/contract/README.md §3.6,扩展项仅追加不删)
// 数据在 command-contract.json —— 后端与 AI 的只读 MCP server 共读同一份,
// 避免「AI 建议的白名单」与「真实下发的白名单」漂移。
// 注:reset / changeover / alarm_clear 在现场 PLC 无对应寄存器,
//     edge 会回 rejected;保留在白名单是为契约完整性,不等于可执行。
export const ALLOWED_TYPES = new Set<string>(contract.allowedTypes);
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量；new＝创建对象实例。

// 现场真有寄存器、能真正下发的指令。AI 提建议时应当只在这几个里选,
// 否则等于建议一个必然被 edge 拒掉的指令,浪费人的一次确认。
export const EXECUTABLE_TYPES = new Set<string>(contract.executableTypes);
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量；new＝创建对象实例。

// 各指令的 params 校验表(值域以现场 DB3-Modbus-映射表.xls 为准)
//   mode_set.params.action: 'acquire'(1) | 'release'(2)   ← PLC word 8,脉冲
//   conveyor.params.action: 'forward'(1) | 'stop'(0)       ← PLC word 10,电平
export const PARAM_ENUMS: Record<string, Record<string, number>> = contract.paramEnums;
// 导出这一行声明的符号，供项目其他模块使用。 关键字：export＝向其他模块开放符号；const＝声明不可重新绑定的变量。

export function validateParams(type: string, params: Record<string, unknown> | undefined):
// 定义函数 validateParams。 关键字：export＝向其他模块开放符号；function＝定义函数；unknown＝需检查后才能使用的类型；undefined＝未定义值。
  { ok: true } | { ok: false; error: string } {
  // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：true＝布尔真值；false＝布尔假值。
  const enumMap = PARAM_ENUMS[type];
  // 声明 enumMap，初始值由 PARAM_ENUMS[type] 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (!enumMap) return { ok: true };               // 无参数约束的指令
  // 判断 if (!enumMap) return { ok: true };               // 无参数约束的指令 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数；true＝布尔真值。
  const act = (params ?? {}).action;
  // 声明 act，初始值由 (params ?? {}).action 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (typeof act !== 'string' || !(act in enumMap)) {
  // 判断 if (typeof act !== 'string' || !(act in enumMap)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；typeof＝读取值的运行时类型；in＝遍历键或判断成员。
    return {
    // 返回 { 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
      ok: false,
      // 设置字段 ok。 关键字：false＝布尔假值。
      error: `${type}.params.action 必须是 ${Object.keys(enumMap).join('|')},收到 ${JSON.stringify(act)}`,
      // 设置字段 error。 关键字：type＝定义类型别名。
    };
    // 结束当前对象或代码块，并完成这条语句。
  }
  // 结束当前对象、函数或条件代码块。
  return { ok: true };
  // 返回 { ok: true } 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数；true＝布尔真值。
}
// 结束当前对象、函数或条件代码块。
