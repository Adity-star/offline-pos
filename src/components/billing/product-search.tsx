'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { useBillingStore } from '@/store/billing.store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function ProductSearch() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const addItem = useBillingStore((state) => state.addItem)

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      setIsOpen(false)
      return
    }

    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`)
        const data = await res.json()
        if (res.ok) {
          setResults(data)
          setIsOpen(true)
          setSelectedIndex(0)
        }
      } catch (error) {
        console.error('Failed to search products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [debouncedQuery])

  // Focus input on load
  useEffect(() => {
    const timeoutid = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timeoutid)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (product: any) => {
    if (product.currentStock <= 0) {
      toast.error('Out of stock!')
      return
    }
    
    addItem({
      productId: product.id,
      name: product.name,
      quantity: 1, // Store handles max stock check and incrementing
      saleRate: product.sellingPrice,
      buyRate: product.costPrice,
      maxStock: product.currentStock,
    })
    
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <Input
          ref={inputRef}
          type="text"
          className="pl-10 h-14 text-lg w-full bg-white dark:bg-slate-900 border-2 rounded-xl focus-visible:ring-primary shadow-sm"
          placeholder="Search by product name, SKU or barcode (F3 to focus)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-popover rounded-md border shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          <ul>
            {results.map((product, index) => {
              const isSelected = index === selectedIndex
              const isOutOfStock = product.currentStock <= 0

              return (
                <li
                  key={product.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 cursor-pointer border-b last:border-0",
                    isSelected ? "bg-accent/50" : "hover:bg-accent/30",
                    isOutOfStock && "opacity-60"
                  )}
                  onClick={() => handleSelect(product)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-primary">₹{product.sellingPrice}</span>
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full mt-1",
                      isOutOfStock ? "bg-destructive/10 text-destructive" : "bg-emerald-100 text-emerald-700"
                    )}>
                      Stock: {product.currentStock}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      
      {isOpen && query && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-popover rounded-md border shadow-lg p-4 text-center text-muted-foreground">
          No products found matching "{query}"
        </div>
      )}
    </div>
  )
}
