<template>
  <div class="progress-view">
    <h2>Progress</h2>

    <div class="stats-grid">
      <div class="stat-card card">
        <span class="stat-value">{{ progress.learnedCount }}</span>
        <span class="stat-label">Words Learned</span>
      </div>
      <div class="stat-card card">
        <span class="stat-value">{{ progress.accuracy }}%</span>
        <span class="stat-label">Accuracy</span>
      </div>
      <div class="stat-card card">
        <span class="stat-value">{{ progress.totalScore }}</span>
        <span class="stat-label">Total Score</span>
      </div>
      <div class="stat-card card">
        <span class="stat-value">{{ progress.streakDays }}</span>
        <span class="stat-label">Day Streak</span>
      </div>
    </div>

    <div class="section">
      <h3>Achievements</h3>
      <div class="achievements-grid">
        <div v-for="a in allAchievements" :key="a.id" :class="['achievement', { unlocked: progress.hasAchievement(a.id) }]">
          <span class="ach-icon">{{ a.icon }}</span>
          <span class="ach-name">{{ a.name }}</span>
          <span class="ach-status">{{ progress.hasAchievement(a.id) ? 'Unlocked' : 'Locked' }}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>7-Day Activity</h3>
      <div class="chart card">
        <div v-for="(day, i) in last7Days" :key="i" class="chart-bar-wrap">
          <div class="chart-bar" :style="{ height: barHeight(day.count) + 'px' }">
            <span class="bar-count" v-if="day.count > 0">{{ day.count }}</span>
          </div>
          <span class="bar-label">{{ day.label }}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>Recent Activity</h3>
      <div class="activity-list">
        <div v-if="recentActivity.length === 0" class="empty">No activity yet.</div>
        <div v-for="(act, i) in recentActivity" :key="i" class="activity-item">
          <span class="act-status" :class="{ correct: act.correct, wrong: !act.correct }">{{ act.correct ? 'Correct' : 'Wrong' }}</span>
          <span class="act-word">{{ act.word }}</span>
          <span class="act-mode">{{ act.gameMode || 'unknown' }}</span>
          <span class="act-time">{{ formatTime(act.time) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useProgressStore } from '../stores/progress'

const progress = useProgressStore()

const allAchievements = [
  { id: 'first_word', name: 'First Word', icon: '🌱' },
  { id: 'ten_words', name: 'Word Explorer', icon: '🌟' },
  { id: 'fifty_words', name: 'Word Master', icon: '🏆' },
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥' },
  { id: 'perfect_10', name: 'Perfect 10', icon: '💯' },
  { id: 'score_100', name: 'Century Club', icon: '🎖️' },
  { id: 'score_500', name: 'Word Wizard', icon: '🧙' }
]

const last7Days = computed(() => {
  const days = []
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toDateString()
    const count = progress.practiceHistory.filter(p => new Date(p.time).toDateString() === dateStr).length
    days.push({ label: labels[date.getDay()], count })
  }
  return days
})

const recentActivity = computed(() => [...progress.practiceHistory].reverse().slice(0, 15))

function barHeight(count) {
  const max = Math.max(...last7Days.value.map(d => d.count), 1)
  return Math.max((count / max) * 100, 3)
}

function formatTime(time) {
  const d = new Date(time)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => progress.init())
</script>

<style scoped>
.progress-view { max-width: 700px; margin: 0 auto; }
h2 { font-size: 22px; font-weight: 700; margin-bottom: 16px; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 16px; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--color-primary); }
.stat-label { font-size: 12px; color: var(--color-text-light); }

.section { margin-bottom: 24px; }
.section h3 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }

.achievements-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.achievement { background: white; border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 12px; text-align: center; opacity: 0.4; filter: grayscale(1); transition: all 0.2s ease; }
.achievement.unlocked { opacity: 1; filter: none; }
.ach-icon { font-size: 28px; display: block; }
.ach-name { font-size: 12px; font-weight: 600; display: block; margin-top: 4px; }
.ach-status { font-size: 11px; color: var(--color-text-muted); }

.chart { display: flex; align-items: flex-end; justify-content: space-around; height: 160px; padding: 20px 16px 12px; }
.chart-bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.chart-bar { width: 28px; background: var(--color-primary); border-radius: 4px 4px 2px 2px; display: flex; align-items: flex-start; justify-content: center; padding-top: 3px; min-height: 3px; transition: height 0.3s ease; }
.bar-count { font-size: 11px; font-weight: 600; color: white; }
.bar-label { font-size: 11px; color: var(--color-text-light); }

.activity-list { display: flex; flex-direction: column; gap: 4px; }
.empty { text-align: center; color: var(--color-text-muted); padding: 20px; font-size: 14px; }
.activity-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-xs); font-size: 13px; }
.act-status { font-weight: 600; min-width: 50px; }
.act-status.correct { color: var(--color-success); }
.act-status.wrong { color: var(--color-danger); }
.act-word { font-weight: 600; flex: 1; }
.act-mode { color: var(--color-text-muted); font-size: 12px; text-transform: capitalize; }
.act-time { color: var(--color-text-muted); font-size: 12px; }
</style>
