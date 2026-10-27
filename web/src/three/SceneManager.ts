/**
 // 这一段负责管理三维场景、相机、渲染循环与资源释放，为后续代码提供当前文件的处理入口。
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
// 从 three 导入这一行列出的符号，供本文件调用。
// THREE：从 three 导入的三维 API 命名空间
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// 从 three/examples/jsm/controls/OrbitControls.js 导入这一行列出的符号，供本文件调用。
// OrbitControls：Three.js 鼠标旋转、缩放和移动相机的控制器

/**
 * Three.js 场景封装:渲染器 / 相机 / 灯光 / 地面网格 / 主循环。
 * 视图组件只关心:把模型 add 进来、每帧之外的数据更新、销毁时 dispose。
 */
// 这一段声明 SceneManager，用于项目定义的 Three.js 场景管理类，负责渲染、相机与资源清理。
export class SceneManager {
// 定义 SceneManager，约束或实现本模块涉及的数据和行为。
// SceneManager：项目定义的 Three.js 场景管理类，负责渲染、相机与资源清理
  /** 场景（所有物体的容器）。readonly：创建后不允许替换 */
  readonly scene = new THREE.Scene();
  // 执行 Scene 对应的本地处理，使用本行提供的数据。
  // scene：Three.js 场景实例；THREE：从 three 导入的三维 API 命名空间；Scene：THREE 对象上的字段或操作
  /** 透视相机 */
  readonly camera: THREE.PerspectiveCamera;
  // 声明类属性或构造参数 camera，类型为 THREE.PerspectiveCamera。
  // camera：Three.js 相机实例；THREE：从 three 导入的三维 API 命名空间；PerspectiveCamera：Three.js 透视相机类
  /** WebGL 渲染器 */
  readonly renderer: THREE.WebGLRenderer;
  // 声明类属性或构造参数 renderer，类型为 THREE.WebGLRenderer。
  // renderer：Three.js WebGL 渲染器实例；THREE：从 three 导入的三维 API 命名空间；WebGLRenderer：Three.js WebGL 渲染器类
  /** 轨道控制器（鼠标拖拽旋转 / 滚轮缩放） */
  readonly controls: OrbitControls;
  // 声明类属性或构造参数 controls，类型为 OrbitControls。
  // controls：相机交互控制器；OrbitControls：Three.js 鼠标旋转、缩放和移动相机的控制器

  /** requestAnimationFrame 的句柄，用于取消动画 */
  private raf = 0;
  // 声明或设置 raf，用于当前对象或接口的对应数据。
  // raf 保存 requestAnimationFrame 返回的帧调度句柄，0 表示尚未安排下一帧
  /** 尺寸监听器：容器大小变化时自动调整相机比例 */
  private readonly observer: ResizeObserver;
  // 声明类属性或构造参数 observer，类型为 ResizeObserver。
  // observer：本处声明的字段或类型，类型为 ResizeObserver；ResizeObserver：本处保存的局部数据，类型为 { prototype: ResizeObserver; new(callback: ResizeO…
  /** 是否已销毁（主循环里用它来退出） */
  private disposed = false;
  // 声明或设置 disposed，用于当前对象或接口的对应数据。
  // disposed 记录当前场景是否已经释放，防止重复清理资源

  // 这一段定义 constructor，用于初始化 SceneManager 使用的实例状态和依赖。

  // 这段创建网页三维场景的基础设施：渲染器、观察相机、灯光和交互控制。
  // container 是 TwinView 传入的页面容器，renderer.domElement 是挂入该容器的 canvas，模型另由 RobotArm 创建后加入场景。
  // 拖拽和缩放改变观察相机；现场关节角到达时由模型方法更新姿态，这两种变化都由渲染器画到同一 canvas。

