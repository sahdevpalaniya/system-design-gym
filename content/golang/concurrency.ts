import type { LangLesson } from '@/lib/types'

/** Channel behaviour. Shared with the interview lesson so the two never drift. */
export const CHANNEL_TABLE = {
  headers: ['Operation', 'nil channel', 'open, unbuffered', 'open, buffered', 'closed'],
  rows: [
    ['send', 'blocks forever', 'blocks until a receiver takes it', 'proceeds if the buffer has room, else blocks', '**panics**'],
    ['receive', 'blocks forever', 'blocks until a sender arrives', 'proceeds if the buffer has a value, else blocks', 'buffered values first, then zero value, `ok=false`'],
    ['close', '**panics**', 'succeeds; waiting receivers wake up, waiting senders panic', 'succeeds; buffered values can still be received', '**panics**'],
  ],
}

/** Goroutines, channels, shared state, and generics. */
export const CONCURRENCY: LangLesson[] = [
  {
    slug: 'goroutines',
    searchTitle: "Goroutines in Golang, with examples and WaitGroup",
    title: 'Goroutines',
    navTitle: 'Goroutines',
    oneLine: 'Start ten thousand concurrent things with one keyword.',
    objectives: [
      'Write a program that starts several goroutines and waits for all of them with `sync.WaitGroup`.',
      'Predict what happens when `main` returns before its goroutines finish.',
      'Fix a WaitGroup bug where `Add` is called inside the goroutine instead of before it.',
    ],
    challenge: {
      prompt:
        'Write `SumChunks(nums, n)`: split `nums` into `n` equal chunks, sum each chunk in its own goroutine, and write the sum into slot `i` of a slice you made before starting them. Use a `sync.WaitGroup` to wait. `len(nums)` is always a multiple of `n`. Example: `SumChunks([1 2 3 4 5 6], 3)` returns `[3 7 11]`.',
      starter: `package main

import "sync"

func SumChunks(nums []int, n int) []int {
	var wg sync.WaitGroup
	wg.Wait()
	return make([]int, n) // TODO: one goroutine per chunk
}
`,
      test: `package main

import (
	"fmt"
	"testing"
)

func TestSumChunks(t *testing.T) {
	cases := []struct {
		nums []int
		n	int
		want []int
	}{
		{[]int{1, 2, 3, 4, 5, 6}, 3, []int{3, 7, 11}},
		{[]int{1, 2, 3, 4, 5, 6}, 2, []int{6, 15}},
		{[]int{5, 5, 5, 5}, 1, []int{20}},
		{[]int{10, -3, 7, 1}, 4, []int{10, -3, 7, 1}},
	}
	for _, c := range cases {
		got := SumChunks(c.nums, c.n)
		if fmt.Sprint(got) != fmt.Sprint(c.want) {
			t.Errorf("SumChunks(%v, %d) = %v, want %v", c.nums, c.n, got, c.want)
		}
	}
}
`,
      solution: `package main

import "sync"

func SumChunks(nums []int, n int) []int {
	out := make([]int, n)
	size := len(nums) / n
	var wg sync.WaitGroup
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for _, v := range nums[i*size : (i+1)*size] {
				out[i] += v // each goroutine writes only its own slot
			}
		}()
	}
	wg.Wait()
	return out
}
`,
    },
    blocks: [
      {
        heading: 'What is a goroutine?',
        body: [
          'A **goroutine** is a function that runs at the same time as the rest of your program. You start one by writing `go` in front of a function call. That is the whole syntax.',
          'They are very cheap. Starting one costs far less than a millisecond and a few kilobytes of memory, so a program can run thousands of them without trouble.',
        ],
        code: {
          label: 'goroutine.go',
          src: `go doSomething()          // returns immediately, doSomething runs at the same time

go func() {
\tfmt.Println("in a goroutine")
}()`,
          run: `package main

import (
\t"fmt"
\t"time"
)

func say(word string) {
\tfor range 3 {
\t\tfmt.Println(word)
\t\ttime.Sleep(10 * time.Millisecond)
\t}
}

func main() {
\tgo say("hello") // runs at the same time as the line below
\tsay("world")
}`,
          note: 'Run it a few times: "hello" and "world" are mixed together because both functions run at once. When `main` returns, the program exits and every goroutine stops with it. Sleeping is only a demo; the WaitGroup below is the proper way to wait.',
        },
      },
      {
        heading: 'How do you wait for goroutines to finish? (WaitGroup)',
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
        heading: 'How do goroutines work underneath? (optional)',
        body: [
          'A goroutine is scheduled by the Go runtime onto a few OS threads, not given a thread of its own. You can skip this on a first read. A goroutine is managed by the Go runtime, not the operating system. It starts with a small stack (2KB minimum) that grows as needed. An OS thread reserves a fixed stack of a megabyte or more (8MB by default on Linux) and needs a system call to create. That is why a Go server can run a hundred thousand goroutines, where a hundred thousand OS threads would strain the machine.',
          'Go runs many goroutines on a few OS threads. When a goroutine blocks — on a channel, a mutex, a network read, a `time.Sleep` — the runtime parks it and runs another one on that thread. No thread sits idle waiting.',
          'For all eight differences side by side (stack size, scheduling, preemption, why there are no goroutine IDs), see [Goroutines vs threads](/languages/go/goroutines-vs-threads).',
          'This is what makes Go servers simple to write. You write plain blocking code that reads like a script, and the runtime handles the waiting for you. There are no callbacks and no `async`/`await`.',
        ],
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
	var wg sync.WaitGroup
	for i := 1; i <= 5; i++ {
		wg.Add(1) // BEFORE the go statement
		go func(n int) {
			defer wg.Done()
			time.Sleep(time.Duration(n) * 10 * time.Millisecond)
			fmt.Printf("worker %d done\\n", n)
		}(i)
	}

	wg.Wait() // main waits here until all five have called Done
	fmt.Println("all workers finished")
}
`,
          canRun: true,
          note: 'Five goroutines and a WaitGroup. Getting values back out of goroutines is the next lesson, Channels and select.',
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
      {
        task: 'Predict the output before you run it: `for i := 0; i < 3; i++ { go fmt.Print(i, " ") }` followed by `time.Sleep(100 * time.Millisecond)`.',
        answer:
          '`0`, `1` and `2`, each exactly once, in no guaranteed order. The arguments of a `go` call are evaluated when the `go` statement runs, so this was safe even before Go 1.22. The order is up to the scheduler, and the sleep is only a demo: real code waits with a WaitGroup.',
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
    objectives: [
      'Write a producer that sends on a channel and closes it, and a consumer that ranges over it.',
      'Explain why an unbuffered send blocks until someone receives.',
      'Write a `select` loop that reads from two channels until both are closed.',
    ],
    challenge: {"prompt":"Write `SumBoth(a, b)`: receive every value from both channels until both are closed, and return the total. The hidden tests use **unbuffered** channels fed by one goroutine that alternates between them, so ranging over `a` and then `b` deadlocks. Use `select`, and set a channel to `nil` once it is closed so `select` stops picking it. Example: b sends 1, a sends 2, a closes, b sends 3, b closes: the result is `6`.","starter":"package main\n\nfunc SumBoth(a, b <-chan int) int {\n\ttotal := 0\n\tfor v := range a { // TODO: this waits for a to close before reading b\n\t\ttotal += v\n\t}\n\tfor v := range b {\n\t\ttotal += v\n\t}\n\treturn total\n}\n","test":"package main\n\nimport (\n\t\"fmt\"\n\t\"testing\"\n\t\"time\"\n)\n\n// feed plays a script on two unbuffered channels: \"a5\" sends 5 on a, \"A\" closes a.\nfunc feed(script []string) (<-chan int, <-chan int) {\n\ta, b := make(chan int), make(chan int)\n\tgo func() {\n\t\tfor _, s := range script {\n\t\t\tvar v int\n\t\t\tswitch s[0] {\n\t\t\tcase 'A':\n\t\t\t\tclose(a)\n\t\t\tcase 'B':\n\t\t\t\tclose(b)\n\t\t\tcase 'a':\n\t\t\t\tfmt.Sscan(s[1:], &v)\n\t\t\t\ta <- v\n\t\t\tcase 'b':\n\t\t\t\tfmt.Sscan(s[1:], &v)\n\t\t\t\tb <- v\n\t\t\t}\n\t\t}\n\t}()\n\treturn a, b\n}\n\nfunc TestSumBoth(t *testing.T) {\n\tcases := []struct {\n\t\tscript []string\n\t\twant   int\n\t}{\n\t\t{[]string{\"b1\", \"a2\", \"b3\", \"a4\", \"A\", \"b5\", \"B\"}, 15},\n\t\t{[]string{\"a10\", \"b-3\", \"a7\", \"B\", \"a1\", \"A\"}, 15},\n\t\t{[]string{\"A\", \"b4\", \"b5\", \"B\"}, 9},\n\t\t{[]string{\"B\", \"A\"}, 0},\n\t\t{[]string{\"b1000000000\", \"a1000000000\", \"B\", \"A\"}, 2000000000},\n\t\t{[]string{\"b2\", \"b2\", \"a3\", \"B\", \"a3\", \"A\"}, 10},\n\t}\n\tfor _, c := range cases {\n\t\ta, b := feed(c.script)\n\t\tgot := make(chan int, 1)\n\t\tgo func() { got <- SumBoth(a, b) }()\n\t\tselect {\n\t\tcase v := <-got:\n\t\t\tif v != c.want {\n\t\t\t\tt.Errorf(\"SumBoth(%v) = %v, want %v\", c.script, v, c.want)\n\t\t\t}\n\t\tcase <-time.After(time.Second):\n\t\t\tt.Errorf(\"SumBoth(%v) = %v, want %v\", c.script, \"stuck after 1s (use select)\", c.want)\n\t\t}\n\t}\n}\n","solution":"package main\n\nfunc SumBoth(a, b <-chan int) int {\n\ttotal := 0\n\tfor a != nil || b != nil {\n\t\tselect {\n\t\tcase v, ok := <-a:\n\t\t\tif !ok {\n\t\t\t\ta = nil // closed: never pick this case again\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\ttotal += v\n\t\tcase v, ok := <-b:\n\t\t\tif !ok {\n\t\t\t\tb = nil\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\ttotal += v\n\t\t}\n\t}\n\treturn total\n}\n"},
    blocks: [
      {
        heading: 'What problem does a channel solve?',
        body: [
          'A channel lets goroutines hand each other values safely, and tells the receiver exactly when a value is ready. Goroutines run at the same time, so they need a safe way to hand each other results. Writing to a shared variable is a data race unless you add a lock, and even then the reader does not know *when* the value is ready.',
          'A channel fixes both. One goroutine sends a value, another receives it, and the receive waits until the value is there. The handoff is the synchronisation: everything the sender did before the send is visible to the receiver after the receive.',
          'Choosing a buffer size? See [Buffered vs unbuffered channels](/languages/go/buffered-vs-unbuffered-channels). Not sure a channel is the right tool at all? See [Mutex vs channel](/languages/go/mutex-vs-channel).',
        ],
      },
      {
        heading: 'Channels: a typed pipe between goroutines',
        code: {
          label: 'channels.go',
          src: `jobs := make(chan int)      // unbuffered: a send waits for a receiver
queue := make(chan int, 5)  // buffered: holds 5 before a send blocks

queue <- 42                 // send (fine here: the buffer has room)
v := <-queue                // receive

close(queue)                // "no more values are coming"
for v := range queue { }    // receives until the channel is closed and empty
v, ok := <-queue            // ok is false once closed and drained`,
          note: '`jobs <- 42` on its own would block forever, because nobody is receiving yet. An unbuffered send needs a receiver in another goroutine.',
          run: `package main

import "fmt"

func main() {
	ch := make(chan string) // unbuffered

	go func() {
		fmt.Println("worker: sending")
		ch <- "result" // waits here until main is ready to receive
		fmt.Println("worker: handed off")
	}()

	msg := <-ch // waits here until the worker sends
	fmt.Println("main: got", msg)

	queue := make(chan int, 3) // buffered: three sends need no receiver
	queue <- 1
	queue <- 2
	queue <- 3
	close(queue) // the sender says "no more"
	for v := range queue {
		fmt.Println("from queue:", v)
	}
}
`,
        },
      },
      {
        heading: 'What is the difference between unbuffered and buffered channels?',
        body: [
          'An unbuffered channel makes the sender wait for a receiver; a buffered channel lets the sender continue until the buffer is full. An **unbuffered** channel is a rendezvous. The sender blocks until a receiver takes the value, so both goroutines know the handoff happened. That synchronisation is often the point, not a cost.',
          'A **buffered** channel is a queue. The sender carries on until the buffer is full. Use one when you have a specific reason: a known number of results, or a signal that must never block the sender. A buffer size picked by feel hides backpressure: when the consumer falls behind, the buffer absorbs it, and you only find out later, under load.',
        ],
      },
      {
        heading: 'Channel behaviour, all of it',
        table: CHANNEL_TABLE,
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
          run: `package main

import (
	"fmt"
	"time"
)

func main() {
	fast := make(chan string)
	slow := make(chan string)

	go func() { time.Sleep(10 * time.Millisecond); fast <- "fast answer" }()
	go func() { time.Sleep(500 * time.Millisecond); slow <- "slow answer" }()

	// first: whichever is ready first wins
	select {
	case v := <-fast:
		fmt.Println("got", v)
	case v := <-slow:
		fmt.Println("got", v)
	}

	// second: give up waiting on slow after 50ms
	select {
	case v := <-slow:
		fmt.Println("got", v)
	case <-time.After(50 * time.Millisecond):
		fmt.Println("timed out waiting for slow")
	}
}
`,
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
      {
        task: 'Predict the output: in `main`, `ch := make(chan int)`, then `ch <- 1`, then `fmt.Println(<-ch)`. Then change it to `make(chan int, 1)` and predict again.',
        answer:
          'The first version prints nothing and crashes with `fatal error: all goroutines are asleep - deadlock!`. The send blocks waiting for a receiver, and the only goroutine that could receive is the one stuck sending. With a buffer of 1 the send goes into the buffer and it prints `1`.',
      },
      {
        task: 'Predict the output: `var a chan int` (nil), `b := make(chan int, 1)`, `b <- 7`, then `select { case v := <-a: fmt.Println("a", v); case v := <-b: fmt.Println("b", v) }`. Run it ten times.',
        answer:
          '`b 7`, every time. The random choice in `select` is only between cases that are ready, and a nil channel is never ready. With no ready case and no `default` it would block forever instead.',
      },
      {
        task: 'Predict the output: `ch := make(chan int, 2)`, send 1 and 2, `close(ch)`, then do `v, ok := <-ch` three times and print each.',
        answer:
          '`1 true`, `2 true`, `0 false`. Closing does not throw away buffered values; receivers drain them first, then get the zero value and `ok == false`.',
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
    objectives: [
      'Write a struct that guards a map with a `sync.Mutex`.',
      'Explain why a data race is undefined behaviour, not just a wrong number.',
      'Fix a racy counter and prove it with `go test -race`.',
    ],
    challenge: {"prompt":"Write `CountWords(words, work)`: start one goroutine per word. Each goroutine first calls `work(word)` (a slow step, like a network call), then adds 1 to that word's entry in a shared map. Protect the map with a `sync.Mutex` and wait with a `sync.WaitGroup`. The hidden tests pass a `work` that sleeps 30ms, so doing the words one after another is too slow. Example: `CountWords([go is go], work)` returns `map[go:2 is:1]`.","starter":"package main\n\nimport \"sync\"\n\nfunc CountWords(words []string, work func(string)) map[string]int {\n\tvar mu sync.Mutex\n\tcounts := map[string]int{}\n\tfor _, w := range words { // TODO: one goroutine per word, map guarded by mu\n\t\twork(w)\n\t\tmu.Lock()\n\t\tcounts[w]++\n\t\tmu.Unlock()\n\t}\n\treturn counts\n}\n","test":"package main\n\nimport (\n\t\"fmt\"\n\t\"sync/atomic\"\n\t\"testing\"\n\t\"time\"\n)\n\nfunc TestCountWords(t *testing.T) {\n\tcases := []struct {\n\t\twords []string\n\t\twant  map[string]int\n\t}{\n\t\t{[]string{\"go\", \"is\", \"go\"}, map[string]int{\"go\": 2, \"is\": 1}},\n\t\t{[]string{\"a\", \"a\", \"a\", \"a\", \"a\"}, map[string]int{\"a\": 5}},\n\t\t{[]string{}, map[string]int{}},\n\t}\n\tfor _, c := range cases {\n\t\tvar calls atomic.Int32\n\t\tgot := CountWords(c.words, func(string) { calls.Add(1) })\n\t\tif fmt.Sprint(got) != fmt.Sprint(c.want) || int(calls.Load()) != len(c.words) {\n\t\t\tt.Errorf(\"CountWords(%v) = %v with %v work calls, want %v with %v\", c.words, got, calls.Load(), c.want, len(c.words))\n\t\t}\n\t}\n}\n\nfunc TestCountWordsInParallel(t *testing.T) {\n\twords := make([]string, 20)\n\tfor i := range words {\n\t\twords[i] = fmt.Sprint(\"w\", i%4)\n\t}\n\tslow := func(string) { time.Sleep(30 * time.Millisecond) }\n\tstart := time.Now()\n\tgot := CountWords(words, slow)\n\ttook := time.Since(start)\n\twant := map[string]int{\"w0\": 5, \"w1\": 5, \"w2\": 5, \"w3\": 5}\n\tif fmt.Sprint(got) != fmt.Sprint(want) {\n\t\tt.Errorf(\"CountWords(20 words) = %v, want %v\", got, want)\n\t}\n\tif took > 300*time.Millisecond {\n\t\tt.Errorf(\"CountWords(20 words, 30ms each) took %v, want under %v (run the words in goroutines)\", took, 300*time.Millisecond)\n\t}\n}\n","solution":"package main\n\nimport \"sync\"\n\nfunc CountWords(words []string, work func(string)) map[string]int {\n\tcounts := map[string]int{}\n\tvar mu sync.Mutex\n\tvar wg sync.WaitGroup\n\tfor _, w := range words {\n\t\twg.Add(1)\n\t\tgo func() {\n\t\t\tdefer wg.Done()\n\t\t\twork(w)\n\t\t\tmu.Lock()\n\t\t\tcounts[w]++\n\t\t\tmu.Unlock()\n\t\t}()\n\t}\n\twg.Wait()\n\treturn counts\n}\n"},
    blocks: [
      {
        heading: 'Use a mutex when you are guarding state',
        body: [
          '"Share memory by communicating" is Go’s slogan, but do not force it. A mutex around a cache is simpler, faster, and more obvious than a goroutine owning a map behind a channel. Channels are for transferring ownership of a value; a mutex is for protecting a field.',
          'For the full "which one?" comparison, with the same counter written both ways, see [Mutex vs channel](/languages/go/mutex-vs-channel).',
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

import (
	"fmt"
	"sync"
)

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
	c := &Cache{m: map[string]string{}} // the map must be made before Set
	c.Set("go", "gopher")
	v, ok := c.Get("go")
	fmt.Println(v, ok)
	_, ok = c.Get("rust")
	fmt.Println(ok)
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
    objectives: [
      'Write a function that takes `ctx` first and returns `ctx.Err()` when it is cancelled.',
      'Explain why cancelling a context does nothing unless your code checks `ctx.Done()`.',
      'Predict whether a child context made with `context.WithoutCancel` stops when its parent is cancelled.',
    ],
    challenge: {"prompt":"Write `SleepCtx(ctx, d)`: wait for `d`, or stop early if `ctx` is done. Return `nil` if the time passed, or `ctx.Err()` if the context ended first. The hidden tests time you: a cancelled context must make a 2-second sleep return almost at once. Example: with a context that times out after 5ms, `SleepCtx(ctx, 2*time.Second)` returns `context.DeadlineExceeded` after about 5ms.","starter":"package main\n\nimport (\n\t\"context\"\n\t\"time\"\n)\n\nfunc SleepCtx(ctx context.Context, d time.Duration) error {\n\ttime.Sleep(d) // TODO: select on time.After(d) and ctx.Done()\n\treturn ctx.Err()\n}\n","test":"package main\n\nimport (\n\t\"context\"\n\t\"testing\"\n\t\"time\"\n)\n\nfunc TestSleepCtx(t *testing.T) {\n\tcancelled, cancel := context.WithCancel(context.Background())\n\tcancel()\n\tshort, cancel2 := context.WithTimeout(context.Background(), 5*time.Millisecond)\n\tdefer cancel2()\n\tlater, cancel3 := context.WithCancel(context.Background())\n\ttime.AfterFunc(10*time.Millisecond, cancel3)\n\tcases := []struct {\n\t\tname     string\n\t\tctx      context.Context\n\t\td        time.Duration\n\t\twant     error\n\t\tmin, max time.Duration\n\t}{\n\t\t{\"cancelled midway\", later, 2 * time.Second, context.Canceled, 0, 100 * time.Millisecond},\n\t\t{\"background\", context.Background(), 20 * time.Millisecond, nil, 20 * time.Millisecond, time.Second},\n\t\t{\"cancelled\", cancelled, 2 * time.Second, context.Canceled, 0, 50 * time.Millisecond},\n\t\t{\"timeout\", short, 2 * time.Second, context.DeadlineExceeded, 0, 100 * time.Millisecond},\n\t}\n\tfor _, c := range cases {\n\t\tstart := time.Now()\n\t\tgot := SleepCtx(c.ctx, c.d)\n\t\ttook := time.Since(start)\n\t\tif got != c.want {\n\t\t\tt.Errorf(\"SleepCtx(%v, %v) = %v, want %v\", c.name, c.d, got, c.want)\n\t\t}\n\t\tif took < c.min || took > c.max {\n\t\t\tt.Errorf(\"SleepCtx(%v, %v) took %v, want between %v and %v\", c.name, c.d, took, c.min, c.max)\n\t\t}\n\t}\n}\n","solution":"package main\n\nimport (\n\t\"context\"\n\t\"time\"\n)\n\nfunc SleepCtx(ctx context.Context, d time.Duration) error {\n\tt := time.NewTimer(d)\n\tdefer t.Stop()\n\tselect {\n\tcase <-t.C:\n\t\treturn nil\n\tcase <-ctx.Done():\n\t\treturn ctx.Err()\n\t}\n}\n"},
    blocks: [
      {
        heading: 'What is context used for in Go?',
        body: [
          '`context.Context` is how a Go program says "stop, nobody needs this any more". In a typical service it is the first parameter of every function that does I/O: database queries, HTTP calls, RPCs.',
        ],
        code: {
          label: 'context.go',
          src: `func fetch(ctx context.Context, url string) error {
\tctx, cancel := context.WithTimeout(ctx, 3*time.Second)
\tdefer cancel()                // ALWAYS, even on success — or you leak the timer

\treq, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
\tif err != nil {
\t\treturn err
\t}
\tresp, err := http.DefaultClient.Do(req) // aborts when ctx is done
\tif err != nil {
\t\treturn err
\t}
\tdefer resp.Body.Close()
\treturn nil
}

func work(ctx context.Context) error {
\tselect {
\tcase <-time.After(5 * time.Second):
\t\treturn nil
\tcase <-ctx.Done():
\t\treturn ctx.Err()          // context.Canceled or context.DeadlineExceeded
\t}
}`,
          note: 'Contexts form a tree. `WithTimeout(ctx, ...)` makes a child of the caller\'s context: cancelling the parent cancels every child, but cancelling a child never touches the parent. A child deadline can only be shorter than its parent\'s, never longer.',
        },
      },
      {
        heading: 'What does context.WithoutCancel do?',
        body: [
          'It gives you a context that keeps the parent’s values but is never cancelled. Sometimes work must outlive the request that started it, such as writing an audit log after the response is sent. If you pass `r.Context()`, the log write is cancelled the moment the client disconnects. `context.WithoutCancel(ctx)` (Go 1.21) gives you a child that keeps every value (request ID, user ID) but is never cancelled and has no deadline.',
        ],
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"context"
	"fmt"
)

type reqIDKey struct{}

func main() {
	req, cancel := context.WithCancel(context.WithValue(context.Background(), reqIDKey{}, "req-7"))
	bg := context.WithoutCancel(req) // same values, no cancellation

	cancel() // the request is over

	fmt.Println("request ctx:", req.Err())
	fmt.Println("background ctx:", bg.Err())
	fmt.Println("still has request id:", bg.Value(reqIDKey{}))
}
`,
          canRun: true,
          note: 'Give the background work its own timeout with `context.WithTimeout(bg, ...)`, or nothing will ever stop it.',
        },
      },
      {
        heading: 'What does context.AfterFunc do?',
        body: [
          '`context.AfterFunc(ctx, f)` (Go 1.21) runs `f` in its own goroutine once `ctx` is done. It returns a `stop` function: calling `stop()` before then cancels the plan, and it returns `true` if it stopped `f` from running. Use it to clean up, such as closing a connection, without writing a goroutine that waits on `ctx.Done()`.',
        ],
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"context"
	"fmt"
	"sync"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	var wg sync.WaitGroup
	wg.Add(1)
	context.AfterFunc(ctx, func() {
		defer wg.Done()
		fmt.Println("ctx done, closing connection")
	})

	ctx2, cancel2 := context.WithCancel(context.Background())
	stop := context.AfterFunc(ctx2, func() { fmt.Println("never printed") })
	fmt.Println("stopped before it ran:", stop())
	cancel2()

	cancel()
	wg.Wait() // f runs in its own goroutine, so wait for it
}
`,
          canRun: true,
          note: '`stop()` returns false if `f` has already started or was already stopped, so you know whether the cleanup happened.',
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
    slug: 'concurrency-patterns',
    title: 'Concurrency patterns',
    navTitle: 'Concurrency patterns',
    oneLine: 'Run once, wait for many, stop on the first error, cap the parallelism, and never leak a goroutine.',
    objectives: [
      'Write an `errgroup` that runs several tasks and returns the first error.',
      'Write a worker pool that caps how many goroutines run at once.',
      'Explain how a goroutine leaks when nobody reads from its channel, and fix it.',
    ],
    blocks: [
      {
        heading: 'Why patterns',
        body: [
          'Goroutines, channels, mutexes and context are the parts. Most real code combines them in the same few ways: do something once, run N things and wait, stop everything when one fails, limit how many run at a time.',
          'Each pattern below has a ready-made tool. Use it instead of hand-rolling the channels, because the hand-rolled version is where the leaks and races hide.',
        ],
      },
      {
        heading: 'sync.Once — do it exactly once',
        body: [
          '`once.Do(f)` runs `f` the first time it is called, from any goroutine. Every other caller waits until that first call has finished, then returns without running `f`. Use it for lazy setup: loading config, opening a shared client.',
          'Since Go 1.21, `sync.OnceValue` and `sync.OnceValues` wrap the same idea and also return the result, which is usually what you want.',
        ],
        code: {
          label: 'once.go',
          src: `var loadConfig = sync.OnceValue(func() map[string]string {
\tfmt.Println("loading config")       // runs once, however many callers
\treturn map[string]string{"env": "prod"}
})

cfg := loadConfig()                     // first call loads
cfg = loadConfig()                      // later calls get the same map`,
          note: 'If `f` panics, `Once` still counts it as done, and later `Do` calls do nothing. `OnceValue` instead re-panics with the same value on every call.',
        },
      },
      {
        heading: 'WaitGroup.Go — start and wait, without the Add/Done dance',
        body: [
          'Go 1.25 added `wg.Go(f)`. It does the `Add(1)`, starts the goroutine, and calls `Done` when `f` returns. You can no longer put the `Add` in the wrong place or forget the `Done`.',
        ],
        code: {
          label: 'wggo.go',
          src: `var wg sync.WaitGroup
for i := range 3 {
\twg.Go(func() {                     // Go 1.25+
\t\tfmt.Println("task", i)          // own i per iteration since Go 1.22
\t})
}
wg.Wait()`,
          note: 'On Go 1.24 or older, write `wg.Add(1)` before `go func() { defer wg.Done(); ... }()` instead.',
        },
      },
      {
        heading: 'errgroup — wait for many, stop on the first error',
        body: [
          'A WaitGroup does not collect errors. `errgroup` does. `g.Wait()` waits for every goroutine and returns the first non-nil error. With `errgroup.WithContext`, that first error also cancels a shared context, so the other goroutines can stop early, if they check it.',
          '`g.SetLimit(n)` caps how many run at once: `g.Go` blocks until a slot is free. That gives you a bounded worker pool in two lines.',
          'It lives in `golang.org/x/sync/errgroup`, one of the `x/` packages maintained by the Go team but outside the standard library. Add it with `go get golang.org/x/sync`. The Playground cannot fetch it, so this example is not runnable here. The next section builds the same thing by hand, and that one runs.',
        ],
        code: {
          label: 'errgroup.go — needs golang.org/x/sync, run it in your own module',
          src: `func fetchAll(ctx context.Context, urls []string) ([]string, error) {
\tg, ctx := errgroup.WithContext(ctx)   // ctx is cancelled on the first error
\tg.SetLimit(4)                         // at most 4 fetches at a time

\tbodies := make([]string, len(urls))
\tfor i, url := range urls {
\t\tg.Go(func() error {
\t\t\tbody, err := fetch(ctx, url)  // fetch must honour ctx
\t\t\tif err != nil {
\t\t\t\treturn err
\t\t\t}
\t\t\tbodies[i] = body             // each goroutine writes its own index: no race
\t\t\treturn nil
\t\t})
\t}
\tif err := g.Wait(); err != nil {
\t\treturn nil, err
\t}
\treturn bodies, nil
}`,
          note: 'Cancelling the context does not kill the other goroutines. `Wait` still waits for all of them, so they must return promptly when `ctx.Done()` closes.',
        },
      },
      {
        heading: 'What errgroup does, by hand',
        body: [
          'You cannot run errgroup on the Playground, so here is a stand-in using only the standard library. It is a tiny version of the same idea: a WaitGroup to wait, a `sync.Once` to keep the first error, and `context.WithCancelCause` to cancel the others.',
          'Use the real errgroup in your own code. This is only to show there is no magic inside it.',
        ],
        code: {
          label: 'group.go — what errgroup does, by hand (standard library only)',
          src: `type group struct {
\twg     sync.WaitGroup
\tonce   sync.Once
\terr    error
\tcancel context.CancelCauseFunc
}

func withContext(ctx context.Context) (*group, context.Context) {
\tctx, cancel := context.WithCancelCause(ctx)
\treturn &group{cancel: cancel}, ctx
}

func (g *group) Go(f func() error) {
\tg.wg.Add(1)
\tgo func() {
\t\tdefer g.wg.Done()
\t\tif err := f(); err != nil {
\t\t\tg.once.Do(func() { // keep only the first error
\t\t\t\tg.err = err
\t\t\t\tg.cancel(err)
\t\t\t})
\t\t}
\t}()
}

func (g *group) Wait() error {
\tg.wg.Wait()
\tg.cancel(g.err) // release the context's resources
\treturn g.err
}`,
          run: `package main

import (
\t"context"
\t"errors"
\t"fmt"
\t"sync"
\t"time"
)

type group struct {
\twg     sync.WaitGroup
\tonce   sync.Once
\terr    error
\tcancel context.CancelCauseFunc
}

func withContext(ctx context.Context) (*group, context.Context) {
\tctx, cancel := context.WithCancelCause(ctx)
\treturn &group{cancel: cancel}, ctx
}

func (g *group) Go(f func() error) {
\tg.wg.Add(1)
\tgo func() {
\t\tdefer g.wg.Done()
\t\tif err := f(); err != nil {
\t\t\tg.once.Do(func() { // keep only the first error
\t\t\t\tg.err = err
\t\t\t\tg.cancel(err)
\t\t\t})
\t\t}
\t}()
}

func (g *group) Wait() error {
\tg.wg.Wait()
\tg.cancel(g.err) // release the context's resources
\treturn g.err
}

func main() {
\tg, ctx := withContext(context.Background())
\tfor i := range 3 {
\t\tg.Go(func() error {
\t\t\tif i == 1 {
\t\t\t\treturn errors.New("task 1 failed")
\t\t\t}
\t\t\tselect {
\t\t\tcase <-time.After(time.Second):
\t\t\t\tfmt.Println("task", i, "done")
\t\t\tcase <-ctx.Done():
\t\t\t\tfmt.Println("task", i, "stopped:", context.Cause(ctx))
\t\t\t}
\t\t\treturn nil
\t\t})
\t}
\tfmt.Println("Wait:", g.Wait())
}`,
          note: 'Task 1 fails at once, the context is cancelled, and tasks 0 and 2 stop early instead of waiting a second. `Wait` returns the first error. There is no `SetLimit` here; the real package has it.',
        },
      },
      {
        heading: 'A worker pool with bounded concurrency',
        body: [
          'Without errgroup, the classic shape is a fixed number of workers reading from one jobs channel. The producer closes `jobs` when it is done, each worker\'s `range` loop then ends, and a separate goroutine closes `results` once every worker has returned.',
        ],
        code: {
          label: 'pool.go',
          src: `package main

import (
	"fmt"
	"sync"
)

func main() {
	jobs := make(chan int)
	results := make(chan int)

	var wg sync.WaitGroup
	for range 3 { // 3 workers: at most 3 jobs run at once
		wg.Add(1)
		go func() {
			defer wg.Done()
			for n := range jobs { // ends when jobs is closed and empty
				results <- n * n
			}
		}()
	}

	go func() { // the producer: sends, then closes
		for n := 1; n <= 5; n++ {
			jobs <- n
		}
		close(jobs)
	}()

	go func() { // close results only after every worker is done
		wg.Wait()
		close(results)
	}()

	sum := 0
	for r := range results {
		sum += r
	}
	fmt.Println("sum of squares 1..5:", sum) // always 55
}
`,
          canRun: true,
          note: 'Results arrive in any order, so the example sums them. If order matters, send the index with each job and write into a slice.',
        },
      },
      {
        heading: 'Goroutine leaks',
        body: [
          'A goroutine leaks when it blocks forever on something nobody will ever do: a send nobody receives, a receive on a channel nobody closes, a wait on a context nobody cancels. The garbage collector never frees a blocked goroutine, so its stack and everything it references stay in memory. In a server that leaks one per request, memory climbs until the process dies.',
          'The usual cause is an early return. The caller gives up (timeout, error) and stops listening, while the goroutine it started is still trying to send.',
        ],
        bullets: [
          '**Give every goroutine a way out.** Before you write `go`, know what makes it return.',
          '**Select on `ctx.Done()`** next to every blocking send or receive in long-running goroutines.',
          '**Close the channel** a `range` loop reads from, from the sending side, when the work is done.',
          '**Buffer the result channel** with room for every send when the caller might leave early: `make(chan T, 1)` for one result. The send then never blocks, and the goroutine exits.',
          '**Detect leaks in tests.** `runtime.NumGoroutine()` before and after gives a rough count. `go.uber.org/goleak` fails a test when goroutines are left over: `defer goleak.VerifyNone(t)`. In a live server, the goroutine profile from `net/http/pprof` (`/debug/pprof/goroutine?debug=1`) shows where they are all stuck.',
        ],
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"fmt"
	"runtime"
	"time"
)

// slowLookup gives up after 10ms, but the work takes 50ms.
func slowLookup(buffered bool) (int, bool) {
	var ch chan int
	if buffered {
		ch = make(chan int, 1) // room for the one send: it never blocks
	} else {
		ch = make(chan int) // the send waits for a receiver that has left
	}
	go func() {
		time.Sleep(50 * time.Millisecond)
		ch <- 42
	}()
	select {
	case v := <-ch:
		return v, true
	case <-time.After(10 * time.Millisecond):
		return 0, false // we stop listening here
	}
}

func main() {
	before := runtime.NumGoroutine()

	for range 3 {
		slowLookup(false)
	}
	time.Sleep(100 * time.Millisecond) // let the workers finish if they can
	fmt.Println("unbuffered, leaked:", runtime.NumGoroutine()-before)

	before = runtime.NumGoroutine()
	for range 3 {
		slowLookup(true)
	}
	time.Sleep(100 * time.Millisecond)
	fmt.Println("buffered, leaked:", runtime.NumGoroutine()-before)
}
`,
          canRun: true,
          note: 'The unbuffered version leaks one goroutine per call, stuck on `ch <- 42` forever. A buffer of one fixes it. Passing a context and selecting on `ctx.Done()` around the send fixes it too.',
        },
      },
    ],
    keyPoints: [
      '`sync.Once` / `sync.OnceValue` for lazy setup that must run exactly once.',
      '`wg.Go(f)` (Go 1.25) does the `Add` and `Done` for you.',
      '`errgroup` (`golang.org/x/sync`) returns the first error, cancels the shared context, and `SetLimit` caps parallelism.',
      'A worker pool is N goroutines ranging over one jobs channel. The producer closes jobs; a waiter closes results.',
      'A blocked goroutine is never collected. Every goroutine needs a way out: a context, a close, or a buffer.',
    ],
    remember:
      'Before you type `go`, know how that goroutine will end.',
    task: 'Write a function that fetches 20 fake items with at most 4 in flight, returns the first error, and leaves no goroutines behind. Check the last part with `runtime.NumGoroutine()`.',
    exercises: [
      {
        task: 'Call a `sync.OnceValue` function from 100 goroutines. How many times does the setup print?',
        answer:
          'Once. The other 99 callers wait for the first call to finish, then all get the same value.',
      },
      {
        task: 'In the errgroup example, make one fetch fail immediately while the others sleep for a second without checking `ctx`. How long does `Wait` take?',
        answer:
          'About a second. The context is cancelled at once, but `Wait` still waits for every goroutine, and the sleepers ignore the cancellation. Select on `ctx.Done()` and it returns almost immediately.',
      },
      {
        task: 'In the worker pool, delete the `close(jobs)` line. What happens?',
        answer:
          'The workers never leave their `range` loops, so `wg.Wait` never returns and `results` is never closed. Every goroutine ends up blocked, so the runtime reports `all goroutines are asleep - deadlock!`. In a server, where other goroutines are still running, it would hang silently instead.',
      },
      {
        task: 'Fix the leaking `slowLookup` with a `context.Context` instead of a buffer.',
        answer:
          'Create the context with `WithTimeout` in the caller, and in the goroutine `select` on `ch <- 42` and `<-ctx.Done()`. When the caller leaves, `defer cancel()` closes `Done`, and the goroutine returns instead of blocking.',
      },
    ],
    refs: [
      { label: 'sync package', href: 'https://pkg.go.dev/sync' },
      { label: 'errgroup package', href: 'https://pkg.go.dev/golang.org/x/sync/errgroup' },
      { label: 'Go blog: Pipelines and cancellation', href: 'https://go.dev/blog/pipelines' },
      { label: 'goleak', href: 'https://github.com/uber-go/goleak' },
    ],
  },

  {
    slug: 'generics',
    title: 'Generics',
    navTitle: 'Generics',
    oneLine: 'Write one function for many types, and know when an interface is the better answer.',
    objectives: [
      'Write a generic function with a type parameter and a constraint.',
      'Explain when an interface is a better choice than a type parameter.',
      'Predict which types a constraint like `~int | ~float64` accepts.',
    ],
    challenge: {"prompt":"Write the generic function `Max[T cmp.Ordered](s []T) (T, bool)`: return the largest element and `true`, or the zero value and `false` for an empty slice. It must work for ints, floats, strings, and your own types built on them (like `type Celsius float64`), which is what the `~` inside `cmp.Ordered` allows. Example: `Max([3 -1 7 7])` returns `7, true`.","starter":"package main\n\nimport \"cmp\"\n\nfunc Max[T cmp.Ordered](s []T) (T, bool) {\n\tvar zero T\n\treturn zero, false // TODO: walk s and keep the biggest\n}\n","test":"package main\n\nimport \"testing\"\n\ntype Celsius float64\n\nfunc TestMax(t *testing.T) {\n\tints := []struct {\n\t\tin   []int\n\t\twant int\n\t\tok   bool\n\t}{\n\t\t{[]int{3, -1, 7, 7}, 7, true},\n\t\t{[]int{-5, -2, -9}, -2, true},\n\t\t{[]int{1 << 62, 1}, 1 << 62, true},\n\t\t{nil, 0, false},\n\t}\n\tfor _, c := range ints {\n\t\tif got, ok := Max(c.in); got != c.want || ok != c.ok {\n\t\t\tt.Errorf(\"Max(%v) = %v, %v, want %v, %v\", c.in, got, ok, c.want, c.ok)\n\t\t}\n\t}\n\twords := []string{\"pear\", \"apple\", \"zebra\", \"mango\"}\n\tif got, ok := Max(words); got != \"zebra\" || !ok {\n\t\tt.Errorf(\"Max(%v) = %v, %v, want %v, %v\", words, got, ok, \"zebra\", true)\n\t}\n\ttemps := []Celsius{-3.5, 21.25, 21}\n\tif got, ok := Max(temps); got != 21.25 || !ok {\n\t\tt.Errorf(\"Max(%v) = %v, %v, want %v, %v\", temps, got, ok, 21.25, true)\n\t}\n}\n","solution":"package main\n\nimport \"cmp\"\n\nfunc Max[T cmp.Ordered](s []T) (T, bool) {\n\tvar zero T\n\tif len(s) == 0 {\n\t\treturn zero, false\n\t}\n\tbest := s[0]\n\tfor _, v := range s[1:] {\n\t\tif v > best {\n\t\t\tbest = v\n\t\t}\n\t}\n\treturn best, true\n}\n"},
    blocks: [
      {
        heading: 'What are generics for in Go?',
        body: [
          'Generics let you write one function or type that works for many types, without copying the code. Suppose you write a function that finds the largest number in a slice of `int`. Then you need one for `float64`. Then one for your own `Cents` type. The logic is identical each time, but Go\'s type checking will not let you pass a `[]float64` where a `[]int` is expected, so you end up with three near-identical copies.',
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

import (
	"cmp"
	"fmt"
)

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

type UserID int

func main() {
	// "~int" means "any type whose underlying type is int", so your own
	// "type UserID int" qualifies too.
	fmt.Println(Sum([]int{1, 2, 3}), Sum([]float64{0.5, 0.25}), Sum([]UserID{10, 20}))

	// cmp.Ordered comes from the stdlib and covers everything that supports < >
	fmt.Println(Max(3, 7), Max("apple", "pear"))
}
`,
        },
      },
      {
        heading: 'When should you use generics instead of interfaces?',
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
    objectives: [
      'Write a small program using `strings`, `strconv` and `sort` instead of hand-rolled loops.',
      'Explain why reaching for the standard library first saves bugs.',
      'Fix a hand-written helper by replacing it with the stdlib function that already does it.',
    ],
    challenge: {
      prompt:
        'Write `Initials(name)`: return the first letter of each word, in capitals. Words are separated by any amount of spaces. Use `strings.Fields` and `strings.ToUpper`. Example: `Initials("  rohan  kumar patel ")` returns `"RKP"`.',
      starter: `package main

import "strings"

func Initials(name string) string {
	return strings.TrimSpace(name) // TODO: first letter of each word, upper case
}
`,
      test: `package main

import "testing"

func TestInitials(t *testing.T) {
	cases := []struct{ in, want string }{
		{"ada lovelace", "AL"},
		{"  rohan  kumar patel ", "RKP"},
		{"Go", "G"},
		{"", ""},
	}
	for _, c := range cases {
		if got := Initials(c.in); got != c.want {
			t.Errorf("Initials(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}
`,
      solution: `package main

import "strings"

func Initials(name string) string {
	var b strings.Builder
	for _, w := range strings.Fields(name) {
		b.WriteString(strings.ToUpper(w[:1]))
	}
	return b.String()
}
`,
    },
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
	// maps.Keys returns an iterator, not a slice; slices.Sorted collects it and sorts it.
	keys := slices.Sorted(maps.Keys(m)) // maps have no order, so sort them
	fmt.Println(keys)

	fmt.Println(strings.Fields("  spread   out  words "))
	before, after, _ := strings.Cut("Bearer abc123", " ")
	fmt.Println(before, "|", after)
	fmt.Println(strings.EqualFold("Go", "GO"))
}
`,
          canRun: true,
          note: 'The helpers that replace most hand-written loops. Reach for these first. Since Go 1.23, `maps.Keys` and `maps.Values` return an iterator (an `iter.Seq`) instead of a slice, so you pass it to `slices.Sorted` or `slices.Collect`. The Iterators lesson explains how they work.',
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
