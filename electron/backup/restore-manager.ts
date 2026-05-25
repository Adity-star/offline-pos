import fs from 'fs'
import path from 'path'
import os from 'os'

import { app } from 'electron'

const AdmZip = require('adm-zip')

export class RestoreManager {
  private dbPath: string

  constructor() {
    // SQLITE DATABASE LOCATION
    this.dbPath = path.join(
      app.getPath('userData'),
      'shop.db'
    )

    console.log(
      'Restore DB path:',
      this.dbPath
    )
  }

  async restoreBackup(
    zipPath: string
  ): Promise<{
    success: boolean

    error?: string
  }> {
    try {
      // CHECK ZIP EXISTS
      if (
        !fs.existsSync(zipPath)
      ) {
        return {
          success: false,

          error:
            'Backup file not found.',
        }
      }

      // TEMP DIRECTORY
      const tempDir = path.join(
        os.tmpdir(),
        `pos_restore_${Date.now()}`
      )

      fs.mkdirSync(tempDir, {
        recursive: true,
      })

      // OPEN ZIP
      const zip = new AdmZip(
        zipPath
      )

      // EXTRACT ZIP
      zip.extractAllTo(
        tempDir,
        true
      )

      // EXTRACTED SQLITE FILE
      const extractedDbPath =
        path.join(
          tempDir,
          'shop.db'
        )

      // VALIDATE
      if (
        !fs.existsSync(
          extractedDbPath
        )
      ) {
        fs.rmSync(tempDir, {
          recursive: true,

          force: true,
        })

        return {
          success: false,

          error:
            'Invalid backup file.',
        }
      }

      // SAFETY BACKUP
      if (
        fs.existsSync(this.dbPath)
      ) {
        const backupOldDb =
          this.dbPath + '.bak'

        fs.copyFileSync(
          this.dbPath,
          backupOldDb
        )
      }

      // REPLACE CURRENT DB
      fs.copyFileSync(
        extractedDbPath,
        this.dbPath
      )

      // CLEAN TEMP
      fs.rmSync(tempDir, {
        recursive: true,

        force: true,
      })

      console.log(
        'Database restored successfully'
      )

      return {
        success: true,
      }
    } catch (error: any) {
      console.error(
        'Restore failed:',
        error
      )

      return {
        success: false,

        error:
          error?.message ||
          'Restore failed',
      }
    }
  }
}