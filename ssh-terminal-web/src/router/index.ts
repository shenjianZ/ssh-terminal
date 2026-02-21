import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'sessions',
        name: 'Sessions',
        component: () => import('@/views/sessions/SessionList.vue')
      },
      {
        path: 'sessions/new',
        name: 'NewSession',
        component: () => import('@/views/sessions/SessionForm.vue')
      },
      {
        path: 'sessions/:id/edit',
        name: 'EditSession',
        component: () => import('@/views/sessions/SessionForm.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/Profile.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 初始化认证状态
  authStore.init()

  const isAuthenticated = authStore.isAuthenticated

  // 需要认证的路由
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  }
  // 需要访客状态的路由（登录、注册页）
  else if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'Dashboard' })
  }
  else {
    next()
  }
})

export default router