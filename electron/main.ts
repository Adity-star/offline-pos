import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

import { setupPrinterIpc } from './ipc/printer.ipc.ts'
import { setupBackupIpc } from './ipc/backup.ipc.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    autoHideMenuBar: true,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
  } else {
    mainWindow.loadFile(
      path.join(__dirname, '../out/index.html')
    )
  }
}

  app.disableHardwareAcceleration()

  app.commandLine.appendSwitch(
    'disable-gpu'
  )

  app.commandLine.appendSwitch(
    'js-flags',
    '--max-old-space-size=4096'
  )
app.whenReady()
  .then(() => {
    setupPrinterIpc()
    setupBackupIpc()

    ipcMain.handle('get-app-path', () => {
      return app.getAppPath()
    })

    createWindow()

    app.on('before-quit', async () => {
      console.log(
        'App closing... auto-backup could fire here.'
      )
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
  .catch((err) => {
    console.error('Electron startup failed:', err)
  })

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})