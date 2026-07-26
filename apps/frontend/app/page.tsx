'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Radio } from 'lucide-react'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/landing/hero'
import { Categories } from '@/components/landing/categories'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Pricing } from '@/components/landing/pricing'
import { Testimonials } from '@/components/landing/testimonials'
import { Faq } from '@/components/landing/faq'
import { AuctionCard } from '@/components/auction-card'
import { AuctionCardSkeleton } from '@/components/skeleton'
import { auctionsApi } from '@/lib/api/auctions'
import { stats } from '@/lib/data'

export default function HomePage() {
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['auctions', 'featured'],
    queryFn: () => auctionsApi.getFeatured(),
    staleTime: 60_000,
  })

  const { data: endingData, isLoading: endingLoading } = useQuery({
    queryKey: ['auctions', 'ending-soon'],
    queryFn: () => auctionsApi.getEndingSoon(),
    staleTime: 30_000,
  })

  const featured = featuredData?.data || []
  const live = endingData?.data || []
  const isLoading = featuredLoading || endingLoading

  return (
    <main className="relative min-h-screen">
      <SiteNav />
      <Hero />

      {/* Stats band */}
      <section className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl glass lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="p-6">
              <p className="font-mono text-2xl font-semibold text-foreground sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              <span className="mt-2 inline-block text-xs text-emerald">{s.delta}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured auctions */}
      <section className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">Handpicked</p>
            <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Featured auctions
            </h2>
          </div>
          <Link
            href="/auctions"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Browse all <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <AuctionCardSkeleton key={i} />)
            : featured.map((a) => <AuctionCard key={a.id} auction={a} />)}
        </div>
      </section>

      <Categories />

      {/* Live auctions */}
      <section className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bid/10 px-3 py-1.5 text-xs font-medium text-bid">
            <Radio className="size-3.5" /> Live now
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Bidding is heating up
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <AuctionCardSkeleton key={i} />)
            : live.map((a) => <AuctionCard key={a.id} auction={a} />)}
        </div>
      </section>

      <HowItWorks />
      <Pricing />
      <Testimonials />
      <Faq />
      <SiteFooter />
    </main>
  )
}
