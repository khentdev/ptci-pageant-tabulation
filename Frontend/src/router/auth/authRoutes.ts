import { type RouteRecordRaw } from 'vue-router';
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
        meta: { isAuthPage: true },
      },
    ],
  },
];
