<template>
  <div class="execution-list">
    <h1>执行记录</h1>
    <el-button type="primary" @click="showNewExecution = true">新建执行</el-button>
    <el-table :data="executions" border style="width: 100%; margin-top: 20px;">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="project_name" label="项目" width="150"></el-table-column>
      <el-table-column prop="status" label="状态" width="100"></el-table-column>
      <el-table-column prop="created_at" label="创建时间"></el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button size="small" @click="viewExecution(scope.row.id)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="新建执行" v-model="showNewExecution" width="40%">
      <el-form>
        <el-form-item label="项目">
          <el-select v-model="newExecution.projectId" placeholder="选择项目">
            <el-option v-for="proj in projects" :key="proj.id" :label="proj.name" :value="proj.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNewExecution = false">取消</el-button>
        <el-button type="primary" @click="createExecution">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getExecutions, createExecution as createExecApi } from '@/api/execution'
import { getProjects } from '@/api/project'

const executions = ref([])
const projects = ref([])
const showNewExecution = ref(false)
const newExecution = ref({ projectId: null })

const fetchExecutions = async () => {
  try {
    const res = await getExecutions()
    executions.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const fetchProjects = async () => {
  try {
    const res = await getProjects()
    projects.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const createExecution = async () => {
  try {
    await createExecApi({ project_id: newExecution.value.projectId })
    showNewExecution.value = false
    fetchExecutions()
  } catch (err) {
    console.error(err)
  }
}

const viewExecution = (id) => {
  console.log('View execution', id)
}

onMounted(() => {
  fetchExecutions()
  fetchProjects()
})
</script>

<style scoped>
.execution-list {
  padding: 20px;
}
</style>
