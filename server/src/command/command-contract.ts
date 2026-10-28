/**
 * 从同目录严格 JSON 控制契约导出白名单、现场可执行类型及参数枚举。
 * validateParams 按指令类型检查 params.action；无枚举约束的类型直接通过本层。
 * 类型在契约中存在与现场有对应写点是两种约束；调用方按用途分别选择 ALLOWED_TYPES、EXECUTABLE_TYPES。
 */
import contract from './command-contract.json';

// 契约 v1.2 白名单(对齐 docs/contract/README.md §3.6,扩展项仅追加不删)
// 数据在 command-contract.json —— 后端与 AI 的只读 MCP server 共读同一份,
// 避免「AI 建议的白名单」与「真实下发的白名单」漂移。
// 注:reset / changeover / alarm_clear 在现场 PLC 无对应寄存器,
//     edge 会回 rejected;保留在白名单是为契约完整性,不等于可执行。
export const ALLOWED_TYPES = new Set<string>(contract.allowedTypes);

// 现场真有寄存器、能真正下发的指令。AI 提建议时应当只在这几个里选,
// 否则等于建议一个必然被 edge 拒掉的指令,浪费人的一次确认。
export const EXECUTABLE_TYPES = new Set<string>(contract.executableTypes);

// 各指令的 params 校验表(值域以现场 DB3-Modbus-映射表.xls 为准)
//   mode_set.params.action: 'acquire'(1) | 'release'(2)   ← PLC word 8,脉冲
//   conveyor.params.action: 'forward'(1) | 'stop'(0)       ← PLC word 10,电平
export const PARAM_ENUMS: Record<string, Record<string, number>> = contract.paramEnums;

export function validateParams(type: string, params: Record<string, unknown> | undefined):
  { ok: true } | { ok: false; error: string } {
  const enumMap = PARAM_ENUMS[type];
  if (!enumMap) return { ok: true };               // 无参数约束的指令
  const act = (params ?? {}).action;
  if (typeof act !== 'string' || !(act in enumMap)) {
    return {
      ok: false,
      error: `${type}.params.action 必须是 ${Object.keys(enumMap).join('|')},收到 ${JSON.stringify(act)}`,
    };
  }
  return { ok: true };
}
