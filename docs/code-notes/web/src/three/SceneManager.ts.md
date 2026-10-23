# web/src/three/SceneManager.ts 逐行说明

[打开源码](../../../../../web/src/three/SceneManager.ts) · 202 行 · 84 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 31 | <code>import * as THREE from 'three';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 32 | <code>import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';</code> | 导入或导出模块符号。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。 |
| 38 | <code>export class SceneManager {</code> | 声明 `SceneManager` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。 |
| 40 | <code>readonly scene = new THREE.Scene();</code> | 续写当前表达式、对象、类型或调用。 关键字：`readonly`＝禁止重新赋值；`new`＝创建对象实例。 |
| 42 | <code>readonly camera: THREE.PerspectiveCamera;</code> | 续写当前表达式、对象、类型或调用。 关键字：`readonly`＝禁止重新赋值。 |
| 44 | <code>readonly renderer: THREE.WebGLRenderer;</code> | 续写当前表达式、对象、类型或调用。 关键字：`readonly`＝禁止重新赋值。 |
| 46 | <code>readonly controls: OrbitControls;</code> | 续写当前表达式、对象、类型或调用。 关键字：`readonly`＝禁止重新赋值。 |
| 49 | <code>private raf = 0;</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问。 |
| 51 | <code>private readonly observer: ResizeObserver;</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 53 | <code>private disposed = false;</code> | 续写当前表达式、对象、类型或调用。 关键字：`private`＝限定类内部访问；`false`＝布尔假值。 |
| 55 | <code>constructor(private readonly container: HTMLElement) {</code> | 定义或调用 `constructor`，参数由括号给出。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。 |
| 58 | <code>this.renderer = new THREE.WebGLRenderer({ antialias: true });</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例；`new`＝创建对象实例；`true`＝布尔真值。 |
| 60 | <code>this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 62 | <code>this.renderer.shadowMap.enabled = true;</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例；`true`＝布尔真值。 |
| 64 | <code>this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 66 | <code>this.renderer.toneMapping = THREE.ACESFilmicToneMapping;</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 68 | <code>container.appendChild(this.renderer.domElement);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 72 | <code>this.scene.background = new THREE.Color(0x0b0f14);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。 |
| 74 | <code>this.scene.fog = new THREE.Fog(0x0b0f14, 4, 10);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。 |
| 80 | <code>this.camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。 |
| 82 | <code>this.camera.position.set(1.5, 1.2, 1.8);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 86 | <code>this.controls = new OrbitControls(this.camera, this.renderer.domElement);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。 |
| 88 | <code>this.controls.target.set(0, 0.45, 0);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 90 | <code>this.controls.enableDamping = true;</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例；`true`＝布尔真值。 |
| 92 | <code>this.controls.dampingFactor = 0.08;</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 94 | <code>this.controls.maxPolarAngle = Math.PI * 0.52; // 别钻到地面以下</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 96 | <code>this.controls.minDistance = 0.5;</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 97 | <code>this.controls.maxDistance = 6;</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 102 | <code>const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 0.9);</code> | 声明变量 `hemi` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 103 | <code>this.scene.add(hemi);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 105 | <code>const key = new THREE.DirectionalLight(0xffffff, 1.8);</code> | 声明变量 `key` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 106 | <code>key.position.set(2.5, 4, 2);</code> | 调用函数、设置值或更新状态。 |
| 107 | <code>key.castShadow = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 108 | <code>key.shadow.mapSize.set(1024, 1024);</code> | 调用函数、设置值或更新状态。 |
| 110 | <code>key.shadow.camera.left = -1.5;</code> | 调用函数、设置值或更新状态。 |
| 111 | <code>key.shadow.camera.right = 1.5;</code> | 调用函数、设置值或更新状态。 |
| 112 | <code>key.shadow.camera.top = 1.5;</code> | 调用函数、设置值或更新状态。 |
| 113 | <code>key.shadow.camera.bottom = -1.5;</code> | 调用函数、设置值或更新状态。 |
| 114 | <code>this.scene.add(key);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 116 | <code>const rim = new THREE.DirectionalLight(0x88aaff, 0.5);</code> | 声明变量 `rim` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 117 | <code>rim.position.set(-2, 1.5, -2);</code> | 调用函数、设置值或更新状态。 |
| 118 | <code>this.scene.add(rim);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 123 | <code>const ground = new THREE.Mesh(</code> | 声明变量 `ground` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 124 | <code>new THREE.CircleGeometry(3, 64),</code> | 续写当前表达式、对象、类型或调用。 关键字：`new`＝创建对象实例。 |
| 125 | <code>new THREE.MeshStandardMaterial({ color: 0x0e141b, roughness: 0.9, metalness: 0.1 }),</code> | 续写当前表达式、对象、类型或调用。 关键字：`new`＝创建对象实例。 |
| 126 | <code>);</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 128 | <code>ground.rotation.x = -Math.PI / 2;</code> | 调用函数、设置值或更新状态。 |
| 129 | <code>ground.receiveShadow = true;</code> | 调用函数、设置值或更新状态。 关键字：`true`＝布尔真值。 |
| 130 | <code>this.scene.add(ground);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 132 | <code>const grid = new THREE.GridHelper(6, 60, 0x2a3a4a, 0x18222e);</code> | 声明变量 `grid` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。 |
| 134 | <code>grid.position.y = 0.001;</code> | 调用函数、设置值或更新状态。 |
| 135 | <code>this.scene.add(grid);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 139 | <code>this.observer = new ResizeObserver(() =&gt; this.resize());</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。 |
| 140 | <code>this.observer.observe(container);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 142 | <code>this.resize();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 143 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 148 | <code>add(obj: THREE.Object3D) {</code> | 定义或调用 `add`，参数由括号给出。 |
| 149 | <code>this.scene.add(obj);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 150 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 152 | <code>start() {</code> | 定义或调用 `start`，参数由括号给出。 |
| 154 | <code>const loop = () =&gt; {</code> | 声明变量 `loop` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量。 |
| 156 | <code>if (this.disposed) return;</code> | 控制分支、循环或异常处理流程。 关键字：`if`＝按条件分支；`this`＝当前对象实例；`return`＝返回结果并结束当前函数。 |
| 158 | <code>this.raf = requestAnimationFrame(loop);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 160 | <code>this.controls.update();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 162 | <code>this.renderer.render(this.scene, this.camera);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 163 | <code>};</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 165 | <code>loop();</code> | 定义或调用 `loop`，参数由括号给出。 |
| 166 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 172 | <code>resize() {</code> | 定义或调用 `resize`，参数由括号给出。 |
| 174 | <code>const w = this.container.clientWidth &#124;&#124; 1;</code> | 声明变量 `w` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 175 | <code>const h = this.container.clientHeight &#124;&#124; 1;</code> | 声明变量 `h` 并设置初始值或类型。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。 |
| 177 | <code>this.camera.aspect = w / h;</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 179 | <code>this.camera.updateProjectionMatrix();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 181 | <code>this.renderer.setSize(w, h);</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 182 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 188 | <code>dispose() {</code> | 定义或调用 `dispose`，参数由括号给出。 |
| 190 | <code>this.disposed = true;</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例；`true`＝布尔真值。 |
| 192 | <code>cancelAnimationFrame(this.raf);</code> | 定义或调用 `cancelAnimationFrame`，参数由括号给出。 关键字：`this`＝当前对象实例。 |
| 194 | <code>this.observer.disconnect();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 196 | <code>this.controls.dispose();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 198 | <code>this.renderer.dispose();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 200 | <code>this.renderer.domElement.remove();</code> | 调用函数、设置值或更新状态。 关键字：`this`＝当前对象实例。 |
| 201 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
| 202 | <code>}</code> | 结束或开始当前代码块、对象、数组或调用。 |
