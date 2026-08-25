<template>
  <div class="home">
    <div class="hero fade-in">
      <h1 class="hero-title">🪄 Welcome to WordMagic!</h1>
      <p class="hero-subtitle">Let's learn English the fun way! ✨</p>
    </div>

    <div class="stats-row">
      <div class="stat-card pop-in">
        <span class="stat-icon">📖</span>
        <span class="stat-value">{{ progress.learnedCount }}</span>
        <span class="stat-label">Words Learned</span>
      </div>
      <div class="stat-card pop-in" style="animation-delay: 0.1s">
        <span class="stat-icon">🎯</span>
        <span class="stat-value">{{ progress.accuracy }}%</span>
        <span class="stat-label">Accuracy</span>
      </div>
      <div class="stat-card pop-in" style="animation-delay: 0.2s">
        <span class="stat-icon">⭐</span>
        <span class="stat-value">{{ progress.totalScore }}</span>
        <span class="stat-label">Total Score</span>
      </div>
      <div class="stat-card pop-in" style="animation-delay: 0.3s">
        <span class="stat-icon">🔥</span>
        <span class="stat-value">{{ progress.streakDays }}</span>
        <span class="stat-label">Day Streak</span>
      </div>
    </div>

    <div class="menu-grid">
      <div class="menu-card" @click="$router.push('/learn')">
        <div class="menu-icon-wrap" style="background: #6C5CE7">📖</div>
        <h3>Learn Words</h3>
        <p>Explore new words with flashcards and audio</p>
      </div>
      <div class="menu-card" @click="$router.push('/practice')">
        <div class="menu-icon-wrap" style="background: #00CEC9">🎮</div>
        <h3>Practice</h3>
        <p>Cloze, spelling, and picture games</p>
      </div>
      <div class="menu-card" @click="$router.push('/wordbank')">
        <div class="menu-icon-wrap" style="background: #FD79A8">📚</div>
        <h3>Word Bank</h3>
        <p>Browse Cambridge graded vocabulary</p>
      </div>
      <div class="menu-card" @click="$router.push('/progress')">
        <div class="menu-icon-wrap" style="background: #FDCB6E">📊</div>
        <h3>My Progress</h3>
        <p>See achievements and learning stats</p>
      </div>
    </div>

    <div class="daily-goal" v-if="progress.todayLearned < progress.dailyGoal">
      <div class="goal-header">
        <span class="goal-icon">🎯</span>
        <span>Today's Goal: {{ progress.todayLearned }} / {{ progress.dailyGoal }} words</span>
      </div>
      <div class="goal-bar">
        <div class="goal-fill" :style="{ width: (progress.todayLearned / progress.dailyGoal * 100) + '%' }"></div>
      </div>
    </div>
    <div class="daily-goal complete" v-else>
      <span class="goal-icon">🎉</span>
      <span>Great job! You reached today's goal!</span>
    </div>
  </div>
</template>

<script setup>
import { useProgressStore } from '../stores/progress'
const progress = useProgressStore()
progress.updateStreak()
</script>

<style scoped>
.home { max-width: 900px; margin: 0 auto; }

.hero {
  text-align: center;
  padding: 40px 0 32px;
}

.hero-title {
  font-size: 36px;
  font-weight: 800;
  color: var(--color-primary);
}

.hero-subtitle {
  font-size: 20px;
  color: var(--color-text-light);
  margin-top: 8px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 20px;
  text-align: center;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon { font-size: 32px; }
.stat-value { font-size: 28px; font-weight: 800; color: var(--color-primary); }
.stat-label { font-size: 13px; color: var(--color-text-light); }

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.menu-card {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 28px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.menu-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-4px);
}

.menu-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 0 auto 16px;
}

.menu-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
.menu-card p { font-size: 14px; color: var(--color-text-light); }

.daily-goal {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 20px 28px;
  box-shadow: var(--shadow);
}

.daily-goal.complete {
  background: linear-gradient(135deg, #00B894, #00CEC9);
  color: white;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
}

.goal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.goal-icon { font-size: 24px; }

.goal-bar {
  height: 12px;
  background: #E8E8ED;
  border-radius: 6px;
  overflow: hidden;
}

.goal-fill {
  height: 100%;
  background: linear-gradient(90deg, #6C5CE7, #a29bfe);
  border-radius: 6px;
  transition: width 0.5s ease;
}
</style>
