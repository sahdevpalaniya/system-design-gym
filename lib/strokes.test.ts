/** Self-check for the whiteboard's stored shapes — `npx tsx lib/strokes.test.ts`. */
import assert from 'node:assert/strict'
import {
  bounds,
  centreShapeAt,
  eraseAt,
  hitTop,
  kindOf,
  parseStrokes,
  pointCount,
  resizeShape,
  shapeBounds,
  strokeHit,
  translateShape,
  type Stroke,
} from './strokes'

/* ---------- parsing ---------- */
assert.deepEqual(parseStrokes(undefined), [], 'nothing drawn yet')
assert.deepEqual(parseStrokes(''), [], 'empty string')
assert.deepEqual(parseStrokes('not json at all'), [], 'garbage does not throw')
assert.deepEqual(parseStrokes('client -> lb -> db'), [], 'the old arrow text degrades to a blank board')
assert.deepEqual(parseStrokes('{"not":"an array"}'), [], 'wrong shape degrades safely')

const ok = '[{"p":[0,0,1,1],"c":"#1f2430","w":4},{"p":[0.2,0.2,0.3,0.3],"c":"#d1493f","w":2,"e":true}]'
assert.equal(parseStrokes(ok).length, 2, 'valid strokes parse')
assert.equal(pointCount(parseStrokes(ok)), 8, 'points are counted for the size cap')

// a drawing saved before shapes existed is still a freehand path
assert.equal(kindOf(parseStrokes(ok)[0]), 'pen', 'no kind means pen')

/* ---------- shape validation ---------- */
assert.equal(parseStrokes('[{"k":"rect","p":[0,0,0.5,0.4],"c":"#000","w":4}]').length, 1, 'a box parses')
assert.equal(parseStrokes('[{"k":"arrow","p":[0,0,0.5,0],"c":"#000","w":4}]').length, 1, 'an arrow parses')
assert.equal(parseStrokes('[{"k":"text","p":[0.1,0.1],"c":"#000","w":4,"t":"API"}]').length, 1, 'a label parses')
assert.deepEqual(parseStrokes('[{"k":"text","p":[0,0],"c":"#000","w":4,"t":"  "}]'), [], 'an empty label is dropped')
assert.deepEqual(parseStrokes('[{"k":"text","p":[0,0],"c":"#000","w":4}]'), [], 'a label with no words is dropped')
assert.deepEqual(parseStrokes('[{"k":"rect","p":[0,0,1],"c":"#000","w":4}]'), [], 'a box needs two corners')
assert.deepEqual(parseStrokes('[{"k":"blob","p":[0,0,1,1],"c":"#000","w":4}]'), [], 'unknown kinds are dropped')

// one bad shape must not discard the whole drawing
const mixed = '[{"p":[0,0,1,1],"c":"#000","w":4},{"p":"nope","c":"#000","w":4},{"c":"#000","w":4}]'
assert.equal(parseStrokes(mixed).length, 1, 'invalid shapes are dropped, valid ones kept')
assert.deepEqual(parseStrokes('[{"p":[0,0,null],"c":"#000","w":4}]'), [], 'non-finite points rejected')

/* ---------- erasing ---------- */
{
  const R = 0.02
  const path: Stroke = { p: [0.1, 0.1, 0.5, 0.1, 0.5, 0.4, 0.1, 0.4], c: '#1f2430', w: 4 }
  const away: Stroke = { p: [0.8, 0.8, 0.9, 0.9], c: '#d1493f', w: 4 }

  assert.ok(strokeHit(path, 0.3, 0.1, R), 'a point on the line hits')
  assert.ok(strokeHit(path, 0.3, 0.115, R), 'just off the line, within the radius, still hits')
  assert.ok(!strokeHit(path, 0.3, 0.25, R), 'the middle of the shape is empty — no hit')
  assert.equal(
    strokeHit(path, 0.3, 0.1 + 0.03, R),
    strokeHit(path, 0.1 - 0.03, 0.25, R),
    'x and y distances are measured on the same scale',
  )

  assert.deepEqual(eraseAt([path, away], 0.3, 0.1, R), [away], 'erasing takes only what it touches')
  assert.equal(eraseAt([path, away], 0.3, 0.25, R).length, 2, 'erasing empty space removes nothing')

  // coordinates beyond 1 are legal — zooming out reveals more board
  const faraway: Stroke = { p: [1.6, 1.2, 1.9, 1.4], c: '#000', w: 4 }
  assert.ok(strokeHit(faraway, 1.6, 1.2, R), 'shapes outside the 0..1 area are hittable')
  assert.deepEqual(eraseAt([faraway], 1.75, 1.3, R), [], 'and erasable')

  const dot: Stroke = { p: [0.6, 0.6], c: '#000', w: 4 }
  assert.deepEqual(eraseAt([dot], 0.6, 0.6, R), [], 'a dot can be erased')
}

