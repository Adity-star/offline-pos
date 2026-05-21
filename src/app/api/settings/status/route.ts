import { NextResponse } from 'next/server'
import { settingsService } from '@/lib/services/settings.service'

export async function GET() {
  try {
    const status = await settingsService.getSystemStatus()
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get system status' },
      { status: 500 }
    )
  }
}
