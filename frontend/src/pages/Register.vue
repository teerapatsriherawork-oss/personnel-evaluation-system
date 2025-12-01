<template>
  <v-container fluid class="fill-height" style="background-color: #f0f4f8;">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5">
        <v-card class="elevation-12 rounded-lg">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title class="text-center">สร้างบัญชีผู้ใช้งานใหม่</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="handleRegister">
              <v-alert
                v-if="errorMessage"
                type="error"
                variant="outlined"
                class="mb-4"
              >
                {{ errorMessage }}
              </v-alert>

              <v-text-field
                v-model="formData.fullname"
                label="ชื่อ-นามสกุล (Full Name)"
                prepend-icon="mdi-account-card-details"
                type="text"
                required
                variant="outlined"
                class="mb-3"
              ></v-text-field>
              
              <v-text-field
                v-model="formData.username"
                label="Username"
                prepend-icon="mdi-account"
                type="text"
                required
                variant="outlined"
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="formData.password"
                label="Password"
                prepend-icon="mdi-lock"
                type="password"
                required
                variant="outlined"
                class="mb-3"
              ></v-text-field>
              
              <v-btn
                :loading="loading"
                :disabled="loading"
                type="submit"
                color="primary"
                block
                size="large"
              >
                Register
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions class="justify-center pa-4">
            <router-link to="/login">มีบัญชีอยู่แล้ว? กลับไปหน้า Login</router-link>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();
const loading = ref(false);
const errorMessage = ref(null);

const formData = reactive({
  username: '',
  password: '',
  fullname: '',
  role: 'user', // [แก้ไข] กำหนดค่าเริ่มต้นเป็น 'user' เสมอ
});

const handleRegister = async () => {
  // ตรวจสอบข้อมูล (ไม่ต้องเช็ค role เพราะมีค่า default อยู่แล้ว)
  if (!formData.username || !formData.password || !formData.fullname) {
    errorMessage.value = "กรุณากรอกข้อมูลให้ครบถ้วน";
    return;
  }
  
  loading.value = true;
  errorMessage.value = null;
  
  try {
    await authStore.register(formData);
    // authStore.register จะ redirect ไปหน้า login เองเมื่อสำเร็จ
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Registration failed. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
a {
  text-decoration: none;
  color: #1976D2;
}
a:hover {
  text-decoration: underline;
}
</style>