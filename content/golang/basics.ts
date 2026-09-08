import type { LangLesson } from '@/lib/types'

/** The language itself. Assumes nothing: no Go, no compiled language, no pointers. */
export const BASICS: LangLesson[] = [
  {
    slug: 'setup-and-first-program',
    title: 'Setup, your first program, and the toolchain',
    navTitle: 'Setup and first program',
    oneLine: 'Install Go, run one file, and meet the four commands you will use every day.',
    blocks: [
      {
        body: [
          'Go is a compiled language. You write a `.go` file, the compiler turns it into a single machine-code binary, and you run that. There is no interpreter to install on the server and no virtual machine. That one fact explains most of what people like about Go: you build one file and copy it anywhere.',
          'First, install it. Pick your system below — every option installs the same thing: the compiler, the standard library and the `go` command.',
        ],
        code: { label: 'terminal', src: 'go version\n# go version go1.22.2 linux/amd64' },
      },
      {
        heading: 'Install Go',
      },
      {
        code: {
          label: 'macOS',
          src: `# with Homebrew (easiest)
brew install go

# or download the .pkg installer from https://go.dev/dl/
# and double-click it`,
        },
      },
      {
        code: {
          label: 'Windows',
          src: `# with winget
winget install GoLang.Go

# or download the .msi installer from https://go.dev/dl/
# then close and reopen your terminal so PATH updates`,
        },
      },
      {
        code: {
          label: 'Linux',
          src: `# the official way — distribution packages are often far behind
curl -LO https://go.dev/dl/go1.22.2.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.22.2.linux-amd64.tar.gz

# then add Go to your PATH, and reload your shell
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.profile
source ~/.profile`,
          note: 'Check https://go.dev/dl/ for the current version number before you copy that URL.',
        },
      },
      {
        code: {
          label: 'check it worked',
          src: `go version
# go version go1.22.2 linux/amd64

go env GOPATH
# /home/you/go   — where downloaded packages live. You rarely need to touch it.`,
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Nothing else to install. No package manager to set up, no virtual environment, no build tool. The `go` command does all of it, which is one of the nicest things about starting Go.',
        },
      },
      {
        heading: 'You can also run Go without installing anything',
        body: [
          'Every code block on this site with a **▶ Run** button executes on the official Go Playground, so you can work through the language topics in a browser before you install anything. Press Run, change the code, press Run again.',
          'You will need a real installation from the practice projects onwards, because those use files, folders and a database — none of which the playground has.',
        ],
      },
      {
        heading: 'A module is a project',
        body: [
          'Every Go project is a **module**. A module is a folder with a `go.mod` file at the top. That file records the module name and which Go version it needs. You make one once, at the start.',
        ],
        code: {
          label: 'terminal',
          src: 'mkdir -p ~/go-learn/d01\ncd ~/go-learn/d01\ngo mod init d01',
          note: 'The name `d01` is the import path. For real projects use something like `github.com/you/project`.',
        },
      },
      {
        heading: 'The first program',
        body: [
          'Every Go file starts with `package`. A program you can run lives in `package main` and has a `func main()`. That function is where execution starts, and when it returns the program exits.',
        ],
        code: {
          label: 'main.go',
          src: `package main

import "fmt"

func main() {
\tfmt.Println("hello")

\tname := "sahdev"    // short declaration, the type is inferred
\tvar age int = 25    // the long form, type written out
\tvar city string     // no value given, so it gets the zero value: ""
\tconst pi = 3.14     // fixed at compile time, cannot change

\tfmt.Println(name, age, city, pi)
}`,
          canRun: true,
        },
      },
      {
        heading: 'Three ways to declare, one you will mostly use',
        bullets: [
          '`name := "sahdev"` — inside a function, the common case. Go works out the type.',
          '`var age int = 25` — when you want the type written down, or you are outside a function.',
          '`var city string` — declare now, assign later. It holds the **zero value** until you do.',
          '`const pi = 3.14` — a value fixed at compile time. It cannot be changed and has no address.',
        ],
      },
      {
        heading: 'Zero values: Go has no "undefined"',
        body: [
          'This is the first idea that makes Go different from JavaScript or Python. A variable you declare but do not set is **not** empty, null, or undefined. It holds a well-defined zero value for its type.',
        ],
        table: {
          headers: ['Type', 'Zero value'],
          rows: [
            ['`int`, `float64`', '`0`'],
            ['`string`', '`""` (empty, not nil)'],
            ['`bool`', '`false`'],
            ['pointer, slice, map, channel, func, interface', '`nil`'],
            ['struct', 'a struct with every field at its own zero value'],
          ],
        },
      },
      {
        body: [
          'Because of this you never get a "cannot read property of undefined" style crash from an unset variable. It also means you can design a type so that its zero value is already useful — a trick that pays off later, when you design your own types.',
        ],
      },
      {
        heading: 'The four commands',
        code: {
          label: 'terminal',
          src: 'go run .          # compile and run, leave no binary behind\ngo build -o app . # produce ./app, ready to copy to a server\ngo fmt ./...      # format the code. Not a preference, the standard.\ngo vet ./...      # find real mistakes the compiler allows',
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Go has exactly one formatting style, and `go fmt` applies it. Nobody on a Go team argues about tabs, braces, or line length. Run it before every commit and forget the whole topic exists.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import "fmt"

func main() {
	name := "sahdev"    // short declaration, the type is inferred
	var age int = 25    // the long form, type written out
	var city string     // never assigned, so it holds the zero value
	const pi = 3.14     // fixed at compile time

	fmt.Println(name, age, city, pi)
	fmt.Printf("city is %q and has %d characters\\n", city, len(city))
}
`,
          canRun: true,
          note: 'Press Run. Then change a value, or add a line, and run it again.',
        },
      },
    ],
    keyPoints: [
      'A module is a folder with a `go.mod`. A runnable program is `package main` with `func main()`.',
      'Every variable has a zero value. There is no undefined, and no unset variable to guard against.',
      '`:=` inside functions, `var` when you want the type written down or you are at package level.',
      '`go run`, `go build`, `go fmt`, `go vet`. That is the whole daily toolchain.',
    ],
    remember:
      'Go compiles to one file with no runtime, and every variable starts at a defined zero value. Those two facts shape most of the language.',
    task: 'Print your name, age, and whether you are a student — using all three declaration styles. Then declare a variable of each basic type without assigning it and print them, to see the zero values yourself.',
    refs: [
      { label: 'Tutorial: Get started with Go', href: 'https://go.dev/doc/tutorial/getting-started' },
      { label: 'A Tour of Go — Basics', href: 'https://go.dev/tour/basics/1' },
    ],
  },

  {
    slug: 'type-conversion',
    title: 'Type conversion',
    navTitle: 'Type conversion',
    oneLine: 'Why Go refuses to turn an int into a float for you.',
    blocks: [
      {
        heading: 'Go never converts a type for you',
        body: [
          'In most languages, an `int` next to a `float` quietly becomes a float. Go refuses. Every conversion is written out by you.',
          'This feels fussy until the first time it saves you. Silent numeric conversion is where money code loses cents and where an `int32` overflows without a word. Go decided the cost of typing `float64(a)` is lower than the cost of finding that bug.',
        ],
        code: {
          label: 'conversion.go',
          src: `var a int = 10
var b float64 = float64(a)   // required. "var b float64 = a" does not compile.
var c int64 = int64(a)

// Strings convert to and from byte and rune slices
s := "hello"
bs := []byte(s)   // the raw bytes
rs := []rune(s)   // the unicode characters

fmt.Println(len(s), len(rs))`,
          note: '`len` on a string counts BYTES, not characters. For "héllo" that is 6 and 5. **Slices, maps, and strings** covers why.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"fmt"
	"strconv"
)

type Cents int64 // your own named type

func main() {
	i := 7
	f := float64(i) / 2 // without float64() this is integer division
	fmt.Println("7/2 as ints  :", 7/2)
	fmt.Println("7/2 as floats:", f)

	var c Cents = Cents(i) // a named type still needs the conversion
	fmt.Println("cents:", c, "back to int:", int(c))

	s := "héllo"
	fmt.Println("bytes:", len(s), "runes:", len([]rune(s)))

	// numbers <-> text needs strconv, not a cast
	fmt.Println(strconv.Itoa(65), "vs", string(rune(65)))

	n, err := strconv.Atoi("not a number")
	fmt.Println("Atoi failed:", n, err)
}
`,
          canRun: true,
          note: 'Every conversion here is written out. Delete one and see what the compiler says.',
        },
      },
    ],
    keyPoints: [
      'Every conversion between types is written out by you. Go never widens silently.',
      '`float64(a)`, `int64(a)`, `[]byte(s)`, `[]rune(s)` — all explicit.',
      '`len` on a string counts bytes, not characters.',
      'The cost of typing the conversion is lower than the cost of finding the bug it prevents.',
    ],
    remember:
      'Silent numeric conversion is where money code loses cents. Go makes you write it down.',
    task: 'Convert an int to a float64 and back, and a string to both `[]byte` and `[]rune`. Print the length of each.',
    exercises: [
      {
        task: 'Try `var b float64 = someInt` and read the compiler error.',
        answer:
          '`cannot use someInt (variable of type int) as float64 value`. Go never widens for you — write `float64(someInt)`.',
      },
      {
        task: 'Convert a float64 with a fraction to an int and see what happens to the decimals.',
        answer:
          'The decimals are thrown away, not rounded: `int(3.9)` is 3. Add 0.5 first, or use `math.Round`.',
      },
      {
        task: 'Take `len()` of a string with an emoji, then of `[]rune` of the same string.',
        answer:
          'An emoji is often 4 bytes and 1 rune, so `len` can be four times the character count.',
      },
    ],
    refs: [
      { label: 'A Tour of Go — Flow control', href: 'https://go.dev/tour/flowcontrol/1' },
      { label: 'Effective Go', href: 'https://go.dev/doc/effective_go' },
    ],
  },

  {
    slug: 'control-flow',
    title: 'if, for, and switch',
    navTitle: 'if, for, and switch',
    oneLine: 'One loop keyword, no ternary, and cases that do not fall through.',
    blocks: [
      {
        heading: 'if — with a scoped variable',
        body: [
          'Go lets you declare a variable inside the `if`, scoped to the `if` and its `else`. You will use this constantly for error handling, so get used to the shape now.',
        ],
        code: {
          label: 'flow.go',
          src: `if n := len(s); n > 3 {
\tfmt.Println("long:", n)
} else if n == 3 {
\tfmt.Println("exactly three")
} else {
\tfmt.Println("short")
}
// n does not exist out here — and that is the point`,
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'There is no ternary operator in Go, and there never will be. Write the `if`. It is longer and it is readable at 3am.',
        },
      },
      {
        heading: 'for — the only loop',
        body: [
          'Go has one loop keyword. There is no `while`, no `do..while`, no `foreach`. `for` covers all of them by leaving parts out.',
        ],
        code: {
          label: 'loops.go',
          src: `for i := 0; i < 5; i++ { }        // the classic three-part loop

for i < 5 { i++ }                 // no init or post: this is a while loop

for { break }                     // no condition at all: infinite

for i, ch := range "héllo" {      // range over a string gives byte index + rune
\tfmt.Println(i, string(ch))
}

for i, v := range mySlice { }     // index and value
for _, v := range mySlice { }     // "_" throws the index away
for k, v := range myMap { }       // key and value, in RANDOM order`,
        },
      },
      {
        heading: 'switch — cleaner than it is elsewhere',
        body: [
          'Two things differ from C and Java. Cases do not fall through, so you never write `break`. And a `switch` with no expression is just a tidy if/else chain — you will see this everywhere in real Go.',
        ],
        code: {
          label: 'switch.go',
          src: `switch day := 3; day {
case 1, 2, 3, 4, 5:
\tfmt.Println("weekday")     // no break needed
case 6, 7:
\tfmt.Println("weekend")
default:
\tfmt.Println("invalid")
}

// switch with no expression — the idiomatic if/else chain
switch {
case age < 13:
\tfmt.Println("child")
case age < 20:
\tfmt.Println("teenager")
default:
\tfmt.Println("adult")
}`,
          note: 'If you really want fall-through, the keyword is `fallthrough`. You will almost never need it.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import "fmt"

func main() {
	for i := 1; i <= 15; i++ {
		switch {
		case i%15 == 0:
			fmt.Println("FizzBuzz")
		case i%3 == 0:
			fmt.Println("Fizz")
		case i%5 == 0:
			fmt.Println("Buzz")
		default:
			fmt.Println(i)
		}
	}

	if n := len("héllo"); n > 3 {
		fmt.Println("byte length is", n) // 6, not 5
	}
}
`,
          canRun: true,
          note: 'FizzBuzz with an expressionless switch, plus the scoped-variable `if`.',
        },
      },
    ],
    keyPoints: [
      'One loop keyword: `for`. Drop parts of it to get a while loop or an infinite one.',
      '`if n := len(s); n > 3` scopes the variable to the if and its else.',
      'Cases do not fall through, so you never write `break`.',
      'A `switch` with no expression is the idiomatic if/else chain.',
    ],
    remember:
      'There is no ternary operator and there never will be. Write the `if`.',
    task: 'Write FizzBuzz twice — once with if/else, once with an expressionless switch — and keep the one you would rather read.',
    exercises: [
      {
        task: 'Write the same loop four ways: three-clause, condition-only, infinite with break, and range.',
        answer:
          'All four print the same thing. `for` with parts removed is the whole loop story in Go.',
      },
      {
        task: 'Use the scoped-variable `if` form, then try to use that variable after the block.',
        answer:
          '`undefined: n`. The variable exists only inside the if and its else, which is the reason to use that form.',
      },
      {
        task: 'Write a switch with `fallthrough` and see how it differs from C.',
        answer:
          'It moves to the next case without testing its condition. In C every case falls through unless you break; in Go it is the opposite.',
      },
    ],
    refs: [
      { label: 'A Tour of Go — Flow control', href: 'https://go.dev/tour/flowcontrol/1' },
      { label: 'Effective Go', href: 'https://go.dev/doc/effective_go' },
    ],
  },

  {
    slug: 'functions-and-errors',
    title: 'Functions, multiple returns, and errors',
    navTitle: 'Functions and errors',
    oneLine: 'There are no exceptions. An error is a value you return, and that changes everything.',
    blocks: [
      {
        heading: 'What a function is, and what an error is',
        body: [
          'A **function** is a named piece of code you can run from somewhere else, optionally giving it values (**parameters**) and optionally getting values back (**return values**). Breaking a program into functions is how you stop repeating yourself and how you give names to the steps of what you are doing.',
          'Go functions can return more than one value, and that one feature shapes the whole language. It is how errors travel.',
          'An **error** is anything that stopped a function doing its job: a file that is not there, a network that did not answer, input that made no sense. Many languages use **exceptions**, which jump out of your function to a handler somewhere else. Go does not. An error is an ordinary value that gets returned alongside the result, and you check it right there.',
        ],
      },
      {
        heading: 'Functions can return more than one value',
        body: [
          'This is not a niche feature in Go. It is the mechanism the whole language is built around, because it is how errors travel.',
        ],
        code: {
          label: 'funcs.go',
          src: `func add(a, b int) int {          // a and b are both int
\treturn a + b
}

func divide(a, b float64) (float64, error) {
\tif b == 0 {
\t\treturn 0, fmt.Errorf("divide by zero")
\t}
\treturn a / b, nil                // nil means "no error"
}`,
          run: `package main

import "fmt"

func add(a, b int) int {          // a and b are both int
	return a + b
}
func divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, fmt.Errorf("divide by zero")
	}
	return a / b, nil                // nil means "no error"
}

func main() {
	_ = 0
}
`,
        },
      },
      {
        heading: 'The pattern you will write ten thousand times',
        code: {
          label: 'main.go',
          src: `res, err := divide(10, 0)
if err != nil {
\tfmt.Println("error:", err)
\treturn
}
fmt.Println(res)`,
          note: 'Check the error, handle it, return early. The happy path stays on the left margin.',
        },
      },
      {
        body: [
          'People coming from Java or Python find this verbose, and they are right — it is more lines than a `try/catch`. Here is what you get for those lines. **You can see every place a function can fail by reading it.** No hidden control flow jumps out of the middle of a function into a handler three files away. When you read Go, what you see is what runs.',
          'It also forces a decision at every failure. You cannot accidentally ignore an error, because the compiler makes you at least assign it. The lazy escape is `_`, and that stands out in review.',
        ],
      },
      {
        callout: {
          tone: 'warn',
          text: 'Never write `if err != nil { return err }` and nothing else, six layers deep. Add context: `return fmt.Errorf("loading user %d: %w", id, err)`. **Interfaces and error values** covers what `%w` does. Without context, a production error reads "not found" and you have no idea what was not found.',
        },
      },
      {
        heading: 'Variadic functions',
        code: {
          label: 'variadic.go',
          src: `func sum(nums ...int) int {       // nums is a []int inside the function
\ttotal := 0
\tfor _, n := range nums {
\t\ttotal += n
\t}
\treturn total
}

sum(1, 2, 3)

xs := []int{1, 2, 3}
sum(xs...)                        // "..." spreads a slice into the arguments`,
          run: `package main

func sum(nums ...int) int {       // nums is a []int inside the function
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}

func main() {

	sum(1, 2, 3)

	xs := []int{1, 2, 3}
	sum(xs...)                        // "..." spreads a slice into the arguments
}
`,
        },
      },
      {
        heading: 'Functions are values, and closures capture',
        body: [
          'A function can be assigned to a variable, passed as an argument, and returned. A function defined inside another one can see that outer function’s variables, and keeps them alive after it returns. That is a closure.',
        ],
        code: {
          label: 'closure.go',
          src: `counter := func() func() int {
\tc := 0                        // c lives on, captured by the returned function
\treturn func() int {
\t\tc++
\t\treturn c
\t}
}()

fmt.Println(counter(), counter(), counter())   // 1 2 3`,
          run: `package main

import "fmt"

func main() {
	counter := func() func() int {
		c := 0                        // c lives on, captured by the returned function
		return func() int {
			c++
			return c
		}
	}()

	fmt.Println(counter(), counter(), counter())   // 1 2 3
}
`,
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"errors"
	"fmt"
)

func divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, errors.New("divide by zero")
	}
	return a / b, nil
}

