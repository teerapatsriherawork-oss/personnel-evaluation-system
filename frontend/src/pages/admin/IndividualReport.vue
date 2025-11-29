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

    <div v-if="loading" class="text-center py-10">
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
            <v-col cols="4">
              <div class="text-caption">คะแนนรวม (ตนเอง)</div>
              <div class="text-h4 text-primary">{{ totalSelfScore }}</div>
            </v-col>
            <v-col cols="4">
              <div class="text-caption">คะแนนรวม (กรรมการเฉลี่ย)</div>
              <div class="text-h4 text-success">{{ totalCommitteeScore.toFixed(2) }}</div>
            </v-col>
            <v-col cols="4">
              <div class="text-caption">ผลประเมิน</div>
              <div class="text-h6 mt-2">{{ resultStatus }}</div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-table class="report-table">
        <thead>
          <tr class="bg-grey-lighten-3">
            <th class="text-left" width="40%">หัวข้อการประเมิน / ตัวชี้วัด</th>
            <th class="text-center" width="15%">ตนเอง</th>
            <th class="text-center" width="15%">กรรมการ (เฉลี่ย)</th>
            <th class="text-left">หมายเหตุ / ความเห็นกรรมการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in reportData" :key="item.id">
            <td class="py-3 align-top">
              <div class="font-weight-bold">{{ item.topic_name }}</div>
              <div class="text-caption text-grey-darken-1">{{ item.indicator_name }}</div>
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
          <tr v-if="reportData.length === 0">
            <td colspan="4" class="text-center text-grey py-4">ไม่พบข้อมูลการประเมิน</td>
          </tr>
        </tbody>
      </v-table>

      <div class="d-none d-print-flex justify-space-around mt-10 pt-10">
        <div class="text-center">
          <div class="border-bottom mb-2" style="width: 200px; margin: 0 auto; border-bottom: 1px dotted #000;">&nbsp;</div>
          <div>ผู้รับการประเมิน</div>
        </div>
        <div class="text-center">
          <div class="border-bottom mb-2" style="width: 200px; margin: 0 auto; border-bottom: 1px dotted #000;">&nbsp;</div>
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

const loading = ref(true);
const reportData = ref([]);
const userData = ref({});
const roundData = ref({});

// Computed Properties สำหรับคำนวณผลรวม
const totalSelfScore = computed(() => {
  return reportData.value.reduce((sum, item) => sum + Number(item.self_score || 0), 0);
});

const totalCommitteeScore = computed(() => {
  return reportData.value.reduce((sum, item) => sum + parseFloat(item.committee_score || 0), 0);
});

const resultStatus = computed(() => {
  const score = totalCommitteeScore.value;
  if (score > 80) return 'ดีเยี่ยม';
  if (score > 50) return 'ผ่านเกณฑ์';
  return 'ต้องปรับปรุง';
});

onMounted(async () => {
  await fetchData();
});

const fetchData = async () => {
  try {
    loading.value = true;
    
    // เรียก API Admin Report ที่เตรียมข้อมูลไว้ให้แล้ว (จาก Backend ใหม่)
    const res = await api.get(`/admin/report/${roundId}/${userId}`);
    
    // รับข้อมูลเข้าตัวแปรโดยตรง ไม่ต้อง map หรือ find เองแล้ว
    reportData.value = res.data.data.report;
    userData.value = res.data.data.user;
    roundData.value = res.data.data.round;

  } catch (error) {
    console.error("Error fetching report:", error);
  } finally {
    loading.value = false;
  }
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

@media print {
  body { 
    -webkit-print-color-adjust: exact; 
  }
  .v-container { 
    max-width: 100%; 
    padding: 0; 
    margin: 0;
  }
  .d-print-none { 
    display: none !important; 
  }
  /* ซ่อน Elements อื่นๆ ของ App หลัก */
  .v-navigation-drawer, .v-app-bar, .v-footer {
    display: none !important;
  }
}
</style>