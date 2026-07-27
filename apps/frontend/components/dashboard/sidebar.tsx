'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Radio,
  Gavel,
  Package,
  Bell,
  Wallet,
  Heart,
  BarChart3,
  Shield,
  Users,
  DollarSign,
  AlertTriangle,
  FileText,
  Settings,
  Home,
  LogOut,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/notifications'
import { useAuthStore } from '@/lib/stores/auth-store'
import { clearTokens } from '@/lib/api-client'

const userNav = [
  { section: 'Genel Bakış', items: [
    { href: '/dashboard', label: 'Kontrol Paneli', icon: LayoutDashboard },
    { href: '/dashboard/live', label: 'Canlı Müzayedeler', icon: Radio },
    { href: '/dashboard/bids', label: 'Tekliflerim', icon: Gavel },
    { href: '/dashboard/auctions', label: 'Müzayedelerim', icon: Package },
  ]},
  { section: 'Hesap', items: [
    { href: '/dashboard/notifications', label: 'Bildirimler', icon: Bell },
    { href: '/dashboard/wallet', label: 'Cüzdan', icon: Wallet },
    { href: '/dashboard/favorites', label: 'Favoriler', icon: Heart },
    { href: '/dashboard/reports', label: 'Raporlar', icon: BarChart3 },
  ]},
]

const adminNav = [
  { section: 'Yönetici', items: [
    { href: '/dashboard/admin', label: 'Yönetici Paneli', icon: Shield },
    { href: '/dashboard/admin/users', label: 'Kullanıcılar', icon: Users },
    { href: '/dashboard/admin/auctions', label: 'Müzayedeler', icon: Gavel },
    { href: '/dashboard/admin/payments', label: 'Ödemeler', icon: DollarSign },
    { href: '/dashboard/admin/fraud', label: 'Dolandırıcılık İncelemesi', icon: AlertTriangle },
    { href: '/dashboard/admin/audit-logs', label: 'Denetim Kayıtları', icon: FileText },
  ]},
]

const systemNav = [
  { section: 'Sistem', items: [
    { href: '/dashboard/settings', label: 'Ayarlar', icon: Settings },
  ]},
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin'

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30_000,
  })

  const navGroups = isAdmin ? [...userNav, ...adminNav, ...systemNav] : [...userNav, ...systemNav]
  const unreadCount = unreadData?.count || 0
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??'
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Misafir'

  const handleLogout = () => {
    clearTokens()
    logout()
    window.location.href = '/'
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground glow-brand">
          <Gavel className="size-4" />
        </span>
        <span className="font-semibold tracking-tight">AuctionHub</span>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => (
          <div key={group.section} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.section}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)
                const showBadge = item.label === 'Bildirimler' && unreadCount > 0
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
            <p className="truncate text-xs text-muted-foreground">{user?.role || 'Kullanıcı'}</p>
          </div>
        </div>
        <div className="mt-2 space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <Home className="size-4" />
            <span>Ana Sayfa</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
