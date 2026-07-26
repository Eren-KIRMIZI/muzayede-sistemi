/**
 * Add seconds to a date
 */
export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000)
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return addSeconds(date, minutes * 60)
}

/**
 * Add hours to a date
 */
export function addHours(date: Date, hours: number): Date {
  return addMinutes(date, hours * 60)
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  return addHours(date, days * 24)
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now()
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now()
}

/**
 * Return human-readable time remaining (e.g., "2h 30m")
 */
export function timeRemaining(endsAt: Date): string {
  const ms = endsAt.getTime() - Date.now()
  if (ms <= 0) return 'Ended'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Format ISO date string to locale date
 */
export function formatDate(date: Date | string, locale = 'tr-TR'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
