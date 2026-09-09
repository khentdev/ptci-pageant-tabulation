import { useRoundStore } from '@/stores/admin/adminSetup/rounds/roundStore.ts';
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
    children: [
      {
        path: ':categoriesId',
        name: 'judge-scoring-category',
        component: () => import('../../views/judge/judgeScoringMain.vue'),
      },
    ],
  },
];
