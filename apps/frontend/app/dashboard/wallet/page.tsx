'use client'

import { Wallet as WalletIcon, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { Button } from '@/components/ui/button'

const mockTransactions = [
  { id: '1', type: 'deposit' as const, amount: 5000, date: '2025-01-15', status: 'completed' },
  { id: '2', type: 'bid_hold' as const, amount: -3850, date: '2025-01-18', status: 'pending' },
  { id: '3', type: 'withdrawal' as const, amount: -2000, date: '2025-01-20', status: 'completed' },
]

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(n))
}

export default function WalletPage() {
  return (
    <DashboardShell title="Wallet" subtitle="Manage your balance and transactions">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 text-center lg:col-span-1">
          <p className="text-sm text-muted-foreground">Available balance</p>
          <p className="mt-2 font-mono text-4xl font-semibold">$3,150</p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="flex-1"><Plus className="mr-1 size-3" /> Deposit</Button>
            <Button size="sm" variant="outline" className="flex-1">Withdraw</Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="mb-3 font-semibold">Recent transactions</h3>
          <div className="space-y-2">
            {mockTransactions.map((t) => (
              <div key={t.id} className="glass flex items-center gap-3 rounded-xl p-4">
                <div className={`flex size-9 items-center justify-center rounded-lg ${t.amount > 0 ? 'bg-emerald/10' : 'bg-destructive/10'}`}>
                  {t.amount > 0 ? <ArrowDownLeft className="size-4 text-emerald" /> : <ArrowUpRight className="size-4 text-destructive" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{t.type.replace('_', ' ')}</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
                <span className={`font-mono text-sm font-semibold ${t.amount > 0 ? 'text-emerald' : 'text-foreground'}`}>
                  {t.amount > 0 ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
