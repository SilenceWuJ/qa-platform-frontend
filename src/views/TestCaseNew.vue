<template>
  <div class="testcase-new">
    <h1>新增用例</h1>
    <el-form :model="form" label-width="100px">
      <el-form-item label="用例名称">
        <el-input v-model="form.name" placeholder="可选，不填则自动生成"></el-input>
      </el-form-item>
      <el-form-item label="描述">
        <el-input type="textarea" v-model="form.description" rows="3"></el-input>
      </el-form-item>
      <el-form-item label="步骤">
        <el-input type="textarea" v-model="form.steps" rows="5" placeholder="每步一行"></el-input>
      </el-form-item>
      <el-form-item label="预期结果">
        <el-input type="textarea" v-model="form.expected_result" rows="3"></el-input>
      </el-form-item>
      <el-form-item label="需求">
        <el-select v-model="form.requirement_id" placeholder="请选择" clearable>
          <el-option v-for="req in requirements" :key="req.id" :label="req.name" :value="req.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="测试阶段">
        <el-select v-model="form.test_phase_id" placeholder="请选择" clearable>
          <el-option v-for="phase in phases" :key="phase.id" :label="phase.name" :value="phase.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="测试类型">
        <el-select v-model="form.test_type_id" placeholder="请选择" clearable>
          <el-option v-for="type in types" :key="type.id" :label="type.name" :value="type.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="Mark标记">
        <el-select v-model="form.mark_id" placeholder="请选择" clearable>
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
        :on-progress="handleUploadProgress"
        :before-upload="beforeUpload"
        :limit="1"
        :file-list="fileList"
    >
        <template #trigger>
        <el-button type="primary">选择文件</el-button>
        </template>
        <template #file="{ file }">
        <div class="file-item">
            <el-icon class="el-icon-document"></el-icon>
            <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-size">{{ formatFileSize(file.size) }}</div>
            </div>
            <div class="file-actions" v-if="file.response">
            <el-button type="text" @click.stop="previewFileHandler(file)">预览</el-button>
            <el-button type="text" @click.stop="removeFile(file)">删除</el-button>
            </div>
        </div>
        </template>
    </el-upload>
    <el-progress v-if="uploading" :percentage="uploadProgress"></el-progress>
    <div class="upload-hint">支持图片、PDF、Word、Excel等格式，最大10MB</div>
    </el-form-item>

      <!-- 已上传文件列表 -->
      <el-divider v-if="uploadedFiles.length > 0">已上传附件</el-divider>
      <el-table :data="uploadedFiles" border style="width: 100%; margin-top: 20px;">
        <el-table-column prop="original_filename" label="文件名" width="200"></el-table-column>
        <el-table-column prop="file_size_formatted" label="大小" width="100"></el-table-column>
        <el-table-column prop="uploaded_at" label="上传时间" width="180"></el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="previewFile(scope.row)">预览</el-button>
            <el-button size="small" type="danger" @click="removeFile(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-form-item>
        <el-button type="primary" @click="submitForm">保存</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 文件预览弹窗 -->
    <el-dialog v-model="showPreviewDialog" title="文件预览" width="80%" top="5vh">
      <div class="preview-container" v-if="previewFile">
        <div class="preview-header">
          <span>{{ previewFile.original_filename }}</span>
          <el-button style="float: right" @click="showPreviewDialog = false">关闭</el-button>
        </div>
        <iframe :src="previewUrl" class="preview-frame" frameborder="0"></iframe>
      </div>
      <div v-else class="preview-placeholder">
        <el-icon name="Loading" size="40" class="is-loading"></el-icon>
        <p>加载中...</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createTestCase as createTestCaseApi } from '@/api/testcase'
import { getRequirements } from '@/api/requirement'
import { getProjects } from '@/api/project'
import { getTestPhases, getTestTypes } from '@/api/testcase'
import { getMarks } from '@/api/mark'
// import { uploadTempFile, downloadFile, deleteFile, previewFile as previewFileApi } from '@/api/file'
// 改为
import { uploadTempFile, downloadFile, deleteFile } from '@/api/file'
const route = useRoute()
const router = useRouter()
const projectId = route.params.projectId

