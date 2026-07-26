'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter, Search, SlidersHorizontal } from 'lucide-react'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { AuctionCard } from '@/components/auction-card'
import { AuroraBackground } from '@/components/aurora-background'
import { AuctionCardSkeleton } from '@/components/skeleton'
import { auctionsApi } from '@/lib/api/auctions'
import type { Auction, AuctionCategory, SortOption } from '@/lib/types'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newly_listed', label: 'Newest' },
  { value: 'ending_soon', label: 'Ending soon' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'most_bids', label: 'Most bids' },
  { value: 'most_watched', label: 'Most watched' },
]

export default function AuctionsPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sort, setSort] = useState<SortOption>('newly_listed')
  const [page, setPage] = useState(1)
  const limit = 18

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => auctionsApi.getCategories(),
    staleTime: 5 * 60_000,
  })

  const categories: AuctionCategory[] = categoriesData?.data || []

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['auctions', { search, categoryId: selectedCategory, sort, page, limit }],
    queryFn: () =>
      auctionsApi.list({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        sort,
        page,
        limit,
        status: 'ACTIVE',
      }),
    placeholderData: (prev) => prev,
  })

  const auctions: Auction[] = data?.data || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 0

  return (
    <main className="relative min-h-screen">
      <SiteNav />

      <section className="relative overflow-hidden pt-28 pb-10">
        <AuroraBackground />
        <div className="relative mx-auto max-w-7xl px-6">
          <p className="text-sm font-medium text-primary">Marketplace</p>
          <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Explore live &amp; upcoming auctions
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {total} active lots across {categories.length} categories, updated in real time.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-2xl glass-strong px-4 py-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                placeholder="Search lots, sellers, categories…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortOption)
                  setPage(1)
                }}
                className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-input/40 px-4 py-3 text-sm text-foreground appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setSelectedCategory('')
                setPage(1)
              }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === ''
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-white/[0.03] text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id === selectedCategory ? '' : c.id)
                  setPage(1)
                }}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'border border-border bg-white/[0.03] text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.name}
                {c._count && (
                  <span className="ml-1 text-xs opacity-60">({c._count.auctions})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 pb-24">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <AuctionCardSkeleton key={i} />
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/20 px-6 py-20 text-center">
            <Search className="size-10 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No auctions found</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {auctions.map((a) => (
                <AuctionCard key={a.id} auction={a} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-border bg-input/40 px-4 py-2 text-sm text-foreground disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-4 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-border bg-input/40 px-4 py-2 text-sm text-foreground disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <SiteFooter />
    </main>
  )
}
