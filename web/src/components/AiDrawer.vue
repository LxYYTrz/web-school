<template>
  <el-drawer
    v-model="visible"
    direction="rtl"
    :size="440"
    append-to-body
    title="AI 产线助手"
  >
    <template #header>
      <div class="drawer-head">
        <span>AI 产线助手</span>
        <div class="head-tags">
          <el-tag v-if="status" size="small" effect="plain" :type="stateTagType">
            {{ statusText }}
          </el-tag>
          <el-tag size="small" effect="plain" :type="enabled ? 'success' : 'info'">
            {{ enabled ? 'AI 就绪' : 'AI 未配置' }}
          </el-tag>
        </div>
      </div>
    </template>

    <!--
      待确认建议:钉在对话上方而不是塞进气泡里。
      建议是经 socket 独立推来的(整条产线房间都能收到),和消息没有可靠的对应关系,
      强行挂到某条消息下会出现「建议出现在不相干的对话里」。
    -->
    <div v-if="proposals.length" class="proposals">
      <div class="section-title">待确认建议</div>
      <div v-for="p in proposals" :key="p.id" class="proposal">
        <div class="p-head">
          <el-tag size="small" type="warning" effect="dark">{{ typeText(p.type) }}</el-tag>
          <span class="p-target">{{ p.lineId }} / {{ p.deviceId }}</span>
        </div>
        <div class="p-reason">{{ p.reason || '(AI 未给出理由)' }}</div>
        <div v-if="p.result" class="p-result" :class="{ bad: p.resultOk === false }">
          {{ p.result }}
        </div>
        <div v-else class="p-actions">
          <!--
            按钮禁用只是体验层。后端 CommandGuard 会再挡一次 level<2,
            前端这层纯粹是不让无权的人白点一次。
          -->
          <el-button
            size="small"
            type="warning"
            :disabled="!auth.canCommand || busy"
            @click="confirm(p)"
          >
            {{ auth.canCommand ? '确认下发' : '需 L2 及以上' }}
          </el-button>
          <el-button size="small" text :disabled="busy" @click="dismiss(p)">
            忽略
          </el-button>
        </div>
      </div>
    </div>

    <div ref="scrollBox" class="messages">
      <el-empty v-if="!messages.length" description="问点产线的事" :image-size="60" />

      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
        <div class="bubble" :class="{ err: m.error }">
          <template v-if="m.text">{{ m.text }}</template>
          <span v-else-if="m.role === 'assistant' && streaming && i === messages.length - 1" class="dots">
            …
          </span>
        </div>
        <!-- 工具痕迹:让人知道结论是查出来的,不是编的 -->
        <div v-if="m.tools?.length" class="tools">
          <el-icon><Search /></el-icon>{{ m.tools.join(' · ') }}
        </div>
        <div v-if="m.error" class="err-line">{{ m.error }}</div>
      </div>
    </div>

    <template #footer>
      <div class="composer">
        <el-input
          v-model="draft"
          type="textarea"
          :rows="3"
          resize="none"
          placeholder="例如:现在产线什么状态?视觉不良率多少? / 诊断后需要停机就给建议"
          @keydown.enter.exact.prevent="send"
        />
        <el-button
          type="primary"
          :loading="streaming"
          :disabled="!draft.trim() || !enabled"
          @click="send"
        >
          发送
        </el-button>
      </div>
      <div class="disclaimer">
        AI 只做只读查询与建议,任何控制指令都必须你点确认后才会下发。
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth';
import { useLineData } from '../composables/useLineData';
import { stateText, stateTagType as tagOf } from '../services/lineState';
import { apiAiChat, apiAiStatus, apiConfirmAiProposal, onAiProposal } from '../services/ai';
import type { AiMessage, AiProposal } from '../services/types';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();
const visible = ref(props.modelValue);
watch(
  () => props.modelValue,
  (v) => (visible.value = v),
);
watch(visible, (v) => emit('update:modelValue', v));

const LINE_ID = 'line-01';
const auth = useAuthStore();
const { status } = useLineData(LINE_ID);

const enabled = ref(false);
const draft = ref('');
const streaming = ref(false);
const messages = ref<AiMessage[]>([]);
const scrollBox = ref<HTMLElement | null>(null);
const busy = ref(false);

// 建议卡片带一个本地结果字段(已下发/失败),不污染后端的 AiProposal 契约
interface ProposalCard extends AiProposal {
  result?: string;
  resultOk?: boolean;
}
const proposals = ref<ProposalCard[]>([]);

const statusText = ref('—');
const stateTagType = ref<'success' | 'info' | 'danger' | 'warning'>('info');
watch(
  status,
  (s) => {
    statusText.value = stateText(s?.state);
    stateTagType.value = tagOf(s?.state);
  },
  { immediate: true },
);

