# web/src/three/SceneManager.ts 逐行注释

[打开源码](../../../../../web/src/three/SceneManager.ts) · 202 行 · 84 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 31 行**

```text
import * as THREE from 'three';
// 注释：从 three 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 32 行**

```text
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// 注释：从 three/examples/jsm/controls/OrbitControls.js 导入这一行列出的符号，供本文件调用。 关键字：`import`＝导入模块或符号；`from`＝指定导入来源。
```

**源码第 38 行**

```text
export class SceneManager {
// 注释：声明 `SceneManager` 的结构。 关键字：`export`＝向其他模块开放符号；`class`＝定义类。
```

**源码第 40 行**

```text
  readonly scene = new THREE.Scene();
// 注释：调用 THREE.Scene；括号中的表达式是传入的参数。 关键字：`readonly`＝禁止重新赋值；`new`＝创建对象实例。
```

**源码第 42 行**

```text
  readonly camera: THREE.PerspectiveCamera;
// 注释：声明类属性或构造参数 camera，类型为 THREE.PerspectiveCamera。 关键字：`readonly`＝禁止重新赋值。
```

**源码第 44 行**

```text
  readonly renderer: THREE.WebGLRenderer;
// 注释：声明类属性或构造参数 renderer，类型为 THREE.WebGLRenderer。 关键字：`readonly`＝禁止重新赋值。
```

**源码第 46 行**

```text
  readonly controls: OrbitControls;
// 注释：声明类属性或构造参数 controls，类型为 OrbitControls。 关键字：`readonly`＝禁止重新赋值。
```

**源码第 49 行**

```text
  private raf = 0;
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`private`＝限定类内部访问。
```

**源码第 51 行**

```text
  private readonly observer: ResizeObserver;
// 注释：声明类属性或构造参数 observer，类型为 ResizeObserver。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 53 行**

```text
  private disposed = false;
// 注释：继续当前表达式；这一行的值由外层代码块或调用使用。 关键字：`private`＝限定类内部访问；`false`＝布尔假值。
```

**源码第 55 行**

```text
  constructor(private readonly container: HTMLElement) {
// 注释：定义类的构造函数；创建实例时接收参数并初始化依赖。 关键字：`private`＝限定类内部访问；`readonly`＝禁止重新赋值。
```

**源码第 58 行**

```text
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
// 注释：把右侧表达式的结果写入 this.renderer。 关键字：`this`＝当前对象实例；`new`＝创建对象实例；`true`＝布尔真值。
```

**源码第 60 行**

```text
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// 注释：调用 this.renderer.setPixelRatio，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 62 行**

```text
    this.renderer.shadowMap.enabled = true;
// 注释：把右侧表达式的结果写入 this.renderer.shadowMap.enabled。 关键字：`this`＝当前对象实例；`true`＝布尔真值。
```

**源码第 64 行**

```text
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// 注释：把右侧表达式的结果写入 this.renderer.shadowMap.type。 关键字：`this`＝当前对象实例。
```

**源码第 66 行**

```text
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
// 注释：把右侧表达式的结果写入 this.renderer.toneMapping。 关键字：`this`＝当前对象实例。
```

**源码第 68 行**

```text
    container.appendChild(this.renderer.domElement);
// 注释：调用 container.appendChild，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 72 行**

```text
    this.scene.background = new THREE.Color(0x0b0f14);
// 注释：把右侧表达式的结果写入 this.scene.background。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。
```

**源码第 74 行**

```text
    this.scene.fog = new THREE.Fog(0x0b0f14, 4, 10);
// 注释：把右侧表达式的结果写入 this.scene.fog。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。
```

**源码第 80 行**

```text
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100);
// 注释：把右侧表达式的结果写入 this.camera。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。
```

**源码第 82 行**

```text
    this.camera.position.set(1.5, 1.2, 1.8);
// 注释：调用 this.camera.position.set，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 86 行**

```text
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
// 注释：把右侧表达式的结果写入 this.controls。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。
```

**源码第 88 行**

```text
    this.controls.target.set(0, 0.45, 0);
// 注释：调用 this.controls.target.set，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 90 行**

```text
    this.controls.enableDamping = true;
// 注释：把右侧表达式的结果写入 this.controls.enableDamping。 关键字：`this`＝当前对象实例；`true`＝布尔真值。
```

**源码第 92 行**

```text
    this.controls.dampingFactor = 0.08;
// 注释：把右侧表达式的结果写入 this.controls.dampingFactor。 关键字：`this`＝当前对象实例。
```

**源码第 94 行**

```text
    this.controls.maxPolarAngle = Math.PI * 0.52; // 别钻到地面以下
// 注释：把右侧表达式的结果写入 this.controls.maxPolarAngle。 关键字：`this`＝当前对象实例。
```

**源码第 96 行**

```text
    this.controls.minDistance = 0.5;
// 注释：把右侧表达式的结果写入 this.controls.minDistance。 关键字：`this`＝当前对象实例。
```

**源码第 97 行**

```text
    this.controls.maxDistance = 6;
// 注释：把右侧表达式的结果写入 this.controls.maxDistance。 关键字：`this`＝当前对象实例。
```

**源码第 102 行**

```text
    const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 0.9);
// 注释：声明 hemi，初始值由 new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 0.9) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 103 行**

```text
    this.scene.add(hemi);
// 注释：调用 this.scene.add，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 105 行**

```text
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
// 注释：声明 key，初始值由 new THREE.DirectionalLight(0xffffff, 1.8) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 106 行**

```text
    key.position.set(2.5, 4, 2);
// 注释：调用 key.position.set，把括号中的值作为参数传入。
```

**源码第 107 行**

```text
    key.castShadow = true;
// 注释：把右侧表达式的结果写入 key.castShadow。 关键字：`true`＝布尔真值。
```

**源码第 108 行**

```text
    key.shadow.mapSize.set(1024, 1024);
// 注释：调用 key.shadow.mapSize.set，把括号中的值作为参数传入。
```

**源码第 110 行**

```text
    key.shadow.camera.left = -1.5;
// 注释：把右侧表达式的结果写入 key.shadow.camera.left。
```

**源码第 111 行**

```text
    key.shadow.camera.right = 1.5;
// 注释：把右侧表达式的结果写入 key.shadow.camera.right。
```

**源码第 112 行**

```text
    key.shadow.camera.top = 1.5;
// 注释：把右侧表达式的结果写入 key.shadow.camera.top。
```

**源码第 113 行**

```text
    key.shadow.camera.bottom = -1.5;
// 注释：把右侧表达式的结果写入 key.shadow.camera.bottom。
```

**源码第 114 行**

```text
    this.scene.add(key);
// 注释：调用 this.scene.add，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 116 行**

```text
    const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
// 注释：声明 rim，初始值由 new THREE.DirectionalLight(0x88aaff, 0.5) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 117 行**

```text
    rim.position.set(-2, 1.5, -2);
// 注释：调用 rim.position.set，把括号中的值作为参数传入。
```

**源码第 118 行**

```text
    this.scene.add(rim);
// 注释：调用 this.scene.add，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 123 行**

```text
    const ground = new THREE.Mesh(
// 注释：声明 ground，初始值由 new THREE.Mesh( 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 124 行**

```text
      new THREE.CircleGeometry(3, 64),
// 注释：调用 THREE.CircleGeometry；括号中的表达式是传入的参数。 关键字：`new`＝创建对象实例。
```

**源码第 125 行**

```text
      new THREE.MeshStandardMaterial({ color: 0x0e141b, roughness: 0.9, metalness: 0.1 }),
// 注释：调用 THREE.MeshStandardMaterial；括号中的表达式是传入的参数。 关键字：`new`＝创建对象实例。
```

**源码第 126 行**

```text
    );
