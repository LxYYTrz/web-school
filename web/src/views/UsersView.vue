<template>
  <div class="users-page">
    <el-card shadow="never">
      <template #header>
        <div class="header">
          <span class="title">用户管理</span>
          <span class="hint">仅管理员可访问 · 共 {{ rows.length }} 个账号</span>
        </div>
      </template>

      <el-button type="primary" :icon="Plus" @click="openCreate">新建用户</el-button>

      <el-table :data="rows" stripe style="margin-top: 12px" v-loading="loading">
        <el-table-column prop="username" label="用户名" width="180" />
        <el-table-column label="等级" width="120">
          <template #default="{ row }">
            <el-tag :type="levelTag(row.level)" effect="dark">{{ levelText(row.level) }}</el-tag>
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
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" show-password />
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
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules" label-width="80px">
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="resetForm.new_password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetOpen = false">取消</el-button>
        <el-button type="primary" :loading="resetting" @click="onReset">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

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

async function refresh() {
  loading.value = true;
  try {
    const { users } = await apiListUsers();
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
async function onCreate() {
  if (!createFormRef.value) return;
  const valid = await createFormRef.value.validate().catch(() => false);
  if (!valid) return;
  creating.value = true;
  try {
    await apiCreateUser(createForm.username, createForm.password, createForm.level);
    ElMessage.success('创建成功');
    createOpen.value = false;
    refresh();
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
async function onReset() {
  if (!resetFormRef.value || !resetTarget.value) return;
  const valid = await resetFormRef.value.validate().catch(() => false);
  if (!valid) return;
  resetting.value = true;
  try {
    await apiUpdateUser(resetTarget.value.username, { new_password: resetForm.new_password });
    ElMessage.success('密码已重置');
    resetOpen.value = false;
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    resetting.value = false;
  }
}

// 删除
async function onDelete(row: UserRow) {
  try {
    await ElMessageBox.confirm(`确认删除用户 ${row.username}?`, '危险操作', { type: 'warning' });
  } catch { return; }
  try {
    await apiDeleteUser(row.username);
    ElMessage.success('已删除');
    refresh();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
</script>

<style scoped>
.users-page { padding: 16px; }
.header { display: flex; align-items: baseline; gap: 12px; }
.title { font-weight: 600; }
.hint { color: var(--text-dim); font-size: 13px; }
</style>