/* ---------- erasing shapes ---------- */
{
  const R = 0.02
  const box: Stroke = { k: 'rect', p: [0.1, 0.1, 0.5, 0.4], c: '#000', w: 4 }
  assert.ok(strokeHit(box, 0.3, 0.1, R), 'the top edge of a box hits')
  assert.ok(strokeHit(box, 0.5, 0.25, R), 'the right edge hits')
  assert.ok(!strokeHit(box, 0.3, 0.25, R), 'the inside of an empty box does not hit')
  assert.ok(strokeHit(box, 0.1, 0.4, R), 'a corner hits')

  // a box drawn right-to-left is the same box
  const flipped: Stroke = { k: 'rect', p: [0.5, 0.4, 0.1, 0.1], c: '#000', w: 4 }
  assert.ok(strokeHit(flipped, 0.3, 0.1, R), 'a box drawn backwards still hits on its edges')

  const arrow: Stroke = { k: 'arrow', p: [0.1, 0.2, 0.6, 0.2], c: '#000', w: 4 }
  assert.ok(strokeHit(arrow, 0.35, 0.2, R), 'the middle of an arrow hits')
  assert.ok(!strokeHit(arrow, 0.35, 0.4, R), 'well away from an arrow does not hit')

  const label: Stroke = { k: 'text', p: [0.2, 0.3], c: '#000', w: 4, t: 'Load balancer' }
  assert.ok(strokeHit(label, 0.22, 0.29, R), 'clicking on a label hits it')
  assert.ok(!strokeHit(label, 0.9, 0.9, R), 'far from a label does not hit')

  assert.equal(eraseAt([box, arrow, label], 0.35, 0.2, R).length, 2, 'erasing the arrow leaves the rest')
}

/* ---------- bounds, used to fit a drawing in view ---------- */
{
  assert.equal(bounds([]), null, 'an empty board has no bounds')
  const b = bounds([
    { k: 'rect', p: [0.2, 0.2, 0.4, 0.3], c: '#000', w: 4 },
    { k: 'arrow', p: [0.4, 0.25, 0.9, 0.25], c: '#000', w: 4 },
  ])!
  assert.equal(b.minX, 0.2, 'left edge')
  assert.equal(b.maxX, 0.9, 'right edge')
  // a label extends to the right of its anchor, and up from its baseline
  const t = bounds([{ k: 'text', p: [0.5, 0.5], c: '#000', w: 4, t: 'API' }])!
  assert.ok(t.maxX > 0.5, 'a label takes width to the right of its anchor')
  assert.ok(t.minY < 0.5, 'and sits above its baseline')
}

console.log('strokes: all assertions passed')

/* ---------- ready-made components and arrow variants ---------- */
{
  const R = 0.02
  assert.equal(
    parseStrokes('[{"k":"node","n":"database","p":[0.1,0.1,0.3,0.2],"c":"#2e8b57","w":4,"t":"Postgres"}]').length,
    1, 'a component parses',
  )
  assert.deepEqual(parseStrokes('[{"k":"node","p":[0,0,1,1],"c":"#000","w":4}]'), [], 'a component needs a type')
  assert.deepEqual(
    parseStrokes('[{"k":"node","n":"database","p":[0,0],"c":"#000","w":4}]'), [],
    'a component needs two corners',
  )
  assert.equal(parseStrokes('[{"k":"arrow","p":[0,0,1,0],"c":"#000","w":4,"a":"both","d":1}]').length, 1,
    'a dashed double-headed arrow parses')
  assert.deepEqual(parseStrokes('[{"k":"arrow","p":[0,0,1,0],"c":"#000","w":4,"a":"three"}]'), [],
    'an unknown arrowhead setting is rejected')

  // unlike a hand-drawn box, a component is solid — clicking its middle erases it
  const node: Stroke = { k: 'node', n: 'cache', p: [0.1, 0.1, 0.3, 0.22], c: '#c2831f', w: 4, t: 'Redis' }
  assert.ok(strokeHit(node, 0.2, 0.16, R), 'the middle of a component hits')
  assert.ok(strokeHit(node, 0.1, 0.1, R), 'a corner hits')
  assert.ok(!strokeHit(node, 0.6, 0.6, R), 'away from a component does not hit')
  assert.deepEqual(eraseAt([node], 0.2, 0.16, R), [], 'clicking a component removes it')

  const b = bounds([node])!
  assert.equal(b.minX, 0.1, 'a component contributes its own corners to the bounds')
  assert.equal(b.maxY, 0.22, 'including the bottom edge')
}

