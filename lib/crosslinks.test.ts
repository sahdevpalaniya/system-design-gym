/**
 * Self-check that every cross-track link points at a real page — run with
 * `npx tsx lib/crosslinks.test.ts`.
 */
import assert from 'node:assert/strict'
import { ALL_CROSSLINK_PATHS, crossLinksFor, describeForCheck } from '../content/crosslinks'

const dead = ALL_CROSSLINK_PATHS.filter((p) => !describeForCheck(p))
assert.deepEqual(dead, [], `cross-links to pages that do not exist: ${dead.join(', ')}`)
assert.ok(crossLinksFor('/problems/url-shortener').some((x) => x.path === '/languages/go/shortener-overview'))
assert.ok(crossLinksFor('/problems/url-shortener').every((x) => x.path !== '/problems/url-shortener'), 'never links to itself')
assert.deepEqual(crossLinksFor('/no/such/page'), [])
console.log('crosslinks: all checks passed')
