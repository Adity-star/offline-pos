export {};

declare global {
  interface Window {
    electron: {
      printThermal: (html: string) => Promise<{success: boolean, error?: string}>
      printA4: (html: string) => Promise<{success: boolean, error?: string}>
      createBackup: () => Promise<{success: boolean, filePath?: string, error?: string}>
      listBackups: () => Promise<Array<{name: string, path: string, size: number, createdAt: Date}>>
      restoreBackup: (filePath?: string) => Promise<{success: boolean, error?: string}>
      getAppPath: () => Promise<string>
    }
  }
}