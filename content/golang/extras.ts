import type { LangLesson } from '@/lib/types'

/**
 * Stand-alone, in-depth pages that sit inside the existing sections (see
 * index.ts): one concurrency pattern built properly, one API reference, one
 * comparison, and the senior version of the interview questions. Each one goes
 * further than the overview lesson it links back to, rather than repeating it.
 */
export const EXTRAS: LangLesson[] = [
  {
    slug: 'worker-pool',
    searchTitle: 'Golang Worker Pool: Pattern, Example, Context, Errgroup',
    title: 'Worker pools in Go: bounded concurrency, built step by step',
    navTitle: 'Worker pool',
    metaDescription:
      'A Go worker pool built step by step: jobs and results channels, ordered results, context cancellation, errgroup.SetLimit, semaphores and common bugs.',
    oneLine:
      'A fixed number of goroutines pulling jobs from one channel, so 10,000 tasks never turn into 10,000 open connections.',
    objectives: [
      'Write a worker pool that returns results in input order and never leaks a goroutine.',
      'Stop every worker on the first error or a timeout, using a context.',
      'Choose between a worker pool, a semaphore and `errgroup.SetLimit`, and pick a worker count with a number behind it.',
    ],
    blocks: [
      {
        body: [
          'A **worker pool** is N goroutines that all read jobs from one channel. The producer sends jobs, the workers process them, and at most N jobs are in progress at once. That limit is the whole point.',
          'Goroutines are cheap, so "why not one goroutine per task?" is a fair question. Often that is fine. The goroutine is not the problem; what it holds is. Ten thousand goroutines that each open a database connection, call a rate-limited API, or hold a 5 MB image in memory will exhaust the connection pool, get you throttled, or run the process out of memory. A pool caps that at a number you chose.',
          'This page builds the pattern in depth. For the overview of all the concurrency patterns (`sync.Once`, `errgroup`, leaks), see [Concurrency patterns](/languages/go/concurrency-patterns).',
        ],
        table: {
          headers: ['Approach', 'How it bounds work', 'Best for', 'Watch out for'],
          rows: [
            ['Goroutine per task', 'It does not', 'Small, known number of cheap tasks', 'Unbounded memory and connections under load'],
            ['Worker pool', 'N long-lived goroutines read one jobs channel', 'Long streams of similar jobs; reusing a per-worker resource', 'Who closes which channel; draining results'],
            ['Semaphore (buffered channel)', 'Acquire a slot before starting each goroutine', 'A loop over a slice where each item is independent', 'Acquiring inside the goroutine gives no backpressure'],
            ['`errgroup` with `SetLimit`', '`g.Go` blocks until a slot is free', 'A batch where the first error should cancel the rest', 'It is in `golang.org/x/sync`, not the standard library'],
          ],
        },
      },
      {
        heading: 'A minimal worker pool, with results in order',
        body: [
          'Three channels of responsibility. The **producer** sends every job and then closes `jobs`. Each **worker** ranges over `jobs`, so its loop ends when `jobs` is closed and empty. A separate goroutine waits for all workers and then closes `results`, so the reader\'s `range` ends too.',
          'Results arrive in whatever order workers finish. To get them back in input order, send the index with each job and write each result into its own slot of a slice. Each slot has exactly one writer, so there is no race.',
        ],
        code: {
          label: 'pool.go',
          src: `package main

import (
\t"fmt"
\t"strings"
\t"sync"
)

type job struct {
\tindex int
\tword  string
}

type result struct {
\tindex int
\tout   string
}

func main() {
\twords := []string{"alpha", "bravo", "charlie", "delta", "echo", "foxtrot"}

\tjobs := make(chan job)
\tresults := make(chan result)

\tconst workers = 3
\tvar wg sync.WaitGroup
\tfor w := 1; w <= workers; w++ {
\t\twg.Add(1) // Add before go, never inside the goroutine
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\tfor j := range jobs { // ends when jobs is closed and drained
\t\t\t\tresults <- result{j.index, strings.ToUpper(j.word)}
\t\t\t}
\t\t}()
\t}

\tgo func() { // producer: send everything, then close
\t\tfor i, w := range words {
\t\t\tjobs <- job{i, w}
\t\t}
\t\tclose(jobs)
\t}()

\tgo func() { // closer: results is closed only after every worker returned
\t\twg.Wait()
\t\tclose(results)
\t}()

\tout := make([]string, len(words))
\tfor r := range results {
\t\tout[r.index] = r.out // one writer per slot: no race
\t}
\tfmt.Println(out)
}
`,
          canRun: true,
          note: 'Always prints the words in input order, whichever worker finished first.',
        },
      },
      {
        heading: 'Who closes which channel?',
        body: [
          'Almost every worker pool bug is a channel closed by the wrong goroutine, or not closed at all. The rule is that only the side that knows no more values are coming may close a channel.',
        ],
        bullets: [
          '**`jobs` is closed by the producer**, once, after the last send. A worker must never close it: the producer would panic on its next send.',
          '**`results` is closed by a goroutine that waits on the WaitGroup.** Not by a worker (the others are still sending), and not by `main` before it reads (that is a deadlock: workers block on the send, `wg.Wait` never returns).',
          '**The reader must drain `results`.** If it stops reading early, every worker blocks on its next send forever. If you need to stop early, cancel a context (next section) instead of walking away.',
          '**`wg.Add(1)` goes before `go`.** Inside the goroutine, `Wait` can run before `Add` and return too early.',
        ],
      },
      {
        heading: 'Stop on the first error, or on a timeout, with a context',
        body: [
          'Real jobs fail. When one fails you usually want the rest to stop, and when the caller gives up (an HTTP request is cancelled, a deadline passes) the whole pool should stop. A `context.Context` carries that signal to every goroutine.',
          'Three changes make the pool cancellable. Workers `select` on `ctx.Done()` so they stop picking up jobs. The producer also selects on `ctx.Done()`, otherwise it blocks forever on a send nobody will receive, which is a leak. And the first error cancels the context with a cause, using `context.WithCancelCause` (Go 1.20), so everyone can see why they were stopped.',
        ],
        code: {
          label: 'cancel.go',
          src: `package main

import (
\t"context"
\t"errors"
\t"fmt"
\t"sync"
\t"time"
)

// process pretends to do I/O. Job 4 fails.
func process(ctx context.Context, n int) error {
\tselect {
\tcase <-time.After(20 * time.Millisecond):
\tcase <-ctx.Done():
\t\treturn ctx.Err()
\t}
\tif n == 4 {
\t\treturn fmt.Errorf("job %d: %w", n, errors.New("bad input"))
\t}
\treturn nil
}

func run(parent context.Context, jobsToDo []int, workers int) error {
\tctx, cancel := context.WithCancelCause(parent)
\tdefer cancel(nil)

\tjobs := make(chan int)
\tvar wg sync.WaitGroup

\tfor range workers {
\t\twg.Add(1)
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\tfor {
\t\t\t\tselect {
\t\t\t\tcase <-ctx.Done():
\t\t\t\t\treturn
\t\t\t\tcase n, ok := <-jobs:
\t\t\t\t\tif !ok {
\t\t\t\t\t\treturn
\t\t\t\t\t}
\t\t\t\t\tif err := process(ctx, n); err != nil {
\t\t\t\t\t\tcancel(err) // the first cause wins; later calls do nothing
\t\t\t\t\t\treturn
\t\t\t\t\t}
\t\t\t\t}
\t\t\t}
\t\t}()
\t}

\t// the producer gives up too, or it would block on a send forever
\tsend:
\tfor _, n := range jobsToDo {
\t\tselect {
\t\tcase jobs <- n:
\t\tcase <-ctx.Done():
\t\t\tbreak send
\t\t}
\t}
\tclose(jobs)
\twg.Wait() // every worker has returned before run does

\tif err := context.Cause(ctx); err != nil && !errors.Is(err, context.Canceled) {
\t\treturn err
\t}
\treturn nil
}

func main() {
\tjobs := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

\tfmt.Println("error:", run(context.Background(), jobs, 3))

\tctx, cancel := context.WithTimeout(context.Background(), 30*time.Millisecond)
\tdefer cancel()
\tfmt.Println("timeout:", run(ctx, []int{1, 2, 3, 5, 6, 7, 8, 9}, 2))
}
`,
          canRun: true,
          note: 'The first run stops at job 4 and returns its wrapped error. The second hits the 30 ms deadline and returns `context.DeadlineExceeded`. In both, every goroutine has returned before `run` does.',
        },
      },
      {
        heading: 'The same pool with errgroup.SetLimit',
        body: [
          'When the jobs are a slice you already have, `golang.org/x/sync/errgroup` does all of the above in fewer lines. `SetLimit(n)` makes `g.Go` block until fewer than n functions are running, `WithContext` cancels the shared context on the first error, and `Wait` returns that first error. It is maintained by the Go team but lives outside the standard library, so the Playground cannot run it.',
          'Reach for the hand-written pool instead when jobs arrive as a stream with no known end, or when each worker owns something long-lived, like its own connection or a reusable buffer.',
        ],
        code: {
          label: 'errgroup.go — needs golang.org/x/sync',
          src: `func resizeAll(ctx context.Context, paths []string) error {
\tg, ctx := errgroup.WithContext(ctx)
\tg.SetLimit(8) // at most 8 resizes at once

\tfor _, p := range paths {
\t\tg.Go(func() error { // blocks here while 8 are running
\t\t\treturn resize(ctx, p) // must return early when ctx is done
\t\t})
\t}
\treturn g.Wait() // the first error, after every goroutine returned
}`,
          note: 'Because `g.Go` blocks, the loop itself is throttled: there are never more than 8 goroutines, not 10,000 parked ones.',
        },
      },
      {
        heading: 'A semaphore instead of a pool',
        body: [
          'A buffered channel of empty structs is a counting semaphore. Sending takes a slot, receiving gives it back, and a send blocks while all slots are taken. It gives the same bound with a goroutine per task, which reads more naturally when you are looping over a slice.',
          'Acquire the slot **before** the `go` statement. Then the loop waits for a free slot, which is backpressure. If you acquire inside the goroutine, all 10,000 goroutines start at once and park on the channel: concurrency is bounded but memory is not. For slots of different sizes (one job needs 3 units of a budget, another 1) use `golang.org/x/sync/semaphore`, whose `Weighted.Acquire` takes a context and a weight.',
        ],
        code: {
          label: 'semaphore.go',
          src: `package main

import (
\t"fmt"
\t"sync"
\t"sync/atomic"
\t"time"
)

func main() {
\tsem := make(chan struct{}, 3) // 3 slots
\tvar wg sync.WaitGroup
\tvar running, peak atomic.Int32

\tfor range 12 {
\t\tsem <- struct{}{} // take a slot BEFORE starting: the loop waits here
\t\twg.Add(1)
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\tdefer func() { <-sem }() // give the slot back

\t\t\tn := running.Add(1)
\t\t\tfor {
\t\t\t\tp := peak.Load()
\t\t\t\tif n <= p || peak.CompareAndSwap(p, n) {
\t\t\t\t\tbreak
\t\t\t\t}
\t\t\t}
\t\t\ttime.Sleep(10 * time.Millisecond) // the work
\t\t\trunning.Add(-1)
\t\t}()
\t}
\twg.Wait()
\tfmt.Println("tasks: 12, most running at once:", peak.Load())
}
`,
          canRun: true,
          note: 'Prints 3. Move `sem <- struct{}{}` inside the goroutine and it still prints 3, but all 12 goroutines exist from the start.',
        },
      },
      {
        heading: 'How many workers should a Go worker pool have?',
        body: [
          'It depends on what the job waits for. **CPU-bound** work (hashing, image decoding, compression) cannot go faster than the cores you have, so start at `runtime.GOMAXPROCS(0)` workers. More only adds scheduling overhead.',
          '**I/O-bound** work (HTTP calls, database queries) spends most of its time waiting, so you need more workers than cores. Little\'s law gives a starting number: workers ≈ target throughput × time per job. To make 200 API calls a second that each take 250 ms, you need about 200 × 0.25 = 50 in flight. Then cap it by the limit downstream: if the database pool allows 25 connections, 50 workers means 25 of them are always queued inside `database/sql`, adding latency for nothing.',
          'The program below runs 20 jobs that each wait 50 ms with 1, 4 and 20 workers. For waiting work, time drops in proportion to workers until every job has its own.',
        ],
        code: {
          label: 'how-many.go',
          src: `package main

import (
\t"fmt"
\t"sync"
\t"time"
)

func runPool(workers, jobs int, work time.Duration) time.Duration {
\tstart := time.Now()
\tch := make(chan int)
\tvar wg sync.WaitGroup
\tfor range workers {
\t\twg.Add(1)
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\tfor range ch {
\t\t\t\ttime.Sleep(work) // stands in for a network call
\t\t\t}
\t\t}()
\t}
\tfor i := range jobs {
\t\tch <- i
\t}
\tclose(ch)
\twg.Wait()
\treturn time.Since(start).Round(10 * time.Millisecond)
}

func main() {
\tfor _, w := range []int{1, 4, 20} {
\t\tfmt.Printf("%2d workers: %v\\n", w, runPool(w, 20, 50*time.Millisecond))
\t}
}
`,
          canRun: true,
          note: 'About 1s, 250ms and 50ms. With CPU-bound jobs the curve flattens at the number of cores instead, which is why the two cases get different worker counts.',
        },
      },
      {
        heading: 'Backpressure: what happens when jobs arrive faster than workers finish?',
        body: [
          'With an unbuffered `jobs` channel the producer blocks until a worker is free. That is backpressure, and it is usually what you want: a slow pool slows the producer down instead of piling work up in memory.',
          'A buffered channel (`make(chan job, 100)`) adds slack for short bursts. It does not add capacity: if jobs arrive faster than workers finish for long enough, the buffer fills and the producer blocks anyway. When blocking is not acceptable, for example in an HTTP handler, reject instead and let the client retry.',
        ],
        code: {
          label: 'submit.go — reject instead of waiting',
          src: `// TrySubmit hands a job to the pool, or reports that the pool is full.
func (p *Pool) TrySubmit(j Job) bool {
\tselect {
\tcase p.jobs <- j:
\t\treturn true
\tdefault: // every worker busy and the buffer full
\t\treturn false // the handler returns 503 with Retry-After
\t}
}`,
          note: 'This is load shedding. The same idea at system scale is on the [message queues](/concepts/message-queues) page.',
        },
      },
      {
        heading: 'Common worker pool bugs',
        bullets: [
          '**"all goroutines are asleep - deadlock!"** Usually `main` ranges over `results` but nobody closes it, or `main` calls `wg.Wait()` before reading `results`, so workers block on the send and the wait never ends.',
          '**"send on closed channel".** A worker, or a second producer, closed `jobs` or `results`. With several producers, give them their own WaitGroup and close `jobs` after it.',
          '**A leaked producer.** Workers stop on an error, but the producer is still blocked on `jobs <- n`. Give the producer a `select` with `ctx.Done()`.',
          '**One panic kills the program.** A panic in any goroutine crashes the whole process, not just that worker. If a job can panic on bad input, `recover` inside the per-job function and turn it into an error.',
          '**Results lost to a shared slice with `append`.** Several workers calling `append` on one slice is a data race. Write to `out[index]`, send on a channel, or lock.',
          '**Run your tests with `go test -race`.** The race detector catches the last bug and most of its relatives.',
        ],
      },
      {
        heading: 'Worker pool interview questions',
        bullets: [
          '**Why use a worker pool if goroutines are cheap?** To bound what the goroutines hold or call: connections, API quota, memory. The pool is a concurrency limit, not a goroutine-saving device.',
          '**How do you return results in the input order?** Send the index with the job and write the result into that index of a preallocated slice.',
          '**How do you stop all workers when one fails?** Cancel a shared context on the first error (`errgroup.WithContext` does this), have workers and the producer select on `ctx.Done()`, and still wait for all of them before returning.',
          '**Worker pool or semaphore?** Equivalent bounds. A pool keeps N goroutines alive and suits a stream of jobs or a per-worker resource. A semaphore starts a goroutine per task and suits looping over a slice.',
          '**How many workers?** Cores for CPU-bound work. For I/O, throughput times latency, capped by the smallest downstream limit.',
        ],
      },
    ],
    keyPoints: [
      'A worker pool bounds what runs at once. Goroutines are cheap; the connections and memory they hold are not.',
      'The producer closes `jobs`; a goroutine that waits on the WaitGroup closes `results`; the reader drains `results`.',
      'Send an index with each job to get results back in order.',
      'Cancel a context on the first error or timeout, and make the producer select on it too.',
      '`errgroup.SetLimit` or a buffered-channel semaphore gives the same bound with less code for a known list of jobs.',
      'Workers: cores for CPU work; throughput × latency for I/O, capped by the downstream limit.',
    ],
    remember: 'Bound the work, not the goroutines: N workers, one jobs channel, and every channel closed by the side that knows it is finished.',
    exercises: [
      {
        task: 'In `pool.go`, move `close(results)` to straight after the producer goroutine is started, in `main`. What happens, and why?',
        answer: 'It panics with "send on closed channel" as soon as a worker sends a result, because results is closed while workers are still running. Only the goroutine that waits for every worker may close it.',
      },
      {
        task: 'Change `cancel.go` so that a failing job does not stop the others, and `run` returns all the errors together.',
        answer: 'Collect errors in a slice under the mutex instead of calling `cancel(err)`, then return `errors.Join(errs...)` (Go 1.20+) after `wg.Wait()`.',
      },
      {
        task: 'Your pool calls an API that allows 100 requests a second, and each call takes about 400 ms. How many workers, and what else do you need?',
        answer: 'About 100 × 0.4 = 40 workers to keep 100 a second in flight. Workers alone do not enforce a rate, though, so also add a rate limiter (for example `golang.org/x/time/rate`) in front of the call.',
      },
    ],
    refs: [
      { label: 'Go blog: pipelines and cancellation', href: 'https://go.dev/blog/pipelines' },
      { label: 'errgroup package', href: 'https://pkg.go.dev/golang.org/x/sync/errgroup' },
      { label: 'semaphore package', href: 'https://pkg.go.dev/golang.org/x/sync/semaphore' },
      { label: 'context.WithCancelCause', href: 'https://pkg.go.dev/context#WithCancelCause' },
    ],
  },

  {
    slug: 'sync-package',
    searchTitle: 'Golang sync Package: Mutex, WaitGroup, Once, Pool, Map, Cond',
    title: 'The sync package in Go: every type, with examples',
    navTitle: 'The sync package',
    metaDescription:
      'Go sync package reference: Mutex, RWMutex, WaitGroup and WaitGroup.Go, Once and OnceValue, Pool, Map, Cond and sync/atomic, each with runnable code and pitfalls.',
    oneLine: 'Every type in `sync`, what it is for, a working example, and the mistake people make with it.',
    objectives: [
      'Pick the right `sync` type for a problem: lock, wait, run once, reuse, or signal.',
      'Use `WaitGroup.Go`, `sync.OnceValue` and the typed atomics from recent Go releases.',
      'Name the trap in each type, such as copying a mutex or trusting `sync.Pool` to keep an object.',
    ],
    blocks: [
      {
        body: [
          'The `sync` package holds Go\'s low-level synchronisation tools. Channels handle passing data between goroutines; `sync` handles everything around shared state: locking it, waiting for goroutines, doing setup once, and reusing memory. Its sibling `sync/atomic` handles single values without a lock.',
          'One rule applies to every type here: **do not copy it after first use.** A copied `Mutex` is a second, unrelated lock, and a copied `WaitGroup` counts nothing. Pass pointers, and let `go vet` (its copylocks check) catch the mistakes.',
        ],
        table: {
          headers: ['Type', 'Use it to', 'Added', 'The usual mistake'],
          rows: [
            ['`Mutex`', 'Let one goroutine at a time touch shared state', 'Go 1.0 (`TryLock` 1.18)', 'Copying it; holding it across slow I/O'],
            ['`RWMutex`', 'Many readers at once, or one writer', 'Go 1.0', 'Recursive `RLock`; using it where reads are short'],
            ['`WaitGroup`', 'Wait for a group of goroutines to finish', 'Go 1.0 (`Go` method 1.25)', '`Add` inside the goroutine'],
            ['`Once`, `OnceFunc`, `OnceValue`, `OnceValues`', 'Run setup exactly once, lazily', 'Once 1.0, the rest 1.21', 'Expecting a failed setup to be retried'],
            ['`Pool`', 'Reuse temporary objects to cut allocations', 'Go 1.3', 'Assuming objects stay in it; not resetting them'],
            ['`Map`', 'A concurrent map for two specific access patterns', 'Go 1.9', 'Using it as a general map replacement'],
            ['`Cond`', 'Wake goroutines waiting for a condition', 'Go 1.0', 'Calling `Wait` outside a `for` loop'],
            ['`sync/atomic` types', 'One counter, flag or pointer without a lock', 'Typed API 1.19', 'Mixing atomic and plain access to one value'],
          ],
        },
      },
      {
        heading: 'sync.Mutex',
        body: [
          '`Lock` and `Unlock` around every access to the shared data, with `defer mu.Unlock()` straight after `Lock` so an early return or a panic cannot leave it locked. Keep the mutex next to the data it protects, in the same struct, and keep the locked section short: never hold a lock while making a network call.',
          '`TryLock` exists (Go 1.18) but its own documentation warns that correct uses are rare. If you are reaching for it, there is usually a design problem. The Go mutex is also fair under pressure: a waiter that has waited more than 1 ms switches the lock into starvation mode, where it is handed over directly in queue order. The full lesson is [Mutexes and races](/languages/go/mutex-and-races).',
        ],
      },
      {
        heading: 'sync.RWMutex',
        body: [
          '`RLock` lets any number of readers in together; `Lock` waits until there are none and keeps everyone else out. It only beats a plain `Mutex` when reads clearly outnumber writes and each read holds the lock long enough for readers to overlap. It has one trap that deadlocks real programs: a goroutine must never take `RLock` twice. Both are covered with benchmarks in [Mutex vs RWMutex](/languages/go/mutex-vs-rwmutex).',
        ],
      },
      {
        heading: 'sync.WaitGroup and WaitGroup.Go',
        body: [
          'A WaitGroup is a counter. `Add(n)` raises it, `Done()` lowers it by one, and `Wait()` blocks until it reaches zero. Call `Add` **before** the `go` statement; inside the goroutine, `Wait` can run first and return immediately.',
          'Go 1.25 added `wg.Go(f)`, which does the `Add(1)`, starts `f` in a goroutine, and calls `Done` when it returns. Use it whenever your module targets Go 1.25 or later; it removes both classic mistakes. A WaitGroup does not collect errors. For that, use `errgroup` ([Worker pool](/languages/go/worker-pool)).',
        ],
        code: {
          label: 'waitgroup.go',
          src: `package main

import (
\t"fmt"
\t"sync"
)

func main() {
\tsquares := make([]int, 5)

\t// Go 1.25+: Go does Add(1), starts the goroutine and calls Done.
\tvar wg sync.WaitGroup
\tfor i := range squares {
\t\twg.Go(func() {
\t\t\tsquares[i] = i * i // each goroutine writes its own slot
\t\t})
\t}
\twg.Wait()
\tfmt.Println("with wg.Go:", squares)

\t// The same thing on Go 1.24 and older.
\tvar old sync.WaitGroup
\tfor i := range squares {
\t\told.Add(1) // before go, never inside it
\t\tgo func() {
\t\t\tdefer old.Done()
\t\t\tsquares[i] = i * i * i
\t\t}()
\t}
\told.Wait()
\tfmt.Println("with Add/Done:", squares)
}
`,
          canRun: true,
        },
      },
      {
        heading: 'sync.Once, OnceFunc, OnceValue and OnceValues',
        body: [
          '`once.Do(f)` runs `f` the first time it is called from any goroutine. Concurrent callers wait until that first call finishes, then return without running `f`. Use it for lazy setup: parsing a config, compiling a regular expression, creating a shared client.',
          'Go 1.21 added three helpers that are usually what you want. `sync.OnceFunc(f)` returns a function that runs `f` once. `sync.OnceValue(f)` returns a function that runs `f` once and then returns its result every time. `sync.OnceValues(f)` does the same for a `(value, error)` pair.',
          'The trap: "once" means once, even if it failed. If the setup returns an error, every later call gets the same error, and it is never retried. When the setup can fail for a temporary reason, like a network call, use a mutex and a "done" flag instead, so a later call can try again.',
        ],
        code: {
          label: 'once.go',
          src: `package main

import (
\t"errors"
\t"fmt"
\t"strconv"
\t"sync"
)

var calls int

// loadPort runs the parse once, however many goroutines call it.
var loadPort = sync.OnceValues(func() (int, error) {
\tcalls++
\treturn strconv.Atoi("8080")
})

var loadBroken = sync.OnceValues(func() (int, error) {
\treturn 0, errors.New("config server unreachable")
})

func main() {
\tvar wg sync.WaitGroup
\tfor range 10 {
\t\twg.Go(func() {
\t\t\tport, err := loadPort()
\t\t\t_, _ = port, err
\t\t})
\t}
\twg.Wait()
\tport, err := loadPort()
\tfmt.Println("port:", port, "err:", err, "setup ran:", calls, "time(s)")

\t// a failure is remembered too: it is not retried
\t_, err1 := loadBroken()
\t_, err2 := loadBroken()
\tfmt.Println(err1, "|", err2)
}
`,
          canRun: true,
          note: 'Eleven calls, one parse. The broken loader returns the same error both times without running again.',
        },
      },
      {
        heading: 'sync.Pool',
        body: [
          'A Pool keeps temporary objects for reuse, so a hot path that needs a scratch buffer on every request does not allocate a new one each time. `Get` returns a pooled object or calls `New` to make one; `Put` hands it back.',
          'Two rules. First, the pool may drop anything it holds at any time; in practice objects that sit unused across garbage collections are freed. So it is a cache for memory, never a place to keep state. Second, reset an object before using it again, because it still holds whatever the last user left in it. Do not pool things that need closing, such as connections or files; that is a job for a real pool like `*sql.DB`.',
          'Measure before adding one. A Pool only pays off when allocation shows up in a profile. The standard library uses it in places like `fmt`, where buffers are allocated on every call.',
        ],
        code: {
          label: 'pool.go',
          src: `package main

import (
\t"bytes"
\t"fmt"
\t"sync"
)

var bufPool = sync.Pool{
\tNew: func() any { return new(bytes.Buffer) },
}

func render(name string) string {
\tb := bufPool.Get().(*bytes.Buffer)
\tb.Reset() // it may still hold the previous user's bytes
\tdefer bufPool.Put(b)

\tb.WriteString("hello, ")
\tb.WriteString(name)
\treturn b.String() // String copies, so returning it after Put is safe
}

func main() {
\tfor _, n := range []string{"asha", "ben", "chen"} {
\t\tfmt.Println(render(n))
\t}
}
`,
          canRun: true,
          note: 'Without `Reset`, the second call would print "hello, ashahello, ben" whenever it got the same buffer back.',
        },
      },
      {
        heading: 'sync.Map',
        body: [
          'A map that is safe for concurrent use without your own lock. Its documentation is specific about when it helps: when each key is written once and then read many times (a cache that only grows), or when different goroutines read and write disjoint sets of keys. For everything else, a plain `map` guarded by a `Mutex` or `RWMutex` is simpler, type-safe and often faster.',
          'Its methods are `Load`, `Store`, `LoadOrStore`, `LoadAndDelete`, `Delete`, `Range`, plus `Swap`, `CompareAndSwap` and `CompareAndDelete` (Go 1.20) and `Clear` (Go 1.23). Values come back as `any`, so you need a type assertion on every read.',
        ],
        code: {
          label: 'syncmap.go',
          src: `package main

import (
\t"fmt"
\t"sync"
)

func main() {
\tvar seen sync.Map // zero value is ready to use
\tvar wg sync.WaitGroup
\tvar firsts sync.Map

\turls := []string{"/a", "/b", "/a", "/c", "/b", "/a"}
\tfor i, u := range urls {
\t\twg.Go(func() {
\t\t\t// only the first goroutine for each key stores; the rest load
\t\t\tif _, loaded := seen.LoadOrStore(u, i); !loaded {
\t\t\t\tfirsts.Store(u, true)
\t\t\t}
\t\t})
\t}
\twg.Wait()

\tn := 0
\tfirsts.Range(func(k, v any) bool {
\t\tn++
\t\treturn true // keep iterating
\t})
\tfmt.Println("distinct paths:", n)

\tif v, ok := seen.Load("/c"); ok {
\t\tfmt.Println("/c first seen at index", v.(int))
\t}
}
`,
          canRun: true,
          note: '`LoadOrStore` makes "insert if absent" one atomic step. With a plain map you would need the lock around both the check and the insert.',
        },
      },
      {
        heading: 'sync.Cond',
        body: [
          'A condition variable: goroutines `Wait` until another goroutine changes some state and calls `Signal` (wake one) or `Broadcast` (wake all). `Wait` unlocks the associated mutex while sleeping and locks it again before returning.',
          'Always call `Wait` inside a `for` loop that re-checks the condition, because by the time a woken goroutine runs, another may have changed the state again. The package documentation itself says that for many simple cases channels are a better fit. `Cond` earns its place when many goroutines wait on a condition over shared state, and `Broadcast` wakes all of them at once, which a channel can only do by being closed (once).',
        ],
        code: {
          label: 'cond.go',
          src: `package main

import (
\t"fmt"
\t"sync"
)

type queue struct {
\tmu    sync.Mutex
\tcond  *sync.Cond
\titems []int
}

func newQueue() *queue {
\tq := &queue{}
\tq.cond = sync.NewCond(&q.mu)
\treturn q
}

func (q *queue) Put(v int) {
\tq.mu.Lock()
\tq.items = append(q.items, v)
\tq.mu.Unlock()
\tq.cond.Signal() // wake one waiting taker
}

func (q *queue) Take() int {
\tq.mu.Lock()
\tdefer q.mu.Unlock()
\tfor len(q.items) == 0 { // a loop, not an if
\t\tq.cond.Wait() // unlocks while asleep, relocks before returning
\t}
\tv := q.items[0]
\tq.items = q.items[1:]
\treturn v
}

func main() {
\tq := newQueue()
\tvar wg sync.WaitGroup
\tsum := 0
\tvar mu sync.Mutex
\tfor range 3 {
\t\twg.Go(func() {
\t\t\tv := q.Take()
\t\t\tmu.Lock()
\t\t\tsum += v
\t\t\tmu.Unlock()
\t\t})
\t}
\tfor v := 1; v <= 3; v++ {
\t\tq.Put(v * 10)
\t}
\twg.Wait()
\tfmt.Println("taken:", sum)
}
`,
          canRun: true,
          note: 'Prints 60. A buffered channel would do this job in three lines, which is the documentation\'s point.',
        },
      },
      {
        heading: 'sync/atomic',
        body: [
          'For a single counter, flag or pointer, an atomic operation is cheaper than a lock. Since Go 1.19 the package has typed values (`atomic.Int64`, `atomic.Bool`, `atomic.Pointer[T]` and others) that cannot be accessed non-atomically by accident, which is a real improvement over the older `atomic.AddInt64(&n, 1)` functions.',
          'Atomics protect one value. As soon as two values must change together (a balance and a history, a count and a total), use a mutex. Every access to an atomic value must be atomic: one plain read next to atomic writes is a data race.',
        ],
        code: {
          label: 'atomic.go',
          src: `package main

import (
\t"fmt"
\t"sync"
\t"sync/atomic"
)

func main() {
\tvar hits atomic.Int64
\tvar ready atomic.Bool
\tvar wg sync.WaitGroup

\tfor range 1000 {
\t\twg.Go(func() { hits.Add(1) })
\t}
\twg.Wait()
\tready.Store(true)

\tfmt.Println("hits:", hits.Load(), "ready:", ready.Load())
\tfmt.Println("swapped 1000 -> 0:", hits.CompareAndSwap(1000, 0), "now:", hits.Load())
}
`,
          canRun: true,
        },
      },
      {
        heading: 'When should you use a channel instead of sync?',
        body: [
          'When the problem is about handing data or work from one goroutine to another: a pipeline, a job queue, a result, a timeout with `select`. Use `sync` when goroutines share state in place. The Go wiki\'s advice is to use whichever is simpler, and [Mutex vs channel](/languages/go/mutex-vs-channel) walks through both versions of the same program.',
        ],
        callout: {
          tone: 'warn',
          text: 'Whatever you use, run tests with `go test -race`. Every type on this page exists to prevent bugs the race detector is built to find.',
        },
      },
    ],
    keyPoints: [
      'Never copy a `sync` value after first use; pass pointers and let `go vet` check.',
      '`wg.Go(f)` (Go 1.25) replaces the `Add`/`Done` pair; `Add` before `go` on older versions.',
      '`OnceValue` and `OnceValues` (Go 1.21) run setup once and remember the result, including a failure.',
      '`sync.Pool` is a memory cache that can be emptied at any time. Reset what you get from it.',
      '`sync.Map` is for write-once-read-many keys or disjoint key sets; otherwise use a map and a mutex.',
      'Typed atomics (Go 1.19) for single values; a mutex as soon as two values must change together.',
    ],
    remember: 'Mutex for state, WaitGroup to wait, Once for setup, Pool for scratch memory, atomic for one value, and a channel when data moves.',
    exercises: [
      {
        task: 'Write a `Counter` struct with a `sync.Mutex` and an `Inc` method on a value receiver. Run `go vet`. What does it say, and what is the fix?',
        answer: 'vet reports that `Inc` passes the lock by value (copylocks). Each call locks its own copy, so nothing is protected. Use a pointer receiver: `func (c *Counter) Inc()`.',
      },
      {
        task: 'Replace the `sync.Cond` queue in `cond.go` with a buffered channel. How many lines did you save?',
        answer: '`q := make(chan int, 3)`, `q <- v` to put and `v := <-q` to take. The type, constructor and both methods disappear.',
      },
      {
        task: 'Your service loads a token from a secrets API at startup with `sync.OnceValues`. The API was briefly down at boot. What happens for the life of the process, and what would you write instead?',
        answer: 'Every call returns the same error forever, because a failed Once is not retried. Use a mutex with a cached value and a flag that is set only on success, so a later call retries.',
      },
    ],
    refs: [
      { label: 'sync package', href: 'https://pkg.go.dev/sync' },
      { label: 'sync/atomic package', href: 'https://pkg.go.dev/sync/atomic' },
      { label: 'Go 1.21 release notes (OnceFunc, OnceValue)', href: 'https://go.dev/doc/go1.21#sync' },
      { label: 'Go 1.25 release notes (WaitGroup.Go)', href: 'https://go.dev/doc/go1.25' },
      { label: 'The Go memory model', href: 'https://go.dev/ref/mem' },
    ],
  },

  {
    slug: 'mutex-vs-rwmutex',
    searchTitle: 'Golang Mutex vs RWMutex: RLock vs Lock, and Atomics',
    title: 'Mutex vs RWMutex in Go: when RLock actually helps',
    navTitle: 'Mutex vs RWMutex',
    metaDescription:
      'Go Mutex vs RWMutex: what RLock and Lock do, when RWMutex is faster and when it is slower, the recursive RLock deadlock, and when sync/atomic beats both.',
    oneLine: 'RWMutex lets readers share the lock. That only pays off when reads dominate and take long enough to overlap.',
    objectives: [
      'Explain what `RLock`, `Lock` and a waiting writer do to each other.',
      'Benchmark a read-heavy cache with both locks and read the result honestly.',
      'Avoid the recursive `RLock` deadlock and the lock-upgrade mistake.',
    ],
    blocks: [
      {
        body: [
          'A `sync.Mutex` lets one goroutine in at a time. A `sync.RWMutex` has two modes: any number of goroutines can hold it for **reading** (`RLock`) at the same time, or exactly one can hold it for **writing** (`Lock`), with nobody reading. It is the natural fit for data that is read constantly and changed rarely: a config, a routing table, a cache.',
        ],
        table: {
          headers: ['', '`sync.Mutex`', '`sync.RWMutex`'],
          rows: [
            ['Who can hold it', 'One goroutine', 'Many readers, or one writer'],
            ['Methods', '`Lock`, `Unlock`, `TryLock`', 'Those, plus `RLock`, `RUnlock`, `TryRLock`, `RLocker`'],
            ['Cost per lock', 'One atomic operation to lock, one to unlock', '`RLock` is one atomic add; `Lock` takes an internal mutex and then waits for readers to drain'],
            ['Wins when', 'Critical sections are tiny, or writes are common', 'Reads dominate and each read takes long enough for readers to overlap'],
            ['Waiting writer', 'Not applicable', 'Blocks new readers, so writers do not starve'],
            ['Reentrant', 'No', 'No, and a second `RLock` in the same goroutine can deadlock'],
          ],
        },
      },
      {
        heading: 'What do RLock and Lock do?',
        body: [
          '`RLock` succeeds immediately unless a writer holds the lock **or is waiting for it**. `Lock` waits until every current reader has called `RUnlock`, then holds the lock alone. That second rule, a waiting writer blocking new readers, is what stops a steady stream of readers from starving writers forever. It is also the cause of the deadlock below.',
          'Use them in pairs, each with `defer`: `RLock`/`RUnlock` in read paths, `Lock`/`Unlock` in write paths. Calling `Unlock` after `RLock`, or the reverse, is a fatal error.',
        ],
        code: {
          label: 'config.go',
          src: `package main

import (
\t"fmt"
\t"sync"
)

type Config struct {
\tmu    sync.RWMutex
\tflags map[string]bool
}

func (c *Config) Enabled(name string) bool {
\tc.mu.RLock() // many readers at once
\tdefer c.mu.RUnlock()
\treturn c.flags[name]
}

func (c *Config) Set(name string, on bool) {
\tc.mu.Lock() // waits for readers to leave, then holds it alone
\tdefer c.mu.Unlock()
\tc.flags[name] = on
}

func main() {
\tcfg := &Config{flags: map[string]bool{"new-checkout": false}}

\tvar wg sync.WaitGroup
\tvar mu sync.Mutex
\ton := 0
\tfor i := range 100 {
\t\tif i == 50 {
\t\t\tcfg.Set("new-checkout", true)
\t\t}
\t\twg.Go(func() {
\t\t\tif cfg.Enabled("new-checkout") {
\t\t\t\tmu.Lock()
\t\t\t\ton++
\t\t\t\tmu.Unlock()
\t\t\t}
\t\t})
\t}
\twg.Wait()
\tfmt.Println("readers that saw the flag on:", on >= 50)
}
`,
          canRun: true,
        },
      },
      {
        heading: 'Is RWMutex faster than Mutex?',
        body: [
          'For reads that hold the lock a while and rarely meet a writer, yes, by a lot. For tiny reads the gap shrinks, and when writes are frequent a plain Mutex is faster. The reason is in the mechanics: every `RLock` and `RUnlock` updates one shared reader count, and on many cores that word bounces between CPU caches. When the read is a single map lookup, that traffic is most of the cost, so readers overlapping saves little. A `Lock` on an RWMutex also does more work than a Mutex `Lock`, because it has to wait for every reader to leave.',
          'We ran the benchmark below with Go 1.26 on an 8-thread laptop. Read-heavy, with 100 map reads under the lock: RWMutex took about 320 ns per operation at `-cpu 4` against about 1,250 ns for Mutex, roughly 4 times faster. Tiny reads (one lookup): RWMutex was about 25% faster at `-cpu 8` (87 ns against 116 ns). Write-heavy, one write per two operations: Mutex was about 15% faster (1,180 ns against 1,390 ns). At `-cpu 1` the read-heavy pair was level, because nothing can overlap.',
          'Treat those as one machine\'s numbers. Core count, the read/write ratio and how long each read holds the lock all move the result, so benchmark your own access pattern. The benchmark runs on all cores with `b.RunParallel`, and the ratio and the work inside the lock are parameters.',
        ],
        code: {
          label: 'cache_test.go — run with go test -bench . -cpu 1,4,8',
          src: `package cache

import (
\t"sync"
\t"testing"
)

type locker interface {
\tLock()
\tUnlock()
\tRLock()
\tRUnlock()
}

// mutexRW makes a plain Mutex fit the same interface: RLock is just Lock.
type mutexRW struct{ sync.Mutex }

func (m *mutexRW) RLock()   { m.Lock() }
func (m *mutexRW) RUnlock() { m.Unlock() }

var data = func() map[int]int {
\tm := make(map[int]int, 1000)
\tfor i := range 1000 {
\t\tm[i] = i
\t}
\treturn m
}()

// bench does writeEvery-1 reads for every write; each read sums 'work' keys.
func bench(b *testing.B, l locker, writeEvery, work int) {
\tb.RunParallel(func(pb *testing.PB) {
\t\ti := 0
\t\tfor pb.Next() {
\t\t\ti++
\t\t\tif i%writeEvery == 0 {
\t\t\t\tl.Lock()
\t\t\t\tdata[i%1000] = i
\t\t\t\tl.Unlock()
\t\t\t\tcontinue
\t\t\t}
\t\t\tl.RLock()
\t\t\tsum := 0
\t\t\tfor k := range work {
\t\t\t\tsum += data[k]
\t\t\t}
\t\t\tl.RUnlock()
\t\t\t_ = sum
\t\t}
\t})
}

func BenchmarkMutexReadHeavy(b *testing.B)   { bench(b, &mutexRW{}, 1000, 100) }
func BenchmarkRWMutexReadHeavy(b *testing.B) { bench(b, &sync.RWMutex{}, 1000, 100) }
func BenchmarkMutexTinyRead(b *testing.B)    { bench(b, &mutexRW{}, 1000, 1) }
func BenchmarkRWMutexTinyRead(b *testing.B)  { bench(b, &sync.RWMutex{}, 1000, 1) }
func BenchmarkMutexWriteHeavy(b *testing.B)  { bench(b, &mutexRW{}, 2, 100) }
func BenchmarkRWMutexWriteHeavy(b *testing.B) { bench(b, &sync.RWMutex{}, 2, 100) }
`,
          note: 'Change `writeEvery` and `work` to match your real access pattern before drawing a conclusion. If your numbers differ from ours, believe yours.',
        },
      },
      {
        heading: 'Why can a second RLock deadlock?',
        body: [
          'Because a waiting writer blocks new readers. Suppose goroutine A holds a read lock and, deeper in the same call, calls a helper that takes `RLock` again. If a writer B called `Lock` in between, B is waiting for A to release, and A\'s second `RLock` is waiting for B to finish. Neither can move. The `sync` documentation spells this out: recursive read locking is prohibited.',
          'It passes every test that has no concurrent writer, and then hangs in production. The fix is structural: lock in the exported method only, and have it call unexported helpers that assume the lock is already held (a common convention is to name them with a `Locked` suffix).',
          'The program below shows the rule without hanging: once a writer is waiting, `TryRLock` reports that a second read lock cannot be taken.',
        ],
        code: {
          label: 'rlock-twice.go',
          src: `package main

import (
\t"fmt"
\t"sync"
\t"time"
)

func main() {
\tvar mu sync.RWMutex

\tmu.RLock() // A holds a read lock
\tfmt.Println("first RLock: ok")

\tgo func() { // B wants to write; it must wait for A
\t\tmu.Lock()
\t\tfmt.Println("writer: got the lock after the reader left")
\t\tmu.Unlock()
\t}()
\ttime.Sleep(20 * time.Millisecond) // let B start waiting

\t// A plain mu.RLock() here would block forever: B waits for A, A waits for B.
\tfmt.Println("second RLock while a writer waits:", mu.TryRLock())

\tmu.RUnlock() // A releases; B can now run
\ttime.Sleep(20 * time.Millisecond)
}
`,
          canRun: true,
          note: 'Prints false for the second read lock. Remove the writer goroutine and it prints true, which is why this bug hides in tests.',
        },
      },
      {
        heading: 'Can you upgrade a read lock to a write lock?',
        body: [
          'No. There is no upgrade: calling `Lock` while holding `RLock` deadlocks, since `Lock` waits for all readers, including you. The pattern is to release the read lock, take the write lock, and **check again**, because another goroutine may have done the work in the gap.',
        ],
        code: {
          label: 'get-or-load.go',
          src: `func (c *Cache) Get(key string) string {
\tc.mu.RLock()
\tv, ok := c.m[key]
\tc.mu.RUnlock()
\tif ok {
\t\treturn v
\t}

\tc.mu.Lock()
\tdefer c.mu.Unlock()
\tif v, ok := c.m[key]; ok { // someone filled it while we were unlocked
\t\treturn v
\t}
\tv = load(key) // slow; while it runs, every reader is blocked
\tc.m[key] = v
\treturn v
}`,
          note: 'Loading under the write lock blocks all readers for the duration of `load`. For slow loads, use per-key loading (the singleflight package in golang.org/x/sync) instead of one big lock.',
        },
      },
      {
        heading: 'When does sync/atomic beat both?',
        body: [
          'When readers only need a consistent snapshot of a value that is replaced as a whole. Store the current config in an `atomic.Pointer[Config]`. Readers call `Load` and get a pointer to an immutable snapshot, with no lock at all. A writer builds a new config and calls `Store`. This is copy-on-write: reads are as cheap as a pointer load, and writes copy the whole value, so it suits data that changes rarely.',
          'For a single counter, `atomic.Int64` beats any lock. As soon as two fields must change together, go back to a mutex.',
        ],
        code: {
          label: 'snapshot.go',
          src: `package main

import (
\t"fmt"
\t"maps"
\t"sync"
\t"sync/atomic"
)

type Flags map[string]bool // never modified after it is published

var current atomic.Pointer[Flags]

func enabled(name string) bool {
\treturn (*current.Load())[name] // no lock: readers see one whole snapshot
}

var writeMu sync.Mutex // writers still take turns with each other

func set(name string, on bool) {
\twriteMu.Lock()
\tdefer writeMu.Unlock()
\tnext := maps.Clone(*current.Load()) // copy, change the copy, publish it
\tnext[name] = on
\tcurrent.Store(&next)
}

func main() {
\tcurrent.Store(&Flags{"dark-mode": false})
\tfmt.Println("before:", enabled("dark-mode"))
\tset("dark-mode", true)
\tfmt.Println("after:", enabled("dark-mode"))
}
`,
          canRun: true,
        },
      },
      {
        heading: 'Mutex, RWMutex or atomic: which should you use?',
        table: {
          headers: ['Situation', 'Use'],
          rows: [
            ['Default for shared state; writes are common or sections are tiny', '`sync.Mutex`'],
            ['Reads far outnumber writes, and each read does real work under the lock', '`sync.RWMutex`, after a benchmark agrees'],
            ['One counter or flag', '`atomic.Int64` / `atomic.Bool`'],
            ['A whole value read constantly, replaced rarely', '`atomic.Pointer[T]` with copy-on-write'],
            ['Data or work moving between goroutines', 'A channel: see [Mutex vs channel](/languages/go/mutex-vs-channel)'],
          ],
        },
        callout: {
          tone: 'ok',
          text: 'Start with `sync.Mutex`. Switch to `RWMutex` when a mutex profile (`go test -mutexprofile`, or `runtime.SetMutexProfileFraction` in a service) shows contention on that lock and reads dominate.',
        },
      },
    ],
    keyPoints: [
      'RWMutex: many readers or one writer. Mutex: one goroutine.',
      'A waiting writer blocks new readers, so writers do not starve, and a recursive `RLock` can deadlock.',
      'RWMutex wins big when reads dominate and hold the lock long enough to overlap; with frequent writes a Mutex is faster. Benchmark it.',
      'There is no lock upgrade: unlock, lock, and check again.',
      'For one value, atomics; for a rarely replaced snapshot, `atomic.Pointer` with copy-on-write.',
    ],
    remember: 'Default to Mutex. Earn RWMutex with a benchmark. Never RLock twice in one goroutine.',
    exercises: [
      {
        task: 'Run the benchmark with `-cpu 1,8`. Why does the read-heavy advantage disappear at `-cpu 1`?',
        answer: 'With one P only one goroutine runs Go code at a time, so readers never actually overlap. The advantage of a shared read lock comes entirely from overlap.',
      },
      {
        task: '`func (c *Cache) Size() int { c.mu.RLock(); defer c.mu.RUnlock(); return len(c.Keys()) }`, where `Keys` also takes `RLock`. What is wrong?',
        answer: 'Recursive read locking. If a writer calls `Lock` between the two `RLock` calls, it deadlocks. Have `Keys` call an unexported `keysLocked` helper and use that from `Size` too.',
      },
      {
        task: 'A rate-limit table is read on every request and reloaded from a file every 5 minutes. Which tool fits best?',
        answer: '`atomic.Pointer` to an immutable table, replaced as a whole on reload. Readers never lock, and the reload is one `Store`.',
      },
    ],
    refs: [
      { label: 'sync.RWMutex documentation', href: 'https://pkg.go.dev/sync#RWMutex' },
      { label: 'sync/atomic: Pointer', href: 'https://pkg.go.dev/sync/atomic#Pointer' },
      { label: 'Go wiki: Use a sync.Mutex or a channel?', href: 'https://go.dev/wiki/MutexOrChannel' },
      { label: 'testing: RunParallel', href: 'https://pkg.go.dev/testing#B.RunParallel' },
    ],
  },

  {
    slug: 'interview-questions-experienced',
    searchTitle: 'Golang Interview Questions for Experienced Developers',
    title: 'Golang interview questions for experienced developers (3, 5 and 8+ years)',
    navTitle: 'Senior interview questions',
    metaDescription:
      'Golang interview questions for 3, 5 and 8+ years of experience: memory model, GC, escape analysis, scheduler, pprof, context, API design and production debugging.',
    oneLine:
      'The questions that come after the basics: how Go behaves in production, grouped by experience level, each with a short answer and the follow-up interviewers ask next.',
    objectives: [
      'Answer runtime questions (scheduler, GC, escape analysis, memory model) in two or three sentences each.',
      'Explain how you would find a latency or memory problem in a running Go service.',
      'Defend design choices in Go code: package layout, interfaces, errors and module versions.',
    ],
    blocks: [
      {
        body: [
          'With a few years of Go, interviews stop asking what a slice is and start asking what happens when things go wrong: under load, in a container, after a deploy. This page groups those questions by the level they are usually asked at. Each answer is what you would say out loud; the **follow-up** is the next question, which is where experienced candidates are told apart.',
          'If any fundamentals feel shaky, start with the 60 [Golang interview questions and answers](/languages/go/go-interview-questions), which include eight short production questions. This page goes further and does not repeat them.',
        ],
        table: {
          headers: ['Experience', 'What they are checking', 'Typical round'],
          rows: [
            ['~3 years', 'You write correct concurrent code and know the language\'s sharp edges', 'Code reading, small live coding, concurrency questions'],
            ['~5 years', 'You understand the runtime well enough to debug and tune it', 'Runtime internals, profiling, service design in Go'],
            ['8+ years', 'You make decisions other people live with: structure, APIs, operations', 'Design discussion, code review, incident stories'],
          ],
        },
      },
      {
        heading: 'Go interview questions for 3 years of experience',
        bullets: [
          '**A function appends to a slice it was given. Does the caller see the new element?** No. The function got a copy of the slice header, so the caller\'s length does not change. If there was spare capacity, the caller\'s backing array was written to, which is worse: a hidden side effect. _Follow-up:_ how do you design the API? Return the new slice, as `append` does. → [Arrays and slices](/languages/go/arrays-and-slices)',
          '**Your function returns `error` and the caller sees a non-nil error, but you returned a nil pointer. Why?** The function returned a typed nil (`var e *MyErr; return e`), and an interface holding a typed nil is not nil. _Follow-up:_ how do you prevent it? Return the literal `nil` on success, and declare the return type as `error`, never as a concrete error pointer. → [Interfaces](/languages/go/interfaces)',
          '**How does cancellation reach a goroutine three calls deep?** Only if every function passes the same `ctx` down and every blocking call takes it or selects on `ctx.Done()`. Nothing interrupts a goroutine from outside. _Follow-up:_ how do you start work that must outlive the request, like an audit write? `context.WithoutCancel(ctx)` (Go 1.21) keeps the values but drops the cancellation. → [Context](/languages/go/context)',
          '**Why does `go vet` complain about a `context.WithTimeout` without calling `cancel`?** The lostcancel check: until the timeout fires, the context and its timer are kept alive. Always `defer cancel()`. _Follow-up:_ does cancel stop the goroutines? No, it closes `Done()`; they must be watching it.',
          '**You put `defer f.Close()` inside a loop over 10,000 files. What happens?** Every defer runs when the function returns, not at the end of each iteration, so you hold 10,000 open files and may hit the descriptor limit. Move the body into its own function. → [Defer](/languages/go/defer)',
          '**Why does `m[k].Count++` not compile when `m` is `map[string]Stats`?** Map values are not addressable, because the map may move them when it grows. Copy, change and store back, or use `map[string]*Stats`. → [Maps](/languages/go/maps)',
          '**How do you test code that uses timers and sleeps without making the test slow?** Inject a clock, or use `testing/synctest` (standard since Go 1.25), which runs the test in a bubble with a fake clock that advances when every goroutine is blocked. _Follow-up:_ how do you catch races in tests? `go test -race`, and run it in CI. → [Testing](/languages/go/testing)',
          '**How do you return several errors from one function?** `errors.Join` (Go 1.20), and `errors.Is` and `errors.As` see through it. A single `fmt.Errorf` can also wrap more than one error with several `%w` verbs. → [Error values](/languages/go/error-values)',
          '**What is the risk of embedding an interface in a struct?** The struct satisfies the interface even if it implements none of the methods, and calling one panics with a nil pointer dereference if the embedded field was never set. It is useful for wrapping, dangerous by accident. → [Methods and embedding](/languages/go/methods-and-embedding)',
          '**How would you run 1,000 HTTP calls with at most 20 at a time?** A worker pool of 20 or `errgroup` with `SetLimit(20)`, a shared context so the first fatal error cancels the rest, and results written by index. → [Worker pool](/languages/go/worker-pool)',
        ],
      },
      {
        heading: 'Go interview questions for 5 years of experience',
        bullets: [
          '**What is escape analysis, and how do you see it?** The compiler decides whether each value can live on the stack or must move to the heap, because it is still referenced after the function returns. `go build -gcflags=-m` prints the decisions ("moved to heap", "escapes to heap"). Returning a pointer to a local is legal; it just escapes. _Follow-up:_ why care? Heap allocations cost GC work. Common causes are storing a value in an interface, closures that capture variables, and slices whose size is not known at compile time.',
          '**How does Go\'s garbage collector work?** A concurrent, non-generational, non-moving mark-and-sweep collector, using tri-colour marking with a write barrier so it can run alongside your goroutines with short stop-the-world pauses. `GOGC` (default 100) sets how much the heap may grow over the live heap before the next cycle; `GOMEMLIMIT` (Go 1.19) adds a soft memory ceiling. _Follow-up:_ how do you cut GC cost? Allocate less, first; tune second. → [Go GC guide](https://go.dev/doc/gc-guide)',
          '**What does the Go memory model guarantee?** Only what a happens-before edge gives you: a channel send before the matching receive completes, an `Unlock` before the next `Lock`, a `sync.Once` function before any `Do` returns, atomics in a sequentially consistent order. Without one of those, a goroutine may never see another\'s write. _Follow-up:_ is a "benign" data race acceptable? No. A racy program has no guarantees, and the race detector will flag it. → [The Go memory model](https://go.dev/ref/mem)',
          '**Explain the scheduler.** G (goroutines), M (OS threads), P (processors, `GOMAXPROCS` of them). Each P has a run queue, idle Ps steal work, a goroutine blocked in a syscall hands its P to another M, network waits park in the netpoller instead of holding a thread, and since Go 1.14 long-running goroutines are preempted asynchronously. _Follow-up:_ why can heavy cgo use need many threads? A goroutine inside a C call holds its M for the whole call. → [Goroutines vs threads](/languages/go/goroutines-vs-threads)',
          '**Which pprof profiles do you use, and for what?** CPU for where time goes; heap with `inuse_space` for what holds memory now and `alloc_space` for what allocates most; goroutine for leaks and stuck goroutines; block and mutex for contention, which are off until you set `runtime.SetBlockProfileRate` and `runtime.SetMutexProfileFraction`. `go tool trace` for latency that profiles average away. _Follow-up:_ what is PGO? Since Go 1.21 a CPU profile saved as `default.pgo` in the main package directory lets the compiler optimise hot paths, typically by a few percent. → [Profile and ship](/languages/go/profiling-and-shipping)',
          '**How do you shut down a service that has an HTTP server and background workers?** `signal.NotifyContext` for SIGTERM, then `srv.Shutdown(ctx)` with a deadline so in-flight requests finish, then stop feeding the workers, let them finish or cancel them, and wait for them before exiting. All inside the platform\'s grace period. → [Middleware and shutdown](/languages/go/middleware-and-shutdown)',
          '**Why is the default `http.Client` dangerous in production?** It has no timeout, so a slow upstream holds your goroutine forever. Set `Timeout` or use request contexts with deadlines. Also: the default transport keeps only 2 idle connections per host (`DefaultMaxIdleConnsPerHost`), and you must read and close response bodies or connections are not reused. _Follow-up:_ how would you see the effect? Connection churn and many `TIME_WAIT` sockets under load.',
          '**Where should interfaces be defined?** In the package that uses them, small, describing only what that caller needs. Return concrete types from constructors. _Follow-up:_ what about mocks? A consumer-side interface of one or two methods is easy to fake by hand; a 30-method interface created only to mock a struct is a design smell. → [Interfaces](/languages/go/interfaces)',
          '**How do errors flow through the layers of a service?** Each layer wraps with what it was doing (`fmt.Errorf("load order %d: %w", id, err)`), the domain defines sentinel or typed errors for cases callers branch on, and only the edge decides on an HTTP status and logs. Log or return, not both, or every failure is logged five times. → [Errors and logging](/languages/go/errors-and-logging)',
          '**When does `sync.Pool` help, and when does it hurt?** It helps on hot paths that allocate the same temporary buffer per request, once a profile shows allocation cost. It hurts when objects are large and rarely reused, when they are not reset, or when it is used to hold state, because the pool can drop anything at any time. → [The sync package](/languages/go/sync-package)',
          '**Are generics as fast as hand-written code?** Not always. The compiler shares one instantiation per GC shape (all pointer types share one, for example) and passes a dictionary for type-specific operations, so method calls through a type parameter can be slower than direct calls. For hot paths, benchmark. _Follow-up:_ then why use them? For containers and algorithms where the alternative is `any` and type assertions. → [Generics](/languages/go/generics)',
        ],
      },
      {
        heading: 'Go interview questions for 8+ years of experience',
        bullets: [
          '**How do you structure a large Go codebase?** Packages by domain, not by layer ("order", not "models" and "utils"); `internal/` for what other modules must not import; dependencies pointing inwards to the domain; and no package named `common`. _Follow-up:_ several modules in one repo? Only when they release on separate schedules; `go work` helps locally, and every extra module is a versioning cost. → [Project layouts](/languages/go/project-layouts)',
          '**How do Go modules choose versions?** Minimal version selection: the build uses the minimum version that satisfies every requirement, not the newest available, which makes builds reproducible without a lock file. Major versions 2 and up change the import path (`/v2`). _Follow-up:_ you published a broken release? Add a `retract` directive in a new version; never delete a tag, because the module proxy and `go.sum` files have already recorded it. → [Modules and tooling](/languages/go/modules-and-tooling)',
          '**A Go service has p99 spikes every few minutes. How do you find the cause?** Correlate the spikes with GC cycles, CPU throttling and deploys in metrics first. Then take an execution trace across a spike: `go tool trace` shows GC pauses, goroutines waiting on locks and scheduler delays directly. Go 1.25\'s `runtime/trace` flight recorder keeps the last few seconds in memory, so you can save a trace right after a spike is detected. _Follow-up:_ CPU throttling in Kubernetes? Check `GOMAXPROCS` against the CPU limit; since Go 1.25 the runtime follows the cgroup limit by default on Linux.',
          '**How do you keep a library backward compatible?** Follow the Go 1 compatibility idea in your own API: add, do not change. New behaviour behind new functions or options, old behaviour kept. When even the Go team changes behaviour, it ships a GODEBUG setting so programs can keep the old one for a while. _Follow-up:_ when do you make a v2? When the old API is actively harmful, accepting that every caller has to change their imports.',
          '**What do you look for first in a Go code review?** Who stops every goroutine; who closes every channel; `ctx` as the first parameter and actually used; errors wrapped, not swallowed or double-logged; locks held over I/O; and tests that run under `-race`. Style is gofmt\'s job.',
          '**How would you design a rate-limited, idempotent message consumer in Go?** A bounded worker pool reading from the queue, a per-tenant limiter (`golang.org/x/time/rate`), an idempotency key checked in the same transaction as the side effect, and acknowledgement only after commit. The system design side is [idempotency](/concepts/idempotency) and the [distributed message queue](/problems/distributed-message-queue) problem.',
          '**When would you not choose Go?** When the team and libraries are elsewhere (data science in Python), when you need fine control over memory layout and no GC pauses at all (Rust or C++), or for a large UI. Saying where Go is the wrong tool is part of a senior answer. → [Interview: backend and design](/languages/go/interview-backend-and-design)',
          '**Tell me about a production incident in a Go service.** Interviewers want the shape: what you saw, how you narrowed it down (metrics, then profiles or traces), the root cause in one sentence, the fix, and what you changed so it cannot recur (a test, an alert, a lint). Prepare two such stories, one about concurrency (a leak, a deadlock, a race) and one about resources (memory, connections, CPU limits).',
        ],
      },
      {
        heading: 'What does escape analysis output look like?',
        body: [
          'A small example of the first 5-year question. `newUser` returns a pointer, so `u` must outlive the call and moves to the heap. `sum` keeps everything on the stack. Run `go build -gcflags=-m` on it to see the compiler\'s reasoning for your Go version.',
        ],
        code: {
          label: 'escape.go — go build -gcflags=-m .',
          src: `package main

import "fmt"

type user struct{ name string }

func newUser(name string) *user {
\tu := user{name: name} // compiler: moved to heap: u
\treturn &u
}

func sum(xs [4]int) int {
\ttotal := 0 // stays on the stack
\tfor _, x := range xs {
\t\ttotal += x
\t}
\treturn total
}

func main() {
\tu := newUser("ravi")
\tfmt.Println(u.name, sum([4]int{1, 2, 3, 4}))
}
`,
          canRun: true,
          note: 'With Go 1.26 the output includes `moved to heap: u`, and `u.name escapes to heap` for the `fmt.Println` call: its arguments are stored in `any` values, which is why logging in a hot loop allocates. Nothing is reported for `total`, which stays on the stack.',
        },
      },
    ],
    keyPoints: [
      'At 3 years: correct concurrency and the language\'s sharp edges (slices, nil interfaces, defer, context).',
      'At 5 years: the runtime. Escape analysis, GC with GOGC and GOMEMLIMIT, the memory model, GMP, and pprof.',
      'At 8+ years: decisions. Package structure, module versioning, compatibility, incidents and code review.',
      'Every answer has a follow-up. Prepare the second sentence, not just the first.',
      'Bring two incident stories with a clear cause and a change that prevents a repeat.',
    ],
    remember: 'Experienced Go interviews test what happens in production. Answer in two sentences, then be ready for "how would you find that?"',
    exercises: [
      {
        task: 'Run `go build -gcflags=-m` on `escape.go`. Which lines move a value to the heap, and why?',
        answer: '`u` in `newUser` moves to the heap because its address is returned. The values passed to `fmt.Println` escape because they are converted to `any`. `total` in `sum` does not escape.',
      },
      {
        task: 'Explain, in under a minute, how you would find out why a Go service\'s memory grows by 200 MB a day.',
        answer: 'Compare heap profiles (`inuse_space`) taken hours apart with `go tool pprof -base`, and check the goroutine count for a leak. Growth that is all in goroutine stacks points at a leak; growth in one allocation site points at a cache or a retained slice.',
      },
      {
        task: 'Write down your two incident stories in five lines each: symptom, diagnosis, cause, fix, prevention.',
        answer: 'If a story has no prevention line, finish it before the interview: that line is what interviewers remember.',
      },
    ],
    refs: [
      { label: 'A Guide to the Go Garbage Collector', href: 'https://go.dev/doc/gc-guide' },
      { label: 'The Go memory model', href: 'https://go.dev/ref/mem' },
      { label: 'Diagnostics (profiling, tracing, debugging)', href: 'https://go.dev/doc/diagnostics' },
      { label: 'Profile-guided optimization', href: 'https://go.dev/doc/pgo' },
      { label: 'Go modules reference', href: 'https://go.dev/ref/mod' },
    ],
  },
]