console.log('strokes: components and arrows passed')

/* ---------- paint-style shapes and connectors ---------- */
{
  const R = 0.02
  const box = [0.2, 0.2, 0.6, 0.5]

  const ell: Stroke = { k: 'ellipse', p: box, c: '#000', w: 4 }
  assert.ok(strokeHit(ell, 0.4, 0.2, R), 'the top of an ellipse outline hits')
  assert.ok(strokeHit(ell, 0.2, 0.35, R), 'the left of the outline hits')
  assert.ok(!strokeHit(ell, 0.4, 0.35, R), 'the hollow middle does not hit')
  assert.ok(!strokeHit(ell, 0.21, 0.21, R), 'the bounding corner is outside the ellipse')

  const filled: Stroke = { k: 'ellipse', p: box, c: '#000', w: 4, f: 1 }
  assert.ok(strokeHit(filled, 0.4, 0.35, R), 'a filled shape is solid all the way through')

  const dia: Stroke = { k: 'diamond', p: box, c: '#000', w: 4 }
  assert.ok(strokeHit(dia, 0.4, 0.2, R), 'the top point of a diamond hits')
  assert.ok(!strokeHit(dia, 0.2, 0.2, R), 'the bounding corner is empty for a diamond')

  const tri: Stroke = { k: 'triangle', p: box, c: '#000', w: 4 }
  assert.ok(strokeHit(tri, 0.4, 0.5, R), 'the base of a triangle hits')
  assert.ok(!strokeHit(tri, 0.22, 0.22, R), 'the top-left corner is outside a triangle')

  // an elbow connector goes across then down, so it is hittable at the corner
  const elbow: Stroke = { k: 'arrow', p: [0.1, 0.1, 0.6, 0.6], c: '#000', w: 4, el: 1 }
  assert.ok(strokeHit(elbow, 0.35, 0.1, R), 'the horizontal leg hits')
  assert.ok(strokeHit(elbow, 0.6, 0.35, R), 'the vertical leg hits')
  assert.ok(!strokeHit(elbow, 0.35, 0.35, R), 'the diagonal between the ends does not hit')

  const straight: Stroke = { k: 'arrow', p: [0.1, 0.1, 0.6, 0.6], c: '#000', w: 4 }
  assert.ok(strokeHit(straight, 0.35, 0.35, R), 'a straight arrow does hit its diagonal')

  assert.equal(parseStrokes('[{"k":"ellipse","p":[0,0,1,1],"c":"#000","w":4,"f":1}]').length, 1, 'a filled ellipse parses')
  assert.deepEqual(parseStrokes('[{"k":"diamond","p":[0,0,1],"c":"#000","w":4}]'), [], 'a diamond needs two corners')
}

console.log('strokes: shapes and connectors passed')

