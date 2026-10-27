<!--
  <!-- 这一段负责展示机械臂三维场景、实时工序、IO 和操作面板，为后续代码提供当前文件的处理入口。 -->
  实时孪生页：useLineData 接收机器人关节角，watch 回调将角度写入
  RobotArm.setJoints()，Three.js 在下一帧渲染新姿态。
-->
<!-- 这一段实现界面模板，服务于展示机械臂三维场景、实时工序、IO 和操作面板。 -->
<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
<!-- template 是当前使用的界面元素或组件 -->
  <div class="twin-wrap">
  <!-- 渲染容器，应用 twin-wrap 样式类。 -->
  <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 twin-wrap -->
    <!-- 3D 画布容器。Three.js 会把 canvas 追加到这个 div 里 -->
    <div ref="host" class="canvas-host" />
    <!-- 渲染容器，应用 canvas-host 样式类。 -->
    <!-- div 是当前使用的界面元素或组件；ref 表示保存 DOM 节点或组件实例引用，当前值为 host；class 表示应用的样式类，当前值为 canvas-host -->

    <!-- 左:机器人关节实时角度 -->
    <div class="panel overlay left">
    <!-- 渲染容器，应用 panel overlay left 样式类。 -->
    <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 panel overlay left -->
      <div class="panel-title">
      <!-- 渲染容器，应用 panel-title 样式类。 -->
      <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 panel-title -->
        <span>机器人 ROBOT-01</span>
        <!-- 在界面中配置 span 元素及其内容或事件绑定。 -->
        <!-- span 是当前使用的界面元素或组件 -->
        <!-- 报警时标签变红并显示报警码，否则显示运行模式 -->
        <el-tag v-if="robot" size="small" effect="plain" :type="robot.alarmCode ? 'danger' : 'success'">
        <!-- 渲染状态标签，条件成立时显示（robot）。 关键字：v-if＝条件为真时才渲染。；设置 :type=robot.alarmCode ? ：选择组件外观或字段类型。 关键字：:＝属性动态绑定的简写。 -->
        <!-- el-tag 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 robot；size 表示组件尺寸，当前值为 small；effect 表示组件视觉风格，当前值为 plain；:type 表示把表达式结果动态绑定到组件属性，当前值为 robot.alarmCode ? 'danger' : 'succe… -->
          {{ robot.alarmCode ? `报警 #${robot.alarmCode}` : robot.mode }}
          <!-- 把模板表达式计算出的实时状态显示在界面中。 -->
          <!-- 双花括号中的表达式由 Vue 按当前响应式状态求值，并插入界面文字 -->
        </el-tag>
        <!-- 结束 el-tag 元素及其中的内容。 -->
        <!-- el-tag 是当前使用的界面元素或组件 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->

      <!-- 有数据时：6 行关节角度刻度条 -->
      <div v-if="robot" class="joints">
      <!-- 渲染容器，应用 joints 样式类，条件成立时显示（robot）。 -->
      <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 robot；class 表示应用的样式类，当前值为 joints -->
        <!-- v-for 遍历 6 个关节角 -->
        <div v-for="(deg, i) in robot.joints" :key="i" class="joint-row">
        <!-- 渲染容器，应用 joint-row 样式类，按集合重复生成（(deg, i) in robot.joints）。 -->
        <!-- div 是当前使用的界面元素或组件；v-for 表示按数据列表重复生成元素，当前值为 (deg, i) in robot.joints；:key 表示把表达式结果动态绑定到组件属性，当前值为 i；class 表示应用的样式类，当前值为 joint-row -->
          <span class="joint-label">J{{ i + 1 }}</span>
          <!-- 渲染行内文字，应用 joint-label 样式类，其中显示 i + 1 的计算结果。 -->
          <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 joint-label；双花括号把其中表达式的计算结果插入界面文字 -->
          <!-- 刻度条：marker 的 left 百分比由角度算出 -->
          <div class="joint-bar">
          <!-- 渲染容器，应用 joint-bar 样式类。 -->
          <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 joint-bar -->
            <div class="joint-marker" :style="{ left: markerPos(deg) }" />
            <!-- 渲染容器，应用 joint-marker 样式类。 -->
            <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 joint-marker；:style 表示把表达式结果动态绑定到组件属性，当前值为 { left: markerPos(deg) } -->
          </div>
          <!-- 结束 div 元素及其中的内容。 -->
          <!-- div 是当前使用的界面元素或组件 -->
          <span class="joint-deg">{{ deg.toFixed(1) }}°</span>
          <!-- 渲染行内文字，应用 joint-deg 样式类，其中显示 deg.toFixed(1) 的计算结果。 -->
          <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 joint-deg；双花括号把其中表达式的计算结果插入界面文字 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
      <!-- 无数据时的占位 -->

      <!-- robot 为空时显示等待文案，对应“尚未取得机器人帧”的页面状态。 -->
      <!-- 已经收到过的旧帧不会仅因 Redis 的 key 过期就被这里自动清空，是否仍有新数据需结合时间和实时链路判断。 -->

      <el-empty v-else description="等待机器人数据…" :image-size="60" />
      <!-- 渲染el-empty 元素或组件。 -->
      <!-- el-empty 是当前使用的界面元素或组件；v-else 表示前面条件都不成立时渲染；:image-size 表示把表达式结果动态绑定到组件属性，当前值为 60 -->

      <!-- 底部附加信息 -->
      <div v-if="robot" class="meta">
      <!-- 渲染容器，应用 meta 样式类，条件成立时显示（robot）。 -->
      <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 robot；class 表示应用的样式类，当前值为 meta -->
        <span>程序 {{ robot.program }}</span>
        <!-- 渲染行内文字，其中显示 robot.program 的计算结果。 -->
        <!-- span 是当前使用的界面元素或组件；双花括号把其中表达式的计算结果插入界面文字 -->
        <span>倍率 {{ robot.speedPct }}%</span>
        <!-- 渲染行内文字，其中显示 robot.speedPct 的计算结果。 -->
        <!-- span 是当前使用的界面元素或组件；双花括号把其中表达式的计算结果插入界面文字 -->
      </div>
      <!-- 结束 div 元素及其中的内容。 -->
      <!-- div 是当前使用的界面元素或组件 -->
    </div>
    <!-- 结束 div 元素及其中的内容。 -->
    <!-- div 是当前使用的界面元素或组件 -->

    <!-- 右:产线状态 + I/O 摘要 + 控制(契约 v1.1 路线 6) -->
    <IoPanel :can-command="auth.canCommand">
    <!-- 渲染IoPanel 元素或组件。 -->
    <!-- IoPanel 是当前使用的界面元素或组件；:can-command 表示把表达式结果动态绑定到组件属性，当前值为 auth.canCommand -->
      <template #controls>
      <!-- 渲染template 元素或组件。 -->
      <!-- template 是当前使用的界面元素或组件；#controls 表示将此区域放入组件指定名称的插槽 -->
        <ControlButtons />
        <!-- 渲染ControlButtons 元素或组件。 -->
        <!-- ControlButtons 是当前使用的界面元素或组件 -->
      </template>
      <!-- 结束 template 组件或元素对应的界面区域。 -->
      <!-- template 是当前使用的界面元素或组件 -->
    </IoPanel>
    <!-- 结束 IoPanel 元素及其中的内容。 -->
    <!-- IoPanel 是当前使用的界面元素或组件 -->

    <!-- 左下角操作提示 -->
    <div class="hint">拖拽旋转 · 滚轮缩放</div>
    <!-- 渲染容器，应用 hint 样式类。 -->
    <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 hint -->

    <!-- 服务断开时遮挡提示 -->
    <div v-if="!connected" class="lost">
    <!-- 渲染容器，应用 lost 样式类，条件成立时显示（!connected）。 -->
    <!-- div 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 !connected；class 表示应用的样式类，当前值为 lost -->
      <el-icon class="lost-icon"><WarningFilled /></el-icon>
      <!-- 渲染图标容器，应用 lost-icon 样式类。 -->
      <!-- el-icon 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 lost-icon -->
      与服务器连接断开,正在重连…
      <!-- 在当前页面元素中直接显示文字「与服务器连接断开,正在重连…」。 -->
      <!-- 与服务器连接断开,正在重连… 是直接显示在当前界面元素中的文字内容 -->
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

