'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldAlert, Check, X, AlertTriangle } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { adminApi, type FraudEvent } from '@/lib/api/admin'

const statuses = ['', 'PENDING', 'REVIEWING', 'CONFIRMED', 'DISMISSED']

export default function AdminFraudPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'fraud', page, status],
    queryFn: () => adminApi.getFraudEvents(page, 20, status || undefined),
    staleTime: 15_000,
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note: string }) =>
      adminApi.resolveFraud(id, status, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'fraud'] }),
  })

  const severityColor: Record<string, string> = {
    LOW: 'bg-muted text-muted-foreground',
    MEDIUM: 'bg-amber/10 text-amber',
    HIGH: 'bg-orange-500/10 text-orange-500',
    CRITICAL: 'bg-destructive/10 text-destructive',
  }

  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber/10 text-amber',
    REVIEWING: 'bg-primary/10 text-primary',
    CONFIRMED: 'bg-destructive/10 text-destructive',
    DISMISSED: 'bg-muted text-muted-foreground',
  }

  return (
    <DashboardShell title="Dolandırıcılık İncelemesi" subtitle="İşaretlenen aktiviteleri inceleyin ve çözün">
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

      <div className="mt-4 space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/30" />
          ))
        ) : data?.data?.length === 0 ? (
          <div className="rounded-2xl glass p-8 text-center text-muted-foreground">
            <ShieldAlert className="mx-auto mb-3 size-10 text-muted-foreground/50" />
            Dolandırıcılık olayı bulunamadı
          </div>
        ) : (
          data?.data?.map((event: FraudEvent) => (
            <div key={event.id} className="rounded-2xl glass p-4">
              <div className="flex items-start gap-4">
                <div className={`flex size-10 items-center justify-center rounded-xl ${severityColor[event.severity] || ''}`}>
                  <AlertTriangle className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{event.eventType.replace(/_/g, ' ')}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${severityColor[event.severity] || ''}`}>
                      {event.severity}
                    </span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[event.status] || ''}`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Kullanıcı: {event.user.firstName} {event.user.lastName} ({event.user.email}) · Risk Puanı: {(event.riskScore * 100).toFixed(0)}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
                {event.status === 'PENDING' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => resolveMutation.mutate({ id: event.id, status: 'CONFIRMED', note: 'İnceleme sonrası dolandırıcılık onaylandı' })}
                      className="rounded-lg px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Check className="mr-1 inline size-3" /> Onayla
                    </button>
                    <button
                      onClick={() => resolveMutation.mutate({ id: event.id, status: 'DISMISSED', note: 'İnceleme sonrası yanlış pozitif' })}
                      className="rounded-lg px-2 py-1 text-xs text-emerald hover:bg-emerald/10"
                    >
                      <X className="mr-1 inline size-3" /> Reddet
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
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
