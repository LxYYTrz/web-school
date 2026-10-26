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
// 从 three 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

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
// 声明 Axis 的结构。 关键字：type＝定义类型别名。

const JOINT_AXES: Axis[] = ['y', 'z', 'z', 'y', 'z', 'y'];
// 声明 JOINT_AXES，初始值由 ['y', 'z', 'z', 'y', 'z', 'y'] 计算得到。 关键字：const＝声明不可重新绑定的变量。

/** 机械臂主体材质：橙色金属 */
const MAT_ARM = new THREE.MeshStandardMaterial({
// 声明 MAT_ARM，初始值由 new THREE.MeshStandardMaterial({ 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
  color: 0xe67e22, metalness: 0.35, roughness: 0.45,
  // 设置字段 color。
});
// 结束当前回调或对象，并完成外层函数调用。
/** 关节材质：深蓝灰，更金属感 */
const MAT_JOINT = new THREE.MeshStandardMaterial({
// 声明 MAT_JOINT，初始值由 new THREE.MeshStandardMaterial({ 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
  color: 0x34495e, metalness: 0.6, roughness: 0.35,
  // 设置字段 color。
});
// 结束当前回调或对象，并完成外层函数调用。
/** 底座材质：更暗 */
const MAT_BASE = new THREE.MeshStandardMaterial({
// 声明 MAT_BASE，初始值由 new THREE.MeshStandardMaterial({ 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
  color: 0x22303c, metalness: 0.5, roughness: 0.6,
  // 设置字段 color。
});
// 结束当前回调或对象，并完成外层函数调用。
/** 关节光环材质：橙色自发光（报警时会被改成红色） */
const MAT_RING = new THREE.MeshStandardMaterial({
// 声明 MAT_RING，初始值由 new THREE.MeshStandardMaterial({ 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
  color: 0x181818, emissive: 0xff8c42, emissiveIntensity: 0.8,
  // 设置字段 color。
  metalness: 0.2, roughness: 0.5,
  // 设置字段 metalness。
});
// 结束当前回调或对象，并完成外层函数调用。

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
// 定义函数 mesh。 关键字：function＝定义函数。
  const m = new THREE.Mesh(geo, mat);
  // 声明 m，初始值由 new THREE.Mesh(geo, mat) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
  // 投射阴影
  m.castShadow = true;
  // 把右侧表达式的结果写入 m.castShadow。 关键字：true＝布尔真值。
  // 加一圈淡淡的轮廓线,增强"工程图"质感
  // EdgesGeometry(几何体, 30) —— 30 度以内的折角视为平滑，不画边
  const edges = new THREE.LineSegments(
  // 声明 edges，初始值由 new THREE.LineSegments( 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    new THREE.EdgesGeometry(geo, 30),
    // 调用 THREE.EdgesGeometry；括号中的表达式是传入的参数。 关键字：new＝创建对象实例。
    new THREE.LineBasicMaterial({ color: 0xbfd9ff, transparent: true, opacity: 0.10 }),
    // 调用 THREE.LineBasicMaterial；括号中的表达式是传入的参数。 关键字：new＝创建对象实例；true＝布尔真值。
  );
  // 结束当前函数的参数列表并完成调用。
  // 轮廓线作为子物体挂在网格上（会跟随网格一起变换）
  m.add(edges);
  // 调用 m.add，把括号中的值作为参数传入。
  return m;
  // 返回 m 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

// 关节处的发光环:运行时可通过 alarm 状态变红
/**
 * 关节处的发光环:运行时可通过 alarm 状态变红
 * @param radius 环半径
 * @param axis   环所在的旋转轴（决定环的朝向）
 * @param mat    材质
 */
