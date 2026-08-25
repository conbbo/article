const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = !app.isPackaged
let mainWindow
let db = null

function initDatabase() {
  const Database = require('better-sqlite3')
  const dataPath = path.join(app.getPath('userData'), 'wordmagic-data')
  if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true })
  const dbPath = path.join(dataPath, 'wordmagic.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      phonetic TEXT,
      meaning TEXT,
      example TEXT,
      example_cn TEXT,
      level TEXT NOT NULL,
      is_custom INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS learned_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      learned_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS practice_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      game_mode TEXT NOT NULL,
      correct INTEGER NOT NULL,
      practiced_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_date TEXT NOT NULL,
      words_learned INTEGER DEFAULT 0,
      questions_answered INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  // Seed built-in words if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM words WHERE is_custom = 0').get()
  if (count.c === 0) {
    const insert = db.prepare('INSERT INTO words (word, phonetic, meaning, example, example_cn, level) VALUES (?, ?, ?, ?, ?, ?)')
    const seed = require('./seedWords.js')
    for (const w of seed) {
      insert.run(w.word, w.phonetic, w.meaning, w.example, w.exampleCn, w.level)
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'WordMagic',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

// --- IPC: Database operations ---

ipcMain.handle('db-get-words', (e, level) => {
  if (level) return db.prepare('SELECT * FROM words WHERE level = ? ORDER BY id').all(level)
  return db.prepare('SELECT * FROM words ORDER BY id').all()
})

ipcMain.handle('db-get-words-by-level', (e, level) => {
  return db.prepare('SELECT * FROM words WHERE level = ? ORDER BY id').all(level)
})

ipcMain.handle('db-add-custom-word', (e, word, phonetic, meaning, example, exampleCn) => {
  db.prepare('INSERT INTO words (word, phonetic, meaning, example, example_cn, level, is_custom) VALUES (?, ?, ?, ?, ?, ?, 1)')
    .run(word, phonetic || '', meaning, example || '', exampleCn || '', 'custom')
})

ipcMain.handle('db-mark-learned', (e, word) => {
  db.prepare('INSERT OR IGNORE INTO learned_words (word) VALUES (?)').run(word)
})

ipcMain.handle('db-get-learned-words', () => {
  return db.prepare('SELECT word FROM learned_words').all().map(r => r.word)
})

ipcMain.handle('db-record-practice', (e, word, gameMode, correct) => {
  db.prepare('INSERT INTO practice_records (word, game_mode, correct) VALUES (?, ?, ?)').run(word, gameMode, correct ? 1 : 0)
  if (correct) {
    db.prepare('INSERT OR IGNORE INTO learned_words (word) VALUES (?)').run(word)
  }
})

ipcMain.handle('db-get-practice-records', () => {
  return db.prepare('SELECT * FROM practice_records ORDER BY practiced_at DESC LIMIT 200').all()
})

ipcMain.handle('db-get-stats', () => {
  const learned = db.prepare('SELECT COUNT(*) as c FROM learned_words').get().c
  const totalPractice = db.prepare('SELECT COUNT(*) as c FROM practice_records').get().c
  const correct = db.prepare('SELECT COUNT(*) as c FROM practice_records WHERE correct = 1').get().c
  const wrong = totalPractice - correct
  const last7 = db.prepare(`
    SELECT date(practiced_at) as d, COUNT(*) as c
    FROM practice_records
    WHERE practiced_at >= date('now', '-7 days')
    GROUP BY date(practiced_at)
  `).all()
  return { learned, totalPractice, correct, wrong, last7 }
})

ipcMain.handle('db-get-setting', (e, key) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row ? row.value : null
})

ipcMain.handle('db-set-setting', (e, key, value) => {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
})

ipcMain.handle('db-get-all-settings', () => {
  const rows = db.prepare('SELECT key, value FROM settings').all()
  const obj = {}
  for (const r of rows) obj[r.key] = r.value
  return obj
})

ipcMain.handle('db-reset-progress', () => {
  db.prepare('DELETE FROM learned_words').run()
  db.prepare('DELETE FROM practice_records').run()
  db.prepare('DELETE FROM study_sessions').run()
})

ipcMain.handle('db-create-session', (e, date) => {
  const info = db.prepare('INSERT INTO study_sessions (session_date) VALUES (?)').run(date)
  return info.lastInsertRowid
})

ipcMain.handle('db-update-session', (e, id, fields) => {
  const sets = []
  const vals = []
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = ?`)
    vals.push(v)
  }
  vals.push(id)
  db.prepare(`UPDATE study_sessions SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
})

ipcMain.handle('db-get-today-session', (e, date) => {
  return db.prepare('SELECT * FROM study_sessions WHERE session_date = ?').get(date)
})

// --- IPC: Image cache ---

ipcMain.handle('download-image', async (event, { url, word }) => {
  try {
    const https = require('https')
    const http = require('http')
    const dataPath = path.join(app.getPath('userData'), 'wordmagic-data', 'images')
    if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true })
    const filePath = path.join(dataPath, `${word}.jpg`)
    if (fs.existsSync(filePath)) return filePath
    return new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http
      client.get(url, (res) => {
        if (res.statusCode !== 200) return resolve(null)
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          fs.writeFileSync(filePath, Buffer.concat(chunks))
          resolve(filePath)
        })
      }).on('error', () => resolve(null))
    })
  } catch (e) { return null }
})

app.whenReady().then(() => {
  initDatabase()
  createWindow()
})

app.on('window-all-closed', () => {
  if (db) db.close()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
