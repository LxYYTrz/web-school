<!-- 这一段负责收集账号口令并建立用户登录会话，为后续代码提供当前文件的处理入口。 -->
<!-- 这一段实现界面模板，服务于收集账号口令并建立用户登录会话。 -->
<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
<!-- template 是当前使用的界面元素或组件 -->
  <div class="login-wrap">
  <!-- 渲染容器，应用 login-wrap 样式类。 -->
  <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 login-wrap -->
    <el-card class="login-card" shadow="always">
    <!-- 渲染卡片，应用 login-card 样式类。 -->
    <!-- el-card 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 login-card -->
      <template #header>
      <!-- 渲染template 元素或组件。 -->
      <!-- template 是当前使用的界面元素或组件；#header 表示将此区域放入组件指定名称的插槽 -->
        <div class="title">
        <!-- 渲染容器，应用 title 样式类。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 title -->
          <span class="brand-dot" />
          <!-- 渲染行内文字，应用 brand-dot 样式类。 -->
          <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 brand-dot -->
          <span>产线数字孪生监控平台</span>
          <!-- 在界面中配置 span 元素及其内容或事件绑定。 -->
          <!-- span 是当前使用的界面元素或组件 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
      </template>
      <!-- 结束 template 组件或元素对应的界面区域。 -->
      <!-- template 是当前使用的界面元素或组件 -->

      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" size="large" @keyup.enter="onSubmit" >
      <!-- 在界面中配置 el-form 元素及其内容或事件绑定。 -->
      <!-- el-form 是当前使用的界面元素或组件；ref 表示保存 DOM 节点或组件实例引用，当前值为 formRef；:model 表示把表达式结果动态绑定到组件属性，当前值为 form；:rules 表示把表达式结果动态绑定到组件属性，当前值为 rules；size 表示组件尺寸，当前值为 large；@keyup.enter 表示当前组件或 DOM 事件的处理函数绑定，当前值为 onSubmit -->
        <el-form-item prop="username">
        <!-- 在界面中配置 el-form-item 元素及其内容或事件绑定。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
          <el-input v-model="form.username" placeholder="用户名" autofocus :prefix-icon="User" />
          <!-- 渲染输入框，与状态双向同步（form.username）。 -->
          <!-- el-input 是当前使用的界面元素或组件；v-model 表示把输入内容与响应式变量双向同步，当前值为 form.username；:prefix-icon 表示把表达式结果动态绑定到组件属性，当前值为 User -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
        <el-form-item prop="password">
        <!-- 在界面中配置 el-form-item 元素及其内容或事件绑定。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
          <el-input v-model="form.password" type="password" placeholder="密码" show-password :prefix-icon="Lock" />
          <!-- 在界面中配置 el-input 元素及其内容或事件绑定。 -->
          <!-- el-input 是当前使用的界面元素或组件；v-model 表示把输入内容与响应式变量双向同步，当前值为 form.password；type 表示组件外观类型或输入控件类型，当前值为 password；:prefix-icon 表示把表达式结果动态绑定到组件属性，当前值为 Lock -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
        <el-form-item v-if="errMsg">
        <!-- 渲染表单字段，条件成立时显示（errMsg）。 -->
        <!-- el-form-item 是当前使用的界面元素或组件；v-if 表示条件成立时才渲染元素，当前值为 errMsg -->
          <el-alert :title="errMsg" type="error" :closable="false" show-icon />
          <!-- 渲染el-alert 元素或组件。 -->
          <!-- el-alert 是当前使用的界面元素或组件；:title 表示把表达式结果动态绑定到组件属性，当前值为 errMsg；type 表示组件外观类型或输入控件类型，当前值为 error；:closable 表示把表达式结果动态绑定到组件属性，当前值为 false -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
        <el-button type="primary" size="large" class="submit" :loading="loading" @click="onSubmit" >
        <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
        <!-- el-button 是当前使用的界面元素或组件；type 表示组件外观类型或输入控件类型，当前值为 primary；size 表示组件尺寸，当前值为 large；class 表示应用的样式类，当前值为 submit；:loading 表示把表达式结果动态绑定到组件属性，当前值为 loading；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 onSubmit -->
          登录
          <!-- 在当前页面元素中直接显示文字「登录」。 -->
          <!-- 登录 是直接显示在当前界面元素中的文字内容 -->
        </el-button>
        <!-- 结束 el-button 元素及其中的内容。 -->
        <!-- el-button 是当前使用的界面元素或组件 -->
      </el-form>
      <!-- 结束 el-form 元素及其中的内容。 -->
      <!-- el-form 是当前使用的界面元素或组件 -->
    </el-card>
    <!-- 结束 el-card 元素及其中的内容。 -->
    <!-- el-card 是当前使用的界面元素或组件 -->
  </div>
  <!-- 结束 div 元素及其中的内容。 -->
  <!-- div 是当前使用的界面元素或组件 -->
