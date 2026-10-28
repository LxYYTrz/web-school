<!--
  浏览器登录页面，收集输入并调用 Pinia auth store。
  提交后由后端核对账号；成功时按页面路由继续，失败显示错误并清理提交中状态。
  表单中的用户名、密码属于本次输入，登录级别以后端返回的用户为准。
-->
<template>
  <div class="login-wrap">
  <!-- 渲染容器，应用 login-wrap 样式类。 -->
    <el-card class="login-card" shadow="always">
    <!-- 渲染卡片，应用 login-card 样式类。 -->
      <template #header>
        <div class="title">
        <!-- 渲染容器，应用 title 样式类。 -->
          <span class="brand-dot" />
          <!-- 渲染行内文字，应用 brand-dot 样式类。 -->
          <span>产线数字孪生监控平台</span>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" size="large" @keyup.enter="onSubmit" >
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" autofocus :prefix-icon="User" />
          <!-- 渲染输入框，与状态双向同步（form.username）。 -->
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" show-password :prefix-icon="Lock" />
        </el-form-item>
        <el-form-item v-if="errMsg">
        <!-- 渲染表单字段，条件成立时显示（errMsg）。 -->
          <el-alert :title="errMsg" type="error" :closable="false" show-icon />
          <!-- 渲染el-alert 元素或组件。 -->
        </el-form-item>
        <el-button type="primary" size="large" class="submit" :loading="loading" @click="onSubmit" >
          登录
          <!-- 在当前页面元素中直接显示文字「登录」。 -->
          <!-- 登录 是直接显示在当前界面元素中的文字内容 -->
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<!-- 这一段实现组件状态与事件处理，服务于收集账号口令并建立用户登录会话。 -->
<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const formRef = ref<FormInstance | null>(null);
const form = reactive({ username: '', password: '' });
const loading = ref(false);
const errMsg = ref('');

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

// 提交表单后调用 auth store 登录，成功才继续页面跳转，失败显示请求错误。
// 这里只收集用户输入；后端校验得到的级别才是后续界面权限依据。
async function onSubmit() {
// 校验登录表单并提交登录请求。
  errMsg.value = '';
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    await auth.login(form.username, form.password);
    // 提交账号口令并建立登录会话。
  } catch (e) {
    // dev/demo fallback:无后端时本地登录,纯看页面用
    if (import.meta.env.VITE_MOCK_ONLY === 'true') {
      await auth.demoLogin(form.username || 'demo');
    } else {
      errMsg.value = (e as Error).message || '登录失败';
      loading.value = false;
      return;
    }
  }
  // 登录成功后跳转到原本想去的页,或默认 /twin
  const redirect = (route.query.redirect as string) || '/twin';
  router.push(redirect);
  loading.value = false;
}
</script>

<!-- 这一段实现当前页面或组件的外观样式，服务于收集账号口令并建立用户登录会话。 -->
<style scoped>
/* 这一段为 .login-wrap 对应的界面元素定义尺寸、布局或视觉样式。 */
.login-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
  /* 设置背景：background:。 */
    radial-gradient(ellipse at top, rgba(40, 30, 70, 0.6), transparent 60%),
    /* 创建界面或材质所用的渐变颜色。 */
    var(--bg);
}
/* 这一段为 .login-card 对应的界面元素定义尺寸、布局或视觉样式。 */
.login-card {
  width: 360px;
  background: var(--panel);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(6px);
}
/* 这一段为 .title 对应的界面元素定义尺寸、布局或视觉样式。 */
.title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-weight: 600;
}
/* 这一段为 .brand-dot 对应的界面元素定义尺寸、布局或视觉样式。 */
.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent-glow);
}
.submit {
  width: 100%;
}
</style>
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
