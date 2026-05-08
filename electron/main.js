require('dotenv').config()
const { app, BrowserWindow, ipcMain, powerSaveBlocker, dialog } = require('electron')
const path = require('path')

app.setName('FocusTracker')
app.commandLine.appendSwitch('class', 'FocusTracker')

// Force X11 backend on Linux Wayland — avoids xdg-desktop-portal screencast prompt every session.
// No-op on Windows/macOS.
// Linux: keep default Wayland backend. Screenshot uses native gnome-screenshot, bypassing portal.

let mainWindow
let psbId = null
let sessionActive = false

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#030712',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  })

  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('close', (e) => {
    if (sessionActive) {
      e.preventDefault()
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Focus Session Active',
        message: 'Cannot quit during an active focus session.',
        detail: 'Stay focused! The session will end automatically when the timer runs out.',
        buttons: ['OK'],
      })
    }
  })
}

app.whenReady().then(() => {
  createWindow()
  require('./ipc/auth')
  require('./ipc/todos')
  require('./ipc/session')
  require('./ipc/reports')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

module.exports = {
  getWindow: () => mainWindow,
  setSessionActive: (val) => {
    sessionActive = val
    if (val) {
      psbId = powerSaveBlocker.start('prevent-app-suspension')
    } else if (psbId !== null) {
      powerSaveBlocker.stop(psbId)
      psbId = null
    }
  },
}