func main() {
	if res, err := divide(10, 2); err != nil {
		fmt.Println("error:", err)
	} else {
		fmt.Println("10 / 2 =", res)
	}

	if _, err := divide(10, 0); err != nil {
		fmt.Println("error:", err) // the branch you must not forget
	}

	defer fmt.Println("deferred 1 — runs last")
	defer fmt.Println("deferred 2")
	defer fmt.Println("deferred 3 — runs first")
	fmt.Println("main body finished")
}
`,
          canRun: true,
          note: 'Multiple returns, the error check, and defer running in reverse.',
        },
      },
    ],
    keyPoints: [
      'Errors are ordinary return values. There are no exceptions and no hidden jumps.',
      '`if err != nil { return ... }` right after the call. Handle it and return early.',
      'Always add context when you pass an error up. A bare `return err` loses the trail.',
      'Functions are values: they can be passed, returned, and can capture their surroundings.',
    ],
    remember:
      'An error is a value, not an event. Every failure point is visible in the code you are reading.',
    task: 'Write `func stats(nums ...int) (min, max int, avg float64, err error)`. Return an error for no arguments, and handle it at the call site.',
    exercises: [
      {
        task: 'Write a function returning two values, then ignore one with `_` and decide if you would flag that in review.',
        answer:
          'It compiles silently. Ignoring an error with `_` is the one a reviewer will flag, because nothing marks it as deliberate.',
      },
      {
        task: 'Write a closure counter, call it three times, then make a second one and confirm they are independent.',
        answer:
          '1, 2, 3 from the first; the second starts at 1 again. Each closure captured its own `c`.',
      },
      {
        task: 'Use a variadic function with both a list of arguments and a spread slice.',
        answer:
          '`sum(1,2,3)` and `sum(xs...)` both work. Without the `...` you get a type error, because it expects ints, not a slice.',
      },
    ],
    refs: [
      { label: 'A Tour of Go — More types', href: 'https://go.dev/tour/moretypes/1' },
      { label: 'Effective Go — Errors', href: 'https://go.dev/doc/effective_go#errors' },
    ],
  },

  {
    slug: 'defer',
    title: 'defer',
    navTitle: 'defer',
    oneLine: 'Cleanup you cannot forget — and the two traps that catch everyone once.',
    blocks: [
      {
        heading: 'What defer does',
        body: [
          '`defer` schedules a function call to run when the surrounding **function** returns — whichever path it returns by, including a panic. You write the cleanup next to the thing that needs cleaning up, and it runs even if a later line returns early.',
          'It is how Go does the job that `finally` does elsewhere, without the extra block.',
        ],
        code: {
          label: 'defer.go',
          src: `func readFile(name string) error {
\tf, err := os.Open(name)
\tif err != nil {
\t\treturn err
\t}
\tdefer f.Close()          // runs on EVERY return path below

\t// ... twenty lines with five different returns ...
\treturn nil
}`,
          note: 'Deferred calls run in reverse order, last one first — like a stack.',
        },
      },
      {
        heading: 'Trap 1 — arguments are evaluated immediately',
        body: [
          'Only the **call** is deferred. The arguments are worked out the moment you write the `defer` line, which is almost never what people expect the first time.',
        ],
        code: {
          label: 'trap1.go',
          src: `start := time.Now()