<!-- 这一段实现组件状态与事件处理，服务于展示机械臂三维场景、实时工序、IO 和操作面板。 -->
<script setup lang="ts">
// 开始当前 Vue 组件的脚本区域，定义页面状态与交互逻辑。
// script 是 Vue 组件逻辑区；setup 让顶层声明可直接用于模板；lang="ts" 指定使用 TypeScript
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。
// onBeforeUnmount：Vue 注册组件卸载前清理回调的函数；onMounted：Vue 注册组件挂载完成回调的函数；ref：Vue 创建可通过 .value 读写的响应式引用；watch：Vue 监听状态变化并执行回调的函数
import { WarningFilled } from '@element-plus/icons-vue';
// 从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。
// WarningFilled：从 @element-plus/icons-vue 导入的对象，用于本文件的调用或类型约束
import { useLineData } from '../composables/useLineData';
// 从 ../composables/useLineData 导入这一行列出的符号，供本文件调用。
// useLineData：从 ../composables/useLineData 导入的对象，用于本文件的调用或类型约束
import { useAuthStore } from '../stores/auth';
// 从 ../stores/auth 导入这一行列出的符号，供本文件调用。
// useAuthStore：项目定义的登录状态仓库入口
import { SceneManager } from '../three/SceneManager';
// 从 ../three/SceneManager 导入这一行列出的符号，供本文件调用。
// SceneManager：项目定义的 Three.js 场景管理类，负责渲染、相机与资源清理
import { RobotArm } from '../three/RobotArm';
// 从 ../three/RobotArm 导入这一行列出的符号，供本文件调用。
// RobotArm：项目定义的程序化六轴机械臂模型类
import IoPanel from '../components/IoPanel.vue';
// 从 ../components/IoPanel.vue 导入这一行列出的符号，供本文件调用。
// IoPanel：从 ../components/IoPanel.vue 导入的对象，用于本文件的调用或类型约束
import ControlButtons from '../components/ControlButtons.vue';
// 从 ../components/ControlButtons.vue 导入这一行列出的符号，供本文件调用。
// ControlButtons：从 ../components/ControlButtons.vue 导入的对象，用于本文件的调用或类型约束

