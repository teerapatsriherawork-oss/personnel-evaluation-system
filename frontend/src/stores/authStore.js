// File: frontend/src/stores/authStore.js

import { defineStore } from 'pinia';
import api from '../plugins/axios';
import router from '../router';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isUser: (state) => state.user?.role === 'user',
    isCommittee: (state) => state.user?.role === 'committee',
  },
  
  actions: {
    async login(username, password) {
      try {
        const response = await api.post('/auth/login', { username, password });
        const { token, user } = response.data.data;

        // Update State
        this.token = token;
        this.user = user;

        // Persist to LocalStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Redirect based on Role
        switch (user.role) {
            case 'admin':
                router.push('/dashboard');
                break;
            case 'user':
                router.push('/self-assessment');
                break;
            default:
                router.push('/evaluation-list');
        }

      } catch (error) {
        throw error; // Let the component handle the error display
      }
    },
    
    async register(userData) {
      try {
        await api.post('/auth/register', userData);
        router.push('/login');
      } catch (error) {
        throw error;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    },
  },
});