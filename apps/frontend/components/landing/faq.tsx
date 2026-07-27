'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { faqs } from '@/lib/data'

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="relative mx-auto max-w-3xl px-6 py-20">
      <div className="text-center">
        <p className="text-sm font-medium text-primary">SSS</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Sorular, yanıtlandı
        </h2>
      </div>

      <div className="mt-10 space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q} className="overflow-hidden rounded-2xl glass">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-medium text-foreground">{f.q}</span>
                <Plus
                  className={`size-5 shrink-0 text-primary transition-transform duration-300 ${
                    isOpen ? 'rotate-45' : ''
                  }`}
                />
              </button>
              <div
                className="grid transition-all duration-300 ease-out"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
