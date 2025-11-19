<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <h1 class="text-h4 font-weight-bold text-primary">
          <v-icon start>mdi-calendar-clock</v-icon>
          จัดการรอบการประเมิน (Rounds)
        </h1>
        <v-btn color="success" prepend-icon="mdi-plus" @click="dialog = true">
          เปิดรอบการประเมินใหม่
        </v-btn>
      </v-col>
    </v-row>

    <v-card class="mt-4 elevation-2">
      <v-table>
        <thead>
          <tr class="bg-grey-lighten-3">
            <th>ID</th>
            <th>ชื่อรอบการประเมิน</th>
            <th>วันที่เริ่ม - สิ้นสุด</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="round in rounds" :key="round.id">
            <td>{{ round.id }}</td>
            <td>{{ round.round_name }}</td>
            <td>{{ round.start_date }} ถึง {{ round.end_date }}</td>
            <td>
              <v-chip :color="round.status === 'open' ? 'success' : 'grey'">
                {{ round.status.toUpperCase() }}
              </v-chip>
            </td>
            <td>
              <v-btn
                size="small"
                :color="round.status === 'open' ? 'error' : 'success'"
                variant="outlined"
                @click="toggleStatus(round)"
              >
                {{ round.status === 'open' ? 'ปิดรอบ' : 'เปิดรอบ' }}
              </v-btn>
            </td>
          </tr>
          <tr v-if="rounds.length === 0">
            <td colspan="5" class="text-center py-4">ยังไม่มีรอบการประเมิน</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">เพิ่มรอบการประเมินใหม่</v-card-title>
        <v-card-text class="pt-4">
          <v-form @submit.prevent="createRound">
            <v-text-field
              v-model="formData.round_name"
              label="ชื่อรอบ (เช่น ประเมินครั้งที่ 1/2568)"
              variant="outlined"
              required
            ></v-text-field>
            <v-text-field
              v-model="formData.start_date"
              label="วันที่เริ่มต้น"
              type="date"
              variant="outlined"
              required
            ></v-text-field>
            <v-text-field
              v-model="formData.end_date"
              label="วันที่สิ้นสุด"
              type="date"
              variant="outlined"
              required
            ></v-text-field>
            <v-btn type="submit" color="success" block :loading="loading">บันทึก</v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../../plugins/axios';

const rounds = ref([]);
const dialog = ref(false);
const loading = ref(false);
const formData = reactive({ round_name: '', start_date: '', end_date: '' });

const fetchRounds = async () => {
  try {
    const res = await api.get('/admin/rounds');
    // จัด Format วันที่ให้อ่านง่าย (ตัดเวลาออก)
    rounds.value = res.data.data.map(r => ({
      ...r,
      start_date: r.start_date.split('T')[0],
      end_date: r.end_date.split('T')[0]
    }));
  } catch (error) {
    console.error(error);
  }
};

const createRound = async () => {
  loading.value = true;
  try {
    await api.post('/admin/rounds', formData);
    dialog.value = false;
    formData.round_name = '';
    formData.start_date = '';
    formData.end_date = '';
    await fetchRounds();
  } catch (error) {
    alert('เกิดข้อผิดพลาด: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const toggleStatus = async (round) => {
  const newStatus = round.status === 'open' ? 'closed' : 'open';
  try {
    await api.put(`/admin/rounds/${round.id}/status`, { status: newStatus });
    await fetchRounds();
  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  fetchRounds();
});
</script>