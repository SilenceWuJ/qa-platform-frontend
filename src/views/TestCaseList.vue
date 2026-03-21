<template>
    <div class="testcase-list"></div>
    <h1>测试用例</h1>
    <el-button type="primary" @click="showCreateDialog = true" style="margin-bottom: 20px;">新增用例</el-button>
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
    <el-row :gutter="20">
      <el-col :span="8" v-for="tc in testCases" :key="tc.id">
        <el-card shadow="hover" class="testcase-card">
          <template #header>
            <div class="card-header">
              <span>{{ tc.name }}</span>
              <el-tag :type="getResultType(tc.latest_result_status)">{{ tc.latest_result_status || '未执行' }}</el-tag>
              <div class="card-header-right">
                <el-button size="small" @click="showFilesDialogHandler(tc)">附件</el-button>
              </div>
            </div>
          </template>
          <div class="card-content">
            <p><strong>类型：</strong>{{ getTypeName(tc.test_type_id) }}</p>
            <p><strong>阶段：</strong>{{ getPhaseName(tc.test_phase_id) }}</p>
            <p><strong>标记：</strong>{{ getMarkName(tc.mark_id) }}</p>
            <p><strong>需求：</strong>{{ getRequirementName(tc.requirement_id) }}</p>
          </div>
          <template #footer>
            <div class="card-actions">
              <el-button size="small" @click="viewResult(tc.id)">结果</el-button>
              <el-button size="small" @click="viewReport(tc.id)">报告</el-button>
              <el-button size="small" @click="viewRequirement(tc.requirement_id)">需求</el-button>
              <el-button size="small" type="primary" @click="executeTestCase(tc.id)">执行</el-button>
            </div>
          </template>
        </el-card>
      </el-col>
    </el-row>

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
  project_id: null,
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

const fetchTestCases = async () => {
  try {
    const params = {}
    if (filters.value.project_id) params.project_id = filters.value.project_id
    if (filters.value.requirement_id) params.requirement_id = filters.value.requirement_id
    if (filters.value.test_phase_id) params.test_phase_id = filters.value.test_phase_id
    if (filters.value.test_type_id) params.test_type_id = filters.value.test_type_id
    if (filters.value.mark_id) params.mark_id = filters.value.mark_id
    const res = await getTestCases(params)
    testCases.value = res.data
  } catch (err) {
    ElMessage.error('获取用例失败')
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

const getTypeName = (id) => types.value.find(t => t.id === id)?.name || '-'
const getPhaseName = (id) => phases.value.find(p => p.id === id)?.name || '-'
const getMarkName = (id) => marks.value.find(m => m.id === id)?.name || '-'
const getRequirementName = (id) => requirements.value.find(r => r.id === id)?.name || '-'
const getResultType = (status) => {
  if (status === 'passed') return 'success'
  if (status === 'failed') return 'danger'
  return 'info'
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
.filters {
  margin-bottom: 20px;
}
.testcase-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header-right {
  display: flex;
}
.card-content p {
  margin: 5px 0;
}
.card-actions {
  display: flex;
  justify-content: space-between;
}
.upload-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}
</style>
