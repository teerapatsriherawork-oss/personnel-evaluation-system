<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="elevation-3">
          <v-toolbar color="primary" dark>
            <v-toolbar-title>
              <v-icon start>mdi-account-details</v-icon>
              ข้อมูลส่วนตัว (My Profile)
            </v-toolbar-title>
          </v-toolbar>
          
          <v-card-text class="pa-6">
            <v-form @submit.prevent="saveProfile" ref="form">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.username"
                    label="Username"
                    variant="outlined"
                    disabled
                    prepend-inner-icon="mdi-account"
                    hint="ไม่สามารถแก้ไขได้"
                    persistent-hint
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.fullname"
                    label="ชื่อ-นามสกุล"
                    variant="outlined"
                    required
                    prepend-inner-icon="mdi-card-account-details"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.email"
                    label="อีเมล (Email)"
                    variant="outlined"
                    prepend-inner-icon="mdi-email"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.phone"
                    label="เบอร์โทรศัพท์"
                    variant="outlined"
                    prepend-inner-icon="mdi-phone"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.position"
                    label="ตำแหน่ง (Position)"
                    variant="outlined"
                    prepend-inner-icon="mdi-briefcase"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profile.department"
                    label="แผนก/ฝ่าย (Department)"
                    variant="outlined"
                    prepend-inner-icon="mdi-domain"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>
              
              <div class="text-subtitle-1 font-weight-bold mb-2 text-primary">
                <v-icon start>mdi-draw</v-icon> ลายเซ็นดิจิทัล (Signature)
              </div>
              
              <div v-if="currentSignature" class="mb-3 pa-3 bg-grey-lighten-4 rounded border d-flex align-center">
                 <v-img :src="getFileUrl(currentSignature)" max-width="150" max-height="80" contain class="mr-4 bg-white"></v-img>
                 <span class="text-caption text-grey">ลายเซ็นปัจจุบัน</span>
              </div>

              <v-file-input
                v-model="signatureFile"
                label="อัปโหลดลายเซ็นใหม่ (ถ้าต้องการเปลี่ยน)"
                accept="image/*"
                variant="outlined"
                density="compact"
                prepend-icon=""
                prepend-inner-icon="mdi-camera"
                show-size
              ></v-file-input>

              <v-divider class="my-4"></v-divider>

              <div class="text-subtitle-1 font-weight-bold mb-2 text-error">
                <v-icon start>mdi-lock</v-icon> เปลี่ยนรหัสผ่าน (Optional)
              </div>
              <v-text-field
                v-model="password"
                label="รหัสผ่านใหม่ (New Password)"
                type="password"
                variant="outlined"
                density="compact"
                placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน"
                prepend-inner-icon="mdi-key"
              ></v-text-field>

              <div class="d-flex justify-end mt-6">
                <v-btn 
                  type="submit" 
                  color="success" 
                  size="large" 
                  prepend-icon="mdi-content-save"
                  :loading="loading"
                >
                  บันทึกการเปลี่ยนแปลง
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
const profile = reactive({
  username: '',
  fullname: '',
  email: '',
  phone: '',
  position: '',
  department: ''
});
const currentSignature = ref('');
const signatureFile = ref([]);
const password = ref('');
const loading = ref(false);
const snackbar = reactive({ show: false, message: '', color: 'success' });

const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `http://localhost:5000${path}`;
};

onMounted(async () => {
  await fetchProfile();
});

const fetchProfile = async () => {
  try {
    const res = await api.get('/user/profile');
    const data = res.data.data;
    Object.assign(profile, data);
    currentSignature.value = data.signature_path;
  } catch (error) {
    console.error(error);
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

const saveProfile = async () => {
  if (!profile.fullname) {
    snackbar.message = 'กรุณาระบุชื่อ-นามสกุล';
    snackbar.color = 'warning';
    snackbar.show = true;
    return;
  }

  loading.value = true;
  try {
    const payload = { ...profile };
    
    // Handle Signature Upload
    if (signatureFile.value && signatureFile.value.length > 0) {
      payload.signature_file = await fileToBase64(signatureFile.value[0]);
    }

    // Handle Password
    if (password.value) {
      payload.password = password.value;
    }

    await api.put('/user/profile', payload);
    
    // Update Store
    const updatedUser = { ...authStore.user, fullname: profile.fullname };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    authStore.user = updatedUser;

    snackbar.message = 'บันทึกข้อมูลเรียบร้อยแล้ว';
    snackbar.color = 'success';
    snackbar.show = true;
    password.value = ''; // Clear password field
    signatureFile.value = []; // Clear file input
    await fetchProfile(); // Refresh data

  } catch (error) {
    console.error(error);
    snackbar.message = 'เกิดข้อผิดพลาดในการบันทึก';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};
</script>