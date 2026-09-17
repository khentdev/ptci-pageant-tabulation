import { useAuthStore } from '@/stores/auth/authStore.ts';
import { type RouteRecordRaw } from 'vue-router';

export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/live/results',
    name: 'admin-homepage',
    meta: {
      requiresAuth: true,
      requiresAdmin: true,
      allowChairman: true,
    },
    component: () => import('../../views/admin/adminMain.vue'),
    children: [
      {
        path: 'rounds',
        name: 'rounds',
        meta: {
          requiresAuth: true,
        },
        component: () => import('../../views/admin/rounds/roundsMain.vue'),
        beforeEnter: () => {
          const authStore = useAuthStore();
          if (!authStore.isAdmin) {
            return { name: 'admin-homepage' };
          }
        },
      },
      {
        path: 'categories',
        name: 'categories',
        component: () => import('../../views/admin/categories/categoriesMain.vue'),
        beforeEnter: () => {
          const authStore = useAuthStore();
          if (!authStore.isAdmin) {
            return { name: 'admin-homepage' };
          }
        },
      },
      {
        path: 'contestants',
        name: 'contestants',
        component: () => import('../../views/admin/contestants/contestantMain.vue'),
        beforeEnter: () => {
          const authStore = useAuthStore();
          if (!authStore.isAdmin) {
            return { name: 'admin-homepage' };
          }
        },
      },
      {
        path: 'judge',
        name: 'judge',
        component: () => import('../../views/admin/judge/judgeMain.vue'),
        beforeEnter: () => {
          const authStore = useAuthStore();
          if (!authStore.isAdmin) {
            return { name: 'admin-homepage' };
          }
        },
      },
      {
        path: 'audit-trail',
        name: 'audit-trail',
        component: () => import('../../views/admin/auditTrail/auditTrailMain.vue'),
      },
      {
        path: ':roundId',
        name: 'live-event-results',
        component: () => import('../../views/admin/live_event/liveEventMain.vue'),
      },
    ],
  },
];
