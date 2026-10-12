/**
 * Coding challenges are graded by hidden tests on the Go Playground. The
 * Playground runs `go test` only for ONE file that has Test funcs and no
 * func main, so the learner's code and the hidden test are merged here: one
 * package clause, one import block holding both sets of imports, then the
 * learner's declarations, the tests, and a TestMain of ours.
 *
 * Our TestMain prints a per-run nonce only when every test passed, and the
 * verdict requires that exact line, so printing "PASS" yourself does not pass.
 * ponytail: the nonce is made in the browser, so this stops accidental and
 * casual fake passes, not a determined learner editing the page. Grade on the
 * server before any pass is ever recorded or rewarded.
 */

/** Strip // comments that are not inside a string or rune literal. Good
 *  enough for import lines, which are all we use it on. */
function stripLineComment(line: string): string {
  let inStr: string | null = null
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inStr) {
      if (c === '\\' && inStr !== '`') i++
      else if (c === inStr) inStr = null
    } else if (c === '"' || c === '`' || c === "'") inStr = c
    else if (c === '/' && line[i + 1] === '/') return line.slice(0, i)
  }
  return line
}

/** One import spec, normalised: `"fmt"`, `str "strings"`, `_ "embed"`. */
function normSpec(spec: string): string | null {
  const m = stripLineComment(spec).trim().match(/^(?:([\w.]+)\s+)?("[^"]+")$/)
  return m ? (m[1] ? `${m[1]} ${m[2]}` : m[2]) : null
}

/** Split a Go file into its import specs and everything after them. */
function splitImports(src: string): { imports: string[]; rest: string } {
  const imports: string[] = []
  const out: string[] = []
  const lines = src.split('\n')
  let inBlock = false
  for (const raw of lines) {
    const line = stripLineComment(raw).trim()
    if (inBlock) {
      if (line.startsWith(')')) inBlock = false
      else if (line) {
        const s = normSpec(line)
        if (s) imports.push(s)
      }
      continue
    }
    if (/^package\s+\w+$/.test(line)) continue
    if (/^import\s*\($/.test(line)) {
      inBlock = true
      continue
    }
    const one = line.match(/^import\s+(.+)$/)
    if (one) {
      const s = normSpec(one[1])
      if (s) imports.push(s)
      continue
    }
    out.push(raw)
  }
  return { imports, rest: out.join('\n').trim() }
}

/** Things in learner code that would let it skip or fake the hidden tests. */
export function forbidden(learner: string): string | null {
  const code = learner.split('\n').map(stripLineComment).join('\n')
  if (/\bfunc\s+main\s*\(/.test(code)) return 'Remove func main: the tests call your function directly.'
  if (/\bfunc\s+init\s*\(/.test(code)) return 'Remove func init: it runs before the tests and is not allowed here.'
  if (/\bfunc\s+(TestMain|Test\w*)\s*\(/.test(code)) return 'Do not write Test functions here: the hidden tests are added for you.'
  if (/\bos\.Exit\s*\(/.test(code)) return 'Do not call os.Exit: return values instead, and the tests will check them.'
  return null
}

export function newNonce(): string {
  const a = new Uint8Array(8)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function mergeForTest(learner: string, test: string, nonce: string): string {
  const a = splitImports(learner)
  const b = splitImports(test)
  const harness = `func TestMain(m *testing.M) {
\tcode := m.Run()
\tif code == 0 {
\t\tfmt.Println("challenge-ok:${nonce}")
\t}
\tos.Exit(code)
}`
  const imports = [...new Set([...a.imports, ...b.imports, '"fmt"', '"os"', '"testing"'])]
  const block = `import (\n${imports.map((i) => `\t${i}`).join('\n')}\n)\n\n`
  // the harness needs fmt and os even if nothing else does; a blank use keeps
  // "imported and not used" away whichever of them the learner also imports
  return `package main\n\n${block}${a.rest}\n\n${b.rest}\n\n${harness}\n\nvar _ = fmt.Sprint\nvar _ = os.Getenv\n`
}

export type TestVerdict = { passed: boolean; message?: string }

/** Read `go test -v` output; a pass needs our nonce line, not just "PASS". */
export function verdict(output: string, compileErrors: string, nonce: string): TestVerdict {
  if (compileErrors) return { passed: false, message: compileErrors }
  const ok = output.split('\n').some((l) => l.trim() === `challenge-ok:${nonce}`)
  if (ok && !/^(--- FAIL|FAIL)/m.test(output)) return { passed: true }
  if (!/=== RUN/.test(output)) return { passed: false, message: 'No tests ran. Check that your code compiles and has no func main.' }
  return { passed: false }
}

/** What the learner sees: the run output without our nonce line. */
export function visibleOutput(output: string): string {
  return output
    .split('\n')
    .filter((l) => !l.startsWith('challenge-ok:'))
    .join('\n')
}
