'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp } from 'lucide-react'

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

const adjustSchema = z.object({
  productId: z.string().min(1),

  type: z.enum([
    'ADD',
    'REMOVE',
  ]),

  quantity: z.union([
    z.string(),
    z.number(),
  ]).transform((val) =>
    Number(val)
  ).refine(
    (val) => val >= 1,
    {
      message:
        'Quantity must be at least 1',
    }
  ),

  reason: z.string().min(
    2,
    'Reason is required'
  ),
})

type AdjustFormValues =
  z.output<
    typeof adjustSchema
  >

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: { id: string; name: string; currentStock: number } | null
  onSuccess: () => void
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const [loading, setLoading] = useState(false)

  type AdjustFormInput = z.input<typeof adjustSchema>
type AdjustFormOutput = z.output<typeof adjustSchema>

const form = useForm<AdjustFormInput, unknown, AdjustFormOutput>({
  resolver: zodResolver(adjustSchema),
    defaultValues: {
      productId: '',
      type: 'ADD',
      quantity: 1,
      reason: 'Manual Stock Update',
    },
  })

  useEffect(() => {
    if (open && product) {
      form.reset({
        productId: product.id,
        type: 'ADD',
        quantity: 1,
        reason: 'Manual Stock Update',
      })
    }
  }, [open, product, form])

  const onSubmit = async (values: AdjustFormOutput) => {
    try {
      setLoading(true)

      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to adjust stock')
      }

      toast.success('Stock adjusted successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const adjustType = form.watch('type')

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            Modify inventory for <strong>{product.name}</strong>. Current stock is {product.currentStock}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Adjustment Type *</label>
<Select 
                 value={form.watch('type')} 
                 onValueChange={(val) => form.setValue('type', val as 'ADD' | 'REMOVE')}
               >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADD">
                    <div className="flex items-center text-emerald-600 font-medium">
                      <ArrowUp className="w-4 h-4 mr-2" /> Add Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="REMOVE">
                    <div className="flex items-center text-destructive font-medium">
                      <ArrowDown className="w-4 h-4 mr-2" /> Remove Stock
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity *</label>
              <Input
                type="number"
                min="1"
                {...form.register('quantity')}
              />
              {form.formState.errors.quantity && (
                <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
              )}
            </div>
          </div>

          <div className="bg-muted p-3 flex justify-between rounded-md items-center shadow-inner">
            <span className="text-sm font-medium">New Stock Preview:</span>
            <span className={`text-lg font-bold ${adjustType === 'ADD' ? 'text-emerald-600' : 'text-destructive'}`}>
              {adjustType === 'ADD' 
                ? product.currentStock + (Number(form.watch('quantity')) || 0) 
                : product.currentStock - (Number(form.watch('quantity')) || 0)}
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium">Reason *</label>
            <Input {...form.register('reason')} placeholder="e.g. Damage, Restock, Correction" />
            {form.formState.errors.reason && (
              <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || form.formState.isSubmitting}>
              {loading ? 'Processing...' : 'Confirm Adjustment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
