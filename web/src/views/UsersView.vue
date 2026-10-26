<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
  <div class="users-page">
  <!-- 渲染容器，应用 users-page 样式类。 -->
    <el-card shadow="never">
    <!-- 渲染卡片。 -->
      <template #header>
      <!-- 渲染template 元素或组件。 关键字：#＝命名插槽的简写。 -->
        <div class="header">
        <!-- 渲染容器，应用 header 样式类。 -->
          <span class="title">用户管理</span>
          <!-- 渲染行内文字，应用 title 样式类。 -->
          <span class="hint">仅管理员可访问 · 共 {{ rows.length }} 个账号</span>
          <!-- 渲染行内文字，应用 hint 样式类，其中显示 rows.length 的计算结果。 关键字：{{＝插入表达式计算后的文本。 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
      </template>
      <!-- 结束当前模板或插槽内容。 -->

      <el-button type="primary" :icon="Plus" @click="openCreate">新建用户</el-button>
      <!-- 渲染操作按钮。 关键字：:＝属性动态绑定的简写；@＝事件监听的简写。 -->

      <el-table :data="rows" stripe style="margin-top: 12px" v-loading="loading">
      <!-- 渲染表格。 关键字：:＝属性动态绑定的简写。 -->
        <el-table-column prop="username" label="用户名" width="180" />
        <!-- 渲染表格列。 -->
        <el-table-column label="等级" width="120">
        <!-- 渲染表格列。 -->
          <template #default="{ row }">
          <!-- 渲染template 元素或组件。 关键字：#＝命名插槽的简写。 -->
            <el-tag :type="levelTag(row.level)" effect="dark">{{ levelText(row.level) }}</el-tag>
            <!-- 渲染状态标签，其中显示 levelText(row.level) 的计算结果。 关键字：{{＝插入表达式计算后的文本；:＝属性动态绑定的简写。 -->
          </template>
          <!-- 结束当前模板或插槽内容。 -->
        </el-table-column>
        <!-- 结束 el-table-column 元素及其中的内容。 -->
        <el-table-column prop="created_at" label="创建时间" />
        <!-- 渲染表格列。 -->
        <el-table-column label="操作" width="240">
        <!-- 渲染表格列。 -->
          <template #default="{ row }">
          <!-- 渲染template 元素或组件。 关键字：#＝命名插槽的简写。 -->
            <el-button size="small" @click="openReset(row)">重置密码</el-button>
            <!-- 渲染操作按钮。 关键字：@＝事件监听的简写。 -->
            <el-button size="small" type="danger" :disabled="row.username === me?.username" @click="onDelete(row)">删除</el-button>
            <!-- 渲染操作按钮。 关键字：:＝属性动态绑定的简写；@＝事件监听的简写。 -->
          </template>
          <!-- 结束当前模板或插槽内容。 -->
        </el-table-column>
        <!-- 结束 el-table-column 元素及其中的内容。 -->
      </el-table>
      <!-- 结束 el-table 元素及其中的内容。 -->
    </el-card>
    <!-- 结束 el-card 元素及其中的内容。 -->

    <!-- 新建用户 -->
    <el-dialog v-model="createOpen" title="新建用户" width="380px">
    <!-- 渲染弹窗，与状态双向同步（createOpen）。 关键字：v-model＝让输入值和状态双向同步。 -->
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
      <!-- 渲染表单。 关键字：:＝属性动态绑定的简写。 -->
        <el-form-item label="用户名" prop="username">
        <!-- 渲染表单字段。 -->
          <el-input v-model="createForm.username" />
          <!-- 渲染输入框，与状态双向同步（createForm.username）。 关键字：v-model＝让输入值和状态双向同步。 -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
        <el-form-item label="密码" prop="password">
        <!-- 渲染表单字段。 -->
          <el-input v-model="createForm.password" type="password" show-password />
          <!-- 渲染输入框，与状态双向同步（createForm.password）。 关键字：v-model＝让输入值和状态双向同步。 -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
        <el-form-item label="等级" prop="level">
        <!-- 渲染表单字段。 -->
          <el-select v-model.number="createForm.level" style="width: 100%">
          <!-- 渲染选择框。 关键字：v-model＝让输入值和状态双向同步。 -->
            <el-option :value="1" label="普通 (level 1)" />
            <!-- 渲染选择项。 关键字：:＝属性动态绑定的简写。 -->
            <el-option :value="2" label="二级 (level 2)" />
            <!-- 渲染选择项。 关键字：:＝属性动态绑定的简写。 -->
            <el-option :value="3" label="管理员 (level 3)" />
            <!-- 渲染选择项。 关键字：:＝属性动态绑定的简写。 -->
          </el-select>
          <!-- 结束 el-select 元素及其中的内容。 -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
      </el-form>
      <!-- 结束 el-form 元素及其中的内容。 -->
      <template #footer>
      <!-- 渲染template 元素或组件。 关键字：#＝命名插槽的简写。 -->
        <el-button @click="createOpen = false">取消</el-button>
        <!-- 渲染操作按钮。 关键字：@＝事件监听的简写。 -->
        <el-button type="primary" :loading="creating" @click="onCreate">创建</el-button>
        <!-- 渲染操作按钮。 关键字：:＝属性动态绑定的简写；@＝事件监听的简写。 -->
      </template>
      <!-- 结束当前模板或插槽内容。 -->
    </el-dialog>
    <!-- 结束 el-dialog 元素及其中的内容。 -->

    <!-- 重置密码 -->
    <el-dialog v-model="resetOpen" :title="`重置 ${resetTarget?.username} 的密码`" width="380px">
    <!-- 渲染弹窗，与状态双向同步（resetOpen）。 关键字：v-model＝让输入值和状态双向同步；:＝属性动态绑定的简写。 -->
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules" label-width="80px">
      <!-- 渲染表单。 关键字：:＝属性动态绑定的简写。 -->
        <el-form-item label="新密码" prop="new_password">
        <!-- 渲染表单字段。 -->
          <el-input v-model="resetForm.new_password" type="password" show-password />
          <!-- 渲染输入框，与状态双向同步（resetForm.new_password）。 关键字：v-model＝让输入值和状态双向同步。 -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
      </el-form>
      <!-- 结束 el-form 元素及其中的内容。 -->
      <template #footer>
      <!-- 渲染template 元素或组件。 关键字：#＝命名插槽的简写。 -->
        <el-button @click="resetOpen = false">取消</el-button>
        <!-- 渲染操作按钮。 关键字：@＝事件监听的简写。 -->
        <el-button type="primary" :loading="resetting" @click="onReset">确认</el-button>
        <!-- 渲染操作按钮。 关键字：:＝属性动态绑定的简写；@＝事件监听的简写。 -->
      </template>
      <!-- 结束当前模板或插槽内容。 -->
    </el-dialog>
    <!-- 结束 el-dialog 元素及其中的内容。 -->
  </div>
  <!-- 结束 div 元素及其中的内容。 -->
</template>
<!-- 结束当前模板或插槽内容。 -->

<script setup lang="ts">
// 开始 Vue 组件的 TypeScript 逻辑区域。
import { ref, reactive, onMounted, computed } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { ElMessage, ElMessageBox } from 'element-plus';
// 从 element-plus 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { Plus } from '@element-plus/icons-vue';
// 从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import type { FormInstance, FormRules } from 'element-plus';
// 从 element-plus 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { apiListUsers, apiCreateUser, apiUpdateUser, apiDeleteUser, type UserRow } from '../services/auth';
// 从 ../services/auth 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。
import { useAuthStore, type Level } from '../stores/auth';
// 从 ../stores/auth 导入这一行列出的符号，供本文件调用。 关键字：import＝导入模块或符号；from＝指定导入来源。

const auth = useAuthStore();
// 声明 auth，初始值由 useAuthStore() 计算得到。 关键字：const＝声明不可重新绑定的变量。
const me = computed(() => auth.user);
// 声明 me，初始值由 computed(() => auth.user) 计算得到。 关键字：const＝声明不可重新绑定的变量。

const rows = ref<UserRow[]>([]);
// 声明 rows，初始值由 ref<UserRow[]>([]) 计算得到。 关键字：const＝声明不可重新绑定的变量。
const loading = ref(false);
// 声明 loading，初始值由 ref(false) 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。

async function refresh() {
// 定义函数 refresh。 关键字：async＝声明异步函数；function＝定义函数。
  loading.value = true;
  // 把右侧表达式的结果写入 loading.value。 关键字：true＝布尔真值。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    const { users } = await apiListUsers();
    // 从右侧结果中取出 users，分别赋给同名变量。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成。
    rows.value = users;
    // 把右侧表达式的结果写入 rows.value。
  } catch (e) {
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    ElMessage.error((e as Error).message);
    // 调用 ElMessage.error，把括号中的值作为参数传入。
  } finally {
  // 开始收尾分支，无论前面的操作成功或失败都执行。 关键字：finally＝执行收尾逻辑。
    loading.value = false;
    // 把右侧表达式的结果写入 loading.value。 关键字：false＝布尔假值。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
onMounted(refresh);
// 调用 onMounted；括号中的表达式是传入的参数。

function levelText(l: number): string {
// 定义函数 levelText。 关键字：function＝定义函数。
  return l === 3 ? '管理员' : l === 2 ? '二级' : '普通';
  // 返回 l === 3 ? '管理员' : l === 2 ? '二级' : '普通' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。
function levelTag(l: number): 'danger' | 'warning' | 'info' {
// 定义函数 levelTag。 关键字：function＝定义函数。
  return l === 3 ? 'danger' : l === 2 ? 'warning' : 'info';
  // 返回 l === 3 ? 'danger' : l === 2 ? 'warning' : 'info' 的值，结束当前函数。 关键字：return＝返回结果并结束当前函数。
}
// 结束当前对象、函数或条件代码块。

// 新建
const createOpen = ref(false);
// 声明 createOpen，初始值由 ref(false) 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。
const creating = ref(false);
// 声明 creating，初始值由 ref(false) 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。
const createFormRef = ref<FormInstance | null>(null);
// 声明 createFormRef，初始值由 ref<FormInstance | null>(null) 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
const createForm = reactive({ username: '', password: '', level: 1 as Level });
// 声明 createForm，初始值由 reactive({ username: '', password: '', level: 1 as Level }) 计算得到。 关键字：const＝声明不可重新绑定的变量。
const createRules: FormRules = {
// 声明 createRules，初始值由 { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  // 设置字段 username。 关键字：true＝布尔真值。
  password: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  // 设置字段 password。 关键字：true＝布尔真值。
  level: [{ required: true, message: '请选择等级', trigger: 'change' }],
  // 设置字段 level。 关键字：true＝布尔真值。
};
// 结束当前对象或代码块，并完成这条语句。
function openCreate() {
// 定义函数 openCreate。 关键字：function＝定义函数。
  createForm.username = '';
  // 把右侧表达式的结果写入 createForm.username。
  createForm.password = '';
  // 把右侧表达式的结果写入 createForm.password。
  createForm.level = 1;
  // 把右侧表达式的结果写入 createForm.level。
  createOpen.value = true;
  // 把右侧表达式的结果写入 createOpen.value。 关键字：true＝布尔真值。
}
// 结束当前对象、函数或条件代码块。
async function onCreate() {
// 定义函数 onCreate。 关键字：async＝声明异步函数；function＝定义函数。
  if (!createFormRef.value) return;
  // 判断 if (!createFormRef.value) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  const valid = await createFormRef.value.validate().catch(() => false);
  // 声明 valid，初始值由 await createFormRef.value.validate().catch(() => false) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；catch＝捕获异常；false＝布尔假值。
  if (!valid) return;
  // 判断 if (!valid) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  creating.value = true;
  // 把右侧表达式的结果写入 creating.value。 关键字：true＝布尔真值。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    await apiCreateUser(createForm.username, createForm.password, createForm.level);
    // 调用 apiCreateUser，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
    ElMessage.success('创建成功');
    // 调用 ElMessage.success，把括号中的值作为参数传入。
    createOpen.value = false;
    // 把右侧表达式的结果写入 createOpen.value。 关键字：false＝布尔假值。
    refresh();
    // 调用 refresh；括号中的表达式是传入的参数。
  } catch (e) {
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    ElMessage.error((e as Error).message);
    // 调用 ElMessage.error，把括号中的值作为参数传入。
  } finally {
  // 开始收尾分支，无论前面的操作成功或失败都执行。 关键字：finally＝执行收尾逻辑。
    creating.value = false;
    // 把右侧表达式的结果写入 creating.value。 关键字：false＝布尔假值。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。

// 重置密码
const resetOpen = ref(false);
// 声明 resetOpen，初始值由 ref(false) 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。
const resetting = ref(false);
// 声明 resetting，初始值由 ref(false) 计算得到。 关键字：const＝声明不可重新绑定的变量；false＝布尔假值。
const resetFormRef = ref<FormInstance | null>(null);
// 声明 resetFormRef，初始值由 ref<FormInstance | null>(null) 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
const resetTarget = ref<UserRow | null>(null);
// 声明 resetTarget，初始值由 ref<UserRow | null>(null) 计算得到。 关键字：const＝声明不可重新绑定的变量；null＝空值。
const resetForm = reactive({ new_password: '' });
// 声明 resetForm，初始值由 reactive({ new_password: '' }) 计算得到。 关键字：const＝声明不可重新绑定的变量。
const resetRules: FormRules = {
// 声明 resetRules，初始值由 { 计算得到。 关键字：const＝声明不可重新绑定的变量。
  new_password: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  // 设置字段 new_password。 关键字：true＝布尔真值。
};
// 结束当前对象或代码块，并完成这条语句。
function openReset(row: UserRow) {
// 定义函数 openReset。 关键字：function＝定义函数。
  resetTarget.value = row;
  // 把右侧表达式的结果写入 resetTarget.value。
  resetForm.new_password = '';
  // 把右侧表达式的结果写入 resetForm.new_password。
  resetOpen.value = true;
  // 把右侧表达式的结果写入 resetOpen.value。 关键字：true＝布尔真值。
}
// 结束当前对象、函数或条件代码块。
async function onReset() {
// 定义函数 onReset。 关键字：async＝声明异步函数；function＝定义函数。
  if (!resetFormRef.value || !resetTarget.value) return;
  // 判断 if (!resetFormRef.value || !resetTarget.value) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  const valid = await resetFormRef.value.validate().catch(() => false);
  // 声明 valid，初始值由 await resetFormRef.value.validate().catch(() => false) 计算得到。 关键字：const＝声明不可重新绑定的变量；await＝等待异步操作完成；catch＝捕获异常；false＝布尔假值。
  if (!valid) return;
  // 判断 if (!valid) return; 中的条件，成立时执行对应分支。 关键字：if＝按条件分支；return＝返回结果并结束当前函数。
  resetting.value = true;
  // 把右侧表达式的结果写入 resetting.value。 关键字：true＝布尔真值。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    await apiUpdateUser(resetTarget.value.username, { new_password: resetForm.new_password });
    // 调用 apiUpdateUser，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
    ElMessage.success('密码已重置');
    // 调用 ElMessage.success，把括号中的值作为参数传入。
    resetOpen.value = false;
    // 把右侧表达式的结果写入 resetOpen.value。 关键字：false＝布尔假值。
  } catch (e) {
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    ElMessage.error((e as Error).message);
    // 调用 ElMessage.error，把括号中的值作为参数传入。
  } finally {
  // 开始收尾分支，无论前面的操作成功或失败都执行。 关键字：finally＝执行收尾逻辑。
    resetting.value = false;
    // 把右侧表达式的结果写入 resetting.value。 关键字：false＝布尔假值。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。

// 删除
async function onDelete(row: UserRow) {
// 定义函数 onDelete。 关键字：async＝声明异步函数；function＝定义函数。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    await ElMessageBox.confirm(`确认删除用户 ${row.username}?`, '危险操作', { type: 'warning' });
    // 调用 ElMessageBox.confirm，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
  } catch { return; }
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常；return＝返回结果并结束当前函数。
  try {
  // 开始可能抛出异常的操作区域。 关键字：try＝进入异常处理块。
    await apiDeleteUser(row.username);
    // 调用 apiDeleteUser，把括号中的值作为参数传入。 关键字：await＝等待异步操作完成。
    ElMessage.success('已删除');
    // 调用 ElMessage.success，把括号中的值作为参数传入。
    refresh();
    // 调用 refresh；括号中的表达式是传入的参数。
  } catch (e) {
  // 开始异常处理分支，接收前面代码抛出的错误。 关键字：catch＝捕获异常。
    ElMessage.error((e as Error).message);
    // 调用 ElMessage.error，把括号中的值作为参数传入。
  }
  // 结束当前对象、函数或条件代码块。
}
// 结束当前对象、函数或条件代码块。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->

<style scoped>
/* 开始 Vue 组件的局部样式区域。 */
.users-page { padding: 16px; }
/* padding=16px：设置内边距。 */
.header { display: flex; align-items: baseline; gap: 12px; }
/* display=flex：决定元素如何布局或显示；align-items=baseline：控制交叉轴上的对齐方式；gap=12px：设置子元素间距。 */
.title { font-weight: 600; }
/* font-weight=600：设置字重。 */
.hint { color: var(--text-dim); font-size: 13px; }
/* color=var(--text-dim)：设置文字颜色；font-size=13px：设置字号。 */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
