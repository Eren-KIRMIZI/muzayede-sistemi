import Image from 'next/image'
import Link from 'next/link'
import { Gavel, ShieldCheck, TrendingUp, Zap } from 'lucide-react'

export function AuthShell({
  children,
  eyebrow,
}: {
  children: React.ReactNode
  eyebrow: string
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Visual side */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="/images/auth-illustration.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/40 to-primary/30" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Gavel className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">AuctionHub</span>
          </Link>

          <div className="max-w-md">
            <p className="text-sm font-medium uppercase tracking-widest text-primary-foreground/80">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold leading-tight text-foreground">
              Nadir eşyalar gerçek değerini bulur.
            </h2>
            <div className="mt-8 space-y-4">
              {[
                { icon: Zap, t: 'Gerçek zamanlı teklif', d: '40ms altı websocket teklif akışı' },
                { icon: ShieldCheck, t: 'Emanet koruması', d: 'Her ödeme sigortalıdır' },
                { icon: TrendingUp, t: 'Kurumsal ölçek', d: '40.000+ eşzamanlı teklif veren' },
              ].map((f) => (
                <div key={f.t} className="flex items-center gap-3">
                  <span className="glass-strong flex size-10 items-center justify-center rounded-xl">
                    <f.icon className="size-5 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.t}</p>
                    <p className="text-xs text-muted-foreground">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Dünyanın dört bir yanındaki müzayede evleri tarafından güveniliyor
          </p>
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Gavel className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">AuctionHub</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}
