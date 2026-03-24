<template>
  <div class="testcase-list">
    <h1>测试用例</h1>
    
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="showCreateDialog = true">新增用例</el-button>
    </div>

    <!-- 筛选条件 -->
    <div class="filters">
      <el-form inline>
        <el-form-item label="项目">
          <el-select v-model="filters.project_id" placeholder="全部" clearable @change="fetchTestCases">
            <el-option v-for="p in projects" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求">
          <el-select v-model="filters.requirement_id" placeholder="全部" clearable @change="fetchTestCases">
            <el-option v-for="r in requirements" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="测试阶段">
          <el-select v-model="filters.test_phase_id" placeholder="全部" clearable @change="fetchTestCases">
            <el-option v-for="p in phases" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="测试类型">
          <el-select v-model="filters.test_type_id" placeholder="全部" clearable @change="fetchTestCases">
            <el-option v-for="t in types" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Mark标记">
          <el-select v-model="filters.mark_id" placeholder="全部" clearable @change="fetchTestCases">
            <el-option v-for="m in marks" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchTestCases">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 测试用例表格 -->
    <el-table 
      :data="testCases" 
      border 
      stripe
      v-loading="loading"
      class="testcase-table"
    >
      <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
      <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip></el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip></el-table-column>
      <el-table-column prop="project_name" label="项目" width="120"></el-table-column>
      <el-table-column prop="requirement_name" label="需求" width="120"></el-table-column>
      <el-table-column prop="mark_name" label="Mark标记" width="100"></el-table-column>
      <el-table-column prop="test_phase_name" label="测试阶段" width="100"></el-table-column>
      <el-table-column prop="test_type_name" label="测试类型" width="100"></el-table-column>
      <el-table-column prop="latest_result_status" label="最新结果" width="100" align="center">
        <template #default="{ row }">
          <el-tag 
            :type="getResultTagType(row.latest_result_status)" 
            size="small"
          >
            {{ row.latest_result_status || '未执行' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="viewTestCaseDetail(row.id)">详情</el-button>
          <el-button size="small" type="primary" @click="viewResult(row.id)">结果</el-button>
          <el-button size="small" type="success" @click="viewReport(row.id)">报告</el-button>
          <el-button 
            size="small" 
            type="info" 
            @click="viewRequirement(row.requirement_id)"
            :disabled="!row.requirement_id"
          >
            需求
          </el-button>
          <el-button size="small" type="warning" @click="showFilesDialogHandler(row)">附件</el-button>
          <el-button size="small" type="danger" @click="executeTestCase(row.id)">执行</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建用例弹窗 -->
    <el-dialog v-model="showCreateDialog" title="新增测试用例" width="50%">
      <el-form :model="testCaseForm" label-width="100px">
        <el-form-item label="用例名称" required>
          <el-input v-model="testCaseForm.name" placeholder="请输入用例名称"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="testCaseForm.description" rows="3"></el-input>
        </el-form-item>
        <el-form-item label="步骤">
          <el-input type="textarea" v-model="testCaseForm.steps" rows="5" placeholder="每步一行"></el-input>
        </el-form-item>
        <el-form-item label="预期结果">
          <el-input type="textarea" v-model="testCaseForm.expected_result" rows="3"></el-input>
        </el-form-item>
        <el-form-item label="项目" required>
          <el-select v-model="testCaseForm.project_id" placeholder="请选择项目">
            <el-option v-for="proj in projects" :key="proj.id" :label="proj.name" :value="proj.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="需求">
          <el-select v-model="testCaseForm.requirement_id" placeholder="请选择需求" clearable>
            <el-option v-for="req in requirements" :key="req.id" :label="req.name" :value="req.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="测试阶段">
          <el-select v-model="testCaseForm.test_phase_id" placeholder="请选择测试阶段" clearable>
            <el-option v-for="phase in phases" :key="phase.id" :label="phase.name" :value="phase.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="测试类型" required>
          <el-select v-model="testCaseForm.test_type_id" placeholder="请选择测试类型">
            <el-option v-for="type in types" :key="type.id" :label="type.name" :value="type.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Mark标记">
          <el-select v-model="testCaseForm.mark_id" placeholder="请选择标记" clearable>
            <el-option v-for="mark in marks" :key="mark.id" :label="mark.name" :value="mark.id" />
          </el-select>
        </el-form-item>

        <!-- 文件上传 -->
        <el-form-item label="附件上传">
          <el-upload
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="true"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
            :limit="10"
            :file-list="fileList"
            :on-remove="handleRemoveFile"
          >
            <template #default>
              <el-button type="primary">选择文件</el-button>
            </template>
          </el-upload>
          <div class="upload-hint">支持图片、PDF、Word、Excel等格式，最大10MB</div>
        </el-form-item>

      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createTestCase">确定</el-button>
      </template>
    </el-dialog>

    <!-- 文件查看弹窗 -->
    <el-dialog v-model="showFilesDialog" title="附件列表" width="80%">
      <el-table :data="currentTestcaseFiles" border style="width: 100%">
        <el-table-column prop="filename" label="文件名"></el-table-column>
        <el-table-column prop="file_size_formatted" label="大小" width="100"></el-table-column>
        <el-table-column prop="uploaded_at" label="上传时间" width="180"></el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="viewFile(scope.row)">预览</el-button>
            <el-button size="small" @click="handleDownloadFile(scope.row)">下载</el-button>
            <el-button size="small" type="danger" @click="handleDeleteFile(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showFilesDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 文件预览弹窗 -->
    <el-dialog v-model="showPreviewDialog" title="文件预览" width="80%" top="5vh">
      <div class="preview-container">
        <iframe v-if="previewFile && previewFile.mime_type && previewFile.mime_type.startsWith('image/')" :src="previewUrl"></iframe>
        <div v-else-if="previewFile && previewFile.mime_type === 'application/pdf'" class="pdf-preview">
          <iframe :src="previewUrl"></iframe>
        </div>
      </div>
    </el-dialog>

    <!-- 执行进度弹窗 -->
    <ExecutionProgress ref="executionProgressRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTestCases, createTestCase as createTestCaseApi } from '@/api/testcase'
import { getProjects } from '@/api/project'
import { getRequirements } from '@/api/requirement'
import { getTestPhases, getTestTypes } from '@/api/testcase'
import { getMarks } from '@/api/mark'
import { getTestcaseFiles, downloadFile, deleteFile, uploadTempFile } from '@/api/file'
import ExecutionProgress from '@/components/ExecutionProgress.vue'
import io from 'socket.io-client'

const route = useRoute()
const router = useRouter()
const socket = io('http://localhost:5002')

const projects = ref([])
const requirements = ref([])
const phases = ref([])
const types = ref([])
const marks = ref([])
const testCases = ref([])
const loading = ref(false)

const filters = ref({
  project_id: route.params.projectId,
  requirement_id: null,
  test_phase_id: null,
  test_type_id: null,
  mark_id: null,
})

const showCreateDialog = ref(false)
const testCaseForm = ref({
  name: '',
  description: '',
  steps: '',
  expected_result: '',
  project_id: route.params.projectId || null,
  requirement_id: null,
  test_phase_id: null,
  test_type_id: null,
  mark_id: null
})

const fileList = ref([])
const showFilesDialog = ref(false)
const showPreviewDialog = ref(false)
const currentTestcaseId = ref(null)
const currentTestcaseFiles = ref([])
const previewFile = ref(null)
const previewUrl = ref('')

const executionProgressRef = ref()

// 根据结果状态返回对应的标签类型
const getResultTagType = (status) => {
  if (!status) return 'info'
  
  const typeMap = {
    '通过': 'success',
    '失败': 'danger',
    '阻塞': 'warning',
    '跳过': 'info',
    '未执行': 'info',
    'passed': 'success',
    'failed': 'danger',
    'blocked': 'warning',
    'skipped': 'info'
  }
  return typeMap[status] || 'info'
}

const fetchTestCases = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.value.project_id) params.project_id = filters.value.project_id
    if (filters.value.requirement_id) params.requirement_id = filters.value.requirement_id
    if (filters.value.test_phase_id) params.test_phase_id = filters.value.test_phase_id
    if (filters.value.test_type_id) params.test_type_id = filters.value.test_type_id
    if (filters.value.mark_id) params.mark_id = filters.value.mark_id
    const res = await getTestCases(params)
    
    // 格式化数据，确保所有字段都有值
    testCases.value = (res.data || []).map(item => ({
      ...item,
      project_name: item.project_name || item.project?.name || '-',
      requirement_name: item.requirement_name || item.requirement?.name || '-',
      mark_name: item.mark_name || item.mark?.name || '-',
      test_phase_name: item.test_phase_name || item.test_phase?.name || '-',
      test_type_name: item.test_type_name || item.test_type?.name || '-',
      latest_result_status: item.latest_result_status || '未执行'
    }))
  } catch (err) {
    ElMessage.error('获取用例失败')
    console.error('获取用例失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchProjects = async () => {
  const res = await getProjects()
  projects.value = res.data
}

const fetchRequirements = async () => {
  const res = await getRequirements()
  requirements.value = res.data
}

const fetchPhases = async () => {
  try {
    const res = await getTestPhases()
    phases.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const fetchTypes = async () => {
  try {
    const res = await getTestTypes()
    types.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const fetchMarks = async () => {
  try {
    const res = await getMarks()
    marks.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const beforeUpload = () => {
  fileList.value = []
}

const handleFileChange = (file, fileList) => {
  fileList.value = fileList
}

const handleRemoveFile = (file, fileList) => {
  fileList.value = fileList
}

const showFilesDialogHandler = async (tc) => {
  currentTestcaseId.value = tc.id
  try {
    const res = await getTestcaseFiles(tc.id)
    currentTestcaseFiles.value = res.data
    showFilesDialog.value = true
  } catch (err) {
    ElMessage.error('获取文件列表失败')
  }
}

const viewFile = (file) => {
  if (file.mime_type && file.mime_type.startsWith('image/')) {
    // 图片使用文件路径
    previewUrl.value = `/api/files/download/${file.id}?token=${Math.random()}`
  } else if (file.mime_type === 'application/pdf') {
    previewFile.value = file
    previewUrl.value = `/api/files/download/${file.id}?token=${Math.random()}`
  } else {
    ElMessage.warning('此文件类型不支持预览')
  }
  showPreviewDialog.value = true
}

const handleDownloadFile = async (file) => {
  try {
    const blob = await downloadFile(file.id)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.original_filename
    document.body.appendChild(link)
    link.click()
    setTimeout(() => document.body.removeChild(link), 100)
  } catch (err) {
    ElMessage.error('下载失败')
  }
}

const handleDeleteFile = async (file) => {
  ElMessageBox.confirm(
    '确定要删除此文件吗？',
    '删除文件',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteFile(file.id)
      currentTestcaseFiles.value = currentTestcaseFiles.value.filter(f => f.id !== file.id)
      ElMessage.success('文件已删除')
    } catch (err) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const resetFilters = () => {
  filters.value = {
    project_id: route.params.projectId,
    requirement_id: null,
    test_phase_id: null,
    test_type_id: null,
    mark_id: null,
  }
  fetchTestCases()
}

const viewTestCaseDetail = (testcaseId) => {
  router.push({ name: 'TestCaseDetail', params: { id: testcaseId } })
}

const viewResult = (testcaseId) => {
  router.push({ name: 'ReportDetail', params: { id: testcaseId } })
}

const viewReport = (testcaseId) => {
  router.push({ name: 'ReportDetail', params: { id: testcaseId } })
}

const viewRequirement = (reqId) => {
  if (reqId) {
    router.push({ name: 'RequirementDetail', params: { id: reqId } })
  } else {
    ElMessage.warning('该用例未关联需求')
  }
}

const executeTestCase = (testcaseId) => {
  executionProgressRef.value.show()
  socket.emit('start_execution', { testcase_id: testcaseId, room: `exec_${testcaseId}` })
}

const createTestCase = async () => {
  if (!testCaseForm.value.name) {
    ElMessage.warning('请输入用例名称')
    return
  }
  if (!testCaseForm.value.project_id) {
    ElMessage.warning('请选择项目')
    return
  }
  if (!testCaseForm.value.test_type_id) {
    ElMessage.warning('请选择测试类型')
    return
  }
  try {
    // 上传文件
    const uploadedFileIds = []
    for (const fileItem of fileList.value) {
      try {
        const file = fileItem.raw
        const res = await uploadTempFile(file)
        uploadedFileIds.push(res.data.id)
      } catch (err) {
        ElMessage.error(`文件 ${fileItem.name} 上传失败`)
        return
      }
    }

    const payload = {
      ...testCaseForm.value,
      file_ids: uploadedFileIds
    }
    await createTestCaseApi(payload)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    resetTestCaseForm()
    fetchTestCases()
  } catch (err) {
    ElMessage.error('创建失败')
  }
}

const resetTestCaseForm = () => {
  testCaseForm.value = {
    name: '',
    description: '',
    steps: '',
    expected_result: '',
    project_id: route.params.projectId || null,
    requirement_id: null,
    test_phase_id: null,
    test_type_id: null,
    mark_id: null
  }
  fileList.value = []
}

onMounted(() => {
  fetchProjects()
  fetchRequirements()
  fetchPhases()
  fetchTypes()
  fetchMarks()
  fetchTestCases()
  socket.on('execution_started', (data) => {
    executionProgressRef.value.setExecutionId(data.execution_id)
  })
  socket.on('execution_progress', (data) => {
    executionProgressRef.value.updateProgress(data)
  })
  socket.on('execution_finished', (data) => {
    executionProgressRef.value.finish(data)
    fetchTestCases()
  })
})

onBeforeUnmount(() => {
  socket.off('execution_started')
  socket.off('execution_progress')
  socket.off('execution_finished')
})
</script>

<style scoped>
.testcase-list {
  padding: 20px;
}

.action-bar {
  margin-bottom: 20px;
}

.filters {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.testcase-table {
  margin-top: 20px;
}

.upload-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

/* 操作按钮间距 */
.el-button + .el-button {
  margin-left: 8px;
}

/* 表格样式优化 */
:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table__header) {
  background-color: #f5f7fa;
}

:deep(.el-table__row) {
  height: 60px;
}

/* 操作列按钮样式 */
:deep(.el-table__cell .el-button) {
  margin: 2px;
  padding: 5px 8px;
  font-size: 12px;
}
</style>