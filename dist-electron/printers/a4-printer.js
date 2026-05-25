"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.A4Printer = void 0;
const electron_1 = require("electron");
class A4Printer {
    constructor() { }
    async printInvoice(htmlContent) {
        return new Promise((resolve) => {
            let win = new electron_1.BrowserWindow({
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                }
            });
            win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
            win.webContents.on('did-finish-load', () => {
                win.webContents.print({
                    silent: true,
                    printBackground: true,
                    pageSize: 'A4',
                    margins: { marginType: 'none' },
                }, (success, failureReason) => {
                    if (!success) {
                        console.error('A4 Print failed:', failureReason);
                        resolve({ success: false, error: failureReason });
                    }
                    else {
                        resolve({ success: true });
                    }
                    win.close();
                });
            });
        });
    }
}
exports.A4Printer = A4Printer;
