<template>
  <div>
    <h1>报告集</h1>
    <el-table :data="reports" border>
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="execution_id" label="执行ID"></el-table-column>
      <el-table-column prop="created_at" label="创建时间"></el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row.id)">查看报告</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getReports } from '@/api/report'

const router = useRouter()
const reports = ref([])

const fetchReports = async () => {
  try {
    const res = await getReports()
    reports.value = res.data
  } catch (err) {
    ElMessage.error('获取报告列表失败')
  }
}

const viewDetail = (id) => {
  router.push({ name: 'ReportDetail', params: { id } })
}

onMounted(fetchReports)
</script>