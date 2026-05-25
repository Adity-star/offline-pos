"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBackupIpc = setupBackupIpc;
const electron_1 = require("electron");
const backup_manager_1 = require("../backup/backup-manager");
const restore_manager_1 = require("../backup/restore-manager");
function setupBackupIpc() {
    const appPath = electron_1.app.getAppPath();
    const backupManager = new backup_manager_1.BackupManager(appPath);
    const restoreManager = new restore_manager_1.RestoreManager(appPath);
    electron_1.ipcMain.handle('backup:create', async () => {
        try {
            const result = await backupManager.createBackup();
            return result;
        }
        catch (error) {
            console.error('Backup create error:', error);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('backup:list', async () => {
        try {
            return await backupManager.listBackups();
        }
        catch (error) {
            console.error('Backup list error:', error);
            return [];
        }
    });
    electron_1.ipcMain.handle('backup:restore', async (event, filePath) => {
        try {
            let pathToRestore = filePath;
            if (!pathToRestore) {
                // Open native file dialog if path not provided
                const { canceled, filePaths } = await electron_1.dialog.showOpenDialog({
                    properties: ['openFile'],
                    filters: [{ name: 'ZIP Archives', extensions: ['zip'] }]
                });
                if (canceled || filePaths.length === 0) {
                    return { success: false, error: 'Cancelled' };
                }
                pathToRestore = filePaths[0];
            }
            const result = await restoreManager.restoreBackup(pathToRestore);
            return result;
        }
        catch (error) {
            console.error('Restore error:', error);
            return { success: false, error: error.message };
        }
    });
}
