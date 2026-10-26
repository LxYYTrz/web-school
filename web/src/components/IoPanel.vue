<!-- 这一段负责展示六个现场只读 IO 点位与设备示意，为后续代码提供当前文件的处理入口。 -->
<!-- 这一段实现界面模板，服务于展示六个现场只读 IO 点位与设备示意。 -->
<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
<!-- template 是当前使用的界面元素或组件 -->
  <div class="panel overlay right">
  <!-- 渲染容器，应用 panel overlay right 样式类。 -->
  <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 panel overlay right -->
    <div class="panel-title">
    <!-- 渲染容器，应用 panel-title 样式类。 -->
    <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 panel-title -->
      <span>产线 LINE-01</span>
      <!-- 在界面中配置 span 元素及其内容或事件绑定。 -->
      <!-- span 是当前使用的界面元素或组件 -->
      <el-tag v-if="status" size="small" effect="plain" :type="stateTagType">
      <!-- 渲染状态标签，条件成立时显示（status）。 -->
      <!-- el-tag 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 status；size 表示组件尺寸，当前值为 small；effect 表示组件视觉风格，当前值为 plain；:type 表示把表达式结果动态绑定到组件属性，当前值为 stateTagType -->
        {{ statusText }}
        <!-- 把模板表达式计算出的实时状态显示在界面中。 -->
        <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
      </el-tag>
      <!-- 结束 el-tag 元素及其中的内容。 -->
      <!-- el-tag 是当前使用的界面元素或组件 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->

    <!-- 报警灯:alarmCode > 0,或产线处于 alarm / init_error 时红色脉冲 -->
    <div v-if="alarmOn" class="alarm-row">
    <!-- 渲染容器，应用 alarm-row 样式类，条件成立时显示（alarmOn）。 -->
    <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 alarmOn；class 表示应用的样式类，当前值为 alarm-row -->
      <span class="alarm-light" :class="{ pulse: true }" />
      <!-- 渲染行内文字，应用 alarm-light 样式类。 -->
      <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 alarm-light；:class 表示把表达式结果动态绑定到组件属性，当前值为 { pulse: true } -->
      <span class="alarm-text">{{ alarmText || `产线异常(${statusText})` }}</span>
      <!-- 渲染行内文字，应用 alarm-text 样式类，其中显示 alarmText || 产线异常(${statusText}) 的计算结果。 -->
      <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 alarm-text；双花括号把其中表达式的计算结果插入界面文字 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->

    <!-- I/O 信号灯矩阵:现场 17 word 表提供产线状态、6 轴关节与 6 路 IO -->
    <div v-if="status || robot" class="io-grid">
    <!-- 渲染容器，应用 io-grid 样式类，条件成立时显示（status || robot）。 -->
    <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 status || robot；class 表示应用的样式类，当前值为 io-grid -->
      <div class="io-cell">
      <!-- 渲染容器，应用 io-cell 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-cell -->
        <span class="io-dot" :class="modeDot" />
        <!-- 渲染行内文字，应用 io-dot 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-dot；:class 表示把表达式结果动态绑定到组件属性，当前值为 modeDot -->
        <span class="io-label">模式</span>
        <!-- 渲染行内文字，应用 io-label 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-label -->
        <span class="io-val">{{ robot?.mode ?? '—' }}</span>
        <!-- 渲染行内文字，应用 io-val 样式类，其中显示 robot?.mode ?? '—' 的计算结果。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-val；双花括号把其中表达式的计算结果插入界面文字 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
      <div class="io-cell">
      <!-- 渲染容器，应用 io-cell 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-cell -->
        <span class="io-dot" :class="runDot" />
        <!-- 渲染行内文字，应用 io-dot 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-dot；:class 表示把表达式结果动态绑定到组件属性，当前值为 runDot -->
        <span class="io-label">状态</span>
        <!-- 渲染行内文字，应用 io-label 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-label -->
        <span class="io-val">{{ runText }}</span>
        <!-- 渲染行内文字，应用 io-val 样式类，其中显示 runText 的计算结果。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-val；双花括号把其中表达式的计算结果插入界面文字 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
      <div class="io-cell">
      <!-- 渲染容器，应用 io-cell 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-cell -->
        <span class="io-dot" :class="edgeDot" />
        <!-- 渲染行内文字，应用 io-dot 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-dot；:class 表示把表达式结果动态绑定到组件属性，当前值为 edgeDot -->
        <span class="io-label">边缘</span>
        <!-- 渲染行内文字，应用 io-label 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-label -->
        <span class="io-val">{{ edgeText }}</span>
        <!-- 渲染行内文字，应用 io-val 样式类，其中显示 edgeText 的计算结果。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-val；双花括号把其中表达式的计算结果插入界面文字 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
      <div class="io-cell">
      <!-- 渲染容器，应用 io-cell 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-cell -->
        <span class="io-dot" :class="alarmDot" />
        <!-- 渲染行内文字，应用 io-dot 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-dot；:class 表示把表达式结果动态绑定到组件属性，当前值为 alarmDot -->
        <span class="io-label">报警</span>
        <!-- 渲染行内文字，应用 io-label 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-label -->
        <span class="io-val">{{ alarmCodeText }}</span>
        <!-- 渲染行内文字，应用 io-val 样式类，其中显示 alarmCodeText 的计算结果。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-val；双花括号把其中表达式的计算结果插入界面文字 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->

    <!-- 六轴关节角(现场 PLC 唯一上送的机器人数据) -->
    <div v-if="joints.length" class="joints">
    <!-- 渲染容器，应用 joints 样式类，条件成立时显示（joints.length）。 -->
    <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 joints.length；class 表示应用的样式类，当前值为 joints -->
      <div class="stat" v-for="(j, i) in joints" :key="i">
      <!-- 渲染容器，应用 stat 样式类，按集合重复生成（(j, i) in joints）。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 stat；v-for 表示按数据列表重复生成元素，当前值为 (j, i) in joints；:key 表示把表达式结果动态绑定到组件属性，当前值为 i -->
        <div class="val">{{ j === null ? '—' : j.toFixed(1) }}</div>
        <!-- 渲染容器，应用 val 样式类，其中显示 j === null ? '—' : j.toFixed(1) 的计算结果。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 val；双花括号把其中表达式的计算结果插入界面文字 -->
        <div class="lbl">J{{ i + 1 }}</div>
        <!-- 渲染容器，应用 lbl 样式类，其中显示 i + 1 的计算结果。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 lbl；双花括号把其中表达式的计算结果插入界面文字 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->

    <!--
      注:契约里的 goodCount / ngCount / beatMs / speedPct 仍保留(只增不改),
      但现场 PLC 点位表未提供这些实测值,edge 输出默认值 0 —— 展示出来只会
      误导成"真实计数为 0",故已从面板移除(2026-10-23)。
    -->

    <div class="meta">
    <!-- 渲染容器，应用 meta 样式类。 -->
    <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 meta -->
      <span>程序 {{ robot?.program || '—' }}</span>
      <!-- 渲染行内文字，其中显示 robot?.program || '—' 的计算结果。 -->
      <!-- span 是当前使用的界面元素或组件；双花括号把其中表达式的计算结果插入界面文字 -->
      <span>产品 {{ status?.productCode || '—' }}</span>
      <!-- 渲染行内文字，其中显示 status?.productCode || '—' 的计算结果。 -->
      <!-- span 是当前使用的界面元素或组件；双花括号把其中表达式的计算结果插入界面文字 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->

    <el-empty v-if="!status && !robot" description="切换实时数据…" :image-size="50" />
    <!-- 渲染el-empty 元素或组件，条件成立时显示（!status && !robot）。 -->
    <!-- el-empty 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 !status && !robot；:image-size 表示把表达式结果动态绑定到组件属性，当前值为 50 -->

    <!-- 控制按钮区(level >= 2 才渲染;由父级传 isAdminOrL2 控制) -->
    <div v-if="canCommand" class="ctrl-slot">
    <!-- 渲染容器，应用 ctrl-slot 样式类，条件成立时显示（canCommand）。 -->
    <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 canCommand；class 表示应用的样式类，当前值为 ctrl-slot -->
      <slot name="controls" />
      <!-- 在界面中配置 slot 元素及其内容或事件绑定。 -->
      <!-- slot 是当前使用的界面元素或组件 -->
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

