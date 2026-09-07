# System Design Gym

A web app that teaches system design from zero to interview-ready.

**One rule above all others: you write your own answer before you see ours.** Reading solutions
feels like learning but only builds recognition. Writing first, then comparing, builds the ability
to produce an answer on a blank whiteboard. Every learning screen follows the same loop — try it,
submit, see the model answer, compare, record what you missed.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static export of 58 pages
```

No database, no accounts, no backend. All progress lives in `localStorage`.

## What's in it

**The five-stage method** — every design problem is worked through Requirements → Actors and
lifecycle → Numbers → High-level design → Deep dive and tradeoffs. The UI gates them: stage N's
model answer stays locked (and out of the DOM) until you submit your own attempt for stage N.

**Track A — 26 concepts** across three tiers. Every page has the same shape: what problem it
solves, what it costs you (mandatory — no cost, no page), when to use it and when not to, a
visual, the follow-up an interviewer will ask, and a 60-second self-check you answer before
revealing.

**Track B — 10 problems**, one for each of the ten shapes. Grouped by the *shape of the problem*
rather than by product name, because two different-looking products are usually the same problem —
and two identical-looking ones often are not. Every problem answers **"where's the slack?"**: how
much time the system has before a human notices. Ride hailing has none; food delivery has fifteen
minutes of cooking to hide latency inside. Same shape, opposite designs.

**Track C — 6 interviewer archetypes**, described by behaviour rather than by company. Picking one
changes which follow-up questions fire and how the rubric is weighted.

**The follow-up engine** — 56 questions, 8 in each of seven categories. Ninety seconds to defend
your design, then three reveals: what a weak answer sounds like, what a strong one sounds like, and
the trap hidden in the question.

**Five practice modes** — Daily Rep (15 min, stages 1–2), Timed Mock (45 min, nothing revealed
until the end), Follow-up Blitz (10 min), Concept Check (5 min, spaced repetition), and Blank Page.

**Progress tracking** — a six-axis rubric (Requirements, Lifecycle, Numbers, Design, Tradeoffs,
Defence) shown as a radar chart and tracked over time; a curriculum map coloured by state; answer
history side by side with model answers; JSON export and clear-all.

**The Gap Log** is the smallest feature with the biggest effect. After every attempt you write one
line about what you missed, in your own words. The app tags it and surfaces the pattern:

> You missed idempotency in 6 of your last 9 attempts.

Nobody can fix "I'm bad at system design". Anybody can fix "I always forget idempotency".

## Layout

```
app/         routes — home, concepts, problems, drills, archetypes, map, progress, practice/*
components/  visual library (all inline SVG/CSS), the stage engine, drills, shared UI
content/     the whole curriculum as typed TS — concepts, problems, follow-ups, archetypes
lib/         types and the localStorage progress store
```

All visuals are code: `Diagram`, `LifecycleChain`, `AnimatedFlow` (pausable, respects
`prefers-reduced-motion`), `CompareCards`, `NumbersBar`, `Callout`. No external images, no stock
photos, no GIFs — so everything themes correctly in light and dark mode and loads instantly.

## A known limit

The app is fully static, so the model answers ship inside the client bundle. The gate is a real
UX gate, not a security boundary — someone determined could read them in devtools. Closing that
would require a server, which the design deliberately avoids.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · localStorage · deploys to Vercel with no
configuration.
