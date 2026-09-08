import type { LangLesson } from '@/lib/types'

/** Goroutines, channels, shared state, and generics. */
export const CONCURRENCY: LangLesson[] = [
  {
    slug: 'goroutines',
    title: 'Goroutines',
    navTitle: 'Goroutines',
    oneLine: 'Start ten thousand concurrent things with one keyword.',
    blocks: [
      {
        heading: 'A goroutine is not a thread',
        body: [
          'Put `go` in front of a function call and it runs concurrently. That is the whole syntax.',
          'A goroutine is managed by the Go runtime, not the operating system. It starts with about 2KB of stack that grows as needed, and creating one costs a few hundred nanoseconds. An OS thread costs a megabyte and a system call. This is why Go programs happily run a hundred thousand goroutines and Java programs do not run a hundred thousand threads.',
        ],
        code: {
          label: 'goroutine.go',
          src: `go doSomething()          // returns immediately, doSomething runs concurrently

go func() {
\tfmt.Println("in a goroutine")
}()`,
          note: 'When `main` returns, the program exits and every goroutine dies with it. That is why the example below needs something to wait on.',
        },
      },
      {
        heading: 'The runtime does the scheduling',
        body: [
          'Go multiplexes many goroutines onto a few OS threads. When a goroutine blocks — on a channel, a mutex, a network read, a `time.Sleep` — the runtime parks it and runs another one on that thread. Nothing is wasted waiting.',
          'That is the real trick behind Go servers. You write plain blocking code that reads like a script, and you get the throughput of an event loop without ever writing a callback or an `async`/`await`.',
        ],
      },
      {
        heading: 'WaitGroup — wait for N goroutines to finish',
        code: {
          label: 'waitgroup.go',
          src: `var wg sync.WaitGroup

for i := 0; i < 5; i++ {
\twg.Add(1)                     // count up BEFORE starting the goroutine
\tgo func() {
\t\tdefer wg.Done()           // count down when it finishes, whatever happens
\t\tfmt.Println(i)
\t}()
}

wg.Wait()                         // blocks until the count reaches zero`,
          run: `package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup

	for i := 0; i < 5; i++ {
		wg.Add(1)                     // count up BEFORE starting the goroutine
		go func() {
			defer wg.Done()           // count down when it finishes, whatever happens
			fmt.Println(i)
		}()
	}

	wg.Wait()                         // blocks until the count reaches zero
}
`,
          note: 'Call `Add` before `go`, never inside the goroutine — otherwise `Wait` can run before the count goes up and return immediately.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	results := make(chan string, 5)

	var wg sync.WaitGroup
	for i := 1; i <= 5; i++ {
		wg.Add(1) // BEFORE the go statement
		go func(n int) {
			defer wg.Done()
			time.Sleep(time.Duration(n) * 10 * time.Millisecond)
			results <- fmt.Sprintf("worker %d done", n)
		}(i)
	}

	wg.Wait()
	close(results) // the sender closes

	for r := range results {
		fmt.Println(r)
	}

	slow := make(chan int)
	select {
	case v := <-slow:
		fmt.Println("got", v)
	case <-time.After(50 * time.Millisecond):
		fmt.Println("timed out, as expected")
	}
}
`,
          canRun: true,
          note: 'A WaitGroup, a buffered channel, and a select with a timeout.',
        },
      },
    ],
    keyPoints: [
      '`go f()` starts a goroutine. About 2KB of stack, so thousands are normal.',
      'The runtime multiplexes them onto a few OS threads and parks them when they block.',
      'You write plain blocking code and get event-loop throughput, with no callbacks.',
      '`WaitGroup` waits for a known number. `Add` before `go`, `defer wg.Done()` inside.',
    ],
    remember:
      'When `main` returns the program exits, and every goroutine dies with it.',
    task: 'Start five goroutines that print their index, with and without a `WaitGroup`. Run each version several times.',
    exercises: [
      {
        task: 'Call `wg.Add(1)` inside the goroutine instead of before it, and see what breaks.',
        answer:
          '`Wait` can see a count of zero and return before anything started. Always `Add` before `go`.',
      },
      {
        task: 'Start 100,000 goroutines that sleep, and watch the memory.',
        answer:
          'A few hundred megabytes, and it works. Try that with OS threads and the machine falls over.',
      },
      {
        task: 'Start a goroutine and return from main immediately. Does it run?',
        answer:
          'It usually does not run. When main returns the program exits and takes every goroutine with it.',
      },
    ],
    refs: [
      { label: 'Effective Go — Concurrency', href: 'https://go.dev/doc/effective_go#concurrency' },
      { label: 'A Tour of Go — Concurrency', href: 'https://go.dev/tour/concurrency/1' },
    ],
  },

  {
    slug: 'channels-and-select',
    title: 'Channels and select',
    navTitle: 'Channels and select',
    oneLine: 'Passing values between goroutines safely, and waiting on several at once.',
    blocks: [
      {
        heading: 'Channels: a typed pipe between goroutines',
        code: {
          label: 'channels.go',
          src: `ch := make(chan int)        // unbuffered
ch := make(chan int, 5)     // buffered, holds 5 before blocking

ch <- 42                    // send
v := <-ch                   // receive

close(ch)                   // "no more values are coming"
for v := range ch { }       // receives until the channel is closed
v, ok := <-ch               // ok is false once closed and drained`,
        },
      },
      {
        heading: 'Unbuffered versus buffered',
        body: [
          'An **unbuffered** channel is a rendezvous. The sender blocks until a receiver takes the value, so both goroutines know the handoff happened. That synchronisation is often the point, not a cost.',
          'A **buffered** channel is a queue. The sender carries on until the buffer is full. Use one when you have a specific reason — a known number of results, or a signal that must never block the sender. A buffer size picked by feel hides backpressure and turns a fast failure into a slow memory leak.',
        ],
      },
      {
        heading: 'Channel behaviour, all of it',
        table: {
          headers: ['Operation', 'nil channel', 'open, empty', 'open, full', 'closed'],
          rows: [
            ['send', 'blocks forever', 'proceeds', 'blocks', '**panics**'],
            ['receive', 'blocks forever', 'blocks', 'proceeds', 'zero value, `ok=false`'],
            ['close', 'panics', '—', '—', '**panics**'],
          ],
        },
      },
      {
        callout: {
          tone: 'warn',
          text: '**The sender closes, never the receiver, and only one goroutine may close.** Closing tells receivers "nothing more is coming" — it is a broadcast every receiver sees. You do not have to close a channel at all; the garbage collector handles unreferenced ones. Close only when receivers need to know it ended.',
        },
      },
      {
        heading: 'select — wait on several channels at once',
        code: {
          label: 'select.go',
          src: `select {
case v := <-ch1:
\tfmt.Println("from ch1:", v)
case ch2 <- 1:
\tfmt.Println("sent to ch2")
case <-time.After(2 * time.Second):
\tfmt.Println("timeout")
default:
\tfmt.Println("nothing ready right now")   // makes select non-blocking
}`,
          note: 'If several cases are ready, `select` picks one at random. With no `default`, it blocks until one becomes ready.',
        },
      },
    ],
    keyPoints: [
      'Unbuffered channels synchronise; buffered ones queue. Default to unbuffered.',
      'The sender closes, never the receiver, and only one goroutine may close.',
      'Sending on a closed channel panics; receiving gives the zero value and `ok=false`.',
      'A nil channel blocks forever — which is how you disable a `select` case.',
    ],
    remember:
      'Know the channel behaviour table cold. Almost every concurrency bug is on it.',
    task: 'Build a worker pool: three workers reading from a jobs channel, results to a results channel, closed by the sender.',
    exercises: [
      {
        task: 'Send on an unbuffered channel with no receiver and read the deadlock message.',
        answer:
          '`fatal error: all goroutines are asleep - deadlock!` The runtime detects that nothing can ever make progress.',
      },
      {
        task: 'Close a channel then receive twice, checking `ok` each time.',
        answer:
          'Both return the zero value with `ok == false`, immediately. A closed channel never blocks.',
      },
      {
        task: 'Write a `select` with a `time.After` timeout and make it fire.',
        answer:
          'The timeout case fires. This is the standard way to give any blocking operation a deadline.',
      },
      {
        task: 'Set a channel variable to `nil` inside a select loop and watch that case switch off.',
        answer:
          'That case stops being chosen — a nil channel blocks forever, so `select` skips it. It is how you retire a branch of a loop.',
      },
    ],
    refs: [
      { label: 'Effective Go — Concurrency', href: 'https://go.dev/doc/effective_go#concurrency' },
      { label: 'A Tour of Go — Concurrency', href: 'https://go.dev/tour/concurrency/1' },
    ],
  },

  {
    slug: 'mutex-and-races',
    title: 'Mutexes and the race detector',
    navTitle: 'Mutexes and races',
    oneLine: 'Sharing state between goroutines without corrupting it.',
    blocks: [
      {
        heading: 'Use a mutex when you are guarding state',
        body: [
          '"Share memory by communicating" is Go’s slogan, but do not force it. A mutex around a cache is simpler, faster, and more obvious than a goroutine owning a map behind a channel. Channels are for transferring ownership of a value; a mutex is for protecting a field.',
        ],
        code: {
          label: 'cache.go',
          src: `type Cache struct {
\tmu sync.RWMutex        // put the lock directly above what it guards
\tm  map[string]string
}

func (c *Cache) Get(k string) (string, bool) {
\tc.mu.RLock()           // many readers at once
\tdefer c.mu.RUnlock()
\tv, ok := c.m[k]
\treturn v, ok
}

func (c *Cache) Set(k, v string) {
\tc.mu.Lock()            // one writer, no readers
\tdefer c.mu.Unlock()
\tc.m[k] = v
}`,
          run: `package main

import "sync"

type Cache struct {
	mu sync.RWMutex        // put the lock directly above what it guards
	m  map[string]string
}
func (c *Cache) Get(k string) (string, bool) {
	c.mu.RLock()           // many readers at once
	defer c.mu.RUnlock()
	v, ok := c.m[k]
	return v, ok
}
func (c *Cache) Set(k, v string) {
	c.mu.Lock()            // one writer, no readers
	defer c.mu.Unlock()
	c.m[k] = v
}

func main() {


}
`,
        },
      },
      {
        heading: 'Mutex rules',
        bullets: [
          '**Never copy a struct containing a mutex.** Use pointer receivers. `go vet` catches this for you.',
          '**Never make a network or database call while holding a lock.** Lock, take what you need, unlock, then do the slow thing.',
          '**A mutex is not reentrant.** Locking twice in the same goroutine deadlocks immediately.',
          '`RWMutex` only wins when there are far more reads than writes and the critical section is non-trivial. Otherwise a plain `Mutex` is faster.',
        ],
      },
      {
        heading: 'A data race is undefined behaviour, not a rare bug',
        body: [
          'If two goroutines touch the same memory, at least one writes, and there is no synchronisation between them — the behaviour is undefined. Not "occasionally wrong". The compiler and the CPU are both free to reorder, and one goroutine may never see the other’s write at all.',
        ],
        code: {
          label: 'race.go',
          src: `done := false                    // BROKEN, even though it may work on your laptop

go func() {
\twork()
\tdone = true
}()

for !done { }                    // may loop forever — the compiler can hoist the read`,
        },
      },
      {
        heading: 'The race detector is the best tool in the toolchain',
        code: {
          label: 'terminal',
          src: `go test -race ./...
go run -race ./cmd/api`,
          note: 'Run your whole test suite with -race in CI. It only reports races that actually happen at runtime, so exercise the concurrent paths in tests.',
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'A concurrent read and write on a **map** is special: the runtime detects it and hard-crashes the process with "concurrent map writes". It does not corrupt quietly. That is on purpose: a loud crash beats a quiet wrong answer.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type Counter struct {
	mu sync.Mutex
	n  int
}

func (c *Counter) Inc() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.n++
}

func main() {
	c := &Counter{}
	var wg sync.WaitGroup
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() { defer wg.Done(); c.Inc() }()
	}
	wg.Wait()
	fmt.Println("with a mutex, always 1000:", c.n)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Millisecond)
	defer cancel()

	select {
	case <-time.After(time.Second):
		fmt.Println("work finished")
	case <-ctx.Done():
		fmt.Println("cancelled:", ctx.Err())
	}
}
`,
          canRun: true,
          note: 'A counter with and without a mutex, and a context deadline.',
        },
      },
    ],
    keyPoints: [
      'Mutex for guarding state, channels for transferring ownership. Do not force channels.',
      'Never copy a struct containing a mutex, and never hold a lock across a network call.',
      'A data race is undefined behaviour, not a rare bug.',
      '`go test -race ./...` in CI. It is the highest-value tool in the toolchain.',
    ],
    remember:
      'Without synchronisation, one goroutine has no guarantee of ever seeing another’s writes.',
    task: 'Increment a counter from 1,000 goroutines with no mutex, run with `-race`, read the report, then fix it.',
    exercises: [
      {
        task: 'Fix the counter with a mutex, then again with `atomic.Int64`, and confirm both are clean.',
        answer:
          'Both give exactly 1000 and both are race-clean. The atomic is faster here because the guarded section is a single increment.',
      },
      {
        task: 'Copy a struct containing a mutex and see what `go vet` says.',
        answer:
          '`go vet` reports `passes lock by value`. The copy has its own lock, so it guards nothing.',
      },
      {
        task: 'Use `RWMutex` and measure whether it actually helps your read/write mix.',
        answer:
          'It only wins when reads heavily outnumber writes and the critical section does real work. For a one-line read a plain Mutex is often faster.',
      },
    ],
    refs: [
      { label: 'Go blog: Context', href: 'https://go.dev/blog/context' },
      { label: 'The Go Memory Model', href: 'https://go.dev/ref/mem' },
    ],
  },

  {
    slug: 'context',
    title: 'Context',
    navTitle: 'Context',
    oneLine: 'Cancelling work that nobody is waiting for any more.',
    blocks: [
      {
        heading: 'Context: cancellation, deadlines, and request values',
        body: [
          '`context.Context` is how a Go program says "stop, nobody needs this any more". It is the first parameter of nearly every function that does I/O in a real codebase.',
        ],
        code: {
          label: 'context.go',
          src: `ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()                    // ALWAYS, even on success — or you leak the timer

