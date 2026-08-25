import { defineStore } from 'pinia'

const STORAGE_KEY = 'wordmagic-progress-fallback'

const isElectron = () => !!window.electronAPI

function loadFallback() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) { /* ignore */ }
  return null
}

function defaultState() {
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
    todayDate: new Date().toDateString(),
    dailyWordCount: 10,
    dailyQuestionCount: 20,
    initialized: false
  }
}

export const useProgressStore = defineStore('progress', {
  state: () => {
    const saved = loadFallback()
    const base = defaultState()
    if (saved) {
      if (saved.todayDate !== new Date().toDateString()) {
        saved.todayLearned = 0
        saved.todayDate = new Date().toDateString()
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
    async init() {
      if (this.initialized) return
      if (isElectron()) {
        const [learned, stats] = await Promise.all([
          window.electronAPI.getLearnedWords(),
          window.electronAPI.getStats()
        ])
        this.learnedWords = learned || []
        this.correctCount = stats.correct || 0
        this.wrongCount = stats.wrong || 0
        this.totalScore = (stats.correct || 0) * 10
      }
      this.initialized = true
      this.updateStreak()
    },

    saveFallback() {
      if (!isElectron()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
      }
    },

    async markLearned(word) {
      if (!this.learnedWords.includes(word)) {
        this.learnedWords.push(word)
        this.todayLearned++
        this.checkAchievements()
      }
      if (isElectron()) {
        await window.electronAPI.markLearned(word)
      }
      this.saveFallback()
    },

    async recordAnswer(correct, word, gameMode = 'unknown') {
      if (correct) {
        this.correctCount++
        this.totalScore += 10
        await this.markLearned(word)
      } else {
        this.wrongCount++
      }
      this.lastStudyDate = new Date().toDateString()
      this.practiceHistory.push({ word, correct, gameMode, time: Date.now() })
      if (this.practiceHistory.length > 200) {
        this.practiceHistory = this.practiceHistory.slice(-200)
      }
      if (isElectron()) {
        await window.electronAPI.recordPractice(word, gameMode, correct)
      }
      this.checkAchievements()
      this.saveFallback()
    },

    checkAchievements() {
      const all = [
        { id: 'first_word', name: 'First Word', icon: '🌱', condition: () => this.learnedCount >= 1 },
        { id: 'ten_words', name: 'Word Explorer', icon: '🌟', condition: () => this.learnedCount >= 10 },
        { id: 'fifty_words', name: 'Word Master', icon: '🏆', condition: () => this.learnedCount >= 50 },
        { id: 'streak_3', name: '3-Day Streak', icon: '🔥', condition: () => this.streakDays >= 3 },
        { id: 'perfect_10', name: 'Perfect 10', icon: '💯', condition: () => this.correctCount >= 10 && this.accuracy === 100 },
        { id: 'score_100', name: 'Century Club', icon: '🎖️', condition: () => this.totalScore >= 100 },
        { id: 'score_500', name: 'Word Wizard', icon: '🧙', condition: () => this.totalScore >= 500 }
      ]
      for (const a of all) {
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
        } else if (this.lastStudyDate !== today) {
          this.streakDays = 1
        }
        this.lastStudyDate = today
      }
    },

    async reset() {
      if (isElectron()) {
        await window.electronAPI.resetProgress()
      }
      const fresh = defaultState()
      fresh.initialized = true
      this.$state = fresh
      this.saveFallback()
    },

    setDailyConfig(words, questions) {
      this.dailyWordCount = words
      this.dailyQuestionCount = questions
      this.saveFallback()
    }
  }
})
