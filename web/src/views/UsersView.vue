<!-- 这一段负责查询、创建、重置密码及删除权限允许管理的账号，为后续代码提供当前文件的处理入口。 -->
<!-- 这一段实现界面模板，服务于查询、创建、重置密码及删除权限允许管理的账号。 -->
<template>
<!-- 开始 Vue 模板，定义组件渲染的内容。 -->
<!-- template 是当前使用的界面元素或组件 -->
  <div class="users-page">
  <!-- 渲染容器，应用 users-page 样式类。 -->
  <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 users-page -->
    <el-card shadow="never">
    <!-- 在界面中配置 el-card 元素及其内容或事件绑定。 -->
    <!-- el-card 是当前使用的界面元素或组件 -->
      <template #header>
      <!-- 渲染template 元素或组件。 -->
      <!-- template 是当前使用的界面元素或组件；#header 表示将此区域放入组件指定名称的插槽 -->
        <div class="header">
        <!-- 渲染容器，应用 header 样式类。 -->
        <!-- div 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 header -->
          <span class="title">用户管理</span>
          <!-- 渲染行内文字，应用 title 样式类。 -->
          <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 title -->
          <span class="hint">仅管理员可访问 · 共 {{ rows.length }} 个账号</span>
          <!-- 渲染行内文字，应用 hint 样式类，其中显示 rows.length 的计算结果。 -->
          <!-- span 是当前使用的界面元素或组件；class 表示应用的样式类，当前值为 hint；双花括号把其中表达式的计算结果插入界面文字 -->
        </div>
        <!-- 结束 div 元素及其中的内容。 -->
        <!-- div 是当前使用的界面元素或组件 -->
      </template>
      <!-- 结束 template 组件或元素对应的界面区域。 -->
      <!-- template 是当前使用的界面元素或组件 -->

      <el-button type="primary" :icon="Plus" @click="openCreate">新建用户</el-button>
      <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
      <!-- el-button 是当前使用的界面元素或组件；type 表示组件外观类型或输入控件类型，当前值为 primary；:icon 表示把表达式结果动态绑定到组件属性，当前值为 Plus；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 openCreate -->

      <el-table :data="rows" stripe style="margin-top: 12px" v-loading="loading">
      <!-- 在界面中配置 el-table 元素及其内容或事件绑定。 -->
      <!-- el-table 是当前使用的界面元素或组件；:data 表示把表达式结果动态绑定到组件属性，当前值为 rows -->
        <el-table-column prop="username" label="用户名" width="180" />
        <!-- 在界面中配置 el-table-column 元素及其内容或事件绑定。 -->
        <!-- el-table-column 是当前使用的界面元素或组件 -->
        <el-table-column label="等级" width="120">
        <!-- 在界面中配置 el-table-column 元素及其内容或事件绑定。 -->
        <!-- el-table-column 是当前使用的界面元素或组件 -->
          <template #default="{ row }">
          <!-- 渲染template 元素或组件。 -->
          <!-- template 是当前使用的界面元素或组件；#default 表示将此区域放入组件指定名称的插槽，当前值为 { row } -->
            <el-tag :type="levelTag(row.level)" effect="dark">{{ levelText(row.level) }}</el-tag>
            <!-- 渲染状态标签，其中显示 levelText(row.level) 的计算结果。 -->
            <!-- el-tag 是当前使用的界面元素或组件；:type 表示把表达式结果动态绑定到组件属性，当前值为 levelTag(row.level)；effect 表示组件视觉风格，当前值为 dark；双花括号把其中表达式的计算结果插入界面文字 -->
          </template>
          <!-- 结束 template 组件或元素对应的界面区域。 -->
          <!-- template 是当前使用的界面元素或组件 -->
        </el-table-column>
        <!-- 结束 el-table-column 元素及其中的内容。 -->
        <!-- el-table-column 是当前使用的界面元素或组件 -->
        <el-table-column prop="created_at" label="创建时间" />
        <!-- 在界面中配置 el-table-column 元素及其内容或事件绑定。 -->
        <!-- el-table-column 是当前使用的界面元素或组件 -->
        <el-table-column label="操作" width="240">
        <!-- 在界面中配置 el-table-column 元素及其内容或事件绑定。 -->
        <!-- el-table-column 是当前使用的界面元素或组件 -->
          <template #default="{ row }">
          <!-- 渲染template 元素或组件。 -->
          <!-- template 是当前使用的界面元素或组件；#default 表示将此区域放入组件指定名称的插槽，当前值为 { row } -->
            <el-button size="small" @click="openReset(row)">重置密码</el-button>
            <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
            <!-- el-button 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 openReset(row) -->
            <el-button size="small" type="danger" :disabled="row.username === me?.username" @click="onDelete(row)">删除</el-button>
            <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
            <!-- el-button 是当前使用的界面元素或组件；size 表示组件尺寸，当前值为 small；type 表示组件外观类型或输入控件类型，当前值为 danger；:disabled 表示把表达式结果动态绑定到组件属性，当前值为 row.username === me?.username；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 onDelete(row) -->
          </template>
          <!-- 结束 template 组件或元素对应的界面区域。 -->
          <!-- template 是当前使用的界面元素或组件 -->
        </el-table-column>
        <!-- 结束 el-table-column 元素及其中的内容。 -->
        <!-- el-table-column 是当前使用的界面元素或组件 -->
      </el-table>
      <!-- 结束 el-table 元素及其中的内容。 -->
      <!-- el-table 是当前使用的界面元素或组件 -->
    </el-card>
    <!-- 结束 el-card 元素及其中的内容。 -->
    <!-- el-card 是当前使用的界面元素或组件 -->

    <!-- 新建用户 -->
    <el-dialog v-model="createOpen" title="新建用户" width="380px">
    <!-- 渲染弹窗，与状态双向同步（createOpen）。 -->
    <!-- el-dialog 是当前使用的界面元素或组件；v-model 表示把输入内容与响应式变量双向同步，当前值为 createOpen -->
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
      <!-- 在界面中配置 el-form 元素及其内容或事件绑定。 -->
      <!-- el-form 是当前使用的界面元素或组件；ref 表示保存 DOM 节点或组件实例引用，当前值为 createFormRef；:model 表示把表达式结果动态绑定到组件属性，当前值为 createForm；:rules 表示把表达式结果动态绑定到组件属性，当前值为 createRules -->
        <el-form-item label="用户名" prop="username">
        <!-- 在界面中配置 el-form-item 元素及其内容或事件绑定。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
          <el-input v-model="createForm.username" />
          <!-- 渲染输入框，与状态双向同步（createForm.username）。 -->
          <!-- el-input 是当前使用的界面元素或组件；v-model 表示把输入内容与响应式变量双向同步，当前值为 createForm.username -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
        <el-form-item label="密码" prop="password">
        <!-- 在界面中配置 el-form-item 元素及其内容或事件绑定。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
          <el-input v-model="createForm.password" type="password" show-password />
          <!-- 渲染输入框，与状态双向同步（createForm.password）。 -->
          <!-- el-input 是当前使用的界面元素或组件；v-model 表示把输入内容与响应式变量双向同步，当前值为 createForm.password；type 表示组件外观类型或输入控件类型，当前值为 password -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
        <el-form-item label="等级" prop="level">
        <!-- 在界面中配置 el-form-item 元素及其内容或事件绑定。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
          <el-select v-model.number="createForm.level" style="width: 100%">
          <!-- 在界面中配置 el-select 元素及其内容或事件绑定。 -->
          <!-- el-select 是当前使用的界面元素或组件 -->
            <el-option :value="1" label="普通 (level 1)" />
            <!-- 在界面中配置 el-option 元素及其内容或事件绑定。 -->
            <!-- el-option 是当前使用的界面元素或组件；:value 表示把表达式结果动态绑定到组件属性，当前值为 1 -->
            <el-option :value="2" label="二级 (level 2)" />
            <!-- 在界面中配置 el-option 元素及其内容或事件绑定。 -->
            <!-- el-option 是当前使用的界面元素或组件；:value 表示把表达式结果动态绑定到组件属性，当前值为 2 -->
            <el-option :value="3" label="管理员 (level 3)" />
            <!-- 在界面中配置 el-option 元素及其内容或事件绑定。 -->
            <!-- el-option 是当前使用的界面元素或组件；:value 表示把表达式结果动态绑定到组件属性，当前值为 3 -->
          </el-select>
          <!-- 结束 el-select 元素及其中的内容。 -->
          <!-- el-select 是当前使用的界面元素或组件 -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
      </el-form>
      <!-- 结束 el-form 元素及其中的内容。 -->
      <!-- el-form 是当前使用的界面元素或组件 -->
      <template #footer>
      <!-- 渲染template 元素或组件。 -->
      <!-- template 是当前使用的界面元素或组件；#footer 表示将此区域放入组件指定名称的插槽 -->
        <el-button @click="createOpen = false">取消</el-button>
        <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
        <!-- el-button 是当前使用的界面元素或组件；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 createOpen = false -->
        <el-button type="primary" :loading="creating" @click="onCreate">创建</el-button>
        <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
        <!-- el-button 是当前使用的界面元素或组件；type 表示组件外观类型或输入控件类型，当前值为 primary；:loading 表示把表达式结果动态绑定到组件属性，当前值为 creating；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 onCreate -->
      </template>
      <!-- 结束 template 组件或元素对应的界面区域。 -->
      <!-- template 是当前使用的界面元素或组件 -->
    </el-dialog>
    <!-- 结束 el-dialog 元素及其中的内容。 -->
    <!-- el-dialog 是当前使用的界面元素或组件 -->

    <!-- 重置密码 -->
    <el-dialog v-model="resetOpen" :title="`重置 ${resetTarget?.username} 的密码`" width="380px">
    <!-- 渲染弹窗，与状态双向同步（resetOpen）。 -->
    <!-- el-dialog 是当前使用的界面元素或组件；v-model 表示把输入内容与响应式变量双向同步，当前值为 resetOpen；:title 表示把表达式结果动态绑定到组件属性，当前值为 `重置 ${resetTarget?.username} 的密码` -->
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules" label-width="80px">
      <!-- 在界面中配置 el-form 元素及其内容或事件绑定。 -->
      <!-- el-form 是当前使用的界面元素或组件；ref 表示保存 DOM 节点或组件实例引用，当前值为 resetFormRef；:model 表示把表达式结果动态绑定到组件属性，当前值为 resetForm；:rules 表示把表达式结果动态绑定到组件属性，当前值为 resetRules -->
        <el-form-item label="新密码" prop="new_password">
        <!-- 在界面中配置 el-form-item 元素及其内容或事件绑定。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
          <el-input v-model="resetForm.new_password" type="password" show-password />
          <!-- 渲染输入框，与状态双向同步（resetForm.new_password）。 -->
          <!-- el-input 是当前使用的界面元素或组件；v-model 表示把输入内容与响应式变量双向同步，当前值为 resetForm.new_password；type 表示组件外观类型或输入控件类型，当前值为 password -->
        </el-form-item>
        <!-- 结束 el-form-item 元素及其中的内容。 -->
        <!-- el-form-item 是当前使用的界面元素或组件 -->
      </el-form>
      <!-- 结束 el-form 元素及其中的内容。 -->
      <!-- el-form 是当前使用的界面元素或组件 -->
      <template #footer>
      <!-- 渲染template 元素或组件。 -->
      <!-- template 是当前使用的界面元素或组件；#footer 表示将此区域放入组件指定名称的插槽 -->
        <el-button @click="resetOpen = false">取消</el-button>
        <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
        <!-- el-button 是当前使用的界面元素或组件；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 resetOpen = false -->
        <el-button type="primary" :loading="resetting" @click="onReset">确认</el-button>
        <!-- 在界面中配置 el-button 元素及其内容或事件绑定。 -->
        <!-- el-button 是当前使用的界面元素或组件；type 表示组件外观类型或输入控件类型，当前值为 primary；:loading 表示把表达式结果动态绑定到组件属性，当前值为 resetting；@click 表示当前组件或 DOM 事件的处理函数绑定，当前值为 onReset -->
      </template>
      <!-- 结束 template 组件或元素对应的界面区域。 -->
      <!-- template 是当前使用的界面元素或组件 -->
    </el-dialog>
    <!-- 结束 el-dialog 元素及其中的内容。 -->
    <!-- el-dialog 是当前使用的界面元素或组件 -->
  </div>
  <!-- 结束 div 元素及其中的内容。 -->
  <!-- div 是当前使用的界面元素或组件 -->
