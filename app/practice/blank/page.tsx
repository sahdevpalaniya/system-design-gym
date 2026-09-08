'use client'

import { useState } from 'react'
import { STAGES } from '@/content/method'
import { useProgress } from '@/lib/store'
import { Button, Page, PageHeader } from '@/components/ui'
import { Sketchpad } from '@/components/Sketchpad'
import { parseSketch } from '@/lib/sketch'
import { Diagram } from '@/components/visuals'

/** a saved whiteboard, redrawn from the text it was stored as */
function SavedDiagram({ text }: { text: string }) {
  const { spec } = parseSketch(text)
  if (!spec) return null
  return (
    <div>
      <div className="mb-1 text-[11.5px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--faint)' }}>
        The whiteboard
      </div>
      <Diagram spec={spec} />
    </div>
  )
}

export default function BlankPage() {
  const { state, ready, saveBlank, deleteBlank } = useProgress()
  const [title, setTitle] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [diagram, setDiagram] = useState('')
  const [saved, setSaved] = useState(false)

  const filled = Object.values(values).filter((v) => v.trim().length > 20).length

  return (
    <Page>
      <PageHeader
        eyebrow="Blank page · untimed"
        title="Just the scaffold"
        lede="Name it, draw it, then write it. No nudges, no model answer, no checklist, no help of any kind — for the last week before an interview, when what you need to know is that you can produce it from nothing."
      />

      <div className="mb-8">
        <label htmlFor="blank-title" className="mb-2 block text-[13.5px] font-semibold">
          What are you designing?
        </label>
        <input
          id="blank-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. A system for scheduling and delivering push notifications"
          className="w-full rounded-xl border px-4 py-3 text-[16px] outline-none"
          style={{ borderColor: 'var(--border-strong)' }}
        />
      </div>

      <section className="mb-10">
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            aria-hidden
          >
            ✎
          </span>
          <h2 className="text-[17px] font-semibold">The whiteboard</h2>
        </div>
        <p className="mb-3 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Draw it before you write about it, the way you would in the room. Type the arrows and they get
          drawn for you, so the boxes have to actually connect.
        </p>
        <Sketchpad
          value={diagram}
          onChange={setDiagram}
          rows={8}
          title="Your whiteboard"
          blurb="One arrow chain per line. This is saved with the attempt, so you can come back in a week and see whether you would draw it the same way."
        />
      </section>

      <div className="space-y-6">
        {STAGES.map((s) => (
          <div key={s.id}>
            <div className="mb-2 flex flex-wrap items-baseline gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                {s.id}
              </span>
              <h2 className="text-[17px] font-semibold">{s.name}</h2>
              <span className="text-[12.5px]" style={{ color: 'var(--faint)' }}>
                {s.minutes} min
              </span>
            </div>
            <p className="mb-2.5 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {s.ask}
            </p>
            <textarea
              value={values[s.id] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [s.id]: e.target.value }))}
              rows={8}
              className="w-full resize-y rounded-xl border px-4 py-3.5 text-[15px] leading-relaxed outline-none"
              style={{ borderColor: 'var(--border-strong)' }}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <span className="text-[13.5px]" style={{ color: 'var(--muted)' }}>
          {filled} of 5 stages written{diagram.trim() ? ', whiteboard drawn' : ''}.
        </span>
        <Button
          onClick={() => {
            saveBlank(title.trim() || 'Untitled design', values, diagram.trim() || undefined)
            setSaved(true)
          }}
          disabled={filled === 0 && !diagram.trim()}
        >
          Save this attempt
        </Button>
      </div>

      {saved ? (
        <p className="fade-up mt-3 text-right text-[13.5px]" style={{ color: 'var(--ok)' }}>
          Saved. It will keep — reread it in a week and see what you would change.
        </p>
      ) : null}

      {ready && state.blank.length ? (
        <section className="mt-12 border-t pt-8">
          <h2 className="mb-4 text-[19px] font-semibold">Your saved blank-page attempts</h2>
          <div className="space-y-3">
            {state.blank.map((b) => (
              <details key={b.savedAt} className="card overflow-hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 select-none">
                  <span>
                    <span className="text-[15px] font-semibold">{b.title}</span>
                    <span className="ml-2 text-[12.5px]" style={{ color: 'var(--faint)' }}>
                      {new Date(b.savedAt).toLocaleDateString()}
                    </span>
                  </span>
                </summary>
                <div className="space-y-4 border-t px-5 py-4">
                  {b.diagram ? <SavedDiagram text={b.diagram} /> : null}
                  {STAGES.map((s) =>
                    b.stages[s.id]?.trim() ? (
                      <div key={s.id}>
                        <div className="mb-1 text-[11.5px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--faint)' }}>
                          {s.id}. {s.name}
                        </div>
                        <p className="prose text-[14.5px] whitespace-pre-wrap">{b.stages[s.id]}</p>
                      </div>
                    ) : null,
                  )}
                  <div className="border-t pt-3">
                    <Button variant="ghost" size="sm" onClick={() => deleteBlank(b.savedAt)}>
                      Delete this attempt
                    </Button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </Page>
  )
}
