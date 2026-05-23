import { ipcMain, app, dialog } from 'electron'
import { BackupManager } from '../backup/backup-manager.ts'
import { RestoreManager } from '../backup/restore-manager.ts'

export function setupBackupIpc() {
  const appPath = app.getAppPath()
  const backupManager = new BackupManager(appPath)
  const restoreManager = new RestoreManager(appPath)

  ipcMain.handle('backup:create', async () => {
    try {
      const result = await backupManager.createBackup()
      return result
    } catch (error: any) {
      console.error('Backup create error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('backup:list', async () => {
    try {
      return await backupManager.listBackups()
    } catch (error) {
      console.error('Backup list error:', error)
      return []
    }
  })

  ipcMain.handle('backup:restore', async (event, filePath?: string) => {
    try {
      let pathToRestore = filePath

      if (!pathToRestore) {
         // Open native file dialog if path not provided
         const { canceled, filePaths } = await dialog.showOpenDialog({
           properties: ['openFile'],
           filters: [{ name: 'ZIP Archives', extensions: ['zip'] }]
         })

         if (canceled || filePaths.length === 0) {
           return { success: false, error: 'Cancelled' }
         }
         pathToRestore = filePaths[0]
      }

      const result = await restoreManager.restoreBackup(pathToRestore)
      return result
    } catch (error: any) {
      console.error('Restore error:', error)
      return { success: false, error: error.message }
    }
  })
}
