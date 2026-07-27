'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, Gavel, Trophy, CreditCard, Settings as SettingsIcon, Trash2 } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/skeleton'
import { notificationsApi } from '@/lib/api/notifications'
import type { Notification } from '@/lib/types'

const typeConfig: Record<string, { icon: typeof Gavel; color: string }> = {
  BID_PLACED: { icon: Gavel, color: 'text-primary' },
  OUTBID: { icon: Gavel, color: 'text-bid' },
  AUCTION_WON: { icon: Trophy, color: 'text-emerald' },
  AUCTION_ENDED: { icon: Gavel, color: 'text-muted-foreground' },
  PAYMENT: { icon: CreditCard, color: 'text-primary' },
  SYSTEM: { icon: SettingsIcon, color: 'text-muted-foreground' },
  PROMOTION: { icon: Bell, color: 'text-primary' },
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'az önce'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} dk önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} sa önce`
  const days = Math.floor(hours / 24)
  return `${days} gün önce`
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(1, 50),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const notifications: Notification[] = data?.data || []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <DashboardShell title="Bildirimler" subtitle="Teklifleriniz ve müzayedeleriniz hakkında güncel kalın">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount} okunmamış
        </p>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Check className="mr-1 size-3" /> Tümünü okundu işaretle
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Bildirim yok"
          description="Her şey yolunda! Aktivite olduğunda sizi bilgilendireceğiz."
        />
      ) : (
        <div className="mt-4 space-y-2">
          {notifications.map((n) => {
            const c = typeConfig[n.type] || typeConfig.SYSTEM
            const Icon = c.icon
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                  n.isRead ? 'border-border/60 bg-background/20' : 'border-primary/20 bg-primary/5'
                }`}
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <Icon className={`size-4 ${c.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${n.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatTimeAgo(n.createdAt)}</span>
                {!n.isRead && (
                  <button
                    onClick={() => markReadMutation.mutate(n.id)}
                    className="mt-1 size-2 shrink-0 rounded-full bg-primary transition-colors hover:bg-primary/70"
                    title="Okundu olarak işaretle"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
