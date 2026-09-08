/**
 * What the whiteboard stores, kept apart from the component that draws it.
 *
 * A drawing is a list of shapes rather than a picture: it is a few kilobytes
 * instead of a few hundred, it redraws crisply at any size, and it fits inside
 * the synced progress blob without pushing it near the payload limit.
 *
 * Freehand is only usable with a pen or a finger. On a PC with a mouse you want
 * boxes, arrows and typed labels — so a stored shape is one of four kinds, and
 * anything without a kind is a freehand path from the first version.
 */

export type ShapeKind =
  | 'pen' | 'text' | 'node'
  | 'rect' | 'ellipse' | 'diamond' | 'triangle'
  | 'arrow'

/** the shapes drawn by dragging a box, all sharing [x1,y1,x2,y2] */
export const BOX_KINDS = ['rect', 'ellipse', 'diamond', 'triangle'] as const

/** arrowheads: one at the end by default, or none, or both */
export type Heads = 'none' | 'one' | 'both'

export interface Stroke {
  /** omitted means 'pen', so drawings saved before shapes existed still load */
  k?: ShapeKind
  /**
   * pen: a flat path [x0, y0, x1, y1, …]
   * rect and arrow: [x1, y1, x2, y2]
   * text: [x, y] — the left edge of the baseline
   *
   * Board units, where 1.0 is one frame-width at 100% zoom. Uniform in both
   * axes, so distances compare directly and zooming out reveals coordinates
   * beyond 1.
   */
  p: number[]
  /** ink colour */
  c: string
  /** nib width, in thousandths of the frame width; also drives text size */
  w: number
  /** the label, for text and component shapes */
  t?: string
  /** which ready-made component this is, for node shapes */
  n?: string
  /** arrowheads, for arrow shapes. Absent means one, at the end. */
  a?: Heads
  /** dashed, for arrow shapes */
  d?: 1
  /** dotted, for arrow shapes */
  dot?: 1
  /** right-angle connector, for arrow shapes */
  el?: 1
  /** filled rather than outline, for box-like shapes */
  f?: 1
  /** eraser cut-out, only in drawings saved by the very first version */
  e?: boolean
}

export function kindOf(s: Stroke): ShapeKind {
  return s.k ?? 'pen'
}

/** text size in board units, derived from the nib width so one control does both */
export function textSize(w: number): number {
  return w * 0.006
}

function isStroke(v: unknown): v is Stroke {
  if (!v || typeof v !== 'object') return false
  const s = v as Partial<Stroke>
  if (
    !Array.isArray(s.p) ||
    s.p.length < 2 ||
    !s.p.every((n) => typeof n === 'number' && Number.isFinite(n)) ||
    typeof s.c !== 'string' ||
    typeof s.w !== 'number'
  ) {
    return false
  }
  if (
    s.k !== undefined &&
    !['pen', 'rect', 'ellipse', 'diamond', 'triangle', 'arrow', 'text', 'node'].includes(s.k)
  ) {
    return false
  }
  if (s.a !== undefined && !['none', 'one', 'both'].includes(s.a)) return false
  // a component without a type has nothing to draw
  if (s.k === 'node' && (typeof s.n !== 'string' || !s.n)) return false
  if (s.k === 'node' && s.p.length !== 4) return false
  // a text shape with no words is a shape nobody can see or select
  if (s.k === 'text' && (typeof s.t !== 'string' || !s.t.trim())) return false
  if (s.k && ['rect', 'ellipse', 'diamond', 'triangle', 'arrow'].includes(s.k) && s.p.length !== 4) {
    return false
  }
  return true
}

/**
 * Anything that is not a valid drawing becomes a blank board rather than an
 * error. This is stored data that syncs between devices and survives app
 * versions, so it will eventually contain something unexpected.
 */
export function parseStrokes(json: string | undefined | null): Stroke[] {
  if (!json) return []
  try {
    const v: unknown = JSON.parse(json)
    return Array.isArray(v) ? v.filter(isStroke) : []
  } catch {
    return []
  }
}

