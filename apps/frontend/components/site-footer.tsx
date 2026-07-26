import Link from 'next/link'
import { Gavel } from 'lucide-react'

const groups = [
  {
    title: 'Platform',
    links: ['Live Auctions', 'Categories', 'How it Works', 'Pricing', 'API'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Press', 'Blog', 'Contact'],
  },
  {
    title: 'Resources',
    links: ['Help Center', 'Bidding Guide', 'Trust & Safety', 'Status', 'Changelog'],
  },
]

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Gavel className="size-4" />
              </span>
              <span className="text-base font-semibold tracking-tight">AuctionHub</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A microservices-based online auction platform for real-time bidding at global scale.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-emerald/10 px-3 py-1.5 text-xs text-emerald">
              <span className="size-1.5 rounded-full bg-emerald" />
              All systems operational
            </div>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-sm font-semibold text-foreground">{g.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} AuctionHub. Built on microservices.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
