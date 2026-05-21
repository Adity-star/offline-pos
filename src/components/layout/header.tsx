'use client'

import { usePathname } from 'next/navigation'

const routeTitles: Record<string, string> = {
  '/billing': 'Billing Dashboard',
  '/sales': 'Sales History',
  '/products': 'Product Management',
  '/inventory': 'Inventory Management',
  '/customers': 'Customer Management',
  '/dashboard': 'Analytics Dashboard',
  '/settings': 'Settings',
  '/backup': 'Backup & Restore',
}

export function Header() {
  const pathname = usePathname()

  // Don't show header on billing page (it has its own header built-in)
  if (pathname === '/billing') return null

  const title = routeTitles[pathname] || ''

  if (!title) return null

  return null
}
