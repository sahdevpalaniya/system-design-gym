import type { LangLesson } from '@/lib/types'

/** "X vs Y" pages: the comparisons people search for, each linking back to the main lessons. */
export const COMPARE: LangLesson[] = [
  {
    slug: 'goroutines-vs-threads',
    searchTitle: 'Goroutine vs Thread: OS Threads, Coroutines, Virtual Threads',
    metaDescription:
      'How goroutines differ from OS threads, Java virtual threads, coroutines and async/await: stack size, GMP scheduling, cost to create, and what interviews ask.',
    title: 'Goroutines vs threads: OS threads, coroutines and virtual threads compared',
    navTitle: 'Goroutines vs threads',
    oneLine: 'Why Go can run a hundred thousand goroutines when the same number of OS threads would sink your machine, and how that compares with coroutines and Java virtual threads.',
    objectives: [
      'Explain the 8 differences between a goroutine and an OS thread in an interview.',
      'Describe how the Go scheduler runs many goroutines on a few threads, and how it preempts them.',
      'Compare goroutines with coroutines, Java virtual threads and async/await in one sentence each.',
      'Run a program that starts 100,000 goroutines and prints the result.',
    ],
    blocks: [
      {
        body: [
          'A **goroutine** is a function run concurrently by the Go runtime. An **OS thread** is run by the operating system kernel. Go runs many goroutines on a few threads. Here is the whole comparison in one table. Each row is explained below.',
        ],
        table: {
          headers: ['', 'Goroutine', 'OS thread'],
          rows: [
            ['Managed by', 'Go runtime (user space)', 'Operating system kernel'],
            ['Starting stack', 'Small (2 KB), grows and shrinks as needed', 'Fixed, usually 1–8 MB reserved'],
            ['Cost to create', 'Very cheap, no system call', 'Expensive, needs a system call'],
            ['Switching cost', 'Cheap, done by the Go scheduler', 'Costlier, done by the kernel'],
            ['Scheduling', 'Go scheduler, M:N (many goroutines on N threads), preemptive since Go 1.14', 'Kernel scheduler, preemptive'],
            ['How many you can run', 'Hundreds of thousands is normal', 'Usually thousands before memory hurts'],
            ['Identity', 'No ID you can get at; on purpose', 'Has a thread ID'],
            ['Usual way to talk', 'Channels (or a mutex when simpler)', 'Shared memory plus locks'],
          ],
        },
      },
      {
        heading: 'What is the difference between a goroutine and a thread?',
        body: [
          'A thread is scheduled by the operating system and costs megabytes of reserved stack. A goroutine is scheduled by the Go runtime, starts with a 2 KB stack, and many goroutines share a few threads. So goroutines are far cheaper to create and switch.',
          'You still get real parallelism: the runtime uses as many threads for Go code as `GOMAXPROCS` says (by default, the number of CPU cores). The basics are in the **Goroutines** lesson ([Goroutines](/languages/go/goroutines)).',
        ],
      },
      {
        heading: 'Are goroutines cooperative or preemptive?',
        body: [
          'Preemptive. Since **Go 1.14** the runtime has **asynchronous preemption**: it can stop a goroutine that runs too long (about 10 ms), even a tight loop with no function calls, by sending its thread a signal. Before 1.14 it was mostly cooperative.',
          'Some older articles (including a well-known GeeksforGeeks page) still say goroutines use "cooperative scheduling". That was true of old Go versions, not of any Go you will install today. If an interviewer says it, you can politely mention Go 1.14.',
        ],
        code: {
          label: 'preempt.go',
          src: `package main

import (
	"fmt"
	"runtime"
	"time"
)

func main() {
	runtime.GOMAXPROCS(1) // only one thread runs Go code

	go func() {
		for { // a busy loop that never calls a function or blocks
		}
	}()

	time.Sleep(20 * time.Millisecond)
	// Before Go 1.14 this line could hang forever: the loop never gave up the thread.
	fmt.Println("main still runs: the busy goroutine was preempted")
}
`,
          note: 'With one thread and a loop that never yields, main only gets to print because the runtime preempts the loop.',
        },
      },
      {
        heading: 'Why are goroutines so cheap?',
        body: [
          'Because they start with a tiny stack that grows only when needed, and creating or switching one never asks the kernel. A thread reserves a big stack up front and every switch goes through the kernel. That is why 100,000 goroutines is fine.',
        ],
        code: {
          label: 'many.go',
          src: `package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	var wg sync.WaitGroup
	var total atomic.Int64

	for i := 1; i <= 100_000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			total.Add(int64(i))
		}()
	}
	wg.Wait()

	fmt.Println("goroutines started: 100000")
	fmt.Println("sum of 1..100000 =", total.Load())
}
`,
          note: 'Doing this with 100,000 OS threads would need gigabytes of stack. Here it finishes in a blink.',
        },
      },
      {
        heading: 'How does the Go scheduler work (GMP)?',
        body: [
          'The scheduler matches three things: **G** (goroutines), **M** (OS threads) and **P** (processors, one per `GOMAXPROCS`). Each P has a queue of runnable Gs and runs them on an M. Idle Ps steal work from busy ones.',
          'When a goroutine blocks on a channel, a mutex or the network, the runtime parks it and runs another G on that thread. When it blocks in a system call, the P is handed to another thread so other goroutines keep running.',
        ],
      },
      {
        heading: 'Why does Go not give goroutines an ID?',
        body: [
          'On purpose, so people do not build "thread-local storage" on top of goroutine IDs. In Go you pass what a goroutine needs as arguments, or in a `context.Context` for request-scoped values ([Context](/languages/go/context)).',
        ],
      },
      {
        heading: 'When are threads still the answer?',
        body: [
          'In Go, almost never directly. You write goroutines and let the runtime choose threads. `runtime.LockOSThread` exists for the rare case where a C library or OS API needs the same thread every time, such as some GUI or graphics libraries.',
        ],
      },
      {
        heading: 'Goroutine vs OS thread vs coroutine vs virtual thread',
        body: [
          'Goroutines get compared with three other ideas, and interviewers like to ask about all of them. The short version: goroutines and Java virtual threads are the same design (cheap threads scheduled by a runtime onto a few OS threads), while coroutines and async/await are cooperative and mark every place a task can pause.',
        ],
        table: {
          headers: ['', 'Goroutine (Go)', 'OS thread', 'Java virtual thread (JDK 21+)', 'Coroutine / async (Kotlin, Python, JS)'],
          rows: [
            ['Scheduled by', 'Go runtime', 'OS kernel', 'JVM, onto carrier threads', 'Language runtime or event loop'],
            ['Pausing', 'Preemptive; blocking calls park it', 'Preemptive', 'Parks on blocking calls; no time-slice preemption', 'Cooperative, only at `await` / `suspend` points'],
            ['Runs in parallel', 'Yes, on GOMAXPROCS threads', 'Yes', 'Yes, on the carrier pool', 'Python asyncio and JS: one thread. Kotlin: depends on the dispatcher'],
            ['Stack', 'Own small stack that grows', 'Large fixed stack', 'Own stack, kept on the heap while parked', 'Usually stackless: state saved per suspend point'],
            ['Marked in code', 'No: `go f()`, then ordinary blocking code', 'No', 'No: ordinary blocking Java code', 'Yes: `async`/`await` or `suspend` on every function in the chain'],
            ['Talks through', 'Channels, or `sync`', 'Locks, shared memory', 'Locks, `java.util.concurrent`', 'Futures, channels (Kotlin), queues'],
          ],
        },
      },
      {
        heading: 'Goroutine vs OS thread: the one-line answer',
        body: [
          'An OS thread is the kernel\'s unit of scheduling, with a large fixed stack and a system call to create or switch. A goroutine is the Go runtime\'s unit, with a small growable stack, created and switched in user space, and multiplexed onto OS threads. Every goroutine runs on some OS thread while it is running; it just does not own one.',
        ],
      },
      {
        heading: 'Goroutine vs coroutine: what is the difference?',
        body: [
          'A **coroutine** is a function that can suspend itself and be resumed later. In Python (`async def`) and Kotlin (`suspend fun`), suspension happens only at explicit points, so scheduling is cooperative: a coroutine that runs a long loop without awaiting blocks everything else on its thread. Most of these coroutines are stackless: the compiler turns the function into a state machine and saves only what is live at each suspension point.',
          'A goroutine is not a coroutine in that sense. It has its own stack, it can be preempted anywhere (since Go 1.14), and goroutines run in parallel on several threads. You never mark where a goroutine may pause; a channel receive or a network read simply parks it. The name is a play on "coroutine", which is where the confusion comes from.',
        ],
      },
      {
        heading: 'Goroutine vs Java virtual thread',
        body: [
          'Java 21 made **virtual threads** final (JEP 444). They are the closest thing to goroutines in another mainstream language: cheap threads managed by the JVM and run on a small pool of carrier OS threads, where a blocking call parks the virtual thread and frees the carrier. You write ordinary blocking code and still handle a very large number of concurrent tasks.',
          'The differences are in the details. Virtual threads were added to a language whose libraries assumed expensive threads, so some code paths pin a virtual thread to its carrier: before JDK 24 (JEP 491), blocking inside a `synchronized` block did this, and native calls still do. Virtual threads are also not time-sliced, so a CPU-bound loop keeps its carrier until it blocks, whereas the Go runtime preempts long-running goroutines. Go has had this model since version 1.0, so the whole standard library was written for it.',
        ],
        callout: {
          tone: 'note',
          text: 'If you are coming from Java: a virtual thread maps closely onto a goroutine, an `ExecutorService` with a fixed pool maps onto a [worker pool](/languages/go/worker-pool), and a `BlockingQueue` maps onto a buffered channel.',
        },
      },
      {
        heading: 'Goroutines vs async/await',
        body: [
          'With async/await (JavaScript, C#, Python, Rust), a function that waits has to be marked `async`, and so does every function that awaits it. That split is often called function colouring: you end up with two kinds of function that do not mix freely. The upside is that every point where your code can pause is visible.',
          'Go has no colours. A function that reads from the network looks exactly like one that adds two numbers. When it blocks, the runtime parks the goroutine and uses its network poller to resume it when data arrives, which is what an event loop does, hidden behind blocking calls. The cost is that pause points are not visible in the code, so shared state needs a mutex or a channel even where an async language would have kept it on one thread.',
        ],
      },
    ],
    keyPoints: [
      'Goroutines are run by the Go runtime; threads by the OS.',
      'Java virtual threads are the same idea; coroutines and async/await are cooperative and marked in the code.',
      'Goroutines start at 2 KB of stack and grow; threads reserve megabytes.',
      'The scheduler runs many goroutines on GOMAXPROCS threads (M:N, the GMP model).',
      'Goroutines are preemptive since Go 1.14, even in tight loops. "Cooperative" is outdated.',
      'There is no goroutine ID; pass data in arguments or a context.',
    ],
    remember: 'Goroutines are cheap, runtime-scheduled, preemptive (since Go 1.14) and run on a few OS threads.',
    exercises: [
      {
        task: 'Run `preempt.go` with `runtime.GOMAXPROCS(1)`. Why does main still print?',
        answer: 'Because since Go 1.14 the runtime preempts the busy loop with a signal, so main gets the thread back after its sleep.',
      },
      {
        task: 'Change `many.go` to print `runtime.NumGoroutine()` just before `wg.Wait()`. Why does the number change from run to run?',
        answer: 'Some goroutines have already finished by then. The number is how many are still alive at that instant, so it depends on timing.',
      },
      {
        task: 'In one sentence each, name three things that make a goroutine cheaper than a thread.',
        answer: 'Small growable stack; created without a system call; switched by the Go scheduler in user space instead of the kernel.',
      },
    ],
    refs: [
      { label: 'Go 1.14 release notes: asynchronous preemption', href: 'https://go.dev/doc/go1.14#runtime' },
      { label: 'Go FAQ: why goroutines instead of threads?', href: 'https://go.dev/doc/faq#goroutines' },
      { label: 'Effective Go: goroutines', href: 'https://go.dev/doc/effective_go#goroutines' },
      { label: 'JEP 444: Virtual Threads (Java 21)', href: 'https://openjdk.org/jeps/444' },
      { label: 'JEP 491: Synchronize Virtual Threads without Pinning (JDK 24)', href: 'https://openjdk.org/jeps/491' },
    ],
  },

  {
    slug: 'mutex-vs-channel',
    searchTitle: 'Mutex vs channel in Go: when to use which',
    title: 'Mutex vs channel in Go: when to use which',
    navTitle: 'Mutex vs channel',
    oneLine: 'Both make concurrent code safe. The Go team’s own advice is to use whichever is simpler.',
    objectives: [
      'Choose a mutex or a channel for a given problem and say why in one line.',
      'Write the same safe counter both ways.',
      'Quote the Go wiki guidance on mutexes versus channels.',
    ],
    blocks: [
      {
        body: [
          'A **mutex** protects shared data so only one goroutine touches it at a time. A **channel** moves data from one goroutine to another. The Go wiki page "Use a sync.Mutex or a channel?" says: **use whichever is most expressive and/or most simple.**',
        ],
        table: {
          headers: ['', 'sync.Mutex', 'Channel'],
          rows: [
            ['What it does', 'Lets one goroutine at a time use shared data', 'Hands a value from one goroutine to another'],
            ['Best for', 'Caches, counters, state inside a struct', 'Passing ownership of data, handing out work, sending results'],
            ['Think of it as', 'A lock on a door', 'A pipe between workers'],
            ['Typical code', '`mu.Lock(); defer mu.Unlock()`', '`ch <- v` and `v := <-ch`'],
            ['Common mistake', 'Forgetting to unlock, copying a mutex', 'Using channels for simple state; leaking blocked goroutines'],
            ['Speed', 'Faster for a short critical section', 'Some overhead per send; fine for most work'],
          ],
        },
      },
      {
        heading: 'Should I use a mutex or a channel in Go?',
        body: [
          'Use a channel when you are passing data or work between goroutines. Use a mutex when several goroutines share some state, like a map or a counter. If both work, pick the one with less code. That is the Go wiki’s advice.',
          'The wiki adds: "A common Go newbie mistake is to over-use channels and goroutines just because it’s possible, and/or because it’s fun." A mutex is not un-Go-like.',
        ],
      },
      {
        heading: 'What does "share memory by communicating" mean?',
        body: [
          'It means: instead of many goroutines locking the same variable, let one goroutine own the data and have others send it messages. It is a Go proverb, a design idea, not a rule that bans mutexes.',
        ],
      },
      {
        heading: 'How do you write a safe counter both ways?',
        body: [
          'With a mutex, each goroutine locks, adds, unlocks. With a channel, one goroutine owns the count and the others send it "+1" messages. Both print 1000. The mutex version is shorter, so for a counter it wins.',
        ],
        code: {
          label: 'counter.go',
          src: `package main

import (
	"fmt"
	"sync"
)

// Mutex: shared state, locked around each change.
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
	var wg sync.WaitGroup

	var c Counter
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			c.Inc()
		}()
	}
	wg.Wait()
	fmt.Println("mutex counter:", c.n)

	// Channel: one goroutine owns the count; others send it messages.
	incs := make(chan struct{})
	done := make(chan int)
	go func() {
		n := 0
		for range incs {
			n++
		}
		done <- n
	}()
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			incs <- struct{}{}
		}()
	}
	wg.Wait()
	close(incs)
	fmt.Println("channel counter:", <-done)
}
`,
        },
      },
      {
        heading: 'When is a channel clearly better?',
        body: [
          'When the problem is about flow: a worker pool handing out jobs, a pipeline of stages, waiting for the first of several results, or a timeout with `select`. Doing those with a mutex means writing your own queue and signalling. See [Channels and select](/languages/go/channels-and-select) and [Concurrency patterns](/languages/go/concurrency-patterns).',
        ],
      },
      {
        heading: 'When is a mutex clearly better?',
        body: [
          'When goroutines read and update the same state in place: a cache, a map of sessions, a struct’s fields. Use `sync.RWMutex` if reads far outnumber writes; [Mutex vs RWMutex](/languages/go/mutex-vs-rwmutex) shows when that actually helps. See [Mutexes and races](/languages/go/mutex-and-races).',
        ],
        callout: {
          tone: 'warn',
          text: 'Whichever you choose, run your tests with `go test -race`. The race detector finds the bugs both tools are meant to prevent.',
        },
      },
    ],
    keyPoints: [
      'Mutex: guard shared state. Channel: move data or work between goroutines.',
      'Go wiki: use whichever is most expressive and/or most simple.',
      'Over-using channels is a known beginner mistake.',
      '"Share memory by communicating" is a design idea, not a ban on mutexes.',
      'Always test concurrent code with `-race`.',
    ],
    remember: 'State → mutex. Flow of data or work → channel. If both fit, pick the simpler one.',
    exercises: [
      {
        task: 'You keep a map of logged-in users that many HTTP handlers read and a few update. Mutex or channel?',
        answer: 'A `sync.RWMutex` around the map. It is shared state, read far more often than written.',
      },
      {
        task: 'You have 1,000 image files to resize using 8 workers. Mutex or channel?',
        answer: 'A channel of jobs that the 8 worker goroutines range over. It is a flow of work.',
      },
      {
        task: 'Remove the mutex from `counter.go` and run with `go run -race`. What happens?',
        answer: 'The race detector reports a DATA RACE on `c.n`, and the count can be less than 1000.',
      },
    ],
    refs: [
      { label: 'Go wiki: Use a sync.Mutex or a channel?', href: 'https://go.dev/wiki/MutexOrChannel' },
      { label: 'Go blog: Share memory by communicating', href: 'https://go.dev/blog/codelab-share' },
      { label: 'sync package', href: 'https://pkg.go.dev/sync' },
    ],
  },

  {
    slug: 'arrays-vs-slices',
    searchTitle: 'Arrays vs slices in Go (Golang), with examples',
    title: 'Arrays vs slices in Go: the differences, with examples',
    navTitle: 'Arrays vs slices',
    oneLine: 'An array is a fixed box of values. A slice is a window onto one. You will use slices 99% of the time.',
    objectives: [
      'List the differences between an array and a slice in Go.',
      'Predict when changing one slice changes another.',
      'Say when an array is the better choice.',
    ],
    blocks: [
      {
        body: [
          'An **array** has a fixed length that is part of its type: `[3]int`. A **slice** is a small header (pointer, length, capacity) that looks at part of an array: `[]int`. Here is the difference at a glance.',
        ],
        table: {
          headers: ['', 'Array `[3]int`', 'Slice `[]int`'],
          rows: [
            ['Length', 'Fixed, part of the type', 'Can grow with `append`'],
            ['Passed to a function', 'Whole array is copied', 'Only the header is copied; data is shared'],
            ['Zero value', 'All elements zero', '`nil` (length 0)'],
            ['Compare with `==`', 'Yes', 'No (only with `nil`)'],
            ['Use as a map key', 'Yes', 'No'],
            ['`len` / `cap`', 'Both equal the fixed length', 'Can differ'],
            ['How often you use it', 'Rarely', 'All the time'],
          ],
        },
      },
      {
        heading: 'What is the difference between an array and a slice in Go?',
        body: [
          'An array’s length is fixed and part of its type, and assigning or passing it copies every element. A slice is a view over an array that can grow, and copying a slice shares the same elements. Full details are in [Arrays and slices](/languages/go/arrays-and-slices).',
        ],
        code: {
          label: 'copy-vs-share.go',
          src: `package main

import "fmt"

func setFirstArray(a [3]int) { a[0] = 99 } // gets a copy
func setFirstSlice(s []int)  { s[0] = 99 } // shares the data

func main() {
	arr := [3]int{1, 2, 3}
	sl := []int{1, 2, 3}

	setFirstArray(arr)
	setFirstSlice(sl)

	fmt.Println("array after call:", arr) // unchanged
	fmt.Println("slice after call:", sl)  // changed

	b := arr // copies the array
	b[1] = 0
	fmt.Println("arr == [3]int{1, 2, 3}:", arr == [3]int{1, 2, 3})

	t := sl // copies only the header
	t[1] = 0
	fmt.Println("sl after t[1] = 0:", sl)
}
`,
        },
      },
      {
        heading: 'Is a slice passed by reference in Go?',
        body: [
          'No. Go passes everything by value, slices too. But a slice value is a header holding a pointer, so the copy points at the same elements. Changing `s[i]` is seen by the caller; `append` that grows the slice is not, unless you return it.',
        ],
      },
      {
        heading: 'What are len and cap of a slice?',
        body: [
          '`len` is how many elements you can index now. `cap` is how many fit in the backing array before `append` must allocate a new, bigger one. When that happens the slice moves to new memory and stops sharing with the old one.',
        ],
        code: {
          label: 'len-cap.go',
          src: `package main

import "fmt"

func main() {
	a := []int{1, 2, 3, 4}
	b := a[:2]
	fmt.Println(len(b), cap(b)) // 2 4: room left in a's array

	b = append(b, 9) // fits, so it writes into a's array
	fmt.Println("a:", a)

	c := a[:2:2]     // capacity capped at 2
	c = append(c, 7) // no room: copies to a new array
	fmt.Println("a:", a, "c:", c)
}
`,
          note: 'The first append overwrote a[2]. The capped one did not. This is the trap interviewers love.',
        },
      },
      {
        heading: 'When should you use an array instead of a slice?',
        body: [
          'When the size is fixed and meaningful, and you want copying or comparison: a SHA-256 hash (`[32]byte`), an RGB colour (`[3]uint8`), or a map key like `[2]int` for grid coordinates. Everywhere else, use a slice.',
        ],
      },
    ],
    keyPoints: [
      'Array: fixed length, part of the type, copied on assign and pass.',
      'Slice: pointer + len + cap over an array; copies share elements.',
      'Arrays can be compared and used as map keys; slices cannot.',
      '`append` may move a slice to a new array; always write `s = append(s, x)`.',
      'Use `s[a:b:b]` to stop append overwriting the original.',
    ],
    remember: 'Arrays are values with a fixed size. Slices are views that share memory. Use slices unless the size is truly fixed.',
    exercises: [
      {
        task: 'What does `fmt.Println([2]int{1, 2} == [2]int{1, 2})` print? What about the same with slices?',
        answer: '`true`. With slices it does not compile: slices can only be compared with `nil`.',
      },
      {
        task: 'Write a function that appends to a slice and make the caller see the new element.',
        answer: 'Return the slice: `func add(s []int, x int) []int { return append(s, x) }` and call `s = add(s, 5)`.',
      },
      {
        task: 'Use `map[[2]int]bool` to mark visited cells (0,0) and (1,2) in a grid, then print whether (1,2) was visited.',
        answer: '`seen := map[[2]int]bool{}; seen[[2]int{0, 0}] = true; seen[[2]int{1, 2}] = true; fmt.Println(seen[[2]int{1, 2}])` prints `true`.',
      },
    ],
    refs: [
      { label: 'Go blog: Arrays, slices (and strings)', href: 'https://go.dev/blog/slices' },
      { label: 'Go blog: Slices usage and internals', href: 'https://go.dev/blog/slices-intro' },
      { label: 'Go spec: slice types', href: 'https://go.dev/ref/spec#Slice_types' },
    ],
  },

  {
    slug: 'buffered-vs-unbuffered-channels',
    searchTitle: 'Buffered vs unbuffered channels in Go',
    title: 'Buffered vs unbuffered channels in Go',
    navTitle: 'Buffered vs unbuffered',
    oneLine: 'An unbuffered channel is a handshake. A buffered channel is a small queue.',
    objectives: [
      'Explain when a send blocks on a buffered and an unbuffered channel.',
      'Fix a deadlock caused by sending on an unbuffered channel with no receiver.',
      'Use a buffered channel as a semaphore to limit concurrency.',
    ],
    blocks: [
      {
        body: [
          '`make(chan int)` is **unbuffered**: a send waits until someone receives. `make(chan int, 3)` is **buffered**: up to 3 sends go through without a receiver. Here is how they differ.',
        ],
        table: {
          headers: ['', 'Unbuffered `make(chan T)`', 'Buffered `make(chan T, n)`'],
          rows: [
            ['Send blocks when', 'No receiver is ready', 'The buffer is full'],
            ['Receive blocks when', 'No sender is ready', 'The buffer is empty'],
            ['Guarantee', 'Sender knows the value was received', 'Sender only knows it was queued'],
            ['`cap(ch)`', '0', 'n'],
            ['Good for', 'Handoffs and signals where timing matters', 'Known number of results, semaphores, smoothing short bursts'],
            ['Risk', 'Deadlock if nobody receives', 'Hides a slow consumer until the buffer fills'],
          ],
        },
      },
      {
        heading: 'What is the difference between buffered and unbuffered channels?',
        body: [
          'An unbuffered channel makes sender and receiver meet: the send finishes only when the value is taken. A buffered channel has room for n values, so sends finish immediately until it is full. Unbuffered gives you synchronisation; buffered gives you slack.',
          'The full channel rules (nil, closed, buffered) are in [Channels and select](/languages/go/channels-and-select).',
        ],
        code: {
          label: 'both.go',
          src: `package main

import "fmt"

func main() {
	// Buffered: two sends succeed with nobody receiving yet.
	b := make(chan string, 2)
	b <- "first"
	b <- "second"
	fmt.Println("buffered len/cap:", len(b), cap(b))
	fmt.Println(<-b, <-b)

	// Unbuffered: the send needs a receiver, so it happens in a goroutine.
	u := make(chan string)
	go func() { u <- "handed over" }()
	fmt.Println("unbuffered cap:", cap(u), "got:", <-u)
}
`,
        },
      },
      {
        heading: 'Why does sending on an unbuffered channel deadlock?',
        body: [
          'Because the send waits for a receiver, and if the only goroutine is the one sending, nobody ever receives. Go detects this and stops with "fatal error: all goroutines are asleep - deadlock!". Receive in another goroutine, or add a buffer if that fits the design.',
        ],
        code: {
          label: 'deadlock.go',
          src: `ch := make(chan int)
ch <- 1 // blocks forever: main is the only goroutine, and it is stuck here
fmt.Println(<-ch)`,
          note: 'Do not "fix" every deadlock with a buffer. Usually the bug is that the receiver is missing.',
        },
      },
      {
        heading: 'What buffer size should I use?',
        body: [
          'Use 0 (unbuffered) unless you have a specific reason. Good reasons: you know exactly how many values will be sent (size it to that), or you are building a semaphore. A random size like 100 "for speed" usually just hides a slow consumer.',
        ],
      },
      {
        heading: 'How do you limit concurrency with a buffered channel?',
        body: [
          'Make a buffered channel with room for n tokens. Each goroutine puts a token in before working and takes it out after. At most n can work at once, because the n+1th send blocks.',
        ],
        code: {
          label: 'semaphore.go',
          src: `package main

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

func main() {
	sem := make(chan struct{}, 3) // at most 3 at a time
	var running, peak atomic.Int32
	var wg sync.WaitGroup

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}        // take a slot (blocks if 3 are busy)
			defer func() { <-sem }() // give it back

			n := running.Add(1)
			for {
				p := peak.Load()
				if n <= p || peak.CompareAndSwap(p, n) {
					break
				}
			}
			time.Sleep(5 * time.Millisecond)
			running.Add(-1)
		}()
	}
	wg.Wait()
	fmt.Println("most running at once:", peak.Load())
}
`,
        },
      },
    ],
    keyPoints: [
      'Unbuffered: a send waits for a receiver. It is a handshake.',
      'Buffered: sends go through until the buffer is full. It is a queue.',
      'Default to unbuffered; size a buffer only for a known reason.',
      '"all goroutines are asleep - deadlock!" usually means a missing receiver.',
      'A buffered channel of size n is a simple semaphore.',
    ],
    remember: 'Unbuffered = both sides meet. Buffered = sender can run ahead by n values.',
    exercises: [
      {
        task: 'What does `ch := make(chan int, 1); ch <- 1; ch <- 2` do in `main` with no other goroutines?',
        answer: 'The first send fits in the buffer. The second blocks forever, and Go reports "all goroutines are asleep - deadlock!".',
      },
      {
        task: 'Change the semaphore size in `semaphore.go` to 1. What is printed?',
        answer: '`most running at once: 1`. Only one goroutine can hold the slot at a time.',
      },
      {
        task: 'You start 5 goroutines that each send one result. What buffer size lets them all finish even if you read results later?',
        answer: '5. Each send then has a slot, so no goroutine blocks or leaks waiting for a reader.',
      },
    ],
    refs: [
      { label: 'Effective Go: channels', href: 'https://go.dev/doc/effective_go#channels' },
      { label: 'Go spec: channel types', href: 'https://go.dev/ref/spec#Channel_types' },
      { label: 'A Tour of Go: buffered channels', href: 'https://go.dev/tour/concurrency/3' },
    ],
  },

  {
    slug: 'go-vs-java-vs-python-for-placements',
    searchTitle: 'Golang vs Python vs Java for first-job interviews',
    title: 'Go vs Java vs Python for your first job interviews: which should you pick?',
    navTitle: 'Go vs Java vs Python',
    oneLine: 'An honest comparison for campus hiring, new-grad interviews and your first backend job.',
    objectives: [
      'Pick a language for coding rounds based on what your target companies allow.',
      'Name the real strengths and gaps of Go, Java and Python in a DSA round.',
      'Plan how to use Go without hurting your interview chances.',
    ],
    blocks: [
      {
        body: [
          'Short answer: for **coding rounds**, pick the language you are fastest and most correct in, and that the test platform supports. For **backend jobs**, Go is a strong second language. Here is the honest comparison.',
        ],
        table: {
          headers: ['', 'Go', 'Java', 'Python'],
          rows: [
            ['Allowed in online assessments', 'Often, but not on every platform or test', 'Almost always', 'Almost always'],
            ['Code length in DSA', 'Medium', 'Long', 'Short'],
            ['Built-in data structures', 'Slices, maps; heap via `container/heap`; no built-in ordered map or set', 'Rich: TreeMap, PriorityQueue, HashSet, Deque', 'Rich: dict, set, heapq, deque'],
            ['Speed (time limits)', 'Fast', 'Fast', 'Slower; can hit time limits on heavy problems'],
            ['Common in new-grad interviews', 'Less common', 'Very common', 'Common'],
            ['Backend jobs', 'Growing, especially startups, fintech and infra', 'Large, especially enterprise and big product companies', 'Large in data, ML, scripting; also web'],
            ['Learning curve', 'Small language, quick to learn', 'More to learn (OOP, JVM, frameworks)', 'Easiest to start'],
          ],
        },
        callout: {
          tone: 'note',
          text: 'We have not put salary or job-count numbers here, because we could not find reliable ones. Look at the actual job posts of the 10 companies you want; that is the only data that matters for you.',
        },
      },
      {
        heading: 'Is Go good for campus hiring and first-job interviews?',
        body: [
          'Go is fine for coding rounds if the platform allows it, and it is a real plus for backend roles. But Java, C++ and Python are more widely allowed and more familiar to interviewers. So check the platform first, and keep a backup language if you are unsure.',
          'In India, campus placements (companies hiring final-year students on campus) usually start with an online test on platforms like HackerRank. Java, C++ and Python are allowed almost everywhere; Go is not always on the list.',
        ],
      },
      {
        heading: 'Which language is best for DSA in first-job interviews?',
        body: [
          'The one you already write fastest without bugs. If you have none yet: C++ or Java are the safest for online assessments, Python is shortest to write. Go works well but has fewer built-in structures, so practise a heap and an ordered set in Go before a test.',
          'Our [Go for coding rounds](/languages/go/dsa-fast-io) section shows fast input, and the common problems solved in Go.',
        ],
      },
      {
        heading: 'Is Go better than Java for backend?',
        body: [
          'Neither is simply better. Go gives one small binary, fast start-up, simple concurrency and a big standard library. Java gives a huge ecosystem (Spring), mature tooling and many existing jobs. Many teams use both. Learn one well first.',
        ],
      },
      {
        heading: 'Should a new grad learn Go or Java first?',
        body: [
          'If your college and target companies are Java-heavy, start with Java (or C++) for DSA, then add Go for backend projects. If you are aiming at startups or infra roles that list Go, learning Go first is reasonable. A Go project on your resume stands out because fewer new grads have one.',
        ],
      },
      {
        heading: 'What are the gaps when using Go in a coding round?',
        bullets: [
          '**No built-in ordered map or set.** Sort keys yourself, or use a heap. There is no TreeMap.',
          '**Heap needs boilerplate.** `container/heap` needs five methods. Keep a template ready.',
          '**Slow input if you use `fmt.Scan`.** Use `bufio`. See [fast input](/languages/go/dsa-fast-io).',
          '**Unused variables and imports are errors.** Good habit, but it costs seconds when you are rushing.',
          '**Good news:** `slices.Sort`, `slices.BinarySearch`, `min` and `max` (Go 1.21+) remove much of the old boilerplate.',
        ],
      },
      {
        heading: 'How do I use Go without risking my first-job interviews?',
        body: [
          'Do DSA in the language your target tests allow (often Java, C++ or Python). Use Go for one or two real projects: an API with a database and tests, like the projects on this site. In interviews for backend roles, that Go project gives you something concrete to talk about.',
        ],
      },
    ],
    keyPoints: [
      'For coding rounds, pick the language you are fastest in and the platform allows.',
      'Java and C++ are the safest for online assessments; Python is the shortest.',
      'Go is fast and allowed on many platforms, but has fewer built-in structures.',
      'Go is a strong plus for backend, startup and infra roles.',
      'Check real job posts of your target companies; ignore made-up stats.',
    ],
    remember: 'DSA in whatever you are fastest in. Go for backend projects that make your resume stand out.',
    exercises: [
      {
        task: 'List 10 companies you want to apply to. For each, check one job post and the language options in their last online assessment (ask seniors). Count how many allow Go.',
        answer: 'There is no single right answer. If most do not allow Go, do DSA in Java, C++ or Python and use Go for projects.',
      },
      {
        task: 'Write a min-heap of ints in Go using `container/heap`, push 5, 1, 3 and pop all. Time yourself.',
        answer: 'It should print 1 3 5. If it took more than 5 minutes, save it as a template before your next test.',
      },
    ],
    refs: [
      { label: 'Go: Who uses Go (case studies)', href: 'https://go.dev/solutions/case-studies' },
      { label: 'container/heap package', href: 'https://pkg.go.dev/container/heap' },
      { label: 'slices package', href: 'https://pkg.go.dev/slices' },
    ],
  },
]
