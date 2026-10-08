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

type Axis = 'x' | 'y' | 'z';

const JOINT_AXES: Axis[] = ['y', 'z', 'z', 'y', 'z', 'y'];

const MAT_ARM = new THREE.MeshStandardMaterial({
  color: 0xe67e22, metalness: 0.35, roughness: 0.45,
});
const MAT_JOINT = new THREE.MeshStandardMaterial({
  color: 0x34495e, metalness: 0.6, roughness: 0.35,
});
const MAT_BASE = new THREE.MeshStandardMaterial({
  color: 0x22303c, metalness: 0.5, roughness: 0.6,
});
const MAT_RING = new THREE.MeshStandardMaterial({
  color: 0x181818, emissive: 0xff8c42, emissiveIntensity: 0.8,
  metalness: 0.2, roughness: 0.5,
});

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  // 加一圈淡淡的轮廓线,增强"工程图"质感
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, 30),
    new THREE.LineBasicMaterial({ color: 0xbfd9ff, transparent: true, opacity: 0.10 }),
  );
  m.add(edges);
  return m;
}

// 关节处的发光环:运行时可通过 alarm 状态变红
function jointRing(radius: number, axis: Axis, mat: THREE.Material): THREE.Mesh {
  const ring = mesh(new THREE.TorusGeometry(radius, 0.008, 10, 48), mat);
  if (axis === 'y') ring.rotation.x = Math.PI / 2;
  if (axis === 'z') ring.rotation.y = 0; // torus 默认就在 XY 平面,轴为 Z
  if (axis === 'x') ring.rotation.y = Math.PI / 2;
  return ring;
}

export class RobotArm {
  readonly group = new THREE.Group();
  private readonly joints: THREE.Group[] = [];
  private readonly rings: THREE.Mesh[] = [];

  constructor() {
    // ---- 固定底座 ----
    const base = mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.12, 32), MAT_BASE);
    base.position.y = 0.06;
    base.receiveShadow = true;
    this.group.add(base);
    const basePlate = mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.02, 32), MAT_BASE);
    basePlate.position.y = 0.01;
    basePlate.receiveShadow = true;
    this.group.add(basePlate);

    // ---- J1:底座回转(绕 Y) ----
    const j1 = new THREE.Group();
    j1.position.y = 0.12;
    const turntable = mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 32), MAT_JOINT);
    turntable.position.y = 0.04;
    j1.add(turntable);
    const shoulder = mesh(new THREE.BoxGeometry(0.14, 0.16, 0.16), MAT_ARM);
    shoulder.position.y = 0.14;
    j1.add(shoulder);
    this.register(j1, 0.16);
    this.group.add(j1);

    // ---- J2:大臂俯仰(绕 Z) ----
    const j2 = new THREE.Group();
    j2.position.y = 0.22;
    const j2Axis = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 24), MAT_JOINT);
    j2Axis.rotation.x = Math.PI / 2;
    j2.add(j2Axis);
    const upperArm = mesh(new THREE.BoxGeometry(0.11, 0.42, 0.13), MAT_ARM);
    upperArm.position.y = 0.21;
    j2.add(upperArm);
    this.register(j2, 0.085);
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
    const fingerL = mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT);
    fingerL.position.set(0.028, 0.085, 0);
    const fingerR = mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT);
    fingerR.position.set(-0.028, 0.085, 0);
    j6.add(fingerL, fingerR);
    this.register(j6, 0.05);
    j5.add(j6);
  }

  private register(pivot: THREE.Group, ringRadius: number) {
    const axis = JOINT_AXES[this.joints.length];
    const ring = jointRing(ringRadius, axis, MAT_RING.clone());
    pivot.add(ring);
    this.joints.push(pivot);
    this.rings.push(ring);
  }

  /** 按契约 joints[6](单位:度,J1~J6)驱动关节 */
  setJoints(deg: number[]) {
    for (let i = 0; i < 6; i++) {
      const d = deg[i];
      if (typeof d !== 'number' || !Number.isFinite(d)) continue;
      const pivot = this.joints[i];
      const axis = JOINT_AXES[i];
      const rad = THREE.MathUtils.degToRad(d);
      if (axis === 'x') pivot.rotation.x = rad;
      else if (axis === 'y') pivot.rotation.y = rad;
      else pivot.rotation.z = rad;
    }
  }

  /** 报警时关节光环变红 */
  setAlarm(on: boolean) {
    for (const ring of this.rings) {
      const mat = ring.material as THREE.MeshStandardMaterial;
      mat.emissive.setHex(on ? 0xff2d2d : 0xff8c42);
    }
  }
}
