<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <h1 class="text-h4 font-weight-bold text-primary">
          <v-icon start>mdi-account-group</v-icon>
          จัดการข้อมูลผู้ใช้งาน
        </h1>
        <v-btn color="success" prepend-icon="mdi-plus" @click="openUserDialog()">
          เพิ่มผู้ใช้งานใหม่
        </v-btn>
      </v-col>
    </v-row>

    <v-card class="mt-4 mb-4 pa-2 elevation-1">
      <v-text-field
        v-model="searchQuery"
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
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.fullname }}</td>
            <td class="text-center">
              <v-chip :color="getRoleColor(user.role)" size="small" label class="font-weight-bold">
                {{ user.role.toUpperCase() }}
              </v-chip>
            </td>
            <td class="text-center">
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                color="primary"
                @click="openUserDialog(user)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(user)"
              ></v-btn>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="5" class="text-center text-grey py-6">
              <v-icon size="large" class="mb-2">mdi-account-off</v-icon>
              <div>ไม่พบข้อมูลผู้ใช้งาน</div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="isUserDialogOpen" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">
          <v-icon start>mdi-account-edit</v-icon>
          {{ userForm.id ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้งานใหม่' }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form @submit.prevent="saveUser">
            <v-text-field
              v-model="userForm.fullname"
              label="ชื่อ-นามสกุล"
              variant="outlined"
              density="compact"
              class="mb-2"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="userForm.username"
              label="Username (ชื่อผู้ใช้)"
              variant="outlined"
              density="compact"
              class="mb-2"
              required
            ></v-text-field>

            <v-text-field
              v-model="userForm.password"
              label="รหัสผ่าน (Password)"
              placeholder="เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน"
              type="password"
              variant="outlined"
              density="compact"
              class="mb-2"
              :hint="userForm.id ? 'ใส่เฉพาะเมื่อต้องการเปลี่ยนรหัส' : 'กำหนดรหัสผ่านใหม่'"
              persistent-hint
            ></v-text-field>

            <v-select
              v-model="userForm.role"
              :items="rolesList"
              item-title="title"
              item-value="value"
              label="บทบาท (Role)"
              variant="outlined"
              density="compact"
            ></v-select>

            <div class="d-flex justify-end mt-4">
              <v-btn color="grey-darken-1" variant="text" class="mr-2" @click="isUserDialogOpen = false">ยกเลิก</v-btn>
              <v-btn color="success" type="submit" :loading="isSaving">บันทึก</v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isDeleteDialogOpen" max-width="400px">
      <v-card>
        <v-card-title class="text-h6 text-error font-weight-bold">
            <v-icon start color="error">mdi-alert-circle</v-icon> ยืนยันการลบ?
        </v-card-title>
        <v-card-text>
            คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน: <strong>{{ userToDelete?.fullname }}</strong> ?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="isDeleteDialogOpen = false">ยกเลิก</v-btn>
          <v-btn color="error" variant="elevated" @click="executeDeleteUser">ลบข้อมูล</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import api from '../../plugins/axios';

// State
const usersList = ref([]);
const isLoading = ref(false);
const isSaving = ref(false);
const searchQuery = ref('');

// Dialog States
const isUserDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);

const snackbar = reactive({ show: false, message: '', color: 'success' });

// Form Data
const defaultUserForm = {
  id: null,
  username: '',
  password: '',
  fullname: '',
  role: 'user',
};
const userForm = reactive({ ...defaultUserForm });
const userToDelete = ref(null);

const rolesList = [
  { title: 'ผู้ดูแลระบบ (Admin)', value: 'admin' },
  { title: 'ผู้ใช้งาน (User)', value: 'user' },
  { title: 'กรรมการ (Committee)', value: 'committee' },
];

onMounted(() => {
  fetchUsers();
});

const fetchUsers = async () => {
  isLoading.value = true;
  try {
    const res = await api.get('/admin/users');
    usersList.value = res.data.data;
  } catch (error) {
    console.error("Fetch Users Error:", error);
    showSnackbar('ไม่สามารถโหลดข้อมูลผู้ใช้งานได้', 'error');
  } finally {
    isLoading.value = false;
  }
};

const filteredUsers = computed(() => {
  if (!searchQuery.value) return usersList.value;
  const q = searchQuery.value.toLowerCase();
  return usersList.value.filter(u => 
    u.fullname.toLowerCase().includes(q) || 
    u.username.toLowerCase().includes(q)
  );
});

const getRoleColor = (role) => {
  switch(role) {
      case 'admin': return 'red-darken-1';
      case 'committee': return 'orange-darken-1';
      default: return 'green-darken-1';
  }
};

const openUserDialog = (user = null) => {
  if (user) {
    Object.assign(userForm, user);
    userForm.password = ''; // Reset password field for security
  } else {
    Object.assign(userForm, defaultUserForm);
  }
  isUserDialogOpen.value = true;
};

const saveUser = async () => {
  if (!userForm.username || !userForm.fullname) {
    showSnackbar('กรุณากรอกข้อมูลให้ครบ', 'warning');
    return;
  }

  isSaving.value = true;
  try {
    if (userForm.id) {
      // Update Existing User
      await api.put(`/admin/users/${userForm.id}`, userForm);
      showSnackbar('แก้ไขข้อมูลสำเร็จ', 'success');
    } else {
      // Create New User
      if (!userForm.password) {
        showSnackbar('กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่', 'warning');
        isSaving.value = false;
        return;
      }
      await api.post('/admin/users', userForm);
      showSnackbar('เพิ่มผู้ใช้งานสำเร็จ', 'success');
    }
    
    isUserDialogOpen.value = false;
    await fetchUsers();
  } catch (error) {
    const msg = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
    showSnackbar(msg, 'error');
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = (user) => {
  userToDelete.value = user;
  isDeleteDialogOpen.value = true;
};

const executeDeleteUser = async () => {
  if (!userToDelete.value) return;
  
  try {
    await api.delete(`/admin/users/${userToDelete.value.id}`);
    showSnackbar('ลบข้อมูลสำเร็จ', 'success');
    isDeleteDialogOpen.value = false;
    await fetchUsers();
  } catch (error) {
    showSnackbar('ลบข้อมูลไม่สำเร็จ', 'error');
  }
};

const showSnackbar = (message, color) => {
    snackbar.message = message;
    snackbar.color = color;
    snackbar.show = true;
};
</script>