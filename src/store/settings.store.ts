import { create } from 'zustand'

export interface AppSettings {
  storeName: string
  storeMobile: string
  storeEmail: string
  storeAddress: string
  storeCity: string
  gstNumber: string
  termsConditions: string
  invoicePrefix: string
  taxPercentage: number
  currencySymbol: string
  printTemplate: 'THERMAL_80MM' | 'A4'
  allowNegativeStock: boolean
}

interface SettingsState {
  settings: AppSettings | null
  loading: boolean
  
  loadSettings: () => Promise<void>
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,

  loadSettings: async () => {
    try {
      set({ loading: true })
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        set({ settings: data })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      set({ loading: false })
    }
  },

  updateSettings: async (newSettings) => {
    try {
      set({ loading: true })
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })
      if (res.ok) {
        const data = await res.json()
        set({ settings: data })
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  }
}))
