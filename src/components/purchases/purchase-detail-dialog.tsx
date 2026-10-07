'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, Building2, User } from 'lucide-react'

interface PurchaseDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: any | null
}

export function PurchaseDetailDialog({
  open,
  onOpenChange,
  purchase,
}: PurchaseDetailDialogProps) {
  if (!purchase) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center pr-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileText className="h-6 w-6 text-primary" /> Purchase Voucher {purchase.purchaseNumber}
            </DialogTitle>
            <Badge
              variant={
                purchase.paymentStatus === 'PAID'
                  ? 'default'
                  : purchase.paymentStatus === 'PARTIAL'
                  ? 'secondary'
                  : 'destructive'
              }
              className="text-xs uppercase px-2.5 py-1"
            >
              {purchase.paymentStatus}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2 text-sm">
          {/* Top Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/40 p-4 rounded-lg border">
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> Supplier / Agency
              </div>
              <div className="font-bold text-base mt-0.5">{purchase.supplierName}</div>
              {purchase.supplier?.mobile && (
                <div className="text-xs text-muted-foreground">{purchase.supplier.mobile}</div>
              )}
            </div>

            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Date & Time
              </div>
              <div className="font-medium mt-0.5">
                {new Date(purchase.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Supplier Invoice #</div>
              <div className="font-medium mt-0.5">{purchase.invoiceNumber || '—'}</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Received By
              </div>
              <div className="font-medium mt-0.5">{purchase.user?.fullName || purchase.user?.username || 'Admin'}</div>
            </div>
          </div>

          {/* Items Purchased */}
          <div>
            <div className="font-semibold text-base mb-2">Purchased Items Breakdown</div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-muted text-xs uppercase font-semibold">
                  <tr>
                    <th className="p-3">Item / SKU</th>
                    <th className="p-3 text-center">Qty Purchased</th>
                    <th className="p-3 text-right">Unit Cost Price</th>
                    <th className="p-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {purchase.purchaseItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium">
                        {item.productName}
                        <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                      </td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-right">₹{Number(item.unitCost).toFixed(2)}</td>
                      <td className="p-3 text-right font-bold">
                        ₹{Number(item.totalCost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
            <div>
              {purchase.notes && (
                <div className="bg-muted/30 p-3 rounded border text-xs">
                  <span className="font-semibold">Notes / Remarks: </span>
                  <span>{purchase.notes}</span>
                </div>
              )}
              <div className="mt-2 text-xs text-muted-foreground">
                Payment Mode: <span className="font-semibold text-foreground">{purchase.paymentMode}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-right text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">₹{Number(purchase.subtotal).toFixed(2)}</span>
              </div>
              {Number(purchase.discountAmount) > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount:</span>
                  <span>- ₹{Number(purchase.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {Number(purchase.taxAmount) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Tax / Shipping:</span>
                  <span>+ ₹{Number(purchase.taxAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-base border-t pt-1.5 text-primary">
                <span>Grand Total:</span>
                <span>₹{Number(purchase.grandTotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold text-xs">
                <span>Amount Paid Out:</span>
                <span>₹{Number(purchase.paidAmount).toFixed(2)}</span>
              </div>
              {Number(purchase.dueAmount) > 0 && (
                <div className="flex justify-between text-destructive font-bold text-xs">
                  <span>Balance Pending Dues:</span>
                  <span>₹{Number(purchase.dueAmount).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
