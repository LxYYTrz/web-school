<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
  <div class="login-wrap">
  <!-- 渲染容器，应用 login-wrap 样式类。 -->
    <el-card class="login-card" shadow="always">
    <!-- 渲染卡片，应用 login-card 样式类。 -->
      <template #header>
      <!-- 渲染template 元素或组件。 关键字：#＝命名插槽的简写。 -->
        <div class="title">
        <!-- 渲染容器，应用 title 样式类。 -->
          <span class="brand-dot" />
          <!-- 渲染行内文字，应用 brand-dot 样式类。 -->
          <span>产线数字孪生监控平台</span>
          <!-- 渲染行内文字。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
      </template>
      <!-- 结束当前模板或插槽内容。 -->

      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" size="large" @keyup.enter="onSubmit" >
      <!-- 渲染表单。；设置 ref=formRef：保存元素或组件引用。；设置 :model=form：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；设置 :rules=rules：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；设置 label-width=0：设置该属性。；设置 size=large：设置组件尺寸。；设置 @keyup.enter=onSubmit：设置该属性。 关键字：@＝事件监听的简写。；结束当前元素的属性列表或自闭合标签。 -->
        <el-form-item prop="username">
        <!-- 渲染表单字段。 -->
          <el-input v-model="form.username" placeholder="用户名" autofocus :prefix-icon="User" />
          <!-- 渲染输入框，与状态双向同步（form.username）。 关键字：v-model＝让输入值和状态双向同步；:＝属性动态绑定的简写。 -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
        <el-form-item prop="password">
        <!-- 渲染表单字段。 -->
          <el-input v-model="form.password" type="password" placeholder="密码" show-password :prefix-icon="Lock" />
          <!-- 渲染输入框。；设置 v-model=form.password：设置该属性。 关键字：v-model＝让输入值和状态双向同步。；设置 type=password：选择组件外观或字段类型。；设置 placeholder=密码：设置该属性。；启用当前元素的 show-password 布尔属性。；设置 :prefix-icon=Lock：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；结束当前元素的属性列表或自闭合标签。 -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
        <el-form-item v-if="errMsg">
        <!-- 渲染表单字段，条件成立时显示（errMsg）。 关键字：v-if＝条件为真时才渲染。 -->
          <el-alert :title="errMsg" type="error" :closable="false" show-icon />
          <!-- 渲染el-alert 元素或组件。 关键字：:＝属性动态绑定的简写。 -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
        <el-button type="primary" size="large" class="submit" :loading="loading" @click="onSubmit" >
        <!-- 渲染操作按钮。；设置 type=primary：选择组件外观或字段类型。；设置 size=large：设置组件尺寸。；设置 class=submit：指定 CSS 样式类。；设置 :loading=loading：将表达式结果传给组件。 关键字：:＝属性动态绑定的简写。；设置 @click=onSubmit：设置该属性。 关键字：@＝事件监听的简写。；结束当前元素的属性列表或自闭合标签。 -->
          登录
          <!-- 启用当前元素的 登录 布尔属性。 -->
        </el-button>
        <!-- 结束 el-button 元素及其中的内容。 -->
      </el-form>
      <!-- 结束 el-form 元素及其中的内容。 -->
    </el-card>
    <!-- 结束 el-card 元素及其中的内容。 -->
  </div>
  <!-- 结束 div 元素及其中的内容。 -->
</template>
<!-- 结束当前模板或插槽内容。 -->

<script setup lang="ts">
// 开始 Vue 组件的 TypeScript 逻辑区域。
import { ref, reactive } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useRouter, useRoute } from 'vue-router';
// 从 vue-router 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { User, Lock } from '@element-plus/icons-vue';
// 从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { FormInstance, FormRules } from 'element-plus';
// 从 element-plus 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useAuthStore } from '../stores/auth';
// 从 ../stores/auth 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

const router = useRouter();
// 声明 router，初始值由 useRouter() 计算得到。 关键字：const＝声明不可重新绑定的变量。
const route = useRoute();
// 声明 route，初始值由 useRoute() 计算得到。 关键字：const＝声明不可重新绑定的变量。
const auth = useAuthStore();
// 声明 auth，初始值由 useAuthStore() 计算得到。 关键字：const＝声明不可重新绑定的变量。

const formRef = ref<FormInstance | null>(null);
// 声明 formRef，初始值由 ref<FormInstance | null>(null) 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
const form = reactive({ username: '', password: '' });
// 声明 form，初始值由 reactive({ username: '', password: '' }) 计算得到。 关键字：const＝声明不可重新绑定的变量。
const loading = ref(false);
// 声明 loading，初始值由 ref(false) 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。
const errMsg = ref('');
// 声明 errMsg，初始值由 ref('') 计算得到。 关键字：const＝声明不可重新绑定的变量。