defer fmt.Println(time.Since(start))          // prints ~0s — evaluated NOW
defer func() { fmt.Println(time.Since(start)) }()   // correct: evaluated later`,
        },
      },
      {
        heading: 'Trap 2 — defer runs at function end, not block end',
        code: {
          label: 'trap2.go',
          src: `for _, name := range files {
\tf, _ := os.Open(name)
\tdefer f.Close()          // nothing closes until the WHOLE function returns
}

// Over 10,000 files you run out of file handles. The fix is to move the body
// into its own small function, so each iteration returns and its defer fires.`,
        },
      },
      {
        heading: 'Where defer really earns its place',
        body: [
          'A deferred closure can change a **named** return value. That is how a transaction helper knows whether to commit or roll back, and how you turn a panic into an ordinary error.',
        ],
        code: {
          label: 'named-return.go',
          src: `func safe() (err error) {                    // err is NAMED
\tdefer func() {
\t\tif r := recover(); r != nil {
\t\t\terr = fmt.Errorf("recovered: %v", r)   // the caller sees this
\t\t}
\t}()

\tmightPanic()
\treturn nil
}`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Always check the error from a deferred `Close` when you have been **writing**. The flush happens inside `Close`, so ignoring it can silently lose the end of a file.',
        },
      },
    ],
    keyPoints: [
      '`defer` runs when the **function** returns, not when the block ends. LIFO order.',
      'Arguments are evaluated immediately; only the call happens later.',
      '`defer` inside a loop does not run until the whole function ends.',
      'A deferred closure can modify a **named** return value — that is how rollback helpers work.',
    ],
    remember:
      'defer puts cleanup next to the thing that needs cleaning up, and runs it on every return path.',
    task: 'Write a function with three defers and predict their order before running it. Then defer `fmt.Println(time.Since(start))` and work out why it prints zero.',
    exercises: [
      {
        task: 'Open ten files in a loop with `defer f.Close()` and work out when they actually close.',
        answer:
          'None of them close until the whole function returns. Over enough files you run out of file handles.',
      },
      {
        task: 'Fix that by moving the loop body into its own function.',
        answer:
          'Each call returns, so each defer fires there. That is the standard fix and it costs one small function.',
      },
      {
        task: 'Use a deferred closure to turn a panic into a returned error.',
        answer:
          'The named return value is what makes it work — the closure assigns to `err` after `recover()` catches the panic.',
      },
    ],
    refs: [
      { label: 'A Tour of Go — More types', href: 'https://go.dev/tour/moretypes/1' },
      { label: 'Effective Go — Errors', href: 'https://go.dev/doc/effective_go#errors' },
    ],
  },

  {
    slug: 'arrays-and-slices',
    title: 'Arrays and slices',
    navTitle: 'Arrays and slices',
    oneLine: 'The data structure you use all day, and the shared-memory trap inside it.',
    blocks: [
      {
        heading: 'Arrays are fixed; you will rarely use them',
        body: [
          'In Go an array’s length is **part of its type**. `[3]int` and `[4]int` are different types, and passing an array to a function copies the whole thing. That is almost never what you want, so arrays mostly exist to be the thing a slice points at.',
        ],
        code: { label: 'array.go', src: 'var arr [3]int = [3]int{1, 2, 3}\n// arr can never hold four elements' },
      },
      {
        heading: 'Slices are what you actually use',
        body: [
          'A slice is a small three-field value: a pointer to a backing array, a length, and a capacity. Length is how many elements you can index. Capacity is how many fit before Go has to allocate a bigger array.',
        ],
        code: {
          label: 'slices.go',
          src: `s := []int{1, 2, 3}
s = append(s, 4)                  // note: append RETURNS the new slice
fmt.Println(len(s), cap(s))

s2 := make([]int, 0, 10)          // length 0, room for 10 — no reallocation yet

sub := s[1:3]                     // elements 1 and 2`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: '`append` may allocate a new array and copy, so it returns a slice. You must write `s = append(s, x)`. Calling `append(s, x)` and ignoring the result is a bug the compiler will catch, and forgetting the assignment on a different variable is one it will not.',
        },
      },
      {
        heading: 'The trap: slicing shares memory',
        body: [
          'A sub-slice does not copy. It points into the same backing array. Change one, and you have changed the other.',
        ],
        code: {
          label: 'sharing.go',
          src: `data := []int{1, 2, 3, 4, 5}
head := data[:2]
head[0] = 99
fmt.Println(data)     // [99 2 3 4 5]  — data changed too

// When you want independence, copy
cp := make([]int, len(data))
copy(cp, data)
cp[0] = 1             // data is untouched`,
          run: `package main

import "fmt"

func main() {
	data := []int{1, 2, 3, 4, 5}
	head := data[:2]
	head[0] = 99
	fmt.Println(data)     // [99 2 3 4 5]  — data changed too

	// When you want independence, copy
	cp := make([]int, len(data))
	copy(cp, data)
	cp[0] = 1             // data is untouched
}
`,
          note: 'This is the single most common surprise for people new to Go. If two pieces of code hold slices of the same array, they share it.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"fmt"
	"sort"
)

func main() {
	data := []int{1, 2, 3, 4, 5}
	head := data[:2]
	head[0] = 99
	fmt.Println("data after writing to the sub-slice:", data) // 99 is there too

	cp := make([]int, len(data))
	copy(cp, data)
	cp[0] = 1
	fmt.Println("after copy, data is untouched:", data)

	m := map[string]int{"pears": 3, "apples": 5, "figs": 1}
	fmt.Println("missing key returns:", m["kiwi"])
	v, ok := m["kiwi"]
	fmt.Println("two-value form:", v, ok)

	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys) // maps have no order, so sort to print predictably
	for _, k := range keys {
		fmt.Println(" ", k, m[k])
	}
}
`,
          canRun: true,
          note: 'The shared backing array, and why map order is random.',
        },
      },
    ],
    keyPoints: [
      'An array’s length is part of its type. You will rarely use one directly.',
      'A slice is a pointer, a length and a capacity. `append` returns a new slice — always reassign.',
      'Sub-slices share the backing array, so a write through one is visible through the other.',
      '`copy` when you need independence. `s[a:b:b]` caps the capacity so the next append reallocates.',
    ],
    remember:
      'A slice is a window onto an array, not the array itself. Two windows see each other’s writes.',
    task: 'Take a sub-slice, write to it, and print the original. Then fix it with `copy` and prove the original is untouched.',
    exercises: [
      {
        task: 'Append to a slice inside a function without returning it, and watch the caller see nothing.',
        answer:
          'The caller sees nothing. `append` may reallocate, and the function got a copy of the slice header — which is why `append` returns a value.',
      },
      {
        task: 'Call `append` on a `nil` slice and confirm it works.',
        answer:
          '`append` works and allocates. Writing to a nil map panics with `assignment to entry in nil map` — a nil slice is usable, a nil map is not.',
      },
      {
        task: 'Preallocate with `make([]T, 0, n)` and print `len` and `cap` as you append.',
        answer:
          '`len` climbs one at a time while `cap` stays at n — no reallocation. Without the capacity, cap roughly doubles as it grows.',
      },
    ],
    refs: [
      { label: 'Go Slices: usage and internals', href: 'https://go.dev/blog/slices-intro' },
      { label: 'A Tour of Go — Slices', href: 'https://go.dev/tour/moretypes/7' },
    ],
  },

  {
    slug: 'maps',
    title: 'Maps',
    navTitle: 'Maps',
    oneLine: 'A hash table with two behaviours that surprise everyone once.',
    blocks: [
      {
        heading: 'Maps',
        body: [
          'A map is a hash table. Keys must be comparable — strings, numbers, and structs are fine; slices and maps are not.',
        ],
        code: {
          label: 'maps.go',
          src: `m := map[string]int{"a": 1}
m["b"] = 2

v := m["missing"]           // 0 — a missing key returns the ZERO VALUE, no error
v, ok := m["missing"]       // v=0, ok=false — always use this two-value form

delete(m, "a")
fmt.Println(len(m))

for k, v := range m {       // ORDER IS RANDOM, on purpose
\tfmt.Println(k, v)
}`,
        },
      },
      {
        heading: 'Three map rules worth memorising now',
        bullets: [
          '**Reading a missing key is not an error.** It returns the zero value. Use `v, ok := m[k]` whenever "absent" and "zero" mean different things.',
          '**Iteration order is randomised on purpose**, so you cannot come to depend on it. To print a map in order, collect the keys into a slice, sort them, then range over the slice.',
          '**Writing to a `nil` map panics.** Reading from one is fine and gives zero values. A map field in a struct is `nil` until you `make` it.',
        ],
      },
      {
        heading: 'The modern stdlib helpers',
        body: [
          'Since Go 1.21 the `slices` and `maps` packages are in the standard library. Reach for these before writing a loop.',
        ],
        code: {
          label: 'stdlib.go',
          src: `slices.Contains(s, 3)
slices.Sort(s)
slices.SortFunc(users, func(a, b User) int { return cmp.Compare(a.Name, b.Name) })
slices.Index(s, 3)
slices.Reverse(s)
maps.Keys(m)                 // an iterator; use slices.Collect to get a slice`,
        },
      },
    ],
    keyPoints: [
      'A missing key returns the zero value, not an error. Use `v, ok := m[k]`.',
      'Iteration order is randomised on purpose. Sort the keys when order matters.',
      'Writing to a `nil` map panics; reading from one is fine.',
      'Maps are not safe for concurrent use — the runtime crashes on purpose if you try.',
    ],
    remember:
      'Absent and zero are different things. The two-value form is how you tell them apart.',
    task: 'Count word frequency with a `map[string]int`, then print the top three — which forces you to move the pairs into a slice.',
    exercises: [
      {
        task: 'Read a missing key and print the result. Then use the two-value form.',
        answer:
          'You get the zero value with no error. The two-value form is the only way to tell a missing key from one set to zero.',
      },
      {
        task: 'Write to a map declared but never made, and read the panic.',
        answer:
          '`panic: assignment to entry in nil map`. Reading from a nil map is fine; writing is not.',
      },
      {
        task: 'Range over the same map five times and watch the order change.',
        answer:
          'A different order each run. Go randomises it on purpose so you cannot come to depend on it.',
      },
    ],
    refs: [
      { label: 'Go Slices: usage and internals', href: 'https://go.dev/blog/slices-intro' },
      { label: 'A Tour of Go — Slices', href: 'https://go.dev/tour/moretypes/7' },
    ],
  },

  {
    slug: 'structs',
    title: 'Structs and struct tags',
    navTitle: 'Structs and tags',
    oneLine: 'How you make your own types, and how they turn into JSON.',
    blocks: [
      {
        heading: 'What a struct is',
        body: [
          'A **struct** is a type you define yourself by grouping other values together under one name. A user has an id, a name and an email; rather than passing three separate variables around, you define a `User` type that holds all three, and pass one thing.',
          'Structs are how you model whatever your program is actually about. Go has no classes, so this is the main tool: a struct for the data, and **methods** — functions attached to that type — for the things it can do.',
        ],
      },
      {
        heading: 'A struct groups fields',
        code: {
          label: 'struct.go',
          src: `type User struct {
\tID    int
\tName  string
\tEmail string
}

u := User{ID: 1, Name: "sahdev", Email: "s@x.com"}   // always name the fields
fmt.Println(u.Name)`,
          run: `package main

import "fmt"

type User struct {
	ID    int
	Name  string
	Email string
}

func main() {

	u := User{ID: 1, Name: "sahdev", Email: "s@x.com"}   // always name the fields
	fmt.Println(u.Name)
}
`,
          note: 'You can write `User{1, "sahdev", "s@x.com"}`, but do not. Adding a field later silently breaks every positional literal.',
        },
      },
      {
        heading: 'Assignment copies. Always.',
        body: [
          'Go has no pass-by-reference. Assigning a struct copies it, and passing one to a function copies it too. When you pass a pointer, you are passing the pointer *by value* — the copy just happens to point at the same memory.',
        ],
        code: {
          label: 'copy.go',
          src: `a := User{Name: "first"}
b := a                    // a full copy — two independent structs
b.Name = "second"
fmt.Println(a.Name)       // still "first"

p := &a                   // p is a pointer to a
p.Name = "changed"        // Go dereferences automatically — no (*p).Name needed
fmt.Println(a.Name)       // "changed"`,
        },
      },
      {
        heading: 'Embedding is composition, not inheritance',
        body: [
          'You can put one struct inside another with no field name. Its fields and methods are then promoted, so they look like they belong to the outer type.',
        ],
        code: {
          label: 'embed.go',
          src: `type Base struct {
\tID int
}

func (b Base) Describe() string { return fmt.Sprint("id=", b.ID) }

type Admin struct {
\tBase           // embedded — no field name
\tLevel int
}

a := Admin{Base: Base{ID: 1}, Level: 5}
fmt.Println(a.ID)          // promoted field
fmt.Println(a.Describe())  // promoted method`,
          run: `package main

import "fmt"

type Base struct {
	ID int
}
func (b Base) Describe() string { return fmt.Sprint("id=", b.ID) }
type Admin struct {
	Base           // embedded — no field name
	Level int
}

func main() {



	a := Admin{Base: Base{ID: 1}, Level: 5}
	fmt.Println(a.ID)          // promoted field
	fmt.Println(a.Describe())  // promoted method
}
`,
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import "fmt"

type Base struct{ ID int }

func (b Base) Describe() string { return fmt.Sprint("id=", b.ID) }

type User struct {
	Base        // embedded: ID and Describe are promoted
	Name string
}

func (u User) Display() string  { return u.Name }
func (u *User) Rename(n string) { u.Name = n } // pointer: can mutate

func main() {
	u := User{Base: Base{ID: 1}, Name: "first"}

	fmt.Println(u.Display(), u.ID, u.Describe())

	u.Rename("second") // Go takes the address for you
	fmt.Println("after Rename:", u.Name)

	copyOfU := u
	copyOfU.Rename("third")
	fmt.Println("original is still:", u.Name) // assignment copied it
}
`,
          canRun: true,
          note: 'Value and pointer receivers side by side, plus embedding.',
        },
      },
    ],
    keyPoints: [
      'A struct groups fields into one type. Always use field names in a literal.',
      'Assignment and function calls copy a struct. Go has no pass-by-reference.',
      'Struct tags are metadata read at runtime — they control JSON field names.',
      '`json:"-"` is how you make it impossible to leak a password hash.',
    ],
    remember:
      'Everything in Go is a value and every assignment is a copy.',
    task: 'Build a `User` struct with tags, marshal it to JSON, and confirm a `json:"-"` field never appears.',
    exercises: [
      {
        task: 'Copy a struct, change the copy, and print the original.',
        answer:
          'The original is unchanged. Assignment copies the whole struct.',
      },
      {
        task: 'Add `omitempty` to a field and marshal with it both set and empty.',
        answer:
          'Set, it appears. Empty, the field is gone entirely — not `null`, absent.',
      },
      {
        task: 'Make a field lowercase and watch it vanish from the JSON.',
        answer:
          'It is missing from the JSON with no error. Only exported fields are marshalled — the most common \'the API is broken\' cause.',
      },
    ],
    refs: [
      { label: 'A Tour of Go — Methods', href: 'https://go.dev/tour/methods/1' },
      { label: 'FAQ: pointer or value receiver?', href: 'https://go.dev/doc/faq#methods_on_values_or_pointers' },
    ],
  },

  {
    slug: 'methods-and-embedding',
    title: 'Methods, receivers, and embedding',
    navTitle: 'Methods and embedding',
    oneLine: 'The one rule about receivers that every beginner trips on.',
    blocks: [
      {
        heading: 'Methods are functions with a receiver',
        body: [
          'A method is just a function with an extra parameter written before the name. That parameter is the receiver, and it comes in two flavours that behave very differently.',
        ],
        code: {
          label: 'methods.go',
          src: `// VALUE receiver — gets a copy. Cannot change the original.
func (u User) Display() string {
\treturn u.Name + " <" + u.Email + ">"
}

// POINTER receiver — can change the original.
func (u *User) Rename(n string) {
\tu.Name = n
}

u := User{Name: "old"}
u.Rename("new")           // Go takes the address for you
fmt.Println(u.Name)       // "new"`,
        },
      },
      {
        heading: 'Which receiver do I use?',
        table: {
          headers: ['Use a pointer receiver when', 'Use a value receiver when'],
          rows: [
            ['The method changes the struct', 'The type is small and you never mutate it'],
            ['The struct is large (copying costs)', 'You want the type usable as a map key'],
            ['The struct contains a `sync.Mutex`', 'The type is naturally a value, like `time.Time`'],
            ['**Any other method already needs one**', ''],
          ],
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Be consistent. Mixing value and pointer receivers on one type is a review comment every time, and it causes the confusing "does not implement the interface" error you will meet tomorrow. If one method needs a pointer, make them all pointers.',
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'This is **not** inheritance. An `Admin` is not a `Base` — you cannot pass one where the other is expected, and `Describe` cannot see `Admin.Level`. There are no virtual methods in Go. When you want one type to stand in for another, that is an interface, which is tomorrow.',
        },
      },
    ],
    keyPoints: [
      'A value receiver gets a copy; a pointer receiver can mutate the original.',
      'Pointer receiver when you mutate, the struct is large, or it holds a mutex — then use it for all methods.',
      'Embedding promotes fields and methods, but it is composition, not inheritance.',
      'An `Admin` is not a `Base`. There are no virtual methods in Go.',
    ],
    remember:
      'If one method needs a pointer receiver, make them all pointer receivers.',
    task: 'Give a `Rectangle` an `Area()` value receiver and a `Scale()` pointer receiver, then prove calling `Scale` on a copy leaves the original alone.',
    exercises: [
      {
        task: 'Embed one struct in another and call a promoted method.',
        answer:
          'It works. Then passing the outer type where the inner is expected fails: promotion is syntax, not inheritance.',
      },
      {
        task: 'Try passing the outer type where the embedded one is expected, and read the error.',
        answer:
          '`cannot use u (variable of type User) as Base value`. An `Admin` is not a `Base`.',
      },
      {
        task: 'Mix value and pointer receivers on one type and see what `go vet` says.',
        answer:
          '`go vet` may stay quiet, but interface satisfaction breaks: only `*T` has both method sets, so `var s Shape = User{}` fails.',
      },
    ],
    refs: [
      { label: 'A Tour of Go — Methods', href: 'https://go.dev/tour/methods/1' },
      { label: 'FAQ: pointer or value receiver?', href: 'https://go.dev/doc/faq#methods_on_values_or_pointers' },
    ],
  },

  {
    slug: 'interfaces',
    title: 'Interfaces',
    navTitle: 'Interfaces',
    oneLine: 'The one abstraction Go gives you — and it works by accident, on purpose.',
    blocks: [
      {
        heading: 'There is no "implements" keyword',
        body: [
          'An interface lists method names. **Any type with those methods satisfies it automatically.** You never declare the relationship. The type does not need to know the interface exists, and the interface can be written years later by someone else.',
          'That sounds like a small detail. It is the reason `io.Reader` works with files, network connections, buffers, gzip streams, and HTTP bodies — none of which were written with each other in mind.',
        ],
        code: {
          label: 'interface.go',
          src: `type Shape interface {
\tArea() float64
}

type Circle struct{ R float64 }
func (c Circle) Area() float64 { return math.Pi * c.R * c.R }

type Rect struct{ W, H float64 }
func (r Rect) Area() float64 { return r.W * r.H }

// Both satisfy Shape. Neither says so.
shapes := []Shape{Circle{2}, Rect{3, 4}}
for _, s := range shapes {
\tfmt.Println(s.Area())
}`,
          run: `package main

import (
	"fmt"
	"math"
)

type Shape interface {
	Area() float64
}
type Circle struct{ R float64 }
func (c Circle) Area() float64 { return math.Pi * c.R * c.R }
type Rect struct{ W, H float64 }
func (r Rect) Area() float64 { return r.W * r.H }

func main() {



	// Both satisfy Shape. Neither says so.
	shapes := []Shape{Circle{2}, Rect{3, 4}}
	for _, s := range shapes {
		fmt.Println(s.Area())
	}
}
`,
        },
      },
      {
        heading: 'Small interfaces are the good ones',
        body: [
          '"The bigger the interface, the weaker the abstraction." The best interfaces in the standard library have one method. `io.Reader` has `Read`. `error` has `Error`. `http.Handler` has `ServeHTTP`. A one-method interface is easy to satisfy, so everything plugs into it.',
        ],
        bullets: [
          '**Accept interfaces, return structs.** Take the narrowest thing you need as a parameter; return the concrete type so callers keep every method.',
          '**Do not create an interface until you have a second implementation or a test that needs a fake.** A one-implementation interface is pure indirection — it makes you jump through a file to find real code and buys nothing.',
        ],
      },
      {
        heading: 'The nil interface trap',
        body: [
          'This is the most famous bug in Go, and you should meet it now rather than in production. An interface value holds two things: a type, and a value. It is `nil` only when **both** are empty.',
        ],
        code: {
          label: 'niltrap.go',
          src: `type MyError struct{}
func (e *MyError) Error() string { return "boom" }

func doWork() error {
\tvar e *MyError = nil      // a nil POINTER
\treturn e                  // wrapped into an interface: type=*MyError, value=nil
}

if err := doWork(); err != nil {
\tfmt.Println("this DOES print")   // err is not nil! The type half is set.
}`,
          run: `package main

import "fmt"

type MyError struct{}
func (e *MyError) Error() string { return "boom" }
func doWork() error {
	var e *MyError = nil      // a nil POINTER
	return e                  // wrapped into an interface: type=*MyError, value=nil
}

func main() {


	if err := doWork(); err != nil {
		fmt.Println("this DOES print")   // err is not nil! The type half is set.
	}
}
`,
          note: 'The fix is simple: never return a concrete error variable. Return the literal `nil`.',
        },
      },
      {
        code: {
          label: 'niltrap-fixed.go',
          src: `func doWork() error {
\tif somethingWrong {
\t\treturn &MyError{}
\t}
\treturn nil                // correct — a true nil interface
}`,
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"errors"
	"fmt"
)

type Shape interface{ Area() float64 }

type Rect struct{ W, H float64 }

func (r Rect) Area() float64 { return r.W * r.H }

type MyError struct{ Field string }

func (e *MyError) Error() string { return e.Field + " is invalid" }

var ErrNotFound = errors.New("not found")

func broken() error {
	var e *MyError = nil
	return e // a nil POINTER inside a non-nil interface
}

func main() {
	var s Shape = Rect{3, 4} // no "implements" needed
	fmt.Println("area:", s.Area())

	if err := broken(); err != nil {
		fmt.Println("the nil trap: err != nil is TRUE") // surprising, and correct
	}

	wrapped := fmt.Errorf("loading user 5: %w", ErrNotFound)
	fmt.Println(wrapped)
	fmt.Println("errors.Is finds it:", errors.Is(wrapped, ErrNotFound))

	var me *MyError
	if errors.As(fmt.Errorf("wrap: %w", &MyError{Field: "email"}), &me) {
		fmt.Println("errors.As gave us the field:", me.Field)
	}
}
`,
          canRun: true,
          note: 'Implicit satisfaction, and the nil-interface trap that catches everyone.',
        },
      },
    ],
    keyPoints: [
      'Interfaces are satisfied implicitly. Any type with the methods qualifies.',
      'The smaller the interface, the more useful. One method is the ideal.',
      'Accept interfaces, return structs — and define the interface where it is used.',
      'An interface holding a nil pointer is not nil. Return the literal `nil`.',
    ],
    remember:
      'Do not create an interface until there is a second implementation or a test that needs a fake.',
    task: 'Write a `Shape` interface with two implementations and a function taking `[]Shape`. Then reproduce the nil-interface trap and fix it.',
    exercises: [
      {
        task: 'Add `var _ Shape = (*Circle)(nil)` then delete a method and read the compile error.',
        answer:
          'The compile fails immediately at that line, naming the missing method — a free assertion that costs nothing at runtime.',
      },
      {
        task: 'Return a nil `*MyError` as an `error` and check `err != nil`.',
        answer:
          '`err != nil` is true. The interface has a type but no value, so it is not nil. Return the literal `nil` instead.',
      },
      {
        task: 'Write a function taking `io.Writer` and call it with a file, a buffer and `os.Stdout`.',
        answer:
          'All three work unchanged. One method is why a file, a buffer and stdout are interchangeable.',
      },
    ],
    refs: [
      { label: 'A Tour of Go — Interfaces', href: 'https://go.dev/tour/methods/9' },
      { label: 'Go blog: Errors are values', href: 'https://go.dev/blog/errors-are-values' },
    ],
  },

  {
    slug: 'error-values',
    title: 'Error values in depth',
    navTitle: 'Error values',
    oneLine: 'Sentinels, custom types, wrapping — and handling each error exactly once.',
    blocks: [
      {
        heading: 'error is just an interface',
        body: [
          'Now that you know what an interface is, `error` stops being magic. It is this, and nothing more:',
        ],
        code: { label: 'builtin', src: 'type error interface {\n\tError() string\n}' },
      },
      {
        heading: 'The four kinds of error you will write',
        code: {
          label: 'errors.go',
          src: `// 1. Ad-hoc — a message, wrapping what went wrong underneath
return fmt.Errorf("parsing config line %d: %w", n, err)

// 2. Sentinel — the caller needs to branch on this exact case
var ErrNotFound = errors.New("not found")
if errors.Is(err, ErrNotFound) { ... }

// 3. Custom type — the caller needs DATA out of the error
type ValidationError struct{ Field, Msg string }
func (e *ValidationError) Error() string { return e.Field + ": " + e.Msg }

var ve *ValidationError
if errors.As(err, &ve) {
\tfmt.Println("bad field:", ve.Field)
}

// 4. Joined — report every failure, not just the first
return errors.Join(errs...)`,
        },
      },
      {
        heading: 'Wrapping: %w versus %v',
        bullets: [
          '`%w` keeps the original error in a chain, so `errors.Is` and `errors.As` can still see it. This is the default choice.',
          '`%v` flattens it to text and breaks the chain. Use it on purpose when you want to *hide* an internal error from the caller.',
          '**Add context, do not restate.** Six layers each saying "failed to" gives you a useless sentence. Say what you were doing, with what: `fmt.Errorf("get user %d: %w", id, err)`.',
          '**Handle an error once.** Either log it or return it — never both, or one failure fills your logs five times.',
        ],
      },
    ],
    keyPoints: [
      '`error` is just an interface with one method. Nothing about it is magic.',
      '`errors.Is` for "which error is this", `errors.As` for "give me its data".',
      '`%w` keeps the chain so `Is` and `As` can see through it. `%v` breaks it, which is sometimes what you want.',
      'Handle an error once — log it or return it, never both.',
    ],
    remember:
      'Add context, do not restate. Say what you were doing, with what.',
    task: 'Define a sentinel error and a custom error type, wrap both with `%w`, and retrieve them with `errors.Is` and `errors.As`.',
    exercises: [
      {
        task: 'Wrap an error three layers deep and print the whole chain.',
        answer:
          'You get one sentence with each layer\'s context. If every layer says \'failed to\', it is useless — say what you were doing, with what.',
      },
      {
        task: 'Swap one `%w` for `%v` and watch `errors.Is` stop finding it.',
        answer:
          '`errors.Is` stops finding it. `%v` flattens the error to text and breaks the chain — sometimes what you want, to hide internals.',
      },
      {
        task: 'Use `errors.Join` to report three validation failures at once.',
        answer:
          'All three messages appear, and `errors.Is` still finds each one. This is how you validate a whole form at once.',
      },
    ],
    refs: [
      { label: 'A Tour of Go — Interfaces', href: 'https://go.dev/tour/methods/9' },
      { label: 'Go blog: Errors are values', href: 'https://go.dev/blog/errors-are-values' },
    ],
  },

  {
    slug: 'packages',
    title: 'Packages and visibility',
    navTitle: 'Packages',
    oneLine: 'A folder is a package, and capitalisation is your access control.',
    blocks: [
      {
        heading: 'Three things you need before writing anything real',
        body: [
          'A **package** is a folder of Go files compiled together. It is how you split a growing program into pieces, and it is the only privacy Go has: capitalised names are visible outside the package, lowercase names are not.',
          '**JSON** is the text format almost every web API sends and receives. Go can turn a struct into JSON and back again, using the field tags you met with structs — so JSON is really about describing your types accurately.',
          'A **test** is code that runs your code and fails loudly when the answer is wrong. Testing is part of the Go toolchain, not a library you pick: a file ending `_test.go`, a function starting `Test`, and `go test`. There is nothing to install and nothing to configure.',
        ],
      },
      {
        heading: 'A folder is a package',
        body: [
          'Every `.go` file declares a package, and every file in one folder must declare the same one. Visibility is decided by **capitalisation**: a name starting with a capital letter is exported and visible outside the package; a lowercase name is private to it. There is no `public` or `private` keyword.',
        ],
        code: {
          label: 'layout',
          src: `d07/
  go.mod            module d07
  main.go           package main
  calc/
    calc.go         package calc
    calc_test.go    package calc`,
        },
      },
      {
        code: {
          label: 'calc/calc.go',
          src: `package calc

// Add is visible outside the package because it starts with a capital.
func Add(a, b int) int { return a + b }

// helper is private to this package.
func helper() {}`,
        },
      },
      {
        code: {
          label: 'main.go',
          src: `package main

import (
\t"fmt"

\t"d07/calc"        // module path + folder
)

func main() {
\tfmt.Println(calc.Add(2, 3))
}`,
          note: 'The package name is part of every call, so `calc.Add` reads well and `calc.CalcAdd` does not. Never stutter.',
        },
      },
    ],
    keyPoints: [
      'Every file in one folder declares the same package name.',
      'Capitalised names are exported; lowercase ones are private to the package.',
      'The import path is the module path plus the folder.',
      'There is no `public` or `private` keyword, and none is needed.',
    ],
    remember:
      'Capitalisation is not style. It is the access modifier.',
    task: 'Split working code into two packages, make one function lowercase, and watch the import break.',
    exercises: [
      {
        task: 'Create a `calc` package and call it from `main`.',
        answer:
          'The import path is your module name plus the folder. Lowercase the function and the import breaks with `undefined`.',
      },
      {
        task: 'Use a blank import (`_ "net/http/pprof"`) and work out what it is for.',
        answer:
          'It runs the package\'s `init()` and nothing else — here, registering pprof\'s HTTP handlers on the default mux.',
      },
      {
        task: 'Alias an import and use the alias.',
        answer:
          'Works normally. Aliases exist for name clashes between two packages with the same final path segment.',
      },
    ],
    refs: [
      { label: 'Tutorial: add a test', href: 'https://go.dev/doc/tutorial/add-a-test' },
      { label: 'Organizing a Go module', href: 'https://go.dev/doc/modules/layout' },
    ],
  },

  {
    slug: 'json',
    title: 'JSON',
    navTitle: 'JSON',
    oneLine: 'Turning structs into JSON and back, and the field that silently disappears.',
    blocks: [
      {
        heading: 'JSON, both directions',
        code: {
          label: 'json.go',
          src: `type User struct {
\tID        int       \`json:"id"\`
\tName      string    \`json:"name"\`
\tPassword  string    \`json:"-"\`
\tCreatedAt time.Time \`json:"created_at"\`
\tBio       string    \`json:"bio,omitempty"\`
}

b, err := json.Marshal(u)          // struct -> bytes

var u2 User
err = json.Unmarshal(b, &u2)       // bytes -> struct. Note the & — it needs a pointer.`,
          note: 'Unmarshal must be given a pointer, or it has nothing to write into. Forgetting the `&` is a day-one mistake everybody makes once.',
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Only **exported** (capitalised) fields are marshalled. A lowercase field is invisible to `encoding/json` and will silently be missing from your API response.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"encoding/json"
	"fmt"
)

type User struct {
	ID       int    \`json:"id"\`
	Name     string \`json:"name"\`
	Password string \`json:"-"\`              // never serialised
	Bio      string \`json:"bio,omitempty"\`  // dropped when empty
	internal string                         // lowercase: invisible to json
}

func main() {
	u := User{ID: 1, Name: "sahdev", Password: "hunter2", internal: "hidden"}

	b, _ := json.MarshalIndent(u, "", "  ")
	fmt.Println(string(b)) // no password, no bio, no internal

	var back User
	if err := json.Unmarshal([]byte(\`{"id":7,"name":"other"}\`), &back); err != nil {
		fmt.Println("error:", err)
	}
	fmt.Printf("%+v\\n", back)
}
`,
          canRun: true,
          note: 'Watch the lowercase field vanish from the JSON.',
        },
      },
    ],
    keyPoints: [
      'Only **exported** fields are marshalled. A lowercase field is silently missing.',
      '`Unmarshal` needs a pointer, or it has nothing to write into.',
      '`json:"-"` never serialises; `omitempty` drops the field when it is empty.',
      'The struct tags are your API’s response shape.',
    ],
    remember:
      'If a field is missing from your API response, check its first letter.',
    task: 'Marshal a struct with one lowercase field and one `json:"-"` field, and confirm neither appears.',
    exercises: [
      {
        task: 'Forget the `&` in `Unmarshal` and read the error.',
        answer:
          '`json: Unmarshal(non-pointer main.User)`. It needs an address to write into.',
      },
      {
        task: 'Decode JSON with an unknown field, then add `DisallowUnknownFields` and try again.',
        answer:
          'By default it is silently ignored. With `DisallowUnknownFields` you get an error — which turns a client typo into a 400 instead of silence.',
      },
      {
        task: 'Marshal a `time.Time` and see what format Go chooses.',
        answer:
          'RFC 3339, like `2026-09-08T16:04:05Z`. That is the format Go picks and it is the one you want in an API.',
      },
    ],
    refs: [
      { label: 'Tutorial: add a test', href: 'https://go.dev/doc/tutorial/add-a-test' },
      { label: 'Organizing a Go module', href: 'https://go.dev/doc/modules/layout' },
    ],
  },

  {
    slug: 'testing',
    title: 'Testing',
    navTitle: 'Testing',
    oneLine: 'Part of the toolchain, not a library you pick.',
    blocks: [
      {
        heading: 'Testing is part of the toolchain',
        body: [
          'A test file ends in `_test.go` and sits in the same folder as the code it tests. Each test is a function starting with `Test` that takes a `*testing.T`. That is the whole setup — no framework to choose, no config file, no annotations.',
          'You run them with `go test`. It compiles the package plus its tests and reports what failed.',
        ],
      },
      {
        heading: 'The Go convention: table-driven tests',
        body: [
          'Rather than one function per case, you put the cases in a slice and loop over them. Adding the twelfth case becomes one line, and `t.Run` gives each case a name you can run on its own.',
        ],
        code: {
          label: 'calc/calc_test.go',
          src: `package calc

import "testing"

func TestAdd(t *testing.T) {
\ttests := []struct {
\t\tname       string
\t\ta, b, want int
\t}{
\t\t{"positive", 2, 3, 5},
\t\t{"zero", 0, 0, 0},
\t\t{"negative", -1, -1, -2},
\t}

\tfor _, tt := range tests {
\t\tt.Run(tt.name, func(t *testing.T) {
\t\t\tif got := Add(tt.a, tt.b); got != tt.want {
\t\t\t\tt.Errorf("Add(%d, %d) = %d, want %d", tt.a, tt.b, got, tt.want)
\t\t\t}
\t\t})
\t}
}`,
          note: 'The failure message should always include what you got and what you wanted. "failed" tells you nothing at 3am.',
        },
      },
      {
        heading: 'Running them',
        code: {
          label: 'terminal',
          src: `go test ./...                      # everything
go test -v ./...                   # name every test as it runs
go test -cover ./...               # how much of the package is exercised
go test -run 'TestAdd/negative' ./calc    # exactly one subtest
go test -race ./...                # find data races — run this in CI`,
        },
      },
      {
        heading: 'Error versus Fatal',
        bullets: [
          '`t.Error` records the failure and **keeps going** — use it when the rest of the checks still make sense.',
          '`t.Fatal` records it and **stops that subtest** — use it when continuing would panic, like after a failed setup.',
          '`t.Helper()` inside a helper function makes failures point at the caller, not at the helper.',
          '`t.Cleanup(fn)` runs teardown even when the test fails, and works from inside helpers where `defer` would not.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'Coverage tells you what is **definitely untested**. It does not tell you what is well tested. Cover your business logic and your error paths, and do not chase 100% — that only produces tests that assert nothing.',
        },
      },
    ],
    keyPoints: [
      'A `_test.go` file next to the code, a `TestXxx(t *testing.T)` function, and `go test`.',
      'Table-driven tests are the Go standard: cases as data, one loop, `t.Run` for subtests.',
      '`go test -run "TestX/case_name"` runs exactly one case.',
      '`t.Error` continues; `t.Fatal` stops that subtest.',
    ],
    remember:
      'There is nothing to install and nothing to configure. Testing ships with the language.',
    task: 'Write a table-driven test with four cases, then run just one of them by name.',
    exercises: [
      {
        task: 'Add a failing case and read how the failure is reported.',
        answer:
          'It names the subtest and your message. That is why the message should include got and want, not just \'failed\'.',
      },
      {
        task: 'Run `go test -v -cover ./...` and read the coverage number.',
        answer:
          'A percentage per package. It tells you what is definitely untested — not what is well tested.',
      },
      {
        task: 'Move your test into `package foo_test` and see what breaks.',
        answer:
          'Unexported identifiers stop being visible. That is useful: it forces the test to use your public API.',
      },
    ],
    refs: [
      { label: 'Tutorial: add a test', href: 'https://go.dev/doc/tutorial/add-a-test' },
      { label: 'Organizing a Go module', href: 'https://go.dev/doc/modules/layout' },
    ],
  },
]