const { robot, connected } = useLineData();
// 取得按产线编码复用的数据单例，供多个页面共享状态。
// connected：连接是否已建立的状态标记；useLineData：从 ../composables/useLineData 导入的对象，用于本文件的调用或类型约束
const auth = useAuthStore();
// 创建或使用项目定义的登录状态仓库入口，将结果保存或写入 auth。
// auth：Pinia 登录状态仓库实例；useAuthStore：项目定义的登录状态仓库入口

/**
 * 3D 画布的宿主 DOM 元素引用。
 * ref 在模板上声明后，Vue 会自动把它指向真实 DOM。
 * 注意：组件挂载前它是 undefined，所以 onMounted 里要先判空。
 */
const host = ref<HTMLElement>();
// 根据 ref<HTMLElement>() 设置 host，用于网络连接的目标主机地址。
// host：网络连接的目标主机地址；ref：Vue 创建可通过 .value 读写的响应式引用；HTMLElement：本处保存的局部数据，类型为 { prototype: HTMLElement; new(): HTMLElement; }
/** 场景管理器实例（负责渲染器/相机/灯光/主循环） */
let scene: SceneManager | null = null;
// 声明 scene，初始值由 null 计算得到，供当前处理流程继续使用。
// scene：Three.js 场景实例；SceneManager：项目定义的 Three.js 场景管理类，负责渲染、相机与资源清理
/** 机械臂模型实例 */
let arm: RobotArm | null = null;
// 声明 arm，初始值由 null 计算得到，供当前处理流程继续使用。
// arm：本处保存 null 的结果，类型为 RobotArm | null；RobotArm：项目定义的程序化六轴机械臂模型类

