import { OG_SIZE, ogCard } from '@/lib/og-card'
import { TRACKS, trackList } from '@/content/tracks'

export const runtime = 'nodejs'
export const alt = 'Dev Skills: learn to code and prepare for interviews, step by step'
export const size = OG_SIZE
export const contentType = 'image/png'

/** The site-wide card, used by every page without a card of its own. It names
 *  the tracks from the registry, so a new track shows up here by itself. */
export default function OgImage() {
  return ogCard({
    kicker: 'Learn, step by step',
    title: 'Learn to build software. Write first, then compare.',
    subtitle: `Courses in plain English with runnable examples and graded challenges: ${trackList()}.`,
    footer: [...TRACKS.slice(0, 4).map((t) => t.name), ...(TRACKS.length > 4 ? [`+${TRACKS.length - 4} more`] : [])],
  })
}
