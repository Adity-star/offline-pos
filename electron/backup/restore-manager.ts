import fs from 'fs'
import path from 'path'
import extract from 'extract-zip'

export class RestoreManager {
  private dbPath: string

  constructor(appPath: string) {
    this.dbPath = path.join(appPath, 'prisma', 'dev.db')
  }

  async restoreBackup(zipPath: string): Promise<{ success: boolean; error?: string }> {
    return new Promise(async (resolve) => {
      try {
        if (!fs.existsSync(zipPath)) {
          return resolve({ success: false, error: 'Backup file not found.' })
        }

        // We extract to a temporary folder, check if dev.db exists, then replace the current DB.
        const tempDir = path.join(path.dirname(zipPath), 'pos_temp_extract_' + Date.now())
        
        try {
          await extract(zipPath, { dir: tempDir })
          
          const extractedDbPath = path.join(tempDir, 'dev.db')
          
          if (!fs.existsSync(extractedDbPath)) {
            throw new Error('Invalid backup file. Missing dev.db.')
          }

          // Before overwriting, maybe create a temporary backup of the CURRENT db just in case
          const currentBackupPath = this.dbPath + '.bak'
          if (fs.existsSync(this.dbPath)) {
             fs.copyFileSync(this.dbPath, currentBackupPath)
          }

          // Replace the actual DB
          fs.copyFileSync(extractedDbPath, this.dbPath)

          // Cleanup temp extraction
          fs.rmSync(tempDir, { recursive: true, force: true })
          
          resolve({ success: true })
        } catch (extractError: any) {
           // Cleanup temp extraction if failed
           if (fs.existsSync(tempDir)) {
             fs.rmSync(tempDir, { recursive: true, force: true })
           }
           resolve({ success: false, error: extractError.message })
        }
      } catch (error: any) {
        resolve({ success: false, error: error.message })
      }
    })
  }
}
