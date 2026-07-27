'use client'

import Link from 'next/link'
import { Camera, Mail, MapPin, Settings, Shield, User } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/lib/api/users'
import { formatCurrency } from '@/lib/utils'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)

  const { data: stats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: usersApi.getMyStats,
    staleTime: 60_000,
  })

  return (
    <DashboardShell title="Profil" subtitle="Hesap bilgilerinizi yönetin">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar + basic info */}
        <div className="glass rounded-2xl p-6 text-center lg:col-span-1">
          <div className="relative mx-auto size-24 overflow-hidden rounded-full bg-muted">
            {user?.avatar ? (
              <img src={user.avatarUrl || user.avatar} alt={`${user.firstName} ${user.lastName}`} className="size-full object-cover" />
            ) : (
              <User className="size-10 text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            )}
            <button className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-background/80 py-1.5 text-xs backdrop-blur hover:bg-background/90">
              <Camera className="mr-1 size-3" /> Değiştir
            </button>
          </div>
          <h2 className="mt-4 text-lg font-semibold">{user?.firstName ? `${user.firstName} ${user.lastName}` : 'Kullanıcı'}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="size-3 text-emerald" />
            {user?.verified ? 'Doğrulanmış hesap' : 'Doğrulanmamış'}
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="mr-1 size-3" /> Ayarlar
              </Button>
            </Link>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold">Kişisel Bilgiler</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Ad Soyad</label>
                <p className="mt-1 text-sm font-medium">{user?.firstName ? `${user.firstName} ${user.lastName}` : '—'}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">E-posta</label>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                  <Mail className="size-3.5 text-muted-foreground" /> {user?.email || '—'}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Konum</label>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="size-3.5 text-muted-foreground" /> Belirtilmemiş
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Üyelik tarihi</label>
                <p className="mt-1 text-sm font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold">Aktivite Özeti</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Kazanılan müzayedeler', value: stats?.wonAuctions ?? 0 },
                { label: 'Toplam harcama', value: stats?.totalSpent ?? 0, currency: true },
                { label: 'Aktif teklifler', value: stats?.activeBids ?? 0 },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border/60 bg-background/30 p-4 text-center">
                  <p className="font-mono text-2xl font-semibold">
                    {s.currency ? formatCurrency(s.value as number) : s.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