<!-- 这一段实现组件状态与事件处理，服务于展示六个现场只读 IO 点位与设备示意。 -->
<script setup lang="ts">
// 开始当前 Vue 组件的脚本区域，定义页面状态与交互逻辑。
// script 是 Vue 组件逻辑区；setup 让顶层声明可直接用于模板；lang="ts" 指定使用 TypeScript
import { computed } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。
// computed：Vue 根据其他响应式值计算并缓存结果的函数
import { useLineData } from '../composables/useLineData';
// 从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。
// useLineData：从 ../composables/useLineData 导入的对象，用于本文件的调用或类型约束
import { stateText, stateTagType as tagTypeOf, isRunning } from '../services/lineState';
// 从 ../services/lineState 导入这一行列出的符号，供本文件调用。
// stateText：从 ../services/lineState 导入的对象，用于本文件的调用或类型约束；stateTagType：把产线状态转换为 Element Plus 标签类型；tagTypeOf：从 ../services/lineState 导入的对象，用于本文件的调用或类型约束；isRunning：从 ../services/lineState 导入的对象，用于本文件的调用或类型约束

defineProps<{ canCommand: boolean }>();
// 声明或设置 canCommand，用于当前对象或接口的对应数据。
// defineProps：本处保存的局部数据，类型为 _defineProps；canCommand：本处声明的字段或类型，类型为 boolean
const { robot, status, edgeText, alarmText, edgeOnline } = useLineData();
// 取得按产线编码复用的数据单例，供多个页面共享状态。
// status：当前连接、产线、请求或指令的状态字段；useLineData：从 ../composables/useLineData 导入的对象，用于本文件的调用或类型约束

