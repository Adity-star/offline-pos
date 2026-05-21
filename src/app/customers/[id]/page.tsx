'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Clock, Receipt } from 'lucide-react'
import { format } from 'date-fns'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/shared/loading'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function CustomerLedgerPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.id) return
    
    // Using simple fetch instead of unwrapping the dynamic param inside component
    // We treat params as `{ id: string }` without making the component async, due to Next 15 limits
    fetch(`/api/customers/${params.id}/ledger`)
      .then(res => res.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return <PageLoading />
  if (!data) return <div className="p-6">Customer not found</div>

  const { customer, sales, payments, totalPurchases, totalPaid, pendingAmount } = data

  // Merge sales and payments for a unified ledger view
  const ledgerEntries = [
    ...sales.map((s: any) => ({
      id: s.id,
      date: new Date(s.createdAt),
      type: 'SALE',
      ref: s.invoiceNumber,
      debit: Number(s.grandTotal), // Added to pending
      credit: Number(s.paidAmount), // Subtracted from pending (instant payment at sale)
      status: s.paymentStatus
    })),
    ...payments.map((p: any) => ({
      id: p.id,
      date: new Date(p.createdAt),
      type: 'PAYMENT',
      ref: `Receipt via ${p.paymentMode}`,
      debit: 0,
      credit: Number(p.amount), // Subtracted from pending
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader 
          title={`Ledger: ${customer.name}`}
          description={`${customer.mobile} ${customer.address ? `• ${customer.address}` : ''}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-orange-50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/50">
          <CardContent className="p-6 flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Pending Amount</span>
            <span className="text-3xl font-bold mt-2 text-foreground">
              {pendingAmount > 0 ? `₹${pendingAmount.toFixed(2)}` : 'Clear'}
            </span>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-muted-foreground">Total Purchases</span>
            <span className="text-2xl font-bold mt-2 text-foreground">₹{totalPurchases.toFixed(2)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-center items-center">
            <span className="text-sm font-medium text-muted-foreground">Total Paid</span>
            <span className="text-2xl font-bold mt-2 text-emerald-600">₹{totalPaid.toFixed(2)}</span>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-card flex-1 overflow-auto mt-4">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Billed Amount (Debit)</TableHead>
              <TableHead className="text-right">Paid Amount (Credit)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledgerEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No transactions found in ledger.
                </TableCell>
              </TableRow>
            ) : (
              ledgerEntries.map((entry, idx) => (
                <TableRow key={`${entry.type}-${entry.id}-${idx}`}>
                  <TableCell>{format(entry.date, 'dd MMM yyyy, hh:mm a')}</TableCell>
                  <TableCell>
                    {entry.type === 'SALE' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                        <Receipt className="w-3 h-3 mr-1"/> SALE
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        <CreditCard className="w-3 h-3 mr-1"/> PAY
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground">{entry.ref}</TableCell>
                  <TableCell className="text-right font-medium text-orange-600">
                    {entry.debit > 0 ? `+ ₹${entry.debit.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium text-emerald-600">
                    {entry.credit > 0 ? `- ₹${entry.credit.toFixed(2)}` : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
