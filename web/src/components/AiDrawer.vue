<!-- 这一段负责呈现 AI 对话、工具提示和待确认建议卡片，为后续代码提供当前文件的处理入口。 -->
<!-- 这一段实现界面模板，服务于呈现 AI 对话、工具提示和待确认建议卡片。 -->
<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
<!-- template 是当前使用的界面元素或组件 -->
  <el-drawer v-model="visible" direction="rtl" :size="440" append-to-body title="AI 产线助手" >
  <!-- 在界面中配置 el-drawer 元素及其内容或事件绑定。 -->
  <!-- el-drawer 是当前使用的界面元素或组件；v-model 表示把输入内容与响应式变量双向同步，当前值为 visible；:size 表示把表达式结果动态绑定到组件属性，当前值为 440 -->
    <template #header>
    <!-- 渲染template 元素或组件。 -->
    <!-- template 是当前使用的界面元素或组件；#header 表示将此区域放入组件指定名称的插槽 -->
      <div class="drawer-head">
      <!-- 渲染容器，应用 drawer-head 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 drawer-head -->
        <span>AI 产线助手</span>
        <!-- 在界面中配置 span 元素及其内容或事件绑定。 -->
        <!-- span 是当前使用的界面元素或组件 -->
        <div class="head-tags">
        <!-- 渲染容器，应用 head-tags 样式类。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 head-tags -->
          <el-tag v-if="status" size="small" effect="plain" :type="stateTagType">
          <!-- 渲染状态标签，条件成立时显示（status）。 -->
          <!-- el-tag 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 status；size 表示组件尺寸，当前值为 small；effect 表示组件视觉风格，当前值为 plain；:type 表示把表达式结果动态绑定到组件属性，当前值为 stateTagType -->
            {{ statusText }}
            <!-- 把模板表达式计算出的实时状态显示在界面中。 -->
            <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
          </el-tag>
          <!-- 结束 el-tag 元素及其中的内容。 -->
          <!-- el-tag 是当前使用的界面元素或组件 -->
          <el-tag size="small" effect="plain" :type="enabled ? 'success' : 'info'">
          <!-- 在界面中配置 el-tag 元素及其内容或事件绑定。 -->
          <!-- el-tag 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；effect 表示组件视觉风格，当前值为 plain；:type 表示把表达式结果动态绑定到组件属性，当前值为 enabled ? 'success' : 'info' -->
            {{ enabled ? 'AI 就绪' : 'AI 未配置' }}
            <!-- 把模板表达式计算出的实时状态显示在界面中。 -->
            <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
          </el-tag>
          <!-- 结束 el-tag 元素及其中的内容。 -->
          <!-- el-tag 是当前使用的界面元素或组件 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
    </template>
    <!-- 结束 template 组件或元素对应的界面区域。 -->
    <!-- template 是当前使用的界面元素或组件 -->

    <!--
      待确认建议:钉在对话上方而不是塞进气泡里。
      建议是经 socket 独立推来的(整条产线房间都能收到),和消息没有可靠的对应关系,
      强行挂到某条消息下会出现「建议出现在不相干的对话里」。
    -->
    <div v-if="proposals.length" class="proposals">
    <!-- 渲染容器，应用 proposals 样式类，条件成立时显示（proposals.length）。 -->
    <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 proposals.length；class 表示应用的样式类，当前值为 proposals -->
      <div class="section-title">待确认建议</div>
      <!-- 渲染容器，应用 section-title 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 section-title -->
      <div v-for="p in proposals" :key="p.id" class="proposal">
      <!-- 渲染容器，应用 proposal 样式类，按集合重复生成（p in proposals）。 -->
      <!-- div 是当前使用的界面元素或组件；v-for 表示按数据列表重复生成元素，当前值为 p in proposals；:key 表示把表达式结果动态绑定到组件属性，当前值为 p.id；class 表示应用的样式类，当前值为 proposal -->
        <div class="p-head">
        <!-- 渲染容器，应用 p-head 样式类。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 p-head -->
          <el-tag size="small" type="warning" effect="dark">{{ typeText(p.type) }}</el-tag>
          <!-- 渲染状态标签，其中显示 typeText(p.type) 的计算结果。 -->
          <!-- el-tag 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；type 表示组件外观类型或输入控件类型，当前值为 warning；effect 表示组件视觉风格，当前值为 dark；双花括号把其中表达式的计算结果插入界面文字 -->
          <span class="p-target">{{ p.lineId }} / {{ p.deviceId }}</span>
          <!-- 渲染行内文字，应用 p-target 样式类，其中显示 p.lineId 的计算结果。 -->
          <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 p-target；双花括号把其中表达式的计算结果插入界面文字 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
        <div class="p-reason">{{ p.reason || '(AI 未给出理由)' }}</div>
        <!-- 渲染容器，应用 p-reason 样式类，其中显示 p.reason || '(AI 未给出理由)' 的计算结果。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 p-reason；双花括号把其中表达式的计算结果插入界面文字 -->
        <div v-if="p.result" class="p-result" :class="{ bad: p.resultOk === false }">
        <!-- 渲染容器，应用 p-result 样式类，条件成立时显示（p.result）。 -->
        <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 p.result；class 表示应用的样式类，当前值为 p-result；:class 表示把表达式结果动态绑定到组件属性，当前值为 { bad: p.resultOk === false } -->
          {{ p.result }}
          <!-- 把模板表达式计算出的实时状态显示在界面中。 -->
          <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
        <div v-else class="p-actions">
        <!-- 渲染容器，应用 p-actions 样式类。 -->
        <!-- div 是当前使用的界面元素或组件；v-else 表示前面条件都不成立时渲染；class 表示应用的样式类，当前值为 p-actions -->
          <!--
            按钮禁用只是体验层。后端 CommandGuard 会再挡一次 level<2,
            前端这层纯粹是不让无权的人白点一次。
          -->
          <el-button size="small" type="warning" :disabled="!auth.canCommand || busy" @click="confirm(p)" >
          <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
          <!-- el-button 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；type 表示组件外观类型或输入控件类型，当前值为 warning；:disabled 表示把表达式结果动态绑定到组件属性，当前值为 !auth.canCommand || busy；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 confirm(p) -->
            {{ auth.canCommand ? '确认下发' : '需 L2 及以上' }}
            <!-- 把模板表达式计算出的实时状态显示在界面中。 -->
            <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
          </el-button>
          <!-- 结束 el-button 元素及其中的内容。 -->
          <!-- el-button 是当前使用的界面元素或组件 -->
          <el-button size="small" text :disabled="busy" @click="dismiss(p)">
          <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
          <!-- el-button 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；:disabled 表示把表达式结果动态绑定到组件属性，当前值为 busy；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 dismiss(p) -->
            忽略
            <!-- 在当前页面元素中直接显示文字「忽略」。 -->
            <!-- 忽略 是直接显示在当前界面元素中的文字内容 -->
          </el-button>
          <!-- 结束 el-button 元素及其中的内容。 -->
          <!-- el-button 是当前使用的界面元素或组件 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->

    <div ref="scrollBox" class="messages">
    <!-- 渲染容器，应用 messages 样式类。 -->
    <!-- div 是当前使用的界面元素或组件；ref 表示保存 DOM 节点或组件实例引用，当前值为 scrollBox；class 表示应用的样式类，当前值为 messages -->
      <el-empty v-if="!messages.length" description="问点产线的事" :image-size="60" />
      <!-- 渲染el-empty 元素或组件，条件成立时显示（!messages.length）。 -->
      <!-- el-empty 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 !messages.length；:image-size 表示把表达式结果动态绑定到组件属性，当前值为 60 -->

      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
      <!-- 渲染容器，应用 msg 样式类，按集合重复生成（(m, i) in messages）。 -->
      <!-- div 是当前使用的界面元素或组件；v-for 表示按数据列表重复生成元素，当前值为 (m, i) in messages；:key 表示把表达式结果动态绑定到组件属性，当前值为 i；class 表示应用的样式类，当前值为 msg；:class 表示把表达式结果动态绑定到组件属性，当前值为 m.role -->
        <div class="bubble" :class="{ err: m.error }">
        <!-- 渲染容器，应用 bubble 样式类。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 bubble；:class 表示把表达式结果动态绑定到组件属性，当前值为 { err: m.error } -->
          <template v-if="m.text">{{ m.text }}</template>
          <!-- 渲染template 元素或组件，条件成立时显示（m.text），其中显示 m.text 的计算结果。 -->
          <!-- template 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 m.text；双花括号把其中表达式的计算结果插入界面文字 -->
          <span v-else-if="m.role === 'assistant' && streaming && i === messages.length - 1" class="dots">
          <!-- 渲染行内文字，应用 dots 样式类。 -->
          <!-- span 是当前使用的界面元素或组件；v-else-if 表示前一个条件不成立时继续判断是否渲染，当前值为 m.role === 'assistant' && streaming…；class 表示应用的样式类，当前值为 dots -->
            …
            <!-- 在当前页面元素中直接显示文字「…」。 -->
            <!-- … 是直接显示在当前界面元素中的文字内容 -->
          </span>
          <!-- 结束 span 元素及其中的内容。 -->
          <!-- span 是当前使用的界面元素或组件 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
        <!-- 工具痕迹:让人知道结论是查出来的,不是编的 -->
        <div v-if="m.tools?.length" class="tools">
        <!-- 渲染容器，应用 tools 样式类，条件成立时显示（m.tools?.length）。 -->
        <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 m.tools?.length；class 表示应用的样式类，当前值为 tools -->
          <el-icon><Search /></el-icon>{{ m.tools.join(' · ') }}
          <!-- 渲染图标容器，其中显示 m.tools.join(' · ') 的计算结果。 -->
          <!-- el-icon 是当前使用的界面元素或组件；双花括号把其中表达式的计算结果插入界面文字 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
        <div v-if="m.error" class="err-line">{{ m.error }}</div>
        <!-- 渲染容器，应用 err-line 样式类，条件成立时显示（m.error），其中显示 m.error 的计算结果。 -->
        <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 m.error；class 表示应用的样式类，当前值为 err-line；双花括号把其中表达式的计算结果插入界面文字 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->

    <template #footer>
    <!-- 渲染template 元素或组件。 -->
    <!-- template 是当前使用的界面元素或组件；#footer 表示将此区域放入组件指定名称的插槽 -->
      <div class="composer">
      <!-- 渲染容器，应用 composer 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 composer -->
        <el-input v-model="draft" type="textarea" :rows="3" resize="none" placeholder="例如:现在产线什么状态?不良率多少? / 诊断后需要停机就给建议" @keydown.enter.exact.prevent="send" />
        <!-- 在界面中配置 el-input 元素及其内容或事件绑定。 -->
        <!-- el-input 是当前使用的界面元素或组件；v-model 表示把输入内容与响应式变量双向同步，当前值为 draft；type 表示组件外观类型或输入控件类型，当前值为 textarea；:rows 表示把表达式结果动态绑定到组件属性，当前值为 3；@keydown.enter.exact.prevent 表示当前组件或 DOM 事件的处理函数绑定，当前值为 send -->
        <el-button type="primary" :loading="streaming" :disabled="!draft.trim() || !enabled" @click="send" >
        <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
        <!-- el-button 是当前使用的界面元素或组件；type 表示组件外观类型或输入控件类型，当前值为 primary；:loading 表示把表达式结果动态绑定到组件属性，当前值为 streaming；:disabled 表示把表达式结果动态绑定到组件属性，当前值为 !draft.trim() || !enabled；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 send -->
          发送
          <!-- 在当前页面元素中直接显示文字「发送」。 -->
          <!-- 发送 是直接显示在当前界面元素中的文字内容 -->
        </el-button>
        <!-- 结束 el-button 元素及其中的内容。 -->
        <!-- el-button 是当前使用的界面元素或组件 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
      <div class="disclaimer">
      <!-- 渲染容器，应用 disclaimer 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 disclaimer -->
        AI 只做只读查询与建议,任何控制指令都必须你点确认后才会下发。
        <!-- 在当前页面元素中直接显示文字「AI 只做只读查询与建议,任何控制指令都必须你点确认后才会下发。」。 -->
        <!-- AI 只做只读查询与建议,任何控制指令都必须你点确认后才会下发。 是直接显示在当前界面元素中的文字内容 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
    </template>
    <!-- 结束 template 组件或元素对应的界面区域。 -->
    <!-- template 是当前使用的界面元素或组件 -->
  </el-drawer>
  <!-- 结束 el-drawer 元素及其中的内容。 -->
  <!-- el-drawer 是当前使用的界面元素或组件 -->
