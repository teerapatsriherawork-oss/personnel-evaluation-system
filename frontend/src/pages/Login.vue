<template>
  <v-container fluid class="fill-height" style="background-color: #f0f4f8;">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12 rounded-lg">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title class="text-center">ระบบประเมินบุคลากร</v-toolbar-title>
          </v-toolbar>
          
          <v-card-text class="pt-6">
            <v-form @submit.prevent="handleLogin">
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
                v-model="username"
                label="Username"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                required
                class="mb-2"
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="Password"
                prepend-inner-icon="mdi-lock"
                type="password"
                variant="outlined"
                required
                class="mb-4"
              ></v-text-field>

              <v-btn
                :loading="isLoading"
                :disabled="isLoading"
                type="submit"
                color="primary"
                block
                size="large"
                class="text-uppercase font-weight-bold"
              >
                เข้าสู่ระบบ
              </v-btn>
            </v-form>
          </v-card-text>
          
          <v-card-actions class="justify-center pa-4 bg-grey-lighten-5">
            <router-link to="/register" class="text-decoration-none text-body-2 font-weight-medium">
              ยังไม่มีบัญชี? ลงทะเบียนที่นี่
            </router-link>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();
const username = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref(null);

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = "กรุณากรอก Username และ Password";
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = null;
  
  try {
    await authStore.login(username.value, password.value);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ โปรดตรวจสอบข้อมูล";
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
a {
  color: #1976D2;
  transition: opacity 0.2s;
}
a:hover {
  opacity: 0.8;
  text-decoration: underline;
}
</style>