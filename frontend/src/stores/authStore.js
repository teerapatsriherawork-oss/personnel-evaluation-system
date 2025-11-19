import { defineStore } from 'pinia';
import api from '../plugins/axios';
import router from '../router';

// สังเกตคำว่า export const ตรงนี้ครับ ต้องมี!
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')),
    token: localStorage.getItem('token'),
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

        this.token = token;
        this.user = user;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        if (user.role === 'admin') {
          router.push('/dashboard');
        } else if (user.role === 'user') {
          router.push('/self-assessment');
        } else {
          router.push('/evaluation-list');
        }

      } catch (error) {
        console.error('Login failed:', error);
        throw error;
      }
    },
    
    async register(userData) {
      try {
        await api.post('/auth/register', userData);
        router.push('/login');
      } catch (error) {
        console.error('Registration failed:', error);
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