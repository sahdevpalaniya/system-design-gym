/**
 * Guards for /api/play, the Go Playground proxy. go.dev throttles OUR server's
 * IP, not the abuser's, so one noisy client can break Run for every learner.
 * Kept apart from the route so they can be unit-tested (play-guard.test.ts).
 */

export const MAX_CODE = 64 * 1024
export const MAX_BODY = MAX_CODE + 1024
const WINDOW_MS = 60_000
const PER_WINDOW = 20

/**
 * The client IP, from what our own infrastructure set, never from what the
 * client sent. On Vercel the platform writes x-real-ip itself, so it is trusted
 * there and only there (anywhere else a client can send it). Off Vercel, the
 * trustworthy x-forwarded-for entry is the one our nearest proxy appended:
 * counting TRUSTED_PROXY_HOPS proxies in from the right (default 1). Everything
 * left of that was typed by the client, so keying on it lets a script rotate
 * its way past the limit.
 */
export function clientIp(h: Headers, env: Record<string, string | undefined> = process.env): string {
  if (env.VERCEL) {
    const real = h.get('x-real-ip')?.trim()
    if (real) return real
  }
  const hops = Math.max(1, Number(env.TRUSTED_PROXY_HOPS) || 1)
  const xff = h.get('x-forwarded-for')?.split(',').map((s) => s.trim()).filter(Boolean) ?? []
  return xff.at(-hops) ?? 'unknown'
}

/**
 * Same-origin only. This stops other websites from making visitors' browsers
 * call us (CSRF-style use of our quota). It does NOT stop scripts: curl can
 * send any Origin. The rate limit below is what bounds scripted use.
 */
export function sameOrigin(h: Headers): boolean {
  const origin = h.get('origin')
  if (!origin) return false
  // behind chained proxies x-forwarded-host can be "a, b"; the first is the public host
  const host = (h.get('x-forwarded-host') ?? h.get('host'))?.split(',')[0].trim()
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/**
 * A fixed-window limiter: PER_WINDOW requests per WINDOW_MS per key.
 *
 * ponytail: the window lives in this instance's memory, so a serverless deploy
 * with many instances is only limited per instance. Before heavy traffic, add a
 * platform rule (Vercel Firewall rate limit on /api/play) or a shared store.
 */
export function makeLimiter(perWindow = PER_WINDOW, windowMs = WINDOW_MS, now = () => Date.now()) {
  const hits = new Map<string, { start: number; count: number }>()
  return function limited(key: string): boolean {
    const t = now()
    const h = hits.get(key)
    if (!h || t - h.start > windowMs) {
      hits.set(key, { start: t, count: 1 })
      if (hits.size > 10_000) for (const [k, v] of hits) if (t - v.start > windowMs) hits.delete(k)
      return false
    }
    return ++h.count > perWindow
  }
}

/** The body as text, or null as soon as it exceeds `max` bytes. Content-Length
 *  can be absent (chunked) or lie, so the stream itself is counted. */
export async function readCapped(req: Request, max: number): Promise<string | null> {
  if (!req.body) return ''
  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}
