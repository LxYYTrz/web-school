<!--
  浏览器 AI 抽屉，显示对话、工具过程和待人工确认的控制建议。
  先看消息状态与事件处理，再看发送/取消聊天、接收 ai_proposal、确认建议及组件清理。
  文字通过 services/ai.ts 的 SSE 取得，建议由同文件 onAiProposal 封装的 Socket.IO 回调送达；确认之后才请求后端下发。
-->
<template>
  <el-drawer v-model="visible" direction="rtl" :size="440" append-to-body title="AI 产线助手" >
    <template #header>
      <div class="drawer-head">
      <!-- 渲染容器，应用 drawer-head 样式类。 -->
        <span>AI 产线助手</span>
        <div class="head-tags">
        <!-- 渲染容器，应用 head-tags 样式类。 -->
          <el-tag v-if="status" size="small" effect="plain" :type="stateTagType">
          <!-- 渲染状态标签，条件成立时显示（status）。 -->
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
    <!-- 渲染容器，应用 proposals 样式类，条件成立时显示（proposals.length）。 -->
      <div class="section-title">待确认建议</div>
      <!-- 渲染容器，应用 section-title 样式类。 -->
      <div v-for="p in proposals" :key="p.id" class="proposal">
      <!-- 渲染容器，应用 proposal 样式类，按集合重复生成（p in proposals）。 -->
        <div class="p-head">
        <!-- 渲染容器，应用 p-head 样式类。 -->
          <el-tag size="small" type="warning" effect="dark">{{ typeText(p.type) }}</el-tag>
          <!-- 渲染状态标签，其中显示 typeText(p.type) 的计算结果。 -->
          <span class="p-target">{{ p.lineId }} / {{ p.deviceId }}</span>
          <!-- 渲染行内文字，应用 p-target 样式类，其中显示 p.lineId 的计算结果。 -->
        </div>
        <div class="p-reason">{{ p.reason || '(AI 未给出理由)' }}</div>
        <!-- 渲染容器，应用 p-reason 样式类，其中显示 p.reason || '(AI 未给出理由)' 的计算结果。 -->
        <div v-if="p.result" class="p-result" :class="{ bad: p.resultOk === false }">
        <!-- 渲染容器，应用 p-result 样式类，条件成立时显示（p.result）。 -->
          {{ p.result }}
        </div>
        <div v-else class="p-actions">
        <!-- 渲染容器，应用 p-actions 样式类。 -->
          <!--
            按钮禁用只是体验层。后端 CommandGuard 会再挡一次 level<2,
            前端这层纯粹是不让无权的人白点一次。
          -->
          <el-button size="small" type="warning" :disabled="!auth.canCommand || busy" @click="confirm(p)" >
            {{ auth.canCommand ? '确认下发' : '需 L2 及以上' }}
          </el-button>
          <el-button size="small" text :disabled="busy" @click="dismiss(p)">
            忽略
            <!-- 在当前页面元素中直接显示文字「忽略」。 -->
            <!-- 忽略 是直接显示在当前界面元素中的文字内容 -->
          </el-button>
        </div>
      </div>
    </div>

    <div ref="scrollBox" class="messages">
    <!-- 渲染容器，应用 messages 样式类。 -->
      <el-empty v-if="!messages.length" description="问点产线的事" :image-size="60" />
      <!-- 渲染el-empty 元素或组件，条件成立时显示（!messages.length）。 -->

      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
      <!-- 渲染容器，应用 msg 样式类，按集合重复生成（(m, i) in messages）。 -->
        <div class="bubble" :class="{ err: m.error }">
        <!-- 渲染容器，应用 bubble 样式类。 -->
          <template v-if="m.text">{{ m.text }}</template>
          <span v-else-if="m.role === 'assistant' && streaming && i === messages.length - 1" class="dots">
          <!-- 渲染行内文字，应用 dots 样式类。 -->
            …
            <!-- 在当前页面元素中直接显示文字「…」。 -->
            <!-- … 是直接显示在当前界面元素中的文字内容 -->
          </span>
        </div>
        <!-- 工具痕迹:让人知道结论是查出来的,不是编的 -->
        <div v-if="m.tools?.length" class="tools">
        <!-- 渲染容器，应用 tools 样式类，条件成立时显示（m.tools?.length）。 -->
          <el-icon><Search /></el-icon>{{ m.tools.join(' · ') }}
          <!-- 渲染图标容器，其中显示 m.tools.join(' · ') 的计算结果。 -->
        </div>
        <div v-if="m.error" class="err-line">{{ m.error }}</div>
        <!-- 渲染容器，应用 err-line 样式类，条件成立时显示（m.error），其中显示 m.error 的计算结果。 -->
      </div>
    </div>

    <template #footer>
      <div class="composer">
      <!-- 渲染容器，应用 composer 样式类。 -->
        <el-input v-model="draft" type="textarea" :rows="3" resize="none" placeholder="例如:现在产线什么状态?不良率多少? / 诊断后需要停机就给建议" @keydown.enter.exact.prevent="send" />
        <el-button type="primary" :loading="streaming" :disabled="!draft.trim() || !enabled" @click="send" >
          发送
          <!-- 在当前页面元素中直接显示文字「发送」。 -->
          <!-- 发送 是直接显示在当前界面元素中的文字内容 -->
        </el-button>
      </div>
      <div class="disclaimer">
      <!-- 渲染容器，应用 disclaimer 样式类。 -->
        AI 只做只读查询与建议,任何控制指令都必须你点确认后才会下发。
        <!-- 在当前页面元素中直接显示文字「AI 只做只读查询与建议,任何控制指令都必须你点确认后才会下发。」。 -->
        <!-- AI 只做只读查询与建议,任何控制指令都必须你点确认后才会下发。 是直接显示在当前界面元素中的文字内容 -->
      </div>
    </template>
  </el-drawer>
