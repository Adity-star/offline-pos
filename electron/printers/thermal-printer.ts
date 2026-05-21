import { BrowserWindow } from 'electron'

export class ThermalPrinter {
  constructor() {}

  async printReceipt(htmlContent: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      let win = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })

      win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

      win.webContents.on('did-finish-load', () => {
        win.webContents.print({
          silent: true,
          printBackground: true,
          // margins: { marginType: 'none' }, // Allow OS to handle default 80mm margins mostly
        }, (success, failureReason) => {
          if (!success) {
            console.error('Print failed:', failureReason)
            resolve({ success: false, error: failureReason })
          } else {
            resolve({ success: true })
          }
          win.close()
        })
      })
    })
  }

  async testPrint(): Promise<{ success: boolean; error?: string }> {
    const testHtml = `
      <html>
        <body style="font-family: sans-serif; text-align: center;">
          <h2>Printer Test</h2>
          <p>If you can read this, your printer is working correctly.</p>
          <hr/>
          <p>Offline POS System</p>
        </body>
      </html>
    `
    return this.printReceipt(testHtml)
  }
}