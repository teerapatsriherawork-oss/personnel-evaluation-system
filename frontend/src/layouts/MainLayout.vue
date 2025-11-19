<!-- [3.1] Layout มี Sidebar & Navbar -->
<!-- [3.2] เมนูเปลี่ยนตาม Role -->
<!-- src/layouts/MainLayout.vue -->
<template>
  <v-layout>
    <!-- Navigation Drawer (Sidebar) -->
    <v-navigation-drawer v-model="drawer" app temporary>
      <v-list dense>
        <v-list-item-title class="pa-3 font-weight-bold">
          เมนูหลัก
        </v-list-item-title>
        <v-divider></v-divider>

        <!-- Admin Menu [3.2] -->
        <div v-if="store.isAdmin">
          <v-list-item link to="/dashboard" prepend-icon="mdi-view-dashboard">
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item>
          <v-list-item link to="/manage-criteria" prepend-icon="mdi-format-list-checks">
            <v-list-item-title>จัดการเกณฑ์ (Criterias)</v-list-item-title>
          </v-list-item>
          <v-list-item link to="/manage-mapping" prepend-icon="mdi-account-network">
            <v-list-item-title>จัดการกรรมการ (Mapping)</v-list-item-title>
          </v-list-item>
        </div>

        <!-- User Menu [3.2] -->
        <div v-if="store.isUser">
          <v-list-item link to="/self-assessment" prepend-icon="mdi-account-edit">
            <v-list-item-title>ประเมินตนเอง (Self-Assessment)</v-list-item-title>
          </v-list-item>
          <v-list-item link to="/my-report" prepend-icon="mdi-chart-bar">
            <v-list-item-title>รายงานผลของฉัน</v-list-item-title>
          </v-list-item>
        </div>

        <!-- Committee Menu [3.2] -->
        <div v-if="store.isCommittee">
          <v-list-item link to="/evaluation-list" prepend-icon="mdi-account-supervisor">
            <v-list-item-title>รายชื่อผู้รับการประเมิน</v-list-item-title>
          </v-list-item>
        </div>
      </v-list>
    </v-navigation-drawer>

    <!-- App Bar (Navbar) -->
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Personnel Evaluation System</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="mr-3">สวัสดี, {{ store.user?.fullname }}</span>
      <v-btn icon @click="handleLogout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Main Content -->
    <v-main style="background-color: #f4f7f6; min-height: 100vh;">
      <v-container fluid>
        <router-view /> <!-- Pages will be rendered here -->
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';

const drawer = ref(false);
const store = useAuthStore();

const handleLogout = () => {
  store.logout();
};
</script>

<style scoped>
/* Scoped styles if needed */
</style>