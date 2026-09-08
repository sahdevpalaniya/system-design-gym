'use client'

import { useSession } from 'next-auth/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { mergeProgress } from './merge'
import {
  AXES,
  type ArchetypeId,
  type Axis,
  type FollowUpCategory,
  type GapEntry,
  type MockRun,
  type NodeState,
  type ProgressState,
  type Scores,
  type StageId,
} from './types'

const KEY = 'sdgym.v1'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

function emptyState(): ProgressState {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    theme: 'system',
    archetype: null,
    streak: { days: [] },
    concepts: {},
    read: {},
    problems: {},
    followUps: [],
    gaps: [],
    scores: [],
    mocks: [],
    blank: [],
  }
}

/* ---------- spaced repetition ---------- */

/** days until a concept comes back, by how the user rated themselves */
const INTERVALS: Record<1 | 2 | 3 | 4, number> = { 1: 1, 2: 3, 3: 7, 4: 21 }

function nextDue(rating: 1 | 2 | 3 | 4, reps: number): string {
  const base = INTERVALS[rating]
  // a concept you keep getting right stretches out; one you keep missing does not
  const stretch = rating >= 3 ? Math.min(3, 1 + reps * 0.4) : 1
  const days = Math.max(1, Math.round(base * stretch))
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/* ---------- gap tagging ---------- */

/** keywords that map a free-text gap line onto something fixable */
const GAP_TAGS: [string, RegExp][] = [
  ['idempotency', /idempoten|duplicate|retri|exactly.?once|double.?charg/i],
  ['failure branches', /failure|edge case|happy path|what if|nobody accept|declin/i],
  ['numbers', /estimat|maths|math|number|back.?of.?envelope|per second|qps|calcula/i],
  ['naming costs', /cost|tradeoff|trade.?off|price|what it costs|downside/i],
  ['caching', /cache|cach|stale|ttl|invalidat|stampede|hit rate/i],
  ['hot keys / skew', /hot key|hot partition|celebrit|skew|hot spot|hotspot/i],
  ['consistency', /consisten|replica|lag|stale read|read.?your|race/i],
  ['partitioning', /shard|partition|resharding|shard key/i],
  ['queues', /queue|backlog|backpressure|dead letter|dlq|consumer/i],
  ['scope / requirements', /requirement|assumption|scope|ask.*question|clarif/i],
  ['justifying components', /justif|why.*box|unnecessary|component nobody/i],
  ['operations', /deploy|monitor|alert|on.?call|debug|rollback|observab/i],
  ['slack', /slack|latency budget|sync|async|how long/i],
  ['lifecycle', /lifecycle|state machine|actors|who touches/i],
  ['rate limiting', /rate limit|throttl|token bucket|429/i],
  ['fan-out', /fan.?out|fanout|timeline|inbox|push.*pull/i],
]

export function tagGap(text: string): string[] {
  const tags = GAP_TAGS.filter(([, re]) => re.test(text)).map(([t]) => t)
  return tags.length ? tags.slice(0, 3) : ['unfiled']
}

/* ---------- context ---------- */

export type SyncState = 'off' | 'syncing' | 'synced' | 'error'

interface Ctx {
  state: ProgressState
  ready: boolean
  /** 'off' when signed out — progress is then local to this browser only */
  sync: SyncState
  signedIn: boolean
  user: { name?: string | null; image?: string | null } | null
  setTheme: (t: ProgressState['theme']) => void
  setArchetype: (a: ArchetypeId | null) => void
  saveStage: (
    problemSlug: string,
    stageId: StageId,
    answer: string,
    checked: number[],
    total: number,
    axis: Axis,
    label: string,
  ) => void
  completeProblem: (slug: string) => void
  saveConcept: (slug: string, rating: 1 | 2 | 3 | 4, answer?: string) => void
  /** mark a lesson/topic page read, or un-mark it */
  setRead: (id: string, read: boolean) => void
  saveFollowUp: (
    id: string,
    category: FollowUpCategory,
    answer: string,
    rating: 1 | 2 | 3,
  ) => void
  addGap: (text: string, source: string) => void
  addMock: (run: Omit<MockRun, 'id' | 'at'>) => void
  saveBlank: (title: string, stages: Record<string, string>, diagram?: string) => void
  deleteBlank: (savedAt: string) => void
  clearAll: () => void
  exportJson: () => void
}

const ProgressCtx = createContext<Ctx | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(emptyState)
  const [ready, setReady] = useState(false)
  const [sync, setSync] = useState<SyncState>('off')
  const session = useSession()
  const signedIn = session.status === 'authenticated'
  const pulled = useRef(false)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPushed = useRef<string>('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ProgressState
        if (parsed && parsed.version === 1) setState({ ...emptyState(), ...parsed })
      }
    } catch {
      /* corrupt or unavailable storage — start fresh rather than crash */
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* quota or private mode — progress is best-effort, never block the UI */
    }
  }, [state, ready])

  /* ---------- account sync ----------
     Signed out, nothing here runs and progress stays in localStorage exactly as
     before. Signed in, the account becomes the durable copy and localStorage is
     a fast local mirror. */

  // one-time pull on sign-in: fold whatever is on this device into the account
  useEffect(() => {
    if (!ready || !signedIn || pulled.current) return
    pulled.current = true
    setSync('syncing')
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/progress', { cache: 'no-store' })
        if (!res.ok) throw new Error(`pull failed: ${res.status}`)
        const { data } = (await res.json()) as { data: ProgressState | null }
        if (cancelled) return
        // merge before pushing, so signing in on a browser with anonymous
        // progress adds to the account rather than replacing or being replaced
        setState((local) => (data ? mergeProgress(local, data) : local))
        setSync('synced')
      } catch (err) {
        console.error(err)
        if (!cancelled) setSync('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready, signedIn])

  // reset when the user signs out, so a different account starts clean
  useEffect(() => {
    if (session.status === 'unauthenticated') {
      pulled.current = false
      lastPushed.current = ''
      setSync('off')
    }
  }, [session.status])

  // debounced push of every change; the server merges rather than overwrites
  useEffect(() => {
    if (!ready || !signedIn || !pulled.current) return
    const body = JSON.stringify(state)
    if (body === lastPushed.current) return
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      try {
        setSync('syncing')
        const res = await fetch('/api/progress', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body,
        })
        if (!res.ok) throw new Error(`push failed: ${res.status}`)
        lastPushed.current = body
        setSync('synced')
      } catch (err) {
        console.error(err)
        setSync('error')
      }
    }, 1500)
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [state, ready, signedIn])

  // theme is applied to <html> so CSS variables switch
  useEffect(() => {
    if (!ready) return
    const root = document.documentElement
    if (state.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', state.theme)
  }, [state.theme, ready])

  const touchDay = useCallback((s: ProgressState): ProgressState => {
    const d = today()
    if (s.streak.days.includes(d)) return s
    return { ...s, streak: { days: [...s.streak.days, d].slice(-400) } }
  }, [])

  const setTheme = useCallback((theme: ProgressState['theme']) => {
    setState((s) => ({ ...s, theme }))
  }, [])

  const setArchetype = useCallback((archetype: ArchetypeId | null) => {
    setState((s) => ({ ...s, archetype }))
  }, [])

  const saveStage: Ctx['saveStage'] = useCallback(
    (problemSlug, stageId, answer, checked, total, axis, label) => {
      const score = total === 0 ? 0 : Math.round((checked.length / total) * 10)
      setState((s) => {
        const prev = s.problems[problemSlug] ?? { stages: {}, lastTouched: '' }
        return touchDay({
          ...s,
          problems: {
            ...s.problems,
            [problemSlug]: {
              ...prev,
              lastTouched: new Date().toISOString(),
              stages: {
                ...prev.stages,
                [stageId]: {
                  answer,
                  submittedAt: new Date().toISOString(),
                  checked,
                  score,
                },
              },
            },
          },
          scores: [
            ...s.scores,
            { at: new Date().toISOString(), scores: { [axis]: score }, source: problemSlug, label },
          ].slice(-500),
        })
      })
    },
    [touchDay],
  )

  const completeProblem = useCallback(
    (slug: string) => {
      setState((s) => {
        const prev = s.problems[slug]
        if (!prev) return s
        return touchDay({
          ...s,
          problems: {
            ...s.problems,
            [slug]: { ...prev, completedAt: new Date().toISOString() },
          },
        })
      })
    },
    [touchDay],
  )

  const saveConcept: Ctx['saveConcept'] = useCallback(
    (slug, rating, answer) => {
      setState((s) => {
        const prev = s.concepts[slug]
        const reps = (prev?.reps ?? 0) + 1
        return touchDay({
          ...s,
          concepts: {
            ...s.concepts,
            [slug]: {
              reps,
              lastRating: rating,
              lastSeen: new Date().toISOString(),
              dueAt: nextDue(rating, reps),
              answers: [
                ...(prev?.answers ?? []),
                ...(answer ? [{ answer, at: new Date().toISOString() }] : []),
              ].slice(-20),
            },
          },
        })
      })
    },
    [touchDay],
  )

  const setRead: Ctx['setRead'] = useCallback(
    (id, read) => {
      setState((s) => {
        if (read === Boolean(s.read?.[id])) return s
        const next = { ...(s.read ?? {}) }
        if (read) next[id] = new Date().toISOString()
        else delete next[id]
        return touchDay({ ...s, read: next })
      })
    },
    [touchDay],
  )

  const saveFollowUp: Ctx['saveFollowUp'] = useCallback(
    (id, category, answer, rating) => {
      setState((s) =>
        touchDay({
          ...s,
          followUps: [
            ...s.followUps,
            { id, category, answer, rating, at: new Date().toISOString() },
          ].slice(-400),
          scores: [
            ...s.scores,
            {
              at: new Date().toISOString(),
              scores: { defence: rating === 3 ? 9 : rating === 2 ? 6 : 3 },
              source: id,
              label: 'Follow-up drill',
            },
          ].slice(-500),
        }),
      )
    },
    [touchDay],
  )

  const addGap = useCallback(
    (text: string, source: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      const entry: GapEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: new Date().toISOString(),
        text: trimmed,
        tags: tagGap(trimmed),
        source,
      }
      setState((s) => touchDay({ ...s, gaps: [entry, ...s.gaps].slice(0, 300) }))
    },
    [touchDay],
  )

  const addMock = useCallback(
    (run: Omit<MockRun, 'id' | 'at'>) => {
      const at = new Date().toISOString()
      setState((s) =>
        touchDay({
          ...s,
          mocks: [
            { ...run, id: `${Date.now()}`, at },
            ...s.mocks,
          ].slice(0, 100),
          scores: [...s.scores, { at, scores: run.scores, source: run.problemSlug, label: 'Timed mock' }].slice(-500),
        }),
      )
    },
    [touchDay],
  )

  const saveBlank: Ctx['saveBlank'] = useCallback(
    (title, stages, diagram) => {
      setState((s) =>
        touchDay({
          ...s,
          blank: [
            { title, stages, diagram, savedAt: new Date().toISOString() },
            ...s.blank,
          ].slice(0, 50),
        }),
      )
    },
    [touchDay],
  )

  const deleteBlank = useCallback((savedAt: string) => {
    setState((s) => ({ ...s, blank: s.blank.filter((b) => b.savedAt !== savedAt) }))
  }, [])

  const clearAll = useCallback(() => {
    setState(emptyState())
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* nothing to do */
    }
  }, [])

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-design-gym-${today()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [state])

  const value = useMemo(
    () => ({
      state,
      ready,
      sync,
      signedIn,
      user: session.data?.user ?? null,
      setTheme,
      setArchetype,
      saveStage,
      completeProblem,
      saveConcept,
      setRead,
      saveFollowUp,
      addGap,
      addMock,
      saveBlank,
      deleteBlank,
      clearAll,
      exportJson,
    }),
    [
      state,
      ready,
      sync,
      signedIn,
      session.data?.user,
      setTheme,
      setArchetype,
      saveStage,
      completeProblem,
      saveConcept,
      setRead,
      saveFollowUp,
      addGap,
      addMock,
      saveBlank,
      deleteBlank,
      clearAll,
      exportJson,
    ],
  )

  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressCtx)
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider')
  return ctx
}

