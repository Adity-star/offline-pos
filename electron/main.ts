import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'
import fs from 'fs'

import { setupPrinterIpc } from './ipc/printer.ipc.js'
import { setupBackupIpc } from './ipc/backup.ipc.js'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null
let nextServer: ChildProcess | null = null

const NEXT_PORT = 3000

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
// WAIT FOR NEXT.JS SERVER
// ---------------------------------------------------

function waitForServer(
  url: string,
  timeout = 30000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const check = () => {
      fetch(url)
        .then(() => {
          console.log(
            `Next.js server is ready at ${url}`
          )

          resolve()
        })
        .catch(() => {
          if (Date.now() - start > timeout) {
            reject(
              new Error(
                `Next.js server did not start within ${timeout}ms`
              )
            )

            return
          }

          setTimeout(check, 300)
        })
    }

    check()
  })
}

// ---------------------------------------------------
// START NEXT.JS SERVER
// ---------------------------------------------------

async function startNextServer(): Promise<void> {
  if (isDev) {
    return
  }

  const serverDir = path.join(
    process.resourcesPath,
    'next-app'
  )

  const serverPath = path.join(
    serverDir,
    'server.js'
  )

  console.log(
    'Next.js server directory:',
    serverDir
  )

  console.log(
    'Next.js server path:',
    serverPath
  )

  if (!fs.existsSync(serverPath)) {
    throw new Error(
      `Next.js standalone server not found:\n${serverPath}`
    )
  }

  nextServer = spawn(
    process.execPath,
    [serverPath],
    {
      cwd: serverDir,

      env: {
        ...process.env,

        NODE_ENV: 'production',

        PORT: String(NEXT_PORT),

        HOSTNAME: '127.0.0.1',

        ELECTRON_RUN_AS_NODE: '1',
      },

      stdio: ['ignore', 'pipe', 'pipe'],

      windowsHide: true,
    }
  )

  nextServer.stdout?.on(
    'data',
    (data) => {
      console.log(
        `[Next] ${data.toString().trim()}`
      )
    }
  )

  nextServer.stderr?.on(
    'data',
    (data) => {
      console.error(
        `[Next ERROR] ${data.toString().trim()}`
      )
    }
  )

  nextServer.on(
    'error',
    (error) => {
      console.error(
        'Next.js process error:',
        error
      )
    }
  )

  nextServer.on(
    'exit',
    (code, signal) => {
      console.log(
        `Next.js server exited. Code: ${code}, Signal: ${signal}`
      )

      nextServer = null
    }
  )

  await waitForServer(
    `http://127.0.0.1:${NEXT_PORT}`
  )
}

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

  // ---------------------------------------------------
  // DEBUG LOAD FAILURES
  // ---------------------------------------------------

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

  // ---------------------------------------------------
  // DEBUG RENDERER LOGS
  // ---------------------------------------------------

  mainWindow.webContents.on(
    'console-message',
    (_, level, message) => {
      console.log(
        `Renderer [${level}]`,
        message
      )
    }
  )

  // ---------------------------------------------------
  // DEVTOOLS
  // ---------------------------------------------------

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
    mainWindow.loadURL(
      `http://127.0.0.1:${NEXT_PORT}`
    )
  }

  // ---------------------------------------------------
  // WINDOW CLOSED
  // ---------------------------------------------------

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

    process.env.AK_ENV =
      isDev
        ? 'development'
        : 'production'

    const {
      initializeDatabase,
    } = await import(
      '../src/lib/init-db.js'
    )


    // Initialize SQLite / Prisma
    await initializeDatabase()

    // Start bundled Next.js server
    await startNextServer()

    // Only create the window after Next.js is ready
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
// CLEANUP NEXT.JS SERVER
// ---------------------------------------------------

app.on('before-quit', () => {
  if (
    nextServer &&
    !nextServer.killed
  ) {
    console.log(
      'Stopping Next.js server...'
    )

    nextServer.kill()

    nextServer = null
  }
})

// ---------------------------------------------------
// APP CLOSE
// ---------------------------------------------------

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})