import { type RouteRecordRaw } from 'vue-router';
export const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/live/results',
    name: 'admin-homepage',
    meta: {
      requiresAuth: true,
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
      },
      {
        path: 'categories',
        name: 'categories',
        component: () => import('../../views/admin/categories/categoriesMain.vue'),
      },
      {
        path: 'contestants',
        name: 'contestants',
        component: () => import('../../views/admin/contestants/contestantMain.vue'),
      },
      {
        path: 'judge',
        name: 'judge',
        component: () => import('../../views/admin/judge/judgeMain.vue'),
      },
    ],
  },
];
