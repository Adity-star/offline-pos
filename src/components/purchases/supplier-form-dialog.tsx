'use client'

import { useState, useEffect } from 'react'
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
import { Building2 } from 'lucide-react'
import { toast } from 'sonner'

interface SupplierFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: any | null
  onSuccess: () => void
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: SupplierFormDialogProps) {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (supplier) {
      setName(supplier.name || '')
      setMobile(supplier.mobile || '')
      setEmail(supplier.email || '')
      setGstNumber(supplier.gstNumber || '')
      setAddress(supplier.address || '')
      setNotes(supplier.notes || '')
    } else {
      setName('')
      setMobile('')
      setEmail('')
      setGstNumber('')
      setAddress('')
      setNotes('')
    }
  }, [supplier, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !mobile.trim()) {
      toast.error('Supplier name and mobile number are required')
      return
    }

    try {
      setIsSubmitting(true)
      const url = supplier ? `/api/suppliers/${supplier.id}` : '/api/suppliers'
      const method = supplier ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim() || undefined,
          gstNumber: gstNumber.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save supplier')

      toast.success(supplier ? 'Supplier updated successfully' : 'Supplier added successfully')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error saving supplier')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {supplier ? 'Edit Supplier Agency' : 'Add New Supplier / Agency'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label className="font-semibold">
              Supplier / Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. Acme Wholesale Agency"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label className="font-semibold">
              Mobile / Contact Number <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. +91 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label>GST Identification Number (GSTIN)</Label>
            <Input
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Email Address</Label>
            <Input
              type="email"
              placeholder="supplier@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Office / Warehouse Address</Label>
            <Input
              placeholder="Address details..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Input
              placeholder="Payment terms, contact person, etc."
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
              {isSubmitting ? 'Saving...' : supplier ? 'Update Supplier' : 'Save Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