/* ============================================================
   derived selectors — pure functions over state
   ============================================================ */

export function axisScores(state: ProgressState, recent = 12): Scores {
  const out = {} as Scores
  for (const axis of AXES) {
    const vals = state.scores
      .filter((s) => typeof s.scores[axis] === 'number')
      .slice(-recent * 2)
      .map((s) => s.scores[axis] as number)
      .slice(-recent)
    out[axis] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }
  return out
}

/** average score per axis over an earlier window, for the "over time" comparison */
export function axisScoresBefore(state: ProgressState, recent = 12): Scores | null {
  const out = {} as Scores
  let any = false
  for (const axis of AXES) {
    const vals = state.scores
      .filter((s) => typeof s.scores[axis] === 'number')
      .map((s) => s.scores[axis] as number)
    if (vals.length > recent) {
      any = true
      const earlier = vals.slice(0, -recent)
      out[axis] = earlier.reduce((a, b) => a + b, 0) / earlier.length
    } else {
      out[axis] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    }
  }
  return any ? out : null
}

export function weakestAxis(state: ProgressState): Axis | null {
  const s = axisScores(state)
  const touched = AXES.filter((a) => s[a] > 0)
  if (touched.length < 2) return null
  return touched.reduce((min, a) => (s[a] < s[min] ? a : min), touched[0])
}

