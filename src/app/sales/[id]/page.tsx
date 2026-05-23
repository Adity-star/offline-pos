'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/shared/loading'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/sales/${params.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setSale(d)
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
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

  if (loading) return <PageLoading />
  if (!sale) return <div className="p-6">Invoice not found</div>

  const lineItems = sale.saleItems ?? sale.items ?? []
  const customerName = sale.customer?.name ?? sale.customerName ?? 'Walk-in Customer'
  const customerMobile = sale.customer?.mobile ?? sale.customerMobile ?? null

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
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item: any, idx: number) => {
                  const rate = Number(item.unitPrice ?? item.sellingPriceAtSale ?? item.saleRate ?? 0)
                  const amount = Number(item.totalPrice ?? rate * item.quantity)
                  const name = item.productName ?? item.product?.name ?? '—'
                  const sku = item.sku ?? item.product?.sku ?? '—'

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {sku}</div>
                      </TableCell>
                      <TableCell className="text-right">₹{rate.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
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
                <span>₹{(Number(sale.grandTotal) + Number(sale.discountAmount) - Number(sale.labourCost)).toFixed(2)}</span>
              </div>
              
              {Number(sale.discountAmount) > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount</span>
                  <span>- ₹{Number(sale.discountAmount).toFixed(2)}</span>
                </div>
              )}

              {Number(sale.labourCost) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Labour Cost</span>
                  <span>+ ₹{Number(sale.labourCost).toFixed(2)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span className="text-primary">₹{Number(sale.grandTotal).toFixed(2)}</span>
              </div>

              <div className="pt-2 flex justify-between items-center bg-muted/50 p-2 rounded">
                <span className="text-sm font-medium">Status</span>
                <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold
                  ${sale.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                    sale.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 
                    'bg-destructive/10 text-destructive'}`}
                >
                  {sale.paymentStatus}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
