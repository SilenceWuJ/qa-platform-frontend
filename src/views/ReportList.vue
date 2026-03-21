<template>
  <div class="report-list">
    <h1>测试报告</h1>
    <el-button type="primary" @click="generateReport">生成报告</el-button>
    <el-table :data="reports" border style="width: 100%; margin-top: 20px;">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="execution_id" label="执行ID" width="100"></el-table-column>
      <el-table-column prop="total" label="总数" width="80"></el-table-column>
      <el-table-column prop="passed" label="通过" width="80"></el-table-column>
      <el-table-column prop="failed" label="失败" width="80"></el-table-column>
      <el-table-column prop="created_at" label="创建时间"></el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button size="small" @click="viewReport(scope.row.id)">查看</el-button>
          <el-button size="small" @click="exportReport(scope.row.id)">导出</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getReports, generateReport as generateReportApi, exportReport as exportReportApi } from '@/api/report'

const router = useRouter()
const reports = ref([])

const fetchReports = async () => {
  try {
    const res = await getReports()
    reports.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const generateReport = async () => {
  try {
    await generateReportApi()
    fetchReports()
  } catch (err) {
    console.error(err)
  }
}

const viewReport = (id) => {
  router.push({ name: 'ReportDetail', params: { id } })
}

const exportReport = async (id) => {
  try {
    await exportReportApi(id)
  } catch (err) {
    console.error(err)
  }
}

onMounted(fetchReports)
</script>

<style scoped>
.report-list {
  padding: 20px;
}
</style>
