<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4 font-weight-bold text-primary">
          <v-icon start>mdi-account-network</v-icon>
          จับคู่กรรมการและผู้รับการประเมิน
        </h1>
      </v-col>
    </v-row>

    <v-card class="elevation-4">
      <v-card-title class="bg-primary text-white">
        กำหนดคู่การประเมิน (Committee Mapping)
      </v-card-title>
      <v-card-text class="pt-5">
        <v-form @submit.prevent="submitMapping">
          <v-row>
            <v-col cols="12" md="3">
              <v-select
                v-model="formData.round_id"
                :items="rounds"
                item-title="round_name"
                item-value="id"
                label="1. เลือกรอบการประเมิน"
                variant="outlined"
                required
              ></v-select>
            </v-col>

            <v-col cols="12" md="3">
              <v-select
                v-model="formData.evaluatee_id"
                :items="users"
                item-title="fullname"
                item-value="id"
                label="2. ผู้รับการประเมิน (Evaluatee)"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                required
              ></v-select>
            </v-col>

            <v-col cols="12" md="3">
              <v-select
                v-model="formData.evaluator_id"
                :items="committees"
                item-title="fullname"
                item-value="id"
                label="3. กรรมการผู้ประเมิน (Evaluator)"
                prepend-inner-icon="mdi-account-tie"
                variant="outlined"
                required
              ></v-select>
            </v-col>

            <v-col cols="12" md="3">
              <v-select
                v-model="formData.role"
                :items="roles"
                item-title="title"
                item-value="value"
                label="4. ตำแหน่งในการประเมิน"
                prepend-inner-icon="mdi-badge-account"
                variant="outlined"
                required
              ></v-select>
            </v-col>
          </v-row>

          <v-row justify="end">
            <v-col cols="12" md="2">
              <v-btn
                type="submit"
                color="success"
                block
                size="large"
                :loading="loading"
              >
                บันทึกการจับคู่
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>

    <v-card class="mt-6 elevation-2">
      <v-card-title>คำแนะนำการใช้งาน</v-card-title>
      <v-card-text>
        <ul class="pl-4">
          <li>กรุณาเลือกผู้ใช้งานที่มีสิทธิ์เป็น Committee ในช่อง "กรรมการผู้ประเมิน"</li>
          <li>สามารถจับคู่กรรมการได้หลายคนต่อผู้รับการประเมิน 1 คน</li>
          <li>กำหนดตำแหน่ง (ประธาน/กรรมการ) ให้ชัดเจน</li>
        </ul>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../../plugins/axios';

const rounds = ref([]);
const allUsers = ref([]);
const loading = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

const formData = reactive({
  round_id: null,
  evaluator_id: null,
  evaluatee_id: null,
  role: 'member'
});

const roles = [
  { title: 'ประธานกรรมการ (Chairman)', value: 'chairman' },
  { title: 'กรรมการร่วม (Member)', value: 'member' }
];

// Fetch Data
onMounted(async () => {
  try {
    const [roundsRes, usersRes] = await Promise.all([
      api.get('/admin/rounds'),
      api.get('/admin/users')
    ]);
    rounds.value = roundsRes.data.data;
    allUsers.value = usersRes.data.data;
  } catch (error) {
    console.error('Error fetching data', error);
  }
});

// Filter Lists (แก้ไขตรงนี้: เอา role === 'admin' ออก)
const users = computed(() => allUsers.value.filter(u => u.role === 'user'));
const committees = computed(() => allUsers.value.filter(u => u.role === 'committee'));

const submitMapping = async () => {
  if (!formData.round_id || !formData.evaluator_id || !formData.evaluatee_id) {
    snackbar.message = 'กรุณาเลือกข้อมูลให้ครบถ้วน';
    snackbar.color = 'error';
    snackbar.show = true;
    return;
  }

  loading.value = true;
  try {
    await api.post('/admin/mapping', formData);
    snackbar.message = 'บันทึกการจับคู่สำเร็จ';
    snackbar.color = 'success';
    snackbar.show = true;
    
    // Reset fields except round
    formData.evaluator_id = null;
    formData.evaluatee_id = null;
  } catch (error) {
    snackbar.message = error.response?.data?.message || 'เกิดข้อผิดพลาด';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};
</script>