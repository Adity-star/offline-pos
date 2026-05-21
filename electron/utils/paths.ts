import { BrowserWindow } from 'electron'

export async function printThermalInvoice(html: string) {
  const printWindow = new BrowserWindow({
    show: false,
  })

  await printWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
  )

  printWindow.webContents.print(
    {
      silent: true,
      printBackground: true,
      margins: {
        marginType: 'none',
      },
    },
    () => {
      printWindow.close()
    }
  )
}