/* ---------- selecting, moving and resizing ---------- */
{
  const R = 0.02
  const box: Stroke = { k: 'rect', p: [0.2, 0.2, 0.6, 0.4], c: '#000', w: 4 }
  const node: Stroke = { k: 'node', n: 'cache', p: [0.1, 0.6, 0.3, 0.72], c: '#000', w: 4, t: 'Redis' }

  const round = (n: number) => Number(n.toFixed(4))
  const b = shapeBounds(box)
  assert.deepEqual([b.x, b.y, b.w, b.h].map(round), [0.2, 0.2, 0.4, 0.2], 'bounds of one shape')

  // later shapes are on top, so a click where two overlap picks the newer one
  const under: Stroke = { k: 'rect', p: [0.2, 0.2, 0.6, 0.4], c: '#111', w: 4 }
  const over: Stroke = { k: 'node', n: 'cache', p: [0.3, 0.15, 0.5, 0.3], c: '#222', w: 4, t: 'x' }
  assert.equal(hitTop([under, over], 0.4, 0.22, R), 1, 'the topmost shape wins')
  assert.equal(hitTop([under, over], 0.2, 0.4, R), 0, 'and the one underneath is still reachable')
  assert.equal(hitTop([under, over], 0.9, 0.9, R), -1, 'empty space selects nothing')

  const moved = translateShape(box, 0.1, -0.05)
  assert.deepEqual(moved.p.map(round), [0.3, 0.15, 0.7, 0.35], 'moving shifts every point')
  assert.equal(moved.k, 'rect', 'moving keeps the kind')

  // doubling the box doubles the shape inside it
  const grown = resizeShape(box, { x: 0.2, y: 0.2, w: 0.4, h: 0.2 }, { x: 0.2, y: 0.2, w: 0.8, h: 0.4 })
  assert.deepEqual(grown.p.map(round), [0.2, 0.2, 1, 0.6], 'resizing scales from the anchored corner')

  // a component keeps its type and label through a resize
  const bigger = resizeShape(node, shapeBounds(node), { x: 0.1, y: 0.6, w: 0.4, h: 0.24 })
  assert.equal(bigger.n, 'cache', 'the component type survives')
  assert.equal(bigger.t, 'Redis', 'and so does its name')
  assert.equal(shapeBounds(bigger).w.toFixed(3), '0.400', 'and it really is twice as wide')

  // a label scales its type size rather than stretching
  const label: Stroke = { k: 'text', p: [0.5, 0.5], c: '#000', w: 4, t: 'API' }
  const lb = shapeBounds(label)
  const scaled = resizeShape(label, lb, { x: lb.x, y: lb.y, w: lb.w * 2, h: lb.h * 2 })
  assert.equal(scaled.w, 8, 'a label doubles its size')
  assert.equal(scaled.t, 'API', 'and keeps its words')

  // freehand scales too, so a sketch can be made bigger
  const pen: Stroke = { p: [0, 0, 0.1, 0.1, 0.2, 0], c: '#000', w: 4 }
  const pb = shapeBounds(pen)
  const bigPen = resizeShape(pen, pb, { x: 0, y: 0, w: pb.w * 3, h: pb.h * 3 })
  assert.equal(bigPen.p.length, 6, 'every point survives')
  assert.equal(shapeBounds(bigPen).w.toFixed(3), '0.600', 'and the whole path is three times wider')
}

console.log('strokes: select, move and resize passed')

/* ---------- copy and paste ---------- */
{
  const node: Stroke = { k: 'node', n: 'cache', p: [0.1, 0.1, 0.3, 0.22], c: '#c2831f', w: 4, t: 'Redis' }

  const pasted = centreShapeAt(node, 0.7, 0.5)
  const b = shapeBounds(pasted)
  assert.equal((b.x + b.w / 2).toFixed(4), '0.7000', 'a paste lands centred on the cursor, horizontally')
  assert.equal((b.y + b.h / 2).toFixed(4), '0.5000', 'and vertically')
  assert.equal(b.w.toFixed(4), shapeBounds(node).w.toFixed(4), 'and keeps its size')
  assert.equal(pasted.n, 'cache', 'and its component type')
  assert.equal(pasted.t, 'Redis', 'and the name you gave it')

  // the original is untouched — a copy must not move what it came from
  assert.deepEqual(node.p, [0.1, 0.1, 0.3, 0.22], 'copying does not move the original')

  // a label is anchored at a point, and still centres sensibly
  const label: Stroke = { k: 'text', p: [0.2, 0.2], c: '#000', w: 4, t: 'API' }
  const lp = centreShapeAt(label, 0.5, 0.5)
  const lb = shapeBounds(lp)
  assert.equal((lb.x + lb.w / 2).toFixed(3), '0.500', 'a pasted label centres too')
  assert.equal(lp.t, 'API', 'and keeps its words')

  // pasting an arrow keeps its style flags
  const arrow: Stroke = { k: 'arrow', p: [0, 0, 0.2, 0], c: '#000', w: 4, a: 'both', d: 1 }
  const ap = centreShapeAt(arrow, 0.5, 0.5)
  assert.equal(ap.a, 'both', 'arrowheads survive a paste')
  assert.equal(ap.d, 1, 'and so does dashing')
}

console.log('strokes: copy and paste passed')
