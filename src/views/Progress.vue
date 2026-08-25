<template>
  <div class="progress-view">
    <h2>Progress Analytics</h2>

    <div v-if="trend" class="trend-banner card" :class="trend.trend">
      <div class="trend-info">
        <span class="trend-label">Learning Trend</span>
        <span class="trend-value">{{ trend.trend }}</span>
      </div>
      <div class="trend-detail">
        <span>Last 7 days: {{ trend.currentAccuracy }}%</span>
        <span>Previous: {{ trend.previousAccuracy }}%</span>
        <span v-if="trend.delta !== 0" :class="trend.delta > 0 ? 'pos' : 'neg'">{{ trend.delta > 0 ? '+' : '' }}{{ trend.delta }}%</span>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card card">
        <span class="stat-value">{{ summary?.learnedCount || progress.learnedCount }}</span>
        <span class="stat-label">Words Learned</span>
      </div>
      <div class="stat-card card">
        <span class="stat-value">{{ summary?.accuracy || progress.accuracy }}%</span>
        <span class="stat-label">Accuracy</span>
      </div>
      <div class="stat-card card">
        <span class="stat-value">{{ summary?.avgMastery || 0 }}</span>
        <span class="stat-label">Avg Mastery</span>
      </div>
      <div class="stat-card card">
        <span class="stat-value">{{ summary?.totalPractice || 0 }}</span>
        <span class="stat-label">Total Questions</span>
      </div>
    </div>

    <div class="section">
      <h3>Learning Curve (14 days)</h3>
      <div class="curve-chart card">
        <div class="chart-legend">
          <span class="legend-item"><span class="dot correct"></span>Correct</span>
          <span class="legend-item"><span class="dot wrong"></span>Wrong</span>
          <span class="legend-item"><span class="dot accuracy"></span>Accuracy</span>
        </div>
        <div class="chart-bars">
          <div v-for="(day, i) in learningCurve" :key="i" class="chart-col">
            <div class="chart-val">{{ day.accuracy }}%</div>
            <div class="chart-bar-group">
              <div class="chart-bar correct-bar" :style="{ height: barH(day.correct, maxCount) + 'px' }"></div>
              <div class="chart-bar wrong-bar" :style="{ height: barH(day.wrong, maxCount) + 'px' }"></div>
            </div>
            <span class="chart-label">{{ day.date.slice(5) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="summary?.modeBreakdown?.length" class="section">
      <h3>Game Mode Performance</h3>
      <div class="mode-grid">
        <div v-for="m in summary.modeBreakdown" :key="m.mode" class="mode-card card">
          <span class="mode-name">{{ m.mode }}</span>
          <div class="mode-bar-wrap">
            <div class="mode-bar" :style="{ width: m.accuracy + '%', background: m.accuracy >= 70 ? 'var(--color-success)' : m.accuracy >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }"></div>
          </div>
          <span class="mode-acc">{{ m.accuracy }}% ({{ m.correct }}/{{ m.total }})</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>Weak Words (need review)</h3>
      <div v-if="weakWords.length === 0" class="empty card">No weak words detected. Keep practicing!</div>
      <div v-else class="weak-list">
        <div v-for="w in weakWords" :key="w.word" class="weak-item card">
          <span class="weak-word">{{ w.word }}</span>
          <span class="weak-acc" :class="w.accuracy < 50 ? 'bad' : 'ok'">{{ w.accuracy }}%</span>
          <span class="weak-detail">{{ w.correct }} correct / {{ w.wrong }} wrong</span>
        </div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProgressStore } from '../stores/progress'

const progress = useProgressStore()

const summary = ref(null)
const trend = ref(null)
const learningCurve = ref([])
const weakWords = ref([])

const allAchievements = [
  { id: 'first_word', name: 'First Word', icon: '🌱' },
  { id: 'ten_words', name: 'Word Explorer', icon: '🌟' },
  { id: 'fifty_words', name: 'Word Master', icon: '🏆' },
  { id: 'streak_3', name: '3-Day Streak', icon: '🔥' },
  { id: 'perfect_10', name: 'Perfect 10', icon: '💯' },
  { id: 'score_100', name: 'Century Club', icon: '🎖️' },
  { id: 'score_500', name: 'Word Wizard', icon: '🧙' }
]

const maxCount = computed(() => {
  return Math.max(...learningCurve.value.map(d => Math.max(d.correct, d.wrong)), 1)
})

function barH(val, max) {
  return Math.max((val / max) * 80, 2)
}

onMounted(async () => {
  await progress.init()
  if (window.electronAPI) {
    try {
      const [s, t, curve, weak] = await Promise.all([
        window.electronAPI.getSummary(),
        window.electronAPI.getTrend(),
        window.electronAPI.getLearningCurve(14),
        window.electronAPI.getWeakWords()
      ])
      summary.value = s
      trend.value = t
      learningCurve.value = curve || []
      weakWords.value = weak || []
    } catch (e) {
      // Fallback to store data
    }
  }
})
</script>

<style scoped>
.progress-view { max-width: 700px; margin: 0 auto; }
h2 { font-size: 22px; font-weight: 700; margin-bottom: 16px; }

.trend-banner { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 12px 20px; border-left: 3px solid var(--color-text-muted); }
.trend-banner.improving { border-left-color: var(--color-success); }
.trend-banner.declining { border-left-color: var(--color-danger); }
.trend-info { display: flex; flex-direction: column; gap: 2px; }
.trend-label { font-size: 12px; color: var(--color-text-light); }
.trend-value { font-size: 16px; font-weight: 700; text-transform: capitalize; }
.trend-detail { display: flex; gap: 16px; font-size: 13px; color: var(--color-text-light); }
.trend-detail .pos { color: var(--color-success); font-weight: 600; }
.trend-detail .neg { color: var(--color-danger); font-weight: 600; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
.stat-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 16px; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--color-primary); }
.stat-label { font-size: 12px; color: var(--color-text-light); }

