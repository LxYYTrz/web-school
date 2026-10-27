<!-- 这一段负责汇总展示产线 IO 信号与点位说明，为后续代码提供当前文件的处理入口。 -->
<!-- 这一段实现界面模板，服务于汇总展示产线 IO 信号与点位说明。 -->
<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
<!-- template 是当前使用的界面元素或组件 -->
  <div class="io-page">
  <!-- 渲染容器，应用 io-page 样式类。 -->
  <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-page -->
    <!-- 概览:三个传感器灯 + 灯色 + 数据新鲜度 -->
    <div class="cards">
    <!-- 渲染容器，应用 cards 样式类。 -->
    <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 cards -->
      <div v-for="p in sensorCards" :key="p.field" class="panel card">
      <!-- 渲染容器，应用 panel card 样式类，按集合重复生成（p in sensorCards）。 -->
      <!-- div 是当前使用的界面元素或组件；v-for 表示按数据列表重复生成元素，当前值为 p in sensorCards；:key 表示把表达式结果动态绑定到组件属性，当前值为 p.field；class 表示应用的样式类，当前值为 panel card -->
        <div class="card-value small">
        <!-- 渲染容器，应用 card-value small 样式类。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 card-value small -->
          <i class="io-dot" :class="ioTone(p, val(p))" /> {{ ioValueText(p, val(p)) }}
          <!-- 渲染图标或状态点，应用 io-dot 样式类，其中显示 ioValueText(p, val(p)) 的计算结果。 -->
          <!-- i 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-dot；:class 表示把表达式结果动态绑定到组件属性，当前值为 ioTone(p, val(p))；双花括号把其中表达式的计算结果插入界面文字 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
        <div class="card-label">{{ p.label }}</div>
        <!-- 渲染容器，应用 card-label 样式类，其中显示 p.label 的计算结果。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 card-label；双花括号把其中表达式的计算结果插入界面文字 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
      <div class="panel card">
      <!-- 渲染容器，应用 panel card 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 panel card -->
        <div class="card-value small">
        <!-- 渲染容器，应用 card-value small 样式类。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 card-value small -->
          <i class="io-dot" :class="ioTone(lightPoint, val(lightPoint))" />
          <!-- 渲染图标或状态点，应用 io-dot 样式类。 -->
          <!-- i 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-dot；:class 表示把表达式结果动态绑定到组件属性，当前值为 ioTone(lightPoint, val(lightPoint)) -->
          {{ ioValueText(lightPoint, val(lightPoint)) }}
          <!-- 把模板表达式计算出的实时状态显示在界面中。 -->
          <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
        <div class="card-label">{{ lightPoint.label }}</div>
        <!-- 渲染容器，应用 card-label 样式类，其中显示 lightPoint.label 的计算结果。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 card-label；双花括号把其中表达式的计算结果插入界面文字 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
      <div class="panel card">
      <!-- 渲染容器，应用 panel card 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 panel card -->
        <div class="card-value small" :class="stale ? 'stale' : ''">
        <!-- 渲染容器，应用 card-value small 样式类。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 card-value small；:class 表示把表达式结果动态绑定到组件属性，当前值为 stale ? 'stale' : '' -->
          <i class="io-dot" :class="stale ? 'warn' : 'ok'" />
          <!-- 渲染图标或状态点，应用 io-dot 样式类。 -->
          <!-- i 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-dot；:class 表示把表达式结果动态绑定到组件属性，当前值为 stale ? 'warn' : 'ok' -->
          {{ stale ? '数据停滞' : '刷新中' }}
          <!-- 把模板表达式计算出的实时状态显示在界面中。 -->
          <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
        <div class="card-label">更新 {{ updatedText }}</div>
        <!-- 渲染容器，应用 card-label 样式类，其中显示 updatedText 的计算结果。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 card-label；双花括号把其中表达式的计算结果插入界面文字 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
      <div class="panel card">
      <!-- 渲染容器，应用 panel card 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 panel card -->
        <div class="card-value small">
        <!-- 渲染容器，应用 card-value small 样式类。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 card-value small -->
          <i class="io-dot" :class="edgeOnline ? 'ok' : 'ng'" /> {{ edgeText }}
          <!-- 渲染图标或状态点，应用 io-dot 样式类，其中显示 edgeText 的计算结果。 -->
          <!-- i 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-dot；:class 表示把表达式结果动态绑定到组件属性，当前值为 edgeOnline ? 'ok' : 'ng'；双花括号把其中表达式的计算结果插入界面文字 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
        <div class="card-label">边缘网关</div>
        <!-- 渲染容器，应用 card-label 样式类。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 card-label -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->

    <!-- 点位明细:与 DB3 MB_SERVER HOLD 区 word 11~16 一一对应 -->
    <div class="panel table">
    <!-- 渲染容器，应用 panel table 样式类。 -->
    <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 panel table -->
      <div class="panel-title">
      <!-- 渲染容器，应用 panel-title 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 panel-title -->
        <span>IO 点位明细(只读)</span>
        <!-- 在界面中配置 span 元素及其内容或事件绑定。 -->
        <!-- span 是当前使用的界面元素或组件 -->
        <span class="hint">DB3 · word 11~16 · {{ IO_POINTS.length }} 点</span>
        <!-- 渲染行内文字，应用 hint 样式类，其中显示 IO_POINTS.length 的计算结果。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 hint；双花括号把其中表达式的计算结果插入界面文字 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
      <div class="head">
      <!-- 渲染容器，应用 head 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 head -->
        <span class="col-idx">#</span>
        <!-- 渲染行内文字，应用 col-idx 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 col-idx -->
        <span class="col-word">字地址</span>
        <!-- 渲染行内文字，应用 col-word 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 col-word -->
        <span class="col-field">字段</span>
        <!-- 渲染行内文字，应用 col-field 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 col-field -->
        <span class="col-label">信号含义</span>
        <!-- 渲染行内文字，应用 col-label 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 col-label -->
        <span class="col-value">当前值</span>
        <!-- 渲染行内文字，应用 col-value 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 col-value -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
      <div v-if="!io" class="empty">
      <!-- 渲染容器，应用 empty 样式类，条件成立时显示（!io）。 -->
      <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 !io；class 表示应用的样式类，当前值为 empty -->
        {{ stale ? '未收到 IO 数据 —— 请检查边缘采集器与 MQTT 链路' : '等待 IO 数据…' }}
        <!-- 把模板表达式计算出的实时状态显示在界面中。 -->
        <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
      <div v-for="p in IO_POINTS" :key="p.field" class="row">
      <!-- 渲染容器，应用 row 样式类，按集合重复生成（p in IO_POINTS）。 -->
      <!-- div 是当前使用的界面元素或组件；v-for 表示按数据列表重复生成元素，当前值为 p in IO_POINTS；:key 表示把表达式结果动态绑定到组件属性，当前值为 p.field；class 表示应用的样式类，当前值为 row -->
        <span class="col-idx">{{ p.index }}</span>
        <!-- 渲染行内文字，应用 col-idx 样式类，其中显示 p.index 的计算结果。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 col-idx；双花括号把其中表达式的计算结果插入界面文字 -->
        <span class="col-word">{{ p.word }}</span>
        <!-- 渲染行内文字，应用 col-word 样式类，其中显示 p.word 的计算结果。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 col-word；双花括号把其中表达式的计算结果插入界面文字 -->
        <span class="col-field">{{ p.field }}</span>
        <!-- 渲染行内文字，应用 col-field 样式类，其中显示 p.field 的计算结果。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 col-field；双花括号把其中表达式的计算结果插入界面文字 -->
        <span class="col-label">{{ p.label }}</span>
        <!-- 渲染行内文字，应用 col-label 样式类，其中显示 p.label 的计算结果。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 col-label；双花括号把其中表达式的计算结果插入界面文字 -->
        <span class="col-value">
        <!-- 渲染行内文字，应用 col-value 样式类。 -->
        <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 col-value -->
          <i class="io-dot" :class="ioTone(p, val(p))" />
          <!-- 渲染图标或状态点，应用 io-dot 样式类。 -->
          <!-- i 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 io-dot；:class 表示把表达式结果动态绑定到组件属性，当前值为 ioTone(p, val(p)) -->
          <span class="text">{{ ioValueText(p, val(p)) }}</span>
          <!-- 渲染行内文字，应用 text 样式类，其中显示 ioValueText(p, val(p)) 的计算结果。 -->
          <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 text；双花括号把其中表达式的计算结果插入界面文字 -->
          <span class="raw">{{ val(p) ?? '—' }}</span>
          <!-- 渲染行内文字，应用 raw 样式类，其中显示 val(p) ?? '—' 的计算结果。 -->
          <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 raw；双花括号把其中表达式的计算结果插入界面文字 -->
        </span>
        <!-- 结束 span 元素及其中的内容。 -->
        <!-- span 是当前使用的界面元素或组件 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->

    <p class="foot">
    <!-- 渲染段落，应用 foot 样式类。 -->
    <!-- p 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 foot -->
      本页只读,不向 PLC 写入任何值。控制指令见孪生页控制区(仅 level ≥ 2 可见)。
      <!-- 在当前页面元素中直接显示文字「本页只读,不向 PLC 写入任何值。控制指令见孪生页控制区(仅 level ≥ 2 可见)。」。 -->
      <!-- 本页只读,不向 PLC 写入任何值。控制指令见孪生页控制区(仅 level ≥ 2 可见)。 是直接显示在当前界面元素中的文字内容 -->
    </p>
    <!-- 结束 p 组件或元素对应的界面区域。 -->
    <!-- p 是当前使用的界面元素或组件 -->
  </div>
  <!-- 结束 div 元素及其中的内容。 -->
  <!-- div 是当前使用的界面元素或组件 -->
