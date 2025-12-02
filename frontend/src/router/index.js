import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

import MainLayout from '../layouts/MainLayout.vue';
import Login from '../pages/Login.vue';
import Register from '../pages/Register.vue';

// Admin Pages
const Dashboard = () => import('../pages/admin/Dashboard.vue');
const ManageCriteria = () => import('../pages/admin/ManageCriteria.vue');
const ManageMapping = () => import('../pages/admin/ManageMapping.vue');
const ManageRounds = () => import('../pages/admin/ManageRounds.vue');
const ManageUsers = () => import('../pages/admin/ManageUsers.vue');
const CommitteeSummary = () => import('../pages/admin/CommitteeSummary.vue');
const CommitteeTracking = () => import('../pages/admin/CommitteeTracking.vue');
const EvaluateeTracking = () => import('../pages/admin/EvaluateeTracking.vue');
// [เพิ่มบรรทัดนี้] Import หน้าดูรายงาน
const IndividualReport = () => import('../pages/admin/IndividualReport.vue'); 

// User Pages
const SelfAssessment = () => import('../pages/user/SelfAssessment.vue');
const MyReport = () => import('../pages/user/MyReport.vue');
const Profile = () => import('../pages/user/Profile.vue');
const UserProgress = () => import('../pages/user/UserProgress.vue');

// Committee Pages
const EvaluationList = () => import('../pages/committee/EvaluationList.vue');
const Grading = () => import('../pages/committee/Grading.vue');

const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { requiresAuth: false } },
  { path: '/register', name: 'Register', component: Register, meta: { requiresAuth: false } },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      // Admin Routes
      { path: 'dashboard', component: Dashboard, meta: { roles: ['admin'] } },
      { path: 'admin/rounds', component: ManageRounds, meta: { roles: ['admin'] } },
      { path: 'manage-criteria', component: ManageCriteria, meta: { roles: ['admin'] } },
      { path: 'manage-mapping', component: ManageMapping, meta: { roles: ['admin'] } },
      { path: 'manage-users', component: ManageUsers, meta: { roles: ['admin'] } },
      { path: 'admin/committee-summary', component: CommitteeSummary, meta: { roles: ['admin'] } },
      { path: 'admin/committee-tracking', component: CommitteeTracking, meta: { roles: ['admin'] } },
      { path: 'admin/evaluatee-tracking', component: EvaluateeTracking, meta: { roles: ['admin'] } },
      
      // [เพิ่มส่วนนี้] Route สำหรับหน้าดูรายงาน
      { path: 'admin/report/:roundId/:userId', component: IndividualReport, meta: { roles: ['admin'] } },

      // User Routes
      { path: 'self-assessment', component: SelfAssessment, meta: { roles: ['user'] } },
      { path: 'my-report', component: MyReport, meta: { roles: ['user'] } },
      { path: 'progress', component: UserProgress, meta: { roles: ['user'] } },
      
      // Profile Route
      { path: 'profile', component: Profile, meta: { roles: ['admin', 'user', 'committee'] } },

      // Committee Routes
      { path: 'evaluation-list', component: EvaluationList, meta: { roles: ['committee'] } },
      { path: 'grading/:roundId/:evaluateeId', component: Grading, meta: { roles: ['committee'] } },
      
      {
        path: '',
        redirect: () => {
          const authStore = useAuthStore();
          if (authStore.user?.role === 'admin') return '/dashboard';
          if (authStore.user?.role === 'user') return '/self-assessment';
          if (authStore.user?.role === 'committee') return '/evaluation-list';
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth;
  const requiredRoles = to.meta.roles;

  if (requiresAuth && !isAuthenticated) next('/login');
  else if (!requiresAuth && isAuthenticated && (to.path === '/login' || to.path === '/register')) next('/');
  else if (isAuthenticated && requiredRoles) {
    if (requiredRoles.includes(authStore.user.role)) next();
    else next('/');
  } else next();
});

export default router;