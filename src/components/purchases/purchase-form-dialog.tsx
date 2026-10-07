'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Search,
  Plus,
  Trash2,
  Truck,
  AlertCircle,
  Building2,
  PackagePlus,
  Receipt,
  Banknote,
} from 'lucide-react'
import { toast } from 'sonner'

interface ProductOption {
  id: string
  name: string
  sku: string
  costPrice: number
  sellingPrice: number
  currentStock: number
}

interface SupplierOption {
  id: string
  name: string
  mobile: string
}

interface PurchaseItemInput {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitCost: number
}

interface PurchaseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PurchaseFormDialog({
  open,
  onOpenChange,
  onSuccess,
}: PurchaseFormDialogProps) {
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [supplierName, setSupplierName] = useState<string>('')
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // Product Search state
  const [productQuery, setProductQuery] = useState('')
  const [productSearchResults, setProductSearchResults] = useState<ProductOption[]>([])
  const [items, setItems] = useState<PurchaseItemInput[]>([])

  // Financials
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [taxAmount, setTaxAmount] = useState<number>(0)
  const [paymentMode, setPaymentMode] = useState<string>('CASH')
  const [paidAmount, setPaidAmount] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load suppliers
  useEffect(() => {
    if (open) {
      fetch('/api/suppliers')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.suppliers)) {
            setSuppliers(data.suppliers)
          }
        })
        .catch((err) => console.error(err))
    }
  }, [open])

  // Search products
  useEffect(() => {
    if (!productQuery.trim()) {
      setProductSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(productQuery)}&limit=8`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.products)) {
            setProductSearchResults(data.products)
          }
        })
        .catch((err) => console.error(err))
    }, 250)

    return () => clearTimeout(timer)
  }, [productQuery])

  const addProductToItems = (p: ProductOption) => {
    const existing = items.find((i) => i.productId === p.id)
    if (existing) {
      setItems(
        items.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      )
    } else {
      setItems([
        ...items,
        {
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          quantity: 1,
          unitCost: Number(p.costPrice) || 0,
        },
      ])
    }
    setProductQuery('')
    setProductSearchResults([])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: 'quantity' | 'unitCost', val: number) => {
    setItems(
      items.map((item, i) => (i === index ? { ...item, [field]: Math.max(0, val) } : item))
    )
  }

  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitCost, 0)
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount)
  const effectivePaid = paidAmount === '' ? grandTotal : Number(paidAmount) || 0
  const balanceDue = Math.max(0, grandTotal - effectivePaid)

  const handleSupplierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value
    setSelectedSupplierId(sId)
    if (sId) {
      const s = suppliers.find((sup) => sup.id === sId)
      if (s) setSupplierName(s.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierName.trim()) {
      toast.error('Please enter or select a Supplier/Agency name')
      return
    }
    if (items.length === 0) {
      toast.error('Please add at least one product to purchase')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId || undefined,
          supplierName: supplierName.trim(),
          invoiceNumber: invoiceNumber.trim() || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
          })),
          discountAmount,
          taxAmount,
          paymentMode,
          paidAmount: effectivePaid,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record purchase')

      toast.success(`Purchase ${data.purchaseNumber} recorded! Stock updated automatically.`)
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error recording purchase')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedSupplierId('')
    setSupplierName('')
    setInvoiceNumber('')
    setNotes('')
    setItems([])
    setDiscountAmount(0)
    setTaxAmount(0)
    setPaymentMode('CASH')
    setPaidAmount('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-5xl sm:max-w-4xl md:max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl border">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b bg-slate-50 dark:bg-slate-900 shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Truck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span>Record Stock Purchase Order</span>
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form id="purchase-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Supplier Info */}
          <div className="bg-slate-50/70 dark:bg-slate-900/50 p-4 sm:p-5 rounded-xl border space-y-3.5">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              <span>1. Supplier & Invoice Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Select Registered Supplier</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1 focus-visible:ring-1 focus-visible:ring-primary"
                  value={selectedSupplierId}
                  onChange={handleSupplierSelect}
                >
                  <option value="">-- Select or Type Agency Name --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">
                  Supplier / Agency Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. ABC Wholesalers Pvt Ltd"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="mt-1 bg-background"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Supplier Bill / Invoice #</Label>
                <Input
                  placeholder="e.g. INV-98765"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="mt-1 bg-background"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Product Search & Item List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <PackagePlus className="h-4 w-4 text-primary" />
                <span>2. Items Purchased & Stock Intake</span>
              </div>
              <span className="text-xs text-muted-foreground">({items.length} items added)</span>
            </div>

            {/* Product Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by Name or SKU to add to purchase list..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="pl-9 h-10 bg-background"
              />

              {productSearchResults.length > 0 && (
                <div className="absolute top-full mt-1.5 w-full z-50 bg-popover border shadow-xl rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {productSearchResults.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-0 flex justify-between items-center text-sm transition-colors"
                      onClick={() => addProductToItems(p)}
                    >
                      <div>
                        <div className="font-semibold text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="font-bold text-primary">Cost: ₹{p.costPrice}</div>
                        <div className="text-muted-foreground">Stock: {p.currentStock}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Items Table Container (Responsive Scroll on Mobile) */}
            <div className="border rounded-xl overflow-hidden bg-background">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[580px]">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 border-b text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      <th className="p-3">Product Name & SKU</th>
                      <th className="p-3 text-center w-32">Qty Purchased</th>
                      <th className="p-3 text-right w-36">Unit Cost Price (₹)</th>
                      <th className="p-3 text-right w-36">Item Total (₹)</th>
                      <th className="p-3 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                          <div className="flex flex-col items-center gap-1">
                            <PackagePlus className="h-8 w-8 text-muted-foreground/50 mb-1" />
                            <span>No items added yet.</span>
                            <span className="text-xs">Type a product name or SKU in the search bar above to select stock.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={item.productId} className="hover:bg-muted/30">
                          <td className="p-3 font-medium">
                            <div className="font-semibold text-foreground">{item.productName}</div>
                            <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                          </td>
                          <td className="p-3 text-center">
                            <Input
                              type="number"
                              min={1}
                              className="h-8 w-24 text-center mx-auto"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-3 text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              className="h-8 w-28 text-right ml-auto"
                              value={item.unitCost}
                              onChange={(e) => updateItem(idx, 'unitCost', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-3 text-right font-extrabold text-foreground">
                            ₹{(item.quantity * item.unitCost).toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeItem(idx)}
                              title="Remove Item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 3: Payment & Calculations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Receipt className="h-4 w-4 text-primary" />
              <span>3. Payment Mode & Financial Summary</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Payment Input & Remarks */}
              <div className="space-y-3.5 bg-slate-50/70 dark:bg-slate-900/50 p-4 rounded-xl border">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Payment Method</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1 focus-visible:ring-1 focus-visible:ring-primary"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / Online Transfer</option>
                    <option value="CARD">Bank Card</option>
                    <option value="NET_BANKING">Net Banking / NEFT</option>
                    <option value="CREDIT">Supplier Credit (Pay Dues Later)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-muted-foreground">Amount Paid Out Now (₹)</Label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        className="text-[11px] text-primary hover:underline font-semibold"
                        onClick={() => setPaidAmount(String(grandTotal))}
                      >
                        Full Paid
                      </button>
                      <span className="text-muted-foreground text-[11px]">•</span>
                      <button
                        type="button"
                        className="text-[11px] text-muted-foreground hover:underline font-semibold"
                        onClick={() => setPaidAmount('0')}
                      >
                        Zero (Credit)
                      </button>
                    </div>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder={`Full Amount (₹${grandTotal.toFixed(2)})`}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="mt-1 bg-background font-bold"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Purchase Notes / Remarks</Label>
                  <Input
                    placeholder="e.g. Batch #4092, Transport Ref #881"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 bg-background"
                  />
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-900 text-xs leading-relaxed">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Saving this purchase will automatically restock inventory counts, update cost prices,
                    log cash outflow, and update supplier credit dues.
                  </span>
                </div>
              </div>

              {/* Right Column: Grand Total & Balances Summary */}
              <div className="bg-slate-900 text-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Subtotal ({items.length} items):</span>
                    <span className="font-semibold text-white">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span>Discount (₹):</span>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={discountAmount || ''}
                      onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                      className="h-7 w-28 text-right bg-slate-800 border-slate-700 text-white font-semibold"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span>Tax / Freight Charge (₹):</span>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={taxAmount || ''}
                      onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                      className="h-7 w-28 text-right bg-slate-800 border-slate-700 text-white font-semibold"
                      placeholder="0"
                    />
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                    <span className="text-base font-bold text-slate-200">Grand Total</span>
                    <span className="text-2xl font-extrabold text-amber-400">₹{grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">Amount Paid Out:</span>
                    <span className="font-bold text-emerald-400 text-sm">₹{effectivePaid.toFixed(2)}</span>
                  </div>

                  {balanceDue > 0 ? (
                    <div className="flex justify-between items-center text-xs text-amber-300 font-bold bg-amber-950/60 p-2.5 rounded-lg border border-amber-800/50">
                      <span>Balance Owed to Supplier:</span>
                      <span className="text-sm">₹{balanceDue.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-xs text-emerald-300 font-bold bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800/50">
                      <span>Status:</span>
                      <span>FULLY PAID</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Sticky Dialog Footer */}
        <div className="p-4 sm:p-5 border-t bg-slate-50 dark:bg-slate-900 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="submit"
            form="purchase-form"
            disabled={isSubmitting || items.length === 0}
            className="w-full sm:w-auto font-bold px-6"
          >
            {isSubmitting ? 'Recording Purchase...' : 'Save Purchase & Restock Inventory'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
