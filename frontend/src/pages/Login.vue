<!-- [3.1] [7.1] หน้า Login สวยงาม -->
<!-- src/pages/Login.vue -->
<template>
  <v-container fluid class="fill-height" style="background-color: #f0f4f8;">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12 rounded-lg">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title class="text-center">ระบบประเมินบุคลากร</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <v-alert
                v-if="errorMessage"
                type="error"
                variant="outlined"
                class="mb-4"
              >
                {{ errorMessage }}
              </v-alert>

              <v-text-field
                v-model="username"
                label="Username"
                prepend-icon="mdi-account"
                type="text"
                required
                variant="outlined"
                class="mb-3"
              ></v-text-field>

              <v-text-field
                v-model="password"
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
                Login
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions class="justify-center pa-4">
            <router-link to="/register">ยังไม่มีบัญชี? ลงทะเบียนที่นี่</router-link>
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
const loading = ref(false);
const errorMessage = ref(null);

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = "กรุณากรอก Username และ Password";
    return;
  }
  
  loading.value = true;
  errorMessage.value = null;
  
  try {
    await authStore.login(username.value, password.value);
    //
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Login failed. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
a {
  text-decoration: none;
  color: #1976D2; /* Vuetify Primary color */
}
a:hover {
  text-decoration: underline;
}
</style>