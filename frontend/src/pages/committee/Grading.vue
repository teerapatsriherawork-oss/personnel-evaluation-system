<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-2 font-weight-bold text-primary">
          <v-icon start>mdi-pencil-box</v-icon>
          ให้คะแนนการประเมิน
        </h1>
        <h2 class="text-h6 text-grey-darken-1">
          ผู้รับการประเมิน: {{ evaluateeInfo.fullname }} (รอบ: {{ roundInfo.name }})
        </h2>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-3">กำลังโหลดเกณฑ์...</div>
    </div>

    <!-- Main Form -->
    <v-form @submit.prevent="handleSubmitGrading" v-else>
      <!-- Criteria Table -->
      <v-table class="elevation-2 border">
        <thead>
          <tr class="bg-grey-lighten-3">
            <th width="40%" class="font-weight-bold">เกณฑ์การประเมิน</th>
            <th width="20%" class="font-weight-bold text-center">ข้อมูลจาก User (ตนเอง)</th>
            <th width="40%" class="font-weight-bold text-center">การประเมินจากกรรมการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in criterias" :key="c.id">
            <!-- 1. Criteria Info -->
            <td class="py-3">
              <div class="font-weight-bold">{{ c.topic_name }}</div>
              <div class="text-caption text-grey-darken-1">{{ c.indicator_name }}</div>
            </td>
            
            <!-- 2. [5.3.2, 5.3.3] User's Self-Assessment Data (Mocked Data) -->
            <td class="text-center">
              <div>
                <span class="text-caption">คะแนน:</span>
                <span class="font-weight-bold text-blue">{{ c.self_score || 0 }}</span>
              </div>
              <div v-if="c.self_evidence_url" class="mt-1">
                <v-btn :href="c.self_evidence_url" target="_blank" size="x-small" prepend-icon="mdi-link" variant="tonal" color="info">
                  เปิดลิงก์
                </v-btn>
              </div>
              <div v-if="c.self_evidence_file" class="mt-1">
                <v-btn :href="c.self_evidence_file" target="_blank" size="x-small" prepend-icon="mdi-file-download" variant="tonal" color="success">
                  ดาวน์โหลดไฟล์
                </v-btn>
              </div>
            </td>

            <!-- 3. [5.3.4, 5.3.5] Committee Input -->
            <td>
              <v-label class="mb-2">คะแนน (กรรมการ)</v-label>
              <v-radio-group v-model="formModels[c.id].score" inline density="compact" class="mb-2">
                <v-radio v-if="c.scoring_type === 'scale'" label="1" :value="1"></v-radio>
                <v-radio v-if="c.scoring_type === 'scale'" label="2" :value="2"></v-radio>
                <v-radio v-if="c.scoring_type === 'scale'" label="3" :value="3"></v-radio>
                <v-radio v-if="c.scoring_type === 'scale'" label="4" :value="4"></v-radio>
                <v-radio v-if="c.scoring_type === 'boolean'" label="ไม่มี" :value="0"></v-radio>
                <v-radio v-if="c.scoring_type === 'boolean'" label="มี" :value="c.max_score"></v-radio>
              </v-radio-group>
              
              <v-textarea
                v-model="formModels[c.id].comment"
                label="ความคิดเห็น (กรรมการ)"
                variant="outlined"
                rows="2"
                density="compact"
              ></v-textarea>
            </td>
          </tr>
        </tbody>
      </v-table>
      
      <!-- [5.3.7] Signature & Submit Section -->
      <v-card class="mt-6 elevation-4">
        <v-card-title class="bg-grey-lighten-2">
          <v-icon start>mdi-check-decagram</v-icon>
          ยืนยันการประเมิน
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-label class="mb-2 font-weight-bold">ลงนาม (Signature) [5.3.7]</v-label>
              <v-file-input
                v-model="signatureFile"
                label="อัปโหลดไฟล์ลายเซ็น (Image/PDF)"
                variant="outlined"
                accept=".jpg,.jpeg,.png,.pdf"
                prepend-icon=""
                prepend-inner-icon="mdi-draw"
                hint="ไฟล์นี้จะถูกแนบไปกับการประเมิน"
                persistent-hint
              ></v-file-input>
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-end">
              <!-- [5.3.8] Submit Button -->
              <v-btn
                type="submit"
                color="success"
                block
                size="large"
                :loading="submitLoading"
                prepend-icon="mdi-send"
              >
                ยืนยันและส่งผลการประเมิน
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-form>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import api from '../../plugins/axios';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const roundId = ref(route.params.roundId);
const evaluateeId = ref(route.params.evaluateeId);
const evaluatorId = authStore.user.id;

