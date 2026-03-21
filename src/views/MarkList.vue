<template>
  <div class="mark-list">
    <h1>标记管理</h1>
    <el-button type="primary" @click="showCreateDialog = true" style="margin-bottom: 20px;">新增标记</el-button>
    <el-table :data="marks" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="name" label="名称" width="200"></el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button size="small" @click="editMark(scope.row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建/编辑标记弹窗 -->
    <el-dialog v-model="showCreateDialog" :title="dialogTitle" width="40%">
      <el-form :model="markForm" label-width="100px">
        <el-form-item label="标记名称" required>
          <el-input v-model="markForm.name" placeholder="请输入标记名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMark">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMarks, createMark, updateMark } from '@/api/mark'

const marks = ref([])
const showCreateDialog = ref(false)
const dialogTitle = ref('新增标记')
const markForm = ref({ id: null, name: '' })

const fetchMarks = async () => {
  try {
    const res = await getMarks()
    marks.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const saveMark = async () => {
  if (!markForm.value.name) {
    ElMessage.warning('请输入标记名称')
    return
  }
  try {
    if (markForm.value.id) {
      await updateMark(markForm.value.id, { name: markForm.value.name })
      ElMessage.success('更新成功')
    } else {
      await createMark({ name: markForm.value.name })
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    resetMarkForm()
    fetchMarks()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

const editMark = (mark) => {
  markForm.value = { id: mark.id, name: mark.name }
  dialogTitle.value = '编辑标记'
  showCreateDialog.value = true
}

const resetMarkForm = () => {
  markForm.value = { id: null, name: '' }
  dialogTitle.value = '新增标记'
}

onMounted(fetchMarks)
</script>

<style scoped>
.mark-list {
  padding: 20px;
}
</style>
