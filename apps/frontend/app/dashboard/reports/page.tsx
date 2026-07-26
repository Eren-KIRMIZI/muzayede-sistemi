'use client'

import { BarChart3 } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { EmptyState } from '@/components/empty-state'

export default function ReportsPage() {
  return (
    <DashboardShell title="Reports" subtitle="Analytics and activity reports">
      <EmptyState
        icon={BarChart3}
        title="No reports yet"
        description="Reports will be generated as you participate in auctions."
      />
    </DashboardShell>
  )
}