const criterias = ref([]);
const formModels = reactive({});
const signatureFile = ref([]); // v-file-input v-model is array
const loading = ref(true);
const submitLoading = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

// Mock Info (In real app, fetch this info)
const evaluateeInfo = ref({ fullname: `User ID: ${evaluateeId.value}` });
const roundInfo = ref({ name: `Round ID: ${roundId.value}` });

onMounted(async () => {
  await fetchData();
});

const fetchData = async () => {
  loading.value = true;
  try {
    // 1. Fetch Criterias
    const res = await api.get(`/admin/rounds/${roundId.value}/criterias`);
    const fetchedCriterias = res.data.data;
    
    // 2. Fetch Self-Assessment Data (MOCKING - Backend Part 2/5 lacks this API)
    // [5.3.2, 5.3.3] This data is MOCKED to fulfill the requirement
    const selfEvals = [
      { criteria_id: 1, score: 3, evidence_url: 'https://google.com' },
      { criteria_id: 2, score: 4, evidence_file: '/uploads/mock.pdf' },
    ];
    
    // 3. Fetch My (Committee) Existing Grades (MOCKING)
    const myGrades = [
      { criteria_id: 1, score: 2, comment: 'ยังไม่ดีพอ' }
    ];

    // 4. Map data
    criterias.value = fetchedCriterias.map(c => {
      const self = selfEvals.find(s => s.criteria_id === c.id) || {};
      const mine = myGrades.find(m => m.criteria_id === c.id) || {};
      
      // Init form model
      formModels[c.id] = {
        score: mine.score || 0,
        comment: mine.comment || '',
        evidence_file: null // We will handle signature upload globally
      };
      
      return {
        ...c,
        self_score: self.score,
        self_evidence_url: self.evidence_url,
        self_evidence_file: self.evidence_file
      };
    });

  } catch (error) {
    console.error(error);
    snackbar.message = 'โหลดข้อมูลเกณฑ์ล้มเหลว';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};

const handleSubmitGrading = async () => {
  submitLoading.value = true;
  
  try {
    let signaturePath = null;
    
    // 1. Upload Signature File (if exists) [5.3.7]
    if (signatureFile.value.length > 0) {
      const file = signatureFile.value[0];
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      signaturePath = uploadRes.data.data.path;
    }
    
    // 2. Prepare all API calls
    const submissionPromises = [];
    
    for (const c of criterias.value) {
      const payload = {
        round_id: roundId.value,
        criteria_id: c.id,
        evaluatee_id: evaluateeId.value,
        score: formModels[c.id].score,
        comment: formModels[c.id].comment,
      };
      
      // HACK: Attach the global signature to the *first* criteria item's evidence field,
      // as the Backend (Part 2) API `submitGrading` does not support a global signature,
      // but the `evaluations` table (Part 1) *does* have an `evidence_file` column.
      if (c.id === criterias.value[0].id && signaturePath) {
        payload.evidence_file = signaturePath;
      }
      
      // Add API call to promise array
      submissionPromises.push(api.post('/committee/grade', payload));
    }
    
    // 3. Execute all submissions
    await Promise.all(submissionPromises);
    
    snackbar.message = 'ส่งผลการประเมินเรียบร้อยแล้ว';
    snackbar.color = 'success';
    snackbar.show = true;
    
    // Redirect back to list
    setTimeout(() => {
      router.push('/evaluation-list');
    }, 1500);

  } catch (error) {
    console.error(error);
    snackbar.message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    submitLoading.value = false;
  }
};
</script>