// 注释：结束当前函数的参数列表并完成调用。
```

**源码第 128 行**

```text
    ground.rotation.x = -Math.PI / 2;
// 注释：把右侧表达式的结果写入 ground.rotation.x。
```

**源码第 129 行**

```text
    ground.receiveShadow = true;
// 注释：把右侧表达式的结果写入 ground.receiveShadow。 关键字：`true`＝布尔真值。
```

**源码第 130 行**

```text
    this.scene.add(ground);
// 注释：调用 this.scene.add，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 132 行**

```text
    const grid = new THREE.GridHelper(6, 60, 0x2a3a4a, 0x18222e);
// 注释：声明 grid，初始值由 new THREE.GridHelper(6, 60, 0x2a3a4a, 0x18222e) 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`new`＝创建对象实例。
```

**源码第 134 行**

```text
    grid.position.y = 0.001;
// 注释：把右侧表达式的结果写入 grid.position.y。
```

**源码第 135 行**

```text
    this.scene.add(grid);
// 注释：调用 this.scene.add，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 139 行**

```text
    this.observer = new ResizeObserver(() => this.resize());
// 注释：把右侧表达式的结果写入 this.observer。 关键字：`this`＝当前对象实例；`new`＝创建对象实例。
```

**源码第 140 行**

```text
    this.observer.observe(container);
