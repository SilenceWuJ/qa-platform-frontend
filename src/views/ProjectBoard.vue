<template>
  <div class="project-board">
    <div class="board-header">
      <h1 class="board-title">项目看板</h1>
      <el-button type="primary" size="large" @click="showAddProjectDialog = true" class="add-project-btn">
        <el-icon><Plus /></el-icon>
        新建项目
      </el-button>
    </div>

    <el-row :gutter="24" class="project-grid">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="proj in projects" :key="proj.id">
        <el-card shadow="hover" class="project-card" @click="goToTestCases(proj.id)">
          <div class="card-header">
            <h3 class="project-title">{{ proj.name }}</h3>
            <el-tag 
              :type="getProgressTagType(proj.progress)" 
              size="small" 
              class="progress-tag"
            >
              {{ proj.progress || 0 }}%
            </el-tag>
          </div>
          
          <div class="project-meta">
            <div class="meta-item" v-if="proj.start_date">
              <el-icon><Calendar /></el-icon>
              <span>开始：{{ formatDate(proj.start_date) }}</span>
            </div>
            <div class="meta-item" v-if="proj.end_date">
              <el-icon><Calendar /></el-icon>
              <span>结束：{{ formatDate(proj.end_date) }}</span>
            </div>
            <div class="meta-item" v-if="!proj.start_date && !proj.end_date">
              <el-icon><InfoFilled /></el-icon>
              <span>未设置时间</span>
            </div>
          </div>

          <div class="progress-section">
            <el-progress 
              :percentage="proj.progress || 0" 
              :color="getProgressColor(proj.progress)"
              :stroke-width="8"
            />
          </div>

          <div class="card-footer">
            <el-button 
              type="primary" 
              link 
              size="small" 
              @click.stop="editProject(proj)"
              class="edit-btn"
            >
              <el-icon><Edit /></el-icon>
              编辑项目
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新建项目对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="showAddProjectDialog" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="projectForm" label-width="100px" label-position="right">
        <el-form-item label="项目名称" required>
          <el-input 
            v-model="projectForm.name" 
            placeholder="请输入项目名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="projectForm.start_date"
            type="date"
            placeholder="选择开始时间"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            clearable
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="projectForm.end_date"
            type="date"
            placeholder="选择结束时间"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            clearable
          />
        </el-form-item>
        <el-form-item label="项目进度">
          <div class="slider-wrapper">
            <el-slider 
              v-model="projectForm.progress" 
              :min="0" 
              :max="100" 
              :step="1"
              :format-tooltip="(val) => `${val}%`"
            />
            <span class="progress-value">{{ projectForm.progress }}%</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveProject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Calendar, Edit, InfoFilled } from '@element-plus/icons-vue'
import { getProjects, createProject, updateProject } from '@/api/project'

const router = useRouter()
const projects = ref([])
const showAddProjectDialog = ref(false)
const projectForm = ref({ id: null, name: '', start_date: '', end_date: '', progress: 0 })
const dialogTitle = ref('新建项目')

const fetchProjects = async () => {
  try {
    const res = await getProjects()
    projects.value = res.data || []
  } catch (err) {
    console.error('获取项目失败:', err)
    ElMessage.error('获取项目失败')
  }
}

const goToTestCases = (projectId) => {
  router.push({ name: 'TestCaseList', params: { projectId } })
}

const editProject = (proj) => {
  projectForm.value = {
    id: proj.id,
    name: proj.name,
    start_date: proj.start_date || '',
    end_date: proj.end_date || '',
    progress: proj.progress || 0
  }
  dialogTitle.value = '编辑项目'
  showAddProjectDialog.value = true
}

const saveProject = async () => {
  if (!projectForm.value.name || !projectForm.value.name.trim()) {
    ElMessage.warning('请输入项目名称')
    return
  }
  
  const formData = {
    ...projectForm.value,
    name: projectForm.value.name.trim()
  }
  
  try {
    if (projectForm.value.id) {
      await updateProject(projectForm.value.id, formData)
      ElMessage.success('更新成功')
    } else {
      await createProject(formData)
      ElMessage.success('创建成功')
    }
    closeDialog()
    await fetchProjects()
  } catch (err) {
    console.error('操作失败:', err)
    ElMessage.error('操作失败')
  }
}

const closeDialog = () => {
  showAddProjectDialog.value = false
  projectForm.value = { id: null, name: '', start_date: '', end_date: '', progress: 0 }
  dialogTitle.value = '新建项目'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const getProgressColor = (progress) => {
  const p = progress || 0
  if (p >= 80) return '#67C23A'
  if (p >= 60) return '#E6A23C'
  if (p >= 40) return '#F56C6C'
  return '#909399'
}

const getProgressTagType = (progress) => {
  const p = progress || 0
  if (p >= 80) return 'success'
  if (p >= 60) return 'warning'
  if (p >= 40) return 'danger'
  return 'info'
}

onMounted(fetchProjects)
</script>

<style scoped>
.project-board {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 0 8px;
}

.board-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  position: relative;
  padding-left: 16px;
}

.board-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  border-radius: 2px;
}

.add-project-btn {
  padding: 12px 24px;
  font-weight: 500;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.project-grid {
  margin-bottom: 24px;
}

.project-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.project-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  text-align: center;
  flex: 1;
}

.progress-tag {
  font-weight: 600;
}

.project-meta {
  margin-bottom: 20px;
  min-height: 70px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

.meta-item .el-icon {
  font-size: 14px;
  color: #909399;
}

.meta-item span {
  line-height: 1.4;
}

.progress-section {
  margin: 16px 0;
}

.progress-section :deep(.el-progress-bar__outer) {
  background-color: #edf2f7;
  border-radius: 10px;
}

.progress-section :deep(.el-progress-bar__inner) {
  border-radius: 10px;
  transition: width 0.3s ease;
}

.card-footer {
  margin-top: auto;
  padding-top: 12px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.edit-btn {
  font-size: 13px;
  padding: 4px 12px;
}

/* 对话框样式 */
.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.slider-wrapper .el-slider {
  flex: 1;
}

.progress-value {
  min-width: 45px;
  font-size: 14px;
  color: #409EFF;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-board {
    padding: 16px;
  }
  
  .board-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .board-title {
    font-size: 24px;
    text-align: center;
  }
  
  .board-title::before {
    display: none;
  }
  
  .add-project-btn {
    width: 100%;
  }
  
  .project-title {
    font-size: 16px;
  }
}

/* 卡片内容动画 */
.project-card :deep(.el-card__body) {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>