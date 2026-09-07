import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isConfigured, loadProgress, saveProgress, touchUser } from '@/lib/db'
import { mergeProgress } from '@/lib/merge'
import type { ProgressState } from '@/lib/types'

export const runtime = 'nodejs'
// progress is per-user and always fresh; never cache it at the edge
export const dynamic = 'force-dynamic'

/** GET — the signed-in user's stored progress, or null if they have none yet. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'not signed in' }, { status: 401 })
  if (!isConfigured()) return NextResponse.json({ error: 'sync not configured' }, { status: 503 })

  try {
    return NextResponse.json({ data: await loadProgress(session.user.id) })
  } catch (err) {
    console.error('progress GET failed', err)
    return NextResponse.json({ error: 'load failed' }, { status: 500 })
  }
}

/**
 * PUT — merge the client's state into whatever is stored and return the result.
 *
 * The client sends its full state rather than a diff, and the server merges
 * rather than overwrites. That means two devices that were both offline can
 * both push and neither loses work — last-write-wins would silently discard
 * whichever one synced first.
 */
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'not signed in' }, { status: 401 })
  if (!isConfigured()) return NextResponse.json({ error: 'sync not configured' }, { status: 503 })

  let incoming: ProgressState
  try {
    incoming = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  // validate at the trust boundary — this is user-supplied and goes straight to storage
  if (!incoming || typeof incoming !== 'object' || incoming.version !== 1) {
    return NextResponse.json({ error: 'unrecognised progress shape' }, { status: 400 })
  }
  const size = JSON.stringify(incoming).length
  if (size > 4_000_000) {
    return NextResponse.json({ error: 'progress too large' }, { status: 413 })
  }

  try {
    // keeps last_seen_at fresh for the admin activity numbers
    await touchUser(session.user.id, session.user.name ?? null, session.user.email ?? null, false)
    const stored = await loadProgress(session.user.id)
    const merged = stored ? mergeProgress(incoming, stored) : incoming
    await saveProgress(session.user.id, merged)
    return NextResponse.json({ data: merged })
  } catch (err) {
    console.error('progress PUT failed', err)
    return NextResponse.json({ error: 'save failed' }, { status: 500 })
  }
}
