import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  ADMIN_MAX_AGE,
  adminConfigured,
  clearFailures,
  makeToken,
  recordFailure,
  throttle,
  verifyPassword,
} from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: 'admin is not configured' }, { status: 503 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const gate = throttle(ip)
  if (!gate.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(gate.retryAfter / 60)} minutes.` },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfter) } },
    )
  }

  let body: { username?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 })
  }
  const username = typeof body.username === 'string' ? body.username : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!verifyPassword(username, password)) {
    recordFailure(ip)
    // deliberately vague — never say which of the two was wrong
    return NextResponse.json({ error: 'Wrong username or password.' }, { status: 401 })
  }

  clearFailures(ip)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_MAX_AGE,
  })
  return res
}
