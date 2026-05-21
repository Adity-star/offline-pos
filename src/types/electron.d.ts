export {}

declare global {
  interface Window {
    electron: {
      printInvoice: (data: any) => Promise<void>
      createBackup: () => Promise<any>
      restoreBackup: (path: string) => Promise<any>
      getAppPath: () => Promise<string>
    }
  }
}