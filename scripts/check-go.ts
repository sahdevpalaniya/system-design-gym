/**
 * Compiles every Go code block in the course with the local toolchain, so a
 * broken example fails here instead of in front of a learner.
 *
 *   npx tsx scripts/check-go.ts            # report
 *   npx tsx scripts/check-go.ts --verbose  # also print each compiler error
 *
 * What is checked, per block:
 *   - `run` (the Run button program): `go vet` must pass, and it must print something.
 *   - `src` that is a whole file (starts with `package`): `go vet` when it only
 *     imports the standard library, otherwise `gofmt -e` (syntax only, since
 *     third-party modules are not downloaded here).
 *   - `src` that is a Go fragment: wrapped in `func main()` and syntax-checked
 *     with `gofmt -e`. Fragments made of declarations (func/type) are checked
 *     at file level instead.
 *   - Blocks labelled as a shell, SQL, YAML, etc. are skipped.
 *
 * ponytail: language detection is a heuristic on the label and first line.
 * Add an explicit `lang` field to LangCode if it ever misclassifies.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GO } from "../content/golang";
import { forbidden, mergeForTest, newNonce, verdict } from "../lib/challenge";

const verbose = process.argv.includes("--verbose");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const dir = mkdtempSync(join(tmpdir(), "check-go-"));
writeFileSync(join(dir, "go.mod"), "module check\n\ngo 1.25\n");

const NOT_GO =
  /terminal|shell|bash|\$ |sql|yaml|yml|json|dockerfile|makefile|env|\.toml|output|http|curl|text|txt|\.mod\b|go\.sum/i;

function looksLikeGo(label: string | undefined, src: string): boolean {
  if (label && /\.go\b/i.test(label)) return true;
  if (label && NOT_GO.test(label)) return false;
  const first = src.trimStart().split("\n")[0];
  if (
    /^(\$|#|go |npm |curl |SELECT|CREATE|INSERT|docker|git |FROM )/i.test(first)
  )
    return false;
  return /(:=|func |package |import |fmt\.|return |if err|type \w+ (struct|interface)|var \w+)/.test(
    src,
  );
}

/** No import path with a dot in its first element (github.com/..., d07/calc is a local module). */
function stdlibOnly(src: string): boolean {
  const block =
    src.match(/import\s*\(([\s\S]*?)\)/)?.[1] ??
    src.match(/import\s+[^\n]+/)?.[0] ??
    "";
  const paths = [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return paths.every(
    (p) =>
      (!p.split("/")[0].includes(".") && !/^[a-z0-9]+\/[a-z]/.test(p)) ||
      /^(net|encoding|crypto|io|os|path|text|html|image|go|database|archive|compress|container|debug|hash|index|log|math|mime|runtime|sync|testing|unicode|iter|maps|slices|cmp)\//.test(
        p,
      ),
  );
}

function sh(cmd: string, args: string[]): string | null {
  try {
    execFileSync(cmd, args, { cwd: dir, stdio: "pipe", timeout: 60_000 });
    return null;
  } catch (e) {
    const err = e as { stderr?: Buffer; stdout?: Buffer; message: string };
    return (
      err.stderr?.toString() ||
      err.stdout?.toString() ||
      err.message
    ).trim();
  }
}

/** Compiles, vets and runs on the official Go Playground, which tracks the
 *  latest Go release, the same backend the Run button uses. The local
 *  toolchain may be older than the APIs the course teaches. */