/** total points in a drawing — what the size cap is measured against */
export function pointCount(strokes: Stroke[]): number {
  return strokes.reduce((a, s) => a + s.p.length, 0)
}

/* ---------- geometry ---------- */

/** shortest distance from a point to a line segment, in board units */
function distToSegment(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** roughly how wide a label is, without needing a canvas to measure it */
export function textBounds(s: Stroke): { x: number; y: number; w: number; h: number } {
  const size = textSize(s.w)
  const chars = (s.t ?? '').length
  return { x: s.p[0], y: s.p[1] - size, w: chars * size * 0.55, h: size * 1.25 }
}

/** the corner an elbow connector turns at: across first, then down */
export function elbowCorner(p: number[]): [number, number] {
  return [p[2], p[1]]
}

/** true when the point is within `radius` of the shape */
export function strokeHit(s: Stroke, x: number, y: number, radius: number): boolean {
  const kind = kindOf(s)

  if (kind === 'text') {
    const b = textBounds(s)
    return (
      x >= b.x - radius && x <= b.x + b.w + radius &&
      y >= b.y - radius && y <= b.y + b.h + radius
    )
  }

  // a component is a solid thing, so anywhere inside it counts
  if (kind === 'node') {
    const [x1, y1, x2, y2] = s.p
    return (
      x >= Math.min(x1, x2) - radius && x <= Math.max(x1, x2) + radius &&
      y >= Math.min(y1, y2) - radius && y <= Math.max(y1, y2) + radius
    )
  }

  if (kind === 'rect') {
    const [x1, y1, x2, y2] = s.p
    const l = Math.min(x1, x2), r = Math.max(x1, x2)
    const t = Math.min(y1, y2), b = Math.max(y1, y2)
    // the outline, not the fill — clicking through an empty box should not erase it
    return (
      distToSegment(x, y, l, t, r, t) <= radius ||
      distToSegment(x, y, r, t, r, b) <= radius ||
      distToSegment(x, y, r, b, l, b) <= radius ||
      distToSegment(x, y, l, b, l, t) <= radius
    )
  }

  if (kind === 'arrow') {
    if (s.el) {
      const [cx, cy] = elbowCorner(s.p)
      return (
        distToSegment(x, y, s.p[0], s.p[1], cx, cy) <= radius ||
        distToSegment(x, y, cx, cy, s.p[2], s.p[3]) <= radius
      )
    }
    return distToSegment(x, y, s.p[0], s.p[1], s.p[2], s.p[3]) <= radius
  }

  if (kind === 'ellipse' || kind === 'diamond' || kind === 'triangle') {
    const [x1, y1, x2, y2] = s.p
    const l = Math.min(x1, x2), r = Math.max(x1, x2)
    const t = Math.min(y1, y2), b = Math.max(y1, y2)
    // a filled shape is solid, so anywhere inside counts
    if (s.f) return x >= l - radius && x <= r + radius && y >= t - radius && y <= b + radius

    if (kind === 'ellipse') {
      const rx = Math.max((r - l) / 2, 1e-6)
      const ry = Math.max((b - t) / 2, 1e-6)
      const dx = (x - (l + r) / 2) / rx
      const dy = (y - (t + b) / 2) / ry
      const d = Math.hypot(dx, dy)
      // how far off the outline, converted back into board units
      return Math.abs(d - 1) * Math.min(rx, ry) <= radius
    }

    const pts: [number, number][] =
      kind === 'diamond'
        ? [[(l + r) / 2, t], [r, (t + b) / 2], [(l + r) / 2, b], [l, (t + b) / 2]]
        : [[(l + r) / 2, t], [r, b], [l, b]]
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]
      const c = pts[(i + 1) % pts.length]
      if (distToSegment(x, y, a[0], a[1], c[0], c[1]) <= radius) return true
    }
    return false
  }

  if (s.p.length === 2) return distToSegment(x, y, s.p[0], s.p[1], s.p[0], s.p[1]) <= radius
  for (let i = 0; i + 3 < s.p.length; i += 2) {
    if (distToSegment(x, y, s.p[i], s.p[i + 1], s.p[i + 2], s.p[i + 3]) <= radius) return true
  }
  return false
}

