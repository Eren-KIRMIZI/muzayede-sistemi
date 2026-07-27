'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Cpu, Car, Watch, Palette, Shirt, Home, Trophy, Gem, Star, Music, ArrowUpRight } from 'lucide-react'
import { auctionsApi } from '@/lib/api/auctions'

const iconMap: Record<string, typeof Watch> = {
  cpu: Cpu,
  car: Car,
  watch: Watch,
  palette: Palette,
  shirt: Shirt,
  home: Home,
  trophy: Trophy,
  gem: Gem,
  star: Star,
  music: Music,
}

export function Categories() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => auctionsApi.getCategories(),
    staleTime: 300_000,
  })

  const categories = data?.data || []

  return (
    <section id="categories" className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Göz atın</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Seçilmiş kategoriler
          </h2>
        </div>
        <Link href="/auctions" className="text-sm text-muted-foreground hover:text-foreground">
          Tüm kategorileri görüntüle →
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl glass p-5" />
            ))
          : categories.map((c) => {
              const Icon = iconMap[c.icon || ''] || Watch
              const count = c._count?.auctions || 0
              return (
                <Link
                  key={c.id}
                  href={`/auctions?category=${c.id}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl glass p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl neu">
                      <Icon className="size-5" style={{ color: c.accentColor || '#6366f1' }} />
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-8">
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {count.toLocaleString('tr-TR')} ürün
                    </p>
                  </div>
                </Link>
              )
            })}
      </div>
    </section>
  )
}