async function playgroundOnce(
  src: string,
  vet = true,
): Promise<{ out: string; err: string | null }> {
  const body = new URLSearchParams({
    version: "2",
    body: src,
    withVet: vet ? "true" : "false",
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("https://go.dev/_/compile", {
        method: "POST",
        body,
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`playground HTTP ${res.status}`);
      const d = (await res.json()) as {
        Errors?: string;
        VetErrors?: string;
        Events?: { Message: string; Kind: string }[] | null;
      };
      const out = (d.Events ?? [])
        .filter((e) => e.Kind === "stdout")
        .map((e) => e.Message)
        .join("");
      const stderr = (d.Events ?? [])
        .filter((e) => e.Kind === "stderr")
        .map((e) => e.Message)
        .join("");
      return {
        out,
        err:
          d.Errors ||
          d.VetErrors ||
          (/panic:|fatal error:/.test(stderr) &&
          !/deliberate|on purpose/i.test(src)
            ? stderr
            : null) ||
          null,
      };
    } catch (e) {
      if (attempt === 2)
        return {
          out: "",
          err: `could not reach playground: ${(e as Error).message}`,
        };
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return { out: "", err: "unreachable" };
}

/** Like the app: retry once when the Playground hits its build time limit. */
async function playground(src: string, vet = true): Promise<{ out: string; err: string | null }> {
  const first = await playgroundOnce(src, vet)
  if (first.err && /timeout running go build/.test(first.err)) return playgroundOnce(src, vet)
  return first
}

function checkSyntax(src: string): string | null {
  const f = join(dir, "main.go");
  writeFileSync(f, src);
  return sh("gofmt", ["-e", "-l", f]);
}

/** Top-level declarations (func/type/var/const/import, until their closing
 *  brace at column 0) go to file level; every other line goes inside main. */
function splitFragment(src: string): string {
  const top: string[] = [];
  const body: string[] = [];
  let inDecl = false;
  for (const line of src.split("\n")) {
    if (!inDecl && /^(func|type|var|const|import)\b/.test(line)) {
      inDecl = !/^(\S.*[^{(]\s*)$/.test(line) || /[{(]\s*$/.test(line);
      top.push(line);
      if (!/[{(]\s*$/.test(line)) inDecl = false;
      continue;
    }
    if (inDecl) {
      top.push(line);
      if (/^[})]/.test(line)) inDecl = false;
      continue;
    }
    body.push(line);
  }
  return `package main\n${top.join("\n")}\nfunc main() {\n${body.join("\n")}\n}\n`;
}

function checkFragment(src: string): string | null {
  const f = join(dir, "frag.go");
  // an excerpt may elide code with a bare "..." line; that is a convention, not an error
  const s = src.replace(/^(\s*)\.\.\.\s*$/gm, "$1// ...");
  let firstErr: string | null = null;
  for (const wrapped of [
    `package main\n${s}\n`,
    `package main\nfunc main() {\n${s}\n}\n`,
    splitFragment(s),
  ]) {
    writeFileSync(f, wrapped);
    const err = sh("gofmt", ["-e", "-l", f]);
    if (!err) return null;
    firstErr ??= err;
  }
  return firstErr;
}

type Failure = { lesson: string; label: string; kind: string; error: string };
const failures: Failure[] = [];
let checked = 0;
let skipped = 0;

async function main() {
  for (const lesson of GO.lessons.filter(
    (l) => !only || only.split(",").includes(l.slug),
  )) {
    for (const b of lesson.blocks) {
      const c = b.code;
      if (!c) continue;
      const label = c.label ?? "(no label)";

      if (c.run) {
        checked++;
        const { out, err } = await playground(c.run);
        if (err)
          failures.push({
            lesson: lesson.slug,
            label,
            kind: "run: playground",
            error: err,
          });
        else if (!out.trim())
          failures.push({
            lesson: lesson.slug,
            label,
            kind: "run: prints nothing",
            error: "program produced no output",
          });
      }

      if (!looksLikeGo(c.label, c.src)) {
        skipped++;
        continue;
      }
      checked++;
      const whole = /^\s*(\/\/.*\n\s*)*package \w+/.test(c.src);
      // a whole stdlib-only `package main` file is compiled for real; anything
      // else (other packages, third-party imports, excerpts) is syntax-checked
      const compilable =
        whole &&
        /^\s*(\/\/.*\n\s*)*package main/.test(c.src) &&
        stdlibOnly(c.src);
      const err = compilable
        ? (await playground(c.src)).err
        : whole
          ? checkSyntax(c.src)
          : checkFragment(c.src);
      if (err)
        failures.push({
          lesson: lesson.slug,
          label,
          kind: compilable
            ? "src: playground"
            : whole
              ? "src: file"
              : "src: fragment",
          error: err,
        });
      if (c.canRun && !c.run && !compilable)
        failures.push({
          lesson: lesson.slug,
          label,
          kind: "canRun",
          error: "canRun is set but src is not a complete stdlib-only program",
        });
    }

    // a challenge must be solvable (solution passes its hidden tests) and not
    // already solved (the untouched starter fails them)
    const ch = lesson.challenge;
    if (ch) {
      checked++;
      for (const [which, code, wantPass] of [
        ["solution", ch.solution, true],
        ["starter", ch.starter, false],
      ] as const) {
        const refused = forbidden(code);
        if (refused) {
          failures.push({ lesson: lesson.slug, label: "challenge", kind: `challenge: ${which}`, error: refused });
          continue;
        }
        if (/\bfunc\s+TestMain\s*\(/.test(ch.test)) {
          failures.push({ lesson: lesson.slug, label: "challenge", kind: "challenge: test", error: "the hidden test must not define TestMain (the app adds its own)" });
          break;
        }
        const nonce = newNonce();
        // same as the app: challenge runs skip the separate vet pass
        const { out, err } = await playground(mergeForTest(code, ch.test, nonce), false);
        const v = verdict(out, which === "starter" ? "" : (err ?? ""), nonce);
        // a starter that does not compile is fine: it is meant to be filled in
        if (which === "starter" && err) continue;
        if (v.passed !== wantPass)
          failures.push({
            lesson: lesson.slug,
            label: "challenge",
            kind: `challenge: ${which}`,
            error: wantPass
              ? `solution does not pass its tests: ${v.message ?? out}`
              : "the untouched starter already passes the tests",
          });
      }
    }
  }
}

main().then(() => {
  rmSync(dir, { recursive: true, force: true });

  console.log(
    `checked ${checked} Go blocks, skipped ${skipped} non-Go blocks, ${failures.length} failing`,
  );
  for (const f of failures) {
    const first = f.error.split("\n").find((l) => l.trim()) ?? "";
    console.log(
      `  ✗ ${f.lesson} · ${f.label} · ${f.kind}: ${verbose ? "\n" + f.error : first}`,
    );
  }
  process.exit(failures.length ? 1 : 0);
});
