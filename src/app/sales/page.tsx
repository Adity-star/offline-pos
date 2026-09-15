'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Printer, Search, Filter, IndianRupee } from 'lucide-react'
import { toast } from 'sonner'
import { printSaleById } from '@/lib/print-invoice'
import { format } from 'date-fns'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/shared/loading'
import { EmptyState } from '@/components/shared/empty-state'
import { useDebounce } from '@/hooks/use-debounce'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [limit] = useState(15)
  const [printingId, setPrintingId] = useState<string | null>(null)

  // Payment dialog state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMode, setPayMode] = useState<'CASH' | 'UPI' | 'CARD' | 'CREDIT'>('CASH')
  const [payNotes, setPayNotes] = useState('')
  const [isRecordingPayment, setIsRecordingPayment] = useState(false)

  const handlePrint = async (saleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setPrintingId(saleId)
      await printSaleById(saleId)
      toast.success('Bill sent to printer')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Print failed')
    } finally {
      setPrintingId(null)
    }
  }

  const handleOpenPaymentDialog = (sale: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const dueAmount = Number(sale.dueAmount || 0)
    if (dueAmount <= 0) {
      toast.error('No pending amount for this sale')
      return
    }
    if (!sale.customerId) {
      toast.error('Cannot record payment for a walk-in customer sale')
      return
    }
    setSelectedSale(sale)
    setPayAmount(dueAmount.toFixed(2))
    setIsPaymentOpen(true)
  }

  const handleRecordPayment = async () => {
    const amount = Number(payAmount)
    const dueAmount = Number(selectedSale?.dueAmount || 0)

    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount')
      return
    }
    if (amount > dueAmount) {
      toast.error(`Amount cannot exceed due amount of ₹${dueAmount.toFixed(2)}`)
      return
    }

    try {
      setIsRecordingPayment(true)
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: selectedSale.id,
          customerId: selectedSale.customerId,
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
      setSelectedSale(null)
      // Reload sales to reflect new status
      await fetchSales()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsRecordingPayment(false)
    }
  }

  const fetchSales = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== 'ALL' && { paymentStatus: statusFilter }),
      })
      const res = await fetch(`/api/sales?${query}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSales(data.sales)
      setTotal(data.total)
    } catch (error) {
      console.error('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [page, limit, debouncedSearch, statusFilter])

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <PageHeader title="Sales History" />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Invoice # or Customer..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        
<Select value={statusFilter} onValueChange={(val) => {
           setStatusFilter(val || 'ALL')
           setPage(1)
         }}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <SelectValue placeholder="Filter Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Grand Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Due</TableHead>
              <TableHead className="text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <PageLoading />
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <EmptyState
                    title="No sales found"
                    description="No invoices match your current filters."
                  />
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => {
                const paidAmount = Number(sale.paidAmount || 0)
                const dueAmount = Number(sale.dueAmount || 0)
                const grandTotal = Number(sale.grandTotal || 0)
                
                return (
                  <TableRow 
                    key={sale.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/sales/${sale.id}`)}
                  >
                    <TableCell>{format(new Date(sale.createdAt), 'dd MMM yyyy, hh:mm a')}</TableCell>
                    <TableCell className="font-medium text-muted-foreground">{sale.invoiceNumber}</TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold
                        ${sale.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                          sale.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 
                          'bg-destructive/10 text-destructive'}`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{grandTotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-700">₹{paidAmount.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-medium ${dueAmount > 0 ? 'text-destructive' : 'text-emerald-700'}`}>
                      ₹{dueAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        {dueAmount > 0 && sale.customerId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-emerald-600 hover:text-emerald-700"
                            onClick={(e) => handleOpenPaymentDialog(sale, e)}
                          >
                            <IndianRupee className="w-4 h-4 mr-1" />
                            Pay
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          disabled={printingId === sale.id}
                          onClick={(e) => handlePrint(sale.id, e)}
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          {printingId === sale.id ? '...' : 'Print'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/sales/${sale.id}`)
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page * limit >= total || loading}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice #</span>
                  <span className="font-medium">{selectedSale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{selectedSale.customerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Grand Total</span>
                  <span className="font-medium">₹{Number(selectedSale.grandTotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Already Paid</span>
                  <span className="font-medium text-emerald-700">₹{Number(selectedSale.paidAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Balance Due</span>
                  <span className="text-destructive">₹{Number(selectedSale.dueAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay-amount">Amount Received</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  min={0.01}
                  max={Number(selectedSale.dueAmount)}
                  step={0.01}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={Number(selectedSale.dueAmount).toFixed(2)}
                  className="text-right text-lg font-bold"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setPayAmount(Number(selectedSale.dueAmount).toFixed(2))}
                  >
                    Full amount
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setPayAmount((Number(selectedSale.dueAmount) / 2).toFixed(2))}
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

              {Number(payAmount) > 0 && Number(payAmount) < Number(selectedSale.dueAmount) && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 text-sm">
                  <span className="text-amber-700 dark:text-amber-300 font-medium">
                    Remaining due after this: ₹{(Number(selectedSale.dueAmount) - Number(payAmount)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
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
    </div>
  )
}