export function isRead(state: ProgressState, id: string): boolean {
  return Boolean(state.read?.[id])
}

/** how many of these ids have been read — for the "4 / 7" counters in the sidebar */
export function readCount(state: ProgressState, ids: string[]): number {
  return ids.filter((id) => state.read?.[id]).length
}

export function conceptState(state: ProgressState, slug: string): NodeState {
  const c = state.concepts[slug]
  if (!c) return 'untouched'
  if (Date.parse(c.dueAt) <= Date.now()) return 'review'
  if (c.lastRating >= 3) return 'solid'
  return 'attempted'
}

export function problemState(state: ProgressState, slug: string): NodeState {
  const p = state.problems[slug]
  if (!p) return 'untouched'
  const stages = Object.values(p.stages)
  if (!stages.length) return 'untouched'
  if (stages.length < 5) return 'attempted'
  const avg = stages.reduce((a, s) => a + s.score, 0) / stages.length
  if (avg >= 7) return 'solid'
  return 'review'
}

export function dueConcepts(state: ProgressState): string[] {
  return Object.entries(state.concepts)
    .filter(([, c]) => Date.parse(c.dueAt) <= Date.now())
    .sort((a, b) => Date.parse(a[1].dueAt) - Date.parse(b[1].dueAt))
    .map(([slug]) => slug)
}