  constructor(private readonly container: HTMLElement) {
  // 为孪生页面创建渲染器、相机、灯光和观察交互，并把渲染 canvas 加入页面容器。
  // container 是 TwinView 挂载后的 HTMLElement；THREE.WebGLRenderer 负责绘制，RobotArm 模型在页面代码中另行创建并加入场景。
    // ---------- 渲染器 ----------
    // antialias: 开启抗锯齿（边缘平滑），对细长的机械臂尤其重要
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    // 把右侧表达式的结果写入 this.renderer。
    // renderer：Three.js WebGL 渲染器实例；THREE：从 three 导入的三维 API 命名空间；WebGLRenderer：Three.js WebGL 渲染器类
    // 像素比上限 2：高分屏上渲染 2 倍像素即可，再高纯属浪费 GPU
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // 设置渲染器的像素比例。
    // renderer：Three.js WebGL 渲染器实例；setPixelRatio：设置渲染器的像素比例；Math：JavaScript 数学计算 API；min：本处声明的字段或类型，类型为 number；window：当前浏览器窗口及全局事件对象；devicePixelRatio：本处声明的字段或类型，类型为 number
    // 开启阴影
    this.renderer.shadowMap.enabled = true;
    // 把右侧表达式的结果写入 this.renderer.shadowMap.enabled。
    // renderer：Three.js WebGL 渲染器实例；shadowMap：本处声明的字段或类型，类型为 WebGLShadowMap；enabled：本处声明的字段或类型，类型为 boolean
    // 阴影类型：PCF 软阴影（比默认的硬阴影更自然）
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 把右侧表达式的结果写入 this.renderer.shadowMap.type。
    // renderer：Three.js WebGL 渲染器实例；shadowMap：本处声明的字段或类型，类型为 WebGLShadowMap；type：当前报文、指令或对象的类别字段；THREE：从 three 导入的三维 API 命名空间；PCFSoftShadowMap：本处保存的局部数据，类型为 2
    // 色调映射：ACES Filmic，模拟电影级的高光压缩，让画面不那么"死白"
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 把右侧表达式的结果写入 this.renderer.toneMapping。
    // renderer：Three.js WebGL 渲染器实例；toneMapping：本处声明的字段或类型，类型为 ToneMapping；THREE：从 three 导入的三维 API 命名空间；ACESFilmicToneMapping：本处保存的局部数据，类型为 4
    // 把渲染器的 canvas 挂到容器里（容器必须是非零尺寸，否则画不出来）
    container.appendChild(this.renderer.domElement);
    // 将子 DOM 元素挂到容器中。
    // container：当前方法接收的参数，类型为 HTMLElement；appendChild：将子 DOM 元素挂到容器中；renderer：Three.js WebGL 渲染器实例；domElement：本处声明的字段或类型，类型为 HTMLCanvasElement

    // ---------- 场景背景与雾 ----------
    // 背景色：深蓝黑（与前端整体深色主题一致）
    this.scene.background = new THREE.Color(0x0b0f14);
    // 把右侧表达式的结果写入 this.scene.background。
    // scene：Three.js 场景实例；background：本处声明的字段或类型，类型为 Color | Texture | CubeTexture | null；THREE：从 three 导入的三维 API 命名空间；Color：Three.js 颜色表示类
    // 雾效：从 4 单位开始、10 单位全白 → 远处物体自然淡出，制造纵深感
    this.scene.fog = new THREE.Fog(0x0b0f14, 4, 10);
    // 把右侧表达式的结果写入 this.scene.fog。
    // scene：Three.js 场景实例；fog：本处声明的字段或类型，类型为 Fog | FogExp2 | null；THREE：从 three 导入的三维 API 命名空间；Fog：THREE 对象上的字段或操作

    // ---------- 相机 ----------
    // 42 = 视场角(FOV)，单位度。数值越小视野越窄、物体越大
    // 1 = 宽高比（初始值，随后由 resize() 校正）
    // 0.05 = 近裁剪面（太近的看不到），100 = 远裁剪面
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
    // 把右侧表达式的结果写入 this.camera。
    // camera：Three.js 相机实例；THREE：从 three 导入的三维 API 命名空间；PerspectiveCamera：Three.js 透视相机类
    // 相机初始位置：(x=右, y=上, z=朝向观察者)
    this.camera.position.set(1.5, 1.2, 1.8);
    // 按键写入当前映射、缓存或对象的值。
    // camera：Three.js 相机实例；position：三维物体相对父节点的位置；set：按键写入当前映射、缓存或对象的值

    // ---------- 轨道控制器 ----------
    // 让用户可以拖拽旋转、滚轮缩放 —— 这是"孪生"交互的基础
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // 把右侧表达式的结果写入 this.controls。
    // controls：相机交互控制器；OrbitControls：Three.js 鼠标旋转、缩放和移动相机的控制器；camera：Three.js 相机实例；renderer：Three.js WebGL 渲染器实例；domElement：本处声明的字段或类型，类型为 HTMLCanvasElement
    // 控制器围绕的目标点（机械臂腰部高度），相机围绕它转
    this.controls.target.set(0, 0.45, 0);
    // 按键写入当前映射、缓存或对象的值。
    // controls：相机交互控制器；target：本处声明的字段或类型，类型为 Vector3；set：按键写入当前映射、缓存或对象的值
    // 开启阻尼：松手后相机还有惯性减速滑行，手感更顺滑
    this.controls.enableDamping = true;
    // 把右侧表达式的结果写入 this.controls.enableDamping。
    // controls：相机交互控制器；enableDamping：本处声明的字段或类型，类型为 boolean
    // 阻尼系数（0~1，越小滑行越久）
    this.controls.dampingFactor = 0.08;
    // 把右侧表达式的结果写入 this.controls.dampingFactor。
    // controls：相机交互控制器；dampingFactor：本处声明的字段或类型，类型为 number
    // 限制最大俯仰角到 0.52π（约 94°），别让相机钻到地面以下看穿模型
    this.controls.maxPolarAngle = Math.PI * 0.52; // 别钻到地面以下
    // 把右侧表达式的结果写入 this.controls.maxPolarAngle。
    // controls：相机交互控制器；maxPolarAngle：本处声明的字段或类型，类型为 number；Math：JavaScript 数学计算 API；PI：本处声明的字段或类型，类型为 number
    // 最近/最远缩放距离
    this.controls.minDistance = 0.5;
    // 把右侧表达式的结果写入 this.controls.minDistance。
    // controls：相机交互控制器；minDistance：本处声明的字段或类型，类型为 number
    this.controls.maxDistance = 6;
    // 把右侧表达式的结果写入 this.controls.maxDistance。
    // controls：相机交互控制器；maxDistance：本处声明的字段或类型，类型为 number

    // 灯光:半球环境光 + 一盏带阴影的主光
    // ---------- 灯光 ----------
    // 半球光：天空色(冷蓝) + 地面色(暖褐)，提供环境照明（没有它模型背面会全黑）
    const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 0.9);
    // 执行 HemisphereLight 对应的本地处理，使用本行提供的数据，将结果保存或写入 hemi。
    // hemi：本处保存 new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 0.9) 的结果；THREE：从 three 导入的三维 API 命名空间；HemisphereLight：THREE 对象上的字段或操作
    this.scene.add(hemi);
    // 将元素加入集合或将子节点挂到场景对象。
    // scene：Three.js 场景实例；add：将元素加入集合或将子节点挂到场景对象；hemi：本处保存 new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 0.9) 的结果
    // 主光（平行光）：从右上前方照下来，产生主要的高光和阴影
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    // 创建用于三维场景补光的方向光源，将结果保存或写入 key。
    // key：缓存、映射或对象中使用的查找键；THREE：从 three 导入的三维 API 命名空间；DirectionalLight：THREE 对象上的字段或操作
    key.position.set(2.5, 4, 2);
    // 按键写入当前映射、缓存或对象的值。
    // key：缓存、映射或对象中使用的查找键；position：三维物体相对父节点的位置；set：按键写入当前映射、缓存或对象的值
    key.castShadow = true;
    // 把右侧表达式的结果写入 key.castShadow。
    // key：缓存、映射或对象中使用的查找键；castShadow：三维物体是否投射阴影
    key.shadow.mapSize.set(1024, 1024);
    // 按键写入当前映射、缓存或对象的值。
    // key：缓存、映射或对象中使用的查找键；shadow：本处声明的字段或类型，类型为 DirectionalLightShadow；mapSize：本处声明的字段或类型，类型为 Vector2；set：按键写入当前映射、缓存或对象的值
    // 阴影视锥的范围（正交阴影相机），范围太小阴影会糊、太大会粗糙
    key.shadow.camera.left = -1.5;
    // 把右侧表达式的结果写入 key.shadow.camera.left。
    // key：缓存、映射或对象中使用的查找键；shadow：本处声明的字段或类型，类型为 DirectionalLightShadow；camera：Three.js 相机实例；left：本处声明的字段或类型，类型为 number
    key.shadow.camera.right = 1.5;
    // 把右侧表达式的结果写入 key.shadow.camera.right。
    // key：缓存、映射或对象中使用的查找键；shadow：本处声明的字段或类型，类型为 DirectionalLightShadow；camera：Three.js 相机实例；right：本处声明的字段或类型，类型为 number
    key.shadow.camera.top = 1.5;
    // 把右侧表达式的结果写入 key.shadow.camera.top。
    // key：缓存、映射或对象中使用的查找键；shadow：本处声明的字段或类型，类型为 DirectionalLightShadow；camera：Three.js 相机实例；top：本处声明的字段或类型，类型为 number
    key.shadow.camera.bottom = -1.5;
    // 把右侧表达式的结果写入 key.shadow.camera.bottom。
    // key：缓存、映射或对象中使用的查找键；shadow：本处声明的字段或类型，类型为 DirectionalLightShadow；camera：Three.js 相机实例；bottom：本处声明的字段或类型，类型为 number
    this.scene.add(key);
    // 将元素加入集合或将子节点挂到场景对象。
    // scene：Three.js 场景实例；add：将元素加入集合或将子节点挂到场景对象；key：缓存、映射或对象中使用的查找键
    // 补一点冷色轮廓光,让机械臂背光面不死黑
    const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
    // 创建用于三维场景补光的方向光源，将结果保存或写入 rim。
    // rim：本处保存 new THREE.DirectionalLight(0x88aaff, 0.5) 的结果；THREE：从 three 导入的三维 API 命名空间；DirectionalLight：THREE 对象上的字段或操作
    rim.position.set(-2, 1.5, -2);
    // 按键写入当前映射、缓存或对象的值。
    // rim：本处保存 new THREE.DirectionalLight(0x88aaff, 0.5) 的结果；position：三维物体相对父节点的位置；set：按键写入当前映射、缓存或对象的值
    this.scene.add(rim);
    // 将元素加入集合或将子节点挂到场景对象。
    // scene：Three.js 场景实例；add：将元素加入集合或将子节点挂到场景对象；rim：本处保存 new THREE.DirectionalLight(0x88aaff, 0.5) 的结果

