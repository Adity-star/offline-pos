'use client'

import { useState, useEffect } from 'react'
import { Search, AlertTriangle, ArrowRightLeft } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { PageLoading } from '@/components/shared/loading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebounce } from '@/hooks/use-debounce'
import { StockAdjustmentDialog } from '@/components/inventory/stock-adjustment-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Overview State
  const [products, setProducts] = useState<any[]>([])
  const [productsTotal, setProductsTotal] = useState(0)
  const [productsLoading, setProductsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [page, setPage] = useState(1)
  
  // Logs State
  const [logs, setLogs] = useState<any[]>([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsPage, setLogsPage] = useState(1)

  // Dialog State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      const res = await fetch(`/api/products?page=${page}&limit=20&search=${debouncedSearch}`)
      const data = await res.json()
      setProducts(data.products || [])
      setProductsTotal(data.total || 0)
    } catch (error) {
      console.error('Failed to load products for inventory')
    } finally {
      setProductsLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      setLogsLoading(true)
      const res = await fetch(`/api/inventory/logs?page=${logsPage}&limit=30`)
      const data = await res.json()
      setLogs(data.logs || [])
      setLogsTotal(data.total || 0)
    } catch (error) {
      console.error('Failed to load inventory logs')
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchProducts()
    } else if (activeTab === 'logs') {
      fetchLogs()
    }
  }, [activeTab, page, debouncedSearch, logsPage])

  const handleAdjustClick = (product: any) => {
    setSelectedProduct({
      id: product.id,
      name: product.name,
      currentStock: product.currentStock
    })
    setIsAdjustOpen(true)
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <PageHeader 
        title="Inventory Management" 
        description="Monitor current stock levels and view adjustment history."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start border-b rounded-none pb-0 h-auto bg-transparent mb-6 space-x-6 px-0">
          <TabsTrigger 
            value="overview" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 pt-2"
          >
            Stock Overview
          </TabsTrigger>
          <TabsTrigger 
            value="logs"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 pt-2"
          >
            Inventory Logs History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 flex flex-col gap-4 mt-0 border-none p-0 outline-none">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by Name or SKU..."
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="rounded-md border bg-card flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Alert Threshold</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-24"><PageLoading /></TableCell></TableRow>
                ) : products.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">No products found.</TableCell></TableRow>
                ) : (
                  products.map((product) => {
                    const isLow = product.currentStock <= product.minStockAlert
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {isLow && <AlertTriangle className="h-4 w-4 text-destructive mr-2" />}
                            {product.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                        <TableCell className={`text-right font-bold ${isLow ? 'text-destructive' : 'text-emerald-600'}`}>
                          {product.currentStock} {product.unitType}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {product.minStockAlert}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleAdjustClick(product)}>
                            <ArrowRightLeft className="w-3 h-3 mr-1" /> Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-between items-center text-sm text-muted-foreground">
             <span>Showing {Math.min((page-1)*20 + 1, productsTotal)} to {Math.min(page*20, productsTotal)} of {productsTotal}</span>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p=>p-1)}>Prev</Button>
               <Button variant="outline" size="sm" disabled={page*20 >= productsTotal} onClick={() => setPage(p=>p+1)}>Next</Button>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="flex-1 flex flex-col gap-4 mt-0 border-none p-0 outline-none">
          <div className="rounded-md border bg-card flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead>Date / Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Action Type</TableHead>
                  <TableHead className="text-center">Previous</TableHead>
                  <TableHead className="text-center">Adjustment</TableHead>
                  <TableHead className="text-center">New Stock</TableHead>
                  <TableHead>Notes / Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-24"><PageLoading /></TableCell></TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48">
                      <EmptyState title="No logs found" description="Inventory adjustments and sales will appear here." />
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const diff = log.newStock - log.previousStock
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a')}
                        </TableCell>
                        <TableCell className="font-medium">{log.product?.name || 'Unknown Item'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase
                            ${log.actionType === 'SALE' ? 'bg-blue-100 text-blue-700' : 
                              log.actionType === 'MANUAL_ADD' ? 'bg-emerald-100 text-emerald-700' : 
                              log.actionType === 'MANUAL_REMOVE' ? 'bg-amber-100 text-amber-700' : 
                              'bg-purple-100 text-purple-700'}`}
                          >
                            {log.actionType.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">{log.previousStock}</TableCell>
                        <TableCell className={`text-center font-bold ${diff > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </TableCell>
                        <TableCell className="text-center font-bold">{log.newStock}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate" title={log.reason || '-'}>
                          {log.reason || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center text-sm text-muted-foreground">
             <span>Showing {Math.min((logsPage-1)*30 + 1, logsTotal)} to {Math.min(logsPage*30, logsTotal)} of {logsTotal}</span>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" disabled={logsPage === 1} onClick={() => setLogsPage(p=>p-1)}>Prev</Button>
               <Button variant="outline" size="sm" disabled={logsPage*30 >= logsTotal} onClick={() => setLogsPage(p=>p+1)}>Next</Button>
             </div>
          </div>
        </TabsContent>
      </Tabs>

      <StockAdjustmentDialog
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
        product={selectedProduct}
        onSuccess={() => {
          fetchProducts() // Refresh overview
          if (activeTab === 'logs') fetchLogs() // Pre-refresh logs if we are somehow looking at it
        }}
      />
    </div>
  )
}
