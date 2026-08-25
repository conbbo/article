import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/learn', name: 'Learn', component: () => import('../views/Learn.vue') },
  { path: '/practice', name: 'Practice', component: () => import('../views/Practice.vue') },
  { path: '/wordbank', name: 'WordBank', component: () => import('../views/WordBank.vue') },
  { path: '/progress', name: 'Progress', component: () => import('../views/Progress.vue') },
  { path: '/settings', name: 'Settings', component: () => import('../views/Settings.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
