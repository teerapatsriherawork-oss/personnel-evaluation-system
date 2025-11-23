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
        <v-card color="info" dark class="elevation-4 rounded-lg">
          <v-card-item>
            <v-card-title class="text-white text-h5 font-weight-bold">
              <v-icon start color="white">mdi-account-group</v-icon>
              ผู้ใช้งานทั้งหมด
            </v-card-title>
            <v-card-subtitle class="text-white text-h6 mt-2">
              {{ stats.totalUsers }} คน
            </v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card color="success" dark class="elevation-4 rounded-lg">
          <v-card-item>
            <v-card-title class="text-white text-h5 font-weight-bold">
              <v-icon start color="white">mdi-calendar-clock</v-icon>
              รอบการประเมินที่เปิด
            </v-card-title>
            <v-card-subtitle class="text-white text-h6 mt-2">
              {{ stats.activeRounds }} รอบ
            </v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card color="warning" dark class="elevation-4 rounded-lg">
          <v-card-item>
            <v-card-title class="text-white text-h5 font-weight-bold">
              <v-icon start color="white">mdi-file-document-check</v-icon>
              การประเมินที่บันทึกแล้ว
            </v-card-title>
            <v-card-subtitle class="text-white text-h6 mt-2">
              {{ stats.totalEvaluations }} รายการ
            </v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="elevation-2">
          <v-card-title class="d-flex align-center">
            <v-icon start color="primary">mdi-monitor-dashboard</v-icon>
            ตารางติดตามสถานะการประเมินบุคลากร
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="ค้นหาชื่อ..."
              single-line
              hide-details
              density="compact"
              style="max-width: 300px;"
            ></v-text-field>
          </v-card-title>

          <v-table hover>
            <thead>
              <tr class="bg-grey-lighten-3">
                <th class="font-weight-bold">ID</th>
                <th class="font-weight-bold">ชื่อ-นามสกุล</th>
                <th class="font-weight-bold">บทบาท</th>
                <th class="font-weight-bold text-center">สถานะระบบ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.fullname }}</td>
                <td>
                  <v-chip 
                    :color="getRoleColor(user.role)" 
                    size="small" 
                    label
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
                  <span v-else class="text-grey">-</span>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="4" class="text-center py-4">ไม่พบข้อมูล</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
    
    </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../plugins/axios';

const stats = ref({
  totalUsers: 0,
  activeRounds: 0,
  totalEvaluations: 0
});

const users = ref([]);
const search = ref('');

onMounted(async () => {
  try {
    // Fetch Dashboard Stats
    const statsRes = await api.get('/admin/stats');
    stats.value = statsRes.data.data;

    // Fetch Users for Tracking Table
    const usersRes = await api.get('/admin/users');
    users.value = usersRes.data.data;
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
});

const getRoleColor = (role) => {
  switch(role) {
    case 'admin': return 'red';
    case 'committee': return 'purple';
    case 'user': return 'blue';
    default: return 'grey';
  }
};
</script>