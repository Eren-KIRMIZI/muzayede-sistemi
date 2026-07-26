import { UserPlus, Gavel, Radio, Trophy } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    title: 'Create your account',
    desc: 'Register in seconds and top up your wallet. Verification is handled by the User Service.',
    accent: 'text-primary',
  },
  {
    icon: Gavel,
    title: 'Place or automate bids',
    desc: 'Bid manually or set a ceiling and let auto-bidding keep you in the lead.',
    accent: 'text-blue',
  },
  {
    icon: Radio,
    title: 'Watch it live',
    desc: 'A persistent websocket streams every competing bid to you in under 40ms.',
    accent: 'text-bid',
  },
  {
    icon: Trophy,
    title: 'Win & settle securely',
    desc: 'Winning triggers the Payment Service with escrow protection until delivery.',
    accent: 'text-emerald',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">How it works</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          From sign-up to settlement in four steps
        </h2>
      </div>

      <div className="relative mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="relative overflow-hidden rounded-2xl glass p-6"
          >
            <span className="absolute right-4 top-3 font-mono text-5xl font-semibold text-white/5">
              0{i + 1}
            </span>
            <span className="flex size-12 items-center justify-center rounded-xl neu">
              <s.icon className={`size-5 ${s.accent}`} />
            </span>
            <h3 className="mt-5 font-semibold text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
