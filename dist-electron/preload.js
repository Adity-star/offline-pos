"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    printThermal: (html) => electron_1.ipcRenderer.invoke('print:thermal', { html }),
    printA4: (html) => electron_1.ipcRenderer.invoke('print:a4', { html }),
    createBackup: () => electron_1.ipcRenderer.invoke('backup:create'),
    listBackups: () => electron_1.ipcRenderer.invoke('backup:list'),
    restoreBackup: (filePath) => electron_1.ipcRenderer.invoke('backup:restore', filePath),
    getAppPath: () => electron_1.ipcRenderer.invoke('get-app-path'),
    // Debug: check if electron API is available
    ping: () => electron_1.ipcRenderer.invoke('get-app-path'),
});
