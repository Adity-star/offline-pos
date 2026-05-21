'use client'

import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import * as xlsx from 'xlsx'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ProductImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ProductImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: ProductImportDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const buffer = await file.arrayBuffer()
      const wb = xlsx.read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = xlsx.utils.sheet_to_json(ws)

      if (data.length === 0) {
        throw new Error('File is empty')
      }

      // Convert Excel data to product payload
      // Assuming headers: Name, SKU, Category, Cost Price, Selling Price, Stock, Min Stock, Unit, Barcode
      const products = data.map((row: any) => ({
        name: row['Name'] || row['name'],
        sku: String(row['SKU'] || row['sku']),
        barcode: row['Barcode'] ? String(row['Barcode']) : undefined,
        categoryName: row['Category'] || row['category'],
        costPrice: Number(row['Cost Price'] || row['costPrice'] || 0),
        sellingPrice: Number(row['Selling Price'] || row['sellingPrice'] || 0),
        currentStock: Number(row['Stock'] || row['stock'] || 0),
        minStockAlert: Number(row['Min Stock'] || row['minStock'] || 5),
        unitType: row['Unit'] || row['unit'] || 'pcs',
      }))

      // Validate required fields
      const invalidRows = products.findIndex((p) => !p.name || !p.sku)
      if (invalidRows !== -1) {
        throw new Error(`Row ${invalidRows + 2} is missing Name or SKU`)
      }

      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Import failed')
      }

      toast.success(`Successfully imported ${result.success} products`)
      if (result.errors?.length > 0) {
        toast.error(`${result.errors.length} products failed to import`)
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to parse Excel file')
    } finally {
      setLoading(false)
      // Clear file input
      e.target.value = ''
    }
  }

  const downloadTemplate = () => {
    const ws = xlsx.utils.json_to_sheet([
      {
        Name: 'Sample Product',
        SKU: 'SKU001',
        Category: 'General',
        'Cost Price': 100,
        'Selling Price': 150,
        Stock: 50,
        'Min Stock': 5,
        Unit: 'pcs',
        Barcode: '123456789',
      },
    ])
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Products')
    xlsx.writeFile(wb, 'product-template.xlsx')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Bulk Upload Products</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx, .csv) file to import multiple products at once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center gap-6 py-8">
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm font-medium">Select a file to upload</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Button disabled={loading}>
                {loading ? 'Uploading...' : 'Choose File'}
              </Button>
              <input
                type="file"
                className="absolute inset-0 cursor-pointer opacity-0"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </div>
            <Button variant="outline" onClick={downloadTemplate} disabled={loading}>
              Download Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
