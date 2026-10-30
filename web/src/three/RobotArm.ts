/**
 * 浏览器内的程序化六轴模型，只处理 Three.js 节点、几何、材质与姿态。
 * 先看尺寸/材质和辅助几何函数，再看 constructor 的 J1→J6 父子层级，最后看 register、setJoints、setAlarm。
 * register 保存模型节点和独立光环；setJoints 将遥测度数转弧度写入对应轴，setAlarm 改变光环颜色。
 * 模型不包含现场控制链；this.joints 是节点数组，与输入 joints 的数值数组按下标对应。
 */
import * as THREE from 'three';

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

const JOINT_AXES: Axis[] = ['y', 'z', 'z', 'y', 'z', 'y'];

/** 机械臂主体材质：橙色金属 */
const MAT_ARM = new THREE.MeshStandardMaterial({
  color: 0xe67e22, metalness: 0.35, roughness: 0.45,
});
/** 关节材质：深蓝灰，更金属感 */
const MAT_JOINT = new THREE.MeshStandardMaterial({
  color: 0x34495e, metalness: 0.6, roughness: 0.35,
});
/** 底座材质：更暗 */
const MAT_BASE = new THREE.MeshStandardMaterial({
  color: 0x22303c, metalness: 0.5, roughness: 0.6,
});
/** 关节光环材质：橙色自发光（报警时会被改成红色） */
const MAT_RING = new THREE.MeshStandardMaterial({
  color: 0x181818, emissive: 0xff8c42, emissiveIntensity: 0.8,
  metalness: 0.2, roughness: 0.5,
});

// 模型构造过程用几何和材质创建 Three.js Mesh，并设置相应阴影属性。
// 返回的网格还需 add 到模型节点；创建网格不包含任何现场采集或控制操作。
// 【入口 mesh：部分 / 作用】
// 部分 | 作用
// geo | Three.js 几何体。
// mat | Three.js 材质。
function mesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  // 投射阴影
  m.castShadow = true;
  // 加一圈淡淡的轮廓线,增强"工程图"质感
  // EdgesGeometry(几何体, 30) —— 30 度以内的折角视为平滑，不画边
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, 30),
    new THREE.LineBasicMaterial({ color: 0xbfd9ff, transparent: true, opacity: 0.10 }),
  );
  // 轮廓线作为子物体挂在网格上（会跟随网格一起变换）
  m.add(edges);
  return m;
}

// 按给定半径和关节旋转轴创建发光环网格，使环位于对应关节平面。
// axis 是模型局部轴；材质由调用方提供独立实例，后续 setAlarm 可分别改变各环的发光色。
// 【入口 jointRing：部分 / 作用】
// 部分 | 作用
// radius | 当前几何体的半径。
// axis | 模型配置的局部旋转轴。
// mat | Three.js 材质。
function jointRing(radius: number, axis: Axis, mat: THREE.Material): THREE.Mesh {
  // TorusGeometry(半径, 管粗, 径向分段, 管向分段) —— 一个甜甜圈
  const ring = mesh(new THREE.TorusGeometry(radius, 0.008, 10, 48), mat);
  // torus 默认躺在 XY 平面（法线朝 Z）
  if (axis === 'y') ring.rotation.x = Math.PI / 2;
  if (axis === 'z') ring.rotation.y = 0; // torus 默认就在 XY 平面,轴为 Z
  if (axis === 'x') ring.rotation.y = Math.PI / 2;
  return ring;
}

/**
 * 机械臂模型类。
 */
export class RobotArm {
  /** 根节点：整个机械臂挂在这个 Group 下，由页面 scene.add(arm.group) 加入场景 */
  readonly group = new THREE.Group();
  /** 六个关节的 pivot Group（按 J1..J6 顺序），setJoints 按索引旋转它们 */
  private readonly joints: THREE.Group[] = [];
  /** 六个关节的发光环，setAlarm 按索引改它们的自发光颜色 */
  private readonly rings: THREE.Mesh[] = [];

