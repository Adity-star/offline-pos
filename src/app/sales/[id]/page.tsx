'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Trash2, IndianRupee, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/shared/loading'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { printSaleById } from '@/lib/print-invoice'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function SaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [sale, setSale] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  // Payment dialog state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMode, setPayMode] = useState<'CASH' | 'UPI' | 'CARD' | 'CREDIT'>('CASH')
  const [payNotes, setPayNotes] = useState('')
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)

  const loadSale = async () => {
    if (!params.id) return
    try {
      const res = await fetch(`/api/sales/${params.id}`)
      const d = await res.json()
      if (d.error) throw new Error(d.error)
      setSale(d)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSale()
  }, [params.id])

  const handlePrint = async () => {
    if (!sale?.id) return
    try {
      setIsPrinting(true)
      await printSaleById(sale.id)
      toast.success('Bill sent to printer')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Print failed')
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/sales/${sale.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete sale')
      toast.success('Sale deleted successfully. Stock and ledger updated.')
      router.push('/sales')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
      setIsDeleteOpen(false)
    }
  }

  const handleRecordPayment = async () => {
    const amount = Number(payAmount)
    const dueAmount = Number(sale.dueAmount)

    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount')
      return
    }
    if (amount > dueAmount) {
      toast.error(`Amount cannot exceed due amount of ₹${dueAmount.toFixed(2)}`)
      return
    }
    if (!sale.customerId) {
      toast.error('Cannot record payment for a walk-in customer sale without a customer ID')
      return
    }

    try {
      setIsRecordingPayment(true)
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: sale.id,
          customerId: sale.customerId,
          amount,
          paymentMode: payMode,
          notes: payNotes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record payment')

      toast.success(`₹${amount.toFixed(2)} payment recorded successfully!`)
      setIsPaymentOpen(false)
      setPayAmount('')
      setPayNotes('')
      setPayMode('CASH')
      // Reload sale data to reflect new status
      await loadSale()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsRecordingPayment(false)
    }
  }

  if (loading) return <PageLoading />
  if (!sale) return <div className="p-6">Invoice not found</div>

  const lineItems = sale.saleItems ?? sale.items ?? []
  const customerName = sale.customer?.name ?? sale.customerName ?? 'Walk-in Customer'
  const customerMobile = sale.customer?.mobile ?? sale.customerMobile ?? null
  const grandTotal = Number(sale.grandTotal)
  const paidAmount = Number(sale.paidAmount)
  const dueAmount = Number(sale.dueAmount)

  const statusColor = sale.paymentStatus === 'PAID'
    ? 'bg-emerald-100 text-emerald-700'
    : sale.paymentStatus === 'PARTIAL'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-destructive/10 text-destructive'

  const StatusIcon = sale.paymentStatus === 'PAID'
    ? CheckCircle2
    : sale.paymentStatus === 'PARTIAL'
    ? Clock
    : AlertCircle

  const canRecordPayment = sale.paymentStatus !== 'PAID' && sale.customerId && dueAmount > 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-2 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader
            title={`Invoice ${sale.invoiceNumber}`}
            description={format(new Date(sale.createdAt), 'MMMM do yyyy, h:mm a')}
          />
        </div>
        <div className="flex items-center gap-3">
          {canRecordPayment && (
            <Button
              variant="default"
              onClick={() => {
                setPayAmount(dueAmount.toFixed(2))
                setIsPaymentOpen(true)
              }}
            >
              <IndianRupee className="w-4 h-4 mr-2" />
              Collect Payment
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
            <Printer className="w-4 h-4 mr-2" /> {isPrinting ? 'Printing...' : 'Print'}
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Invoice
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 pt-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  {lineItems.some((i: any) => Number(i.discountPercent) > 0) && (
                    <TableHead className="text-center">Disc%</TableHead>
                  )}
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item: any, idx: number) => {
                  const rate = Number(item.unitPrice ?? item.sellingPriceAtSale ?? item.saleRate ?? 0)
                  const amount = Number(item.totalPrice ?? rate * item.quantity)
                  const name = item.productName ?? item.product?.name ?? '—'
                  const sku = item.sku ?? item.product?.sku ?? '—'
                  const discPct = Number(item.discountPercent ?? 0)
                  const hasDisc = lineItems.some((i: any) => Number(i.discountPercent) > 0)

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {sku}</div>
                      </TableCell>
                      <TableCell className="text-right">₹{rate.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      {hasDisc && (
                        <TableCell className="text-center">
                          {discPct > 0 ? (
                            <span className="text-destructive text-xs font-medium">{discPct}%</span>
                          ) : '—'}
                        </TableCell>
                      )}
                      <TableCell className="text-right font-medium">
                        ₹{amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-1">
              <div className="font-medium">{customerName}</div>
              {customerMobile && <div className="text-muted-foreground">{customerMobile}</div>}
              {sale.customer && sale.customer.address && (
                <div className="text-sm text-muted-foreground mt-2">{sale.customer.address}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{(grandTotal + Number(sale.discountAmount ?? 0) - Number(sale.labourCost ?? 0)).toFixed(2)}</span>
              </div>

              {Number(sale.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount</span>
                  <span>- ₹{Number(sale.discountAmount).toFixed(2)}</span>
                </div>
              )}

              {Number(sale.labourCost ?? 0) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>GST ({Number(sale.gstPercentage ?? 0)}%)</span>
                  <span>+ ₹{Number(sale.labourCost).toFixed(2)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>

              <Separator />

              {/* Paid / Due breakdown */}
              <div className="flex justify-between text-emerald-700">
                <span className="text-sm font-medium">Amount Paid</span>
                <span className="font-bold">₹{paidAmount.toFixed(2)}</span>
              </div>

              {dueAmount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span className="text-sm font-medium">Balance Due</span>
                  <span className="font-bold">₹{dueAmount.toFixed(2)}</span>
                </div>
              )}

              <div className={`pt-2 flex justify-between items-center p-2 rounded ${statusColor} bg-opacity-10`}>
                <span className="text-sm font-medium flex items-center gap-1">
                  <StatusIcon className="w-4 h-4" />
                  Status
                </span>
                <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                  {sale.paymentStatus}
                </span>
              </div>

              {/* Payment history */}
              {sale.payments && sale.payments.length > 0 && (
                <div className="mt-2 pt-2 border-t space-y-2">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Payment History</div>
                  {sale.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <div>
                        <div className="font-medium">{p.paymentMode}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(p.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </div>
                      </div>
                      <div className="font-bold text-emerald-700">₹{Number(p.amount).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}

              {canRecordPayment && (
                <Button
                  className="w-full mt-2"
                  onClick={() => {
                    setPayAmount(dueAmount.toFixed(2))
                    setIsPaymentOpen(true)
                  }}
                >
                  <IndianRupee className="w-4 h-4 mr-2" />
                  Collect ₹{dueAmount.toFixed(2)} Due
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Grand Total</span>
                <span className="font-medium">₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Already Paid</span>
                <span className="font-medium text-emerald-700">₹{paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Balance Due</span>
                <span className="text-destructive">₹{dueAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay-amount">Amount Received</Label>
              <Input
                id="pay-amount"
                type="number"
                min={0.01}
                max={dueAmount}
                step={0.01}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder={dueAmount.toFixed(2)}
                className="text-right text-lg font-bold"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setPayAmount(dueAmount.toFixed(2))}
                >
                  Full amount
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setPayAmount((dueAmount / 2).toFixed(2))}
                >
                  Half
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={payMode} onValueChange={(v: any) => setPayMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="CREDIT">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay-notes">Notes (optional)</Label>
              <Input
                id="pay-notes"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="e.g. UPI ref: 123456"
              />
            </div>

            {Number(payAmount) > 0 && Number(payAmount) < dueAmount && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 text-sm">
                <span className="text-amber-700 dark:text-amber-300 font-medium">
                  Remaining due after this: ₹{(dueAmount - Number(payAmount)).toFixed(2)}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)} disabled={isRecordingPayment}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={isRecordingPayment || !payAmount}>
              {isRecordingPayment ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Invoice"
        description="Are you absolutely sure? This will delete the invoice, restock the inventory, and reverse the customer balance adjustment. This action cannot be undone."
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

