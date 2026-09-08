import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COMPILE = 'https://go.dev/_/compile'
const SHARE = 'https://go.dev/_/share'
const MAX_CODE = 64 * 1024

/*
 * Proxies the official Go Playground. It has to be server-side: the playground
 * does not send CORS headers, so a browser cannot call it directly.
 *
 * ponytail: no rate limiting beyond the size cap. Add a per-IP limiter if this
 * is ever exposed somewhere busy — the playground will throttle us first.
 */

interface PlayEvent {
  Message: string
  Kind: 'stdout' | 'stderr'
  Delay: number
}

export async function POST(req: Request) {
  let body: { code?: string; action?: 'run' | 'share' }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const code = body.code ?? ''
  if (!code.trim()) return NextResponse.json({ error: 'no code' }, { status: 400 })
  if (code.length > MAX_CODE) return NextResponse.json({ error: 'code too long' }, { status: 413 })

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 20_000)

  try {
    if (body.action === 'share') {
      const res = await fetch(SHARE, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: code,
        signal: ctrl.signal,
      })
      if (!res.ok) return NextResponse.json({ error: 'playground unavailable' }, { status: 502 })
      const id = (await res.text()).trim()
      return NextResponse.json({ url: `https://go.dev/play/p/${id}` })
    }

    const form = new URLSearchParams({ version: '2', body: code, withVet: 'true' })
    const res = await fetch(COMPILE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: ctrl.signal,
    })
    if (!res.ok) return NextResponse.json({ error: 'playground unavailable' }, { status: 502 })

    const data = (await res.json()) as {
      Errors?: string
      Events?: PlayEvent[] | null
      VetErrors?: string
    }

    return NextResponse.json({
      errors: data.Errors ?? '',
      vet: data.VetErrors ?? '',
      // flatten the timed event stream into plain text; the delays are a
      // playground animation we do not need
      output: (data.Events ?? []).map((e) => e.Message).join(''),
      stderr: (data.Events ?? []).some((e) => e.Kind === 'stderr'),
    })
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return NextResponse.json(
      { error: aborted ? 'the program took too long' : 'could not reach the playground' },
      { status: aborted ? 504 : 502 },
    )
  } finally {
    clearTimeout(timer)
  }
}
