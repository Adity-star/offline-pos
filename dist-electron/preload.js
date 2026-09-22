"use strict";

// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electron", {
  printThermal: (html) => import_electron.ipcRenderer.invoke("print:thermal", { html }),
  printA4: (html) => import_electron.ipcRenderer.invoke("print:a4", { html }),
  createBackup: () => import_electron.ipcRenderer.invoke("backup:create"),
  listBackups: () => import_electron.ipcRenderer.invoke("backup:list"),
  restoreBackup: (filePath) => import_electron.ipcRenderer.invoke("backup:restore", filePath),
  getAppPath: () => import_electron.ipcRenderer.invoke("get-app-path"),
  // Debug: check if electron API is available
  ping: () => import_electron.ipcRenderer.invoke("get-app-path")
});
//# sourceMappingURL=preload.js.map