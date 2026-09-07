import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth/authStore';
import { authRoutes } from './auth/authRoutes';
import { adminRoutes } from './admin/adminRoutes';

export const routes: RouteRecordRaw[] = [
  // The hardcoded '/' redirect is removed to prevent conflicting with authRoutes
  ...authRoutes,
  ...adminRoutes,
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // 1. Mandatory Session Check
  // We must know who the user is before deciding where they can go.

  // 2. Define route guards cleanly
  const isLoggedIn = !!authStore.currentUser;
  const isAdmin = authStore.isAdmin;
  const isJudge = authStore.isJudge;

  const hasAuthPages = to.matched.some((record) => record.meta.isAuthPage);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);
  const requiresJudge = to.matched.some((record) => record.meta.requiresJudge);
  if (hasAuthPages) {
    return;
  }
  // 3. Prevent logged-in users from seeing the login page

  if (isLoggedIn && hasAuthPages) {
    if (isAdmin) {
      return { name: 'admin-homepage' };
    }
    if (isJudge) {
      return { name: 'judge-homepage' };
    }
  }
  if (!authStore.sessionInitialized) {
    await authStore.checkAuth();
  }
  // 4. Allow guest users to stay on auth pages

  // 5. Block unauthenticated traffic to protected pages
  if (!isLoggedIn) {
    return { name: 'login' };
  }

  // 6. Strict Role Protection
  if (requiresAdmin && !authStore.isAdmin) {
    return authStore.isJudge ? { name: 'judge-homepage' } : { name: 'login' };
  }

  if (requiresJudge && !authStore.isJudge) {
    return authStore.isAdmin ? { name: 'admin-homepage' } : { name: 'login' };
  }
});

export default router;