    // 地面 + 网格
    // ---------- 地面 + 网格 ----------
    // 圆形地面（半径 3），接收阴影
    const ground = new THREE.Mesh(
    // 创建或使用Three.js 将几何体与材质组合为可渲染物体的类，将结果保存或写入 ground。
    // ground：本处保存 new THREE.Mesh( new THREE.CircleGeometry(3, 64), new THREE.M… 的结果；THREE：从 three 导入的三维 API 命名空间；Mesh：Three.js 将几何体与材质组合为可渲染物体的类
      new THREE.CircleGeometry(3, 64),
      // 执行 CircleGeometry 对应的本地处理，使用本行提供的数据。
      // THREE：从 three 导入的三维 API 命名空间；CircleGeometry：THREE 对象上的字段或操作
      new THREE.MeshStandardMaterial({ color: 0x0e141b, roughness: 0.9, metalness: 0.1 }),
      // 创建或使用Three.js 基于光照的标准材质类。
      // THREE：从 three 导入的三维 API 命名空间；MeshStandardMaterial：Three.js 基于光照的标准材质类；color：材质或界面的颜色；roughness：材质表面的粗糙度系数；metalness：材质的金属感系数
    );
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    // 绕 X 轴旋转 -90°，让圆面从"竖着"变成"平躺"（默认圆面在 XY 平面）
    ground.rotation.x = -Math.PI / 2;
    // 把右侧表达式的结果写入 ground.rotation.x。
    // ground：本处保存 new THREE.Mesh( new THREE.CircleGeometry(3, 64), new THREE.M… 的结果；rotation：三维物体绕各轴的旋转，Three.js 使用弧度；x：本处声明的字段或类型，类型为 number；Math：JavaScript 数学计算 API；PI：本处声明的字段或类型，类型为 number
    ground.receiveShadow = true;
    // 把右侧表达式的结果写入 ground.receiveShadow。
    // ground：本处保存 new THREE.Mesh( new THREE.CircleGeometry(3, 64), new THREE.M… 的结果；receiveShadow：三维物体是否接收阴影
    this.scene.add(ground);
    // 将元素加入集合或将子节点挂到场景对象。
    // scene：Three.js 场景实例；add：将元素加入集合或将子节点挂到场景对象；ground：本处保存 new THREE.Mesh( new THREE.CircleGeometry(3, 64), new THREE.M… 的结果
    // 网格辅助线：6 单位见方、60 格 —— 提供空间参考系，看得出机械臂动多大
    const grid = new THREE.GridHelper(6, 60, 0x2a3a4a, 0x18222e);
    // 执行 GridHelper 对应的本地处理，使用本行提供的数据，将结果保存或写入 grid。
    // grid：本处保存 new THREE.GridHelper(6, 60, 0x2a3a4a, 0x18222e) 的结果；THREE：从 three 导入的三维 API 命名空间；GridHelper：THREE 对象上的字段或操作
    // 抬高 0.001，避免与地面 Z-fighting（两个面完全共面时闪烁）
    grid.position.y = 0.001;
    // 把右侧表达式的结果写入 grid.position.y。
    // grid：本处保存 new THREE.GridHelper(6, 60, 0x2a3a4a, 0x18222e) 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    this.scene.add(grid);
    // 将元素加入集合或将子节点挂到场景对象。
    // scene：Three.js 场景实例；add：将元素加入集合或将子节点挂到场景对象；grid：本处保存 new THREE.GridHelper(6, 60, 0x2a3a4a, 0x18222e) 的结果

