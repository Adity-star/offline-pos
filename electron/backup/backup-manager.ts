import fs from 'fs'
import path from 'path'
import os from 'os'
import archiver from 'archiver'

export class BackupManager {
  private dbPath: string
  private backupDir: string

  constructor(appPath: string) {
    this.dbPath = path.join(appPath, 'prisma', 'dev.db')
    this.backupDir = path.join(os.homedir(), 'Desktop', 'OfflinePOS_Backups')
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  async createBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    return new Promise((resolve) => {
      try {
        if (!fs.existsSync(this.dbPath)) {
           return resolve({ success: false, error: 'Database file not found.' })
        }

        const dateStr = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0]
        const backupFileName = `pos_backup_${dateStr}.zip`
        const backupFilePath = path.join(this.backupDir, backupFileName)

        const output = fs.createWriteStream(backupFilePath)
        const archive = archiver('zip', { zlib: { level: 9 } })

        output.on('close', () => {
          resolve({ success: true, filePath: backupFilePath })
        })

        archive.on('error', (err) => {
          return resolve({ success: false, error: err.message })
        })

        archive.pipe(output)
        
        // Append the database file to the root of the archive
        archive.file(this.dbPath, { name: 'dev.db' })
        
        archive.finalize()
      } catch (error: any) {
        resolve({ success: false, error: error.message })
      }
    })
  }

  async listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) return []
      const files = fs.readdirSync(this.backupDir)
      return files
        .filter(f => f.endsWith('.zip'))
        .map(f => {
          const stats = fs.statSync(path.join(this.backupDir, f))
          return {
            name: f,
            path: path.join(this.backupDir, f),
            size: stats.size,
            createdAt: stats.birthtime
          }
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch {
      return []
    }
  }
}
