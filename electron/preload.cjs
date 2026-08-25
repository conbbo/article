const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Basic CRUD
  getWords: (level) => ipcRenderer.invoke('db-get-words', level),
  getWordsByLevel: (level) => ipcRenderer.invoke('db-get-words-by-level', level),
  addCustomWord: (word, phonetic, meaning, example, exampleCn) =>
    ipcRenderer.invoke('db-add-custom-word', word, phonetic, meaning, example, exampleCn),
  markLearned: (word) => ipcRenderer.invoke('db-mark-learned', word),
  getLearnedWords: () => ipcRenderer.invoke('db-get-learned-words'),
  recordPractice: (word, gameMode, correct) => ipcRenderer.invoke('db-record-practice', word, gameMode, correct),
  getPracticeRecords: () => ipcRenderer.invoke('db-get-practice-records'),
  getStats: () => ipcRenderer.invoke('db-get-stats'),
  getSetting: (key) => ipcRenderer.invoke('db-get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('db-set-setting', key, value),
  getAllSettings: () => ipcRenderer.invoke('db-get-all-settings'),
  resetProgress: () => ipcRenderer.invoke('db-reset-progress'),
  createSession: (date) => ipcRenderer.invoke('db-create-session', date),
  updateSession: (id, fields) => ipcRenderer.invoke('db-update-session', id, fields),
  getTodaySession: (date) => ipcRenderer.invoke('db-get-today-session', date),

  // Learning Engine (SRS)
  getSrs: (word) => ipcRenderer.invoke('engine-get-srs', word),
  getAllSrs: () => ipcRenderer.invoke('engine-get-all-srs'),
  getDueWords: () => ipcRenderer.invoke('engine-get-due-words'),
  getMasteryMap: () => ipcRenderer.invoke('engine-get-mastery-map'),

  // Analytics
  getLearningCurve: (days) => ipcRenderer.invoke('analytics-learning-curve', days),
  getWeakWords: () => ipcRenderer.invoke('analytics-weak-words'),
  getTrend: () => ipcRenderer.invoke('analytics-trend'),
  getSummary: () => ipcRenderer.invoke('analytics-summary'),

  // Recommendation Engine
  recommendWords: (count, level) => ipcRenderer.invoke('recommend-words', count, level),
  recommendQuestions: (sessionWords, questionCount) => ipcRenderer.invoke('recommend-questions', sessionWords, questionCount),
  recommendLevel: (currentLevel) => ipcRenderer.invoke('recommend-level', currentLevel),

  // Image cache
  downloadImage: (data) => ipcRenderer.invoke('download-image', data)
})
