<template>
  <div class="dashboard">
    <!-- 页面标题 -->
    <div class="dashboard-header">
      <h1 class="dashboard-title">测试数据看板</h1>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="exportData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <!-- 项目统计 -->
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon project-icon">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.projects?.total || 0 }}</div>
              <div class="stat-label">项目总数</div>
              <div class="stat-subtext">平均进度: {{ stats.projects?.avg_progress || 0 }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 测试用例统计 -->
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon testcase-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.testcases?.total || 0 }}</div>
              <div class="stat-label">测试用例</div>
              <div class="stat-subtext">活跃: {{ stats.testcases?.active || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 测试执行统计 -->
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon execution-icon">
              <el-icon><DataLine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.executions?.total_runs || 0 }}</div>
              <div class="stat-label">测试执行</div>
              <div class="stat-subtext">成功率: {{ stats.executions?.success_rate || 0 }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 测试报告统计 -->
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon report-icon">
              <el-icon><PieChart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalReports || 0 }}</div>
              <div class="stat-label">测试报告</div>
              <div class="stat-subtext">通过: {{ stats.reports?.passed || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="main-content">
      <!-- 左侧：最近活动和项目进度 -->
      <el-col :xs="24" :lg="16">
        <!-- 最近活动 -->
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">
                <el-icon><Clock /></el-icon>
                最近活动
              </h3>
            </div>
          </template>
          <div class="recent-activities">
            <div v-if="recentActivities.length === 0" class="empty-state">
              <el-empty description="暂无活动记录" />
            </div>
            <div v-else class="activity-list">
              <div v-for="activity in recentActivities" :key="activity.id || activity.created_at" class="activity-item">
                <div class="activity-icon" :class="activity.type">
                  <el-icon v-if="activity.type === 'test_run'"><DataLine /></el-icon>
                  <el-icon v-else><Document /></el-icon>
                </div>
                <div class="activity-content">
                  <div class="activity-title">
                    <span class="project-name">{{ activity.project_name }}</span>
                    <span class="activity-desc">{{ activity.description }}</span>
                  </div>
                  <div class="activity-meta">
                    <span class="activity-time">{{ formatTime(activity.created_at) }}</span>
                    <span class="activity-path">{{ activity.test_path }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 测试执行记录 -->
        <el-card shadow="hover" class="section-card mt-20">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">
                <el-icon><Histogram /></el-icon>
                测试执行记录
              </h3>
              <el-button type="primary" link @click="viewAllTestRuns">查看全部</el-button>
            </div>
          </template>
          <el-table :data="testRuns" style="width: 100%" v-loading="loading">
            <el-table-column prop="project_name" label="项目" width="150" />
            <el-table-column prop="test_path" label="测试路径" show-overflow-tooltip />
            <el-table-column label="结果" width="120">
              <template #default="{ row }">
                <el-tag :type="getResultType(row)">
                  {{ row.passed }}/{{ row.total_tests }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="success_rate" label="成功率" width="100">
              <template #default="{ row }">
                {{ row.success_rate }}%
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="耗时(秒)" width="100" />
            <el-table-column prop="created_at" label="时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右侧：项目进度和报告统计 -->
      <el-col :xs="24" :lg="8">
        <!-- 项目进度排名 -->
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">
                <el-icon><TrendCharts /></el-icon>
                项目进度排名
              </h3>
            </div>
          </template>
          <div class="project-progress">
            <div v-if="projectProgress.length === 0" class="empty-state">
              <el-empty description="暂无项目数据" />
            </div>
            <div v-else class="progress-list">
              <div v-for="project in projectProgress" :key="project.name" class="progress-item">
                <div class="project-info">
                  <div class="project-name">{{ project.name }}</div>
                  <div class="project-progress-value">{{ project.progress }}%</div>
                </div>
                <el-progress 
                  :percentage="project.progress" 
                  :color="getProgressColor(project.progress)"
                  :stroke-width="8"
                />
              </div>
            </div>
          </div>
        </el-card>

        <!-- 测试报告状态 -->
        <el-card shadow="hover" class="section-card mt-20">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">
                <el-icon><PieChart /></el-icon>
                测试报告状态
              </h3>
            </div>
          </template>
          <div class="report-status">
            <div v-if="Object.keys(reportStatus).length === 0" class="empty-state">
              <el-empty description="暂无报告数据" />
            </div>
            <div v-else class="status-chart">
              <div v-for="(count, status) in reportStatus" :key="status" class="status-item">
                <div class="status-label">
                  <span class="status-dot" :class="status"></span>
                  {{ getStatusText(status) }}
                </div>
                <div class="status-count">{{ count }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 系统状态 -->
        <el-card shadow="hover" class="section-card mt-20">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">
                <el-icon><Monitor /></el-icon>
                系统状态
              </h3>
            </div>
          </template>
          <div class="system-status">
            <div class="status-item">
              <span class="status-label">数据库连接</span>
              <el-tag type="success" size="small">正常</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">API服务</span>
              <el-tag type="success" size="small">正常</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">最后更新</span>
              <span class="status-value">{{ lastUpdateTime }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  getDashboardStats
} from '@/api/dashboard'
import { 
  Refresh, 
  Download, 
  OfficeBuilding, 
  Document, 
  DataLine, 
  PieChart, 
  Clock, 
  Histogram, 
  TrendCharts, 
  Monitor 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const stats = ref({})
const lastUpdateTime = ref('')

// 计算属性
const recentActivities = computed(() => {
  return stats.value.recent_activities || []
})

const projectProgress = computed(() => {
  return stats.value.project_progress || []
})

const reportStatus = computed(() => {
  return stats.value.reports || {}
})

const totalReports = computed(() => {
  return Object.values(reportStatus.value).reduce((sum, count) => sum + count, 0)
})

// 将recent_activities转换为testRuns格式用于显示
const testRuns = computed(() => {
  const activities = stats.value.recent_activities || []
  return activities.filter(a => a.type === 'test_run').map(activity => {
    // 从描述中提取测试结果，格式如 "23/25 通过"
    const match = activity.description.match(/(\d+)\/(\d+)\s*(.*)/)
    const passed = match ? parseInt(match[1]) : 0
    const total = match ? parseInt(match[2]) : 0
    const success_rate = total > 0 ? Math.round((passed / total) * 100) : 0

    return {
      project_name: activity.project_name,
      test_path: activity.test_path,
      success_rate,
      passed,
      total_tests: total,
      duration: 0,
      created_at: activity.created_at
    }
  })
})

// 生命周期
onMounted(() => {
  loadDashboardData()
})

// 方法
const loadDashboardData = async () => {
  loading.value = true
  try {
    // 加载统计信息
    const response = await getDashboardStats()
    console.log('Dashboard API Response:', response)
    
    // The dashboard API returns {code: 200, data: {...}, message: "成功"}
    // getDashboardStats() returns the axios response, so response.data is the API response
    if (response && response.data) {
      const apiResponse = response.data
      console.log('API Response data:', apiResponse)
      
      if (apiResponse.code === 200 && apiResponse.data) {
        stats.value = apiResponse.data
        console.log('Dashboard stats set:', stats.value)
      } else {
        console.error('Dashboard API returned error or missing data:', apiResponse)
        stats.value = {}
      }
    } else {
      console.error('Invalid API response structure:', response)
      stats.value = {}
    }
    
    console.log('Dashboard stats value:', stats.value)
    console.log('Projects total:', stats.value.projects?.total)
    console.log('Testcases total:', stats.value.testcases?.total)
    console.log('Executions total_runs:', stats.value.executions?.total_runs)
    console.log('Reports:', stats.value.reports)

    // 更新最后更新时间
    lastUpdateTime.value = new Date().toLocaleString('zh-CN')

    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('加载看板数据失败:', error)
    ElMessage.error('数据加载失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadDashboardData()
}

const exportData = () => {
  ElMessage.info('导出功能开发中...')
}

const viewAllTestRuns = () => {
  router.push('/executions')
}

const formatTime = (timeString) => {
  if (!timeString) return ''
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getResultType = (row) => {
  if (row.success_rate >= 90) return 'success'
  if (row.success_rate >= 70) return 'warning'
  return 'danger'
}

const getProgressColor = (progress) => {
  if (progress >= 80) return '#67C23A'
  if (progress >= 50) return '#E6A23C'
  return '#F56C6C'
}

const getStatusText = (status) => {
  const statusMap = {
    'passed': '通过',
    'failed': '失败',
    'skipped': '跳过',
    'error': '错误'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dashboard-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计卡片样式 */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.project-icon {
  background: linear-gradient(135deg, #409EFF, #337ecc);
}

.testcase-icon {
  background: linear-gradient(135deg, #67C23A, #529b2e);
}

.execution-icon {
  background: linear-gradient(135deg, #E6A23C, #c68a34);
}

.report-icon {
  background: linear-gradient(135deg, #F56C6C, #d95454);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-subtext {
  font-size: 12px;
  color: #909399;
}

/* 主要内容区域 */
.main-content {
  margin-top: 20px;
}

.section-card {
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 最近活动 */
.recent-activities {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.activity-icon.test_run {
  background-color: #ecf5ff;
  color: #409EFF;
}

.activity-icon.testcase {
  background-color: #f0f9eb;
  color: #67C23A;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.project-name {
  font-weight: 600;
  color: #303133;
}

.activity-desc {
  color: #606266;
  font-size: 14px;
}

.activity-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.activity-path {
  flex: 1;
  text-align: right;
  margin-left: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 项目进度 */
.progress-item {
  margin-bottom: 16px;
}

.progress-item:last-child {
  margin-bottom: 0;
}

.project-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.project-name {
  font-weight: 500;
  color: #303133;
}

.project-progress-value {
  font-weight: 600;
  color: #409EFF;
}

/* 报告状态 */
.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.passed {
  background-color: #67C23A;
}

.status-dot.failed {
  background-color: #F56C6C;
}

.status-dot.skipped {
  background-color: #909399;
}

.status-dot.error {
  background-color: #E6A23C;
}

.status-count {
  font-weight: 600;
  color: #303133;
}

/* 系统状态 */
.system-status {
  padding: 8px 0;
}

.system-status .status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.system-status .status-label {
  font-size: 14px;
  color: #606266;
}

.system-status .status-value {
  font-size: 14px;
  color: #909399;
}

/* 空状态 */
.empty-state {
  padding: 40px 0;
  text-align: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .activity-meta {
    flex-direction: column;
    gap: 4px;
  }
  
  .activity-path {
    text-align: left;
    margin-left: 0;
  }
}
</style>