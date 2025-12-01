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
        กำหนดคู่การประเมิน (Create Mapping)
      </v-card-title>
      <v-card-text class="pt-5">
        <v-form @submit.prevent="submitMapping">
          <v-row>
            <v-col cols="12" md="3">
              <v-select 
                v-model="mappingForm.round_id" 
                :items="rounds" 
                item-title="round_name" 
                item-value="id" 
                label="1. เลือกรอบ" 
                variant="outlined" 
                density="compact"
                hide-details
              ></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-select 
                v-model="mappingForm.evaluatee_id" 
                :items="userCandidates" 
                item-title="fullname" 
                item-value="id" 
                label="2. ผู้รับการประเมิน" 
                variant="outlined" 
                density="compact"
                hide-details
              ></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-select 
                v-model="mappingForm.evaluator_id" 
                :items="committeeCandidates" 
                item-title="fullname" 
                item-value="id" 
                label="3. กรรมการ" 
                variant="outlined" 
                density="compact"
                hide-details
              ></v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-select 
                v-model="mappingForm.role" 
                :items="roleOptions" 
                item-title="title" 
                item-value="value" 
                label="4. ตำแหน่ง" 
                variant="outlined" 
                density="compact"
                hide-details
              ></v-select>
            </v-col>
          </v-row>
          <v-row justify="end" class="mt-2">
            <v-btn type="submit" color="success" :loading="isSubmitting" prepend-icon="mdi-plus">
              บันทึกการจับคู่
            </v-btn>
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
      <v-table density="compact" hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>รอบการประเมิน</th>
            <th>ผู้รับการประเมิน</th>
            <th>กรรมการ</th>
            <th class="text-center">ตำแหน่ง</th>
            <th class="text-center">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="map in mappingList" :key="map.id">
            <td>{{ map.id }}</td>
            <td>{{ map.round_name }}</td>
            <td>{{ map.evaluatee }}</td>
            <td>{{ map.evaluator }}</td>
            <td class="text-center">
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
                @click="openDeleteDialog(map)"
              ></v-btn>
            </td>
          </tr>
          <tr v-if="mappingList.length === 0">
            <td colspan="6" class="text-center text-grey py-6">ยังไม่มีข้อมูลการจับคู่</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="isEditDialogOpen" max-width="600px">
      <v-card>
        <v-card-title class="bg-primary text-white">แก้ไขการจับคู่</v-card-title>
        <v-card-text class="pt-4">
          <v-form @submit.prevent="saveEditMapping">
            <v-select v-model="editForm.round_id" :items="rounds" item-title="round_name" item-value="id" label="รอบการประเมิน" variant="outlined"></v-select>
            <v-select v-model="editForm.evaluatee_id" :items="userCandidates" item-title="fullname" item-value="id" label="ผู้รับการประเมิน" variant="outlined"></v-select>
            <v-select v-model="editForm.evaluator_id" :items="committeeCandidates" item-title="fullname" item-value="id" label="กรรมการ" variant="outlined"></v-select>
            <v-select v-model="editForm.role" :items="roleOptions" item-title="title" item-value="value" label="ตำแหน่ง" variant="outlined"></v-select>
            
            <div class="d-flex justify-end mt-2">
              <v-btn color="grey" variant="text" class="mr-2" @click="isEditDialogOpen = false">ยกเลิก</v-btn>
              <v-btn type="submit" color="success">บันทึกการแก้ไข</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isDeleteDialogOpen" max-width="400px">
      <v-card>
        <v-card-title class="text-error font-weight-bold">ยืนยันการลบ?</v-card-title>
        <v-card-text>
          คุณต้องการลบการจับคู่นี้ใช่หรือไม่?<br>
          <div class="text-grey mt-1">
            {{ mappingToDelete?.evaluatee }} <v-icon size="small">mdi-arrow-right</v-icon> {{ mappingToDelete?.evaluator }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="isDeleteDialogOpen = false">ยกเลิก</v-btn>
          <v-btn color="error" variant="elevated" @click="executeDeleteMapping">ลบข้อมูล</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.message }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../../plugins/axios';

// State
const rounds = ref([]);
const allUsers = ref([]);
const mappingList = ref([]);
const isSubmitting = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

// Forms
const mappingForm = reactive({ round_id: null, evaluator_id: null, evaluatee_id: null, role: 'member' });
const editForm = reactive({});
const roleOptions = [{ title: 'ประธาน', value: 'chairman' }, { title: 'กรรมการ', value: 'member' }];

// Dialogs
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const mappingToDelete = ref(null);

// Computeds
const userCandidates = computed(() => allUsers.value.filter(u => u.role === 'user'));
const committeeCandidates = computed(() => allUsers.value.filter(u => u.role === 'committee'));

onMounted(async () => {
  await Promise.all([fetchRounds(), fetchUsers(), fetchMappings()]);
});

// API Calls
const fetchRounds = async () => { const res = await api.get('/admin/rounds'); rounds.value = res.data.data; };
const fetchUsers = async () => { const res = await api.get('/admin/users'); allUsers.value = res.data.data; };
const fetchMappings = async () => { 
    try {
        const res = await api.get('/admin/mappings'); 
        mappingList.value = res.data.data; 
    } catch(e) { console.error(e); }
};

// Handlers
const submitMapping = async () => {
  if (!mappingForm.round_id || !mappingForm.evaluator_id || !mappingForm.evaluatee_id) {
      showSnackbar('กรุณากรอกข้อมูลให้ครบ', 'warning');
      return;
  }
  
  isSubmitting.value = true;
  try {
    await api.post('/admin/mapping', mappingForm);
    showSnackbar('บันทึกสำเร็จ', 'success');
    await fetchMappings();
  } catch (error) {
    showSnackbar(error.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
  } finally { 
    isSubmitting.value = false; 
  }
};

const openEditDialog = (item) => {
  Object.assign(editForm, item);
  isEditDialogOpen.value = true;
};

const saveEditMapping = async () => {
  try {
    await api.put(`/admin/mapping/${editForm.id}`, editForm);
    showSnackbar('แก้ไขสำเร็จ', 'success');
    isEditDialogOpen.value = false;
    await fetchMappings();
  } catch (error) {
    showSnackbar('แก้ไขไม่สำเร็จ', 'error');
  }
};

const openDeleteDialog = (item) => {
  mappingToDelete.value = item;
  isDeleteDialogOpen.value = true;
};

const executeDeleteMapping = async () => {
  if (!mappingToDelete.value) return;
  try {
    await api.delete(`/admin/mapping/${mappingToDelete.value.id}`);
    showSnackbar('ลบสำเร็จ', 'success');
    isDeleteDialogOpen.value = false;
    await fetchMappings();
  } catch (error) {
    showSnackbar('ลบไม่สำเร็จ', 'error');
  }
};

const showSnackbar = (msg, color) => {
    snackbar.message = msg;
    snackbar.color = color;
    snackbar.show = true;
};
</script>