import Link from 'next/link'
import { crossLinksFor } from '@/content/crosslinks'

/** "Design it" pages and "build it" pages that teach the same idea, across
 *  tracks. Renders nothing when a page has no partners. */
export function CrossLinks({ path }: { path: string }) {
  const links = crossLinksFor(path)
  if (!links.length) return null
  return (
    <aside aria-labelledby="crosslinks" className="my-8 rounded-xl border px-5 py-4" style={{ borderColor: 'var(--border)' }}>
      <div id="crosslinks" className="mb-2.5 text-[0.6875rem] font-bold tracking-[0.07em] uppercase" style={{ color: 'var(--faint)' }}>
        Same idea, other tracks
      </div>
      <ul className="space-y-2">
        {links.map((x) => (
          <li key={x.path} className="text-[0.9062rem]">
            <Link href={x.path} className="font-medium hover:opacity-70" style={{ color: 'var(--accent)' }}>
              {x.title}
            </Link>
            <span className="ml-2 text-[0.75rem]" style={{ color: 'var(--faint)' }}>
              {x.track}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
