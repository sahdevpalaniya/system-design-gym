import type { Concept, Tier } from '@/lib/types'
import { TIER1 } from './tier1'
import { TIER2 } from './tier2'
import { TIER3 } from './tier3'

export const CONCEPTS: Concept[] = [...TIER1, ...TIER2, ...TIER3]

export const TIER_INFO: Record<Tier, { name: string; blurb: string }> = {
  1: {
    name: 'Tier 1 — the basics',
    blurb:
      'The things every design uses. If any of these are shaky, the rest will not hold. Short pages, one cost each.',
  },
  2: {
    name: 'Tier 2 — distributed systems',
    blurb:
      'The part that decides senior interviews. Once data lives on more than one machine, everything here starts applying at once.',
  },
  3: {
    name: 'Tier 3 — patterns that keep showing up',
    blurb:
      'Specific, reusable answers. You will meet most of these in a real interview, usually as the follow-up rather than the first question.',
  },
}

export function getConcept(slug: string): Concept | undefined {
  return CONCEPTS.find((c) => c.slug === slug)
}

export function conceptsByTier(tier: Tier): Concept[] {
  return CONCEPTS.filter((c) => c.tier === tier)
}
