<template>
  <div class="test-steps-display">
    <!-- 标题 -->
    <div class="steps-header">
      <h3 class="steps-title">
        <el-icon><List /></el-icon>
        测试步骤
      </h3>
      <div class="steps-actions">
        <el-button v-if="editable" type="primary" size="small" @click="editSteps">
          <el-icon><Edit /></el-icon>
          编辑步骤
        </el-button>
        <el-button v-if="showJson" type="info" size="small" @click="toggleJsonView">
          <el-icon><Code /></el-icon>
          {{ showRawJson ? "可视化" : "JSON" }}视图
        </el-button>
      </div>
    </div>

    <!-- JSON视图 -->
    <div v-if="showJson && showRawJson" class="json-view">
      <div class="json-header">
        <span class="json-title">JSON格式数据</span>
        <el-button type="text" size="small" @click="copyJson">
          <el-icon><CopyDocument /></el-icon>
          复制JSON
        </el-button>
      </div>
      <pre class="json-content">{{ formattedJson }}</pre>
    </div>

    <!-- 可视化视图 -->
    <div v-else class="steps-container">
      <!-- 空状态 -->
      <div v-if="!hasSteps" class="empty-steps">
        <el-empty description="暂无测试步骤" :image-size="100">
          <template #description>
            <p>还没有添加测试步骤</p>
            <el-button v-if="editable" type="primary" @click="editSteps">
              添加测试步骤
            </el-button>
          </template>
        </el-empty>
      </div>

      <!-- 步骤列表 -->
      <div v-else class="steps-list">
        <div v-for="(step, index) in parsedSteps" :key="index" class="step-item">
          <!-- 步骤头部 -->
          <div class="step-header" :class="getStepStatusClass(step)">
            <div class="step-number">
              <span class="number-circle">{{ step.step || index + 1 }}</span>
              <span class="step-status" :class="getStepStatusClass(step)">
                {{ getStepStatusText(step) }}
              </span>
            </div>
            <div class="step-actions" v-if="editable">
              <el-button type="text" size="small" @click="editStep(index)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button type="text" size="small" @click="removeStep(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- 步骤内容 -->
          <div class="step-content">
            <div class="step-description">
              <strong>描述:</strong> {{ step.description || "未设置描述" }}
            </div>

            <!-- 预期结果 -->
            <div v-if="step.expected" class="step-expected">
              <div class="section-title">
                <el-icon><Check /></el-icon>
                <span>预期结果</span>
              </div>
              <div class="section-content">{{ step.expected }}</div>
            </div>

            <!-- 实际结果 -->
            <div v-if="step.actual" class="step-actual">
              <div class="section-title">
                <el-icon><Document /></el-icon>
                <span>实际结果</span>
              </div>
              <div class="section-content">{{ step.actual }}</div>
            </div>

            <!-- 附加数据 -->
            <div v-if="step.data && Object.keys(step.data).length > 0" class="step-data">
              <div class="section-title">
                <el-icon><DataLine /></el-icon>
                <span>测试数据</span>
              </div>
              <div class="data-grid">
                <div v-for="(value, key) in step.data" :key="key" class="data-item">
                  <span class="data-key">{{ key }}:</span>
                  <span class="data-value">{{ value }}</span>
                </div>
              </div>
            </div>

            <!-- 执行信息 -->
            <div v-if="executionResult && executionResult.steps" class="step-execution">
              <div class="section-title">
                <el-icon><Clock /></el-icon>
                <span>执行信息</span>
              </div>
              <div class="execution-info">
                <div v-if="executionResult.steps[index]">
                  <span>状态: </span>
                  <el-tag :type="getResultTagType(executionResult.steps[index].status)" size="small">
                    {{ getStepStatusText(executionResult.steps[index]) }}
                  </el-tag>
                  <span v-if="executionResult.steps[index].message" class="execution-message">
                    {{ executionResult.steps[index].message }}
                  </span>
                  <span v-if="executionResult.steps[index].timestamp" class="execution-time">
                    {{ formatTime(executionResult.steps[index].timestamp) }}
                  </span>
                </div>
                <div v-else>未执行</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div v-if="showStats && hasSteps" class="steps-stats">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-item total">
              <div class="stat-value">{{ parsedSteps.length }}</div>
              <div class="stat-label">总步骤数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item pending">
              <div class="stat-value">{{ pendingSteps }}</div>
              <div class="stat-label">待执行</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item passed">
              <div class="stat-value">{{ passedSteps }}</div>
              <div class="stat-label">已通过</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item failed">
              <div class="stat-value">{{ failedSteps }}</div>
              <div class="stat-label">已失败</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 步骤编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editingStepIndex === null ? '添加测试步骤' : '编辑测试步骤'"
      width="600px"
      @close="cancelEdit"
    >
      <el-form :model="editingStep" label-width="80px">
        <el-form-item label="步骤编号">
          <el-input-number
            v-model="editingStep.step"
            :min="1"
            :max="parsedSteps.length + 1"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="步骤描述" required>
          <el-input
            v-model="editingStep.description"
            type="textarea"
            :rows="3"
            placeholder="请输入步骤描述"
          />
        </el-form-item>
        <el-form-item label="预期结果">
          <el-input
            v-model="editingStep.expected"
            type="textarea"
            :rows="2"
            placeholder="请输入预期结果"
          />
        </el-form-item>
        <el-form-item label="测试数据">
          <div class="data-editor">
            <div v-for="(value, key, index) in editingStep.data" :key="key" class="data-row">
              <el-input
                v-model="editingStep.dataKeys[index]"
                placeholder="键名"
                style="width: 40%; margin-right: 10px"
              />
              <el-input
                v-model="editingStep.dataValues[index]"
                placeholder="值"
                style="width: 40%; margin-right: 10px"
              />
              <el-button type="danger" plain @click="removeDataField(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" plain @click="addDataField">
              <el-icon><Plus /></el-icon>
              添加数据字段
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="初始状态">
          <el-select v-model="editingStep.status" placeholder="请选择状态">
            <el-option label="待执行" value="pending" />
            <el-option label="通过" value="passed" />
            <el-option label="失败" value="failed" />
            <el-option label="跳过" value="skipped" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="primary" @click="saveStep">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/* eslint-disable no-undef */
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  List,
  Edit,
  Code,
  CopyDocument,
  Check,
  Document,
  DataLine,
  Clock,
  Delete,
  Plus
} from '@element-plus/icons-vue'