</template>
<!-- 结束 template 组件或元素对应的界面区域。 -->
<!-- template 是当前使用的界面元素或组件 -->
<!-- 这一段完成了界面布局和数据展示的定义，供页面渲染时使用。 -->

<!-- 这一段实现组件状态与事件处理，服务于呈现 AI 对话、工具提示和待确认建议卡片。 -->
<script setup lang="ts">
// 开始当前 Vue 组件的脚本区域，定义页面状态与交互逻辑。
// script 是 Vue 组件逻辑区；setup 让顶层声明可直接用于模板；lang="ts" 指定使用 TypeScript
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。
// nextTick：Vue 等待本轮界面更新完成的函数；onBeforeUnmount：Vue 注册组件卸载前清理回调的函数；onMounted：Vue 注册组件挂载完成回调的函数；ref：Vue 创建可通过 .value 读写的响应式引用；watch：Vue 监听状态变化并执行回调的函数
import { Search } from '@element-plus/icons-vue';
// 从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。
// Search：从 @element-plus/icons-vue 导入的对象，用于本文件的调用或类型约束
import { ElMessage } from 'element-plus';
// 从 element-plus 导入这一行列出的符号，供本文件调用。
// ElMessage：Element Plus 的短消息提示 API
import { useAuthStore } from '../stores/auth';
// 从 ../stores/auth 导入这一行列出的符号，供本文件调用。
// useAuthStore：项目定义的登录状态仓库入口
import { useLineData } from '../composables/useLineData';
// 从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。
// useLineData：从 ../composables/useLineData 导入的对象，用于本文件的调用或类型约束
import { stateText, stateTagType as tagOf } from '../services/lineState';
// 从 ../services/lineState 导入这一行列出的符号，供本文件调用。
// stateText：从 ../services/lineState 导入的对象，用于本文件的调用或类型约束；stateTagType：把产线状态转换为 Element Plus 标签类型；tagOf：从 ../services/lineState 导入的对象，用于本文件的调用或类型约束
import { apiAiChat, apiAiStatus, apiConfirmAiProposal, onAiProposal } from '../services/ai';
// 从 ../services/ai 导入这一行列出的符号，供本文件调用。
// apiAiChat：从 ../services/ai 导入的对象，用于本文件的调用或类型约束；apiAiStatus：从 ../services/ai 导入的对象，用于本文件的调用或类型约束；apiConfirmAiProposal：从 ../services/ai 导入的对象，用于本文件的调用或类型约束；onAiProposal：从 ../services/ai 导入的对象，用于本文件的调用或类型约束
import type { AiMessage, AiProposal } from '../services/types';
// 从 ../services/types 导入这一行列出的符号，供本文件调用。
// AiMessage：前端聊天消息结构，记录角色、正文、工具提示和建议卡片；AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令

