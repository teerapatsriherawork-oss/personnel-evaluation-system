<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 font-weight-bold text-primary">
          Dashboard ภาพรวมระบบ
        </h1>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card color="info" class="elevation-4 rounded-lg text-white">
          <v-card-item>
            <v-card-title class="text-h5 font-weight-bold">
              <v-icon start color="white">mdi-account-group</v-icon>
              ผู้ใช้งานทั้งหมด
            </v-card-title>
            <v-card-subtitle class="text-white text-h6 mt-2">
              {{ dashboardStats.totalUsers }} คน
            </v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card color="success" class="elevation-4 rounded-lg text-white">
          <v-card-item>
            <v-card-title class="text-h5 font-weight-bold">
              <v-icon start color="white">mdi-calendar-clock</v-icon>
              รอบการประเมินที่เปิด
            </v-card-title>
            <v-card-subtitle class="text-white text-h6 mt-2">
              {{ dashboardStats.activeRounds }} รอบ
            </v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card color="warning" class="elevation-4 rounded-lg text-white">
          <v-card-item>
            <v-card-title class="text-h5 font-weight-bold">
              <v-icon start color="white">mdi-file-document-check</v-icon>
              การประเมินที่บันทึกแล้ว
            </v-card-title>
            <v-card-subtitle class="text-white text-h6 mt-2">
              {{ dashboardStats.totalEvaluations }} รายการ
            </v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="elevation-2">
          <v-card-title class="d-flex align-center py-3">
            <v-icon start color="primary">mdi-monitor-dashboard</v-icon>
            ตารางติดตามสถานะการประเมินบุคลากร
            <v-spacer></v-spacer>
            <v-text-field
              v-model="searchQuery"
              append-inner-icon="mdi-magnify"
              label="ค้นหาชื่อ..."
              single-line
              hide-details
              density="compact"
              variant="outlined"
              style="max-width: 300px;"
            ></v-text-field>
          </v-card-title>

          <v-table hover>
            <thead class="bg-grey-lighten-4">
              <tr>
                <th class="font-weight-bold">ID</th>
                <th class="font-weight-bold">ชื่อ-นามสกุล</th>
                <th class="font-weight-bold">บทบาท</th>
                <th class="font-weight-bold text-center">สถานะระบบ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.fullname }}</td>
                <td>
                  <v-chip 
                    :color="getRoleColor(user.role)" 
                    size="small" 
                    label
                    class="font-weight-bold"
                  >
                    {{ user.role.toUpperCase() }}
                  </v-chip>
                </td>
                <td class="text-center">
                  <v-chip 
                    v-if="user.role === 'user'"
                    color="success" 
                    variant="outlined" 
                    size="small"
                  >
                    <v-icon start size="small">mdi-check-circle</v-icon>
                    Active
                  </v-chip>
                  <span v-else class="text-grey-lighten-1">-</span>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="4" class="text-center py-6 text-grey">ไม่พบข้อมูล</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '../../plugins/axios';

const dashboardStats = ref({
  totalUsers: 0,
  activeRounds: 0,
  totalEvaluations: 0
});

const userTrackingList = ref([]);
const searchQuery = ref('');

onMounted(async () => {
  await fetchDashboardData();
});

const fetchDashboardData = async () => {
  try {
    // 1. Get Stats
    const statsRes = await api.get('/admin/stats');
    dashboardStats.value = statsRes.data.data;

    // 2. Get Users List
    const usersRes = await api.get('/admin/users');
    userTrackingList.value = usersRes.data.data;
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
};

const filteredUsers = computed(() => {
  if (!searchQuery.value) return userTrackingList.value;
  const q = searchQuery.value.toLowerCase();
  return userTrackingList.value.filter(u => u.fullname.toLowerCase().includes(q));
});

const getRoleColor = (role) => {
  switch(role) {
    case 'admin': return 'red-darken-1';
    case 'committee': return 'purple-darken-1';
    case 'user': return 'blue-darken-1';
    default: return 'grey';
  }
};
</script>