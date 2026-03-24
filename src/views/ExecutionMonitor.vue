<template>
  <div class="execution-monitor">
    <el-page-header @back="goBack" content="实时执行监控" class="page-header">
      <template #extra>
        <el-button-group>
          <el-button type="primary" @click="startBatchExecution" :loading="startingBatch">
            批量执行
          </el-button>
          <el-button @click="refreshMonitor">刷新</el-button>
          <el-button :type="autoRefresh ? 'success' : 'default'" @click="toggleAutoRefresh">
            {{ autoRefresh ? '自动刷新: 开' : '自动刷新: 关' }}
          </el-button>
        </el-button-group>
      </template>
    </el-page-header>

    <!-- 监控仪表板 -->
    <div class="monitor-dashboard">
      <el-row :gutter="20">
        <!-- 执行统计 -->
        <el-col :span="6">
          <el-card class="stat-card">
            <template #header>
              <div class="card-header">
                <span>执行统计</span>
              </div>
            </template>
            <div class="stat-content">
              <div class="stat-item">
                <span class="stat-label">总执行数</span>
                <span class="stat-value total">{{ stats.total }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">执行中</span>
                <span class="stat-value running">{{ stats.running }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已通过</span>
                <span class="stat-value passed">{{ stats.passed }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已失败</span>
                <span class="stat-value failed">{{ stats.failed }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">待执行</span>
                <span class="stat-value pending">{{ stats.pending }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 实时活动 -->
        <el-col :span="18">
          <el-card class="activity-card">
            <template #header>
              <div class="card-header">
                <span>实时活动</span>
                <div class="header-actions">
                  <el-button size="small" @click="clearActivityLog">清空日志</el-button>
                </div>
              </div>
            </template>
            <div class="activity-log" ref="activityLogRef">
              <div 
                v-for="(activity, index) in activityLog" 
                :key="index"
                class="activity-item"
                :class="getActivityClass(activity.type)"
              >
                <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
                <span class="activity-type">{{ getActivityTypeText(activity.type) }}</span>
                <span class="activity-message">{{ activity.message }}</span>
                <span class="activity-details" v-if="activity.details">
                  <el-button type="text" size="small" @click="showActivityDetails(activity)">
                    详情
                  </el-button>
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 执行进度监控 -->
      <el-card class="progress-card">
        <template #header>
          <div class="card-header">
            <span>执行进度监控</span>
            <div class="header-actions">
              <el-button size="small" @click="expandAllProgress">全部展开</el-button>
              <el-button size="small" @click="collapseAllProgress">全部收起</el-button>
            </div>
          </div>
        </template>

        <div class="progress-list">
          <div 
            v-for="execution in runningExecutions" 
            :key="execution.id"
            class="progress-item"
          >
            <div class="progress-header" @click="toggleProgress(execution.id)">
              <div class="progress-info">
                <span class="testcase-name">{{ execution.testcase_name || '未知用例' }}</span>
                <span class="executor">执行人: {{ execution.executor || '未知' }}</span>
                <span class="environment">环境: {{ execution.environment || '未知' }}</span>
              </div>
              <div class="progress-status">
                <el-progress 
                  :percentage="execution.progress || 0" 
                  :status="getProgressStatus(execution.status)"
                  :stroke-width="12"
                  :show-text="false"
                  style="width: 200px;"
                />
                <span class="progress-text">{{ execution.progress || 0 }}%</span>
                <el-tag :type="getStatusType(execution.status)" size="small">
                  {{ execution.status || 'unknown' }}
                </el-tag>
              </div>
              <div class="progress-actions">
                <el-button 
                  size="small" 
                  type="danger" 
                  @click.stop="stopExecution(execution.id)"
                  :loading="stoppingExecutions[execution.id]"
                >
                  停止
                </el-button>
                <el-button 
                  size="small" 
                  @click.stop="viewExecutionDetail(execution.id)"
                >
                  详情
                </el-button>
              </div>
            </div>

            <!-- 展开的详细信息 -->
            <div class="progress-details" v-if="expandedProgress[execution.id]">
              <div class="details-content">
                <div class="details-row">
                  <span class="label">开始时间:</span>
                  <span class="value">{{ execution.start_time || '-' }}</span>
                </div>
                <div class="details-row">
                  <span class="label">运行时长:</span>
                  <span class="value">{{ calculateDuration(execution) }}</span>
                </div>
                <div class="details-row">
                  <span class="label">当前步骤:</span>
                  <span class="value">{{ execution.current_step || '-' }}</span>
                </div>
                <div class="details-row">
                  <span class="label">通过/总数:</span>
                  <span class="value">
                    {{ execution.passed || 0 }} / {{ execution.total_tests || 0 }}
                  </span>
                </div>
                
                <!-- 执行日志 -->
                <div class="execution-logs" v-if="execution.logs && execution.logs.length > 0">
                  <h4>执行日志</h4>
                  <div class="log-list">
                    <div 
                      v-for="(log, logIndex) in execution.logs.slice(-5)" 
                      :key="logIndex"
                      class="log-item"
                      :class="getLogLevelClass(log.level)"
                    >
                      <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                      <span class="log-level">{{ log.level }}</span>
                      <span class="log-message">{{ log.message }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="empty-state" v-if="runningExecutions.length === 0">
            <el-empty description="暂无正在执行的测试" />
          </div>
        </div>
      </el-card>

      <!-- 最近执行记录 -->
      <el-card class="recent-executions-card">
        <template #header>
          <div class="card-header">
            <span>最近执行记录</span>
            <div class="header-actions">
              <el-button size="small" @click="viewAllExecutions">查看全部</el-button>
            </div>
          </div>
        </template>

        <el-table :data="recentExecutions" border style="width: 100%" v-loading="loadingRecent">
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
          <el-table-column prop="duration" label="耗时" width="100">
            <template #default="{ row }">
              {{ row.duration ? row.duration + 's' : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="viewExecutionDetail(row.id)">详情</el-button>
              <el-button size="small" @click="reExecute(row)" v-if="row.status === 'failed'">重试</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 批量执行对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量执行测试用例"
      width="600px"
    >
      <div class="batch-execution-dialog">
        <el-form :model="batchForm" label-width="100px">
          <el-form-item label="选择项目" required>
            <el-select v-model="batchForm.project_id" placeholder="请选择项目" @change="loadProjectTestCases">
              <el-option 
                v-for="project in projects" 
                :key="project.id" 
                :label="project.name" 
                :value="project.id" 
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="选择用例" required>
            <el-transfer
              v-model="batchForm.testcase_ids"
              :data="testCaseOptions"
              :titles="['可用用例', '已选用例']"
              :props="{
                key: 'id',
                label: 'name'
              }"
              filterable
              :filter-method="filterTestCases"
              filter-placeholder="搜索测试用例"
            />
          </el-form-item>
          
          <el-form-item label="执行人" required>
            <el-input v-model="batchForm.executor" placeholder="请输入执行人姓名" />
          </el-form-item>
          
          <el-form-item label="环境">
            <el-select v-model="batchForm.environment" placeholder="请选择测试环境">
              <el-option label="开发环境" value="dev" />
              <el-option label="测试环境" value="test" />
              <el-option label="预发布环境" value="staging" />
              <el-option label="生产环境" value="production" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="执行策略">
            <el-radio-group v-model="batchForm.strategy">
              <el-radio label="sequential">顺序执行</el-radio>
              <el-radio label="parallel">并行执行</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="备注">
            <el-input
              v-model="batchForm.notes"
              type="textarea"
              :rows="3"
              placeholder="请输入执行备注"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmBatchExecute" :loading="startingBatch">
            开始批量执行
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 活动详情对话框 -->
    <el-dialog
      v-model="activityDetailsVisible"
      title="活动详情"
      width="500px"
    >
      <div class="activity-details-content" v-if="selectedActivity">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="时间">{{ formatTime(selectedActivity.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ getActivityTypeText(selectedActivity.type) }}</el-descriptions-item>
          <el-descriptions-item label="消息">{{ selectedActivity.message }}</el-descriptions-item>
          <el-descriptions-item label="详情" v-if="selectedActivity.details">
            <pre class="details-json">{{ formatDetails(selectedActivity.details) }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="activityDetailsVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExecutions, stopExecution as stopExecutionApi } from '@/api/execution'
import { getProjects } from '@/api/project'
import { getTestCases } from '@/api/testcase'
import { useWebSocket } from '@/utils/websocket'

export default {
  name: 'ExecutionMonitor',
  setup() {
    const router = useRouter()
    
    // 状态数据
    const stats = ref({
      total: 0,
      running: 0,
      passed: 0,
      failed: 0,
      pending: 0
    })
    
    const runningExecutions = ref([])
    const recentExecutions = ref([])
    const activityLog = ref([])
    const loadingRecent = ref(false)
    const autoRefresh = ref(true)
    const autoRefreshInterval = ref(null)
    
    // 批量执行相关
    const batchDialogVisible = ref(false)
    const batchForm = ref({
      project_id: null,
      testcase_ids: [],
      executor: '',
      environment: 'test',
      strategy: 'sequential',
      notes: ''
    })
    const startingBatch = ref(false)
    const projects = ref([])
    const testCaseOptions = ref([])
    
    // 活动详情
    const activityDetailsVisible = ref(false)
    const selectedActivity = ref(null)
    
    // 进度展开状态
    const expandedProgress = ref({})
    const stoppingExecutions = ref({})
    
    // WebSocket连接
    const { connect, disconnect, subscribe } = useWebSocket()
    const activityLogRef = ref(null)
    
    // 加载监控数据
    const loadMonitorData = async () => {
      try {
        // 加载正在执行的测试
        const runningResponse = await getExecutions({ status: 'running', limit: 20 })
        runningExecutions.value = runningResponse.data || []
        
        // 加载最近执行记录
        loadingRecent.value = true
        const recentResponse = await getExecutions({ limit: 10 })
        recentExecutions.value = recentResponse.data || []
        
        // 更新统计信息
        updateStats()
      } catch (error) {
        console.error('加载监控数据失败:', error)
        ElMessage.error('加载监控数据失败')
      } finally {
        loadingRecent.value = false
      }
    }
    
    // 更新统计信息
    const updateStats = () => {
      // 这里需要从API获取统计信息
      // 暂时使用模拟数据
      stats.value = {
        total: recentExecutions.value.length,
        running: runningExecutions.value.length,
        passed: recentExecutions.value.filter(e => e.status === 'passed').length,
        failed: recentExecutions.value.filter(e => e.status === 'failed').length,
        pending: recentExecutions.value.filter(e => e.status === 'pending').length
      }
    }
    
    // 刷新监控
    const refreshMonitor = () => {
      loadMonitorData()
      ElMessage.success('监控数据已刷新')
    }
    
    // 切换自动刷新
    const toggleAutoRefresh = () => {
      autoRefresh.value = !autoRefresh.value
      
      if (autoRefresh.value) {
        startAutoRefresh()
        ElMessage.success('已开启自动刷新')
      } else {
        stopAutoRefresh()
        ElMessage.info('已关闭自动刷新')
      }
    }
    
    // 开始自动刷新
    const startAutoRefresh = () => {
      if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value)
      }
      
      autoRefreshInterval.value = setInterval(() => {
        loadMonitorData()
      }, 10000) // 每10秒刷新一次
    }
    
    // 停止自动刷新
    const stopAutoRefresh = () => {
      if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value)
        autoRefreshInterval.value = null
      }
    }
    
    // 查看执行详情
    const viewExecutionDetail = (executionId) => {
      router.push({ name: 'ExecutionDetail', params: { id: executionId } })
    }
    
    // 查看测试用例
    const viewTestCase = (testcaseId) => {
      if (testcaseId) {
        router.push({ name: 'TestCaseDetail', params: { id: testcaseId } })
      }
    }
    
    // 重新执行
    const reExecute = () => {
      ElMessage.info('重新执行功能开发中...')
      // TODO: 实现重新执行功能
    }
    
    // 停止执行
    const stopExecution = async (executionId) => {
      try {
        await ElMessageBox.confirm(
          '确定要停止这个执行吗？',
          '确认停止',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        stoppingExecutions.value[executionId] = true
        await stopExecutionApi(executionId)
        ElMessage.success('已发送停止请求')
        
        // 更新执行状态
        const execution = runningExecutions.value.find(e => e.id === executionId)
        if (execution) {
          execution.status = 'stopping'
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('停止执行失败:', error)
          ElMessage.error('停止执行失败')
        }
      } finally {
        stoppingExecutions.value[executionId] = false
      }
    }
    
    // 切换进度展开状态
    const toggleProgress = (executionId) => {
      expandedProgress.value[executionId] = !expandedProgress.value[executionId]
    }
    
    // 全部展开
    const expandAllProgress = () => {
      runningExecutions.value.forEach(execution => {
        expandedProgress.value[execution.id] = true
      })
    }
    
    // 全部收起
    const collapseAllProgress = () => {
      expandedProgress.value = {}
    }
    
    // 获取状态标签类型
    const getStatusType = (status) => {
      const types = {
        'passed': 'success',
        'failed': 'danger',
        'running': 'warning',
        'pending': 'info',
        'skipped': 'info',
        'stopping': 'danger'
      }
      return types[status] || 'info'
    }
    
    // 获取进度状态
    const getProgressStatus = (status) => {
      if (status === 'running') return 'success'
      if (status === 'failed') return 'exception'
      if (status === 'passed') return 'success'
      return 'warning'
    }
    
    // 计算运行时长
    const calculateDuration = (execution) => {
      if (!execution.start_time) return '-'
      
      const startTime = new Date(execution.start_time)
      const now = new Date()
      const diffMs = now - startTime
      
      const seconds = Math.floor(diffMs / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      
      if (hours > 0) {
        return `${hours}小时${minutes % 60}分钟`
      } else if (minutes > 0) {
        return `${minutes}分钟${seconds % 60}秒`
      } else {
        return `${seconds}秒`
      }
    }
    
    // 获取日志级别样式
    const getLogLevelClass = (level) => {
      const classes = {
        'error': 'log-error',
        'warn': 'log-warn',
        'info': 'log-info',
        'debug': 'log-debug'
      }
      return classes[level] || 'log-info'
    }
    
    // 格式化时间
    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return date.toLocaleTimeString()
    }
    
    // 获取活动类型文本
    const getActivityTypeText = (type) => {
      const texts = {
        'execution_started': '执行开始',
        'execution_completed': '执行完成',
        'execution_failed': '执行失败',
        'test_run_updated': '测试运行更新',
        'system_status': '系统状态',
        'websocket_connected': '连接建立',
        'websocket_disconnected': '连接断开'
      }
      return texts[type] || type
    }
    
    // 获取活动样式类
    const getActivityClass = (type) => {
      const classes = {
        'execution_started': 'activity-success',
        'execution_completed': 'activity-success',
        'execution_failed': 'activity-error',
        'test_run_updated': 'activity-info',
        'system_status': 'activity-warning',
        'websocket_connected': 'activity-success',
        'websocket_disconnected': 'activity-error'
      }
      return classes[type] || 'activity-info'
    }
    
    // 显示活动详情
    const showActivityDetails = (activity) => {
      selectedActivity.value = activity
      activityDetailsVisible.value = true
    }
    
    // 格式化详情
    const formatDetails = (details) => {
      if (typeof details === 'string') {
        try {
          return JSON.stringify(JSON.parse(details), null, 2)
        } catch (e) {
          return details
        }
      }
      return JSON.stringify(details, null, 2)
    }
    
    // 清空活动日志
    const clearActivityLog = () => {
      activityLog.value = []
      ElMessage.success('活动日志已清空')
    }
    
    // 滚动到底部
    const scrollToBottom = () => {
      nextTick(() => {
        if (activityLogRef.value) {
          activityLogRef.value.scrollTop = activityLogRef.value.scrollHeight
        }
      })
    }
    
    // 添加活动日志
    const addActivityLog = (type, message, details = null) => {
      const activity = {
        timestamp: new Date().toISOString(),
        type,
        message,
        details
      }
      
      activityLog.value.push(activity)
      
      // 限制日志数量
      if (activityLog.value.length > 100) {
        activityLog.value = activityLog.value.slice(-100)
      }
      
      // 滚动到底部
      scrollToBottom()
    }
    
    // 批量执行
    const startBatchExecution = async () => {
      // 加载项目列表
      try {
        const response = await getProjects()
        projects.value = response.data || []
      } catch (error) {
        console.error('加载项目列表失败:', error)
        ElMessage.error('加载项目列表失败')
        return
      }
      
      batchDialogVisible.value = true
    }
    
    // 加载项目测试用例
    const loadProjectTestCases = async () => {
      if (!batchForm.value.project_id) {
        testCaseOptions.value = []
        return
      }
      
      try {
        const response = await getTestCases({ project_id: batchForm.value.project_id })
        testCaseOptions.value = response.data || []
      } catch (error) {
        console.error('加载测试用例失败:', error)
        ElMessage.error('加载测试用例失败')
      }
    }
    
    // 筛选测试用例
    const filterTestCases = (query, item) => {
      return item.name.toLowerCase().includes(query.toLowerCase())
    }
    
    // 确认批量执行
    const confirmBatchExecute = async () => {
      if (!batchForm.value.project_id) {
        ElMessage.warning('请选择项目')
        return
      }
      
      if (batchForm.value.testcase_ids.length === 0) {
        ElMessage.warning('请选择测试用例')
        return
      }
      
      if (!batchForm.value.executor) {
        ElMessage.warning('请输入执行人')
        return
      }
      
      startingBatch.value = true
      try {
        // TODO: 调用批量执行API
        // await batchExecuteTestCases(batchForm.value)
        
        ElMessage.success('批量执行已开始')
        batchDialogVisible.value = false
        batchForm.value = {
          project_id: null,
          testcase_ids: [],
          executor: '',
          environment: 'test',
          strategy: 'sequential',
          notes: ''
        }
        
        // 刷新监控数据
        loadMonitorData()
      } catch (error) {
        console.error('批量执行失败:', error)
        ElMessage.error('批量执行失败')
      } finally {
        startingBatch.value = false
      }
    }
    
    // 查看全部执行记录
    const viewAllExecutions = () => {
      router.push('/executions')
    }
    
    // 返回上一页
    const goBack = () => {
      router.go(-1)
    }
    
    // WebSocket事件处理
    const setupWebSocketHandlers = () => {
      // 连接成功
      subscribe('connected', (data) => {
        addActivityLog('websocket_connected', 'WebSocket连接已建立', data)
      })
      
      // 连接断开
      subscribe('disconnected', (data) => {
        addActivityLog('websocket_disconnected', 'WebSocket连接已断开', data)
      })
      
      // 测试运行更新
      subscribe('test_run_updated', (data) => {
        addActivityLog('test_run_updated', `测试运行更新: ${data.message}`, data)
        
        // 更新执行列表
        if (data.execution_id) {
          // 查找并更新执行记录
          const index = runningExecutions.value.findIndex(e => e.id === data.execution_id)
          if (index !== -1) {
            runningExecutions.value[index] = {
              ...runningExecutions.value[index],
              ...data
            }
          } else if (data.status === 'running') {
            // 如果是新的执行，添加到列表
            runningExecutions.value.unshift(data)
          }
        }
        
        // 更新统计信息
        updateStats()
      })
      
      // 系统状态
      subscribe('system_status', (data) => {
        addActivityLog('system_status', `系统状态更新: ${data.status}`, data)
      })
    }
    
    // 生命周期钩子
    onMounted(() => {
      loadMonitorData()
      
      // 连接WebSocket
      connect()
      setupWebSocketHandlers()
      
      // 开始自动刷新
      if (autoRefresh.value) {
        startAutoRefresh()
      }
    })
    
    onUnmounted(() => {
      // 停止自动刷新
      stopAutoRefresh()
      
      // 断开WebSocket连接
      disconnect()
    })
    
    return {
      // 状态数据
      stats,
      runningExecutions,
      recentExecutions,
      activityLog,
      loadingRecent,
      autoRefresh,
      
      // 批量执行相关
      batchDialogVisible,
      batchForm,
      startingBatch,
      projects,
      testCaseOptions,
      
      // 活动详情
      activityDetailsVisible,
      selectedActivity,
      
      // UI状态
      expandedProgress,
      stoppingExecutions,
      activityLogRef,
      
      // 方法
      loadMonitorData,
      refreshMonitor,
      toggleAutoRefresh,
      viewExecutionDetail,
      viewTestCase,
      reExecute,
      stopExecution,
      toggleProgress,
      expandAllProgress,
      collapseAllProgress,
      getStatusType,
      getProgressStatus,
      calculateDuration,
      getLogLevelClass,
      formatTime,
      getActivityTypeText,
      getActivityClass,
      showActivityDetails,
      formatDetails,
      clearActivityLog,
      startBatchExecution,
      loadProjectTestCases,
      filterTestCases,
      confirmBatchExecute,
      viewAllExecutions,
      goBack
    }
  }
}
</script>

<style scoped>
.execution-monitor {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.monitor-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-card .stat-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
}

.stat-value.total {
  color: #409eff;
}

.stat-value.running {
  color: #e6a23c;
}

.stat-value.passed {
  color: #67c23a;
}

.stat-value.failed {
  color: #f56c6c;
}

.stat-value.pending {
  color: #909399;
}

.activity-card {
  height: 400px;
}

.activity-log {
  height: 320px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.activity-item {
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.activity-success {
  background-color: #f0f9eb;
  border-left: 4px solid #67c23a;
}

.activity-error {
  background-color: #fef0f0;
  border-left: 4px solid #f56c6c;
}

.activity-warning {
  background-color: #fdf6ec;
  border-left: 4px solid #e6a23c;
}

.activity-info {
  background-color: #f4f4f5;
  border-left: 4px solid #909399;
}

.activity-time {
  color: #999;
  min-width: 80px;
}

.activity-type {
  font-weight: bold;
  min-width: 100px;
}

.activity-message {
  flex: 1;
  color: #333;
}

.activity-details {
  min-width: 60px;
}

.progress-card {
  margin-top: 20px;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: background-color 0.3s;
}

.progress-header:hover {
  background-color: #f0f2f5;
}

.progress-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.testcase-name {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.executor,
.environment {
  font-size: 12px;
  color: #666;
}

.progress-status {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 0 20px;
}

.progress-text {
  font-weight: bold;
  color: #333;
  min-width: 40px;
}

.progress-actions {
  display: flex;
  gap: 10px;
}

.progress-details {
  padding: 15px;
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.details-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.details-row .label {
  font-weight: bold;
  color: #666;
  min-width: 100px;
}

.details-row .value {
  color: #333;
}

.execution-logs {
  margin-top: 15px;
}

.execution-logs h4 {
  margin-bottom: 10px;
  color: #333;
}

.log-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
}

.log-item {
  padding: 5px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #999;
  min-width: 80px;
}

.log-level {
  font-weight: bold;
  min-width: 50px;
}

.log-error .log-level {
  color: #f56c6c;
}

.log-warn .log-level {
  color: #e6a23c;
}

.log-info .log-level {
  color: #409eff;
}

.log-debug .log-level {
  color: #909399;
}

.log-message {
  color: #333;
  flex: 1;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.recent-executions-card {
  margin-top: 20px;
}

.batch-execution-dialog {
  max-height: 500px;
  overflow-y: auto;
}

.details-json {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  max-height: 300px;
  overflow: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-row {
  margin-bottom: 0;
}

.el-col {
  margin-bottom: 0;
}
</style>