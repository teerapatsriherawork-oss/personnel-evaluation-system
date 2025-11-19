// [2] Route Guard (check login/role)
// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

// Layout
import MainLayout from '../layouts/MainLayout.vue';

// Pages
import Login from '../pages/Login.vue';
import Register from '../pages/Register.vue';

// Admin Pages (Lazy load)
const Dashboard = () => import('../pages/admin/Dashboard.vue');
const ManageCriteria = () => import('../pages/admin/ManageCriteria.vue');
const ManageMapping = () => import('../pages/admin/ManageMapping.vue');
const ManageRounds = () => import('../pages/admin/ManageRounds.vue');

// User Pages (Lazy load)
const SelfAssessment = () => import('../pages/user/SelfAssessment.vue');
const MyReport = () => import('../pages/user/MyReport.vue');

// Committee Pages (Lazy load)
const EvaluationList = () => import('../pages/committee/EvaluationList.vue');
const Grading = () => import('../pages/committee/Grading.vue');

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false }
  },
  {
    // [3.1] Main Layout
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true }, // ทุกหน้าใน Layout นี้ต้อง Login
    children: [
      // Admin Routes [3.2]
      {
        path: 'dashboard',
        component: Dashboard,
        meta: { roles: ['admin'] }
      },
      {
        path: 'admin/rounds',
        component: ManageRounds,
        meta: { roles: ['admin'] }
      },
      {
        path: 'manage-criteria',
        component: ManageCriteria,
        meta: { roles: ['admin'] }
      },
      {
        path: 'manage-mapping',
        component: ManageMapping,
        meta: { roles: ['admin'] }
      },

      // User Routes [3.2]
      {
        path: 'self-assessment',
        component: SelfAssessment,
        meta: { roles: ['user'] }
      },
      {
        path: 'my-report',
        component: MyReport,
        meta: { roles: ['user'] }
      },
      
      // Committee Routes [3.2]
      {
        path: 'evaluation-list',
        component: EvaluationList,
        meta: { roles: ['committee'] }
      },
      {
        path: 'grading/:roundId/:evaluateeId',
        component: Grading,
        meta: { roles: ['committee'] }
      },
      
      // Redirect root path to role-specific dashboard
      {
        path: '',
        redirect: () => {
          const { user } = useAuthStore();
          if (user?.role === 'admin') return '/dashboard';
          if (user?.role === 'user') return '/self-assessment';
          if (user?.role === 'committee') return '/evaluation-list';
          return '/login';
        }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Route Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth;
  const requiredRoles = to.meta.roles;

  if (requiresAuth && !isAuthenticated) {
    // 1. ถ้าหน้าต้อง Login แต่ยังไม่ได้ Login
    next('/login');
  } else if (!requiresAuth && isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    // 2. ถ้า Login แล้ว แต่พยายามเข้าหน้า Login/Register
    next('/'); // Redirect ไปหน้า Dashboard
  } else if (isAuthenticated && requiredRoles) {
    // 3. ถ้า Login แล้ว และหน้านี้ต้องการ Role
    if (requiredRoles.includes(authStore.user.role)) {
      next(); // [3.2] ผ่าน (Role ตรง)
    } else {
      next('/'); // [3.E] ไม่ผ่าน (Role ไม่ตรง)
    }
  } else {
    // 4. กรณีอื่นๆ (เช่น หน้า Public หรือหน้า Auth ที่ไม่ต้องเช็ค Role)
    next();
  }
});

export default router;

