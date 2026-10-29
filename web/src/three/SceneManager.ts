/**
 * 浏览器三维场景与绘制管理器，由 TwinView 创建并传入画布容器。
 * constructor 建渲染器、相机、灯光、网格与 OrbitControls；add 挂模型；start 驱动绘制；resize/dispose 处理尺寸和资源。
 * Three.js 的 render 绘制已存在的姿态，requestAnimationFrame 不产生新的 PLC 测量帧；相机交互不控制现场。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Three.js 场景封装:渲染器 / 相机 / 灯光 / 地面网格 / 主循环。
 * 视图组件只关心:把模型 add 进来、每帧之外的数据更新、销毁时 dispose。
 */
export class SceneManager {
  /** 场景（所有物体的容器）。readonly：创建后不允许替换 */
  readonly scene = new THREE.Scene();
  /** 透视相机 */
  readonly camera: THREE.PerspectiveCamera;
  /** WebGL 渲染器 */
  readonly renderer: THREE.WebGLRenderer;
  /** 轨道控制器（鼠标拖拽旋转 / 滚轮缩放） */
  readonly controls: OrbitControls;

  /** requestAnimationFrame 的句柄，用于取消动画 */
  private raf = 0;
  // raf 保存 requestAnimationFrame 返回的帧调度句柄，0 表示尚未安排下一帧
  /** 尺寸监听器：容器大小变化时自动调整相机比例 */
  private readonly observer: ResizeObserver;
  /** 是否已销毁（主循环里用它来退出） */
  private disposed = false;

  // TwinView 挂载后传入真实 DOM 容器，创建场景、渲染器、相机、灯光和观察控制器。
  // canvas 加入容器后再由 start 绘制；容器尺寸影响相机与画布，模型通过 add 挂入场景。
  constructor(private readonly container: HTMLElement) {
    // ---------- 渲染器 ----------
    // antialias: 开启抗锯齿（边缘平滑），对细长的机械臂尤其重要
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    // 像素比上限 2：高分屏上渲染 2 倍像素即可，再高纯属浪费 GPU
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // 设置渲染器的像素比例。
    // 开启阴影
    this.renderer.shadowMap.enabled = true;
    // 阴影类型：PCF 软阴影（比默认的硬阴影更自然）
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 色调映射：ACES Filmic，模拟电影级的高光压缩，让画面不那么"死白"
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 把渲染器的 canvas 挂到容器里（容器必须是非零尺寸，否则画不出来）
    container.appendChild(this.renderer.domElement);
    // 将子 DOM 元素挂到容器中。

    // ---------- 场景背景与雾 ----------
    // 背景色：深蓝黑（与前端整体深色主题一致）
    this.scene.background = new THREE.Color(0x0b0f14);
    // 雾效：从 4 单位开始、10 单位全白 → 远处物体自然淡出，制造纵深感
    this.scene.fog = new THREE.Fog(0x0b0f14, 4, 10);

    // ---------- 相机 ----------
    // 42 = 视场角(FOV)，单位度。数值越小视野越窄、物体越大
    // 1 = 宽高比（初始值，随后由 resize() 校正）
    // 0.05 = 近裁剪面（太近的看不到），100 = 远裁剪面
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
    // 相机初始位置：(x=右, y=上, z=朝向观察者)
    this.camera.position.set(1.5, 1.2, 1.8);

    // ---------- 轨道控制器 ----------
    // 让用户可以拖拽旋转、滚轮缩放 —— 这是"孪生"交互的基础
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // 控制器围绕的目标点（机械臂腰部高度），相机围绕它转
    this.controls.target.set(0, 0.45, 0);
    // 开启阻尼：松手后相机还有惯性减速滑行，手感更顺滑
    this.controls.enableDamping = true;
    // 阻尼系数（0~1，越小滑行越久）
    this.controls.dampingFactor = 0.08;
    // 限制最大俯仰角到 0.52π（约 94°），别让相机钻到地面以下看穿模型
    this.controls.maxPolarAngle = Math.PI * 0.52; // 别钻到地面以下
    // 最近/最远缩放距离
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 6;

    // 灯光:半球环境光 + 一盏带阴影的主光
    // ---------- 灯光 ----------
    // 半球光：天空色(冷蓝) + 地面色(暖褐)，提供环境照明（没有它模型背面会全黑）
    const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 0.9);
    this.scene.add(hemi);
    // 主光（平行光）：从右上前方照下来，产生主要的高光和阴影
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(2.5, 4, 2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    // 阴影视锥的范围（正交阴影相机），范围太小阴影会糊、太大会粗糙
    key.shadow.camera.left = -1.5;
    key.shadow.camera.right = 1.5;
    key.shadow.camera.top = 1.5;
    key.shadow.camera.bottom = -1.5;
    this.scene.add(key);
    // 补一点冷色轮廓光,让机械臂背光面不死黑
    const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
    rim.position.set(-2, 1.5, -2);
    this.scene.add(rim);

    // 地面 + 网格
    // ---------- 地面 + 网格 ----------
    // 圆形地面（半径 3），接收阴影
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(3, 64),
      new THREE.MeshStandardMaterial({ color: 0x0e141b, roughness: 0.9, metalness: 0.1 }),
    );
    // 绕 X 轴旋转 -90°，让圆面从"竖着"变成"平躺"（默认圆面在 XY 平面）
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    // 网格辅助线：6 单位见方、60 格 —— 提供空间参考系，看得出机械臂动多大
    const grid = new THREE.GridHelper(6, 60, 0x2a3a4a, 0x18222e);
    // 抬高 0.001，避免与地面 Z-fighting（两个面完全共面时闪烁）
    grid.position.y = 0.001;
    this.scene.add(grid);

