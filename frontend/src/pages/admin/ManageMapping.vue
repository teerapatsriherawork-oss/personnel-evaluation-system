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
            <v-btn type="submit" color="success" :loading="loading" prepend-icon="mdi-plus">บันทึกการจับคู่</v-btn>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>

    <v-card class="elevation-2 border">
      <v-card-title class="bg-grey-lighten-4 d-flex align-center">
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
            <th class="text-center">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="map in existingMappings" :key="map.id">
            <td>{{ map.id }}</td>
            <td>{{ map.round_name }}</td>
            <td>{{ map.evaluatee }}</td>
            <td>{{ map.evaluator }}</td>
            <td>
              <v-chip :color="map.role === 'chairman' ? 'orange' : 'blue-grey'" size="small" label>
                {{ map.role === 'chairman' ? 'ประธาน' : 'กรรมการ' }}
              </v-chip>
            </td>
            <td class="text-center">
              <v-btn
                icon="mdi-pencil"
                size="x-small"
                variant="text"
                color="primary"
                @click="openEditDialog(map)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                size="x-small"
                variant="text"
                color="error"
                @click="confirmDelete(map)"
              ></v-btn>
            </td>
          </tr>
          <tr v-if="existingMappings.length === 0">
            <td colspan="6" class="text-center text-grey py-4">ยังไม่มีข้อมูล</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-card-title class="bg-primary text-white">แก้ไขการจับคู่</v-card-title>
        <v-card-text class="pt-4">
          <v-form @submit.prevent="saveEdit">
            <v-select v-model="editingItem.round_id" :items="rounds" item-title="round_name" item-value="id" label="รอบการประเมิน" variant="outlined"></v-select>
            <v-select v-model="editingItem.evaluatee_id" :items="users" item-title="fullname" item-value="id" label="ผู้รับการประเมิน" variant="outlined"></v-select>
            <v-select v-model="editingItem.evaluator_id" :items="committees" item-title="fullname" item-value="id" label="กรรมการ" variant="outlined"></v-select>
            <v-select v-model="editingItem.role" :items="roles" item-title="title" item-value="value" label="ตำแหน่ง" variant="outlined"></v-select>
            
            <div class="d-flex justify-end mt-2">
              <v-btn color="grey" variant="text" class="mr-2" @click="editDialog = false">ยกเลิก</v-btn>
              <v-btn type="submit" color="success">บันทึกการแก้ไข</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-error">ยืนยันการลบ?</v-card-title>
        <v-card-text>
          คุณต้องการลบการจับคู่นี้ใช่หรือไม่?<br>
          <small class="text-grey">ข้อมูล: {{ itemToDelete?.evaluatee }} - {{ itemToDelete?.evaluator }}</small>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteDialog = false">ยกเลิก</v-btn>
          <v-btn color="error" variant="elevated" @click="submitDelete">ลบข้อมูล</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

// Edit/Delete State
const editDialog = ref(false);
const deleteDialog = ref(false);
const editingItem = reactive({});
const itemToDelete = ref(null);

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
    await fetchMappings();
  } catch (error) {
    snackbar.message = error.response?.data?.message || 'Error'; snackbar.color = 'error'; snackbar.show = true;
  } finally { loading.value = false; }
};

// [NEW] Edit Functions
const openEditDialog = (item) => {
  Object.assign(editingItem, item); // Copy values
  editDialog.value = true;
};

const saveEdit = async () => {
  try {
    await api.put(`/admin/mapping/${editingItem.id}`, editingItem);
    snackbar.message = 'แก้ไขสำเร็จ'; snackbar.color = 'success'; snackbar.show = true;
    editDialog.value = false;
    await fetchMappings();
  } catch (error) {
    snackbar.message = error.response?.data?.message || 'แก้ไขไม่สำเร็จ'; 
    snackbar.color = 'error'; 
    snackbar.show = true;
  }
};

// [NEW] Delete Functions
const confirmDelete = (item) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const submitDelete = async () => {
  if (!itemToDelete.value) return;
  try {
    await api.delete(`/admin/mapping/${itemToDelete.value.id}`);
    snackbar.message = 'ลบสำเร็จ'; snackbar.color = 'success'; snackbar.show = true;
    deleteDialog.value = false;
    await fetchMappings();
  } catch (error) {
    snackbar.message = 'ลบไม่สำเร็จ'; snackbar.color = 'error'; snackbar.show = true;
  }
};
</script>