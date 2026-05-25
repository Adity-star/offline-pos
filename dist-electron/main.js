"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const printer_ipc_js_1 = require("./ipc/printer.ipc.js");
const backup_ipc_js_1 = require("./ipc/backup.ipc.js");
let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development';
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../out/index.html'));
    }
}
electron_1.app.disableHardwareAcceleration();
electron_1.app.commandLine.appendSwitch('disable-gpu');
electron_1.app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');
electron_1.app.whenReady()
    .then(() => {
    (0, printer_ipc_js_1.setupPrinterIpc)();
    (0, backup_ipc_js_1.setupBackupIpc)();
    electron_1.ipcMain.handle('get-app-path', () => {
        return electron_1.app.getAppPath();
    });
    createWindow();
    electron_1.app.on('before-quit', async () => {
        console.log('App closing... auto-backup could fire here.');
    });
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
})
    .catch((err) => {
    console.error('Electron startup failed:', err);
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
