import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth/authStore.ts';
export const routes: RouteRecordRaw[] = [
  {
    path: '/:pathMatch(.*)*',
    component: () => import('../../views/errors/notFound.vue'),
  },

  {
    path: '/',
    name: 'root',
    component: () => import('../../views/auth/loginViews.vue'),
    redirect: { name: 'login' },
    children: [
      {
        path: '/auth/login',
        name: 'login',
        component: () => import('../../views/auth/loginViews.vue'),
        meta: { requiresGuest: true },
      },
    ],
  },
  {
    path: '/admin/live/results',
    name: 'admin-homepage',
    component: () => import('../../views/admin/adminMain.vue'),
    meta: { requiresAdmin: true },
  },
];

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