  // TwinView 创建 RobotArm 时执行一次，按 J1～J6 创建节点、连杆和末端几何，并逐级建立父子关系。
  // 每个关节调用 register 加光环并进入有序数组；父节点旋转会带动它的后续子节点。
  constructor() {
    // ---- 固定底座 ----
    // 底座主体：上小下大的圆柱（半径 0.20→0.24，高 0.12）
    const base = mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.12, 32), MAT_BASE);
    base.position.y = 0.06;
    base.receiveShadow = true;
    this.group.add(base);
    // 底座安装板：扁圆柱
    const basePlate = mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.02, 32), MAT_BASE);
    basePlate.position.y = 0.01;
    basePlate.receiveShadow = true;
    this.group.add(basePlate);

    // ---- J1:底座回转(绕 Y) ----
    // 每个关节都是独立的 Group，作为下一级关节的父节点

    // 从 J1 开始逐级建立关节父子关系：Group 是变换节点，Mesh 是挂在该节点下的可见几何体。
    // 后续关节挂在前一关节下面，所以 J1 转动会同时带动其后的连杆和关节；每个关节仍能叠加自己的局部旋转。
    // register() 保存关节引用，setJoints() 才能按 J1～J6 的次序找到应更新的节点。

    const j1 = new THREE.Group();
    // 创建 J1 的关节变换组，下面再把可见几何体和后续关节挂到它的层级中。
    // j1 是 Three.js 的 Group，不是现场 PLC 对象；父节点旋转会带动其子节点，register() 保存供 setJoints() 使用的引用。
    j1.position.y = 0.12;
    // 回转台
    const turntable = mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 32), MAT_JOINT);
    turntable.position.y = 0.04;
    j1.add(turntable);
    // 肩部方块（大臂的安装座）
    const shoulder = mesh(new THREE.BoxGeometry(0.14, 0.16, 0.16), MAT_ARM);
    shoulder.position.y = 0.14;
    j1.add(shoulder);
    // 注册关节（加光环 + 记入 joints/rings 数组）
    this.register(j1, 0.16);
    // 将当前模型关节和独立光环登记到有序数组，供 setJoints/setAlarm 使用。
    // 挂到根节点下
    this.group.add(j1);

    // ---- J2:大臂俯仰(绕 Z) ----
    const j2 = new THREE.Group();
    j2.position.y = 0.22;
    // 关节轴（圆柱横躺，绕 X 转 90° 让轴向变成 Z）
    const j2Axis = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 24), MAT_JOINT);
    j2Axis.rotation.x = Math.PI / 2;
    j2.add(j2Axis);
    // 大臂主体（长方体，向上）
    const upperArm = mesh(new THREE.BoxGeometry(0.11, 0.42, 0.13), MAT_ARM);
    upperArm.position.y = 0.21;
    j2.add(upperArm);
    this.register(j2, 0.085);
    // 将当前模型关节和独立光环登记到有序数组，供 setJoints/setAlarm 使用。
    // ★ 关键：j2 挂到 j1 上（不是挂到 group 上）→ 实现运动学继承
    j1.add(j2);
    // 1. add 是 Three.js Object3D 的方法，这里把 J2 的 Group 挂在 J1 下面。
    // 2. j2.position 是相对 J1 的局部位置；J1 转动会带着 J2 及后续子节点一起变换。
    // 3. J2 仍有自己的局部旋转，两级变换组合后才得到画面中的姿态。
    // 4. 这段建立的是网页模型层级，没有向真实机器人发送运动指令。

    // ---- J3:小臂俯仰(绕 Z) ----
    const j3 = new THREE.Group();
    j3.position.y = 0.42;
    const j3Axis = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 24), MAT_JOINT);
    j3Axis.rotation.x = Math.PI / 2;
    j3.add(j3Axis);
    const forearm = mesh(new THREE.BoxGeometry(0.09, 0.36, 0.11), MAT_ARM);
    forearm.position.y = 0.18;
    j3.add(forearm);
    this.register(j3, 0.07);
    // 将当前模型关节和独立光环登记到有序数组，供 setJoints/setAlarm 使用。
    j2.add(j3);

    // ---- J4:小臂滚转(绕 Y) ----
    const j4 = new THREE.Group();
    j4.position.y = 0.36;
    const wrist1 = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 24), MAT_JOINT);
    wrist1.position.y = 0.06;
    j4.add(wrist1);
    this.register(j4, 0.06);
    // 将当前模型关节和独立光环登记到有序数组，供 setJoints/setAlarm 使用。
    j3.add(j4);

    // ---- J5:腕部俯仰(绕 Z) ----
    const j5 = new THREE.Group();
    j5.position.y = 0.12;
    const j5Axis = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 24), MAT_JOINT);
    j5Axis.rotation.x = Math.PI / 2;
    j5.add(j5Axis);
    const wrist2 = mesh(new THREE.BoxGeometry(0.07, 0.10, 0.09), MAT_ARM);
    wrist2.position.y = 0.05;
    j5.add(wrist2);
    this.register(j5, 0.055);
    // 将当前模型关节和独立光环登记到有序数组，供 setJoints/setAlarm 使用。
    j4.add(j5);

    // ---- J6:法兰滚转(绕 Y) + 简易夹爪 ----
    const j6 = new THREE.Group();
    j6.position.y = 0.10;
    const flange = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 24), MAT_JOINT);
    flange.position.y = 0.025;
    j6.add(flange);
    // 夹爪的两根手指（简化为两个小方块）
    const fingerL = mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT);
    fingerL.position.set(0.028, 0.085, 0);
    const fingerR = mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT);
    fingerR.position.set(-0.028, 0.085, 0);
    j6.add(fingerL, fingerR);
    this.register(j6, 0.05);
    // 将当前模型关节和独立光环登记到有序数组，供 setJoints/setAlarm 使用。
    j5.add(j6);
  }

  // 为当前模型关节增加独立光环，并按创建顺序保存 pivot 和 ring。
  // this.joints.length 决定当前 J1～J6 下标及 JOINT_AXES 的轴；它是模型内部登记，不是按设备编码注册机器。
  // 【入口 RobotArm.register：部分 / 作用】
  // 部分 | 作用
  // pivot | 当前模型关节的 Three.js 变换节点。
  // ringRadius | 模型关节光环半径。
  private register(pivot: THREE.Group, ringRadius: number) {
    // 取当前 joints 数组长度作为关节序号（0..5），据此决定旋转轴
    const axis = JOINT_AXES[this.joints.length];
    // 创建光环。MAT_RING.clone() —— 每个环需要独立材质，
    // 否则 setAlarm 改一个环的颜色会连带改掉所有环！
    const ring = jointRing(ringRadius, axis, MAT_RING.clone());
    // 1. jointRing 是本文件的辅助函数，不是 Three.js 内置的业务关节方法。
    // 2. ringRadius 决定光环大小，axis 决定环所在平面。
    // 3. clone() 从模板材质复制出独立实例，后面改变一个环的发光色时不会共用同一材质对象。
    // 4. 随后把 pivot 和 ring 按 J1～J6 的创建顺序登记到两个数组。
    pivot.add(ring);
    // 记录关节和光环
    this.joints.push(pivot);
    this.rings.push(ring);
  }

  // TwinView 在收到机器人帧后，把按 J1～J6 排列的度数传给这里。
  // 逐个检查有限数值，按关节轴将度转弧度写 rotation；跳过无效角度保留原姿态，当前没有帧间插值。
  // 【入口 RobotArm.setJoints：部分 / 作用】
  // 部分 | 作用
  // deg | 按 J1 至 J6 顺序排列的角度数组，单位为度。
  setJoints(deg: number[]) {
    // 遍历 6 个关节
    for (let i = 0; i < 6; i++) {
      const d = deg[i];
      // 1. deg 由 TwinView 传入，是本帧按 J1～J6 排列的度数数组。
      // 2. i 是 0～5 的下标，例如 i=0 取得 J1，d=25 表示 25 度。
      // 3. 现场原始值的 0.1 缩放已由采集器做完，本方法不能再乘一次。
      if (typeof d !== 'number' || !Number.isFinite(d)) continue;
      // 1. typeof 排除 null、undefined 等非数值，Number.isFinite 再排除 NaN 和正负无穷。
      // 2. continue 只跳过当前关节这一轮循环，其他关节仍继续处理。
      // 3. 跳过时不写 rotation，因此该关节保留此前姿态；不会把无效值当作 0 度。
      const pivot = this.joints[i];
      // 1. this.joints 是 constructor/register 建立的六个模型 Group 数组。
      // 2. 它与消息中同名 joints 数值数组不同；共同的下标 i 将 J1 角度对到 J1 节点。
      // 3. pivot 是节点引用，后面修改它的 rotation，渲染循环绘制时就会使用新值。
      const axis = JOINT_AXES[i];
      // 1. JOINT_AXES 是本项目配置的六个局部旋转轴，顺序为 y、z、z、y、z、y。
      // 2. 例如 J1 使用 y，J2 使用 z；不是让所有关节都围绕同一个轴转。

      // d 已经是采集器换算后的物理角度，例子中是 25 度；这里将它换成 Three.js rotation 使用的弧度。
      // 采集器的“原始整数乘 0.1”和本行“度转弧度”目的不同，不能重复缩放一次现场数据。

      // 【调用各部分：部分 / 作用】
      // 部分 | 作用
      // THREE | 从 three 库导入的命名空间。
      // d | 当前关节的物理角度，单位已经是度。
      // MathUtils.degToRad() | 库提供的度转弧度换算，关系为 d×π/180。
      // rad | 换算得到的弧度，供节点 rotation 使用，不再乘采集器的 0.1。
      const rad = THREE.MathUtils.degToRad(d);
      // 1. THREE 来自 three 库；MathUtils.degToRad 是库提供的单位换算方法。
      // 2. 输入 d 的单位为度，输出 rad 的单位为弧度，数学关系是 d × π / 180。
      // 3. 例如 d=25 时约为 0.4363 弧度，d=180 时为 π；这一步没有改现场测量值的含义。
      // 4. 它与采集器“250 × 0.1 = 25 度”是前后两个不同目的的换算。
      if (axis === 'x') pivot.rotation.x = rad;
      // 1. rotation 是 Three.js 节点的局部旋转属性，x/y/z 分量使用弧度。
      // 2. 这里与下面 else if/else 是同一组分支，只为当前关节写入配置所选的一个轴。
      // 3. JOINT_AXES 当前没有 x 轴关节，保留此分支是现有模型接口的处理方式。
      // 4. 写的是浏览器模型属性，SceneManager.render 才把更新后的场景画到画布。
      else if (axis === 'y') pivot.rotation.y = rad;
      // 否则，模型关节配置为 y 轴时更新该关节的 y 旋转分量。
      // axis 来自本项目 JOINT_AXES；rad 是刚才转换的弧度；父节点的变换仍会作用于后续子关节。
      else pivot.rotation.z = rad;
      // 其余配置使用 z 轴，将本帧弧度应用到该模型关节。
      // z 是当前关节的局部旋转轴分量；设置后由场景后续绘制显示新姿态。
    }
  }

  // 根据传入报警布尔值改变各关节光环的自发光颜色，供后续渲染显示。
  // 每个环有独立材质；这里只改变模型材质，不向现场发送报警复位或控制。
  // 【入口 RobotArm.setAlarm：部分 / 作用】
  // 部分 | 作用
  // on | 是否启用当前显示状态的布尔值。
  setAlarm(on: boolean) {
    // 遍历所有光环
    for (const ring of this.rings) {
      // 取出材质（Mesh 的 material 可能是数组，这里是单个）
      const mat = ring.material as THREE.MeshStandardMaterial;
      // 改自发光颜色：红 = 报警，橙 = 正常
      mat.emissive.setHex(on ? 0xff2d2d : 0xff8c42);
      // 用十六进制颜色值设置 Three.js 颜色对象。
    }
  }
}
