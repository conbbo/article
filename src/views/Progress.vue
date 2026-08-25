<template>
  <div class="progress-view">
    <h2>📊 My Progress</h2>

    <div class="stats-grid">
      <div class="big-stat-card">
        <span class="big-icon">📖</span>
        <span class="big-value">{{ progress.learnedCount }}</span>
        <span class="big-label">Words Learned</span>
      </div>
      <div class="big-stat-card">
        <span class="big-icon">🎯</span>
        <span class="big-value">{{ progress.accuracy }}%</span>
        <span class="big-label">Accuracy</span>
      </div>
      <div class="big-stat-card">
        <span class="big-icon">⭐</span>
        <span class="big-value">{{ progress.totalScore }}</span>
        <span class="big-label">Total Score</span>
      </div>
      <div class="big-stat-card">
        <span class="big-icon">🔥</span>
        <span class="big-value">{{ progress.streakDays }}</span>
        <span class="big-label">Day Streak</span>
      </div>
    </div>

    <div class="section">
      <h3>🏆 Achievements</h3>
      <div class="achievements-grid">
        <div v-for="a in allAchievements" :key="a.id"
          :class="['achievement', { unlocked: progress.hasAchievement(a.id) }]">
          <span class="ach-icon">{{ a.icon }}</span>
          <span class="ach-name">{{ a.name }}</span>
          <span class="ach-status">{{ progress.hasAchievement(a.id) ? 'Unlocked!' : 'Locked' }}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>📈 Practice History</h3>
      <div class="history-chart">
        <div v-for="(day, i) in last7Days" :key="i" class="chart-bar-wrap">
          <div class="chart-bar" :style="{ height: barHeight(day.count) + 'px' }">
            <span class="bar-count" v-if="day.count > 0">{{ day.count }}</span>
          </div>
          <span class="bar-label">{{ day.label }}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>📝 Recent Activity</h3>
      <div class="activity-list">
        <div v-if="recentActivity.length === 0" class="empty">No activity yet. Start learning! 🚀</div>
        <div v-for="(act, i) in recentActivity" :key="i" class="activity-item">
          <span class="act-icon">{{ act.correct ? '✅' : '❌' }}</span>
          <span class="act-word">{{ act.word }}</span>
          <span class="act-time">{{ formatTime(act.time) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProgressStore } from '../stores/progress'

const progress = useProgressStore()

const allAchievements = [
  { id: 'first_word', name: 'First Word!', icon: '🌱' },
  { id: 'ten_words', name: 'Word Explorer', icon: '🌟' },
  { id: 'fifty_words', name: 'Word Master', icon: '🏆' },
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥' },
  { id: 'perfect_10', name: 'Perfect 10', icon: '💯' },
  { id: 'score_100', name: 'Century Club', icon: '🎖️' },
  { id: 'score_500', name: 'Word Wizard', icon: '🧙' }
]

const last7Days = computed(() => {
  const days = []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toDateString()
    const count = progress.practiceHistory.filter(p =>
      new Date(p.time).toDateString() === dateStr
    ).length
    days.push({ label: dayNames[date.getDay()], count })
  }
  return days
})

const recentActivity = computed(() => {
  return [...progress.practiceHistory].reverse().slice(0, 15)
})

function barHeight(count) {
  const max = Math.max(...last7Days.value.map(d => d.count), 1)
  return Math.max((count / max) * 120, 4)
}

function formatTime(time) {
  const d = new Date(time)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.progress-view { max-width: 800px; margin: 0 auto; }

h2 { font-size: 28px; font-weight: 800; color: var(--color-primary); margin-bottom: 24px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.big-stat-card {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 24px;
  text-align: center;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.big-icon { font-size: 40px; }
.big-value { font-size: 32px; font-weight: 800; color: var(--color-primary); }
.big-label { font-size: 13px; color: var(--color-text-light); }

.section { margin-bottom: 32px; }
.section h3 { font-size: 20px; font-weight: 700; margin-bottom: 16px; }

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.achievement {
  background: var(--color-card);
  border-radius: var(--radius-sm);
  padding: 16px;
  text-align: center;
  box-shadow: var(--shadow);
  opacity: 0.4;
  filter: grayscale(1);
  transition: all 0.3s ease;
}

.achievement.unlocked { opacity: 1; filter: none; }

.ach-icon { font-size: 36px; display: block; }
.ach-name { font-size: 14px; font-weight: 700; display: block; margin-top: 6px; }
.ach-status { font-size: 11px; color: var(--color-text-light); }

.history-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 180px;
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 24px 16px 16px;
  box-shadow: var(--shadow);
}

.chart-bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }

.chart-bar {
  width: 36px;
  background: linear-gradient(180deg, var(--color-primary), var(--color-primary-light));
  border-radius: 8px 8px 4px 4px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4px;
  min-height: 4px;
  transition: height 0.3s ease;
}

.bar-count { font-size: 12px; font-weight: 700; color: white; }
.bar-label { font-size: 12px; color: var(--color-text-light); }

.activity-list { display: flex; flex-direction: column; gap: 6px; }
.empty { text-align: center; color: var(--color-text-light); padding: 24px; }

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--color-card);
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.act-icon { font-size: 18px; }
.act-word { font-weight: 700; flex: 1; }
.act-time { font-size: 13px; color: var(--color-text-light); }
</style>
