# web/src/three/RobotArm.ts 逐行说明

[打开源码](../../../../../web/src/three/RobotArm.ts) · 269 行 · 132 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 50 | <code>import * as THREE from 'three';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 64 | <code>type Axis = 'x' &#124; 'y' &#124; 'z';</code> | 声明 `Axis` 的结构。 关键字：`type`＝定义类型别名。 |
| 66 | <code>const JOINT_AXES: Axis[] = ['y', 'z', 'z', 'y', 'z', 'y'];</code> | 声明变量 `JOINT_AXES` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 69 | <code>const MAT_ARM = new THREE.MeshStandardMaterial({</code> | 声明变量 `MAT_ARM` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 70 | <code>color: 0xe67e22, metalness: 0.35, roughness: 0.45,</code> | 设置字段 `color`。 |
| 71 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 73 | <code>const MAT_JOINT = new THREE.MeshStandardMaterial({</code> | 声明变量 `MAT_JOINT` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 74 | <code>color: 0x34495e, metalness: 0.6, roughness: 0.35,</code> | 设置字段 `color`。 |
| 75 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 77 | <code>const MAT_BASE = new THREE.MeshStandardMaterial({</code> | 声明变量 `MAT_BASE` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 78 | <code>color: 0x22303c, metalness: 0.5, roughness: 0.6,</code> | 设置字段 `color`。 |
| 79 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 81 | <code>const MAT_RING = new THREE.MeshStandardMaterial({</code> | 声明变量 `MAT_RING` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 82 | <code>color: 0x181818, emissive: 0xff8c42, emissiveIntensity: 0.8,</code> | 设置字段 `color`。 |
| 83 | <code>metalness: 0.2, roughness: 0.5,</code> | 设置字段 `metalness`。 |
| 84 | <code>});</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 86 | <code>function mesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {</code> | 定义函数 `mesh`。 关键字：`function`＝定义函数。 |
| 87 | <code>const m = new THREE.Mesh(geo, mat);</code> | 声明变量 `m` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 89 | <code>m.castShadow = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 92 | <code>const edges = new THREE.LineSegments(</code> | 声明变量 `edges` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 93 | <code>new THREE.EdgesGeometry(geo, 30),</code> | 续写当前表达式、对象、类型或调用。 关键字：`new`＝创建对象实例。 |
| 94 | <code>new THREE.LineBasicMaterial({ color: 0xbfd9ff, transparent: true, opacity: 0.10 }),</code> | 续写当前表达式、对象、类型或调用。 关键字：`new`＝创建对象实例；`true`＝布尔真值。 |
| 95 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 97 | <code>m.add(edges);</code> | 调用函数、设置值或更新状态。 |
| 98 | <code>return m;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 99 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 108 | <code>function jointRing(radius: number, axis: Axis, mat: THREE.Material): THREE.Mesh {</code> | 定义函数 `jointRing`。 关键字：`function`＝定义函数。 |
| 110 | <code>const ring = mesh(new THREE.TorusGeometry(radius, 0.008, 10, 48), mat);</code> | 声明变量 `ring` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 112 | <code>if (axis === 'y') ring.rotation.x = Math.PI / 2;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 113 | <code>if (axis === 'z') ring.rotation.y = 0; // torus 默认就在 XY 平面,轴为 Z</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 114 | <code>if (axis === 'x') ring.rotation.y = Math.PI / 2;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 115 | <code>return ring;</code> | 返回当前函数的结果。 关键字：`return`＝返回结果并结束当前函数。 |
| 116 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 121 | <code>export class RobotArm {</code> | 声明 `RobotArm` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。 |
| 123 | <code>readonly group = new THREE.Group();</code> | 续写当前表达式、对象、类型或调用。 关键字：`readonly`＝禁止重新赋值；`new`＝创建对象实例。 |
| 125 | <code>private readonly joints: THREE.Group[] = [];</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 127 | <code>private readonly rings: THREE.Mesh[] = [];</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 129 | <code>constructor() {</code> | 定义或调用 `constructor`，参数由括号给出。 |
| 132 | <code>const base = mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.12, 32), MAT_BASE);</code> | 声明变量 `base` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 133 | <code>base.position.y = 0.06;</code> | 调用函数、设置值或更新状态。 |
| 134 | <code>base.receiveShadow = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 135 | <code>this.group.add(base);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 137 | <code>const basePlate = mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.02, 32), MAT_BASE);</code> | 声明变量 `basePlate` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 138 | <code>basePlate.position.y = 0.01;</code> | 调用函数、设置值或更新状态。 |
| 139 | <code>basePlate.receiveShadow = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 140 | <code>this.group.add(basePlate);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 144 | <code>const j1 = new THREE.Group();</code> | 声明变量 `j1` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 145 | <code>j1.position.y = 0.12;</code> | 调用函数、设置值或更新状态。 |
| 147 | <code>const turntable = mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.08, 32), MAT_JOINT);</code> | 声明变量 `turntable` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 148 | <code>turntable.position.y = 0.04;</code> | 调用函数、设置值或更新状态。 |
| 149 | <code>j1.add(turntable);</code> | 调用函数、设置值或更新状态。 |
| 151 | <code>const shoulder = mesh(new THREE.BoxGeometry(0.14, 0.16, 0.16), MAT_ARM);</code> | 声明变量 `shoulder` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 152 | <code>shoulder.position.y = 0.14;</code> | 调用函数、设置值或更新状态。 |
| 153 | <code>j1.add(shoulder);</code> | 调用函数、设置值或更新状态。 |
| 155 | <code>this.register(j1, 0.16);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 157 | <code>this.group.add(j1);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 160 | <code>const j2 = new THREE.Group();</code> | 声明变量 `j2` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 161 | <code>j2.position.y = 0.22;</code> | 调用函数、设置值或更新状态。 |
| 163 | <code>const j2Axis = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 24), MAT_JOINT);</code> | 声明变量 `j2Axis` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 164 | <code>j2Axis.rotation.x = Math.PI / 2;</code> | 调用函数、设置值或更新状态。 |
| 165 | <code>j2.add(j2Axis);</code> | 调用函数、设置值或更新状态。 |
| 167 | <code>const upperArm = mesh(new THREE.BoxGeometry(0.11, 0.42, 0.13), MAT_ARM);</code> | 声明变量 `upperArm` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 168 | <code>upperArm.position.y = 0.21;</code> | 调用函数、设置值或更新状态。 |
| 169 | <code>j2.add(upperArm);</code> | 调用函数、设置值或更新状态。 |
| 170 | <code>this.register(j2, 0.085);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 172 | <code>j1.add(j2);</code> | 调用函数、设置值或更新状态。 |
| 175 | <code>const j3 = new THREE.Group();</code> | 声明变量 `j3` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 176 | <code>j3.position.y = 0.42;</code> | 调用函数、设置值或更新状态。 |
| 177 | <code>const j3Axis = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 24), MAT_JOINT);</code> | 声明变量 `j3Axis` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 178 | <code>j3Axis.rotation.x = Math.PI / 2;</code> | 调用函数、设置值或更新状态。 |
| 179 | <code>j3.add(j3Axis);</code> | 调用函数、设置值或更新状态。 |
| 180 | <code>const forearm = mesh(new THREE.BoxGeometry(0.09, 0.36, 0.11), MAT_ARM);</code> | 声明变量 `forearm` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 181 | <code>forearm.position.y = 0.18;</code> | 调用函数、设置值或更新状态。 |
| 182 | <code>j3.add(forearm);</code> | 调用函数、设置值或更新状态。 |
| 183 | <code>this.register(j3, 0.07);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 184 | <code>j2.add(j3);</code> | 调用函数、设置值或更新状态。 |
| 187 | <code>const j4 = new THREE.Group();</code> | 声明变量 `j4` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 188 | <code>j4.position.y = 0.36;</code> | 调用函数、设置值或更新状态。 |
| 189 | <code>const wrist1 = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.12, 24), MAT_JOINT);</code> | 声明变量 `wrist1` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 190 | <code>wrist1.position.y = 0.06;</code> | 调用函数、设置值或更新状态。 |
| 191 | <code>j4.add(wrist1);</code> | 调用函数、设置值或更新状态。 |
| 192 | <code>this.register(j4, 0.06);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 193 | <code>j3.add(j4);</code> | 调用函数、设置值或更新状态。 |
| 196 | <code>const j5 = new THREE.Group();</code> | 声明变量 `j5` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 197 | <code>j5.position.y = 0.12;</code> | 调用函数、设置值或更新状态。 |
| 198 | <code>const j5Axis = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 24), MAT_JOINT);</code> | 声明变量 `j5Axis` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 199 | <code>j5Axis.rotation.x = Math.PI / 2;</code> | 调用函数、设置值或更新状态。 |
| 200 | <code>j5.add(j5Axis);</code> | 调用函数、设置值或更新状态。 |
| 201 | <code>const wrist2 = mesh(new THREE.BoxGeometry(0.07, 0.10, 0.09), MAT_ARM);</code> | 声明变量 `wrist2` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 202 | <code>wrist2.position.y = 0.05;</code> | 调用函数、设置值或更新状态。 |
| 203 | <code>j5.add(wrist2);</code> | 调用函数、设置值或更新状态。 |
| 204 | <code>this.register(j5, 0.055);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 205 | <code>j4.add(j5);</code> | 调用函数、设置值或更新状态。 |
| 208 | <code>const j6 = new THREE.Group();</code> | 声明变量 `j6` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 209 | <code>j6.position.y = 0.10;</code> | 调用函数、设置值或更新状态。 |
| 210 | <code>const flange = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 24), MAT_JOINT);</code> | 声明变量 `flange` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 211 | <code>flange.position.y = 0.025;</code> | 调用函数、设置值或更新状态。 |
| 212 | <code>j6.add(flange);</code> | 调用函数、设置值或更新状态。 |
| 214 | <code>const fingerL = mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT);</code> | 声明变量 `fingerL` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 215 | <code>fingerL.position.set(0.028, 0.085, 0);</code> | 调用函数、设置值或更新状态。 |
| 216 | <code>const fingerR = mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), MAT_JOINT);</code> | 声明变量 `fingerR` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 217 | <code>fingerR.position.set(-0.028, 0.085, 0);</code> | 调用函数、设置值或更新状态。 |
| 218 | <code>j6.add(fingerL, fingerR);</code> | 调用函数、设置值或更新状态。 |
| 219 | <code>this.register(j6, 0.05);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 220 | <code>j5.add(j6);</code> | 调用函数、设置值或更新状态。 |
| 221 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 228 | <code>private register(pivot: THREE.Group, ringRadius: number) {</code> | 定义或调用 `register`，参数由括号给出。 关键字：`private`＝限定类内部访问。 |
| 230 | <code>const axis = JOINT_AXES[this.joints.length];</code> | 声明变量 `axis` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 233 | <code>const ring = jointRing(ringRadius, axis, MAT_RING.clone());</code> | 声明变量 `ring` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 235 | <code>pivot.add(ring);</code> | 调用函数、设置值或更新状态。 |
| 237 | <code>this.joints.push(pivot);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 238 | <code>this.rings.push(ring);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 239 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 242 | <code>setJoints(deg: number[]) {</code> | 定义或调用 `setJoints`，参数由括号给出。 |
| 244 | <code>for (let i = 0; i &lt; 6; i++) {</code> | 控制分支、循环或异常处理流程。 关键字：`for`＝遍历集合或区间；`let`＝声明可重新赋值的变量。 |
| 245 | <code>const d = deg[i];</code> | 声明变量 `d` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 247 | <code>if (typeof d !== 'number' &#124;&#124; !Number.isFinite(d)) continue;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`typeof`＝读取值的运行时类型；`continue`＝跳过本轮继续循环。 |
| 248 | <code>const pivot = this.joints[i];</code> | 声明变量 `pivot` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 249 | <code>const axis = JOINT_AXES[i];</code> | 声明变量 `axis` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 251 | <code>const rad = THREE.MathUtils.degToRad(d);</code> | 声明变量 `rad` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 253 | <code>if (axis === 'x') pivot.rotation.x = rad;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支。 |
| 254 | <code>else if (axis === 'y') pivot.rotation.y = rad;</code> | 控制分支、循环或异常处理流程。 关键字：`else`＝进入另一条件分支；`if`＝按条件分支。 |
| 255 | <code>else pivot.rotation.z = rad;</code> | 控制分支、循环或异常处理流程。 关键字：`else`＝进入另一条件分支。 |
| 256 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 257 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 260 | <code>setAlarm(on: boolean) {</code> | 定义或调用 `setAlarm`，参数由括号给出。 |
| 262 | <code>for (const ring of this.rings) {</code> | 控制分支、循环或异常处理流程。 关键字：`for`＝遍历集合或区间；`const`＝声明不可重新绑定的变量；`of`＝遍历可迭代值；`this`＝当前对象实例。 |
| 264 | <code>const mat = ring.material as THREE.MeshStandardMaterial;</code> | 声明变量 `mat` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 266 | <code>mat.emissive.setHex(on ? 0xff2d2d : 0xff8c42);</code> | 调用函数、设置值或更新状态。 |
| 267 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 268 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 269 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
