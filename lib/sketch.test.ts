/**
 * Self-check for the sketch parser — run with `npx tsx lib/sketch.test.ts`.
 *
 * Separate file for the same reason as grade.test.ts: sketch.ts ships to the
 * browser, where `module` is not defined.
 */
import assert from 'node:assert/strict'
import { parseSketch } from './sketch'

const a = parseSketch('client -> lb -> app -> db\napp -> cache: hit 99%')
assert.ok(a.spec, 'should parse')
assert.equal(a.spec!.nodes.length, 5, 'five distinct boxes')
assert.equal(a.spec!.edges.length, 4, 'four arrows')
assert.ok(a.spec!.edges.some((e) => e.label === 'hit 99%'), 'label attaches to the last arrow')
assert.equal(a.spec!.nodes.find((n) => n.id === 'db')!.kind, 'store', 'db is a store')
assert.equal(a.spec!.nodes.find((n) => n.id === 'client')!.kind, 'client', 'client is a client')
assert.equal(a.spec!.nodes.find((n) => n.id === 'db')!.col, 3, 'db sits three columns along')

// a cycle must terminate rather than loop forever
const b = parseSketch('a -> b\nb -> a')
assert.equal(b.spec?.nodes.length, 2, 'cycles still render')

const c = parseSketch('client -> app\nlonely')
assert.ok(c.notes.some((n) => n.includes('lonely')), 'orphan node should be flagged')

assert.equal(parseSketch('   \n# just a comment').spec, null, 'empty input yields nothing')

// a store or cache is a legitimate place for a request to end; a service is not
const d = parseSketch('client -> app -> db\napp -> cache')
assert.ok(!d.notes.some((n) => n.includes('Nothing leaves')), 'stores and caches are valid endpoints')
const e = parseSketch('client -> app -> transcoder')
assert.ok(e.notes.some((n) => n.includes('transcoder')), 'a service nothing leaves is still flagged')

console.log('sketch: all assertions passed')
