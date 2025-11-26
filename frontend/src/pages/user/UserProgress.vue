<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-2 font-weight-bold text-primary">
          <v-icon start>mdi-poll</v-icon>
          ความคืบหน้าการประเมิน (Overview)
        </h1>
        <div v-if="roundName" class="text-subtitle-1 text-grey-darken-1">
          รอบการประเมินปัจจุบัน: {{ roundName }}
        </div>
      </v-col>
    </v-row>

    <v-card class="mt-4 elevation-2">
      <v-card-title class="d-flex align-center bg-grey-lighten-4">
        <v-icon start color="primary">mdi-account-group</v-icon>
        สถานะผู้รับการประเมินทั้งหมด
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="ค้นหาชื่อ..."
          single-line
          hide-details
          density="compact"
          variant="outlined"
          style="max-width: 250px;"
        ></v-text-field>
      </v-card-title>

      <v-table hover>
        <thead>
          <tr>
            <th class="text-left font-weight-bold" width="35%">ชื่อ-นามสกุล</th>
            <th class="text-left font-weight-bold" width="45%">ความคืบหน้า (ตัวชี้วัด)</th>
            <th class="text-center font-weight-bold" width="20%">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>
              <div class="d-flex align-center">
                <v-avatar color="indigo-lighten-4" size="32" class="mr-3">
                  <span class="text-caption text-indigo-darken-4 font-weight-bold">
                    {{ getInitials(user.fullname) }}
                  </span>
                </v-avatar>
                <span :class="{'font-weight-bold text-primary': isCurrentUser(user.id)}">
                  {{ user.fullname }}
                  <v-chip v-if="isCurrentUser(user.id)" size="x-small" color="primary" class="ml-2" label>ME</v-chip>
                </span>
              </div>
            </td>
            <td class="py-3">
              <div class="d-flex flex-column">
                <div class="d-flex align-center justify-space-between mb-1">
                  <span class="text-caption text-grey-darken-1">
                    ดำเนินการแล้ว {{ user.submitted }} จาก {{ user.total }} ข้อ
                  </span>
                  <span class="text-caption font-weight-bold" :class="getPercentColorClass(user.percent)">
                    {{ user.percent }}%
                  </span>
                </div>
                <v-progress-linear
                  :model-value="user.percent"
                  :color="getProgressColor(user.percent)"
                  height="10"
                  rounded
                  striped
                ></v-progress-linear>
              </div>
            </td>
            <td class="text-center">
              <v-chip
                :color="user.percent >= 100 ? 'success' : 'warning'"
                variant="elevated"
                size="small"
                class="font-weight-bold"
              >
                <v-icon start size="small">
                  {{ user.percent >= 100 ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                </v-icon>
                {{ user.percent >= 100 ? 'ครบถ้วน' : 'กำลังดำเนินการ' }}
              </v-chip>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="3" class="text-center py-8 text-grey">
              <v-icon size="48" class="mb-2">mdi-database-off</v-icon>
              <div>{{ loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลผู้ใช้งาน หรือยังไม่มีการเปิดรอบประเมิน' }}</div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../plugins/axios';
import { useAuthStore } from '../../stores/authStore';

const authStore = useAuthStore();
const users = ref([]);
const roundName = ref('');
const search = ref('');
const loading = ref(false);

onMounted(async () => {
  await fetchData();
});

const fetchData = async () => {
  loading.value = true;
  try {
    // ดึงข้อมูลจาก API Public Progress ที่มีอยู่แล้วใน Backend
    const res = await api.get('/public/progress');
    if (res.data.status === 'success') {
      users.value = res.data.data || [];
      roundName.value = res.data.round_name || '';
    }
  } catch (error) {
    console.error('Error fetching progress:', error);
  } finally {
    loading.value = false;
  }
};

const filteredUsers = computed(() => {
  if (!search.value) return users.value;
  const q = search.value.toLowerCase();
  return users.value.filter(u => u.fullname.toLowerCase().includes(q));
});

const isCurrentUser = (id) => {
  return authStore.user && authStore.user.id === id;
};

const getInitials = (name) => {
  return name ? name.charAt(0).toUpperCase() : '?';
};

const getProgressColor = (percent) => {
  if (percent >= 100) return 'success';
  if (percent >= 50) return 'info';
  return 'orange';
};

const getPercentColorClass = (percent) => {
  if (percent >= 100) return 'text-success';
  if (percent >= 50) return 'text-info';
  return 'text-orange';
};
</script>