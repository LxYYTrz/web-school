<!--
  浏览器用户管理页面，提供列表刷新、创建、修改和删除交互。
  先看 refresh 取得列表，再看各表单验证与 api 调用；操作完成后重新查询列表。
  页面能进入与每项后端权限是两层；UsersService 根据操作者和目标账号分别判断。
-->
<template>
  <div class="users-page">
  <!-- 渲染容器，应用 users-page 样式类。 -->
    <el-card shadow="never">
      <template #header>
        <div class="header">
        <!-- 渲染容器，应用 header 样式类。 -->
          <span class="title">用户管理</span>
          <!-- 渲染行内文字，应用 title 样式类。 -->
          <span class="hint">仅管理员可访问 · 共 {{ rows.length }} 个账号</span>
          <!-- 渲染行内文字，应用 hint 样式类，其中显示 rows.length 的计算结果。 -->
        </div>
      </template>

      <el-button type="primary" :icon="Plus" @click="openCreate">新建用户</el-button>

      <el-table :data="rows" stripe style="margin-top: 12px" v-loading="loading">
        <el-table-column prop="username" label="用户名" width="180" />
        <el-table-column label="等级" width="120">
          <template #default="{ row }">
            <el-tag :type="levelTag(row.level)" effect="dark">{{ levelText(row.level) }}</el-tag>
            <!-- 渲染状态标签，其中显示 levelText(row.level) 的计算结果。 -->
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button size="small" @click="openReset(row)">重置密码</el-button>
            <el-button size="small" type="danger" :disabled="row.username === me?.username" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建用户 -->
    <el-dialog v-model="createOpen" title="新建用户" width="380px">
    <!-- 渲染弹窗，与状态双向同步（createOpen）。 -->
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" />
          <!-- 渲染输入框，与状态双向同步（createForm.username）。 -->
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" show-password />
          <!-- 渲染输入框，与状态双向同步（createForm.password）。 -->
        </el-form-item>
        <el-form-item label="等级" prop="level">
          <el-select v-model.number="createForm.level" style="width: 100%">
            <el-option :value="1" label="普通 (level 1)" />
            <el-option :value="2" label="二级 (level 2)" />
            <el-option :value="3" label="管理员 (level 3)" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="onCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码 -->
    <el-dialog v-model="resetOpen" :title="`重置 ${resetTarget?.username} 的密码`" width="380px">
    <!-- 渲染弹窗，与状态双向同步（resetOpen）。 -->
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules" label-width="80px">
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="resetForm.new_password" type="password" show-password />
          <!-- 渲染输入框，与状态双向同步（resetForm.new_password）。 -->
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetOpen = false">取消</el-button>
        <el-button type="primary" :loading="resetting" @click="onReset">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<!-- 这一段实现组件状态与事件处理，服务于查询、创建、重置密码及删除权限允许管理的账号。 -->
<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { apiListUsers, apiCreateUser, apiUpdateUser, apiDeleteUser, type UserRow } from '../services/auth';
import { useAuthStore, type Level } from '../stores/auth';

const auth = useAuthStore();
const me = computed(() => auth.user);

const rows = ref<UserRow[]>([]);
const loading = ref(false);

// 从用户管理接口重新查询列表并更新表格，加载结束后释放忙碌状态。
// 这里是一次 HTTP 查询刷新，与机器人持续接收实时帧的机制不同。
async function refresh() {
// 重新读取当前数据并更新界面显示。
  loading.value = true;
  try {
    const { users } = await apiListUsers();
    // 获取当前用户有权查看的账号列表。
    rows.value = users;
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}
onMounted(refresh);

function levelText(l: number): string {
  return l === 3 ? '管理员' : l === 2 ? '二级' : '普通';
}
function levelTag(l: number): 'danger' | 'warning' | 'info' {
// 定义 levelTag，用于把用户操作级别转换为标签展示类型。
  return l === 3 ? 'danger' : l === 2 ? 'warning' : 'info';
}

// 新建
const createOpen = ref(false);
const creating = ref(false);
const createFormRef = ref<FormInstance | null>(null);
const createForm = reactive({ username: '', password: '', level: 1 as Level });
const createRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  level: [{ required: true, message: '请选择等级', trigger: 'change' }],
};
function openCreate() {
  createForm.username = '';
  createForm.password = '';
  createForm.level = 1;
  createOpen.value = true;
}

// 创建表单通过后调用后端接口，成功关闭弹窗并重新读取列表。
// 界面校验不能替代后端管理员权限和用户名重复检查；错误显示与 finally 的提交状态恢复分别处理。
async function onCreate() {
// 提交新增账号并刷新用户列表。
  if (!createFormRef.value) return;
  const valid = await createFormRef.value.validate().catch(() => false);
  if (!valid) return;
  creating.value = true;
  try {

    // 创建表单校验通过后，把用户名、密码和 level 提交到用户管理接口，等待后端检查并保存。
    // 成功时显示提示、关闭弹窗，再 refresh() 重新查询列表；失败时显示接口错误，并在 finally 清理提交中状态。
    // 用户列表通过 HTTP 请求刷新，和机器人持续接收 robot_state 的更新方式不同。

    await apiCreateUser(createForm.username, createForm.password, createForm.level);
    // 向后端提交新账号信息。
    ElMessage.success('创建成功');
    // 显示操作成功提示。
    createOpen.value = false;
    refresh();
    // 重新读取当前数据并更新界面显示。
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    creating.value = false;
  }
}

// 重置密码
const resetOpen = ref(false);
const resetting = ref(false);
const resetFormRef = ref<FormInstance | null>(null);
const resetTarget = ref<UserRow | null>(null);
const resetForm = reactive({ new_password: '' });
const resetRules: FormRules = {
  new_password: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
};
function openReset(row: UserRow) {
  resetTarget.value = row;
  resetForm.new_password = '';
  resetOpen.value = true;
}

// 将所选用户的新密码或新级别交给更新接口，再根据结果刷新界面。
// 当前操作者与目标用户分别传递，是否允许修改由后端 UsersService 判断。
async function onReset() {
// 提交目标账号的新密码并刷新界面。
  if (!resetFormRef.value || !resetTarget.value) return;
  const valid = await resetFormRef.value.validate().catch(() => false);
  if (!valid) return;
  resetting.value = true;
  try {
    await apiUpdateUser(resetTarget.value.username, { new_password: resetForm.new_password });
    // 向后端提交账号级别或密码变更。
    ElMessage.success('密码已重置');
    // 显示操作成功提示。
    resetOpen.value = false;
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    resetting.value = false;
  }
}

// 确认删除目标账号后调用后端删除接口，成功时刷新列表。
// 后端还会检查管理员以及不能删除自己的规则，不直接相信按钮是否显示。
async function onDelete(row: UserRow) {
// 经用户确认后删除目标账号并刷新用户列表。
  try {
    await ElMessageBox.confirm(`确认删除用户 ${row.username}?`, '危险操作', { type: 'warning' });
    // 弹出确认对话框，取得用户对当前操作的选择。
  } catch { return; }
  try {
    await apiDeleteUser(row.username);
    // 向后端提交账号删除请求。
    ElMessage.success('已删除');
    // 显示操作成功提示。
    refresh();
    // 重新读取当前数据并更新界面显示。
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
</script>

<!-- 这一段实现当前页面或组件的外观样式，服务于查询、创建、重置密码及删除权限允许管理的账号。 -->
<style scoped>
.users-page { padding: 16px; }
.header { display: flex; align-items: baseline; gap: 12px; }
.title { font-weight: 600; }
.hint { color: var(--text-dim); font-size: 13px; }
</style>
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
