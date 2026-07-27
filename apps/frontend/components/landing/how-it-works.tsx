import { UserPlus, Gavel, Radio, Trophy } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    title: 'Hesabınızı oluşturun',
    desc: 'Saniyeler içinde kayıt olun ve cüzdanınızı doldurun. Doğrulama Kullanıcı Hizmeti tarafından yürütülür.',
    accent: 'text-primary',
  },
  {
    icon: Gavel,
    title: 'Teklif verin veya otomatikleştirin',
    desc: 'Manuel teklif verin veya bir tavan belirleyin ve otomatik teklifin sizi önde tutmasına izin verin.',
    accent: 'text-blue',
  },
  {
    icon: Radio,
    title: 'Canlı izleyin',
    desc: 'Kalıcı bir websocket her rakip teklifini 40ms altında size aktarır.',
    accent: 'text-bid',
  },
  {
    icon: Trophy,
    title: 'Kazanın ve güvenle yerleşin',
    desc: 'Kazanma, teslimat_onayına kadar emanet korumasıyla Ödeme Hizmeti\'ni tetikler.',
    accent: 'text-emerald',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">Nasıl Çalışır</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Kayıttan yerleşime dört adımda
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
