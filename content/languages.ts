import type { Language, LangLesson } from '@/lib/types'
import { GO } from './golang'

/** Every language track. Add one here and it appears in the sidebar. */
export const LANGUAGES: Language[] = [GO]

export function getLanguage(id: string): Language | undefined {
  return LANGUAGES.find((l) => l.id === id)
}

export function getLangLesson(langID: string, slug: string): LangLesson | undefined {
  return getLanguage(langID)?.lessons.find((l) => l.slug === slug)
}

/** The lessons of a language in section order, flattened — for prev/next links. */
export function orderedLessons(lang: Language): LangLesson[] {
  const bySlug = new Map(lang.lessons.map((l) => [l.slug, l]))
  return lang.sections.flatMap((s) =>
    s.lessons.map((slug) => bySlug.get(slug)).filter((l): l is LangLesson => Boolean(l)),
  )
}

/** Which section a lesson belongs to. */
export function sectionOf(lang: Language, slug: string) {
  return lang.sections.find((s) => s.lessons.includes(slug))
}

export { GO }
