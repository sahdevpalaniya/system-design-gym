/** Self-check for component search ranking — `npx tsx lib/stencils.test.ts`. */
import assert from 'node:assert/strict'
import { STENCILS, searchStencils } from './stencils'

const first = (q: string) => searchStencils(q)[0]?.label

// the thing you named should win over things that merely mention it
assert.equal(first('cache'), 'Cache', 'Cache beats CDN, whose keywords mention caching')
assert.equal(first('search'), 'Search index', 'Search index beats the "Storage & search" group')
assert.equal(first('queue'), 'Queue', 'Queue beats Dead letter queue')
assert.equal(first('database'), 'SQL database', 'the first database is a plain SQL one')

// product names people actually think in
assert.equal(first('redis'), 'Cache', 'redis finds the cache')
assert.equal(first('kafka'), 'Event log', 'kafka finds the event log')
assert.equal(first('s3'), 'Object storage', 's3 finds object storage')
assert.equal(first('oauth'), 'Auth service', 'oauth finds auth')
assert.equal(first('kubernetes'), 'Orchestrator', 'kubernetes finds the orchestrator')
assert.equal(first('postgres'), 'SQL database', 'postgres finds the SQL database')

assert.equal(searchStencils('').length, STENCILS.length, 'an empty search shows everything')
assert.deepEqual(searchStencils('zzzz'), [], 'nonsense matches nothing')
assert.ok(searchStencils('Cache').length > 0, 'search is case-insensitive')

console.log('stencils: search ranking passed')
