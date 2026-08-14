import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth/authStore.ts';
export const authRoutes: RouteRecordRaw[] = [
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
