/**
 * Self-check for the teaching order — run with `npx tsx content/system-design/concepts/prereqs.test.ts`.
 *
 * The sequence is the product. If a concept is ever taught before something it
 * depends on, the page reads as gibberish to the person it was written for, and
 * nothing else in the build catches it.
 */
import assert from 'node:assert/strict'
import { CONCEPTS, PATH } from './index'
import { PREREQS } from './prereqs'

const slugs = CONCEPTS.map((c) => c.slug)
const order = PATH.flatMap((s) => s.concepts ?? [])
const at = new Map(order.map((s, i) => [s, i]))

// the graph and the curriculum describe the same 44 concepts
assert.deepEqual(
  slugs.filter((s) => !(s in PREREQS)),
  [],
  'concept missing from PREREQS',
)
assert.deepEqual(
  Object.keys(PREREQS).filter((s) => !slugs.includes(s)),
  [],
  'PREREQS names a concept that does not exist',
)
assert.deepEqual(
  slugs.filter((s) => !at.has(s)),
  [],
  'concept exists but is not on the path',
)
assert.equal(order.length, new Set(order).size, 'a concept appears twice on the path')

// every prerequisite is taught first
const violations = Object.entries(PREREQS).flatMap(([slug, needs]) =>
  needs
    .filter((p) => at.get(p)! >= at.get(slug)!)
    .map((p) => `${slug} (#${at.get(slug)! + 1}) is taught before its prerequisite ${p} (#${at.get(p)! + 1})`),
)
assert.deepEqual(violations, [], '\n  ' + violations.join('\n  '))

// every stage after the intro teaches something
for (const st of PATH) {
  assert.ok(
    (st.concepts?.length ?? 0) + (st.lessons?.length ?? 0) > 0,
    `stage "${st.id}" is empty`,
  )
}

// every concept points somewhere authoritative, over https, with no dead shape
const noRefs = CONCEPTS.filter((c) => !c.refs?.length).map((c) => c.slug)
assert.deepEqual(noRefs, [], `concepts with no source links: ${noRefs.join(', ')}`)

const badHref = CONCEPTS.flatMap((c) =>
  (c.refs ?? [])
    .filter((r) => !/^https:\/\/[^/]+\./.test(r.href) || !r.label.trim())
    .map((r) => `${c.slug}: ${r.href}`),
)
assert.deepEqual(badHref, [], `malformed source links: ${badHref.join(', ')}`)

// every concept gives the learner a way forward without handing over the answer
const noHints = CONCEPTS.filter((c) => !c.hints?.length).map((c) => c.slug)
assert.deepEqual(noHints, [], `concepts with no hints: ${noHints.join(', ')}`)

// a hint that contains the answer defeats the point of writing your own first
const leaky = CONCEPTS.filter((c) =>
  (c.hints ?? []).some((h) => h.trim().length > 260),
).map((c) => c.slug)
assert.deepEqual(leaky, [], `hints long enough to be answers: ${leaky.join(', ')}`)

console.log(`✓ hints: ${CONCEPTS.reduce((n, c) => n + (c.hints?.length ?? 0), 0)} nudges across ${CONCEPTS.length} concepts`)

console.log(`✓ sources: ${CONCEPTS.reduce((n, c) => n + (c.refs?.length ?? 0), 0)} links across ${CONCEPTS.length} concepts`)

console.log(`✓ teaching order holds: ${order.length} concepts, ${Object.values(PREREQS).flat().length} prerequisite edges, 0 violations`)
