import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  printInvoice: (data: any) => ipcRenderer.invoke('print-invoice', data),

  createBackup: () => ipcRenderer.invoke('create-backup'),

  restoreBackup: (filePath: string) =>
    ipcRenderer.invoke('restore-backup', filePath),

  getAppPath: () => ipcRenderer.invoke('get-app-path'),
})