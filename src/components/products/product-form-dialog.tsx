'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative'),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative'),
  currentStock: z.coerce.number().int().min(0),
  minStockAlert: z.coerce.number().int().min(0),
  unitType: z.string().min(1, 'Unit type is required'),
  notes: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: any
  onSuccess: () => void
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductFormDialogProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const isEditing = !!product

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      categoryId: '',
      costPrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      minStockAlert: 5,
      unitType: 'pcs',
      notes: '',
    },
  })

  // Load categories
  useEffect(() => {
    if (open) {
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => {
          setCategories(data.categories || data)
        })
        .catch(() =>
          toast.error('Failed to load categories')
        )
    }
  }, [open])

  // Reset or set form values when dialog opens
  useEffect(() => {
    if (open && product) {
      form.reset({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        categoryId: product.categoryId,
        costPrice: Number(product.costPrice),
        sellingPrice: Number(product.sellingPrice),
        currentStock: product.currentStock,
        minStockAlert: product.minStockAlert,
        unitType: product.unitType,
        notes: product.notes || '',
      })
    } else if (open && !product) {
      form.reset({
        name: '',
        sku: '',
        barcode: '',
        categoryId: '',
        costPrice: 0,
        sellingPrice: 0,
        currentStock: 0,
        minStockAlert: 5,
        unitType: 'pcs',
        notes: '',
      })
    }
  }, [open, product, form])

  const onSubmit = async (values: ProductFormValues) => {
    try {
      setLoading(true)
      const url = isEditing ? `/api/products/${product.id}` : '/api/products'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product')
      }

      toast.success(`Product ${isEditing ? 'updated' : 'created'} successfully`)
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Name *</label>
              <Input {...form.register('name')} placeholder="Enter product name" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">SKU *</label>
              <Input {...form.register('sku')} placeholder="Unique SKU" />
              {form.formState.errors.sku && (
                <p className="text-xs text-destructive">{form.formState.errors.sku.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category *</label>
              <select
                {...form.register('categoryId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.categoryId && (
                <p className="text-xs text-destructive">{form.formState.errors.categoryId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Type *</label>
              <Input {...form.register('unitType')} placeholder="e.g., pcs, kg, box" />
              {form.formState.errors.unitType && (
                <p className="text-xs text-destructive">{form.formState.errors.unitType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cost Price (₹) *</label>
              <Input
                type="number"
                step="0.01"
                {...form.register('costPrice')}
              />
              {form.formState.errors.costPrice && (
                <p className="text-xs text-destructive">{form.formState.errors.costPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Selling Price (₹) *</label>
              <Input
                type="number"
                step="0.01"
                {...form.register('sellingPrice')}
              />
              {form.formState.errors.sellingPrice && (
                <p className="text-xs text-destructive">{form.formState.errors.sellingPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Current Stock</label>
              <Input
                type="number"
                disabled={isEditing} // Prevent stock changes via edit form, require inventory adjustment
                {...form.register('currentStock')}
              />
              {isEditing && (
                <p className="text-xs text-muted-foreground">Use Inventory module to adjust stock</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Min Stock Alert</label>
              <Input
                type="number"
                {...form.register('minStockAlert')}
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Barcode (Optional)</label>
              <Input {...form.register('barcode')} placeholder="Scan or enter barcode" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || form.formState.isSubmitting}>
              {loading ? 'Saving...' : (isEditing ? 'Update Product' : 'Add Product')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