// 注释：调用 this.observer.observe，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 142 行**

```text
    this.resize();
// 注释：调用 this.resize，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 143 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 148 行**

```text
  add(obj: THREE.Object3D) {
// 注释：定义方法 add；括号中声明参数，花括号内实现逻辑。
```

**源码第 149 行**

```text
    this.scene.add(obj);
// 注释：调用 this.scene.add，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 150 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 152 行**

```text
  start() {
// 注释：定义方法 start；括号中声明参数，花括号内实现逻辑。
```

**源码第 154 行**

```text
    const loop = () => {
// 注释：声明 loop，初始值由 () => { 计算得到。 关键字：`const`＝声明不可重新绑定的变量。
```

**源码第 156 行**

```text
      if (this.disposed) return;
// 注释：判断 if (this.disposed) return; 中的条件，成立时执行对应分支。 关键字：`if`＝按条件分支；`this`＝当前对象实例；`return`＝返回结果并结束当前函数。
```

**源码第 158 行**

```text
      this.raf = requestAnimationFrame(loop);
// 注释：把右侧表达式的结果写入 this.raf。 关键字：`this`＝当前对象实例。
```

**源码第 160 行**

```text
      this.controls.update();
// 注释：调用 this.controls.update，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 162 行**

```text
      this.renderer.render(this.scene, this.camera);
// 注释：调用 this.renderer.render，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 163 行**

```text
    };
// 注释：结束当前对象或代码块，并完成这条语句。
```

**源码第 165 行**

```text
    loop();
// 注释：调用 loop；括号中的表达式是传入的参数。
```

**源码第 166 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 172 行**

```text
  resize() {
// 注释：定义方法 resize；括号中声明参数，花括号内实现逻辑。
```

**源码第 174 行**

```text
    const w = this.container.clientWidth || 1;
// 注释：声明 w，初始值由 this.container.clientWidth || 1 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 175 行**

```text
    const h = this.container.clientHeight || 1;
// 注释：声明 h，初始值由 this.container.clientHeight || 1 计算得到。 关键字：`const`＝声明不可重新绑定的变量；`this`＝当前对象实例。
```

**源码第 177 行**

```text
    this.camera.aspect = w / h;
// 注释：把右侧表达式的结果写入 this.camera.aspect。 关键字：`this`＝当前对象实例。
```

**源码第 179 行**

```text
    this.camera.updateProjectionMatrix();
// 注释：调用 this.camera.updateProjectionMatrix，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 181 行**

```text
    this.renderer.setSize(w, h);
// 注释：调用 this.renderer.setSize，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 182 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 188 行**

```text
  dispose() {
// 注释：定义方法 dispose；括号中声明参数，花括号内实现逻辑。
```

**源码第 190 行**

```text
    this.disposed = true;
// 注释：把右侧表达式的结果写入 this.disposed。 关键字：`this`＝当前对象实例；`true`＝布尔真值。
```

**源码第 192 行**

```text
    cancelAnimationFrame(this.raf);
// 注释：调用 cancelAnimationFrame；括号中的表达式是传入的参数。 关键字：`this`＝当前对象实例。
```

**源码第 194 行**

```text
    this.observer.disconnect();
// 注释：调用 this.observer.disconnect，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 196 行**

```text
    this.controls.dispose();
// 注释：调用 this.controls.dispose，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 198 行**

```text
    this.renderer.dispose();
// 注释：调用 this.renderer.dispose，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 200 行**

```text
    this.renderer.domElement.remove();
// 注释：调用 this.renderer.domElement.remove，把括号中的值作为参数传入。 关键字：`this`＝当前对象实例。
```

**源码第 201 行**

```text
  }
// 注释：结束当前对象、函数或条件代码块。
```

**源码第 202 行**

```text
}
// 注释：结束当前对象、函数或条件代码块。
```
