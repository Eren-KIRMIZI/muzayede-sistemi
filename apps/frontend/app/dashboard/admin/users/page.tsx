'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Search, ShieldCheck, ShieldOff, MoreHorizontal } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { adminApi, type AdminUser } from '@/lib/api/admin'
import { formatCurrency } from '@/lib/utils'

const roles = ['', 'USER', 'SELLER', 'MODERATOR', 'ADMIN']

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, role],
    queryFn: () => adminApi.getUsers(page, 20, search || undefined, role || undefined),
    staleTime: 15_000,
  })

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.banUser(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const unbanMutation = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.changeRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <DashboardShell title="Kullanıcı Yönetimi" subtitle="Platform kullanıcılarını görüntüleyin ve yönetin">
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-input/40 px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              placeholder="İsim veya e-posta ile ara..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground md:w-64"
            />
          </div>
          <button type="submit" className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90">
            Ara
          </button>
        </form>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1) }}
          className="rounded-xl border border-border bg-input/40 px-3 py-2 text-sm"
        >
          <option value="">Tüm Roller</option>
          {roles.filter(Boolean).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl glass">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Kullanıcı</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Müzayedeler</th>
              <th className="px-4 py-3 font-medium">Teklifler</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Katılım</th>
              <th className="px-4 py-3 font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-5 animate-pulse rounded bg-muted/30" />
                  </td>
                </tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Kullanıcı bulunamadı
                </td>
              </tr>
            ) : (
              data?.data?.map((user: AdminUser) => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => roleMutation.mutate({ id: user.id, role: e.target.value })}
                      className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs"
                    >
                      {roles.filter(Boolean).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 font-mono">{user._count.auctions}</td>
                  <td className="px-4 py-3 font-mono">{user._count.bids}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive ? 'bg-emerald/10 text-emerald' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {user.isActive ? 'Aktif' : 'Engellenmiş'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive ? (
                      <button
                        onClick={() => banMutation.mutate({ id: user.id, reason: 'Yönetici tarafından engellendi' })}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <ShieldOff className="size-3" /> Engelle
                      </button>
                    ) : (
                      <button
                        onClick={() => unbanMutation.mutate(user.id)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-emerald hover:bg-emerald/10"
                      >
                        <ShieldCheck className="size-3" /> Engeli kaldır
                      </button>
                    )}
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
