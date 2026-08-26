<template>
  <div class="app-container">
    <nav class="sidebar">
      <div class="logo" @click="$router.push('/')">
        <div class="logo-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <span class="logo-text">WordMagic</span>
      </div>
      <div class="nav-items">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Home</span>
        </router-link>
        <router-link to="/daily" class="nav-item" :class="{ active: $route.path === '/daily' }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Daily Task</span>
        </router-link>
        <router-link to="/wordbank" class="nav-item" :class="{ active: $route.path === '/wordbank' }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <span>Word Bank</span>
        </router-link>
        <router-link to="/progress" class="nav-item" :class="{ active: $route.path === '/progress' }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span>Progress</span>
        </router-link>
        <router-link to="/settings" class="nav-item" :class="{ active: $route.path === '/settings' }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>Settings</span>
        </router-link>
      </div>
      <div class="nav-footer">
        <div class="streak-badge" v-if="progress.streakDays > 0">
          <span class="streak-flame"></span>
          <span>{{ progress.streakDays }} day streak</span>
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
import { useProgressStore } from './stores/progress'
const progress = useProgressStore()
</script>

<style scoped>
.app-container { display: flex; height: 100vh; width: 100vw; }

.sidebar {
  width: 210px;
  background: linear-gradient(180deg, #312E81 0%, #1E1B4B 100%);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  flex-shrink: 0;
  position: relative;
}

.sidebar::after {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0;
  width: 1px;
  background: rgba(255,255,255,0.06);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px 24px;
  cursor: pointer;
}

.logo-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.logo-text { font-size: 17px; font-weight: 700; color: #F8FAFC; letter-spacing: -0.3px; }

.nav-items { flex: 1; display: flex; flex-direction: column; gap: 4px; padding: 0 10px; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: var(--radius-sm);
  color: rgba(199, 210, 254, 0.7);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-item:hover { background: rgba(255,255,255,0.06); color: #E0E7FF; }
.nav-item.active { background: rgba(99, 102, 241, 0.3); color: #FFFFFF; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2); }

.nav-footer { padding: 12px 16px; }

.streak-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(245, 158, 11, 0.15);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  color: #FCD34D;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.streak-flame {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #F59E0B;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}

.main-content { flex: 1; overflow-y: auto; padding: 28px 36px; }

.page-enter-active, .page-leave-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.page-enter-from { opacity: 0; transform: translateX(16px); }
.page-leave-to { opacity: 0; transform: translateX(-16px); }
</style>
