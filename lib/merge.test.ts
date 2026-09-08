/**
 * Self-check for the merge — run with `npx tsx lib/merge.test.ts`.
 *
 * The merge is the one place where a bug silently destroys someone's work, so
 * it gets a test even though nothing else here does.
 */
import assert from 'node:assert/strict'
import { mergeProgress } from './merge'
import type { ProgressState } from './types'

function base(overrides: Partial<ProgressState> = {}): ProgressState {
  return {
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
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
    ...overrides,
  }
}

const local = base({
  createdAt: '2026-02-01T00:00:00.000Z',
  theme: 'dark',
  streak: { days: ['2026-03-01', '2026-03-02'] },
  concepts: {
    caching: {
      reps: 1,
      lastRating: 2,
      lastSeen: '2026-03-01T10:00:00.000Z',
      dueAt: '2026-03-04T10:00:00.000Z',
      answers: [{ answer: 'local answer', at: '2026-03-01T10:00:00.000Z' }],
    },
  },
  problems: {
    'url-shortener': {
      stages: {
        1: { answer: 'local stage 1', submittedAt: '2026-03-01T10:00:00.000Z', checked: [0], score: 2 },
      },
      lastTouched: '2026-03-01T10:00:00.000Z',
    },
  },
  gaps: [{ id: 'g-local', at: '2026-03-01T10:00:00.000Z', text: 'forgot idempotency', tags: ['idempotency'], source: 'url-shortener' }],
})

const server = base({
  createdAt: '2026-01-15T00:00:00.000Z',
  theme: 'light',
  archetype: 'cost-auditor',
  streak: { days: ['2026-03-02', '2026-03-03'] },
  concepts: {
    caching: {
      reps: 3,
      lastRating: 4,
      lastSeen: '2026-03-05T10:00:00.000Z',
      dueAt: '2026-03-26T10:00:00.000Z',
      answers: [{ answer: 'server answer', at: '2026-03-05T10:00:00.000Z' }],
    },
    replication: {
      reps: 1,
      lastRating: 3,
      lastSeen: '2026-03-04T10:00:00.000Z',
      dueAt: '2026-03-11T10:00:00.000Z',
      answers: [],
    },
  },
  problems: {
    'url-shortener': {
      stages: {
        1: { answer: 'server stage 1 (older)', submittedAt: '2026-02-20T10:00:00.000Z', checked: [], score: 0 },
        2: { answer: 'server stage 2', submittedAt: '2026-02-20T10:05:00.000Z', checked: [0, 1], score: 4 },
      },
      lastTouched: '2026-02-20T10:05:00.000Z',
    },
  },
  gaps: [{ id: 'g-server', at: '2026-03-05T10:00:00.000Z', text: 'no cost named', tags: ['naming costs'], source: 'social-timeline' }],
})

const m = mergeProgress(local, server)

// nothing is lost from either side
assert.equal(m.gaps.length, 2, 'both gaps survive')
assert.equal(m.concepts.replication.reps, 1, 'server-only concept survives')
assert.deepEqual(m.streak.days, ['2026-03-01', '2026-03-02', '2026-03-03'], 'streak days union, deduped, sorted')

// the more recent review wins, but rep count never goes backwards
assert.equal(m.concepts.caching.lastRating, 4, 'later review wins')
assert.equal(m.concepts.caching.reps, 3, 'reps take the max')
assert.equal(m.concepts.caching.answers.length, 2, 'answer history is kept from both sides')

// a later attempt supersedes an earlier one, and stages the other side lacks survive
assert.equal(m.problems['url-shortener'].stages[1]!.answer, 'local stage 1', 'later submission wins')
assert.equal(m.problems['url-shortener'].stages[2]!.answer, 'server stage 2', 'server-only stage survives')

// scalars
assert.equal(m.theme, 'dark', 'theme is per-device — local wins')
assert.equal(m.archetype, 'cost-auditor', 'archetype falls back to the server when local has none')
assert.equal(m.createdAt, '2026-01-15T00:00:00.000Z', 'createdAt keeps the earliest')

// order independence and idempotency — both sides run this, neither is authoritative
const swapped = mergeProgress(server, local)
assert.equal(swapped.gaps.length, m.gaps.length, 'merge is order-independent in content')
assert.equal(swapped.concepts.caching.reps, m.concepts.caching.reps)
assert.deepEqual(mergeProgress(m, m), m, 'merging a state with itself is a no-op')
assert.deepEqual(mergeProgress(m, server), m, 'remerging an already-merged state changes nothing')

console.log('merge: all assertions passed')

/* read marks survive both sides, and the earlier date wins */
{
  const merged = mergeProgress(
    base({ read: { 'concept:caching': '2026-03-02T00:00:00.000Z' } }),
    base({ read: { 'concept:caching': '2026-03-01T00:00:00.000Z', 'lesson:the-vocabulary': '2026-03-05T00:00:00.000Z' } }),
  )
  assert.equal(merged.read['concept:caching'], '2026-03-01T00:00:00.000Z')
  assert.equal(merged.read['lesson:the-vocabulary'], '2026-03-05T00:00:00.000Z')
}

/* whiteboards survive a sync — the drawing is part of the blank attempt, and
   two devices that each drew one end up with both rather than one winning */
{
  const drawingA = JSON.stringify([{ p: [0.1, 0.1, 0.4, 0.35], c: '#1f2430', w: 4 }])
  const drawingB = JSON.stringify([{ p: [0.5, 0.5, 0.9, 0.8], c: '#d1493f', w: 2 }])
  const laptop = base({
    blank: [
      {
        title: 'Design a paste bin',
        stages: { 1: 'reads beat writes, no auth' },
        drawing: drawingA,
        savedAt: '2026-03-01T10:00:00.000Z',
      },
    ],
  })
  const phone = base({
    blank: [
      {
        title: 'Design a job queue',
        stages: { 1: 'workers pull, at-least-once' },
        drawing: drawingB,
        savedAt: '2026-03-02T10:00:00.000Z',
      },
    ],
  })
  const merged = mergeProgress(laptop, phone)
  assert.equal(merged.blank.length, 2, "both devices' attempts survive")
  assert.equal(
    merged.blank.find((b) => b.title === 'Design a paste bin')?.drawing,
    drawingA,
    'the strokes themselves are preserved through the merge',
  )
  // merging twice must not duplicate or drop anything
  assert.equal(mergeProgress(merged, phone).blank.length, 2, 'merge stays idempotent with drawings')
}