// 页面容器挂载后，先创建 SceneManager，再创建 RobotArm，将模型放入场景并开始绘制。
// host 是网页中的 DOM 容器；scene 与 arm 都是浏览器对象。现场数据尚未到达时，初始模型姿态不代表实测姿态。

onMounted(() => {
// 在页面容器已经挂载后，创建场景与机械臂模型，将模型加入场景并开始绘制。
// onMounted 是 Vue 生命周期钩子；host.value 是 DOM 容器；scene 和 arm 分别保存 SceneManager 与 RobotArm 实例。
  // 模板 ref 还没拿到 DOM（理论上不会发生，但类型系统要求判空）
  if (!host.value) return;
  // 检查(!host.value) return;，按判断结果进入对应的处理分支。
  // host：网络连接的目标主机地址；value：当前字段或点位的实际取值
  // 创建场景：渲染器 + 相机 + 灯光 + 地面 + 网格，自动 append canvas 到容器
  scene = new SceneManager(host.value);
  // 把右侧表达式的结果写入 scene。
  // scene：Three.js 场景实例；SceneManager：项目定义的 Three.js 场景管理类，负责渲染、相机与资源清理；host：网络连接的目标主机地址；value：当前字段或点位的实际取值
  // 创建机械臂模型（纯几何体拼出来的 6 轴结构）
  arm = new RobotArm();
  // 把右侧表达式的结果写入 arm。
  // arm：本处保存 null 的结果，类型为 RobotArm | null；RobotArm：项目定义的程序化六轴机械臂模型类
  // 把机械臂加入场景（group 是一个可整体变换的容器）
  scene.add(arm.group);
  // 将元素加入集合或将子节点挂到场景对象。
  // scene：Three.js 场景实例；add：将元素加入集合或将子节点挂到场景对象；arm：本处保存 null 的结果，类型为 RobotArm | null；group：组织机械臂或场景对象的父节点
  // 启动 requestAnimationFrame 渲染循环
  scene.start();
  // 启动 Three.js 的连续渲染循环。
  // scene：Three.js 场景实例；start：启动 Three.js 的连续渲染循环
});
// 启动 requestAnimationFrame 渲染循环。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

/**
 * 组件卸载前：释放 GPU 资源。
 * ★ 非常重要：不释放会导致用户来回切页面时显存/内存持续增长，最终浏览器崩溃。
 */