const props = defineProps({
  // 测试步骤数据（可以是JSON字符串或数组）
  steps: {
    type: [String, Array],
    default: () => []
  },
  // 执行结果数据
  executionResult: {
    type: Object,
    default: null
  },
  // 是否可编辑
  editable: {
    type: Boolean,
    default: false
  },
  // 是否显示JSON视图切换
  showJson: {
    type: Boolean,
    default: true
  },
  // 是否显示统计信息
  showStats: {
    type: Boolean,
    default: true
  },
  // 步骤变更事件
  onChange: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['update:steps', 'change'])

// 响应式数据
const showRawJson = ref(false)
const editDialogVisible = ref(false)
const editingStepIndex = ref(null)
const editingStep = ref({
  step: 1,
  description: '',
  expected: '',
  actual: '',
  status: 'pending',
  data: {},
  dataKeys: [],
  dataValues: []
})

// 计算属性
const parsedSteps = computed(() => {
  if (!props.steps) return []
  
  if (Array.isArray(props.steps)) {
    return props.steps
  }
  
  try {
    const parsed = JSON.parse(props.steps)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('解析测试步骤失败:', error)
    // 如果是普通文本，转换为简单步骤
    if (typeof props.steps === 'string' && props.steps.trim()) {
      return [{
        step: 1,
        description: props.steps,
        expected: '',
        actual: '',
        status: 'pending',
        data: {}
      }]
    }
    return []
  }
})

const hasSteps = computed(() => {
  return parsedSteps.value.length > 0
})

const formattedJson = computed(() => {
  return JSON.stringify(parsedSteps.value, null, 2)
})

const pendingSteps = computed(() => {
  return parsedSteps.value.filter(step => step.status === 'pending').length
})

const passedSteps = computed(() => {
  return parsedSteps.value.filter(step => step.status === 'passed').length
})

const failedSteps = computed(() => {
  return parsedSteps.value.filter(step => step.status === 'failed').length
})

// 方法
const toggleJsonView = () => {
  showRawJson.value = !showRawJson.value
}

const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    ElMessage.success('JSON已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

const getStepStatusClass = (step) => {
  switch (step.status) {
    case 'passed': return 'status-passed'
    case 'failed': return 'status-failed'
    case 'skipped': return 'status-skipped'
    default: return 'status-pending'
  }
}

const getStepStatusText = (step) => {
  const statusMap = {
    'pending': '待执行',
    'passed': '通过',
    'failed': '失败',
    'skipped': '跳过'
  }
  return statusMap[step.status] || '未知'
}

const getResultTagType = (status) => {
  switch (status) {
    case 'passed': return 'success'
    case 'failed': return 'danger'
    case 'skipped': return 'warning'
    default: return 'info'
  }
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  try {
    const date = new Date(timeString)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return timeString
  }
}

const editSteps = () => {
  if (!props.editable) return
  editingStepIndex.value = null
  editingStep.value = {
    step: parsedSteps.value.length + 1,
    description: '',
    expected: '',
    actual: '',
    status: 'pending',
    data: {},
    dataKeys: [],
    dataValues: []
  }
  editDialogVisible.value = true
}

const editStep = (index) => {
  if (!props.editable) return
  
  const step = parsedSteps.value[index]
  editingStepIndex.value = index
  editingStep.value = {
    step: step.step || index + 1,
    description: step.description || '',
    expected: step.expected || '',
    actual: step.actual || '',
    status: step.status || 'pending',
    data: { ...step.data },
    dataKeys: Object.keys(step.data || {}),
    dataValues: Object.values(step.data || {})
  }
  editDialogVisible.value = true
}

const removeStep = async (index) => {
  if (!props.editable) return
  
  try {
    await ElMessageBox.confirm(
      '确定要删除这个测试步骤吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const newSteps = [...parsedSteps.value]
    newSteps.splice(index, 1)
    
    // 重新编号
    newSteps.forEach((step, idx) => {
      step.step = idx + 1
    })
    
    updateSteps(newSteps)
    ElMessage.success('步骤删除成功')
  } catch {
    // 用户取消删除
  }
}

const addDataField = () => {
  editingStep.value.dataKeys.push('')
  editingStep.value.dataValues.push('')
}

const removeDataField = (index) => {
  editingStep.value.dataKeys.splice(index, 1)
  editingStep.value.dataValues.splice(index, 1)
}

const saveStep = () => {
  if (!editingStep.value.description.trim()) {
    ElMessage.warning('请填写步骤描述')
    return
  }
  
  // 重建data对象
  const data = {}
  editingStep.value.dataKeys.forEach((key, index) => {
    if (key.trim()) {
      data[key.trim()] = editingStep.value.dataValues[index] || ''
    }
  })
  editingStep.value.data = data
  
  const newSteps = [...parsedSteps.value]
  
  if (editingStepIndex.value === null) {
    // 添加新步骤
    newSteps.push({ ...editingStep.value })
  } else {
    // 更新现有步骤
    newSteps[editingStepIndex.value] = { ...editingStep.value }
  }
  
  // 按步骤编号排序
  newSteps.sort((a, b) => (a.step || 0) - (b.step || 0))
  
  updateSteps(newSteps)
  editDialogVisible.value = false
  ElMessage.success('步骤保存成功')
}

const cancelEdit = () => {
  editDialogVisible.value = false
  editingStepIndex.value = null
}

const updateSteps = (newSteps) => {
  const jsonString = JSON.stringify(newSteps, null, 2)
  
  // 触发更新事件
  if (props.onChange) {
    props.onChange(newSteps, jsonString)
  }
  
  emit('update:steps', jsonString)
  emit('change', newSteps, jsonString)
}

// 监听步骤数据变化
watch(() => props.steps, () => {
  // 可以在这里添加额外的处理逻辑
}, { deep: true })

// 初始化
onMounted(() => {
  // 可以在这里添加初始化逻辑
})
</script>

<style scoped>
.test-steps-display {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e4e7ed;
}

.steps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.steps-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.steps-actions {
  display: flex;
  gap: 10px;
}

/* JSON视图 */
.json-view {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  border: 1px solid #e9ecef;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.json-title {
  font-weight: 600;
  color: #495057;
}

.json-content {
  margin: 0;
  padding: 15px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

/* 步骤列表 */
.empty-steps {
  padding: 40px 0;
  text-align: center;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.step-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.step-header.status-passed {
  background: #f0f9eb;
  border-color: #e1f3d8;
}

.step-header.status-failed {
  background: #fef0f0;
  border-color: #fde2e2;
}

.step-header.status-skipped {
  background: #fdf6ec;
  border-color: #faecd8;
}

.step-header.status-pending {
  background: #f4f4f5;
  border-color: #e9e9eb;
}

.step-number {
  display: flex;
  align-items: center;
  gap: 12px;
}

.number-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.step-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.step-status.status-passed {
  background: #67c23a;
  color: white;
}

.step-status.status-failed {
  background: #f56c6c;
  color: white;
}

.step-status.status-skipped {
  background: #e6a23c;
  color: white;
}

.step-status.status-pending {
  background: #909399;
  color: white;
}

.step-actions {
  display: flex;
  gap: 4px;
}

.step-content {
  padding: 16px;
}

.step-description {
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

.step-description strong {
  color: #303133;
  margin-right: 8px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 12px 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: #909399;
}

.section-content {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.5;
  color: #606266;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  background: white;
  border-radius: 3px;
  border: 1px solid #e4e7ed;
}

.data-key {
  font-weight: 500;
  color: #409eff;
}

.data-value {
  color: #67c23a;
  font-family: monospace;
}

.execution-info {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 13px;
}

.execution-message {
  margin-left: 12px;
  color: #606266;
}

.execution-time {
  margin-left: 12px;
  color: #909399;
  font-size: 12px;
}

/* 统计信息 */
.steps-stats {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.stat-item {
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  background: #f8f9fa;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-item.total .stat-value {
  color: #409eff;
}

.stat-item.pending .stat-value {
  color: #909399;
}

.stat-item.passed .stat-value {
  color: #67c23a;
}

.stat-item.failed .stat-value {
  color: #f56c6c;
}

/* 数据编辑器 */
.data-editor {
  width: 100%;
}

.data-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .steps-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .steps-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .data-grid {
    grid-template-columns: 1fr;
  }
  
  .steps-stats .el-col {
    margin-bottom: 10px;
  }
}
</style>