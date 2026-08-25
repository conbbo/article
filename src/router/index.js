import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/daily', name: 'DailyTask', component: () => import('../views/DailyTask.vue') },
  { path: '/wordbank', name: 'WordBank', component: () => import('../views/WordBank.vue') },
  { path: '/progress', name: 'Progress', component: () => import('../views/Progress.vue') },
  { path: '/settings', name: 'Settings', component: () => import('../views/Settings.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
