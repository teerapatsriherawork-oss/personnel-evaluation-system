<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-2 font-weight-bold text-primary">
          <v-icon start>mdi-pencil-box</v-icon>
          ให้คะแนนการประเมิน
        </h1>
        <h2 class="text-h6 text-grey-darken-1">
          ผู้รับการประเมิน ID: {{ evaluateeId }} (รอบ ID: {{ roundId }})
        </h2>
      </v-col>
    </v-row>

    <v-alert type="info" variant="tonal" class="mb-4" icon="mdi-information">
      <v-alert-title class="text-subtitle-1 font-weight-bold">เกณฑ์การให้คะแนน (Scale 1-4)</v-alert-title>
      <v-row dense class="text-body-2 mt-1">
        <v-col cols="6" md="3"><strong>1 :</strong> ปฏิบัติได้ต่ำกว่าที่คาดหวังมาก</v-col>
        <v-col cols="6" md="3"><strong>2 :</strong> ปฏิบัติได้ต่ำกว่าที่คาดหวัง</v-col>
        <v-col cols="6" md="3"><strong>3 :</strong> ปฏิบัติได้ตามที่คาดหวัง</v-col>
        <v-col cols="6" md="3"><strong>4 :</strong> ปฏิบัติได้สูงกว่าที่คาดหวัง</v-col>
      </v-row>
    </v-alert>

    <div v-if="loading" class="text-center py-5">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-3">กำลังโหลดเกณฑ์และข้อมูล...</div>
    </div>

    <v-form @submit.prevent="handleSubmitGrading" v-else>
      <v-table class="elevation-2 border mb-6">
        <thead>
          <tr class="bg-grey-lighten-3">
            <th width="40%" class="font-weight-bold">หัวข้อ / ตัวชี้วัด</th>
            <th width="20%" class="font-weight-bold text-center">ประเมินตนเอง (User)</th>
            <th width="40%" class="font-weight-bold text-center">ส่วนของกรรมการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in criterias" :key="c.id">
            <td class="py-3 align-top">
              <div class="font-weight-bold text-subtitle-1">{{ c.topic_name }}</div>
              <div class="text-body-2 mb-1">{{ c.indicator_name }}</div>
              <div v-if="c.description" class="text-caption text-grey">
                {{ c.description }}
              </div>
            </td>
            
            <td class="text-center align-top">
              <div v-if="c.self_score !== null" class="mb-2">
                <v-chip color="blue-lighten-4" variant="flat" class="font-weight-bold text-blue-darken-4">
                  {{ c.self_score }} คะแนน
                </v-chip>
                <div v-if="c.self_comment" class="text-caption text-grey font-italic mt-1">"{{ c.self_comment }}"</div>
              </div>
              <div v-else class="text-grey text-caption py-2">- รอการประเมิน -</div>

              <div class="d-flex flex-column gap-1 align-center">
                <v-btn v-if="c.self_evidence_url" 
                  :href="c.self_evidence_url" target="_blank" 
                  size="x-small" prepend-icon="mdi-link" variant="tonal" color="info" class="mb-1">
                  เปิดลิงก์
                </v-btn>
                <v-btn v-if="c.self_evidence_file" 
                  :href="`http://localhost:5000${c.self_evidence_file}`" target="_blank" 
                  size="x-small" prepend-icon="mdi-file-download" variant="tonal" color="success">
                  ไฟล์แนบ
                </v-btn>
              </div>
            </td>

            <td class="align-top bg-grey-lighten-5 px-4 py-3">
              <div class="mb-2 font-weight-bold text-caption text-grey-darken-2">คะแนนที่ให้:</div>
              <v-radio-group v-model="formModels[c.id].score" inline density="compact" hide-details class="mb-2">
                <template v-if="c.scoring_type === 'scale'">
                  <v-radio v-for="n in 4" :key="n" :label="n.toString()" :value="n" color="primary"></v-radio>
                </template>
                <template v-else>
                  <v-radio label="ไม่ผ่าน (0)" :value="0" color="error"></v-radio>
                  <v-radio :label="`ผ่าน (${c.max_score})`" :value="c.max_score" color="success"></v-radio>
                </template>
              </v-radio-group>
              
              <v-text-field
                v-model="formModels[c.id].comment"
                label="ความคิดเห็น / ข้อเสนอแนะ"
                variant="outlined"
                density="compact"
                hide-details
                bg-color="white"
              ></v-text-field>
            </td>
          </tr>
        </tbody>
      </v-table>
      
      <v-card class="elevation-4 border-t-lg border-primary">
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" start>mdi-check-decagram</v-icon>
          ส่วนยืนยันผลการประเมิน
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-file-input
                v-model="signatureFile"
                label="อัปโหลดลายเซ็นดิจิทัล (ถ้ามี)"
                variant="outlined"
                accept=".jpg,.jpeg,.png,.pdf"
                prepend-icon=""
                prepend-inner-icon="mdi-draw"
                hint="ไฟล์รูปภาพ หรือ PDF"
                persistent-hint
                density="compact"
              ></v-file-input>
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center justify-end">
              <v-btn
                type="submit"
                color="success"
                size="large"
                width="200"
                :loading="submitLoading"
                prepend-icon="mdi-content-save-check"
                class="font-weight-bold"
              >
                บันทึกผลการประเมิน
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-form>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" location="top">
      <v-icon start color="white">{{ snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert' }}</v-icon>
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../../plugins/axios';

const route = useRoute();
const router = useRouter();

const roundId = ref(route.params.roundId);
const evaluateeId = ref(route.params.evaluateeId);

const criterias = ref([]);
const formModels = reactive({});
const signatureFile = ref([]);
const loading = ref(true);
const submitLoading = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

onMounted(async () => {
  await fetchData();
});

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/committee/grading/${roundId.value}/${evaluateeId.value}`);
    criterias.value = res.data.data;
    
    criterias.value.forEach(c => {
      formModels[c.id] = {
        score: Number(c.my_score) || 0,
        comment: c.my_comment || '',
      };
    });

  } catch (error) {
    console.error(error);
    showSnackbar('โหลดข้อมูลล้มเหลว', 'error');
  } finally {
    loading.value = false;
  }
};

const handleSubmitGrading = async () => {
  submitLoading.value = true;
  
  try {
    let signaturePath = null;
    
    if (signatureFile.value && signatureFile.value.length > 0) {
      const formData = new FormData();
      formData.append('file', signatureFile.value[0]);
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      signaturePath = uploadRes.data.data.path;
    }
    
    const promises = criterias.value.map(c => {
      const payload = {
        round_id: roundId.value,
        criteria_id: c.id,
        evaluatee_id: evaluateeId.value,
        score: formModels[c.id].score,
        comment: formModels[c.id].comment,
      };
      
      if (c.id === criterias.value[0].id && signaturePath) {
        payload.evidence_file = signaturePath;
      }
      
      return api.post('/committee/grade', payload);
    });
    
    await Promise.all(promises);
    
    showSnackbar('บันทึกผลการประเมินเรียบร้อยแล้ว', 'success');
    
    setTimeout(() => {
      router.push('/evaluation-list');
    }, 1500);

  } catch (error) {
    console.error(error);
    showSnackbar(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
  } finally {
    submitLoading.value = false;
  }
};

const showSnackbar = (msg, color) => {
  snackbar.message = msg;
  snackbar.color = color;
  snackbar.show = true;
};
</script>