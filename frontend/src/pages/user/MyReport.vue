<template>
  <v-container>
    <v-row class="d-print-none">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <h1 class="text-h4 font-weight-bold text-primary">
          <v-icon start>mdi-chart-bar</v-icon>
          รายงานผลการประเมิน
        </h1>
        <v-btn color="secondary" prepend-icon="mdi-printer" @click="printReport">
          Export PDF / Print
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
            <td class="text-center">{{ item.self_score || '-' }}</td>
            <td class="text-center font-weight-bold">{{ item.committee_score > 0 ? item.committee_score : '-' }}</td>
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
          <div class="border-bottom mb-2" style="width: 200px; margin: 0 auto;">&nbsp;</div>
          <div>ลงชื่อ ผู้รับการประเมิน</div>
        </div>
        <div class="text-center">
          <div class="border-bottom mb-2" style="width: 200px; margin: 0 auto;">&nbsp;</div>
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

// Computed for display
const selectedRoundName = computed(() => {
  const r = rounds.value.find(i => i.id === selectedRoundId.value);
  return r ? r.round_name : '';
});

const totalSelfScore = computed(() => {
  return reportData.value.reduce((sum, item) => sum + Number(item.self_score || 0), 0);
});

const totalCommitteeScore = computed(() => {
  // รวมคะแนนเฉลี่ยที่ถูกคำนวณมาแล้ว (ใช้ parseFloat เพราะค่า committee_score ถูกคำนวณเป็นทศนิยม 2 ตำแหน่ง)
  return reportData.value.reduce((sum, item) => sum + parseFloat(item.committee_score || 0), 0);
});

const resultStatus = computed(() => {
  // Mock logic for status based on score
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
    console.error(error);
  }
});

const fetchReport = async () => {
  if (!selectedRoundId.value) return;
  
  try {
    // 1. Get Criterias for structure
    const criRes = await api.get(`/admin/rounds/${selectedRoundId.value}/criterias`);
    const criterias = criRes.data.data;

    // 2. Get My Evaluations (Self + Committee)
    const evalRes = await api.get(`/user/evaluations/${selectedRoundId.value}`);
    const selfEvals = evalRes.data.data;
    
    // [FIXED] ปรับ Logic การรวมคะแนนกรรมการให้เป็นค่าเฉลี่ย
    reportData.value = criterias.map(c => {
      // 1. ดึงคะแนนประเมินตนเอง
      const myEval = selfEvals.find(e => e.criteria_id === c.id && e.evaluator_id === userProfile.id);
      
      // 2. ดึงคะแนนกรรมการทั้งหมด (evaluator_id ที่ไม่ใช่ ID ของฉัน)
      const committeeEvals = selfEvals.filter(e => 
        e.criteria_id === c.id && 
        e.evaluator_id !== userProfile.id
      );

      let committeeScore = 0;
      let committeeComment = '';

      if (committeeEvals.length > 0) {
        // คำนวณคะแนนเฉลี่ยจากกรรมการทุกคน
        const totalScore = committeeEvals.reduce((sum, e) => sum + Number(e.score || 0), 0);
        committeeScore = (totalScore / committeeEvals.length).toFixed(2);
        
        // เลือก Comment ของกรรมการคนแรกที่พบมาแสดง
        committeeComment = committeeEvals[0].comment || ''; 
      }

      return {
        id: c.id,
        topic_name: c.topic_name,
        indicator_name: c.indicator_name,
        self_score: myEval ? myEval.score : 0,
        committee_score: committeeScore, // เป็น String (2 ทศนิยม) หรือ 0
        committee_comment: committeeComment
      };
    });

  } catch (error) {
    console.error(error);
  }
};

// [5.2.7] Print Function
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

/* Print Specific Styles */
@media print {
  /* Hide non-printable elements handled by d-print-none class */
  
  /* Force background colors */
  body {
    -webkit-print-color-adjust: exact;
  }
  
  /* Setup Page */
  @page {
    margin: 2cm;
  }
  
  .v-container {
    max-width: 100% !important;
    width: 100% !important;
    padding: 0 !important;
  }
}
</style>