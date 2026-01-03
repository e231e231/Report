import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/daily-reports',
    name: 'DailyReportList',
    component: () => import('@/views/DailyReportList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/daily-reports/new',
    name: 'DailyReportRegister',
    component: () => import('@/views/DailyReportForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/daily-reports/:id',
    name: 'DailyReportDetail',
    component: () => import('@/views/DailyReportDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/daily-reports/:id/edit',
    name: 'DailyReportEdit',
    component: () => import('@/views/DailyReportForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/employees',
    name: 'EmployeeList',
    component: () => import('@/views/EmployeeList.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/employees/new',
    name: 'EmployeeRegister',
    component: () => import('@/views/EmployeeRegister.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/information',
    name: 'InformationList',
    component: () => import('@/views/InformationList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/information/new',
    name: 'InformationRegister',
    component: () => import('@/views/InformationForm.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/information/:id/edit',
    name: 'InformationEdit',
    component: () => import('@/views/InformationForm.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/mentions',
    name: 'MentionList',
    component: () => import('@/views/MentionList.vue'),
    meta: { requiresAuth: true, requiresNonAdmin: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/search',
    name: 'DailyReportSearch',
    component: () => import('@/views/DailyReportSearch.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// ルートガード
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // 認証が必要なページ
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // セッション確認
      const isAuthenticated = await authStore.checkSession();
      if (!isAuthenticated) {
        next('/login');
        return;
      }
    }

    // 管理者のみアクセス可能
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      next('/daily-reports');
      return;
    }

    // 管理者以外のみアクセス可能
    if (to.meta.requiresNonAdmin && authStore.isAdmin) {
      next('/daily-reports');
      return;
    }
  }

  // ログイン済みでログインページにアクセスした場合
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/daily-reports');
    return;
  }

  next();
});

export default router;
