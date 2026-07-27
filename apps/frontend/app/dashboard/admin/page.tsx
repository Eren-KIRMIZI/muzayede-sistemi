'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Gavel,
  DollarSign,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Plus,
  Activity,
} from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { StatCard } from '@/components/dashboard/stat-card'
import { adminApi } from '@/lib/api/admin'
import { formatCurrency } from '@/lib/utils'

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard(),
    staleTime: 30_000,
  })

  return (
    <DashboardShell title="Yönetici Paneli" subtitle="Platform genelinde genel bakış ve yönetim">
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/30" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Toplam Kullanıcı"
              value={String(stats.users.total)}
              delta={`bugün +${stats.users.todayNew}`}
              icon={Users}
              accent="oklch(0.62 0.22 295)"
              spark={[stats.users.todayNew, stats.users.todayNew + 3, stats.users.total % 10, stats.users.todayNew + 5, stats.users.total % 7, stats.users.todayNew + 8, stats.users.total % 12]}
            />
            <StatCard
              label="Aktif Müzayedeler"
              value={String(stats.auctions.active)}
              delta={`bugün +${stats.auctions.todayNew}`}
              icon={Gavel}
              accent="oklch(0.72 0.16 165)"
              spark={[stats.auctions.active, stats.auctions.todayNew + 2, stats.auctions.active - 3, stats.auctions.todayNew + 7, stats.auctions.active + 1, stats.auctions.todayNew + 4, stats.auctions.active + 2]}
            />
            <StatCard
              label="Platform Geliri"
              value={formatCurrency(stats.payments.platformRevenue)}
              delta={`${stats.payments.total} ödeme`}
              icon={DollarSign}
              accent="oklch(0.72 0.19 55)"
              spark={[10, 14, 12, 18, 16, 22, 26]}
            />
            <StatCard
              label="Bekleyen Dolandırıcılık"
              value={String(stats.fraud.pending)}
              delta="incelenmeli"
              up={stats.fraud.pending === 0}
              icon={ShieldAlert}
              accent="oklch(0.65 0.17 245)"
              spark={[stats.fraud.pending, Math.max(0, stats.fraud.pending - 1), stats.fraud.pending + 2, Math.max(0, stats.fraud.pending - 2), stats.fraud.pending, stats.fraud.pending + 1, stats.fraud.pending]}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl glass p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <UserPlus className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Bugün Yeni Kullanıcılar</p>
                  <p className="font-mono text-2xl font-semibold">{stats.users.todayNew}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl glass p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald/15 text-emerald">
                  <Plus className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Bugün Yeni Müzayedeler</p>
                  <p className="font-mono text-2xl font-semibold">{stats.auctions.todayNew}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl glass p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-bid/15 text-bid">
                  <Activity className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Müzayede</p>
                  <p className="font-mono text-2xl font-semibold">{stats.auctions.total}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl glass p-5">
            <h2 className="font-semibold">Hızlı İşlemler</h2>
            <p className="text-sm text-muted-foreground">Yönetim bölümlerine git</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: '/dashboard/admin/users', label: 'Kullanıcıları Yönet', icon: Users, color: 'text-primary' },
                { href: '/dashboard/admin/auctions', label: 'Müzayedeleri Yönet', icon: Gavel, color: 'text-emerald' },
                { href: '/dashboard/admin/payments', label: 'Ödemeleri Görüntüle', icon: DollarSign, color: 'text-amber' },
                { href: '/dashboard/admin/fraud', label: 'Dolandırıcılık İncelemesi', icon: ShieldAlert, color: 'text-destructive' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-white/5"
                >
                  <item.icon className={`size-5 ${item.color}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                  <TrendingUp className="ml-auto size-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </DashboardShell>
  )
}
