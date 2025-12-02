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
          <v-chip :color="getSelfStatusColor(item.self_status)" size="small" label>
            {{ item.self_status }}
          </v-chip>
          <div class="text-caption text-grey mt-1">
            {{ item.self_done }} / {{ item.total_criteria }} ข้อ
          </div>
        </template>

        <template v-slot:[`item.committee_progress`]="{ item }">
          <v-progress-linear :model-value="item.committee_progress" :color="getProgressColor(item.committee_progress)" height="15" striped rounded>
             <template v-slot:default="{ value }"><strong>{{ Math.ceil(value) }}%</strong></template>
          </v-progress-linear>
          <div class="text-caption text-grey mt-1">กรรมการ {{ item.committee_count }} คน</div>
        </template>

        <template v-slot:[`item.overall`]="{ item }">
            <v-btn 
                size="small" 
                variant="outlined" 
                color="primary"
                :to="`/admin/report/${selectedRoundId}/${item.id}`"
                prepend-icon="mdi-file-document-outline"
            >
                ดูรายงาน
            </v-btn>
        </template>
      </v-data-table>
    </v-card>
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
  { title: 'ผู้รับการประเมิน', key: 'fullname', width: '25%' },
  { title: 'ประเมินตนเอง', key: 'self_status', align: 'center', width: '20%' },
  { title: 'กรรมการ', key: 'committee_progress', width: '35%' },
  { title: 'Action', key: 'overall', align: 'center', width: '20%' },
];

onMounted(async () => {
  const res = await api.get('/admin/rounds');
  rounds.value = res.data.data;
});

const fetchTracking = async () => {
  if (!selectedRoundId.value) return;
  loading.value = true;
  try {
    const res = await api.get(`/admin/evaluatee-tracking/${selectedRoundId.value}`);
    trackingData.value = res.data.data;
  } finally {
    loading.value = false;
  }
};

const getSelfStatusColor = (status) => status === 'Complete' ? 'success' : (status === 'In Progress' ? 'warning' : 'error');
const getProgressColor = (p) => p >= 100 ? 'success' : 'orange';
</script>