<template>
  <el-dialog title="测试执行中" v-model="visible" width="500px" :close-on-click-modal="false" :close-on-press-escape="false">
    <div v-if="executionId">
      <el-progress :percentage="progress" :status="status"></el-progress>
      <el-timeline>
        <el-timeline-item v-for="(log, idx) in logs" :key="idx" :timestamp="log.time" :type="log.type">
          {{ log.message }}
        </el-timeline-item>
      </el-timeline>
    </div>
    <template #footer>
      <el-button @click="close">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
/* eslint-disable no-undef */
// ... 代码
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const visible = ref(false)
const executionId = ref(null)
const progress = ref(0)
const logs = ref([])
const status = ref('')

const show = () => {
  visible.value = true
  executionId.value = null
  progress.value = 0
  logs.value = []
  status.value = ''
}

const setExecutionId = (id) => {
  executionId.value = id
}

const updateProgress = (data) => {
  progress.value = data.progress
  logs.value.push({
    time: new Date().toLocaleTimeString(),
    type: data.success ? 'success' : 'danger',
    message: data.log
  })
}

const finish = (data) => {
  status.value = data.status === 'passed' ? 'success' : 'exception'
  progress.value = 100
  ElMessage.success(`执行完成，状态：${data.status === 'passed' ? '通过' : '失败'}`)
  setTimeout(() => {
    close()
  }, 2000)
}

const close = () => {
  visible.value = false
}

defineExpose({ show, setExecutionId, updateProgress, finish })
</script>