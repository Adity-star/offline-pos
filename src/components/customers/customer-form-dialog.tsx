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

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(10, 'Valid mobile number requried'),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  notes: z.string().optional(),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: any
  onSuccess: () => void
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!customer

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      mobile: '',
      address: '',
      gstNumber: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open && customer) {
      form.reset({
        name: customer.name || '',
        mobile: customer.mobile || '',
        address: customer.address || '',
        gstNumber: customer.gstNumber || '',
        notes: customer.notes || '',
      })
    } else if (open && !customer) {
      form.reset({
        name: '',
        mobile: '',
        address: '',
        gstNumber: '',
        notes: '',
      })
    }
  }, [open, customer, form])

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      setLoading(true)
      const url = isEditing ? `/api/customers/${customer.id}` : '/api/customers'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save customer')
      }

      toast.success(`Customer ${isEditing ? 'updated' : 'added'} successfully`)
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
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Name *</label>
            <Input {...form.register('name')} placeholder="Enter full name" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mobile Number *</label>
            <Input {...form.register('mobile')} placeholder="10-digit mobile" />
            {form.formState.errors.mobile && (
              <p className="text-xs text-destructive">{form.formState.errors.mobile.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <textarea
              {...form.register('address')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Full address"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">GST Number (Optional)</label>
            <Input {...form.register('gstNumber')} placeholder="e.g. 27AADCB2230M1Z2" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || form.formState.isSubmitting}>
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Add Customer')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
