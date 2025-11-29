<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 font-weight-bold text-primary">
          <v-icon start>mdi-account-edit</v-icon>
          ประเมินตนเอง (Self-Assessment)
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
          prepend-inner-icon="mdi-calendar-range"
          hide-details
          @update:modelValue="fetchCriterias"
        ></v-select>
      </v-card-text>
    </v-card>

    <div v-if="loading" class="text-center py-5">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-3">กำลังโหลดข้อมูลเกณฑ์...</div>
    </div>

    <div v-else-if="selectedRoundId && criterias.length > 0">
      <v-expansion-panels variant="popout" class="mb-6">
        <v-expansion-panel
          v-for="(criteria, index) in criterias"
          :key="criteria.id"
          elevation="2"
        >
          <v-expansion-panel-title>
            <v-row no-gutters align="center">
              <v-col cols="8">
                <div class="font-weight-bold text-subtitle-1">
                  {{ index + 1 }}. {{ criteria.topic_name }}
                </div>
                <div class="text-caption text-grey">
                  {{ criteria.indicator_name }}
                </div>
                <div v-if="criteria.description" class="text-caption text-grey-darken-1 mt-1">
                  ({{ criteria.description }})
                </div>
              </v-col>
              <v-col cols="4" class="text-right text-caption text-primary">
                (คะแนนเต็ม: {{ criteria.max_score }})
                <v-icon v-if="criteria.isSubmitted" color="success" class="ml-2">
                  mdi-check-circle
                </v-icon>
              </v-col>
            </v-row>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <v-divider class="mb-4"></v-divider>
            
            <v-form @submit.prevent="submitItem(criteria)">
              <v-row>
                <v-col cols="12" md="7">
                  <v-label class="mb-2 font-weight-bold">คะแนนประเมินตนเอง</v-label>
                  
                  <div v-if="criteria.scoring_type === 'scale'">
                    <v-radio-group v-model="formModels[criteria.id].score">
                      <v-radio label="1 - ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวังมาก" :value="1"></v-radio>
                      <v-radio label="2 - ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวัง" :value="2"></v-radio>
                      <v-radio label="3 - ปฏิบัติได้ตามระดับการปฏิบัติที่คาดหวัง" :value="3"></v-radio>
                      <v-radio label="4 - ปฏิบัติได้สูงกว่าระดับการปฏิบัติที่คาดหวัง" :value="4"></v-radio>
                    </v-radio-group>
                  </div>
                  <div v-else>
                    <v-switch
                      v-model="formModels[criteria.id].score"
                      :label="formModels[criteria.id].score ? 'มี (ผ่าน)' : 'ไม่มี (ไม่ผ่าน)'"
                      :true-value="criteria.max_score"
                      :false-value="0"
                      color="success"
                      hide-details
                    ></v-switch>
                  </div>
                </v-col>

                <v-col cols="12" md="5">
                  <v-label class="mb-2">ความคิดเห็นเพิ่มเติม / เหตุผลประกอบ</v-label>
                  <v-textarea
                    v-model="formModels[criteria.id].comment"
                    rows="4"
                    variant="outlined"
                    placeholder="ระบุเหตุผล..."
                    density="compact"
                  ></v-textarea>
                </v-col>
              </v-row>

              <v-sheet color="grey-lighten-4" class="pa-4 rounded mb-4">
                <div class="text-subtitle-2 mb-2">
                  <v-icon size="small" start>mdi-paperclip</v-icon>
                  หลักฐานประกอบ (Evidence)
                  <span v-if="criteria.require_evidence" class="text-error text-caption font-weight-bold ml-2">* จำเป็นต้องแนบ</span>
                </div>
                <v-row>
                  <v-col cols="12" md="6">
                    
                    <div v-if="formModels[criteria.id].evidence_file" class="mb-3 pa-3 bg-green-lighten-5 rounded border border-success d-flex align-center">
                        <v-icon color="success" class="mr-3">mdi-file-check</v-icon>
                        <div class="mr-auto">
                            <div class="text-success font-weight-bold">มีไฟล์แนบแล้ว</div>
                            <div class="text-caption text-grey-darken-1">
                              {{ formModels[criteria.id].evidence_file.startsWith('data:') ? 'ไฟล์ใหม่ (รอ Save)' : 'ไฟล์เดิมที่บันทึกแล้ว' }}
                            </div>
                        </div>
                        
                        <v-btn
                            v-if="!formModels[criteria.id].evidence_file.startsWith('data:')"
                            :href="getFileUrl(formModels[criteria.id].evidence_file)"
                            target="_blank"
                            color="success"
                            variant="elevated"
                            size="small"
                            prepend-icon="mdi-eye"
                        >
                            กดดูไฟล์
                        </v-btn>
                    </div>

                    <v-file-input
                      v-model="fileInputs[criteria.id]"
                      :label="formModels[criteria.id].evidence_file ? 'อัปโหลดใหม่ (เพื่อเปลี่ยนไฟล์เดิม)' : 'แนบไฟล์ (PDF/Image)'"
                      variant="outlined"
                      density="compact"
                      prepend-icon=""
                      prepend-inner-icon="mdi-file-upload"
                      accept=".pdf,.jpg,.jpeg,.png"
                      show-size
                      persistent-hint
                    ></v-file-input>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="formModels[criteria.id].evidence_url"
                      label="ลิงก์หลักฐาน (URL)"
                      placeholder="https://..."
                      variant="outlined"
                      density="compact"
                      prepend-inner-icon="mdi-link"
                    ></v-text-field>
                    
                    <div v-if="formModels[criteria.id].evidence_url" class="mt-1 text-right">
                        <a :href="formModels[criteria.id].evidence_url" target="_blank" class="text-caption text-decoration-none text-primary font-weight-bold">
                            <v-icon size="x-small" start>mdi-open-in-new</v-icon>เปิดลิงก์ที่บันทึกไว้
                        </a>
                    </div>
                  </v-col>
                </v-row>
              </v-sheet>

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="loadingIds[criteria.id]"
              >
                บันทึกหัวข้อนี้
              </v-btn>
            </v-form>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <div v-else-if="selectedRoundId" class="text-center py-5 text-grey">
      ไม่พบเกณฑ์การประเมินในรอบนี้
    </div>
    
    <div v-else class="text-center py-10 text-grey-lighten-1">
      <v-icon size="64" class="mb-3">mdi-clipboard-text-search-outline</v-icon>
      <div>กรุณาเลือกรอบการประเมินเพื่อเริ่มทำรายการ</div>
    </div>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../../plugins/axios';