</template>
<!-- 结束 template 组件或元素对应的界面区域。 -->
<!-- template 是当前使用的界面元素或组件 -->
<!-- 这一段完成了界面布局和数据展示的定义，供页面渲染时使用。 -->

<!-- 这一段实现组件状态与事件处理，服务于查询、创建、重置密码及删除权限允许管理的账号。 -->
<script setup lang="ts">
// 开始当前 Vue 组件的脚本区域，定义页面状态与交互逻辑。
// script 是 Vue 组件逻辑区；setup 让顶层声明可直接用于模板；lang="ts" 指定使用 TypeScript
import { ref, reactive, onMounted, computed } from 'vue';
// 从 vue 导入这一行列出的符号，供本文件调用。
// ref：Vue 创建可通过 .value 读写的响应式引用；reactive：Vue 将对象转换为响应式状态的函数；onMounted：Vue 注册组件挂载完成回调的函数；computed：Vue 根据其他响应式值计算并缓存结果的函数
import { ElMessage, ElMessageBox } from 'element-plus';
// 从 element-plus 导入这一行列出的符号，供本文件调用。
// ElMessage：Element Plus 的短消息提示 API；ElMessageBox：Element Plus 的确认或输入对话框 API
import { Plus } from '@element-plus/icons-vue';
// 从 @element-plus/icons-vue 导入这一行列出的符号，供本文件调用。
// Plus：从 @element-plus/icons-vue 导入的对象，用于本文件的调用或类型约束
import type { FormInstance, FormRules } from 'element-plus';
// 从 element-plus 导入这一行列出的符号，供本文件调用。
// FormInstance：从 element-plus 导入的对象，用于本文件的Element Plus 界面组件与提示 API；FormRules：从 element-plus 导入的对象，用于本文件的Element Plus 界面组件与提示 API
import { apiListUsers, apiCreateUser, apiUpdateUser, apiDeleteUser, type UserRow } from '../services/auth';
// 从 ../services/auth 导入这一行列出的符号，供本文件调用。
// apiListUsers：从 ../services/auth 导入的对象，用于本文件的调用或类型约束；apiCreateUser：从 ../services/auth 导入的对象，用于本文件的调用或类型约束；apiUpdateUser：从 ../services/auth 导入的对象，用于本文件的调用或类型约束；apiDeleteUser：从 ../services/auth 导入的对象，用于本文件的调用或类型约束；UserRow：从 ../services/auth 导入的对象，用于本文件的调用或类型约束
import { useAuthStore, type Level } from '../stores/auth';
// 从 ../stores/auth 导入这一行列出的符号，供本文件调用。
// useAuthStore：项目定义的登录状态仓库入口；Level：从 ../stores/auth 导入的对象，用于本文件的调用或类型约束

