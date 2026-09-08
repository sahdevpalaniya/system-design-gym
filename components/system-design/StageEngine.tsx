'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sketchpad } from './Sketchpad'
import { unsupportedTicks } from '@/lib/grade'
import { getStage, STAGE_AXIS } from '@/content/system-design/method'
import { getArchetype } from '@/content/system-design/archetypes'
import { getFollowUp } from '@/content/system-design/followups'
import { useProgress } from '@/lib/store'
import { AXES, AXIS_LABEL, type Axis, type Problem, type Scores, type StageId } from '@/lib/types'
import { Callout } from '@/components/common/visuals'
import { Badge, Bullets, Button, Prose, Radar, Rich } from '@/components/common/ui'
import { GapLog } from './GapLog'
import { FollowUpDrill } from './FollowUpDrill'

const MIN_CHARS = 40

/* ---------- timer ---------- */

function useCountdown(seconds: number, running: boolean) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    setLeft(seconds)
  }, [seconds])
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [running, seconds])
  return left
}

function Clock({ left }: { left: number }) {
  const over = left < 0
  const abs = Math.abs(left)
  const m = Math.floor(abs / 60)
  const s = abs % 60
  return (
    <span
      className="tabular rounded-md px-2 py-1 text-[12.5px] font-semibold"
      style={{
        color: over ? 'var(--bad)' : left < 60 ? 'var(--warn)' : 'var(--muted)',
        background: 'var(--surface-2)',
      }}
    >
      {over ? '+' : ''}
      {m}:{String(s).padStart(2, '0')}
    </span>
  )
}

/* ---------- stepper ---------- */

