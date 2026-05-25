import fs from 'fs'
import path from 'path'
import os from 'os'

import { app } from 'electron'

export class BackupManager {
  private dbPath: string

  private backupDir: string

  constructor() {
    // PRODUCTION SQLITE LOCATION
    this.dbPath = path.join(
      app.getPath('userData'),
      'shop.db'
    )

    // BACKUP STORAGE LOCATION
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
    return new Promise(
      async (resolve) => {
        try {
          // CHECK DATABASE EXISTS
          if (
            !fs.existsSync(this.dbPath)
          ) {
            console.error(
              'Database not found:',
              this.dbPath
            )

            return resolve({
              success: false,

              error:
                'Database file not found.',
            })
          }

          // TIMESTAMP
          const dateStr =
            new Date()
              .toISOString()
              .replace(/[:T]/g, '-')
              .split('.')[0]

          const backupFileName = `pos_backup_${dateStr}.zip`

          const backupFilePath =
            path.join(
              this.backupDir,
              backupFileName
            )

          // OUTPUT STREAM
          const output =
            fs.createWriteStream(
              backupFilePath
            )

          const archiverModule =
            await import('archiver')

          const archiver =
            archiverModule.default

          const archive = archiver(
            'zip',
            {
              zlib: {
                level: 9,
              },
            }
          )

          // SUCCESS
          output.on(
            'close',
            () => {
              console.log(
                'Backup created:',
                backupFilePath
              )

              resolve({
                success: true,

                filePath:
                  backupFilePath,
              })
            }
          )

          // ERROR
          archive.on(
            'error',
            (err) => {
              console.error(
                'Archive error:',
                err
              )

              resolve({
                success: false,

                error:
                  err.message,
              })
            }
          )

          archive.pipe(output)

          // ADD SQLITE DB
          archive.file(
            this.dbPath,
            {
              name: 'shop.db',
            }
          )

          // FINALIZE ZIP
          await archive.finalize()
        } catch (error: any) {
          console.error(
            'Backup failed:',
            error
          )

          resolve({
            success: false,

            error:
              error.message ||
              'Backup failed',
          })
        }
      }
    )
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