</template>
<!-- 结束 template 组件或元素对应的界面区域。 -->
<!-- template 是当前使用的界面元素或组件 -->
<!-- 这一段完成了界面布局和数据展示的定义，供页面渲染时使用。 -->

<!-- 这一段实现组件状态与事件处理，服务于收集账号口令并建立用户登录会话。 -->
<script setup lang="ts">
// 开始当前 Vue 组件的脚本区域，定义页面状态与交互逻辑。
// script 是 Vue 组件逻辑区；setup 让顶层声明可直接用于模板；lang="ts" 指定使用 TypeScript
import { ref, reactive } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。
// ref：Vue 创建可通过 .value 读写的响应式引用；reactive：Vue 将对象转换为响应式状态的函数
import { useRouter, useRoute } from 'vue-router';
// 从 vue-router 导入这一行列出的符号，供本文件调用。
// useRouter：Vue Router 获取路由实例的函数；useRoute：Vue Router 获取当前路由信息的函数
import { User, Lock } from '@element-plus/icons-vue';
// 从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。
// User：从 @element-plus/icons-vue 导入的对象，用于本文件的调用或类型约束；Lock：从 @element-plus/icons-vue 导入的对象，用于本文件的调用或类型约束
import type { FormInstance, FormRules } from 'element-plus';
// 从 element-plus 导入这一行列出的符号，供本文件调用。
// FormInstance：从 element-plus 导入的对象，用于本文件的Element Plus 界面组件与提示 API；FormRules：从 element-plus 导入的对象，用于本文件的Element Plus 界面组件与提示 API
import { useAuthStore } from '../stores/auth';
// 从 ../stores/auth 导入这一行列出的符号，供本文件调用。
// useAuthStore：项目定义的登录状态仓库入口

const router = useRouter();
// 创建或使用Vue Router 获取路由实例的函数，将结果保存或写入 router。
// router：前端页面路由器实例；useRouter：Vue Router 获取路由实例的函数
const route = useRoute();
// 创建或使用Vue Router 获取当前路由信息的函数，将结果保存或写入 route。
// route：当前前端路由信息；useRoute：Vue Router 获取当前路由信息的函数
const auth = useAuthStore();
// 创建或使用项目定义的登录状态仓库入口，将结果保存或写入 auth。
// auth：Pinia 登录状态仓库实例；useAuthStore：项目定义的登录状态仓库入口

const formRef = ref<FormInstance | null>(null);
// 根据 ref<FormInstance | null>(null) 设置 formRef，供当前流程后续使用。
// formRef：本处保存 ref<FormInstance | null>(null) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用；FormInstance：从 element-plus 导入的对象，用于本文件的Element Plus 界面组件与提示 API
const form = reactive({ username: '', password: '' });
// 创建或使用Vue 将对象转换为响应式状态的函数，将结果保存或写入 form。
// form：界面表单绑定的数据对象；reactive：Vue 将对象转换为响应式状态的函数；username：账号用户名；password：登录口令或数据库保存的口令摘要，具体取决于所在对象
const loading = ref(false);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 loading。
// loading：正在等待异步操作的界面状态；ref：Vue 创建可通过 .value 读写的响应式引用
const errMsg = ref('');
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 errMsg。
// errMsg：本处保存 ref('') 的结果；ref：Vue 创建可通过 .value 读写的响应式引用

const rules: FormRules = {
// 声明 rules，初始值由 { 计算得到，供当前处理流程继续使用。
// rules：本处保存 { username: [{ required: true, message: '请输入用户名', trigger: '… 的结果，类型为 FormRules；FormRules：从 element-plus 导入的对象，用于本文件的Element Plus 界面组件与提示 API
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  // 声明或设置 username，用于账号用户名。
  // username：账号用户名；message：消息正文或用于展示的结果说明
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  // 声明或设置 password，用于登录口令或数据库保存的口令摘要，具体取决于所在对象。
  // password：登录口令或数据库保存的口令摘要，具体取决于所在对象；message：消息正文或用于展示的结果说明
};
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束