    // ---------- 尺寸自适应 ----------
    // ResizeObserver：容器尺寸变化时自动回调（比监听 window.resize 更精确）
    this.observer = new ResizeObserver(() => this.resize());
    // 把右侧表达式的结果写入 this.observer。
    // observer：本处声明的字段或类型，类型为 ResizeObserver；ResizeObserver：本处保存的局部数据，类型为 { prototype: ResizeObserver; new(callback: ResizeO…；resize：根据容器尺寸同步更新相机宽高比和渲染画布
    this.observer.observe(container);
    // 执行 observe 对应的本地处理，使用本行提供的数据。
    // observer：本处声明的字段或类型，类型为 ResizeObserver；observe：本处声明的字段或类型，类型为 void；container：当前方法接收的参数，类型为 HTMLElement
    // 立即执行一次，让画布铺满容器
    this.resize();
    // 根据容器尺寸同步更新相机宽高比和渲染画布。
    // resize：根据容器尺寸同步更新相机宽高比和渲染画布
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了初始化 SceneManager 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 向场景中添加一个对象（模型、网格、任何 Object3D）。
   */
  // 这一段定义 add，用于按设备编码把机械臂模型加入三维场景与实例映射。
  add(obj: THREE.Object3D) {
  // 定义方法 add；括号中声明参数，花括号内实现逻辑。
  // add：按设备编码把机械臂模型加入三维场景与实例映射；obj：当前方法接收的参数，类型为 THREE.Object3D；THREE：从 three 导入的三维 API 命名空间
    this.scene.add(obj);
    // 将元素加入集合或将子节点挂到场景对象。
    // scene：Three.js 场景实例；add：将元素加入集合或将子节点挂到场景对象；obj：当前方法接收的参数，类型为 THREE.Object3D
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了按设备编码把机械臂模型加入三维场景与实例映射的实现；实际结果由运行时输入和执行分支决定。

  // 这一段定义 start，用于启动 Three.js 的连续渲染循环。

  // start() 开始浏览器的持续绘制循环，每次 requestAnimationFrame 回调更新观察控制并渲染当前场景。
  // 关节旋转已经由 RobotArm.setJoints() 写进模型，render() 使用这些现成姿态和相机视角生成画面。
  // 重复绘制不产生新的现场测量帧，渲染频率与 PLC 采集周期分别由各自程序控制。

  start() {
  // 启动浏览器绘制循环，持续把当前模型姿态和观察视角渲染成画面。
  // requestAnimationFrame 调度下一次绘制；this.controls 更新相机交互，this.renderer.render() 使用场景中的现成姿态，不生成新的 PLC 测量帧。
    // 循环体（每帧执行一次）
    // 这一段定义 loop，用于推进每帧更新并绘制三维场景。
    const loop = () => {
    // 根据 () => { 设置 loop，供当前流程后续使用。
    // loop：推进每帧更新并绘制三维场景
      // 已销毁就退出循环（dispose 里会置位）
      if (this.disposed) return;
      // 检查(this.disposed) return;，按判断结果进入对应的处理分支。
      // disposed：this 对象上的字段或操作
      // 预约下一帧 —— 这一行让循环持续下去
      this.raf = requestAnimationFrame(loop);
      // 把右侧表达式的结果写入 this.raf。
      // raf：this 对象上的字段或操作；requestAnimationFrame：在浏览器下一帧绘制前安排回调；loop：推进每帧更新并绘制三维场景
      // 更新控制器（处理阻尼惯性、边界限制）
      this.controls.update();
      // 按本行数据更新当前状态或对象字段。
      // controls：相机交互控制器；update：提供 update 的本地处理逻辑
      // 真正把场景画到 canvas 上
      this.renderer.render(this.scene, this.camera);
      // 使用指定相机绘制当前三维场景。
      // renderer：Three.js WebGL 渲染器实例；render：使用指定相机绘制当前三维场景；scene：Three.js 场景实例；camera：Three.js 相机实例
    };
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
    // 这一段提供了推进每帧更新并绘制三维场景的实现；实际结果由运行时输入和执行分支决定。
    // 启动第一帧
    loop();
    // 推进每帧更新并绘制三维场景。
    // loop：推进每帧更新并绘制三维场景
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了启动 Three.js 的连续渲染循环的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 容器尺寸变化时的处理：调整相机宽高比 + 渲染器尺寸。
   * 宽高比必须同步，否则画面会被拉伸变形。
   */
  // 这一段定义 resize，用于根据容器尺寸同步更新相机宽高比和渲染画布。
  resize() {
  // 定义方法 resize；括号中声明参数，花括号内实现逻辑。
  // resize：根据容器尺寸同步更新相机宽高比和渲染画布
    // 读容器尺寸，|| 1 兜底（尺寸为 0 时相机会除以 0 得到 NaN，导致画面全黑）
    const w = this.container.clientWidth || 1;
    // 根据 this.container.clientWidth || 1 设置 w，供当前流程后续使用。
    // w：本处保存 this.container.clientWidth || 1 的结果；container：当前方法接收的参数，类型为 HTMLElement；clientWidth：本处声明的字段或类型，类型为 number
    const h = this.container.clientHeight || 1;
    // 根据 this.container.clientHeight || 1 设置 h，供当前流程后续使用。
    // h：本处保存 this.container.clientHeight || 1 的结果；container：当前方法接收的参数，类型为 HTMLElement；clientHeight：本处声明的字段或类型，类型为 number
    // 设置相机宽高比
    this.camera.aspect = w / h;
    // 把右侧表达式的结果写入 this.camera.aspect。
    // camera：Three.js 相机实例；aspect：本处声明的字段或类型，类型为 number；w：本处保存 this.container.clientWidth || 1 的结果；h：本处保存 this.container.clientHeight || 1 的结果
    // ★ 必须调用 updateProjectionMatrix()，否则新的 aspect 不会生效
    this.camera.updateProjectionMatrix();
    // 根据相机新参数更新投影矩阵。
    // camera：Three.js 相机实例；updateProjectionMatrix：根据相机新参数更新投影矩阵
    // 设置渲染器绘制缓冲区尺寸（第三个参数 updateStyle=true 会同步修改 canvas 的 CSS 尺寸）
    this.renderer.setSize(w, h);
    // 设置渲染画布的宽度和高度。
    // renderer：Three.js WebGL 渲染器实例；setSize：设置渲染画布的宽度和高度；w：本处保存 this.container.clientWidth || 1 的结果；h：本处保存 this.container.clientHeight || 1 的结果
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了根据容器尺寸同步更新相机宽高比和渲染画布的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 释放所有资源。
   * ★ 必须调用：否则用户反复切换页面会导致 GPU 内存泄漏，浏览器最终崩溃。
   */
  // 这一段定义 dispose，用于清理三维场景、监听器和渲染资源。
  dispose() {
  // 定义方法 dispose；括号中声明参数，花括号内实现逻辑。
  // dispose：清理三维场景、监听器和渲染资源
    // 标记已销毁，让主循环下一帧自行退出
    this.disposed = true;
    // 把右侧表达式的结果写入 this.disposed。
    // disposed：this 对象上的字段或操作
    // 取消待执行的动画帧
    cancelAnimationFrame(this.raf);
    // 执行 cancelAnimationFrame 对应的本地处理，使用本行提供的数据。
    // cancelAnimationFrame：取消已安排的浏览器绘制回调；raf：this 对象上的字段或操作
    // 停止尺寸监听
    this.observer.disconnect();
    // 关闭当前通信连接。
    // observer：本处声明的字段或类型，类型为 ResizeObserver；disconnect：断开实时通信客户端连接
    // 释放控制器内部的事件监听
    this.controls.dispose();
    // 释放 GPU、材质、几何体或控制器资源。
    // controls：相机交互控制器；dispose：释放 GPU、材质、几何体或控制器资源
    // 释放渲染器占用的 GPU 资源
    this.renderer.dispose();
    // 释放 GPU、材质、几何体或控制器资源。
    // renderer：Three.js WebGL 渲染器实例；dispose：释放 GPU、材质、几何体或控制器资源
    // 把 canvas 从 DOM 里移除
    this.renderer.domElement.remove();
    // 执行 remove 对应的本地处理，使用本行提供的数据。
    // renderer：Three.js WebGL 渲染器实例；domElement：本处声明的字段或类型，类型为 HTMLCanvasElement；remove：本处声明的字段或类型，类型为 void
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了清理三维场景、监听器和渲染资源的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了管理三维场景、相机、渲染循环与资源释放所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 SceneManager 的字段或服务能力，供项目其他模块使用。
