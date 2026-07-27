import { Quote } from 'lucide-react'
import { testimonials } from '@/lib/data'

export function Testimonials() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">Profesyonellerin tercihi</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Koleksiyoncular ve müzayede evleri tarafından güvenilen
        </h2>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <figure
            key={t.name}
            className={`flex flex-col rounded-3xl glass p-7 ${i === 1 ? 'md:-translate-y-4 glow-brand' : ''}`}
          >
            <Quote className="size-6 text-primary/60" />
            <blockquote className="mt-4 flex-1 text-pretty text-sm leading-relaxed text-foreground/90">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full neu text-sm font-semibold text-foreground">
                {t.name.split(' ').map((n) => n[0]).join('')}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
