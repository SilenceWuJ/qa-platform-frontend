<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="sidebar">
      <el-menu 
        :default-active="activeMenu" 
        router
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/projects">
          <span class="menu-text">项目</span>
        </el-menu-item>
        <el-menu-item index="/testcases">
          <span class="menu-text">用例集</span>
        </el-menu-item>
        <el-menu-item index="/requirements">
          <span class="menu-text">需求集</span>
        </el-menu-item>
        <el-menu-item index="/executions">
          <span class="menu-text">结果集</span>
        </el-menu-item>
        <el-menu-item index="/reports">
          <span class="menu-text">报告集</span>
        </el-menu-item>
        <el-menu-item index="/marks">
          <span class="menu-text">Mark集</span>
        </el-menu-item>
        <el-menu-item index="/execution-records">
          <span class="menu-text">执行记录</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script>
export default {
  name: 'AppLayout'
}
</script>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  color: #fff;
}

.sidebar-menu {
  border-right: none;
  background-color: #304156 !important;
}

/* 菜单项样式 */
.sidebar-menu .el-menu-item {
  background-color: #304156;
  color: #bfcbd9;
  font-weight: 600;
  height: 56px;
  line-height: 56px;
}

/* 菜单项悬停效果 */
.sidebar-menu .el-menu-item:hover {
  background-color: #263445 !important;
  color: #ffffff;
}

/* 激活的菜单项 */
.sidebar-menu .el-menu-item.is-active {
  background-color: #263445 !important;
  color: #409EFF;
  font-weight: 700;
  border-right: 2px solid #409EFF;
}

/* 菜单文字样式 */
.menu-text {
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 1px;
}

/* 激活状态的文字加粗 */
.sidebar-menu .el-menu-item.is-active .menu-text {
  font-weight: 700;
}

/* 确保所有菜单项背景一致 */
:deep(.el-menu-item),
:deep(.el-submenu__title) {
  background-color: #304156 !important;
}

/* 去除默认边框 */
:deep(.el-menu) {
  border-right: none;
}
</style>