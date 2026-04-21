<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="sidebar">
      <div class="logo">管理后台</div>
      <el-menu :default-active="activeMenu" router>
        <el-menu-item index="/admin/dashboard"><el-icon><DataLine /></el-icon>数据面板</el-menu-item>
        <el-menu-item index="/admin/reports"><el-icon><Warning /></el-icon>举报管理</el-menu-item>
        <el-menu-item index="/admin/users"><el-icon><User /></el-icon>用户管理</el-menu-item>
        <el-menu-item index="/admin/logs"><el-icon><Document /></el-icon>操作日志</el-menu-item>
      </el-menu>
    </el-aside>
    <el-main><router-view /></el-main>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
const route = useRoute();
const activeMenu = computed(() => route.path);
</script>

<style scoped>
.admin-layout { height: 100vh; }
.sidebar { background: #304156; }
.logo { color: white; text-align: center; padding: 20px 0; font-size: 18px; }
.el-menu { border-right: none; }
</style>