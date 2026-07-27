'use client'

import { useQuery } from '@tanstack/react-query'
import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft, Lock } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { Button } from '@/components/ui/button'
import { usersApi, type WalletTransaction } from '@/lib/api/users'
import { formatCurrency } from '@/lib/utils'

export default function WalletPage() {
  const { data: wallet, isLoading } = useQuery({
    queryKey: ['users', 'me', 'wallet'],
    queryFn: () => usersApi.getMyWallet(),
    staleTime: 15_000,
  })

  return (
    <DashboardShell title="Cüzdan" subtitle="Bakiyenizi ve işlemlerinizi yönetin">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 text-center lg:col-span-1">
          <p className="text-sm text-muted-foreground">Kullanılabilir bakiye</p>
          {isLoading ? (
            <div className="mx-auto mt-2 h-10 w-32 animate-pulse rounded bg-muted/30" />
          ) : (
            <p className="mt-2 font-mono text-4xl font-semibold">
              {formatCurrency(wallet?.availableBalance || 0)}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="flex-1"><Plus className="mr-1 size-3" /> Yatır</Button>
            <Button size="sm" variant="outline" className="flex-1">Çek</Button>
          </div>

          <div className="mt-6 space-y-3 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Toplam Harcama</span>
              <span className="font-mono font-medium">{formatCurrency(wallet?.totalSpent || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Emanette Tutulan</span>
              <span className="font-mono font-medium text-amber">{formatCurrency(wallet?.heldInEscrow || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Kullanılabilir</span>
              <span className="font-mono font-medium text-emerald">{formatCurrency(wallet?.availableBalance || 0)}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="mb-3 font-semibold">Son işlemler</h3>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/30" />
              ))}
            </div>
          ) : wallet?.transactions && wallet.transactions.length > 0 ? (
            <div className="space-y-2">
              {wallet.transactions.map((t: WalletTransaction) => (
                <div key={t.id} className="glass flex items-center gap-3 rounded-xl p-4">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${t.escrowStatus === 'HELD' ? 'bg-amber/10' : 'bg-emerald/10'}`}>
                    {t.escrowStatus === 'HELD' ? (
                      <Lock className="size-4 text-amber" />
                    ) : (
                      <ArrowDownLeft className="size-4 text-emerald" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t.auction.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.method} · {new Date(t.createdAt).toLocaleDateString('tr-TR')} · Emanet: {t.escrowStatus}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-sm font-semibold ${
                      t.escrowStatus === 'HELD' ? 'text-amber' : 'text-emerald'
                    }`}>
                      -{formatCurrency(t.amount)}
                    </span>
                    <p className="text-[10px] text-muted-foreground">{t.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground">
              <WalletIcon className="mx-auto mb-3 size-10 text-muted-foreground/50" />
              <p>Henüz işlem yok</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
