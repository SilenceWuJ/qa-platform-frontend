<template>
  <div class="execution-list">
    <h1>执行记录</h1>
    
    <!-- 筛选条件 -->
    <div class="filters">
      <el-form inline>
        <el-form-item label="测试用例">
          <el-select v-model="filters.testcase_id" placeholder="全部" clearable @change="fetchExecutions">
            <el-option v-for="tc in testCases" :key="tc.id" :label="tc.name" :value="tc.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable @change="fetchExecutions">
            <el-option label="通过" value="passed" />
            <el-option label="失败" value="failed" />
            <el-option label="执行中" value="running" />
            <el-option label="待执行" value="pending" />
            <el-option label="跳过" value="skipped" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行人">
          <el-input v-model="filters.executor" placeholder="执行人姓名" clearable @change="fetchExecutions" />
        </el-form-item>
        <el-form-item label="环境">
          <el-select v-model="filters.environment" placeholder="全部" clearable @change="fetchExecutions">
            <el-option label="开发环境" value="dev" />
            <el-option label="测试环境" value="test" />
            <el-option label="预发布环境" value="staging" />
            <el-option label="生产环境" value="production" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchExecutions">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 执行记录表格 -->
    <el-table :data="executions" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="testcase_name" label="测试用例" width="200">
        <template #default="{ row }">
          <el-link type="primary" @click="viewTestCase(row.testcase_id)" v-if="row.testcase_name">
            {{ row.testcase_name }}
          </el-link>
          <span v-else>{{ row.testcase_id }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="executor" label="执行人" width="120" />
      <el-table-column prop="environment" label="环境" width="100" />
      <el-table-column prop="start_time" label="开始时间" width="180" />
      <el-table-column prop="end_time" label="结束时间" width="180" />
      <el-table-column prop="duration" label="耗时" width="100">
        <template #default="{ row }">
          {{ row.duration ? row.duration + 's' : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="viewExecutionDetail(row)">详情</el-button>
          <el-button size="small" @click="viewReport(row)" v-if="row.report_id">报告</el-button>
          <el-button size="small" type="primary" @click="reExecute(row)" v-if="row.status === 'failed'">重试</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getExecutions } from '@/api/execution'
import { getTestCases } from '@/api/testcase'
import { useWebSocket } from '@/utils/websocket'

const router = useRouter()

const executions = ref([])
const testCases = ref([])
const loading = ref(false)

const filters = ref({
  testcase_id: null,
  status: null,
  executor: '',
  environment: ''
})

const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// WebSocket连接
const { connect, disconnect, subscribe, unsubscribe } = useWebSocket()

// 加载执行记录
const fetchExecutions = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      page_size: pageSize.value,
      ...filters.value
    }
    
    // 移除空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null) {
        delete params[key]
      }
    })
    
    const response = await getExecutions(params)
    executions.value = response.data || []
    total.value = response.total || 0
  } catch (error) {
    console.error('获取执行记录失败:', error)
    ElMessage.error('获取执行记录失败')
  } finally {
    loading.value = false
  }
}

// 加载测试用例列表
const loadTestCases = async () => {
  try {
    const response = await getTestCases()
    testCases.value = response.data || []
  } catch (error) {
    console.error('加载测试用例失败:', error)
  }
}

// 查看执行详情
const viewExecutionDetail = (execution) => {
  router.push({ name: 'ExecutionDetail', params: { id: execution.id } })
}

// 查看测试用例
const viewTestCase = (testcaseId) => {
  if (testcaseId) {
    router.push({ name: 'TestCaseDetail', params: { id: testcaseId } })
  }
}

// 查看报告
const viewReport = (execution) => {
  if (execution.report_id) {
    router.push({ name: 'ReportDetail', params: { id: execution.report_id } })
  }
}

// 重新执行
const reExecute = () => {
  ElMessage.info('重新执行功能开发中...')
  // TODO: 实现重新执行功能
}

// 重置筛选条件
const resetFilters = () => {
  filters.value = {
    testcase_id: null,
    status: null,
    executor: '',
    environment: ''
  }
  currentPage.value = 1
  fetchExecutions()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchExecutions()
}

// 当前页变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchExecutions()
}

// 获取状态标签类型
const getStatusType = (status) => {
  const types = {
    'passed': 'success',
    'failed': 'danger',
    'running': 'warning',
    'pending': 'info',
    'skipped': 'info'
  }
  return types[status] || 'info'
}

// 订阅执行更新
const subscribeToExecutionUpdates = () => {
  subscribe('execution_updates', (data) => {
    if (data.type === 'new_execution' || data.type === 'execution_updated') {
      // 刷新执行记录列表
      fetchExecutions()
    }
  })
}

onMounted(() => {
  fetchExecutions()
  loadTestCases()
  
  // 连接WebSocket并订阅更新
  connect()
  subscribeToExecutionUpdates()
})

onUnmounted(() => {
  // 取消订阅
  unsubscribe('execution_updates')
  
  // 断开WebSocket连接
  disconnect()
})
</script>

<style scoped>
.execution-list {
  padding: 20px;
}

.filters {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.el-form-item {
  margin-bottom: 0;
}

.el-table {
  margin-top: 20px;
}
</style>