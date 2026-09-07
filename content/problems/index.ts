import type { GroupId, Problem } from '@/lib/types'
import { URL_SHORTENER } from './url-shortener'
import { SOCIAL_TIMELINE } from './social-timeline'
import { RIDE_MATCHING } from './ride-matching'
import { TICKET_BOOKING } from './ticket-booking'
import { VIDEO_PLATFORM } from './video-platform'
import { LIVE_SCORES } from './live-scores'
import { TYPEAHEAD } from './typeahead'
import { RATE_LIMITER } from './rate-limiter'
import { NEARBY_PLACES } from './nearby-places'
import { CLICK_ANALYTICS } from './click-analytics'

export const PROBLEMS: Problem[] = [
  URL_SHORTENER,
  SOCIAL_TIMELINE,
  RIDE_MATCHING,
  TICKET_BOOKING,
  VIDEO_PLATFORM,
  LIVE_SCORES,
  TYPEAHEAD,
  RATE_LIMITER,
  NEARBY_PLACES,
  CLICK_ANALYTICS,
]

export function getProblem(slug: string): Problem | undefined {
  return PROBLEMS.find((p) => p.slug === slug)
}

export function problemsByGroup(id: GroupId): Problem[] {
  return PROBLEMS.filter((p) => p.group === id)
}
