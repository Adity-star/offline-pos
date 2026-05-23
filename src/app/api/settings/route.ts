import { NextRequest, NextResponse } from 'next/server'
import { settingsService } from '@/lib/services/settings.service'

function mapSettingsResponse(settings: Awaited<ReturnType<typeof settingsService.get>>) {
  const thermal = String(settings.thermalPaperWidth ?? '').toLowerCase()
  const printTemplate =
    settings.thermalPaperWidth === 'A4' || thermal.includes('a4')
      ? 'A4'
      : 'THERMAL_80MM'

  return {
    ...settings,
    storeMobile: settings.storePhone,
    printTemplate,
    taxPercentage: Number(settings.taxPercentage),
  }
}

export async function GET() {
  try {
    const settings = await settingsService.get()
    return NextResponse.json(mapSettingsResponse(settings))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = { ...body }

    if (body.storeMobile !== undefined) {
      payload.storePhone = body.storeMobile
    }
    if (body.printTemplate === 'A4') {
      payload.thermalPaperWidth = 'A4'
    } else if (body.printTemplate === 'THERMAL_80MM') {
      payload.thermalPaperWidth = '80mm'
    }

    const settings = await settingsService.update(payload)
    return NextResponse.json(mapSettingsResponse(settings))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    )
  }
}
