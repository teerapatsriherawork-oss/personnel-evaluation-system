<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 font-weight-bold text-primary">
          <v-icon start>mdi-account-search</v-icon>
          ติดตามผู้รับการประเมิน
        </h1>
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
          @update:modelValue="fetchEvaluateeTracking"
        ></v-select>
      </v-card-text>
    </v-card>

    <v-card class="elevation-4" v-if="selectedRoundId">
      <v-data-table
        :headers="tableHeaders"
        :items="evaluateeList"
        :loading="isLoading"
        class="elevation-1"
        hover
      >
        <template v-slot:[`item.fullname`]="{ item }">
          <div class="font-weight-bold text-subtitle-1">{{ item.fullname }}</div>
          <div class="text-caption text-grey">User ID: {{ item.id }}</div>
        </template>

        <template v-slot:[`item.self_status`]="{ item }">
          <v-chip 
            :color="getSelfStatusColor(item.self_status)" 
            size="small" 
            label 
            class="font-weight-bold"
          >
            <v-icon start size="x-small">
                {{ item.self_status === 'Complete' ? 'mdi-check' : 'mdi-alert-circle-outline' }}
            </v-icon>
            {{ item.self_status }}
          </v-chip>
          <div class="text-caption text-grey mt-1">
            ทำแล้ว {{ item.self_done }} / {{ item.total_criteria }} ข้อ
          </div>
        </template>

        <template v-slot:[`item.committee_progress`]="{ item }">
          <div style="min-width: 150px;">
            <v-progress-linear 
                :model-value="item.committee_progress" 
                :color="getProgressColor(item.committee_progress)" 
                height="15" 
                striped 
                rounded
            >
                <template v-slot:default="{ value }">
                    <strong class="text-white text-caption">{{ Math.ceil(value) }}%</strong>
                </template>
            </v-progress-linear>
            <div class="text-caption text-grey mt-1 d-flex justify-space-between">
                <span>ประเมินโดย {{ item.committee_count }} ท่าน</span>
                <span>{{ item.committee_eval_total }} คะแนน(ดิบ)</span>
            </div>
          </div>
        </template>

        <template v-slot:[`item.actions`]="{ item }">
            <v-btn 
                size="small" 
                variant="tonal" 
                color="primary"
                :to="`/admin/report/${selectedRoundId}/${item.id}`"
                prepend-icon="mdi-file-document-outline"
            >
                ดูรายงาน
            </v-btn>
        </template>
      </v-data-table>
    </v-card>
    
    <div v-else class="text-center py-10 text-grey-lighten-1">
      กรุณาเลือกรอบการประเมินเพื่อเริ่มติดตาม
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../plugins/axios';

const rounds = ref([]);
const selectedRoundId = ref(null);
const evaluateeList = ref([]);
const isLoading = ref(false);

const tableHeaders = [
  { title: 'ผู้รับการประเมิน', key: 'fullname', align: 'start', width: '30%' },
  { title: 'สถานะประเมินตนเอง', key: 'self_status', align: 'center', width: '25%' },
  { title: 'ความคืบหน้ากรรมการ', key: 'committee_progress', align: 'start', width: '30%' },
  { title: 'Action', key: 'actions', align: 'center', width: '15%' },
];

onMounted(async () => {
  try {
    const res = await api.get('/admin/rounds');
    rounds.value = res.data.data;
  } catch (error) {
    console.error('Fetch rounds error:', error);
  }
});

const fetchEvaluateeTracking = async () => {
  if (!selectedRoundId.value) return;
  isLoading.value = true;
  try {
    const res = await api.get(`/admin/evaluatee-tracking/${selectedRoundId.value}`);
    evaluateeList.value = res.data.data;
  } catch (error) {
    console.error('Fetch tracking error:', error);
  } finally {
    isLoading.value = false;
  }
};

const getSelfStatusColor = (status) => {
    if (status === 'Complete') return 'success';
    if (status === 'In Progress') return 'warning';
    return 'error';
};

const getProgressColor = (p) => {
    if (p >= 100) return 'success';
    if (p >= 50) return 'info';
    return 'orange';
};
</script>