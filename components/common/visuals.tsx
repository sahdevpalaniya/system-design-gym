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
        <div className="flex justify-center overflow-x-auto p-3 sm:p-4">
          <div className="w-full" style={{ maxWidth: MAX_FIGURE_W }}>
            {children}
          </div>
        </div>
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

const BOX_W = 108
const BOX_H = 46
const GAP_X = 42
const GAP_Y = 34
const PAD = 12
/** diagrams stop growing past this, so they stay readable on a wide screen */
const MAX_FIGURE_W = 640

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
        style={{ width: '100%', maxWidth: Math.min(width, MAX_FIGURE_W), height: 'auto' }}
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
                  fontSize="9"
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
                fontSize="9.5"
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
                y={b.y + (n.sub ? b.h / 2 - 3 : b.h / 2 + 3.5)}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fontFamily="var(--font-ui)"
                fill="var(--text)"
              >
                {n.label}
              </text>
              {n.sub ? (
                <text
                  x={b.x + b.w / 2}
                  y={b.y + b.h / 2 + 9}
                  textAnchor="middle"
                  fontSize="8.5"
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
  const W = 104
  const H = 40
  const GAP = 34
  const TOP = 14
  const DROP = 54
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
        style={{ width: '100%', minWidth: 460, height: 'auto' }}
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
              y={TOP + (s.by ? H / 2 - 2 : H / 2 + 3.5)}
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="600"
              fontFamily="var(--font-ui)"
              fill="var(--text)"
            >
              {s.label}
            </text>
            {s.by ? (
              <text
                x={xOf(i) + W / 2}
                y={TOP + H / 2 + 9}
                textAnchor="middle"
                fontSize="8"
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
                fontSize="9"
                fontWeight="600"
                fontFamily="var(--font-ui)"
                fill="var(--bad)"
              >
                {f.label}
              </text>
              <text
                x={x + 26}
                y={y1 + 11}
                fontSize="8.5"
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
  'round-robin': {
    w: 460,
    h: 210,
    nodes: [
      { id: 'c', label: 'Requests', x: 20, y: 82, kind: 'client' },
      { id: 'lb', label: 'Round robin', sub: '1,2,3,1,2,3…', x: 170, y: 82, kind: 'service' },
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
      { points: [[130, 108], [300, 108], [300, 46], [322, 46]], dur: 1.4, delay: 0, tone: 'accent' },
      { points: [[130, 108], [322, 108]], dur: 1.4, delay: 0.5, tone: 'accent' },
      { points: [[130, 108], [300, 108], [300, 170], [322, 170]], dur: 1.4, delay: 1.0, tone: 'accent' },
      { points: [[130, 108], [300, 108], [300, 46], [322, 46]], dur: 1.4, delay: 1.5, tone: 'accent' },
    ],
    legend: [{ tone: 'accent', text: 'strict rotation — each server takes the next request in turn, regardless of how busy it is' }],
  },
  'least-connections': {
    w: 460,
    h: 210,
    nodes: [
      { id: 'c', label: 'Requests', x: 20, y: 82, kind: 'client' },
      { id: 'lb', label: 'Least conns', sub: 'picks the idle one', x: 170, y: 82, kind: 'service' },
      { id: 's1', label: 'Server 1', sub: '8 open', x: 320, y: 20, kind: 'service' },
      { id: 's2', label: 'Server 2', sub: '1 open', x: 320, y: 82, kind: 'service' },
      { id: 's3', label: 'Server 3', sub: '7 open', x: 320, y: 144, kind: 'service' },
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
      { points: [[130, 108], [322, 108]], dur: 1.3, delay: 0, tone: 'ok' },
      { points: [[130, 108], [322, 108]], dur: 1.3, delay: 0.6, tone: 'ok' },
      { points: [[130, 108], [322, 108]], dur: 1.3, delay: 1.2, tone: 'ok' },
    ],
    legend: [{ tone: 'ok', text: 'every request goes to the server with fewest open connections — right when requests take wildly different times' }],
  },
  'ip-hash': {
    w: 460,
    h: 210,
    nodes: [
      { id: 'c', label: 'Same user', sub: 'same IP', x: 20, y: 82, kind: 'client' },
      { id: 'lb', label: 'hash(IP)', x: 170, y: 82, kind: 'service' },
      { id: 's1', label: 'Server 1', x: 320, y: 20, kind: 'service' },
      { id: 's2', label: 'Server 2', sub: 'always this one', x: 320, y: 82, kind: 'service' },
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
      { points: [[130, 108], [322, 108]], dur: 1.2, delay: 0, tone: 'accent' },
      { points: [[130, 108], [322, 108]], dur: 1.2, delay: 0.7, tone: 'accent' },
      { points: [[130, 108], [322, 108]], dur: 1.2, delay: 1.4, tone: 'accent' },
    ],
    legend: [{ tone: 'accent', text: 'the same client always lands on the same server — good for cache locality, bad when that server dies' }],
  },
  weighted: {
    w: 460,
    h: 210,
    nodes: [
      { id: 'c', label: 'Requests', x: 20, y: 82, kind: 'client' },
      { id: 'lb', label: 'Weighted', sub: '3 : 1 : 1', x: 170, y: 82, kind: 'service' },
      { id: 's1', label: 'Big server', sub: 'weight 3', x: 320, y: 20, kind: 'service' },
      { id: 's2', label: 'Small', sub: 'weight 1', x: 320, y: 82, kind: 'service' },
      { id: 's3', label: 'Small', sub: 'weight 1', x: 320, y: 144, kind: 'service' },
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
      { points: [[130, 108], [300, 108], [300, 46], [322, 46]], dur: 1.2, delay: 0, tone: 'accent' },
      { points: [[130, 108], [300, 108], [300, 46], [322, 46]], dur: 1.2, delay: 0.4, tone: 'accent' },
      { points: [[130, 108], [300, 108], [300, 46], [322, 46]], dur: 1.2, delay: 0.8, tone: 'accent' },
      { points: [[130, 108], [322, 108]], dur: 1.2, delay: 1.2, tone: 'muted' },
      { points: [[130, 108], [300, 108], [300, 170], [322, 170]], dur: 1.2, delay: 1.6, tone: 'muted' },
    ],
    legend: [{ tone: 'accent', text: 'a bigger machine gets proportionally more traffic — use when your fleet is not uniform' }],
  },
  'health-check': {
    w: 460,
    h: 210,
    nodes: [
      { id: 'lb', label: 'Balancer', sub: 'probes every 2s', x: 20, y: 82, kind: 'service' },
      { id: 's1', label: 'Server 1', sub: 'healthy', x: 200, y: 20, kind: 'service' },
      { id: 's2', label: 'Server 2', sub: 'FAILING', x: 200, y: 82, kind: 'external' },
      { id: 's3', label: 'Server 3', sub: 'healthy', x: 200, y: 144, kind: 'service' },
    ],
    links: [
      [130, 108, 180, 108],
      [180, 108, 180, 46],
      [180, 46, 200, 46],
      [180, 108, 200, 108],
      [180, 108, 180, 170],
      [180, 170, 200, 170],
    ],
    trips: [
      { points: [[130, 108], [180, 108], [180, 46], [202, 46]], dur: 1.1, delay: 0, tone: 'ok' },
      { points: [[130, 108], [180, 108], [180, 170], [202, 170]], dur: 1.1, delay: 0.5, tone: 'ok' },
      { points: [[130, 108], [175, 108]], dur: 0.8, delay: 1.0, tone: 'bad' },
    ],
    legend: [
      { tone: 'ok', text: 'healthy servers keep receiving traffic' },
      { tone: 'bad', text: 'the failing one is probed, does not answer, and is pulled from the pool' },
    ],
  },
  'active-passive': {
    w: 460,
    h: 170,
    nodes: [
      { id: 'c', label: 'Traffic', x: 20, y: 62, kind: 'client' },
      { id: 'a', label: 'Active', sub: 'serving', x: 180, y: 20, kind: 'service' },
      { id: 'p', label: 'Standby', sub: 'idle, waiting', x: 180, y: 100, kind: 'external' },
    ],
    links: [
      [130, 88, 160, 88],
      [160, 88, 160, 46],
      [160, 46, 180, 46],
      [160, 88, 160, 126],
      [160, 126, 180, 126],
      [235, 72, 235, 100],
    ],
    trips: [
      { points: [[130, 88], [160, 88], [160, 46], [182, 46]], dur: 1.2, delay: 0, tone: 'ok' },
      { points: [[130, 88], [160, 88], [160, 46], [182, 46]], dur: 1.2, delay: 0.6, tone: 'ok' },
      { points: [[235, 72], [235, 98]], dur: 1.4, delay: 0.3, tone: 'muted' },
    ],
    legend: [
      { tone: 'ok', text: 'all traffic goes to the active node' },
      { tone: 'muted', text: 'the standby only copies state — it is never proven by real traffic until the day it has to take over' },
    ],
  },
  'active-active': {
    w: 460,
    h: 170,
    nodes: [
      { id: 'c', label: 'Traffic', x: 20, y: 62, kind: 'client' },
      { id: 'a', label: 'Node A', sub: 'serving', x: 180, y: 20, kind: 'service' },
      { id: 'b', label: 'Node B', sub: 'also serving', x: 180, y: 100, kind: 'service' },
    ],
    links: [
      [130, 88, 160, 88],
      [160, 88, 160, 46],
      [160, 46, 180, 46],
      [160, 88, 160, 126],
      [160, 126, 180, 126],
    ],
    trips: [
      { points: [[130, 88], [160, 88], [160, 46], [182, 46]], dur: 1.2, delay: 0, tone: 'ok' },
      { points: [[130, 88], [160, 88], [160, 126], [182, 126]], dur: 1.2, delay: 0.5, tone: 'ok' },
      { points: [[130, 88], [160, 88], [160, 46], [182, 46]], dur: 1.2, delay: 1.0, tone: 'ok' },
      { points: [[130, 88], [160, 88], [160, 126], [182, 126]], dur: 1.2, delay: 1.5, tone: 'ok' },
    ],
    legend: [{ tone: 'ok', text: 'both nodes serve constantly, so both are continuously proven to work — and losing one halves capacity, not availability' }],
  },
  'write-through': {
    w: 460,
    h: 150,
    nodes: [
      { id: 'a', label: 'Write', x: 20, y: 52, kind: 'client' },
      { id: 'k', label: 'Cache', sub: 'updated first', x: 170, y: 52, kind: 'cache' },
      { id: 'd', label: 'Database', x: 320, y: 52, kind: 'store' },
    ],
    links: [
      [130, 78, 170, 78],
      [280, 78, 320, 78],
    ],
    trips: [
      { points: [[130, 78], [175, 78]], dur: 0.9, delay: 0, tone: 'accent' },
      { points: [[280, 78], [325, 78]], dur: 0.9, delay: 0.9, tone: 'accent' },
      { points: [[325, 78], [130, 78]], dur: 1.0, delay: 1.9, tone: 'ok' },
    ],
    legend: [
      { tone: 'accent', text: 'cache and database are both written before the user is told it worked' },
      { tone: 'ok', text: 'never stale — and every write pays both costs' },
    ],
  },
  'write-back': {
    w: 460,
    h: 150,
    nodes: [
      { id: 'a', label: 'Write', x: 20, y: 52, kind: 'client' },
      { id: 'k', label: 'Cache', sub: 'confirms now', x: 170, y: 52, kind: 'cache' },
      { id: 'd', label: 'Database', sub: 'written later', x: 320, y: 52, kind: 'store' },
    ],
    links: [
      [130, 78, 170, 78],
      [280, 78, 320, 78],
    ],
    trips: [
      { points: [[130, 78], [175, 78]], dur: 0.6, delay: 0, tone: 'accent' },
      { points: [[175, 78], [130, 78]], dur: 0.6, delay: 0.6, tone: 'ok' },
      { points: [[280, 78], [325, 78]], dur: 1.6, delay: 1.6, tone: 'muted' },
    ],
    legend: [
      { tone: 'ok', text: 'the user is told it worked as soon as the cache has it — fast' },
      { tone: 'muted', text: 'the database catches up afterwards, so a crash in that gap loses the write' },
    ],
  },
  'cdn-pull': {
    w: 460,
    h: 170,
    nodes: [
      { id: 'u', label: 'First user', x: 20, y: 62, kind: 'client' },
      { id: 'e', label: 'Edge', sub: 'empty, fetches', x: 180, y: 62, kind: 'cache' },
      { id: 'o', label: 'Origin', x: 330, y: 62, kind: 'service' },
    ],
    links: [
      [130, 88, 180, 88],
      [290, 88, 330, 88],
    ],
    trips: [
      { points: [[130, 88], [185, 88]], dur: 0.8, delay: 0, tone: 'accent' },
      { points: [[290, 88], [335, 88]], dur: 0.8, delay: 0.9, tone: 'bad' },
      { points: [[335, 88], [185, 88]], dur: 0.9, delay: 1.8, tone: 'muted' },
      { points: [[185, 88], [130, 88]], dur: 0.7, delay: 2.8, tone: 'ok' },
    ],
    legend: [
      { tone: 'bad', text: 'the first request pays a trip to origin — this user is the one who suffers' },
      { tone: 'ok', text: 'the edge keeps a copy, so everyone after them is fast' },
    ],
  },
  'cdn-push': {
    w: 460,
    h: 170,
    nodes: [
      { id: 'o', label: 'You deploy', x: 20, y: 62, kind: 'service' },
      { id: 'e', label: 'Edge', sub: 'preloaded', x: 180, y: 62, kind: 'cache' },
      { id: 'u', label: 'Every user', x: 330, y: 62, kind: 'client' },
    ],
    links: [
      [130, 88, 180, 88],
      [290, 88, 330, 88],
    ],
    trips: [
      { points: [[130, 88], [185, 88]], dur: 1.2, delay: 0, tone: 'muted' },
      { points: [[290, 88], [335, 88]], dur: 0.7, delay: 1.4, tone: 'ok' },
      { points: [[290, 88], [335, 88]], dur: 0.7, delay: 2.1, tone: 'ok' },
    ],
    legend: [
      { tone: 'muted', text: 'you push content out ahead of demand' },
      { tone: 'ok', text: 'nobody ever pays the first-request penalty — and you pay to store things nobody may request' },
    ],
  },
  'leader-follower': {
    w: 460,
    h: 200,
    nodes: [
      { id: 'w', label: 'Writes', x: 20, y: 24, kind: 'client' },
      { id: 'l', label: 'Leader', sub: 'all writes', x: 180, y: 24, kind: 'store' },
      { id: 'f1', label: 'Follower', sub: 'reads', x: 330, y: 24, kind: 'store' },
      { id: 'f2', label: 'Follower', sub: 'reads', x: 330, y: 110, kind: 'store' },
      { id: 'r', label: 'Reads', x: 20, y: 110, kind: 'client' },
    ],
    links: [
      [130, 50, 180, 50],
      [290, 50, 330, 50],
      [235, 76, 235, 136],
      [235, 136, 330, 136],
      [130, 136, 235, 136],
    ],
    trips: [
      { points: [[130, 50], [185, 50]], dur: 0.8, delay: 0, tone: 'accent' },
      { points: [[290, 50], [332, 50]], dur: 1.0, delay: 0.9, tone: 'muted' },
      { points: [[235, 76], [235, 134], [332, 134]], dur: 1.2, delay: 0.9, tone: 'muted' },
      { points: [[130, 136], [230, 136]], dur: 0.9, delay: 1.6, tone: 'ok' },
    ],
    legend: [
      { tone: 'accent', text: 'every write goes to the one leader' },
      { tone: 'muted', text: 'followers copy from it, always slightly behind' },
      { tone: 'ok', text: 'reads spread across followers — which is why replication scales reads and not writes' },
    ],
  },
  'multi-leader': {
    w: 460,
    h: 200,
    nodes: [
      { id: 'u1', label: 'Europe', x: 20, y: 24, kind: 'client' },
      { id: 'l1', label: 'Leader EU', sub: 'accepts writes', x: 170, y: 24, kind: 'store' },
      { id: 'l2', label: 'Leader US', sub: 'accepts writes', x: 170, y: 120, kind: 'store' },
      { id: 'u2', label: 'America', x: 20, y: 120, kind: 'client' },
      { id: 'x', label: 'conflict!', x: 330, y: 72, kind: 'note' },
    ],
    links: [
      [130, 50, 170, 50],
      [130, 146, 170, 146],
      [225, 76, 225, 120],
    ],
    trips: [
      { points: [[130, 50], [175, 50]], dur: 0.8, delay: 0, tone: 'accent' },
      { points: [[130, 146], [175, 146]], dur: 0.8, delay: 0.2, tone: 'accent' },
      { points: [[225, 76], [225, 118]], dur: 1.4, delay: 1.0, tone: 'bad' },
      { points: [[225, 118], [225, 78]], dur: 1.4, delay: 1.0, tone: 'bad' },
    ],
    legend: [
      { tone: 'accent', text: 'both regions take writes locally, so both are fast' },
      { tone: 'bad', text: 'the same row edited in two places at once — now you own a conflict to resolve' },
    ],
  },
  'consistent-hash-ring': {
    w: 460,
    h: 210,
    nodes: [
      { id: 'k', label: 'Keys', x: 20, y: 82, kind: 'client' },
      { id: 'r', label: 'Hash ring', sub: 'clockwise', x: 170, y: 82, kind: 'service' },
      { id: 'a', label: 'Node A', x: 320, y: 20, kind: 'store' },
      { id: 'b', label: 'Node B', sub: 'NEW', x: 320, y: 82, kind: 'cache' },
      { id: 'c', label: 'Node C', x: 320, y: 144, kind: 'store' },
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
      { points: [[130, 108], [300, 108], [300, 46], [322, 46]], dur: 1.4, delay: 0, tone: 'muted' },
      { points: [[130, 108], [322, 108]], dur: 1.4, delay: 0.6, tone: 'accent' },
      { points: [[130, 108], [300, 108], [300, 170], [322, 170]], dur: 1.4, delay: 1.2, tone: 'muted' },
    ],
    legend: [
      { tone: 'muted', text: 'most keys keep the home they already had' },
      { tone: 'accent', text: 'only the slice behind the new node moves — about 1/N of keys, not all of them' },
    ],
  },
  'two-phase-commit': {
    w: 460,
    h: 200,
    nodes: [
      { id: 'c', label: 'Coordinator', x: 20, y: 72, kind: 'service' },
      { id: 'a', label: 'Service A', sub: 'holds locks', x: 200, y: 20, kind: 'store' },
      { id: 'b', label: 'Service B', sub: 'holds locks', x: 200, y: 120, kind: 'store' },
    ],
    links: [
      [130, 98, 180, 98],
      [180, 98, 180, 46],
      [180, 46, 200, 46],
      [180, 98, 180, 146],
      [180, 146, 200, 146],
    ],
    trips: [
      { points: [[130, 98], [180, 98], [180, 46], [202, 46]], dur: 0.9, delay: 0, tone: 'accent' },
      { points: [[130, 98], [180, 98], [180, 146], [202, 146]], dur: 0.9, delay: 0, tone: 'accent' },
      { points: [[202, 46], [180, 46], [180, 98], [132, 98]], dur: 0.9, delay: 1.0, tone: 'ok' },
      { points: [[130, 98], [180, 98], [180, 46], [202, 46]], dur: 0.9, delay: 2.2, tone: 'muted' },
    ],
    legend: [
      { tone: 'accent', text: 'phase 1 — "can you commit?" Everyone locks and waits' },
      { tone: 'ok', text: 'all say yes' },
      { tone: 'muted', text: 'phase 2 — commit. If the coordinator dies between the two, everyone is stuck holding locks' },
    ],
  },
  saga: {
    w: 460,
    h: 180,
    nodes: [
      { id: 's', label: 'Reserve', sub: 'stock', x: 20, y: 30, kind: 'service' },
      { id: 'p', label: 'Charge', sub: 'card', x: 175, y: 30, kind: 'service' },
      { id: 'd', label: 'Book', sub: 'courier', x: 330, y: 30, kind: 'service' },
      { id: 'u', label: 'undo: refund, release stock', x: 20, y: 118, kind: 'note' },
    ],
    links: [
      [130, 56, 175, 56],
      [285, 56, 330, 56],
    ],
    trips: [
      { points: [[130, 56], [178, 56]], dur: 0.8, delay: 0, tone: 'ok' },
      { points: [[285, 56], [332, 56]], dur: 0.8, delay: 0.9, tone: 'ok' },
      { points: [[332, 90], [130, 90]], dur: 1.6, delay: 1.9, tone: 'bad' },
    ],
    legend: [
      { tone: 'ok', text: 'each step commits locally — nothing blocks, nothing holds locks' },
      { tone: 'bad', text: 'if a later step fails, compensating actions run backwards to undo the earlier ones' },
    ],
  },
  'circuit-breaker': {
    w: 460,
    h: 160,
    nodes: [
      { id: 'c', label: 'Your service', x: 20, y: 56, kind: 'service' },
      { id: 'b', label: 'Breaker', sub: 'OPEN', x: 190, y: 56, kind: 'service' },
      { id: 'd', label: 'Sick dependency', sub: 'timing out', x: 330, y: 56, kind: 'external' },
    ],
    links: [
      [130, 82, 190, 82],
      [300, 82, 330, 82],
    ],
    trips: [
      { points: [[130, 82], [245, 82]], dur: 0.7, delay: 0, tone: 'bad' },
      { points: [[245, 82], [130, 82]], dur: 0.5, delay: 0.7, tone: 'accent' },
      { points: [[130, 82], [245, 82]], dur: 0.7, delay: 1.4, tone: 'bad' },
      { points: [[245, 82], [130, 82]], dur: 0.5, delay: 2.1, tone: 'accent' },
    ],
    legend: [
      { tone: 'bad', text: 'calls reach the breaker' },
      { tone: 'accent', text: 'and fail instantly instead of waiting 30 seconds — the sick dependency is never touched, so it gets room to recover' },
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
        style={{ width: '100%', maxWidth: MAX_FIGURE_W, height: 'auto' }}
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
                fontSize="10"
                fontWeight="600"
                fontFamily="var(--font-ui)"
                fill="var(--text)"
              >
                {n.label}
              </text>
              {n.sub ? (
                <text
                  x={n.x + w / 2}
                  y={n.y + h / 2 + 11}
                  textAnchor="middle"
                  fontSize="8.5"
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
