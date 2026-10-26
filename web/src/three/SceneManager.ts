/**
 * ============================================================================
 * 文件作用：Three.js 场景封装（渲染器 / 相机 / 灯光 / 地面 / 渲染主循环）
 * 所属模块：web/src/three/
 * ============================================================================
 *
 * 【宏观定位】把 Three.js 的"样板代码"封装成一个类，让页面组件只需关心三件事：
 *   ① new SceneManager(container) —— 建场景
 *   ② scene.add(模型)             —— 加模型
 *   ③ scene.start()               —— 开跑
 *   ④ scene.dispose()             —— 释放资源
 *
 * 【Three.js 的核心概念（看懂本文件必需）】
 *   - Scene      场景：所有物体的容器
 *   - Camera     相机：决定"从哪个角度、怎么投影"看到场景
 *   - Renderer   渲染器：真正把场景画到 canvas 上（吃 GPU）
 *   - Mesh       网格：几何体(Geometry) + 材质(Material)
 *   - Group      组：可以整体移动/旋转的容器，用来搭"关节父子层级"
 *   - requestAnimationFrame 主循环：浏览器每秒调 60 次，和显示器刷新率同步
 *
 * 【本类的渲染循环做了什么】
 *   每帧：① 更新相机控制器（阻尼惯性） ② 渲染场景
 *   数据的更新（关节角度）**不在这个循环里**，而是由 Vue 的 watch 触发直接改模型属性。
 *   为什么？因为数据是 10Hz、渲染是 60Hz，两者解耦：
 *   数据来的时候改属性，渲染循环每次都把最新属性画出来。
 *
 * 【坐标系约定】
 *   Three.js 默认：Y 轴向上，单位是"米"。
 *   本项目机械臂臂展约 0.9m，所以相机放在 (1.5, 1.2, 1.8) 距离合适。
 */
import * as THREE from 'three';
// 从 three 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// 从 three/examples/jsm/controls/OrbitControls.js 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

/**
 * Three.js 场景封装:渲染器 / 相机 / 灯光 / 地面网格 / 主循环。
 * 视图组件只关心:把模型 add 进来、每帧之外的数据更新、销毁时 dispose。
 */
export class SceneManager {
// 声明 SceneManager 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  /** 场景（所有物体的容器）。readonly：创建后不允许替换 */
  readonly scene = new THREE.Scene();
  // 调用 THREE.Scene；括号中的表达式是传入的参数。 关键字：readonly＝禁止重新赋值；new＝创建对象实例。
  /** 透视相机 */
  readonly camera: THREE.PerspectiveCamera;
  // 声明类属性或构造参数 camera，类型为 THREE.PerspectiveCamera。 关键字：readonly＝禁止重新赋值。
  /** WebGL 渲染器 */
  readonly renderer: THREE.WebGLRenderer;
  // 声明类属性或构造参数 renderer，类型为 THREE.WebGLRenderer。 关键字：readonly＝禁止重新赋值。
  /** 轨道控制器（鼠标拖拽旋转 / 滚轮缩放） */
  readonly controls: OrbitControls;
  // 声明类属性或构造参数 controls，类型为 OrbitControls。 关键字：readonly＝禁止重新赋值。

  /** requestAnimationFrame 的句柄，用于取消动画 */
  private raf = 0;
  // 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：private＝限定类内部访问。
  /** 尺寸监听器：容器大小变化时自动调整相机比例 */
  private readonly observer: ResizeObserver;
  // 声明类属性或构造参数 observer，类型为 ResizeObserver。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
  /** 是否已销毁（主循环里用它来退出） */
  private disposed = false;
  // 继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：private＝限定类内部访问；false＝布尔假值。

