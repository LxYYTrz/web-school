<!--
  浏览器的控制按钮与本次命令等待状态，由 TwinView 提供当前产线、设备和工序信息。
  按动作可用性 → send 二次确认 → apiSendCommand → 保存 cmdId → 等待 onAck/15 秒计时 → scheduleReset 阅读。
  onAck 只匹配当前编号；超时不撤销 PLC 写入；显示“已执行”主要依据采集器正常写响应。
  前端动作限制改善交互，后端仍需检查权限、指令与参数。
-->
<template>
  <div class="ctrl-btns">
  <!-- 渲染容器，应用 ctrl-btns 样式类。 -->
    <div class="ctrl-title">控制</div>
    <!-- 渲染容器，应用 ctrl-title 样式类。 -->
    <div class="ctrl-row">
    <!-- 渲染容器，应用 ctrl-row 样式类。 -->
      <el-button size="small" type="success" :loading="state === 'sending'" :disabled="!can('start')" @click="confirm('start')">启动</el-button>
      <!-- 渲染操作按钮。；设置 :loading=state === ：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；渲染操作按钮。 关键字：@＝事件监听的简写。 -->
      <el-button size="small" type="danger" :loading="state === 'sending'" :disabled="!can('stop')" @click="confirm('stop')">停止</el-button>
      <!-- 渲染操作按钮。；设置 :loading=state === ：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；渲染操作按钮。 关键字：@＝事件监听的简写。 -->
    </div>
    <div class="ctrl-row">
    <!-- 渲染容器，应用 ctrl-row 样式类。 -->
      <!-- PLC word 8:1=获取手动 2=释放手动,PLC 切换完成后自动置 0。
           acquire 仅 stopped(101) 可用;release 仅 manual_mode(102) 可用 -->
      <el-dropdown trigger="click" :disabled="!can('mode_set', 'acquire') && !can('mode_set', 'release')" @command="(a: string) => confirm('mode_set', { action: a })">
      <!-- 渲染el-dropdown 元素或组件。；设置 :disabled=!can(：控制是否禁用。 关键字：:＝属性动态绑定的简写。；设置 @command=(a: string) => confirm(：设置该属性。 关键字：@＝事件监听的简写。 -->
        <el-button size="small" :loading="state === 'sending'" :disabled="!can('mode_set', 'acquire') && !can('mode_set', 'release')">
        <!-- 渲染操作按钮。 关键字：:＝属性动态绑定的简写。；设置 :disabled=!can(：控制是否禁用。 关键字：:＝属性动态绑定的简写。 -->
          手动模式 ▾<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          <!-- 在当前页面元素中直接显示文字「手动模式 ▾<el-icon class="el-icon—right"><ArrowDown /></el-icon>」。 -->
          <!-- 手动模式 ▾<el-icon class="el-icon—right"><ArrowDown /></el-icon> 是直接显示在当前界面元素中的文字内容 -->
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
          <!-- 渲染el-dropdown-menu 元素或组件。 -->
            <el-dropdown-item command="acquire" :disabled="!can('mode_set', 'acquire')">
            <!-- 渲染el-dropdown-item 元素或组件。 -->
              获取手动模式
              <!-- 在当前页面元素中直接显示文字「获取手动模式」。 -->
              <!-- 获取手动模式 是直接显示在当前界面元素中的文字内容 -->
            </el-dropdown-item>
            <el-dropdown-item command="release" :disabled="!can('mode_set', 'release')">
            <!-- 渲染el-dropdown-item 元素或组件。 -->
              释放手动模式
              <!-- 在当前页面元素中直接显示文字「释放手动模式」。 -->
              <!-- 释放手动模式 是直接显示在当前界面元素中的文字内容 -->
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- PLC word 10:1=正转 0=停止,电平型。仅「手动控制模式」下有效 -->
      <el-button size="small" type="warning" :loading="state === 'sending'" :disabled="!can('conveyor')" @click="confirm('conveyor', { action: conveyorOn ? 'stop' : 'forward' })">
      <!-- 渲染操作按钮。 关键字：:＝属性动态绑定的简写。；设置 :disabled=!can(：控制是否禁用。 关键字：:＝属性动态绑定的简写。；设置 @click=confirm(：设置该属性。 关键字：@＝事件监听的简写。 -->
        {{ conveyorOn ? '传送带停止' : '传送带正转' }}
      </el-button>
    </div>
    <!-- @deprecated 2026-10-16 暂停使用(现场无 PLC 寄存器,edge 默认就拒绝) -->
  <!--
    <div class="ctrl-row">
      <el-button size="small" disabled>复位</el-button>
      <el-button size="small" disabled>清警</el-button>
      <el-button size="small" disabled>换型</el-button>
      <span class="ctrl-note">复位/清警/换型:现场 PLC 未开放对应寄存器</span>
    </div>
  -->
    <!-- 不可用时说明原因:鼠标悬停即可看到,不靠猜 -->
    <div class="ctrl-reason">{{ gateHint }}</div>
    <!-- 渲染容器，应用 ctrl-reason 样式类，其中显示 gateHint 的计算结果。 -->

    <!-- 状态行:显示最近一次命令的状态与回执消息 -->
    <div v-if="state !== 'idle'" class="ctrl-state" :class="state">
    <!-- 渲染容器，应用 ctrl-state 样式类，条件成立时显示（state !== 'idle'）。 -->
      <span class="dot" />
      <!-- 渲染行内文字，应用 dot 样式类。 -->
      <span class="msg">{{ stateMsg }}</span>
      <!-- 渲染行内文字，应用 msg 样式类，其中显示 stateMsg 的计算结果。 -->
    </div>
  </div>
</template>

<!-- 这一段实现组件状态与事件处理，服务于按现场状态和用户权限展示控制按钮与指令回执。 -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { apiSendCommand, onCommandAck } from '../services/control';
import { useLineData } from '../composables/useLineData';
import type { CommandAck } from '../services/types';

const { robot, status } = useLineData();
// 取得按产线编码复用的数据单例，供多个页面共享状态。
const deviceId = computed(() => robot.value?.deviceId ?? 'robot-01');
const lineId = 'line-01';

type CmdType = 'start' | 'stop' | 'mode_set' | 'conveyor';
type State = 'idle' | 'sending' | 'sent' | 'acked' | 'rejected' | 'failed' | 'timeout';

const state = ref<State>('idle');
const stateMsg = ref('');
const currentCmdId = ref('');
const lastSentAt = ref(0);

const MOCK_ONLY = import.meta.env.VITE_MOCK_ONLY === 'true';

// 传送带是电平型:按钮显示的是「下次点击要执行的动作」,
// 因此取反显示。默认(未开)时显示"正转"。
const conveyorOn = ref(false);

// ---------- 前置条件(现场 PLC 联锁规则的镜像,2026-10-16 确认) ----------
//
//   stopped(101) ──[获取手动]──▶ manual_mode(102)
//        ▲                          │
//        └────[释放手动]─────────────┘   释放后 PLC 自动切回 stopped(101)
//
//   - 获取手动模式 仅 stopped(101) 可用
//   - 释放手动模式 仅 manual_mode(102) 可用
//   - 传送带       仅 manual_mode(102) 可用
//   - 启动         不可在 manual_mode(102) 下用(先释放手动);init_error 下不可用
//   - 停止         除 init_error 外均可用(任何状态都能停)
//   - init_error(100) 全部禁用 —— 只能由**产线物理按钮**解除,网页永远不提供
//
// 注意:这是 UI 层的拦截,PLC 侧联锁才有最终否决权。两边都要有,不能只靠前端。
const S_INIT_ERROR = 'init_error';
const S_STOPPED = 'stopped';
const S_MANUAL = 'manual_mode';

const lineState = computed(() => status.value?.state);
const initError = computed(() => lineState.value === S_INIT_ERROR);

// 按当前连接、用户控制级别、指令等待状态和工序判断某个按钮是否可用。
// 这是前端交互门槛，参数检查与权限仍会在后端重复验证。
function can(type: CmdType, action?: string): boolean {
// 定义 can，用于结合登录级别、连接和当前状态判断按钮是否可用。
  if (initError.value) return false;
  switch (type) {
  // 根据括号中的指令或状态值选择下面匹配的处理分支。
    case 'stop':
    // 当待判断的值等于 'stop' 时执行下面的对应分支。
    // 'stop' 是此分支匹配的指令或状态值，匹配后执行紧随其后的语句
      return true;
      // 布尔结果由当前函数的调用方用于决定是否允许继续执行
    case 'start':
    // 当待判断的值等于 'start' 时执行下面的对应分支。
    // 'start' 是此分支匹配的指令或状态值，匹配后执行紧随其后的语句
      // 手动模式里不让启动:必须先释放手动回到停止状态
      return lineState.value !== S_MANUAL;
    case 'mode_set':
    // 当待判断的值等于 'mode_set' 时执行下面的对应分支。
    // 'mode_set' 是此分支匹配的指令或状态值，匹配后执行紧随其后的语句
      return action === 'release' ? lineState.value === S_MANUAL
                                  : lineState.value === S_STOPPED;
    case 'conveyor':
    // 当待判断的值等于 'conveyor' 时执行下面的对应分支。
    // 'conveyor' 是此分支匹配的指令或状态值，匹配后执行紧随其后的语句
      return lineState.value === S_MANUAL;
    default:
    // 前面的分支条件都不匹配时执行默认处理。
    // 前面的 case 均不匹配时执行默认分支
      return false;
      // 布尔结果由当前函数的调用方用于决定是否允许继续执行
  }
}

/** 不满足前置条件时的一句话原因,给操作员看;都可用时返回空串 */
const gateHint = computed(() => {
  if (initError.value) {
    return '产线处于「初始化错误」:网页无法解除,请到产线现场按物理按钮复位。';
  }
  if (lineState.value === S_MANUAL) {
    return '手动控制模式:可用「传送带」与「释放手动模式」;释放后自动回到停止状态。';
  }
  if (lineState.value === S_STOPPED) {
    return '停止状态:可「获取手动模式」或「启动」。';
  }
  if (lineState.value === undefined) {
    return '尚未收到产线状态,指令暂不可用。';
  }
  return '';
});

/** 二次确认文案(type → 提示) */
const CONFIRM_PROMPT: Record<CmdType, string> = {
  start:    '确认向产线发送「启动」指令?\n这会让 PLC 真正动作,产线状态跳转到「等待入料」。',
  stop:     '确认向产线发送「停止」指令?\n这会中断当前作业并切换到停止状态。',
  mode_set: '确认切换手动模式?\nPLC 侧:写 1 = 获取手动,写 2 = 释放手动;PLC 切换完成后自行清零该位。',
  conveyor: '确认操作传送带?\nPLC 侧:写 1 = 正转,写 0 = 停止(电平型,持续有效)。',
};

let offAck: (() => void) | null = null;

// 组件挂载时注册命令回执监听，回调首先匹配 currentCmdId，只处理当前这次等待。
// acked、timeout 或拒绝等结果分别更新提示；这里的“已执行”文字依据业务回执，不证明物理动作完成。
onMounted(() => {

  // 收到 command_ack 时先比对 ack.cmdId 与 currentCmdId，只处理当前这次命令的结果。
  // acked、timeout 和拒绝等状态分别更新页面提示；“已执行”的文字依据采集器回执，实际含义主要是 Modbus 写入正常响应。
  // 不能仅凭这里的提示判断传送带已经转动或机器人已经完成某个物理动作。

  offAck = onCommandAck((ack: CommandAck) => {
    if (ack.cmdId !== currentCmdId.value) return;
    if (ack.status === 'acked') {
      state.value = 'acked'; stateMsg.value = '已执行 ✓';
      // 传送带是电平型,成功后同步按钮显示
      if (pendingType.value === 'conveyor') {
        conveyorOn.value = pendingAction.value === 'forward';
      }
    } else if (ack.status === 'timeout') {
      state.value = 'timeout'; stateMsg.value = '超时(15s 无回执)';
    } else {
      state.value = 'rejected';
      stateMsg.value = `被拒:${ack.message || ack.status}`;
    }
    scheduleReset();
    // 安排操作提示自动恢复为空闲状态。
  });
});

// 记录本次在途指令,供 ack 时判断是哪个按钮
const pendingType = ref<string>('');
const pendingAction = ref<string>('');

onBeforeUnmount(() => { offAck?.(); });

// 收到 ack(或失败)→ 2.5s 后回 idle,让用户看到结果
let resetTimer: ReturnType<typeof setTimeout> | null = null;

// 安排稍后把本次操作提示恢复为空闲，并清理当前等待编号。
// 这个 UI 定时器不发送停止或撤销指令；当前编号清空后，旧回执不会再匹配本次页面等待。
function scheduleReset() {
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    state.value = 'idle'; stateMsg.value = ''; currentCmdId.value = '';
  }, 2500);
}

// 发送前弹出二次确认框，用户取消时由调用路径结束本次提交。
// 确认文字取决于当前指令和参数，不是采集器已执行后的结果。
async function confirm(type: CmdType, params?: Record<string, unknown>) {
  if (state.value !== 'idle') return;
  // 双保险:按钮已按 can() 禁用,但点击瞬间产线状态可能刚变(比如别处刚发了指令),
  // 这里再挡一次,避免把明显违反联锁的指令发到 PLC。
  const action = (params ?? {}).action as string | undefined;
  if (!can(type, action)) {
    ElMessage.warning(`当前产线状态不允许该指令。${gateHint.value}`);
    // 记录本次异常或状态的警告日志。
    return;
  }
  try {
    await ElMessageBox.confirm(CONFIRM_PROMPT[type], '下发控制指令', {
    // 弹出确认对话框，取得用户对当前操作的选择。
      confirmButtonText: '确认下发', cancelButtonText: '取消', type: 'warning',
    });
  } catch { return; /* 用户取消 */ }

  pendingType.value = type;
  pendingAction.value = String((params ?? {}).action ?? '');
  state.value = 'sending';
  stateMsg.value = '下发中…';
  try {
    const r = await apiSendCommand(lineId, { deviceId: deviceId.value, type, params });
    if (!r.ok || !r.cmdId) {
      state.value = 'failed';
      stateMsg.value = `服务端拒绝:${r.error || '未知错误'}`;
      scheduleReset();
      // 安排操作提示自动恢复为空闲状态。
      return;
    }
    currentCmdId.value = r.cmdId;
    lastSentAt.value = Date.now();
    state.value = 'sent';
    stateMsg.value = `已发送(${r.cmdId.slice(0, 8)}…)`;
    // mock 演示模式:本地模拟 300ms 后 acked(无真 socket 推送)
    if (MOCK_ONLY) {
      setTimeout(() => {
        if (currentCmdId.value === r.cmdId) {
          state.value = 'acked';
          stateMsg.value = 'mock:已执行 ✓';
          scheduleReset();
          // 安排操作提示自动恢复为空闲状态。
        }
      }, 300);
    }
    // 15s 没收到 ack → 视为超时(契约 §5 第 4 条)

    // 网页从 HTTP 返回后等待当前 cmdId 的业务回执，15 秒后仍为 sent 就把本次等待显示为 timeout。
    // 判断同时核对编号，避免旧定时器误改新命令。这个计时器不撤销 PLC 写入，也不能证明现场根本没有处理。

    setTimeout(() => {
      if (currentCmdId.value === r.cmdId && state.value === 'sent') {
        state.value = 'timeout';
        stateMsg.value = '超时(15s 无回执)';
        scheduleReset();
        // 安排操作提示自动恢复为空闲状态。
      }
    }, 15000);
  } catch (e) {
    state.value = 'failed';
    stateMsg.value = (e as Error).message || '下发失败';
    scheduleReset();
    // 安排操作提示自动恢复为空闲状态。
  }
}
</script>

<!-- 这一段实现当前页面或组件的外观样式，服务于按现场状态和用户权限展示控制按钮与指令回执。 -->
<style scoped>
.ctrl-btns { display: flex; flex-direction: column; gap: 6px; }
/* 这一段为 .ctrl-title 对应的界面元素定义尺寸、布局或视觉样式。 */
.ctrl-title {
  font-size: 11px; color: var(--text-dim);
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 2px;
}
.ctrl-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.ctrl-note { font-size: 10px; color: var(--text-dim); opacity: 0.75; }

/* 这一段为 .ctrl-reason 对应的界面元素定义尺寸、布局或视觉样式。 */
.ctrl-reason {
  font-size: 11px; color: var(--text-dim); line-height: 1.5;
  padding: 4px 6px; border-radius: 4px;
  background: rgba(255,255,255,0.02);
}
.ctrl-reason:empty { display: none; }

/* 这一段为 .ctrl-state 对应的界面元素定义尺寸、布局或视觉样式。 */
.ctrl-state {
  margin-top: 6px; padding: 4px 6px;
  border-radius: 4px;
  display: flex; align-items: center; gap: 6px;
  font-size: 11px;
}
.ctrl-state .dot {
  width: 6px; height: 6px; border-radius: 50%;
}
.ctrl-state.sending { background: rgba(59,130,246,0.15); color: #93c5fd; }
.ctrl-state.sending .dot { background: #3b82f6; }
.ctrl-state.sent { background: rgba(245,158,11,0.12); color: #fcd34d; }
.ctrl-state.sent .dot { background: #f59e0b; }
.ctrl-state.acked { background: rgba(34,197,94,0.12); color: #86efac; }
.ctrl-state.acked .dot { background: #22c55e; }
.ctrl-state.rejected, .ctrl-state.failed, .ctrl-state.timeout {
  background: rgba(239,68,68,0.12); color: #fca5a5;
}
.ctrl-state.rejected .dot,
.ctrl-state.failed .dot,
.ctrl-state.timeout .dot { background: #ef4444; }
.ctrl-state .msg { font-variant-numeric: tabular-nums; }
</style>
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->