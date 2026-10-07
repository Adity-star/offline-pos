'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Truck,
  Building2,
  Plus,
  Search,
  Banknote,
  Eye,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  RefreshCw,
} from 'lucide-react'
import { PurchaseFormDialog } from '@/components/purchases/purchase-form-dialog'
import { SupplierFormDialog } from '@/components/purchases/supplier-form-dialog'
import { SupplierPaymentDialog } from '@/components/purchases/supplier-payment-dialog'
import { PurchaseDetailDialog } from '@/components/purchases/purchase-detail-dialog'
import { toast } from 'sonner'

export default function PurchasesPage() {
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases')

  // Stats
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalPaid: 0,
    totalDue: 0,
    supplierCount: 0,
  })

  // Purchases list state
  const [purchases, setPurchases] = useState<any[]>([])
  const [purchaseSearch, setPurchaseSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true)

  // Suppliers list state
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [supplierSearch, setSupplierSearch] = useState('')
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true)

  // Dialog open states
  const [purchaseFormOpen, setPurchaseFormOpen] = useState(false)
  const [supplierFormOpen, setSupplierFormOpen] = useState(false)
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<any>(null)
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<any>(null)

  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedPurchaseForDetail, setSelectedPurchaseForDetail] = useState<any>(null)

  // Fetch Purchases
  const loadPurchases = useCallback(async () => {
    try {
      setIsLoadingPurchases(true)
      const q = purchaseSearch.trim()
      const status = statusFilter !== 'ALL' ? statusFilter : ''
      const res = await fetch(`/api/purchases?search=${encodeURIComponent(q)}&paymentStatus=${status}`)
      const data = await res.json()

      if (data.purchases) {
        setPurchases(data.purchases)
      }
      if (data.summary) {
        setStats((prev) => ({
          ...prev,
          totalPurchases: data.summary.totalPurchases,
          totalPaid: data.summary.totalPaid,
          totalDue: data.summary.totalDue,
        }))
      }
    } catch (err) {
      toast.error('Failed to load purchases')
    } finally {
      setIsLoadingPurchases(false)
    }
  }, [purchaseSearch, statusFilter])

  // Fetch Suppliers
  const loadSuppliers = useCallback(async () => {
    try {
      setIsLoadingSuppliers(true)
      const q = supplierSearch.trim()
      const res = await fetch(`/api/suppliers?search=${encodeURIComponent(q)}`)
      const data = await res.json()

      if (data.suppliers) {
        setSuppliers(data.suppliers)
        setStats((prev) => ({
          ...prev,
          supplierCount: data.total || data.suppliers.length,
        }))
      }
    } catch (err) {
      toast.error('Failed to load suppliers')
    } finally {
      setIsLoadingSuppliers(false)
    }
  }, [supplierSearch])

  useEffect(() => {
    loadPurchases()
    loadSuppliers()
  }, [loadPurchases, loadSuppliers])

  const handleRefresh = () => {
    loadPurchases()
    loadSuppliers()
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-7 w-7 text-primary" /> Purchases & Stock Acquisition
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Record inventory purchases from agencies/suppliers, track cash outflow and manage supplier balances.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedSupplierForEdit(null)
              setSupplierFormOpen(true)
            }}
          >
            <Building2 className="h-4 w-4 mr-1.5" /> Add Supplier
          </Button>
          <Button size="sm" onClick={() => setPurchaseFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Record Stock Purchase
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-50/70 dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium uppercase">Total Purchased Stock</div>
              <div className="text-2xl font-extrabold text-primary mt-1">₹{stats.totalPurchases.toFixed(2)}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium uppercase">Money Paid Out</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">₹{stats.totalPaid.toFixed(2)}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-700 dark:text-amber-400 font-medium uppercase">Supplier Dues Owed</div>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">₹{stats.totalDue.toFixed(2)}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 flex items-center justify-center">
              <TrendingDown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50/70 dark:bg-slate-900/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium uppercase">Active Suppliers</div>
              <div className="text-2xl font-extrabold text-foreground mt-1">{stats.supplierCount}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'purchases'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('purchases')}
        >
          <Truck className="h-4 w-4" /> Stock Purchase Vouchers
        </button>
        <button
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'suppliers'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('suppliers')}
        >
          <Building2 className="h-4 w-4" /> Registered Suppliers & Agencies
        </button>
      </div>

      {/* Tab 1: Purchases List */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Purchase #, Agency or Bill #..."
                value={purchaseSearch}
                onChange={(e) => setPurchaseSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground font-medium">Status:</span>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Fully Paid</option>
                <option value="PARTIAL">Partial Dues</option>
                <option value="UNPAID">Unpaid / Credit</option>
              </select>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden bg-background">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-xs font-semibold uppercase">
                <tr>
                  <th className="p-3">Purchase # / Date</th>
                  <th className="p-3">Supplier / Agency</th>
                  <th className="p-3">Bill #</th>
                  <th className="p-3 text-center">Items</th>
                  <th className="p-3 text-right">Grand Total</th>
                  <th className="p-3 text-right">Paid Out</th>
                  <th className="p-3 text-right">Due Owed</th>
                  <th className="p-3 text-center">Payment Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoadingPurchases ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Loading purchase records...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground italic">
                      No stock purchase records found. Click "Record Stock Purchase" to add stock.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="p-3 font-medium">
                        <div>{p.purchaseNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="p-3 font-semibold">{p.supplierName}</td>
                      <td className="p-3 text-muted-foreground font-mono text-xs">
                        {p.invoiceNumber || '—'}
                      </td>
                      <td className="p-3 text-center font-semibold">
                        {p.purchaseItems?.length || 0}
                      </td>
                      <td className="p-3 text-right font-extrabold">₹{p.grandTotal.toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold text-emerald-600">
                        ₹{p.paidAmount.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-semibold text-destructive">
                        {p.dueAmount > 0 ? `₹${p.dueAmount.toFixed(2)}` : '₹0.00'}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            p.paymentStatus === 'PAID'
                              ? 'default'
                              : p.paymentStatus === 'PARTIAL'
                              ? 'secondary'
                              : 'destructive'
                          }
                          className="text-xs"
                        >
                          {p.paymentStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPurchaseForDetail(p)
                            setDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Suppliers List */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Supplier Name, Mobile or GST..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button
              size="sm"
              onClick={() => {
                setSelectedSupplierForEdit(null)
                setSupplierFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add New Supplier
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden bg-background">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-xs font-semibold uppercase">
                <tr>
                  <th className="p-3">Supplier / Agency Name</th>
                  <th className="p-3">Mobile Contact</th>
                  <th className="p-3">GSTIN</th>
                  <th className="p-3 text-center">Purchases</th>
                  <th className="p-3 text-right">Pending Dues Owed (₹)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoadingSuppliers ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading suppliers...
                    </td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                      No registered suppliers found.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="p-3 font-semibold">
                        {s.name}
                        {s.address && (
                          <div className="text-xs text-muted-foreground font-normal">
                            {s.address}
                          </div>
                        )}
                      </td>
                      <td className="p-3">{s.mobile}</td>
                      <td className="p-3 font-mono text-xs">{s.gstNumber || '—'}</td>
                      <td className="p-3 text-center font-bold">
                        {s._count?.purchases ?? 0}
                      </td>
                      <td className="p-3 text-right font-extrabold text-destructive">
                        {s.pendingAmount > 0 ? (
                          <span>₹{s.pendingAmount.toFixed(2)}</span>
                        ) : (
                          <span className="text-emerald-600 font-normal">₹0.00 (Clear)</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {s.pendingAmount > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300"
                              onClick={() => {
                                setSelectedSupplierForPay(s)
                                setPaymentDialogOpen(true)
                              }}
                            >
                              <Banknote className="h-3.5 w-3.5 mr-1" /> Pay Dues
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={() => {
                              setSelectedSupplierForEdit(s)
                              setSupplierFormOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog Modals */}
      <PurchaseFormDialog
        open={purchaseFormOpen}
        onOpenChange={setPurchaseFormOpen}
        onSuccess={() => {
          loadPurchases()
          loadSuppliers()
        }}
      />

      <SupplierFormDialog
        open={supplierFormOpen}
        onOpenChange={setSupplierFormOpen}
        supplier={selectedSupplierForEdit}
        onSuccess={() => {
          loadSuppliers()
        }}
      />

      <SupplierPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        supplier={selectedSupplierForPay}
        onSuccess={() => {
          loadPurchases()
          loadSuppliers()
        }}
      />

      <PurchaseDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        purchase={selectedPurchaseForDetail}
      />
    </div>
  )
}
