'use client'

import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useBillingStore } from '@/store/billing.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function BillItemsTable() {
  const { items, removeItem, updateQuantity, updateSaleRate } = useBillingStore()

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
        <EmptyState
          title="Cart is empty"
          description="Search and select products to add them to the bill."
          icon={ShoppingCart}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 rounded-md border bg-card overflow-auto">
      <Table>
        <TableHeader className="bg-muted/50 sticky top-0">
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-center w-[160px]">Qty</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.productId} className="h-16">
              <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
              <TableCell>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">Max Stock: {item.maxStock}</div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end">
                  <span className="text-muted-foreground mr-1">₹</span>
                  <Input
                    type="number"
                    className="w-24 text-right h-8"
                    value={item.saleRate}
                    onChange={(e) => updateSaleRate(item.productId, Number(e.target.value))}
                    min={0}
                    step={0.01}
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    className="w-16 text-center h-8 font-medium"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                    min={1}
                    max={item.maxStock}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.maxStock}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-right font-bold text-lg">
                ₹{(item.saleRate * item.quantity).toFixed(2)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeItem(item.productId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
