<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
  <el-drawer v-model="visible" direction="rtl" :size="440" append-to-body title="AI 产线助手" >
  <!-- 渲染el-drawer 元素或组件。；设置 v-model=visible：设置该属性。 关键字：v-model＝让输入值和状态双向同步。；设置 direction=rtl：设置该属性。；设置 :size=440：设置组件尺寸。 关键字：:＝属性动态绑定的简写。；启用当前元素的 append-to-body 布尔属性。；设置 title=AI 产线助手：设置该属性。；结束当前元素的属性列表或自闭合标签。 -->
    <template #header>
    <!-- 渲染template 元素或组件。 关键字：#＝命名插槽的简写。 -->
      <div class="drawer-head">
      <!-- 渲染容器，应用 drawer-head 样式类。 -->
        <span>AI 产线助手</span>
        <!-- 渲染行内文字。 -->
        <div class="head-tags">
        <!-- 渲染容器，应用 head-tags 样式类。 -->
          <el-tag v-if="status" size="small" effect="plain" :type="stateTagType">
          <!-- 渲染状态标签，条件成立时显示（status）。 关键字：v-if＝条件为真时才渲染；:＝属性动态绑定的简写。 -->
            {{ statusText }}
            <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
          </el-tag>
          <!-- 结束 el-tag 元素及其中的内容。 -->
          <el-tag size="small" effect="plain" :type="enabled ? 'success' : 'info'">
          <!-- 渲染状态标签。 关键字：:＝属性动态绑定的简写。 -->
            {{ enabled ? 'AI 就绪' : 'AI 未配置' }}
            <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
          </el-tag>
          <!-- 结束 el-tag 元素及其中的内容。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
    </template>
    <!-- 结束当前模板或插槽内容。 -->

    <!--
      待确认建议:钉在对话上方而不是塞进气泡里。
      建议是经 socket 独立推来的(整条产线房间都能收到),和消息没有可靠的对应关系,
      强行挂到某条消息下会出现「建议出现在不相干的对话里」。
    -->
    <div v-if="proposals.length" class="proposals">
    <!-- 渲染容器，应用 proposals 样式类，条件成立时显示（proposals.length）。 关键字：v-if＝条件为真时才渲染。 -->
      <div class="section-title">待确认建议</div>
      <!-- 渲染容器，应用 section-title 样式类。 -->
      <div v-for="p in proposals" :key="p.id" class="proposal">
      <!-- 渲染容器，应用 proposal 样式类，按集合重复生成（p in proposals）。 关键字：v-for＝按集合重复渲染；:＝属性动态绑定的简写。 -->
        <div class="p-head">
        <!-- 渲染容器，应用 p-head 样式类。 -->
          <el-tag size="small" type="warning" effect="dark">{{ typeText(p.type) }}</el-tag>
          <!-- 渲染状态标签，其中显示 typeText(p.type) 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
          <span class="p-target">{{ p.lineId }} / {{ p.deviceId }}</span>
          <!-- 渲染行内文字，应用 p-target 样式类，其中显示 p.lineId 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <div class="p-reason">{{ p.reason || '(AI 未给出理由)' }}</div>
        <!-- 渲染容器，应用 p-reason 样式类，其中显示 p.reason || '(AI 未给出理由)' 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
        <div v-if="p.result" class="p-result" :class="{ bad: p.resultOk === false }">
        <!-- 渲染容器，应用 p-result 样式类，条件成立时显示（p.result）。 关键字：v-if＝条件为真时才渲染；:＝属性动态绑定的简写。 -->
          {{ p.result }}
          <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <div v-else class="p-actions">
        <!-- 渲染容器，应用 p-actions 样式类。 关键字：v-else＝前面条件不成立时渲染。 -->
          <!--
            按钮禁用只是体验层。后端 CommandGuard 会再挡一次 level<2,
            前端这层纯粹是不让无权的人白点一次。
          -->
          <el-button size="small" type="warning" :disabled="!auth.canCommand || busy" @click="confirm(p)" >
          <!-- 渲染操作按钮。；设置 size=small：设置组件尺寸。；设置 type=warning：选择组件外观或字段类型。；设置 :disabled=!auth.canCommand || busy：控制是否禁用。 关键字：:＝属性动态绑定的简写。；设置 @click=confirm(p)：设置该属性。 关键字：@＝事件监听的简写。；结束当前元素的属性列表或自闭合标签。 -->
            {{ auth.canCommand ? '确认下发' : '需 L2 及以上' }}
            <!-- 显示花括号中表达式的结果。 关键字：{{＝插入表达式计算后的文本。 -->
          </el-button>
          <!-- 结束 el-button 元素及其中的内容。 -->
          <el-button size="small" text :disabled="busy" @click="dismiss(p)">
          <!-- 渲染操作按钮。 关键字：:＝属性动态绑定的简写；@＝事件监听的简写。 -->
            忽略
            <!-- 启用当前元素的 忽略 布尔属性。 -->
          </el-button>
          <!-- 结束 el-button 元素及其中的内容。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->

    <div ref="scrollBox" class="messages">
    <!-- 渲染容器，应用 messages 样式类。 -->
      <el-empty v-if="!messages.length" description="问点产线的事" :image-size="60" />
      <!-- 渲染el-empty 元素或组件，条件成立时显示（!messages.length）。 关键字：v-if＝条件为真时才渲染；:＝属性动态绑定的简写。 -->

      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
      <!-- 渲染容器，应用 msg 样式类，按集合重复生成（(m, i) in messages）。 关键字：v-for＝按集合重复渲染；:＝属性动态绑定的简写。 -->
        <div class="bubble" :class="{ err: m.error }">
        <!-- 渲染容器，应用 bubble 样式类。 关键字：:＝属性动态绑定的简写。 -->
          <template v-if="m.text">{{ m.text }}</template>
          <!-- 渲染template 元素或组件，条件成立时显示（m.text），其中显示 m.text 的计算结果。 关键字：v-if＝条件为真时才渲染；{{＝插入表达式计算后的文本。 -->
          <span v-else-if="m.role === 'assistant' && streaming && i === messages.length - 1" class="dots">
          <!-- 渲染行内文字，应用 dots 样式类。 关键字：v-else-if＝前面条件不成立时再判断；v-else＝前面条件不成立时渲染。 -->
            …
            <!-- 显示该行文本内容或结束当前元素。 -->
          </span>
          <!-- 结束 span 元素及其中的内容。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- 工具痕迹:让人知道结论是查出来的,不是编的 -->
        <div v-if="m.tools?.length" class="tools">
        <!-- 渲染容器，应用 tools 样式类，条件成立时显示（m.tools?.length）。 关键字：v-if＝条件为真时才渲染。 -->
          <el-icon><Search /></el-icon>{{ m.tools.join(' · ') }}
          <!-- 渲染图标容器，其中显示 m.tools.join(' · ') 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <div v-if="m.error" class="err-line">{{ m.error }}</div>
        <!-- 渲染容器，应用 err-line 样式类，条件成立时显示（m.error），其中显示 m.error 的计算结果。 关键字：v-if＝条件为真时才渲染；{{＝插入表达式计算后的文本。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->

    <template #footer>
    <!-- 渲染template 元素或组件。 关键字：#＝命名插槽的简写。 -->
      <div class="composer">
      <!-- 渲染容器，应用 composer 样式类。 -->
        <el-input v-model="draft" type="textarea" :rows="3" resize="none" placeholder="例如:现在产线什么状态?不良率多少? / 诊断后需要停机就给建议" @keydown.enter.exact.prevent="send" />
        <!-- 渲染输入框。；设置 v-model=draft：设置该属性。 关键字：v-model＝让输入值和状态双向同步。；设置 type=textarea：选择组件外观或字段类型。；设置 :rows=3：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；设置 resize=none：设置该属性。；设置 placeholder=例如:现在产线什么状态?不良率多少? / 诊断后需要停机就给建议：设置该属性。；设置 @keydown.enter.exact.prevent=send：设置该属性。 关键字：@＝事件监听的简写。；结束当前元素的属性列表或自闭合标签。 -->
        <el-button type="primary" :loading="streaming" :disabled="!draft.trim() || !enabled" @click="send" >
        <!-- 渲染操作按钮。；设置 type=primary：选择组件外观或字段类型。；设置 :loading=streaming：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；设置 :disabled=!draft.trim() || !enabled：控制是否禁用。 关键字：:＝属性动态绑定的简写。；设置 @click=send：设置该属性。 关键字：@＝事件监听的简写。；结束当前元素的属性列表或自闭合标签。 -->
          发送
          <!-- 启用当前元素的 发送 布尔属性。 -->
        </el-button>
        <!-- 结束 el-button 元素及其中的内容。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <div class="disclaimer">
      <!-- 渲染容器，应用 disclaimer 样式类。 -->
        AI 只做只读查询与建议,任何控制指令都必须你点确认后才会下发。
        <!-- 显示该行文本内容或结束当前元素。 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
    </template>
    <!-- 结束当前模板或插槽内容。 -->
  </el-drawer>
  <!-- 结束 el-drawer 元素及其中的内容。 -->
</template>
<!-- 结束当前模板或插槽内容。 -->

<script setup lang="ts">
// 开始 Vue 组件的 TypeScript 逻辑区域。
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { Search } from '@element-plus/icons-vue';
// 从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { ElMessage } from 'element-plus';
// 从 element-plus 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useAuthStore } from '../stores/auth';
// 从 ../stores/auth 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useLineData } from '../composables/useLineData';
// 从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { stateText, stateTagType as tagOf } from '../services/lineState';
// 从 ../services/lineState 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { apiAiChat, apiAiStatus, apiConfirmAiProposal, onAiProposal } from '../services/ai';
// 从 ../services/ai 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { AiMessage, AiProposal } from '../services/types';
// 从 ../services/types 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

const props = defineProps<{ modelValue: boolean }>();
// 声明 props，初始值由 defineProps<{ modelValue: boolean }>() 计算得到。 关键字：const＝声明不可重新绑定的变量。
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();
// 声明 emit，初始值由 defineEmits<{ 'update:modelValue': [boolean] }>() 计算得到。 关键字：const＝声明不可重新绑定的变量。
const visible = ref(props.modelValue);
// 声明 visible，初始值由 ref(props.modelValue) 计算得到。 关键字：const＝声明不可重新绑定的变量。
watch(
// 调用 watch，把括号中的值作为参数传入。
  () => props.modelValue,
  // 开始当前表达式的分组或数组内容。
  (v) => (visible.value = v),
  // 开始当前表达式的分组或数组内容。
);
// 结束当前函数的参数列表并完成调用。
watch(visible, (v) => emit('update:modelValue', v));
// 调用 watch；括号中的表达式是传入的参数。

const LINE_ID = 'line-01';
// 声明 LINE_ID，初始值由 'line-01' 计算得到。 关键字：const＝声明不可重新绑定的变量。
const auth = useAuthStore();
// 声明 auth，初始值由 useAuthStore() 计算得到。 关键字：const＝声明不可重新绑定的变量。
const { status } = useLineData(LINE_ID);
// 从右侧结果中取出 status，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量。

const enabled = ref(false);
// 声明 enabled，初始值由 ref(false) 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。
const draft = ref('');
// 声明 draft，初始值由 ref('') 计算得到。 关键字：const＝声明不可重新绑定的变量。
const streaming = ref(false);
// 声明 streaming，初始值由 ref(false) 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。
const messages = ref<AiMessage[]>([]);
// 声明 messages，初始值由 ref<AiMessage[]>([]) 计算得到。 关键字：const＝声明不可重新绑定的变量。
const scrollBox = ref<HTMLElement | null>(null);
// 声明 scrollBox，初始值由 ref<HTMLElement | null>(null) 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
const busy = ref(false);
// 声明 busy，初始值由 ref(false) 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。

// 建议卡片带一个本地结果字段(已下发/失败),不污染后端的 AiProposal 契约
interface ProposalCard extends AiProposal {
// 声明 ProposalCard 的结构。 关键字：interface＝定义类型接口；extends＝继承父类。
  result?: string;
  // 声明 可选字段 result，类型为 string。
  resultOk?: boolean;
  // 声明 可选字段 resultOk，类型为 boolean。
}
// 结束当前对象、函数或条件代码块。
const proposals = ref<ProposalCard[]>([]);
// 声明 proposals，初始值由 ref<ProposalCard[]>([]) 计算得到。 关键字：const＝声明不可重新绑定的变量。

const statusText = ref('—');
// 声明 statusText，初始值由 ref('—') 计算得到。 关键字：const＝声明不可重新绑定的变量。
const stateTagType = ref<'success' | 'info' | 'danger' | 'warning'>('info');
// 声明 stateTagType，初始值由 ref<'success' | 'info' | 'danger' | 'warning'>('info') 计算得到。 关键字：const＝声明不可重新绑定的变量。
watch(
// 调用 watch，把括号中的值作为参数传入。
  status,
  // 把变量 status 作为同名对象字段加入当前对象。
  (s) => {
  // 开始当前表达式的分组或数组内容。
    statusText.value = stateText(s?.state);
    // 把右侧表达式的结果写入 statusText.value。
    stateTagType.value = tagOf(s?.state);
    // 把右侧表达式的结果写入 stateTagType.value。
  },
  // 结束当前对象或代码块，并完成这条语句。
  { immediate: true },
  // 开始对象字面量，并在这一行设置其中列出的字段。 关键字：true＝布尔真值。
);
// 结束当前函数的参数列表并完成调用。

const TYPE_TEXT: Record<string, string> = {
// 声明 TYPE_TEXT，初始值由 { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  start: '启动产线',
  // 设置字段 start。
  stop: '停止产线',
  // 设置字段 stop。
  mode_set: '切换手动模式',
  // 设置字段 mode_set。
  conveyor: '传送带控制',
  // 设置字段 conveyor。
};
// 结束当前对象或代码块，并完成这条语句。
function typeText(t: string) {
// 定义函数 typeText。 关键字：function＝定义函数。
  return TYPE_TEXT[t] ?? t;
  // 返回 TYPE_TEXT[t] ?? t 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

let offProposal: (() => void) | null = null;
// 声明 offProposal，初始值由 > void) | null = null 计算得到。 关键字：let＝声明可重新赋值的变量；void＝表示没有返回值；null＝空值。
let abort: AbortController | null = null;
// 声明 abort，初始值由 null 计算得到。 关键字：let＝声明可重新赋值的变量；null＝空值。

onMounted(async () => {
// 调用 onMounted；括号中的表达式是传入的参数。 关键字：async＝声明异步函数。
  offProposal = onAiProposal((p) => {
  // 把右侧表达式的结果写入 offProposal。
    // 同一 id 只留一张卡(整条产线房间会各推一次)
    if (proposals.value.some((x) => x.id === p.id)) return;
    // 判断 if (proposals.value.some((x) => x.id === p.id)) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
    proposals.value.unshift(p);
    // 调用 proposals.value.unshift，把括号中的值作为参数传入。
  });
  // 结束当前回调或对象，并完成外层函数调用。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    const s = await apiAiStatus();
    // 声明 s，初始值由 await apiAiStatus() 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    enabled.value = s.enabled;
    // 把右侧表达式的结果写入 enabled.value。
  } catch {
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    enabled.value = false;
    // 把右侧表达式的结果写入 enabled.value。 关键字：false＝布尔假值。
  }
  // 结束当前对象、函数或条件代码块。
});
// 结束当前回调或对象，并完成外层函数调用。

onBeforeUnmount(() => {
// 调用 onBeforeUnmount；括号中的表达式是传入的参数。
  offProposal?.();
  // 调用 .，把括号中的值作为参数传入。
  abort?.abort();
  // 调用 .abort，把括号中的值作为参数传入。
});
// 结束当前回调或对象，并完成外层函数调用。

function scrollDown() {
// 定义函数 scrollDown。 关键字：function＝定义函数。
  nextTick(() => {
  // 调用 nextTick；括号中的表达式是传入的参数。
    if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight;
    // 判断 if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
  });
  // 结束当前回调或对象，并完成外层函数调用。
}
// 结束当前对象、函数或条件代码块。

async function send() {
// 定义函数 send。 关键字：async＝声明异步函数；function＝定义函数。
  const text = draft.value.trim();
  // 声明 text，初始值由 draft.value.trim() 计算得到。 关键字：const＝声明不可重新绑定的变量。
  if (!text || streaming.value) return;
  // 判断 if (!text || streaming.value) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  draft.value = '';
  // 把右侧表达式的结果写入 draft.value。
  messages.value.push({ role: 'user', text });
  // 调用 messages.value.push，把括号中的值作为参数传入。
  const reply: AiMessage = { role: 'assistant', text: '', tools: [] };
  // 声明 reply，初始值由 { role: 'assistant', text: '', tools: [] } 计算得到。 关键字：const＝声明不可重新绑定的变量。
  messages.value.push(reply);
  // 调用 messages.value.push，把括号中的值作为参数传入。
  streaming.value = true;
  // 把右侧表达式的结果写入 streaming.value。 关键字：true＝布尔真值。
  abort = new AbortController();
  // 把右侧表达式的结果写入 abort。 关键字：new＝创建对象实例。
  scrollDown();
  // 调用 scrollDown；括号中的表达式是传入的参数。

  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    await apiAiChat(LINE_ID, text, (e) => {
    // 调用 apiAiChat，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
      if (e.type === 'delta' && e.text) {
      // 判断 if (e.type === 'delta' && e.text) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
        reply.text += e.text;
        // 把这次收到的增量文字追加到当前回复；+= 表示在原值后累加。
        scrollDown();
        // 调用 scrollDown；括号中的表达式是传入的参数。
      } else if (e.type === 'tool' && e.name) {
      // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
        if (!reply.tools?.includes(e.name)) reply.tools?.push(e.name);
        // 判断 if (!reply.tools?.includes(e.name)) reply.tools?.push(e.name); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      } else if (e.type === 'error') {
      // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
        reply.error = e.message || 'AI 调用失败';
        // 把右侧表达式的结果写入 reply.error。
      }
      // 结束当前对象、函数或条件代码块。
    }, abort.signal);
    // 结束当前对象、函数或条件代码块。
  } catch (e) {
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    // 用户中途关抽屉导致 abort,不算故障
    if (!/abort/i.test((e as Error).message)) {
    // 判断 if (!/abort/i.test((e as Error).message)) { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      reply.error = (e as Error).message;
      // 把右侧表达式的结果写入 reply.error。
    }
    // 结束当前对象、函数或条件代码块。
  } finally {
  // 开始收尾分支，无论前面的操作成功或失败都执行。 关键字：finally＝执行收尾逻辑。
    streaming.value = false;
    // 把右侧表达式的结果写入 streaming.value。 关键字：false＝布尔假值。
    abort = null;
    // 把右侧表达式的结果写入 abort。 关键字：null＝空值。
    if (!reply.text && !reply.error) reply.text = '(没有返回内容)';
    // 判断 if (!reply.text && !reply.error) reply.text = '(没有返回内容)'; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    scrollDown();
    // 调用 scrollDown；括号中的表达式是传入的参数。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。

async function confirm(p: ProposalCard) {
// 定义函数 confirm。 关键字：async＝声明异步函数；function＝定义函数。
  busy.value = true;
  // 把右侧表达式的结果写入 busy.value。 关键字：true＝布尔真值。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    const r = await apiConfirmAiProposal(p.id);
    // 声明 r，初始值由 await apiConfirmAiProposal(p.id) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    p.result = r.ok ? `已下发,指令号 ${r.cmdId}` : r.error || '下发失败';
    // 把右侧表达式的结果写入 p.result。
    p.resultOk = r.ok;
    // 把右侧表达式的结果写入 p.resultOk。
    if (r.ok) ElMessage.success('指令已下发');
    // 判断 if (r.ok) ElMessage.success('指令已下发'); 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
    else ElMessage.error(p.result);
    // 前一条件不成立时，改为执行这一分支。 关键字：else＝进入另一条件分支。
  } catch (e) {
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    p.result = (e as Error).message;
    // 把右侧表达式的结果写入 p.result。
    p.resultOk = false;
    // 把右侧表达式的结果写入 p.resultOk。 关键字：false＝布尔假值。
    ElMessage.error(p.result);
    // 调用 ElMessage.error，把括号中的值作为参数传入。
  } finally {
  // 开始收尾分支，无论前面的操作成功或失败都执行。 关键字：finally＝执行收尾逻辑。
    busy.value = false;
    // 把右侧表达式的结果写入 busy.value。 关键字：false＝布尔假值。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。

// 忽略只是从本地列表移除;后端那条提案仍在 Redis 里等 TTL 过期,
// 但它没有确认接口就永远不会执行 —— 没有「忽略」这个 API 是刻意的。
function dismiss(p: ProposalCard) {
// 定义函数 dismiss。 关键字：function＝定义函数。
  proposals.value = proposals.value.filter((x) => x.id !== p.id);
  // 把右侧表达式的结果写入 proposals.value。
}
// 结束当前对象、函数或条件代码块。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->

<style scoped>
/* 开始 Vue 组件的局部样式区域。 */
.drawer-head {
/* 对选择器 .drawer-head 匹配的元素应用后续声明。 */
  display: flex; align-items: center; justify-content: space-between;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；justify-content=space-between：控制主轴上的分布方式。 */
  width: 100%; padding-right: 32px;
  /* width=100%：设置宽度；padding-right=32px：设置该样式属性。 */
}
/* 结束样式块或续写样式声明。 */
.head-tags { display: flex; gap: 6px; }
/* display=flex：决定元素如何布局或显示；gap=6px：设置子元素间距。 */

.proposals {
/* 对选择器 .proposals 匹配的元素应用后续声明。 */
  margin-bottom: 10px; padding-bottom: 10px;
  /* margin-bottom=10px：设置该样式属性；padding-bottom=10px：设置该样式属性。 */
  border-bottom: 1px dashed var(--panel-border);
  /* border-bottom=1px dashed var(--panel-border)：设置该样式属性。 */
}
/* 结束样式块或续写样式声明。 */
.section-title { font-size: 11px; color: var(--text-dim); margin-bottom: 6px; }
/* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色；margin-bottom=6px：设置该样式属性。 */
.proposal {
/* 对选择器 .proposal 匹配的元素应用后续声明。 */
  padding: 8px 10px; margin-bottom: 6px;
  /* padding=8px 10px：设置内边距；margin-bottom=6px：设置该样式属性。 */
  background: rgba(245, 158, 11, 0.10);
  /* background=rgba(245, 158, 11, 0.10)：设置背景。 */
  border: 1px solid rgba(245, 158, 11, 0.35);
  /* border=1px solid rgba(245, 158, 11, 0.35)：设置边框。 */
  border-radius: 6px;
  /* border-radius=6px：设置圆角。 */
}
/* 结束样式块或续写样式声明。 */
.p-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
/* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=8px：设置子元素间距；margin-bottom=4px：设置该样式属性。 */
.p-target { font-size: 11px; color: var(--text-dim); font-variant-numeric: tabular-nums; }
/* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色；font-variant-numeric=tabular-nums：设置该样式属性。 */
.p-reason { font-size: 12px; color: var(--text); margin-bottom: 8px; white-space: pre-wrap; }
/* font-size=12px：设置字号；color=var(--text)：设置文字颜色；margin-bottom=8px：设置该样式属性；white-space=pre-wrap：设置该样式属性。 */
.p-actions { display: flex; gap: 8px; }
/* display=flex：决定元素如何布局或显示；gap=8px：设置子元素间距。 */
.p-result { font-size: 11px; }
/* font-size=11px：设置字号。 */
.p-result:not(.bad) { color: var(--ok); }
/* p-result=not(.bad) { color: var(--ok)：设置该样式属性。 */
.p-result.bad { color: var(--ng); }
/* color=var(--ng)：设置文字颜色。 */

.messages { flex: 1; overflow-y: auto; padding-right: 4px; }
/* flex=1：设置弹性项的伸缩比例；overflow-y=auto：设置该样式属性；padding-right=4px：设置该样式属性。 */
.msg { margin-bottom: 12px; display: flex; flex-direction: column; }
/* margin-bottom=12px：设置该样式属性；display=flex：决定元素如何布局或显示；flex-direction=column：设置该样式属性。 */
.msg.user { align-items: flex-end; }
/* align-items=flex-end：控制交叉轴上的对齐方式。 */
.bubble {
/* 对选择器 .bubble 匹配的元素应用后续声明。 */
  max-width: 88%;
  /* max-width=88%：限制最大宽度。 */
  padding: 8px 10px;
  /* padding=8px 10px：设置内边距。 */
  font-size: 13px;
  /* font-size=13px：设置字号。 */
  line-height: 1.6;
  /* line-height=1.6：设置行高。 */
  white-space: pre-wrap;
  /* white-space=pre-wrap：设置该样式属性。 */
  word-break: break-word;
  /* word-break=break-word：设置该样式属性。 */
  border-radius: 8px;
  /* border-radius=8px：设置圆角。 */
  background: rgba(255, 255, 255, 0.05);
  /* background=rgba(255, 255, 255, 0.05)：设置背景。 */
}
/* 结束样式块或续写样式声明。 */
.msg.user .bubble { background: var(--accent); color: #0b1220; }
/* background=var(--accent)：设置背景；color=#0b1220：设置文字颜色。 */
.bubble.err { border: 1px solid rgba(239, 68, 68, 0.4); }
/* border=1px solid rgba(239, 68, 68, 0.4)：设置边框。 */
.tools {
/* 对选择器 .tools 匹配的元素应用后续声明。 */
  display: flex; align-items: center; gap: 4px;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=4px：设置子元素间距。 */
  margin-top: 4px; font-size: 10px; color: var(--text-dim);
  /* margin-top=4px：设置该样式属性；font-size=10px：设置字号；color=var(--text-dim)：设置文字颜色。 */
}
/* 结束样式块或续写样式声明。 */
.err-line { margin-top: 4px; font-size: 11px; color: var(--ng); }
/* margin-top=4px：设置该样式属性；font-size=11px：设置字号；color=var(--ng)：设置文字颜色。 */

.composer { display: flex; gap: 8px; align-items: flex-end; }
/* display=flex：决定元素如何布局或显示；gap=8px：设置子元素间距；align-items=flex-end：控制交叉轴上的对齐方式。 */
.disclaimer { margin-top: 6px; font-size: 10px; color: var(--text-dim); }
/* margin-top=6px：设置该样式属性；font-size=10px：设置字号；color=var(--text-dim)：设置文字颜色。 */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
