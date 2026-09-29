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
          'A goroutine is managed by the Go runtime, not the operating system. It starts with a small stack (2KB minimum) that grows as needed, and creating one takes well under a microsecond. An OS thread reserves a fixed stack of a megabyte or more (8MB by default on Linux) and needs a system call to create. That is why a Go server can run a hundred thousand goroutines, where a hundred thousand OS threads would strain the machine.',
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
          'Go multiplexes many goroutines onto a few OS threads. When a goroutine blocks — on a channel, a mutex, a network read, a `time.Sleep` — the runtime parks it and runs another one on that thread. No thread sits idle waiting.',
          'This is what makes Go servers simple to write. You write plain blocking code that reads like a script, and the runtime turns it into event-loop-style I/O underneath, with no callbacks and no `async`/`await`.',
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
          note: 'Call `Add` before `go`, never inside the goroutine. Otherwise `Wait` can run before the count goes up and return immediately. Printing `i` directly is safe since Go 1.22, because each loop iteration gets its own `i`. On older versions all five goroutines shared one variable and could print 5 five times.',
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
      '`go f()` starts a goroutine. It starts with a few KB of stack, so thousands are normal.',
      'The runtime multiplexes them onto a few OS threads and parks them when they block.',
      'You write plain blocking code and the runtime handles the waiting, with no callbacks.',
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
          'Roughly a few hundred megabytes (a few KB each), and it works. With 100,000 OS threads you would typically hit the process thread limit or run short of memory first.',
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
          'A **buffered** channel is a queue. The sender carries on until the buffer is full. Use one when you have a specific reason: a known number of results, or a signal that must never block the sender. A buffer size picked by feel hides backpressure: when the consumer falls behind, the buffer absorbs it, and you only find out later, under load.',
        ],
      },
      {
        heading: 'Channel behaviour, all of it',
        table: {
          headers: ['Operation', 'nil channel', 'open, empty', 'open, full', 'closed'],
          rows: [
            ['send', 'blocks forever', 'proceeds', 'blocks', '**panics**'],
            ['receive', 'blocks forever', 'blocks', 'proceeds', 'buffered values first, then zero value, `ok=false`'],
            ['close', 'panics', '—', '—', '**panics**'],
          ],
        },
      },
      {
        callout: {
          tone: 'warn',
          text: '**The sender closes, never the receiver, and only one goroutine may close.** Closing tells receivers "nothing more is coming", and every receiver sees it, so it works as a broadcast. You do not have to close a channel at all; the garbage collector reclaims unreferenced ones. Close only when receivers need to know it ended.',
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
          note: 'If several cases are ready, `select` picks one at random, so do not rely on case order for priority. With no `default`, it blocks until one becomes ready.',
        },
      },
    ],
    keyPoints: [
      'Unbuffered channels synchronise; buffered ones queue. Default to unbuffered.',
      'The sender closes, never the receiver, and only one goroutine may close.',
      'Sending on a closed channel panics; receiving drains what is left, then gives the zero value and `ok=false`.',
      'A nil channel blocks forever, which is how you disable a `select` case.',
    ],
    remember:
      'Know the channel behaviour table cold. Most channel deadlocks and panics are a row in it.',
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
          'Both return the zero value with `ok == false`, immediately. A receive on a closed channel never blocks.',
      },
      {
        task: 'Write a `select` with a `time.After` timeout and make it fire.',
        answer:
          'The timeout case fires. This works for any channel operation. For work that takes a `context.Context`, a context deadline is the more common tool.',
      },
      {
        task: 'Set a channel variable to `nil` inside a select loop and watch that case switch off.',
        answer:
          'That case stops being chosen: a nil channel is never ready, so `select` skips it. Use this to retire one input of a loop, for example after that input channel has been closed.',
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
          '**Never copy a struct containing a mutex.** Use pointer receivers. `go vet` catches most copies for you.',
          '**Never make a network or database call while holding a lock.** Lock, take what you need, unlock, then do the slow thing.',
          '**A mutex is not reentrant.** Locking it twice in the same goroutine blocks that goroutine forever.',
          '`RWMutex` only wins when there are far more reads than writes and the critical section is non-trivial. Otherwise a plain `Mutex` is faster.',
        ],
      },
      {
        heading: 'A data race is undefined behaviour, not a rare bug',
        body: [
          'If two goroutines touch the same memory, at least one writes, and there is no synchronisation between them, you have a data race. The Go memory model gives you no guarantee about what the program then does. The compiler and the CPU are both free to reorder, and one goroutine may never see the other’s write at all.',
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
        heading: 'Run the race detector',
        code: {
          label: 'terminal',
          src: `go test -race ./...
go run -race ./cmd/api`,
          note: 'Run your whole test suite with -race in CI. It only reports races that happen during the run, so your tests must exercise the concurrent paths. Expect the run to be several times slower and use more memory.',
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Maps get extra help. The runtime checks for concurrent map access on a best-effort basis, and when it catches one it crashes the process with `fatal error: concurrent map writes` (or `concurrent map read and map write`). It is a fatal error, so `recover` cannot catch it. The check does not catch every race, so still run `-race`.',
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
          note: 'A counter guarded by a mutex, and a context deadline. Delete the `Lock`/`Unlock` lines and run it with `-race` locally to see the report.',
        },
      },
    ],
    keyPoints: [
      'Mutex for guarding state, channels for transferring ownership. Do not force channels.',
      'Never copy a struct containing a mutex, and never hold a lock across a network call.',
      'A data race is undefined behaviour, not a rare bug.',
      '`go test -race ./...` in CI. It finds races that code review and ordinary tests miss.',
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
          '`go vet` reports `passes lock by value` (or `assignment copies lock value`). The copy has its own lock, so it guards nothing the original guards.',
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
          '`context.Context` is how a Go program says "stop, nobody needs this any more". In a typical service it is the first parameter of every function that does I/O: database queries, HTTP calls, RPCs.',
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
        heading: 'The context rules',
        bullets: [
          '**First parameter, always, named `ctx`.**',
          '**Never store a Context in a struct.** It belongs to one call, not to an object.',
          '**Always call `cancel`.** `defer cancel()` on the line after you create it.',
          '**Cancelling does not stop anything by itself.** It closes `ctx.Done()`, and your code has to check that. Anything that blocks should `select` on it.',
          '`context.Value` is for request-scoped data crossing API boundaries, such as a request ID or a user ID. **Not** for dependencies or config. If the function needs it to work, it is a parameter.',
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
      'Always `defer cancel()`, even on the success path.',
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
          '`go vet` catches the common shape (`lostcancel`). The leak is the context and its timer, which stay alive until the deadline fires or the parent is cancelled.',
      },
      {
        task: 'Store a request id in a context with an unexported key type, and read it back.',
        answer:
          'It works, and no other package can read or overwrite it because they cannot name your key type.',
      },
      {
        task: 'Write a loop that ignores `ctx.Done()` and prove cancellation does nothing.',
        answer:
          'It runs to completion after cancellation. Cancelling only closes a channel; your code has to check it.',
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
    oneLine: 'Write one function for many types, and know when an interface is the better answer.',
    blocks: [
      {
        heading: 'What generics are for',
        body: [
          'Suppose you write a function that finds the largest number in a slice of `int`. Then you need one for `float64`. Then one for your own `Cents` type. The logic is identical each time, but Go\'s type checking will not let you pass a `[]float64` where a `[]int` is expected, so you end up with three near-identical copies.',
          '**Generics** let you write it once, with the type left as a blank to be filled in at the call site. The blank is called a **type parameter**, and a **constraint** says which types are allowed to fill it.',
          'The next topic is the standard library: the packages that ship with Go. Much of what you might write generically is already there.',
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
          '**Use generics for** containers (a typed cache, set, or queue) and functions over any slice or map. The `slices` and `maps` packages in the stdlib are built this way.',
          '**Use an interface when** the thing you care about is what a type *does*. `Shape` is an interface, not a generic.',
          '**Be wary of a generic `Repository[T]` for your data layer.** It looks clever, but the constraints grow a method per query, the error messages get hard to read, and one entity that needs a different query breaks the shared shape.',
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
          note: 'One function, several types, and the stdlib helpers that already exist (`max` is a builtin since Go 1.21).',
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
          'It works on strings too, comparing byte by byte. `cmp.Ordered` covers every type `<` works on: integers, floats and strings, including named types built on them.',
      },
      {
        task: 'Try to write a generic `Repository[T]` and see how quickly the constraints get ugly.',
        answer:
          'The constraint needs a method per query, the error messages get hard to read, and one type that needs special handling breaks the shared shape. Plain concrete repositories are usually simpler.',
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
    oneLine: 'The packages that already do what you were about to write.',
    blocks: [
      {
        heading: 'The packages you will use most',
        table: {
          headers: ['Package', 'What you use it for'],
          rows: [
            ['`strings`, `strconv`', 'text handling and number parsing'],
            ['`time`', 'durations, deadlines, formatting. Read the docs once, properly: the layout string is `2006-01-02`'],
            ['`slices`, `maps`, `cmp`', 'sorting, searching, and containment without loops'],
            ['`errors`, `fmt`', '`Is`, `As`, `Join`, and `%w` wrapping'],
            ['`encoding/json`', 'request and response bodies for your web service'],
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
          text: 'A workable rule: write the concrete version. Write it again for the second type. When you find yourself writing it a third time, then generalise. And check the stdlib first. `slices.Sort`, `slices.Contains`, `maps.Keys` and `cmp.Or` cover a lot of what people hand-roll.',
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
      '`slices`, `maps` and `cmp` (Go 1.21+) replace many hand-written loops.',
      '`crypto/rand` for anything security-related. `math/rand` is predictable.',
      '`go doc` reads the whole library offline, source included.',
      'The stdlib source is clear, idiomatic Go. Read it when you are curious.',
    ],
    remember:
      'Check the standard library before you write a helper. It is usually already there.',
    task: 'Replace a hand-written sort and a hand-written contains check with `slices.SortFunc` and `slices.Contains`.',
    exercises: [
      {
        task: 'Run `go doc net/http.ServeMux` and `go doc -src errors.Is`.',
        answer:
          'The full documentation, offline. `-src` prints the implementation, because the standard library source is on your disk.',
      },
      {
        task: 'Find three functions in `strings` you did not know existed.',
        answer:
          '`Cut`, `EqualFold` and `Fields` are easy to miss. Each replaces a few lines of index arithmetic or loops that are easy to get wrong.',
      },
      {
        task: 'Read the source of `errors.Is` and work out how it walks the chain.',
        answer:
          'At each step it compares with `==`, and calls the error\'s own `Is` method if it has one. Then it calls `Unwrap` and repeats until nothing is left. Since Go 1.20 it also follows `Unwrap() []error`, which is how it searches every error inside `errors.Join`. The whole thing is a few dozen lines.',
      },
    ],
    refs: [
      { label: 'Tutorial: generics', href: 'https://go.dev/doc/tutorial/generics' },
      { label: 'Standard library index', href: 'https://pkg.go.dev/std' },
    ],
  },
]
