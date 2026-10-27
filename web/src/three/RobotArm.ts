/**
 // 这一段负责创建并驱动程序化六轴机械臂模型，为后续代码提供当前文件的处理入口。
 * ============================================================================
 * 文件作用：程序化 6 轴机械臂模型（占位模型，可一键换成真实 URDF）
 * 所属模块：web/src/three/
 * ============================================================================
 *
 * ============================================================================
 * ★ 本文件是"数字孪生"最核心的可视化部分 ★
 * ============================================================================
 *
 * 【为什么不用真模型】
 *   厂商 URDF/STEP 模型通常要几天才能拿到。
 *   这个模型用基础几何体拼出标准 6 轴结构（J1 底座回转 / J2 J3 俯仰 /
 *   J4 J6 滚转 / J5 腕部俯仰），**关节层次、轴向、驱动接口与真实模型完全一致**，
 *   所以拿到 URDF 后只需用 urdf-loader 替换本类，保持 `setJoints(deg[6])`
 *   接口不变即可 —— 前端页面一行都不用改。
 *
 * 【尺寸单位】米。总臂展约 0.9m，接近常见桌面级 6 轴臂。
 *
 * 【★ 关节父子层级（这是 3D 机器人动画的原理，务必理解）】
 *
 *   group (根)
 *    ├─ 底座(固定,不转)
 *    └─ j1 (J1 底座回转, 绕 Y 轴)
 *        └─ j2 (J2 大臂俯仰, 绕 Z 轴)   ← 挂在 j1 上
 *            └─ j3 (J3 小臂俯仰, 绕 Z 轴) ← 挂在 j2 上
 *                └─ j4 (J4 小臂滚转, 绕 Y 轴)
 *                    └─ j5 (J5 腕部俯仰, 绕 Z 轴)
 *                        └─ j6 (J6 法兰滚转, 绕 Y 轴)
 *
 *   关键机制：旋转 j1 会带动它**下面所有的**子节点一起转（J1 转 30°，
 *   整条手臂就转 30°）。旋转 j2 只会带动大臂+小臂+腕部，不影响底座。
 *   这正是真实机器人的运动学 —— 上游关节的运动被下游继承。
 *   实现上：每层是一个 THREE.Group，父 group 用 .add() 挂子 group，
 *   子 group 的 position 是"相对父关节的偏移"。
 *
 * 【轴向约定】
 *   J1 绕 Y（垂直轴，水平转动）—— 底座回转
 *   J2 绕 Z（前后俯仰）        —— 大臂
 *   J3 绕 Z                    —— 小臂
 *   J4 绕 Y（沿臂轴滚转）      —— 腕部
 *   J5 绕 Z                    —— 腕部俯仰
 *   J6 绕 Y                    —— 法兰
 *   JOINT_AXES 数组定义了每个关节的旋转轴，与真实六轴臂一致。
 *
 * 【数据契约】
 *   后端推来的 joints[6] 单位是**度**，这里用 degToRad 转成**弧度**
 *   （Three.js 的 rotation 单位是弧度）。
 */
import * as THREE from 'three';
// 从 three 导入这一行列出的符号，供本文件调用。
// THREE：从 three 导入的三维 API 命名空间

/**
 * 程序化 6 轴机械臂(占位模型)
 *
 * 为什么不用真模型:厂商 URDF/STEP 通常要几天才能拿到。
 * 这个模型用几何体拼出标准 6 轴结构(J1 底座回转 / J2 J3 俯仰 / J4 J6 滚转 / J5 腕部俯仰),
 * 关节层次、轴向、驱动接口与真实模型完全一致 —— 拿到 URDF 后,
 * 只需用 urdf-loader 替换本类,保持 setJoints(deg[6]) 接口不变即可。
 *
 * 尺寸单位:米。总臂展约 0.9m,接近常见桌面级 6 轴臂。
 */

/** 旋转轴类型 */
type Axis = 'x' | 'y' | 'z';
// 定义 Axis，约束或实现本模块涉及的数据和行为。
// Axis：本处声明的字段或类型，类型为 'x' | 'y' | 'z'

const JOINT_AXES: Axis[] = ['y', 'z', 'z', 'y', 'z', 'y'];
// 声明 JOINT_AXES，初始值由 ['y', 'z', 'z', 'y', 'z', 'y'] 计算得到，供当前处理流程继续使用。
// JOINT_AXES：本处保存 ['y', 'z', 'z', 'y', 'z', 'y'] 的结果，类型为 Axis[]；Axis：本处声明的字段或类型，类型为 'x' | 'y' | 'z'