const auth = useAuthStore();
// 创建或使用项目定义的登录状态仓库入口，将结果保存或写入 auth。
// auth：Pinia 登录状态仓库实例；useAuthStore：项目定义的登录状态仓库入口
const me = computed(() => auth.user);
// 创建或使用Vue 根据其他响应式值计算并缓存结果的函数，将结果保存或写入 me。
// me：本处保存 computed(() => auth.user) 的结果；computed：Vue 根据其他响应式值计算并缓存结果的函数；auth：Pinia 登录状态仓库实例；user：当前会话或调用方的用户信息

const rows = ref<UserRow[]>([]);
// 根据 ref<UserRow[]>([]) 设置 rows，用于数据库查询结果中的记录数组。
// rows：数据库查询结果中的记录数组；ref：Vue 创建可通过 .value 读写的响应式引用；UserRow：从 ../services/auth 导入的对象，用于本文件的调用或类型约束
const loading = ref(false);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 loading。
// loading：正在等待异步操作的界面状态；ref：Vue 创建可通过 .value 读写的响应式引用

// 这一段定义 refresh，用于重新查询当前用户有权查看的账号列表并更新表格。
async function refresh() {
// 重新读取当前数据并更新界面显示。
// refresh：重新查询当前用户有权查看的账号列表并更新表格
  loading.value = true;
  // 把右侧表达式的结果写入 loading.value。
  // loading：正在等待异步操作的界面状态；value：当前字段或点位的实际取值
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    const { users } = await apiListUsers();
    // 获取当前用户有权查看的账号列表。
    // apiListUsers：从 ../services/auth 导入的对象，用于本文件的调用或类型约束
    rows.value = users;
    // 把右侧表达式的结果写入 rows.value。
    // rows：数据库查询结果中的记录数组；value：当前字段或点位的实际取值
  } catch (e) {
  // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
  // e：本处保存的局部数据
    ElMessage.error((e as Error).message);
    // 记录错误日志或显示失败提示，以接收对象为准。
    // ElMessage：Element Plus 的短消息提示 API；error：记录错误日志或显示失败提示，以接收对象为准；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
  } finally {
  // 开始收尾分支，无论前面的操作成功或失败都执行。
  // 本行完成上面一层已说明的函数、分支或对象配置
    loading.value = false;
    // 把右侧表达式的结果写入 loading.value。
    // loading：正在等待异步操作的界面状态；value：当前字段或点位的实际取值
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了重新查询当前用户有权查看的账号列表并更新表格的实现；实际结果由运行时输入和执行分支决定。
onMounted(refresh);
// 创建或使用Vue 注册组件挂载完成回调的函数。
// onMounted：Vue 注册组件挂载完成回调的函数；refresh：重新查询当前用户有权查看的账号列表并更新表格

// 这一段定义 levelText，用于把用户操作级别转换为界面说明文字。
function levelText(l: number): string {
// 定义函数 levelText。
// levelText：把用户操作级别转换为界面说明文字；l：当前方法接收的参数，类型为 number
  return l === 3 ? '管理员' : l === 2 ? '二级' : '普通';
  // 把l === 3 ? '管理员' : l === 2 ? '二级' : '普通'作为当前函数的结果返回。
  // l：当前方法接收的参数，类型为 number
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了把用户操作级别转换为界面说明文字的实现；实际结果由运行时输入和执行分支决定。
// 这一段定义 levelTag，用于把用户操作级别转换为标签展示类型。
function levelTag(l: number): 'danger' | 'warning' | 'info' {
// 定义 levelTag，用于把用户操作级别转换为标签展示类型。
// levelTag：把用户操作级别转换为标签展示类型；l：当前方法接收的参数，类型为 number
  return l === 3 ? 'danger' : l === 2 ? 'warning' : 'info';
  // 把l === 3 ? 'danger' : l === 2 ? 'warning' : 'info'作为当前函数的结果返回。
  // l：当前方法接收的参数，类型为 number
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了把用户操作级别转换为标签展示类型的实现；实际结果由运行时输入和执行分支决定。

// 新建
const createOpen = ref(false);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 createOpen。
// createOpen：本处保存 ref(false) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
const creating = ref(false);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 creating。
// creating：本处保存 ref(false) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
const createFormRef = ref<FormInstance | null>(null);
// 根据 ref<FormInstance | null>(null) 设置 createFormRef，供当前流程后续使用。
// createFormRef：本处保存 ref<FormInstance | null>(null) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用；FormInstance：从 element-plus 导入的对象，用于本文件的Element Plus 界面组件与提示 API
const createForm = reactive({ username: '', password: '', level: 1 as Level });
// 创建或使用Vue 将对象转换为响应式状态的函数，将结果保存或写入 createForm。
// createForm：本处保存 reactive({ username: '', password: '', level: 1 as Level }) 的结果；reactive：Vue 将对象转换为响应式状态的函数；username：账号用户名；password：登录口令或数据库保存的口令摘要，具体取决于所在对象；level：用户操作级别或事件严重级别，依据当前接口结构区分；Level：从 ../stores/auth 导入的对象，用于本文件的调用或类型约束
const createRules: FormRules = {
// 声明 createRules，初始值由 { 计算得到，供当前处理流程继续使用。
// createRules：本处保存 { username: [{ required: true, message: '请输入用户名', trigger: '… 的结果，类型为 FormRules；FormRules：从 element-plus 导入的对象，用于本文件的Element Plus 界面组件与提示 API
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  // 声明或设置 username，用于账号用户名。
  // username：账号用户名；message：消息正文或用于展示的结果说明
  password: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  // 声明或设置 password，用于登录口令或数据库保存的口令摘要，具体取决于所在对象。
  // password：登录口令或数据库保存的口令摘要，具体取决于所在对象；message：消息正文或用于展示的结果说明
  level: [{ required: true, message: '请选择等级', trigger: 'change' }],
  // 声明或设置 level，用于用户操作级别或事件严重级别，依据当前接口结构区分。
  // level：用户操作级别或事件严重级别，依据当前接口结构区分；message：消息正文或用于展示的结果说明
};
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义 openCreate，用于重置并打开新增用户对话框。
function openCreate() {
// 定义函数 openCreate。
// openCreate：重置并打开新增用户对话框
  createForm.username = '';
  // 把右侧表达式的结果写入 createForm.username。
  // createForm：本处保存 reactive({ username: '', password: '', level: 1 as Level }) 的结果；username：账号用户名
  createForm.password = '';
  // 把右侧表达式的结果写入 createForm.password。
  // createForm：本处保存 reactive({ username: '', password: '', level: 1 as Level }) 的结果；password：登录口令或数据库保存的口令摘要，具体取决于所在对象
  createForm.level = 1;
  // 把右侧表达式的结果写入 createForm.level。
  // createForm：本处保存 reactive({ username: '', password: '', level: 1 as Level }) 的结果；level：用户操作级别或事件严重级别，依据当前接口结构区分
  createOpen.value = true;
  // 把右侧表达式的结果写入 createOpen.value。
  // createOpen：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了重置并打开新增用户对话框的实现；实际结果由运行时输入和执行分支决定。
// 这一段定义 onCreate，用于提交新增账号并刷新用户列表。
async function onCreate() {
// 提交新增账号并刷新用户列表。
// onCreate：提交新增账号并刷新用户列表
  if (!createFormRef.value) return;
  // 检查(!createFormRef.value) return;，按判断结果进入对应的处理分支。
  // createFormRef：本处保存 ref<FormInstance | null>(null) 的结果；value：当前字段或点位的实际取值
  const valid = await createFormRef.value.validate().catch(() => false);
  // 按当前数据契约检查输入是否有效，将结果保存或写入 valid。
  // valid：本处保存 await createFormRef.value.validate().catch(() => false) 的结果；createFormRef：本处保存 ref<FormInstance | null>(null) 的结果；value：当前字段或点位的实际取值；validate：本处声明的字段或类型，类型为 (callback?: FormValidateCallback) => FormValidationResult；catch：本处声明的字段或类型，类型为 Promise<T | TResult>
  if (!valid) return;
  // 检查(!valid) return;，按判断结果进入对应的处理分支。
  // valid：本处保存 await createFormRef.value.validate().catch(() => false) 的结果
  creating.value = true;
  // 把右侧表达式的结果写入 creating.value。
  // creating：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    await apiCreateUser(createForm.username, createForm.password, createForm.level);
    // 向后端提交新账号信息。
    // apiCreateUser：从 ../services/auth 导入的对象，用于本文件的调用或类型约束；createForm：本处保存 reactive({ username: '', password: '', level: 1 as Level }) 的结果；username：账号用户名；password：登录口令或数据库保存的口令摘要，具体取决于所在对象；level：用户操作级别或事件严重级别，依据当前接口结构区分
    ElMessage.success('创建成功');
    // 显示操作成功提示。
    // ElMessage：Element Plus 的短消息提示 API；success：显示操作成功提示
    createOpen.value = false;
    // 把右侧表达式的结果写入 createOpen.value。
    // createOpen：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
    refresh();
    // 重新读取当前数据并更新界面显示。
    // refresh：重新查询当前用户有权查看的账号列表并更新表格
  } catch (e) {
  // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
  // e：本处保存的局部数据
    ElMessage.error((e as Error).message);
    // 记录错误日志或显示失败提示，以接收对象为准。
    // ElMessage：Element Plus 的短消息提示 API；error：记录错误日志或显示失败提示，以接收对象为准；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
  } finally {
  // 开始收尾分支，无论前面的操作成功或失败都执行。
  // 本行完成上面一层已说明的函数、分支或对象配置
    creating.value = false;
    // 把右侧表达式的结果写入 creating.value。
    // creating：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了提交新增账号并刷新用户列表的实现；实际结果由运行时输入和执行分支决定。

// 重置密码
const resetOpen = ref(false);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 resetOpen。
// resetOpen：本处保存 ref(false) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
const resetting = ref(false);
// 创建或使用Vue 创建可通过 .value 读写的响应式引用，将结果保存或写入 resetting。
// resetting：本处保存 ref(false) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用
const resetFormRef = ref<FormInstance | null>(null);
// 根据 ref<FormInstance | null>(null) 设置 resetFormRef，供当前流程后续使用。
// resetFormRef：本处保存 ref<FormInstance | null>(null) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用；FormInstance：从 element-plus 导入的对象，用于本文件的Element Plus 界面组件与提示 API
const resetTarget = ref<UserRow | null>(null);
// 根据 ref<UserRow | null>(null) 设置 resetTarget，供当前流程后续使用。
// resetTarget：本处保存 ref<UserRow | null>(null) 的结果；ref：Vue 创建可通过 .value 读写的响应式引用；UserRow：从 ../services/auth 导入的对象，用于本文件的调用或类型约束
const resetForm = reactive({ new_password: '' });
// 创建或使用Vue 将对象转换为响应式状态的函数，将结果保存或写入 resetForm。
// resetForm：本处保存 reactive({ new_password: '' }) 的结果；reactive：Vue 将对象转换为响应式状态的函数
const resetRules: FormRules = {
// 声明 resetRules，初始值由 { 计算得到，供当前处理流程继续使用。
// resetRules：本处保存 { new_password: [{ required: true, min: 6, message: '密码至少 6 … 的结果，类型为 FormRules；FormRules：从 element-plus 导入的对象，用于本文件的Element Plus 界面组件与提示 API
  new_password: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  // 声明或设置 new_password，用于当前对象或接口的对应数据。
  // message：消息正文或用于展示的结果说明
};
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段定义 openReset，用于选择目标账号并打开密码重置对话框。
function openReset(row: UserRow) {
// 定义函数 openReset。
// openReset：选择目标账号并打开密码重置对话框；row：当前方法接收的参数，类型为 UserRow；UserRow：从 ../services/auth 导入的对象，用于本文件的调用或类型约束
  resetTarget.value = row;
  // 把右侧表达式的结果写入 resetTarget.value。
  // resetTarget：本处保存 ref<UserRow | null>(null) 的结果；value：当前字段或点位的实际取值；row：当前方法接收的参数，类型为 UserRow
  resetForm.new_password = '';
  // 把右侧表达式的结果写入 resetForm.new_password。
  // resetForm：本处保存 reactive({ new_password: '' }) 的结果；new_password：resetForm 对象上的字段或操作
  resetOpen.value = true;
  // 把右侧表达式的结果写入 resetOpen.value。
  // resetOpen：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了选择目标账号并打开密码重置对话框的实现；实际结果由运行时输入和执行分支决定。
// 这一段定义 onReset，用于提交目标账号的新密码并刷新界面。
async function onReset() {
// 提交目标账号的新密码并刷新界面。
// onReset：提交目标账号的新密码并刷新界面
  if (!resetFormRef.value || !resetTarget.value) return;
  // 检查(!resetFormRef.value || !resetTarget.value) return;，按判断结果进入对应的处理分支。
  // resetFormRef：本处保存 ref<FormInstance | null>(null) 的结果；value：当前字段或点位的实际取值；resetTarget：本处保存 ref<UserRow | null>(null) 的结果
  const valid = await resetFormRef.value.validate().catch(() => false);
  // 按当前数据契约检查输入是否有效，将结果保存或写入 valid。
  // valid：本处保存 await resetFormRef.value.validate().catch(() => false) 的结果；resetFormRef：本处保存 ref<FormInstance | null>(null) 的结果；value：当前字段或点位的实际取值；validate：本处声明的字段或类型，类型为 (callback?: FormValidateCallback) => FormValidationResult；catch：本处声明的字段或类型，类型为 Promise<T | TResult>
  if (!valid) return;
  // 检查(!valid) return;，按判断结果进入对应的处理分支。
  // valid：本处保存 await resetFormRef.value.validate().catch(() => false) 的结果
  resetting.value = true;
  // 把右侧表达式的结果写入 resetting.value。
  // resetting：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    await apiUpdateUser(resetTarget.value.username, { new_password: resetForm.new_password });
    // 向后端提交账号级别或密码变更。
    // apiUpdateUser：从 ../services/auth 导入的对象，用于本文件的调用或类型约束；resetTarget：本处保存 ref<UserRow | null>(null) 的结果；value：当前字段或点位的实际取值；username：账号用户名；resetForm：本处保存 reactive({ new_password: '' }) 的结果
    ElMessage.success('密码已重置');
    // 显示操作成功提示。
    // ElMessage：Element Plus 的短消息提示 API；success：显示操作成功提示
    resetOpen.value = false;
    // 把右侧表达式的结果写入 resetOpen.value。
    // resetOpen：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
  } catch (e) {
  // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
  // e：本处保存的局部数据
    ElMessage.error((e as Error).message);
    // 记录错误日志或显示失败提示，以接收对象为准。
    // ElMessage：Element Plus 的短消息提示 API；error：记录错误日志或显示失败提示，以接收对象为准；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
  } finally {
  // 开始收尾分支，无论前面的操作成功或失败都执行。
  // 本行完成上面一层已说明的函数、分支或对象配置
    resetting.value = false;
    // 把右侧表达式的结果写入 resetting.value。
    // resetting：本处保存 ref(false) 的结果；value：当前字段或点位的实际取值
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了提交目标账号的新密码并刷新界面的实现；实际结果由运行时输入和执行分支决定。

// 删除
// 这一段定义 onDelete，用于经用户确认后删除目标账号并刷新用户列表。
async function onDelete(row: UserRow) {
// 经用户确认后删除目标账号并刷新用户列表。
// onDelete：经用户确认后删除目标账号并刷新用户列表；row：当前方法接收的参数，类型为 UserRow；UserRow：从 ../services/auth 导入的对象，用于本文件的调用或类型约束
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    await ElMessageBox.confirm(`确认删除用户 ${row.username}?`, '危险操作', { type: 'warning' });
    // 弹出确认对话框，取得用户对当前操作的选择。
    // ElMessageBox：Element Plus 的确认或输入对话框 API；confirm：本处声明的字段或类型，类型为 ElMessageBoxShortcutMethod；row：当前方法接收的参数，类型为 UserRow；username：账号用户名；type：当前报文、指令或对象的类别字段
  } catch { return; }
  // 开始异常处理分支，接收前面代码抛出的错误。
  // 本行完成上面一层已说明的函数、分支或对象配置
  try {
  // 开始执行可能失败的操作，错误由后续异常分支处理。
  // 本块中的数据库、网络或状态操作可能抛出异常；后续 catch 或 except 分支负责处理
    await apiDeleteUser(row.username);
    // 向后端提交账号删除请求。
    // apiDeleteUser：从 ../services/auth 导入的对象，用于本文件的调用或类型约束；row：当前方法接收的参数，类型为 UserRow；username：账号用户名
    ElMessage.success('已删除');
    // 显示操作成功提示。
    // ElMessage：Element Plus 的短消息提示 API；success：显示操作成功提示
    refresh();
    // 重新读取当前数据并更新界面显示。
    // refresh：重新查询当前用户有权查看的账号列表并更新表格
  } catch (e) {
  // 捕获上方异步或同步操作抛出的异常，并进入错误处理分支。
  // e：本处保存的局部数据
    ElMessage.error((e as Error).message);
    // 记录错误日志或显示失败提示，以接收对象为准。
    // ElMessage：Element Plus 的短消息提示 API；error：记录错误日志或显示失败提示，以接收对象为准；e：本处保存的局部数据；Error：标准错误对象类型；message：消息正文或用于展示的结果说明
  }
  // 结束当前函数、分支或对象配置，返回上一层处理流程。
  // 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
}
// 结束当前函数、分支或对象配置，返回上一层处理流程。
// 这一行收束紧邻的对象、函数或调用参数，使外层语句可以继续或结束
// 这一段提供了经用户确认后删除目标账号并刷新用户列表的实现；实际结果由运行时输入和执行分支决定。
</script>
<!-- 结束 Vue 组件的逻辑区域。 -->
<!-- script 是当前使用的界面元素或组件 -->
<!-- 这一段完成了响应式状态与用户交互处理的定义，供页面渲染时使用。 -->

<!-- 这一段实现当前页面或组件的外观样式，服务于查询、创建、重置密码及删除权限允许管理的账号。 -->
<style scoped>
/* 开始当前 Vue 组件的样式区域，设置页面元素的外观。 */
/* 当前样式块作用于最近一个选择器匹配到的页面元素 */
.users-page { padding: 16px; }
/* padding=16px：设置内边距。 */
/* padding 控制内边距，这里取 16px */
.header { display: flex; align-items: baseline; gap: 12px; }
/* display=flex：决定元素如何布局或显示；align-items=baseline：控制交叉轴上的对齐方式；gap=12px：设置子元素间距。 */
/* display 控制元素布局方式，这里取 flex；align-items 控制交叉轴对齐方式，这里取 baseline；gap 控制子元素间距，这里取 12px */
.title { font-weight: 600; }
/* font-weight=600：设置字重。 */
/* font-weight 控制字体粗细，这里取 600 */
.hint { color: var(--text-dim); font-size: 13px; }
/* color=var(--text-dim)：设置文字颜色；font-size=13px：设置字号。 */
/* color 控制文字颜色，这里取 var(--text-dim)；font-size 控制字体大小，这里取 13px */
</style>
<!-- 结束 Vue 组件的样式区域。 -->
<!-- style 是当前使用的界面元素或组件 -->
<!-- 这一段提供了查询、创建、重置密码及删除权限允许管理的账号所需的定义和处理逻辑，结果交由调用方或运行环境使用。 -->
<!-- 这一段完成了页面和组件样式的定义，供页面渲染时使用。 -->
