'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useBillingStore } from '@/store/billing.store'

import { ProductSearch } from '@/components/billing/product-search'
import { BillItemsTable } from '@/components/billing/bill-items-table'
import { BillingSummary } from '@/components/billing/billing-summary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

export default function BillingPage() {
  const router = useRouter()
  const { 
    clearCart, 
    setCustomer, 
    items, 
    customer, 
    discountValue, 
    discountType, 
    labourCost,
    getGrandTotal,
    getDiscountAmount,
    getTotalProfit
  } = useBillingStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const debouncedCustomerSearch = useDebounce(customerSearch, 300)
  const [customerResults, setCustomerResults] = useState<any[]>([])

  // Load Component Mount Reset
  useEffect(() => {
    clearCart()
  }, [])

  // Customer Search Logic
  useEffect(() => {
    if (!debouncedCustomerSearch) {
      setCustomerResults([])
      return
    }

    fetch(`/api/customers/search?q=${encodeURIComponent(debouncedCustomerSearch)}&limit=5`)
      .then(res => res.json())
      .then(data => setCustomerResults(data))
      .catch(() => console.error('Failed to search customers'))
  }, [debouncedCustomerSearch])

  const selectCustomer = (c: any) => {
    setCustomer({
      id: c.id,
      name: c.name,
      mobile: c.mobile
    }, Number(c.pendingAmount))
    setCustomerSearch('')
    setCustomerResults([])
  }

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault()
        // Focus is handled in product-search component using its ref
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleCompleteSale()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items.length])

  const handleCompleteSale = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty. Add products to bill.')
      return
    }

    try {
      setIsSubmitting(true)
      
      const payload = {
        customerId: customer.id, // optional
        customerName: customer.name || 'Walk-in Customer',
        customerMobile: customer.mobile || null,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          saleRate: i.saleRate,
          buyRate: i.buyRate
        })),
        discountType,
        discountValue,
        discountAmount: getDiscountAmount(),
        labourCost,
        grandTotal: getGrandTotal(),
        totalProfit: getTotalProfit(),
        // Default to Fully Paid for now - we can add a payment modal later
        paymentStatus: 'PAID',
        paidAmount: getGrandTotal()
      }

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete sale')
      }

      toast.success('Sale completed successfully!')
      clearCart()
      
      // TODO: Automatically trigger print if setting enabled
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error processing sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full max-h-screen overflow-hidden">
      {/* Left Column: POS Entry */}
      <div className="flex-[7] flex flex-col p-4 gap-4 overflow-hidden h-full"> 
        
        {/* Top Tools: Customer & Product Search */}
        <div className="flex gap-4 items-start">
          <div className="flex-[3]">
            <ProductSearch />
          </div>
          <div className="flex-[2] relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Find Customer (Mobile/Name)..." 
                className="pl-9 bg-white"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
            {/* Customer Search Dropdown */}
            {customerResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full z-50 bg-popover border shadow-md rounded-md overflow-hidden">
                {customerResults.map(c => (
                  <div 
                    key={c.id} 
                    className="p-3 hover:bg-accent cursor-pointer border-b last:border-0"
                    onClick={() => selectCustomer(c)}
                  >
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.mobile}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Customer Tags (If manual entry) */}
        {!customer.id && (
           <div className="flex gap-2 items-center text-sm px-2">
             <span className="text-muted-foreground">Walk-in:</span>
             <Input 
                placeholder="Name" 
                className="h-8 w-40" 
                value={customer.name}
                onChange={e => setCustomer({...customer, name: e.target.value})}
              />
             <Input 
                placeholder="Mobile" 
                className="h-8 w-32"
                value={customer.mobile}
                onChange={e => setCustomer({...customer, mobile: e.target.value})}
              />
           </div>
        )}

        {/* Bill Items Table */}
        <BillItemsTable />
      </div>

      {/* Right Column: Checkout Summary */}
      <div className="flex-[3] max-w-sm shrink-0 h-full overflow-y-auto">
        <BillingSummary 
          onCompleteSale={handleCompleteSale} 
          isSubmitting={isSubmitting} 
        />
      </div>
    </div>
  )
}
