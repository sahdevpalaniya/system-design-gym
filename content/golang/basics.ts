import type { LangLesson } from '@/lib/types'

/** The language itself. Assumes nothing: no Go, no compiled language, no pointers. */
export const BASICS: LangLesson[] = [
  {
    slug: 'setup-and-first-program',
    title: 'Setup, your first program, and the toolchain',
    navTitle: 'Setup and first program',
    oneLine: 'Install Go, run one file, and meet the four commands you will use every day.',
    objectives: [
      'Write and run a `package main` program with `go run .`.',
      'Explain what the zero value of an `int`, a `string` and a `bool` is.',
      'Predict what `go build`, `go fmt` and `go vet` each do before you run them.',
    ],
    blocks: [
      {
        body: [
          'Go is a compiled language. You write a `.go` file, the compiler turns it into a single machine-code binary, and you run that. There is no interpreter to install on the server and no virtual machine. That one fact explains most of what people like about Go: you build one file and copy it anywhere.',
          'First, install it. Pick your system below. Every option installs the same thing: the compiler, the standard library and the `go` command.',
        ],
        code: { label: 'terminal', src: 'go version\n# go version go1.25.1 linux/amd64' },
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
curl -LO https://go.dev/dl/go1.25.1.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.1.linux-amd64.tar.gz

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
# go version go1.25.1 linux/amd64

go env GOPATH
# /home/you/go   — where downloaded packages live. You rarely need to touch it.`,
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Nothing else to install. No package manager to set up, no virtual environment, no build tool. The `go` command does all of it.',
        },
      },
      {
        heading: 'You can also run Go without installing anything',
        body: [
          'Every code block on this site with a **▶ Run** button executes on the official Go Playground, so you can work through the language topics in a browser before you install anything. Press Run, change the code, press Run again.',
          'You will need a real installation from the practice projects onwards, because those use files, folders and a database. The playground has none of them.',
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
          ],
        },
      },
      {
        body: [
          'Because of this you never get a "cannot read property of undefined" style crash from an unset variable. The other types you will meet later also have zero values, and each lesson says what they are.',
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
          text: 'Go has one formatting style, and `go fmt` applies it. Tabs, brace placement and spacing are decided for you, so a Go team has nothing to argue about there. Most editors run it on save; if yours does not, run it before every commit.',
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
      {
        heading: 'Build this: your first win',
        body: [
          'A tiny program that does a real job: split a bill. Put it in `main.go` in your `d01` folder and run `go run .`. Then change the numbers and run it again.',
        ],
        code: {
          label: 'main.go — split a bill',
          src: `package main

import "fmt"

func main() {
	total := 84.50
	people := 4

	share := total / float64(people)
	fmt.Println("Total:", total)
	fmt.Println("People:", people)
	fmt.Println("Each pays:", share)
}
`,
          canRun: true,
          note: '`float64(people)` turns the whole number into a decimal so the two can be divided. **Type conversion** explains why Go makes you write that.',
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
      'Go compiles to one self-contained binary with nothing to install beside it, and every variable starts at a defined zero value. Those two facts shape most of the language.',
    task: 'Print your name, age, and whether you are a student, using all three declaration styles. Then declare a variable of each basic type without assigning it and print them, to see the zero values yourself.',
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
    objectives: [
      'Write explicit conversions between `int`, `float64` and a named type.',
      'Explain why `string(rune(65))` gives "A" while `strconv.Itoa(65)` gives "65".',
      'Predict the output of `len` on a string with non-English characters.',
    ],
    blocks: [
      {
        heading: 'Go never converts a type for you',
        body: [
          'In most languages, an `int` next to a `float` is converted to a float for you. Go refuses. You write every conversion yourself.',
          'This feels fussy until the first time it saves you. Implicit numeric conversion is where money code loses paise, and where an `int64` is squeezed into an `int32` with no warning. Go decided the cost of typing `float64(a)` is lower than the cost of finding that bug.',
        ],
        code: {
          label: 'conversion.go',
          src: `var a int = 10
var b float64 = float64(a)   // required. "var b float64 = a" does not compile.
var c int64 = int64(a)

// Strings convert to and from byte and rune slices
s := "héllo"
bs := []byte(s)   // the raw bytes
rs := []rune(s)   // the unicode characters

fmt.Println(len(s), len(bs), len(rs))   // 6 6 5`,
          note: '`len` on a string counts BYTES, not characters, so "héllo" is 6 bytes but 5 runes. **Strings, bytes, and runes** covers why.',
        },
      },
      {
        heading: 'Numbers and text: strconv, not a cast',
        body: [
          'A cast like `float64(a)` changes one number type into another. Turning the number 42 into the text "42", or back, is a different job. That is what the `strconv` package is for, and the text side can fail, so it returns an error.',
        ],
        code: {
          label: 'strconv.go',
          src: `package main

import (
	"fmt"
	"strconv"
)

func main() {
	s := strconv.Itoa(42)                  // "42"
	n, err := strconv.Atoi("42")           // 42, nil
	fmt.Println(s, n, err)

	f, err := strconv.ParseFloat("3.14", 64)
	fmt.Println(f, err)

	b, err := strconv.ParseBool("true")
	fmt.Println(b, err)

	fmt.Println(strconv.FormatInt(255, 16)) // "ff"
}
`,
          canRun: true,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: '`string(65)` gives you `"A"`, not `"65"`. It converts a code point to a character. To turn a number into its text form you need `strconv.Itoa`. `go vet` flags `string(n)` on an int for this reason, which is why code here writes `string(rune(65))` when it really wants the character.',
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
          note: 'Every conversion here is written out. This is the one place in the course that covers `strconv`, so keep it handy. Delete one and see what the compiler says.',
        },
      },
    ],
    keyPoints: [
      'Every conversion between types is written out by you. Go never widens silently.',
      '`float64(a)`, `int64(a)`, `[]byte(s)`, `[]rune(s)`: all explicit.',
      '`len` on a string counts bytes, not characters.',
      'The cost of typing the conversion is lower than the cost of finding the bug it prevents.',
    ],
    remember:
      'Implicit numeric conversion is where money code loses paise. Go makes you write it down.',
    task: 'Convert an int to a float64 and back, and a string to both `[]byte` and `[]rune`. Print the length of each.',
    exercises: [
      {
        task: 'Try `var b float64 = someInt` and read the compiler error.',
        answer:
          '`cannot use someInt (variable of type int) as float64 value in variable declaration`. Go never widens for you. Write `float64(someInt)`.',
      },
      {
        task: 'Convert a float64 with a fraction to an int and see what happens to the decimals.',
        answer:
          'The decimals are thrown away, not rounded: with `f := 3.9`, `int(f)` is 3, and -3.9 becomes -3 (it truncates toward zero). Use `int(math.Round(f))` to round. Note that `int(3.9)` written with a constant does not compile at all, because the constant would be truncated.',
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
    objectives: [
      'Write the same loop as a three-part `for`, a condition-only `for` and a `range` loop.',
      'Explain why a variable declared in `if n := ...; cond` cannot be used after the block.',
      'Predict which `switch` case runs, knowing that cases do not fall through.',
    ],
    blocks: [
      {
        heading: 'if — with a scoped variable',
        body: [
          'Go lets you declare a variable inside the `if`, scoped to the `if` and its `else`. Error handling uses this shape all the time: `if err := save(u); err != nil { ... }`.',
        ],
        code: {
          label: 'flow.go',
          src: `s := "golang"
if n := len(s); n > 3 {
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
          text: 'There is no ternary operator in Go, and the Go FAQ explains why it was left out on purpose. Write the `if`. It is longer, and it stays readable when the condition grows.',
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

i := 0
for i < 5 { i++ }                 // no init or post: this is a while loop

for { break }                     // no condition at all: infinite

for i, ch := range "héllo" {      // range over a string gives byte index + rune
\tfmt.Println(i, string(ch))
}

nums := []int{10, 20, 30}         // a slice: a list of values (Arrays and slices covers them)
for i, v := range nums {          // index and value
\tfmt.Println(i, v)
}
for _, v := range nums {          // "_" throws the index away
\tfmt.Println(v)
}`,
          note: '`range` also works on maps, which you will meet in **Maps**. Their order is random, on purpose.',
        },
      },
      {
        heading: 'switch — cleaner than it is elsewhere',
        body: [
          'Two things differ from C and Java. Cases do not fall through, so you never write `break`. And a `switch` with no expression is a tidy if/else chain, which is how most Go code writes three or more branches.',
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
age := 30
switch {
case age < 13:
\tfmt.Println("child")
case age < 20:
\tfmt.Println("teenager")
default:
\tfmt.Println("adult")
}`,
          note: 'If you do want fall-through, the keyword is `fallthrough`. You will rarely need it.',
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
      'There is no ternary operator. Write the `if`.',
    task: 'Write FizzBuzz twice, once with if/else and once with an expressionless switch, and keep the one you would rather read.',
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
    challenge: {
      prompt:
        'Write `Grade(score int) string`. 90 to 100 is "A", 75 to 89 is "B", 50 to 74 is "C", 0 to 49 is "F", and anything below 0 or above 100 is "invalid". Example: `Grade(82)` → "B", `Grade(101)` → "invalid". Use a `switch` with no expression. The `func` line is written for you; the next lesson, **Functions and errors**, explains it.',
      starter: `package main

// Grade turns a score from 0 to 100 into a letter.
func Grade(score int) string {
\treturn ""
}
`,
      test: `package main

import "testing"

func TestGrade(t *testing.T) {
\ttests := []struct {
\t\tscore int
\t\twant  string
\t}{
\t\t{95, "A"}, {100, "A"}, {90, "A"},
\t\t{89, "B"}, {75, "B"},
\t\t{74, "C"}, {50, "C"},
\t\t{49, "F"}, {0, "F"},
\t\t{-1, "invalid"}, {101, "invalid"},
\t}
\tfor _, tt := range tests {
\t\tif got := Grade(tt.score); got != tt.want {
\t\t\tt.Errorf("Grade(%v) = %q, want %q", tt.score, got, tt.want)
\t\t}
\t}
}
`,
      solution: `package main

// Grade turns a score from 0 to 100 into a letter.
func Grade(score int) string {
\tswitch {
\tcase score < 0 || score > 100:
\t\treturn "invalid"
\tcase score >= 90:
\t\treturn "A"
\tcase score >= 75:
\t\treturn "B"
\tcase score >= 50:
\t\treturn "C"
\tdefault:
\t\treturn "F"
\t}
}
`,
    },
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
    objectives: [
      'Write a function that returns a result and an `error`, and check the error at the call site.',
      'Explain why Go returns errors as values instead of throwing exceptions.',
      'Write a variadic function and a closure that keeps its own state.',
    ],
    blocks: [
      {
        heading: 'What a function is, and what an error is',
        body: [
          'A **function** is a named piece of code you can run from somewhere else, optionally giving it values (**parameters**) and optionally getting values back (**return values**). Breaking a program into functions is how you stop repeating yourself and how you give names to the steps of what you are doing.',
          'Go functions can return more than one value, and errors travel that way.',
          'An **error** is anything that stopped a function doing its job: a file that is not there, a network that did not answer, input that made no sense. Many languages use **exceptions**, which jump out of your function to a handler somewhere else. Go does not. An error is an ordinary value that gets returned alongside the result, and you check it right there.',
        ],
      },
      {
        heading: 'Functions can return more than one value',
        body: [
          'The usual shape is a result plus an `error` as the last return value. Almost every function in the standard library that can fail looks like this.',
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
	fmt.Println(add(2, 3)) // 5

	res, err := divide(10, 4)
	fmt.Println(res, err) // 2.5 <nil>

	res, err = divide(1, 0)
	fmt.Println(res, err) // 0 divide by zero
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
          'People coming from Java or Python find this verbose, and they are right: it is more lines than a `try/catch`. What you get for those lines is this. **You can see every place a function can fail by reading it.** No hidden control flow jumps out of the middle of a function into a handler three files away.',
          'It also pushes you to decide at every failure. Once you write `res, err :=`, the compiler rejects an `err` you never use, and the escape hatch `_` stands out in review. It is not a guarantee: calling `divide(10, 0)` as a bare statement drops both results and still compiles. Linters such as `errcheck` catch that case.',
        ],
      },
      {
        callout: {
          tone: 'warn',
          text: 'Do not pass a bare `return err` up six layers. Add context: `return fmt.Errorf("loading user %d: %w", id, err)`. **Error values in depth** covers what `%w` does. Without context, a production error reads "not found" and you have no idea what was not found.',
        },
      },
      {
        heading: 'Variadic functions',
        code: {
          label: 'variadic.go',
          src: `// inside the function, nums is a []int
func sum(nums ...int) int {
\ttotal := 0
\tfor _, n := range nums {
\t\ttotal += n
\t}
\treturn total
}

// calling it, inside main or any other function:
fmt.Println(sum(1, 2, 3))         // 6

xs := []int{1, 2, 3}
fmt.Println(sum(xs...))           // 6 — "..." spreads a slice into the arguments`,
          note: 'Excerpt: the last three lines go inside a function body. `[]int{1, 2, 3}` is a slice, a growable list (preview — explained in Arrays and slices).',
          run: `package main

import "fmt"

func sum(nums ...int) int {       // nums is a []int inside the function
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}

func main() {
	fmt.Println(sum(1, 2, 3))         // 6
	fmt.Println(sum())                // 0 — no arguments is fine

	xs := []int{4, 5, 6}
	fmt.Println(sum(xs...))           // 15 — "..." spreads a slice into the arguments
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
		return
	}
	fmt.Println("never printed: we returned early")
}
`,
          canRun: true,
          note: 'Multiple returns, the error check, and returning early when something fails.',
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
          'It compiles with no warning. Ignoring an error with `_` is the case a reviewer should flag, unless a comment says why it is safe.',
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
    challenge: {
      prompt:
        'Write `Average(nums ...int) (float64, error)`. It returns the average of the numbers. With no numbers at all it returns 0 and an error, because there is nothing to average. Example: `Average(1, 2)` → 1.5, nil. `Average()` → 0, an error.',
      starter: `package main

// Average returns the mean of nums, or an error when there are none.
func Average(nums ...int) (float64, error) {
\treturn 0, nil
}
`,
      test: `package main

import "testing"

func TestAverage(t *testing.T) {
\ttests := []struct {
\t\tnums    []int
\t\twant    float64
\t\twantErr bool
\t}{
\t\t{[]int{1, 2, 3}, 2, false},
\t\t{[]int{1, 2}, 1.5, false},
\t\t{[]int{7}, 7, false},
\t\t{[]int{-4, 4}, 0, false},
\t\t{nil, 0, true},
\t}
\tfor _, tt := range tests {
\t\tgot, err := Average(tt.nums...)
\t\tif (err != nil) != tt.wantErr {
\t\t\tt.Errorf("Average(%v) error = %v, want error: %v", tt.nums, err, tt.wantErr)
\t\t}
\t\tif got != tt.want {
\t\t\tt.Errorf("Average(%v) = %v, want %v", tt.nums, got, tt.want)
\t\t}
\t}
}
`,
      solution: `package main

import "errors"

// Average returns the mean of nums, or an error when there are none.
func Average(nums ...int) (float64, error) {
\tif len(nums) == 0 {
\t\treturn 0, errors.New("average of no numbers")
\t}
\ttotal := 0
\tfor _, n := range nums {
\t\ttotal += n
\t}
\treturn float64(total) / float64(len(nums)), nil
}
`,
    },
    refs: [
      { label: 'A Tour of Go — More types', href: 'https://go.dev/tour/moretypes/1' },
      { label: 'Effective Go — Errors', href: 'https://go.dev/doc/effective_go#errors' },
    ],
  },

  {
    slug: 'defer',
    title: 'defer',
    navTitle: 'defer',
    oneLine: 'Cleanup you cannot forget, and the two traps that catch most people once.',
    objectives: [
      'Predict the order in which several deferred calls run.',
      'Explain why `defer fmt.Println(x)` prints the value `x` had on the defer line.',
      'Fix a loop that defers `Close` so each file is closed on time.',
    ],
    blocks: [
      {
        heading: 'What defer does',
        body: [
          '`defer` schedules a function call to run when the surrounding **function** returns, by whichever path, including a panic. You write the cleanup next to the thing that needs cleaning up, and it runs even if a later line returns early.',
          'It is how Go does the job that `finally` does elsewhere, without the extra block.',
        ],
        code: {
          label: 'real-world excerpt — opening a file (os.Open is covered in The standard library)',
          src: `func readFile(name string) error {
\tf, err := os.Open(name)
\tif err != nil {
\t\treturn err
\t}
\tdefer f.Close()          // runs on EVERY return path below

\t// ... twenty lines with five different returns ...
\treturn nil
}`,
          note: 'Deferred calls run in reverse order, last one first, like a stack.',
        },
      },
      {
        heading: 'See it run',
        body: ['Three defers, then a normal line. Watch the order: the body finishes first, then the defers run last-in, first-out (LIFO), like taking plates off a stack.'],
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import "fmt"

func main() {
	defer fmt.Println("deferred 1 — runs last")
	defer fmt.Println("deferred 2")
	defer fmt.Println("deferred 3 — runs first")

	x := 1
	defer fmt.Println("deferred x =", x) // x is read NOW, so this prints 1
	x = 99
	fmt.Println("main body finished, x =", x)
}
`,
          canRun: true,
          note: 'Output: the body line with x = 99, then "deferred x = 1", then 3, 2, 1.',
        },
      },
      {
        heading: 'Trap 1 — arguments are evaluated immediately',
        body: [
          'Only the **call** is deferred. The arguments are evaluated when the `defer` line runs, which surprises most people the first time.',
        ],
        code: {
          label: 'trap1.go (excerpt — time.Now and time.Since read the clock)',
          src: `start := time.Now()

defer fmt.Println(time.Since(start))          // prints ~0s — evaluated NOW
defer func() { fmt.Println(time.Since(start)) }()   // correct: evaluated later`,
        },
      },
      {
        heading: 'Trap 2 — defer runs at function end, not block end',
        code: {
          label: 'trap2.go (real-world excerpt)',
          src: `for _, name := range files {
\tf, _ := os.Open(name)
\tdefer f.Close()          // nothing closes until the WHOLE function returns
}

// Over 10,000 files you run out of file handles. The fix is to move the body
// into its own small function, so each iteration returns and its defer fires.`,
        },
      },
      {
        heading: 'Where defer earns its place',
        body: [
          'A deferred closure can change a **named** return value. That is how a transaction helper knows whether to commit or roll back, and how you turn a panic into an ordinary error.',
          'In plain words: a **panic** is Go crashing the current function because something went badly wrong (dividing by zero, reading past the end of a list). `recover()` is a built-in you call **inside a deferred function**: if a panic is happening it stops the crash and hands you the panic value; otherwise it returns `nil`. You will rarely need it, but this is the one pattern to recognise.',
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
          run: `package main

import "fmt"

func safeDivide(a, b int) (result int, err error) { // err is NAMED
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("recovered: %v", r) // the caller sees this
		}
	}()
	return a / b, nil // panics when b is 0
}

func main() {
	fmt.Println(safeDivide(10, 2)) // 5 <nil>
	fmt.Println(safeDivide(1, 0))  // 0 recovered: runtime error: integer divide by zero
}
`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Check the error from `Close` when you have been **writing**. For buffered writers such as `gzip.Writer`, `Close` is where the last data is flushed. For an `os.File`, a failed earlier write can be reported only at `Close` (on NFS, for example). A plain `defer f.Close()` throws that error away, and the end of the file with it.',
        },
      },
    ],
    keyPoints: [
      '`defer` runs when the **function** returns, not when the block ends. LIFO order.',
      'Arguments are evaluated immediately; only the call happens later.',
      '`defer` inside a loop does not run until the whole function ends.',
      'A deferred closure can modify a **named** return value. Rollback helpers rely on this.',
    ],
    remember:
      'defer puts cleanup next to the thing that needs cleaning up, and runs it on every return path.',
    task: 'Write a function with three defers and predict their order before running it. Then set `n := 1`, `defer fmt.Println(n)`, change `n` to 2, and work out why it prints 1. Fix it with a deferred closure so it prints 2.',
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
          'The named return value makes it work: the closure assigns to `err` after `recover()` catches the panic.',
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
    objectives: [
      'Explain the difference between a slice\'s length and its capacity.',
      'Predict the output when you write through a sub-slice.',
      'Fix a shared-memory bug with `copy` or a full slice expression `s[a:b:b]`.',
    ],
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
          text: '`append` may allocate a new array and copy, so it returns a slice. You must write `s = append(s, x)`. A bare `append(s, x)` with the result unused does not compile. `t := append(s, x)` followed by more work on `s` does compile, and is the version that bites.',
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
          note: 'This surprises most people new to Go. If two pieces of code hold slices of the same array, they share it.',
        },
      },
      {
        heading: 'Capping capacity with s[a:b:b]',
        body: [
          'A sub-slice usually keeps the spare capacity of the array behind it. So `append` on the sub-slice can write straight over elements the original still uses. A **full slice expression** `s[low:high:max]` sets the capacity to `max - low`. Write `s[a:b:b]` and capacity equals length, so the next `append` has no room and copies to a new array instead of overwriting.',
        ],
        code: {
          label: 'fullslice.go',
          src: `data := []int{1, 2, 3, 4, 5}

a := data[0:2]          // len 2, cap 5 — spare room is data's elements
a = append(a, 99)
fmt.Println(data)       // [1 2 99 4 5] — append overwrote data[2]!

data = []int{1, 2, 3, 4, 5}
b := data[0:2:2]        // len 2, cap 2 — no spare room
b = append(b, 99)       // must copy to a new array
fmt.Println(data)       // [1 2 3 4 5] — untouched
fmt.Println(b)          // [1 2 99]`,
          run: `package main

import "fmt"

func main() {
	data := []int{1, 2, 3, 4, 5}

	a := data[0:2]          // len 2, cap 5 — spare room is data's elements
	a = append(a, 99)
	fmt.Println(data)       // [1 2 99 4 5] — append overwrote data[2]!

	data = []int{1, 2, 3, 4, 5}
	b := data[0:2:2]        // len 2, cap 2 — no spare room
	b = append(b, 99)       // must copy to a new array
	fmt.Println(data)       // [1 2 3 4 5] — untouched
	fmt.Println(b)          // [1 2 99]
}
`,
          note: 'Use `s[a:b:b]` when you hand a piece of your slice to other code and do not want its appends to touch your data.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import "fmt"

func main() {
	data := []int{1, 2, 3, 4, 5}
	head := data[:2]
	head[0] = 99
	fmt.Println("data after writing to the sub-slice:", data) // 99 is there too

	cp := make([]int, len(data))
	copy(cp, data)
	cp[0] = 1
	fmt.Println("after copy, data is untouched:", data)

	safe := data[0:2:2]
	safe = append(safe, 7)
	fmt.Println("capped append left data alone:", data, safe)
}
`,
          canRun: true,
          note: 'The shared backing array, `copy` for independence, and `s[a:b:b]` for a safe append.',
        },
      },
    ],
    keyPoints: [
      'An array’s length is part of its type. You will rarely use one directly.',
      'A slice is a pointer, a length and a capacity. `append` returns a new slice, so always reassign.',
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
          'The caller sees nothing. The function got a copy of the slice header, so the new length never reaches the caller, and `append` may have moved the data to a new array too. That is why `append` returns a value.',
      },
      {
        task: 'Call `append` on a `nil` slice and confirm it works.',
        answer:
          '`append` works and allocates. Writing to a nil map panics with `assignment to entry in nil map`. A nil slice is ready to append to; a nil map is not ready to write to.',
      },
      {
        task: 'Preallocate with `make([]T, 0, n)` and print `len` and `cap` as you append.',
        answer:
          '`len` climbs one at a time while `cap` stays at n, so nothing is reallocated. Without the capacity, `cap` doubles while the slice is small; after 256 elements the growth factor tapers from 2x toward 1.25x, and the result is then rounded up to a memory size class, so the exact numbers can look odd.',
      },
    ],
    challenge: {
      prompt:
        'Write `Reversed(s []int) []int`. It returns a NEW slice with the elements in reverse order and must not change `s`. Example: `Reversed([]int{1, 2, 3})` → `[3 2 1]`, and the input is still `[1 2 3]`.',
      starter: `package main

// Reversed returns a reversed copy of s. s itself is not changed.
func Reversed(s []int) []int {
\treturn nil
}
`,
      test: `package main

import "testing"

func sameInts(a, b []int) bool {
\tif len(a) != len(b) {
\t\treturn false
\t}
\tfor i := range a {
\t\tif a[i] != b[i] {
\t\t\treturn false
\t\t}
\t}
\treturn true
}

func TestReversed(t *testing.T) {
\ttests := []struct {
\t\tin, want []int
\t}{
\t\t{[]int{1, 2, 3}, []int{3, 2, 1}},
\t\t{[]int{5, 6}, []int{6, 5}},
\t\t{[]int{9}, []int{9}},
\t\t{[]int{}, []int{}},
\t}
\tfor _, tt := range tests {
\t\tbefore := make([]int, len(tt.in))
\t\tcopy(before, tt.in)
\t\tgot := Reversed(tt.in)
\t\tif !sameInts(got, tt.want) {
\t\t\tt.Errorf("Reversed(%v) = %v, want %v", before, got, tt.want)
\t\t}
\t\tif !sameInts(tt.in, before) {
\t\t\tt.Errorf("Reversed(%v) changed its input to %v", before, tt.in)
\t\t}
\t}
}
`,
      solution: `package main

// Reversed returns a reversed copy of s. s itself is not changed.
func Reversed(s []int) []int {
\tout := make([]int, 0, len(s))
\tfor i := len(s) - 1; i >= 0; i-- {
\t\tout = append(out, s[i])
\t}
\treturn out
}
`,
    },
    refs: [
      { label: 'Go Slices: usage and internals', href: 'https://go.dev/blog/slices-intro' },
      { label: 'A Tour of Go — Slices', href: 'https://go.dev/tour/moretypes/7' },
    ],
  },

  {
    slug: 'maps',
    title: 'Maps',
    navTitle: 'Maps',
    oneLine: 'A hash table with two behaviours that surprise most people once.',
    objectives: [
      'Write code that tells a missing key from a zero value with `v, ok := m[k]`.',
      'Explain why ranging over a map may give a different order each time.',
      'Fix the panic caused by writing to a nil map.',
    ],
    blocks: [
      {
        heading: 'Maps',
        body: [
          'A map is a hash table. Keys must be comparable with `==`. Strings, numbers, pointers, and structs whose fields are all comparable work. Slices, maps and funcs do not.',
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
          run: `package main

import (
	"fmt"
	"sort"
)

func main() {
	stock := map[string]int{"pears": 3, "apples": 5} // create with values
	stock["figs"] = 1                                // set
	stock["pears"] = 4                               // overwrite

	fmt.Println("apples:", stock["apples"])          // get
	fmt.Println("kiwi:", stock["kiwi"])              // 0 — missing key gives zero value

	v, ok := stock["kiwi"]                           // comma-ok form
	fmt.Println("kiwi present?", v, ok)              // 0 false

	delete(stock, "figs")
	fmt.Println("items:", len(stock))                // 2

	for k, v := range stock {                        // order is random: run it twice
		fmt.Println(" ", k, v)
	}

	keys := make([]string, 0, len(stock))            // for a fixed order, sort the keys
	for k := range stock {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		fmt.Println("sorted:", k, stock[k])
	}
}
`,
          note: 'Run it a few times: the plain `range` loop can change order, the sorted one never does.',
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
        body: [
          'Since Go 1.24, maps are built as **Swiss tables**, a newer hash-table design that makes lookups and inserts faster. Nothing you write changes: the syntax, the rules above and the random order all stay the same. Your old code just runs a bit quicker.',
        ],
      },
      {
        heading: 'The modern stdlib helpers',
        body: [
          'Go 1.21 added the `slices` and `maps` packages to the standard library. Reach for these before writing a loop.',
          'Preview: `maps.Keys` does not hand you a slice. It returns an **iterator**, something that gives you the keys one at a time. You will learn how they work in **Iterators**; for now, treat `slices.Sorted(maps.Keys(m))` as "the keys, sorted".',
        ],
        code: {
          label: 'stdlib.go',
          src: `s := []int{3, 1, 2}
slices.Contains(s, 3)               // true
slices.Sort(s)                      // s is now [1 2 3]
slices.Index(s, 3)                  // 2
slices.Reverse(s)                   // s is now [3 2 1]

m := map[string]int{"b": 2, "a": 1}
keys := slices.Sorted(maps.Keys(m)) // [a b] — preview, explained in Iterators`,
        },
      },
    ],
    keyPoints: [
      'A missing key returns the zero value, not an error. Use `v, ok := m[k]`.',
      'Iteration order is randomised on purpose. Sort the keys when order matters.',
      'Writing to a `nil` map panics; reading from one is fine.',
      'Maps are not safe for concurrent use. When the runtime detects a concurrent write, it crashes the program on purpose.',
    ],
    remember:
      'Absent and zero are different things. The two-value form is how you tell them apart.',
    task: 'Count word frequency with a `map[string]int`, then print the top three. A map cannot be sorted, so you will have to move the pairs into a slice.',
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
          'The order may change between loops, even within one run. Go randomises it on purpose so you cannot come to depend on it.',
      },
    ],
    challenge: {
      prompt:
        'Write `WordCount(words []string) map[string]int` that counts how many times each word appears. Example: `WordCount([]string{"go", "is", "go"})` → `map[go:2 is:1]`. An empty list gives an empty map.',
      starter: `package main

// WordCount counts how often each word appears in words.
func WordCount(words []string) map[string]int {
\treturn nil
}
`,
      test: `package main

import "testing"

func sameCounts(a, b map[string]int) bool {
\tif len(a) != len(b) {
\t\treturn false
\t}
\tfor k, v := range a {
\t\tif w, ok := b[k]; !ok || w != v {
\t\t\treturn false
\t\t}
\t}
\treturn true
}

func TestWordCount(t *testing.T) {
\ttests := []struct {
\t\twords []string
\t\twant  map[string]int
\t}{
\t\t{[]string{"go", "is", "go"}, map[string]int{"go": 2, "is": 1}},
\t\t{[]string{"a", "a", "a"}, map[string]int{"a": 3}},
\t\t{[]string{"x", "y"}, map[string]int{"x": 1, "y": 1}},
\t\t{[]string{}, map[string]int{}},
\t}
\tfor _, tt := range tests {
\t\tif got := WordCount(tt.words); !sameCounts(got, tt.want) {
\t\t\tt.Errorf("WordCount(%v) = %v, want %v", tt.words, got, tt.want)
\t\t}
\t}
}
`,
      solution: `package main

// WordCount counts how often each word appears in words.
func WordCount(words []string) map[string]int {
\tcounts := make(map[string]int)
\tfor _, w := range words {
\t\tcounts[w]++ // a missing key starts at the zero value, 0
\t}
\treturn counts
}
`,
    },
    refs: [
      { label: 'Go blog: Go maps in action', href: 'https://go.dev/blog/maps' },
      { label: 'Go spec — Map types', href: 'https://go.dev/ref/spec#Map_types' },
      { label: 'maps package', href: 'https://pkg.go.dev/maps' },
    ],
  },

  {
    slug: 'structs',
    title: 'Structs',
    navTitle: 'Structs',
    oneLine: 'How you make your own types by grouping values under one name.',
    objectives: [
      'Write a struct type and create values of it with named fields.',
      'Predict the output after copying a struct and changing the copy.',
      'Write a function that changes a struct through a pointer.',
    ],
    blocks: [
      {
        heading: 'What a struct is',
        body: [
          'A **struct** is a type you define yourself by grouping other values together under one name. A user has an id, a name and an email; rather than passing three separate variables around, you define a `User` type that holds all three, and pass one thing.',
          'Structs are how you model whatever your program is about. Go has no classes, so this is the main tool: a struct for the data, and **methods** (functions attached to that type) for the things it can do.',
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
          note: 'You can write `User{1, "sahdev", "s@x.com"}`, but do not. Adding a field later breaks every positional literal, and swapping two fields of the same type (say `Name` and `Email`) silently swaps their values.',
        },
      },
      {
        heading: 'Printing a struct',
        code: {
          label: 'print.go',
          src: `u := User{ID: 1, Name: "sahdev", Email: "s@x.com"}

fmt.Printf("%v\\n", u)   // {1 sahdev s@x.com}          — just the values
fmt.Printf("%+v\\n", u)  // {ID:1 Name:sahdev Email:s@x.com} — with field names
fmt.Printf("%#v\\n", u)  // main.User{ID:1, Name:"sahdev", Email:"s@x.com"}
fmt.Printf("%T\\n", u)   // main.User`,
          note: '`%+v` is the one you will use most when debugging: it shows which value belongs to which field.',
        },
      },
      {
        heading: 'Assignment copies. Always.',
        body: [
          'Go has no pass-by-reference. Assigning a struct copies it, and passing one to a function copies it too. When you pass a pointer, you are passing the pointer *by value*. The copy points at the same memory.',
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
        heading: 'Functions that take a struct',
        body: [
          'To work with a struct, write an ordinary function that takes it. Take a pointer (`*User`, from **Pointers**) when the function must change the original, because a plain `User` parameter is a copy.',
        ],
        code: {
          label: 'funcs.go',
          src: `func display(u User) string { return u.Name + " <" + u.Email + ">" }

func rename(u *User, n string) { u.Name = n } // pointer: changes the original

u := User{Name: "old", Email: "o@x.com"}
rename(&u, "new")
fmt.Println(display(u))   // new <o@x.com>`,
          note: 'In **Methods and embedding** you will attach these functions to the type itself, so you can write `u.Rename("new")`.',
        },
      },
      {
        heading: 'Pointers to structs',
        body: [
          'This builds on **Pointers**. `&User{...}` makes a struct and gives you its address in one step; it is the usual way to get a `*User`. Go also dereferences struct fields for you: with `p := &u`, you write `p.Name`, and Go reads it as `(*p).Name`.',
        ],
        code: {
          label: 'ptr-struct.go',
          src: `p := &User{Name: "sahdev"}   // a new User, and its address

fmt.Println(p.Name)          // Go rewrites this as (*p).Name
p.Name = "changed"           // and this too`,
        },
      },
      {
        heading: 'A nil-able pointer field',
        body: [
          'A pointer field can be `nil`, so it tells "not sent" apart from "sent as empty". A PATCH endpoint needs that: `{"title": ""}` should clear the title, while `{}` should leave it alone. **JSON** shows how the tags work.',
        ],
        code: {
          label: 'optional.go',
          src: `type UpdateRequest struct {
\tTitle *string \`json:"title"\`   // nil = not provided at all
\tBody  *string \`json:"body"\`
}

if req.Title != nil {
\tnote.Title = *req.Title           // they DID send it, even if it is ""
}`,
        },
      },
      {
        heading: 'Embedding: a struct inside a struct',
        body: [
          'You can put one struct inside another with no field name. Its fields are then promoted, so they look like they belong to the outer type.',
        ],
        code: {
          label: 'embed.go',
          src: `type Base struct {
\tID int
}

type Admin struct {
\tBase           // embedded — no field name
\tLevel int
}

a := Admin{Base: Base{ID: 1}, Level: 5}
fmt.Println(a.ID)          // promoted field — same as a.Base.ID`,
          note: 'This is composition, not inheritance. **Methods and embedding** shows that methods get promoted too.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import "fmt"

type Base struct{ ID int }

type User struct {
	Base        // embedded: ID is promoted
	Name string
}

func display(u User) string      { return u.Name }
func rename(u *User, n string)   { u.Name = n } // pointer: can mutate

func main() {
	u := User{Base: Base{ID: 1}, Name: "first"}
	fmt.Printf("%+v\\n", u)
	fmt.Println(display(u), u.ID)

	rename(&u, "second")
	fmt.Println("after rename:", u.Name)

	copyOfU := u
	rename(&copyOfU, "third")
	fmt.Println("original is still:", u.Name) // assignment copied it
}
`,
          canRun: true,
          note: 'A copy and a pointer side by side, plus embedding.',
        },
      },
    ],
    keyPoints: [
      'A struct groups fields into one type. Always use field names in a literal.',
      'Assignment and function calls copy a struct. Go has no pass-by-reference.',
      'Taking a pointer (`*User`) lets a function change the original instead of a copy. `&User{...}` makes one, and `p.Name` dereferences for you.',
      'A nil-able pointer field (`*string`) separates "not sent" from "sent as empty".',
      'Embedding puts one struct inside another; its fields are promoted. Composition, not inheritance.',
    ],
    remember:
      'Everything in Go is a value and every assignment is a copy.',
    task: 'Build a `Book` struct (Title, Author, Pages), write `func describe(b Book) string` and `func addPages(b *Book, n int)`, and print the book with `%+v` before and after.',
    exercises: [
      {
        task: 'Copy a struct, change the copy, and print the original.',
        answer:
          'The original is unchanged. Assignment copies the whole struct.',
      },
      {
        task: 'Write `rename(u User, n string)` without a pointer, call it, and print the name. Then switch to `*User`.',
        answer:
          'Without the pointer the name does not change, because the function got a copy. With `*User` and `rename(&u, ...)`, it does.',
      },
      {
        task: 'Embed a `Base{ID int}` in two different structs and print `x.ID` on both.',
        answer:
          'Both print their ID directly. The field is promoted from the embedded `Base`, the same as writing `x.Base.ID`.',
      },
    ],
    challenge: {
      prompt:
        'A `Book` has a `Title` and `Pages`. Write `Describe(b Book) string`, which returns the title and page count like `"Go 101 (250 pages)"`, and `AddPages(b *Book, n int)`, which adds `n` to the ORIGINAL book\'s pages. Example: a book with 250 pages after `AddPages(&b, 10)` has 260.',
      starter: `package main

type Book struct {
\tTitle string
\tPages int
}

// Describe returns "Title (N pages)".
func Describe(b Book) string {
\treturn ""
}

// AddPages adds n pages to the book b points at.
func AddPages(b *Book, n int) {
}
`,
      test: `package main

import "testing"

func TestDescribe(t *testing.T) {
\ttests := []struct {
\t\tb    Book
\t\twant string
\t}{
\t\t{Book{Title: "Go 101", Pages: 250}, "Go 101 (250 pages)"},
\t\t{Book{Title: "Tiny", Pages: 1}, "Tiny (1 pages)"},
\t}
\tfor _, tt := range tests {
\t\tif got := Describe(tt.b); got != tt.want {
\t\t\tt.Errorf("Describe(%+v) = %q, want %q", tt.b, got, tt.want)
\t\t}
\t}
}

func TestAddPages(t *testing.T) {
\ttests := []struct {
\t\tstart, add, want int
\t}{
\t\t{250, 10, 260},
\t\t{0, 5, 5},
\t\t{7, 0, 7},
\t}
\tfor _, tt := range tests {
\t\tb := Book{Title: "x", Pages: tt.start}
\t\tAddPages(&b, tt.add)
\t\tif b.Pages != tt.want {
\t\t\tt.Errorf("AddPages(%v pages, %v) = %v pages, want %v", tt.start, tt.add, b.Pages, tt.want)
\t\t}
\t}
}
`,
      solution: `package main

import "fmt"

type Book struct {
\tTitle string
\tPages int
}

// Describe returns "Title (N pages)".
func Describe(b Book) string {
\treturn fmt.Sprintf("%s (%d pages)", b.Title, b.Pages)
}

// AddPages adds n pages to the book b points at.
func AddPages(b *Book, n int) {
\tb.Pages += n
}
`,
    },
    refs: [
      { label: 'A Tour of Go — Methods', href: 'https://go.dev/tour/methods/1' },
      { label: 'FAQ: pointer or value receiver?', href: 'https://go.dev/doc/faq#methods_on_values_or_pointers' },
    ],
  },

  {
    slug: 'methods-and-embedding',
    title: 'Methods, receivers, and embedding',
    navTitle: 'Methods and embedding',
    oneLine: 'The rule about receivers that most beginners trip on.',
    objectives: [
      'Write a value-receiver method and a pointer-receiver method, and explain when to use each.',
      'Write an enum with a named type, `iota` and a `String()` method.',
      'Explain why embedding is composition and not inheritance.',
    ],
    blocks: [
      {
        heading: 'Methods are functions with a receiver',
        body: [
          'A method is a function with an extra parameter written before the name. That parameter is the receiver, and it comes in two flavours that behave very differently.',
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
        heading: 'Enums: a named type, iota, and a String method',
        body: [
          'In **Constants and iota** you numbered choices with `iota`. Give those constants their own named type and a `String()` method, and `fmt` prints them as words. `fmt` looks for a method called `String() string` and uses it automatically; **Interfaces** explains why that works.',
        ],
        code: {
          label: 'enum.go',
          src: `type Status int            // a new type whose underlying value is an int

const (
\tPending Status = iota      // 0
\tActive                     // 1
\tDeleted                    // 2
)

func (s Status) String() string {
\tswitch s {
\tcase Pending:
\t\treturn "pending"
\tcase Active:
\t\treturn "active"
\t}
\treturn "deleted"
}

fmt.Println(Active)          // active — String() at work
fmt.Printf("%d\\n", Active)  // 1 — the number underneath`,
          run: `package main

import "fmt"

type Status int

const (
	Pending Status = iota
	Active
	Deleted
)

func (s Status) String() string {
	switch s {
	case Pending:
		return "pending"
	case Active:
		return "active"
	}
	return "deleted"
}

func main() {
	fmt.Println(Pending, Active, Deleted) // pending active deleted
	fmt.Printf("%d %d %d\\n", Pending, Active, Deleted) // 0 1 2
}
`,
          note: 'This is how Go does enums. The named type also stops you passing a plain number where a `Status` is expected by mistake.',
        },
      },
      {
        heading: 'Which receiver do I use?',
        table: {
          headers: ['Use a pointer receiver when', 'Use a value receiver when'],
          rows: [
            ['The method changes the struct', 'The type is small and you never mutate it'],
            ['The struct is large (copying costs)', 'Each caller should get its own independent copy'],
            ['The struct contains a `sync.Mutex`', 'The type is naturally a value, like `time.Time`'],
            ['**Any other method already needs one**', ''],
          ],
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Be consistent. Mixing value and pointer receivers on one type draws review comments, and it leads to the confusing "does not implement" error in the **Interfaces** topic: a `T` value only has the value-receiver methods, so it fails any interface that needs a pointer-receiver one. If one method needs a pointer, make them all pointers.',
        },
      },
      {
        heading: 'The same functions, written as methods',
        body: [
          'In **Structs** you wrote `display(u)` and `rename(&u, "new")`. Move the struct parameter in front of the name and they become methods: `u.Display()` and `u.Rename("new")`. The `*User` parameter becomes a pointer receiver.',
        ],
      },
      {
        heading: 'Embedding promotes methods too',
        code: {
          label: 'embed.go',
          src: `type Base struct{ ID int }

func (b Base) Describe() string { return fmt.Sprint("id=", b.ID) }

type Admin struct {
\tBase           // embedded — no field name
\tLevel int
}

a := Admin{Base: Base{ID: 1}, Level: 5}
fmt.Println(a.Describe())  // promoted method`,
          run: `package main

import "fmt"

type Base struct{ ID int }

func (b Base) Describe() string { return fmt.Sprint("id=", b.ID) }

type User struct {
	Base
	Name string
}

func (u User) Display() string  { return u.Name }
func (u *User) Rename(n string) { u.Name = n }

func main() {
	u := User{Base: Base{ID: 1}, Name: "first"}
	fmt.Println(u.Display(), u.ID, u.Describe())

	u.Rename("second") // Go takes the address for you
	fmt.Println("after Rename:", u.Name)
}
`,
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'This is **not** inheritance. An `Admin` is not a `Base`: you cannot pass one where the other is expected, and `Describe` cannot see `Admin.Level`. There are no virtual methods in Go. When you want one type to stand in for another, you need an interface, which is the next topic.',
        },
      },
    ],
    keyPoints: [
      'A value receiver gets a copy; a pointer receiver can mutate the original.',
      'Pointer receiver when you mutate, the struct is large, or it holds a mutex. Then use it for all methods.',
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
          '`cannot use a (variable of type Admin) as Base value`. An `Admin` is not a `Base`. Pass `a.Base` if that is what the function needs.',
      },
      {
        task: 'Mix value and pointer receivers on one type and see what `go vet` says.',
        answer:
          '`go vet` may stay quiet, but interface satisfaction breaks. Only `*T` has both kinds of method in its method set, so `var s Shape = User{}` fails when `Shape` needs a pointer-receiver method.',
      },
    ],
    challenge: {
      prompt:
        'Give `Rect` two methods. `Area()` (value receiver) returns width times height. `Scale(f float64)` (pointer receiver) multiplies both sides by `f`, changing the original. Example: `Rect{W: 2, H: 3}.Area()` → 6; after `r.Scale(2)`, `r` is `{W: 4, H: 6}`.',
      starter: `package main

type Rect struct {
\tW, H float64
}

// Area returns W times H.
func (r Rect) Area() float64 {
\treturn 0
}

// Scale multiplies both sides by f.
func (r *Rect) Scale(f float64) {
}
`,
      test: `package main

import "testing"

func TestArea(t *testing.T) {
\ttests := []struct {
\t\tr    Rect
\t\twant float64
\t}{
\t\t{Rect{W: 2, H: 3}, 6},
\t\t{Rect{W: 1.5, H: 2}, 3},
\t\t{Rect{}, 0},
\t}
\tfor _, tt := range tests {
\t\tif got := tt.r.Area(); got != tt.want {
\t\t\tt.Errorf("%+v.Area() = %v, want %v", tt.r, got, tt.want)
\t\t}
\t}
}

func TestScale(t *testing.T) {
\ttests := []struct {
\t\tr    Rect
\t\tf    float64
\t\twant Rect
\t}{
\t\t{Rect{W: 2, H: 3}, 2, Rect{W: 4, H: 6}},
\t\t{Rect{W: 4, H: 8}, 0.5, Rect{W: 2, H: 4}},
\t}
\tfor _, tt := range tests {
\t\tr := tt.r
\t\tr.Scale(tt.f)
\t\tif r != tt.want {
\t\t\tt.Errorf("%+v.Scale(%v) gave %+v, want %+v", tt.r, tt.f, r, tt.want)
\t\t}
\t}
}
`,
      solution: `package main

type Rect struct {
\tW, H float64
}

// Area returns W times H.
func (r Rect) Area() float64 {
\treturn r.W * r.H
}

// Scale multiplies both sides by f.
func (r *Rect) Scale(f float64) {
\tr.W *= f
\tr.H *= f
}
`,
    },
    refs: [
      { label: 'A Tour of Go — Methods', href: 'https://go.dev/tour/methods/1' },
      { label: 'FAQ: pointer or value receiver?', href: 'https://go.dev/doc/faq#methods_on_values_or_pointers' },
    ],
  },

  {
    slug: 'interfaces',
    title: 'Interfaces',
    navTitle: 'Interfaces',
    oneLine: 'Go’s main abstraction, satisfied without ever being declared.',
    objectives: [
      'Write an interface and two types that satisfy it without declaring it.',
      'Explain why an interface holding a nil pointer is not `nil`.',
      'Fix a function that returns a typed nil pointer as an `error`.',
    ],
    blocks: [
      {
        heading: 'There is no "implements" keyword',
        body: [
          'An interface lists method names. **Any type with those methods satisfies it automatically.** You never declare the relationship. The type does not need to know the interface exists, and the interface can be written years later by someone else.',
          'That sounds like a small detail. It is the reason `io.Reader` works with files, network connections, buffers, gzip streams, and HTTP bodies, none of which were written with each other in mind.',
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
          '"The bigger the interface, the weaker the abstraction," as the Go Proverbs put it. The most widely used interfaces in the standard library have one method. `io.Reader` has `Read`. `error` has `Error`. `http.Handler` has `ServeHTTP`. A one-method interface is easy to satisfy, so everything plugs into it.',
        ],
        bullets: [
          '**Accept interfaces, return structs.** Take the narrowest thing you need as a parameter; return the concrete type so callers keep every method.',
          '**Do not create an interface until you have a second implementation or a test that needs a fake.** A one-implementation interface is indirection with no payoff: every reader has to jump through it to find the real code.',
        ],
      },
      {
        heading: 'The nil interface trap',
        body: [
          'This is one of the best-known Go bugs, and the Go FAQ has an entry for it. Meet it now rather than in production. An interface value holds two things: a type, and a value. It is `nil` only when **both** are empty.',
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
          note: 'The fix: do not return a variable of a concrete error type (here `*MyError`) as an `error`. On success, return the literal `nil`.',
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

import "fmt"

type Shape interface{ Area() float64 }

type Rect struct{ W, H float64 }

func (r Rect) Area() float64 { return r.W * r.H }

type MyError struct{ Field string }

func (e *MyError) Error() string { return e.Field + " is invalid" }

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

	var err error = &MyError{Field: "email"} // *MyError has Error(), so it is an error
	fmt.Println("as an error:", err)
}
`,
          canRun: true,
          note: 'Implicit satisfaction, the nil-interface trap, and your own type used as an `error`. Checking wrapped errors (`errors.Is` / `errors.As`) comes in **Error values in depth**.',
        },
      },
    ],
    keyPoints: [
      'Interfaces are satisfied implicitly. Any type with the methods qualifies.',
      'The smaller the interface, the more useful. One method is the ideal.',
      'Accept interfaces, return structs, and define the interface where it is used.',
      'An interface holding a nil pointer is not nil. Return the literal `nil`.',
    ],
    remember:
      'Do not create an interface until there is a second implementation or a test that needs a fake.',
    task: 'Write a `Shape` interface with two implementations and a function taking `[]Shape`. Then reproduce the nil-interface trap and fix it.',
    exercises: [
      {
        task: 'Add `var _ Shape = (*Circle)(nil)` then delete a method and read the compile error.',
        answer:
          'The build fails at that line and names the missing method. It is a compile-time check that costs nothing at runtime.',
      },
      {
        task: 'Return a nil `*MyError` as an `error` and check `err != nil`.',
        answer:
          '`err != nil` is true. The interface holds a type (`*MyError`) and a nil pointer, so it is not nil. Return the literal `nil` instead.',
      },
      {
        task: 'Write a function taking `io.Writer` and call it with a file, a buffer and `os.Stdout`.',
        answer:
          'All three work unchanged. Each has a `Write` method, and that one method is all `io.Writer` asks for.',
      },
    ],
    challenge: {
      prompt:
        '`Rect` already satisfies `Shape`. Make `Square` satisfy it too by writing its `Area` method (side times side), then write `TotalArea(shapes []Shape) float64`, which adds up the area of every shape. Example: `TotalArea([]Shape{Rect{W: 2, H: 3}, Square{Side: 2}})` → 10.',
      starter: `package main

type Shape interface {
\tArea() float64
}

type Rect struct{ W, H float64 }

func (r Rect) Area() float64 { return r.W * r.H }

type Square struct{ Side float64 }

func (s Square) Area() float64 {
\treturn 0
}

// TotalArea adds up the area of every shape.
func TotalArea(shapes []Shape) float64 {
\treturn 0
}
`,
      test: `package main

import "testing"

func TestTotalArea(t *testing.T) {
\ttests := []struct {
\t\tshapes []Shape
\t\twant   float64
\t}{
\t\t{[]Shape{Rect{W: 2, H: 3}, Square{Side: 2}}, 10},
\t\t{[]Shape{Square{Side: 3}}, 9},
\t\t{[]Shape{Rect{W: 1, H: 1}, Rect{W: 2, H: 2}}, 5},
\t\t{nil, 0},
\t}
\tfor _, tt := range tests {
\t\tif got := TotalArea(tt.shapes); got != tt.want {
\t\t\tt.Errorf("TotalArea(%v) = %v, want %v", tt.shapes, got, tt.want)
\t\t}
\t}
}
`,
      solution: `package main

type Shape interface {
\tArea() float64
}

type Rect struct{ W, H float64 }

func (r Rect) Area() float64 { return r.W * r.H }

type Square struct{ Side float64 }

func (s Square) Area() float64 {
\treturn s.Side * s.Side
}

// TotalArea adds up the area of every shape.
func TotalArea(shapes []Shape) float64 {
\ttotal := 0.0
\tfor _, s := range shapes {
\t\ttotal += s.Area()
\t}
\treturn total
}
`,
    },
    refs: [
      { label: 'A Tour of Go — Interfaces', href: 'https://go.dev/tour/methods/9' },
      { label: 'Go blog: Errors are values', href: 'https://go.dev/blog/errors-are-values' },
    ],
  },

  {
    slug: 'error-values',
    title: 'Error values in depth',
    navTitle: 'Error values',
    oneLine: 'Sentinels, custom types, wrapping, and handling each error once.',
    objectives: [
      'Write a sentinel error and a custom error type, and wrap them with `%w`.',
      'Write checks with `errors.Is` for a specific error and `errors.As` for its data.',
      'Explain the difference between wrapping with `%w` and with `%v`.',
    ],
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
func parseLine(n int, err error) error {
\treturn fmt.Errorf("parsing config line %d: %w", n, err)
}

// 2. Sentinel — the caller needs to branch on this exact case
var ErrNotFound = errors.New("not found")

// 3. Custom type — the caller needs DATA out of the error
type ValidationError struct{ Field, Msg string }

func (e *ValidationError) Error() string { return e.Field + ": " + e.Msg }

// 4. Joined — report every failure, not just the first
func validate(errs []error) error {
\treturn errors.Join(errs...) // nil if errs is empty
}

func handle(err error) {
\tif errors.Is(err, ErrNotFound) { // is this exact error anywhere in the chain?
\t\tfmt.Println("not found")
\t}
\tvar ve *ValidationError
\tif errors.As(err, &ve) { // is there a *ValidationError in the chain? give it to me
\t\tfmt.Println("bad field:", ve.Field)
\t}
}`,
          run: `package main

import (
\t"errors"
\t"fmt"
)

func parseLine(n int, err error) error {
\treturn fmt.Errorf("parsing config line %d: %w", n, err)
}

var ErrNotFound = errors.New("not found")

type ValidationError struct{ Field, Msg string }

func (e *ValidationError) Error() string { return e.Field + ": " + e.Msg }

func validate(errs []error) error {
\treturn errors.Join(errs...)
}

func handle(err error) {
\tfmt.Println("got:", err)
\tif errors.Is(err, ErrNotFound) {
\t\tfmt.Println("  -> not found")
\t}
\tvar ve *ValidationError
\tif errors.As(err, &ve) {
\t\tfmt.Println("  -> bad field:", ve.Field)
\t}
}

func main() {
\thandle(parseLine(3, ErrNotFound))
\thandle(parseLine(7, &ValidationError{Field: "port", Msg: "must be a number"}))
\thandle(validate([]error{ErrNotFound, &ValidationError{Field: "name", Msg: "empty"}}))
}
`,
          note: '`errors.As` is a type assertion that walks the whole wrap chain. **Type switches** shows the plain version it is built on.',
        },
      },
      {
        heading: 'Wrapping: %w versus %v',
        bullets: [
          '`%w` keeps the original error in a chain, so `errors.Is` and `errors.As` can still see it. This is the default choice.',
          '`%v` flattens it to text and breaks the chain. Use it on purpose when you want to *hide* an internal error from the caller.',
          '**Add context, do not restate.** Six layers each saying "failed to" gives you a useless sentence. Say what you were doing, with what: `fmt.Errorf("get user %d: %w", id, err)`.',
          '**Handle an error once.** Either log it or return it, not both. Otherwise one failure passing up five layers is logged five times.',
        ],
      },
      {
        heading: 'errors.As: getting the data back out',
        body: [
          '`errors.Is` answers "is this that exact error?". When the error is a custom type carrying data, you want the value itself. `errors.As` walks the wrap chain looking for an error of the type you ask for. If it finds one, it stores it in your variable and returns `true`.',
          'You pass a **pointer to a variable** of the error type: `var ve *ValidationError` and then `errors.As(err, &ve)`. Forget the `&` and it panics, because it has nowhere to write the result.',
        ],
        code: {
          label: 'errors-as.go',
          src: `package main

import (
\t"errors"
\t"fmt"
)

type ValidationError struct{ Field, Msg string }

func (e *ValidationError) Error() string { return e.Field + ": " + e.Msg }

func saveUser(age int) error {
\tif age < 0 {
\t\treturn &ValidationError{Field: "age", Msg: "cannot be negative"}
\t}
\treturn nil
}

func main() {
\terr := fmt.Errorf("signup: %w", saveUser(-3)) // wrapped once

\tvar ve *ValidationError
\tif errors.As(err, &ve) { // found a *ValidationError in the chain
\t\tfmt.Println("tell the user to fix:", ve.Field) // age
\t}
\tfmt.Println("full message:", err) // signup: age: cannot be negative
}
`,
          canRun: true,
          note: 'Use `errors.As` instead of a type assertion like `err.(*ValidationError)`: the assertion only checks the outer error and misses anything wrapped with `%w`.',
        },
      },
    ],
    keyPoints: [
      '`error` is just an interface with one method. Nothing about it is magic.',
      '`errors.Is` for "which error is this", `errors.As` for "give me its data".',
      '`%w` keeps the chain so `Is` and `As` can see through it. `%v` breaks it, which is sometimes what you want.',
      'Handle an error once: log it or return it, not both.',
    ],
    remember:
      'Add context, do not restate. Say what you were doing, with what.',
    task: 'Define a sentinel error and a custom error type, wrap both with `%w`, and retrieve them with `errors.Is` and `errors.As`.',
    exercises: [
      {
        task: 'Wrap an error three layers deep and print the whole chain.',
        answer:
          'You get one line with each layer\'s context, joined by colons. If every layer says \'failed to\', it tells you nothing. Say what you were doing, with what.',
      },
      {
        task: 'Swap one `%w` for `%v` and watch `errors.Is` stop finding it.',
        answer:
          '`errors.Is` stops finding it. `%v` flattens the error to text and breaks the chain. That is sometimes what you want, to hide internals.',
      },
      {
        task: 'Use `errors.Join` to report three validation failures at once.',
        answer:
          'All three messages appear, and `errors.Is` still finds each one. This is how you validate a whole form at once.',
      },
    ],
    challenge: {
      prompt:
        'Write `Price(prices map[string]int, item string) (int, error)`. A known item with a price of 0 or more returns that price and nil. A missing item returns an error that wraps `ErrNotFound` and reads `price of "kiwi": not found`. A negative price returns a `*BadPriceError` so the caller can get the item and price back with `errors.As`. Example: `Price(map[string]int{"apple": 30}, "apple")` → 30, nil.',
      starter: `package main

import "errors"

var ErrNotFound = errors.New("not found")

type BadPriceError struct {
\tItem  string
\tPrice int
}

func (e *BadPriceError) Error() string { return e.Item + " has a negative price" }

// Price looks up item in prices.
func Price(prices map[string]int, item string) (int, error) {
\treturn 0, nil
}
`,
      test: `package main

import (
\t"errors"
\t"testing"
)

func TestPrice(t *testing.T) {
\tprices := map[string]int{"apple": 30, "free": 0, "broken": -5}
\ttests := []struct {
\t\titem         string
\t\twant         int
\t\twantNotFound bool
\t\twantBad      bool
\t\twantMsg      string
\t}{
\t\t{"apple", 30, false, false, ""},
\t\t{"free", 0, false, false, ""},
\t\t{"kiwi", 0, true, false, \`price of "kiwi": not found\`},
\t\t{"broken", 0, false, true, "broken has a negative price"},
\t}
\tfor _, tt := range tests {
\t\tgot, err := Price(prices, tt.item)
\t\tif got != tt.want {
\t\t\tt.Errorf("Price(%v) = %v, want %v", tt.item, got, tt.want)
\t\t}
\t\tif errors.Is(err, ErrNotFound) != tt.wantNotFound {
\t\t\tt.Errorf("Price(%v): errors.Is(err, ErrNotFound) = %v, want %v", tt.item, !tt.wantNotFound, tt.wantNotFound)
\t\t}
\t\tvar bp *BadPriceError
\t\tif errors.As(err, &bp) != tt.wantBad {
\t\t\tt.Errorf("Price(%v): errors.As(err, &bp) = %v, want %v", tt.item, !tt.wantBad, tt.wantBad)
\t\t} else if tt.wantBad && (bp.Item != tt.item || bp.Price != prices[tt.item]) {
\t\t\tt.Errorf("Price(%v): BadPriceError = %+v, want Item %v Price %v", tt.item, *bp, tt.item, prices[tt.item])
\t\t}
\t\tif tt.wantMsg == "" && err != nil {
\t\t\tt.Errorf("Price(%v) error = %v, want nil", tt.item, err)
\t\t}
\t\tif tt.wantMsg != "" && (err == nil || err.Error() != tt.wantMsg) {
\t\t\tt.Errorf("Price(%v) error = %v, want %v", tt.item, err, tt.wantMsg)
\t\t}
\t}
}
`,
      solution: `package main

import (
\t"errors"
\t"fmt"
)

var ErrNotFound = errors.New("not found")

type BadPriceError struct {
\tItem  string
\tPrice int
}

func (e *BadPriceError) Error() string { return e.Item + " has a negative price" }

// Price looks up item in prices.
func Price(prices map[string]int, item string) (int, error) {
\tp, ok := prices[item]
\tif !ok {
\t\treturn 0, fmt.Errorf("price of %q: %w", item, ErrNotFound)
\t}
\tif p < 0 {
\t\treturn 0, &BadPriceError{Item: item, Price: p}
\t}
\treturn p, nil
}
`,
    },
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
    objectives: [
      'Write a module with two packages and call one from the other.',
      'Explain how capitalisation decides what a package exports.',
      'Fix an `undefined` error caused by a lowercase name.',
    ],
    blocks: [
      {
        heading: 'Three things you need before writing anything real',
        body: [
          'A **package** is a folder of Go files compiled together. It is how you split a growing program into pieces, and it is the only privacy Go has: capitalised names are visible outside the package, lowercase names are not.',
          '**JSON** is the text format most web APIs send and receive. Go turns a struct into JSON and back using the field tags you met with structs, so most JSON work in Go is describing your types accurately.',
          'A **test** is code that runs your code and fails loudly when the answer is wrong. Testing is part of the Go toolchain, not a library you pick: a file ending `_test.go`, a function starting `Test`, and `go test`.',
        ],
      },
      {
        heading: 'A folder is a package',
        body: [
          'Every `.go` file declares a package, and every file in one folder must declare the same one. Visibility is decided by **capitalisation**: a name starting with a capital letter is exported and visible outside the package; a lowercase name is private to it. There is no `public` or `private` keyword.',
        ],
        tree: {
          caption: 'a module with two packages',
          nodes: [
            { depth: 0, name: 'calc-demo', kind: 'dir' },
            { depth: 1, name: 'go.mod', kind: 'file', note: 'module example.com/calc-demo' },
            { depth: 1, name: 'main.go', kind: 'file', note: 'package main' },
            { depth: 1, name: 'calc', kind: 'dir' },
            { depth: 2, name: 'calc.go', kind: 'file', note: 'package calc' },
            { depth: 2, name: 'calc_test.go', kind: 'file', note: 'package calc' },
          ],
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

\t"example.com/calc-demo/calc"   // module path + folder
)

func main() {
\tfmt.Println(calc.Add(2, 3))
}`,
          note: 'This is one file of the two-package module above, so it only builds next to `calc/calc.go`; run it with `go run .` in the module folder. The package name is part of every call, so `calc.Add` reads well and `calc.CalcAdd` stutters. Do not repeat the package name in what it exports.',
        },
      },
    ],
    keyPoints: [
      'Every file in one folder declares the same package name.',
      'Capitalised names are exported; lowercase ones are private to the package.',
      'The import path is the module path plus the folder.',
      'There is no `public` or `private` keyword, and none is needed.',
      'Once a module has many packages, `internal/` folders and import cycles come into play: see **Packages in code** in the tooling section.',
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
          'It initialises the package (its package-level variables and `init()`) and gives you no name to call it by. Here, that registers pprof\'s HTTP handlers on the default mux.',
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
    oneLine: 'Turning structs into JSON and back, and the field that disappears with no error.',
    objectives: [
      'Write struct tags that rename, drop and hide fields in JSON.',
      'Explain why a lowercase field never appears in the output.',
      'Predict which fields `omitempty` and `omitzero` leave out.',
    ],
    blocks: [
      {
        heading: 'Struct tags',
        body: [
          'A **struct tag** is a short string in backticks after a field: `Name string \`json:"name"\``. Go itself ignores it; packages such as `encoding/json` read it while the program runs to decide how to treat that field.',
          'The three you will use: `json:"name"` sets the key name in the JSON. Adding `,omitempty` (`json:"bio,omitempty"`) leaves the key out when the value is empty (0, "", nil). `json:"-"` means never put this field in the JSON at all, which is how you make it impossible to leak a password hash.',
        ],
      },
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
          note: 'Unmarshal must be given a pointer, or it has nothing to write into. Without the `&` it returns an error at runtime, not a compile error.',
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Only **exported** (capitalised) fields are marshalled. A lowercase field is invisible to `encoding/json` and will silently be missing from your API response.',
        },
      },
      {
        heading: 'omitzero: leave out zero values, structs included',
        body: [
          '`omitempty` has a gap: a struct is never "empty" to it. A zero `time.Time` is printed as `"0001-01-01T00:00:00Z"`, which is almost never what you want. Go 1.24 added `,omitzero`. It leaves the field out when it holds its **zero value**, and that includes a zero struct. If the type has an `IsZero() bool` method, as `time.Time` does, that method decides.',
        ],
        code: {
          label: 'omitzero.go',
          src: `package main

import (
\t"encoding/json"
\t"fmt"
\t"time"
)

type Event struct {
\tName    string    \`json:"name"\`
\tStarted time.Time \`json:"started,omitempty"\` // a struct is never "empty": still printed
\tEnded   time.Time \`json:"ended,omitzero"\`    // zero time: left out
\tCount   int       \`json:"count,omitzero"\`    // 0: left out
}

func main() {
\tb, _ := json.Marshal(Event{Name: "launch"})
\tfmt.Println(string(b))
\t// {"name":"launch","started":"0001-01-01T00:00:00Z"}
}
`,
          canRun: true,
          note: 'For numbers, strings and pointers the two behave the same. They differ for structs and arrays, and for empty slices and maps. A struct or a `[3]int{}` full of zeros is dropped by `omitzero` but never by `omitempty`. An empty (non-nil) slice or map is dropped by `omitempty`, while `omitzero` drops only a nil one.',
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
          'By default the unknown field is ignored with no error. `DisallowUnknownFields` is a method on `json.Decoder`, and with it you get an error, so a client typo becomes a 400 instead of being dropped.',
      },
      {
        task: 'Add `omitempty` to a field and marshal with it both set and empty.',
        answer: 'Set, it appears. Empty, the key is left out entirely. It is absent, not `null`.',
      },
      {
        task: 'Marshal a `time.Time` and see what format Go chooses.',
        answer:
          'RFC 3339, like `2026-09-08T16:04:05Z`, with fractional seconds added when the time has them. It is a sensible default for an API.',
      },
    ],
    challenge: {"prompt":"Add struct tags to `Product` and write `Encode(p Product) (string, error)` that returns its JSON. Keys must be `id`, `name`, `price` and `tags`. `tags` is left out when there are none (nil or empty), `price` is always present, even when it is 0, and `Secret` never appears. Example: `Product{ID: 1, Name: \"Pen\", Price: 9.5}` → `{\"id\":1,\"name\":\"Pen\",\"price\":9.5}`.","starter":"package main\n\ntype Product struct {\n\tID     int\n\tName   string\n\tPrice  float64\n\tTags   []string\n\tSecret string\n}\n\nfunc Encode(p Product) (string, error) {\n\treturn \"{}\", nil // TODO: tags on the fields, then json.Marshal\n}\n","test":"package main\n\nimport \"testing\"\n\nfunc TestEncode(t *testing.T) {\n\ttests := []struct {\n\t\tin   Product\n\t\twant string\n\t}{\n\t\t{Product{ID: 1, Name: \"Pen\", Price: 9.5}, `{\"id\":1,\"name\":\"Pen\",\"price\":9.5}`},\n\t\t{Product{ID: 2, Name: \"Ink\", Price: 0, Tags: []string{}}, `{\"id\":2,\"name\":\"Ink\",\"price\":0}`},\n\t\t{Product{ID: 3, Name: \"Book\", Price: 120, Tags: []string{\"new\", \"sale\"}, Secret: \"cost=80\"}, `{\"id\":3,\"name\":\"Book\",\"price\":120,\"tags\":[\"new\",\"sale\"]}`},\n\t\t{Product{ID: -4, Name: \"Pen \\\"Pro\\\"\", Price: -1.25}, `{\"id\":-4,\"name\":\"Pen \\\"Pro\\\"\",\"price\":-1.25}`},\n\t}\n\tfor _, tc := range tests {\n\t\tgot, err := Encode(tc.in)\n\t\tif err != nil || got != tc.want {\n\t\t\tt.Errorf(\"Encode(%+v) = %v, %v, want %v, nil\", tc.in, got, err, tc.want)\n\t\t}\n\t}\n}\n","solution":"package main\n\nimport \"encoding/json\"\n\ntype Product struct {\n\tID     int      `json:\"id\"`\n\tName   string   `json:\"name\"`\n\tPrice  float64  `json:\"price\"`\n\tTags   []string `json:\"tags,omitempty\"`\n\tSecret string   `json:\"-\"`\n}\n\nfunc Encode(p Product) (string, error) {\n\tb, err := json.Marshal(p)\n\treturn string(b), err\n}\n"},
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
    objectives: [
      'Write a table-driven test with named subtests and clear failure messages.',
      'Write a fuzz test and a `b.Loop` benchmark, and run them with `go test`.',
      'Explain the difference between `t.Error` and `t.Fatal`.',
    ],
    blocks: [
      {
        heading: 'Testing is part of the toolchain',
        body: [
          'A test file ends in `_test.go` and sits in the same folder as the code it tests. Each test is a function starting with `Test` that takes a `*testing.T`. That is the whole setup: no framework to choose, no config file, no annotations.',
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
          note: 'Put the inputs, what you got and what you wanted in every failure message. A bare "failed" makes you rerun the test with print statements to find out why.',
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
        heading: 'Fuzzing: let Go invent the inputs',
        body: [
          'A table test only checks the cases you thought of. A **fuzz test** makes up thousands of inputs for you and looks for one that breaks a rule you state. It is a function starting `Fuzz` that takes a `*testing.F`. `f.Add` gives it a few starting inputs (the **seed corpus**), and `f.Fuzz` holds the check that must hold for every input.',
        ],
        code: {
          label: 'calc/reverse_test.go',
          src: `package calc

import "testing"

func FuzzReverse(f *testing.F) {
\tf.Add("hello") // seed inputs: Go starts from these and mutates them
\tf.Add("héllo")
\tf.Fuzz(func(t *testing.T, s string) {
\t\t// the rule: reversing twice gives back what you started with
\t\tif got := Reverse(Reverse(s)); got != s {
\t\t\tt.Errorf("Reverse(Reverse(%q)) = %q, want %q", s, got, s)
\t\t}
\t})
}`,
          note: 'A plain `go test` runs only the seed inputs, so it is fast. `go test -fuzz=FuzzReverse ./calc` keeps generating new inputs until you press Ctrl+C or it finds a failure. A failing input is saved under `testdata/fuzz/`, and from then on every plain `go test` runs it too.',
        },
      },
      {
        heading: 'Benchmarks with b.Loop',
        body: [
          'A **benchmark** measures how fast code runs. It is a function starting `Benchmark` that takes a `*testing.B`. Since Go 1.24 you write the timed part inside `for b.Loop() { ... }`. Older code uses `for i := 0; i < b.N; i++`, which still works, but `b.Loop` is better: setup written before the loop is not timed, and the compiler cannot optimise away the call you are measuring.',
        ],
        code: {
          label: 'calc/calc_test.go',
          src: `func BenchmarkAdd(b *testing.B) {
\tnums := []int{1, 2, 3} // setup: not timed
\tfor b.Loop() {
\t\tAdd(nums[0], nums[1])
\t}
}`,
          note: 'Run it with `go test -bench=. ./calc`. The output shows how many nanoseconds one call took (`ns/op`).',
        },
      },
      {
        heading: 'Error versus Fatal',
        bullets: [
          '`t.Error` records the failure and **keeps going**. Use it when the rest of the checks still make sense.',
          '`t.Fatal` records it and **stops that subtest**. Use it when continuing would panic, like after a failed setup.',
          '`t.Helper()` inside a helper function makes failures point at the caller, not at the helper.',
          '`t.Cleanup(fn)` runs teardown even when the test fails, and works from inside helpers where `defer` would not.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'Coverage tells you what is **definitely untested**. It does not tell you what is well tested. Cover your business logic and your error paths, and do not chase 100%. The last few percent tend to be tests written for the number, which assert little.',
        },
      },
    ],
    keyPoints: [
      'A `_test.go` file next to the code, a `TestXxx(t *testing.T)` function, and `go test`.',
      'Table-driven tests are the Go standard: cases as data, one loop, `t.Run` for subtests.',
      '`go test -run "TestX/case_name"` runs one case. The pattern is a regular expression.',
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
          'A percentage per package. It tells you what is definitely untested, not what is well tested.',
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
