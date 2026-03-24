<template>
  <div>
    <h1>Mark集</h1>
    <el-button type="primary" @click="dialogVisible = true; form = { id: null, name: '' }">新增</el-button>
    <el-table :data="marks" border style="margin-top: 20px;">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="name" label="名称"></el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" @click="editMark(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="新增/编辑标记" v-model="dialogVisible" width="30%">
      <el-input v-model="form.name" placeholder="标记名称"></el-input>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMark">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMarks, createMark, updateMark, deleteMark } from '@/api/mark'

const marks = ref([])
const dialogVisible = ref(false)
const form = ref({ id: null, name: '' })

const fetchMarks = async () => {
  const res = await getMarks()
  marks.value = res.data
}

const editMark = (row) => {
  form.value = { id: row.id, name: row.name }
  dialogVisible.value = true
}

const saveMark = async () => {
  if (!form.value.name) {
    ElMessage.warning('请输入名称')
    return
  }
  try {
    if (form.value.id) {
      await updateMark(form.value.id, { name: form.value.name })
      ElMessage.success('更新成功')
    } else {
      await createMark({ name: form.value.name })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchMarks()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定删除该标记吗？', '提示', { type: 'warning' }).then(async () => {
    await deleteMark(id)
    ElMessage.success('删除成功')
    fetchMarks()
  }).catch(() => {})
}

onMounted(fetchMarks)
</script>