.section { margin-bottom: 24px; }
.section h3 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }

.curve-chart { padding: 20px 16px 12px; }
.chart-legend { display: flex; gap: 16px; margin-bottom: 12px; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--color-text-light); }
.dot { width: 8px; height: 8px; border-radius: 2px; }
.dot.correct { background: var(--color-success); }
.dot.wrong { background: var(--color-danger); }
.dot.accuracy { background: var(--color-primary); }
.chart-bars { display: flex; align-items: flex-end; gap: 4px; height: 120px; overflow-x: auto; }
.chart-col { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 28px; }
.chart-val { font-size: 10px; color: var(--color-primary); font-weight: 600; }
.chart-bar-group { display: flex; gap: 2px; align-items: flex-end; height: 80px; }
.chart-bar { width: 8px; border-radius: 2px; min-height: 2px; }
.correct-bar { background: var(--color-success); }
.wrong-bar { background: var(--color-danger); }
.chart-label { font-size: 10px; color: var(--color-text-muted); }

.mode-grid { display: flex; flex-direction: column; gap: 8px; }
.mode-card { display: flex; align-items: center; gap: 12px; padding: 10px 16px; }
.mode-name { font-weight: 600; text-transform: capitalize; min-width: 80px; font-size: 14px; }
.mode-bar-wrap { flex: 1; height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.mode-bar { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
.mode-acc { font-size: 13px; color: var(--color-text-light); min-width: 100px; text-align: right; }

.empty { text-align: center; color: var(--color-text-muted); padding: 16px; font-size: 14px; }
.weak-list { display: flex; flex-direction: column; gap: 4px; }
.weak-item { display: flex; align-items: center; gap: 12px; padding: 8px 16px; }
.weak-word { font-weight: 600; min-width: 100px; }
.weak-acc { font-weight: 700; min-width: 40px; }
.weak-acc.bad { color: var(--color-danger); }
.weak-acc.ok { color: var(--color-warning); }
.weak-detail { font-size: 13px; color: var(--color-text-light); }

.achievements-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.achievement { background: white; border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 12px; text-align: center; opacity: 0.4; filter: grayscale(1); transition: all 0.2s ease; }
.achievement.unlocked { opacity: 1; filter: none; }
.ach-icon { font-size: 28px; display: block; }
.ach-name { font-size: 12px; font-weight: 600; display: block; margin-top: 4px; }
.ach-status { font-size: 11px; color: var(--color-text-muted); }
</style>