  constructor(private readonly container: HTMLElement) {
  // 定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
    // ---------- 渲染器 ----------
    // antialias: 开启抗锯齿（边缘平滑），对细长的机械臂尤其重要
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    // 把右侧表达式的结果写入 this.renderer。 关键字：this＝当前对象实例；new＝创建对象实例；true＝布尔真值。
    // 像素比上限 2：高分屏上渲染 2 倍像素即可，再高纯属浪费 GPU
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // 调用 this.renderer.setPixelRatio，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // 开启阴影
    this.renderer.shadowMap.enabled = true;
    // 把右侧表达式的结果写入 this.renderer.shadowMap.enabled。 关键字：this＝当前对象实例；true＝布尔真值。
    // 阴影类型：PCF 软阴影（比默认的硬阴影更自然）
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 把右侧表达式的结果写入 this.renderer.shadowMap.type。 关键字：this＝当前对象实例。
    // 色调映射：ACES Filmic，模拟电影级的高光压缩，让画面不那么"死白"
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 把右侧表达式的结果写入 this.renderer.toneMapping。 关键字：this＝当前对象实例。
    // 把渲染器的 canvas 挂到容器里（容器必须是非零尺寸，否则画不出来）
    container.appendChild(this.renderer.domElement);
    // 调用 container.appendChild，把括号中的值作为参数传入。 关键字：this＝当前对象实例。

    // ---------- 场景背景与雾 ----------
    // 背景色：深蓝黑（与前端整体深色主题一致）
    this.scene.background = new THREE.Color(0x0b0f14);
    // 把右侧表达式的结果写入 this.scene.background。 关键字：this＝当前对象实例；new＝创建对象实例。
    // 雾效：从 4 单位开始、10 单位全白 → 远处物体自然淡出，制造纵深感
    this.scene.fog = new THREE.Fog(0x0b0f14, 4, 10);
    // 把右侧表达式的结果写入 this.scene.fog。 关键字：this＝当前对象实例；new＝创建对象实例。

    // ---------- 相机 ----------
    // 42 = 视场角(FOV)，单位度。数值越小视野越窄、物体越大
    // 1 = 宽高比（初始值，随后由 resize() 校正）
    // 0.05 = 近裁剪面（太近的看不到），100 = 远裁剪面
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
    // 把右侧表达式的结果写入 this.camera。 关键字：this＝当前对象实例；new＝创建对象实例。
    // 相机初始位置：(x=右, y=上, z=朝向观察者)
    this.camera.position.set(1.5, 1.2, 1.8);
    // 调用 this.camera.position.set，把括号中的值作为参数传入。 关键字：this＝当前对象实例。

    // ---------- 轨道控制器 ----------
    // 让用户可以拖拽旋转、滚轮缩放 —— 这是"孪生"交互的基础
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // 把右侧表达式的结果写入 this.controls。 关键字：this＝当前对象实例；new＝创建对象实例。
    // 控制器围绕的目标点（机械臂腰部高度），相机围绕它转
    this.controls.target.set(0, 0.45, 0);
    // 调用 this.controls.target.set，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // 开启阻尼：松手后相机还有惯性减速滑行，手感更顺滑
    this.controls.enableDamping = true;
    // 把右侧表达式的结果写入 this.controls.enableDamping。 关键字：this＝当前对象实例；true＝布尔真值。
    // 阻尼系数（0~1，越小滑行越久）
    this.controls.dampingFactor = 0.08;
    // 把右侧表达式的结果写入 this.controls.dampingFactor。 关键字：this＝当前对象实例。
    // 限制最大俯仰角到 0.52π（约 94°），别让相机钻到地面以下看穿模型
    this.controls.maxPolarAngle = Math.PI * 0.52; // 别钻到地面以下
    // 把右侧表达式的结果写入 this.controls.maxPolarAngle。 关键字：this＝当前对象实例。
    // 最近/最远缩放距离
    this.controls.minDistance = 0.5;
    // 把右侧表达式的结果写入 this.controls.minDistance。 关键字：this＝当前对象实例。
    this.controls.maxDistance = 6;
    // 把右侧表达式的结果写入 this.controls.maxDistance。 关键字：this＝当前对象实例。

    // 灯光:半球环境光 + 一盏带阴影的主光
    // ---------- 灯光 ----------
    // 半球光：天空色(冷蓝) + 地面色(暖褐)，提供环境照明（没有它模型背面会全黑）
    const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 0.9);
    // 声明 hemi，初始值由 new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 0.9) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    this.scene.add(hemi);
    // 调用 this.scene.add，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // 主光（平行光）：从右上前方照下来，产生主要的高光和阴影
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    // 声明 key，初始值由 new THREE.DirectionalLight(0xffffff, 1.8) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    key.position.set(2.5, 4, 2);
    // 调用 key.position.set，把括号中的值作为参数传入。
    key.castShadow = true;
    // 把右侧表达式的结果写入 key.castShadow。 关键字：true＝布尔真值。
    key.shadow.mapSize.set(1024, 1024);
    // 调用 key.shadow.mapSize.set，把括号中的值作为参数传入。
    // 阴影视锥的范围（正交阴影相机），范围太小阴影会糊、太大会粗糙
    key.shadow.camera.left = -1.5;
    // 把右侧表达式的结果写入 key.shadow.camera.left。
    key.shadow.camera.right = 1.5;
    // 把右侧表达式的结果写入 key.shadow.camera.right。
    key.shadow.camera.top = 1.5;
    // 把右侧表达式的结果写入 key.shadow.camera.top。
    key.shadow.camera.bottom = -1.5;
    // 把右侧表达式的结果写入 key.shadow.camera.bottom。
    this.scene.add(key);
    // 调用 this.scene.add，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // 补一点冷色轮廓光,让机械臂背光面不死黑
    const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
    // 声明 rim，初始值由 new THREE.DirectionalLight(0x88aaff, 0.5) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    rim.position.set(-2, 1.5, -2);
    // 调用 rim.position.set，把括号中的值作为参数传入。
    this.scene.add(rim);
    // 调用 this.scene.add，把括号中的值作为参数传入。 关键字：this＝当前对象实例。

