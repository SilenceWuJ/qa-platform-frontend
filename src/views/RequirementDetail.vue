<template>
  <div class="requirement-detail">
    <h1>需求详情</h1>
    <el-form :model="requirement" label-width="100px" v-if="requirement">
      <el-form-item label="名称">
        <el-input v-model="requirement.name" :disabled="!editing"></el-input>
      </el-form-item>
      <el-form-item label="开始日期">
        <el-date-picker v-model="requirement.start_date" type="date" :disabled="!editing"></el-date-picker>
      </el-form-item>
      <el-form-item label="结束日期">
        <el-date-picker v-model="requirement.end_date" type="date" :disabled="!editing"></el-date-picker>
      </el-form-item>
      <el-form-item label="创建人">
        <el-input v-model="requirement.creator" :disabled="!editing"></el-input>
      </el-form-item>
      <el-form-item label="测试人">
        <el-input v-model="requirement.tester" :disabled="!editing"></el-input>
      </el-form-item>
      <el-form-item label="开发人">
        <el-input v-model="requirement.developer" :disabled="!editing"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button v-if="!editing" type="primary" @click="editing = true">编辑</el-button>
        <el-button v-else type="primary" @click="save">保存</el-button>
        <el-button v-if="editing" @click="cancel">取消</el-button>
        <el-button type="danger" @click="handleDelete">废除</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRequirement, updateRequirement, deleteRequirement } from '@/api/requirement'

const route = useRoute()
const router = useRouter()
const requirement = ref(null)
const editing = ref(false)

const fetchRequirement = async () => {
  const id = route.params.id
  try {
    const res = await getRequirement(id)
    requirement.value = res.data
  } catch (err) {
    ElMessage.error('获取需求失败')
  }
}

const save = async () => {
  try {
    await updateRequirement(route.params.id, requirement.value)
    ElMessage.success('保存成功')
    editing.value = false
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

const cancel = () => {
  editing.value = false
  fetchRequirement()
}

const handleDelete = async () => {
  ElMessageBox.confirm('确定废除该需求吗？', '提示', { type: 'warning' })
    .then(async () => {
      await deleteRequirement(route.params.id)
      ElMessage.success('已废除')
      router.push('/projects')
    })
    .catch(() => {})
}

onMounted(fetchRequirement)
</script>