const props = defineProps<{ modelValue: boolean }>();
// 根据 defineProps<{ modelValue: boolean }>() 设置 props，供当前流程后续使用。
// props：本处保存 defineProps<{ modelValue: boolean }>() 的结果；defineProps：本处保存的局部数据，类型为 _defineProps；modelValue：本处声明的字段或类型，类型为 boolean
const emit = defineEmits<{ 'update:modelValue': [boolean] }>();
// 根据 defineEmits<{ 'update:modelValue': [boolean] }>() 设置 emit，供当前流程后续使用。
// emit：本处保存 defineEmits<{ 'update:modelValue': [boolean] }>() 的结果；defineEmits：本处保存的局部数据，类型为 _defineEmits
const visible = ref(props.modelValue);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 visible。
// visible：本处保存 ref(props.modelValue) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用；props：本处保存 defineProps<{ modelValue: boolean }>() 的结果；modelValue：本处声明的字段或类型，类型为 boolean
watch(
// 创建或使用Vue 监听状态变化并执行回调的函数。
// watch：Vue 监听状态变化并执行回调的函数
  () => props.modelValue,
  // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
  // props：本处保存 defineProps<{ modelValue: boolean }>() 的结果；modelValue：本处声明的字段或类型，类型为 boolean
  (v) => (visible.value = v),
  // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
  // v：当前方法接收的参数；visible：本处保存 ref(props.modelValue) 的结果；value：当前字段或点位的实际取值
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
watch(visible, (v) => emit('update:modelValue', v));
// 创建或使用Vue 监听状态变化并执行回调的函数。
// watch：Vue 监听状态变化并执行回调的函数；visible：本处保存 ref(props.modelValue) 的结果；v：当前方法接收的参数；emit：向 Socket.IO 连接或房间发送事件

const LINE_ID = 'line-01';
// 根据 'line-01' 设置 LINE_ID，供当前流程后续使用。
// LINE_ID：本处保存 'line-01' 的结果
const auth = useAuthStore();
// 创建或使用项目定义的登录状态仓库入口，将结果保存或写入 auth。
// auth：Pinia 登录状态仓库实例；useAuthStore：项目定义的登录状态仓库入口
const { status } = useLineData(LINE_ID);
// 取得按产线编码复用的数据单例，供多个页面共享状态。
// status：当前连接、产线、请求或指令的状态字段；useLineData：从 ../composables/useLineData 导入的对象，用于本文件的调用或类型约束；LINE_ID：本处保存 'line-01' 的结果

const enabled = ref(false);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 enabled。
// enabled：本处保存 ref(false) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
const draft = ref('');
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 draft。
// draft：本处保存 ref('') 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
const streaming = ref(false);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 streaming。
// streaming：本处保存 ref(false) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
const messages = ref<AiMessage[]>([]);
// 根据 ref<AiMessage[]>([]) 设置 messages，供当前流程后续使用。
// messages：本处保存 ref<AiMessage[]>([]) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用；AiMessage：前端聊天消息结构，记录角色、正文、工具提示和建议卡片
const scrollBox = ref<HTMLElement | null>(null);
// 根据 ref<HTMLElement | null>(null) 设置 scrollBox，供当前流程后续使用。
// scrollBox：本处保存 ref<HTMLElement | null>(null) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用；HTMLElement：本处保存的局部数据，类型为 { prototype: HTMLElement; new(): HTMLElement; }
const busy = ref(false);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 busy。
// busy：当前操作尚未结束的状态标记；ref：Vue 创建可通过 .value 读写的响应式引用

// 建议卡片带一个本地结果字段(已下发/失败),不污染后端的 AiProposal 契约
// 这一段声明 ProposalCard，用于呈现 AI 对话、工具提示和待确认建议卡片。
interface ProposalCard extends AiProposal {
// 定义 ProposalCard，约束或实现本模块涉及的数据和行为。
// AiProposal：项目定义的 AI 待确认控制建议结构，尚未等同于已执行指令
  result?: string;
  // 声明或设置 result，用于当前对象或接口的对应数据。
  // result：本处声明的字段或类型，类型为 string
  resultOk?: boolean;
  // 声明或设置 resultOk，用于当前对象或接口的对应数据。
  // resultOk：本处声明的字段或类型，类型为 boolean
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义了 ProposalCard 的字段或服务能力，供项目其他模块使用。
const proposals = ref<ProposalCard[]>([]);
// 根据 ref<ProposalCard[]>([]) 设置 proposals，供当前流程后续使用。
// proposals：本处保存 ref<ProposalCard[]>([]) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用

const statusText = ref('—');
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 statusText。
// statusText：本处保存 ref('—') 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
const stateTagType = ref<'success' | 'info' | 'danger' | 'warning'>('info');
// 根据 ref<'success' | 'info' | 'danger' | 'warning'>('info') 设置 stateTagType，供当前流程后续使用。
// stateTagType：把产线状态转换为 Element Plus 标签类型；ref：Vue 创建可通过 .value 读写的响应式引用
watch(
// 创建或使用Vue 监听状态变化并执行回调的函数。
// watch：Vue 监听状态变化并执行回调的函数
  status,
  // 把变量 status 作为同名对象字段加入当前对象。
  // status：当前连接、产线、请求或指令的状态字段
  (s) => {
  // 开始当前表达式的分组或数组内容，供当前处理流程继续使用。
  // s：当前方法接收的参数
    statusText.value = stateText(s?.state);
    // 把右侧表达式的结果写入 statusText.value。
    // statusText：本处保存 ref('—') 的结果；value：当前字段或点位的实际取值；stateText：从 ../services/lineState 导入的对象，用于本文件的调用或类型约束；s：当前方法接收的参数；state：当前状态值或实时状态服务实例，以所在对象为准
    stateTagType.value = tagOf(s?.state);
    // 把右侧表达式的结果写入 stateTagType.value。
    // stateTagType：把产线状态转换为 Element Plus 标签类型；value：当前字段或点位的实际取值；tagOf：从 ../services/lineState 导入的对象，用于本文件的调用或类型约束；s：当前方法接收的参数；state：当前状态值或实时状态服务实例，以所在对象为准
  },
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  { immediate: true },
  // 开始对象字面量，并在这一行设置其中列出的字段。
  // immediate 是 Vue watch 的选项，true 表示注册监听时立即执行一次回调
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

const TYPE_TEXT: Record<string, string> = {
// 声明 TYPE_TEXT，初始值由 { 计算得到，供当前处理流程继续使用。
// TYPE_TEXT：本处保存 { start: '启动产线', stop: '停止产线', mode_set: '切换手动模式', conveyor:… 的结果，类型为 Record<string, string>；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容
  start: '启动产线',
  // 声明或设置 start，用于当前对象或接口的对应数据。
  // start：启动 Three.js 的连续渲染循环
  stop: '停止产线',
  // 声明或设置 stop，用于当前对象或接口的对应数据。
  // stop 是当前映射表的查找键；「停止产线」是使用该键时得到的文字或分类值
  mode_set: '切换手动模式',
  // 声明或设置 mode_set，用于当前对象或接口的对应数据。
  // mode_set 是当前映射表的查找键；「切换手动模式」是使用该键时得到的文字或分类值
  conveyor: '传送带控制',
  // 声明或设置 conveyor，用于当前对象或接口的对应数据。
  // conveyor 是当前映射表的查找键；「传送带控制」是使用该键时得到的文字或分类值
};
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义 typeText，用于把建议或指令类型转换为界面中文名称。
function typeText(t: string) {
// 定义 typeText，用于把建议或指令类型转换为界面中文名称。
// typeText：把建议或指令类型转换为界面中文名称；t：当前方法接收的参数，类型为 string
  return TYPE_TEXT[t] ?? t;
  // 把TYPE_TEXT[t] ?? t作为当前函数的结果返回。
  // TYPE_TEXT：本处保存 { start: '启动产线', stop: '停止产线', mode_set: '切换手动模式', conveyor:… 的结果，类型为 Record<string, string>；t：当前方法接收的参数，类型为 string
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了把建议或指令类型转换为界面中文名称的实现；实际结果由运行时输入和执行分支决定。

let offProposal: (() => void) | null = null;
// 声明 offProposal，初始值由 > void) | null = null 计算得到，供当前处理流程继续使用。
// offProposal：本处保存 null 的结果，类型为 (() => void) | null
let abort: AbortController | null = null;
// 声明 abort，初始值由 null 计算得到，供当前处理流程继续使用。
// abort：当前对话请求的取消控制器引用；AbortController：浏览器或 Node.js 提供的异步请求取消控制器

onMounted(async () => {
// 创建或使用Vue 注册组件挂载完成回调的函数。
// onMounted：Vue 注册组件挂载完成回调的函数
  offProposal = onAiProposal((p) => {
  // 把右侧表达式的结果写入 offProposal。
  // offProposal：本处保存 null 的结果，类型为 (() => void) | null；onAiProposal：从 ../services/ai 导入的对象，用于本文件的调用或类型约束；p：当前方法接收的参数
    // 同一 id 只留一张卡(整条产线房间会各推一次)
    if (proposals.value.some((x) => x.id === p.id)) return;
    // 检查(proposals.value.some((x) => x.id === p.id)) return;，按判断结果进入对应的处理分支。
    // proposals：本处保存 ref<ProposalCard[]>([]) 的结果；value：当前字段或点位的实际取值；some：检查集合是否至少有一个元素满足条件；x：当前方法接收的参数；id：当前记录或对象的标识；p：当前方法接收的参数
    proposals.value.unshift(p);
    // 把当前元素放到数组开头。
    // proposals：本处保存 ref<ProposalCard[]>([]) 的结果；value：当前字段或点位的实际取值；unshift：本处声明的字段或类型，类型为 number；p：当前方法接收的参数
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    const s = await apiAiStatus();
    // 查询后端 AI 服务是否可用，将结果保存或写入 s。
    // s：本处保存 await apiAiStatus() 的结果；apiAiStatus：从 ../services/ai 导入的对象，用于本文件的调用或类型约束
    enabled.value = s.enabled;
    // 把右侧表达式的结果写入 enabled.value。
    // enabled：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值；s：本处保存 await apiAiStatus() 的结果
  } catch {
  // 开始异常处理分支，接收前面代码抛出的错误。
  // 本行完成上面一层已说明的函数、分支或对象配置
    enabled.value = false;
    // 把右侧表达式的结果写入 enabled.value。
    // enabled：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

onBeforeUnmount(() => {
// 创建或使用Vue 注册组件卸载前清理回调的函数。
// onBeforeUnmount：Vue 注册组件卸载前清理回调的函数
  offProposal?.();
  // 调用 .，把括号中的值作为参数传入，供当前处理流程继续使用。
  // offProposal：本处保存 null 的结果，类型为 (() => void) | null
  abort?.abort();
  // 取消关联的异步请求。
  // abort：当前对话请求的取消控制器引用
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

// 这一段定义 scrollDown，用于等待界面更新后滚动到最新聊天消息。
function scrollDown() {
// 定义函数 scrollDown。
// scrollDown：等待界面更新后滚动到最新聊天消息
  nextTick(() => {
  // 创建或使用Vue 等待本轮界面更新完成的函数。
  // nextTick：Vue 等待本轮界面更新完成的函数
    if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight;
    // 检查(scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight;，按判断结果进入对应的处理分支。
    // scrollBox：本处保存 ref<HTMLElement | null>(null) 的结果；value：当前字段或点位的实际取值；scrollTop：本处声明的字段或类型，类型为 number；scrollHeight：本处声明的字段或类型，类型为 number
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了等待界面更新后滚动到最新聊天消息的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 send，用于提交当前聊天内容并把流式回复逐步写入对话列表。
async function send() {
// 向连接对端发送本行构造的数据。
// send：提交当前聊天内容并把流式回复逐步写入对话列表
  const text = draft.value.trim();
  // 移除字符串两端空白，将结果保存或写入 text。
  // text：聊天正文、文本片段或界面展示文字；draft：本处保存 ref('') 的结果；value：当前字段或点位的实际取值；trim：移除字符串两端空白
  if (!text || streaming.value) return;
  // 检查(!text || streaming.value) return;，按判断结果进入对应的处理分支。
  // text：聊天正文、文本片段或界面展示文字；streaming：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
  draft.value = '';
  // 把右侧表达式的结果写入 draft.value。
  // draft：本处保存 ref('') 的结果；value：当前字段或点位的实际取值
  messages.value.push({ role: 'user', text });
  // 向数组末尾追加元素。
  // messages：本处保存 ref<AiMessage[]>([]) 的结果；value：当前字段或点位的实际取值；push：向数组末尾追加元素；text：聊天正文、文本片段或界面展示文字
  const reply: AiMessage = { role: 'assistant', text: '', tools: [] };
  // 声明 reply，初始值由 { role: 'assistant', text: '', tools: [] } 计算得到，供当前处理流程继续使用。
  // reply：正在接收流式内容的助手消息对象；AiMessage：前端聊天消息结构，记录角色、正文、工具提示和建议卡片；text：聊天正文、文本片段或界面展示文字；tools：当前回答涉及的工具名称列表
  messages.value.push(reply);
  // 向数组末尾追加元素。
  // messages：本处保存 ref<AiMessage[]>([]) 的结果；value：当前字段或点位的实际取值；push：向数组末尾追加元素；reply：正在接收流式内容的助手消息对象
  streaming.value = true;
  // 把右侧表达式的结果写入 streaming.value。
  // streaming：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
  abort = new AbortController();
  // 把右侧表达式的结果写入 abort。
  // abort：当前对话请求的取消控制器引用；AbortController：浏览器或 Node.js 提供的异步请求取消控制器
  scrollDown();
  // 等待界面更新后滚动到最新聊天消息。
  // scrollDown：等待界面更新后滚动到最新聊天消息

  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    await apiAiChat(LINE_ID, text, (e) => {
    // 发送 AI 对话请求并逐条消费 SSE 返回事件。
    // apiAiChat：从 ../services/ai 导入的对象，用于本文件的调用或类型约束；LINE_ID：本处保存 'line-01' 的结果；text：聊天正文、文本片段或界面展示文字；e：当前方法接收的参数
      if (e.type === 'delta' && e.text) {
      // 检查(e.type === 'delta' && e.text)，按判断结果进入对应的处理分支。
      // e：当前方法接收的参数；type：当前报文、指令或对象的类别字段；text：聊天正文、文本片段或界面展示文字
        reply.text += e.text;
        // 根据 e.text 设置 reply.text，供当前流程后续使用。
        // reply：正在接收流式内容的助手消息对象；text：聊天正文、文本片段或界面展示文字；e：当前方法接收的参数
        scrollDown();
        // 等待界面更新后滚动到最新聊天消息。
        // scrollDown：等待界面更新后滚动到最新聊天消息
      } else if (e.type === 'tool' && e.name) {
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // e：当前方法接收的参数；type：当前报文、指令或对象的类别字段；name：当前对象的名称字段
        if (!reply.tools?.includes(e.name)) reply.tools?.push(e.name);
        // 检查(!reply.tools?.includes(e.name)) reply.tools?.push(e.name);，按判断结果进入对应的处理分支。
        // reply：正在接收流式内容的助手消息对象；tools：当前回答涉及的工具名称列表；includes：判断数组或字符串是否包含指定内容；e：当前方法接收的参数；name：当前对象的名称字段；push：向数组末尾追加元素
      } else if (e.type === 'error') {
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // e：当前方法接收的参数；type：当前报文、指令或对象的类别字段
        reply.error = e.message || 'AI 调用失败';
        // 把右侧表达式的结果写入 reply.error。
        // reply：正在接收流式内容的助手消息对象；error：失败原因或错误对象；e：当前方法接收的参数；message：消息正文或用于展示的结果说明
      }
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }, abort.signal);
    // 结束当前对象、函数或条件代码块，供当前处理流程继续使用。
    // abort：当前对话请求的取消控制器引用；signal：用于取消异步请求的 AbortSignal 或当前点位配置，以本处定义为准
  } catch (e) {
  // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
  // e：本处保存的局部数据
    // 用户中途关抽屉导致 abort,不算故障
    if (!/abort/i.test((e as Error).message)) {
    // 检查(!/abort/i.test((e as Error).message))，按判断结果进入对应的处理分支。
    // test：本处声明的字段或类型，类型为 boolean；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
      reply.error = (e as Error).message;
      // 把右侧表达式的结果写入 reply.error。
      // reply：正在接收流式内容的助手消息对象；error：失败原因或错误对象；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  } finally {
  // 开始收尾分支，无论前面的操作成功或失败都执行。
  // 本行完成上面一层已说明的函数、分支或对象配置
    streaming.value = false;
    // 把右侧表达式的结果写入 streaming.value。
    // streaming：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
    abort = null;
    // 把右侧表达式的结果写入 abort。
    // abort：当前对话请求的取消控制器引用
    if (!reply.text && !reply.error) reply.text = '(没有返回内容)';
    // 检查(!reply.text && !reply.error) reply.text = '(没有返回内容)';，按判断结果进入对应的处理分支。
    // reply：正在接收流式内容的助手消息对象；text：聊天正文、文本片段或界面展示文字；error：失败原因或错误对象
    scrollDown();
    // 等待界面更新后滚动到最新聊天消息。
    // scrollDown：等待界面更新后滚动到最新聊天消息
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了提交当前聊天内容并把流式回复逐步写入对话列表的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 confirm，用于提交用户确认的 AI 建议并展示后端下发结果。
async function confirm(p: ProposalCard) {
// 弹出确认对话框，取得用户对当前操作的选择。
// confirm：提交用户确认的 AI 建议并展示后端下发结果；p：当前方法接收的参数，类型为 ProposalCard
  busy.value = true;
  // 把右侧表达式的结果写入 busy.value。
  // busy：当前操作尚未结束的状态标记；value：当前字段或点位的实际取值
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    const r = await apiConfirmAiProposal(p.id);
    // 提交 AI 建议确认请求，由后端完成指令校验与下发，将结果保存或写入 r。
    // r：本处保存 await apiConfirmAiProposal(p.id) 的结果；apiConfirmAiProposal：从 ../services/ai 导入的对象，用于本文件的调用或类型约束；p：当前方法接收的参数，类型为 ProposalCard；id：当前记录或对象的标识
    p.result = r.ok ? `已下发,指令号 ${r.cmdId}` : r.error || '下发失败';
    // 把右侧表达式的结果写入 p.result。
    // p：当前方法接收的参数，类型为 ProposalCard；result：本处声明的字段或类型，类型为 string；r：本处保存 await apiConfirmAiProposal(p.id) 的结果；ok：操作是否成功的布尔结果；cmdId：控制指令唯一编号，用于关联下发与回执；error：失败原因或错误对象
    p.resultOk = r.ok;
    // 把右侧表达式的结果写入 p.resultOk。
    // p：当前方法接收的参数，类型为 ProposalCard；resultOk：本处声明的字段或类型，类型为 boolean；r：本处保存 await apiConfirmAiProposal(p.id) 的结果；ok：操作是否成功的布尔结果
    if (r.ok) ElMessage.success('指令已下发');
    // 检查(r.ok) ElMessage.success('指令已下发');，按判断结果进入对应的处理分支。
    // r：本处保存 await apiConfirmAiProposal(p.id) 的结果；ok：操作是否成功的布尔结果；ElMessage：Element Plus 的短消息提示 API；success：显示操作成功提示
    else ElMessage.error(p.result);
    // 前一条件不成立时，改为执行这一分支。
    // ElMessage：Element Plus 的短消息提示 API；error：记录错误日志或显示失败提示，以接收对象为准；p：当前方法接收的参数，类型为 ProposalCard；result：本处声明的字段或类型，类型为 string
  } catch (e) {
  // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
  // e：本处保存的局部数据
    p.result = (e as Error).message;
    // 把右侧表达式的结果写入 p.result。
    // p：当前方法接收的参数，类型为 ProposalCard；result：本处声明的字段或类型，类型为 string；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
    p.resultOk = false;
    // 把右侧表达式的结果写入 p.resultOk。
    // p：当前方法接收的参数，类型为 ProposalCard；resultOk：本处声明的字段或类型，类型为 boolean
    ElMessage.error(p.result);
    // 记录错误日志或显示失败提示，以接收对象为准。
    // ElMessage：Element Plus 的短消息提示 API；error：记录错误日志或显示失败提示，以接收对象为准；p：当前方法接收的参数，类型为 ProposalCard；result：本处声明的字段或类型，类型为 string
  } finally {
  // 开始收尾分支，无论前面的操作成功或失败都执行。
  // 本行完成上面一层已说明的函数、分支或对象配置
    busy.value = false;
    // 把右侧表达式的结果写入 busy.value。
    // busy：当前操作尚未结束的状态标记；value：当前字段或点位的实际取值
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了提交用户确认的 AI 建议并展示后端下发结果的实现；实际结果由运行时输入和执行分支决定。

// 忽略只是从本地列表移除;后端那条提案仍在 Redis 里等 TTL 过期,
// 但它没有确认接口就永远不会执行 —— 没有「忽略」这个 API 是刻意的。
// 这一段定义 dismiss，用于从前端列表移除当前建议卡片。
function dismiss(p: ProposalCard) {
// 定义 dismiss，用于从前端列表移除当前建议卡片。
// dismiss：从前端列表移除当前建议卡片；p：当前方法接收的参数，类型为 ProposalCard
  proposals.value = proposals.value.filter((x) => x.id !== p.id);
  // 把右侧表达式的结果写入 proposals.value。
  // proposals：本处保存 ref<ProposalCard[]>([]) 的结果；value：当前字段或点位的实际取值；filter：保留满足条件的集合元素；x：当前方法接收的参数；id：当前记录或对象的标识；p：当前方法接收的参数，类型为 ProposalCard
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了从前端列表移除当前建议卡片的实现；实际结果由运行时输入和执行分支决定。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->
<!-- script 是当前使用的界面元素或组件 -->
<!-- 这一段完成了响应式状态与用户交互处理的定义，供页面渲染时使用。 -->

<!-- 这一段实现当前页面或组件的外观样式，服务于呈现 AI 对话、工具提示和待确认建议卡片。 -->
<style scoped>
/* 开始当前 Vue 组件的样式区域，设置页面元素的外观。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段为 .drawer-head 对应的界面元素定义尺寸、布局或视觉样式。 */
.drawer-head {
/* 对选择器 .drawer-head 匹配的元素应用后续声明。 */
/* .drawer-head 是这一组样式匹配的元素选择器 */
  display: flex; align-items: center; justify-content: space-between;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；justify-content=space-between：控制主轴上的分布方式。 */
  /* display 控制元素布局方式，这里取 flex；align-items 控制交叉轴对齐方式，这里取 center；justify-content 控制主轴内容排列方式，这里取 space-between */
  width: 100%; padding-right: 32px;
  /* width=100%：设置宽度；padding-right=32px：设置该样式属性。 */
  /* width 控制宽度，这里取 100%；padding-right 控制当前元素的样式取值，这里取 32px */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .drawer-head 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.head-tags { display: flex; gap: 6px; }
/* display=flex：决定元素如何布局或显示；gap=6px：设置子元素间距。 */
/* display 控制元素布局方式，这里取 flex；gap 控制子元素间距，这里取 6px */

/* 这一段为 .proposals 对应的界面元素定义尺寸、布局或视觉样式。 */
.proposals {
/* 对选择器 .proposals 匹配的元素应用后续声明。 */
/* .proposals 是这一组样式匹配的元素选择器 */
  margin-bottom: 10px; padding-bottom: 10px;
  /* margin-bottom=10px：设置该样式属性；padding-bottom=10px：设置该样式属性。 */
  /* margin-bottom 控制当前元素的样式取值，这里取 10px；padding-bottom 控制当前元素的样式取值，这里取 10px */
  border-bottom: 1px dashed var(--panel-border);
  /* border-bottom=1px dashed var(--panel-border)：设置该样式属性。 */
  /* border-bottom 控制当前元素的样式取值，这里取 1px dashed var(--panel-border) */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .proposals 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.section-title { font-size: 11px; color: var(--text-dim); margin-bottom: 6px; }
/* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色；margin-bottom=6px：设置该样式属性。 */
/* font-size 控制字体大小，这里取 11px；color 控制文字颜色，这里取 var(--text-dim)；margin-bottom 控制当前元素的样式取值，这里取 6px */
/* 这一段为 .proposal 对应的界面元素定义尺寸、布局或视觉样式。 */
.proposal {
/* 对选择器 .proposal 匹配的元素应用后续声明。 */
/* .proposal 是这一组样式匹配的元素选择器 */
  padding: 8px 10px; margin-bottom: 6px;
  /* padding=8px 10px：设置内边距；margin-bottom=6px：设置该样式属性。 */
  /* padding 控制内边距，这里取 8px 10px；margin-bottom 控制当前元素的样式取值，这里取 6px */
  background: rgba(245, 158, 11, 0.10);
  /* background=rgba(245, 158, 11, 0.10)：设置背景。 */
  /* background 控制背景，这里取 rgba(245, 158, 11, 0.10) */
  border: 1px solid rgba(245, 158, 11, 0.35);
  /* border=1px solid rgba(245, 158, 11, 0.35)：设置边框。 */
  /* border 控制边框，这里取 1px solid rgba(245, 158, 11, 0.35) */
  border-radius: 6px;
  /* border-radius=6px：设置圆角。 */
  /* border-radius 控制圆角半径，这里取 6px */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .proposal 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.p-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
/* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=8px：设置子元素间距；margin-bottom=4px：设置该样式属性。 */
/* display 控制元素布局方式，这里取 flex；align-items 控制交叉轴对齐方式，这里取 center；gap 控制子元素间距，这里取 8px；margin-bottom 控制当前元素的样式取值，这里取 4px */
.p-target { font-size: 11px; color: var(--text-dim); font-variant-numeric: tabular-nums; }
/* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色；font-variant-numeric=tabular-nums：设置该样式属性。 */
/* font-size 控制字体大小，这里取 11px；color 控制文字颜色，这里取 var(--text-dim)；font-variant-numeric 控制当前元素的样式取值，这里取 tabular-nums */
.p-reason { font-size: 12px; color: var(--text); margin-bottom: 8px; white-space: pre-wrap; }
/* font-size=12px：设置字号；color=var(--text)：设置文字颜色；margin-bottom=8px：设置该样式属性；white-space=pre-wrap：设置该样式属性。 */
/* font-size 控制字体大小，这里取 12px；color 控制文字颜色，这里取 var(--text)；margin-bottom 控制当前元素的样式取值，这里取 8px；white-space 控制空格与换行的保留方式，这里取 pre-wrap */
.p-actions { display: flex; gap: 8px; }
/* display=flex：决定元素如何布局或显示；gap=8px：设置子元素间距。 */
/* display 控制元素布局方式，这里取 flex；gap 控制子元素间距，这里取 8px */
.p-result { font-size: 11px; }
/* font-size=11px：设置字号。 */
/* font-size 控制字体大小，这里取 11px */
.p-result:not(.bad) { color: var(--ok); }
/* p-result=not(.bad) { color: var(--ok)：设置该样式属性。 */
/* p-result 控制当前元素的样式取值，这里取 not(.bad)；color 控制文字颜色，这里取 var(--ok) */
.p-result.bad { color: var(--ng); }
/* color=var(--ng)：设置文字颜色。 */
/* color 控制文字颜色，这里取 var(--ng) */

.messages { flex: 1; overflow-y: auto; padding-right: 4px; }
/* flex=1：设置弹性项的伸缩比例；overflow-y=auto：设置该样式属性；padding-right=4px：设置该样式属性。 */
/* flex 控制弹性项伸缩方式，这里取 1；overflow-y 控制当前元素的样式取值，这里取 auto；padding-right 控制当前元素的样式取值，这里取 4px */
.msg { margin-bottom: 12px; display: flex; flex-direction: column; }
/* margin-bottom=12px：设置该样式属性；display=flex：决定元素如何布局或显示；flex-direction=column：设置该样式属性。 */
/* margin-bottom 控制当前元素的样式取值，这里取 12px；display 控制元素布局方式，这里取 flex；flex-direction 控制当前元素的样式取值，这里取 column */
.msg.user { align-items: flex-end; }
/* align-items=flex-end：控制交叉轴上的对齐方式。 */
/* align-items 控制交叉轴对齐方式，这里取 flex-end */
/* 这一段为 .bubble 对应的界面元素定义尺寸、布局或视觉样式。 */
.bubble {
/* 对选择器 .bubble 匹配的元素应用后续声明。 */
/* .bubble 是这一组样式匹配的元素选择器 */
  max-width: 88%;
  /* max-width=88%：限制最大宽度。 */
  /* max-width 控制最大宽度，这里取 88% */
  padding: 8px 10px;
  /* padding=8px 10px：设置内边距。 */
  /* padding 控制内边距，这里取 8px 10px */
  font-size: 13px;
  /* font-size=13px：设置字号。 */
  /* font-size 控制字体大小，这里取 13px */
  line-height: 1.6;
  /* line-height=1.6：设置行高。 */
  /* line-height 控制行间距，这里取 1.6 */
  white-space: pre-wrap;
  /* white-space=pre-wrap：设置该样式属性。 */
  /* white-space 控制空格与换行的保留方式，这里取 pre-wrap */
  word-break: break-word;
  /* word-break=break-word：设置该样式属性。 */
  /* word-break 控制长文本的断行方式，这里取 break-word */
  border-radius: 8px;
  /* border-radius=8px：设置圆角。 */
  /* border-radius 控制圆角半径，这里取 8px */
  background: rgba(255, 255, 255, 0.05);
  /* background=rgba(255, 255, 255, 0.05)：设置背景。 */
  /* background 控制背景，这里取 rgba(255, 255, 255, 0.05) */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .bubble 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.msg.user .bubble { background: var(--accent); color: #0b1220; }
/* background=var(--accent)：设置背景；color=#0b1220：设置文字颜色。 */
/* background 控制背景，这里取 var(--accent)；color 控制文字颜色，这里取 #0b1220 */
.bubble.err { border: 1px solid rgba(239, 68, 68, 0.4); }
/* border=1px solid rgba(239, 68, 68, 0.4)：设置边框。 */
/* border 控制边框，这里取 1px solid rgba(239, 68, 68, 0.4) */
/* 这一段为 .tools 对应的界面元素定义尺寸、布局或视觉样式。 */
.tools {
/* 对选择器 .tools 匹配的元素应用后续声明。 */
/* .tools 是这一组样式匹配的元素选择器 */
  display: flex; align-items: center; gap: 4px;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=4px：设置子元素间距。 */
  /* display 控制元素布局方式，这里取 flex；align-items 控制交叉轴对齐方式，这里取 center；gap 控制子元素间距，这里取 4px */
  margin-top: 4px; font-size: 10px; color: var(--text-dim);
  /* margin-top=4px：设置该样式属性；font-size=10px：设置字号；color=var(--text-dim)：设置文字颜色。 */
  /* margin-top 控制当前元素的样式取值，这里取 4px；font-size 控制字体大小，这里取 10px；color 控制文字颜色，这里取 var(--text-dim) */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .tools 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.err-line { margin-top: 4px; font-size: 11px; color: var(--ng); }
/* margin-top=4px：设置该样式属性；font-size=11px：设置字号；color=var(--ng)：设置文字颜色。 */
/* margin-top 控制当前元素的样式取值，这里取 4px；font-size 控制字体大小，这里取 11px；color 控制文字颜色，这里取 var(--ng) */

.composer { display: flex; gap: 8px; align-items: flex-end; }
/* display=flex：决定元素如何布局或显示；gap=8px：设置子元素间距；align-items=flex-end：控制交叉轴上的对齐方式。 */
/* display 控制元素布局方式，这里取 flex；gap 控制子元素间距，这里取 8px；align-items 控制交叉轴对齐方式，这里取 flex-end */
.disclaimer { margin-top: 6px; font-size: 10px; color: var(--text-dim); }
/* margin-top=6px：设置该样式属性；font-size=10px：设置字号；color=var(--text-dim)：设置文字颜色。 */
/* margin-top 控制当前元素的样式取值，这里取 6px；font-size 控制字体大小，这里取 10px；color 控制文字颜色，这里取 var(--text-dim) */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
<!-- style 是当前使用的界面元素或组件 -->
<!-- 这一段提供了呈现 AI 对话、工具提示和待确认建议卡片所需的定义和处理逻辑，结果交由调用方或运行环境使用。 -->
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
