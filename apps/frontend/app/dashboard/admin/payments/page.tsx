'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, Search, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { adminApi, type AdminPayment } from '@/lib/api/admin'
import { formatCurrency } from '@/lib/utils'

const statuses = ['', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments', page, status],
    queryFn: () => adminApi.getPayments(page, 20, status || undefined),
    staleTime: 15_000,
  })

  const statusColor: Record<string, string> = {
    COMPLETED: 'bg-emerald/10 text-emerald',
    PROCESSING: 'bg-amber/10 text-amber',
    PENDING: 'bg-muted text-muted-foreground',
    FAILED: 'bg-destructive/10 text-destructive',
    REFUNDED: 'bg-primary/10 text-primary',
  }

  return (
    <DashboardShell title="Ödeme Yönetimi" subtitle="Tüm platform ödemelerini görüntüle">
      <div className="flex items-center gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded-xl border border-border bg-input/40 px-3 py-2 text-sm"
        >
          <option value="">Tüm Durumlar</option>
          {statuses.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl glass">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Müzayede</th>
              <th className="px-4 py-3 font-medium">Alıcı</th>
              <th className="px-4 py-3 font-medium">Satıcı</th>
              <th className="px-4 py-3 font-medium">Tutar</th>
              <th className="px-4 py-3 font-medium">Komisyon</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Emanet</th>
              <th className="px-4 py-3 font-medium">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="px-4 py-3">
                    <div className="h-5 animate-pulse rounded bg-muted/30" />
                  </td>
                </tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Ödeme bulunamadı</td>
              </tr>
            ) : (
              data?.data?.map((payment: AdminPayment) => (
                <tr key={payment.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="truncate font-medium max-w-[200px]">{payment.auction.title}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {payment.buyer.firstName} {payment.buyer.lastName}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {payment.seller.firstName} {payment.seller.lastName}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm font-medium">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{formatCurrency(payment.fee)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[payment.status] || ''}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{payment.escrowStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.total} kayıttan {((page - 1) * 20) + 1}-{Math.min(page * 20, data.total)} arası gösteriliyor
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Önceki
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
