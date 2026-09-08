'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BOX_KINDS,
  MIN_SIZE,
  PASTE_OFFSET,
  bounds,
  centreShapeAt,
  elbowCorner,
  eraseAt,
  hitTop,
  kindOf,
  parseStrokes,
  pointCount,
  resizeShape,
  shapeBounds,
  textSize,
  translateShape,
  type Box,
  type Heads,
  type ShapeKind,
  type Stroke,
} from '@/lib/strokes'
import {
  NODE_H,
  NODE_W,
  drawIcon,
  getStencil,
  searchStencils,
  type Stencil,
} from '@/lib/stencils'

/**
 * A whiteboard you can actually use with a mouse.
 *
 * The frame is a fixed window onto an unbounded board: zoom scales what is
 * drawn inside it rather than resizing the window. Shapes are stored as points,
 * so a diagram is a couple of kilobytes, redraws crisply at any size, and fits
 * inside the synced progress blob.
 *
 * The toolbar is grouped rather than flat — pick, place, draw, style — because
 * seventy components and ten tools laid out in one row is unusable.
 */

const ASPECT = 10 / 16
const MAX_BOARD_WIDTH = 900
const MAX_POINTS = 20_000
const MIN_STEP = 0.002
const ERASER_RADIUS = 0.022
const ZOOMS: number[] = [0.25, 0.4, 0.5, 0.75, 1, 1.5, 2, 3]
const MAX_BACKING_WIDTH = 3600
const BOARD = '#fbfbf9'
/** selection handles stay this many screen pixels across, whatever the zoom */
const HANDLE_PX = 9

const INKS = [
  '#1f2430', '#5b6472', '#d1493f', '#e07b39',
  '#c2831f', '#2e8b57', '#0f766e', '#1f6fb2',
  '#3b5bdb', '#7a52b3', '#c2255c', '#8a5a2b',
]
const WIDTHS = [
  { w: 2, label: 'Thin' },
  { w: 4, label: 'Medium' },
  { w: 8, label: 'Thick' },
  { w: 14, label: 'Heavy' },
]

type BoxKind = (typeof BOX_KINDS)[number]
type Tool = ShapeKind | 'eraser' | 'hand' | 'select'
type MenuId = 'components' | 'shapes' | 'arrows' | 'colour' | 'size' | null

const ARROWS: {
  id: string; label: string; name: string
  heads: Heads; dashed?: 1; dotted?: 1; elbow?: 1
}[] = [
  { id: 'one', label: '→', name: 'Arrow', heads: 'one' },
  { id: 'both', label: '↔', name: 'Both ways', heads: 'both' },
  { id: 'dash', label: '⇢', name: 'Dashed', heads: 'one', dashed: 1 },
  { id: 'dot', label: '⋯', name: 'Dotted', heads: 'one', dotted: 1 },
  { id: 'elbow', label: '⌐', name: 'Right angle', heads: 'one', elbow: 1 },
  { id: 'line', label: '—', name: 'Plain line', heads: 'none' },
]

const SHAPES: { id: BoxKind; label: string; name: string }[] = [
  { id: 'rect', label: '▭', name: 'Rectangle' },
  { id: 'ellipse', label: '◯', name: 'Ellipse' },
  { id: 'diamond', label: '◇', name: 'Diamond' },
  { id: 'triangle', label: '△', name: 'Triangle' },
]

const HINTS: Record<string, string> = {
  select: 'Click a shape to select it, drag to move, drag a corner to resize',
  arrow: 'Drag from one component to another',
  text: 'Click, then type a label',
  pen: 'Freehand — best with a stylus or finger',
  eraser: 'Click a shape to remove it',
  hand: 'Drag to slide the board around',
  rect: 'Drag to draw a rectangle',
  ellipse: 'Drag to draw an ellipse',
  diamond: 'Drag to draw a diamond',
  triangle: 'Drag to draw a triangle',
}

type Typing = { left: number; top: number } & (
  | { mode: 'new'; bx: number; by: number }
  | { mode: 'rename'; idx: number }
)

interface View { zoom: number; x: number; y: number }
const FIT: View = { zoom: 1, x: 0, y: 0 }

function groupStencils(list: Stencil[]): [string, Stencil[]][] {
  const out: [string, Stencil[]][] = []
  for (const st of list) {
    const row = out.find(([g]) => g === st.group)
    if (row) row[1].push(st)
    else out.push([st.group, [st]])
  }
  return out
}

/* ---------- painting ---------- */

