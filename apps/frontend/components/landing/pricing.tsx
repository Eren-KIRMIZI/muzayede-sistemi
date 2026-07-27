import Link from 'next/link'
import { Check } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Teklif Veren',
    price: 'Ücretsiz',
    tag: 'Koleksiyoncular için',
    features: ['Sınırsız teklif verme', 'Gerçek zamanlı teklif akışı', 'İzleme listesi ve uyarılar', 'Cüzdan ve emanet'],
    cta: 'Teklif vermeye başla',
    featured: false,
  },
  {
    name: 'Satıcı Pro',
    price: '$29',
    period: '/ay',
    tag: 'Güçlü satıcılar için',
    features: [
      'Teklif Veren\'deki her şey',
      'Sınırsız müzayede listeleme',
      'Gelişmiş analitik paneli',
      'Otomatik teklif içgörüleri',
      'Öncelikli yerleşim',
    ],
    cta: 'Pro\'ya yükselt',
    featured: true,
  },
  {
    name: 'Kurumsal',
    price: 'Özel',
    tag: 'Müzayede evleri için',
    features: [
      'Özel kiracı ve SSO',
      'Mikroservis gözlemlenebilirliği',
      'SLA destekli %99.99 çalışma süresi',
      'Özel marka',
      'Kafka olay dışa aktarımı',
    ],
    cta: 'Satış ekibiyle iletişime geçin',
    featured: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">Fiyatlandırma</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Sizinle birlikte ölçeklenen planlar
        </h2>
      </div>

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-3xl p-7 ${
              p.featured
                ? 'glass-strong glow-brand lg:-translate-y-4'
                : 'glass'
            }`}
          >
            {p.featured && (
              <span className="absolute right-6 top-6 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                En popüler
              </span>
            )}
            <p className="text-sm text-muted-foreground">{p.tag}</p>
            <h3 className="mt-1 text-lg font-semibold">{p.name}</h3>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
              {p.period && <span className="mb-1 text-sm text-muted-foreground">{p.period}</span>}
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: 'lg', variant: p.featured ? 'default' : 'outline' }),
                'mt-7 h-11',
                p.featured && 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
