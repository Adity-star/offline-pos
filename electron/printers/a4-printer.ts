import { BrowserWindow } from 'electron'

export class A4Printer {
  constructor() {}

  async printInvoice(htmlContent: string): Promise<{ success: boolean; error?: string }> {
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
          pageSize: 'A4',
          margins: { marginType: 'printableArea' },
        }, (success, failureReason) => {
          if (!success) {
            console.error('A4 Print failed:', failureReason)
            resolve({ success: false, error: failureReason })
          } else {
            resolve({ success: true })
          }
          win.close()
        })
      })
    })
  }
}
