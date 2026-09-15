'use client'

import { Printer, UserPlus, CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBillingStore } from '@/store/billing.store'
import { Separator } from '@/components/ui/separator'

interface BillingSummaryProps {
  onCompleteSale: () => void
  onPrint?: () => void
  isSubmitting: boolean
  isPrinting?: boolean
}

const PAYMENT_MODES = [
  { value: 'CASH' as const, label: 'Cash', icon: Banknote },
  { value: 'UPI' as const, label: 'UPI', icon: Smartphone },
  { value: 'CARD' as const, label: 'Card', icon: CreditCard },
  { value: 'CREDIT' as const, label: 'Credit', icon: Building2 },
]

export function BillingSummary({ onCompleteSale, onPrint, isSubmitting, isPrinting }: BillingSummaryProps) {
  const items = useBillingStore((state) => state.items)
  const discountType = useBillingStore((state) => state.discountType)
  const discountValue = useBillingStore((state) => state.discountValue)
  const labourCost = useBillingStore((state) => state.labourCost) // GST %
  const customer = useBillingStore((state) => state.customer)
  const pendingAmount = useBillingStore((state) => state.pendingAmount)
  const amountReceived = useBillingStore((state) => state.amountReceived)
  const paymentMode = useBillingStore((state) => state.paymentMode)
  const setDiscount = useBillingStore((state) => state.setDiscount)
  const setLabourCost = useBillingStore((state) => state.setLabourCost)
  const setAmountReceived = useBillingStore((state) => state.setAmountReceived)
  const setPaymentMode = useBillingStore((state) => state.setPaymentMode)

  const getSubtotal = useBillingStore((state) => state.getSubtotal)
  const getDiscountAmount = useBillingStore((state) => state.getDiscountAmount)
  const getGstAmount = useBillingStore((state) => state.getGstAmount)
  const getGrandTotal = useBillingStore((state) => state.getGrandTotal)
  const getChangeAmount = useBillingStore((state) => state.getChangeAmount)

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const gstAmount = getGstAmount()
  const grandTotal = getGrandTotal()
  const changeAmount = getChangeAmount()

  const effectivePaid = amountReceived === null ? grandTotal : amountReceived
  const balanceDue = Math.max(0, grandTotal - effectivePaid)
  const isPartial = effectivePaid > 0 && balanceDue > 0
  const isUnpaid = effectivePaid === 0 && grandTotal > 0
  const isOverpaid = changeAmount > 0

  return (
    <Card className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 border-l">
      <CardContent className="p-6 flex flex-col h-full gap-5">

        {/* Customer Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-primary" />
            Customer info
          </h3>
          <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border">
            {customer.name ? (
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-lg">{customer.name}</div>
                  <div className="text-muted-foreground">{customer.mobile}</div>
                </div>
                {pendingAmount > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground italic">Pending Due</div>
                    <div className="text-sm font-bold text-destructive">₹{pendingAmount.toFixed(2)}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-center py-2 text-sm italic">
                Walk-in Customer
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Calculation Section */}
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center text-base">
            <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
            <span className="font-medium">₹{subtotal.toFixed(2)}</span>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-destructive font-medium">- ₹{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <div className="flex bg-muted rounded-md p-1">
                <button
                  type="button"
                  className={`px-3 py-1 text-sm rounded ${discountType === 'percentage' ? 'bg-background shadow-sm' : ''}`}
                  onClick={() => setDiscount('percentage', discountValue)}
                >
                  %
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 text-sm rounded ${discountType === 'amount' ? 'bg-background shadow-sm' : ''}`}
                  onClick={() => setDiscount('amount', discountValue)}
                >
                  ₹
                </button>
              </div>
              <Input
                type="number"
                className="h-8 flex-1 text-right"
                value={discountValue || ''}
                onChange={(e) => setDiscount(discountType, Number(e.target.value) || 0)}
                placeholder="0"
                min={0}
                max={discountType === 'percentage' ? 100 : subtotal}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">GST Cost ({labourCost || 0}%)</span>
              <span className="font-medium text-blue-600">+ ₹{gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                className="h-8 text-right flex-1"
                value={labourCost || ''}
                onChange={(e) => setLabourCost(Number(e.target.value) || 0)}
                placeholder="0"
                min={0}
                max={100}
                step={0.01}
              />
              <span className="text-sm text-muted-foreground font-medium">%</span>
            </div>
          </div>
        </div>

        {/* Grand Total + Payment Section */}
        <div className="pt-3 border-t-2 border-dashed space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-slate-700 dark:text-slate-200">Grand Total</span>
            <span className="text-4xl font-extrabold text-primary">₹{grandTotal.toFixed(2)}</span>
          </div>

          {/* Payment Mode */}
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-muted-foreground">Payment Mode</span>
            <div className="grid grid-cols-4 gap-1">
              {PAYMENT_MODES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMode(value)}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border text-xs font-medium transition-all
                    ${paymentMode === value
                      ? 'bg-primary text-primary-foreground border-primary shadow'
                      : 'bg-background hover:bg-muted border-border'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Received */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Amount Received</span>
              {amountReceived !== null && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setAmountReceived(null)}
                >
                  Set full amount
                </button>
              )}
            </div>
            <Input
              type="number"
              className={`h-9 text-right text-base font-bold ${
                isPartial ? 'border-amber-500 focus-visible:ring-amber-500' :
                isUnpaid ? 'border-destructive focus-visible:ring-destructive' :
                isOverpaid ? 'border-blue-500 focus-visible:ring-blue-500' :
                ''
              }`}
              value={amountReceived === null ? '' : amountReceived}
              onChange={(e) => {
                const val = e.target.value
                if (val === '') {
                  setAmountReceived(null)
                } else {
                  setAmountReceived(Math.max(0, Number(val) || 0))
                }
              }}
              placeholder={`${grandTotal.toFixed(2)} (full)`}
              min={0}
            />

            {/* Change / Balance indicators */}
            {isOverpaid && (
              <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Change to return</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">₹{changeAmount.toFixed(2)}</span>
              </div>
            )}
            {isPartial && (
              <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Balance due later</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400">Partial payment - ₹{effectivePaid.toFixed(2)} received</span>
                </div>
                <span className="font-bold text-amber-700 dark:text-amber-300">₹{balanceDue.toFixed(2)}</span>
              </div>
            )}
            {isUnpaid && (
              <div className="flex justify-between items-center bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-destructive">Full amount due</span>
                  <span className="text-xs text-red-600 dark:text-red-400">No payment received</span>
                </div>
                <span className="font-bold text-destructive">₹{grandTotal.toFixed(2)}</span>
              </div>
            )}
            {!isOverpaid && !isPartial && !isUnpaid && (
              <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-2">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Full payment received</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">₹{grandTotal.toFixed(2)}</span>
              </div>
            )}
          </div>

          <Button
            className="w-full h-14 text-lg font-bold"
            size="lg"
            onClick={onCompleteSale}
            disabled={items.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              'Processing...'
            ) : isPartial ? (
              <><CreditCard className="mr-2 h-6 w-6" /> Save Partial Payment</>
            ) : isUnpaid ? (
              <><Building2 className="mr-2 h-6 w-6" /> Save (Unpaid / Credit)</>
            ) : (
              <><CreditCard className="mr-2 h-6 w-6" /> Save & Pay (Ctrl+S)</>
            )}
          </Button>

          <Button
            className="w-full h-12"
            variant="outline"
            disabled={items.length === 0 || isSubmitting || isPrinting}
            onClick={onPrint}
          >
            <Printer className="mr-2 h-5 w-5" /> {isPrinting ? 'Printing...' : 'Print Bill (F2)'}
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
