export function AuroraBackground({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 grid-lines opacity-60" />
      <div className="animate-float-slow absolute -left-32 -top-24 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,oklch(0.62_0.22_295/0.28),transparent_65%)] blur-2xl" />
      <div className="animate-float-slower absolute -right-24 top-32 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,oklch(0.65_0.17_245/0.22),transparent_65%)] blur-2xl" />
      <div className="animate-float-slow absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,oklch(0.72_0.16_165/0.16),transparent_65%)] blur-2xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </div>
  )
}