</template>
<!-- 结束 template 组件或元素对应的界面区域。 -->
<!-- template 是当前使用的界面元素或组件 -->
<!-- 这一段完成了界面布局和数据展示的定义，供页面渲染时使用。 -->

<!-- 这一段实现组件状态与事件处理，服务于汇总展示产线 IO 信号与点位说明。 -->
<script setup lang="ts">
// 开始当前 Vue 组件的脚本区域，定义页面状态与交互逻辑。
// script 是 Vue 组件逻辑区；setup 让顶层声明可直接用于模板；lang="ts" 指定使用 TypeScript
import { computed, onUnmounted, ref } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。
// computed：Vue 根据其他响应式值计算并缓存结果的函数；onUnmounted：Vue 注册组件卸载清理回调的函数；ref：Vue 创建可通过 .value 读写的响应式引用
import { useLineData } from '../composables/useLineData';
// 从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。
// useLineData：从 ../composables/useLineData 导入的对象，用于本文件的调用或类型约束
import {
// 开始列出本文件从其他模块导入的类型或运行时对象。
// 大括号内逐项列出从后续模块路径导入的类型或运行时对象
  IO_POINTS, ioPointByField, ioValueText, ioTone,
  // 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
  // IO_POINTS：从 ../services/ioPoints 导入的对象，用于本文件的调用或类型约束；ioPointByField：从 ../services/ioPoints 导入的对象，用于本文件的调用或类型约束；ioValueText：从 ../services/ioPoints 导入的对象，用于本文件的调用或类型约束；ioTone：从 ../services/ioPoints 导入的对象，用于本文件的调用或类型约束
  type IoField, type IoPoint,
  // 定义 IoField，约束或实现本模块涉及的数据和行为。
  // IoField：从 ../services/ioPoints 导入的对象，用于本文件的调用或类型约束；IoPoint：从 ../services/ioPoints 导入的对象，用于本文件的调用或类型约束
} from '../services/ioPoints';
// 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
// 本行完成上面一层已说明的函数、分支或对象配置