req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)

func work(ctx context.Context) error {
\tselect {
\tcase <-time.After(5 * time.Second):
\t\treturn nil
\tcase <-ctx.Done():
\t\treturn ctx.Err()      // context.Canceled or context.DeadlineExceeded
\t}
}`,
        },
      },
      {
        heading: 'The context rules — follow all of them',
        bullets: [
          '**First parameter, always, named `ctx`.**',
          '**Never store a Context in a struct.** It belongs to one call, not to an object.',
          '**Always call `cancel`.** `defer cancel()` on the line after you create it.',
          '**Cancelling does not stop anything by itself.** It closes `ctx.Done()`, and your code has to check that. Anything that blocks should `select` on it.',
          '`context.Value` is for request-scoped data crossing API boundaries — a request ID, a user ID. **Not** for dependencies or config. If the function needs it to work, it is a parameter.',
        ],
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"context"
	"fmt"
	"time"
)

type ctxKey struct{} // unexported, so nobody else can collide with it

func work(ctx context.Context, name string, d time.Duration) {
	select {
	case <-time.After(d):
		fmt.Println(name, "finished")
	case <-ctx.Done():
		fmt.Println(name, "stopped:", ctx.Err()) // you must check this
	}
}

func main() {
	// 1. a deadline
	ctx, cancel := context.WithTimeout(context.Background(), 40*time.Millisecond)
	defer cancel() // always, even on the success path
	work(ctx, "slow job", 200*time.Millisecond)

	// 2. cancelling by hand
	ctx2, cancel2 := context.WithCancel(context.Background())
	go func() {
		time.Sleep(20 * time.Millisecond)
		cancel2()
	}()
	work(ctx2, "cancelled job", time.Second)

	// 3. a request-scoped value
	ctx3 := context.WithValue(context.Background(), ctxKey{}, int64(42))
	if id, ok := ctx3.Value(ctxKey{}).(int64); ok {
		fmt.Println("user id from context:", id)
	}
}
`,
          canRun: true,
          note: 'A deadline that fires, a cancel that stops work early, and a value carried through.',
        },
      },
    ],
    keyPoints: [
      'First parameter, always, named `ctx`. Never stored in a struct.',
      'Always `defer cancel()` — even on the success path.',
      'Cancelling does not stop anything by itself. Your code must select on `ctx.Done()`.',
      '`context.Value` is for request-scoped identity, not for dependencies or config.',
    ],
    remember:
      'In a handler, derive from `r.Context()` so a disconnecting client stops your database query too.',
    task: 'Give a slow function a one-second timeout and make it return `context.DeadlineExceeded`.',
    exercises: [
      {
        task: 'Forget `defer cancel()` and see whether `go vet` catches it.',
        answer:
          '`go vet` catches the common shape (`lostcancel`). The leak is a timer and a goroutine that stay alive until the deadline passes.',
      },
      {
        task: 'Store a request id in a context with an unexported key type, and read it back.',
        answer:
          'It works, and no other package can read or overwrite it because they cannot name your key type.',
      },
      {
        task: 'Write a loop that ignores `ctx.Done()` and prove cancellation does nothing.',
        answer:
          'It runs to completion after cancellation. Cancelling only closes a channel — your code has to check it.',
      },
    ],
    refs: [
      { label: 'Go blog: Context', href: 'https://go.dev/blog/context' },
      { label: 'The Go Memory Model', href: 'https://go.dev/ref/mem' },
    ],
  },

  {
    slug: 'generics',
    title: 'Generics',
    navTitle: 'Generics',
    oneLine: 'Write one function for many types — and know when an interface is the better answer.',
    blocks: [
      {
        heading: 'What generics are for',
        body: [
          'Suppose you write a function that finds the largest number in a slice of `int`. Then you need one for `float64`. Then one for your own `Cents` type. The logic is identical each time, but Go\'s type checking means you cannot pass one where another is expected — so you end up with three near-identical copies.',
          '**Generics** let you write it once, with the type left as a blank to be filled in at the call site. The blank is called a **type parameter**, and a **constraint** says which types are allowed to fill it.',
          'The second half of this topic is the standard library: the packages that ship with Go. Knowing what is already written is worth more than being able to write it yourself.',
        ],
      },
      {
        heading: 'The syntax',
        code: {
          label: 'generics.go',
          src: `func Map[T, U any](xs []T, f func(T) U) []U {
\tout := make([]U, 0, len(xs))
\tfor _, x := range xs {
\t\tout = append(out, f(x))
\t}
\treturn out
}

names := Map(users, func(u User) string { return u.Name })   // T and U inferred`,
        },
      },
      {
        heading: 'Constraints limit what T can be',
        code: {
          label: 'constraints.go',
          src: `// "~int" means "any type whose underlying type is int", so your own
// "type UserID int" qualifies too.
type Number interface {
\t~int | ~int64 | ~float64
}

func Sum[T Number](xs []T) T {
\tvar total T                   // the zero value of whatever T is
\tfor _, x := range xs {
\t\ttotal += x
\t}
\treturn total
}

// cmp.Ordered comes from the stdlib and covers everything that supports < >
func Max[T cmp.Ordered](a, b T) T {
\tif a > b {
\t\treturn a
\t}
\treturn b
}`,
          run: `package main

import "cmp"

type Number interface {
	~int | ~int64 | ~float64
}
func Sum[T Number](xs []T) T {
	var total T                   // the zero value of whatever T is
	for _, x := range xs {
		total += x
	}
	return total
}
func Max[T cmp.Ordered](a, b T) T {
	if a > b {
		return a
	}
	return b
}

func main() {
	// "~int" means "any type whose underlying type is int", so your own
	// "type UserID int" qualifies too.


	// cmp.Ordered comes from the stdlib and covers everything that supports < >
}
`,
        },
      },
      {
        heading: 'Generics are for types; interfaces are for behaviour',
        bullets: [
          '**Use generics for** containers (a typed cache, set, or queue) and functions over any slice or map. That is exactly what `slices` and `maps` in the stdlib are.',
          '**Use an interface when** the thing you care about is what a type *does*. `Shape` is an interface, not a generic.',
          '**Do not build `Repository[T]` for your data layer.** It looks clever, produces error messages nobody can read, and gives you a type you can never specialise.',
        ],
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"cmp"
	"fmt"
	"slices"
)

type Number interface{ ~int | ~int64 | ~float64 }

type Cents int // ~int means this qualifies too

func Sum[T Number](xs []T) T {
	var total T
	for _, x := range xs {
		total += x
	}
	return total
}

func Map[T, U any](xs []T, f func(T) U) []U {
	out := make([]U, 0, len(xs))
	for _, x := range xs {
		out = append(out, f(x))
	}
	return out
}

func main() {
	fmt.Println(Sum([]int{1, 2, 3}))
	fmt.Println(Sum([]float64{1.5, 2.5}))
	fmt.Println(Sum([]Cents{199, 250}))

	names := Map([]int{1, 2, 3}, func(n int) string { return fmt.Sprint("#", n) })
	fmt.Println(names)

	xs := []int{3, 1, 2}
	slices.Sort(xs)
	fmt.Println(xs, slices.Contains(xs, 2), slices.Index(xs, 3))
	fmt.Println(max(3, 9), cmp.Compare(1, 2))
}
`,
          canRun: true,
          note: 'One function, several types — and the stdlib helpers that already exist.',
        },
      },
    ],
    keyPoints: [
      'A type parameter is a blank filled in at the call site; a constraint says what may fill it.',
      '`~int` means "any type whose underlying type is int", so your own named types qualify.',
      'Generics are for types; interfaces are for behaviour. Do not swap them.',
      'Write it concretely twice before you generalise.',
    ],
    remember:
      'If the duplication is between behaviours, you wanted an interface, not a generic.',
    task: 'Write generic `Filter`, `Map` and `Sum`, then call `Sum` with `int`, `float64` and your own named type.',
    exercises: [
      {
        task: 'Drop the `~` from a constraint and watch your named type stop compiling.',
        answer:
          'Your named type stops satisfying it. `int` alone means literally `int`, not anything built on it.',
      },
      {
        task: 'Write `Max[T cmp.Ordered]` and use it on strings as well as numbers.',
        answer:
          'It works on strings too, comparing lexicographically. `cmp.Ordered` covers everything `<` works on.',
      },
      {
        task: 'Try to write a generic `Repository[T]` and see how quickly the constraints get ugly.',
        answer:
          'The constraint needs a method per query, the error messages get unreadable, and you cannot specialise one type. This is why people advise against it.',
      },
    ],
    refs: [
      { label: 'Tutorial: generics', href: 'https://go.dev/doc/tutorial/generics' },
      { label: 'Standard library index', href: 'https://pkg.go.dev/std' },
    ],
  },

  {
    slug: 'standard-library',
    title: 'The standard library',
    navTitle: 'The standard library',
    oneLine: 'Knowing what is already written is worth more than being able to write it.',
    blocks: [
      {
        heading: 'The standard library you should actually know',
        table: {
          headers: ['Package', 'What you use it for'],
          rows: [
            ['`strings`, `strconv`', 'text handling and number parsing'],
            ['`time`', 'durations, deadlines, formatting — read the docs once, properly'],
            ['`slices`, `maps`, `cmp`', 'sorting, searching, and containment without loops'],
            ['`errors`, `fmt`', '`Is`, `As`, `Join`, and `%w` wrapping'],
            ['`encoding/json`', 'the whole API surface for your web service'],
            ['`net/http`', 'server **and** client — see Web services'],
            ['`database/sql`', 'the database interface — see Databases'],
            ['`context`', 'cancellation, everywhere'],
            ['`log/slog`', 'structured logging, stdlib since 1.21'],
            ['`os`, `io`, `bufio`', 'files, readers, writers'],
            ['`sync`, `sync/atomic`', 'mutexes, once, waitgroups, counters'],
            ['`testing`', 'tests, benchmarks, fuzzing'],
            ['`crypto/rand`', 'tokens and IDs. Never `math/rand` for anything security-related.'],
          ],
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'The honest rule: write the concrete version. Write it again for the second type. When you find yourself writing it a third time, then generalise. And check the stdlib first — `slices.Sort`, `slices.Contains`, `maps.Keys`, `cmp.Or` already cover most of what people hand-roll.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"cmp"
	"fmt"
	"maps"
	"slices"
	"strings"
)

type User struct {
	Name string
	Age  int
}

func main() {
	xs := []int{5, 2, 9, 1}
	slices.Sort(xs)
	fmt.Println(xs, slices.Contains(xs, 9), slices.Index(xs, 5), slices.Max(xs))

	users := []User{{"Zoe", 30}, {"Adam", 25}}
	slices.SortFunc(users, func(a, b User) int { return cmp.Compare(a.Name, b.Name) })
	fmt.Println(users)

	m := map[string]int{"b": 2, "a": 1, "c": 3}
	keys := slices.Sorted(maps.Keys(m)) // maps have no order, so sort them
	fmt.Println(keys)

	fmt.Println(strings.Fields("  spread   out  words "))
	before, after, _ := strings.Cut("Bearer abc123", " ")
	fmt.Println(before, "|", after)
	fmt.Println(strings.EqualFold("Go", "GO"))
}
`,
          canRun: true,
          note: 'The helpers that replace most hand-written loops. Reach for these first.',
        },
      },
    ],
    keyPoints: [
      '`slices`, `maps` and `cmp` replace most hand-written loops since Go 1.21.',
      '`crypto/rand` for anything security-related. `math/rand` is predictable.',
      '`go doc` reads the whole library offline, source included.',
      'The stdlib source is some of the best Go written. Read it when you are curious.',
    ],
    remember:
      'Check the standard library before you write a helper. It is usually already there.',
    task: 'Replace a hand-written sort and a hand-written contains check with `slices.SortFunc` and `slices.Contains`.',
    exercises: [
      {
        task: 'Run `go doc net/http.ServeMux` and `go doc -src errors.Is`.',
        answer:
          'The full documentation, offline. `-src` prints the actual implementation — the standard library is right there on your disk.',
      },
      {
        task: 'Find three functions in `strings` you did not know existed.',
        answer:
          'Most people miss `Cut`, `EqualFold` and `Fields`. All three replace code people hand-write badly.',
      },
      {
        task: 'Read the source of `errors.Is` and work out how it walks the chain.',
        answer:
          'It loops, calling `Unwrap` until there is nothing left, comparing at each step. That is the whole mechanism — about twenty lines.',
      },
    ],
    refs: [
      { label: 'Tutorial: generics', href: 'https://go.dev/doc/tutorial/generics' },
      { label: 'Standard library index', href: 'https://pkg.go.dev/std' },
    ],
  },
]
