'use client'

import { use } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BadgeCheck, Eye, Heart, Share2, ShieldCheck, Truck } from 'lucide-react'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { AuroraBackground } from '@/components/aurora-background'
import { BidPanel } from '@/components/auction/bid-panel'
import { AuctionCard } from '@/components/auction-card'
import { AuctionDetailSkeleton } from '@/components/skeleton'
import { auctionsApi } from '@/lib/api/auctions'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { AuctionDetail } from '@/lib/types'

function primaryImage(auction: AuctionDetail): string {
  const primary = auction.images?.find((img) => img.isPrimary)
  return primary?.url || auction.images?.[0]?.url || '/placeholder.svg'
}

function sellerName(seller: AuctionDetail['seller']): string {
  return `${seller.firstName} ${seller.lastName}`
}

export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <AuctionDetailContent paramsPromise={params} />
}

function AuctionDetailContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise)
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, error } = useQuery({
    queryKey: ['auction', id],
    queryFn: () => auctionsApi.getById(id),
  })

  const watchMutation = useMutation({
    mutationFn: () => auctionsApi.toggleWatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction', id] })
    },
  })

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <AuroraBackground />
        <SiteNav />
        <main className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
          <AuctionDetailSkeleton />
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (error || !data?.data) {
    return (
      <div className="relative min-h-screen">
        <AuroraBackground />
        <SiteNav />
        <main className="mx-auto max-w-7xl px-4 pt-28 pb-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold">Müzayede bulunamadı</h1>
          <p className="mt-2 text-muted-foreground">Aradığınız müzayede mevcut değil veya kaldırılmış.</p>
          <Link href="/auctions" className="mt-6 inline-block text-primary hover:underline">
            Müzayedelere dön
          </Link>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const auction: AuctionDetail = data.data
  const imageUrl = primaryImage(auction)

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <SiteNav />
      <main className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
        <Link
          href="/auctions"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Müzayedelere dön
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left: media + details */}
          <div className="lg:col-span-7">
            <div className="glass group relative overflow-hidden rounded-3xl">
              <div className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={imageUrl}
                  alt={auction.title}
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              </div>
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className="glass-strong inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
                  <BadgeCheck className="size-3.5 text-emerald" />
                  Doğrulanmış ürün
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {auction.images.slice(0, 3).map((img, i) => (
                <div
                  key={img.id}
                  className="glass relative aspect-square overflow-hidden rounded-2xl opacity-70 transition-opacity hover:opacity-100"
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="20vw" />
                </div>
              ))}
              {auction.images.length < 3 &&
                Array.from({ length: 3 - auction.images.length }).map((_, i) => (
                  <div key={`placeholder-${i}`} className="glass relative aspect-square overflow-hidden rounded-2xl opacity-30">
                    <Image src="/placeholder.svg" alt="" fill className="object-cover" sizes="20vw" />
                  </div>
                ))}
            </div>

            <div className="glass mt-6 rounded-3xl p-6">
              <h2 className="text-lg font-semibold">Ürün detayları</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {auction.description}
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: 'Durum', value: 'Mükemmel · Doğrulanmış' },
                  { label: 'Köken', value: 'Tek sahipli, belgeli' },
                  { label: 'Rezerv', value: 'Karşılandı' },
                  { label: 'Lot numarası', value: '#' + auction.id.slice(-4).toUpperCase() },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-border/60 bg-background/30 p-4">
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</dt>
                    <dd className="mt-1 text-sm font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, t: 'Alıcı koruması', d: 'Emanet destekli ödeme' },
                  { icon: Truck, t: 'Sigortalı kargo', d: 'Küresel, takip edilebilir teslimat' },
                  { icon: BadgeCheck, t: 'Orijinallik', d: 'Uzman tarafından doğrulanmış' },
                ].map((f) => (
                  <div key={f.t} className="flex items-start gap-3 rounded-2xl bg-muted/30 p-4">
                    <f.icon className="mt-0.5 size-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{f.t}</p>
                      <p className="text-xs text-muted-foreground">{f.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: bidding */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-primary">
                    {auction.category?.name}
                  </span>
                  <h1 className="mt-1 text-balance text-2xl font-semibold sm:text-3xl">{auction.title}</h1>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="size-4" />
                    {auction.watchers} izliyor · Satan: {sellerName(auction.seller)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    aria-label="Add to watchlist"
                    onClick={() => watchMutation.mutate()}
                    className="glass flex size-10 items-center justify-center rounded-xl transition-colors hover:text-bid"
                  >
                    <Heart className="size-4" />
                  </button>
                  <button
                    aria-label="Share"
                    className="glass flex size-10 items-center justify-center rounded-xl transition-colors hover:text-primary"
                  >
                    <Share2 className="size-4" />
                  </button>
                </div>
              </div>

              <BidPanel
                auctionId={auction.id}
                startBid={auction.startingPrice}
                currentBid={auction.currentPrice}
                endsAt={auction.endsAt}
                bidders={auction._count.bids}
              />
            </div>
          </div>
        </div>

        {/* Related */}
        <section className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-semibold sm:text-2xl">Daha fazla {auction.category?.name}</h2>
            <Link href="/auctions" className="text-sm text-primary hover:underline">
              Tümünü gör
            </Link>
          </div>
          <RelatedAuctions categoryId={auction.category?.id} currentId={auction.id} />
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function RelatedAuctions({ categoryId, currentId }: { categoryId: string; currentId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['auctions', 'related', categoryId, currentId],
    queryFn: () =>
      auctionsApi.list({
        categoryId,
        limit: 3,
        sort: 'newly_listed',
        status: 'ACTIVE',
      }),
    staleTime: 60_000,
  })

  const related = (data?.data || []).filter((a) => a.id !== currentId).slice(0, 3)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    )
  }

  if (related.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {related.map((a) => (
        <AuctionCard key={a.id} auction={a} />
      ))}
    </div>
  )
}
