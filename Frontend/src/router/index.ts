import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth/authStore';
import { authRoutes } from './auth/authRoutes';
import { adminRoutes } from './admin/adminRoutes';

<<<<<<< HEAD
export const routes: RouteRecordRaw[] = [...authRoutes, ...adminRoutes];
=======
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: { name: 'admin-homepage' },
  },
  ...authRoutes,
];
>>>>>>> cfb086b85042a834e4195daf98b16099a6c851ec

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  if (authStore.currentUser) {
    return;
  }
  const hasAuthPages = to.matched.some(record => record.meta.isAuthPage);
  if (hasAuthPages) {
    return;
  }

  if (!authStore.sessionInitialized) {
    await authStore.checkAuth();
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'login' };
  }

});

export default router;
