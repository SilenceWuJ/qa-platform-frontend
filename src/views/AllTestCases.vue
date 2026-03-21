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
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="viewResult(row.id)">结果</el-button>
          <el-button size="small" type="success" @click="viewReport(row.id)">报告</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTestCases } from '@/api/testcase'

const router = useRouter()
const testCases = ref([])

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

const viewResult = (id) => {
  // 可跳转到执行结果或报告
  router.push({ name: 'ReportDetail', params: { id } })
}
const viewReport = (id) => {
  router.push({ name: 'ReportDetail', params: { id } })
}

onMounted(fetchTestCases)
</script>