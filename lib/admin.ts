import crypto from 'node:crypto'
import { cookies } from 'next/headers'

/**
 * Admin auth, deliberately separate from the Google sign-in used by learners.
 *
 * The password is never in the repo — only a scrypt hash lives in an env var,
 * so the public repository leaks nothing even though the app is open source.
 */

const COOKIE = 'sdgym_admin'
const MAX_AGE_SECONDS = 60 * 60 * 8

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH && process.env.AUTH_SECRET)
}

/** Constant-time comparison so a wrong password cannot be found by timing. */
function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function verifyPassword(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME
  const stored = process.env.ADMIN_PASSWORD_HASH
  if (!expectedUser || !stored) return false

  const [salt, hashHex] = stored.split(':')
  if (!salt || !hashHex) return false

  // compare the username in constant time too, so it cannot be enumerated
  const userOk = safeEqual(
    crypto.createHash('sha256').update(username).digest(),
    crypto.createHash('sha256').update(expectedUser).digest(),
  )

  let passOk = false
  try {
    passOk = safeEqual(Buffer.from(hashHex, 'hex'), crypto.scryptSync(password, salt, 64))
  } catch {
    passOk = false
  }
  // evaluate both before returning, so the answer does not leak which failed
  return userOk && passOk
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', process.env.AUTH_SECRET!).update(payload).digest('hex')
}

export function makeToken(): string {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000
  const payload = `admin.${expires}`
  return `${payload}.${sign(payload)}`
}

export function tokenValid(token: string | undefined): boolean {
  if (!token || !process.env.AUTH_SECRET) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [who, expires, mac] = parts
  if (who !== 'admin') return false
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false
  const expected = sign(`${who}.${expires}`)
  try {
    return safeEqual(Buffer.from(mac, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies()
  return tokenValid(store.get(COOKIE)?.value)
}

export const ADMIN_COOKIE = COOKIE
export const ADMIN_MAX_AGE = MAX_AGE_SECONDS

/* ---------- brute-force throttle ----------
   In-memory, so it resets on redeploy and is per-instance. That is a real
   ceiling, but it costs nothing and stops the obvious scripted attempt.
   ponytail: per-instance limiter, move to the database if this is ever a
   genuine target rather than a personal admin page. */

declare global {
  // eslint-disable-next-line no-var
  var _sdgymAdminAttempts: Map<string, { n: number; until: number }> | undefined
}

export function throttle(key: string): { allowed: boolean; retryAfter: number } {
  globalThis._sdgymAdminAttempts ??= new Map()
  const now = Date.now()
  const rec = globalThis._sdgymAdminAttempts.get(key)
  if (rec && rec.until > now && rec.n >= 5) {
    return { allowed: false, retryAfter: Math.ceil((rec.until - now) / 1000) }
  }
  return { allowed: true, retryAfter: 0 }
}

export function recordFailure(key: string): void {
  globalThis._sdgymAdminAttempts ??= new Map()
  const now = Date.now()
  const rec = globalThis._sdgymAdminAttempts.get(key)
  if (!rec || rec.until <= now) {
    globalThis._sdgymAdminAttempts.set(key, { n: 1, until: now + 15 * 60_000 })
  } else {
    rec.n += 1
  }
}

export function clearFailures(key: string): void {
  globalThis._sdgymAdminAttempts?.delete(key)
}
