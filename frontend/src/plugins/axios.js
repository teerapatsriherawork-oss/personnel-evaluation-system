// [2] Setup Interceptor (Auto attach JWT Token)
// src/plugins/axios.js

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // URL ของ Backend (จาก Part 2)
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor
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

// Response Interceptor (Optional: Handle 401 for auto-logout)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      authStore.logout(); // ถ้า Token หมดอายุ ให้ Logout
      console.error('Unauthorized, logging out.');
    }
    return Promise.reject(error);
  }
);

export default api;