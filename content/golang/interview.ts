import type { LangLesson } from '@/lib/types'

/**
 * Interview preparation. Not a new syllabus — a pass back over everything in
 * the track, shaped the way it actually gets asked, with the answer you would
 * say out loud rather than the one you would write in a doc.
 */
export const INTERVIEW: LangLesson[] = [
  {
    slug: 'interview-language-fundamentals',
    title: 'Interview: language fundamentals',
    navTitle: 'Interview — language',
    oneLine: 'The questions that open almost every Go interview, and the answer that shows you have actually written Go.',
    blocks: [
      {
        body: [
          'These get asked because they separate people who read a tutorial from people who shipped something. In each case the short answer is the first line — say it, then add the second line only if they want more. Rambling makes you sound unsure.',
        ],
      },
      {
        heading: '"Why would you choose Go?"',
        bullets: [
          '**Say:** one static binary with no runtime to install, concurrency built into the language, fast compiles, and a standard library big enough that most services need almost no dependencies.',
          '**Then the honest cost:** more verbose error handling than exceptions, a small standard set of abstractions, and no built-in dependency injection or ORM — you write more by hand.',
          '**Do not say:** "it is fast". So is everything else they are comparing it to, and it invites a benchmark argument you cannot win.',
        ],
      },
      {
        heading: '"What is a zero value, and why does it matter?"',
        bullets: [
          'Every type has a defined default — `0`, `""`, `false`, `nil` for pointers/slices/maps/channels/funcs/interfaces. There is no undefined.',
          'What you get from this: `var b bytes.Buffer`, `var mu sync.Mutex` and `var wg sync.WaitGroup` are all usable immediately, with no constructor. Designing your own types so the zero value works removes a whole class of "did you call New?" bugs.',
          'The trap they are usually fishing for: a `nil` map reads fine but **panics on write**, so a map field in a struct needs `make`.',
        ],
      },
      {
        heading: '"Slice versus array?"',
        code: {
          label: 'the answer, in code',
          src: `// Array: the length is part of the TYPE. [3]int and [4]int are different types.
// Passing one copies the whole thing.
var a [3]int

// Slice: a three-field header — pointer, len, cap — over an array.
s := []int{1, 2, 3}`,
          note: 'Then add the part they are really asking about: two slices can share a backing array, so a write through one is visible through the other.',
        },
      },
      {
        heading: '"Why does append return a value?"',
        bullets: [
          'Because it may need to allocate a bigger array and copy. When it does, the old header is stale — so `append` returns the new one and you must write `s = append(s, x)`.',
          '**The follow-up:** "what happens if two slices share a backing array and both append?" One silently overwrites the other’s element. One slice, one appender.',
        ],
      },
      {
        heading: '"How does Go handle errors, and do you like it?"',
        bullets: [
          'An error is an ordinary value returned alongside the result. No exceptions, no hidden jumps — every failure point is visible in the code you are reading.',
          'Say what you actually do: wrap with `%w` and context (`fmt.Errorf("get user %d: %w", id, err)`), use `errors.Is` for sentinels, `errors.As` for typed errors, and handle each error **once** — log it or return it, never both.',
          'Be honest about the cost: it is more lines than try/catch, and a bare `return err` six layers deep gives you a useless message. That honesty scores better than defending it as perfect.',
        ],
      },
      {
        heading: '"What is the difference between a value and a pointer receiver?"',
        bullets: [
          'A value receiver gets a copy, so mutation is lost. A pointer receiver can mutate.',
          'The rule: pointer if you mutate, if the struct is large, or if it contains a `sync.Mutex` — and then make them all pointers for consistency.',
          '**The part that catches people:** interface satisfaction uses the strict method set. The method set of `T` has only value-receiver methods; `*T` has both. That is why `var s Shape = User{}` fails with "method has pointer receiver" and `&User{}` works.',
        ],
      },
      {
        heading: '"Explain interfaces in Go."',
        bullets: [
          'Implicit satisfaction: any type with the methods qualifies, with no declaration. That is why your type can satisfy an interface written later by someone who never heard of it.',
          '"The bigger the interface, the weaker the abstraction." `io.Reader` has one method, which is why files, sockets, buffers and HTTP bodies all compose.',
          '**Accept interfaces, return structs**, and define the interface in the package that *consumes* it, not the one that implements it. That keeps the interface exactly the size of the need.',
          'Say this out loud: **do not create an interface until there is a second implementation or a test that needs a fake.** It signals you have maintained a Go codebase rather than ported Java patterns into one.',
        ],
      },
      {
        heading: 'The nil interface question — expect it',
        code: {
          label: 'they will show you this',
          src: `func doWork() error {
\tvar e *MyError = nil
\treturn e
}

if err := doWork(); err != nil {
\t// this DOES run. Why?
}`,
          note: 'Answer: an interface holds a type word and a value word, and is nil only when BOTH are empty. Returning a typed nil sets the type word. Fix: return the literal nil.',
        },
      },
      {
        heading: '"What does defer actually do?"',
        bullets: [
          'Schedules a call for when the **function** returns, LIFO, on every return path.',
          'Two things they probe: **arguments are evaluated immediately**, so `defer fmt.Println(time.Since(start))` prints ~0; and `defer` inside a loop does not run until the whole function ends.',
          'The bonus point: a deferred closure can modify a **named** return value — which is how you turn a panic into an error, and how a transaction helper knows whether to roll back.',
        ],
      },
      {
        heading: '"When would you panic?"',
        bullets: [
          'Only when the program’s assumptions are broken: a nil dependency at startup, an impossible switch branch, `regexp.MustCompile` on a literal.',
          'Never for anything a user can cause — a bad request, a missing row, a network failure. Those are errors.',
          '**The one they like:** a panic in a goroutine you started is not caught by a parent recover. It kills the whole process, so every long-lived goroutine needs its own.',
        ],
      },
    ],
    keyPoints: [
      'Lead with one sentence, then stop. Add the cost or the trap only if they want more.',
      'Zero values, `append` returning, shared backing arrays, and method sets are the four most-asked mechanics.',
      'The nil-interface trap comes up constantly. Know both why it happens and the one-line fix.',
      'Saying "do not add an interface until there is a second implementation" marks you as someone who has maintained Go.',
    ],
    remember:
      'They are testing whether you have written Go or read about it. Naming the cost of a design decision is what tells them apart.',
    task: 'Say each answer above out loud, timed. If any takes more than 30 seconds you are including detail they did not ask for — cut it to the first line plus one.',
    exercises: [
      {
        task: 'Write the nil-interface trap from memory, run it, then fix it. You should be able to do this without looking.',
        answer:
          'If you cannot, reread it. It is the single most-asked Go trick question.',
      },
      {
        task: 'Explain value versus pointer receivers to someone non-technical in two sentences.',
        answer:
          'Something like: one gets a photocopy, the other gets the original. Changes to a photocopy are lost.',
      },
      {
        task: 'List three things you dislike about Go and what you do about each. Interviewers ask, and "nothing" is the wrong answer.',
        answer:
          'Verbose error handling, no sum types, and dependency-injection by hand. Saying \'nothing\' reads as inexperience.',
      },
    ],
    refs: [
      { label: 'Effective Go', href: 'https://go.dev/doc/effective_go' },
      { label: 'Go FAQ', href: 'https://go.dev/doc/faq' },
    ],
  },

  {
    slug: 'interview-concurrency',
    title: 'Interview: concurrency',
    navTitle: 'Interview — concurrency',
    oneLine: 'The half of the interview that actually decides it — and the code they will put in front of you.',
    blocks: [
      {
        body: [
          'Concurrency is where Go interviews get real. Everyone can define a goroutine. Far fewer can spot a leak, explain why a race is undefined behaviour, or say what happens when nobody receives.',
        ],
      },
      {
        heading: '"What is a goroutine? How is it different from a thread?"',
        bullets: [
          'A user-space thread scheduled by the Go runtime, starting at ~2KB of stack that grows on demand. An OS thread costs about a megabyte and a system call to create.',
          'Go multiplexes many goroutines onto few OS threads (the G-M-P model: goroutines, machine threads, and `GOMAXPROCS` processor contexts, with work stealing between them).',
          'The consequence worth stating: when a goroutine blocks on I/O the runtime parks it and runs another on that thread. **You write plain blocking code and get event-loop throughput** without ever touching a callback or `async`/`await`.',
        ],
      },
      {
        heading: 'The channel table — know it cold',
        table: {
          headers: ['Operation', 'nil', 'open & empty', 'open & full', 'closed'],
          rows: [
            ['send', 'blocks forever', 'proceeds', 'blocks', '**panic**'],
            ['receive', 'blocks forever', 'blocks', 'proceeds', 'zero value, `ok=false`'],
            ['close', 'panic', '—', '—', '**panic**'],
          ],
        },
      },
      {
        bullets: [
          'The sender closes, never the receiver, and only one goroutine may close.',
          'You do not have to close a channel — the GC collects unreferenced ones. Close only when receivers need to *know* it ended.',
          '**Why a nil channel blocking is useful:** setting a channel variable to `nil` inside a `select` disables that case. That is the standard way to drop a branch out of a loop.',
        ],
      },
      {
        heading: '"Spot the bug" — the goroutine leak',
        code: {
          label: 'they will show you this',
          src: `func leak() {
\tch := make(chan int)
\tgo func() { ch <- expensive() }()
\treturn
}`,
          note: 'The goroutine blocks on the send forever, so it is never collected — and neither is anything it references. Two fixes: make the channel buffered with size 1, or select on ctx.Done() alongside the send.',
        },
      },
      {
        heading: '"When would you use a mutex instead of a channel?"',
        bullets: [
          'Channels transfer **ownership** of a value. A mutex protects **state**. A mutex around a cache is simpler and faster than a goroutine owning a map behind a channel.',
          'Say this plainly: "share memory by communicating" is a good default, not a law. Forcing channels onto "protect this field" is a common way to make Go code worse.',
          'The mutex rules they may probe: never copy a struct containing one (`go vet` catches it), never hold a lock across a network call, and it is not reentrant.',
        ],
      },
      {
        heading: '"What is a data race, and how do you find one?"',
        bullets: [
          'Two goroutines touch the same memory, at least one writes, and there is no synchronisation between them. The behaviour is **undefined** — not "occasionally wrong". The compiler and CPU both reorder freely.',
          'Happens-before edges come from: a channel send/receive pair, close→receive, `Unlock`→`Lock`, `WaitGroup.Wait` after `Done`, `Once.Do`, the `go` statement, and atomics.',
          '`go test -race ./...` in CI. It only reports races that actually occur, so the concurrent paths need test coverage. Add that they can find leaks with `pprof`’s goroutine profile.',
          '**The special case:** concurrent map read/write is detected by the runtime and hard-crashes with "concurrent map writes" rather than corrupting silently.',
        ],
      },
      {
        heading: '"Write a worker pool"',
        code: {
          label: 'the shape they want to see',
          src: `func pool(ctx context.Context, jobs []Job, workers int) []Result {
\tjobCh := make(chan Job)
\tresCh := make(chan Result, len(jobs))

\tvar wg sync.WaitGroup
\tfor i := 0; i < workers; i++ {
\t\twg.Add(1)                      // BEFORE the go statement
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\tfor j := range jobCh {     // exits when jobCh closes
\t\t\t\tselect {
\t\t\t\tcase resCh <- process(j):
\t\t\t\tcase <-ctx.Done():
\t\t\t\t\treturn             // every loop needs this
\t\t\t\t}
\t\t\t}
\t\t}()
\t}

\tgo func() {
\t\tdefer close(jobCh)             // the sender closes
\t\tfor _, j := range jobs {
\t\t\tselect {
\t\t\tcase jobCh <- j:
\t\t\tcase <-ctx.Done():
\t\t\t\treturn
\t\t\t}
\t\t}
\t}()

\twg.Wait()
\tclose(resCh)

\tout := make([]Result, 0, len(jobs))
\tfor r := range resCh {
\t\tout = append(out, r)
\t}
\treturn out
}`,
          note: 'Four things they are marking: Add before go, the sender closes, ctx.Done in every select, and bounded concurrency rather than one goroutine per job.',
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Often the better answer is "I would use `errgroup` with `SetLimit`" — bounded concurrency and first-error cancellation, in five lines. Knowing when *not* to hand-roll the pool is itself the senior signal. But be able to write the pool if they ask.',
        },
      },
      {
        heading: '"How do you cancel work?"',
        bullets: [
          '`context.Context`: first parameter, named `ctx`, never stored in a struct, and `defer cancel()` every time.',
          'Cancelling does not stop anything by itself. It closes `ctx.Done()`, and your code must select on it. Anything that blocks should.',
          'In a handler, derive from `r.Context()` so a disconnecting client stops your database query too. Deriving from `context.Background()` inside a handler is a real bug.',
          '`context.Value` is for request-scoped identity crossing API boundaries — not for dependencies or config.',
        ],
      },
      {
        heading: 'The loop variable question',
        bullets: [
          'Before Go 1.22, `for _, v := range xs { go func(){ use(v) }() }` captured one shared variable, so every goroutine usually saw the last element. The fix was `v := v`.',
          'Go 1.22 made loop variables per-iteration, so it is now correct as written — **but only if the module’s `go.mod` declares 1.22 or later.** Saying that caveat is what shows you actually know it, rather than having read one headline.',
        ],
      },
    ],
    keyPoints: [
      'Know the channel behaviour table cold, including why a nil channel blocking is useful.',
      'Be able to spot a goroutine leak and give two fixes in one sentence.',
      'A data race is undefined behaviour; `-race` in CI is the answer to "how do you find one".',
      'The worker pool is marked on: `Add` before `go`, sender closes, `ctx.Done()` in every select, bounded concurrency.',
    ],
    remember:
      'Anyone can start a goroutine. The interview is about stopping one — how it exits, who waits for it, and what happens when it panics.',
    task: 'Write the worker pool from a blank file, with no reference, in under ten minutes. Then run it with `-race` and with `goleak` to prove nothing is left running.',
    exercises: [
      {
        task: 'Write three different goroutine leaks and fix each one a different way.',
        answer:
          'Blocked send with no receiver, a range over a channel nobody closes, and a loop with no `ctx.Done()`.',
      },
      {
        task: 'Implement a rate limiter with a `time.Ticker` and a buffered channel, then compare it with `golang.org/x/time/rate`.',
        answer:
          'Yours will be roughly 40 lines; `x/time/rate` is one. Knowing when not to hand-roll is the senior signal.',
      },
      {
        task: 'Take the worker pool and rewrite it with `errgroup.SetLimit`. Time how much shorter it is.',
        answer:
          'About a third of the length, with first-error cancellation for free.',
      },
      {
        task: 'Explain the G-M-P model out loud in 60 seconds, including work stealing.',
        answer:
          'Goroutines run on processor contexts held by OS threads, idle contexts steal work from busy ones, and blocking detaches the thread so others keep running.',
      },
    ],
    refs: [
      { label: 'Go Concurrency Patterns: Pipelines', href: 'https://go.dev/blog/pipelines' },
      { label: 'The Go Memory Model', href: 'https://go.dev/ref/mem' },
      { label: 'Go blog: Context', href: 'https://go.dev/blog/context' },
    ],
  },

  {
    slug: 'interview-backend-and-design',
    title: 'Interview: backend, databases, and design',
    navTitle: 'Interview — backend design',
    oneLine: 'The round where they ask how you would actually build and run the service you just described.',
    blocks: [
      {
        heading: 'What this round is testing',
        body: [
          'This is the round where they stop asking about language features and ask how you would build and run a real service. They are not checking whether you know a definition; they are checking whether you have made decisions and lived with them.',
          'The pattern that scores well in every answer below is the same: say what you would do, then say what it costs, then say when you would change it. Someone who only knows the upside of a choice has not used it in anger.',
        ],
      },
      {
        heading: '"Walk me through a Go service you built"',
        bullets: [
          'Use the project from this track. Structure the answer: **what it does → how it is laid out → one decision you made and its cost → one thing you would change.**',
          'The layout line: one package per domain, `handler → service → repository`, dependencies pointing inward, wired by hand in `run() error`, everything under `internal/`.',
          'The decision line: "no ORM — `database/sql` so I could see every query, at the cost of hand-writing scans. If it grew I would move to `sqlc`, not GORM." Naming the cost and the upgrade path is the whole answer.',
        ],
      },
      {
        heading: '"Why no framework?"',
        bullets: [
          'Since Go 1.22, `net/http` routes on method and path parameters. That was the main reason to add one.',
          'A framework mostly wraps `func(http.ResponseWriter, *http.Request)` — knowing that means every framework makes sense immediately.',
          'Do not be rigid about it. "On a large team already using chi or echo, I would use theirs" is the right closing line.',
        ],
      },
      {
        heading: '"What is wrong with http.ListenAndServe in production?"',
        code: {
          label: 'the answer',
          src: `srv := &http.Server{
\tAddr:              ":8080",
\tHandler:           handler,
\tReadHeaderTimeout: 5 * time.Second,    // Slowloris
\tReadTimeout:       15 * time.Second,
\tWriteTimeout:      30 * time.Second,
\tIdleTimeout:       60 * time.Second,
}`,
          note: 'The zero-value server has no timeouts at all, so one slow client can hold a connection forever. Follow with graceful shutdown via srv.Shutdown(ctx) on SIGTERM.',
        },
      },
      {
        heading: '"How do you handle authentication?"',
        bullets: [
          'bcrypt for passwords. Identical error and similar timing for unknown-email and wrong-password.',
          'Short access JWT (15 min) plus a long refresh token that is **stored as a hash** and rotated on every use.',
          'Verify the signing method explicitly when parsing, or `alg: none` is a full auth bypass.',
          'Say why the access token is short: **a JWT cannot be revoked**, so the short window is what limits the damage. That trade-off is the actual question.',
        ],
      },
      {
        heading: '"How do you make sure one user cannot read another’s data?"',
        code: {
          label: 'one line, and it is the whole answer',
          src: `SELECT id, title, body FROM notes WHERE id = $1 AND user_id = $2`,
          note: 'In the query, not in Go. It cannot be forgotten and has no race. Return 404 rather than 403, so you do not confirm the resource exists. The vulnerability class is called IDOR.',
        },
      },
      {
        heading: '"Your endpoint is slow. What do you do?"',
        bullets: [
          '**First, measure.** pprof for CPU, and count database round trips — do not start guessing at Go code.',
          'The ranked list of real causes: a query in a loop (N+1) → a missing index → a pool that is too small or unlimited → unbounded concurrency hammering a downstream → allocations in a hot loop → everything else.',
          '"The database is where the latency lives. One JOIN beats twenty round trips, and one index beats a month of Go micro-optimisation."',
          'Then: `-count=10` and `benchstat`, because a single benchmark run is noise.',
        ],
      },
      {
        heading: '"Your service is being OOM-killed in Kubernetes"',
        bullets: [
          'Set **`GOMEMLIMIT`** to about 90% of the container limit. Without it Go’s GC grows the heap until the OOM killer wins — the single most common Go-in-k8s problem.',
          'Also set **`GOMAXPROCS`** to the CPU limit. It defaults to the *host’s* core count, so on a 64-core node with a 2-core quota you get 64 schedulers fighting over 2 cores, and very slow responses.',
          'Then look for the actual leak: goroutines that never exit (check the goroutine profile), small slices holding whole large buffers alive, and unbounded caches.',
        ],
      },
      {
        heading: '"How would you scale this to 10x traffic?"',
        bullets: [
          'Measure first, then in this order: **index the queries → cache the hot reads → add read replicas → shard.** Say the order and why each is cheaper than the next.',
          'For a Go service specifically: the connection pool is your backpressure, so you have to choose its size carefully — 500 concurrent goroutines against a pool of 25 just means 475 are queueing.',
          'Horizontal scaling implications you own: no in-process state, no local disk for uploads (move to S3), rate limiting moves to Redis or every instance allows the full limit.',
        ],
      },
      {
        heading: '"How do you deploy it?"',
        bullets: [
          'Multi-stage Docker build, `CGO_ENABLED=0`, distroless or scratch base, non-root user. About 15MB, with no shell and no package manager to attack.',
          'Migrations run separately from the app, and must be **backwards compatible with the currently-running code** — add a nullable column, deploy code that writes it, backfill, then tighten. Never rename in one step.',
          '`/livez` and `/readyz` as separate checks, because wiring a DB ping into liveness restarts every pod at once during a blip.',
        ],
      },
      {
        heading: '"How do you know it is working?"',
        bullets: [
          'Structured logs with `log/slog`, JSON in production, a request id threaded through the context so one failure is one grep.',
          'Four numbers: request rate, error rate, latency percentiles (**p50/p95/p99, never the mean**), and saturation — pool usage, queue depth, goroutine count.',
          'Never log passwords, tokens, whole `Authorization` headers, or full request bodies.',
        ],
      },
    ],
    keyPoints: [
      'Structure the project answer: what → layout → one decision and its cost → one thing you would change.',
      'Owner scoping belongs in the SQL. That single line answers the whole security question.',
      'Slow endpoint: measure, then N+1, then indexes, then the pool. Go code is last.',
      '`GOMEMLIMIT` and `GOMAXPROCS` are the two answers to "it misbehaves in a container".',
    ],
    remember:
      'Every design answer is stronger when you name what it costs you. "I chose X, it cost me Y, and here is when I would switch" is the sentence they are listening for.',
    task: 'Write a one-page description of your project: what it does, the folder layout, three decisions with their costs, and two things you would change. Then say it out loud in under three minutes.',
    exercises: [
      {
        task: 'Draw your service on paper — client, server, database, uploads — and mark where each failure mode lives.',
        answer:
          'The failure modes cluster at the boundaries — the database, the third party, the disk. That is also where your timeouts belong.',
      },
      {
        task: 'Pick three decisions you made and write the honest cost of each. If a decision has no cost, you have not understood it.',
        answer:
          'If a decision has no cost, you have not understood it yet. Every real choice gives something up.',
      },
      {
        task: 'Explain N+1 and its two fixes without using the word "database".',
        answer:
          'Something like: asking one question, then asking a follow-up for every answer, instead of asking once for everything.',
      },
      {
        task: 'Time yourself explaining graceful shutdown, from SIGTERM to process exit, in 60 seconds.',
        answer:
          'Stop accepting connections, let the in-flight ones finish, cancel background work, then exit — with a deadline so it cannot hang.',
      },
    ],
    refs: [
      { label: 'Accessing databases', href: 'https://go.dev/doc/database/index' },
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
    ],
  },

  {
    slug: 'interview-live-coding',
    title: 'Interview: the live coding round',
    navTitle: 'Interview — live coding',
    oneLine: 'What they actually score while you type, and the Go-specific things that lose marks.',
    blocks: [
      {
        body: [
          'The live round is rarely about the algorithm. They are watching whether you handle errors, whether your concurrency is safe, and whether you write code the rest of the team could maintain.',
        ],
      },
      {
        heading: 'Before you type a line',
        bullets: [
          '**Restate the problem** in one sentence and get agreement. Half of failed rounds are a good solution to a different question.',
          '**Ask about scale and input.** "Is this thousands or millions?" "Can the input be empty, or unsorted, or duplicated?" These change the answer and asking them is scored.',
          '**Say your plan out loud before coding.** Thinking silently for ninety seconds teaches them nothing about you.',
        ],
      },
      {
        heading: 'The things that lose marks in Go specifically',
        table: {
          headers: ['What you do', 'What they write down'],
          rows: [
            ['`v, _ := doThing()`', 'ignores errors'],
            ['`panic(err)` in library code', 'does not understand panic vs error'],
            ['one goroutine per item, unbounded', 'has not run this under load'],
            ['no `ctx` parameter on anything doing I/O', 'has not written a production service'],
            ['mutating a shared map from goroutines', 'would ship a race'],
            ['`s := ""` then `+=` in a loop', 'does not know strings are immutable'],
            ['`interface{}` everywhere', 'throws away the type system'],
            ['no test, and no mention of one', 'does not test'],
          ],
        },
      },
      {
        heading: 'The problems that actually come up',
        bullets: [
          '**Concurrent fetch of N URLs with a concurrency limit** — the single most common Go live question. `errgroup.SetLimit`, or a semaphore channel plus a `WaitGroup`.',
          '**Word frequency count, top K** — a map, then move it to a slice and `slices.SortFunc`, because maps have no order.',
          '**An LRU cache** — a map plus a doubly linked list, with a mutex if they say "thread-safe" (and ask whether they want it thread-safe).',
          '**A rate limiter** — token bucket. Say `time.Ticker` plus a buffered channel, or that `x/time/rate` already does it.',
          '**Parse a log file / stream** — `bufio.Scanner`, not `io.ReadAll`, and say why: constant memory over a large file.',
          '**A worker pool** — see the concurrency topic. Marked on `Add` before `go`, sender closes, and `ctx.Done()`.',
        ],
      },
      {
        heading: 'The bounded-concurrency answer, memorised',
        code: {
          label: 'have this in your fingers',
          src: `g, ctx := errgroup.WithContext(ctx)
g.SetLimit(10)                       // bounded — say this out loud

results := make([]Result, len(urls)) // indexed writes: no lock needed
for i, u := range urls {
\ti, u := i, u                     // harmless in 1.22+, and it shows you know why
\tg.Go(func() error {
\t\tr, err := fetch(ctx, u)
\t\tif err != nil {
\t\t\treturn fmt.Errorf("fetch %s: %w", u, err)
\t\t}
\t\tresults[i] = r
\t\treturn nil
\t})
}

if err := g.Wait(); err != nil {     // first error cancels the rest
\treturn nil, err
}`,
          note: 'Writing to distinct indices of a preallocated slice is race-free and needs no mutex. Say that — it is the part most candidates get wrong by reaching for a lock or a channel.',
        },
      },
      {
        heading: 'While you type',
        bullets: [
          '**Handle errors as you go.** Do not say "I will add error handling later" — later never arrives and they have already written it down.',
          '**Name things properly** even under pressure. `users`, not `arr`. It costs nothing.',
          '**Say the complexity out loud** when you finish a function: "this is O(n) with one pass and one map".',
          '**Mention the test you would write**, even if there is no time to write it. "I would table-test empty input, one element, and duplicates."',
          '**If you get stuck, say so out loud.** "I am choosing between a map and a sorted slice — the map is O(1) lookup but loses order, and I need order at the end, so I will do both." That is a strong signal, not a weak one.',
        ],
      },
      {
        heading: 'When you finish early',
        bullets: [
          'Offer the edge cases yourself: empty input, one element, duplicates, nil, integer overflow, unicode in strings.',
          'Offer the concurrency version, or the reason you did not: "this is CPU-light and the list is small, so goroutines would cost more than they save."',
          'Offer what you would change for production: a context, a limit, a metric, a test.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'A slightly simpler solution you can explain completely beats a clever one you cannot. That is true in the interview for the same reason it is true in the codebase — someone has to read it at 3am.',
        },
      },
    ],
    keyPoints: [
      'Restate the problem, ask about scale and input, and say the plan before typing.',
      'Errors, `ctx`, and bounded concurrency are what actually get marked in a Go round.',
      'Have the `errgroup.SetLimit` fetch pattern memorised — it is the most common question.',
      'Narrate stuck moments. Silence scores worse than an imperfect answer.',
    ],
    remember:
      'They are not hiring the algorithm. They are hiring the person whose code the team will have to read.',
    task: 'Do the concurrent URL fetch with a limit of 5, from a blank file, in under fifteen minutes — with error wrapping, a context, and a table-driven test. Then delete it and do it again tomorrow.',
    exercises: [
      {
        task: 'Implement top-K word frequency, then state its complexity out loud.',
        answer:
          'O(n) to count, O(m log m) to sort the distinct words — or O(m log k) with a heap if k is small.',
      },
      {
        task: 'Write a thread-safe LRU cache and run it under `-race` with concurrent readers and writers.',
        answer:
          'A map plus a doubly linked list, all mutations behind one mutex. Ask whether they want it thread-safe before adding the lock.',
      },
      {
        task: 'Parse a 1GB file with `bufio.Scanner` and watch memory stay flat. Then try `io.ReadAll` and watch it not.',
        answer:
          'Memory stays flat at a few kilobytes. `io.ReadAll` needs a gigabyte and may not finish.',
      },
      {
        task: 'Set a 15-minute timer and solve one problem end to end, talking through it the whole time as if someone were watching.',
        answer:
          'The talking is the part being marked. If you go quiet for ninety seconds the interviewer learns nothing about you.',
      },
    ],
    refs: [
      { label: 'errgroup', href: 'https://pkg.go.dev/golang.org/x/sync/errgroup' },
      { label: 'Go Code Review Comments', href: 'https://go.dev/wiki/CodeReviewComments' },
    ],
  },

  {
    slug: 'interview-final-checklist',
    title: 'Interview: the final checklist',
    navTitle: 'Interview — checklist',
    oneLine: 'The last pass before the call — what to revise, what to say, and what to ask them.',
    blocks: [
      {
        heading: 'How to use this last topic',
        body: [
          'This is the pass to make in the day or two before an interview. It is not new material — it is the short list of what is worth revising, how to handle a question you cannot answer, and what to ask them at the end.',
          'The single most useful thing here is the summary table near the bottom: one line per area, covering the whole track. Cover the right column and see how much of it you can reconstruct.',
        ],
      },
      {
        heading: 'The night before: revise only these',
        bullets: [
          '**Zero values**, and which types are nil-able.',
          '**Slices** — header, `append` returning, shared backing arrays.',
          '**Maps** — missing key returns zero, random order, nil map write panics, not concurrency-safe.',
          '**Interfaces** — implicit, small, nil-interface trap, accept interfaces/return structs, method sets.',
          '**Errors** — `%w`, `errors.Is`, `errors.As`, handle once.',
          '**Goroutines** — cost, leaks, the channel table, mutex vs channel.',
          '**Context** — first param, `defer cancel()`, only a signal you must check, not for dependencies.',
          '**defer** — function scope, args evaluated now, named returns.',
          '`go test -race`, `GOMEMLIMIT`, `GOMAXPROCS`.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'Do not learn anything new the night before. Revising what you already half-know converts far more of it into answers than a new topic does — and it stops you second-guessing yourself mid-sentence.',
        },
      },
      {
        heading: 'How to answer anything you do not know',
        bullets: [
          '**Say so, immediately, then reason.** "I have not used that. I would expect it to work like X because of Y — is that close?" That sounds honest and thoughtful. Bluffing sounds like neither, and they always know.',
          'Never guess a confident wrong answer. One of those undoes three good ones.',
          'If you half-remember, say which half: "I know it changed in 1.22, I am not certain of the exact semantics."',
        ],
      },
      {
        heading: 'Sentences worth having ready',
        bullets: [
          '"That trade-off cost me X, and here is when I would switch."',
          '"I would measure before optimising — my guess would be the database, not the Go code."',
          '"I would not add an interface until there is a second implementation."',
          '"Errors are values, so I wrap with context and handle each one exactly once."',
          '"Every goroutine I start needs a documented way to exit."',
          '"The simplest thing that works, until a measurement says otherwise."',
        ],
      },
      {
        heading: 'Questions worth asking them',
        bullets: [
          '"How is the Go code laid out — by domain or by layer?" Their answer tells you a lot about the codebase you would inherit.',
          '"Do you run the race detector in CI?" A “no” tells you a lot.',
          '"What does your on-call look like, and what usually breaks?"',
          '"Where does the team disagree about Go style, and how is that settled?"',
          '"What would my first three months look like?"',
        ],
      },
      {
        heading: 'The whole track, in one screen',
        table: {
          headers: ['Area', 'The one thing'],
          rows: [
            ['Types', 'every type has a zero value; conversions are always explicit'],
            ['Slices', 'a window onto an array — two windows see each other’s writes'],
            ['Maps', 'missing key gives zero; order is random; nil map write panics'],
            ['Strings', 'bytes, not characters; immutable, so `+=` in a loop is O(n²)'],
            ['Pointers', 'no arithmetic, no dangling, no manual free — just mutation and cheap passing'],
            ['Structs', 'assignment copies; embedding is composition, not inheritance'],
            ['Interfaces', 'implicit, small, defined where used; typed nil is not nil'],
            ['Errors', 'values you return; wrap with `%w`; handle exactly once'],
            ['Panic', 'broken assumptions only; never crosses a goroutine boundary'],
            ['Goroutines', 'cheap to start, expensive to forget — every one needs an exit'],
            ['Channels', 'sender closes; nil blocks; send on closed panics'],
            ['Sync', 'mutex guards state, channels transfer ownership; `-race` in CI'],
            ['Context', 'first parameter, `defer cancel()`, check `Done()` in anything blocking'],
            ['HTTP', 'set your own timeouts; a handler is one function shape'],
            ['Database', 'a pool, always bounded; placeholders always; watch for N+1'],
            ['Auth', 'bcrypt, short JWT, hashed rotating refresh, scope in the SQL'],
            ['Production', '`GOMEMLIMIT`, `GOMAXPROCS`, structured logs, measure before optimising'],
          ],
        },
      },
      {
        callout: {
          tone: 'ok',
          text: 'You have built a real API with authentication, a database, file uploads, tests and a container. That is more than most candidates bring. Talk about that project — concretely, with its costs — rather than reciting definitions, and you will be in the top half of the pile.',
        },
      },
    ],
    keyPoints: [
      'Revise the nine mechanics above and nothing new the night before.',
      '"I do not know, but I would expect X because Y" beats a confident wrong answer every time.',
      'Have five questions ready — what you ask says as much as what you answer.',
      'Talk about your project concretely, with the costs of each decision.',
    ],
    remember:
      'They are deciding whether they want to read your code for the next two years. Clear beats clever, and honest beats confident.',
    task: 'Take the mixed MCQ test. Anything you get wrong, reread that topic and write the answer in your own words before moving on.',
    exercises: [
      {
        task: 'Cover the right column of the summary table and reconstruct it from the left.',
        answer:
          'Anything you cannot reconstruct is what to reread. That is the point of the table.',
      },
      {
        task: 'Record yourself describing your project for three minutes, then listen back and cut a third.',
        answer:
          'Almost everyone rambles on the setup and rushes the trade-offs. Cut the setup.',
      },
      {
        task: 'Write out the five questions you will ask them, and pick which two you will use if there is only time for two.',
        answer:
          'The two worth keeping are usually the codebase layout and whether they run the race detector in CI.',
      },
    ],
    refs: [
      { label: 'Effective Go', href: 'https://go.dev/doc/effective_go' },
      { label: 'Go Code Review Comments', href: 'https://go.dev/wiki/CodeReviewComments' },
      { label: 'The Go Memory Model', href: 'https://go.dev/ref/mem' },
    ],
  },
]
