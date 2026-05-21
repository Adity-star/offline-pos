'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/shared/loading'
import { EmptyState } from '@/components/shared/empty-state'
import { useDebounce } from '@/hooks/use-debounce'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [limit] = useState(15)

  const fetchSales = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== 'ALL' && { paymentStatus: statusFilter }),
      })
      const res = await fetch(`/api/sales?${query}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSales(data.sales)
      setTotal(data.total)
    } catch (error) {
      console.error('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [page, limit, debouncedSearch, statusFilter])

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <PageHeader title="Sales History" />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Invoice # or Customer..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(val) => {
          setStatusFilter(val)
          setPage(1)
        }}>
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <SelectValue placeholder="Filter Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Grand Total</TableHead>
              <TableHead className="text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <PageLoading />
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <EmptyState
                    title="No sales found"
                    description="No invoices match your current filters."
                  />
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow 
                  key={sale.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/sales/${sale.id}`)}
                >
                  <TableCell>{format(new Date(sale.createdAt), 'dd MMM yyyy, hh:mm a')}</TableCell>
                  <TableCell className="font-medium text-muted-foreground">{sale.invoiceNumber}</TableCell>
                  <TableCell>{sale.customerName}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold
                      ${sale.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                        sale.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 
                        'bg-destructive/10 text-destructive'}`}
                    >
                      {sale.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">₹{Number(sale.grandTotal).toFixed(2)}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="sm" className="h-8">
                      <FileText className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page * limit >= total || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
