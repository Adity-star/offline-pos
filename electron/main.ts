import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

import { setupPrinterIpc } from './ipc/printer.ipc.js'
import { setupBackupIpc } from './ipc/backup.ipc.js'
import { initializeDatabase } from '../src/lib/init-db.js'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

// ---------------------------------------------------
// GPU & MEMORY CONFIG
// ---------------------------------------------------

app.disableHardwareAcceleration()

app.commandLine.appendSwitch('disable-gpu')

app.commandLine.appendSwitch(
  'js-flags',
  '--max-old-space-size=4096'
)

// ---------------------------------------------------
// CREATE WINDOW
// ---------------------------------------------------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,

    height: 900,

    minWidth: 1200,

    minHeight: 700,

    autoHideMenuBar: true,

    backgroundColor: '#ffffff',

    webPreferences: {
      preload: path.join(
        __dirname,
        'preload.js'
      ),

      contextIsolation: true,

      nodeIntegration: false,

      sandbox: false,
    },
  })

  // DEBUG LOAD FAILURES
  mainWindow.webContents.on(
    'did-fail-load',
    (_, code, desc) => {
      console.error(
        'Renderer failed:',
        code,
        desc
      )
    }
  )

  // DEBUG RENDERER LOGS
  mainWindow.webContents.on(
    'console-message',
    (_, level, message) => {
      console.log(
        `Renderer [${level}]`,
        message
      )
    }
  )

  // TEMP DEBUGGING
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  // ---------------------------------------------------
  // LOAD APP
  // ---------------------------------------------------

  if (isDev) {
    mainWindow.loadURL(
      'http://localhost:3000'
    )
  } else {
    // PRODUCTION FALLBACK
    // You MUST run:
    // npm run start
    // before opening EXE

    mainWindow.loadURL(
      'http://127.0.0.1:3000'
    )
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ---------------------------------------------------
// APP STARTUP
// ---------------------------------------------------

app
  .whenReady()
  .then(async () => {
    setupPrinterIpc()

    setupBackupIpc()

    ipcMain.handle(
      'get-app-path',
      () => {
        return app.getAppPath()
      }
    )
    await initializeDatabase()

    createWindow()

    app.on('activate', () => {
      if (
        BrowserWindow.getAllWindows()
          .length === 0
      ) {
        createWindow()
      }
    })
  })
  .catch((err) => {
    console.error(
      'Electron startup failed:',
      err
    )
  })

// ---------------------------------------------------
// APP CLOSE
// ---------------------------------------------------

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})