<template>
  <div class="home">
    <div class="hero fade-in">
      <div class="hero-text">
        <h1>Learn English smarter</h1>
        <p>AI-powered vocabulary with spaced repetition and adaptive practice.</p>
      </div>
      <div class="hero-action">
        <button class="btn-primary hero-btn" @click="$router.push('/daily')">
          Start Today's Task
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left:6px"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card stat-1 fade-in">
        <div class="stat-icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
        <div class="stat-body">
          <span class="stat-value">{{ progress.learnedCount }}</span>
          <span class="stat-label">Words Learned</span>
        </div>
      </div>
      <div class="stat-card stat-2 fade-in">
        <div class="stat-icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>
        <div class="stat-body">
          <span class="stat-value">{{ progress.accuracy }}%</span>
          <span class="stat-label">Accuracy</span>
        </div>
      </div>
      <div class="stat-card stat-3 fade-in">
        <div class="stat-icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
        <div class="stat-body">
          <span class="stat-value">{{ progress.totalScore }}</span>
          <span class="stat-label">Total Score</span>
        </div>
      </div>
      <div class="stat-card stat-4 fade-in">
        <div class="stat-icon-wrap"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></div>
        <div class="stat-body">
          <span class="stat-value">{{ progress.streakDays }}</span>
          <span class="stat-label">Day Streak</span>
        </div>
      </div>
    </div>

    <div class="daily-section fade-in">
      <div class="daily-info">
        <h3>Today's Goal</h3>
        <p v-if="progress.todayLearned < progress.dailyGoal">
          {{ progress.todayLearned }} / {{ progress.dailyGoal }} words completed
        </p>
        <p v-else class="done">Daily goal achieved!</p>
        <div class="daily-bar">
          <div class="daily-fill" :style="{ width: Math.min(progress.todayLearned / progress.dailyGoal * 100, 100) + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="menu-grid">
      <div class="menu-card menu-1 scale-in" @click="$router.push('/daily')">
        <div class="menu-icon-wrap menu-icon-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="menu-body">
          <h3>Daily Task</h3>
          <p>Learn words and practice with adaptive games</p>
        </div>
      </div>
      <div class="menu-card menu-2 scale-in" @click="$router.push('/wordbank')">
        <div class="menu-icon-wrap menu-icon-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <div class="menu-body">
          <h3>Word Bank</h3>
          <p>Browse Cambridge graded vocabulary</p>
        </div>
      </div>
      <div class="menu-card menu-3 scale-in" @click="$router.push('/progress')">
        <div class="menu-icon-wrap menu-icon-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <div class="menu-body">
          <h3>Progress</h3>
          <p>Learning curve, trends, and achievements</p>
        </div>
      </div>
      <div class="menu-card menu-4 scale-in" @click="$router.push('/settings')">
        <div class="menu-icon-wrap menu-icon-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </div>
        <div class="menu-body">
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

.hero {
  background: var(--gradient-primary);
  border-radius: 20px;
  padding: 32px 36px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.2);
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: '';
  position: absolute;
  top: -20px; right: -20px;
  width: 120px; height: 120px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
}

.hero::before {
  content: '';
  position: absolute;
  bottom: -30px; right: 60px;
  width: 80px; height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
}

.hero-text { position: relative; z-index: 1; }
.hero-text h1 { font-size: 26px; font-weight: 800; color: white; margin-bottom: 4px; }
.hero-text p { font-size: 14px; color: rgba(255,255,255,0.85); }

.hero-btn {
  background: white;
  color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  position: relative;
  z-index: 1;
}
.hero-btn:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.2); }

.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }

.stat-card {
  background: white;
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-card);
  border: 1px solid rgba(99, 102, 241, 0.06);
}

.stat-icon-wrap {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.stat-1 .stat-icon-wrap { background: #EEF2FF; color: #6366F1; }
.stat-2 .stat-icon-wrap { background: #FEF3C7; color: #D97706; }
.stat-3 .stat-icon-wrap { background: #FCE7F3; color: #EC4899; }
.stat-4 .stat-icon-wrap { background: #D1FAE5; color: #059669; }

.stat-body { display: flex; flex-direction: column; }
.stat-value { font-size: 22px; font-weight: 800; color: var(--color-text); }
.stat-label { font-size: 12px; color: var(--color-text-light); }

.daily-section {
  background: white;
  border-radius: var(--radius);
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-card);
  border: 1px solid rgba(99, 102, 241, 0.06);
}

.daily-info h3 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.daily-info p { font-size: 14px; color: var(--color-text-light); margin-bottom: 10px; }
.daily-info .done { color: var(--color-success); font-weight: 600; }
.daily-bar { height: 8px; background: #E0E7FF; border-radius: 4px; overflow: hidden; }
.daily-fill { height: 100%; background: var(--gradient-primary); border-radius: 4px; transition: width 0.4s ease; }

.menu-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

.menu-card {
  background: white;
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-card);
  border: 1px solid rgba(99, 102, 241, 0.06);
}
.menu-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); border-color: rgba(99, 102, 241, 0.15); }

.menu-icon-wrap {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.menu-icon-1 { background: var(--gradient-primary); color: white; }
.menu-icon-2 { background: var(--gradient-secondary); color: white; }
.menu-icon-3 { background: var(--gradient-accent); color: white; }
.menu-icon-4 { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; }

.menu-body h3 { font-size: 15px; font-weight: 700; }
.menu-body p { font-size: 13px; color: var(--color-text-light); margin-top: 2px; }
</style>
