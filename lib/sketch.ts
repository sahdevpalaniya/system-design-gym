import type { DiagramSpec, NodeKind } from './types'

/**
 * Turn a few lines of arrows into a diagram.
 *
 * Real interviews are visual and this app is entirely prose, so the one thing
 * it never made you do was produce a picture. This is the smallest thing that
 * fixes that: you type the boxes and arrows the way you would say them, and it
 * draws them, so you find out whether your design actually connects up.
 *
 *   client -> lb -> app -> db
 *   app -> cache: hit 99%
 *   app -> queue
 *
 * Deliberately not a diagram editor. If it needs more than arrows, the design
 * has more boxes than an interview has minutes.
 */

const KINDS: [NodeKind, RegExp][] = [
  ['client', /^(user|users|client|clients|browser|phone|device|visitor|app user|mobile)$/i],
  ['cache', /(cache|redis|memcache|cdn|edge)/i],
  ['queue', /(queue|kafka|topic|stream|broker|sqs|bus)/i],
  ['store', /(db|database|store|storage|postgres|mysql|dynamo|cassandra|s3|bucket|table|index|log)/i],
  ['external', /(provider|vendor|third|external|partner|stripe|twilio|apns|fcm|payment gateway)/i],
]

function kindOf(label: string): NodeKind {
  for (const [kind, re] of KINDS) if (re.test(label.trim())) return kind
  return 'service'
}

function key(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ')
}

export interface SketchResult {
  spec: DiagramSpec | null
  /** things worth telling the reader — never errors that block rendering */
  notes: string[]
}

export function parseSketch(text: string): SketchResult {
  const notes: string[] = []
  const labels = new Map<string, string>()
  const edges: { from: string; to: string; label?: string }[] = []

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue

    // an optional ": label" applies to the last arrow on the line
    const colon = line.lastIndexOf(':')
    const arrowsEnd = line.lastIndexOf('->')
    const hasLabel = colon > arrowsEnd && arrowsEnd !== -1
    const body = hasLabel ? line.slice(0, colon) : line
    const edgeLabel = hasLabel ? line.slice(colon + 1).trim() : undefined

    const parts = body.split('->').map((p) => p.trim()).filter(Boolean)
    if (parts.length < 2) {
      if (parts.length === 1) {
        const k = key(parts[0])
        if (!labels.has(k)) labels.set(k, parts[0])
      }
      continue
    }
    for (const p of parts) if (!labels.has(key(p))) labels.set(key(p), p)
    for (let i = 0; i < parts.length - 1; i++) {
      edges.push({
        from: key(parts[i]),
        to: key(parts[i + 1]),
        label: i === parts.length - 2 ? edgeLabel : undefined,
      })
    }
  }

  if (!labels.size) return { spec: null, notes }

  // column = longest path from any node with no incoming edge; ties break by order
  const ids = [...labels.keys()]
  const incoming = new Map(ids.map((id) => [id, 0]));
  for (const e of edges) incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1)

  const col = new Map(ids.map((id) => [id, 0]))
  // relax repeatedly; bounded by node count so a cycle cannot loop forever
  for (let pass = 0; pass < ids.length; pass++) {
    let moved = false
    for (const e of edges) {
      const want = (col.get(e.from) ?? 0) + 1
      if (want > (col.get(e.to) ?? 0) && want < ids.length) {
        col.set(e.to, want)
        moved = true
      }
    }
    if (!moved) break
  }

  const rowOf = new Map<number, number>()
  const nodes = ids.map((id) => {
    const c = col.get(id) ?? 0
    const r = rowOf.get(c) ?? 0
    rowOf.set(c, r + 1)
    const label = labels.get(id)!
    return { id, label, kind: kindOf(label), col: c, row: r }
  })

  const orphans = nodes.filter(
    (n) => !edges.some((e) => e.from === n.id || e.to === n.id),
  )
  if (orphans.length) {
    notes.push(
      `${orphans.map((o) => o.label).join(', ')} ${orphans.length === 1 ? 'is' : 'are'} not connected to anything. A box with no arrows is a box you cannot justify.`,
    )
  }
  // a store, a cache or an external system is a legitimate place for a request
  // to end. A service that nothing leaves is usually a box you have not finished.
  const ENDS = new Set(['store', 'cache', 'external'])
  const sinks = nodes.filter((n) => !ENDS.has(n.kind) && !edges.some((e) => e.from === n.id))
  if (sinks.length && edges.length) {
    notes.push(
      `Nothing leaves ${sinks.map((s) => s.label).join(', ')}. If a request ends there, say what it returns.`,
    )
  }
  if (!nodes.some((n) => n.kind === 'client')) {
    notes.push('No client. Every design should start from whoever is making the request.')
  }

  return {
    spec: {
      caption: 'Your sketch. Every box here should trace back to a requirement or a number.',
      nodes,
      edges,
    },
    notes,
  }
}