    // ---------- 尺寸自适应 ----------
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    // 立即执行一次，让画布铺满容器
    this.resize();
    // 根据容器尺寸同步更新相机宽高比和渲染画布。
  }

  // 将 RobotArm 等 Three.js 对象加入本场景，后续 render 才会从当前相机绘制它。
  add(obj: THREE.Object3D) {
    this.scene.add(obj);
  }

  // 开始 requestAnimationFrame 绘制循环，更新相机控制并绘制当前模型姿态。
  // 重复 render 不产生新的现场测量；动画句柄取消与 dispose 的资源释放需结合关闭路径看。
  start() {
    // 循环体（每帧执行一次）
    const loop = () => {
      // 已销毁就退出循环（dispose 里会置位）
      if (this.disposed) return;
      // 预约下一帧 —— 这一行让循环持续下去
      this.raf = requestAnimationFrame(loop);
      // 1. requestAnimationFrame 是浏览器 API，申请下一次绘制机会再执行 loop。
      // 2. 返回编号保存到 raf，dispose 时可以取消尚未执行的下一帧。
      // 3. 它的刷新节奏由浏览器调度，与 PLC 200ms 的目标读取周期相互独立。
      this.controls.update();
      // 按本行数据更新当前状态或对象字段。
      // 真正把场景画到 canvas 上
      this.renderer.render(this.scene, this.camera);
      // 1. renderer 是构造时创建的 Three.js WebGLRenderer。
      // 2. scene 提供当前物体、材质和变换，camera 决定从哪个位置看。
      // 3. setJoints 只改变场景节点数据，本行才把此刻场景投影到网页 canvas。
      // 4. 同一个现场姿态在两次采样之间可以被反复绘制，不代表每一渲染帧都收到新遥测。
    };
    // 启动第一帧
    loop();
    // 推进每帧更新并绘制三维场景。
  }

  // 容器尺寸变化时更新相机比例和渲染器尺寸，避免画面变形或裁切。
  resize() {
    // 读容器尺寸，|| 1 兜底（尺寸为 0 时相机会除以 0 得到 NaN，导致画面全黑）
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    // 设置相机宽高比
    this.camera.aspect = w / h;
    // ★ 必须调用 updateProjectionMatrix()，否则新的 aspect 不会生效
    this.camera.updateProjectionMatrix();
    // 根据相机新参数更新投影矩阵。
    // 设置渲染器绘制缓冲区尺寸（第三个参数 updateStyle=true 会同步修改 canvas 的 CSS 尺寸）
    this.renderer.setSize(w, h);
    // 设置渲染画布的宽度和高度。
  }

  // 页面卸载时停止绘制与观察控制，移除监听并释放本管理器负责的图形资源。
  // 这是浏览器资源清理，不会断开后端 MQTT 或停止 PLC 运行。
  dispose() {
    // 标记已销毁，让主循环下一帧自行退出
    this.disposed = true;
    // 取消待执行的动画帧
    cancelAnimationFrame(this.raf);
    // 停止尺寸监听
    this.observer.disconnect();
    // 释放控制器内部的事件监听
    this.controls.dispose();
    // 释放 GPU、材质、几何体或控制器资源。
    // 释放渲染器占用的 GPU 资源
    this.renderer.dispose();
    // 释放 GPU、材质、几何体或控制器资源。
    // 把 canvas 从 DOM 里移除
    this.renderer.domElement.remove();
  }
}
