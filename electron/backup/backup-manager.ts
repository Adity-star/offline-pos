import fs from 'fs'
import path from 'path'
import os from 'os'

import { app } from 'electron'

const AdmZip = require('adm-zip')

export class BackupManager {
  private dbPath: string

  private backupDir: string

  constructor() {
    // SQLITE DATABASE LOCATION
    this.dbPath = path.join(
      app.getPath('userData'),
      'shop.db'
    )

    // BACKUP DIRECTORY
    this.backupDir = path.join(
      os.homedir(),
      'Desktop',
      'OfflinePOS_Backups'
    )

    // CREATE BACKUP DIRECTORY
    if (
      !fs.existsSync(this.backupDir)
    ) {
      fs.mkdirSync(this.backupDir, {
        recursive: true,
      })
    }

    console.log(
      'Database path:',
      this.dbPath
    )

    console.log(
      'Backup directory:',
      this.backupDir
    )
  }

  async createBackup(): Promise<{
    success: boolean

    filePath?: string

    error?: string
  }> {
    try {
      // CHECK DATABASE EXISTS
      if (
        !fs.existsSync(this.dbPath)
      ) {
        console.error(
          'Database not found:',
          this.dbPath
        )

        return {
          success: false,

          error:
            'Database file not found.',
        }
      }

      // TIMESTAMP
      const dateStr =
        new Date()
          .toISOString()
          .replace(/[:T]/g, '-')
          .split('.')[0]

      // ZIP NAME
      const backupFileName = `pos_backup_${dateStr}.zip`

      const backupFilePath =
        path.join(
          this.backupDir,
          backupFileName
        )

      // CREATE ZIP
      const zip = new AdmZip()

      // ADD SQLITE FILE
      zip.addLocalFile(
        this.dbPath
      )

      // WRITE ZIP
      zip.writeZip(
        backupFilePath
      )

      console.log(
        'Backup created:',
        backupFilePath
      )

      return {
        success: true,

        filePath:
          backupFilePath,
      }
    } catch (error: any) {
      console.error(
        'Backup failed:',
        error
      )

      return {
        success: false,

        error:
          error?.message ||
          'Backup failed',
      }
    }
  }

  async listBackups() {
    try {
      if (
        !fs.existsSync(
          this.backupDir
        )
      ) {
        return []
      }

      const files =
        fs.readdirSync(
          this.backupDir
        )

      return files
        .filter((file) =>
          file.endsWith('.zip')
        )
        .map((file) => {
          const fullPath =
            path.join(
              this.backupDir,
              file
            )

          const stats =
            fs.statSync(fullPath)

          return {
            name: file,

            path: fullPath,

            size: stats.size,

            createdAt:
              stats.birthtime,
          }
        })
        .sort(
          (a, b) =>
            b.createdAt.getTime() -
            a.createdAt.getTime()
        )
    } catch (error) {
      console.error(
        'List backup error:',
        error
      )

      return []
    }
  }
}