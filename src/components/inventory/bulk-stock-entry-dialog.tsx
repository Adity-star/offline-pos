'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Search } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface BulkStockEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface StockEntry {
  productId: string
  productName: string
  quantity: number
  costPrice: number
  reason: string
}

export function BulkStockEntryDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkStockEntryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<StockEntry[]>([{
    productId: '',
    productName: '',
    quantity: 1,
    costPrice: 0,
    reason: 'Bulk Purchase',
  }])
  const [productSearch, setProductSearch] = useState('')
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const fetchProducts = async (search: string) => {
    try {
      setSearchLoading(true)
      const res = await fetch(`/api/products?search=${search}&limit=20`)
      const data = await res.json()
      setAvailableProducts(data.products || [])
    } catch (error) {
      console.error('Failed to fetch products')
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchProducts('')
    }
  }, [open])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (productSearch.length > 0) {
        fetchProducts(productSearch)
      } else {
        fetchProducts('')
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  const addEntry = () => {
    setEntries([...entries, {
      productId: '',
      productName: '',
      quantity: 1,
      costPrice: 0,
      reason: 'Bulk Purchase',
    }])
  }

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index))
    }
  }

  const updateEntry = (index: number, field: keyof StockEntry, value: any) => {
    const updatedEntries = [...entries]
    if (field === 'productId') {
      const product = availableProducts.find(p => p.id === value)
      if (product) {
        updatedEntries[index] = {
          ...updatedEntries[index],
          productId: value,
          productName: product.name,
          costPrice: Number(product.costPrice),
        }
      }
    } else {
      updatedEntries[index] = { ...updatedEntries[index], [field]: value }
    }
    setEntries(updatedEntries)
  }

  const calculateTotalCost = () => {
    return entries.reduce((sum, entry) => sum + (entry.quantity * entry.costPrice), 0)
  }

  const handleSubmit = async () => {
    // Validate entries
    const invalidEntry = entries.find(e => !e.productId || e.quantity < 1 || e.costPrice < 0)
    if (invalidEntry) {
      toast.error('Please fill all required fields correctly')
      return
    }

    try {
      setLoading(true)

      // Process each entry
      const results = await Promise.all(
        entries.map(async (entry) => {
          const res = await fetch('/api/inventory/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: entry.productId,
              type: 'ADD',
              quantity: entry.quantity,
              reason: `${entry.reason} - Cost: ₹${entry.costPrice}/unit`,
            }),
          })
          return res.json()
        })
      )

      const hasError = results.some(r => r.error)
      if (hasError) {
        throw new Error('Some entries failed to process')
      }

      toast.success(`Successfully added ${entries.length} stock entries worth ₹${calculateTotalCost().toLocaleString('en-IN')}`)
      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setEntries([{
        productId: '',
        productName: '',
        quantity: 1,
        costPrice: 0,
        reason: 'Bulk Purchase',
      }])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process bulk entry')
    } finally {
      setLoading(false)
    }
  }

  const totalCost = calculateTotalCost()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Stock Entry</DialogTitle>
          <DialogDescription>
            Enter multiple stock additions at once. Useful for recording bulk purchases or inventory transfers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {entries.map((entry, index) => (
            <Card key={index} className="border">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Entry #{index + 1}</h4>
                  {entries.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Product *</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        className="pl-9"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                    <Select
                      value={entry.productId}
                      onValueChange={(value) => updateEntry(index, 'productId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku}) - Stock: {product.currentStock}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity *</label>
                    <Input
                      type="number"
                      min="1"
                      value={entry.quantity}
                      onChange={(e) => updateEntry(index, 'quantity', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cost Price (₹) *</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={entry.costPrice}
                      onChange={(e) => updateEntry(index, 'costPrice', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Reason *</label>
                    <Input
                      value={entry.reason}
                      onChange={(e) => updateEntry(index, 'reason', e.target.value)}
                      placeholder="e.g. Bulk Purchase from Supplier X"
                    />
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-md flex justify-between items-center">
                  <span className="text-sm font-medium">Entry Cost:</span>
                  <span className="font-bold text-emerald-600">
                    ₹{(entry.quantity * entry.costPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addEntry}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Entry
          </Button>

          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Total Cost</p>
                <p className="text-xs text-muted-foreground">{entries.length} entries</p>
              </div>
              <span className="text-2xl font-bold text-primary">
                ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || entries.some(e => !e.productId)}
            >
              {loading ? 'Processing...' : `Process Bulk Entry (₹${totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}