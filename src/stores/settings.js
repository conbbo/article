import { defineStore } from 'pinia'

const STORAGE_KEY = 'wordmagic-settings'
const isElectron = () => !!window.electronAPI

export const useSettingsStore = defineStore('settings', {
  state: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch (e) { /* ignore */ }
    return {
      apiProvider: 'local',
      apiKey: '',
      apiBaseUrl: 'http://localhost:11434/v1',
      apiModel: 'gpt-4o-mini',
      ttsRate: 0.9,
      currentLevel: 'starters',
      autoPlayAudio: true
    }
  },

  actions: {
    async init() {
      if (isElectron()) {
        const saved = await window.electronAPI.getAllSettings()
        if (saved.apiProvider) this.apiProvider = saved.apiProvider
        if (saved.apiKey) this.apiKey = saved.apiKey
        if (saved.apiBaseUrl) this.apiBaseUrl = saved.apiBaseUrl
        if (saved.apiModel) this.apiModel = saved.apiModel
        if (saved.currentLevel) this.currentLevel = saved.currentLevel
        if (saved.ttsRate) this.ttsRate = parseFloat(saved.ttsRate)
      }
    },

    async save() {
      if (isElectron()) {
        await window.electronAPI.setSetting('apiProvider', this.apiProvider)
        await window.electronAPI.setSetting('apiKey', this.apiKey)
        await window.electronAPI.setSetting('apiBaseUrl', this.apiBaseUrl)
        await window.electronAPI.setSetting('apiModel', this.apiModel)
        await window.electronAPI.setSetting('currentLevel', this.currentLevel)
        await window.electronAPI.setSetting('ttsRate', String(this.ttsRate))
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
    },

    async updateProvider(provider) {
      this.apiProvider = provider
      await this.save()
    },

    async updateApiKey(key) {
      this.apiKey = key
      await this.save()
    },

    async updateApiBaseUrl(url) {
      this.apiBaseUrl = url
      await this.save()
    },

    async updateApiModel(model) {
      this.apiModel = model
      await this.save()
    },

    async updateLevel(level) {
      this.currentLevel = level
      await this.save()
    },

    async updateTtsRate(rate) {
      this.ttsRate = rate
      await this.save()
    }
  }
})
