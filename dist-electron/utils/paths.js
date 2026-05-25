"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printThermalInvoice = printThermalInvoice;
const electron_1 = require("electron");
async function printThermalInvoice(html) {
    const printWindow = new electron_1.BrowserWindow({
        show: false,
    });
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    printWindow.webContents.print({
        silent: true,
        printBackground: true,
        margins: {
            marginType: 'none',
        },
    }, () => {
        printWindow.close();
    });
}