// 这一段定义 onSubmit，用于校验登录表单并提交登录请求。
async function onSubmit() {
// 校验登录表单并提交登录请求。
// onSubmit：校验登录表单并提交登录请求
  errMsg.value = '';
  // 把右侧表达式的结果写入 errMsg.value。
  // errMsg：本处保存 ref('') 的结果；value：当前字段或点位的实际取值
  if (!formRef.value) return;
  // 检查(!formRef.value) return;，按判断结果进入对应的处理分支。
  // formRef：本处保存 ref<FormInstance | null>(null) 的结果；value：当前字段或点位的实际取值
  const valid = await formRef.value.validate().catch(() => false);
  // 按当前数据契约检查输入是否有效，将结果保存或写入 valid。
  // valid：本处保存 await formRef.value.validate().catch(() => false) 的结果；formRef：本处保存 ref<FormInstance | null>(null) 的结果；value：当前字段或点位的实际取值；validate：本处声明的字段或类型，类型为 (callback?: FormValidateCallback) => FormValidationResult；catch：本处声明的字段或类型，类型为 Promise<T | TResult>
  if (!valid) return;
  // 检查(!valid) return;，按判断结果进入对应的处理分支。
  // valid：本处保存 await formRef.value.validate().catch(() => false) 的结果
  loading.value = true;
  // 把右侧表达式的结果写入 loading.value。
  // loading：正在等待异步操作的界面状态；value：当前字段或点位的实际取值
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    await auth.login(form.username, form.password);
    // 提交账号口令并建立登录会话。
    // auth：Pinia 登录状态仓库实例；login：auth 对象上的字段或操作；form：界面表单绑定的数据对象；username：账号用户名；password：登录口令或数据库保存的口令摘要，具体取决于所在对象
  } catch (e) {
  // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
  // e：本处保存的局部数据
    // dev/demo fallback:无后端时本地登录,纯看页面用
    if (import.meta.env.VITE_MOCK_ONLY === 'true') {
    // 检查(import.meta.env.VITE_MOCK_ONLY === 'true')，按判断结果进入对应的处理分支。
    // env：本处声明的字段或类型，类型为 ImportMetaEnv；VITE_MOCK_ONLY：本处声明的字段或类型，类型为 any
      await auth.demoLogin(form.username || 'demo');
      // 执行 demoLogin 对应的本地处理，使用本行提供的数据。
      // auth：Pinia 登录状态仓库实例；demoLogin：auth 对象上的字段或操作；form：界面表单绑定的数据对象；username：账号用户名
    } else {
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 本行完成上面一层已说明的函数、分支或对象配置
      errMsg.value = (e as Error).message || '登录失败';
      // 把右侧表达式的结果写入 errMsg.value。
      // errMsg：本处保存 ref('') 的结果；value：当前字段或点位的实际取值；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
      loading.value = false;
      // 把右侧表达式的结果写入 loading.value。
      // loading：正在等待异步操作的界面状态；value：当前字段或点位的实际取值
      return;
      // 立即结束当前函数，不返回具体值。
      // 当前函数在此处结束，调用方不会从这条路径收到业务数据
    }
    // 结束当前函数、分支或对象配置，返回上一层处理流程。
    // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
  // 登录成功后跳转到原本想去的页,或默认 /twin
  const redirect = (route.query.redirect as string) || '/twin';
  // 根据 (route.query.redirect as string) || '/twin' 设置 redirect，供当前流程后续使用。
  // redirect：本处保存 (route.query.redirect as string) || '/twin' 的结果；route：当前前端路由信息；query：查询字符串参数或数据库查询操作，以当前对象为准
  router.push(redirect);
  // 向数组末尾追加元素。
  // router：前端页面路由器实例；push：向数组末尾追加元素；redirect：本处保存 (route.query.redirect as string) || '/twin' 的结果
  loading.value = false;
  // 把右侧表达式的结果写入 loading.value。
  // loading：正在等待异步操作的界面状态；value：当前字段或点位的实际取值
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了校验登录表单并提交登录请求的实现；实际结果由运行时输入和执行分支决定。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->
<!-- script 是当前使用的界面元素或组件 -->
<!-- 这一段完成了响应式状态与用户交互处理的定义，供页面渲染时使用。 -->

<!-- 这一段实现当前页面或组件的外观样式，服务于收集账号口令并建立用户登录会话。 -->
<style scoped>
/* 开始当前 Vue 组件的样式区域，设置页面元素的外观。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段为 .login-wrap 对应的界面元素定义尺寸、布局或视觉样式。 */
.login-wrap {
/* 对选择器 .login-wrap 匹配的元素应用后续声明。 */
/* .login-wrap 是这一组样式匹配的元素选择器 */
  height: 100vh;
  /* height=100vh：设置高度。 */
  /* height 控制高度，这里取 100vh */
  display: flex;
  /* display=flex：决定元素如何布局或显示。 */
  /* display 控制元素布局方式，这里取 flex */
  align-items: center;
  /* align-items=center：控制交叉轴上的对齐方式。 */
  /* align-items 控制交叉轴对齐方式，这里取 center */
  justify-content: center;
  /* justify-content=center：控制主轴上的分布方式。 */
  /* justify-content 控制主轴内容排列方式，这里取 center */
  background:
  /* 设置背景：background:。 */
  /* 当前样式块作用于最近一个选择器匹配到的页面元素 */
    radial-gradient(ellipse at top, rgba(40, 30, 70, 0.6), transparent 60%),
    /* 创建界面或材质所用的渐变颜色。 */
    /* 当前样式块作用于最近一个选择器匹配到的页面元素 */
    var(--bg);
    /* 执行 var 对应的本地处理，使用本行提供的数据。 */
    /* 当前样式块作用于最近一个选择器匹配到的页面元素 */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .login-wrap 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
/* 这一段为 .login-card 对应的界面元素定义尺寸、布局或视觉样式。 */
.login-card {
/* 对选择器 .login-card 匹配的元素应用后续声明。 */
/* .login-card 是这一组样式匹配的元素选择器 */
  width: 360px;
  /* width=360px：设置宽度。 */
  /* width 控制宽度，这里取 360px */
  background: var(--panel);
  /* background=var(--panel)：设置背景。 */
  /* background 控制背景，这里取 var(--panel) */
  border: 1px solid var(--panel-border);
  /* border=1px solid var(--panel-border)：设置边框。 */
  /* border 控制边框，这里取 1px solid var(--panel-border) */
  backdrop-filter: blur(6px);
  /* backdrop-filter=blur(6px)：设置该样式属性。 */
  /* backdrop-filter 控制当前元素的样式取值，这里取 blur(6px) */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .login-card 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
/* 这一段为 .title 对应的界面元素定义尺寸、布局或视觉样式。 */
.title {
/* 对选择器 .title 匹配的元素应用后续声明。 */
/* .title 是这一组样式匹配的元素选择器 */
  display: flex;
  /* display=flex：决定元素如何布局或显示。 */
  /* display 控制元素布局方式，这里取 flex */
  align-items: center;
  /* align-items=center：控制交叉轴上的对齐方式。 */
  /* align-items 控制交叉轴对齐方式，这里取 center */
  gap: 10px;
  /* gap=10px：设置子元素间距。 */
  /* gap 控制子元素间距，这里取 10px */
  color: var(--text);
  /* color=var(--text)：设置文字颜色。 */
  /* color 控制文字颜色，这里取 var(--text) */
  font-weight: 600;
  /* font-weight=600：设置字重。 */
  /* font-weight 控制字体粗细，这里取 600 */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .title 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
/* 这一段为 .brand-dot 对应的界面元素定义尺寸、布局或视觉样式。 */
.brand-dot {
/* 对选择器 .brand-dot 匹配的元素应用后续声明。 */
/* .brand-dot 是这一组样式匹配的元素选择器 */
  width: 10px;
  /* width=10px：设置宽度。 */
  /* width 控制宽度，这里取 10px */
  height: 10px;
  /* height=10px：设置高度。 */
  /* height 控制高度，这里取 10px */
  border-radius: 50%;
  /* border-radius=50%：设置圆角。 */
  /* border-radius 控制圆角半径，这里取 50% */
  background: var(--accent);
  /* background=var(--accent)：设置背景。 */
  /* background 控制背景，这里取 var(--accent) */
  box-shadow: 0 0 10px var(--accent-glow);
  /* box-shadow=0 0 10px var(--accent-glow)：设置阴影。 */
  /* box-shadow 控制阴影，这里取 0 0 10px var(--accent-glow) */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
/* 这一段完成 .brand-dot 的样式设置，浏览器渲染匹配元素时应用这些规则。 */
.submit {
/* 对选择器 .submit 匹配的元素应用后续声明。 */
/* .submit 是这一组样式匹配的元素选择器 */
  width: 100%;
  /* width=100%：设置宽度。 */
  /* width 控制宽度，这里取 100% */
}
/* 结束当前函数、分支或对象配置，返回上一层处理流程。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
<!-- style 是当前使用的界面元素或组件 -->
<!-- 这一段提供了收集账号口令并建立用户登录会话所需的定义和处理逻辑，结果交由调用方或运行环境使用。 -->
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
