import { createRouter, createWebHistory } from 'vue-router';
import { auth } from '../services/api';

import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import RoundHistory from '../views/RoundHistory.vue';
import RoundEntry from '../views/RoundEntry.vue';
import RoundDetail from '../views/RoundDetail.vue';
import Profile from '../views/Profile.vue';
import CourseHoleByHole from '../views/CourseHoleByHole.vue';
import CourseScorecard from '../views/CourseScorecard.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'RoundHistory',
    component: RoundHistory,
    meta: { requiresAuth: true },
  },
  {
    path: '/new-round',
    name: 'RoundEntry',
    component: RoundEntry,
    meta: { requiresAuth: true },
  },
  {
    path: '/round/:roundId',
    name: 'RoundDetail',
    component: RoundDetail,
    meta: { requiresAuth: true },
  },
  {
    path: '/course',
    redirect: '/course/hole-by-hole',
    meta: { requiresAuth: false },
  },
  {
    path: '/course/hole-by-hole',
    name: 'CourseHoleByHole',
    component: CourseHoleByHole,
    meta: { requiresAuth: false },
  },
  {
    path: '/course/scorecard',
    name: 'CourseScorecard',
    component: CourseScorecard,
    meta: { requiresAuth: false },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = auth.getToken();
  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth && !token) {
    next('/login');
  } else if (!requiresAuth && token && (to.name === 'Login' || to.name === 'Register')) {
    next('/');
  } else {
    next();
  }
});

export default router;