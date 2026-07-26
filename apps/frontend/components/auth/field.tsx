import { cn } from '@/lib/utils'

export function Field({
  label,
  id,
  type = 'text',
  placeholder,
  autoComplete,
  icon: Icon,
  trailing,
  value,
  onChange,
  required,
}: {
  label: string
  id: string
  type?: string
  placeholder?: string
  autoComplete?: string
  icon?: React.ComponentType<{ className?: string }>
  trailing?: React.ReactNode
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
          className={cn(
            'h-11 w-full rounded-xl border border-input bg-background/40 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-3 focus:ring-ring/40',
            Icon && 'pl-9',
            trailing && 'pr-10',
          )}
        />
        {trailing && <div className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
    </div>
  )
}
