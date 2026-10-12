/**
 * Self-check for the /api/play guards — run with `npx tsx lib/play-guard.test.ts`.
 */
import assert from 'node:assert/strict'
import { MAX_BODY, clientIp, makeLimiter, readCapped, sameOrigin } from './play-guard'

const h = (o: Record<string, string>) => new Headers(o)

// clientIp: never trust the client-written first XFF entry
const vercel = { VERCEL: '1' }
const plain = {}
assert.equal(clientIp(h({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.9' }), vercel), '1.1.1.1')
assert.equal(clientIp(h({ 'x-real-ip': 'spoofed', 'x-forwarded-for': '2.2.2.2' }), plain), '2.2.2.2', 'x-real-ip ignored off Vercel')
assert.equal(clientIp(h({ 'x-forwarded-for': 'spoofed, 2.2.2.2' }), plain), '2.2.2.2')
assert.equal(clientIp(h({ 'x-forwarded-for': 'spoofed, 3.3.3.3, 10.0.0.1' }), { TRUSTED_PROXY_HOPS: '2' }), '3.3.3.3')
assert.equal(clientIp(h({}), plain), 'unknown')

// sameOrigin
assert.equal(sameOrigin(h({ origin: 'https://www.devskills.in', host: 'www.devskills.in' })), true)
assert.equal(sameOrigin(h({ origin: 'https://evil.example', host: 'www.devskills.in' })), false)
assert.equal(sameOrigin(h({ host: 'www.devskills.in' })), false, 'missing Origin is refused')
assert.equal(
  sameOrigin(h({ origin: 'https://www.devskills.in', 'x-forwarded-host': 'www.devskills.in, internal', host: 'x' })),
  true,
  'first x-forwarded-host entry is the public host',
)

// limiter: the 4th request inside the window is refused, a new window resets it
let t = 0
const limited = makeLimiter(3, 1000, () => t)
assert.deepEqual([1, 2, 3, 4].map(() => limited('a')), [false, false, false, true])
assert.equal(limited('b'), false, 'keys are independent')
t = 1001
assert.equal(limited('a'), false, 'window reset')

// readCapped: stops at the cap even without Content-Length
void (async () => {
  const big = new Request('http://x', { method: 'POST', body: 'a'.repeat(MAX_BODY + 1) })
  assert.equal(await readCapped(big, MAX_BODY), null)
  const small = new Request('http://x', { method: 'POST', body: '{"code":"x"}' })
  assert.equal(await readCapped(small, MAX_BODY), '{"code":"x"}')
  console.log('play-guard: all checks passed')
})()
