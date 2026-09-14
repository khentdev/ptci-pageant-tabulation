import type { RouteRecordRaw } from 'vue-router';

export const candidatesRoutes: RouteRecordRaw[] = [
  {
    path: '/candidates',
    name: 'candidates',
    meta: {
      isPublic: true,
    },
    component: () => import('../../views/candidates/candidatesMain.vue'),
  },
];