const rules: FormRules = {
// 声明 rules，初始值由 { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  // 设置字段 username。 关键字：true＝布尔真值。
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  // 设置字段 password。 关键字：true＝布尔真值。
};
// 结束当前对象或代码块，并完成这条语句。

async function onSubmit() {
// 定义函数 onSubmit。 关键字：async＝声明异步函数；function＝定义函数。
  errMsg.value = '';
  // 把右侧表达式的结果写入 errMsg.value。
  if (!formRef.value) return;
  // 判断 if (!formRef.value) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  const valid = await formRef.value.validate().catch(() => false);
  // 声明 valid，初始值由 await formRef.value.validate().catch(() => false) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；catch＝捕获异常；false＝布尔假值。
  if (!valid) return;
  // 判断 if (!valid) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  loading.value = true;
  // 把右侧表达式的结果写入 loading.value。 关键字：true＝布尔真值。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    await auth.login(form.username, form.password);
    // 调用 auth.login，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
  } catch (e) {
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    // dev/demo fallback:无后端时本地登录,纯看页面用
    if (import.meta.env.VITE_MOCK_ONLY === 'true') {
    // 判断 if (import.meta.env.VITE_MOCK_ONLY === 'true') { 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；import＝导入模块或符号。
      await auth.demoLogin(form.username || 'demo');
      // 调用 auth.demoLogin，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
    } else {
    // 开始前一条件不满足时的分支。 关键字：else＝进入另一条件分支。
      errMsg.value = (e as Error).message || '登录失败';
      // 把右侧表达式的结果写入 errMsg.value。
      loading.value = false;
      // 把右侧表达式的结果写入 loading.value。 关键字：false＝布尔假值。
      return;
      // 立即结束当前函数，不返回具体值。 关键字：return＝返回结果并结束当前函数。
    }
    // 结束当前对象、函数或条件代码块。
  }
  // 结束当前对象、函数或条件代码块。
  // 登录成功后跳转到原本想去的页,或默认 /twin
  const redirect = (route.query.redirect as string) || '/twin';
  // 声明 redirect，初始值由 (route.query.redirect as string) || '/twin' 计算得到。 关键字：const＝声明不可重新绑定的变量。
  router.push(redirect);
  // 调用 router.push，把括号中的值作为参数传入。
  loading.value = false;
  // 把右侧表达式的结果写入 loading.value。 关键字：false＝布尔假值。
}
// 结束当前对象、函数或条件代码块。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->

<style scoped>
/* 开始 Vue 组件的局部样式区域。 */
.login-wrap {
/* 对选择器 .login-wrap 匹配的元素应用后续声明。 */
  height: 100vh;
  /* height=100vh：设置高度。 */
  display: flex;
  /* display=flex：决定元素如何布局或显示。 */
  align-items: center;
  /* align-items=center：控制交叉轴上的对齐方式。 */
  justify-content: center;
  /* justify-content=center：控制主轴上的分布方式。 */
  background:
  /* 设置背景：background:。 */
    radial-gradient(ellipse at top, rgba(40, 30, 70, 0.6), transparent 60%),
    /* 结束样式块或续写样式声明。 */
    var(--bg);
    /* 结束样式块或续写样式声明。 */
}
/* 结束样式块或续写样式声明。 */
.login-card {
/* 对选择器 .login-card 匹配的元素应用后续声明。 */
  width: 360px;
  /* width=360px：设置宽度。 */
  background: var(--panel);
  /* background=var(--panel)：设置背景。 */
  border: 1px solid var(--panel-border);
  /* border=1px solid var(--panel-border)：设置边框。 */
  backdrop-filter: blur(6px);
  /* backdrop-filter=blur(6px)：设置该样式属性。 */
}
/* 结束样式块或续写样式声明。 */
.title {
/* 对选择器 .title 匹配的元素应用后续声明。 */
  display: flex;
  /* display=flex：决定元素如何布局或显示。 */
  align-items: center;
  /* align-items=center：控制交叉轴上的对齐方式。 */
  gap: 10px;
  /* gap=10px：设置子元素间距。 */
  color: var(--text);
  /* color=var(--text)：设置文字颜色。 */
  font-weight: 600;
  /* font-weight=600：设置字重。 */
}
/* 结束样式块或续写样式声明。 */
.brand-dot {
/* 对选择器 .brand-dot 匹配的元素应用后续声明。 */
  width: 10px;
  /* width=10px：设置宽度。 */
  height: 10px;
  /* height=10px：设置高度。 */
  border-radius: 50%;
  /* border-radius=50%：设置圆角。 */
  background: var(--accent);
  /* background=var(--accent)：设置背景。 */
  box-shadow: 0 0 10px var(--accent-glow);
  /* box-shadow=0 0 10px var(--accent-glow)：设置阴影。 */
}
/* 结束样式块或续写样式声明。 */
.submit {
/* 对选择器 .submit 匹配的元素应用后续声明。 */
  width: 100%;
  /* width=100%：设置宽度。 */
}
/* 结束样式块或续写样式声明。 */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
