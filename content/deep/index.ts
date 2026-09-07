import type { DeepDive, WorkedExample } from '@/lib/types'
import { LOAD_BALANCING_DEEP, LOAD_BALANCING_EXAMPLE } from './load-balancing'
import { SQL_NOSQL_DEEP, SQL_NOSQL_EXAMPLE } from './databases'

/**
 * "View more" content, keyed by concept slug. A concept without an entry here
 * simply does not show the button — the summary page stands on its own.
 */
export const DEEP_DIVES: Record<string, DeepDive> = {
  'load-balancing': LOAD_BALANCING_DEEP,
  'sql-vs-nosql': SQL_NOSQL_DEEP,
}

export const EXAMPLES: Record<string, WorkedExample> = {
  'load-balancing': LOAD_BALANCING_EXAMPLE,
  'sql-vs-nosql': SQL_NOSQL_EXAMPLE,
}

export function getDeepDive(slug: string): DeepDive | undefined {
  return DEEP_DIVES[slug]
}

export function getExample(slug: string): WorkedExample | undefined {
  return EXAMPLES[slug]
}

export function hasDeepDive(slug: string): boolean {
  return slug in DEEP_DIVES
}
