'use client'

import { useId, useState, type ReactNode } from 'react'
import type {
  CompareSpec,
  DiagramEdge,
  DiagramNode,
  DiagramSpec,
  FlowScenario,
  LifecycleSpec,
  NumbersBarSpec,
} from '@/lib/types'

/* ============================================================
   Figure — shared frame for every visual
   ============================================================ */

export function Figure({
  caption,
  children,
  actions,
}: {
  caption?: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <figure className="my-6">
      <div className="card overflow-hidden">
        <div className="overflow-x-auto p-4 sm:p-5">{children}</div>
        {actions ? (
          <div className="flex justify-end border-t px-3 py-2" style={{ background: 'var(--surface-2)' }}>
            {actions}
          </div>
        ) : null}
      </div>
      {caption ? (
        <figcaption className="mt-2 px-1 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

/* ============================================================
   Diagram — boxes and arrows
   ============================================================ */

const BOX_W = 138
const BOX_H = 58
const GAP_X = 58
const GAP_Y = 46
const PAD = 14

function nodeBox(n: DiagramNode) {
  const span = n.span ?? 1
  return {
    x: PAD + n.col * (BOX_W + GAP_X),
    y: PAD + n.row * (BOX_H + GAP_Y),
    w: BOX_W * span + GAP_X * (span - 1),
    h: BOX_H,
  }
}

const KIND_STYLE: Record<
  DiagramNode['kind'],
  { fill: string; stroke: string; dash?: string }
> = {
  client: { fill: 'var(--surface-2)', stroke: 'var(--border-strong)' },
  service: { fill: 'var(--surface)', stroke: 'var(--border-strong)' },
  store: { fill: 'var(--surface-2)', stroke: 'var(--border-strong)' },
  cache: { fill: 'var(--accent-soft)', stroke: 'var(--accent-line)' },
  queue: { fill: 'var(--surface-2)', stroke: 'var(--border-strong)' },
  external: { fill: 'transparent', stroke: 'var(--border-strong)', dash: '5 4' },
  note: { fill: 'transparent', stroke: 'transparent' },
}

/** where a line from `c` toward `t` leaves the box `b` */
function edgePoint(
  b: { x: number; y: number; w: number; h: number },
  tx: number,
  ty: number,
) {
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  const dx = tx - cx
  const dy = ty - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const sx = dx === 0 ? Infinity : b.w / 2 / Math.abs(dx)
  const sy = dy === 0 ? Infinity : b.h / 2 / Math.abs(dy)
  const s = Math.min(sx, sy)
  return { x: cx + dx * s, y: cy + dy * s }
}

export function Diagram({ spec }: { spec: DiagramSpec }) {
  const uid = useId().replace(/[:]/g, '')
  const boxes = new Map(spec.nodes.map((n) => [n.id, { node: n, box: nodeBox(n) }]))
  const cols = Math.max(...spec.nodes.map((n) => n.col + (n.span ?? 1)))
  const rows = Math.max(...spec.nodes.map((n) => n.row + 1))
  const width = PAD * 2 + cols * BOX_W + (cols - 1) * GAP_X
  const height = PAD * 2 + rows * BOX_H + (rows - 1) * GAP_Y

  return (
    <Figure caption={spec.caption}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: Math.min(width, 560), width: '100%', height: 'auto' }}
        role="img"
        aria-label={spec.caption}
      >
        <defs>
          <marker
            id={`arrow-${uid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-strong)" />
          </marker>
        </defs>

        {spec.edges.map((e: DiagramEdge, i) => {
          const a = boxes.get(e.from)
          const b = boxes.get(e.to)
          if (!a || !b) return null
          const ac = { x: a.box.x + a.box.w / 2, y: a.box.y + a.box.h / 2 }
          const bc = { x: b.box.x + b.box.w / 2, y: b.box.y + b.box.h / 2 }
          const p1 = edgePoint(a.box, bc.x, bc.y)
          const p2 = edgePoint(b.box, ac.x, ac.y)
          const mx = (p1.x + p2.x) / 2
          const my = (p1.y + p2.y) / 2
          const horizontal = Math.abs(p2.y - p1.y) < 6
          return (
            <g key={i}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="var(--border-strong)"
                strokeWidth="1.4"
                strokeDasharray={e.dashed ? '5 4' : undefined}
                markerEnd={`url(#arrow-${uid})`}
              />
              {e.label ? (
                <text
                  x={mx}
                  y={horizontal ? my - 7 : my}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontFamily="var(--font-ui)"
                  fill="var(--muted)"
                  style={{ paintOrder: 'stroke' }}
                  stroke="var(--bg)"
                  strokeWidth="4"
                >
                  {e.label}
                </text>
              ) : null}
            </g>
          )
        })}

        {spec.nodes.map((n) => {
          const b = nodeBox(n)
          const st = KIND_STYLE[n.kind]
          if (n.kind === 'note') {
            return (
              <text
                key={n.id}
                x={b.x}
                y={b.y + b.h / 2}
                fontSize="11"
                fontFamily="var(--font-ui)"
                fill="var(--faint)"
                fontStyle="italic"
              >
                {n.label}
              </text>
            )
          }
          return (
            <g key={n.id}>
              {n.kind === 'store' ? (
                <g>
                  <path
                    d={`M ${b.x} ${b.y + 8} a ${b.w / 2} 8 0 0 1 ${b.w} 0 v ${b.h - 16} a ${b.w / 2} 8 0 0 1 ${-b.w} 0 z`}
                    fill={st.fill}
                    stroke={st.stroke}
                    strokeWidth="1.3"
                  />
                  <path
                    d={`M ${b.x} ${b.y + 8} a ${b.w / 2} 8 0 0 0 ${b.w} 0`}
                    fill="none"
                    stroke={st.stroke}
                    strokeWidth="1.3"
                  />
                </g>
              ) : n.kind === 'queue' ? (
                <g>
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    rx="7"
                    fill={st.fill}
                    stroke={st.stroke}
                    strokeWidth="1.3"
                  />
                  {[0.24, 0.4, 0.56].map((f, i) => (
                    <line
                      key={i}
                      x1={b.x + b.w * f}
                      y1={b.y + 6}
                      x2={b.x + b.w * f}
                      y2={b.y + b.h - 6}
                      stroke={st.stroke}
                      strokeWidth="1"
                      opacity="0.5"
                    />
                  ))}
                </g>
              ) : (
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx={n.kind === 'client' ? 14 : 7}
                  fill={st.fill}
                  stroke={st.stroke}
                  strokeDasharray={st.dash}
                  strokeWidth="1.3"
                />
              )}
              <text
                x={b.x + b.w / 2}
                y={b.y + (n.sub ? b.h / 2 - 4 : b.h / 2 + 4)}
                textAnchor="middle"
                fontSize="12"
                fontWeight="550"
                fontFamily="var(--font-ui)"
                fill="var(--text)"
              >
                {n.label}
              </text>
              {n.sub ? (
                <text
                  x={b.x + b.w / 2}
                  y={b.y + b.h / 2 + 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--font-ui)"
                  fill="var(--muted)"
                >
                  {n.sub}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

/* ============================================================
   LifecycleChain — happy path solid, failures dropping below
   ============================================================ */

export function LifecycleChain({ spec }: { spec: LifecycleSpec }) {
  const uid = useId().replace(/[:]/g, '')
  const W = 128
  const H = 46
  const GAP = 46
  const TOP = 16
  const DROP = 62
  const width = PAD * 2 + spec.states.length * W + (spec.states.length - 1) * GAP
  const branchRows = new Map<string, number>()
  spec.failures.forEach((f) => {
    branchRows.set(f.after, (branchRows.get(f.after) ?? 0) + 1)
  })
  const maxBranch = Math.max(1, ...branchRows.values())
  const height = TOP + H + DROP * maxBranch + 34

  const xOf = (i: number) => PAD + i * (W + GAP)
  const seen = new Map<string, number>()

  return (
    <Figure caption={spec.caption}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: Math.min(width, 620), width: '100%', height: 'auto' }}
        role="img"
        aria-label={spec.caption}
      >
        <defs>
          <marker
            id={`lcarrow-${uid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border-strong)" />
          </marker>
          <marker
            id={`lcfail-${uid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--bad)" opacity="0.65" />
          </marker>
        </defs>

        {/* happy path */}
        {spec.states.slice(0, -1).map((_, i) => (
          <line
            key={i}
            x1={xOf(i) + W}
            y1={TOP + H / 2}
            x2={xOf(i + 1) - 4}
            y2={TOP + H / 2}
            stroke="var(--border-strong)"
            strokeWidth="1.6"
            markerEnd={`url(#lcarrow-${uid})`}
          />
        ))}

        {spec.states.map((s, i) => (
          <g key={s.id}>
            <rect
              x={xOf(i)}
              y={TOP}
              width={W}
              height={H}
              rx="8"
              fill="var(--surface-2)"
              stroke="var(--border-strong)"
              strokeWidth="1.3"
            />
            <text
              x={xOf(i) + W / 2}
              y={TOP + (s.by ? H / 2 - 3 : H / 2 + 4)}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="600"
              fontFamily="var(--font-ui)"
              fill="var(--text)"
            >
              {s.label}
            </text>
            {s.by ? (
              <text
                x={xOf(i) + W / 2}
                y={TOP + H / 2 + 12}
                textAnchor="middle"
                fontSize="9.5"
                fontFamily="var(--font-ui)"
                fill="var(--faint)"
              >
                {s.by}
              </text>
            ) : null}
          </g>
        ))}

        {/* failure branches */}
        {spec.failures.map((f, i) => {
          const idx = spec.states.findIndex((s) => s.id === f.after)
          if (idx < 0) return null
          const n = seen.get(f.after) ?? 0
          seen.set(f.after, n + 1)
          const x = xOf(idx) + W / 2
          const y0 = TOP + H
          const y1 = TOP + H + DROP * n + 30
          return (
            <g key={i} opacity="0.85">
              <path
                d={`M ${x} ${y0} V ${y1 - 14} q 0 8 8 8 H ${x + 18}`}
                fill="none"
                stroke="var(--bad)"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.55"
                markerEnd={`url(#lcfail-${uid})`}
              />
              <text
                x={x + 26}
                y={y1 - 2}
                fontSize="10.5"
                fontWeight="600"
                fontFamily="var(--font-ui)"
                fill="var(--bad)"
              >
                {f.label}
              </text>
              <text
                x={x + 26}
                y={y1 + 13}
                fontSize="10"
                fontFamily="var(--font-ui)"
                fill="var(--muted)"
              >
                {f.handling}
              </text>
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

/* ============================================================
   AnimatedFlow — looping CSS animation, pausable
   ============================================================ */

interface FlowNode {
  id: string
  label: string
  sub?: string
  x: number
  y: number
  w?: number
  kind?: DiagramNode['kind']
}

interface Trip {
  points: [number, number][]
  dur: number
  delay: number
  tone: 'accent' | 'ok' | 'bad' | 'muted'
  label?: string
}

interface FlowDef {
  w: number
  h: number
  nodes: FlowNode[]
  links: [number, number, number, number][]
  trips: Trip[]
  legend: { tone: Trip['tone']; text: string }[]
}

const TONE: Record<Trip['tone'], string> = {
  accent: 'var(--accent)',
  ok: 'var(--ok)',
  bad: 'var(--bad)',
  muted: 'var(--faint)',
}

const FLOWS: Record<FlowScenario, FlowDef> = {
  'cache-hit': {
    w: 460,
    h: 150,
    nodes: [
      { id: 'c', label: 'User', x: 20, y: 52, kind: 'client' },
      { id: 'k', label: 'Cache', sub: 'has it', x: 170, y: 52, kind: 'cache' },
      { id: 'd', label: 'Database', x: 320, y: 52, kind: 'store' },
    ],
    links: [
      [130, 78, 170, 78],
      [280, 78, 320, 78],
    ],
    trips: [
      { points: [[130, 78], [175, 78]], dur: 1.1, delay: 0, tone: 'accent' },
      { points: [[175, 78], [130, 78]], dur: 1.1, delay: 1.3, tone: 'ok' },
    ],
    legend: [
      { tone: 'accent', text: 'request in' },
      { tone: 'ok', text: 'answer back — the database never woke up' },
    ],
  },
  'cache-miss': {
    w: 460,
    h: 150,
    nodes: [
      { id: 'c', label: 'User', x: 20, y: 52, kind: 'client' },
      { id: 'k', label: 'Cache', sub: 'empty', x: 170, y: 52, kind: 'cache' },
      { id: 'd', label: 'Database', x: 320, y: 52, kind: 'store' },
    ],
    links: [
      [130, 78, 170, 78],
      [280, 78, 320, 78],
    ],
    trips: [
      { points: [[130, 78], [175, 78]], dur: 0.8, delay: 0, tone: 'accent' },
      { points: [[280, 78], [325, 78]], dur: 0.8, delay: 0.9, tone: 'bad' },
      { points: [[325, 78], [280, 78]], dur: 0.8, delay: 1.9, tone: 'muted' },
      { points: [[175, 78], [130, 78]], dur: 0.8, delay: 2.9, tone: 'ok' },
    ],
    legend: [
      { tone: 'bad', text: 'miss — now the database does the work' },
      { tone: 'ok', text: 'answer back, and the cache keeps a copy' },
    ],
  },
  'load-balancer': {
    w: 460,
    h: 210,
    nodes: [
      { id: 'c', label: 'Users', x: 20, y: 82, kind: 'client' },
      { id: 'lb', label: 'Balancer', x: 170, y: 82, kind: 'service' },
      { id: 's1', label: 'Server 1', x: 320, y: 20, kind: 'service' },
      { id: 's2', label: 'Server 2', x: 320, y: 82, kind: 'service' },
      { id: 's3', label: 'Server 3', x: 320, y: 144, kind: 'service' },
    ],
    links: [
      [130, 108, 170, 108],
      [280, 108, 300, 108],
      [300, 108, 300, 46],
      [300, 46, 320, 46],
      [300, 108, 320, 108],
      [300, 108, 300, 170],
      [300, 170, 320, 170],
    ],
    trips: [
      { points: [[130, 108], [280, 108], [300, 108], [300, 46], [322, 46]], dur: 1.6, delay: 0, tone: 'accent' },
      { points: [[130, 108], [280, 108], [322, 108]], dur: 1.6, delay: 0.55, tone: 'accent' },
      { points: [[130, 108], [280, 108], [300, 108], [300, 170], [322, 170]], dur: 1.6, delay: 1.1, tone: 'accent' },
    ],
    legend: [{ tone: 'accent', text: 'each request lands on whichever server is free' }],
  },
  'replication-lag': {
    w: 460,
    h: 200,
    nodes: [
      { id: 'w', label: 'Writer', x: 20, y: 24, kind: 'client' },
      { id: 'l', label: 'Leader', x: 170, y: 24, kind: 'store' },
      { id: 'f', label: 'Follower', sub: 'behind', x: 170, y: 128, kind: 'store' },
      { id: 'r', label: 'Reader', x: 320, y: 128, kind: 'client' },
    ],
    links: [
      [130, 50, 170, 50],
      [232, 82, 232, 128],
      [280, 154, 320, 154],
    ],
    trips: [
      { points: [[130, 50], [175, 50]], dur: 0.7, delay: 0, tone: 'accent' },
      { points: [[232, 82], [232, 126]], dur: 2.2, delay: 0.8, tone: 'muted' },
      { points: [[282, 154], [322, 154]], dur: 0.7, delay: 1.2, tone: 'bad' },
    ],
    legend: [
      { tone: 'accent', text: 'write lands on the leader instantly' },
      { tone: 'muted', text: 'copy crawls to the follower' },
      { tone: 'bad', text: 'a read in that gap sees the old value' },
    ],
  },
  'queue-drain': {
    w: 460,
    h: 160,
    nodes: [
      { id: 'p', label: 'Producer', sub: 'fast', x: 20, y: 56, kind: 'service' },
      { id: 'q', label: 'Queue', sub: 'backlog', x: 170, y: 56, kind: 'queue' },
      { id: 'w', label: 'Worker', sub: 'slow', x: 320, y: 56, kind: 'service' },
    ],
    links: [
      [130, 82, 170, 82],
      [280, 82, 320, 82],
    ],
    trips: [
      { points: [[130, 82], [175, 82]], dur: 0.5, delay: 0, tone: 'accent' },
      { points: [[130, 82], [175, 82]], dur: 0.5, delay: 0.4, tone: 'accent' },
      { points: [[130, 82], [175, 82]], dur: 0.5, delay: 0.8, tone: 'accent' },
      { points: [[130, 82], [175, 82]], dur: 0.5, delay: 1.2, tone: 'accent' },
      { points: [[280, 82], [325, 82]], dur: 1.5, delay: 0.3, tone: 'ok' },
      { points: [[280, 82], [325, 82]], dur: 1.5, delay: 2.1, tone: 'ok' },
    ],
    legend: [
      { tone: 'accent', text: 'four in' },
      { tone: 'ok', text: 'one out — the queue absorbs the difference, and grows' },
    ],
  },
  sharding: {
    w: 460,
    h: 210,
    nodes: [
      { id: 'c', label: 'Writes', x: 20, y: 82, kind: 'client' },
      { id: 'r', label: 'hash(key)', x: 170, y: 82, kind: 'service' },
      { id: 's1', label: 'Shard A', sub: 'a–h', x: 320, y: 20, kind: 'store' },
      { id: 's2', label: 'Shard B', sub: 'i–p', x: 320, y: 82, kind: 'store' },
      { id: 's3', label: 'Shard C', sub: 'q–z', x: 320, y: 144, kind: 'store' },
    ],
    links: [
      [130, 108, 170, 108],
      [280, 108, 300, 108],
      [300, 108, 300, 46],
      [300, 46, 320, 46],
      [300, 108, 320, 108],
      [300, 108, 300, 170],
      [300, 170, 320, 170],
    ],
    trips: [
      { points: [[130, 108], [280, 108], [300, 108], [300, 46], [322, 46]], dur: 1.7, delay: 0, tone: 'accent' },
      { points: [[130, 108], [280, 108], [300, 108], [300, 170], [322, 170]], dur: 1.7, delay: 0.7, tone: 'accent' },
      { points: [[130, 108], [280, 108], [322, 108]], dur: 1.7, delay: 1.4, tone: 'accent' },
    ],
    legend: [{ tone: 'accent', text: 'the key decides the shard — same key, same box, every time' }],
  },
  'fan-out-write': {
    w: 460,
    h: 210,
    nodes: [
      { id: 'a', label: 'Author', sub: 'posts once', x: 20, y: 82, kind: 'client' },
      { id: 'f', label: 'Fan-out', x: 170, y: 82, kind: 'service' },
      { id: 'i1', label: 'Inbox 1', x: 320, y: 20, kind: 'store' },
      { id: 'i2', label: 'Inbox 2', x: 320, y: 82, kind: 'store' },
      { id: 'i3', label: 'Inbox 3', x: 320, y: 144, kind: 'store' },
    ],
    links: [
      [130, 108, 170, 108],
      [280, 108, 300, 108],
      [300, 108, 300, 46],
      [300, 46, 320, 46],
      [300, 108, 320, 108],
      [300, 108, 300, 170],
      [300, 170, 320, 170],
    ],
    trips: [
      { points: [[130, 108], [280, 108]], dur: 0.8, delay: 0, tone: 'accent' },
      { points: [[300, 108], [300, 46], [322, 46]], dur: 0.9, delay: 0.85, tone: 'ok' },
      { points: [[300, 108], [322, 108]], dur: 0.9, delay: 0.85, tone: 'ok' },
      { points: [[300, 108], [300, 170], [322, 170]], dur: 0.9, delay: 0.85, tone: 'ok' },
    ],
    legend: [
      { tone: 'accent', text: 'one write in' },
      { tone: 'ok', text: 'many writes out — reads later are free' },
    ],
  },
  'rate-limit': {
    w: 460,
    h: 170,
    nodes: [
      { id: 'c', label: 'Caller', x: 20, y: 62, kind: 'client' },
      { id: 'b', label: 'Bucket', sub: 'tokens left: 1', x: 170, y: 62, kind: 'service' },
      { id: 's', label: 'API', x: 320, y: 62, kind: 'service' },
    ],
    links: [
      [130, 88, 170, 88],
      [280, 88, 320, 88],
    ],
    trips: [
      { points: [[130, 88], [280, 88], [322, 88]], dur: 1.4, delay: 0, tone: 'ok' },
      { points: [[130, 88], [230, 88]], dur: 0.9, delay: 0.9, tone: 'bad' },
      { points: [[130, 88], [230, 88]], dur: 0.9, delay: 1.6, tone: 'bad' },
    ],
    legend: [
      { tone: 'ok', text: 'a token was there — request passes' },
      { tone: 'bad', text: 'bucket empty — rejected at the door, cheaply' },
    ],
  },
}

function pathKeyframes(points: [number, number][]) {
  const lens: number[] = []
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
    lens.push(d)
    total += d
  }
  let acc = 0
  const stops = points.map((p, i) => {
    if (i > 0) acc += lens[i - 1]
    const pct = total === 0 ? 0 : (acc / total) * 100
    return `${pct.toFixed(2)}% { transform: translate(${p[0]}px, ${p[1]}px); }`
  })
  return stops.join('\n')
}

export function AnimatedFlow({
  scenario,
  caption,
}: {
  scenario: FlowScenario
  caption: string
}) {
  const [paused, setPaused] = useState(false)
  const uid = useId().replace(/[:]/g, '')
  const def = FLOWS[scenario]

  const css = def.trips
    .map(
      (t, i) => `@keyframes fl-${uid}-${i} {
  0% { opacity: 0; }
  8% { opacity: 1; }
  92% { opacity: 1; }
  100% { opacity: 0; }
${pathKeyframes(t.points)}
}`,
    )
    .join('\n')

  const cycle = Math.max(...def.trips.map((t) => t.dur + t.delay)) + 0.9

  return (
    <Figure
      caption={caption}
      actions={
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="rounded-md px-2.5 py-1 text-[12px] font-medium transition hover:opacity-70"
          style={{ color: 'var(--muted)' }}
          aria-pressed={paused}
        >
          {paused ? '▶ Play' : '❚❚ Pause'}
        </button>
      }
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <svg
        viewBox={`0 0 ${def.w} ${def.h}`}
        style={{ minWidth: Math.min(def.w, 440), width: '100%', height: 'auto' }}
        className={paused ? 'anim-paused' : undefined}
        role="img"
        aria-label={caption}
      >
        {def.links.map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--border-strong)"
            strokeWidth="1.3"
          />
        ))}

        {def.nodes.map((n) => {
          const w = n.w ?? 110
          const h = 52
          const st = KIND_STYLE[n.kind ?? 'service']
          return (
            <g key={n.id}>
              <rect
                x={n.x}
                y={n.y}
                width={w}
                height={h}
                rx={n.kind === 'client' ? 13 : 7}
                fill={st.fill}
                stroke={st.stroke}
                strokeWidth="1.3"
              />
              <text
                x={n.x + w / 2}
                y={n.y + (n.sub ? h / 2 - 3 : h / 2 + 4)}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight="600"
                fontFamily="var(--font-ui)"
                fill="var(--text)"
              >
                {n.label}
              </text>
              {n.sub ? (
                <text
                  x={n.x + w / 2}
                  y={n.y + h / 2 + 12}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontFamily="var(--font-ui)"
                  fill="var(--muted)"
                >
                  {n.sub}
                </text>
              ) : null}
            </g>
          )
        })}

        {def.trips.map((t, i) => (
          <circle
            key={i}
            r="5"
            fill={TONE[t.tone]}
            style={{
              animation: `fl-${uid}-${i} ${cycle}s linear ${t.delay}s infinite`,
              animationDuration: `${cycle}s`,
            }}
          />
        ))}
      </svg>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {def.legend.map((l, i) => (
          <span key={i} className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--muted)' }}>
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: TONE[l.tone] }}
            />
            {l.text}
          </span>
        ))}
      </div>
    </Figure>
  )
}

/* ============================================================
   CompareCards
   ============================================================ */

export function CompareCards({ spec }: { spec: CompareSpec }) {
  return (
    <figure className="my-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {[spec.a, spec.b].map((side, i) => (
          <div key={i} className="card p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                {i === 0 ? 'A' : 'B'}
              </span>
              <h4 className="text-[14.5px] font-semibold">{side.title}</h4>
            </div>
            <ul className="space-y-1.5">
              {side.points.map((p, j) => (
                <li key={j} className="flex gap-2 text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  <span style={{ color: 'var(--border-strong)' }}>—</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        className="mt-3 rounded-lg border px-4 py-3 text-[13.5px] leading-relaxed"
        style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
      >
        <strong style={{ color: 'var(--text)' }}>Which one: </strong>
        {spec.verdict}
      </div>
      <figcaption className="mt-2 px-1 text-[13px]" style={{ color: 'var(--faint)' }}>
        {spec.caption}
      </figcaption>
    </figure>
  )
}

/* ============================================================
   NumbersBar
   ============================================================ */

export function NumbersBar({ spec }: { spec: NumbersBarSpec }) {
  const max = Math.max(...spec.items.map((i) => i.value))
  return (
    <figure className="my-6">
      <div className="card p-4 sm:p-5">
        <div className="space-y-3">
          {spec.items.map((it, i) => {
            const pct = max === 0 ? 0 : Math.max(1.2, (it.value / max) * 100)
            const color =
              it.tone === 'bad'
                ? 'var(--bad)'
                : it.tone === 'muted'
                  ? 'var(--border-strong)'
                  : 'var(--accent)'
            return (
              <div key={i}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
                    {it.label}
                  </span>
                  <span className="tabular text-[13px] font-semibold">{it.display}</span>
                </div>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: color, opacity: it.tone === 'muted' ? 0.6 : 1 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {spec.note ? (
          <p className="mt-4 border-t pt-3 text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {spec.note}
          </p>
        ) : null}
      </div>
      <figcaption className="mt-2 px-1 text-[13px]" style={{ color: 'var(--faint)' }}>
        {spec.caption}
      </figcaption>
    </figure>
  )
}

/* ============================================================
   Callout
   ============================================================ */

const CALLOUT: Record<
  'cost' | 'trap' | 'say-this',
  { label: string; color: string; bg: string; icon: ReactNode }
> = {
  cost: {
    label: 'What it costs you',
    color: 'var(--cost)',
    bg: 'var(--cost-bg)',
    icon: (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="8" cy="8" r="6.2" />
        <path d="M8 4.6v4.2M8 11.2h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  trap: {
    label: 'Common trap',
    color: 'var(--trap)',
    bg: 'var(--trap-bg)',
    icon: (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M8 2.2 14.4 13H1.6L8 2.2z" strokeLinejoin="round" />
        <path d="M8 6.4v3M8 11.4h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  'say-this': {
    label: 'Say this',
    color: 'var(--say)',
    bg: 'var(--say-bg)',
    icon: (
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2.4 4.4a1.6 1.6 0 0 1 1.6-1.6h8a1.6 1.6 0 0 1 1.6 1.6v5a1.6 1.6 0 0 1-1.6 1.6H6.6L3.4 13.4V11H4a1.6 1.6 0 0 1-1.6-1.6z" strokeLinejoin="round" />
      </svg>
    ),
  },
}

export function Callout({
  variant,
  title,
  children,
}: {
  variant: 'cost' | 'trap' | 'say-this'
  title?: string
  children: ReactNode
}) {
  const c = CALLOUT[variant]
  return (
    <div
      className="my-4 rounded-xl border px-4 py-3.5"
      style={{ background: c.bg, borderColor: 'transparent' }}
    >
      <div className="mb-1.5 flex items-center gap-1.5" style={{ color: c.color }}>
        {c.icon}
        <span className="text-[11px] font-bold tracking-[0.07em] uppercase">{title ?? c.label}</span>
      </div>
      <div
        className={variant === 'say-this' ? 'prose text-[15px] italic' : 'prose text-[15px]'}
        style={{ color: 'var(--text)' }}
      >
        {children}
      </div>
    </div>
  )
}
