'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { Store, Server, ShieldCheck, Printer, Cog } from 'lucide-react'

import { useSettingsStore } from '@/store/settings.store'
import { PageHeader } from '@/components/shared/page-header'
import { PageLoading } from '@/components/shared/loading'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

const settingsSchema = z.object({
  storeName: z.string().min(1, 'Store Name is required'),
  storeMobile: z.string().min(1, 'Mobile is required'),
  storeEmail: z.string().email().optional().or(z.literal('')),
  storeAddress: z.string().optional(),
  storeCity: z.string().optional(),
  gstNumber: z.string().optional(),
  termsConditions: z.string().optional(),
  
  invoicePrefix: z.string().optional(),
  taxPercentage: z.number().min(0).max(100),
  currencySymbol: z.string().min(1, 'Symbol required'),
  printTemplate: z.enum(['THERMAL_80MM', 'A4']),
  allowNegativeStock: z.boolean(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const { settings, loadSettings, updateSettings } = useSettingsStore()
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: '',
      storeMobile: '',
      storeEmail: '',
      storeAddress: '',
      storeCity: '',
      gstNumber: '',
      termsConditions: '',
      invoicePrefix: 'INV-',
      taxPercentage: 0 as number,
      currencySymbol: '₹',
      printTemplate: 'THERMAL_80MM',
      allowNegativeStock: false,
    }
  })

  useEffect(() => {
    loadSettings()
    fetch('/api/settings/status')
      .then(res => res.json())
      .then(d => setSystemStatus(d))
      .catch(() => console.error('Failed to get system status'))
  }, [])

  useEffect(() => {
    if (settings) {
      form.reset({
        storeName: settings.storeName || '',
        storeMobile: settings.storeMobile || '',
        storeEmail: settings.storeEmail || '',
        storeAddress: settings.storeAddress || '',
        storeCity: settings.storeCity || '',
        gstNumber: settings.gstNumber || '',
        termsConditions: settings.termsConditions || '',
        invoicePrefix: settings.invoicePrefix || 'INV-',
        taxPercentage: settings.taxPercentage || 0,
        currencySymbol: settings.currencySymbol || '₹',
        printTemplate: settings.printTemplate as any || 'THERMAL_80MM',
        allowNegativeStock: settings.allowNegativeStock || false,
      })
    }
  }, [settings, form])

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      setIsSaving(true)
      await updateSettings(values)
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (!settings) return <PageLoading />

  return (
    <div className="flex h-full flex-col space-y-6 p-6 overflow-auto">
      <PageHeader 
        title="Settings" 
        description="Manage your business profile, billing preferences, and system configuration." 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-6">
          <form id="settings-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Store className="mr-2 h-5 w-5 text-primary" /> Store Profile
                </CardTitle>
                <CardDescription>
                  This information will be printed on your invoices and receipts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Store Name *</label>
                    <Input {...form.register('storeName')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mobile Number *</label>
                    <Input {...form.register('storeMobile')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input {...form.register('storeEmail')} type="email" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">GSTIN / Tax ID</label>
                    <Input {...form.register('gstNumber')} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Full Address</label>
                    <Input {...form.register('storeAddress')} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Terms & Conditions (Printed on Bill)</label>
                    <textarea
                      {...form.register('termsConditions')}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Returns allowed within 7 days with valid receipt."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Cog className="mr-2 h-5 w-5 text-primary" /> Billing System Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Invoice Prefix</label>
                    <Input {...form.register('invoicePrefix')} placeholder="e.g. INV-" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Currency Symbol</label>
                    <Input {...form.register('currencySymbol')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Tax %</label>
                    <Input {...form.register('taxPercentage')} type="number" step="0.1" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Printer className="h-4 w-4" /> Print Format
                    </label>
                    <select
                      {...form.register('printTemplate')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="A4">A4 Invoice (Professional)</option>
                      <option value="THERMAL_80MM">Thermal Receipt (80mm)</option>
                    </select>
                  </div>
                  <div className="space-y-2 flex flex-col justify-end pb-2">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input 
                        type="checkbox" 
                        {...form.register('allowNegativeStock')} 
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Allow Billing Below 0 Stock
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        <div className="space-y-6">
          <Card>
             <CardContent className="p-6">
               <Button type="submit" form="settings-form" className="w-full h-12 text-lg font-medium" disabled={isSaving}>
                 {isSaving ? 'Saving...' : 'Save Settings'}
               </Button>
             </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Server className="mr-2 h-5 w-5 text-blue-600" /> System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                 <span className="text-muted-foreground text-sm">Database</span>
                 <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                   <ShieldCheck className="w-3 h-3 mr-1" /> RUNNING
                 </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                 <span className="text-muted-foreground text-sm">Total Invoices</span>
                 <span className="font-semibold">{systemStatus?.totalSales || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                 <span className="text-muted-foreground text-sm">Customers</span>
                 <span className="font-semibold">{systemStatus?.totalCustomers || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                 <span className="text-muted-foreground text-sm">Products</span>
                 <span className="font-semibold">{systemStatus?.totalProducts || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-xs text-muted-foreground">
                 <span>App Version</span>
                 <span>v1.0.0 (Local Build)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
