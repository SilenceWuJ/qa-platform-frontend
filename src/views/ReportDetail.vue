<template>
  <div class="report-detail">
    <h1>测试报告</h1>
    <div v-html="htmlContent" v-if="htmlContent"></div>
    <pre v-else>{{ textContent }}</pre>
    <el-button @click="exportHtml">导出HTML</el-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getReport, exportReport } from '@/api/report'

const route = useRoute()
const htmlContent = ref('')
const textContent = ref('')

const fetchReport = async () => {
  const id = route.params.id
  try {
    const res = await getReport(id)
    if (res.data.html_content) {
      htmlContent.value = res.data.html_content
    } else {
      textContent.value = res.data.content
    }
  } catch (err) {
    ElMessage.error('获取报告失败')
  }
}

const exportHtml = async () => {
  const id = route.params.id
  try {
    const res = await exportReport(id)
    const blob = new Blob([res.data], { type: 'text/html' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `report_${id}.html`
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (err) {
    ElMessage.error('导出失败')
  }
}

onMounted(fetchReport)
</script>