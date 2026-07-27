import Link from 'next/link'
import { Bell, Search, Plus, Home } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DashboardShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border glass-strong px-4 sm:px-6">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="size-4" />
          </Link>
          <div>
            <h1 className="text-base font-semibold leading-tight sm:text-lg">{title}</h1>
            {subtitle && <p className="hidden text-xs text-muted-foreground sm:block">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border border-border bg-input/40 px-3 py-2 md:flex">
              <Search className="size-4 text-muted-foreground" />
              <input
                placeholder="Müzayedelerde ara..."
                className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button className="relative flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground">
              <Bell className="size-4" />
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-bid" />
            </button>
            <Link
              href="/dashboard/auctions/new"
              className={cn(buttonVariants({ size: 'lg' }), 'h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90')}
            >
              <Plus className="size-4" /> <span className="hidden sm:inline">Yeni Müzayede</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