/** 机械臂主体材质：橙色金属 */
const MAT_ARM = new THREE.MeshStandardMaterial({
// 创建或使用Three.js 基于光照的标准材质类，将结果保存或写入 MAT_ARM。
// MAT_ARM：本处保存 new THREE.MeshStandardMaterial({ color: 0xe67e22, metalness:… 的结果；THREE：从 three 导入的三维 API 命名空间；MeshStandardMaterial：Three.js 基于光照的标准材质类
  color: 0xe67e22, metalness: 0.35, roughness: 0.45,
  // 声明或设置 color，用于材质或界面的颜色。
  // color：材质或界面的颜色；metalness：材质的金属感系数；roughness：材质表面的粗糙度系数
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
/** 关节材质：深蓝灰，更金属感 */
const MAT_JOINT = new THREE.MeshStandardMaterial({
// 创建或使用Three.js 基于光照的标准材质类，将结果保存或写入 MAT_JOINT。
// MAT_JOINT：本处保存 new THREE.MeshStandardMaterial({ color: 0x34495e, metalness:… 的结果；THREE：从 three 导入的三维 API 命名空间；MeshStandardMaterial：Three.js 基于光照的标准材质类
  color: 0x34495e, metalness: 0.6, roughness: 0.35,
  // 声明或设置 color，用于材质或界面的颜色。
  // color：材质或界面的颜色；metalness：材质的金属感系数；roughness：材质表面的粗糙度系数
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
/** 底座材质：更暗 */
const MAT_BASE = new THREE.MeshStandardMaterial({
// 创建或使用Three.js 基于光照的标准材质类，将结果保存或写入 MAT_BASE。
// MAT_BASE：本处保存 new THREE.MeshStandardMaterial({ color: 0x22303c, metalness:… 的结果；THREE：从 three 导入的三维 API 命名空间；MeshStandardMaterial：Three.js 基于光照的标准材质类
  color: 0x22303c, metalness: 0.5, roughness: 0.6,
  // 声明或设置 color，用于材质或界面的颜色。
  // color：材质或界面的颜色；metalness：材质的金属感系数；roughness：材质表面的粗糙度系数
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
/** 关节光环材质：橙色自发光（报警时会被改成红色） */
const MAT_RING = new THREE.MeshStandardMaterial({
// 创建或使用Three.js 基于光照的标准材质类，将结果保存或写入 MAT_RING。
// MAT_RING：本处保存 new THREE.MeshStandardMaterial({ color: 0x181818, emissive: … 的结果；THREE：从 three 导入的三维 API 命名空间；MeshStandardMaterial：Three.js 基于光照的标准材质类
  color: 0x181818, emissive: 0xff8c42, emissiveIntensity: 0.8,
  // 声明或设置 color，用于材质或界面的颜色。
  // color：材质或界面的颜色；emissive：材质自发光颜色；emissiveIntensity：材质自发光强度
  metalness: 0.2, roughness: 0.5,
  // 声明或设置 metalness，用于材质的金属感系数。
  // metalness：材质的金属感系数；roughness：材质表面的粗糙度系数
});
// 结束当前回调或对象，并完成外层函数调用，供当前处理流程继续使用。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

// 这一段定义 mesh，用于将三维几何体和材质组合成带轮廓线的机械臂网格。
function mesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
// 定义 mesh，用于将三维几何体和材质组合成带轮廓线的机械臂网格。
// mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；geo：当前方法接收的参数，类型为 THREE.BufferGeometry；THREE：从 three 导入的三维 API 命名空间；BufferGeometry：Three.js 几何体类型，保存顶点等绘制数据；mat：当前方法接收的参数，类型为 THREE.Material；Material：Three.js 材质基础类型；Mesh：Three.js 将几何体与材质组合为可渲染物体的类
  const m = new THREE.Mesh(geo, mat);
  // 创建或使用Three.js 将几何体与材质组合为可渲染物体的类，将结果保存或写入 m。
  // m：本处保存 new THREE.Mesh(geo, mat) 的结果；THREE：从 three 导入的三维 API 命名空间；Mesh：Three.js 将几何体与材质组合为可渲染物体的类；geo：当前方法接收的参数，类型为 THREE.BufferGeometry；mat：当前方法接收的参数，类型为 THREE.Material
  // 投射阴影
  m.castShadow = true;
  // 把右侧表达式的结果写入 m.castShadow。
  // m：本处保存 new THREE.Mesh(geo, mat) 的结果；castShadow：三维物体是否投射阴影
  // 加一圈淡淡的轮廓线,增强"工程图"质感
  // EdgesGeometry(几何体, 30) —— 30 度以内的折角视为平滑，不画边
  const edges = new THREE.LineSegments(
  // 创建或使用Three.js 按独立线段绘制轮廓的类，将结果保存或写入 edges。
  // edges：本处保存 new THREE.LineSegments( new THREE.EdgesGeometry(geo, 30), ne… 的结果；THREE：从 three 导入的三维 API 命名空间；LineSegments：Three.js 按独立线段绘制轮廓的类
    new THREE.EdgesGeometry(geo, 30),
    // 创建或使用Three.js 提取几何体轮廓边的类。
    // THREE：从 three 导入的三维 API 命名空间；EdgesGeometry：Three.js 提取几何体轮廓边的类；geo：当前方法接收的参数，类型为 THREE.BufferGeometry
    new THREE.LineBasicMaterial({ color: 0xbfd9ff, transparent: true, opacity: 0.10 }),
    // 创建或使用Three.js 线段材质类。
    // THREE：从 three 导入的三维 API 命名空间；LineBasicMaterial：Three.js 线段材质类；color：材质或界面的颜色；transparent：是否启用透明渲染；opacity：显示不透明度
  );
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 轮廓线作为子物体挂在网格上（会跟随网格一起变换）
  m.add(edges);
  // 将元素加入集合或将子节点挂到场景对象。
  // m：本处保存 new THREE.Mesh(geo, mat) 的结果；add：将元素加入集合或将子节点挂到场景对象；edges：本处保存 new THREE.LineSegments( new THREE.EdgesGeometry(geo, 30), ne… 的结果
  return m;
  // 把m作为当前函数的结果返回。
  // m：本处保存 new THREE.Mesh(geo, mat) 的结果
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了将三维几何体和材质组合成带轮廓线的机械臂网格的实现；实际结果由运行时输入和执行分支决定。

// 关节处的发光环:运行时可通过 alarm 状态变红
/**
 * 关节处的发光环:运行时可通过 alarm 状态变红
 * @param radius 环半径
 * @param axis   环所在的旋转轴（决定环的朝向）
 * @param mat    材质
 */
// 这一段定义 jointRing，用于创建指定方向的关节发光环网格。
function jointRing(radius: number, axis: Axis, mat: THREE.Material): THREE.Mesh {
// 定义函数 jointRing。
// jointRing：创建指定方向的关节发光环网格；radius：当前方法接收的参数，类型为 number；axis：当前方法接收的参数，类型为 Axis；Axis：本处声明的字段或类型，类型为 'x' | 'y' | 'z'；mat：当前方法接收的参数，类型为 THREE.Material；THREE：从 three 导入的三维 API 命名空间；Material：Three.js 材质基础类型；Mesh：Three.js 将几何体与材质组合为可渲染物体的类
  // TorusGeometry(半径, 管粗, 径向分段, 管向分段) —— 一个甜甜圈
  const ring = mesh(new THREE.TorusGeometry(radius, 0.008, 10, 48), mat);
  // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 ring。
  // ring：本处保存 mesh(new THREE.TorusGeometry(radius, 0.008, 10, 48), mat) 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；TorusGeometry：Three.js 圆环几何体类；radius：当前方法接收的参数，类型为 number；mat：当前方法接收的参数，类型为 THREE.Material
  // torus 默认躺在 XY 平面（法线朝 Z）
  if (axis === 'y') ring.rotation.x = Math.PI / 2;
  // 检查(axis === 'y') ring.rotation.x = Math.PI / 2;，按判断结果进入对应的处理分支。
  // axis：当前方法接收的参数，类型为 Axis；ring：本处保存 mesh(new THREE.TorusGeometry(radius, 0.008, 10, 48), mat) 的结果；rotation：三维物体绕各轴的旋转，Three.js 使用弧度；x：本处声明的字段或类型，类型为 number；Math：JavaScript 数学计算 API；PI：本处声明的字段或类型，类型为 number
  if (axis === 'z') ring.rotation.y = 0; // torus 默认就在 XY 平面,轴为 Z
  // 检查(axis === 'z') ring.rotation.y = 0; // torus 默认就在 XY 平面,轴为 Z，按判断结果进入对应的处理分支。
  // axis：当前方法接收的参数，类型为 Axis；ring：本处保存 mesh(new THREE.TorusGeometry(radius, 0.008, 10, 48), mat) 的结果；rotation：三维物体绕各轴的旋转，Three.js 使用弧度；y：本处声明的字段或类型，类型为 number
  if (axis === 'x') ring.rotation.y = Math.PI / 2;
  // 检查(axis === 'x') ring.rotation.y = Math.PI / 2;，按判断结果进入对应的处理分支。
  // axis：当前方法接收的参数，类型为 Axis；ring：本处保存 mesh(new THREE.TorusGeometry(radius, 0.008, 10, 48), mat) 的结果；rotation：三维物体绕各轴的旋转，Three.js 使用弧度；y：本处声明的字段或类型，类型为 number；Math：JavaScript 数学计算 API；PI：本处声明的字段或类型，类型为 number
  return ring;
  // 把ring作为当前函数的结果返回。
  // ring：本处保存 mesh(new THREE.TorusGeometry(radius, 0.008, 10, 48), mat) 的结果
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了创建指定方向的关节发光环网格的实现；实际结果由运行时输入和执行分支决定。

/**
 * 机械臂模型类。
 */
// 这一段声明 RobotArm，用于项目定义的程序化六轴机械臂模型类。
export class RobotArm {
// 定义 RobotArm，约束或实现本模块涉及的数据和行为。
// RobotArm：项目定义的程序化六轴机械臂模型类
  /** 根节点：整个机械臂挂在这个 Group 下，由页面 scene.add(arm.group) 加入场景 */
  readonly group = new THREE.Group();
  // 创建或使用Three.js 场景节点容器，子物体继承父节点变换。
  // group：组织机械臂或场景对象的父节点；THREE：从 three 导入的三维 API 命名空间；Group：Three.js 场景节点容器，子物体继承父节点变换
  /** 六个关节的 pivot Group（按 J1..J6 顺序），setJoints 按索引旋转它们 */
  private readonly joints: THREE.Group[] = [];
  // 声明类属性或构造参数 joints，类型为 THREE.Group[] = []。
  // joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度；THREE：从 three 导入的三维 API 命名空间；Group：Three.js 场景节点容器，子物体继承父节点变换
  /** 六个关节的发光环，setAlarm 按索引改它们的自发光颜色 */
  private readonly rings: THREE.Mesh[] = [];
  // 声明类属性或构造参数 rings，类型为 THREE.Mesh[] = []。
  // rings：本处声明的字段或类型，类型为 THREE.Mesh[]；THREE：从 three 导入的三维 API 命名空间；Mesh：Three.js 将几何体与材质组合为可渲染物体的类

  // 这一段定义 constructor，用于初始化 RobotArm 使用的实例状态和依赖。

  // RobotArm 构造函数在浏览器里创建六轴机械臂的几何示意模型，由 TwinView 挂载到三维场景。
  // 这里建立底座、关节组和连杆的父子关系，并把可旋转的关节节点收进 this.joints，供 setJoints() 后续更新。
  // 它没有访问 PLC，也没有根据模型外观反推现场角度；模型姿态来自网页收到的六个关节角。

  constructor() {
  // 创建机械臂的底座、关节和连杆示意几何体，并建立后续姿态更新所需的节点引用。
  // RobotArm 是项目定义的浏览器模型类；this.group 是供 SceneManager 加入场景的总节点，this.joints 保存六个关节变换节点。
    // ---- 固定底座 ----
    // 底座主体：上小下大的圆柱（半径 0.20→0.24，高 0.12）
    const base = mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.12, 32), MAT_BASE);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 base。
    // base：本处保存 mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.12, 32), MAT_B… 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；CylinderGeometry：Three.js 圆柱几何体类；MAT_BASE：本处保存 new THREE.MeshStandardMaterial({ color: 0x22303c, metalness:… 的结果
    base.position.y = 0.06;
    // 把右侧表达式的结果写入 base.position.y。
    // base：本处保存 mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.12, 32), MAT_B… 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    base.receiveShadow = true;
    // 把右侧表达式的结果写入 base.receiveShadow。
    // base：本处保存 mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.12, 32), MAT_B… 的结果；receiveShadow：三维物体是否接收阴影
    this.group.add(base);
    // 将元素加入集合或将子节点挂到场景对象。
    // group：组织机械臂或场景对象的父节点；add：将元素加入集合或将子节点挂到场景对象；base：本处保存 mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.12, 32), MAT_B… 的结果
    // 底座安装板：扁圆柱
    const basePlate = mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.02, 32), MAT_BASE);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 basePlate。
    // basePlate：本处保存 mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.02, 32), MAT_B… 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；CylinderGeometry：Three.js 圆柱几何体类；MAT_BASE：本处保存 new THREE.MeshStandardMaterial({ color: 0x22303c, metalness:… 的结果
    basePlate.position.y = 0.01;
    // 把右侧表达式的结果写入 basePlate.position.y。
    // basePlate：本处保存 mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.02, 32), MAT_B… 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    basePlate.receiveShadow = true;
    // 把右侧表达式的结果写入 basePlate.receiveShadow。
    // basePlate：本处保存 mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.02, 32), MAT_B… 的结果；receiveShadow：三维物体是否接收阴影
    this.group.add(basePlate);
    // 将元素加入集合或将子节点挂到场景对象。
    // group：组织机械臂或场景对象的父节点；add：将元素加入集合或将子节点挂到场景对象；basePlate：本处保存 mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.02, 32), MAT_B… 的结果

    // ---- J1:底座回转(绕 Y) ----
    // 每个关节都是独立的 Group，作为下一级关节的父节点

    // 从 J1 开始逐级建立关节父子关系：Group 是变换节点，Mesh 是挂在该节点下的可见几何体。
    // 后续关节挂在前一关节下面，所以 J1 转动会同时带动其后的连杆和关节；每个关节仍能叠加自己的局部旋转。
    // register() 保存关节引用，setJoints() 才能按 J1～J6 的次序找到应更新的节点。

    const j1 = new THREE.Group();
    // 创建 J1 的关节变换组，下面再把可见几何体和后续关节挂到它的层级中。
    // j1 是 Three.js 的 Group，不是现场 PLC 对象；父节点旋转会带动其子节点，register() 保存供 setJoints() 使用的引用。
    j1.position.y = 0.12;
    // 把右侧表达式的结果写入 j1.position.y。
    // j1：本处保存 new THREE.Group() 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    // 回转台
    const turntable = mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 32), MAT_JOINT);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 turntable。
    // turntable：本处保存 mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 32), MAT_J… 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；CylinderGeometry：Three.js 圆柱几何体类；MAT_JOINT：本处保存 new THREE.MeshStandardMaterial({ color: 0x34495e, metalness:… 的结果
    turntable.position.y = 0.04;
    // 把右侧表达式的结果写入 turntable.position.y。
    // turntable：本处保存 mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 32), MAT_J… 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    j1.add(turntable);
    // 将元素加入集合或将子节点挂到场景对象。
    // j1：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；turntable：本处保存 mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 32), MAT_J… 的结果
    // 肩部方块（大臂的安装座）
    const shoulder = mesh(new THREE.BoxGeometry(0.14, 0.16, 0.16), MAT_ARM);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 shoulder。
    // shoulder：本处保存 mesh(new THREE.BoxGeometry(0.14, 0.16, 0.16), MAT_ARM) 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；BoxGeometry：Three.js 长方体几何体类；MAT_ARM：本处保存 new THREE.MeshStandardMaterial({ color: 0xe67e22, metalness:… 的结果
    shoulder.position.y = 0.14;
    // 把右侧表达式的结果写入 shoulder.position.y。
    // shoulder：本处保存 mesh(new THREE.BoxGeometry(0.14, 0.16, 0.16), MAT_ARM) 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    j1.add(shoulder);
    // 将元素加入集合或将子节点挂到场景对象。
    // j1：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；shoulder：本处保存 mesh(new THREE.BoxGeometry(0.14, 0.16, 0.16), MAT_ARM) 的结果
    // 注册关节（加光环 + 记入 joints/rings 数组）
    this.register(j1, 0.16);
    // 将机械臂实例按设备编码登记到场景管理器。
    // register：将机械臂实例按设备编码登记到场景管理器；j1：本处保存 new THREE.Group() 的结果
    // 挂到根节点下
    this.group.add(j1);
    // 将元素加入集合或将子节点挂到场景对象。
    // group：组织机械臂或场景对象的父节点；add：将元素加入集合或将子节点挂到场景对象；j1：本处保存 new THREE.Group() 的结果

    // ---- J2:大臂俯仰(绕 Z) ----
    const j2 = new THREE.Group();
    // 创建或使用Three.js 场景节点容器，子物体继承父节点变换，将结果保存或写入 j2。
    // j2：本处保存 new THREE.Group() 的结果；THREE：从 three 导入的三维 API 命名空间；Group：Three.js 场景节点容器，子物体继承父节点变换
    j2.position.y = 0.22;
    // 把右侧表达式的结果写入 j2.position.y。
    // j2：本处保存 new THREE.Group() 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    // 关节轴（圆柱横躺，绕 X 转 90° 让轴向变成 Z）
    const j2Axis = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 24), MAT_JOINT);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 j2Axis。
    // j2Axis：本处保存 mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 24), MAT… 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；CylinderGeometry：Three.js 圆柱几何体类；MAT_JOINT：本处保存 new THREE.MeshStandardMaterial({ color: 0x34495e, metalness:… 的结果
    j2Axis.rotation.x = Math.PI / 2;
    // 把右侧表达式的结果写入 j2Axis.rotation.x。
    // j2Axis：本处保存 mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 24), MAT… 的结果；rotation：三维物体绕各轴的旋转，Three.js 使用弧度；x：本处声明的字段或类型，类型为 number；Math：JavaScript 数学计算 API；PI：本处声明的字段或类型，类型为 number
    j2.add(j2Axis);
    // 将元素加入集合或将子节点挂到场景对象。
    // j2：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；j2Axis：本处保存 mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 24), MAT… 的结果
    // 大臂主体（长方体，向上）
    const upperArm = mesh(new THREE.BoxGeometry(0.11, 0.42, 0.13), MAT_ARM);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 upperArm。
    // upperArm：本处保存 mesh(new THREE.BoxGeometry(0.11, 0.42, 0.13), MAT_ARM) 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；BoxGeometry：Three.js 长方体几何体类；MAT_ARM：本处保存 new THREE.MeshStandardMaterial({ color: 0xe67e22, metalness:… 的结果
    upperArm.position.y = 0.21;
    // 把右侧表达式的结果写入 upperArm.position.y。
    // upperArm：本处保存 mesh(new THREE.BoxGeometry(0.11, 0.42, 0.13), MAT_ARM) 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    j2.add(upperArm);
    // 将元素加入集合或将子节点挂到场景对象。
    // j2：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；upperArm：本处保存 mesh(new THREE.BoxGeometry(0.11, 0.42, 0.13), MAT_ARM) 的结果
    this.register(j2, 0.085);
    // 将机械臂实例按设备编码登记到场景管理器。
    // register：将机械臂实例按设备编码登记到场景管理器；j2：本处保存 new THREE.Group() 的结果
    // ★ 关键：j2 挂到 j1 上（不是挂到 group 上）→ 实现运动学继承
    j1.add(j2);
    // 将元素加入集合或将子节点挂到场景对象。
    // j1：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；j2：本处保存 new THREE.Group() 的结果

    // ---- J3:小臂俯仰(绕 Z) ----
    const j3 = new THREE.Group();
    // 创建或使用Three.js 场景节点容器，子物体继承父节点变换，将结果保存或写入 j3。
    // j3：本处保存 new THREE.Group() 的结果；THREE：从 three 导入的三维 API 命名空间；Group：Three.js 场景节点容器，子物体继承父节点变换
    j3.position.y = 0.42;
    // 把右侧表达式的结果写入 j3.position.y。
    // j3：本处保存 new THREE.Group() 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    const j3Axis = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 24), MAT_JOINT);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 j3Axis。
    // j3Axis：本处保存 mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 24), MAT_J… 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；CylinderGeometry：Three.js 圆柱几何体类；MAT_JOINT：本处保存 new THREE.MeshStandardMaterial({ color: 0x34495e, metalness:… 的结果
    j3Axis.rotation.x = Math.PI / 2;
    // 把右侧表达式的结果写入 j3Axis.rotation.x。
    // j3Axis：本处保存 mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 24), MAT_J… 的结果；rotation：三维物体绕各轴的旋转，Three.js 使用弧度；x：本处声明的字段或类型，类型为 number；Math：JavaScript 数学计算 API；PI：本处声明的字段或类型，类型为 number
    j3.add(j3Axis);
    // 将元素加入集合或将子节点挂到场景对象。
    // j3：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；j3Axis：本处保存 mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 24), MAT_J… 的结果
    const forearm = mesh(new THREE.BoxGeometry(0.09, 0.36, 0.11), MAT_ARM);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 forearm。
    // forearm：本处保存 mesh(new THREE.BoxGeometry(0.09, 0.36, 0.11), MAT_ARM) 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；BoxGeometry：Three.js 长方体几何体类；MAT_ARM：本处保存 new THREE.MeshStandardMaterial({ color: 0xe67e22, metalness:… 的结果
    forearm.position.y = 0.18;
    // 把右侧表达式的结果写入 forearm.position.y。
    // forearm：本处保存 mesh(new THREE.BoxGeometry(0.09, 0.36, 0.11), MAT_ARM) 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    j3.add(forearm);
    // 将元素加入集合或将子节点挂到场景对象。
    // j3：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；forearm：本处保存 mesh(new THREE.BoxGeometry(0.09, 0.36, 0.11), MAT_ARM) 的结果
    this.register(j3, 0.07);
    // 将机械臂实例按设备编码登记到场景管理器。
    // register：将机械臂实例按设备编码登记到场景管理器；j3：本处保存 new THREE.Group() 的结果
    j2.add(j3);
    // 将元素加入集合或将子节点挂到场景对象。
    // j2：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；j3：本处保存 new THREE.Group() 的结果

    // ---- J4:小臂滚转(绕 Y) ----
    const j4 = new THREE.Group();
    // 创建或使用Three.js 场景节点容器，子物体继承父节点变换，将结果保存或写入 j4。
    // j4：本处保存 new THREE.Group() 的结果；THREE：从 three 导入的三维 API 命名空间；Group：Three.js 场景节点容器，子物体继承父节点变换
    j4.position.y = 0.36;
    // 把右侧表达式的结果写入 j4.position.y。
    // j4：本处保存 new THREE.Group() 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    const wrist1 = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 24), MAT_JOINT);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 wrist1。
    // wrist1：本处保存 mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 24), MAT… 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；CylinderGeometry：Three.js 圆柱几何体类；MAT_JOINT：本处保存 new THREE.MeshStandardMaterial({ color: 0x34495e, metalness:… 的结果
    wrist1.position.y = 0.06;
    // 把右侧表达式的结果写入 wrist1.position.y。
    // wrist1：本处保存 mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 24), MAT… 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    j4.add(wrist1);
    // 将元素加入集合或将子节点挂到场景对象。
    // j4：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；wrist1：本处保存 mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 24), MAT… 的结果
    this.register(j4, 0.06);
    // 将机械臂实例按设备编码登记到场景管理器。
    // register：将机械臂实例按设备编码登记到场景管理器；j4：本处保存 new THREE.Group() 的结果
    j3.add(j4);
    // 将元素加入集合或将子节点挂到场景对象。
    // j3：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；j4：本处保存 new THREE.Group() 的结果

    // ---- J5:腕部俯仰(绕 Z) ----
    const j5 = new THREE.Group();
    // 创建或使用Three.js 场景节点容器，子物体继承父节点变换，将结果保存或写入 j5。
    // j5：本处保存 new THREE.Group() 的结果；THREE：从 three 导入的三维 API 命名空间；Group：Three.js 场景节点容器，子物体继承父节点变换
    j5.position.y = 0.12;
    // 把右侧表达式的结果写入 j5.position.y。
    // j5：本处保存 new THREE.Group() 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    const j5Axis = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 24), MAT_JOINT);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 j5Axis。
    // j5Axis：本处保存 mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 24), MAT_J… 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；CylinderGeometry：Three.js 圆柱几何体类；MAT_JOINT：本处保存 new THREE.MeshStandardMaterial({ color: 0x34495e, metalness:… 的结果
    j5Axis.rotation.x = Math.PI / 2;
    // 把右侧表达式的结果写入 j5Axis.rotation.x。
    // j5Axis：本处保存 mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 24), MAT_J… 的结果；rotation：三维物体绕各轴的旋转，Three.js 使用弧度；x：本处声明的字段或类型，类型为 number；Math：JavaScript 数学计算 API；PI：本处声明的字段或类型，类型为 number
    j5.add(j5Axis);
    // 将元素加入集合或将子节点挂到场景对象。
    // j5：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；j5Axis：本处保存 mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 24), MAT_J… 的结果
    const wrist2 = mesh(new THREE.BoxGeometry(0.07, 0.10, 0.09), MAT_ARM);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 wrist2。
    // wrist2：本处保存 mesh(new THREE.BoxGeometry(0.07, 0.10, 0.09), MAT_ARM) 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；BoxGeometry：Three.js 长方体几何体类；MAT_ARM：本处保存 new THREE.MeshStandardMaterial({ color: 0xe67e22, metalness:… 的结果
    wrist2.position.y = 0.05;
    // 把右侧表达式的结果写入 wrist2.position.y。
    // wrist2：本处保存 mesh(new THREE.BoxGeometry(0.07, 0.10, 0.09), MAT_ARM) 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    j5.add(wrist2);
    // 将元素加入集合或将子节点挂到场景对象。
    // j5：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；wrist2：本处保存 mesh(new THREE.BoxGeometry(0.07, 0.10, 0.09), MAT_ARM) 的结果
    this.register(j5, 0.055);
    // 将机械臂实例按设备编码登记到场景管理器。
    // register：将机械臂实例按设备编码登记到场景管理器；j5：本处保存 new THREE.Group() 的结果
    j4.add(j5);
    // 将元素加入集合或将子节点挂到场景对象。
    // j4：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；j5：本处保存 new THREE.Group() 的结果

    // ---- J6:法兰滚转(绕 Y) + 简易夹爪 ----
    const j6 = new THREE.Group();
    // 创建或使用Three.js 场景节点容器，子物体继承父节点变换，将结果保存或写入 j6。
    // j6：本处保存 new THREE.Group() 的结果；THREE：从 three 导入的三维 API 命名空间；Group：Three.js 场景节点容器，子物体继承父节点变换
    j6.position.y = 0.10;
    // 把右侧表达式的结果写入 j6.position.y。
    // j6：本处保存 new THREE.Group() 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    const flange = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 24), MAT_JOINT);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 flange。
    // flange：本处保存 mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 24), MAT… 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；CylinderGeometry：Three.js 圆柱几何体类；MAT_JOINT：本处保存 new THREE.MeshStandardMaterial({ color: 0x34495e, metalness:… 的结果
    flange.position.y = 0.025;
    // 把右侧表达式的结果写入 flange.position.y。
    // flange：本处保存 mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 24), MAT… 的结果；position：三维物体相对父节点的位置；y：本处声明的字段或类型，类型为 number
    j6.add(flange);
    // 将元素加入集合或将子节点挂到场景对象。
    // j6：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；flange：本处保存 mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 24), MAT… 的结果
    // 夹爪的两根手指（简化为两个小方块）
    const fingerL = mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 fingerL。
    // fingerL：本处保存 mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT) 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；BoxGeometry：Three.js 长方体几何体类；MAT_JOINT：本处保存 new THREE.MeshStandardMaterial({ color: 0x34495e, metalness:… 的结果
    fingerL.position.set(0.028, 0.085, 0);
    // 按键写入当前映射、缓存或对象的值。
    // fingerL：本处保存 mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT) 的结果；position：三维物体相对父节点的位置；set：按键写入当前映射、缓存或对象的值
    const fingerR = mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT);
    // 将三维几何体和材质组合成带轮廓线的机械臂网格，将结果保存或写入 fingerR。
    // fingerR：本处保存 mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT) 的结果；mesh：将三维几何体和材质组合成带轮廓线的机械臂网格；THREE：从 three 导入的三维 API 命名空间；BoxGeometry：Three.js 长方体几何体类；MAT_JOINT：本处保存 new THREE.MeshStandardMaterial({ color: 0x34495e, metalness:… 的结果
    fingerR.position.set(-0.028, 0.085, 0);
    // 按键写入当前映射、缓存或对象的值。
    // fingerR：本处保存 mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT) 的结果；position：三维物体相对父节点的位置；set：按键写入当前映射、缓存或对象的值
    j6.add(fingerL, fingerR);
    // 将元素加入集合或将子节点挂到场景对象。
    // j6：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；fingerL：本处保存 mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT) 的结果；fingerR：本处保存 mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT) 的结果
    this.register(j6, 0.05);
    // 将机械臂实例按设备编码登记到场景管理器。
    // register：将机械臂实例按设备编码登记到场景管理器；j6：本处保存 new THREE.Group() 的结果
    j5.add(j6);
    // 将元素加入集合或将子节点挂到场景对象。
    // j5：本处保存 new THREE.Group() 的结果；add：将元素加入集合或将子节点挂到场景对象；j6：本处保存 new THREE.Group() 的结果
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了初始化 RobotArm 使用的实例状态和依赖的实现；实际结果由运行时输入和执行分支决定。

  /**
   * 注册一个关节：加发光环 + 记录到数组（供 setJoints / setAlarm 按索引访问）
   * @param pivot      关节的 Group（旋转作用在它身上）
   * @param ringRadius 光环半径
   */
  // 这一段定义 register，用于将机械臂实例按设备编码登记到场景管理器。
  private register(pivot: THREE.Group, ringRadius: number) {
  // 定义方法 register；括号中声明参数，花括号内实现逻辑。
  // register：将机械臂实例按设备编码登记到场景管理器；pivot：当前方法接收的参数，类型为 THREE.Group；THREE：从 three 导入的三维 API 命名空间；Group：Three.js 场景节点容器，子物体继承父节点变换；ringRadius：当前方法接收的参数，类型为 number
    // 取当前 joints 数组长度作为关节序号（0..5），据此决定旋转轴
    const axis = JOINT_AXES[this.joints.length];
    // 根据 JOINT_AXES[this.joints.length] 设置 axis，供当前流程后续使用。
    // axis：本处保存 JOINT_AXES[this.joints.length] 的结果；JOINT_AXES：本处保存 ['y', 'z', 'z', 'y', 'z', 'y'] 的结果，类型为 Axis[]；joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度；length：本处声明的字段或类型，类型为 number
    // 创建光环。MAT_RING.clone() —— 每个环需要独立材质，
    // 否则 setAlarm 改一个环的颜色会连带改掉所有环！
    const ring = jointRing(ringRadius, axis, MAT_RING.clone());
    // 创建指定方向的关节发光环网格，将结果保存或写入 ring。
    // ring：本处保存 jointRing(ringRadius, axis, MAT_RING.clone()) 的结果；jointRing：创建指定方向的关节发光环网格；ringRadius：当前方法接收的参数，类型为 number；axis：本处保存 JOINT_AXES[this.joints.length] 的结果；MAT_RING：本处保存 new THREE.MeshStandardMaterial({ color: 0x181818, emissive: … 的结果；clone：提供 clone 的本地处理逻辑
    // 光环挂在关节 Group 上 → 跟着关节一起转
    pivot.add(ring);
    // 将元素加入集合或将子节点挂到场景对象。
    // pivot：当前方法接收的参数，类型为 THREE.Group；add：将元素加入集合或将子节点挂到场景对象；ring：本处保存 jointRing(ringRadius, axis, MAT_RING.clone()) 的结果
    // 记录关节和光环
    this.joints.push(pivot);
    // 向数组末尾追加元素。
    // joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度；push：向数组末尾追加元素；pivot：当前方法接收的参数，类型为 THREE.Group
    this.rings.push(ring);
    // 向数组末尾追加元素。
    // rings：本处声明的字段或类型，类型为 THREE.Mesh[]；push：向数组末尾追加元素；ring：本处保存 jointRing(ringRadius, axis, MAT_RING.clone()) 的结果
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了将机械臂实例按设备编码登记到场景管理器的实现；实际结果由运行时输入和执行分支决定。

  /** 按契约 joints[6](单位:度,J1~J6)驱动关节 */
  // 这一段定义 setJoints，用于把六轴角度从度转换为弧度并更新机械臂关节节点。

  // 这段只负责将已经到达网页的六轴角度应用到模型，由 TwinView 对 robot 的监听回调调用。
  // deg 按 J1～J6 排列，元素单位是度；this.joints 保存对应关节，JOINT_AXES 指定各关节使用 x、y 或 z 旋转轴。
  // Three.js 的 rotation 用弧度，所以每个有效角度先经过 degToRad()，再写入对应 pivot.rotation 分量。
  // 当前直接应用新角度，未在两帧之间做插值；跳过无效值会保留该关节原姿态，也不会向真实机器人下发动作。

  setJoints(deg: number[]) {
  // 将这帧六个有效的度数逐一转换为弧度，并设置各模型关节对应的旋转轴。
  // deg 来自机器人帧的 joints；this.joints 按 J1～J6 保存节点；JOINT_AXES 指定轴，THREE.MathUtils.degToRad() 完成单位转换。
    // 遍历 6 个关节
    for (let i = 0; i < 6; i++) {
    // 按这一行指定的集合或范围逐个执行循环体。
    // i：本处保存 0 的结果
      const d = deg[i];
      // 根据 deg[i] 设置 d，供当前流程后续使用。
      // d：本处保存 deg[i] 的结果；deg：当前方法接收的参数，类型为 number[]；i：本处保存 0 的结果
      // 非法值（非数字 / NaN / undefined）跳过，保留上一帧姿态而不是跳成 0
      if (typeof d !== 'number' || !Number.isFinite(d)) continue;
      // 检查(typeof d !== 'number' || !Number.isFinite(d)) continue;，按判断结果进入对应的处理分支。
      // d：本处保存 deg[i] 的结果；Number：将值转换为数字的 JavaScript 构造函数；isFinite：本处声明的字段或类型，类型为 boolean
      const pivot = this.joints[i];
      // 根据 this.joints[i] 设置 pivot，供当前流程后续使用。
      // pivot：本处保存 this.joints[i] 的结果；joints：按 J1 到 J6 排列的六个关节角度，遥测契约中单位为度；i：本处保存 0 的结果
      const axis = JOINT_AXES[i];
      // 根据 JOINT_AXES[i] 设置 axis，供当前流程后续使用。
      // axis：本处保存 JOINT_AXES[i] 的结果；JOINT_AXES：本处保存 ['y', 'z', 'z', 'y', 'z', 'y'] 的结果，类型为 Axis[]；i：本处保存 0 的结果
      // 度 → 弧度（Three.js 用弧度）

      // d 已经是采集器换算后的物理角度，例子中是 25 度；这里将它换成 Three.js rotation 使用的弧度。
      // 采集器的“原始整数乘 0.1”和本行“度转弧度”目的不同，不能重复缩放一次现场数据。

      const rad = THREE.MathUtils.degToRad(d);
      // 把角度值换算为 Three.js 使用的弧度，将结果保存或写入 rad。
      // rad：本处保存 THREE.MathUtils.degToRad(d) 的结果；THREE：从 three 导入的三维 API 命名空间；MathUtils：THREE 对象上的字段或操作；degToRad：把角度值换算为 Three.js 使用的弧度；d：本处保存 deg[i] 的结果
      // 按轴设置旋转角度
      if (axis === 'x') pivot.rotation.x = rad;
      // 检查(axis === 'x') pivot.rotation.x = rad;，按判断结果进入对应的处理分支。
      // axis：本处保存 JOINT_AXES[i] 的结果；pivot：本处保存 this.joints[i] 的结果；rotation：三维物体绕各轴的旋转，Three.js 使用弧度；x：本处声明的字段或类型，类型为 number；rad：本处保存 THREE.MathUtils.degToRad(d) 的结果
      else if (axis === 'y') pivot.rotation.y = rad;
      // 前一条件不成立时，改为执行这一分支。
      // axis：本处保存 JOINT_AXES[i] 的结果；pivot：本处保存 this.joints[i] 的结果；rotation：三维物体绕各轴的旋转，Three.js 使用弧度；y：本处声明的字段或类型，类型为 number；rad：本处保存 THREE.MathUtils.degToRad(d) 的结果
      else pivot.rotation.z = rad;
      // 前一条件不成立时，改为执行这一分支。
      // pivot：本处保存 this.joints[i] 的结果；rotation：三维物体绕各轴的旋转，Three.js 使用弧度；z：Zod 校验 API 命名空间，用于声明 MCP 工具入参约束；rad：本处保存 THREE.MathUtils.degToRad(d) 的结果
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了把六轴角度从度转换为弧度并更新机械臂关节节点的实现；实际结果由运行时输入和执行分支决定。

  /** 报警时关节光环变红 */
  // 这一段定义 setAlarm，用于根据报警状态调整机械臂关节环的发光效果。
  setAlarm(on: boolean) {
  // 定义方法 setAlarm；括号中声明参数，花括号内实现逻辑。
  // setAlarm：根据报警状态调整机械臂关节环的发光效果；on：当前方法接收的参数，类型为 boolean
    // 遍历所有光环
    for (const ring of this.rings) {
    // 按这一行指定的集合或范围逐个执行循环体。
    // ring：本处保存的局部数据；rings：本处声明的字段或类型，类型为 THREE.Mesh[]
      // 取出材质（Mesh 的 material 可能是数组，这里是单个）
      const mat = ring.material as THREE.MeshStandardMaterial;
      // 根据 ring.material as THREE.MeshStandardMaterial 设置 mat，供当前流程后续使用。
      // mat：本处保存 ring.material as THREE.MeshStandardMaterial 的结果；ring：本处保存的局部数据；material：三维物体的表面渲染材质；THREE：从 three 导入的三维 API 命名空间；MeshStandardMaterial：Three.js 基于光照的标准材质类
      // 改自发光颜色：红 = 报警，橙 = 正常
      mat.emissive.setHex(on ? 0xff2d2d : 0xff8c42);
      // 用十六进制颜色值设置 Three.js 颜色对象。
      // mat：本处保存 ring.material as THREE.MeshStandardMaterial 的结果；emissive：材质自发光颜色；setHex：提供 setHex 的本地处理逻辑；on：当前方法接收的参数，类型为 boolean
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 这一段提供了根据报警状态调整机械臂关节环的发光效果的实现；实际结果由运行时输入和执行分支决定。
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了创建并驱动程序化六轴机械臂模型所需的定义和处理逻辑，结果交由调用方或运行环境使用。
// 这一段定义了 RobotArm 的字段或服务能力，供项目其他模块使用。
