const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Database
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
  // Image cache
  downloadImage: (data) => ipcRenderer.invoke('download-image', data)
})
