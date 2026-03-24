<template>
  <div>
    <h1>用例集</h1>
    <el-table :data="testCases" border stripe>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="name" label="名称" min-width="150"></el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip></el-table-column>
      <el-table-column prop="project_name" label="项目" width="120"></el-table-column>
      <el-table-column prop="mark_name" label="Mark标记" width="100"></el-table-column>
      <el-table-column prop="test_phase_name" label="测试阶段" width="100"></el-table-column>
      <el-table-column prop="test_type_name" label="测试类型" width="100"></el-table-column>
      <el-table-column prop="latest_result_status" label="最新结果" width="100">
        <template #default="{ row }">
          <el-tag 
            :type="getResultTagType(row.latest_result_status)" 
            size="small"
          >
            {{ row.latest_result_status || '未执行' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="350" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row.id)">详情</el-button>
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTestCases } from '@/api/testcase'
import { getTestcaseFiles, downloadFile, deleteFile } from '@/api/file'
import ExecutionProgress from '@/components/ExecutionProgress.vue'
import io from 'socket.io-client'

const router = useRouter()
const testCases = ref([])
const socket = io('http://localhost:5002')

// 文件相关变量
const showFilesDialog = ref(false)
const showPreviewDialog = ref(false)
const currentTestcaseId = ref(null)
const currentTestcaseFiles = ref([])
const previewFile = ref(null)
const previewUrl = ref('')

const executionProgressRef = ref()

// 根据结果状态返回对应的标签类型
// 注意：这个函数需要在 script setup 中定义，会自动暴露给模板
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
  try {
    const res = await getTestCases()
    // 确保数据格式正确
    testCases.value = (res.data || []).map(item => ({
      ...item,
      project_name: item.project_name || item.project?.name || '-',
      mark_name: item.mark_name || item.mark?.name || '-',
      test_phase_name: item.test_phase_name || item.test_phase?.name || '-',
      test_type_name: item.test_type_name || item.test_type?.name || '-',
      latest_result_status: item.latest_result_status || '未执行'
    }))
  } catch (err) {
    console.error('获取用例列表失败:', err)
    ElMessage.error('获取用例列表失败')
  }
}

const viewDetail = (id) => {
  router.push({ name: 'TestCaseDetail', params: { id } })
}

const viewResult = (id) => {
  // 可跳转到执行结果或报告
  router.push({ name: 'ReportDetail', params: { id } })
}
const viewReport = (id) => {
  router.push({ name: 'ReportDetail', params: { id } })
}

const viewRequirement = (reqId) => {
  if (reqId) {
    router.push({ name: 'RequirementDetail', params: { id: reqId } })
  } else {
    ElMessage.warning('该用例未关联需求')
  }
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

const executeTestCase = (testcaseId) => {
  executionProgressRef.value.show()
  socket.emit('start_execution', { testcase_id: testcaseId, room: `exec_${testcaseId}` })
}

onMounted(() => {
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

.preview-container {
  height: 70vh;
}

.preview-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.pdf-preview {
  height: 100%;
}
</style>