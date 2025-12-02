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
      <div class="mt-3">กำลังโหลดข้อมูล...</div>
    </div>

    <v-form @submit.prevent="handleSubmitGrading" v-else>
      <v-table class="elevation-2 border mb-6">
        <thead>
          <tr class="bg-grey-lighten-3">
            <th width="30%" class="font-weight-bold">หัวข้อ / ตัวชี้วัด</th>
            <th width="30%" class="font-weight-bold text-center">ประเมินตนเอง (User)</th>
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
                <div v-if="c.self_comment" class="text-caption text-grey font-italic mt-2 pa-2 bg-grey-lighten-5 rounded">
                  "{{ c.self_comment }}"
                </div>
                <div class="d-flex flex-column gap-2 align-center mt-2">
                  <v-btn v-if="c.self_evidence_url" :href="getExternalLink(c.self_evidence_url)" target="_blank" size="small" prepend-icon="mdi-link" variant="flat" color="blue-darken-1" class="text-white w-100" style="max-width: 200px;">
                    เปิดลิงก์แนบ
                  </v-btn>
                  <v-btn v-if="c.self_evidence_file" :href="getFileUrl(c.self_evidence_file)" target="_blank" size="small" prepend-icon="mdi-file-eye" variant="flat" color="teal-darken-1" class="text-white w-100" style="max-width: 200px;">
                    ดูไฟล์แนบ
                  </v-btn>
                </div>
              </div>
              <div v-else class="text-grey text-caption py-4 border-dashed rounded">
                - ยังไม่มีการประเมินตนเอง -
              </div>
            </td>

            <td class="align-top bg-grey-lighten-5 px-4 py-3">
              <div class="d-flex justify-space-between align-center mb-2">
                 <div class="font-weight-bold text-caption text-grey-darken-2">คะแนนที่ให้:</div>
                 
                 <div v-if="c.my_score !== null" class="text-caption text-success font-weight-bold">
                    <v-icon start size="x-small" color="success">mdi-check-circle</v-icon>
                    บันทึกแล้ว: {{ c.my_score }}
                 </div>
              </div>

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
      
      <v-card class="mb-6 elevation-2 border border-secondary">
        <v-card-title class="bg-grey-lighten-4 text-subtitle-1 font-weight-bold">
          <v-icon start color="secondary">mdi-comment-text-outline</v-icon>
          ความคิดเห็นสรุปโดยภาพรวม (Overall Comment)
        </v-card-title>
        <v-card-text class="pt-4">
          <v-textarea
            v-model="overallComment"
            label="สรุปผลการประเมิน / จุดเด่น / จุดที่ควรพัฒนา"
            variant="outlined"
            rows="3"
            placeholder="ระบุความคิดเห็นสรุปสำหรับผู้รับการประเมินรายนี้..."
            hide-details
          ></v-textarea>
        </v-card-text>
      </v-card>

      <v-card class="elevation-4 border-t-lg border-primary mb-6">
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" start>mdi-check-decagram</v-icon>
          ส่วนยืนยันผลการประเมิน
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div v-if="existingSignature" class="mb-3 pa-3 bg-green-lighten-5 rounded border border-success d-flex align-center">
                <v-icon color="success" class="mr-3" size="large">mdi-file-sign</v-icon>
                <div>
                  <div class="text-success font-weight-bold">มีลายเซ็นแล้ว</div>
                  <div class="text-caption text-grey-darken-1">ระบบจะใช้ลายเซ็นเดิมนี้</div>
                </div>
                <v-spacer></v-spacer>
                <v-btn :href="getFileUrl(existingSignature)" target="_blank" variant="elevated" size="small" color="success" prepend-icon="mdi-eye">
                  ดูลายเซ็น
                </v-btn>
              </div>

              <v-file-input
                v-model="signatureFile"
                :label="existingSignature ? 'เปลี่ยนลายเซ็น (อัปโหลดทับ)' : 'อัปโหลดลายเซ็นดิจิทัล'"
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
const overallComment = ref('');
const signatureFile = ref([]); 
const existingSignature = ref(null);
const loading = ref(true);
const submitLoading = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

// ---------------------------------------------------------
// [FIXED] ย้าย showSnackbar ขึ้นมาประกาศก่อนที่จะถูกเรียกใช้งาน
// ---------------------------------------------------------
const showSnackbar = (msg, color) => {
  snackbar.message = msg;
  snackbar.color = color;
  snackbar.show = true;
};

const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `http://localhost:5000${cleanPath}`;
};

const getExternalLink = (url) => {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

onMounted(async () => {
  await fetchData();
});

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/committee/grading/${roundId.value}/${evaluateeId.value}`);
    criterias.value = res.data.data;
    overallComment.value = res.data.overall_comment || '';
    
    if (criterias.value.length > 0) {
      const firstItem = criterias.value[0];
      if (firstItem.my_evidence_file) {
        existingSignature.value = firstItem.my_evidence_file;
      } else if (firstItem.profile_signature) {
        existingSignature.value = firstItem.profile_signature;
      }
    }

    criterias.value.forEach(c => {
      const hasScore = c.my_score !== null && c.my_score !== undefined;
      formModels[c.id] = {
        score: hasScore ? Number(c.my_score) : null, 
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
    let signaturePath = existingSignature.value; 
    
    if (signatureFile.value && signatureFile.value.length > 0) {
      const file = signatureFile.value[0];
      signaturePath = await fileToBase64(file);
    }
    
    const promises = criterias.value.map(c => {
      const scoreToSend = formModels[c.id].score !== null ? formModels[c.id].score : 0;

      const payload = {
        round_id: roundId.value,
        criteria_id: c.id,
        evaluatee_id: evaluateeId.value,
        score: scoreToSend,
        comment: formModels[c.id].comment,
      };
      
      if (c.id === criterias.value[0].id) {
        payload.evidence_file = signaturePath;
      }
      
      return api.post('/committee/grade', payload);
    });

    promises.push(api.post('/committee/overall-comment', {
        round_id: roundId.value,
        evaluatee_id: evaluateeId.value,
        comment: overallComment.value
    }));
    
    await Promise.all(promises);
    
    showSnackbar('บันทึกผลการประเมินเรียบร้อยแล้ว', 'success');
    
    setTimeout(() => {
      router.push('/evaluation-list');
    }, 1500);

  } catch (error) {
    console.error("Submit Error:", error);
    showSnackbar(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
  } finally {
    submitLoading.value = false;
  }
};
</script>