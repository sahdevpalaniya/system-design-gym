'use client'

import { useState } from 'react'
import { tagGap } from '@/lib/store'
import { Button } from '@/components/common/ui'

export function GapLog({
  source,
  onAdd,
}: {
  source: string
  onAdd: (text: string, source: string) => void
}) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const tags = text.trim().length > 6 ? tagGap(text) : []

  if (done)
    return (
      <div
        className="fade-up rounded-xl border px-5 py-4 text-[14.5px]"
        style={{ background: 'var(--say-bg)', color: 'var(--say)' }}
      >
        <strong>Logged.</strong> Once you have a few of these, the home screen starts telling you which mistake
        you keep making. That is the point — nobody can fix &ldquo;I am bad at system design&rdquo;, everybody can fix
        &ldquo;I always forget idempotency&rdquo;.
      </div>
    )

  return (
    <div className="card p-5">
      <h3 className="text-[16px] font-semibold">One line: what did you miss?</h3>
      <p className="mt-1.5 mb-4 text-[14px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        In your own words. This is the smallest feature in the app and the one with the biggest effect — it turns
        a vague weakness into a checklist.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="e.g. I forgot to say what the cache costs, and I never mentioned what happens when it is empty."
        className="w-full resize-y rounded-xl border px-4 py-3 text-[15px] leading-relaxed outline-none"
        style={{ borderColor: 'var(--border-strong)' }}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tags
            .filter((t) => t !== 'unfiled')
            .map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                {t}
              </span>
            ))}
        </div>
        <Button
          onClick={() => {
            onAdd(text, source)
            setDone(true)
          }}
          disabled={text.trim().length < 8}
        >
          Add to gap log
        </Button>
      </div>
    </div>
  )
}
