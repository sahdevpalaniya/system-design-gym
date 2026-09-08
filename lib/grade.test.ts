/**
 * Self-check for the self-grading honesty hint — run with `npx tsx lib/grade.test.ts`.
 *
 * Lives in its own file rather than behind a `require.main === module` guard,
 * because grade.ts is imported by a client component and `module` does not
 * exist in a browser bundle.
 */
import assert from 'node:assert/strict'
import { unsupportedTicks } from './grade'

const list = [
  'Asked about custom short codes — it changes the write path',
  'Estimated storage and concluded it fits on one machine',
]
const good =
  'I would assume users can choose their own custom short code, because that adds a uniqueness check on the write path. Storage is about a terabyte after five years which fits on one machine.'
const bad =
  'I would put a load balancer in front of several application servers and use a cache to make the redirect fast for everybody who clicks a link.'

assert.equal(unsupportedTicks(good, list, [0, 1]).length, 0, 'supported ticks must not warn')
assert.equal(unsupportedTicks(bad, list, [0, 1]).length, 2, 'unsupported ticks must warn')
assert.equal(unsupportedTicks('too short', list, [0, 1]).length, 0, 'short answers are not judged')
assert.equal(unsupportedTicks(good, list, []).length, 0, 'unticked items are never flagged')

console.log('grade: all assertions passed')