function Stepper({
  stageIds,
  active,
  submitted,
  onJump,
}: {
  stageIds: StageId[]
  active: StageId
  submitted: Record<number, boolean>
  onJump: (id: StageId) => void
}) {
  // the stage right after the last submitted one is reachable too — no need to
  // hunt for the "next" button at the bottom of a long reveal
  const firstUnsubmitted = stageIds.findIndex((id) => !submitted[id])

  return (
    <ol className="mb-7 flex flex-wrap gap-1.5" aria-label="Five-stage progress">
      {stageIds.map((id, i) => {
        const st = getStage(id)
        const done = submitted[id]
        const isActive = id === active
        const reachable = done || isActive || i === firstUnsubmitted
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => reachable && onJump(id)}
              disabled={!reachable}
              aria-current={isActive ? 'step' : undefined}
              className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition disabled:cursor-not-allowed"
              style={{
                background: isActive ? 'var(--accent-soft)' : 'var(--surface)',
                borderColor: isActive ? 'var(--accent-line)' : 'var(--border)',
                color: reachable ? 'var(--text)' : 'var(--faint)',
                opacity: reachable ? 1 : 0.65,
              }}
            >
              <span
                className="flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  width: 18,
                  height: 18,
                  background: done ? 'var(--ok)' : isActive ? 'var(--accent)' : 'var(--surface-2)',
                  color: done || isActive ? 'var(--on-accent)' : 'var(--faint)',
                }}
              >
                {done ? '✓' : id}
              </span>
              {st.name}
              {!reachable ? (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                  <rect x="2.5" y="5.5" width="7" height="5" rx="1" />
                  <path d="M4.2 5.5V4a1.8 1.8 0 0 1 3.6 0v1.5" />
                </svg>
              ) : null}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/* ---------- one stage ---------- */

function StageBlock({
  problem,
  stageId,
  answer,
  onAnswer,
  submitted,
  onSubmit,
  checked,
  onCheck,
  reveal,
  timed,
  archetypeNote,
}: {
  problem: Problem
  stageId: StageId
  answer: string
  onAnswer: (v: string) => void
  submitted: boolean
  onSubmit: () => void
  checked: number[]
  onCheck: (i: number) => void
  reveal: boolean
  timed: boolean
  archetypeNote?: string
}) {
  const def = getStage(stageId)
  const ps = problem.stages.find((s) => s.id === stageId)!
  const left = useCountdown(def.minutes * 60, timed && !submitted)
  const enough = answer.trim().length >= MIN_CHARS
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!submitted) ref.current?.focus()
  }, [stageId, submitted])

  return (
    <div className="fade-up">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
            Stage {stageId} of 5 · {def.minutes} min
          </div>
          <h2 className="mt-1 text-[22px] font-bold tracking-[-0.01em]">{def.name}</h2>
        </div>
        {timed ? <Clock left={left} /> : null}
      </div>

      <p className="prose mb-5 text-[16px]">
        <Rich text={ps.ask} />
      </p>

      {archetypeNote ? (
        <div
          className="mb-5 rounded-xl border px-4 py-3 text-[13.5px]"
          style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
        >
          <span className="font-semibold" style={{ color: 'var(--text)' }}>
            Your interviewer:{' '}
          </span>
          {archetypeNote}
        </div>
      ) : null}

      {/* method reminder — never gives the answer away */}
      <details className="mb-5 rounded-xl border" style={{ background: 'var(--surface-2)' }} open={!submitted}>
        <summary className="cursor-pointer px-4 py-3 text-[13.5px] font-semibold select-none">
          How this stage works
        </summary>
        <div className="px-4 pb-4">
          <Bullets items={def.method} />
          {ps.nudges.length ? (
            <div className="mt-4 border-t pt-3">
              <div className="mb-2 text-[11.5px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--faint)' }}>
                Things to consider — not answers
              </div>
              <Bullets items={ps.nudges} />
            </div>
          ) : null}
        </div>
      </details>

      {/* the writing box — the gate */}
      <div className="mb-4">
        <label htmlFor={`answer-${stageId}`} className="mb-2 block text-[13.5px] font-semibold">
          Your answer
        </label>
        <textarea
          id={`answer-${stageId}`}
          ref={ref}
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          readOnly={submitted}
          rows={submitted ? 6 : 11}
          placeholder="Write it as you would say it out loud. Spelling and grammar are never graded — only your reasoning."
          className="w-full resize-y rounded-xl border px-4 py-3.5 text-[15px] leading-relaxed outline-none transition"
          style={{
            borderColor: 'var(--border-strong)',
            background: submitted ? 'var(--surface-2)' : 'var(--surface)',
          }}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12.5px]" style={{ color: 'var(--faint)' }}>
            {submitted
              ? 'Submitted and saved. You can reread this any time from your answer history.'
              : enough
                ? 'Ready. Grade your thinking, not your English.'
                : `${answer.trim().length} / ${MIN_CHARS} characters — write something real first.`}
          </span>
          {!submitted ? (
            <Button onClick={onSubmit} disabled={!enough}>
              Submit and compare
            </Button>
          ) : null}
        </div>
      </div>

      {stageId === 4 && !submitted ? <Sketchpad /> : null}

      {!submitted ? (
        <div
          className="rounded-xl border border-dashed px-4 py-6 text-center text-[13.5px]"
          style={{ borderColor: 'var(--border-strong)', color: 'var(--faint)' }}
        >
          <svg
            className="mx-auto mb-2"
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <rect x="3" y="7" width="10" height="7" rx="1.5" />
            <path d="M5.4 7V4.8a2.6 2.6 0 0 1 5.2 0V7" />
          </svg>
          The model answer is locked until you submit. Reading it first feels like learning and only builds
          recognition — writing first is what builds the ability to produce an answer on a blank whiteboard.
        </div>
      ) : reveal ? (
        <ModelAnswer ps={ps} checked={checked} onCheck={onCheck} answer={answer} />
      ) : (
        <div
          className="rounded-xl border px-4 py-5 text-center text-[13.5px]"
          style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
        >
          Locked until the end of the mock. Keep going — nothing is revealed until all five stages are done.
        </div>
      )}
    </div>
  )
}

/* ---------- revealed model answer + self-grade ---------- */