</template>

<!-- 这一段实现组件状态与事件处理，服务于呈现 AI 对话、工具提示和待确认建议卡片。 -->
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
// 取得按产线编码复用的数据单例，供多个页面共享状态。

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
  // immediate 是 Vue watch 的选项，true 表示注册监听时立即执行一次回调
);

const TYPE_TEXT: Record<string, string> = {
  start: '启动产线',
  stop: '停止产线',
  mode_set: '切换手动模式',
  conveyor: '传送带控制',
};
function typeText(t: string) {
// 定义 typeText，用于把建议或指令类型转换为界面中文名称。
  return TYPE_TEXT[t] ?? t;
}

let offProposal: (() => void) | null = null;
let abort: AbortController | null = null;

// 抽屉组件挂载后注册建议事件回调，并请求后端 AI 可用配置。
// 按建议 id 过滤重复卡片只影响界面展示，不是按 cmdId 对 PLC 控制去重。
onMounted(async () => {
  offProposal = onAiProposal((p) => {
    // 同一 id 只留一张卡(整条产线房间会各推一次)
    if (proposals.value.some((x) => x.id === p.id)) return;
    proposals.value.unshift(p);
    // 把当前元素放到数组开头。
  });
  try {
    const s = await apiAiStatus();
    enabled.value = s.enabled;
  } catch {
    enabled.value = false;
  }
});

// 组件卸载时移除建议监听并取消尚在读取的聊天流，避免继续写入已卸载界面。
onBeforeUnmount(() => {
  offProposal?.();
  abort?.abort();
  // 取消关联的异步请求。
});

function scrollDown() {
  nextTick(() => {
    if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight;
  });
}

// 取得用户输入后创建一条用户消息和一条待填充回复，再调用 apiAiChat 接收文字与工具事件。
// reply 指向本次回复对象；delta 追加正文，tool 记录展示名称，错误和 finally 分支结束发送状态。
async function send() {
// 向连接对端发送本行构造的数据。
  const text = draft.value.trim();
  if (!text || streaming.value) return;
  draft.value = '';
  messages.value.push({ role: 'user', text });
  const reply: AiMessage = { role: 'assistant', text: '', tools: [] };
  messages.value.push(reply);
  streaming.value = true;
  abort = new AbortController();
  scrollDown();
  // 等待界面更新后滚动到最新聊天消息。

  try {
    await apiAiChat(LINE_ID, text, (e) => {
    // 发送 AI 对话请求并逐条消费 SSE 返回事件。
      if (e.type === 'delta' && e.text) {
        reply.text += e.text;
        scrollDown();
        // 等待界面更新后滚动到最新聊天消息。
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
    // 等待界面更新后滚动到最新聊天消息。
  }
}

// 对待确认卡片发送后端确认请求，保存接口返回的下发结果供卡片显示。
// p 是建议卡片，不是最终 control_commands 记录；实际命令由后端共用服务创建。
async function confirm(p: ProposalCard) {
// 弹出确认对话框，取得用户对当前操作的选择。
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

// 从当前抽屉列表移除建议卡片；是否仍能在后端领取取决于 Redis 建议状态和有效期。
function dismiss(p: ProposalCard) {
// 定义 dismiss，用于从前端列表移除当前建议卡片。
  proposals.value = proposals.value.filter((x) => x.id !== p.id);
}
</script>

<!-- 这一段实现当前页面或组件的外观样式，服务于呈现 AI 对话、工具提示和待确认建议卡片。 -->
<style scoped>
/* 这一段为 .drawer-head 对应的界面元素定义尺寸、布局或视觉样式。 */
.drawer-head {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding-right: 32px;
}
.head-tags { display: flex; gap: 6px; }

/* 这一段为 .proposals 对应的界面元素定义尺寸、布局或视觉样式。 */
.proposals {
  margin-bottom: 10px; padding-bottom: 10px;
  border-bottom: 1px dashed var(--panel-border);
}
.section-title { font-size: 11px; color: var(--text-dim); margin-bottom: 6px; }
/* 这一段为 .proposal 对应的界面元素定义尺寸、布局或视觉样式。 */
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
/* 这一段为 .bubble 对应的界面元素定义尺寸、布局或视觉样式。 */
.bubble {
  max-width: 88%;
  /* max-width=88%：限制最大宽度。 */
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
/* 这一段为 .tools 对应的界面元素定义尺寸、布局或视觉样式。 */
.tools {
  display: flex; align-items: center; gap: 4px;
  margin-top: 4px; font-size: 10px; color: var(--text-dim);
}
.err-line { margin-top: 4px; font-size: 11px; color: var(--ng); }

.composer { display: flex; gap: 8px; align-items: flex-end; }
.disclaimer { margin-top: 6px; font-size: 10px; color: var(--text-dim); }
</style>
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
