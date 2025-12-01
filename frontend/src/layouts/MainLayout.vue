<template>
  <v-layout>
    <v-navigation-drawer v-model="isDrawerOpen" app class="elevation-2">
      <div class="pa-4 bg-primary text-white text-center">
        <v-avatar size="64" color="white" class="mb-2">
          <span class="text-primary text-h5 font-weight-bold">
            {{ getUserInitials() }}
          </span>
        </v-avatar>
        <div class="font-weight-bold text-truncate">{{ authStore.user?.fullname || 'Guest' }}</div>
        <div class="text-caption opacity-80">{{ authStore.user?.role?.toUpperCase() }}</div>
      </div>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item link to="/profile" prepend-icon="mdi-account-circle" title="ข้อมูลส่วนตัว" color="primary"></v-list-item>
        
        <v-divider class="my-2"></v-divider>
        <v-list-subheader class="text-uppercase font-weight-bold text-caption">Menu</v-list-subheader>

        <template v-if="authStore.isAdmin">
          <v-list-item link to="/dashboard" prepend-icon="mdi-view-dashboard" title="Dashboard"></v-list-item>
          <v-list-item link to="/admin/rounds" prepend-icon="mdi-calendar-clock" title="จัดการรอบประเมิน"></v-list-item>
          <v-list-item link to="/manage-users" prepend-icon="mdi-account-group" title="จัดการผู้ใช้งาน"></v-list-item>
          <v-list-item link to="/manage-criteria" prepend-icon="mdi-format-list-checks" title="จัดการเกณฑ์"></v-list-item>
          <v-list-item link to="/manage-mapping" prepend-icon="mdi-account-network" title="จับคู่กรรมการ"></v-list-item>
          
          <v-list-group value="Reports">
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props" prepend-icon="mdi-file-chart" title="รายงานและติดตาม"></v-list-item>
            </template>
            <v-list-item link to="/admin/committee-tracking" prepend-icon="mdi-chart-timeline-variant" title="ติดตามกรรมการ"></v-list-item>
            <v-list-item link to="/admin/evaluatee-tracking" prepend-icon="mdi-account-search" title="ติดตามผู้รับการประเมิน"></v-list-item>
            <v-list-item link to="/admin/committee-summary" prepend-icon="mdi-clipboard-list" title="สรุปผลรายกรรมการ"></v-list-item>
          </v-list-group>
        </template>

        <template v-if="authStore.isUser">
          <v-list-item link to="/progress" prepend-icon="mdi-poll" title="ภาพรวมความคืบหน้า"></v-list-item>
          <v-list-item link to="/self-assessment" prepend-icon="mdi-account-edit" title="ประเมินตนเอง"></v-list-item>
          <v-list-item link to="/my-report" prepend-icon="mdi-chart-bar" title="รายงานผลของฉัน"></v-list-item>
        </template>

        <template v-if="authStore.isCommittee">
          <v-list-item link to="/evaluation-list" prepend-icon="mdi-account-supervisor" title="รายชื่อผู้รับการประเมิน"></v-list-item>
        </template>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn block color="error" variant="outlined" prepend-icon="mdi-logout" @click="handleLogout">
            ออกจากระบบ
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar app color="primary" elevation="1">
      <v-app-bar-nav-icon @click.stop="isDrawerOpen = !isDrawerOpen" color="white"></v-app-bar-nav-icon>
      <v-toolbar-title class="text-white font-weight-bold">
        <v-icon start>mdi-shield-account</v-icon>
        Personnel Evaluation
      </v-toolbar-title>
    </v-app-bar>

    <v-main class="bg-grey-lighten-5" style="min-height: 100vh;">
      <v-container fluid class="pa-4 pa-md-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';

const isDrawerOpen = ref(true); 
const authStore = useAuthStore();

const handleLogout = () => {
  if(confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
    authStore.logout();
  }
};

const getUserInitials = () => {
  const name = authStore.user?.fullname || '';
  return name.charAt(0).toUpperCase();
};
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>