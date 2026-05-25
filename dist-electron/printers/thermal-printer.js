"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThermalPrinter = void 0;
const electron_1 = require("electron");
class ThermalPrinter {
    constructor() { }
    async printReceipt(htmlContent) {
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
                    // margins: { marginType: 'none' }, // Allow OS to handle default 80mm margins mostly
                }, (success, failureReason) => {
                    if (!success) {
                        console.error('Print failed:', failureReason);
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
    async testPrint() {
        const testHtml = `
      <html>
        <body style="font-family: sans-serif; text-align: center;">
          <h2>Printer Test</h2>
          <p>If you can read this, your printer is working correctly.</p>
          <hr/>
          <p>Offline POS System</p>
        </body>
      </html>
    `;
        return this.printReceipt(testHtml);
    }
}
exports.ThermalPrinter = ThermalPrinter;