onBeforeUnmount(() => {
// 创建或使用Vue 注册组件卸载前清理回调的函数。
// onBeforeUnmount：Vue 注册组件卸载前清理回调的函数
  scene?.dispose();
  // 释放 GPU、材质、几何体或控制器资源。
  // scene：Three.js 场景实例；dispose：释放 GPU、材质、几何体或控制器资源
  scene = null;
  // 把右侧表达式的结果写入 scene。
  // scene：Three.js 场景实例
  arm = null;
  // 把右侧表达式的结果写入 arm。
  // arm：本处保存 null 的结果，类型为 RobotArm | null
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

// 实时驱动:10Hz 直接驱动已足够平滑;如需更丝滑可在此加插值
/**
 * 侦听 robot 变化 → 驱动 3D 模型。
 * 这是"数据 → 画面"的关键一行。
 */

// 这段承接机器人数据的显示分支：useLineData 更新 robot 后，watch 得到最新帧 r。
// 只有帧和模型都存在时才把 r.joints 交给 setJoints()；数组元素仍以度表示，度转弧度在 RobotArm 内部完成。
// setAlarm() 根据报警码更新模型显示。工序中文和 IO 点位值由另外的显示规则处理，不经过 setJoints()。

watch(robot, (r) => {
// 机器人共享状态变化时，取最新帧更新模型关节角和报警显示。
// robot 来自 useLineData()；r 是本次机器人帧；arm 是已创建的 RobotArm；r.joints 的元素是度数，弧度转换在模型内部进行。
  // 没有数据或模型还没建好就跳过
  if (!r || !arm) return;
  // 检查(!r || !arm) return;，按判断结果进入对应的处理分支。
  // r：当前方法接收的参数；arm：本处保存 null 的结果，类型为 RobotArm | null
  // 把 6 个关节角（度）写进模型
  arm.setJoints(r.joints);
  // 把六轴角度从度转换为弧度并更新机械臂关节节点。
  // arm：本处保存 null 的结果，类型为 RobotArm | null；setJoints：把六轴角度从度转换为弧度并更新机械臂关节节点；r：当前方法接收的参数；joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度
  // 报警码非 0 → 关节光环变红
  arm.setAlarm(r.alarmCode !== 0);
  // 根据报警状态调整机械臂关节环的发光效果。
  // arm：本处保存 null 的结果，类型为 RobotArm | null；setAlarm：根据报警状态调整机械臂关节环的发光效果；r：当前方法接收的参数；alarmCode：设备报警编号，0 表示无报警
});
// 报警码非 0 → 关节光环变红。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

// 角度 → 刻度条上的位置(量程 ±180°)
/**
 * 角度 → 刻度条上的位置（量程 ±180°）。
 * 把 [-180, 180] 线性映射到 [0%, 100%]，再夹紧防止越界。
 */
// 这一段定义 markerPos，用于根据 IO 点位名称计算三维场景中标记的位置。
function markerPos(deg: number) {
// 定义函数 markerPos。
// markerPos：根据 IO 点位名称计算三维场景中标记的位置；deg：当前方法接收的参数，类型为 number
  // 归一化：(角度 + 180) / 360
  const pct = ((deg + 180) / 360) * 100;
  // 根据 ((deg + 180) / 360) * 100 设置 pct，供当前流程后续使用。
  // pct：本处保存 ((deg + 180) / 360) * 100 的结果；deg：当前方法接收的参数，类型为 number
  // Math.min/max 夹紧到 [0,100]，再拼成 CSS 的百分比字符串
  return `${Math.min(100, Math.max(0, pct))}%`;
  // 把`${Math.min(100, Math.max(0, pct))}%`作为当前函数的结果返回。
  // Math：JavaScript 数学计算 API；min：本处声明的字段或类型，类型为 number；max：本处声明的字段或类型，类型为 number；pct：本处保存 ((deg + 180) / 360) * 100 的结果
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了根据 IO 点位名称计算三维场景中标记的位置的实现；实际结果由运行时输入和执行分支决定。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->
<!-- script 是当前使用的界面元素或组件 -->
<!-- 这一段完成了响应式状态与用户交互处理的定义，供页面渲染时使用。 -->

<!-- 这一段实现当前页面或组件的外观样式，服务于展示机械臂三维场景、实时工序、IO 和操作面板。 -->
<style scoped>
/* 开始当前 Vue 组件的样式区域，设置页面元素的外观。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* scoped：这些样式只作用于本组件的 DOM，不影响其他组件 */
.twin-wrap { position: relative; width: 100%; height: 100%; border-radius: 10px; overflow: hidden; }
/* position=relative：设置定位方式；width=100%：设置宽度；height=100%：设置高度；border-radius=10px：设置圆角；overflow=hidden：决定溢出内容如何处理。 */
/* position 控制定位方式，这里取 relative；width 控制宽度，这里取 100%；height 控制高度，这里取 100%；border-radius 控制圆角半径，这里取 10px；overflow 控制溢出内容的处理方式，这里取 hidden */
/* 画布容器铺满整个区域 */
.canvas-host { position: absolute; inset: 0; }
/* position=absolute：设置定位方式；inset=0：设置该样式属性。 */
/* position 控制定位方式，这里取 absolute；inset 控制当前元素的样式取值，这里取 0 */

/* 左右浮层面板：绝对定位在 3D 画布之上 */
.overlay { position: absolute; top: 14px; width: 240px; z-index: 5; }
/* position=absolute：设置定位方式；top=14px：设置该样式属性；width=240px：设置宽度；z-index=5：设置该样式属性。 */
/* position 控制定位方式，这里取 absolute；top 控制当前元素的样式取值，这里取 14px；width 控制宽度，这里取 240px；z-index 控制重叠元素的层级，这里取 5 */
.overlay.left { left: 14px; }
/* left=14px：设置该样式属性。 */
/* left 控制当前元素的样式取值，这里取 14px */

/* 关节列表与单行布局 */
.joints { display: flex; flex-direction: column; gap: 8px; }
/* display=flex：决定元素如何布局或显示；flex-direction=column：设置该样式属性；gap=8px：设置子元素间距。 */
/* display 控制元素布局方式，这里取 flex；flex-direction 控制当前元素的样式取值，这里取 column；gap 控制子元素间距，这里取 8px */
.joint-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
/* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；gap=8px：设置子元素间距；font-size=12px：设置字号。 */
/* display 控制元素布局方式，这里取 flex；align-items 控制交叉轴对齐方式，这里取 center；gap 控制子元素间距，这里取 8px；font-size 控制字体大小，这里取 12px */
.joint-label { width: 22px; color: var(--text-dim); }
/* width=22px：设置宽度；color=var(--text-dim)：设置文字颜色。 */
/* width 控制宽度，这里取 22px；color 控制文字颜色，这里取 var(--text-dim) */
/* 刻度条底槽 */
/* 这一段为 .joint-bar 对应的界面元素定义尺寸、布局或视觉样式。 */
.joint-bar {
/* 对选择器 .joint-bar 匹配的元素应用后续声明。 */
/* .joint-bar 是这一组样式匹配的元素选择器 */
  flex: 1; height: 6px; border-radius: 3px;
  /* flex=1：设置弹性项的伸缩比例；height=6px：设置高度；border-radius=3px：设置圆角。 */
  /* flex 控制弹性项伸缩方式，这里取 1；height 控制高度，这里取 6px；border-radius 控制圆角半径，这里取 3px */
  background: #1c2733; position: relative;
  /* background=#1c2733：设置背景；position=relative：设置定位方式。 */
  /* background 控制背景，这里取 #1c2733；position 控制定位方式，这里取 relative */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .joint-bar 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
/* 刻度条上的游标（当前位置） */
/* 这一段为 .joint-marker 对应的界面元素定义尺寸、布局或视觉样式。 */
.joint-marker {
/* 对选择器 .joint-marker 匹配的元素应用后续声明。 */
/* .joint-marker 是这一组样式匹配的元素选择器 */
  position: absolute; top: -2px; width: 3px; height: 10px;
  /* position=absolute：设置定位方式；top=-2px：设置该样式属性；width=3px：设置宽度；height=10px：设置高度。 */
  /* position 控制定位方式，这里取 absolute；top 控制当前元素的样式取值，这里取 -2px；width 控制宽度，这里取 3px；height 控制高度，这里取 10px */
  background: var(--accent); border-radius: 2px;
  /* background=var(--accent)：设置背景；border-radius=2px：设置圆角。 */
  /* background 控制背景，这里取 var(--accent)；border-radius 控制圆角半径，这里取 2px */
  transform: translateX(-50%);
  /* transform=translateX(-50%)：变换元素位置或形状。 */
  /* transform 控制位置或形状变换，这里取 translateX(-50%) */
  transition: left 80ms linear;
  /* transition=left 80ms linear：设置状态变化时的过渡。 */
  /* transition 控制状态变化时的过渡动画，这里取 left 80ms linear */
  box-shadow: 0 0 6px var(--accent);
  /* box-shadow=0 0 6px var(--accent)：设置阴影。 */
  /* box-shadow 控制阴影，这里取 0 0 6px var(--accent) */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .joint-marker 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.joint-deg { width: 58px; text-align: right; font-variant-numeric: tabular-nums; }
/* width=58px：设置宽度；text-align=right：设置该样式属性；font-variant-numeric=tabular-nums：设置该样式属性。 */
/* width 控制宽度，这里取 58px；text-align 控制当前元素的样式取值，这里取 right；font-variant-numeric 控制当前元素的样式取值，这里取 tabular-nums */

/* 面板底部的附加信息行 */
/* 这一段为 .meta 对应的界面元素定义尺寸、布局或视觉样式。 */
.meta {
/* 对选择器 .meta 匹配的元素应用后续声明。 */
/* .meta 是这一组样式匹配的元素选择器 */
  margin-top: 10px; padding-top: 8px;
  /* margin-top=10px：设置该样式属性；padding-top=8px：设置该样式属性。 */
  /* margin-top 控制当前元素的样式取值，这里取 10px；padding-top 控制当前元素的样式取值，这里取 8px */
  border-top: 1px dashed var(--panel-border);
  /* border-top=1px dashed var(--panel-border)：设置该样式属性。 */
  /* border-top 控制当前元素的样式取值，这里取 1px dashed var(--panel-border) */
  display: flex; justify-content: space-between;
  /* display=flex：决定元素如何布局或显示；justify-content=space-between：控制主轴上的分布方式。 */
  /* display 控制元素布局方式，这里取 flex；justify-content 控制主轴内容排列方式，这里取 space-between */
  font-size: 12px; color: var(--text-dim);
  /* font-size=12px：设置字号；color=var(--text-dim)：设置文字颜色。 */
  /* font-size 控制字体大小，这里取 12px；color 控制文字颜色，这里取 var(--text-dim) */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .meta 的样式设置，浏览器渲染匹配元素时应用这些规则。 */

/* 左下角提示文字 */
/* 这一段为 .hint 对应的界面元素定义尺寸、布局或视觉样式。 */
.hint {
/* 对选择器 .hint 匹配的元素应用后续声明。 */
/* .hint 是这一组样式匹配的元素选择器 */
  position: absolute; left: 14px; bottom: 10px;
  /* position=absolute：设置定位方式；left=14px：设置该样式属性；bottom=10px：设置该样式属性。 */
  /* position 控制定位方式，这里取 absolute；left 控制当前元素的样式取值，这里取 14px；bottom 控制当前元素的样式取值，这里取 10px */
  font-size: 11px; color: var(--text-dim); opacity: 0.7;
  /* font-size=11px：设置字号；color=var(--text-dim)：设置文字颜色；opacity=0.7：设置透明度。 */
  /* font-size 控制字体大小，这里取 11px；color 控制文字颜色，这里取 var(--text-dim)；opacity 控制不透明程度，这里取 0.7 */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .hint 的样式设置，浏览器渲染匹配元素时应用这些规则。 */

/* 断线遮罩：覆盖整个画面 */
/* 这一段为 .lost 对应的界面元素定义尺寸、布局或视觉样式。 */
.lost {
/* 对选择器 .lost 匹配的元素应用后续声明。 */
/* .lost 是这一组样式匹配的元素选择器 */
  position: absolute; inset: 0; z-index: 10;
  /* position=absolute：设置定位方式；inset=0：设置该样式属性；z-index=10：设置该样式属性。 */
  /* position 控制定位方式，这里取 absolute；inset 控制当前元素的样式取值，这里取 0；z-index 控制重叠元素的层级，这里取 10 */
  display: flex; align-items: center; justify-content: center; gap: 8px;
  /* display=flex：决定元素如何布局或显示；align-items=center：控制交叉轴上的对齐方式；justify-content=center：控制主轴上的分布方式；gap=8px：设置子元素间距。 */
  /* display 控制元素布局方式，这里取 flex；align-items 控制交叉轴对齐方式，这里取 center；justify-content 控制主轴内容排列方式，这里取 center；gap 控制子元素间距，这里取 8px */
  background: rgba(11, 15, 20, 0.7); backdrop-filter: blur(2px);
  /* background=rgba(11, 15, 20, 0.7)：设置背景；backdrop-filter=blur(2px)：设置该样式属性。 */
  /* background 控制背景，这里取 rgba(11, 15, 20, 0.7)；backdrop-filter 控制当前元素的样式取值，这里取 blur(2px) */
  color: var(--warn); font-size: 14px;
  /* color=var(--warn)：设置文字颜色；font-size=14px：设置字号。 */
  /* color 控制文字颜色，这里取 var(--warn)；font-size 控制字体大小，这里取 14px */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .lost 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.lost-icon { font-size: 20px; }
/* font-size=20px：设置字号。 */
/* font-size 控制字体大小，这里取 20px */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
<!-- style 是当前使用的界面元素或组件 -->
<!-- 这一段提供了展示机械臂三维场景、实时工序、IO 和操作面板所需的定义和处理逻辑，结果交由调用方或运行环境使用。 -->
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
