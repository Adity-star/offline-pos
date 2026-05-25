import { ipcMain } from 'electron'
import { ThermalPrinter } from '../printers/thermal-printer'
import { A4Printer } from '../printers/a4-printer'

export function setupPrinterIpc() {
  const thermalPrinter = new ThermalPrinter()

  // Thermal Receipt Printing
  ipcMain.handle('print:thermal', async (event, payload: { html: string }) => {
    try {
      const result = await thermalPrinter.printReceipt(payload.html)
      return result
    } catch (error: any) {
      console.error('Thermal print error:', error)
      return { success: false, error: error.message }
    }
  })

  const a4Printer = new A4Printer()
  
  // A4 Invoice Printing
  ipcMain.handle('print:a4', async (event, payload: { html: string }) => {
    try {
      const result = await a4Printer.printInvoice(payload.html)
      return result
    } catch (error: any) {
      console.error('A4 print error:', error)
      return { success: false, error: error.message }
    }
  })

  // Test Print
  ipcMain.handle('print:test', async () => {
    try {
      const result = await thermalPrinter.testPrint()
      return result
    } catch (error: any) {
      console.error('Test print error:', error)
      return { success: false, error: error.message }
    }
  })
}