/**
 * Problems come back on a schedule too. A design you worked through once in
 * March is a design you have forgotten by May, and only concepts having spaced
 * repetition was a real gap.
 */
export function dueProblems(state: ProgressState): string[] {
  const now = Date.now()
  return Object.entries(state.problems)
    .filter(([, p]) => {
      const stages = Object.values(p.stages)
      if (!stages.length) return false
      const avg = stages.reduce((a, s) => a + s.score, 0) / stages.length
      // solid work comes back in a month, shaky work in a week
      const days = avg >= 7 ? 30 : avg >= 4 ? 14 : 7
      return now - Date.parse(p.lastTouched) >= days * 86_400_000
    })
    .sort((a, b) => Date.parse(a[1].lastTouched) - Date.parse(b[1].lastTouched))
    .map(([slug]) => slug)
}

export interface GapPattern {
  tag: string
  count: number
  total: number
  recent: string[]
}

/** "You forgot idempotency in 6 of your last 9 designs." */
export function gapPatterns(state: ProgressState, window = 12): GapPattern[] {
  const recent = state.gaps.slice(0, window)
  if (!recent.length) return []
  const counts = new Map<string, GapEntry[]>()
  for (const g of recent) {
    for (const t of g.tags) {
      if (t === 'unfiled') continue
      counts.set(t, [...(counts.get(t) ?? []), g])
    }
  }
  return [...counts.entries()]
    .map(([tag, entries]) => ({
      tag,
      count: entries.length,
      total: recent.length,
      recent: entries.slice(0, 2).map((e) => e.text),
    }))
    .filter((p) => p.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
}

export function streakCount(state: ProgressState): number {
  const days = [...new Set(state.streak.days)].sort()
  if (!days.length) return 0
  const t = today()
  const last = days[days.length - 1]
  // a streak survives if the last active day was today or yesterday
  if (daysBetween(last, t) > 1) return 0
  let n = 1
  for (let i = days.length - 1; i > 0; i--) {
    if (daysBetween(days[i - 1], days[i]) === 1) n++
    else break
  }
  return n
}

export function activeDaysSet(state: ProgressState): Set<string> {
  return new Set(state.streak.days)
}

export function failingCategories(state: ProgressState): { category: FollowUpCategory; rate: number; n: number }[] {
  const byCat = new Map<FollowUpCategory, number[]>()
  for (const f of state.followUps) {
    byCat.set(f.category, [...(byCat.get(f.category) ?? []), f.rating])
  }
  return [...byCat.entries()]
    .map(([category, ratings]) => ({
      category,
      rate: ratings.reduce((a, b) => a + b, 0) / ratings.length,
      n: ratings.length,
    }))
    .sort((a, b) => a.rate - b.rate)
}
