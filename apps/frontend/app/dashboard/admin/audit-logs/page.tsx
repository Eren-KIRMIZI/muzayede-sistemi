'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Search } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { adminApi, type AuditLog } from '@/lib/api/admin'

const actions = ['', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'BID', 'PAYMENT']

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', page, action],
    queryFn: () => adminApi.getAuditLogs(page, 50, action || undefined),
    staleTime: 15_000,
  })

  const actionColor: Record<string, string> = {
    CREATE: 'bg-emerald/10 text-emerald',
    READ: 'bg-muted text-muted-foreground',
    UPDATE: 'bg-amber/10 text-amber',
    DELETE: 'bg-destructive/10 text-destructive',
    LOGIN: 'bg-primary/10 text-primary',
    LOGOUT: 'bg-muted text-muted-foreground',
    BID: 'bg-bid/10 text-bid',
    PAYMENT: 'bg-emerald/10 text-emerald',
  }

  return (
    <DashboardShell title="Denetim Kayıtları" subtitle="Sistem aktivite denetim izi">
      <div className="flex items-center gap-3">
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1) }}
          className="rounded-xl border border-border bg-input/40 px-3 py-2 text-sm"
        >
          <option value="">Tüm İşlemler</option>
          {actions.filter(Boolean).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl glass">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">İşlem</th>
              <th className="px-4 py-3 font-medium">Kaynak</th>
              <th className="px-4 py-3 font-medium">Kaynak ID</th>
              <th className="px-4 py-3 font-medium">IP Adresi</th>
              <th className="px-4 py-3 font-medium">Zaman damgası</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-5 animate-pulse rounded bg-muted/30" />
                  </td>
                </tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-3 size-10 text-muted-foreground/50" />
                  Denetim kaydı bulunamadı
                </td>
              </tr>
            ) : (
              data?.data?.map((log: AuditLog) => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${actionColor[log.action] || ''}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{log.resource}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.resourceId ? log.resourceId.slice(0, 8) + '...' : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {log.ipAddress || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
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
            {data.total} kayıttan {((page - 1) * 50) + 1}-{Math.min(page * 50, data.total)} arası gösteriliyor
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
