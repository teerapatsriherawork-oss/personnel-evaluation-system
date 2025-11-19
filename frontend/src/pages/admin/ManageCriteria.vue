<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 font-weight-bold text-primary">
          <v-icon start>mdi-format-list-checks</v-icon>
          จัดการเกณฑ์การประเมิน
        </h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="5">
        <v-card class="elevation-4">
          <v-card-title class="bg-primary text-white">
            เพิ่มเกณฑ์ใหม่
          </v-card-title>
          <v-card-text class="pt-4">
            <v-form @submit.prevent="submitCriteria" ref="form">
              <v-select
                v-model="formData.round_id"
                :items="rounds"
                item-title="round_name"
                item-value="id"
                label="เลือกรอบการประเมิน"
                variant="outlined"
                density="compact"
                required
                class="mb-3"
              ></v-select>

              <v-text-field
                v-model="formData.topic_name"
                label="ชื่อหัวข้อ (Topic)"
                placeholder="เช่น สมรรถนะหลัก"
                variant="outlined"
                density="compact"
                required
                class="mb-3"
              ></v-text-field>

              <v-textarea
                v-model="formData.indicator_name"
                label="ตัวชี้วัด (Indicator)"
                placeholder="รายละเอียดตัวชี้วัด..."
                variant="outlined"
                rows="3"
                required
                class="mb-3"
              ></v-textarea>

              <v-text-field
                v-model="formData.max_score"
                label="คะแนนเต็ม"
                type="number"
                variant="outlined"
                density="compact"
                required
                class="mb-3"
              ></v-text-field>

              <v-radio-group v-model="formData.scoring_type" label="รูปแบบการให้คะแนน" class="mb-3">
                <v-radio label="แบบ มี/ไม่มี (Boolean)" value="boolean"></v-radio>
                <v-radio label="แบบ สเกล 1-4 (Scale)" value="scale"></v-radio>
              </v-radio-group>

              <v-alert
                v-if="formData.scoring_type === 'scale'"
                type="info"
                variant="tonal"
                class="mb-4 text-caption"
                border="start"
              >
                <div class="font-weight-bold mb-1">เกณฑ์คะแนนแบบสเกล 1-4:</div>
                <ul style="list-style-type: none; padding-left: 0;">
                  <li>- ระดับ 1 หมายถึง ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวังมาก</li>
                  <li>- ระดับ 2 หมายถึง ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวัง</li>
                  <li>- ระดับ 3 หมายถึง ปฏิบัติได้ตามระดับการปฏิบัติที่คาดหวัง</li>
                  <li>- ระดับ 4 หมายถึง ปฏิบัติได้สูงกว่าระดับการปฏิบัติที่คาดหวัง</li>
                </ul>
              </v-alert>

              <v-btn
                type="submit"
                color="success"
                block
                :loading="loading"
              >
                <v-icon start>mdi-plus</v-icon> บันทึกเกณฑ์
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="7">
        <v-card class="elevation-2">
          <v-card-title>
            รายการเกณฑ์ในรอบปัจจุบัน
            <v-spacer></v-spacer>
          </v-card-title>
          <v-table>
            <thead>
              <tr>
                <th>หัวข้อ</th>
                <th>ตัวชี้วัด</th>
                <th>คะแนนเต็ม</th>
                <th>รูปแบบ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in criteriaList" :key="item.id">
                <td>{{ item.topic_name }}</td>
                <td>{{ item.indicator_name }}</td>
                <td>{{ item.max_score }}</td>
                <td>
                  <v-chip :color="item.scoring_type === 'scale' ? 'primary' : 'secondary'" size="small">
                    {{ item.scoring_type }}
                  </v-chip>
                </td>
              </tr>
              <tr v-if="criteriaList.length === 0">
                <td colspan="4" class="text-center text-grey py-4">
                  ยังไม่มีข้อมูลเกณฑ์ (กรุณาเลือกรอบการประเมิน)
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import api from '../../plugins/axios';

const rounds = ref([]);
const criteriaList = ref([]);
const loading = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

const formData = reactive({
  round_id: null,
  topic_name: '',
  indicator_name: '',
  description: '', // Optional
  max_score: 10,
  scoring_type: 'scale'
});

// Fetch Rounds on Mount
onMounted(async () => {
  try {
    const res = await api.get('/admin/rounds');
    rounds.value = res.data.data;
  } catch (error) {
    console.error(error);
  }
});

// Fetch Criteria when Round Changes
watch(() => formData.round_id, async (newId) => {
  if (newId) {
    await fetchCriteria(newId);
  }
});

const fetchCriteria = async (roundId) => {
  try {
    const res = await api.get(`/admin/rounds/${roundId}/criterias`);
    criteriaList.value = res.data.data;
  } catch (error) {
    console.error(error);
  }
};

const submitCriteria = async () => {
  if (!formData.round_id || !formData.topic_name || !formData.indicator_name) {
    snackbar.message = 'กรุณากรอกข้อมูลให้ครบถ้วน';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }

  loading.value = true;
  try {
    await api.post('/admin/criterias', formData);
    
    snackbar.message = 'เพิ่มเกณฑ์เรียบร้อยแล้ว';
    snackbar.color = 'success';
    snackbar.show = true;
    
    // Refresh list and Reset form (partial)
    await fetchCriteria(formData.round_id);
    formData.indicator_name = '';
    formData.topic_name = '';
  } catch (error) {
    snackbar.message = error.response?.data?.message || 'เกิดข้อผิดพลาด';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};
</script>