'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Package, Clock, CheckCircle, XCircle, RotateCcw, ChevronRight } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/skeleton'
import { paymentsApi, type Payment } from '@/lib/api/payments'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth-store'

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  COMPLETED: { icon: CheckCircle, color: 'text-emerald', bg: 'bg-emerald/10', label: 'Completed' },
  PROCESSING: { icon: Clock, color: 'text-primary', bg: 'bg-primary/10', label: 'Processing' },
  PENDING: { icon: Package, color: 'text-muted-foreground', bg: 'bg-muted/50', label: 'Pending' },
  FAILED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
  REFUNDED: { icon: RotateCcw, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Refunded' },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => paymentsApi.list(1, 50),
  })

  const payments: Payment[] = data?.data || []

  return (
    <DashboardShell title="Orders" subtitle="Track your auction purchases and payments">
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you win an auction, your order will appear here."
          action={
            <Link href="/auctions" className="text-sm text-primary hover:underline">
              Browse auctions
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const s = statusConfig[payment.status] || statusConfig.PENDING
            const img = payment.auction?.images?.[0]?.url || '/placeholder.svg'
            const isBuyer = payment.buyerId === user?.id
            return (
              <div
                key={payment.id}
                className="glass flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-muted/30"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{payment.auction?.title || 'Auction'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isBuyer ? 'Purchase' : 'Sale'} · {formatDate(payment.createdAt)}
                  </p>
                  {payment.escrowStatus === 'HELD' && (
                    <p className="mt-0.5 text-[10px] text-yellow-500">Funds in escrow</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-muted-foreground">Fee: {formatCurrency(payment.fee)}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.color}`}>
                  <s.icon className="size-3" /> {s.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
