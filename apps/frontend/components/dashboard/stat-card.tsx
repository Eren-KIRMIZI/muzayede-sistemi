import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Sparkline } from '@/components/dashboard/charts'

export function StatCard({
  label,
  value,
  delta,
  up = true,
  icon: Icon,
  accent = 'oklch(0.62 0.22 295)',
  spark,
}: {
  label: string
  value: string
  delta: string
  up?: boolean
  icon: React.ComponentType<{ className?: string }>
  accent?: string
  spark: number[]
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl glass p-5 transition-all duration-300 hover:-translate-y-1">
      <div
        className="absolute -right-8 -top-8 size-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: accent }}
      />
      <div className="relative flex items-start justify-between">
        <span
          className="flex size-10 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in oklch, ${accent} 18%, transparent)`, color: accent }}
        >
          <Icon className="size-5" />
        </span>
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-medium ${
            up ? 'text-emerald' : 'text-bid'
          }`}
        >
          {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {delta}
        </span>
      </div>
      <p className="relative mt-4 font-mono text-2xl font-semibold tabular-nums">{value}</p>
      <p className="relative text-sm text-muted-foreground">{label}</p>
      <div className="relative mt-3">
        <Sparkline data={spark} color={accent} />
      </div>
    </div>
  )
}
