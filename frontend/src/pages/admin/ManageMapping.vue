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

    <v-card class="elevation-4 mb-6">
      <v-card-title class="bg-primary text-white">
        กำหนดคู่การประเมิน
      </v-card-title>
      <v-card-text class="pt-5">
        <v-form @submit.prevent="submitMapping">
          <v-row>
            <v-col cols="12" md="3">
              <v-select v-model="formData.round_id" :items="rounds" item-title="round_name" item-value="id" label="1. เลือกรอบ" variant="outlined" density="compact"></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-select v-model="formData.evaluatee_id" :items="users" item-title="fullname" item-value="id" label="2. ผู้รับการประเมิน" variant="outlined" density="compact"></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-select v-model="formData.evaluator_id" :items="committees" item-title="fullname" item-value="id" label="3. กรรมการ" variant="outlined" density="compact"></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-select v-model="formData.role" :items="roles" item-title="title" item-value="value" label="4. ตำแหน่ง" variant="outlined" density="compact"></v-select>
            </v-col>
          </v-row>
          <v-row justify="end">
            <v-btn type="submit" color="success" :loading="loading">บันทึกการจับคู่</v-btn>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>

    <v-card class="elevation-2 border">
      <v-card-title class="bg-grey-lighten-4">
        <v-icon start>mdi-table-search</v-icon> รายการที่จับคู่ไว้แล้ว
        <v-spacer></v-spacer>
        <v-btn icon="mdi-refresh" size="small" variant="text" @click="fetchMappings"></v-btn>
      </v-card-title>
      <v-table density="compact">
        <thead>
          <tr>
            <th>ID</th>
            <th>รอบการประเมิน</th>
            <th>ผู้รับการประเมิน</th>
            <th>กรรมการ</th>
            <th>ตำแหน่ง</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="map in existingMappings" :key="map.id">
            <td>{{ map.id }}</td>
            <td>{{ map.round_name }}</td>
            <td>{{ map.evaluatee }}</td>
            <td>{{ map.evaluator }}</td>
            <td>{{ map.role }}</td>
          </tr>
          <tr v-if="existingMappings.length === 0">
            <td colspan="5" class="text-center text-grey py-4">ยังไม่มีข้อมูล</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.message }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../../plugins/axios';

const rounds = ref([]);
const allUsers = ref([]);
const existingMappings = ref([]);
const loading = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

const formData = reactive({ round_id: null, evaluator_id: null, evaluatee_id: null, role: 'member' });
const roles = [{ title: 'ประธาน', value: 'chairman' }, { title: 'กรรมการ', value: 'member' }];

onMounted(async () => {
  await Promise.all([fetchRounds(), fetchUsers(), fetchMappings()]);
});

const fetchRounds = async () => { const res = await api.get('/admin/rounds'); rounds.value = res.data.data; };
const fetchUsers = async () => { const res = await api.get('/admin/users'); allUsers.value = res.data.data; };
const fetchMappings = async () => { 
    try {
        const res = await api.get('/admin/mappings'); 
        existingMappings.value = res.data.data; 
    } catch(e) { console.error(e); }
};

const users = computed(() => allUsers.value.filter(u => u.role === 'user'));
const committees = computed(() => allUsers.value.filter(u => u.role === 'committee'));

const submitMapping = async () => {
  if (!formData.round_id || !formData.evaluator_id || !formData.evaluatee_id) return;
  loading.value = true;
  try {
    await api.post('/admin/mapping', formData);
    snackbar.message = 'บันทึกสำเร็จ'; snackbar.color = 'success'; snackbar.show = true;
    await fetchMappings(); // Refresh table
  } catch (error) {
    snackbar.message = error.response?.data?.message || 'Error'; snackbar.color = 'error'; snackbar.show = true;
  } finally { loading.value = false; }
};
</script>