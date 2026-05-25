"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPrinterIpc = setupPrinterIpc;
const electron_1 = require("electron");
const thermal_printer_1 = require("../printers/thermal-printer");
const a4_printer_1 = require("../printers/a4-printer");
function setupPrinterIpc() {
    const thermalPrinter = new thermal_printer_1.ThermalPrinter();
    // Thermal Receipt Printing
    electron_1.ipcMain.handle('print:thermal', async (event, payload) => {
        try {
            const result = await thermalPrinter.printReceipt(payload.html);
            return result;
        }
        catch (error) {
            console.error('Thermal print error:', error);
            return { success: false, error: error.message };
        }
    });
    const a4Printer = new a4_printer_1.A4Printer();
    // A4 Invoice Printing
    electron_1.ipcMain.handle('print:a4', async (event, payload) => {
        try {
            const result = await a4Printer.printInvoice(payload.html);
            return result;
        }
        catch (error) {
            console.error('A4 print error:', error);
            return { success: false, error: error.message };
        }
    });
    // Test Print
    electron_1.ipcMain.handle('print:test', async () => {
        try {
            const result = await thermalPrinter.testPrint();
            return result;
        }
        catch (error) {
            console.error('Test print error:', error);
            return { success: false, error: error.message };
        }
    });
}
