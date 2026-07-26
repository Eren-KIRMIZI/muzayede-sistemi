import * as crypto from 'crypto'

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

/**
 * Hash a value with SHA-256
 */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Compare a plain value against a hash (constant-time)
 */
export function safeCompare(plain: string, hash: string): boolean {
  const plainHash = sha256(plain)
  if (plainHash.length !== hash.length) return false
  return crypto.timingSafeEqual(Buffer.from(plainHash), Buffer.from(hash))
}

/**
 * Generate a UUID v4
 */
export function generateUuid(): string {
  return crypto.randomUUID()
}
