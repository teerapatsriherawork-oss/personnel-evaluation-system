<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <h1 class="text-h4 font-weight-bold text-primary">
          <v-icon start>mdi-calendar-clock</v-icon>
          จัดการรอบการประเมิน (Rounds)
        </h1>
        <v-btn color="success" prepend-icon="mdi-plus" @click="openDialog()">
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
            <th class="text-center">สถานะ</th>
            <th class="text-center">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="round in rounds" :key="round.id">
            <td>{{ round.id }}</td>
            <td>{{ round.round_name }}</td>
            <td>{{ formatDate(round.start_date) }} ถึง {{ formatDate(round.end_date) }}</td>
            <td class="text-center">
              <v-chip :color="round.status === 'open' ? 'success' : 'grey'">
                {{ round.status.toUpperCase() }}
              </v-chip>
            </td>
            <td class="text-center">
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                color="primary"
                class="mr-1"
                @click="openDialog(round)"
              ></v-btn>
              
              <v-btn
                size="small"
                :color="round.status === 'open' ? 'error' : 'success'"
                variant="outlined"
                class="mr-2"
                @click="toggleStatus(round)"
              >
                {{ round.status === 'open' ? 'ปิดรอบ' : 'เปิดรอบ' }}
              </v-btn>

              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="grey"
                @click="confirmDelete(round)"
              ></v-btn>
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
        <v-card-title class="bg-primary text-white">
          {{ formData.id ? 'แก้ไขรอบการประเมิน' : 'เพิ่มรอบการประเมินใหม่' }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form @submit.prevent="saveRound">
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
            
            <div class="d-flex justify-end">
              <v-btn color="grey" variant="text" class="mr-2" @click="dialog = false">ยกเลิก</v-btn>
              <v-btn type="submit" color="success" :loading="loading">บันทึก</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6 text-error">ยืนยันการลบ?</v-card-title>
        <v-card-text>
          คุณต้องการลบรอบ <strong>{{ roundToDelete?.round_name }}</strong> ใช่หรือไม่?<br>
          <small class="text-grey">* ข้อมูลการประเมินทั้งหมดในรอบนี้จะถูกลบด้วย</small>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" variant="elevated" @click="submitDelete">ลบข้อมูล</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../../plugins/axios';

const rounds = ref([]);
const dialog = ref(false);
const deleteDialog = ref(false);
const loading = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

const formData = reactive({ id: null, round_name: '', start_date: '', end_date: '' });
const roundToDelete = ref(null);

const fetchRounds = async () => {
  try {
    const res = await api.get('/admin/rounds');
    rounds.value = res.data.data;
  } catch (error) {
    console.error(error);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return dateString.split('T')[0];
};

const openDialog = (item = null) => {
  if (item) {
    formData.id = item.id;
    formData.round_name = item.round_name;
    formData.start_date = formatDate(item.start_date);
    formData.end_date = formatDate(item.end_date);
  } else {
    formData.id = null;
    formData.round_name = '';
    formData.start_date = '';
    formData.end_date = '';
  }
  dialog.value = true;
};

const saveRound = async () => {
  if (!formData.round_name || !formData.start_date || !formData.end_date) {
    snackbar.message = 'กรุณากรอกข้อมูลให้ครบ';
    snackbar.color = 'warning';
    snackbar.show = true;
    return;
  }

  loading.value = true;
  try {
    if (formData.id) {
      // Update
      await api.put(`/admin/rounds/${formData.id}`, formData);
      snackbar.message = 'แก้ไขข้อมูลสำเร็จ';
    } else {
      // Create
      await api.post('/admin/rounds', formData);
      snackbar.message = 'เพิ่มรอบการประเมินสำเร็จ';
    }
    snackbar.color = 'success';
    snackbar.show = true;
    dialog.value = false;
    await fetchRounds();
  } catch (error) {
    snackbar.message = 'เกิดข้อผิดพลาด: ' + (error.response?.data?.message || error.message);
    snackbar.color = 'error';
    snackbar.show = true;
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

const confirmDelete = (round) => {
  roundToDelete.value = round;
  deleteDialog.value = true;
};

const submitDelete = async () => {
  if (!roundToDelete.value) return;
  try {
    await api.delete(`/admin/rounds/${roundToDelete.value.id}`);
    snackbar.message = 'ลบข้อมูลสำเร็จ';
    snackbar.color = 'success';
    snackbar.show = true;
    deleteDialog.value = false;
    await fetchRounds();
  } catch (error) {
    snackbar.message = 'ลบไม่สำเร็จ';
    snackbar.color = 'error';
    snackbar.show = true;
  }
};

onMounted(() => {
  fetchRounds();
});
</script>