import { useAuthStore } from '../../stores/authStore'; 

const authStore = useAuthStore(); 
const rounds = ref([]);
const selectedRoundId = ref(null);
const criterias = ref([]);
const loading = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

const formModels = reactive({});
const fileInputs = reactive({});
const loadingIds = reactive({});

const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `http://localhost:5000${cleanPath}`;
};

onMounted(async () => {
  try {
    const res = await api.get('/admin/rounds');
    // กรองเฉพาะรอบที่สถานะเป็น 'open' เท่านั้น
    rounds.value = res.data.data.filter(r => r.status === 'open');
  } catch (error) {
    console.error(error);
    showSnackbar('ไม่สามารถโหลดรอบการประเมินได้', 'error');
  }
});

const fetchCriterias = async () => {
  if (!selectedRoundId.value) return;
  
  loading.value = true;
  try {
    // 1. ดึงเกณฑ์ทั้งหมดของรอบนี้
    const criRes = await api.get(`/admin/rounds/${selectedRoundId.value}/criterias`);
    const fetchedCriterias = criRes.data.data;

    // 2. ดึงข้อมูลที่ User เคยประเมินไว้แล้ว (ถ้ามี)
    const evalRes = await api.get(`/user/evaluations/${selectedRoundId.value}`);
    const myEvals = evalRes.data.data || [];

    // 3. Map ข้อมูลเข้าด้วยกัน
    criterias.value = fetchedCriterias.map(c => {
      const existing = myEvals.find(e => 
        e.criteria_id == c.id && 
        e.evaluator_id == authStore.user.id
      );
      
      // Initialize form model
      formModels[c.id] = {
        score: existing ? Number(existing.score) : null,
        comment: existing?.comment || '',
        evidence_url: existing?.evidence_url || '',
        evidence_file: existing?.evidence_file || ''
      };

      // Initialize file input ref
      fileInputs[c.id] = []; 

      return {
        ...c,
        isSubmitted: !!existing // Flag ไว้โชว์ icon ติ๊กถูก
      };
    });

  } catch (error) {
    console.error(error);
    showSnackbar('โหลดข้อมูลเกณฑ์ล้มเหลว', 'error');
  } finally {
    loading.value = false;
  }
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const submitItem = async (criteria) => {
  const cId = criteria.id;
  loadingIds[cId] = true;

  try {
    // 1. ตรวจสอบว่ามีการเลือกไฟล์ใหม่หรือไม่
    // หมายเหตุ: Vuetify 3 v-file-input จะ return เป็น Array แม้จะเลือกไฟล์เดียว
    const rawFileInput = fileInputs[cId];
    const fileObj = Array.isArray(rawFileInput) && rawFileInput.length > 0 ? rawFileInput[0] : rawFileInput;

    let fileString = undefined; // เริ่มต้นเป็น undefined (สำคัญ: ห้ามเป็น "")

    if (fileObj && fileObj instanceof File) {
      // กรณีมีไฟล์ใหม่ -> แปลงเป็น Base64
      fileString = await fileToBase64(fileObj);
    } 
    // ถ้าไม่มีไฟล์ใหม่ ให้ปล่อยเป็น undefined เพื่อให้ Backend รู้ว่าไม่ต้องอัปเดตฟิลด์นี้ (ใช้ไฟล์เดิม)

    // 2. เตรียม Payload
    const payload = {
      round_id: selectedRoundId.value,
      criteria_id: cId,
      score: formModels[cId].score || 0,
      comment: formModels[cId].comment,
      evidence_url: formModels[cId].evidence_url,
      evidence_file: fileString // ส่ง undefined ไปถ้าไม่เปลี่ยนไฟล์
    };

    // 3. ส่ง API
    await api.post('/user/evaluate', payload);

    // 4. อัปเดตสถานะหน้าจอ
    criteria.isSubmitted = true;
    
    // ถ้ามีการอัปโหลดไฟล์ใหม่ ให้แสดงผลทันที (เป็น Base64 ชั่วคราว จนกว่าจะรีเฟรชหน้า)
    if (fileString) {
        formModels[cId].evidence_file = fileString;
        fileInputs[cId] = []; // ล้างช่อง input
    }
    
    showSnackbar('บันทึกข้อมูลสำเร็จ', 'success');

  } catch (error) {
    console.error("Submit Error:", error);
    showSnackbar(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
  } finally {
    loadingIds[cId] = false;
  }
};

const showSnackbar = (msg, color) => {
  snackbar.message = msg;
  snackbar.color = color;
  snackbar.show = true;
};
</script>