function jointRing(radius: number, axis: Axis, mat: THREE.Material): THREE.Mesh {
// 定义函数 jointRing。 关键字：function＝定义函数。
  // TorusGeometry(半径, 管粗, 径向分段, 管向分段) —— 一个甜甜圈
  const ring = mesh(new THREE.TorusGeometry(radius, 0.008, 10, 48), mat);
  // 声明 ring，初始值由 mesh(new THREE.TorusGeometry(radius, 0.008, 10, 48), mat) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
  // torus 默认躺在 XY 平面（法线朝 Z）
  if (axis === 'y') ring.rotation.x = Math.PI / 2;
  // 判断 if (axis === 'y') ring.rotation.x = Math.PI / 2; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
  if (axis === 'z') ring.rotation.y = 0; // torus 默认就在 XY 平面,轴为 Z
  // 判断 if (axis === 'z') ring.rotation.y = 0; // torus 默认就在 XY 平面,轴为 Z 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
  if (axis === 'x') ring.rotation.y = Math.PI / 2;
  // 判断 if (axis === 'x') ring.rotation.y = Math.PI / 2; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
  return ring;
  // 返回 ring 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

/**
 * 机械臂模型类。
 */
export class RobotArm {
// 声明 RobotArm 的结构。 关键字：export＝向其他模块开放符号；class＝定义类。
  /** 根节点：整个机械臂挂在这个 Group 下，由页面 scene.add(arm.group) 加入场景 */
  readonly group = new THREE.Group();
  // 调用 THREE.Group；括号中的表达式是传入的参数。 关键字：readonly＝禁止重新赋值；new＝创建对象实例。
  /** 六个关节的 pivot Group（按 J1..J6 顺序），setJoints 按索引旋转它们 */
  private readonly joints: THREE.Group[] = [];
  // 声明类属性或构造参数 joints，类型为 THREE.Group[] = []。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。
  /** 六个关节的发光环，setAlarm 按索引改它们的自发光颜色 */
  private readonly rings: THREE.Mesh[] = [];
  // 声明类属性或构造参数 rings，类型为 THREE.Mesh[] = []。 关键字：private＝限定类内部访问；readonly＝禁止重新赋值。

  constructor() {
  // 定义类的构造函数；创建实例时接收参数并初始化依赖。
    // ---- 固定底座 ----
    // 底座主体：上小下大的圆柱（半径 0.20→0.24，高 0.12）
    const base = mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.12, 32), MAT_BASE);
    // 声明 base，初始值由 mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.12, 32), MAT_BASE) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    base.position.y = 0.06;
    // 把右侧表达式的结果写入 base.position.y。
    base.receiveShadow = true;
    // 把右侧表达式的结果写入 base.receiveShadow。 关键字：true＝布尔真值。
    this.group.add(base);
    // 调用 this.group.add，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // 底座安装板：扁圆柱
    const basePlate = mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.02, 32), MAT_BASE);
    // 声明 basePlate，初始值由 mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.02, 32), MAT_BASE) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    basePlate.position.y = 0.01;
    // 把右侧表达式的结果写入 basePlate.position.y。
    basePlate.receiveShadow = true;
    // 把右侧表达式的结果写入 basePlate.receiveShadow。 关键字：true＝布尔真值。
    this.group.add(basePlate);
    // 调用 this.group.add，把括号中的值作为参数传入。 关键字：this＝当前对象实例。

    // ---- J1:底座回转(绕 Y) ----
    // 每个关节都是独立的 Group，作为下一级关节的父节点
    const j1 = new THREE.Group();
    // 声明 j1，初始值由 new THREE.Group() 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    j1.position.y = 0.12;
    // 把右侧表达式的结果写入 j1.position.y。
    // 回转台
    const turntable = mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 32), MAT_JOINT);
    // 声明 turntable，初始值由 mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 32), MAT_JOINT) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    turntable.position.y = 0.04;
    // 把右侧表达式的结果写入 turntable.position.y。
    j1.add(turntable);
    // 调用 j1.add，把括号中的值作为参数传入。
    // 肩部方块（大臂的安装座）
    const shoulder = mesh(new THREE.BoxGeometry(0.14, 0.16, 0.16), MAT_ARM);
    // 声明 shoulder，初始值由 mesh(new THREE.BoxGeometry(0.14, 0.16, 0.16), MAT_ARM) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    shoulder.position.y = 0.14;
    // 把右侧表达式的结果写入 shoulder.position.y。
    j1.add(shoulder);
    // 调用 j1.add，把括号中的值作为参数传入。
    // 注册关节（加光环 + 记入 joints/rings 数组）
    this.register(j1, 0.16);
    // 调用 this.register，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // 挂到根节点下
    this.group.add(j1);
    // 调用 this.group.add，把括号中的值作为参数传入。 关键字：this＝当前对象实例。

    // ---- J2:大臂俯仰(绕 Z) ----
    const j2 = new THREE.Group();
    // 声明 j2，初始值由 new THREE.Group() 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    j2.position.y = 0.22;
    // 把右侧表达式的结果写入 j2.position.y。
    // 关节轴（圆柱横躺，绕 X 转 90° 让轴向变成 Z）
    const j2Axis = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 24), MAT_JOINT);
    // 声明 j2Axis，初始值由 mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 24), MAT_JOINT) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    j2Axis.rotation.x = Math.PI / 2;
    // 把右侧表达式的结果写入 j2Axis.rotation.x。
    j2.add(j2Axis);
    // 调用 j2.add，把括号中的值作为参数传入。
    // 大臂主体（长方体，向上）
    const upperArm = mesh(new THREE.BoxGeometry(0.11, 0.42, 0.13), MAT_ARM);
    // 声明 upperArm，初始值由 mesh(new THREE.BoxGeometry(0.11, 0.42, 0.13), MAT_ARM) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    upperArm.position.y = 0.21;
    // 把右侧表达式的结果写入 upperArm.position.y。
    j2.add(upperArm);
    // 调用 j2.add，把括号中的值作为参数传入。
    this.register(j2, 0.085);
    // 调用 this.register，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    // ★ 关键：j2 挂到 j1 上（不是挂到 group 上）→ 实现运动学继承
    j1.add(j2);
    // 调用 j1.add，把括号中的值作为参数传入。

    // ---- J3:小臂俯仰(绕 Z) ----
    const j3 = new THREE.Group();
    // 声明 j3，初始值由 new THREE.Group() 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    j3.position.y = 0.42;
    // 把右侧表达式的结果写入 j3.position.y。
    const j3Axis = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 24), MAT_JOINT);
    // 声明 j3Axis，初始值由 mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 24), MAT_JOINT) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    j3Axis.rotation.x = Math.PI / 2;
    // 把右侧表达式的结果写入 j3Axis.rotation.x。
    j3.add(j3Axis);
    // 调用 j3.add，把括号中的值作为参数传入。
    const forearm = mesh(new THREE.BoxGeometry(0.09, 0.36, 0.11), MAT_ARM);
    // 声明 forearm，初始值由 mesh(new THREE.BoxGeometry(0.09, 0.36, 0.11), MAT_ARM) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    forearm.position.y = 0.18;
    // 把右侧表达式的结果写入 forearm.position.y。
    j3.add(forearm);
    // 调用 j3.add，把括号中的值作为参数传入。
    this.register(j3, 0.07);
    // 调用 this.register，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    j2.add(j3);
    // 调用 j2.add，把括号中的值作为参数传入。

    // ---- J4:小臂滚转(绕 Y) ----
    const j4 = new THREE.Group();
    // 声明 j4，初始值由 new THREE.Group() 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    j4.position.y = 0.36;
    // 把右侧表达式的结果写入 j4.position.y。
    const wrist1 = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 24), MAT_JOINT);
    // 声明 wrist1，初始值由 mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 24), MAT_JOINT) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    wrist1.position.y = 0.06;
    // 把右侧表达式的结果写入 wrist1.position.y。
    j4.add(wrist1);
    // 调用 j4.add，把括号中的值作为参数传入。
    this.register(j4, 0.06);
    // 调用 this.register，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    j3.add(j4);
    // 调用 j3.add，把括号中的值作为参数传入。

    // ---- J5:腕部俯仰(绕 Z) ----
    const j5 = new THREE.Group();
    // 声明 j5，初始值由 new THREE.Group() 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    j5.position.y = 0.12;
    // 把右侧表达式的结果写入 j5.position.y。
    const j5Axis = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 24), MAT_JOINT);
    // 声明 j5Axis，初始值由 mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 24), MAT_JOINT) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    j5Axis.rotation.x = Math.PI / 2;
    // 把右侧表达式的结果写入 j5Axis.rotation.x。
    j5.add(j5Axis);
    // 调用 j5.add，把括号中的值作为参数传入。
    const wrist2 = mesh(new THREE.BoxGeometry(0.07, 0.10, 0.09), MAT_ARM);
    // 声明 wrist2，初始值由 mesh(new THREE.BoxGeometry(0.07, 0.10, 0.09), MAT_ARM) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    wrist2.position.y = 0.05;
    // 把右侧表达式的结果写入 wrist2.position.y。
    j5.add(wrist2);
    // 调用 j5.add，把括号中的值作为参数传入。
    this.register(j5, 0.055);
    // 调用 this.register，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    j4.add(j5);
    // 调用 j4.add，把括号中的值作为参数传入。

    // ---- J6:法兰滚转(绕 Y) + 简易夹爪 ----
    const j6 = new THREE.Group();
    // 声明 j6，初始值由 new THREE.Group() 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    j6.position.y = 0.10;
    // 把右侧表达式的结果写入 j6.position.y。
    const flange = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 24), MAT_JOINT);
    // 声明 flange，初始值由 mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 24), MAT_JOINT) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    flange.position.y = 0.025;
    // 把右侧表达式的结果写入 flange.position.y。
    j6.add(flange);
    // 调用 j6.add，把括号中的值作为参数传入。
    // 夹爪的两根手指（简化为两个小方块）
    const fingerL = mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT);
    // 声明 fingerL，初始值由 mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    fingerL.position.set(0.028, 0.085, 0);
    // 调用 fingerL.position.set，把括号中的值作为参数传入。
    const fingerR = mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT);
    // 声明 fingerR，初始值由 mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT) 计算得到。 关键字：const＝声明不可重新绑定的变量；new＝创建对象实例。
    fingerR.position.set(-0.028, 0.085, 0);
    // 调用 fingerR.position.set，把括号中的值作为参数传入。
    j6.add(fingerL, fingerR);
    // 调用 j6.add，把括号中的值作为参数传入。
    this.register(j6, 0.05);
    // 调用 this.register，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    j5.add(j6);
    // 调用 j5.add，把括号中的值作为参数传入。
  }
  // 结束当前对象、函数或条件代码块。

  /**
   * 注册一个关节：加发光环 + 记录到数组（供 setJoints / setAlarm 按索引访问）
   * @param pivot      关节的 Group（旋转作用在它身上）
   * @param ringRadius 光环半径
   */
  private register(pivot: THREE.Group, ringRadius: number) {
  // 定义方法 register；括号中声明参数，花括号内实现逻辑。 关键字：private＝限定类内部访问。
    // 取当前 joints 数组长度作为关节序号（0..5），据此决定旋转轴
    const axis = JOINT_AXES[this.joints.length];
    // 声明 axis，初始值由 JOINT_AXES[this.joints.length] 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
    // 创建光环。MAT_RING.clone() —— 每个环需要独立材质，
    // 否则 setAlarm 改一个环的颜色会连带改掉所有环！
    const ring = jointRing(ringRadius, axis, MAT_RING.clone());
    // 声明 ring，初始值由 jointRing(ringRadius, axis, MAT_RING.clone()) 计算得到。 关键字：const＝声明不可重新绑定的变量。
    // 光环挂在关节 Group 上 → 跟着关节一起转
    pivot.add(ring);
    // 调用 pivot.add，把括号中的值作为参数传入。
    // 记录关节和光环
    this.joints.push(pivot);
    // 调用 this.joints.push，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
    this.rings.push(ring);
    // 调用 this.rings.push，把括号中的值作为参数传入。 关键字：this＝当前对象实例。
  }
  // 结束当前对象、函数或条件代码块。

  /** 按契约 joints[6](单位:度,J1~J6)驱动关节 */
  setJoints(deg: number[]) {
  // 定义方法 setJoints；括号中声明参数，花括号内实现逻辑。
    // 遍历 6 个关节
    for (let i = 0; i < 6; i++) {
    // 按这一行指定的集合或范围逐个执行循环体。 关键字：for＝遍历集合或区间；let＝声明可重新赋值的变量。
      const d = deg[i];
      // 声明 d，初始值由 deg[i] 计算得到。 关键字：const＝声明不可重新绑定的变量。
      // 非法值（非数字 / NaN / undefined）跳过，保留上一帧姿态而不是跳成 0
      if (typeof d !== 'number' || !Number.isFinite(d)) continue;
      // 判断 if (typeof d !== 'number' || !Number.isFinite(d)) continue; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；typeof＝读取值的运行时类型；continue＝跳过本轮继续循环。
      const pivot = this.joints[i];
      // 声明 pivot，初始值由 this.joints[i] 计算得到。 关键字：const＝声明不可重新绑定的变量；this＝当前对象实例。
      const axis = JOINT_AXES[i];
      // 声明 axis，初始值由 JOINT_AXES[i] 计算得到。 关键字：const＝声明不可重新绑定的变量。
      // 度 → 弧度（Three.js 用弧度）
      const rad = THREE.MathUtils.degToRad(d);
      // 声明 rad，初始值由 THREE.MathUtils.degToRad(d) 计算得到。 关键字：const＝声明不可重新绑定的变量。
      // 按轴设置旋转角度
      if (axis === 'x') pivot.rotation.x = rad;
      // 判断 if (axis === 'x') pivot.rotation.x = rad; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支。
      else if (axis === 'y') pivot.rotation.y = rad;
      // 前一条件不成立时，改为执行这一分支。 关键字：else＝进入另一条件分支；if＝按条件分支。
      else pivot.rotation.z = rad;
      // 前一条件不成立时，改为执行这一分支。 关键字：else＝进入另一条件分支。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。

  /** 报警时关节光环变红 */
  setAlarm(on: boolean) {
  // 定义方法 setAlarm；括号中声明参数，花括号内实现逻辑。
    // 遍历所有光环
    for (const ring of this.rings) {
    // 按这一行指定的集合或范围逐个执行循环体。 关键字：for＝遍历集合或区间；const＝声明不可重新绑定的变量；of＝遍历可迭代值；this＝当前对象实例。
      // 取出材质（Mesh 的 material 可能是数组，这里是单个）
      const mat = ring.material as THREE.MeshStandardMaterial;
      // 声明 mat，初始值由 ring.material as THREE.MeshStandardMaterial 计算得到。 关键字：const＝声明不可重新绑定的变量。
      // 改自发光颜色：红 = 报警，橙 = 正常
      mat.emissive.setHex(on ? 0xff2d2d : 0xff8c42);
      // 调用 mat.emissive.setHex，把括号中的值作为参数传入。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
