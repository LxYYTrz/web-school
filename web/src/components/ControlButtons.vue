<!-- 这一段负责按现场状态和用户权限展示控制按钮与指令回执，为后续代码提供当前文件的处理入口。 -->
<!-- 这一段实现界面模板，服务于按现场状态和用户权限展示控制按钮与指令回执。 -->
<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
<!-- template 是当前使用的界面元素或组件 -->
  <div class="ctrl-btns">
  <!-- 渲染容器，应用 ctrl-btns 样式类。 -->
  <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 ctrl-btns -->
    <div class="ctrl-title">控制</div>
    <!-- 渲染容器，应用 ctrl-title 样式类。 -->
    <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 ctrl-title -->
    <div class="ctrl-row">
    <!-- 渲染容器，应用 ctrl-row 样式类。 -->
    <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 ctrl-row -->
      <el-button size="small" type="success" :loading="state === 'sending'" :disabled="!can('start')" @click="confirm('start')">启动</el-button>
      <!-- 渲染操作按钮。；设置 :loading=state === ：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；渲染操作按钮。 关键字：@＝事件监听的简写。 -->
      <!-- el-button 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；type 表示组件外观类型或输入控件类型，当前值为 success；:loading 表示把表达式结果动态绑定到组件属性，当前值为 state === 'sending'；:disabled 表示把表达式结果动态绑定到组件属性，当前值为 !can('start')；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 confirm('start') -->
      <el-button size="small" type="danger" :loading="state === 'sending'" :disabled="!can('stop')" @click="confirm('stop')">停止</el-button>
      <!-- 渲染操作按钮。；设置 :loading=state === ：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；渲染操作按钮。 关键字：@＝事件监听的简写。 -->
      <!-- el-button 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；type 表示组件外观类型或输入控件类型，当前值为 danger；:loading 表示把表达式结果动态绑定到组件属性，当前值为 state === 'sending'；:disabled 表示把表达式结果动态绑定到组件属性，当前值为 !can('stop')；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 confirm('stop') -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->
    <div class="ctrl-row">
    <!-- 渲染容器，应用 ctrl-row 样式类。 -->
    <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 ctrl-row -->
      <!-- PLC word 8:1=获取手动 2=释放手动,PLC 切换完成后自动置 0。
           acquire 仅 stopped(101) 可用;release 仅 manual_mode(102) 可用 -->
      <el-dropdown trigger="click" :disabled="!can('mode_set', 'acquire') && !can('mode_set', 'release')" @command="(a: string) => confirm('mode_set', { action: a })">
      <!-- 渲染el-dropdown 元素或组件。；设置 :disabled=!can(：控制是否禁用。 关键字：:＝属性动态绑定的简写。；设置 @command=(a: string) => confirm(：设置该属性。 关键字：@＝事件监听的简写。 -->
      <!-- el-dropdown 是当前使用的界面元素或组件；:disabled 表示把表达式结果动态绑定到组件属性，当前值为 !can('mode_set', 'acquire') && !can…；@command 表示当前组件或 DOM 事件的处理函数绑定，当前值为 (a: string) => confirm('mode_set', … -->
        <el-button size="small" :loading="state === 'sending'" :disabled="!can('mode_set', 'acquire') && !can('mode_set', 'release')">
        <!-- 渲染操作按钮。 关键字：:＝属性动态绑定的简写。；设置 :disabled=!can(：控制是否禁用。 关键字：:＝属性动态绑定的简写。 -->
        <!-- el-button 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；:loading 表示把表达式结果动态绑定到组件属性，当前值为 state === 'sending'；:disabled 表示把表达式结果动态绑定到组件属性，当前值为 !can('mode_set', 'acquire') && !can… -->
          手动模式 ▾<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          <!-- 在当前页面元素中直接显示文字「手动模式 ▾<el-icon class="el-icon—right"><ArrowDown /></el-icon>」。 -->
          <!-- 手动模式 ▾<el-icon class="el-icon—right"><ArrowDown /></el-icon> 是直接显示在当前界面元素中的文字内容 -->
        </el-button>
        <!-- 结束 el-button 元素及其中的内容。 -->
        <!-- el-button 是当前使用的界面元素或组件 -->
        <template #dropdown>
        <!-- 渲染template 元素或组件。 -->
        <!-- template 是当前使用的界面元素或组件；#dropdown 表示将此区域放入组件指定名称的插槽 -->
          <el-dropdown-menu>
          <!-- 渲染el-dropdown-menu 元素或组件。 -->
          <!-- el-dropdown-menu 是当前使用的界面元素或组件 -->
            <el-dropdown-item command="acquire" :disabled="!can('mode_set', 'acquire')">
            <!-- 渲染el-dropdown-item 元素或组件。 -->
            <!-- el-dropdown-item 是当前使用的界面元素或组件；:disabled 表示把表达式结果动态绑定到组件属性，当前值为 !can('mode_set', 'acquire') -->
              获取手动模式
              <!-- 在当前页面元素中直接显示文字「获取手动模式」。 -->
              <!-- 获取手动模式 是直接显示在当前界面元素中的文字内容 -->
            </el-dropdown-item>
            <!-- 结束 el-dropdown-item 元素及其中的内容。 -->
            <!-- el-dropdown-item 是当前使用的界面元素或组件 -->
            <el-dropdown-item command="release" :disabled="!can('mode_set', 'release')">
            <!-- 渲染el-dropdown-item 元素或组件。 -->
            <!-- el-dropdown-item 是当前使用的界面元素或组件；:disabled 表示把表达式结果动态绑定到组件属性，当前值为 !can('mode_set', 'release') -->
              释放手动模式
              <!-- 在当前页面元素中直接显示文字「释放手动模式」。 -->
              <!-- 释放手动模式 是直接显示在当前界面元素中的文字内容 -->
            </el-dropdown-item>
            <!-- 结束 el-dropdown-item 元素及其中的内容。 -->
            <!-- el-dropdown-item 是当前使用的界面元素或组件 -->
          </el-dropdown-menu>
          <!-- 结束 el-dropdown-menu 元素及其中的内容。 -->
          <!-- el-dropdown-menu 是当前使用的界面元素或组件 -->
        </template>
        <!-- 结束 template 组件或元素对应的界面区域。 -->
        <!-- template 是当前使用的界面元素或组件 -->
      </el-dropdown>
      <!-- 结束 el-dropdown 元素及其中的内容。 -->
      <!-- el-dropdown 是当前使用的界面元素或组件 -->
      <!-- PLC word 10:1=正转 0=停止,电平型。仅「手动控制模式」下有效 -->
      <el-button size="small" type="warning" :loading="state === 'sending'" :disabled="!can('conveyor')" @click="confirm('conveyor', { action: conveyorOn ? 'stop' : 'forward' })">
      <!-- 渲染操作按钮。 关键字：:＝属性动态绑定的简写。；设置 :disabled=!can(：控制是否禁用。 关键字：:＝属性动态绑定的简写。；设置 @click=confirm(：设置该属性。 关键字：@＝事件监听的简写。 -->
      <!-- el-button 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；type 表示组件外观类型或输入控件类型，当前值为 warning；:loading 表示把表达式结果动态绑定到组件属性，当前值为 state === 'sending'；:disabled 表示把表达式结果动态绑定到组件属性，当前值为 !can('conveyor')；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 confirm('conveyor', { action: conve… -->
        {{ conveyorOn ? '传送带停止' : '传送带正转' }}
        <!-- 把模板表达式计算出的实时状态显示在界面中。 -->
        <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
      </el-button>
      <!-- 结束 el-button 元素及其中的内容。 -->
      <!-- el-button 是当前使用的界面元素或组件 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->
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
    <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 ctrl-reason；双花括号把其中表达式的计算结果插入界面文字 -->

    <!-- 状态行:显示最近一次命令的状态与回执消息 -->
    <div v-if="state !== 'idle'" class="ctrl-state" :class="state">
    <!-- 渲染容器，应用 ctrl-state 样式类，条件成立时显示（state !== 'idle'）。 -->
    <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 state !== 'idle'；class 表示应用的样式类，当前值为 ctrl-state；:class 表示把表达式结果动态绑定到组件属性，当前值为 state -->
      <span class="dot" />
      <!-- 渲染行内文字，应用 dot 样式类。 -->
      <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 dot -->
      <span class="msg">{{ stateMsg }}</span>
      <!-- 渲染行内文字，应用 msg 样式类，其中显示 stateMsg 的计算结果。 -->
      <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 msg；双花括号把其中表达式的计算结果插入界面文字 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->
  </div>
  <!-- 结束 div 元素及其中的内容。 -->
  <!-- div 是当前使用的界面元素或组件 -->
</template>
<!-- 结束 template 组件或元素对应的界面区域。 -->
<!-- template 是当前使用的界面元素或组件 -->
<!-- 这一段完成了界面布局和数据展示的定义，供页面渲染时使用。 -->

<!-- 这一段实现组件状态与事件处理，服务于按现场状态和用户权限展示控制按钮与指令回执。 -->
<script setup lang="ts">
// 开始当前 Vue 组件的脚本区域，定义页面状态与交互逻辑。
// script 是 Vue 组件逻辑区；setup 让顶层声明可直接用于模板；lang="ts" 指定使用 TypeScript
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。
// computed：Vue 根据其他响应式值计算并缓存结果的函数；onBeforeUnmount：Vue 注册组件卸载前清理回调的函数；onMounted：Vue 注册组件挂载完成回调的函数；ref：Vue 创建可通过 .value 读写的响应式引用
import { ElMessage, ElMessageBox } from 'element-plus';
// 从 element-plus 导入这一行列出的符号，供本文件调用。
// ElMessage：Element Plus 的短消息提示 API；ElMessageBox：Element Plus 的确认或输入对话框 API
import { ArrowDown } from '@element-plus/icons-vue';
// 从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。
// ArrowDown：从 @element-plus/icons-vue 导入的对象，用于本文件的调用或类型约束
import { apiSendCommand, onCommandAck } from '../services/control';
// 从 ../services/control 导入这一行列出的符号，供本文件调用。
// apiSendCommand：从 ../services/control 导入的对象，用于本文件的调用或类型约束；onCommandAck：从 ../services/control 导入的对象，用于本文件的调用或类型约束
import { useLineData } from '../composables/useLineData';
// 从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。
// useLineData：从 ../composables/useLineData 导入的对象，用于本文件的调用或类型约束
import type { CommandAck } from '../services/types';
// 从 ../services/types 导入这一行列出的符号，供本文件调用。
// CommandAck：项目数据契约中的指令回执结构，通过 cmdId 关联下发指令

const { robot, status } = useLineData();
// 取得按产线编码复用的数据单例，供多个页面共享状态。
// status：当前连接、产线、请求或指令的状态字段；useLineData：从 ../composables/useLineData 导入的对象，用于本文件的调用或类型约束
const deviceId = computed(() => robot.value?.deviceId ?? 'robot-01');
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 deviceId。
// deviceId：设备标识，接口使用配置中的设备编码；computed：Vue 根据其他响应式值计算并缓存结果的函数；value：当前字段或点位的实际取值
const lineId = 'line-01';
// 根据 'line-01' 设置 lineId，用于产线标识，接口通常使用 line-01 等编码。
// lineId：产线标识，接口通常使用 line-01 等编码

type CmdType = 'start' | 'stop' | 'mode_set' | 'conveyor';
// 定义 CmdType，约束或实现本模块涉及的数据和行为。
// CmdType：本处声明的字段或类型，类型为 'start' | 'stop' | 'mode_set' | 'conveyor'
type State = 'idle' | 'sending' | 'sent' | 'acked' | 'rejected' | 'failed' | 'timeout';
// 定义 State，约束或实现本模块涉及的数据和行为。
// State：本处声明的字段或类型，类型为 'idle' | 'sending' | 'sent' | 'acked' | 'rejected' | 'failed…

const state = ref<State>('idle');
// 根据 ref<State>('idle') 设置 state，用于当前状态值或实时状态服务实例，以所在对象为准。
// state：当前状态值或实时状态服务实例，以所在对象为准；ref：Vue 创建可通过 .value 读写的响应式引用；State：本处声明的字段或类型，类型为 'idle' | 'sending' | 'sent' | 'acked' | 'rejected' | 'failed…
const stateMsg = ref('');
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 stateMsg。
// stateMsg：本处保存 ref('') 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
const currentCmdId = ref('');
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 currentCmdId。
// currentCmdId：本处保存 ref('') 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
const lastSentAt = ref(0);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 lastSentAt。
// lastSentAt：本处保存 ref(0) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用

const MOCK_ONLY = import.meta.env.VITE_MOCK_ONLY === 'true';
// 根据 import.meta.env.VITE_MOCK_ONLY === 'true' 设置 MOCK_ONLY，供当前流程后续使用。
// MOCK_ONLY：本处保存 import.meta.env.VITE_MOCK_ONLY === 'true' 的结果；env：本处声明的字段或类型，类型为 ImportMetaEnv；VITE_MOCK_ONLY：本处声明的字段或类型，类型为 any

// 传送带是电平型:按钮显示的是「下次点击要执行的动作」,
// 因此取反显示。默认(未开)时显示"正转"。
const conveyorOn = ref(false);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 conveyorOn。
// conveyorOn：本处保存 ref(false) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用

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
// 根据 'init_error' 设置 S_INIT_ERROR，供当前流程后续使用。
// S_INIT_ERROR：本处保存 'init_error' 的结果
const S_STOPPED = 'stopped';
// 根据 'stopped' 设置 S_STOPPED，供当前流程后续使用。
// S_STOPPED：本处保存 'stopped' 的结果
const S_MANUAL = 'manual_mode';
// 根据 'manual_mode' 设置 S_MANUAL，供当前流程后续使用。
// S_MANUAL：本处保存 'manual_mode' 的结果

const lineState = computed(() => status.value?.state);
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 lineState。
// lineState：本处保存 computed(() => status.value?.state) 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数；status：当前连接、产线、请求或指令的状态字段；value：当前字段或点位的实际取值；state：当前状态值或实时状态服务实例，以所在对象为准
const initError = computed(() => lineState.value === S_INIT_ERROR);
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 initError。
// initError：本处保存 computed(() => lineState.value === S_INIT_ERROR) 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数；lineState：本处保存 computed(() => status.value?.state) 的结果；value：当前字段或点位的实际取值；S_INIT_ERROR：本处保存 'init_error' 的结果

/** 某个指令当前是否可点。action 只对 mode_set 有意义 */
// 这一段定义 can，用于结合登录级别、连接和当前状态判断按钮是否可用。
function can(type: CmdType, action?: string): boolean {
// 定义 can，用于结合登录级别、连接和当前状态判断按钮是否可用。
// can：结合登录级别、连接和当前状态判断按钮是否可用；type：当前报文、指令或对象的类别字段；CmdType：本处声明的字段或类型，类型为 'start' | 'stop' | 'mode_set' | 'conveyor'；action：当前方法接收的参数，类型为 string
  if (initError.value) return false;
  // 检查(initError.value) return false;，按判断结果进入对应的处理分支。
  // initError：本处保存 computed(() => lineState.value === S_INIT_ERROR) 的结果；value：当前字段或点位的实际取值
  switch (type) {
  // 根据括号中的指令或状态值选择下面匹配的处理分支。
  // type：当前报文、指令或对象的类别字段
    case 'stop':
    // 当待判断的值等于 'stop' 时执行下面的对应分支。
    // 'stop' 是此分支匹配的指令或状态值，匹配后执行紧随其后的语句
      return true;
      // 把true作为当前函数的结果返回。
      // 布尔结果由当前函数的调用方用于决定是否允许继续执行
    case 'start':
    // 当待判断的值等于 'start' 时执行下面的对应分支。
    // 'start' 是此分支匹配的指令或状态值，匹配后执行紧随其后的语句
      // 手动模式里不让启动:必须先释放手动回到停止状态
      return lineState.value !== S_MANUAL;
      // 把lineState.value !== S_MANUAL作为当前函数的结果返回。
      // lineState：本处保存 computed(() => status.value?.state) 的结果；value：当前字段或点位的实际取值；S_MANUAL：本处保存 'manual_mode' 的结果
    case 'mode_set':
    // 当待判断的值等于 'mode_set' 时执行下面的对应分支。
    // 'mode_set' 是此分支匹配的指令或状态值，匹配后执行紧随其后的语句
      return action === 'release' ? lineState.value === S_MANUAL
      // 把action === 'release' ? lineState.value === S_MANUAL作为当前函数的结果返回。
      // action：当前方法接收的参数，类型为 string；lineState：本处保存 computed(() => status.value?.state) 的结果；value：当前字段或点位的实际取值；S_MANUAL：本处保存 'manual_mode' 的结果
                                  : lineState.value === S_STOPPED;
                                  // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
                                  // lineState：本处保存 computed(() => status.value?.state) 的结果；value：当前字段或点位的实际取值；S_STOPPED：本处保存 'stopped' 的结果
    case 'conveyor':
    // 当待判断的值等于 'conveyor' 时执行下面的对应分支。
    // 'conveyor' 是此分支匹配的指令或状态值，匹配后执行紧随其后的语句
      return lineState.value === S_MANUAL;
      // 把lineState.value === S_MANUAL作为当前函数的结果返回。
      // lineState：本处保存 computed(() => status.value?.state) 的结果；value：当前字段或点位的实际取值；S_MANUAL：本处保存 'manual_mode' 的结果
    default:
    // 前面的分支条件都不匹配时执行默认处理。
    // 前面的 case 均不匹配时执行默认分支
      return false;
      // 把false作为当前函数的结果返回。
      // 布尔结果由当前函数的调用方用于决定是否允许继续执行
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了结合登录级别、连接和当前状态判断按钮是否可用的实现；实际结果由运行时输入和执行分支决定。

/** 不满足前置条件时的一句话原因,给操作员看;都可用时返回空串 */
const gateHint = computed(() => {
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 gateHint。
// gateHint：本处保存 computed(() => { if (initError.value) { return '产线处于「初始化错误」:… 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数
  if (initError.value) {
  // 检查(initError.value)，按判断结果进入对应的处理分支。
  // initError：本处保存 computed(() => lineState.value === S_INIT_ERROR) 的结果；value：当前字段或点位的实际取值
    return '产线处于「初始化错误」:网页无法解除,请到产线现场按物理按钮复位。';
    // 把'产线处于「初始化错误」:网页无法解除,请到产线现场按物理按钮复位。'作为当前函数的结果返回。
    // 这一段文字或状态编码就是当前分支的返回结果，调用方用它显示提示或选择样式
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  if (lineState.value === S_MANUAL) {
  // 检查(lineState.value === S_MANUAL)，按判断结果进入对应的处理分支。
  // lineState：本处保存 computed(() => status.value?.state) 的结果；value：当前字段或点位的实际取值；S_MANUAL：本处保存 'manual_mode' 的结果
    return '手动控制模式:可用「传送带」与「释放手动模式」;释放后自动回到停止状态。';
    // 把'手动控制模式:可用「传送带」与「释放手动模式」;释放后自动回到停止状态。'作为当前函数的结果返回。
    // 这一段文字或状态编码就是当前分支的返回结果，调用方用它显示提示或选择样式
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  if (lineState.value === S_STOPPED) {
  // 检查(lineState.value === S_STOPPED)，按判断结果进入对应的处理分支。
  // lineState：本处保存 computed(() => status.value?.state) 的结果；value：当前字段或点位的实际取值；S_STOPPED：本处保存 'stopped' 的结果
    return '停止状态:可「获取手动模式」或「启动」。';
    // 把'停止状态:可「获取手动模式」或「启动」。'作为当前函数的结果返回。
    // 这一段文字或状态编码就是当前分支的返回结果，调用方用它显示提示或选择样式
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  if (lineState.value === undefined) {
  // 检查(lineState.value === undefined)，按判断结果进入对应的处理分支。
  // lineState：本处保存 computed(() => status.value?.state) 的结果；value：当前字段或点位的实际取值
    return '尚未收到产线状态,指令暂不可用。';
    // 把'尚未收到产线状态,指令暂不可用。'作为当前函数的结果返回。
    // 这一段文字或状态编码就是当前分支的返回结果，调用方用它显示提示或选择样式
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  return '';
  // 把''作为当前函数的结果返回。
  // 这一段文字或状态编码就是当前分支的返回结果，调用方用它显示提示或选择样式
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

/** 二次确认文案(type → 提示) */
const CONFIRM_PROMPT: Record<CmdType, string> = {
// 声明 CONFIRM_PROMPT，初始值由 { 计算得到，供当前处理流程继续使用。
// CONFIRM_PROMPT：本处保存 { start: '确认向产线发送「启动」指令?\n这会让 PLC 真正动作,产线状态跳转到「等待入料」。', stop… 的结果，类型为 Record<CmdType, string>；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容；CmdType：本处声明的字段或类型，类型为 'start' | 'stop' | 'mode_set' | 'conveyor'
  start:    '确认向产线发送「启动」指令?\n这会让 PLC 真正动作,产线状态跳转到「等待入料」。',
  // 声明或设置 start，用于当前对象或接口的对应数据。
  // start：启动 Three.js 的连续渲染循环
  stop:     '确认向产线发送「停止」指令?\n这会中断当前作业并切换到停止状态。',
  // 声明或设置 stop，用于当前对象或接口的对应数据。
  // stop 是当前映射表的查找键；「确认向产线发送「停止」指令?\n这会中断当前作业并切换到停止状态。」是使用该键时得到的文字或分类值
  mode_set: '确认切换手动模式?\nPLC 侧:写 1 = 获取手动,写 2 = 释放手动;PLC 切换完成后自行清零该位。',
  // 声明或设置 mode_set，用于当前对象或接口的对应数据。
  // mode_set 是当前映射表的查找键；「确认切换手动模式?\nPLC 侧:写 1 = 获取手动,写 2 = 释放手动;PLC 切换完成后自行清零该位。」是使用该键时得到的文字或分类值
  conveyor: '确认操作传送带?\nPLC 侧:写 1 = 正转,写 0 = 停止(电平型,持续有效)。',
  // 声明或设置 conveyor，用于当前对象或接口的对应数据。
  // conveyor 是当前映射表的查找键；「确认操作传送带?\nPLC 侧:写 1 = 正转,写 0 = 停止(电平型,持续有效)。」是使用该键时得到的文字或分类值
};
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

let offAck: (() => void) | null = null;
// 声明 offAck，初始值由 > void) | null = null 计算得到，供当前处理流程继续使用。
// offAck：本处保存 null 的结果，类型为 (() => void) | null

onMounted(() => {
// 创建或使用Vue 注册组件挂载完成回调的函数。
// onMounted：Vue 注册组件挂载完成回调的函数
  offAck = onCommandAck((ack: CommandAck) => {
  // 把右侧表达式的结果写入 offAck。
  // offAck：本处保存 null 的结果，类型为 (() => void) | null；onCommandAck：从 ../services/control 导入的对象，用于本文件的调用或类型约束；ack：当前方法接收的参数，类型为 CommandAck；CommandAck：项目数据契约中的指令回执结构，通过 cmdId 关联下发指令
    if (ack.cmdId !== currentCmdId.value) return;
    // 检查(ack.cmdId !== currentCmdId.value) return;，按判断结果进入对应的处理分支。
    // ack：当前方法接收的参数，类型为 CommandAck；cmdId：控制指令唯一编号，用于关联下发与回执；currentCmdId：本处保存 ref('') 的结果；value：当前字段或点位的实际取值
    if (ack.status === 'acked') {
    // 检查(ack.status === 'acked')，按判断结果进入对应的处理分支。
    // ack：当前方法接收的参数，类型为 CommandAck；status：当前连接、产线、请求或指令的状态字段
      state.value = 'acked'; stateMsg.value = '已执行 ✓';
      // 把右侧表达式的结果写入 state.value。
      // state：当前状态值或实时状态服务实例，以所在对象为准；value：当前字段或点位的实际取值；stateMsg：本处保存 ref('') 的结果
      // 传送带是电平型,成功后同步按钮显示
      if (pendingType.value === 'conveyor') {
      // 检查(pendingType.value === 'conveyor')，按判断结果进入对应的处理分支。
      // pendingType：本处保存 ref<string>('') 的结果；value：当前字段或点位的实际取值
        conveyorOn.value = pendingAction.value === 'forward';
        // 把右侧表达式的结果写入 conveyorOn.value。
        // conveyorOn：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值；pendingAction：本处保存 ref<string>('') 的结果
      }
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    } else if (ack.status === 'timeout') {
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // ack：当前方法接收的参数，类型为 CommandAck；status：当前连接、产线、请求或指令的状态字段
      state.value = 'timeout'; stateMsg.value = '超时(15s 无回执)';
      // 把右侧表达式的结果写入 state.value。
      // state：当前状态值或实时状态服务实例，以所在对象为准；value：当前字段或点位的实际取值；stateMsg：本处保存 ref('') 的结果
    } else {
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 本行完成上面一层已说明的函数、分支或对象配置
      state.value = 'rejected';
      // 把右侧表达式的结果写入 state.value。
      // state：当前状态值或实时状态服务实例，以所在对象为准；value：当前字段或点位的实际取值
      stateMsg.value = `被拒:${ack.message || ack.status}`;
      // 把右侧表达式的结果写入 stateMsg.value。
      // stateMsg：本处保存 ref('') 的结果；value：当前字段或点位的实际取值；ack：当前方法接收的参数，类型为 CommandAck；message：消息正文或用于展示的结果说明；status：当前连接、产线、请求或指令的状态字段
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    scheduleReset();
    // 安排操作提示自动恢复为空闲状态。
    // scheduleReset：安排操作提示自动恢复为空闲状态
  });
  // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

// 记录本次在途指令,供 ack 时判断是哪个按钮
const pendingType = ref<string>('');
// 根据 ref<string>('') 设置 pendingType，供当前流程后续使用。
// pendingType：本处保存 ref<string>('') 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
const pendingAction = ref<string>('');
// 根据 ref<string>('') 设置 pendingAction，供当前流程后续使用。
// pendingAction：本处保存 ref<string>('') 的结果；ref：Vue 创建可通过 .value 读写的响应式引用

onBeforeUnmount(() => { offAck?.(); });
// 创建或使用Vue 注册组件卸载前清理回调的函数。
// onBeforeUnmount：Vue 注册组件卸载前清理回调的函数；offAck：本处保存 null 的结果，类型为 (() => void) | null

// 收到 ack(或失败)→ 2.5s 后回 idle,让用户看到结果
let resetTimer: ReturnType<typeof setTimeout> | null = null;
// 声明 resetTimer，初始值由 null 计算得到，供当前处理流程继续使用。
// resetTimer：本处保存 null 的结果，类型为 ReturnType<typeof setTimeout> | null；ReturnType：本处声明的字段或类型，类型为 T extends (...args: any) => infer R ? R : any；setTimeout：延迟执行回调并返回计时器句柄
// 这一段定义 scheduleReset，用于安排操作提示自动恢复为空闲状态。
function scheduleReset() {
// 定义函数 scheduleReset。
// scheduleReset：安排操作提示自动恢复为空闲状态
  if (resetTimer) clearTimeout(resetTimer);
  // 检查(resetTimer) clearTimeout(resetTimer);，按判断结果进入对应的处理分支。
  // resetTimer：本处保存 null 的结果，类型为 ReturnType<typeof setTimeout> | null；clearTimeout：取消指定的延迟计时器
  resetTimer = setTimeout(() => {
  // 把右侧表达式的结果写入 resetTimer。
  // resetTimer：本处保存 null 的结果，类型为 ReturnType<typeof setTimeout> | null；setTimeout：延迟执行回调并返回计时器句柄
    state.value = 'idle'; stateMsg.value = ''; currentCmdId.value = '';
    // 把右侧表达式的结果写入 state.value。
    // state：当前状态值或实时状态服务实例，以所在对象为准；value：当前字段或点位的实际取值；stateMsg：本处保存 ref('') 的结果；currentCmdId：本处保存 ref('') 的结果
  }, 2500);
  // 结束当前对象、函数或条件代码块，供当前处理流程继续使用。
  // 本行完成上面一层已说明的函数、分支或对象配置
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了安排操作提示自动恢复为空闲状态的实现；实际结果由运行时输入和执行分支决定。

// 这一段定义 confirm，用于确认当前按钮对应的控制操作，提交指令并显示等待回执状态。
async function confirm(type: CmdType, params?: Record<string, unknown>) {
// 弹出确认对话框，取得用户对当前操作的选择。
// confirm：确认当前按钮对应的控制操作，提交指令并显示等待回执状态；type：当前报文、指令或对象的类别字段；CmdType：本处声明的字段或类型，类型为 'start' | 'stop' | 'mode_set' | 'conveyor'；params：指令附加参数对象；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容
  if (state.value !== 'idle') return;
  // 检查(state.value !== 'idle') return;，按判断结果进入对应的处理分支。
  // state：当前状态值或实时状态服务实例，以所在对象为准；value：当前字段或点位的实际取值
  // 双保险:按钮已按 can() 禁用,但点击瞬间产线状态可能刚变(比如别处刚发了指令),
  // 这里再挡一次,避免把明显违反联锁的指令发到 PLC。
  const action = (params ?? {}).action as string | undefined;
  // 根据 (params ?? {}).action as string | undefined 设置 action，供当前流程后续使用。
  // action：本处保存 (params ?? {}).action as string | undefined 的结果；params：指令附加参数对象
  if (!can(type, action)) {
  // 检查(!can(type, action))，按判断结果进入对应的处理分支。
  // can：结合登录级别、连接和当前状态判断按钮是否可用；type：当前报文、指令或对象的类别字段；action：本处保存 (params ?? {}).action as string | undefined 的结果
    ElMessage.warning(`当前产线状态不允许该指令。${gateHint.value}`);
    // 记录本次异常或状态的警告日志。
    // ElMessage：Element Plus 的短消息提示 API；warning：本处声明的字段或类型，类型为 MessageTypedFn；gateHint：本处保存 computed(() => { if (initError.value) { return '产线处于「初始化错误」:… 的结果；value：当前字段或点位的实际取值
    return;
    // 立即结束当前函数，不返回具体值。
    // 当前函数在此处结束，调用方不会从这条路径收到业务数据
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    await ElMessageBox.confirm(CONFIRM_PROMPT[type], '下发控制指令', {
    // 弹出确认对话框，取得用户对当前操作的选择。
    // ElMessageBox：Element Plus 的确认或输入对话框 API；confirm：本处声明的字段或类型，类型为 ElMessageBoxShortcutMethod；CONFIRM_PROMPT：本处保存 { start: '确认向产线发送「启动」指令?\n这会让 PLC 真正动作,产线状态跳转到「等待入料」。', stop… 的结果，类型为 Record<CmdType, string>；type：当前报文、指令或对象的类别字段
      confirmButtonText: '确认下发', cancelButtonText: '取消', type: 'warning',
      // 声明或设置 confirmButtonText，用于当前对象或接口的对应数据。
      // type：当前报文、指令或对象的类别字段
    });
    // 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  } catch { return; /* 用户取消 */ }
  // 开始异常处理分支，接收前面代码抛出的错误。
  // 本行完成上面一层已说明的函数、分支或对象配置

  pendingType.value = type;
  // 把右侧表达式的结果写入 pendingType.value。
  // pendingType：本处保存 ref<string>('') 的结果；value：当前字段或点位的实际取值；type：当前报文、指令或对象的类别字段
  pendingAction.value = String((params ?? {}).action ?? '');
  // 把右侧表达式的结果写入 pendingAction.value。
  // pendingAction：本处保存 ref<string>('') 的结果；value：当前字段或点位的实际取值；String：将值转换为文本的 JavaScript 构造函数；params：指令附加参数对象；action：(params ?? {}) 对象上的字段或操作
  state.value = 'sending';
  // 把右侧表达式的结果写入 state.value。
  // state：当前状态值或实时状态服务实例，以所在对象为准；value：当前字段或点位的实际取值
  stateMsg.value = '下发中…';
  // 把右侧表达式的结果写入 stateMsg.value。
  // stateMsg：本处保存 ref('') 的结果；value：当前字段或点位的实际取值
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    const r = await apiSendCommand(lineId, { deviceId: deviceId.value, type, params });
    // 通过 HTTP 向后端提交设备控制指令并处理失败响应，将结果保存或写入 r。
    // r：本处保存 await apiSendCommand(lineId, { deviceId: deviceId.value, typ… 的结果；apiSendCommand：从 ../services/control 导入的对象，用于本文件的调用或类型约束；lineId：产线标识，接口通常使用 line-01 等编码；deviceId：设备标识，接口使用配置中的设备编码；value：当前字段或点位的实际取值；type：当前报文、指令或对象的类别字段；params：指令附加参数对象
    if (!r.ok || !r.cmdId) {
    // 检查(!r.ok || !r.cmdId)，按判断结果进入对应的处理分支。
    // r：本处保存 await apiSendCommand(lineId, { deviceId: deviceId.value, typ… 的结果；ok：操作是否成功的布尔结果；cmdId：控制指令唯一编号，用于关联下发与回执
      state.value = 'failed';
      // 把右侧表达式的结果写入 state.value。
      // state：当前状态值或实时状态服务实例，以所在对象为准；value：当前字段或点位的实际取值
      stateMsg.value = `服务端拒绝:${r.error || '未知错误'}`;
      // 把右侧表达式的结果写入 stateMsg.value。
      // stateMsg：本处保存 ref('') 的结果；value：当前字段或点位的实际取值；r：本处保存 await apiSendCommand(lineId, { deviceId: deviceId.value, typ… 的结果；error：失败原因或错误对象
      scheduleReset();
      // 安排操作提示自动恢复为空闲状态。
      // scheduleReset：安排操作提示自动恢复为空闲状态
      return;
      // 立即结束当前函数，不返回具体值。
      // 当前函数在此处结束，调用方不会从这条路径收到业务数据
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    currentCmdId.value = r.cmdId;
    // 把右侧表达式的结果写入 currentCmdId.value。
    // currentCmdId：本处保存 ref('') 的结果；value：当前字段或点位的实际取值；r：本处保存 await apiSendCommand(lineId, { deviceId: deviceId.value, typ… 的结果；cmdId：控制指令唯一编号，用于关联下发与回执
    lastSentAt.value = Date.now();
    // 把右侧表达式的结果写入 lastSentAt.value。
    // lastSentAt：本处保存 ref(0) 的结果；value：当前字段或点位的实际取值；Date：JavaScript 日期与当前时间 API；now：取得当前时间戳；Date.now 使用毫秒
    state.value = 'sent';
    // 把右侧表达式的结果写入 state.value。
    // state：当前状态值或实时状态服务实例，以所在对象为准；value：当前字段或点位的实际取值
    stateMsg.value = `已发送(${r.cmdId.slice(0, 8)}…)`;
    // 把右侧表达式的结果写入 stateMsg.value。
    // stateMsg：本处保存 ref('') 的结果；value：当前字段或点位的实际取值；r：本处保存 await apiSendCommand(lineId, { deviceId: deviceId.value, typ… 的结果；cmdId：控制指令唯一编号，用于关联下发与回执；slice：截取数组或字符串的一部分
    // mock 演示模式:本地模拟 300ms 后 acked(无真 socket 推送)
    if (MOCK_ONLY) {
    // 检查(MOCK_ONLY)，按判断结果进入对应的处理分支。
    // MOCK_ONLY：本处保存 import.meta.env.VITE_MOCK_ONLY === 'true' 的结果
      setTimeout(() => {
      // 安排延迟执行的回调。
      // setTimeout：延迟执行回调并返回计时器句柄
        if (currentCmdId.value === r.cmdId) {
        // 检查(currentCmdId.value === r.cmdId)，按判断结果进入对应的处理分支。
        // currentCmdId：本处保存 ref('') 的结果；value：当前字段或点位的实际取值；r：本处保存 await apiSendCommand(lineId, { deviceId: deviceId.value, typ… 的结果；cmdId：控制指令唯一编号，用于关联下发与回执
          state.value = 'acked';
          // 把右侧表达式的结果写入 state.value。
          // state：当前状态值或实时状态服务实例，以所在对象为准；value：当前字段或点位的实际取值
          stateMsg.value = 'mock:已执行 ✓';
          // 把右侧表达式的结果写入 stateMsg.value。
          // stateMsg：本处保存 ref('') 的结果；value：当前字段或点位的实际取值
          scheduleReset();
          // 安排操作提示自动恢复为空闲状态。
          // scheduleReset：安排操作提示自动恢复为空闲状态
        }
        // 结束当前函数、分支或对象配置，返回上一层处理流程。
        // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
      }, 300);
      // 结束当前对象、函数或条件代码块，供当前处理流程继续使用。
      // 本行完成上面一层已说明的函数、分支或对象配置
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    // 15s 没收到 ack → 视为超时(契约 §5 第 4 条)
    setTimeout(() => {
    // 安排延迟执行的回调。
    // setTimeout：延迟执行回调并返回计时器句柄
      if (currentCmdId.value === r.cmdId && state.value === 'sent') {
      // 检查(currentCmdId.value === r.cmdId && state.value === 'sent')，按判断结果进入对应的处理分支。
      // currentCmdId：本处保存 ref('') 的结果；value：当前字段或点位的实际取值；r：本处保存 await apiSendCommand(lineId, { deviceId: deviceId.value, typ… 的结果；cmdId：控制指令唯一编号，用于关联下发与回执；state：当前状态值或实时状态服务实例，以所在对象为准
        state.value = 'timeout';
        // 把右侧表达式的结果写入 state.value。
        // state：当前状态值或实时状态服务实例，以所在对象为准；value：当前字段或点位的实际取值
        stateMsg.value = '超时(15s 无回执)';
        // 把右侧表达式的结果写入 stateMsg.value。
        // stateMsg：本处保存 ref('') 的结果；value：当前字段或点位的实际取值
        scheduleReset();
        // 安排操作提示自动恢复为空闲状态。
        // scheduleReset：安排操作提示自动恢复为空闲状态
      }
      // 结束当前函数、分支或对象配置，返回上一层处理流程。
      // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    }, 15000);
    // 结束当前对象、函数或条件代码块，供当前处理流程继续使用。
    // 本行完成上面一层已说明的函数、分支或对象配置
  } catch (e) {
  // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
  // e：本处保存的局部数据
    state.value = 'failed';
    // 把右侧表达式的结果写入 state.value。
    // state：当前状态值或实时状态服务实例，以所在对象为准；value：当前字段或点位的实际取值
    stateMsg.value = (e as Error).message || '下发失败';
    // 把右侧表达式的结果写入 stateMsg.value。
    // stateMsg：本处保存 ref('') 的结果；value：当前字段或点位的实际取值；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
    scheduleReset();
    // 安排操作提示自动恢复为空闲状态。
    // scheduleReset：安排操作提示自动恢复为空闲状态
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了确认当前按钮对应的控制操作，提交指令并显示等待回执状态的实现；实际结果由运行时输入和执行分支决定。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->
<!-- script 是当前使用的界面元素或组件 -->
<!-- 这一段完成了响应式状态与用户交互处理的定义，供页面渲染时使用。 -->

<!-- 这一段实现当前页面或组件的外观样式，服务于按现场状态和用户权限展示控制按钮与指令回执。 -->
<style scoped>
/* 开始当前 Vue 组件的样式区域，设置页面元素的外观。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
.ctrl-btns { display: flex; flex-direction: column; gap: 6px; }
/* display=flex：决定元素如何布局或显示；flex-direction=column：设置该样式属性；gap=6px：设置子元素间距。 */
/* display 控制元素布局方式，这里取 flex；flex-direction 控制当前元素的样式取值，这里取 column；gap 控制子元素间距，这里取 6px */
/* 这一段为 .ctrl-title 对应的界面元素定义尺寸、布局或视觉样式。 */
.ctrl-title {
/* 对选择器 .ctrl-title 匹配的元素应用后续声明。 */
/* .ctrl-title 是这一组样式匹配的元素选择器 */
  font-size: 11px; color: var(--text-dim);
  /* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色。 */
  /* font-size 控制字体大小，这里取 11px；color 控制文字颜色，这里取 var(--text-dim) */
  text-transform: uppercase; letter-spacing: 0.5px;
  /* text-transform=uppercase：设置该样式属性；letter-spacing=0.5px：设置该样式属性。 */
  /* text-transform 控制当前元素的样式取值，这里取 uppercase；letter-spacing 控制当前元素的样式取值，这里取 0.5px */
  margin-bottom: 2px;
  /* margin-bottom=2px：设置该样式属性。 */
  /* margin-bottom 控制当前元素的样式取值，这里取 2px */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .ctrl-title 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.ctrl-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
/* display=flex：决定元素如何布局或显示；gap=6px：设置子元素间距；align-items=center：控制交叉轴上的对齐方式；flex-wrap=wrap：设置该样式属性。 */
/* display 控制元素布局方式，这里取 flex；gap 控制子元素间距，这里取 6px；align-items 控制交叉轴对齐方式，这里取 center；flex-wrap 控制当前元素的样式取值，这里取 wrap */
.ctrl-note { font-size: 10px; color: var(--text-dim); opacity: 0.75; }
/* font-size=10px：设置字号；color=var(--text-dim)：设置文字颜色；opacity=0.75：设置透明度。 */
/* font-size 控制字体大小，这里取 10px；color 控制文字颜色，这里取 var(--text-dim)；opacity 控制不透明程度，这里取 0.75 */

/* 这一段为 .ctrl-reason 对应的界面元素定义尺寸、布局或视觉样式。 */
.ctrl-reason {
/* 对选择器 .ctrl-reason 匹配的元素应用后续声明。 */
/* .ctrl-reason 是这一组样式匹配的元素选择器 */
  font-size: 11px; color: var(--text-dim); line-height: 1.5;
  /* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色；line-height=1.5：设置行高。 */
  /* font-size 控制字体大小，这里取 11px；color 控制文字颜色，这里取 var(--text-dim)；line-height 控制行间距，这里取 1.5 */
  padding: 4px 6px; border-radius: 4px;
  /* padding=4px 6px：设置内边距；border-radius=4px：设置圆角。 */
  /* padding 控制内边距，这里取 4px 6px；border-radius 控制圆角半径，这里取 4px */
  background: rgba(255,255,255,0.02);
  /* background=rgba(255,255,255,0.02)：设置背景。 */
  /* background 控制背景，这里取 rgba(255,255,255,0.02) */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .ctrl-reason 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.ctrl-reason:empty { display: none; }
/* ctrl-reason=empty { display: none：设置该样式属性。 */
/* ctrl-reason 控制当前元素的样式取值，这里取 empty；display 控制元素布局方式，这里取 none */

/* 这一段为 .ctrl-state 对应的界面元素定义尺寸、布局或视觉样式。 */
.ctrl-state {
/* 对选择器 .ctrl-state 匹配的元素应用后续声明。 */
/* .ctrl-state 是这一组样式匹配的元素选择器 */
  margin-top: 6px; padding: 4px 6px;
  /* margin-top=6px：设置该样式属性；padding=4px 6px：设置内边距。 */
  /* margin-top 控制当前元素的样式取值，这里取 6px；padding 控制内边距，这里取 4px 6px */
  border-radius: 4px;
  /* border-radius=4px：设置圆角。 */
  /* border-radius 控制圆角半径，这里取 4px */
  display: flex; align-items: center; gap: 6px;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=6px：设置子元素间距。 */
  /* display 控制元素布局方式，这里取 flex；align-items 控制交叉轴对齐方式，这里取 center；gap 控制子元素间距，这里取 6px */
  font-size: 11px;
  /* font-size=11px：设置字号。 */
  /* font-size 控制字体大小，这里取 11px */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .ctrl-state 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.ctrl-state .dot {
/* 对选择器 .ctrl-state .dot 匹配的元素应用后续声明。 */
/* .ctrl-state .dot 是这一组样式匹配的元素选择器 */
  width: 6px; height: 6px; border-radius: 50%;
  /* width=6px：设置宽度；height=6px：设置高度；border-radius=50%：设置圆角。 */
  /* width 控制宽度，这里取 6px；height 控制高度，这里取 6px；border-radius 控制圆角半径，这里取 50% */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
.ctrl-state.sending { background: rgba(59,130,246,0.15); color: #93c5fd; }
/* background=rgba(59,130,246,0.15)：设置背景；color=#93c5fd：设置文字颜色。 */
/* background 控制背景，这里取 rgba(59,130,246,0.15)；color 控制文字颜色，这里取 #93c5fd */
.ctrl-state.sending .dot { background: #3b82f6; }
/* background=#3b82f6：设置背景。 */
/* background 控制背景，这里取 #3b82f6 */
.ctrl-state.sent { background: rgba(245,158,11,0.12); color: #fcd34d; }
/* background=rgba(245,158,11,0.12)：设置背景；color=#fcd34d：设置文字颜色。 */
/* background 控制背景，这里取 rgba(245,158,11,0.12)；color 控制文字颜色，这里取 #fcd34d */
.ctrl-state.sent .dot { background: #f59e0b; }
/* background=#f59e0b：设置背景。 */
/* background 控制背景，这里取 #f59e0b */
.ctrl-state.acked { background: rgba(34,197,94,0.12); color: #86efac; }
/* background=rgba(34,197,94,0.12)：设置背景；color=#86efac：设置文字颜色。 */
/* background 控制背景，这里取 rgba(34,197,94,0.12)；color 控制文字颜色，这里取 #86efac */
.ctrl-state.acked .dot { background: #22c55e; }
/* background=#22c55e：设置背景。 */
/* background 控制背景，这里取 #22c55e */
.ctrl-state.rejected, .ctrl-state.failed, .ctrl-state.timeout {
/* 对选择器 .ctrl-state.rejected, .ctrl-state.failed, .ctrl-state.timeout 匹配的元素应用后续声明。 */
/* .ctrl-state.rejected, .ctrl-state.failed, .ctrl-state.timeout 是这一组样式匹配的元素选择器 */
  background: rgba(239,68,68,0.12); color: #fca5a5;
  /* background=rgba(239,68,68,0.12)：设置背景；color=#fca5a5：设置文字颜色。 */
  /* background 控制背景，这里取 rgba(239,68,68,0.12)；color 控制文字颜色，这里取 #fca5a5 */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
.ctrl-state.rejected .dot,
/* 结束样式块或续写样式声明，供当前处理流程继续使用。 */
/* .ctrl-state.rejected .dot, 是这一组样式匹配的元素选择器 */
.ctrl-state.failed .dot,
/* 结束样式块或续写样式声明，供当前处理流程继续使用。 */
/* .ctrl-state.failed .dot, 是这一组样式匹配的元素选择器 */
.ctrl-state.timeout .dot { background: #ef4444; }
/* background=#ef4444：设置背景。 */
/* background 控制背景，这里取 #ef4444 */
.ctrl-state .msg { font-variant-numeric: tabular-nums; }
/* font-variant-numeric=tabular-nums：设置该样式属性。 */
/* font-variant-numeric 控制当前元素的样式取值，这里取 tabular-nums */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
<!-- style 是当前使用的界面元素或组件 -->
<!-- 这一段提供了按现场状态和用户权限展示控制按钮与指令回执所需的定义和处理逻辑，结果交由调用方或运行环境使用。 -->
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->