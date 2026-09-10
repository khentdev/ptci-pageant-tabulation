import { useAuthStore } from '@/stores/auth/authStore.ts';
import { type RouteRecordRaw } from 'vue-router';

export const judgeRoutes: RouteRecordRaw[] = [
  {
    path: '/judge/scoring',
    name: 'judge-homepage',
    meta: {
      requiresAuth: true,
      requiresJudge: true,
    },
    component: () => import('../../views/judge/judgeMain.vue'),
    beforeEnter: (_, __, next) => {
      const authStore = useAuthStore();
      if (!authStore.isJudge) {
        next({ name: 'login' });
      }
      next();
    },
    children: [
      {
        path: ':categoriesId',
        name: 'judge-scoring-category',
        component: () => import('../../views/judge/judgeScoringMain.vue'),
      },
    ],
  },
];
