<template>
  <div class="app-container">
    <nav class="sidebar" v-if="!isFullscreen">
      <div class="logo" @click="$router.push('/')">
        <span class="logo-icon">🪄</span>
        <span class="logo-text">WordMagic</span>
      </div>
      <div class="nav-items">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <span class="nav-icon">🏠</span><span>Home</span>
        </router-link>
        <router-link to="/learn" class="nav-item" :class="{ active: $route.path === '/learn' }">
          <span class="nav-icon">📖</span><span>Learn</span>
        </router-link>
        <router-link to="/practice" class="nav-item" :class="{ active: $route.path === '/practice' }">
          <span class="nav-icon">🎮</span><span>Practice</span>
        </router-link>
        <router-link to="/wordbank" class="nav-item" :class="{ active: $route.path === '/wordbank' }">
          <span class="nav-icon">📚</span><span>Word Bank</span>
        </router-link>
        <router-link to="/progress" class="nav-item" :class="{ active: $route.path === '/progress' }">
          <span class="nav-icon">📊</span><span>Progress</span>
        </router-link>
        <router-link to="/settings" class="nav-item" :class="{ active: $route.path === '/settings' }">
          <span class="nav-icon">⚙️</span><span>Settings</span>
        </router-link>
      </div>
      <div class="nav-footer">
        <div class="streak-badge" v-if="progress.streakDays > 0">
          <span class="streak-icon">🔥</span>
          <span>{{ progress.streakDays }} Day Streak!</span>
        </div>
      </div>
    </nav>
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProgressStore } from './stores/progress'

const route = useRoute()
const progress = useProgressStore()
const isFullscreen = computed(() => false)
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #6C5CE7 0%, #a29bfe 100%);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 24px 24px;
  cursor: pointer;
}

.logo-icon { font-size: 32px; }

.logo-text {
  font-size: 22px;
  font-weight: 800;
  color: white;
}

.nav-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.nav-icon { font-size: 22px; }

.nav-footer {
  padding: 16px 20px;
}

.streak-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  padding: 10px 16px;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.streak-icon { font-size: 20px; }

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.page-enter-active, .page-leave-active {
  transition: all 0.3s ease;
}
.page-enter-from { opacity: 0; transform: translateX(20px); }
.page-leave-to { opacity: 0; transform: translateX(-20px); }
</style>
