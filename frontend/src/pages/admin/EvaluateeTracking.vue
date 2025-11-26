<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 font-weight-bold text-primary">
          <v-icon start>mdi-account-search</v-icon>
          ติดตามผู้รับการประเมิน
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">ตรวจสอบสถานะการประเมินตนเองและความคืบหน้าของกรรมการต่อบุคลากร</p>
      </v-col>
    </v-row>

    <v-card class="mb-6 elevation-2">
      <v-card-text>
        <v-select
          v-model="selectedRoundId"
          :items="rounds"
          item-title="round_name"
          item-value="id"
          label="เลือกรอบการประเมิน"
          variant="outlined"
          prepend-inner-icon="mdi-calendar"
          hide-details
          @update:modelValue="fetchTracking"
        ></v-select>
      </v-card-text>
    </v-card>

    <v-card class="elevation-4" v-if="selectedRoundId">
      <v-data-table
        :headers="headers"
        :items="trackingData"
        :loading="loading"
        class="elevation-1"
        hover
      >
        <template v-slot:[`item.fullname`]="{ item }">
          <div class="font-weight-bold">{{ item.fullname }}</div>
          <div class="text-caption text-grey">ID: {{ item.id }}</div>
        </template>

        <template v-slot:[`item.self_status`]="{ item }">
          <v-chip
            :color="getSelfStatusColor(item.self_status)"
            size="small"
            class="font-weight-bold"
            label
          >
            <v-icon start size="small">
              {{ item.self_status === 'Complete' ? 'mdi-check-circle' : 'mdi-clock-outline' }}
            </v-icon>
            {{ item.self_status === 'Complete' ? 'เรียบร้อย' : (item.self_status === 'In Progress' ? 'กำลังทำ' : 'ยังไม่เริ่ม') }}
          </v-chip>
          <div class="text-caption text-grey mt-1">
            ทำไป {{ item.self_done }} / {{ item.total_criteria }} ข้อ
          </div>
        </template>

        <template v-slot:[`item.committee_progress`]="{ item }">
          <div class="d-flex flex-column py-2" style="min-width: 150px;">
            <div class="d-flex align-center w-100">
                <v-progress-linear
                  :model-value="item.committee_progress"
                  :color="getProgressColor(item.committee_progress)"
                  height="18"
                  rounded
                  striped
                >
                  <template v-slot:default="{ value }">
                    <strong class="text-white text-caption" style="font-size: 10px;">{{ Math.ceil(value) }}%</strong>
                  </template>
                </v-progress-linear>
            </div>
            <div class="text-caption text-grey mt-1">
               กรรมการ {{ item.committee_count }} ท่าน <br>
               (ประเมินแล้ว {{ item.committee_eval_total }} / {{ item.target_committee_eval }} ข้อ)
            </div>
          </div>
        </template>

        <template v-slot:[`item.overall`]="{ item }">
            <v-icon 
                v-if="item.self_status === 'Complete' && item.committee_progress >= 100" 
                color="success" 
                size="large"
            >
                mdi-check-decagram
            </v-icon>
            <span v-else class="text-grey text-caption">รอครบถ้วน</span>
        </template>

      </v-data-table>
    </v-card>

    <div v-else class="text-center py-10 text-grey-lighten-1">
      <v-icon size="64" class="mb-2">mdi-clipboard-text-search</v-icon>
      <div>กรุณาเลือกรอบการประเมินเพื่อดูข้อมูล</div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../plugins/axios';

const rounds = ref([]);
const selectedRoundId = ref(null);
const trackingData = ref([]);
const loading = ref(false);

const headers = [
  { title: 'ผู้รับการประเมิน', key: 'fullname', align: 'start', width: '25%' },
  { title: 'ประเมินตนเอง (User)', key: 'self_status', align: 'center', width: '25%' },
  { title: 'การประเมินโดยกรรมการ', key: 'committee_progress', align: 'start', width: '35%' },
  { title: 'สมบูรณ์', key: 'overall', align: 'center', width: '15%' },
];

onMounted(async () => {
  try {
    const res = await api.get('/admin/rounds');
    rounds.value = res.data.data;
  } catch (error) {
    console.error('Error fetching rounds:', error);
  }
});

const fetchTracking = async () => {
  if (!selectedRoundId.value) return;
  
  loading.value = true;
  try {
    const res = await api.get(`/admin/evaluatee-tracking/${selectedRoundId.value}`);
    trackingData.value = res.data.data;
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    trackingData.value = [];
  } finally {
    loading.value = false;
  }
};

const getSelfStatusColor = (status) => {
  if (status === 'Complete') return 'success';
  if (status === 'In Progress') return 'warning';
  return 'error';
};

const getProgressColor = (progress) => {
  if (progress >= 100) return 'success';
  if (progress >= 50) return 'info';
  return 'orange';
};
</script>