import type { ProgressState } from './types'

/**
 * Merge two ProgressStates without losing work.
 *
 * This runs when you sign in on a browser that already has anonymous progress:
 * whatever is in localStorage gets folded into whatever the account already has.
 * It also runs when two devices have both been used offline.
 *
 * The merge is order-independent and idempotent — merge(a, b) and merge(b, a)
 * produce the same result, and merging something twice changes nothing. That
 * matters because both sides can call it and neither is authoritative.
 */
export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  return {
    version: 1,
    createdAt: earlier(a.createdAt, b.createdAt),
    // theme is a per-device preference, so the local side always wins; the
    // caller passes local as `a`
    theme: a.theme,
    archetype: a.archetype ?? b.archetype,
    streak: { days: unique([...a.streak.days, ...b.streak.days]).sort() },
    concepts: mergeConcepts(a.concepts, b.concepts),
    problems: mergeProblems(a.problems, b.problems),
    followUps: dedupe([...a.followUps, ...b.followUps], (f) => `${f.id}|${f.at}`),
    gaps: dedupe([...a.gaps, ...b.gaps], (g) => g.id).sort(
      (x, y) => Date.parse(y.at) - Date.parse(x.at),
    ),
    scores: dedupe([...a.scores, ...b.scores], (s) => `${s.at}|${s.source}|${s.label}`).sort(
      (x, y) => Date.parse(x.at) - Date.parse(y.at),
    ),
    mocks: dedupe([...a.mocks, ...b.mocks], (m) => m.id).sort(
      (x, y) => Date.parse(y.at) - Date.parse(x.at),
    ),
    blank: dedupe([...a.blank, ...b.blank], (x) => x.savedAt).sort(
      (x, y) => Date.parse(y.savedAt) - Date.parse(x.savedAt),
    ),
  }
}

function earlier(x: string, y: string): string {
  return Date.parse(x) <= Date.parse(y) ? x : y
}

function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)]
}

function dedupe<T>(xs: T[], key: (x: T) => string): T[] {
  const seen = new Map<string, T>()
  for (const x of xs) if (!seen.has(key(x))) seen.set(key(x), x)
  return [...seen.values()]
}

function mergeConcepts(
  a: ProgressState['concepts'],
  b: ProgressState['concepts'],
): ProgressState['concepts'] {
  const out: ProgressState['concepts'] = {}
  for (const slug of unique([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[slug]
    const y = b[slug]
    if (!x || !y) {
      out[slug] = (x ?? y)!
      continue
    }
    // the more recent review is the one whose rating and due date count; reps
    // are summed conceptually by taking the max, since both sides counted the
    // same history up to the point they diverged
    const recent = Date.parse(x.lastSeen) >= Date.parse(y.lastSeen) ? x : y
    out[slug] = {
      ...recent,
      reps: Math.max(x.reps, y.reps),
      answers: dedupe([...x.answers, ...y.answers], (ans) => ans.at).sort(
        (p, q) => Date.parse(p.at) - Date.parse(q.at),
      ),
    }
  }
  return out
}

function mergeProblems(
  a: ProgressState['problems'],
  b: ProgressState['problems'],
): ProgressState['problems'] {
  const out: ProgressState['problems'] = {}
  for (const slug of unique([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[slug]
    const y = b[slug]
    if (!x || !y) {
      out[slug] = (x ?? y)!
      continue
    }
    const stages: ProgressState['problems'][string]['stages'] = {}
    for (const id of unique([...Object.keys(x.stages), ...Object.keys(y.stages)])) {
      const k = Number(id) as 1 | 2 | 3 | 4 | 5
      const sx = x.stages[k]
      const sy = y.stages[k]
      // a later submission supersedes an earlier one — it is a re-attempt
      stages[k] =
        !sx || !sy
          ? (sx ?? sy)!
          : Date.parse(sx.submittedAt) >= Date.parse(sy.submittedAt)
            ? sx
            : sy
    }
    out[slug] = {
      stages,
      completedAt:
        x.completedAt && y.completedAt
          ? earlier(x.completedAt, y.completedAt)
          : (x.completedAt ?? y.completedAt),
      lastTouched:
        Date.parse(x.lastTouched) >= Date.parse(y.lastTouched) ? x.lastTouched : y.lastTouched,
    }
  }
  return out
}