    // 地面 + 网格
    // ---------- 地面 + 网格 ----------
    // 圆形地面（半径 3），接收阴影
    const ground = new THREE.Mesh(
    // 声明 ground，初始值由 new THREE.Mesh( 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
      new THREE.CircleGeometry(3, 64),
      // 调用 THREE.CircleGeometry；括号中的表达式是传入的参数。 关键字：new＝创建对象实例。
      new THREE.MeshStandardMaterial({ color: 0x0e141b, roughness: 0.9, metalness: 0.1 }),
      // 调用 THREE.MeshStandardMaterial；括号中的表达式是传入的参数。 关键字：new＝创建对象实例。
    );
    // 结束当前函数的参数列表并完成调用。
    // 绕 X 轴旋转 -90°，让圆面从"竖着"变成"平躺"（默认圆面在 XY 平面）
    ground.rotation.x = -Math.PI / 2;
    // 把右侧表达式的结果写入 ground.rotation.x。
    ground.receiveShadow = true;
    // 把右侧表达式的结果写入 ground.receiveShadow。 关键字：true＝布尔真值。
    this.scene.add(ground);
    // 调用 this.scene.add，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // 网格辅助线：6 单位见方、60 格 —— 提供空间参考系，看得出机械臂动多大
    const grid = new THREE.GridHelper(6, 60, 0x2a3a4a, 0x18222e);
    // 声明 grid，初始值由 new THREE.GridHelper(6, 60, 0x2a3a4a, 0x18222e) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    // 抬高 0.001，避免与地面 Z-fighting（两个面完全共面时闪烁）
    grid.position.y = 0.001;
    // 把右侧表达式的结果写入 grid.position.y。
    this.scene.add(grid);
    // 调用 this.scene.add，把括号中的值作为参数传入。 关键字：this＝当前对象实例。

