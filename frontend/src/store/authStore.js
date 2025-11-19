// [2] Pinia store สำหรับ Login/Logout
// src/stores/authStore.js

import { defineStore } from 'pinia';
import api from '../plugins/axios';
import router from '../router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')),
    token: localStorage.getItem('token'),
  }),
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    // [3.2] Getters สำหรับเช็ค Role
    isAdmin: (state) => state.user?.role === 'admin',
    isUser: (state) => state.user?.role === 'user',
    isCommittee: (state) => state.user?.role === 'committee',
  },
  actions: {
    async login(username, password) {
      try {
        const response = await api.post('/auth/login', { username, password });
        const { token, user } = response.data.data;

        // Save to state
        this.token = token;
        this.user = user;

        // Save to local storage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Redirect to dashboard (or role-specific page)
        if (user.role === 'admin') {
          router.push('/dashboard'); // ✅ ต้องไปที่ Dashboard เพราะ Route นี้มีอยู่จริง
        } else if (user.role === 'user') {
          router.push('/self-assessment');
        } else {
          router.push('/evaluation-list');
        }

      } catch (error) {
        console.error('Login failed:', error);
        throw error; // ส่ง error กลับไปให้ Component (Login.vue)
      }
    },
    
    // [5.2.1] Register Action
    async register(userData) {
      try {
        await api.post('/auth/register', userData);
        router.push('/login'); // กลับไปหน้า Login หลังลงทะเบียนสำเร็จ
      } catch (error) {
        console.error('Registration failed:', error);
        throw error;
      }
    },

    logout() {
      // Clear state
      this.token = null;
      this.user = null;

      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login
      router.push('/login');
    },
  },
});