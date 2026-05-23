'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingCart,
  Clock,
  Package,
  Boxes,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/billing', icon: ShoppingCart, label: 'Billing' },
  { href: '/sales', icon: Clock, label: 'Sales History' },
  { href: '/products', icon: Package, label: 'Products' },
  { href: '/inventory', icon: Boxes, label: 'Inventory' },
  { href: '/customers', icon: Users, label: 'Customers' },
  { href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-[68px] flex-col items-center border-r border-sidebar-border bg-sidebar py-4">
      {/* Store Logo / Initials */}
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        SPM
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />

              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Logout */}
      <button
        title="Logout"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </aside>
  )
}