function drawShape(ctx: CanvasRenderingContext2D, s: Stroke) {
  const kind = kindOf(s)
  ctx.strokeStyle = s.c
  ctx.fillStyle = s.c
  ctx.lineWidth = s.w / 1000

  if (kind === 'node') {
    const [x1, y1, x2, y2] = s.p
    const x = Math.min(x1, x2), y = Math.min(y1, y2)
    const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1)
    const r = Math.min(w, h) * 0.12
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
    ctx.globalAlpha = 0.07
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.stroke()
    const icon = Math.min(w, h) * 0.44
    ctx.save()
    ctx.translate(x + w / 2 - icon / 2, y + h * 0.16)
    ctx.scale(icon, icon)
    ctx.lineWidth = (s.w / 1000 / icon) * 1.15
    drawIcon(ctx, s.n ?? 'service')
    ctx.restore()
    const label = s.t ?? ''
    if (label) {
      const size = Math.min(h * 0.2, w / Math.max(label.length, 6) / 0.55)
      ctx.font = `600 ${size}px ui-sans-serif, system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(label, x + w / 2, y + h * 0.9)
      ctx.textAlign = 'start'
    }
    ctx.restore()
    return
  }

  if (kind === 'text') {
    const size = textSize(s.w)
    ctx.font = `600 ${size}px ui-sans-serif, system-ui, sans-serif`
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(s.t ?? '', s.p[0], s.p[1])
    return
  }

  if (kind === 'rect' || kind === 'ellipse' || kind === 'diamond' || kind === 'triangle') {
    const [x1, y1, x2, y2] = s.p
    const l = Math.min(x1, x2), r = Math.max(x1, x2)
    const t = Math.min(y1, y2), b = Math.max(y1, y2)
    ctx.beginPath()
    if (kind === 'rect') ctx.rect(l, t, r - l, b - t)
    else if (kind === 'ellipse') {
      ctx.ellipse((l + r) / 2, (t + b) / 2, Math.max((r - l) / 2, 1e-6), Math.max((b - t) / 2, 1e-6), 0, 0, Math.PI * 2)
    } else if (kind === 'diamond') {
      ctx.moveTo((l + r) / 2, t); ctx.lineTo(r, (t + b) / 2)
      ctx.lineTo((l + r) / 2, b); ctx.lineTo(l, (t + b) / 2); ctx.closePath()
    } else {
      ctx.moveTo((l + r) / 2, t); ctx.lineTo(r, b); ctx.lineTo(l, b); ctx.closePath()
    }
    if (s.f) { ctx.save(); ctx.globalAlpha = 0.16; ctx.fill(); ctx.restore() }
    ctx.stroke()
    return
  }

  if (kind === 'arrow') {
    const [x1, y1, x2, y2] = s.p
    const nib = s.w / 1000
    ctx.save()
    if (s.d) ctx.setLineDash([nib * 5, nib * 4])
    if (s.dot) ctx.setLineDash([nib * 0.6, nib * 3])
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    if (s.el) { const [cx, cy] = elbowCorner(s.p); ctx.lineTo(cx, cy) }
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.restore()

    const head = Math.max(nib * 6, 0.012)
    const [ex, ey] = s.el ? elbowCorner(s.p) : [x1, y1]
    const tip = (tx: number, ty: number, a: number) => {
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(tx - head * Math.cos(a - Math.PI / 7), ty - head * Math.sin(a - Math.PI / 7))
      ctx.lineTo(tx - head * Math.cos(a + Math.PI / 7), ty - head * Math.sin(a + Math.PI / 7))
      ctx.closePath()
      ctx.fill()
    }
    const heads = s.a ?? 'one'
    if (heads !== 'none') tip(x2, y2, Math.atan2(y2 - ey, x2 - ex))
    if (heads === 'both') {
      const back = s.el ? elbowCorner(s.p) : [x2, y2]
      tip(x1, y1, Math.atan2(y1 - back[1], x1 - back[0]))
    }
    return
  }

  if (s.p.length < 2) return
  ctx.beginPath()
  ctx.moveTo(s.p[0], s.p[1])
  for (let i = 2; i < s.p.length; i += 2) ctx.lineTo(s.p[i], s.p[i + 1])
  if (s.p.length === 2) ctx.lineTo(s.p[0] + 0.0001, s.p[1])
  ctx.stroke()
}

function draw(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  w: number,
  h: number,
  v: View,
  selection?: Box | null,
) {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
  ctx.fillStyle = BOARD
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  const s = v.zoom * w
  ctx.translate(-v.x * s, -v.y * s)
  ctx.scale(s, s)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const st of strokes) drawShape(ctx, st)

  if (selection) {
    const pad = 4 / s
    const hs = HANDLE_PX / s
    ctx.setLineDash([6 / s, 4 / s])
    ctx.lineWidth = 1.5 / s
    ctx.strokeStyle = '#3b5bdb'
    ctx.strokeRect(selection.x - pad, selection.y - pad, selection.w + pad * 2, selection.h + pad * 2)
    ctx.setLineDash([])
    ctx.fillStyle = '#fff'
    for (const [hx, hy] of corners(selection, pad)) {
      ctx.beginPath()
      ctx.rect(hx - hs / 2, hy - hs / 2, hs, hs)
      ctx.fill()
      ctx.stroke()
    }
  }
  ctx.restore()
}

/** the four draggable corners of a selection, in board units */
function corners(b: Box, pad = 0): [number, number][] {
  const x1 = b.x - pad, y1 = b.y - pad
  const x2 = b.x + b.w + pad, y2 = b.y + b.h + pad
  return [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
}

function fitAll(strokes: Stroke[], aspect: number): View {
  const b = bounds(strokes)
  if (!b) return FIT
  const pad = 0.04
  const w = Math.max(b.maxX - b.minX, 0.05) + pad * 2
  const h = Math.max(b.maxY - b.minY, 0.05) + pad * 2
  return { zoom: Math.min(1, 1 / w, aspect / h), x: b.minX - pad, y: b.minY - pad }
}

/* ---------- small pieces of UI ---------- */

function StencilIcon({ id, colour, size = 22 }: { id: string; colour: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    cv.width = size * dpr
    cv.height = size * dpr
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    ctx.save()
    ctx.scale(size, size)
    ctx.strokeStyle = colour
    ctx.lineWidth = 0.075
    drawIcon(ctx, id)
    ctx.restore()
  }, [id, colour, size])
  return <canvas ref={ref} style={{ width: size, height: size, display: 'block' }} aria-hidden />
}

export function WhiteboardView({ value }: { value?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const strokes = parseStrokes(value)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const render = () => {
      const w = cv.clientWidth
      if (!w) return
      const h = Math.round(w * ASPECT)
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
      cv.width = w * dpr
      cv.height = h * dpr
      cv.style.height = `${h}px`
      const ctx = cv.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(ctx, strokes, w, h, fitAll(strokes, ASPECT))
    }
    render()
    const ro = new ResizeObserver(render)
    ro.observe(cv)
    return () => ro.disconnect()
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!strokes.length) return null
  return (
    <canvas
      ref={ref}
      className="w-full rounded-xl border"
      style={{ borderColor: 'var(--border-strong)', background: BOARD, maxWidth: MAX_BOARD_WIDTH }}
    />
  )
}

export function Whiteboard({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>(parseStrokes(value))
  const draftRef = useRef<Stroke | null>(null)
  const modeRef = useRef<'idle' | 'draw' | 'erase' | 'pan' | 'move' | 'resize'>('idle')
  const dragRef = useRef<{
    sx: number; sy: number
    vx: number; vy: number
    from?: Box; anchor?: [number, number]
    original?: Stroke
  } | null>(null)
  const viewRef = useRef<View>(FIT)
  const historyRef = useRef<Stroke[][]>([])
  const hoverRef = useRef<[number, number] | null>(null)
  const selRef = useRef<number | null>(null)
  /** the copied shape. A ref rather than state so a paste never uses a stale copy. */
  const clipRef = useRef<Stroke | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [ink, setInk] = useState(INKS[0])
  const [width, setWidth] = useState(4)
  const [filled, setFilled] = useState(false)
  const [tool, setToolRaw] = useState<Tool>('select')
  const [shape, setShape] = useState<BoxKind>('rect')
  const [arrowKind, setArrowKind] = useState(ARROWS[0].id)
  const [stencil, setStencil] = useState<string | null>(null)
  /** the last one placed, so putting a second one down is a single click */
  const [lastStencil, setLastStencil] = useState<string | null>(null)
  const [menu, setMenu] = useState<MenuId>(null)
  const [query, setQuery] = useState('')
  const [count, setCount] = useState(strokesRef.current.length)
  const [canUndo, setCanUndo] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [full, setFull] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [hasClip, setHasClip] = useState(false)
  const [typing, setTyping] = useState<Typing | null>(null)
  const [label, setLabel] = useState('')

  const select = useCallback((i: number | null) => {
    selRef.current = i
    setSelected(i)
  }, [])

  /** choosing any drawing tool puts the component palette away */
  const setTool = (t: Tool) => {
    setToolRaw(t)
    setStencil(null)
    if (t !== 'select') select(null)
  }

  const render = useCallback(() => {
    const cv = ref.current
    if (!cv) return
    const w = cv.clientWidth
    const h = cv.clientHeight
    if (!w || !h) return
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, MAX_BACKING_WIDTH / w))
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
    }
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const live = draftRef.current
    const list = live ? [...strokesRef.current, live] : strokesRef.current
    const sel = selRef.current
    const box = sel !== null && strokesRef.current[sel] ? shapeBounds(strokesRef.current[sel]) : null
    draw(ctx, list, w, h, viewRef.current, box)
  }, [])

  useEffect(() => {
    render()
    const cv = ref.current
    if (!cv) return
    const ro = new ResizeObserver(render)
    ro.observe(cv)
    return () => ro.disconnect()
  }, [render, zoom, full, count, selected])

  useEffect(() => {
    const next = parseStrokes(value)
    if (JSON.stringify(next) !== JSON.stringify(strokesRef.current)) {
      strokesRef.current = next
      historyRef.current = []
      setCanUndo(false)
      select(null)
      setCount(next.length)
      render()
    }
  }, [value, render, select])

  useEffect(() => {
    if (typing) inputRef.current?.focus()
  }, [typing])

  useEffect(() => {
    if (!full) return
    const onResize = () => render()
    window.addEventListener('resize', onResize)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = prev
    }
  }, [full, render])

  const commit = useCallback(() => {
    onChange(strokesRef.current.length ? JSON.stringify(strokesRef.current) : '')
    setCount(strokesRef.current.length)
    setCanUndo(historyRef.current.length > 0)
  }, [onChange])

  const snapshot = useCallback(() => {
    historyRef.current = [...historyRef.current, strokesRef.current].slice(-60)
  }, [])

  const copy = useCallback(() => {
    const sel = selRef.current
    const s = sel !== null ? strokesRef.current[sel] : null
    if (!s) return false
    // deep enough that editing the original never changes the copy
    clipRef.current = { ...s, p: s.p.slice() }
    setHasClip(true)
    return true
  }, [])

  /** put the copy down: under the cursor if it is over the board, else nudged
   *  clear of the thing it came from */
  const paste = useCallback(() => {
    const clip = clipRef.current
    if (!clip) return
    const src = { ...clip, p: clip.p.slice() }
    const hover = hoverRef.current
    const next = hover
      ? centreShapeAt(src, hover[0], hover[1])
      : translateShape(src, PASTE_OFFSET, PASTE_OFFSET)
    snapshot()
    strokesRef.current = [...strokesRef.current, next]
    commit()
    select(strokesRef.current.length - 1)
    setToolRaw('select')
    setStencil(null)
    render()
  }, [commit, render, select, snapshot])

  const duplicate = useCallback(() => {
    const sel = selRef.current
    const s = sel !== null ? strokesRef.current[sel] : null
    if (!s) return
    clipRef.current = { ...s, p: s.p.slice() }
    setHasClip(true)
    snapshot()
    strokesRef.current = [...strokesRef.current, translateShape(s, PASTE_OFFSET, PASTE_OFFSET)]
    commit()
    select(strokesRef.current.length - 1)
    render()
  }, [commit, render, select, snapshot])

  const removeSelected = useCallback(() => {
    const sel = selRef.current
    if (sel === null || !strokesRef.current[sel]) return false
    snapshot()
    strokesRef.current = strokesRef.current.filter((_, i) => i !== sel)
    select(null)
    commit()
    render()
    return true
  }, [commit, render, select, snapshot])

  /** Delete removes the selection, or whatever the cursor is over */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const inField = el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable

      if ((e.ctrlKey || e.metaKey) && !typing && !inField) {
        const k = e.key.toLowerCase()
        if (k === 'c') { if (copy()) e.preventDefault(); return }
        if (k === 'x') { if (copy()) { removeSelected(); e.preventDefault() } return }
        if (k === 'v') { if (clipRef.current) { paste(); e.preventDefault() } return }
        if (k === 'd') { e.preventDefault(); duplicate(); return }
      }
      if (e.key === 'Escape') {
        if (typing) return
        if (menu) return setMenu(null)
        if (selRef.current !== null) { select(null); render(); return }
        if (full) setFull(false)
        return
      }
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      if (typing || inField) return

      if (removeSelected()) {
        e.preventDefault()
        return
      }
      const at = hoverRef.current
      if (!at) return
      const next = eraseAt(strokesRef.current, at[0], at[1], ERASER_RADIUS / viewRef.current.zoom)
      if (next.length === strokesRef.current.length) return
      e.preventDefault()
      snapshot()
      strokesRef.current = next
      commit()
      render()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [typing, menu, full, commit, render, snapshot, select, copy, paste, duplicate, removeSelected])

  const add = (s: Stroke) => {
    snapshot()
    strokesRef.current = [...strokesRef.current, s]
    commit()
    render()
  }

  const frameAspect = () => {
    const cv = ref.current
    return cv && cv.clientWidth ? cv.clientHeight / cv.clientWidth : ASPECT
  }
  const applyZoom = (next: number) => {
    const v = viewRef.current
    const aspect = frameAspect()
    const cx = v.x + 0.5 / v.zoom
    const cy = v.y + aspect / 2 / v.zoom
    viewRef.current = { zoom: next, x: cx - 0.5 / next, y: cy - aspect / 2 / next }
    setZoom(next)
  }
  const stepZoom = (dir: 1 | -1) => {
    const i = ZOOMS.indexOf(viewRef.current.zoom)
    const from = i < 0 ? ZOOMS.indexOf(1) : i
    applyZoom(ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, from + dir))])
  }
  const fitToDrawing = () => {
    viewRef.current = strokesRef.current.length ? fitAll(strokesRef.current, frameAspect()) : FIT
    setZoom(viewRef.current.zoom)
    render()
  }

  const at = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect()
    const v = viewRef.current
    const s = v.zoom * r.width
    return [(e.clientX - r.left) / s + v.x, (e.clientY - r.top) / s + v.y]
  }
  const boardScale = () => (ref.current ? viewRef.current.zoom * ref.current.clientWidth : 900)

  const rub = (x: number, y: number) => {
    const next = eraseAt(strokesRef.current, x, y, ERASER_RADIUS / viewRef.current.zoom)
    if (next.length === strokesRef.current.length) return
    strokesRef.current = next
    select(null)
    render()
  }

  const placeLabel = () => {
    if (!typing) return
    const t = label.trim()
    if (typing.mode === 'new') {
      if (t) add({ k: 'text', p: [typing.bx, typing.by], c: ink, w: width, t })
    } else {
      const next = strokesRef.current.slice()
      const cur = next[typing.idx]
      if (cur) {
        next[typing.idx] = { ...cur, t: t || cur.t }
        strokesRef.current = next
        commit()
        render()
      }
    }
    setTyping(null)
    setLabel('')
  }

  const dropStencil = (id: string, x: number, y: number, left: number, top: number) => {
    const def = getStencil(id)
    if (!def) return
    const node: Stroke = {
      k: 'node', n: id,
      p: [x - NODE_W / 2, y - NODE_H / 2, x + NODE_W / 2, y + NODE_H / 2],
      c: def.colour, w: width, t: def.label,
    }
    snapshot()
    strokesRef.current = [...strokesRef.current, node]
    commit()
    // a component is a stamp used once. Leaving it armed meant the next click —
    // to select it, or to grab a resize handle — dropped another copy instead.
    setStencil(null)
    setLastStencil(id)
    select(strokesRef.current.length - 1)
    render()
    setLabel(def.label)
    setTyping({ mode: 'rename', idx: strokesRef.current.length - 1, left, top })
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    if (typing) return placeLabel()
    setMenu(null)
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* no capture */ }

    if (tool === 'hand') {
      modeRef.current = 'pan'
      const v = viewRef.current
      dragRef.current = { sx: e.clientX, sy: e.clientY, vx: v.x, vy: v.y }
      return
    }

    const [x, y] = at(e)
    const rect = e.currentTarget.getBoundingClientRect()

    if (stencil) return dropStencil(stencil, x, y, e.clientX - rect.left, e.clientY - rect.top)

    if (tool === 'select') {
      const sel = selRef.current
      const s = boardScale()
      // a corner of the current selection starts a resize
      if (sel !== null && strokesRef.current[sel]) {
        const box = shapeBounds(strokesRef.current[sel])
        const grab = (HANDLE_PX + 4) / s
        const pts = corners(box, 4 / s)
        for (let i = 0; i < pts.length; i++) {
          if (Math.abs(x - pts[i][0]) <= grab && Math.abs(y - pts[i][1]) <= grab) {
            modeRef.current = 'resize'
            snapshot()
            dragRef.current = {
              sx: e.clientX, sy: e.clientY, vx: 0, vy: 0,
              from: box, anchor: pts[(i + 2) % 4], original: strokesRef.current[sel],
            }
            return
          }
        }
      }
      const hit = hitTop(strokesRef.current, x, y, ERASER_RADIUS / viewRef.current.zoom)
      select(hit === -1 ? null : hit)
      if (hit !== -1) {
        modeRef.current = 'move'
        snapshot()
        dragRef.current = { sx: x, sy: y, vx: 0, vy: 0, original: strokesRef.current[hit] }
      }
      render()
      return
    }

    if (tool === 'text') {
      setTyping({ mode: 'new', bx: x, by: y, left: e.clientX - rect.left, top: e.clientY - rect.top })
      return
    }
    if (tool === 'eraser') {
      modeRef.current = 'erase'
      snapshot()
      rub(x, y)
      return
    }
    if (pointCount(strokesRef.current) > MAX_POINTS) return

    modeRef.current = 'draw'
    const av = ARROWS.find((a) => a.id === arrowKind) ?? ARROWS[0]
    draftRef.current =
      tool === 'pen'
        ? { p: [x, y], c: ink, w: width }
        : tool === 'arrow'
          ? {
              k: 'arrow', p: [x, y, x, y], c: ink, w: width, a: av.heads,
              ...(av.dashed ? { d: 1 as const } : {}),
              ...(av.dotted ? { dot: 1 as const } : {}),
              ...(av.elbow ? { el: 1 as const } : {}),
            }
          : { k: tool as BoxKind, p: [x, y, x, y], c: ink, w: width, ...(filled ? { f: 1 as const } : {}) }
    render()
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    hoverRef.current = at(e)
    const d = dragRef.current

    if (modeRef.current === 'pan' && d) {
      const r = e.currentTarget.getBoundingClientRect()
      const s = viewRef.current.zoom * r.width
      viewRef.current = { ...viewRef.current, x: d.vx - (e.clientX - d.sx) / s, y: d.vy - (e.clientY - d.sy) / s }
      return render()
    }
    if (modeRef.current === 'erase') {
      const [ex, ey] = at(e)
      return rub(ex, ey)
    }
    if (modeRef.current === 'move' && d?.original && selRef.current !== null) {
      const [x, y] = at(e)
      const next = strokesRef.current.slice()
      next[selRef.current] = translateShape(d.original, x - d.sx, y - d.sy)
      strokesRef.current = next
      return render()
    }
    if (modeRef.current === 'resize' && d?.original && d.from && d.anchor && selRef.current !== null) {
      const [x, y] = at(e)
      const [ax, ay] = d.anchor
      const to: Box = {
        x: Math.min(ax, x), y: Math.min(ay, y),
        w: Math.max(Math.abs(x - ax), MIN_SIZE), h: Math.max(Math.abs(y - ay), MIN_SIZE),
      }
      const next = strokesRef.current.slice()
      next[selRef.current] = resizeShape(d.original, d.from, to)
      strokesRef.current = next
      return render()
    }

    const draft = draftRef.current
    if (!draft) return
    const [x, y] = at(e)
    if (kindOf(draft) !== 'pen') {
      draft.p[2] = x
      draft.p[3] = y
      return render()
    }
    const n = draft.p.length
    const dx = x - draft.p[n - 2]
    const dy = y - draft.p[n - 1]
    const step = MIN_STEP / viewRef.current.zoom
    if (dx * dx + dy * dy < step * step) return
    draft.p.push(x, y)
    render()
  }

  function up() {
    const mode = modeRef.current
    modeRef.current = 'idle'
    dragRef.current = null

    if (mode === 'move' || mode === 'resize') return commit()
    if (mode === 'erase') {
      const prev = historyRef.current[historyRef.current.length - 1]
      if (prev && prev.length === strokesRef.current.length) historyRef.current = historyRef.current.slice(0, -1)
      return commit()
    }
    if (mode === 'pan') return

    const d = draftRef.current
    draftRef.current = null
    if (!d) return
    if (kindOf(d) !== 'pen' && Math.hypot(d.p[2] - d.p[0], d.p[3] - d.p[1]) < 0.01) return render()
    add(d)
  }

  const undo = () => {
    const prev = historyRef.current[historyRef.current.length - 1]
    if (!prev) return
    historyRef.current = historyRef.current.slice(0, -1)
    strokesRef.current = prev
    select(null)
    commit()
    render()
  }
  const clear = () => {
    if (!strokesRef.current.length) return
    snapshot()
    strokesRef.current = []
    select(null)
    commit()
    render()
  }

  /* ---------- toolbar ---------- */

  const armed = stencil ? getStencil(stencil) : undefined
  /** what the button offers: the armed one, or the last one placed */
  const again = armed ?? (lastStencil ? getStencil(lastStencil) : undefined)
  const results = searchStencils(query)
  const atLimit = pointCount(strokesRef.current) > MAX_POINTS
  const activeShape = SHAPES.find((s) => s.id === shape)!
  const activeArrow = ARROWS.find((a) => a.id === arrowKind) ?? ARROWS[0]
  const hint = armed
    ? `${armed.label} — click the board to place one`
    : (HINTS[tool] ?? '')

  const on = (active: boolean) => ({
    borderColor: active ? 'var(--accent)' : 'var(--border-strong)',
    background: active ? 'var(--accent-soft)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text)',
  })
  const B = 'rounded-lg border px-2.5 py-1 text-[12.5px] font-semibold transition'
  const Divider = () => <span className="mx-0.5 h-6 w-px shrink-0" style={{ background: 'var(--border-strong)' }} />

  const toggle = (id: Exclude<MenuId, null>) => {
    setQuery('')
    setMenu((m) => (m === id ? null : id))
  }

  const Dropdown = ({ id, children, width: w = 240 }: { id: Exclude<MenuId, null>; children: React.ReactNode; width?: number }) =>
    menu === id ? (
      <>
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setMenu(null)}
          className="fixed inset-0 z-40 cursor-default"
          style={{ background: 'transparent' }}
        />
        <div
          role="menu"
          className="absolute top-full left-0 z-50 mt-1.5 overflow-hidden rounded-xl border shadow-lg"
          style={{ background: 'var(--surface)', borderColor: 'var(--border-strong)', width: w }}
        >
          {children}
        </div>
      </>
    ) : null

  const card = (
    <div
      className="card flex flex-col overflow-hidden"
      style={full ? { width: '100%', height: '100%', borderRadius: 0 } : { maxWidth: MAX_BOARD_WIDTH }}
    >
      <div
        className="flex shrink-0 flex-wrap items-center gap-1.5 border-b px-3 py-2"
        style={{ background: 'var(--surface-2)' }}
      >
        {/* pick and move */}
        <button type="button" onClick={() => setTool('select')} aria-pressed={tool === 'select' && !stencil}
          title="Select — click a shape, drag to move, drag a corner to resize"
          className={B} style={on(tool === 'select' && !stencil)}>Select</button>
        <button type="button" onClick={() => setTool('hand')} aria-pressed={tool === 'hand'}
          title="Move the board" className={B} style={on(tool === 'hand')}>Pan</button>

        <Divider />

        {/* the component library */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => {
              if (again) {
                setStencil(again.id)
                setToolRaw('select')
              } else {
                toggle('components')
              }
            }}
            aria-pressed={Boolean(stencil)}
            title={again ? `Place another ${again.label}` : 'Ready-made system design components'}
            className={`flex items-center gap-1.5 ${B} ${again ? 'rounded-r-none border-r-0' : ''}`}
            style={on(Boolean(stencil))}
          >
            {again ? <StencilIcon id={again.id} colour={again.colour} size={18} /> : null}
            {again ? again.label : 'Components'}
          </button>
          <button
            type="button"
            onClick={() => toggle('components')}
            aria-expanded={menu === 'components'}
            aria-haspopup="menu"
            aria-label="Choose a component"
            title="Choose a component"
            className={`${B} ${again ? 'rounded-l-none px-1.5' : 'hidden'}`}
            style={on(menu === 'components')}
          >
            <span aria-hidden style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
          </button>
          <Dropdown id="components" width={268}>
            <div className="border-b p-2">
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key !== 'Escape') e.stopPropagation() }}
                placeholder="Search — redis, kafka, oauth…"
                className="w-full rounded-lg border px-2.5 py-1.5 text-[13px] outline-none"
                style={{ borderColor: 'var(--border-strong)', background: 'var(--surface)' }} />
            </div>
            <div className="max-h-[300px] overflow-y-auto py-1">
              {results.length === 0 ? (
                <div className="px-3 py-4 text-center text-[13px]" style={{ color: 'var(--faint)' }}>
                  Nothing matches “{query}”.
                </div>
              ) : null}
              {groupStencils(results).map(([group, items]) => (
                <div key={group}>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-[0.07em] uppercase"
                    style={{ color: 'var(--faint)' }}>{group}</div>
                  {items.map((st) => (
                    <button key={st.id} type="button" role="menuitem" aria-label={st.label}
                      onClick={() => { setStencil(st.id); setLastStencil(st.id); setToolRaw('select'); setMenu(null); setQuery('') }}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13.5px] transition"
                      style={{
                        background: stencil === st.id ? 'var(--accent-soft)' : 'transparent',
                        color: stencil === st.id ? 'var(--accent)' : 'var(--text)',
                      }}>
                      <StencilIcon id={st.id} colour={st.colour} size={20} />
                      {st.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </Dropdown>
        </div>

        <Divider />

        {/* shapes, connectors and the freehand tools */}
        <div className="relative">
          <button type="button" onClick={() => toggle('shapes')} aria-haspopup="menu" aria-expanded={menu === 'shapes'}
            title="Shapes" className={`flex items-center gap-1.5 ${B}`} style={on(BOX_KINDS.includes(tool as BoxKind))}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>{activeShape.label}</span>
            <span aria-hidden style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
          </button>
          <Dropdown id="shapes" width={170}>
            <div className="py-1">
              {SHAPES.map((s) => (
                <button key={s.id} type="button" role="menuitem"
                  onClick={() => { setShape(s.id); setTool(s.id); setMenu(null) }}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13.5px]"
                  style={{ background: shape === s.id ? 'var(--accent-soft)' : 'transparent' }}>
                  <span style={{ fontSize: 15, width: 18 }}>{s.label}</span>{s.name}
                </button>
              ))}
              <div className="mt-1 border-t px-3 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={filled} onChange={(e) => setFilled(e.target.checked)} />
                  Filled
                </label>
              </div>
            </div>
          </Dropdown>
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggle('arrows')} aria-haspopup="menu" aria-expanded={menu === 'arrows'}
            title="Connectors" className={`flex items-center gap-1.5 ${B}`} style={on(tool === 'arrow')}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>{activeArrow.label}</span>
            <span aria-hidden style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
          </button>
          <Dropdown id="arrows" width={180}>
            <div className="py-1">
              {ARROWS.map((a) => (
                <button key={a.id} type="button" role="menuitem"
                  onClick={() => { setArrowKind(a.id); setTool('arrow'); setMenu(null) }}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13.5px]"
                  style={{ background: arrowKind === a.id ? 'var(--accent-soft)' : 'transparent' }}>
                  <span style={{ fontSize: 15, width: 18 }}>{a.label}</span>{a.name}
                </button>
              ))}
            </div>
          </Dropdown>
        </div>

        <button type="button" onClick={() => setTool('text')} aria-pressed={tool === 'text'}
          title="Text" className={B} style={on(tool === 'text')}>Text</button>
        <button type="button" onClick={() => setTool('pen')} aria-pressed={tool === 'pen'}
          title="Freehand pen" className={B} style={on(tool === 'pen')}>Pen</button>
        <button type="button" onClick={() => setTool('eraser')} aria-pressed={tool === 'eraser'}
          title="Eraser" className={B} style={on(tool === 'eraser')}>Eraser</button>

        <Divider />

        {/* colour and thickness, both behind a click */}
        <div className="relative">
          <button type="button" onClick={() => toggle('colour')} aria-haspopup="menu" aria-expanded={menu === 'colour'}
            aria-label="Colour" title="Colour"
            className="flex items-center gap-1.5 rounded-lg border px-2 py-1 transition"
            style={{ borderColor: 'var(--border-strong)' }}>
            <span className="h-4 w-4 rounded" style={{ background: ink, outline: '1px solid rgba(0,0,0,.15)' }} />
            <span aria-hidden style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
          </button>
          <Dropdown id="colour" width={188}>
            <div className="grid grid-cols-4 gap-1.5 p-2.5">
              {INKS.map((c) => (
                <button key={c} type="button" role="menuitem" aria-label={`Colour ${c}`}
                  onClick={() => { setInk(c); setMenu(null) }}
                  className="h-8 w-full rounded-md transition"
                  style={{ background: c, outline: ink === c ? '2px solid var(--accent)' : '1px solid rgba(0,0,0,.12)', outlineOffset: 1 }} />
              ))}
            </div>
            <label className="flex items-center justify-between gap-2 border-t px-3 py-2 text-[12.5px]">
              Custom
              <input type="color" value={ink} onChange={(e) => setInk(e.target.value)}
                className="h-6 w-10 cursor-pointer border-0 bg-transparent p-0" />
            </label>
          </Dropdown>
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggle('size')} aria-haspopup="menu" aria-expanded={menu === 'size'}
            aria-label="Thickness" title="Thickness"
            className="flex items-center gap-1.5 rounded-lg border px-2 py-1 transition"
            style={{ borderColor: 'var(--border-strong)' }}>
            <span className="rounded-full" style={{ width: Math.min(width, 12) + 2, height: Math.min(width, 12) + 2, background: 'var(--text)' }} />
            <span aria-hidden style={{ fontSize: 9, opacity: 0.7 }}>▼</span>
          </button>
          <Dropdown id="size" width={160}>
            <div className="py-1">
              {WIDTHS.map((x) => (
                <button key={x.w} type="button" role="menuitem"
                  onClick={() => { setWidth(x.w); setMenu(null) }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-[13px]"
                  style={{ background: width === x.w ? 'var(--accent-soft)' : 'transparent' }}>
                  <span className="rounded-full" style={{ width: x.w + 2, height: x.w + 2, background: 'var(--text)' }} />
                  {x.label}
                </button>
              ))}
            </div>
          </Dropdown>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-strong)' }}>
            <button type="button" onClick={() => stepZoom(-1)} disabled={zoom <= ZOOMS[0]}
              aria-label="Zoom out" title="Zoom out — see more of the board"
              className="px-2 py-1 text-[15px] leading-none font-bold disabled:opacity-40">−</button>
            <button type="button" onClick={fitToDrawing} title="Fit the whole drawing in view"
              className="tabular border-x px-1.5 py-1 text-[11.5px] font-semibold"
              style={{ borderColor: 'var(--border-strong)', minWidth: 46 }}>{Math.round(zoom * 100)}%</button>
            <button type="button" onClick={() => stepZoom(1)} disabled={zoom >= ZOOMS[ZOOMS.length - 1]}
              aria-label="Zoom in" title="Zoom in"
              className="px-2 py-1 text-[15px] leading-none font-bold disabled:opacity-40">+</button>
          </div>
          {selected !== null ? (
            <button type="button" onClick={duplicate} title="Duplicate (Ctrl+D) · Copy is Ctrl+C"
              className={B} style={{ borderColor: 'var(--border-strong)' }}>Copy</button>
          ) : null}
          {hasClip ? (
            <button type="button" onClick={paste} title="Paste (Ctrl+V) — lands under the cursor"
              className={B} style={{ borderColor: 'var(--border-strong)' }}>Paste</button>
          ) : null}
          <button type="button" onClick={undo} disabled={!canUndo} className={`${B} disabled:opacity-40`}
            style={{ borderColor: 'var(--border-strong)' }}>Undo</button>
          <button type="button" onClick={clear} disabled={!count} className={`${B} disabled:opacity-40`}
            style={{ borderColor: 'var(--border-strong)', color: 'var(--bad)' }}>Clear</button>
          <button type="button" onClick={() => setFull((v) => !v)} aria-pressed={full}
            title={full ? 'Exit full screen (Esc)' : 'Draw full screen'} className={B} style={on(full)}>
            {full ? 'Exit full screen' : 'Full screen'}
          </button>
        </div>
      </div>

      <div className="relative" style={full ? { flex: '1 1 auto', minHeight: 0 } : undefined}>
        <canvas
          ref={ref}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={() => { hoverRef.current = null }}
          className="w-full"
          style={{
            background: BOARD, touchAction: 'none', display: 'block',
            cursor: tool === 'hand' ? 'grab' : tool === 'text' ? 'text' : tool === 'select' ? 'default' : 'crosshair',
            ...(full ? { height: '100%' } : { aspectRatio: '16 / 10' }),
          }}
        />
        {typing ? (
          <input
            ref={inputRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={placeLabel}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') placeLabel()
              if (e.key === 'Escape') { setTyping(null); setLabel('') }
            }}
            placeholder="Name it, then Enter"
            className="absolute rounded border px-1.5 py-0.5 outline-none"
            style={{
              left: typing.left, top: typing.top - 14, minWidth: 160,
              borderColor: 'var(--accent)', background: '#fff', color: ink, fontWeight: 600, fontSize: 14,
            }}
          />
        ) : null}
      </div>

      <div
        className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-[12px]"
        style={{ color: 'var(--faint)' }}
      >
        <span>
          {count ? `${count} shape${count === 1 ? '' : 's'} · ` : ''}{hint}
          {selected !== null ? ' · Ctrl+C copies, Ctrl+D duplicates, Delete removes' : ''}
        </span>
        {atLimit ? (
          <span style={{ color: 'var(--bad)' }}>Board is full — erase something to keep drawing.</span>
        ) : (
          <span>
            {zoom < 1 ? 'Zoomed out — click the % to fit your drawing.'
              : zoom > 1 ? 'Zoomed in — use Pan to slide around.'
                : full ? 'Press Esc to come back.'
                  : 'Saved with your attempt, and redrawn when you reopen it.'}
          </span>
        )}
      </div>
    </div>
  )

  if (!full) return card
  return (
    <div className="fixed inset-0 z-50" style={{ background: 'var(--surface)' }}
      role="dialog" aria-modal="true" aria-label="Whiteboard, full screen">
      {card}
    </div>
  )
}