const form = ref({
  name: '',
  description: '',
  steps: '',
  expected_result: '',
  requirement_id: null,
  test_phase_id: null,
  test_type_id: null,
  mark_id: null
})

const requirements = ref([])
const phases = ref([])
const types = ref([])
const marks = ref([])

const fileList = ref([])
const uploadedFiles = ref([])
const uploading = ref(false)
const uploadProgress = ref(0)
const showPreviewDialog = ref(false)
const previewFile = ref(null)
const previewUrl = ref('')

const fetchRequirements = async () => {
  const res = await getRequirements({ project_id: projectId })
  requirements.value = res.data
}

const beforeUpload = (file) => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过10MB')
    return false
  }
  return true
}

const handleFileChange = (file) => {
  fileList.value = [file]
}

const handleUploadProgress = (event) => {
  uploadProgress.value = Math.round(event.percent)
}

// const uploadFile = async (file) => {
//   uploading.value = true
//   uploadProgress.value = 0

//   const res = await uploadTempFile(file)
//   uploadedFiles.value = [...uploadedFiles.value, res.data]
//   ElMessage.success('文件上传成功')
//   uploading.value = false
//   uploadProgress.value = 0
// }

const removeFile = (file) => {
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
      uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== file.id)
      ElMessage.success('文件已删除')
    } catch (err) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const previewFileHandler = async (file) => {
  previewFile.value = file
  showPreviewDialog.value = true
  if (file.mime_type && file.mime_type.startsWith('image/')) {
    // 图片使用文件路径
    previewUrl.value = `/api/files/download/${file.id}?token=${Math.random()}`
  } else if (file.mime_type === 'application/pdf') {
    previewUrl.value = `/api/files/download/${file.id}?token=${Math.random()}`
  } else {
    // 其他文件类型，直接下载
    const blob = await downloadFile(file.id)
    const url = URL.createObjectURL(blob)
    previewUrl.value = url
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

const submitForm = async () => {
  if (!form.value.name) {
    ElMessage.warning('请输入用例名称')
    return
  }

  // Upload files first
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

  // Also include any previously uploaded files
  const existingFileIds = uploadedFiles.value.map(f => f.id)
  const allFileIds = [...existingFileIds, ...uploadedFileIds]

  const payload = {
    ...form.value,
    project_id: projectId,
    file_ids: allFileIds
  }

  try {
    await createTestCaseApi(payload)
    ElMessage.success('用例创建成功')
    router.push({ name: 'TestCaseList', params: { projectId } })
  } catch (err) {
    ElMessage.error('创建失败')
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    steps: '',
    expected_result: '',
    requirement_id: null,
    test_phase_id: null,
    test_type_id: null,
    mark_id: null
  }
  fileList.value = []
  uploadedFiles.value = []
}

onMounted(() => {
  fetchRequirements()
  getProjects().then(() => {
    // Just to populate if needed
  })
  getTestPhases().then(res => {
    phases.value = res.data
  })
  getTestTypes().then(res => {
    types.value = res.data
  })
  getMarks().then(res => {
    marks.value = res.data
  })
})
</script>

<style scoped>
.testcase-new {
  padding: 20px;
}
.file-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #e4e7fa;
  border-radius: 4px;
  background: #f5f7fa;
  margin-bottom: 10px;
}
.file-info {
  flex: 1;
  margin-left: 10px;
}
.file-name {
  font-weight: 500;
}
.file-size {
  color: #909399;
  font-size: 12px;
}
.file-actions {
  margin-left: auto;
}
.upload-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}
.preview-container {
  padding: 20px;
}
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  font-weight: bold;
}
.preview-frame {
  width: 100%;
  height: 60vh;
  border: 1px solid #e4e7fa;
  border-radius: 4px;
}
.preview-placeholder {
  text-align: center;
  padding: 40px;
  color: #909399;
}
.is-loading {
  animation: rotating 1s linear infinite;
}
</style>
