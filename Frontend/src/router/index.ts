import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth/authStore';
import { authRoutes } from './auth/authRoutes';

export const routes: RouteRecordRaw[] = [...authRoutes];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from) => {
  const authStore = useAuthStore();

  if (!authStore.currentUser) {
    await authStore.checkAuth();
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'login' };
  }

  if (to.meta.requiresGuest && authStore.isAdmin) {
    return { name: 'admin-homepage' };
  }
});

export default router;
