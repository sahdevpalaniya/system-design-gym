# Dev Learning

Two learning tracks in one app: **System Design** and **Go**. Pick a track from the tabs in the
header and the whole sidebar switches to it.

**One rule above all others: you write your own answer before you see ours.** Reading solutions
feels like learning but only builds recognition. Writing first, then comparing, builds the ability
to produce an answer on a blank page.

## Running it

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
npm start         # serve the build
npx tsx --test lib/*.test.ts    # unit tests
```

No backend and no accounts required. Progress lives in `localStorage`, and signing in with Google
syncs it across devices if `DATABASE_URL` and the NextAuth env vars are set.

## Folder structure

```
dev-learning/
├── app/                        routes (Next.js App Router)
│   ├── api/play/               proxies the Go Playground for the Run button
│   ├── languages/[lang]/       the Go track: topics, revision, tests
│   ├── concepts/ problems/ …   the System Design track
│   └── api/                    auth and progress sync
├── components/
│   ├── common/                 Nav, ui, theme, progress — shared by both tracks
│   ├── golang/                 code blocks, folder trees, quiz runner
│   └── system-design/          stage engine, whiteboard, concept check
├── content/
│   ├── golang/                 the Go curriculum
│   ├── system-design/          concepts, problems, deep dives, companies
│   └── languages.ts            the track registry
├── lib/                        types, progress store, grading, tests
└── migrations/                 Postgres schema for progress sync
```

Adding a second language means one folder under `content/` and one line in `content/languages.ts`.
The header tab and the whole sidebar appear on their own.

## The Go track

73 topics in 13 sections, in a fixed order. Every topic opens with a plain-English definition
before any code, and ends with one thing to build plus a few short drills for your own editor.

**The ecosystem** — two topics on the packages people actually use (gin, chi, echo, fiber, GORM,
sqlx, sqlc, testify, cobra, zap, errgroup and the rest), with the same job written each way so you
can recognise any Go codebase on sight.

**Language** — one topic per idea, W3Schools style: syntax, printing, data types, constants, operators,
type conversion, control flow, functions, defer, slices, maps, strings, pointers, structs, methods,
interfaces, errors, packages, JSON, testing, goroutines, channels, mutexes, context, generics, tooling.

**Runnable examples** — 34 complete programs with a **▶ Run** button that executes them on the
official Go Playground and shows the output inline. Every one is compiled and run by a verification
script before it ships, and the button never appears on code that has not passed. You can work through the whole
language section in a browser before installing anything.

**Practice projects** — the same CRUD API built three times, in a flat layout, a layered one, and
one folder per feature, so the trade-offs are something you have felt rather than read.

**Three real projects**, each built step by step with every command included:

| Project | What it adds |
|---|---|
| **URL shortener** | validation, generated ids, storage, redirects, Postgres, Docker |
| **Expense tracker** | accounts, password hashing, JWTs, middleware, per-user data, sessions |
| **Small shop** | roles, file uploads, serving files, carts, checkout in a transaction |

**Interview preparation** — five topics covering language, concurrency, backend design, the live
coding round, and a final checklist.

**Testing yourself** — a quick-revision page with every topic condensed, and 118 multiple choice
questions across 13 tests — one for each major section, plus a mixed final. Every answer is explained,
and a wrong one links back to its topic. The 187 editor drills have revealable answers for when you
get stuck.

## The System Design track

**The five-stage method** — every problem is worked through Requirements → Actors and lifecycle →
Numbers → High-level design → Deep dive and tradeoffs. The UI gates them: stage N's model answer
stays locked until you submit your own attempt.

**26 concepts** across three tiers. Every page has the same shape: what problem it solves, what it
costs you (mandatory — no cost, no page), when to use it and when not to, a visual, the follow-up
an interviewer will ask, and a 60-second self-check.

**16 problems** grouped by shape, worked solutions, company question banks, interviewer
archetypes, timed mocks, and spaced-repetition concept checks.

## Progress

Both tracks share one progress store: what you have read, how you rated yourself, your streak,
and your quiz scores. It works signed out, and merges cleanly if you sign in on a device that
already has local progress.

## Stack

Next.js 16, React 19, TypeScript, Tailwind 4, Postgres (optional, for sync only). No UI library,
no state library, no chart library.
