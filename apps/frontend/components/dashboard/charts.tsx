'use client'

import { useId } from 'react'

/* Smooth area chart with animated gradient fill */
export function AreaChart({
  data,
  height = 220,
  color = 'oklch(0.62 0.22 295)',
}: {
  data: number[]
  height?: number
  color?: string
}) {
  const id = useId()
  const width = 640
  const pad = 8
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = (width - pad * 2) / (data.length - 1)

  const points = data.map((d, i) => {
    const x = pad + i * stepX
    const y = pad + (1 - (d - min) / range) * (height - pad * 2)
    return [x, y] as const
  })

  // Catmull-Rom to bezier for smooth line
  const path = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p[0]},${p[1]}`
    const prev = arr[i - 1]
    const cx = (prev[0] + p[0]) / 2
    return `${acc} C ${cx},${prev[1]} ${cx},${p[1]} ${p[0]},${p[1]}`
  }, '')

  const area = `${path} L ${points[points.length - 1][0]},${height - pad} L ${points[0][0]},${height - pad} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={g}
          x1={pad}
          x2={width - pad}
          y1={pad + g * (height - pad * 2)}
          y2={pad + g * (height - pad * 2)}
          stroke="oklch(1 0 0 / 6%)"
          strokeWidth="1"
        />
      ))}
      <path d={area} fill={`url(#fill-${id})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 4px 12px ${color})` }}
      />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={color} opacity={i === points.length - 1 ? 1 : 0} />
      ))}
    </svg>
  )
}

/* Vertical bar chart with rounded caps */
export function BarChart({
  data,
  labels,
  height = 200,
}: {
  data: number[]
  labels?: string[]
  height?: number
}) {
  const max = Math.max(...data) || 1
  const labelH = labels ? 20 : 0
  const barArea = height - labelH
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-2" style={{ height }}>
          <div className="flex w-full items-end justify-center" style={{ height: barArea }}>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-primary/30 to-primary transition-all duration-500"
              style={{ height: Math.max(4, (d / max) * barArea) }}
            />
          </div>
          {labels && <span className="text-[10px] text-muted-foreground">{labels[i]}</span>}
        </div>
      ))}
    </div>
  )
}

/* Donut / radial gauge */
export function DonutChart({
  segments,
  size = 160,
}: {
  segments: { value: number; color: string; label: string }[]
  size?: number
}) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const r = size / 2 - 12
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(1 0 0 / 6%)" strokeWidth="12" />
        {segments.map((s, i) => {
          const len = (s.value / total) * c
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          )
          offset += len
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-semibold">{total}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</span>
      </div>
    </div>
  )
}

/* Tiny sparkline */
export function Sparkline({ data, color = 'oklch(0.72 0.16 165)' }: { data: number[]; color?: string }) {
  const w = 100
  const h = 32
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = w / (data.length - 1)
  const path = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${i * step},${h - ((d - min) / range) * h}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
