'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Radio,
  Gavel,
  Package,
  Bell,
  Wallet,
  CreditCard,
  Heart,
  BarChart3,
  ShieldCheck,
  Settings,
  Network,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/notifications'
import { useAuthStore } from '@/lib/stores/auth-store'

const nav = [
  { section: 'Overview', items: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/live', label: 'Live Auctions', icon: Radio },
    { href: '/dashboard/bids', label: 'My Bids', icon: Gavel },
    { href: '/dashboard/auctions', label: 'My Auctions', icon: Package },
  ]},
  { section: 'Account', items: [
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
    { href: '/dashboard/favorites', label: 'Favorites', icon: Heart },
    { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  ]},
  { section: 'System', items: [
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]},
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30_000,
  })

  const unreadCount = unreadData?.count || 0
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??'
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Guest'

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground glow-brand">
          <Gavel className="size-4" />
        </span>
        <span className="font-semibold tracking-tight">AuctionHub</span>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-2">
        {nav.map((group) => (
          <div key={group.section} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href
                const showBadge = item.label === 'Notifications' && unreadCount > 0
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-primary/15 text-foreground'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    }`}
                  >
                    <item.icon
                      className={`size-4 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-bid text-[10px] font-semibold text-background">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    {active && <span className="size-1.5 rounded-full bg-primary" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.role || 'User'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
