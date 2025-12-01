<template>
  <v-container>
    <v-row class="d-print-none">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <h1 class="text-h4 font-weight-bold text-primary">
          <v-icon start>mdi-chart-bar</v-icon>
          รายงานผลการประเมิน
        </h1>
        <v-btn color="secondary" prepend-icon="mdi-printer" @click="printReport">
          Print / PDF
        </v-btn>
      </v-col>
    </v-row>

    <v-row class="d-print-none mb-4">
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedRoundId"
          :items="rounds"
          item-title="round_name"
          item-value="id"
          label="เลือกรอบการประเมิน"
          variant="outlined"
          density="compact"
          @update:modelValue="fetchReport"
        ></v-select>
      </v-col>
    </v-row>

    <div id="print-area" v-if="reportData.length > 0">
      <div class="d-none d-print-block text-center mb-6">
        <h2>รายงานสรุปผลการประเมินบุคลากร</h2>
        <p>ผู้รับการประเมิน: {{ userProfile?.fullname }}</p>
        <p>รอบการประเมิน: {{ selectedRoundName }}</p>
      </div>

      <v-card class="mb-6 border" variant="outlined">
        <v-card-text class="text-center">
          <v-row>
            <v-col cols="4">
              <div class="text-caption">คะแนนรวม (ตนเอง)</div>
              <div class="text-h4 text-primary">{{ totalSelfScore }}</div>
            </v-col>
            <v-col cols="4">
              <div class="text-caption">คะแนนรวม (กรรมการ)</div>
              <div class="text-h4 text-success">{{ totalCommitteeScore.toFixed(2) }}</div>
            </v-col>
            <v-col cols="4">
              <div class="text-caption">สรุปผล</div>
              <div class="text-h6 mt-2">{{ resultStatus }}</div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-table class="report-table">
        <thead>
          <tr class="bg-grey-lighten-3">
            <th class="text-left" width="40%">หัวข้อการประเมิน / ตัวชี้วัด</th>
            <th class="text-center">คะแนนตนเอง</th>
            <th class="text-center">คะแนนกรรมการ (เฉลี่ย)</th>
            <th class="text-left">ความคิดเห็นกรรมการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in reportData" :key="item.id">
            <td class="py-3">
              <div class="font-weight-bold">{{ item.topic_name }}</div>
              <div class="text-caption text-grey-darken-1">{{ item.indicator_name }}</div>
            </td>
            <td class="text-center">
                {{ item.self_score > 0 ? item.self_score : '-' }}
            </td>
            <td class="text-center font-weight-bold">
                {{ parseFloat(item.committee_score) > 0 ? item.committee_score : '-' }}
            </td>
            <td>
              <div v-if="item.committee_comment" class="text-body-2 font-italic">
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
          <div>ลงชื่อ ผู้รับการประเมิน</div>
        </div>
        <div class="text-center">
          <div class="signature-line mb-2">&nbsp;</div>
          <div>ลงชื่อ ประธานกรรมการ</div>
        </div>
      </div>
    </div>

    <div v-else-if="selectedRoundId" class="text-center py-10 text-grey">
      <v-icon size="64" color="grey-lighten-2">mdi-file-document-off</v-icon>
      <div class="mt-4">ยังไม่มีข้อมูลผลการประเมินในรอบนี้</div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import api from '../../plugins/axios';

const authStore = useAuthStore();
const userProfile = authStore.user;
const rounds = ref([]);
const selectedRoundId = ref(null);
const reportData = ref([]);

const selectedRoundName = computed(() => {
  const r = rounds.value.find(i => i.id === selectedRoundId.value);
  return r ? r.round_name : '';
});

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
  return 'รอการประเมิน / ปรับปรุง';
});

onMounted(async () => {
  try {
    const res = await api.get('/admin/rounds');
    rounds.value = res.data.data;
  } catch (error) {
    console.error("Error fetching rounds:", error);
  }
});

const fetchReport = async () => {
  if (!selectedRoundId.value) return;
  
  try {
    // 1. Fetch Criteria Structure
    const criRes = await api.get(`/admin/rounds/${selectedRoundId.value}/criterias`);
    const criterias = criRes.data.data;

    // 2. Fetch User Evaluations
    const evalRes = await api.get(`/user/evaluations/${selectedRoundId.value}`);
    const evaluations = evalRes.data.data;
    
    // 3. Map Data
    reportData.value = criterias.map(criteriaItem => {
      const myEval = evaluations.find(e => 
        e.criteria_id === criteriaItem.id && 
        e.evaluator_id === userProfile.id
      );
      
      const committeeEvals = evaluations.filter(e => 
        e.criteria_id === criteriaItem.id && 
        e.evaluator_id !== userProfile.id
      );

      let committeeAvgScore = 0;
      let committeeComment = '';

      if (committeeEvals.length > 0) {
        const total = committeeEvals.reduce((sum, e) => sum + Number(e.score || 0), 0);
        committeeAvgScore = (total / committeeEvals.length).toFixed(2);
        
        // Show first comment found
        committeeComment = committeeEvals[0].comment || ''; 
      }

      return {
        id: criteriaItem.id,
        topic_name: criteriaItem.topic_name,
        indicator_name: criteriaItem.indicator_name,
        self_score: myEval ? myEval.score : 0,
        committee_score: committeeAvgScore,
        committee_comment: committeeComment
      };
    });

  } catch (error) {
    console.error("Error fetching report data:", error);
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
.signature-line {
    width: 200px; 
    margin: 0 auto; 
    border-bottom: 1px solid #000;
}

@media print {
  body { -webkit-print-color-adjust: exact; }
  .v-container { max-width: 100%; padding: 0; }
  .d-print-none { display: none !important; }
}
</style>