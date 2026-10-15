<template>
  <div class="ctrl-btns">
    <div class="ctrl-title">控制</div>
    <div class="ctrl-row">
      <el-button size="small" type="success" :loading="state === 'sending'" @click="confirm('start')">启动</el-button>
      <el-button size="small" type="danger"  :loading="state === 'sending'" @click="confirm('stop')">停止</el-button>
      <el-button size="small"              :loading="state === 'sending'" @click="confirm('reset')">复位</el-button>
    </div>
    <div class="ctrl-row">
      <el-button size="small" type="warning" :loading="state === 'sending'" @click="confirm('alarm_clear')">清警</el-button>
      <el-dropdown trigger="click" @command="(m: string) => confirm('mode_set', { mode: m })">
        <el-button size="small" :loading="state === 'sending'">
          模式 ▾<el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="manual">手动</el-dropdown-item>
            <el-dropdown-item command="auto">自动</el-dropdown-item>
            <el-dropdown-item command="remote">远程</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 状态行:显示最近一次命令的状态与回执消息 -->
    <div v-if="state !== 'idle'" class="ctrl-state" :class="state">
      <span class="dot" />
      <span class="msg">{{ stateMsg }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { apiSendCommand, onCommandAck } from '../services/control';
import { useLineData } from '../composables/useLineData';
import type { CommandAck } from '../services/types';

const { robot } = useLineData();
const deviceId = computed(() => robot.value?.deviceId ?? 'robot-01');
const lineId = 'line-01';

type CmdType = 'start' | 'stop' | 'reset' | 'mode_set' | 'alarm_clear';
type State = 'idle' | 'sending' | 'sent' | 'acked' | 'rejected' | 'failed' | 'timeout';

const state = ref<State>('idle');
const stateMsg = ref('');
const currentCmdId = ref('');
const lastSentAt = ref(0);

const MOCK_ONLY = import.meta.env.VITE_MOCK_ONLY === 'true';

// 二次确认文案(type → 提示)
const CONFIRM_PROMPT: Record<CmdType, string> = {
  start:       '确认向机器人发送「启动」指令?这会让 PLC 真正动作。',
  stop:        '确认向机器人发送「停止」指令?这会中断当前作业。',
  reset:       '确认发送「复位」?用于报警/故障后的状态恢复。',
  alarm_clear: '确认「清警」?用于消警后恢复可运行状态。',
  mode_set:    '确认切换运行模式?',
};

let offAck: (() => void) | null = null;

onMounted(() => {
  offAck = onCommandAck((ack: CommandAck) => {
    if (ack.cmdId !== currentCmdId.value) return;
    if (ack.status === 'acked') {
      state.value = 'acked'; stateMsg.value = '已执行 ✓';
    } else if (ack.status === 'timeout') {
      state.value = 'timeout'; stateMsg.value = '超时(15s 无回执)';
    } else {
      state.value = 'rejected';
      stateMsg.value = `被拒:${ack.message || ack.status}`;
    }
    scheduleReset();
  });
});

onBeforeUnmount(() => { offAck?.(); });

// 收到 ack(或失败)→ 2.5s 后回 idle,让用户看到结果
let resetTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleReset() {
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    state.value = 'idle'; stateMsg.value = ''; currentCmdId.value = '';
  }, 2500);
}

async function confirm(type: CmdType, params?: Record<string, unknown>) {
  if (state.value !== 'idle') return;
  try {
    await ElMessageBox.confirm(CONFIRM_PROMPT[type], '下发控制指令', {
      confirmButtonText: '确认下发', cancelButtonText: '取消', type: 'warning',
    });
  } catch { return; /* 用户取消 */ }

  state.value = 'sending';
  stateMsg.value = '下发中…';
  try {
    const r = await apiSendCommand(lineId, { deviceId: deviceId.value, type, params });
    if (!r.ok || !r.cmdId) {
      state.value = 'failed';
      stateMsg.value = `服务端拒绝:${r.error || '未知错误'}`;
      scheduleReset();
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
        }
      }, 300);
    }
    // 15s 没收到 ack → 视为超时(契约 §5 第 4 条)
    setTimeout(() => {
      if (currentCmdId.value === r.cmdId && state.value === 'sent') {
        state.value = 'timeout';
        stateMsg.value = '超时(15s 无回执)';
        scheduleReset();
      }
    }, 15000);
  } catch (e) {
    state.value = 'failed';
    stateMsg.value = (e as Error).message || '下发失败';
    scheduleReset();
  }
}
</script>

<style scoped>
.ctrl-btns { display: flex; flex-direction: column; gap: 6px; }
.ctrl-title {
  font-size: 11px; color: var(--text-dim);
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 2px;
}
.ctrl-row { display: flex; gap: 6px; }

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