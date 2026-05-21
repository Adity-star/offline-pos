'use client'

import { useState, useEffect } from 'react'
import { Plus, Upload, Search, Edit, Trash2, ArrowUpDown } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/shared/loading'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { ProductFormDialog } from '@/components/products/product-form-dialog'
import { ProductImportDialog } from '@/components/products/product-import-dialog'
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

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  
  // Filters & Pagination
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  
  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  
  // Delete Confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(debouncedSearch && { search: debouncedSearch }),
      })
      const res = await fetch(`/api/products?${query}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setProducts(data.products)
      setTotal(data.total)
    } catch (error) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [page, limit, debouncedSearch])

  const handleEdit = (product: any) => {
    setSelectedProduct(product)
    setIsFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/products/${deletingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete product')
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setIsDeleteOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      <PageHeader title="Product Management">
        <Button variant="outline" onClick={() => setIsImportOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
        <Button onClick={() => {
          setSelectedProduct(null)
          setIsFormOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Product Name or SKU..."
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
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Cost Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <PageLoading />
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <EmptyState
                    title="No products found"
                    description="Start by adding your first product or using the bulk upload."
                  />
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const margin = ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100
                const isLowStock = product.currentStock <= product.minStockAlert

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                    <TableCell>{product.category?.name || '-'}</TableCell>
                    <TableCell className="text-right">₹{Number(product.costPrice).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">₹{Number(product.sellingPrice).toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-medium ${isLowStock ? 'text-destructive' : 'text-emerald-600'}`}>
                      {product.currentStock}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {margin > 0 ? margin.toFixed(1) + '%' : '-'}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeletingId(product.id)
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

      <ProductFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        product={selectedProduct}
        onSuccess={fetchProducts}
      />
      
      <ProductImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={fetchProducts}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