const statusText = computed(() =>
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 statusText。
// statusText：本处保存 computed(() => status.value ? stateText(status.value.state) … 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数
  status.value ? stateText(status.value.state) : '等待中');
  // 把产线状态转换为中文展示文字。
  // status：当前连接、产线、请求或指令的状态字段；value：当前字段或点位的实际取值；stateText：从 ../services/lineState 导入的对象，用于本文件的调用或类型约束；state：当前状态值或实时状态服务实例，以所在对象为准

const stateTagType = computed(() => tagTypeOf(status.value?.state));
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 stateTagType。
// stateTagType：把产线状态转换为 Element Plus 标签类型；computed：Vue 根据其他响应式值计算并缓存结果的函数；tagTypeOf：从 ../services/lineState 导入的对象，用于本文件的调用或类型约束；status：当前连接、产线、请求或指令的状态字段；value：当前字段或点位的实际取值；state：当前状态值或实时状态服务实例，以所在对象为准

// 现场 PLC 17 word 表上送 joints[0..5]、产线状态和 6 路 IO,没有 alarmCode;
// 该字段保留在契约里(只增不改),edge 无数据时输出 0。
const alarmOn = computed(() =>
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 alarmOn。
// alarmOn：本处保存 computed(() => (robot.value?.alarmCode !== undefined && robo… 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数
  (robot.value?.alarmCode !== undefined && robot.value.alarmCode !== 0) ||
  // 该字段保留在契约里(只增不改),edge 无数据时输出 0。
  // value：当前字段或点位的实际取值；alarmCode：设备报警编号，0 表示无报警
  status.value?.state === 'alarm' ||
  // 把右侧表达式的结果写入 status.value?.state。
  // status：当前连接、产线、请求或指令的状态字段；value：当前字段或点位的实际取值；state：当前状态值或实时状态服务实例，以所在对象为准
  status.value?.state === 'init_error',
  // 把右侧表达式的结果写入 status.value?.state。
  // status：当前连接、产线、请求或指令的状态字段；value：当前字段或点位的实际取值；state：当前状态值或实时状态服务实例，以所在对象为准
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

const runText = computed(() => status.value ? statusText.value : '—');
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 runText。
// runText：本处保存 computed(() => status.value ? statusText.value : '—') 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数；status：当前连接、产线、请求或指令的状态字段；value：当前字段或点位的实际取值；statusText：本处保存 computed(() => status.value ? stateText(status.value.state) … 的结果
const runDot = computed(() => {
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 runDot。
// runDot：本处保存 computed(() => { const s = status.value?.state; if (isRunnin… 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数
  const s = status.value?.state;
  // 根据 status.value?.state 设置 s，供当前流程后续使用。
  // s：本处保存 status.value?.state 的结果；status：当前连接、产线、请求或指令的状态字段；value：当前字段或点位的实际取值；state：当前状态值或实时状态服务实例，以所在对象为准
  if (isRunning(s)) return 'ok';
  // 检查(isRunning(s)) return 'ok';，按判断结果进入对应的处理分支。
  // isRunning：从 ../services/lineState 导入的对象，用于本文件的调用或类型约束；s：本处保存 status.value?.state 的结果
  if (s === 'alarm' || s === 'init_error') return 'ng';
  // 检查(s === 'alarm' || s === 'init_error') return 'ng';，按判断结果进入对应的处理分支。
  // s：本处保存 status.value?.state 的结果
  if (s === 'offline') return 'warn';
  // 检查(s === 'offline') return 'warn';，按判断结果进入对应的处理分支。
  // s：本处保存 status.value?.state 的结果
  return 'idle';
  // 把'idle'作为当前函数的结果返回。
  // 这一段文字或状态编码就是当前分支的返回结果，调用方用它显示提示或选择样式
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

const modeDot = computed(() => {
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 modeDot。
// modeDot：本处保存 computed(() => { const m = robot.value?.mode; if (m === 'aut… 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数
  const m = robot.value?.mode;
  // 根据 robot.value?.mode 设置 m，供当前流程后续使用。
  // m：本处保存 robot.value?.mode 的结果；value：当前字段或点位的实际取值；mode：机器人或设备运行模式
  if (m === 'auto') return 'ok';
  // 检查(m === 'auto') return 'ok';，按判断结果进入对应的处理分支。
  // m：本处保存 robot.value?.mode 的结果
  if (m === 'manual') return 'warn';
  // 检查(m === 'manual') return 'warn';，按判断结果进入对应的处理分支。
  // m：本处保存 robot.value?.mode 的结果
  if (m === 'error') return 'ng';
  // 检查(m === 'error') return 'ng';，按判断结果进入对应的处理分支。
  // m：本处保存 robot.value?.mode 的结果
  return 'idle';
  // 把'idle'作为当前函数的结果返回。
  // 这一段文字或状态编码就是当前分支的返回结果，调用方用它显示提示或选择样式
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

const alarmDot = computed(() => alarmOn.value ? 'ng' : 'ok');
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 alarmDot。
// alarmDot：本处保存 computed(() => alarmOn.value ? 'ng' : 'ok') 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数；alarmOn：本处保存 computed(() => (robot.value?.alarmCode !== undefined && robo… 的结果；value：当前字段或点位的实际取值
const alarmCodeText = computed(() =>
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 alarmCodeText。
// alarmCodeText：本处保存 computed(() => robot.value?.alarmCode ? `#${robot.value.alar… 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数
  robot.value?.alarmCode ? `#${robot.value.alarmCode}` : '无',
  // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
  // value：当前字段或点位的实际取值；alarmCode：设备报警编号，0 表示无报警
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

const edgeDot = computed(() => {
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 edgeDot。
// edgeDot：本处保存 computed(() => { if (edgeOnline.value === null) return 'idle… 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数
  if (edgeOnline.value === null) return 'idle';
  // 检查(edgeOnline.value === null) return 'idle';，按判断结果进入对应的处理分支。
  // value：当前字段或点位的实际取值
  return edgeOnline.value ? 'ok' : 'ng';
  // 把edgeOnline.value ? 'ok' : 'ng'作为当前函数的结果返回。
  // value：当前字段或点位的实际取值
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

// 六轴关节角:现场 PLC 唯一上送的机器人数据(word 0..5,÷10 还原)
const joints = computed<(number | null)[]>(() => {
// 根据 computed<(number | null)[]>(() => { 设置 joints，用于按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度。
// joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度；computed：Vue 根据其他响应式值计算并缓存结果的函数
  const j = robot.value?.joints;
  // 根据 robot.value?.joints 设置 j，供当前流程后续使用。
  // j：本处保存 robot.value?.joints 的结果；value：当前字段或点位的实际取值；joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度
  return Array.isArray(j) ? j.slice(0, 6) : [];
  // 把Array.isArray(j) ? j.slice(0, 6) : []作为当前函数的结果返回。
  // Array：JavaScript 数组辅助 API；isArray：本处声明的字段或类型，类型为 arg is any[]；j：本处保存 robot.value?.joints 的结果；slice：截取数组或字符串的一部分
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->
<!-- script 是当前使用的界面元素或组件 -->
<!-- 这一段完成了响应式状态与用户交互处理的定义，供页面渲染时使用。 -->

<!-- 这一段实现当前页面或组件的外观样式，服务于展示六个现场只读 IO 点位与设备示意。 -->
<style scoped>
/* 开始当前 Vue 组件的样式区域，设置页面元素的外观。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段为 .panel.overlay.right 对应的界面元素定义尺寸、布局或视觉样式。 */
.panel.overlay.right {
/* 对选择器 .panel.overlay.right 匹配的元素应用后续声明。 */
/* .panel.overlay.right 是这一组样式匹配的元素选择器 */
  position: absolute;
  /* position=absolute：设置定位方式。 */
  /* position 控制定位方式，这里取 absolute */
  top: 14px;
  /* top=14px：设置该样式属性。 */
  /* top 控制当前元素的样式取值，这里取 14px */
  right: 14px;
  /* right=14px：设置该样式属性。 */
  /* right 控制当前元素的样式取值，这里取 14px */
  width: 260px;
  /* width=260px：设置宽度。 */
  /* width 控制宽度，这里取 260px */
  z-index: 5;
  /* z-index=5：设置该样式属性。 */
  /* z-index 控制重叠元素的层级，这里取 5 */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .panel.overlay.right 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
/* 这一段为 .panel-title 对应的界面元素定义尺寸、布局或视觉样式。 */
.panel-title {
/* 对选择器 .panel-title 匹配的元素应用后续声明。 */
/* .panel-title 是这一组样式匹配的元素选择器 */
  display: flex; align-items: center; justify-content: space-between;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；justify-content=space-between：控制主轴上的分布方式。 */
  /* display 控制元素布局方式，这里取 flex；align-items 控制交叉轴对齐方式，这里取 center；justify-content 控制主轴内容排列方式，这里取 space-between */
  font-size: 13px; color: var(--text); margin-bottom: 8px;
  /* font-size=13px：设置字号；color=var(--text)：设置文字颜色；margin-bottom=8px：设置该样式属性。 */
  /* font-size 控制字体大小，这里取 13px；color 控制文字颜色，这里取 var(--text)；margin-bottom 控制当前元素的样式取值，这里取 8px */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .panel-title 的样式设置，浏览器渲染匹配元素时应用这些规则。 */

/* 报警行(脉冲红点) */
/* 这一段为 .alarm-row 对应的界面元素定义尺寸、布局或视觉样式。 */
.alarm-row {
/* 对选择器 .alarm-row 匹配的元素应用后续声明。 */
/* .alarm-row 是这一组样式匹配的元素选择器 */
  display: flex; align-items: center; gap: 8px;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=8px：设置子元素间距。 */
  /* display 控制元素布局方式，这里取 flex；align-items 控制交叉轴对齐方式，这里取 center；gap 控制子元素间距，这里取 8px */
  padding: 6px 8px; margin-bottom: 8px;
  /* padding=6px 8px：设置内边距；margin-bottom=8px：设置该样式属性。 */
  /* padding 控制内边距，这里取 6px 8px；margin-bottom 控制当前元素的样式取值，这里取 8px */
  background: rgba(220, 38, 38, 0.12);
  /* background=rgba(220, 38, 38, 0.12)：设置背景。 */
  /* background 控制背景，这里取 rgba(220, 38, 38, 0.12) */
  border: 1px solid rgba(220, 38, 38, 0.4);
  /* border=1px solid rgba(220, 38, 38, 0.4)：设置边框。 */
  /* border 控制边框，这里取 1px solid rgba(220, 38, 38, 0.4) */
  border-radius: 6px;
  /* border-radius=6px：设置圆角。 */
  /* border-radius 控制圆角半径，这里取 6px */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .alarm-row 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
/* 这一段为 .alarm-light 对应的界面元素定义尺寸、布局或视觉样式。 */
.alarm-light {
/* 对选择器 .alarm-light 匹配的元素应用后续声明。 */
/* .alarm-light 是这一组样式匹配的元素选择器 */
  width: 10px; height: 10px; border-radius: 50%;
  /* width=10px：设置宽度；height=10px：设置高度；border-radius=50%：设置圆角。 */
  /* width 控制宽度，这里取 10px；height 控制高度，这里取 10px；border-radius 控制圆角半径，这里取 50% */
  background: #ef4444; box-shadow: 0 0 8px #ef4444;
  /* background=#ef4444：设置背景；box-shadow=0 0 8px #ef4444：设置阴影。 */
  /* background 控制背景，这里取 #ef4444；box-shadow 控制阴影，这里取 0 0 8px #ef4444 */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .alarm-light 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.alarm-light.pulse { animation: pulse 1s infinite; }
/* animation=pulse 1s infinite：设置该样式属性。 */
/* animation 控制当前元素的样式取值，这里取 pulse 1s infinite */
.alarm-text { font-size: 12px; color: #fca5a5; }
/* font-size=12px：设置字号；color=#fca5a5：设置文字颜色。 */
/* font-size 控制字体大小，这里取 12px；color 控制文字颜色，这里取 #fca5a5 */
/* 这一段为 @keyframes pulse 对应的界面元素定义尺寸、布局或视觉样式。 */
@keyframes pulse {
/* 对选择器 @keyframes pulse 匹配的元素应用后续声明。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
  0%, 100% { opacity: 1; }
  /* opacity=1：设置透明度。 */
  /* opacity 控制不透明程度，这里取 1 */
  50% { opacity: 0.35; }
  /* opacity=0.35：设置透明度。 */
  /* opacity 控制不透明程度，这里取 0.35 */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 @keyframes pulse 的样式设置，浏览器渲染匹配元素时应用这些规则。 */

/* I/O 灯矩阵 */
/* 这一段为 .io-grid 对应的界面元素定义尺寸、布局或视觉样式。 */
.io-grid {
/* 对选择器 .io-grid 匹配的元素应用后续声明。 */
/* .io-grid 是这一组样式匹配的元素选择器 */
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
  /* display=grid：决定元素如何布局或显示；grid-template-columns=1fr 1fr：定义网格列布局；gap=6px：设置子元素间距。 */
  /* display 控制元素布局方式，这里取 grid；grid-template-columns 控制网格列的尺寸安排，这里取 1fr 1fr；gap 控制子元素间距，这里取 6px */
  padding: 6px 0; margin-bottom: 6px;
  /* padding=6px 0：设置内边距；margin-bottom=6px：设置该样式属性。 */
  /* padding 控制内边距，这里取 6px 0；margin-bottom 控制当前元素的样式取值，这里取 6px */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .io-grid 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
/* 这一段为 .io-cell 对应的界面元素定义尺寸、布局或视觉样式。 */
.io-cell {
/* 对选择器 .io-cell 匹配的元素应用后续声明。 */
/* .io-cell 是这一组样式匹配的元素选择器 */
  display: flex; align-items: center; gap: 6px;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=6px：设置子元素间距。 */
  /* display 控制元素布局方式，这里取 flex；align-items 控制交叉轴对齐方式，这里取 center；gap 控制子元素间距，这里取 6px */
  font-size: 11px;
  /* font-size=11px：设置字号。 */
  /* font-size 控制字体大小，这里取 11px */
  padding: 4px 6px;
  /* padding=4px 6px：设置内边距。 */
  /* padding 控制内边距，这里取 4px 6px */
  background: rgba(255,255,255,0.02);
  /* background=rgba(255,255,255,0.02)：设置背景。 */
  /* background 控制背景，这里取 rgba(255,255,255,0.02) */
  border-radius: 4px;
  /* border-radius=4px：设置圆角。 */
  /* border-radius 控制圆角半径，这里取 4px */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .io-cell 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.io-dot {
/* 对选择器 .io-dot 匹配的元素应用后续声明。 */
/* .io-dot 是这一组样式匹配的元素选择器 */
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  /* width=8px：设置宽度；height=8px：设置高度；border-radius=50%：设置圆角；flex-shrink=0：设置该样式属性。 */
  /* width 控制宽度，这里取 8px；height 控制高度，这里取 8px；border-radius 控制圆角半径，这里取 50%；flex-shrink 控制当前元素的样式取值，这里取 0 */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
.io-dot.ok   { background: #22c55e; box-shadow: 0 0 4px #22c55e; }
/* background=#22c55e：设置背景；box-shadow=0 0 4px #22c55e：设置阴影。 */
/* background 控制背景，这里取 #22c55e；box-shadow 控制阴影，这里取 0 0 4px #22c55e */
.io-dot.ng   { background: #ef4444; box-shadow: 0 0 4px #ef4444; }
/* background=#ef4444：设置背景；box-shadow=0 0 4px #ef4444：设置阴影。 */
/* background 控制背景，这里取 #ef4444；box-shadow 控制阴影，这里取 0 0 4px #ef4444 */
.io-dot.warn { background: #f59e0b; box-shadow: 0 0 4px #f59e0b; }
/* background=#f59e0b：设置背景；box-shadow=0 0 4px #f59e0b：设置阴影。 */
/* background 控制背景，这里取 #f59e0b；box-shadow 控制阴影，这里取 0 0 4px #f59e0b */
.io-dot.idle { background: #475569; }
/* background=#475569：设置背景。 */
/* background 控制背景，这里取 #475569 */
.io-label { color: var(--text-dim); width: 28px; }
/* color=var(--text-dim)：设置文字颜色；width=28px：设置宽度。 */
/* color 控制文字颜色，这里取 var(--text-dim)；width 控制宽度，这里取 28px */
.io-val { color: var(--text); font-weight: 500; }
/* color=var(--text)：设置文字颜色；font-weight=500：设置字重。 */
/* color 控制文字颜色，这里取 var(--text)；font-weight 控制字体粗细，这里取 500 */

/* 六轴关节角 */
.joints { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; text-align: center; padding: 6px 0; }
/* display=grid：决定元素如何布局或显示；grid-template-columns=repeat(6, 1fr)：定义网格列布局；gap=4px：设置子元素间距；text-align=center：设置该样式属性；padding=6px 0：设置内边距。 */
/* display 控制元素布局方式，这里取 grid；grid-template-columns 控制网格列的尺寸安排，这里取 repeat(6, 1fr)；gap 控制子元素间距，这里取 4px；text-align 控制当前元素的样式取值，这里取 center；padding 控制内边距，这里取 6px 0 */
.joints .val { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--accent); }
/* font-size=13px：设置字号；font-weight=600：设置字重；font-variant-numeric=tabular-nums：设置该样式属性；color=var(--accent)：设置文字颜色。 */
/* font-size 控制字体大小，这里取 13px；font-weight 控制字体粗细，这里取 600；font-variant-numeric 控制当前元素的样式取值，这里取 tabular-nums；color 控制文字颜色，这里取 var(--accent) */
.joints .lbl { font-size: 9px; color: var(--text-dim); margin-top: 1px; }
/* font-size=9px：设置字号；color=var(--text-dim)：设置文字颜色；margin-top=1px：设置该样式属性。 */
/* font-size 控制字体大小，这里取 9px；color 控制文字颜色，这里取 var(--text-dim)；margin-top 控制当前元素的样式取值，这里取 1px */

/* 数值字段样式已随 良品/不良/节拍/倍率 一同移除 */

/* 这一段为 .meta 对应的界面元素定义尺寸、布局或视觉样式。 */
.meta {
/* 对选择器 .meta 匹配的元素应用后续声明。 */
/* .meta 是这一组样式匹配的元素选择器 */
  margin-top: 8px; padding-top: 6px;
  /* margin-top=8px：设置该样式属性；padding-top=6px：设置该样式属性。 */
  /* margin-top 控制当前元素的样式取值，这里取 8px；padding-top 控制当前元素的样式取值，这里取 6px */
  border-top: 1px dashed var(--panel-border);
  /* border-top=1px dashed var(--panel-border)：设置该样式属性。 */
  /* border-top 控制当前元素的样式取值，这里取 1px dashed var(--panel-border) */
  display: flex; justify-content: space-between;
  /* display=flex：决定元素如何布局或显示；justify-content=space-between：控制主轴上的分布方式。 */
  /* display 控制元素布局方式，这里取 flex；justify-content 控制主轴内容排列方式，这里取 space-between */
  font-size: 11px; color: var(--text-dim);
  /* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色。 */
  /* font-size 控制字体大小，这里取 11px；color 控制文字颜色，这里取 var(--text-dim) */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .meta 的样式设置，浏览器渲染匹配元素时应用这些规则。 */

/* 这一段为 .ctrl-slot 对应的界面元素定义尺寸、布局或视觉样式。 */
.ctrl-slot {
/* 对选择器 .ctrl-slot 匹配的元素应用后续声明。 */
/* .ctrl-slot 是这一组样式匹配的元素选择器 */
  margin-top: 10px; padding-top: 10px;
  /* margin-top=10px：设置该样式属性；padding-top=10px：设置该样式属性。 */
  /* margin-top 控制当前元素的样式取值，这里取 10px；padding-top 控制当前元素的样式取值，这里取 10px */
  border-top: 1px dashed var(--panel-border);
  /* border-top=1px dashed var(--panel-border)：设置该样式属性。 */
  /* border-top 控制当前元素的样式取值，这里取 1px dashed var(--panel-border) */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .ctrl-slot 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
<!-- style 是当前使用的界面元素或组件 -->
<!-- 这一段提供了展示六个现场只读 IO 点位与设备示意所需的定义和处理逻辑，结果交由调用方或运行环境使用。 -->
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
