import { defineStore } from 'pinia'

const STORAGE_KEY = 'wordmagic-progress'

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) { /* ignore */ }
  return null
}

function defaultProgress() {
  return {
    learnedWords: [],
    correctCount: 0,
    wrongCount: 0,
    streakDays: 1,
    lastStudyDate: new Date().toDateString(),
    totalScore: 0,
    achievements: [],
    practiceHistory: [],
    dailyGoal: 10,
    todayLearned: 0,
    todayDate: new Date().toDateString()
  }
}

export const useProgressStore = defineStore('progress', {
  state: () => {
    const saved = loadProgress()
    const base = defaultProgress()
    if (saved) {
      // Reset daily count if new day
      if (saved.todayDate !== new Date().toDateString()) {
        saved.todayLearned = 0
        saved.todayDate = new Date().toDateString()
      }
      // Streak check
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      if (saved.lastStudyDate !== new Date().toDateString() &&
          saved.lastStudyDate !== yesterday.toDateString()) {
        saved.streakDays = 1
      }
      return { ...base, ...saved }
    }
    return base
  },

  getters: {
    accuracy: (state) => {
      const total = state.correctCount + state.wrongCount
      return total > 0 ? Math.round((state.correctCount / total) * 100) : 0
    },
    totalPracticed: (state) => state.correctCount + state.wrongCount,
    learnedCount: (state) => state.learnedWords.length,
    hasAchievement: (state) => (id) => state.achievements.includes(id)
  },

  actions: {
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
    },

    markLearned(word) {
      if (!this.learnedWords.includes(word)) {
        this.learnedWords.push(word)
        this.todayLearned++
        this.checkAchievements()
        this.save()
      }
    },

    recordAnswer(correct, word) {
      if (correct) {
        this.correctCount++
        this.totalScore += 10
        this.markLearned(word)
      } else {
        this.wrongCount++
      }
      this.lastStudyDate = new Date().toDateString()
      this.practiceHistory.push({
        word,
        correct,
        time: Date.now()
      })
      // Keep last 200 records
      if (this.practiceHistory.length > 200) {
        this.practiceHistory = this.practiceHistory.slice(-200)
      }
      this.checkAchievements()
      this.save()
    },

    checkAchievements() {
      const allAchievements = [
        { id: 'first_word', name: 'First Word!', icon: '🌱', condition: () => this.learnedCount >= 1 },
        { id: 'ten_words', name: 'Word Explorer', icon: '🌟', condition: () => this.learnedCount >= 10 },
        { id: 'fifty_words', name: 'Word Master', icon: '🏆', condition: () => this.learnedCount >= 50 },
        { id: 'streak_3', name: '3-Day Streak', icon: '🔥', condition: () => this.streakDays >= 3 },
        { id: 'perfect_10', name: 'Perfect 10', icon: '💯', condition: () => this.correctCount >= 10 && this.accuracy === 100 },
        { id: 'score_100', name: 'Century Club', icon: '🎖️', condition: () => this.totalScore >= 100 },
        { id: 'score_500', name: 'Word Wizard', icon: '🧙', condition: () => this.totalScore >= 500 }
      ]
      for (const a of allAchievements) {
        if (!this.achievements.includes(a.id) && a.condition()) {
          this.achievements.push(a.id)
        }
      }
    },

    updateStreak() {
      const today = new Date().toDateString()
      if (this.lastStudyDate !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        if (this.lastStudyDate === yesterday.toDateString()) {
          this.streakDays++
        } else {
          this.streakDays = 1
        }
        this.lastStudyDate = today
        this.save()
      }
    },

    reset() {
      const fresh = defaultProgress()
      this.$state = fresh
      this.save()
    }
  }
})
