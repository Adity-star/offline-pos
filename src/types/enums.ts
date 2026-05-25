export const PaymentModes = {
  CASH: 'CASH',
  UPI: 'UPI',
  CARD: 'CARD',
  CREDIT: 'CREDIT',
} as const

export type PaymentMode =
  (typeof PaymentModes)[keyof typeof PaymentModes]

export const PaymentStatuses = {
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  UNPAID: 'UNPAID',
} as const

export type PaymentStatus =
  (typeof PaymentStatuses)[keyof typeof PaymentStatuses]

export const DiscountTypes = {
  FLAT: 'FLAT',
  PERCENTAGE: 'PERCENTAGE',
} as const

export type DiscountType =
  (typeof DiscountTypes)[keyof typeof DiscountTypes]

export const InventoryActionTypes = {
  SALE: 'SALE',
  RESTOCK: 'RESTOCK',
  RETURN: 'RETURN',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
} as const

export type InventoryActionType =
  (typeof InventoryActionTypes)[keyof typeof InventoryActionTypes]