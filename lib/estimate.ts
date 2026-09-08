import type { LangLesson, LangSection } from './types'

/*
 * Reading and doing time, computed from the topic itself so it cannot drift
 * out of date the way a hand-written "15 min" does.
 *
 * ponytail: rough constants, not science. They are for planning a session, not
 * for billing — round hard so nobody reads them as a promise.
 */
const WORDS_PER_MIN = 180 // prose, technical, read carefully
const SECONDS_PER_CODE_LINE = 3 // reading code, not typing it
const MIN_PER_EXERCISE = 6
const MIN_PER_TASK = 25

function words(xs: (string | undefined)[]): number {
  return xs.filter(Boolean).join(' ').split(/\s+/).filter(Boolean).length
}

/** Minutes to read a topic: prose, tables, callouts and code, without the drills. */
export function readMinutes(t: LangLesson): number {
  let w = words([t.oneLine, t.remember, ...t.keyPoints])
  let codeLines = 0

  for (const b of t.blocks) {
    w += words([b.heading, ...(b.body ?? []), ...(b.bullets ?? []), b.callout?.text, b.code?.note])
    if (b.table) w += words(b.table.headers.concat(...b.table.rows))
    if (b.tree) w += b.tree.nodes.length * 6
    if (b.code) codeLines += b.code.src.split('\n').length
  }

  return Math.max(2, Math.round(w / WORDS_PER_MIN + (codeLines * SECONDS_PER_CODE_LINE) / 60))
}

/** Minutes to do the build task and the drills afterwards. */
export function practiceMinutes(t: LangLesson): number {
  return (t.task ? MIN_PER_TASK : 0) + (t.exercises?.length ?? 0) * MIN_PER_EXERCISE
}

/**
 * "20 min", "1 h 15 min", "about 60 hours" — the rounding gets coarser as the
 * number gets bigger, because a 60-hour estimate accurate to five minutes
 * would be pretending.
 */
export function humanMinutes(mins: number): string {
  if (mins >= 600) return `${Math.round(mins / 60 / 5) * 5} hours`
  const m = Math.max(5, Math.round(mins / 5) * 5)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = Math.round((m % 60) / 15) * 15
  if (rest === 60) return `${h + 1} h`
  return rest ? `${h} h ${rest} min` : `${h} h`
}

export function sectionMinutes(section: LangSection, lessons: LangLesson[]): number {
  const bySlug = new Map(lessons.map((l) => [l.slug, l]))
  return section.lessons.reduce((n, slug) => {
    const t = bySlug.get(slug)
    return t ? n + readMinutes(t) + practiceMinutes(t) : n
  }, 0)
}

export function trackMinutes(sections: LangSection[], lessons: LangLesson[]): number {
  return sections.reduce((n, s) => n + sectionMinutes(s, lessons), 0)
}
