import path from 'path'
import { app } from 'electron'

export function getDatabasePath() {
  return path.join(
    app.getPath('userData'),
    'shop.db'
  )
}