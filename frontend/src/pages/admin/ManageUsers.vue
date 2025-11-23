<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <h1 class="text-h4 font-weight-bold text-primary">
          <v-icon start>mdi-account-group</v-icon>
          จัดการข้อมูลผู้ใช้งาน
        </h1>
        <v-btn color="success" prepend-icon="mdi-plus" @click="openDialog()">
          เพิ่มผู้ใช้งานใหม่
        </v-btn>
      </v-col>
    </v-row>

    <v-card class="mt-4 mb-4 pa-2 elevation-1">
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="ค้นหาชื่อ หรือ Username..."
        single-line
        hide-details
        density="compact"
        variant="outlined"
      ></v-text-field>
    </v-card>

    <v-card class="elevation-2">
      <v-table>
        <thead class="bg-grey-lighten-4">
          <tr>
            <th class="text-left font-weight-bold">ID</th>
            <th class="text-left font-weight-bold">Username</th>
            <th class="text-left font-weight-bold">ชื่อ-นามสกุล</th>
            <th class="text-center font-weight-bold">สถานะ (Role)</th>
            <th class="text-center font-weight-bold">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredUsers" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.username }}</td>
            <td>{{ item.fullname }}</td>
            <td class="text-center">
              <v-chip :color="getRoleColor(item.role)" size="small" label>
                {{ item.role.toUpperCase() }}
              </v-chip>
            </td>
            <td class="text-center">
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                color="primary"
                @click="openDialog(item)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(item)"
              ></v-btn>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="5" class="text-center text-grey py-4">ไม่พบข้อมูล</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">
          {{ editedItem.id ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้งานใหม่' }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form @submit.prevent="saveUser">
            <v-text-field
              v-model="editedItem.fullname"
              label="ชื่อ-นามสกุล"
              variant="outlined"
              density="compact"
              class="mb-2"
            ></v-text-field>
            
            <v-text-field
              v-model="editedItem.username"
              label="Username (ชื่อผู้ใช้)"
              variant="outlined"
              density="compact"
              class="mb-2"
            ></v-text-field>

            <v-text-field
              v-model="editedItem.password"
              label="รหัสผ่าน (Password)"
              placeholder="เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน"
              type="password"
              variant="outlined"
              density="compact"
              class="mb-2"
              :hint="editedItem.id ? 'ใส่เฉพาะเมื่อต้องการเปลี่ยนรหัส' : 'กำหนดรหัสผ่านใหม่'"
              persistent-hint
            ></v-text-field>

            <v-select
              v-model="editedItem.role"
              :items="roles"
              item-title="title"
              item-value="value"
              label="บทบาท (Role)"
              variant="outlined"
              density="compact"
            ></v-select>

            <div class="d-flex justify-end mt-4">
              <v-btn color="grey" variant="text" class="mr-2" @click="dialog = false">ยกเลิก</v-btn>
              <v-btn color="success" type="submit" :loading="saving">บันทึก</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">ยืนยันการลบ?</v-card-title>
        <v-card-text>คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน: <strong>{{ itemToDelete?.fullname }}</strong> ?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="dialogDelete = false">ยกเลิก</v-btn>
          <v-btn color="error" variant="elevated" @click="deleteUserConfirm">ลบข้อมูล</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import api from '../../plugins/axios';

const users = ref([]);
const loading = ref(false);
const saving = ref(false);
const search = ref('');
const dialog = ref(false);
const dialogDelete = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

const roles = [
  { title: 'ผู้ดูแลระบบ (Admin)', value: 'admin' },
  { title: 'ผู้ใช้งาน (User)', value: 'user' },
  { title: 'กรรมการ (Committee)', value: 'committee' },
];

const defaultItem = {
  id: null,
  username: '',
  password: '',
  fullname: '',
  role: 'user',
};

const editedItem = reactive({ ...defaultItem });
const itemToDelete = ref(null);

onMounted(() => {
  fetchUsers();
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await api.get('/admin/users');
    users.value = res.data.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// Filter Logic for Search (Manual filter for v-table)
const filteredUsers = computed(() => {
  if (!search.value) return users.value;
  const q = search.value.toLowerCase();
  return users.value.filter(u => 
    u.fullname.toLowerCase().includes(q) || 
    u.username.toLowerCase().includes(q)
  );
});

const getRoleColor = (role) => {
  if (role === 'admin') return 'error';
  if (role === 'committee') return 'warning';
  return 'success';
};

const openDialog = (item = null) => {
  if (item) {
    Object.assign(editedItem, item);
    editedItem.password = ''; // Reset password field
  } else {
    Object.assign(editedItem, defaultItem);
  }
  dialog.value = true;
};

const saveUser = async () => {
  if (!editedItem.username || !editedItem.fullname) {
    snackbar.message = 'กรุณากรอกข้อมูลให้ครบ';
    snackbar.color = 'warning';
    snackbar.show = true;
    return;
  }

  saving.value = true;
  try {
    if (editedItem.id) {
      // Update
      await api.put(`/admin/users/${editedItem.id}`, editedItem);
      snackbar.message = 'แก้ไขข้อมูลสำเร็จ';
    } else {
      // Create
      if (!editedItem.password) {
        snackbar.message = 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่';
        snackbar.color = 'warning';
        snackbar.show = true;
        saving.value = false;
        return;
      }
      await api.post('/admin/users', editedItem);
      snackbar.message = 'เพิ่มผู้ใช้งานสำเร็จ';
    }
    snackbar.color = 'success';
    snackbar.show = true;
    dialog.value = false;
    await fetchUsers();
  } catch (error) {
    console.error(error);
    snackbar.message = error.response?.data?.message || 'เกิดข้อผิดพลาด';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (item) => {
  itemToDelete.value = item;
  dialogDelete.value = true;
};

const deleteUserConfirm = async () => {
  if (!itemToDelete.value) return;
  try {
    await api.delete(`/admin/users/${itemToDelete.value.id}`);
    snackbar.message = 'ลบข้อมูลสำเร็จ';
    snackbar.color = 'success';
    snackbar.show = true;
    dialogDelete.value = false;
    await fetchUsers();
  } catch (error) {
    snackbar.message = 'ลบไม่สำเร็จ';
    snackbar.color = 'error';
    snackbar.show = true;
  }
};
</script>