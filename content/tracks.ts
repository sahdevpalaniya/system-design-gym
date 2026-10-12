import { LANGUAGES, orderedLessons } from './languages'

/**
 * Every learning track on the site, in tab order. Site-wide things (header
 * tabs, the root share card, the site description, llms.txt) read from here,
 * so a new track appears everywhere by being added once: a language goes in
 * content/languages.ts, anything else in the list below.
 */
export type Track = { id: string; name: string; href: string; alias?: string }

export const TRACKS: Track[] = [
  { id: 'sd', name: 'System Design', href: '/' },
  // a language tab starts the course: it opens the first lesson, not the index
  ...LANGUAGES.map((l) => ({
    id: l.id,
    name: l.name,
    alias: l.alias,
    href: orderedLessons(l)[0] ? `/languages/${l.id}/${orderedLessons(l)[0].slug}` : `/languages/${l.id}`,
  })),
]

/** "System Design, Go (Golang)", then "and" before the last one. */
export function trackList(): string {
  const names = TRACKS.map((t) => (t.alias && t.alias !== t.name ? `${t.name} (${t.alias})` : t.name))
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]
}
