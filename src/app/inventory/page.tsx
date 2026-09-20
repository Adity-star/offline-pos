'use client'

import { useState, useEffect } from 'react'
import { Search, AlertTriangle, ArrowRightLeft, Package, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { PageLoading } from '@/components/shared/loading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebounce } from '@/hooks/use-debounce'
import { StockAdjustmentDialog } from '@/components/inventory/stock-adjustment-dialog'
import { BulkStockEntryDialog } from '@/components/inventory/bulk-stock-entry-dialog'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  const [isBulkEntryOpen, setIsBulkEntryOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  // Statistics
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalStockValue: 0,
    recentMovements: 0
  })

  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      const res = await fetch(`/api/products?page=${page}&limit=20&search=${debouncedSearch}`)
      const data = await res.json()
      setProducts(data.products || [])
      setProductsTotal(data.total || 0)
      
      // Calculate statistics
      const lowStock = (data.products || []).filter((p: any) => p.currentStock <= p.minStockAlert).length
      const totalValue = (data.products || []).reduce((sum: number, p: any) => 
        sum + (Number(p.currentStock) * Number(p.costPrice)), 0)
      
      setStats(prev => ({
        ...prev,
        totalProducts: data.total || 0,
        lowStockCount: lowStock,
        totalStockValue: totalValue
      }))
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
      setStats(prev => ({ ...prev, recentMovements: data.total || 0 }))
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

  const lowStockProducts = products.filter(p => p.currentStock <= p.minStockAlert)

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <PageHeader 
        title="Inventory Management" 
        description="Monitor current stock levels, manage in/out entries, and track stock movements."
      />

      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">Low Stock Alert!</p>
                  <p className="text-sm text-destructive/80">
                    {lowStockProducts.length} product(s) are running low on stock (≤ {lowStockProducts[0]?.minStockAlert || 5} units)
                  </p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
              >
                View All Low Stock
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.totalProducts}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className={stats.lowStockCount > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${stats.lowStockCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              <span className={`text-2xl font-bold ${stats.lowStockCount > 0 ? "text-destructive" : ""}`}>
                {stats.lowStockCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-2xl font-bold">₹{stats.totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.recentMovements}</span>
            </div>
          </CardContent>
        </Card>
      </div>

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
          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-md flex-1">
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
            <Button onClick={() => setIsBulkEntryOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Bulk Stock Entry
            </Button>
          </div>

          <div className="rounded-md border bg-card flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Alert Threshold</TableHead>
                  <TableHead className="text-right">Cost Price</TableHead>
                  <TableHead className="text-right">Stock Value</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-24"><PageLoading /></TableCell></TableRow>
                ) : products.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center">No products found.</TableCell></TableRow>
                ) : (
                  products.map((product) => {
                    const isLow = product.currentStock <= product.minStockAlert
                    const stockValue = Number(product.currentStock) * Number(product.costPrice)
                    return (
                      <TableRow key={product.id} className={isLow ? "bg-destructive/5" : ""}>
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
                        <TableCell className="text-right text-muted-foreground">
                          ₹{Number(product.costPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
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

      <BulkStockEntryDialog
        open={isBulkEntryOpen}
        onOpenChange={setIsBulkEntryOpen}
        onSuccess={() => {
          fetchProducts()
          if (activeTab === 'logs') fetchLogs()
        }}
      />
    </div>
  )
}
