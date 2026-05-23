'use client'

import { Printer, UserPlus, CreditCard } from 'lucide-react'
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

export function BillingSummary({ onCompleteSale, onPrint, isSubmitting, isPrinting }: BillingSummaryProps) {
  const items = useBillingStore((state) => state.items)
  const discountType = useBillingStore((state) => state.discountType)
  const discountValue = useBillingStore((state) => state.discountValue)
  const labourCost = useBillingStore((state) => state.labourCost)
  const customer = useBillingStore((state) => state.customer)
  const pendingAmount = useBillingStore((state) => state.pendingAmount)
  const setDiscount = useBillingStore((state) => state.setDiscount)
  const setLabourCost = useBillingStore((state) => state.setLabourCost)
  
  const subtotal = items.reduce((sum, item) => sum + (item.saleRate * item.quantity), 0)
  const discountAmount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue
  const grandTotal = subtotal - discountAmount + labourCost


  return (
    <Card className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 border-l">
      <CardContent className="p-6 flex flex-col h-full gap-6">
        
        {/* Customer Section */}
        <div className="space-y-3">
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
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center text-lg">
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
              <span className="text-muted-foreground">Labour Cost</span>
              <span className="font-medium text-blue-600">+ ₹{labourCost.toFixed(2)}</span>
            </div>
            <Input
              type="number"
              className="h-8 text-right"
              value={labourCost || ''}
              onChange={(e) => setLabourCost(Number(e.target.value) || 0)}
              placeholder="0"
              min={0}
            />
          </div>
        </div>

        {/* Grand Total Section */}
        <div className="pt-4 border-t-2 border-dashed space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-slate-700 dark:text-slate-200">Grand Total</span>
            <span className="text-4xl font-extrabold text-primary">₹{grandTotal.toFixed(2)}</span>
          </div>

          <Button 
            className="w-full h-14 text-lg font-bold" 
            size="lg"
            onClick={onCompleteSale}
            disabled={items.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              'Processing...'
            ) : (
              <>
                <CreditCard className="mr-2 h-6 w-6" /> Save & Pay (Ctrl+S)
              </>
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
