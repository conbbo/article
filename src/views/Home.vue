<template>
  <div class="home">
    <div class="header fade-in">
      <h1>Dashboard</h1>
      <p class="subtitle">AI-powered English vocabulary learning</p>
    </div>

    <div class="stats-row">
      <div class="stat-card card fade-in">
        <span class="stat-value">{{ progress.learnedCount }}</span>
        <span class="stat-label">Words Learned</span>
      </div>
      <div class="stat-card card fade-in">
        <span class="stat-value">{{ progress.accuracy }}%</span>
        <span class="stat-label">Accuracy</span>
      </div>
      <div class="stat-card card fade-in">
        <span class="stat-value">{{ progress.totalScore }}</span>
        <span class="stat-label">Total Score</span>
      </div>
      <div class="stat-card card fade-in">
        <span class="stat-value">{{ progress.streakDays }}</span>
        <span class="stat-label">Day Streak</span>
      </div>
    </div>

    <div class="daily-section card fade-in">
      <div class="daily-info">
        <h3>Today's Task</h3>
        <p v-if="progress.todayLearned < progress.dailyGoal">
          {{ progress.todayLearned }} / {{ progress.dailyGoal }} words completed
        </p>
        <p v-else class="done">Daily goal achieved.</p>
        <div class="daily-bar">
          <div class="daily-fill" :style="{ width: Math.min(progress.todayLearned / progress.dailyGoal * 100, 100) + '%' }"></div>
        </div>
      </div>
      <button class="btn-primary" @click="$router.push('/daily')">Start Daily Task</button>
    </div>

    <div class="menu-grid">
      <div class="menu-card card" @click="$router.push('/daily')">
        <div class="menu-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <h3>Daily Task</h3>
          <p>Learn words and practice with random game modes</p>
        </div>
      </div>
      <div class="menu-card card" @click="$router.push('/wordbank')">
        <div class="menu-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <div>
          <h3>Word Bank</h3>
          <p>Browse Cambridge graded vocabulary</p>
        </div>
      </div>
      <div class="menu-card card" @click="$router.push('/progress')">
        <div class="menu-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <div>
          <h3>Progress</h3>
          <p>View achievements and learning stats</p>
        </div>
      </div>
      <div class="menu-card card" @click="$router.push('/settings')">
        <div class="menu-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </div>
        <div>
          <h3>Settings</h3>
          <p>Configure AI provider and preferences</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useProgressStore } from '../stores/progress'
import { useSettingsStore } from '../stores/settings'

const progress = useProgressStore()
const settings = useSettingsStore()

onMounted(async () => {
  await Promise.all([progress.init(), settings.init()])
  progress.updateStreak()
})
</script>

<style scoped>
.home { max-width: 760px; margin: 0 auto; }

.header { margin-bottom: 24px; }
.header h1 { font-size: 24px; font-weight: 700; color: var(--color-text); }
.subtitle { font-size: 14px; color: var(--color-text-light); margin-top: 2px; }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }

.stat-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 16px; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--color-primary); }
.stat-label { font-size: 12px; color: var(--color-text-light); }

.daily-section { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.daily-info { flex: 1; }
.daily-info h3 { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.daily-info p { font-size: 14px; color: var(--color-text-light); margin-bottom: 8px; }
.daily-info .done { color: var(--color-success); font-weight: 500; }
.daily-bar { height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; max-width: 320px; }
.daily-fill { height: 100%; background: var(--color-primary); border-radius: 3px; transition: width 0.4s ease; }

.menu-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

.menu-card { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; transition: all 0.15s ease; }
.menu-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-hover); }

.menu-icon { width: 40px; height: 40px; border-radius: var(--radius-sm); background: #EFF6FF; color: var(--color-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.menu-card h3 { font-size: 15px; font-weight: 600; }
.menu-card p { font-size: 13px; color: var(--color-text-light); margin-top: 2px; }
</style>