/**
 * Remove whole shapes the eraser touches.
 *
 * Rubbing out pixels sounds more faithful and behaves worse: it needs a
 * transparent hole punched through the board, it cannot be undone shape by
 * shape, and at pen width it barely removes anything. Taking the whole shape is
 * what people expect from a whiteboard eraser and it keeps the data clean.
 */
export function eraseAt(strokes: Stroke[], x: number, y: number, radius: number): Stroke[] {
  return strokes.filter((s) => !strokeHit(s, x, y, radius))
}

/** the box containing every shape, used to fit a drawing into view */
export function bounds(strokes: Stroke[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (!strokes.length) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  const add = (x: number, y: number) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }
  for (const s of strokes) {
    if (kindOf(s) === 'text') {
      const b = textBounds(s)
      add(b.x, b.y)
      add(b.x + b.w, b.y + b.h)
      continue
    }
    for (let i = 0; i < s.p.length; i += 2) add(s.p[i], s.p[i + 1])
    if (kindOf(s) === 'arrow' && s.el) {
      const [cx, cy] = elbowCorner(s.p)
      add(cx, cy)
    }
  }
  return { minX, minY, maxX, maxY }
}

/* ---------- selecting, moving and resizing ---------- */

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** the box around one shape, which is what selection handles attach to */
export function shapeBounds(s: Stroke): Box {
  const b = bounds([s])!
  return { x: b.minX, y: b.minY, w: Math.max(b.maxX - b.minX, 1e-6), h: Math.max(b.maxY - b.minY, 1e-6) }
}

/** topmost shape under the point, or -1. Later shapes sit above earlier ones. */
export function hitTop(strokes: Stroke[], x: number, y: number, radius: number): number {
  for (let i = strokes.length - 1; i >= 0; i--) {
    if (strokeHit(strokes[i], x, y, radius)) return i
  }
  return -1
}

export function translateShape(s: Stroke, dx: number, dy: number): Stroke {
  const p = s.p.slice()
  for (let i = 0; i < p.length; i += 2) {
    p[i] += dx
    p[i + 1] += dy
  }
  return { ...s, p }
}

/**
 * Remap a shape from one box into another.
 *
 * Every kind is resized the same way — its points are moved proportionally —
 * so one implementation covers components, shapes, arrows and freehand alike.
 * Text has no width of its own to stretch, so its size is scaled instead.
 */
export function resizeShape(s: Stroke, from: Box, to: Box): Stroke {
  const sx = to.w / from.w
  const sy = to.h / from.h

  if (kindOf(s) === 'text') {
    // a label is anchored at one point, so it scales rather than stretches
    const scale = Math.max(Math.min(sx, sy), 0.05)
    return {
      ...s,
      p: [to.x + (s.p[0] - from.x) * sx, to.y + (s.p[1] - from.y) * sy],
      w: Math.max(1, s.w * scale),
    }
  }

  const p = s.p.slice()
  for (let i = 0; i < p.length; i += 2) {
    p[i] = to.x + (p[i] - from.x) * sx
    p[i + 1] = to.y + (p[i + 1] - from.y) * sy
  }
  return { ...s, p }
}

/** the smallest a shape may be dragged to, so it can never vanish */
export const MIN_SIZE = 0.02

/** move a shape so its box is centred on a point — where a paste lands */
export function centreShapeAt(s: Stroke, x: number, y: number): Stroke {
  const b = shapeBounds(s)
  return translateShape(s, x - (b.x + b.w / 2), y - (b.y + b.h / 2))
}

/** how far a duplicate is nudged, so it does not hide the thing it came from */
export const PASTE_OFFSET = 0.03
