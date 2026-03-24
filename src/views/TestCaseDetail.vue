<template>
  <div class="test-case-detail">
    <el-page-header @back="goBack" content="测试用例详情" class="page-header">
      <template #extra>
        <el-button-group>
          <el-button type="primary" @click="editTestCase" v-if="!editing">编辑</el-button>
          <el-button type="success" @click="saveTestCase" v-if="editing" :loading="saving">保存</el-button>
          <el-button @click="cancelEdit" v-if="editing">取消</el-button>
          <el-button type="danger" @click="deleteTestCase" :loading="deleting">删除</el-button>
          <el-button type="warning" @click="executeTestCase">执行测试</el-button>
          <el-button @click="viewExecutionRecords">查看执行记录</el-button>
        </el-button-group>
      </template>
    </el-page-header>

    <el-card class="detail-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>

      <el-form :model="testCase" label-width="120px" v-if="testCase">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用例名称">
              <el-input v-model="testCase.name" :disabled="!editing" placeholder="请输入用例名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属项目">
              <el-input v-model="testCase.project_name" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="需求">
              <el-input v-model="testCase.requirement_name" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="测试阶段">
              <el-input v-model="testCase.test_phase_name" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="测试类型">
              <el-input v-model="testCase.test_type_name" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标记">
              <el-input v-model="testCase.mark_name" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述">
          <el-input
            v-model="testCase.description"
            type="textarea"
            :rows="3"
            :disabled="!editing"
            placeholder="请输入用例描述"
          />
        </el-form-item>

        <el-form-item label="预期结果">
          <el-input
            v-model="testCase.expected_result"
            type="textarea"
            :rows="3"
            :disabled="!editing"
            placeholder="请输入预期结果"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 测试步骤显示组件 -->
    <el-card class="steps-card" v-if="testCase">
      <template #header>
        <div class="card-header">
          <span>测试步骤</span>
          <div class="header-actions">
            <el-switch
              v-model="showJsonView"
              active-text="JSON视图"
              inactive-text="可视化视图"
              @change="toggleView"
            />
            <el-button type="primary" size="small" @click="addStep" v-if="editing">
              添加步骤
            </el-button>
          </div>
        </div>
      </template>

      <TestStepsDisplay
        :steps="testCase.steps"
        :executionResult="executionResult"
        :editable="editing"
        :showJson="showJsonView"
        :showStats="true"
        @update:steps="handleStepsUpdate"
        @step-updated="handleStepUpdated"
        @step-deleted="handleStepDeleted"
        @step-added="handleStepAdded"
      />
    </el-card>

    <!-- 关联文件 -->
    <el-card class="files-card" v-if="testCase && testCase.files && testCase.files.length > 0">
      <template #header>
        <div class="card-header">
          <span>关联文件</span>
        </div>
      </template>
      <el-table :data="testCase.files" border style="width: 100%">
        <el-table-column prop="filename" label="文件名" />
        <el-table-column prop="file_size" label="文件大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="text" @click="downloadFile(row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 执行记录 -->
    <el-card class="executions-card">
      <template #header>
        <div class="card-header">
          <span>执行记录</span>
          <el-button type="primary" size="small" @click="loadExecutionRecords">
            刷新
          </el-button>
        </div>
      </template>
      
      <el-table :data="executionRecords" border style="width: 100%" v-loading="loadingExecutions">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180" />
        <el-table-column prop="end_time" label="结束时间" width="180" />
        <el-table-column prop="duration" label="耗时" width="100">
          <template #default="{ row }">
            {{ row.duration ? row.duration + 's' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="executor" label="执行人" width="120" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="text" @click="viewExecutionDetail(row)">详情</el-button>
            <el-button type="text" @click="viewExecutionReport(row)" v-if="row.report_id">报告</el-button>
            <el-button type="text" @click="reExecute(row)" v-if="row.status === 'failed'">重试</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 执行测试对话框 -->
    <el-dialog
      v-model="executeDialogVisible"
      title="执行测试用例"
      width="500px"
      :before-close="handleExecuteDialogClose"
    >
      <el-form :model="executeForm" label-width="100px">
        <el-form-item label="执行人">
          <el-input v-model="executeForm.executor" placeholder="请输入执行人姓名" />
        </el-form-item>
        <el-form-item label="环境">
          <el-select v-model="executeForm.environment" placeholder="请选择测试环境">
            <el-option label="开发环境" value="dev" />
            <el-option label="测试环境" value="test" />
            <el-option label="预发布环境" value="staging" />
            <el-option label="生产环境" value="production" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="executeForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入执行备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="executeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmExecute" :loading="executing">
            开始执行
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import TestStepsDisplay from '@/components/TestStepsDisplay.vue'
import { getTestCase, updateTestCase, deleteTestCase as deleteTestCaseApi } from '@/api/testcase'
import { getExecutionRecords } from '@/api/execution.js'
import { createExecution } from '@/api/execution'
import { downloadFile } from '@/api/file'
import { useWebSocket } from '@/utils/websocket'

export default {
  name: 'TestCaseDetail',
  components: {
    TestStepsDisplay
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const testCaseId = ref(parseInt(route.params.id))
    const testCase = ref(null)
    const loading = ref(false)
    const editing = ref(false)
    const saving = ref(false)
    const deleting = ref(false)
    const showJsonView = ref(false)
    
    const executionResult = ref(null)
    const executionRecords = ref([])
    const loadingExecutions = ref(false)
    
    const executeDialogVisible = ref(false)
    const executeForm = ref({
      executor: '',
      environment: 'test',
      notes: ''
    })
    const executing = ref(false)
    
    // WebSocket连接
    const { connect, disconnect, subscribe, unsubscribe } = useWebSocket()
    
    // 加载测试用例详情
    const loadTestCase = async () => {
      loading.value = true
      try {
        const response = await getTestCase(testCaseId.value)
        if (response.data) {
          testCase.value = response.data
          
          // 确保steps是数组格式
          if (testCase.value.steps && typeof testCase.value.steps === 'string') {
            try {
              testCase.value.steps = JSON.parse(testCase.value.steps)
            } catch (e) {
              console.error('解析测试步骤失败:', e)
              testCase.value.steps = []
            }
          }
        } else {
          ElMessage.error('测试用例不存在')
          router.push('/testcases')
        }
      } catch (error) {
        console.error('加载测试用例失败:', error)
        ElMessage.error('加载测试用例失败')
      } finally {
        loading.value = false
      }
    }
    
    // 加载执行记录
    const loadExecutionRecords = async () => {
      loadingExecutions.value = true
      try {
        const response = await getExecutionRecords({ testcase_id: testCaseId.value })
        executionRecords.value = response.data || []
      } catch (error) {
        console.error('加载执行记录失败:', error)
        ElMessage.error('加载执行记录失败')
      } finally {
        loadingExecutions.value = false
      }
    }
    
    // 编辑测试用例
    const editTestCase = () => {
      editing.value = true
    }
    
    // 保存测试用例
    const saveTestCase = async () => {
      saving.value = true
      try {
        const updateData = {
          name: testCase.value.name,
          description: testCase.value.description,
          steps: testCase.value.steps, // 已经是JSON格式
          expected_result: testCase.value.expected_result
        }
        
        await updateTestCase(testCaseId.value, updateData)
        ElMessage.success('测试用例更新成功')
        editing.value = false
      } catch (error) {
        console.error('更新测试用例失败:', error)
        ElMessage.error('更新测试用例失败')
      } finally {
        saving.value = false
      }
    }
    
    // 取消编辑
    const cancelEdit = () => {
      editing.value = false
      loadTestCase() // 重新加载原始数据
    }
    
    // 删除测试用例
    const deleteTestCase = async () => {
      try {
        await ElMessageBox.confirm(
          '确定要删除这个测试用例吗？此操作不可恢复。',
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        deleting.value = true
        await deleteTestCaseApi(testCaseId.value)
        ElMessage.success('测试用例删除成功')
        router.push('/testcases')
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除测试用例失败:', error)
          ElMessage.error('删除测试用例失败')
        }
      } finally {
        deleting.value = false
      }
    }
    
    // 执行测试用例
    const executeTestCase = () => {
      executeDialogVisible.value = true
    }
    
    // 确认执行
    const confirmExecute = async () => {
      if (!executeForm.value.executor) {
        ElMessage.warning('请输入执行人')
        return
      }
      
      executing.value = true
      try {
        const executionData = {
          testcase_id: testCaseId.value,
          executor: executeForm.value.executor,
          environment: executeForm.value.environment,
          notes: executeForm.value.notes
        }
        
        const response = await createExecution(executionData)
        ElMessage.success('测试执行已开始')
        executeDialogVisible.value = false
        executeForm.value = { executor: '', environment: 'test', notes: '' }
        
        // 订阅执行进度
        subscribeToExecution(response.data.id)
        
        // 刷新执行记录
        loadExecutionRecords()
      } catch (error) {
        console.error('开始执行失败:', error)
        ElMessage.error('开始执行失败')
      } finally {
        executing.value = false
      }
    }
    
    // 订阅执行进度
    const subscribeToExecution = (executionId) => {
      subscribe(`execution_${executionId}`, (data) => {
        if (data.type === 'progress') {
          executionResult.value = data.result
          ElMessage.info(`执行进度: ${data.progress}%`)
        } else if (data.type === 'completed') {
          ElMessage.success('测试执行完成')
          unsubscribe(`execution_${executionId}`)
          loadExecutionRecords()
        } else if (data.type === 'failed') {
          ElMessage.error('测试执行失败')
          unsubscribe(`execution_${executionId}`)
          loadExecutionRecords()
        }
      })
    }
    
    // 查看执行记录
    const viewExecutionRecords = () => {
      router.push(`/executions?testcase_id=${testCaseId.value}`)
    }
    
    // 查看执行详情
    const viewExecutionDetail = (execution) => {
      router.push(`/executions/${execution.id}`)
    }
    
    // 查看执行报告
    const viewExecutionReport = (execution) => {
      if (execution.report_id) {
        router.push(`/reports/${execution.report_id}`)
      }
    }
    
    // 重新执行
    const reExecute = (execution) => {
      executeForm.value.executor = execution.executor
      executeForm.value.environment = execution.environment
      executeDialogVisible.value = true
    }
    
    // 处理步骤更新
    const handleStepsUpdate = (newSteps) => {
      testCase.value.steps = newSteps
    }
    
    // 处理步骤事件
    const handleStepUpdated = (step) => {
      console.log('步骤更新:', step)
    }
    
    const handleStepDeleted = (stepIndex) => {
      console.log('步骤删除:', stepIndex)
    }
    
    const handleStepAdded = (step) => {
      console.log('步骤添加:', step)
    }
    
    // 添加步骤
    const addStep = () => {
      if (!testCase.value.steps) {
        testCase.value.steps = []
      }
      
      const newStep = {
        step: testCase.value.steps.length + 1,
        description: '',
        expected: '',
        actual: '',
        status: 'pending',
        data: {}
      }
      
      testCase.value.steps.push(newStep)
    }
    
    // 切换视图
    const toggleView = () => {
      // 视图切换逻辑已在组件内部处理
    }
    
    // 下载文件
    const downloadFileHandler = async (file) => {
      try {
        await downloadFile(file.id, file.filename)
      } catch (error) {
        console.error('下载文件失败:', error)
        ElMessage.error('下载文件失败')
      }
    }
    
    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
    
    // 返回上一页
    const goBack = () => {
      router.go(-1)
    }
    
    // 处理执行对话框关闭
    const handleExecuteDialogClose = (done) => {
      ElMessageBox.confirm('确定要取消执行吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        done()
      }).catch(() => {
        // 取消关闭
      })
    }
    
    // 生命周期钩子
    onMounted(() => {
      loadTestCase()
      loadExecutionRecords()
      
      // 连接WebSocket
      connect()
      
      // 订阅测试用例更新
      subscribe(`testcase_${testCaseId.value}`, (data) => {
        if (data.type === 'updated') {
          ElMessage.info('测试用例已更新')
          loadTestCase()
        }
      })
    })
    
    onUnmounted(() => {
      // 取消订阅
      unsubscribe(`testcase_${testCaseId.value}`)
      
      // 断开WebSocket连接
      disconnect()
    })
    
    return {
      testCaseId,
      testCase,
      loading,
      editing,
      saving,
      deleting,
      showJsonView,
      executionResult,
      executionRecords,
      loadingExecutions,
      executeDialogVisible,
      executeForm,
      executing,
      
      loadTestCase,
      loadExecutionRecords,
      editTestCase,
      saveTestCase,
      cancelEdit,
      deleteTestCase,
      executeTestCase,
      confirmExecute,
      viewExecutionRecords,
      viewExecutionDetail,
      viewExecutionReport,
      reExecute,
      handleStepsUpdate,
      handleStepUpdated,
      handleStepDeleted,
      handleStepAdded,
      addStep,
      toggleView,
      downloadFile: downloadFileHandler,
      formatFileSize,
      getStatusType,
      goBack,
      handleExecuteDialogClose
    }
  }
}
</script>

<style scoped>
.test-case-detail {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.detail-card,
.steps-card,
.files-card,
.executions-card {
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

.el-form-item {
  margin-bottom: 18px;
}

.el-row {
  margin-bottom: 0;
}

.el-col {
  margin-bottom: 0;
}
</style>