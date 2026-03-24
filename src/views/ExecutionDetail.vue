<template>
  <div class="execution-detail">
    <el-page-header @back="goBack" content="执行记录详情" class="page-header">
      <template #extra>
        <el-button-group>
          <el-button type="primary" @click="reExecute" :loading="reExecuting">重新执行</el-button>
          <el-button @click="viewTestCase" v-if="execution.testcase_id">查看用例</el-button>
          <el-button @click="viewReport" v-if="execution.report_id">查看报告</el-button>
          <el-button type="danger" @click="deleteExecution" :loading="deleting">删除</el-button>
        </el-button-group>
      </template>
    </el-page-header>

    <el-card class="detail-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <el-tag :type="getStatusType(execution.status)" size="large">
            {{ execution.status || 'unknown' }}
          </el-tag>
        </div>
      </template>

      <el-descriptions :column="2" border v-if="execution">
        <el-descriptions-item label="执行ID">{{ execution.id }}</el-descriptions-item>
        <el-descriptions-item label="测试用例">
          <el-link type="primary" @click="viewTestCase" v-if="execution.testcase_name">
            {{ execution.testcase_name }}
          </el-link>
          <span v-else>{{ execution.testcase_id }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="执行人">{{ execution.executor }}</el-descriptions-item>
        <el-descriptions-item label="环境">{{ execution.environment }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ execution.start_time }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ execution.end_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="耗时">
          {{ execution.duration ? execution.duration + '秒' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ execution.notes || '无' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 执行结果详情 -->
    <el-card class="result-card" v-if="executionResult">
      <template #header>
        <div class="card-header">
          <span>执行结果详情</span>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="refreshResult">
              刷新结果
            </el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="通过步骤">
          <el-progress 
            :percentage="calculatePassPercentage()" 
            :status="getProgressStatus()"
            :show-text="false"
          />
          <span class="progress-text">
            {{ executionResult.passed_steps || 0 }} / {{ executionResult.total_steps || 0 }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="失败步骤">{{ executionResult.failed_steps || 0 }}</el-descriptions-item>
        <el-descriptions-item label="跳过步骤">{{ executionResult.skipped_steps || 0 }}</el-descriptions-item>
        <el-descriptions-item label="详细结果">
          <pre class="result-details">{{ formatResultDetails(executionResult.details) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" v-if="executionResult.error_message">
          <el-alert type="error" :title="executionResult.error_message" show-icon />
        </el-descriptions-item>
        <el-descriptions-item label="堆栈跟踪" v-if="executionResult.stack_trace">
          <pre class="stack-trace">{{ executionResult.stack_trace }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 测试步骤执行详情 -->
    <el-card class="steps-card" v-if="testCase && testCase.steps">
      <template #header>
        <div class="card-header">
          <span>测试步骤执行详情</span>
          <div class="header-actions">
            <el-switch
              v-model="showJsonView"
              active-text="JSON视图"
              inactive-text="可视化视图"
              @change="toggleView"
            />
          </div>
        </div>
      </template>

      <TestStepsDisplay
        :steps="testCase.steps"
        :executionResult="executionResult"
        :editable="false"
        :showJson="showJsonView"
        :showStats="true"
        @step-clicked="handleStepClick"
      />
    </el-card>

    <!-- 实时执行监控 -->
    <el-card class="monitor-card" v-if="isRunning">
      <template #header>
        <div class="card-header">
          <span>实时执行监控</span>
          <div class="header-actions">
            <el-button type="danger" size="small" @click="stopExecution" :loading="stopping">
              停止执行
            </el-button>
          </div>
        </div>
      </template>

      <div class="monitor-content">
        <el-progress 
          :percentage="executionProgress" 
          :status="getProgressStatus()"
          :stroke-width="20"
          :text-inside="true"
        />
        
        <div class="progress-info">
          <div class="info-item">
            <span class="label">当前步骤:</span>
            <span class="value">{{ currentStep || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">已执行:</span>
            <span class="value">{{ executionProgress }}%</span>
          </div>
          <div class="info-item">
            <span class="label">开始时间:</span>
            <span class="value">{{ execution.start_time }}</span>
          </div>
          <div class="info-item">
            <span class="label">运行时长:</span>
            <span class="value">{{ calculateDuration() }}</span>
          </div>
        </div>

        <div class="log-container" v-if="executionLogs.length > 0">
          <h4>执行日志</h4>
          <div class="log-list">
            <div 
              v-for="(log, index) in executionLogs" 
              :key="index"
              class="log-item"
              :class="getLogLevelClass(log.level)"
            >
              <span class="log-time">{{ log.timestamp }}</span>
              <span class="log-level">{{ log.level }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 重新执行对话框 -->
    <el-dialog
      v-model="reExecuteDialogVisible"
      title="重新执行测试用例"
      width="500px"
    >
      <el-form :model="reExecuteForm" label-width="100px">
        <el-form-item label="执行人">
          <el-input v-model="reExecuteForm.executor" :placeholder="execution.executor" />
        </el-form-item>
        <el-form-item label="环境">
          <el-select v-model="reExecuteForm.environment" placeholder="请选择测试环境">
            <el-option label="开发环境" value="dev" />
            <el-option label="测试环境" value="test" />
            <el-option label="预发布环境" value="staging" />
            <el-option label="生产环境" value="production" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="reExecuteForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入执行备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reExecuteDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmReExecute" :loading="reExecuting">
            开始执行
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import TestStepsDisplay from '@/components/TestStepsDisplay.vue'
import { getExecutionRecord, deleteExecution as deleteExecutionApi, reExecute as reExecuteApi } from '@/api/execution'
import { getTestCases } from '@/api/testcase'
import { useWebSocket } from '@/utils/websocket'

export default {
  name: 'ExecutionDetail',
  components: {
    TestStepsDisplay
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const executionId = ref(parseInt(route.params.id))
    const execution = ref({})
    const executionResult = ref(null)
    const testCase = ref(null)
    const loading = ref(false)
    const showJsonView = ref(false)
    
    const reExecuteDialogVisible = ref(false)
    const reExecuteForm = ref({
      executor: '',
      environment: 'test',
      notes: ''
    })
    const reExecuting = ref(false)
    const deleting = ref(false)
    const stopping = ref(false)
    
    // WebSocket连接
    const { connect, disconnect, subscribe, unsubscribe } = useWebSocket()
    
    // 实时执行监控数据
    const executionProgress = ref(0)
    const currentStep = ref('')
    const executionLogs = ref([])
    
    // 计算属性
    const isRunning = computed(() => {
      return execution.value.status === 'running'
    })
    
    // 加载执行记录详情
    const loadExecutionDetail = async () => {
      loading.value = true
      try {
        const response = await getExecutionRecord(executionId.value)
        execution.value = response.data
        
        // 加载执行结果
        if (execution.value.result_id) {
          // 这里需要根据实际情况调用API获取执行结果
          // executionResult.value = await getExecutionResult(execution.value.result_id)
        }
        
        // 加载测试用例
        if (execution.value.testcase_id) {
          await loadTestCase(execution.value.testcase_id)
        }
        
        // 如果正在执行，订阅实时更新
        if (isRunning.value) {
          subscribeToExecution()
        }
      } catch (error) {
        console.error('加载执行记录失败:', error)
        ElMessage.error('加载执行记录失败')
      } finally {
        loading.value = false
      }
    }
    
    // 加载测试用例
    const loadTestCase = async (testcaseId) => {
      try {
        const response = await getTestCases({ id: testcaseId })
        if (response.data && response.data.length > 0) {
          testCase.value = response.data[0]
          
          // 确保steps是数组格式
          if (testCase.value.steps && typeof testCase.value.steps === 'string') {
            try {
              testCase.value.steps = JSON.parse(testCase.value.steps)
            } catch (e) {
              console.error('解析测试步骤失败:', e)
              testCase.value.steps = []
            }
          }
        }
      } catch (error) {
        console.error('加载测试用例失败:', error)
      }
    }
    
    // 订阅执行实时更新
    const subscribeToExecution = () => {
      subscribe(`execution_${executionId.value}`, (data) => {
        if (data.type === 'progress') {
          executionProgress.value = data.progress
          currentStep.value = data.current_step
          
          // 更新执行日志
          if (data.log) {
            executionLogs.value.push({
              timestamp: new Date().toLocaleTimeString(),
              level: data.log.level || 'info',
              message: data.log.message
            })
            
            // 限制日志数量
            if (executionLogs.value.length > 100) {
              executionLogs.value = executionLogs.value.slice(-100)
            }
          }
          
          // 更新执行结果
          if (data.result) {
            executionResult.value = data.result
          }
        } else if (data.type === 'completed') {
          ElMessage.success('测试执行完成')
          unsubscribe(`execution_${executionId.value}`)
          loadExecutionDetail() // 重新加载详情
        } else if (data.type === 'failed') {
          ElMessage.error('测试执行失败')
          unsubscribe(`execution_${executionId.value}`)
          loadExecutionDetail() // 重新加载详情
        }
      })
    }
    
    // 重新执行
    const reExecute = () => {
      reExecuteForm.value = {
        executor: execution.value.executor || '',
        environment: execution.value.environment || 'test',
        notes: ''
      }
      reExecuteDialogVisible.value = true
    }
    
    // 确认重新执行
    const confirmReExecute = async () => {
      if (!reExecuteForm.value.executor) {
        ElMessage.warning('请输入执行人')
        return
      }
      
      reExecuting.value = true
      try {
        const response = await reExecuteApi(executionId.value, reExecuteForm.value)
        ElMessage.success('重新执行已开始')
        reExecuteDialogVisible.value = false
        
        // 跳转到新的执行记录
        if (response.data && response.data.new_execution_id) {
          router.push(`/executions/${response.data.new_execution_id}`)
        } else {
          loadExecutionDetail() // 刷新当前页面
        }
      } catch (error) {
        console.error('重新执行失败:', error)
        ElMessage.error('重新执行失败')
      } finally {
        reExecuting.value = false
      }
    }
    
    // 查看测试用例
    const viewTestCase = () => {
      if (execution.value.testcase_id) {
        router.push(`/testcases/${execution.value.testcase_id}`)
      }
    }
    
    // 查看报告
    const viewReport = () => {
      if (execution.value.report_id) {
        router.push(`/reports/${execution.value.report_id}`)
      }
    }
    
    // 删除执行记录
    const deleteExecution = async () => {
      try {
        await ElMessageBox.confirm(
          '确定要删除这个执行记录吗？此操作不可恢复。',
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        deleting.value = true
        await deleteExecutionApi(executionId.value)
        ElMessage.success('执行记录删除成功')
        router.push('/executions')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除执行记录失败:', error)
          ElMessage.error('删除执行记录失败')
        }
      } finally {
        deleting.value = false
      }
    }
    
    // 停止执行
    const stopExecution = async () => {
      try {
        await ElMessageBox.confirm(
          '确定要停止当前执行吗？',
          '确认停止',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        stopping.value = true
        // 这里需要调用停止执行的API
        // await stopExecutionApi(executionId.value)
        ElMessage.success('已发送停止请求')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('停止执行失败:', error)
          ElMessage.error('停止执行失败')
        }
      } finally {
        stopping.value = false
      }
    }
    
    // 刷新结果
    const refreshResult = () => {
      loadExecutionDetail()
    }
    
    // 处理步骤点击
    const handleStepClick = (step) => {
      console.log('步骤点击:', step)
    }
    
    // 切换视图
    const toggleView = () => {
      // 视图切换逻辑已在组件内部处理
    }
    
    // 计算通过百分比
    const calculatePassPercentage = () => {
      if (!executionResult.value || !executionResult.value.total_steps) {
        return 0
      }
      const passed = executionResult.value.passed_steps || 0
      const total = executionResult.value.total_steps
      return Math.round((passed / total) * 100)
    }
    
    // 获取进度状态
    const getProgressStatus = () => {
      const percentage = calculatePassPercentage()
      if (percentage >= 80) return 'success'
      if (percentage >= 50) return 'warning'
      return 'exception'
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
    
    // 格式化结果详情
    const formatResultDetails = (details) => {
      if (!details) return '无详情'
      if (typeof details === 'string') {
        try {
          return JSON.stringify(JSON.parse(details), null, 2)
        } catch (e) {
          return details
        }
      }
      return JSON.stringify(details, null, 2)
    }
    
    // 计算运行时长
    const calculateDuration = () => {
      if (!execution.value.start_time) return '-'
      
      const startTime = new Date(execution.value.start_time)
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
    
    // 返回上一页
    const goBack = () => {
      router.go(-1)
    }
    
    // 生命周期钩子
    onMounted(() => {
      loadExecutionDetail()
      
      // 连接WebSocket
      connect()
    })
    
    onUnmounted(() => {
      // 取消订阅
      unsubscribe(`execution_${executionId.value}`)
      
      // 断开WebSocket连接
      disconnect()
    })
    
    return {
      executionId,
      execution,
      executionResult,
      testCase,
      loading,
      showJsonView,
      reExecuteDialogVisible,
      reExecuteForm,
      reExecuting,
      deleting,
      stopping,
      executionProgress,
      currentStep,
      executionLogs,
      isRunning,
      
      loadExecutionDetail,
      reExecute,
      confirmReExecute,
      viewTestCase,
      viewReport,
      deleteExecution,
      stopExecution,
      refreshResult,
      handleStepClick,
      toggleView,
      calculatePassPercentage,
      getProgressStatus,
      getStatusType,
      formatResultDetails,
      calculateDuration,
      getLogLevelClass,
      goBack
    }
  }
}
</script>

<style scoped>
.execution-detail {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.detail-card,
.result-card,
.steps-card,
.monitor-card {
  margin-bottom: 20px;
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

.progress-text {
  margin-left: 10px;
  font-weight: bold;
}

.result-details,
.stack-trace {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  max-height: 300px;
  overflow: auto;
}

.monitor-content {
  padding: 10px;
}

.progress-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-weight: bold;
  color: #666;
}

.info-item .value {
  color: #333;
}

.log-container {
  margin-top: 20px;
}

.log-container h4 {
  margin-bottom: 10px;
  color: #333;
}

.log-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.log-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-family: monospace;
  font-size: 12px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #999;
  margin-right: 10px;
  min-width: 80px;
  display: inline-block;
}

.log-level {
  font-weight: bold;
  margin-right: 10px;
  min-width: 50px;
  display: inline-block;
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
}

.el-descriptions {
  margin-top: 10px;
}

.el-descriptions-item {
  padding: 10px;
}
</style>