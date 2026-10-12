/**
 * Self-check for challenge merging and grading — run with `npx tsx lib/challenge.test.ts`.
 */
import assert from 'node:assert/strict'
import { forbidden, mergeForTest, verdict, visibleOutput } from './challenge'

const learner = `package main

import (
\t"strings" // for ToUpper
\t"fmt"
) // end of imports

import "unicode" // single line with a comment

func Shout(s string) string { return strings.ToUpper(s) + "!" } // trailing
func debug() { fmt.Println("x", unicode.IsUpper('A')) }`

const test = `package main

import "testing"
import "strings"

func TestShout(t *testing.T) {
\tif Shout("go") != strings.ToUpper("go")+"!" {
\t\tt.Fail()
\t}
}`

const merged = mergeForTest(learner, test, 'abc123')
assert.equal((merged.match(/^package main/gm) ?? []).length, 1, 'one package clause')
assert.equal((merged.match(/^import/gm) ?? []).length, 1, 'one import block')
for (const p of ['"strings"', '"fmt"', '"testing"', '"unicode"', '"os"'])
  assert.equal((merged.match(new RegExp(`^\\t${p}$`, 'm')) ?? []).length, 1, `${p} imported exactly once`)
assert.ok(merged.indexOf('func Shout') < merged.indexOf('func TestShout'), 'learner code first')
assert.ok(merged.includes('challenge-ok:abc123'), 'harness carries the nonce')
assert.ok(!merged.includes('end of imports'), 'comment after ) is not left as code')

// aliases are kept distinct from the plain import
const aliased = mergeForTest('package main\n\nimport str "strings"\n\nfunc F() string { return str.ToLower("A") }', test, 'n')
assert.ok(/\tstr "strings"/.test(aliased) && /\t"strings"/.test(aliased))

// learner code that would skip or fake the tests is refused
assert.match(forbidden('func main() {}') ?? '', /func main/)
assert.match(forbidden('func init() { println("PASS") }') ?? '', /func init/)
assert.match(forbidden('func TestMain(m *testing.M) {}') ?? '', /Test functions/)
assert.match(forbidden('func F() { os.Exit(0) }') ?? '', /os\.Exit/)
assert.equal(forbidden('// func main() is not needed\nfunc F() int { return 1 }'), null, 'comments do not count')

// verdicts need the nonce, not just the word PASS
const pass = '=== RUN   TestShout\n--- PASS: TestShout (0.00s)\nPASS\nchallenge-ok:n1\n'
assert.deepEqual(verdict(pass, '', 'n1'), { passed: true })
assert.equal(verdict(pass, '', 'other').passed, false, 'stale or guessed nonce')
assert.equal(verdict('PASS\nok\n', '', 'n1').passed, false, 'printing PASS is not passing')
assert.equal(verdict('=== RUN   TestShout\n--- FAIL: TestShout (0.00s)\nFAIL\n', '', 'n1').passed, false)
assert.equal(verdict('', './prog.go:3:1: syntax error', 'n1').passed, false)
assert.equal(visibleOutput(pass).includes('challenge-ok'), false)

console.log('challenge: all checks passed')