    // ---------- 尺寸自适应 ----------
    // ResizeObserver：容器尺寸变化时自动回调（比监听 window.resize 更精确）
    this.observer = new ResizeObserver(() => this.resize());
    // 把右侧表达式的结果写入 this.observer。 关键字：this＝当前对象实例；new＝创建对象实例。
    this.observer.observe(container);
    // 调用 this.observer.observe，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // 立即执行一次，让画布铺满容器
    this.resize();
    // 调用 this.resize，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 向场景中添加一个对象（模型、网格、任何 Object3D）。
   */
  add(obj: THREE.Object3D) {
  // 定义方法 add；括号中声明参数，花括号内实现逻辑。
    this.scene.add(obj);
    // 调用 this.scene.add，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  start() {
  // 定义方法 start；括号中声明参数，花括号内实现逻辑。
    // 循环体（每帧执行一次）
    const loop = () => {
    // 声明 loop，初始值由 () => { 计算得到。 关键字：const＝声明不可重新绑定的变量。
      // 已销毁就退出循环（dispose 里会置位）
      if (this.disposed) return;
      // 判断 if (this.disposed) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；this＝当前对象实例；return＝返回结果并结束当前函数。
      // 预约下一帧 —— 这一行让循环持续下去
      this.raf = requestAnimationFrame(loop);
      // 把右侧表达式的结果写入 this.raf。 关键字：this＝当前对象实例。
      // 更新控制器（处理阻尼惯性、边界限制）
      this.controls.update();
      // 调用 this.controls.update，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
      // 真正把场景画到 canvas 上
      this.renderer.render(this.scene, this.camera);
      // 调用 this.renderer.render，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    };
    // 结束当前对象或代码块，并完成这条语句。
    // 启动第一帧
    loop();
    // 调用 loop；括号中的表达式是传入的参数。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 容器尺寸变化时的处理：调整相机宽高比 + 渲染器尺寸。
   * 宽高比必须同步，否则画面会被拉伸变形。
   */
  resize() {
  // 定义方法 resize；括号中声明参数，花括号内实现逻辑。
    // 读容器尺寸，|| 1 兜底（尺寸为 0 时相机会除以 0 得到 NaN，导致画面全黑）
    const w = this.container.clientWidth || 1;
    // 声明 w，初始值由 this.container.clientWidth || 1 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
    const h = this.container.clientHeight || 1;
    // 声明 h，初始值由 this.container.clientHeight || 1 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
    // 设置相机宽高比
    this.camera.aspect = w / h;
    // 把右侧表达式的结果写入 this.camera.aspect。 关键字：this＝当前对象实例。
    // ★ 必须调用 updateProjectionMatrix()，否则新的 aspect 不会生效
    this.camera.updateProjectionMatrix();
    // 调用 this.camera.updateProjectionMatrix，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // 设置渲染器绘制缓冲区尺寸（第三个参数 updateStyle=true 会同步修改 canvas 的 CSS 尺寸）
    this.renderer.setSize(w, h);
    // 调用 this.renderer.setSize，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 释放所有资源。
   * ★ 必须调用：否则用户反复切换页面会导致 GPU 内存泄漏，浏览器最终崩溃。
   */
  dispose() {
  // 定义方法 dispose；括号中声明参数，花括号内实现逻辑。
    // 标记已销毁，让主循环下一帧自行退出
    this.disposed = true;
    // 把右侧表达式的结果写入 this.disposed。 关键字：this＝当前对象实例；true＝布尔真值。
    // 取消待执行的动画帧
    cancelAnimationFrame(this.raf);
    // 调用 cancelAnimationFrame；括号中的表达式是传入的参数。 关键字：this＝当前对象实例。
    // 停止尺寸监听
    this.observer.disconnect();
    // 调用 this.observer.disconnect，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // 释放控制器内部的事件监听
    this.controls.dispose();
    // 调用 this.controls.dispose，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // 释放渲染器占用的 GPU 资源
    this.renderer.dispose();
    // 调用 this.renderer.dispose，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // 把 canvas 从 DOM 里移除
    this.renderer.domElement.remove();
    // 调用 this.renderer.domElement.remove，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