const { io, edgeOnline, edgeText } = useLineData();
// 取得按产线编码复用的数据单例，供多个页面共享状态。
// io：现场 IO 信号对象或当前 IO 状态帧；useLineData：从 ../composables/useLineData 导入的对象，用于本文件的调用或类型约束

// Redis 快照 TTL 60s,这里用 5s:edge 跟随 200ms 轮询,5s 还没新帧就是真出问题了
const STALE_MS = 5_000;
// 根据 5_000 设置 STALE_MS，供当前流程后续使用。
// STALE_MS：本处保存 5_000 的结果

// 这里为 IO 页面维护一个每 500 毫秒更新的浏览器时钟，促使 stale 的计算定期重新执行。
// stale 比较 now 与 io.ts：没有 IO 帧，或帧时间超过 STALE_MS（5 秒），页面就显示数据停滞。
// 这是网页对 IO 数据新鲜度的判断，不会删除 Redis 快照，也不保证自动清空浏览器保留的上次点位值。
// 两端时间参与比较，现场数据时钟与浏览器时钟存在偏差时也会影响这个判断。

const now = ref(Date.now());
// 保存浏览器当前时间，下面定时更新它，以便 stale 计算能持续判断帧是否停滞。
// now 是 ref；io.ts 是上报帧时间；STALE_MS 为 5000 毫秒，定时器每 500 毫秒更新时间，和 Redis 60 秒有效期是不同判断。
const timer = setInterval(() => { now.value = Date.now(); }, 500);
// 启动周期执行的定时任务，将结果保存或写入 timer。
// timer：周期任务计时器句柄；setInterval：按固定间隔重复执行回调并返回计时器句柄；now：本处保存 ref(Date.now()) 的结果；value：当前字段或点位的实际取值；Date：JavaScript 日期与当前时间 API
onUnmounted(() => clearInterval(timer));
// 创建或使用Vue 注册组件卸载清理回调的函数。
// onUnmounted：Vue 注册组件卸载清理回调的函数；clearInterval：停止指定的周期计时器；timer：周期任务计时器句柄

