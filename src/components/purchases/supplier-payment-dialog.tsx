'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Banknote } from 'lucide-react'
import { toast } from 'sonner'

interface SupplierPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: { id: string; name: string; pendingAmount: number } | null
  purchaseId?: string
  onSuccess: () => void
}

export function SupplierPaymentDialog({
  open,
  onOpenChange,
  supplier,
  purchaseId,
  onSuccess,
}: SupplierPaymentDialogProps) {
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('CASH')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!supplier) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payAmt = Number(amount)
    if (!payAmt || payAmt <= 0) {
      toast.error('Please enter a valid positive payment amount')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/suppliers/${supplier.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payAmt,
          paymentMode,
          purchaseId: purchaseId || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record payment')

      toast.success(`Payment of ₹${payAmt.toFixed(2)} recorded to ${supplier.name}`)
      onSuccess()
      onOpenChange(false)
      setAmount('')
      setNotes('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error recording payment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" /> Pay Supplier Dues
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border text-sm">
            <div className="font-semibold text-base">{supplier.name}</div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-muted-foreground">Current Pending Dues:</span>
              <span className="font-bold text-destructive text-base">
                ₹{supplier.pendingAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <Label className="font-semibold">
              Payment Amount (₹) <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              min={0.01}
              placeholder={`Max ₹${supplier.pendingAmount.toFixed(2)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 font-bold text-base"
              required
            />
          </div>

          <div>
            <Label>Payment Method</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="CARD">Bank Card</option>
              <option value="NET_BANKING">Net Banking / NEFT</option>
            </select>
          </div>

          <div>
            <Label>Notes / Reference No.</Label>
            <Input
              placeholder="e.g. Bank Ref #998811, Cheque #00122"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Supplier Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
