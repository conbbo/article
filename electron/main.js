const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = !app.isPackaged
let mainWindow

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
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

// IPC: get app data path for SQLite + image cache
ipcMain.handle('get-data-path', () => {
  const dataPath = path.join(app.getPath('userData'), 'wordmagic-data')
  if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true })
  return dataPath
})

// IPC: download image to local cache
ipcMain.handle('download-image', async (event, { url, word }) => {
  try {
    const https = require('https')
    const http = require('http')
    const dataPath = path.join(app.getPath('userData'), 'wordmagic-data', 'images')
    if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath, { recursive: true })
    const filePath = path.join(dataPath, `${word}.jpg`)

    if (fs.existsSync(filePath)) return filePath

    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http
      client.get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          return resolve(null)
        }
        if (res.statusCode !== 200) {
          return resolve(null)
        }
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          fs.writeFileSync(filePath, Buffer.concat(chunks))
          resolve(filePath)
        })
      }).on('error', (err) => {
        resolve(null)
      })
    })
  } catch (e) {
    return null
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
