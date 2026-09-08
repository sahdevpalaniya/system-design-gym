import type { Concept, Tier } from '@/lib/types'
import { TIER1 } from './tier1'
import { TIER1_EXTRA } from './tier1-extra'
import { TIER1_STORAGE } from './tier1-storage'
import { TIER2 } from './tier2'
import { TIER2_EXTRA } from './tier2-extra'
import { TIER3 } from './tier3'
import { TIER3_OPS } from './tier3-ops'

export const CONCEPTS: Concept[] = [
  ...TIER1,
  ...TIER1_EXTRA,
  ...TIER1_STORAGE,
  ...TIER2,
  ...TIER2_EXTRA,
  ...TIER3,
  ...TIER3_OPS,
]

export const TIER_INFO: Record<Tier, { name: string; blurb: string }> = {
  1: {
    name: 'Tier 1 — the basics',
    blurb:
      'The things every design uses. If any of these are shaky, the rest will not hold. Short pages, one cost each.',
  },
  2: {
    name: 'Tier 2 — distributed',
    blurb:
      'The part that decides senior interviews. Once data lives on more than one machine, everything here starts applying at once.',
  },
  3: {
    name: 'Tier 3 — common patterns',
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

/* ---------- the learning path ----------
   The order to meet these in when starting from nothing. The tiers say how
   hard something is; the path says what to read next. */

export interface PathStage {
  id: string
  name: string
  blurb: string
  /** lesson slugs from content/foundations, then concept slugs */
  lessons?: string[]
  concepts?: string[]
}

export const PATH: PathStage[] = [
  {
    id: 'start',
    name: 'Start here',
    blurb: 'What system design is, how the interview works, and the method you will use on every problem.',
    lessons: [
      'what-is-system-design',
      'how-the-interview-works',
      'the-five-stages',
      'where-is-the-slack',
      'the-vocabulary',
    ],
  },
  {
    id: 'measuring',
    name: 'Measuring things',
    blurb: 'Before you can design anything you need to be able to say how fast, how many and how big.',
    concepts: [
      'performance-vs-scalability',
      'latency-vs-throughput',
      'latency-numbers',
      'back-of-envelope',
    ],
  },
  {
    id: 'request-path',
    name: 'How a request reaches you',
    blurb: 'Follow one request from a browser to your code and back, layer by layer.',
    concepts: ['dns', 'communication-protocols', 'api-design', 'reverse-proxy', 'load-balancing', 'cdn'],
  },
  {
    id: 'storing',
    name: 'Storing data',
    blurb: 'Where the truth lives, how to find it quickly, and how to talk to it without falling over.',
    concepts: [
      'sql-vs-nosql',
      'indexes',
      'transactions-and-locking',
      'connection-pooling',
      'caching',
      'object-storage',
    ],
  },
  {
    id: 'more-than-one',
    name: 'More than one machine',
    blurb: 'The moment data lives in two places, a new set of problems starts — this is the senior material.',
    concepts: [
      'availability-patterns',
      'replication',
      'partitioning',
      'consistency-models',
      'cap-pacelc',
      'consensus',
      'clocks-and-ordering',
      'multi-region',
    ],
  },
  {
    id: 'work-later',
    name: 'Doing work later',
    blurb: 'Queues, retries, and making it safe for the same thing to happen twice.',
    concepts: [
      'message-queues',
      'idempotency',
      'fan-out',
      'distributed-transactions',
      'change-data-capture',
      'batch-vs-stream',
    ],
  },
  {
    id: 'patterns',
    name: 'Common patterns',
    blurb: 'Specific reusable answers. Most of these appear as the follow-up rather than the first question.',
    concepts: [
      'rate-limiting',
      'consistent-hashing',
      'bloom-filters',
      'write-ahead-log',
      'distributed-counter',
      'geospatial-indexing',
      'search-indexing',
      'realtime-transports',
      'circuit-breakers',
    ],
  },
  {
    id: 'production',
    name: 'In production',
    blurb:
      'The part most people skip, and the part senior interviews dig into. A design you cannot deploy, watch, secure, restore or pay for is not finished.',
    concepts: [
      'auth-and-security',
      'observability',
      'deploys-and-releases',
      'backups-and-recovery',
      'capacity-and-cost',
    ],
  },
]

/** flat ordered list of concept slugs, for prev/next through the path */
export const PATH_ORDER: string[] = PATH.flatMap((s) => s.concepts ?? [])

export function pathNeighbours(slug: string): { prev?: Concept; next?: Concept } {
  const i = PATH_ORDER.indexOf(slug)
  if (i < 0) return {}
  return {
    prev: i > 0 ? getConcept(PATH_ORDER[i - 1]) : undefined,
    next: i < PATH_ORDER.length - 1 ? getConcept(PATH_ORDER[i + 1]) : undefined,
  }
}