const stale = computed(() => !io.value || now.value - io.value.ts > STALE_MS);
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 stale。
// stale：本处保存 computed(() => !io.value || now.value - io.value.ts > STALE_… 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数；io：现场 IO 信号对象或当前 IO 状态帧；value：当前字段或点位的实际取值；now：本处保存 ref(Date.now()) 的结果；ts：数据产生时的毫秒时间戳；STALE_MS：本处保存 5_000 的结果

// 这一段定义 val，用于取得当前 IO 字段的值，缺失时按空值显示。
function val(p: IoPoint): number | null | undefined {
// 定义 val，用于取得当前 IO 字段的值，缺失时按空值显示。
// val：取得当前 IO 字段的值，缺失时按空值显示；p：当前方法接收的参数，类型为 IoPoint；IoPoint：从 ../services/ioPoints 导入的对象，用于本文件的调用或类型约束
  return (io.value?.io as Record<IoField, number | null> | undefined)?.[p.field];
  // 把(io.value?.io as Record<IoField, number | null> | undefined)?.[p.field]作为当前函数的结果返回。
  // io：现场 IO 信号对象或当前 IO 状态帧；value：当前字段或点位的实际取值；Record：TypeScript 的键值对象类型，用键类型约束属性、值类型约束内容；IoField：从 ../services/ioPoints 导入的对象，用于本文件的调用或类型约束；p：当前方法接收的参数，类型为 IoPoint；field：本处声明的字段或类型，类型为 IoField
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了取得当前 IO 字段的值，缺失时按空值显示的实现；实际结果由运行时输入和执行分支决定。

const sensorCards = computed(() =>
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 sensorCards。
// sensorCards：本处保存 computed(() => (['sensorIn', 'sensorArrive', 'sensorRetreat'… 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数
  (['sensorIn', 'sensorArrive', 'sensorRetreat'] as IoField[]).map(ioPointByField),
  // 将集合中的每个元素转换为新值，返回新的数组或迭代结果。
  // IoField：从 ../services/ioPoints 导入的对象，用于本文件的调用或类型约束；map：将集合中的每个元素转换为新值，返回新的数组或迭代结果；ioPointByField：从 ../services/ioPoints 导入的对象，用于本文件的调用或类型约束
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
const lightPoint = ioPointByField('lightColor');
// 按信号字段查找 IO 点位说明，将结果保存或写入 lightPoint。
// lightPoint：本处保存 ioPointByField('lightColor') 的结果；ioPointByField：从 ../services/ioPoints 导入的对象，用于本文件的调用或类型约束

const updatedText = computed(() =>
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 updatedText。
// updatedText：本处保存 computed(() => io.value ? new Date(io.value.ts).toLocaleTime… 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数
  io.value ? new Date(io.value.ts).toLocaleTimeString('zh-CN', { hour12: false }) : '—',
  // 执行 Date 对应的本地处理，使用本行提供的数据。
  // io：现场 IO 信号对象或当前 IO 状态帧；value：当前字段或点位的实际取值；Date：JavaScript 日期与当前时间 API；ts：数据产生时的毫秒时间戳；toLocaleTimeString：本处声明的字段或类型，类型为 string
);
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->
<!-- script 是当前使用的界面元素或组件 -->
<!-- 这一段完成了响应式状态与用户交互处理的定义，供页面渲染时使用。 -->

<!-- 这一段实现当前页面或组件的外观样式，服务于汇总展示产线 IO 信号与点位说明。 -->
<style scoped>
/* 开始当前 Vue 组件的样式区域，设置页面元素的外观。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
.io-page { display: flex; flex-direction: column; gap: 14px; }
/* display=flex：决定元素如何布局或显示；flex-direction=column：设置该样式属性；gap=14px：设置子元素间距。 */
/* display 控制元素布局方式，这里取 flex；flex-direction 控制当前元素的样式取值，这里取 column；gap 控制子元素间距，这里取 14px */

.cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
/* display=grid：决定元素如何布局或显示；grid-template-columns=repeat(6, 1fr)：定义网格列布局；gap=12px：设置子元素间距。 */
/* display 控制元素布局方式，这里取 grid；grid-template-columns 控制网格列的尺寸安排，这里取 repeat(6, 1fr)；gap 控制子元素间距，这里取 12px */
.card { text-align: center; padding: 18px 10px; }
/* text-align=center：设置该样式属性；padding=18px 10px：设置内边距。 */
/* text-align 控制当前元素的样式取值，这里取 center；padding 控制内边距，这里取 18px 10px */
.card-value { font-size: 15px; font-weight: 600; display: inline-flex; align-items: center; gap: 7px; }
/* font-size=15px：设置字号；font-weight=600：设置字重；display=inline-flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=7px：设置子元素间距。 */
/* font-size 控制字体大小，这里取 15px；font-weight 控制字体粗细，这里取 600；display 控制元素布局方式，这里取 inline-flex；align-items 控制交叉轴对齐方式，这里取 center；gap 控制子元素间距，这里取 7px */
.card-value.small { display: inline-flex; }
/* display=inline-flex：决定元素如何布局或显示。 */
/* display 控制元素布局方式，这里取 inline-flex */
.card-value.stale { color: #f59e0b; }
/* color=#f59e0b：设置文字颜色。 */
/* color 控制文字颜色，这里取 #f59e0b */
.card-label { font-size: 12px; color: var(--text-dim); margin-top: 6px; }
/* font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色；margin-top=6px：设置该样式属性。 */
/* font-size 控制字体大小，这里取 12px；color 控制文字颜色，这里取 var(--text-dim)；margin-top 控制当前元素的样式取值，这里取 6px */

/* 灯点语义色。与 IoPanel 的 io-dot 一致;idle = 无信号(不是故障) */
.io-dot {
/* 对选择器 .io-dot 匹配的元素应用后续声明。 */
/* .io-dot 是这一组样式匹配的元素选择器 */
  width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0;
  /* width=9px：设置宽度；height=9px：设置高度；border-radius=50%：设置圆角；display=inline-block：决定元素如何布局或显示；flex-shrink=0：设置该样式属性。 */
  /* width 控制宽度，这里取 9px；height 控制高度，这里取 9px；border-radius 控制圆角半径，这里取 50%；display 控制元素布局方式，这里取 inline-block；flex-shrink 控制当前元素的样式取值，这里取 0 */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
.io-dot.ok   { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
/* background=#22c55e：设置背景；box-shadow=0 0 6px #22c55e：设置阴影。 */
/* background 控制背景，这里取 #22c55e；box-shadow 控制阴影，这里取 0 0 6px #22c55e */
.io-dot.act  { background: #2ecc71; box-shadow: 0 0 6px #2ecc71; }
/* background=#2ecc71：设置背景；box-shadow=0 0 6px #2ecc71：设置阴影。 */
/* background 控制背景，这里取 #2ecc71；box-shadow 控制阴影，这里取 0 0 6px #2ecc71 */
.io-dot.warn { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
/* background=#f59e0b：设置背景；box-shadow=0 0 6px #f59e0b：设置阴影。 */
/* background 控制背景，这里取 #f59e0b；box-shadow 控制阴影，这里取 0 0 6px #f59e0b */
.io-dot.ng   { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
/* background=#ef4444：设置背景；box-shadow=0 0 6px #ef4444：设置阴影。 */
/* background 控制背景，这里取 #ef4444；box-shadow 控制阴影，这里取 0 0 6px #ef4444 */
.io-dot.off, .io-dot.idle { background: #475569; }
/* background=#475569：设置背景。 */
/* background 控制背景，这里取 #475569 */

.table { padding-bottom: 6px; }
/* padding-bottom=6px：设置该样式属性。 */
/* padding-bottom 控制当前元素的样式取值，这里取 6px */
.hint { font-size: 11px; color: var(--text-dim); }
/* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色。 */
/* font-size 控制字体大小，这里取 11px；color 控制文字颜色，这里取 var(--text-dim) */
.empty { text-align: center; color: var(--text-dim); padding: 40px 0; }
/* text-align=center：设置该样式属性；color=var(--text-dim)：设置文字颜色；padding=40px 0：设置内边距。 */
/* text-align 控制当前元素的样式取值，这里取 center；color 控制文字颜色，这里取 var(--text-dim)；padding 控制内边距，这里取 40px 0 */

/* 这一段为 .head, .row 对应的界面元素定义尺寸、布局或视觉样式。 */
.head, .row {
/* 对选择器 .head, .row 匹配的元素应用后续声明。 */
/* .head, .row 是这一组样式匹配的元素选择器 */
  display: grid;
  /* display=grid：决定元素如何布局或显示。 */
  /* display 控制元素布局方式，这里取 grid */
  grid-template-columns: 48px 88px 150px 1fr 240px;
  /* grid-template-columns=48px 88px 150px 1fr 240px：定义网格列布局。 */
  /* grid-template-columns 控制网格列的尺寸安排，这里取 48px 88px 150px 1fr 240px */
  align-items: center;
  /* align-items=center：控制交叉轴上的对齐方式。 */
  /* align-items 控制交叉轴对齐方式，这里取 center */
  gap: 10px;
  /* gap=10px：设置子元素间距。 */
  /* gap 控制子元素间距，这里取 10px */
  padding: 8px;
  /* padding=8px：设置内边距。 */
  /* padding 控制内边距，这里取 8px */
  font-size: 13px;
  /* font-size=13px：设置字号。 */
  /* font-size 控制字体大小，这里取 13px */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .head, .row 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.head { font-size: 12px; color: var(--text-dim); border-bottom: 1px solid var(--panel-border); }
/* font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色；border-bottom=1px solid var(--panel-border)：设置该样式属性。 */
/* font-size 控制字体大小，这里取 12px；color 控制文字颜色，这里取 var(--text-dim)；border-bottom 控制当前元素的样式取值，这里取 1px solid var(--panel-border) */
.row:nth-child(odd) { background: rgba(255, 255, 255, 0.02); }
/* row=nth-child(odd) { background: rgba(255, 255, 255, 0.02)：设置该样式属性。 */
/* row 控制当前元素的样式取值，这里取 nth-child(odd)；background 控制背景，这里取 rgba(255, 255, 255, 0.02) */

.col-idx, .col-word { color: var(--text-dim); font-variant-numeric: tabular-nums; }
/* color=var(--text-dim)：设置文字颜色；font-variant-numeric=tabular-nums：设置该样式属性。 */
/* color 控制文字颜色，这里取 var(--text-dim)；font-variant-numeric 控制当前元素的样式取值，这里取 tabular-nums */
.col-field { font-family: ui-monospace, Consolas, monospace; }
/* font-family=ui-monospace, Consolas, monospace：设置该样式属性。 */
/* font-family 控制当前元素的样式取值，这里取 ui-monospace, Consolas, monospace */
.col-value { display: inline-flex; align-items: center; gap: 8px; }
/* display=inline-flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=8px：设置子元素间距。 */
/* display 控制元素布局方式，这里取 inline-flex；align-items 控制交叉轴对齐方式，这里取 center；gap 控制子元素间距，这里取 8px */
.col-value .text { min-width: 56px; }
/* min-width=56px：设置最小宽度。 */
/* min-width 控制最小宽度，这里取 56px */
.raw { color: var(--text-dim); font-size: 11px; font-variant-numeric: tabular-nums; }
/* color=var(--text-dim)：设置文字颜色；font-size=11px：设置字号；font-variant-numeric=tabular-nums：设置该样式属性。 */
/* color 控制文字颜色，这里取 var(--text-dim)；font-size 控制字体大小，这里取 11px；font-variant-numeric 控制当前元素的样式取值，这里取 tabular-nums */

.foot { margin: 0; font-size: 12px; color: var(--text-dim); }
/* margin=0：设置外边距；font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色。 */
/* margin 控制外边距，这里取 0；font-size 控制字体大小，这里取 12px；color 控制文字颜色，这里取 var(--text-dim) */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
<!-- style 是当前使用的界面元素或组件 -->
<!-- 这一段提供了汇总展示产线 IO 信号与点位说明所需的定义和处理逻辑，结果交由调用方或运行环境使用。 -->
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
