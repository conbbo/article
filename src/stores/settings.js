import { defineStore } from 'pinia'

const STORAGE_KEY = 'wordmagic-settings'

export const useSettingsStore = defineStore('settings', {
  state: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch (e) { /* ignore */ }
    return {
      apiProvider: 'deepseek',
      apiKey: '',
      ttsRate: 0.9,
      ttsVoice: '',
      currentLevel: 'starters',
      autoPlayAudio: true
    }
  },

  actions: {
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
    },
    updateProvider(provider) {
      this.apiProvider = provider
      this.save()
    },
    updateApiKey(key) {
      this.apiKey = key
      this.save()
    },
    updateLevel(level) {
      this.currentLevel = level
      this.save()
    },
    updateTtsRate(rate) {
      this.ttsRate = rate
      this.save()
    }
  }
})
