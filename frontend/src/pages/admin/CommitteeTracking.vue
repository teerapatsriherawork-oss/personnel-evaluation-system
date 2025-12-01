<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 font-weight-bold text-primary">
          <v-icon start>mdi-chart-timeline-variant</v-icon>
          ติดตามสถานะกรรมการ
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">ดูภาพรวมความคืบหน้าการให้คะแนนของกรรมการแต่ละท่าน</p>
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
          @update:modelValue="fetchCommitteeProgress"
        ></v-select>
      </v-card-text>
    </v-card>

    <v-card class="elevation-4" v-if="selectedRoundId">
      <v-data-table
        :headers="tableHeaders"
        :items="committeeProgressList"
        :loading="isLoading"
        class="elevation-1"
        hover
      >
        <template v-slot:[`item.committee_name`]="{ item }">
          <div class="py-2">
            <div class="font-weight-bold text-subtitle-1">{{ item.committee_name }}</div>
            <div class="text-caption text-grey">รหัสพนักงาน: {{ item.committee_id }}</div>
          </div>
        </template>

        <template v-slot:[`item.total_evaluatees`]="{ item }">
          <div class="py-2">
            <v-chip color="blue-grey-lighten-4" class="text-blue-grey-darken-4 font-weight-bold mb-1" label size="small">
              <v-icon start size="small">mdi-account-multiple</v-icon>
              ดูแล {{ item.total_evaluatees }} คน
            </v-chip>
            <div class="text-caption text-grey-darken-1 text-truncate" style="max-width: 300px;">
              <v-icon size="x-small" class="mr-1">mdi-account-arrow-right</v-icon>
              {{ item.evaluatee_list }}
            </div>
          </div>
        </template>

        <template v-slot:[`item.progress`]="{ item }">
          <div class="d-flex flex-column py-2" style="min-width: 200px;">
            <div class="d-flex align-center w-100">
                <v-progress-linear
                  :model-value="item.progress"
                  :color="getProgressColor(item.progress)"
                  height="20"
                  striped
                  rounded
                  class="flex-grow-1 mr-3"
                >
                  <template v-slot:default="{ value }">
                    <strong class="text-white text-caption">{{ Math.ceil(value) }}%</strong>
                  </template>
                </v-progress-linear>
            </div>
            <div class="text-caption text-right text-grey mt-1">
               ทำไปแล้ว <span class="text-primary font-weight-bold">{{ item.total_evaluations_done }}</span> / {{ item.total_tasks }} ข้อ 
            </div>
          </div>
        </template>

        <template v-slot:[`item.status`]="{ item }">
          <v-chip
            :color="item.is_complete ? 'success' : 'warning'"
            :prepend-icon="item.is_complete ? 'mdi-check-circle' : 'mdi-clock-outline'"
            variant="elevated"
            class="font-weight-bold"
            size="small"
          >
            {{ item.is_complete ? 'เสร็จสิ้น' : 'กำลังดำเนินการ' }}
          </v-chip>
        </template>
        
        <template v-slot:no-data>
          <div class="text-center py-6 text-grey">
            ไม่พบข้อมูลกรรมการในรอบนี้ หรือยังไม่มีการจับคู่กรรมการ
          </div>
        </template>
      </v-data-table>
    </v-card>

    <div v-else class="text-center py-10 text-grey-lighten-1">
      <v-icon size="64" class="mb-2">mdi-clipboard-text-search-outline</v-icon>
      <div>กรุณาเลือกรอบการประเมินเพื่อดูข้อมูล</div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../plugins/axios';

const rounds = ref([]);
const selectedRoundId = ref(null);
const committeeProgressList = ref([]);
const isLoading = ref(false);

const tableHeaders = [
  { title: 'กรรมการผู้ประเมิน', key: 'committee_name', align: 'start', width: '25%' },
  { title: 'ภาระงาน (ผู้รับการประเมิน)', key: 'total_evaluatees', align: 'start', width: '35%' },
  { title: 'ความคืบหน้า (Progress)', key: 'progress', align: 'start', width: '25%' },
  { title: 'สถานะ', key: 'status', align: 'center', width: '15%' },
];

onMounted(async () => {
  try {
    const res = await api.get('/admin/rounds');
    rounds.value = res.data.data;
  } catch (error) {
    console.error('Error fetching rounds:', error);
  }
});

const fetchCommitteeProgress = async () => {
  if (!selectedRoundId.value) return;
  
  isLoading.value = true;
  try {
    const res = await api.get(`/admin/committee-progress/${selectedRoundId.value}`);
    committeeProgressList.value = res.data.data;
  } catch (error) {
    console.error('Error fetching progress:', error);
    committeeProgressList.value = [];
  } finally {
    isLoading.value = false;
  }
};

const getProgressColor = (progress) => {
  if (progress >= 100) return 'success';
  if (progress >= 50) return 'info';
  return 'orange';
};
</script>