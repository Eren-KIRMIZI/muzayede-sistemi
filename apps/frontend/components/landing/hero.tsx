import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Search, Sparkles, TrendingUp } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AuroraBackground } from '@/components/aurora-background'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36">
      <AuroraBackground />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-rise">
          <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Mikroservis Tabanlı Çevrimiçi Müzayede Platformu
          </div>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Gerçek Zamanlı Çevrimiçi Müzayedeler{' '}
            <span className="text-gradient">Mikroservislerle Güçlendirilmiş</span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            40ms altı güncellemelerle dünyaya karşı canlı teklif verin. AuctionHub,
            milyonlarca eş zamanlı teklif veren için tasarlanmış esnek bir mikroservis çekirdeği üzerine kuruludur.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auctions"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'h-12 gap-2 px-6 text-sm bg-bid text-background hover:bg-bid/90',
              )}
            >
              Teklif Vermeye Başla <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/auctions"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'h-12 px-6 text-sm',
              )}
            >
              Müzayedeleri Keşfet
            </Link>
          </div>

          <div className="mt-8 flex max-w-lg items-center gap-2 rounded-2xl glass-strong p-2">
            <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Saat, sanat, ayakkabı, araç ara..."
              className="h-9 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button className={cn(buttonVariants({ size: 'default' }), 'h-9 shrink-0 px-4')}>
              Ara
            </button>
          </div>

          <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
            <div>
              <span className="font-mono text-lg font-semibold text-foreground">Gerçek zamanlı</span>
              <p className="text-xs">teklif güncellemeleri</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="font-mono text-lg font-semibold text-foreground">40ms altı</span>
              <p className="text-xs">gecikme</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <span className="font-mono text-lg font-semibold text-foreground">Emanet</span>
              <p className="text-xs">koruması</p>
            </div>
          </div>
        </div>

        <div className="relative animate-rise [animation-delay:120ms]">
          <div className="relative overflow-hidden rounded-[2rem] glass-strong p-2 glow-brand">
            <Image
              src="/images/hero-auction.png"
              alt="AuctionHub canlı müzayede platformu"
              width={720}
              height={720}
              priority
              className="h-full w-full rounded-[1.6rem] object-cover"
            />
          </div>

          {/* Floating live bid card */}
          <div className="animate-float-slow absolute -left-4 top-10 w-52 rounded-2xl glass-strong p-4 sm:-left-8">
            <div className="flex items-center gap-2 text-xs text-bid">
              <span className="relative flex size-2">
                <span className="animate-pulse-ring absolute inline-flex size-full rounded-full bg-bid" />
                <span className="relative inline-flex size-2 rounded-full bg-bid" />
              </span>
              Canlı teklif verildi
            </div>
            <p className="mt-2 text-sm font-medium">Vintage Rolex Submariner</p>
            <p className="font-mono text-xl font-semibold text-foreground">$12,400</p>
          </div>

          {/* Floating trending card */}
          <div className="animate-float-slower absolute -right-2 bottom-10 w-56 rounded-2xl glass-strong p-4 sm:-right-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Şu an popüler</span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald">
                <TrendingUp className="size-3.5" /> +21%
              </span>
            </div>
            <div className="mt-3 flex items-end gap-1">
              {[40, 62, 48, 78, 56, 90, 72].map((h, i) => (
                <span
                  key={i}
                  className="w-3 rounded-t bg-gradient-to-t from-primary/30 to-primary"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
