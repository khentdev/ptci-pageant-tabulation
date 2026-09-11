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
    beforeEnter: async () => {
      const authStore = useAuthStore();
      if (!authStore.isJudge) {
        return { name: 'login' };
      }
      return;
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
