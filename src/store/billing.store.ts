import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  name: string
  quantity: number
  saleRate: number
  buyRate: number
  maxStock: number
}

interface CustomerInfo {
  id?: string
  name: string
  mobile: string
}

interface BillingState {
  items: CartItem[]
  customer: CustomerInfo
  discountType: 'percentage' | 'amount'
  discountValue: number
  labourCost: number
  pendingAmount: number
  
  // Actions
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateSaleRate: (productId: string, saleRate: number) => void
  setDiscount: (type: 'percentage' | 'amount', value: number) => void
  setLabourCost: (cost: number) => void
  setCustomer: (customer: CustomerInfo, pendingBalance?: number) => void
  clearCart: () => void
  
  // Derived state getters
  getSubtotal: () => number
  getDiscountAmount: () => number
  getGrandTotal: () => number
  getTotalProfit: () => number
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      items: [],
      customer: { name: '', mobile: '' },
      discountType: 'percentage',
      discountValue: 0,
      labourCost: 0,
      pendingAmount: 0,

      addItem: (newItem) => set((state) => {
        const existing = state.items.find(i => i.productId === newItem.productId)
        if (existing) {
          if (existing.quantity >= newItem.maxStock) return state;
          return {
            items: state.items.map(i => 
              i.productId === newItem.productId 
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          }
        }
        const itemToAdd = {
          ...newItem,
          quantity: 1,
          saleRate: Number(newItem.saleRate),
          buyRate: Number(newItem.buyRate),
        }
        return { items: [...state.items, itemToAdd] }
      }),

      removeItem: (productId) => set((state) => ({
        items: state.items.filter(i => i.productId !== productId)
      })),

      updateQuantity: (productId, quantity) => set((state) => {
        if (quantity <= 0) return { items: state.items.filter(i => i.productId !== productId) }
        
        return {
          items: state.items.map(i => {
            if (i.productId === productId) {
              const safeQuantity = Math.min(quantity, i.maxStock)
              return { ...i, quantity: safeQuantity }
            }
            return i
          })
        }
      }),

      updateSaleRate: (productId, saleRate) => set((state) => ({
        items: state.items.map(i => 
          i.productId === productId ? { ...i, saleRate: Number(saleRate) } : i
        )
      })),

      setDiscount: (type, value) => set({ discountType: type, discountValue: value }),
      
      setLabourCost: (cost) => set({ labourCost: cost }),
      
      setCustomer: (customer, pendingBalance = 0) => set({ customer, pendingAmount: pendingBalance }),

      clearCart: () => set({
        items: [],
        customer: { name: '', mobile: '' },
        discountType: 'percentage',
        discountValue: 0,
        labourCost: 0,
        pendingAmount: 0
      }),

      getSubtotal: () => {
        const { items } = get()
        return items.reduce((sum, item) => {
          const saleRate = Number(item.saleRate) || 0
          const quantity = Number(item.quantity) || 0
          return sum + (saleRate * quantity)
        }, 0)
      },

      getDiscountAmount: () => {
        const { discountType, discountValue, getSubtotal } = get()
        const subtotal = getSubtotal()
        
        if (discountType === 'percentage') {
          return (subtotal * Number(discountValue)) / 100
        }
        return Number(discountValue) || 0
      },

      getGrandTotal: () => {
        const { getSubtotal, getDiscountAmount, labourCost } = get()
        return getSubtotal() - getDiscountAmount() + (Number(labourCost) || 0)
      },

      getTotalProfit: () => {
        const { items, getDiscountAmount } = get()
        const baseProfit = items.reduce((sum, item) => {
          const saleRate = Number(item.saleRate) || 0
          const buyRate = Number(item.buyRate) || 0
          const quantity = Number(item.quantity) || 0
          return sum + ((saleRate - buyRate) * quantity)
        }, 0)
        return baseProfit - getDiscountAmount()
      }
    }),
    {
      name: 'billing-cart-storage',
      partialize: (state) => ({
        items: state.items,
        customer: state.customer,
        discountType: state.discountType,
        discountValue: state.discountValue,
        labourCost: state.labourCost,
        pendingAmount: state.pendingAmount,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Billing store rehydrated from localStorage:', {
            itemsCount: state.items.length,
            items: state.items,
            subtotal: state.getSubtotal()
          })
        } else {
          console.error('Failed to rehydrate billing store')
        }
      },
    }
  )
)