import Link from 'next/link'
import { Watch, Footprints, Palette, Car, Camera, Music, ArrowUpRight } from 'lucide-react'
import { categories } from '@/lib/data'

const icons: Record<string, typeof Watch> = {
  Watches: Watch,
  Sneakers: Footprints,
  'Fine Art': Palette,
  Automobiles: Car,
  Cameras: Camera,
  Instruments: Music,
}

const accentClass: Record<string, string> = {
  brand: 'text-primary',
  bid: 'text-bid',
  blue: 'text-blue',
  emerald: 'text-emerald',
}

export function Categories() {
  return (
    <section id="categories" className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Browse</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Curated categories
          </h2>
        </div>
        <Link href="/auctions" className="text-sm text-muted-foreground hover:text-foreground">
          View all categories →
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {categories.map((c, i) => {
          const Icon = icons[c.name] ?? Watch
          const isWide = i === 0
          return (
            <Link
              key={c.name}
              href="/auctions"
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl glass p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 ${
                isWide ? 'col-span-2 lg:col-span-2' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl neu">
                  <Icon className={`size-5 ${accentClass[c.accent]}`} />
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <div className="mt-8">
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {c.count.toLocaleString()} items
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
