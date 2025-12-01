// File: frontend/src/plugins/axios.js

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Create Axios Instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api', 
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==========================================
// Request Interceptor
// ==========================================
// แนบ Token ไปกับทุก Request ถ้ามี Token ใน Store
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// Response Interceptor
// ==========================================
// จัดการกรณี Token หมดอายุ (401) ให้ Logout อัตโนมัติ
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      authStore.logout(); 
      console.warn('Session expired (401). Logging out...');
    }
    return Promise.reject(error);
  }
);

export default api;