const TYPE_TEXT: Record<string, string> = {
  start: '启动产线',
  stop: '停止产线',
  mode_set: '切换手动模式',
  conveyor: '传送带控制',
};
function typeText(t: string) {
  return TYPE_TEXT[t] ?? t;
}

let offProposal: (() => void) | null = null;
let abort: AbortController | null = null;

onMounted(async () => {
  offProposal = onAiProposal((p) => {
    // 同一 id 只留一张卡(整条产线房间会各推一次)
    if (proposals.value.some((x) => x.id === p.id)) return;
    proposals.value.unshift(p);
  });
  try {
    const s = await apiAiStatus();
    enabled.value = s.enabled;
  } catch {
    enabled.value = false;
  }
});

onBeforeUnmount(() => {
  offProposal?.();
  abort?.abort();
});

function scrollDown() {
  nextTick(() => {
    if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight;
  });
}

async function send() {
  const text = draft.value.trim();
  if (!text || streaming.value) return;
  draft.value = '';
  messages.value.push({ role: 'user', text });
  const reply: AiMessage = { role: 'assistant', text: '', tools: [] };
  messages.value.push(reply);
  streaming.value = true;
  abort = new AbortController();
  scrollDown();

  try {
    await apiAiChat(LINE_ID, text, (e) => {
      if (e.type === 'delta' && e.text) {
        reply.text += e.text;
        scrollDown();
      } else if (e.type === 'tool' && e.name) {
        if (!reply.tools?.includes(e.name)) reply.tools?.push(e.name);
      } else if (e.type === 'error') {
        reply.error = e.message || 'AI 调用失败';
      }
    }, abort.signal);
  } catch (e) {
    // 用户中途关抽屉导致 abort,不算故障
    if (!/abort/i.test((e as Error).message)) {
      reply.error = (e as Error).message;
    }
  } finally {
    streaming.value = false;
    abort = null;
    if (!reply.text && !reply.error) reply.text = '(没有返回内容)';
    scrollDown();
  }
}

async function confirm(p: ProposalCard) {
  busy.value = true;
  try {
    const r = await apiConfirmAiProposal(p.id);
    p.result = r.ok ? `已下发,指令号 ${r.cmdId}` : r.error || '下发失败';
    p.resultOk = r.ok;
    if (r.ok) ElMessage.success('指令已下发');
    else ElMessage.error(p.result);
  } catch (e) {
    p.result = (e as Error).message;
    p.resultOk = false;
    ElMessage.error(p.result);
  } finally {
    busy.value = false;
  }
}

// 忽略只是从本地列表移除;后端那条提案仍在 Redis 里等 TTL 过期,
// 但它没有确认接口就永远不会执行 —— 没有「忽略」这个 API 是刻意的。
function dismiss(p: ProposalCard) {
  proposals.value = proposals.value.filter((x) => x.id !== p.id);
}
</script>

<style scoped>
.drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding-right: 32px;
}
.head-tags { display: flex; gap: 6px; }

.proposals {
  margin-bottom: 10px; padding-bottom: 10px;
  border-bottom: 1px dashed var(--panel-border);
}
.section-title { font-size: 11px; color: var(--text-dim); margin-bottom: 6px; }
.proposal {
  padding: 8px 10px; margin-bottom: 6px;
  background: rgba(245, 158, 11, 0.10);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 6px;
}
.p-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.p-target { font-size: 11px; color: var(--text-dim); font-variant-numeric: tabular-nums; }
.p-reason { font-size: 12px; color: var(--text); margin-bottom: 8px; white-space: pre-wrap; }
.p-actions { display: flex; gap: 8px; }
.p-result { font-size: 11px; }
.p-result:not(.bad) { color: var(--ok); }
.p-result.bad { color: var(--ng); }

.messages { flex: 1; overflow-y: auto; padding-right: 4px; }
.msg { margin-bottom: 12px; display: flex; flex-direction: column; }
.msg.user { align-items: flex-end; }
.bubble {
  max-width: 88%;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}
.msg.user .bubble { background: var(--accent); color: #0b1220; }
.bubble.err { border: 1px solid rgba(239, 68, 68, 0.4); }
.tools {
  display: flex; align-items: center; gap: 4px;
  margin-top: 4px; font-size: 10px; color: var(--text-dim);
}
.err-line { margin-top: 4px; font-size: 11px; color: var(--ng); }

.composer { display: flex; gap: 8px; align-items: flex-end; }
.disclaimer { margin-top: 6px; font-size: 10px; color: var(--text-dim); }
</style>
