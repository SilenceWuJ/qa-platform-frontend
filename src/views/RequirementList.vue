<!-- <template>
  <div>
    <h1>需求列表</h1>
    <el-table :data="requirements" border>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="name" label="名称"></el-table-column>
      <el-table-column prop="start_date" label="开始日期"></el-table-column>
      <el-table-column prop="end_date" label="结束日期"></el-table-column>
      <el-table-column prop="creator" label="创建人"></el-table-column>
      <el-table-column prop="tester" label="测试人"></el-table-column>
      <el-table-column prop="developer" label="开发人"></el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row.id)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getRequirements } from '@/api/requirement'

const router = useRouter()
const requirements = ref([])

const fetchRequirements = async () => {
  try {
    const res = await getRequirements()
    requirements.value = res.data
  } catch (err) {
    ElMessage.error('获取需求列表失败')
  }
}

const viewDetail = (id) => {
  router.push({ name: 'RequirementDetail', params: { id } })
}

onMounted(fetchRequirements)
</script> -->

<template>
  <div>
    <h1>需求列表</h1>
    <el-table :data="requirements" border stripe>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="name" label="名称" min-width="200" show-overflow-tooltip></el-table-column>
      <el-table-column prop="start_date" label="开始日期" width="120"></el-table-column>
      <el-table-column prop="end_date" label="结束日期" width="120"></el-table-column>
      <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
      <el-table-column prop="tester" label="测试人" width="100"></el-table-column>
      <el-table-column prop="developer" label="开发人" width="100"></el-table-column>
      <el-table-column label="附件" width="120">
        <template #default="{ row }">
          <div v-if="row.files && row.files.length > 0">
            <el-button 
              size="small" 
              type="primary" 
              link 
              @click="showAttachments(row.files)"
            >
              <el-icon><Paperclip /></el-icon>
              查看附件 ({{ row.files.length }})
            </el-button>
          </div>
          <span v-else class="no-attachment">无附件</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="viewDetail(row.id)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 附件查看对话框 -->
    <el-dialog 
      v-model="attachmentDialogVisible" 
      title="附件列表" 
      width="600px"
      :close-on-click-modal="false"
    >
      <el-table :data="currentAttachments" border stripe>
        <el-table-column prop="filename" label="文件名" min-width="250">
          <template #default="{ row }">
            <el-link type="primary" @click="downloadAttachment(row)">
              <el-icon><Document /></el-icon>
              {{ row.filename }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="file_size" label="文件大小" width="120">
          <template #default="{ row }">
            {{ formatFileSize(row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="downloadAttachment(row)">
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="attachmentDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Paperclip, Document } from '@element-plus/icons-vue'
import { getRequirements, downloadFile } from '@/api/requirement'

const router = useRouter()
const requirements = ref([])
const attachmentDialogVisible = ref(false)
const currentAttachments = ref([])

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '-'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 显示附件列表
const showAttachments = (files) => {
  currentAttachments.value = files
  attachmentDialogVisible.value = true
}

// 下载附件
const downloadAttachment = async (file) => {
  try {
    const res = await downloadFile(file.id)
    // 创建 Blob 对象并下载
    const blob = new Blob([res.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch (err) {
    console.error('下载失败:', err)
    ElMessage.error('下载失败')
  }
}

const fetchRequirements = async () => {
  try {
    const res = await getRequirements()
    requirements.value = (res.data || []).map(item => ({
      ...item,
      // 格式化日期显示
      start_date: item.start_date ? formatDate(item.start_date) : '-',
      end_date: item.end_date ? formatDate(item.end_date) : '-',
      // 确保 files 是数组
      files: item.files || []
    }))
  } catch (err) {
    console.error('获取需求列表失败:', err)
    ElMessage.error('获取需求列表失败')
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const viewDetail = (id) => {
  router.push({ name: 'RequirementDetail', params: { id } })
}

onMounted(fetchRequirements)
</script>

<style scoped>
.no-attachment {
  color: #909399;
  font-size: 12px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table__header th) {
  background-color: #f5f7fa;
  font-weight: 600;
}

:deep(.el-link) {
  font-size: 13px;
}

:deep(.el-dialog__body) {
  padding: 20px;
}
</style>