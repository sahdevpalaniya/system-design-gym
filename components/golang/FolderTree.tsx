import type { LangTree } from '@/lib/types'

/**
 * A drawn folder tree. Folders and files get different icons and weights, and
 * each row can carry a short note saying what it is for — which is the part an
 * ASCII tree in a code block cannot do well.
 */
export function FolderTree({ tree }: { tree: LangTree }) {
  return (
    <figure className="my-6">
      <div
        className="overflow-x-auto rounded-xl border p-1.5"
        style={{ borderColor: 'var(--border-strong)', background: 'var(--surface-2)' }}
      >
        <div className="min-w-fit">
          {tree.nodes.map((n, i) => (
            <div
              key={i}
              className="flex items-baseline gap-2 rounded-md py-[3px] pr-3"
              style={{ paddingLeft: `${8 + n.depth * 20}px` }}
            >
              <span className="shrink-0" style={{ color: n.kind === 'dir' ? 'var(--accent)' : 'var(--dim)' }} aria-hidden>
                {n.kind === 'dir' ? (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.1c.4 0 .8.2 1 .5l.8 1H13a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12z" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M9 1.5H4.5A1.5 1.5 0 0 0 3 3v10a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 13 13V5.5z" />
                    <path d="M9 1.5V5a.5.5 0 0 0 .5.5H13" />
                  </svg>
                )}
              </span>

              <span
                className="shrink-0 text-[13px]"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: n.kind === 'dir' ? 'var(--text)' : 'var(--muted)',
                  fontWeight: n.kind === 'dir' ? 600 : 400,
                }}
              >
                {n.name}
                {n.kind === 'dir' ? '/' : ''}
              </span>

              {n.note ? (
                <span className="min-w-0 text-[12.5px] leading-snug" style={{ color: 'var(--faint)' }}>
                  {n.note}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {tree.caption ? (
        <figcaption className="mt-2 text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          {tree.caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