function ModelAnswer({
  ps,
  checked,
  onCheck,
  answer,
}: {
  ps: Problem['stages'][number]
  checked: number[]
  onCheck: (i: number) => void
  answer: string
}) {
  const score = Math.round((checked.length / ps.checklist.length) * 10)
  // self-scoring inflates, so flag ticks whose subject never appears in what you wrote
  const unsupported = new Set(unsupportedTicks(answer, ps.checklist, checked))
  return (
    <div className="fade-up mt-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
        <span className="text-[11.5px] font-bold tracking-[0.07em] uppercase" style={{ color: 'var(--accent)' }}>
          A model answer
        </span>
        <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
      </div>

      <div className="card p-5">
        <Prose paragraphs={ps.model} />

        {ps.tradeoffs?.length ? (
          <div className="mt-5 border-t pt-4">
            <div className="mb-3 text-[11.5px] font-bold tracking-[0.05em] uppercase" style={{ color: 'var(--faint)' }}>
              Tradeoffs named in this answer
            </div>
            <div className="space-y-2.5">
              {ps.tradeoffs.map((t, i) => (
                <div key={i} className="text-[14px] leading-relaxed">
                  <span className="font-semibold">{t.decision}</span>
                  <span style={{ color: 'var(--cost)' }}> → costs: </span>
                  <span style={{ color: 'var(--muted)' }}>{t.cost}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {ps.sayThis ? (
        <Callout variant="say-this">
          <Rich text={ps.sayThis} />
        </Callout>
      ) : null}
      {ps.trap ? (
        <Callout variant="trap">
          <Rich text={ps.trap} />
        </Callout>
      ) : null}

      {/* self-grade */}
      <div className="card mt-5 p-5">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="text-[15px] font-semibold">Which of these did you actually have?</h4>
          <span className="tabular text-[14px] font-bold" style={{ color: 'var(--accent)' }}>
            {checked.length} / {ps.checklist.length} → {score}/10
          </span>
        </div>
        <p className="mb-3 text-[13px]" style={{ color: 'var(--muted)' }}>
          Be honest — this is the number that drives your profile. Half-having it does not count, and
          thinking it does not count either. If you did not write it down, you did not say it.
        </p>
        {unsupported.size ? (
          <p
            className="mb-4 rounded-lg px-3 py-2 text-[13px] leading-relaxed"
            style={{ background: 'var(--say-bg)', color: 'var(--cost)' }}
          >
            {unsupported.size === 1 ? 'One ticked item does' : `${unsupported.size} ticked items do`} not
            appear anywhere in what you wrote. Marked below — untick if you were being generous.
          </p>
        ) : null}
        <div className="space-y-1">
          {ps.checklist.map((c, i) => {
            const on = checked.includes(i)
            return (
              <label
                key={i}
                className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition"
                style={{ background: on ? 'var(--surface-2)' : 'transparent' }}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onCheck(i)}
                  className="mt-[3px] h-4 w-4 shrink-0 accent-current"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span
                  className="text-[14px] leading-relaxed"
                  style={{ color: on ? 'var(--text)' : 'var(--muted)' }}
                >
                  {c}
                  {unsupported.has(i) ? (
                    <span
                      className="ml-2 rounded px-1.5 py-0.5 text-[10.5px] font-bold whitespace-nowrap"
                      style={{ background: 'var(--say-bg)', color: 'var(--cost)' }}
                      title="Nothing in your written answer mentions this"
                    >
                      NOT IN YOUR ANSWER
                    </span>
                  ) : null}
                </span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------- report card ---------- */

function ReportCard({
  problem,
  scores,
  stageIds,
  onGap,
}: {
  problem: Problem
  scores: Scores
  stageIds: StageId[]
  onGap: ReturnType<typeof useProgress>['addGap']
}) {
  const used = stageIds.map((id) => STAGE_AXIS[id])
  const active = AXES.filter((a) => used.includes(a))
  const avg = active.length ? active.reduce((s, a) => s + scores[a], 0) / active.length : 0
  const weakest = active.length ? active.reduce((m, a) => (scores[a] < scores[m] ? a : m), active[0]) : null

  return (
    <div className="fade-up">
      <div className="card mb-6 overflow-hidden">
        <div className="border-b px-6 py-5" style={{ background: 'var(--surface-2)' }}>
          <div className="text-[12px] font-bold tracking-[0.06em] uppercase" style={{ color: 'var(--accent)' }}>
            Report card
          </div>
          <h2 className="mt-1 text-[24px] font-bold">{problem.title}</h2>
        </div>

        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <Radar scores={scores} size={250} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex items-baseline gap-3">
              <span className="tabular text-[38px] leading-none font-bold">{avg.toFixed(1)}</span>
              <span className="text-[14px]" style={{ color: 'var(--muted)' }}>
                average across the stages you did
              </span>
            </div>
            <div className="space-y-2">
              {active.map((a) => {
                const v = scores[a]
                const tone = v < 5 ? 'var(--bad)' : v < 7 ? 'var(--warn)' : 'var(--ok)'
                return (
                  <div key={a} className="flex items-center gap-3">
                    <span className="w-[92px] shrink-0 text-[13px] font-medium">{AXIS_LABEL[a]}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                      <div className="h-full rounded-full" style={{ width: `${v * 10}%`, background: tone }} />
                    </div>
                    <span className="tabular w-9 shrink-0 text-right text-[13px] font-semibold">{v}</span>
                  </div>
                )
              })}
            </div>
            {weakest ? (
              <p className="mt-5 text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--text)' }}>Weakest axis: {AXIS_LABEL[weakest]}.</strong>{' '}
                {scores[weakest] < 5
                  ? 'This is the one to attack. Most people have one axis that is always red, and just seeing it is most of the fix.'
                  : 'Nothing here is failing. Push the lowest one up before adding new problems.'}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <GapLog source={problem.slug} onAdd={onGap} />
    </div>
  )
}

/* ============================================================
   the engine
   ============================================================ */

export function StageEngine({
  problem,
  stageIds,
  revealMode = 'immediate',
  timed = false,
}: {
  problem: Problem
  stageIds: StageId[]
  revealMode?: 'immediate' | 'end'
  timed?: boolean
}) {
  const { state, ready, saveStage, completeProblem, addGap, addMock } = useProgress()
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({})
  const [checked, setChecked] = useState<Record<number, number[]>>({})
  const [active, setActive] = useState<StageId>(stageIds[0])
  const [graded, setGraded] = useState(false)
  const hydrated = useRef(false)
  const saved = useRef(false)

  const archetype = state.archetype ? getArchetype(state.archetype) : null

  // restore a previous attempt so answers stay rereadable
  useEffect(() => {
    if (!ready || hydrated.current || revealMode === 'end') return
    hydrated.current = true
    const prev = state.problems[problem.slug]
    if (!prev) return
    const a: Record<number, string> = {}
    const s: Record<number, boolean> = {}
    const c: Record<number, number[]> = {}
    for (const id of stageIds) {
      const att = prev.stages[id]
      if (att) {
        a[id] = att.answer
        s[id] = true
        c[id] = att.checked
      }
    }
    if (Object.keys(s).length) {
      setAnswers(a)
      setSubmitted(s)
      setChecked(c)
      const next = stageIds.find((id) => !s[id])
      setActive(next ?? stageIds[stageIds.length - 1])
    }
  }, [ready, state.problems, problem.slug, stageIds, revealMode])

  const allSubmitted = stageIds.every((id) => submitted[id])
  const reveal = revealMode === 'immediate' || graded

  const scores = useMemo(() => {
    const out = {} as Scores
    for (const a of AXES) out[a] = 0
    for (const id of stageIds) {
      const ps = problem.stages.find((s) => s.id === id)!
      const n = checked[id]?.length ?? 0
      out[STAGE_AXIS[id]] = Math.round((n / ps.checklist.length) * 10)
    }
    return out
  }, [checked, stageIds, problem.stages])

  function submitStage(id: StageId) {
    setSubmitted((s) => ({ ...s, [id]: true }))
    setChecked((c) => ({ ...c, [id]: c[id] ?? [] }))
    if (revealMode === 'end') {
      const next = stageIds[stageIds.indexOf(id) + 1]
      if (next) setActive(next)
    }
  }

  function toggleCheck(id: StageId, i: number) {
    setChecked((c) => {
      const cur = c[id] ?? []
      const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]
      const ps = problem.stages.find((s) => s.id === id)!
      // persist as they grade, so a refresh does not lose it
      saveStage(
        problem.slug,
        id,
        answers[id] ?? '',
        next,
        ps.checklist.length,
        STAGE_AXIS[id],
        `${problem.title} — ${getStage(id).name}`,
      )
      return { ...c, [id]: next }
    })
  }

  function finishMock() {
    setGraded(true)
    setActive(stageIds[0])
  }

  // record the mock once the user has graded every stage
  useEffect(() => {
    if (revealMode !== 'end' || !graded || saved.current) return
    const allGraded = stageIds.every((id) => checked[id] !== undefined)
    if (!allGraded) return
    saved.current = true
    addMock({
      problemSlug: problem.slug,
      archetype: state.archetype,
      durationMs: 0,
      scores,
    })
  }, [graded, checked, revealMode, stageIds, scores, addMock, problem.slug, state.archetype])

  const doneAll = allSubmitted && (revealMode === 'immediate' || graded)

  useEffect(() => {
    if (doneAll && stageIds.length === 5) completeProblem(problem.slug)
  }, [doneAll, stageIds.length, completeProblem, problem.slug])

  const followUp = useMemo(() => {
    if (!archetype) return getFollowUp(problem.followUps[0])
    const preferred = problem.followUps
      .map(getFollowUp)
      .filter((f) => f && archetype.categories.includes(f.category))
    return preferred[0] ?? getFollowUp(problem.followUps[0])
  }, [archetype, problem.followUps])

  const archetypeNote = archetype
    ? `${archetype.name} — ${archetype.tagline} They will weight ${AXIS_LABEL[
        (Object.entries(archetype.weights).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ??
          'design') as Axis
      ].toLowerCase()} most heavily.`
    : undefined

  if (!ready) {
    return (
      <div className="py-16 text-center text-[14px]" style={{ color: 'var(--faint)' }}>
        Loading your progress…
      </div>
    )
  }

  return (
    <div>
      <Stepper stageIds={stageIds} active={active} submitted={submitted} onJump={setActive} />

      {revealMode === 'end' && allSubmitted && !graded ? (
        <div className="card fade-up mb-6 p-6 text-center">
          <h3 className="text-[19px] font-bold">All five stages submitted.</h3>
          <p className="mx-auto mt-2 mb-5 max-w-md text-[14.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            Nothing has been revealed yet — that was the point. Now go back through each stage, read the model
            answer, and mark honestly what you actually had.
          </p>
          <Button onClick={finishMock} size="lg">
            Reveal all five and grade myself
          </Button>
        </div>
      ) : null}

      <StageBlock
        problem={problem}
        stageId={active}
        answer={answers[active] ?? ''}
        onAnswer={(v) => setAnswers((a) => ({ ...a, [active]: v }))}
        submitted={!!submitted[active]}
        onSubmit={() => submitStage(active)}
        checked={checked[active] ?? []}
        onCheck={(i) => toggleCheck(active, i)}
        reveal={reveal}
        timed={timed}
        archetypeNote={active === stageIds[0] ? archetypeNote : undefined}
      />

      {/* move on */}
      {submitted[active] && reveal ? (
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <span className="text-[13.5px]" style={{ color: 'var(--muted)' }}>
            {stageIds.indexOf(active) < stageIds.length - 1
              ? 'Marked what you had? Next stage.'
              : 'That is the last stage.'}
          </span>
          {stageIds.indexOf(active) < stageIds.length - 1 ? (
            <Button onClick={() => setActive(stageIds[stageIds.indexOf(active) + 1])}>
              Next stage →
            </Button>
          ) : null}
        </div>
      ) : null}

      {doneAll ? (
        <div className="mt-10 border-t pt-10">
          <ReportCard problem={problem} scores={scores} stageIds={stageIds} onGap={addGap} />

          {followUp ? (
            <div className="mt-10">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 className="text-[19px] font-semibold">One follow-up before you go</h3>
                {archetype ? <Badge tone="accent">{archetype.name} would ask this</Badge> : null}
              </div>
              <p className="mb-4 text-[14.5px]" style={{ color: 'var(--muted)' }}>
                Interviews are lost in follow-ups, not in the first diagram. Defend what you just designed.
              </p>
              <FollowUpDrill followUp={followUp} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
