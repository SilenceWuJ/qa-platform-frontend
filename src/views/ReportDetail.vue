<template>
  <div class="report-detail">
    <!-- 页面头部 -->
    <div class="report-header">
      <h1 class="report-title">测试报告详情</h1>
      <div class="header-actions">
        <el-button type="primary" @click="exportHtml" :loading="exporting">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 报告内容区域 -->
    <div class="report-content-container">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>
      
      <div v-else-if="error" class="error-container">
        <el-empty description="加载报告失败" />
        <el-button @click="fetchReport">重试</el-button>
      </div>
      
      <div v-else class="report-content">
        <!-- HTML 内容显示 -->
        <div v-if="htmlContent" class="html-content-wrapper">
          <div class="content-header">
            <h3>HTML 报告内容</h3>
            <el-tag type="info">HTML 格式</el-tag>
            <div class="content-actions">
              <el-button size="small" @click="reloadIframe" :loading="reloading">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
              <el-button size="small" @click="openInNewTab">
                <el-icon><FullScreen /></el-icon>
                新窗口打开
              </el-button>
              <el-tooltip content="报告包含完整的HTML文档和JavaScript，在iframe中可正常执行" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </div>
          <div class="iframe-container">
            <iframe
              ref="reportIframe"
              :srcdoc="processedHtmlContent"
              class="report-iframe"
              title="测试报告"
              sandbox="allow-scripts allow-same-origin"
              @load="onIframeLoad"
              @error="onIframeError"
            ></iframe>
            <div v-if="iframeLoading" class="iframe-loading">
              <div class="loading-content">
                <el-skeleton :rows="5" animated />
                <p class="loading-text">正在加载测试报告...</p>
              </div>
            </div>
            <div v-if="iframeError" class="iframe-error">
              <el-empty description="报告加载失败" />
              <el-button @click="reloadIframe">重试</el-button>
            </div>
          </div>
        </div>
        
        <!-- 文本内容显示 -->
        <div v-else-if="textContent" class="text-content-wrapper">
          <div class="content-header">
            <h3>文本报告内容</h3>
            <el-tag type="info">文本格式</el-tag>
          </div>
          <pre class="text-content">{{ textContent }}</pre>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="empty-content">
          <el-empty description="报告内容为空" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElTooltip } from 'element-plus'
import { Download, Refresh, FullScreen, QuestionFilled } from '@element-plus/icons-vue'
import { getReport, exportReport } from '@/api/report'

const route = useRoute()
const htmlContent = ref('')
const textContent = ref('')
const loading = ref(false)
const exporting = ref(false)
const error = ref(false)
const iframeLoading = ref(true)
const iframeError = ref(false)
const reloading = ref(false)
const reportIframe = ref(null)

// 处理HTML内容，确保安全显示
const processedHtmlContent = computed(() => {
  if (!htmlContent.value) return ''
  
  let content = htmlContent.value
  
  // 移除可能引起问题的WebSocket重连脚本（可选）
  // 如果报告中的WebSocket脚本不影响显示，可以保留
  // content = content.replace(/<script>[\s\S]*?ws:\/\/[\s\S]*?<\/script>/gi, '')
  
  return content
})

const fetchReport = async () => {
  loading.value = true
  error.value = false
  iframeLoading.value = true
  iframeError.value = false
  const id = route.params.id
  
  try {
    const res = await getReport(id)
    console.log('Report API response:', res)
    
    if (res.data && res.data.html_content) {
      htmlContent.value = res.data.html_content
      console.log('HTML content length:', htmlContent.value.length)
      console.log('HTML content preview:', htmlContent.value.substring(0, 500))
    } else if (res.data && res.data.content) {
      textContent.value = res.data.content
      console.log('Text content length:', textContent.value.length)
    } else {
      console.warn('Report has no content')
      ElMessage.warning('报告内容为空')
    }
  } catch (err) {
    console.error('获取报告失败:', err)
    error.value = true
    ElMessage.error('获取报告失败')
  } finally {
    loading.value = false
  }
}

const exportHtml = async () => {
  const id = route.params.id
  exporting.value = true
  
  try {
    const res = await exportReport(id)
    const blob = new Blob([res.data], { type: 'text/html' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `report_${id}_${new Date().getTime()}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    
    ElMessage.success('报告导出成功')
  } catch (err) {
    console.error('导出失败:', err)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// Iframe 相关方法
const onIframeLoad = () => {
  console.log('Iframe loaded successfully')
  iframeLoading.value = false
  iframeError.value = false
  reloading.value = false
}

const onIframeError = () => {
  console.error('Iframe failed to load')
  iframeLoading.value = false
  iframeError.value = true
  reloading.value = false
  ElMessage.error('报告加载失败，请尝试刷新或在新窗口中打开')
}

const reloadIframe = () => {
  if (!reportIframe.value) return
  
  reloading.value = true
  iframeLoading.value = true
  iframeError.value = false
  
  // 强制重新加载 iframe
  const iframe = reportIframe.value
  const currentSrcDoc = iframe.srcdoc
  iframe.srcdoc = ''
  setTimeout(() => {
    iframe.srcdoc = currentSrcDoc
  }, 100)
}

const openInNewTab = () => {
  if (!htmlContent.value) return
  
  const blob = new Blob([htmlContent.value], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  
  // 清理 URL 对象
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

onMounted(fetchReport)
</script>

<style scoped>
.report-detail {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 页面头部样式 */
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.report-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 报告内容容器 */
.report-content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
}

.loading-container,
.error-container,
.empty-content {
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.error-container {
  gap: 20px;
}

/* 报告内容区域 */
.report-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 内容头部 */
.content-header {
  padding: 16px 24px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* HTML 内容包装器 */
.html-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.help-icon {
  color: #909399;
  cursor: help;
  margin-left: 4px;
}

.help-icon:hover {
  color: #409EFF;
}

/* Iframe 容器 */
.iframe-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #fff;
}

.report-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.iframe-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-content {
  width: 80%;
  max-width: 400px;
  text-align: center;
}

.loading-text {
  margin-top: 20px;
  color: #606266;
  font-size: 14px;
}

.iframe-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding: 40px;
}

/* 文本内容包装器 */
.text-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.text-content {
  flex: 1;
  padding: 24px;
  margin: 0;
  overflow: auto;
  background: #f6f8fa;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  border-radius: 0;
  border: none;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .report-detail {
    padding: 12px;
  }
  
  .report-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .html-content,
  .text-content {
    padding: 16px;
  }
}
</style>