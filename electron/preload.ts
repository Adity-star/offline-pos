import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  printThermal: (html: string) => ipcRenderer.invoke('print:thermal', { html }),
  printA4: (html: string) => ipcRenderer.invoke('print:a4', { html }),
  createBackup: () => ipcRenderer.invoke('backup:create'),
  listBackups: () => ipcRenderer.invoke('backup:list'),
  restoreBackup: (filePath?: string) => ipcRenderer.invoke('backup:restore', filePath),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  // Debug: check if electron API is available
  ping: () => ipcRenderer.invoke('get-app-path'),
})