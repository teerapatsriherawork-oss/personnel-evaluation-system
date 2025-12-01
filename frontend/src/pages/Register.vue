<template>
  <v-container fluid class="fill-height" style="background-color: #f0f4f8;">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5">
        <v-card class="elevation-12 rounded-lg">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title class="text-center">ลงทะเบียนสมาชิกใหม่</v-toolbar-title>
          </v-toolbar>
          
          <v-card-text class="pt-6">
            <v-form @submit.prevent="handleRegister">
              <v-alert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                class="mb-4"
                density="compact"
              >
                {{ errorMessage }}
              </v-alert>

              <v-text-field
                v-model="formData.fullname"
                label="ชื่อ-นามสกุล (Full Name)"
                prepend-inner-icon="mdi-account-card-details"
                variant="outlined"
                required
                class="mb-2"
              ></v-text-field>
              
              <v-text-field
                v-model="formData.username"
                label="Username"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                required
                class="mb-2"
              ></v-text-field>

              <v-text-field
                v-model="formData.password"
                label="Password"
                prepend-inner-icon="mdi-lock"
                type="password"
                variant="outlined"
                required
                class="mb-4"
                hint="รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"
                persistent-hint
              ></v-text-field>
              
              <v-btn
                :loading="isLoading"
                :disabled="isLoading"
                type="submit"
                color="primary"
                block
                size="large"
                class="font-weight-bold"
              >
                ยืนยันการสมัคร
              </v-btn>
            </v-form>
          </v-card-text>
          
          <v-card-actions class="justify-center pa-4 bg-grey-lighten-5">
            <router-link to="/login" class="text-decoration-none text-body-2 font-weight-medium">
              มีบัญชีอยู่แล้ว? กลับไปหน้า Login
            </router-link>
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
const isLoading = ref(false);
const errorMessage = ref(null);

const formData = reactive({
  username: '',
  password: '',
  fullname: '',
  role: 'user', // Default role for self-registration
});

const handleRegister = async () => {
  // 1. Validation
  if (!formData.username || !formData.password || !formData.fullname) {
    errorMessage.value = "กรุณากรอกข้อมูลให้ครบถ้วน";
    return;
  }
  if (formData.password.length < 6) {
    errorMessage.value = "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = null;
  
  try {
    await authStore.register(formData);
    // authStore will redirect on success
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "การลงทะเบียนล้มเหลว โปรดลองใหม่อีกครั้ง";
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
a {
  color: #1976D2;
}
a:hover {
  text-decoration: underline;
}
</style>