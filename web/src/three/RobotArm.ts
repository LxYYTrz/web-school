/**
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

// 关节处的发光环:运行时可通过 alarm 状态变红
/**
 * 关节处的发光环:运行时可通过 alarm 状态变红
 * @param radius 环半径
 * @param axis   环所在的旋转轴（决定环的朝向）
 * @param mat    材质
 */
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
    const j1 = new THREE.Group();
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
    // ★ 关键：j2 挂到 j1 上（不是挂到 group 上）→ 实现运动学继承
    j1.add(j2);

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
    j2.add(j3);

    // ---- J4:小臂滚转(绕 Y) ----
    const j4 = new THREE.Group();
    j4.position.y = 0.36;
    const wrist1 = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 24), MAT_JOINT);
    wrist1.position.y = 0.06;
    j4.add(wrist1);
    this.register(j4, 0.06);
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
    j5.add(j6);
  }

  /**
   * 注册一个关节：加发光环 + 记录到数组（供 setJoints / setAlarm 按索引访问）
   * @param pivot      关节的 Group（旋转作用在它身上）
   * @param ringRadius 光环半径
   */
  private register(pivot: THREE.Group, ringRadius: number) {
    // 取当前 joints 数组长度作为关节序号（0..5），据此决定旋转轴
    const axis = JOINT_AXES[this.joints.length];
    // 创建光环。MAT_RING.clone() —— 每个环需要独立材质，
    // 否则 setAlarm 改一个环的颜色会连带改掉所有环！
    const ring = jointRing(ringRadius, axis, MAT_RING.clone());
    // 光环挂在关节 Group 上 → 跟着关节一起转
    pivot.add(ring);
    // 记录关节和光环
    this.joints.push(pivot);
    this.rings.push(ring);
  }

  /** 按契约 joints[6](单位:度,J1~J6)驱动关节 */
  setJoints(deg: number[]) {
    // 遍历 6 个关节
    for (let i = 0; i < 6; i++) {
      const d = deg[i];
      // 非法值（非数字 / NaN / undefined）跳过，保留上一帧姿态而不是跳成 0
      if (typeof d !== 'number' || !Number.isFinite(d)) continue;
      const pivot = this.joints[i];
      const axis = JOINT_AXES[i];
      // 度 → 弧度（Three.js 用弧度）
      const rad = THREE.MathUtils.degToRad(d);
      // 按轴设置旋转角度
      if (axis === 'x') pivot.rotation.x = rad;
      else if (axis === 'y') pivot.rotation.y = rad;
      else pivot.rotation.z = rad;
    }
  }

  /** 报警时关节光环变红 */
  setAlarm(on: boolean) {
    // 遍历所有光环
    for (const ring of this.rings) {
      // 取出材质（Mesh 的 material 可能是数组，这里是单个）
      const mat = ring.material as THREE.MeshStandardMaterial;
      // 改自发光颜色：红 = 报警，橙 = 正常
      mat.emissive.setHex(on ? 0xff2d2d : 0xff8c42);
    }
  }
}
