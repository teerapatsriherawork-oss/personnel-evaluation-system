<template>
  <v-container>
    <v-row class="d-print-none">
      <v-col cols="12">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="$router.back()">
          ย้อนกลับ
        </v-btn>
      </v-col>
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <h1 class="text-h4 font-weight-bold text-primary">
          <v-icon start>mdi-file-document-multiple</v-icon>
          รายละเอียดผลการประเมิน
        </h1>
        <v-btn color="secondary" prepend-icon="mdi-printer" @click="printReport">
          Print / PDF
        </v-btn>
      </v-col>
    </v-row>

    <div v-if="isLoading" class="text-center py-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-3">กำลังโหลดข้อมูล...</div>
    </div>

    <div id="print-area" v-else>
      <div class="text-center mb-6 pt-4">
        <h2>รายงานสรุปผลการประเมินบุคลากร</h2>
        <div class="text-h6 mt-2">ผู้รับการประเมิน: <strong>{{ userData.fullname }}</strong></div>
        <div class="text-subtitle-1 text-grey-darken-1">รอบการประเมิน: {{ roundData.round_name }}</div>
      </div>

      <v-card class="mb-6 border" variant="outlined">
        <v-card-text class="text-center">
          <v-row>
            <v-col cols="3">
              <div class="text-caption">คะแนนเต็ม</div>
              <div class="text-h5 text-grey-darken-2">{{ totalMaxScore }}</div>
            </v-col>
            <v-col cols="3">
              <div class="text-caption">คะแนนที่ได้ (กรรมการ)</div>
              <div class="text-h4 text-primary">{{ totalCommitteeScore.toFixed(2) }}</div>
            </v-col>
            <v-col cols="3">
              <div class="text-caption">คิดเป็นร้อยละ</div>
              <div class="text-h4 text-info">{{ scorePercentage }}%</div>
            </v-col>
            <v-col cols="3">
              <div class="text-caption">ผลการประเมิน</div>
              <div class="text-h6 mt-2 font-weight-bold" :class="getStatusColor(resultStatus)">
                {{ resultStatus }}
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-table class="report-table">
        <thead>
          <tr class="bg-grey-lighten-3">
            <th class="text-left" width="40%">หัวข้อการประเมิน / ตัวชี้วัด</th>
            <th class="text-center" width="10%">เต็ม</th>
            <th class="text-center" width="15%">ตนเอง</th>
            <th class="text-center" width="15%">กรรมการ (เฉลี่ย)</th>
            <th class="text-left">ความเห็นกรรมการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in reportData" :key="item.id">
            <td class="py-3 align-top">
              <div class="font-weight-bold">{{ item.topic_name }}</div>
              <div class="text-caption text-grey-darken-1">{{ item.indicator_name }}</div>
            </td>
            <td class="text-center align-top text-grey-darken-1">
              {{ item.max_score }}
            </td>
            <td class="text-center align-top">
              <v-chip v-if="item.self_score > 0" size="small" color="blue-lighten-4" class="text-blue-darken-4 font-weight-bold">
                {{ item.self_score }}
              </v-chip>
              <span v-else class="text-grey">-</span>
            </td>
            <td class="text-center align-top">
              <div v-if="parseFloat(item.committee_score) > 0" class="font-weight-bold text-success">
                {{ item.committee_score }}
              </div>
              <span v-else class="text-grey">-</span>
            </td>
            <td class="align-top">
              <div v-if="item.committee_comment" class="text-body-2 font-italic text-grey-darken-2">
                "{{ item.committee_comment }}"
              </div>
              <div v-else class="text-caption text-grey">-</div>
            </td>
          </tr>
        </tbody>
      </v-table>

      <div class="d-none d-print-flex justify-space-around mt-10 pt-10">
        <div class="text-center">
          <div class="signature-line mb-2">&nbsp;</div>
          <div>ผู้รับการประเมิน</div>
        </div>
        <div class="text-center">
          <div class="signature-line mb-2">&nbsp;</div>
          <div>ประธานกรรมการ</div>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '../../plugins/axios';

const route = useRoute();
const roundId = route.params.roundId;
const userId = route.params.userId;

const isLoading = ref(true);
const reportData = ref([]);
const userData = ref({});
const roundData = ref({});

const totalMaxScore = computed(() => {
  return reportData.value.reduce((sum, item) => sum + Number(item.max_score || 0), 0);
});

const totalCommitteeScore = computed(() => {
  return reportData.value.reduce((sum, item) => sum + parseFloat(item.committee_score || 0), 0);
});

const scorePercentage = computed(() => {
  if (totalMaxScore.value === 0) return 0;
  return ((totalCommitteeScore.value / totalMaxScore.value) * 100).toFixed(2);
});

const resultStatus = computed(() => {
  const percent = parseFloat(scorePercentage.value);
  if (percent >= 80) return 'ดีเยี่ยม';
  if (percent >= 60) return 'ผ่านเกณฑ์';
  return 'ต้องปรับปรุง';
});

onMounted(async () => {
  await fetchData();
});

const fetchData = async () => {
  try {
    isLoading.value = true;
    const res = await api.get(`/admin/report/${roundId}/${userId}`);
    reportData.value = res.data.data.report;
    userData.value = res.data.data.user;
    roundData.value = res.data.data.round;
  } catch (error) {
    console.error("Error fetching report:", error);
  } finally {
    isLoading.value = false;
  }
};

const getStatusColor = (status) => {
  if (status === 'ดีเยี่ยม') return 'text-success';
  if (status === 'ผ่านเกณฑ์') return 'text-primary';
  return 'text-error';
};

const printReport = () => {
  window.print();
};
</script>

<style scoped>
.report-table {
  border: 1px solid #e0e0e0;
}
.report-table th, .report-table td {
  border-bottom: 1px solid #e0e0e0;
}
.signature-line {
    width: 200px; margin: 0 auto; border-bottom: 1px dotted #000;
}
@media print {
  body { -webkit-print-color-adjust: exact; }
  .v-container { max-width: 100%; padding: 0; }
  .d-print-none { display: none !important; }
}
</style>