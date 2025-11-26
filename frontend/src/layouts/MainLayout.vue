<template>
  <v-layout>
    <v-navigation-drawer v-model="drawer" app temporary>
      <v-list dense>
        <v-list-item-title class="pa-3 font-weight-bold text-h6">
          เมนูหลัก
        </v-list-item-title>
        <v-divider></v-divider>

        <v-list-item link to="/profile" prepend-icon="mdi-account-circle" color="primary">
          <v-list-item-title>ข้อมูลส่วนตัว</v-list-item-title>
        </v-list-item>
        <v-divider class="my-2"></v-divider>

        <div v-if="store.isAdmin">
          <v-list-item link to="/dashboard" prepend-icon="mdi-view-dashboard">
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item>
          
          <v-list-item link to="/admin/rounds" prepend-icon="mdi-calendar-clock">
            <v-list-item-title>จัดการรอบประเมิน</v-list-item-title>
          </v-list-item>

          <v-list-item link to="/manage-users" prepend-icon="mdi-account-group"> 
            <v-list-item-title>จัดการผู้ใช้งาน (Users)</v-list-item-title>
          </v-list-item>
          
          <v-list-item link to="/manage-criteria" prepend-icon="mdi-format-list-checks">
            <v-list-item-title>จัดการเกณฑ์ (Criterias)</v-list-item-title>
          </v-list-item>
          
          <v-list-item link to="/manage-mapping" prepend-icon="mdi-account-network">
            <v-list-item-title>จัดการกรรมการ (Mapping)</v-list-item-title>
          </v-list-item>
          
          <v-list-item link to="/admin/committee-summary" prepend-icon="mdi-clipboard-list">
            <v-list-item-title>สรุปผลรายกรรมการ</v-list-item-title>
          </v-list-item>
          
          <v-list-item link to="/admin/committee-tracking" prepend-icon="mdi-chart-timeline-variant">
            <v-list-item-title>ติดตามสถานะกรรมการ</v-list-item-title>
          </v-list-item>

          <v-list-item link to="/admin/evaluatee-tracking" prepend-icon="mdi-account-search">
            <v-list-item-title>ติดตามผู้รับการประเมิน</v-list-item-title>
          </v-list-item>
        </div>

        <div v-if="store.isUser">
          <v-list-item link to="/self-assessment" prepend-icon="mdi-account-edit">
            <v-list-item-title>ประเมินตนเอง</v-list-item-title>
          </v-list-item>
          
          <v-list-item link to="/progress" prepend-icon="mdi-poll">
            <v-list-item-title>ความคืบหน้า (ภาพรวม)</v-list-item-title>
          </v-list-item>
          
          <v-list-item link to="/my-report" prepend-icon="mdi-chart-bar">
            <v-list-item-title>รายงานผลของฉัน</v-list-item-title>
          </v-list-item>
        </div>

        <div v-if="store.isCommittee">
          <v-list-item link to="/evaluation-list" prepend-icon="mdi-account-supervisor">
            <v-list-item-title>รายชื่อผู้รับการประเมิน</v-list-item-title>
          </v-list-item>
        </div>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Personnel Evaluation System</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="mr-3 d-none d-sm-flex">สวัสดี, {{ store.user?.fullname }}</span>
      <v-btn icon @click="handleLogout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main style="background-color: #f4f7f6; min-height: 100vh;">
      <v-container fluid>
        <router-view />
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