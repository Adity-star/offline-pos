'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/shared/loading'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { CustomerFormDialog } from '@/components/customers/customer-form-dialog'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [page, setPage] = useState(1)
  const [limit] = useState(15)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(debouncedSearch && { search: debouncedSearch }),
      })
      const res = await fetch(`/api/customers?${query}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCustomers(data.customers)
      setTotal(data.total)
    } catch (error) {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [page, limit, debouncedSearch])

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/customers/${deletingId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete customer')
      toast.success('Customer deleted successfully')
      fetchCustomers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setIsDeleteOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <PageHeader title="Customer Management">
        <Button onClick={() => {
          setSelectedCustomer(null)
          setIsFormOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Name or Mobile No..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Pending Balance</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <PageLoading />
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <EmptyState
                    title="No customers found"
                    description="Start by adding your first customer."
                  />
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => {
                const pending = Number(customer.pendingAmount)
                return (
                  <TableRow key={customer.id} className="group">
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.mobile}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[200px]">
                      {customer.address || '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${pending > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                      {pending > 0 ? `₹${pending.toFixed(2)}` : 'Clear'}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-primary"
                          onClick={() => router.push(`/customers/${customer.id}`)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Ledger
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setIsFormOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeletingId(customer.id)
                            setIsDeleteOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
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

      <CustomerFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Customer"
        description="Are you sure? This cannot be undone. You cannot delete a customer that has existing bills."
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
