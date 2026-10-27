import type { LangLesson } from '@/lib/types'

/** The mechanics a beginner needs before the core language: syntax, output, types, operators, strings, pointers. */
export const FUNDAMENTALS: LangLesson[] = [
  {
    slug: 'syntax-and-comments',
    title: 'Syntax, comments, and naming',
    navTitle: 'Syntax and comments',
    oneLine: 'The shape every Go file takes, and the naming rules the whole ecosystem follows.',
    objectives: [
      'Write a Go file with a package clause, an import block, and a doc-commented function.',
      'Explain why the opening brace must stay on the same line as `func main()`.',
      'Fix the compile errors caused by an unused import and an unused variable.',
    ],
    blocks: [
      {
        heading: 'What syntax means here',
        body: [
          '**Syntax** is the set of rules for how Go code must be written down: where the braces go, what counts as a statement, what the compiler will and will not accept. Go keeps its set small on purpose, so there is usually one way to write something.',
          'This topic covers the shape every Go file takes and how to write comments. The next one covers printing. It gets a lesson of its own because it is how you will inspect your program before you ever touch a debugger.',
        ],
      },
      {
        heading: 'Every file has the same three parts',
        code: {
          label: 'main.go',
          src: `package main          // 1. which package this file belongs to

import "fmt"          // 2. what it needs from elsewhere

func main() {         // 3. the code
\tfmt.Println("hello")
}`,
          canRun: true,
          note: 'The order is fixed: package, then imports, then everything else.',
        },
      },
      {
        heading: 'Things that surprise people on day one',
        bullets: [
          '**Semicolons are inserted for you.** You almost never type one. This is also why the opening brace must be on the *same* line: `func main()` followed by `{` on the next line does not compile.',
          '**Tabs, not spaces.** `gofmt` decides, and it chooses tabs. Do not fight it.',
          '**Unused imports and unused variables are compile errors**, not warnings.',
          '**Capitalisation is access control.** `fmt.Println` is exported. A lowercase function inside `fmt` could not be called from your code.',
        ],
      },
      {
        heading: 'Comments',
        code: {
          label: 'comments.go',
          src: `package main

import "fmt"

// A line comment. This is what you use nearly all the time.

/*
A block comment.
Mostly used to comment out code temporarily.
*/

// Add returns the sum of a and b.
// A doc comment starts with the name of the thing it describes.
func Add(a, b int) int { return a + b }

func main() {
\tfmt.Println(Add(2, 3)) // a comment can also sit at the end of a line
}`,
          canRun: true,
          note: 'Doc comments starting with the identifier name are read by `go doc` and pkg.go.dev. They are the documentation, not decoration.',
        },
      },
      {
        code: {
          label: 'calc.go — a package doc comment (excerpt)',
          src: `// Package calc does arithmetic on money amounts.
package calc`,
          note: 'A comment directly above the `package` line documents the whole package. You will write your own packages in **Packages**.',
        },
      },
      {
        heading: 'Multiple imports',
        code: {
          label: 'imports.go',
          src: `package main

import (
\t"fmt"
\t"strings"
)

func main() {
\tfmt.Println(strings.ToUpper("one import block, one name per line"))
}`,
          canRun: true,
          note: 'Group imports in brackets once you need more than one. `go fmt` sorts them for you.',
        },
      },
      {
        heading: 'Naming rules',
        bullets: [
          'Letters, digits, and underscore. Must not start with a digit. Case-sensitive.',
          '**MixedCaps, never under_scores.** `userID`, not `user_id`.',
          '**Capital = exported.** `Name` is visible outside the package, `name` is not.',
          '**Short names for short lives.** `i` in a loop, `n` for a count. A package-level name gets a full word.',
          '**Do not stutter.** Callers always write the package name first, so inside package `strings` the function is `ToUpper`, not `StringsToUpper`.',
          'Initialisms stay uppercase: `URL`, `ID`, `HTTP`. So `userID` and `parseURL`, never `userId` or `parseUrl`.',
        ],
      },
      {
        heading: 'Build this: a name badge',
        body: [
          'Put the pieces together. Write a program with a doc comment on `main`, two imports, and a helper function, then run it. Every line here uses something from this lesson.',
        ],
        code: {
          label: 'badge.go',
          src: `package main

import (
\t"fmt"
\t"strings"
)

// badge returns a name framed in a box of stars.
func badge(name string) string {
\tline := strings.Repeat("*", len(name)+4)
\treturn line + "\\n* " + name + " *\\n" + line
}

// main prints one badge.
func main() {
\tfmt.Println(badge("gopher"))
}`,
          canRun: true,
          note: 'Change the name and run it again. Then rename `badge` to `Badge` — it still works, because inside one package capitalisation does not matter.',
        },
      },
    ],
    keyPoints: [
      'Package, imports, code: in that order, in every file. Semicolons are automatic.',
      'The opening brace must be on the same line, because Go inserts semicolons for you.',
      'Unused imports and unused variables are compile errors, not warnings.',
      'MixedCaps naming, capital means exported, initialisms stay uppercase (`userID`, `parseURL`).',
    ],
    remember:
      'Capitalisation is not style in Go. It is the access modifier.',
    task: 'Write a one-file program with a doc comment on every function, two imports, and a helper that `main` calls. Then break it three ways (brace on its own line, an unused import, an unused variable) and read each error.',
    exercises: [
      {
        task: 'Put the opening brace of `func main()` on its own line and read the error.',
        answer:
          '`syntax error: unexpected semicolon or newline before {`. Go inserts a semicolon at the end of that line, so the brace must stay on it.',
      },
      {
        task: 'Add an unused import and an unused variable, and read both errors.',
        answer:
          '`"os" imported and not used` and `declared and not used: x`. Both are errors, not warnings, on purpose.',
      },
      {
        task: 'Comment out one line with `//` and three lines with `/* */`, and run the program each time.',
        answer:
          'Commented-out code is ignored by the compiler. Watch out: commenting out the only use of a variable or import turns it into an "unused" error.',
      },
    ],
    refs: [
      { label: 'fmt package', href: 'https://pkg.go.dev/fmt' },
      { label: 'Effective Go — Names', href: 'https://go.dev/doc/effective_go#names' },
      { label: 'Go Doc Comments', href: 'https://go.dev/doc/comment' },
    ],
  },

  {
    slug: 'printing-and-format-verbs',
    title: 'Printing in Go: Println, Printf and format verbs',
    navTitle: 'Printing and verbs',
    searchTitle: 'Printing in Golang: Printf format verbs, with examples',
    oneLine: 'How to print in Go with Print, Println and Printf, and the Printf format verbs you will use every day.',
    objectives: [
      'Choose between `Print`, `Println`, `Printf` and `Sprintf` for a given output.',
      'Predict the output of `Printf` with `%v`, `%T`, `%q`, `%.2f` and `%5d`.',
      'Write a literal percent sign and a padded column with format verbs.',
    ],
    blocks: [
      {
        heading: 'The three printing functions',
        code: {
          label: 'output.go',
          src: `name, age := "Sahdev", 25

fmt.Print("no newline, no spaces between strings")
fmt.Println("adds spaces and a newline:", name, age)
fmt.Printf("formatted: %s is %d\\n", name, age)    // Printf needs its own \\n

s := fmt.Sprintf("%s is %d", name, age)            // returns the string instead of printing it
fmt.Println(s)`,
          note: '`Sprintf` builds a string and hands it back to you. The `S` prefix means "give me a string" across the whole fmt package: `Sprint`, `Sprintln`, `Sprintf`.',
        },
      },
      {
        heading: 'Formatting verbs',
        table: {
          headers: ['Verb', 'What it prints', 'Example output'],
          rows: [
            ['`%v`', 'the value in its default form — your default choice', '`25`'],
            ['`%T`', 'the type of the value', '`int`'],
            ['`%d`', 'an integer', '`25`'],
            ['`%s`', 'a string', '`Sahdev`'],
            ['`%q`', 'a quoted string — shows whitespace clearly', '`"Sahdev"`'],
            ['`%f` / `%.2f`', 'a float / to two decimal places', '`3.140000` / `3.14`'],
            ['`%t`', 'a bool', '`true`'],
            ['`%x`', 'hexadecimal', '`1f`'],
            ['`%5d` / `%-5s`', 'pad to 5 wide, right / left aligned', '`   25` / `ab   `'],
            ['`%%`', 'a literal percent sign', '`%`'],
          ],
        },
      },
      {
        heading: 'Width, precision and flags',
        body: [
          'Between the `%` and the verb letter you can put flags, a width and a precision. The width pads the value to at least that many characters. The precision means digits after the point for a float, and the maximum number of characters for a string.',
        ],
        table: {
          headers: ['Format', 'Value', 'Output'],
          rows: [
            ['`%8.2f`', '`3.14159`', '4 spaces then `3.14` (8 wide, 2 decimals)'],
            ['`%-8.2f|`', '`3.14159`', '`3.14` then 4 spaces, then `|` (left aligned)'],
            ['`%05d`', '`42`', '`00042` (padded with zeros)'],
            ['`%+d`', '`42`', '`+42` (always show the sign)'],
            ['`%.3s`', '`"golang"`', '`gol` (cut to 3 characters)'],
            ['`%*d`', '`6, 42`', '4 spaces then `42` (width 6, taken from an argument)'],
            ['`%b` / `%o` / `%X`', '`10` / `8` / `255`', '`1010` / `10` / `FF`'],
            ['`%c` / `%U`', "`'G'`", '`G` / `U+0047`'],
            ['`%e`', '`1234.5678`', '`1.234568e+03`'],
          ],
        },
        callout: {
          tone: 'warn',
          text: 'A wrong verb does not stop the program. `fmt.Printf("%d", "hi")` prints `%!d(string=hi)`, and a missing argument prints `%!d(MISSING)`. `go vet` reports both before you run, so run it.',
        },
      },
      {
        heading: 'Verbs you will meet later',
        bullets: [
          '`%+v` and `%#v` print a **struct** with its field names. A struct is a value made of several named fields; you will learn it properly in **Structs**.',
          '`%p` prints a memory address. You will learn this in **Pointers**.',
          '`%w` wraps one error inside another, and only works in `fmt.Errorf`. You will learn this in **Error values**.',
          '`fmt.Fprintln` prints to a place you choose, such as the error stream `os.Stderr`, instead of the screen. It comes up in **Interfaces**.',
        ],
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import "fmt"

func main() {
	name, age, height, student := "sahdev", 25, 1.72, true

	fmt.Printf("%v %v %v %v\\n", name, age, height, student) // %v works for anything
	fmt.Printf("%T %T %T %T\\n", name, age, height, student) // the types

	fmt.Printf("%s is %d years old and %.2f m tall\\n", name, age, height)
	fmt.Printf("student? %t (%.1f%% done)\\n", student, 62.5)
	fmt.Printf("%q vs %s\\n", "  spaces  ", "  spaces  ")
	fmt.Printf("[%5d] [%-6s]\\n", age, name)
}
`,
          canRun: true,
          note: '`%v` prints anything sensibly; `%T` tells you what type Go thinks a value is. Those two cover most debugging.',
        },
      },
    ],
    keyPoints: [
      '`Println` for quick output, `Printf` for formatted, `Sprintf` to build a string.',
      '`%v` is the default for any value, `%T` shows the type.',
      '`Printf` needs its own `\\n`; `Println` adds one for you.',
      'The `S` prefix (`Sprintf`, `Sprintln`) returns a string instead of printing it.',
    ],
    remember:
      '`%v` prints anything and `%T` tells you its type. Learn them before you learn a debugger.',
    task: 'Print a string, an int, a float and a bool with `%v` and then with `%T`, and compare the outputs.',
    exercises: [
      {
        task: 'Build a sentence with `Sprintf`, store it in a variable, then print it with `Println`.',
        answer:
          '`msg := fmt.Sprintf("%s scored %d", "asha", 91)` then `fmt.Println(msg)` prints `asha scored 91`. `Sprintf` prints nothing by itself; it returns the string.',
      },
      {
        task: 'Format a float to two decimal places, and print a literal percent sign.',
        answer:
          '`fmt.Printf("%.2f%%\\n", 62.5)` prints `62.50%`. `%%` is how you get one literal percent sign.',
      },
      {
        task: 'Print a string with `%s` and `%q` and see which one shows the whitespace.',
        answer:
          '`%q` wraps it in quotes and escapes tabs and newlines, so leading and trailing whitespace becomes visible. Use it when debugging strings.',
      },
    ],
    refs: [
      { label: 'fmt package', href: 'https://pkg.go.dev/fmt' },
      { label: 'A Tour of Go — Printf', href: 'https://go.dev/tour/basics/11' },
    ],
  },

  {
    slug: 'basic-data-types',
    title: 'Basic data types',
    navTitle: 'Basic data types',
    oneLine: 'Every built-in type, why there are so many integer sizes, and what to actually use.',
    objectives: [
      'Choose the right built-in type for a count, an id, a decimal and a money amount.',
      'Predict the output of overflowing an `int8` or a `uint8`.',
      'Explain why `0.1 + 0.2` is not exactly `0.3` for float64 variables.',
    ],
    blocks: [
      {
        heading: 'What a type is, and why there are so many',
        body: [
          'A **type** tells Go two things: what kind of value a variable holds, and what you are allowed to do with it. `int` holds whole numbers and can be added; `string` holds text and can be joined. The compiler checks this before your program runs, so passing a `string` where an `int` is expected never reaches production.',
          'Go\'s built-in types are called **basic types**. There are more of them than in a language like Python because Go lets you say how big a number is, 8 bits or 64. That matters when you are talking to a database, a file format, or another machine.',
        ],
      },
      {
        heading: 'The full list',
        table: {
          headers: ['Type', 'Holds', 'Zero value'],
          rows: [
            ['`bool`', '`true` or `false`', '`false`'],
            ['`string`', 'immutable bytes, usually UTF-8 text', '`""`'],
            ['`int`, `uint`', 'whole numbers, 64-bit on 64-bit platforms', '`0`'],
            ['`int8` `int16` `int32` `int64`', 'signed, exact size', '`0`'],
            ['`uint8` `uint16` `uint32` `uint64`', 'unsigned, exact size', '`0`'],
            ['`byte`', 'alias for `uint8` — one byte of data', '`0`'],
            ['`rune`', 'alias for `int32` — one Unicode code point', '`0`'],
            ['`float32`, `float64`', 'decimals', '`0`'],
            ['`complex64`, `complex128`', 'complex numbers (you will not use these)', '`0`'],
          ],
        },
      },
      {
        heading: 'Which one do I actually use?',
        bullets: [
          '**`int` for counting anything.** It is the default, it is 64-bit on the servers and laptops you will deploy to, and using `int32` "to save memory" on a loop counter saves nothing.',
          '**`int64` for database ids** and anything crossing a wire format where the size must be fixed.',
          '**`float64` for decimals.** `float32` only when you have a specific reason, like graphics.',
          '**Never a float for money.** `0.1 + 0.2 != 0.3` in binary floating point. Use integer cents (the smallest currency unit), or a decimal library.',
          '**`byte` for raw data, `rune` for characters.** They are the same thing as `uint8` and `int32`, but the alias tells the reader your intent.',
        ],
      },
      {
        heading: 'Overflow wraps around, silently',
        code: {
          label: 'overflow.go',
          src: `var x int8 = 127
x++
fmt.Println(x)          // -128  — it wrapped. No panic, no warning.

var u uint8 = 0
u--
fmt.Println(u)          // 255

// the math package has the limits
fmt.Println(math.MaxInt64, math.MinInt64)`,
          run: `package main

import (
	"fmt"
	"math"
)

func main() {
	var x int8 = 127
	x++
	fmt.Println(x)          // -128  — it wrapped. No panic, no warning.

	var u uint8 = 0
	u--
	fmt.Println(u)          // 255

	// the math package has the limits
	fmt.Println(math.MaxInt64, math.MinInt64)
}
`,
          note: 'Converting to a smaller type truncates the same way: `int8(200)` on a variable gives -56. Go makes you write `int8(x)` so the narrowing is visible in the code.',
        },
      },
      {
        heading: 'Mixing types needs a conversion',
        body: [
          'Go will not add an `int` to a `float64` for you, and turning a number into text needs the `strconv` package. Both get a whole lesson of their own: **Type conversion**.',
        ],
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import "fmt"

func main() {
	var small int8 = 127
	small++
	fmt.Println("int8 overflow:", small) // -128, silently

	var count int = 3
	var price float64 = 2.50
	var name string = "tea"
	var paid bool
	var initial byte = 'T'
	var letter rune = 'é'

	fmt.Println(count, price, name, paid) // paid is false: its zero value
	fmt.Println(initial, letter)           // 84 233 — both are just numbers
	fmt.Printf("%c %c\\n", initial, letter) // T é — %c prints them as characters

	fmt.Println(0.1+0.2 == 0.3) // true here, but only because constants are exact
	a, b := 0.1, 0.2
	fmt.Println(a+b == 0.3) // false: float64 variables are not
}
`,
          canRun: true,
          note: 'Watch the int8 wrap around, see that `byte` and `rune` are numbers underneath, and see the float trap.',
        },
      },
    ],
    keyPoints: [
      '`int` for counting, `int64` for ids, `float64` for decimals, never a float for money.',
      'Overflow wraps silently. That is why every conversion between sizes is explicit.',
      '`byte` is `uint8` and `rune` is `int32`. The aliases exist to show intent.',
      'Every type starts at its zero value: `0`, `""` or `false`.',
    ],
    remember:
      'Go gives you exact-size types for when it matters, and `int` for when it does not.',
    task: 'Overflow an `int8` and a `uint8` on purpose. Then declare one variable of each type in the table without a value, and print them all on one line to see every zero value.',
    exercises: [
      {
        task: 'Print `math.MaxInt64` and `math.MinInt64`, then add one to each.',
        answer:
          '9223372036854775807 and -9223372036854775808. Held in an `int64` variable, max plus one wraps to the min with no panic, and min plus one is simply -9223372036854775807. Written as a constant, `math.MaxInt64 + 1` does not compile: the compiler reports the overflow.',
      },
      {
        task: 'Add 0.1 and 0.2 as float64 and print the result. That is why money is not a float.',
        answer:
          '0.30000000000000004. Binary floating point cannot represent 0.1 exactly, which is why money is stored as whole cents.',
      },
      {
        task: 'Store the price of three items as whole cents in an `int64`, add them, and print the total as dollars and cents with `/ 100` and `% 100`.',
        answer:
          'For 199 + 250 + 75 you get 524, printed as $5.24. Integer cents never lose a cent, which is why money code uses them instead of floats.',
      },
    ],
    refs: [
      { label: 'A Tour of Go — Basic types', href: 'https://go.dev/tour/basics/11' },
      { label: 'Go blog: Constants', href: 'https://go.dev/blog/constants' },
    ],
  },

  {
    slug: 'constants-and-iota',
    title: 'Constants and iota',
    navTitle: 'Constants and iota',
    oneLine: 'Values fixed at compile time, and how Go does enums without an enum keyword.',
    objectives: [
      'Write a const block that numbers a set of states with `iota`.',
      'Explain why an untyped constant fits a float64 and an int64 but a typed one does not.',
      'Predict the values `iota` produces in a block with a skipped first line and arithmetic.',
    ],
    blocks: [
      {
        heading: 'What a constant is',
        body: [
          'A **constant** is a value fixed when the program is compiled and never changed afterwards. It is not a variable you promise not to touch; the compiler enforces it. Try to assign to one and the program will not build.',
          'Use a constant for values that are true for the whole program: a limit, an app name, a tax rate.',
        ],
      },
      {
        heading: 'Constants',
        code: {
          label: 'const.go',
          src: `const Pi = 3.14159
const Greeting = "hello"

const (
\tMaxUploadMB = 10
\tAppName     = "snapnotes"
)

// A constant with no type written adapts to where it is used.
const ten = 10
var f float64 = ten          // fine: becomes 10.0
var i int64 = ten            // also fine

// A constant with a type written does not adapt
const typed int32 = 100
var x int64 = typed          // COMPILE ERROR`,
          note: 'A constant without a written type is called **untyped**. Go treats it as "just the number 10" until you put it somewhere, then it takes that type. That is why the same `ten` fits in both a `float64` and an `int64`.',
        },
      },
      {
        heading: 'iota — numbering without typing numbers',
        code: {
          label: 'iota.go',
          src: `const (
\tPending   = iota   // 0
\tActive             // 1
\tSuspended          // 2
\tDeleted            // 3
)

// iota is just a number, so you can do arithmetic with it
const (
\t_      = iota       // skip 0
\tSmall  = iota * 10  // 10
\tMedium              // 20
\tLarge               // 30
)`,
          run: `package main

import "fmt"

const (
	Pending   = iota   // 0
	Active             // 1
	Suspended          // 2
	Deleted            // 3
)

// iota is just a number, so you can do arithmetic with it
const (
	_      = iota       // skip 0
	Small  = iota * 10  // 10
	Medium              // 20
	Large               // 30
)

func main() {
	fmt.Println(Pending, Active, Suspended, Deleted) // 0 1 2 3
	fmt.Println(Small, Medium, Large)                // 10 20 30

	status := Active
	if status == Active {
		fmt.Println("the account is active")
	}
}
`,
          note: '`iota` starts at 0 in each `const` block and goes up by one per line. A line with no `=` repeats the previous expression with the next `iota`. Go has no `enum` keyword; this is how you number a set of choices. In **Methods and embedding** you will give them a type and make them print as words.',
        },
      },
      {"heading": "A real enum: its own type, a String method, and a safe zero value", "body": ["Plain `iota` constants are untyped integers, so any `int` can be passed where you meant a state. Giving them a named type (`type State int`) lets the compiler reject a stray number, and a `String()` method makes `fmt` print the name instead of the number.", "Start the block with an `Unknown` (or `Invalid`) value. Every Go variable starts at its zero value, so a `State` that was never set is `0`. If `0` were `Pending`, a forgotten assignment would look like a real state and nobody would notice.", "`1 << iota` gives each constant its own bit, which is the Go way to write a set of flags: combine them with `|`, test with `&`, and clear one with `&^` (AND NOT, an operator many languages do not have)."]},
      { code: { label: 'enum.go', src: `package main

import "fmt"

// State gets its own type, so a plain int cannot be passed by mistake.
type State int

const (
	Unknown   State = iota // 0, the zero value: "not set yet"
	Pending                // 1
	Active                 // 2
	Suspended              // 3
)

// String makes fmt print the name instead of the number.
func (s State) String() string {
	switch s {
	case Unknown:
		return "unknown"
	case Pending:
		return "pending"
	case Active:
		return "active"
	case Suspended:
		return "suspended"
	}
	return fmt.Sprintf("State(%d)", int(s))
}

// Perm is a set of bit flags: each constant is its own bit.
type Perm uint8

const (
	Read   Perm = 1 << iota // 1
	Write                   // 2
	Delete                  // 4
)

func main() {
	var s State // never assigned
	fmt.Println(s, Active, State(9))

	p := Read | Write
	fmt.Println(p&Write != 0, p&Delete != 0) // true false
	p &^= Write                              // clear the Write bit
	fmt.Println(p == Read)                   // true
}
`, run: `package main

import "fmt"

// State gets its own type, so a plain int cannot be passed by mistake.
type State int

const (
	Unknown   State = iota // 0, the zero value: "not set yet"
	Pending                // 1
	Active                 // 2
	Suspended              // 3
)

// String makes fmt print the name instead of the number.
func (s State) String() string {
	switch s {
	case Unknown:
		return "unknown"
	case Pending:
		return "pending"
	case Active:
		return "active"
	case Suspended:
		return "suspended"
	}
	return fmt.Sprintf("State(%d)", int(s))
}

// Perm is a set of bit flags: each constant is its own bit.
type Perm uint8

const (
	Read   Perm = 1 << iota // 1
	Write                   // 2
	Delete                  // 4
)

func main() {
	var s State // never assigned
	fmt.Println(s, Active, State(9))

	p := Read | Write
	fmt.Println(p&Write != 0, p&Delete != 0) // true false
	p &^= Write                              // clear the Write bit
	fmt.Println(p == Read)                   // true
}
` } },
      {"heading": "Pitfalls", "bullets": ["**Inserting a line renumbers everything after it.** If the numbers are stored in a database or sent over the wire, adding `Archived` in the middle silently changes what `3` means. Append new values at the end, or write the numbers out explicitly once they are persisted.", "**`iota` resets to 0 in every `const` block** and counts lines, not names: a blank `_` line still uses up a number.", "**A typed constant does not adapt.** `const Limit int32 = 100` cannot be assigned to an `int64` without a conversion; an untyped `const Limit = 100` can.", "**Untyped constants are exact until used.** `const big = 1 << 62` is fine; `var x int32 = big` does not compile, because the value does not fit. The check happens at compile time, not as a runtime overflow.", "**Only basic values can be constants:** numbers, strings, booleans and runes. A slice, map or struct has to be a `var`."]},
      {"heading": "Cost and the Go angle", "body": ["Constants cost nothing at run time: the compiler substitutes the value wherever it is used, and a `switch` over a small typed enum compiles to a few comparisons. The price of the Go approach is that nothing stops `State(9)` from existing, which is why the `String` method above has a fallback, and why code that receives a state from outside should validate it.", "For a larger set, `go generate` with the `stringer` tool writes the `String` method for you; it is in the `golang.org/x/tools` module."]},
    ],
    keyPoints: [
      'A constant is fixed at compile time. The compiler enforces it; it is not a promise.',
      'A constant without a written type adapts to where it is used; a typed one does not.',
      '`iota` counts up from 0 through a const block, and you can do maths with it.',
      'Go has no `enum` keyword. A const block with `iota` numbers a set of choices.',
    ],
    remember:
      'There are no constant slices, maps or structs. Those are `var`.',
    task: 'Write a const block of four order states with `iota`, then print each one and check one with an `if`.',
    exercises: [
      {
        task: 'Use `iota` to generate the even numbers 2, 4, 6.',
        answer:
          '`_ = iota` then `Two = iota * 2` then `Four` and `Six` on their own lines. Each line repeats `iota * 2` with the next iota.',
      },
      {
        task: 'Declare `const ten = 10` and assign it to both a float64 and an int64.',
        answer:
          'Both compile. A constant without a written type takes the type of wherever it is used.',
      },
      {
        task: 'Give the same constant an explicit type and watch the second assignment stop compiling.',
        answer:
          '`cannot use typed (constant 100 of type int32) as int64 value in variable declaration`. A typed constant no longer adapts.',
      },
    ],
    refs: [
      { label: 'A Tour of Go — Constants', href: 'https://go.dev/tour/basics/15' },
      { label: 'Go blog: Constants', href: 'https://go.dev/blog/constants' },
      { label: 'Effective Go — Constants', href: 'https://go.dev/doc/effective_go#constants' },
    ],
  },

  {
    slug: 'operators',
    title: 'Operators',
    navTitle: 'Operators',
    oneLine: 'Arithmetic, comparison, logical, and bitwise, plus what Go leaves out on purpose.',
    objectives: [
      'Predict the output of integer division, `%`, and shifts such as `3 << 10`.',
      'Write a boolean expression with `%`, `&&` and `||` that answers a yes/no question.',
      'Explain why `d != 0 && 10/d > 2` never divides by zero.',
    ],
    blocks: [
      {
        heading: 'What an operator is',
        body: [
          'An **operator** is a symbol that does something to one or two values: `+` adds them, `==` compares them, `&&` combines two true-or-false answers. They are the smallest building blocks of any expression you write.',
          'Go\'s operators are worth a proper look for two reasons. A few behave differently from other languages: integer division throws away the remainder, and `++` is a statement rather than something you can use inside an expression. And a few that other languages have, Go leaves out on purpose.',
        ],
      },
      {
        heading: 'Arithmetic',
        code: {
          label: 'arithmetic.go',
          src: `a, b := 10, 3

fmt.Println(a + b)   // 13
fmt.Println(a - b)   // 7
fmt.Println(a * b)   // 30
fmt.Println(a / b)   // 3   — INTEGER division truncates, it does not round
fmt.Println(a % b)   // 1   — remainder

fmt.Println(float64(a) / float64(b))   // 3.3333333333333335 — convert first if you want a decimal

a++        // a statement, NOT an expression. "x := a++" does not compile.
a--        // and there is no ++a either`,
          note: 'Integer division truncates toward zero, which surprises people coming from JavaScript or Python 3. 7/2 is 3, not 3.5, and -7/2 is -3.',
        },
      },
      {
        heading: 'Assignment',
        code: {
          label: 'assignment.go',
          src: `x := 10        // declare and assign (only inside a function)
x = 20         // assign to an existing variable
var y int = 5  // declare with an explicit type
fmt.Println(x, y)

x += 5         // x = x + 5
x -= 5
x *= 2
x /= 2
x %= 3
x <<= 1        // the bitwise ones work too
x &= 0xFF

a, b := 1, 2
a, b = b, a    // swap in one line, no temp variable
fmt.Println(a, b) // 2 1`,
        },
      },
      {
        heading: 'Comparison',
        code: {
          label: 'comparison.go',
          src: `package main

import "fmt"

func main() {
\ta, b := 3, 5
\tfmt.Println(a == b)             // false
\tfmt.Println(a != b)             // true
\tfmt.Println(a < b, a >= b)      // true false
\tfmt.Println(2.5 > 2.0)          // true — floats compare the same way
\tfmt.Println("apple" < "banana") // true — strings compare byte by byte
\tfmt.Println("Go" == "go")       // false — case matters
\tfmt.Println(true == !false)     // true — bools compare with == and != only

\t// Both sides must be the same type. This does not compile:
\t// fmt.Println(a == 2.5) // a is an int, 2.5 is not
}`,
          canRun: true,
          note: 'Every comparison gives back a `bool`. Later lessons show which other types can be compared with `==` and which cannot.',
        },
      },
      {
        heading: 'Logical, and short-circuiting',
        code: {
          label: 'logical.go',
          src: `package main

import "fmt"

func main() {
\ta, b := true, false
\tfmt.Println(a && b) // false — and
\tfmt.Println(a || b) // true  — or
\tfmt.Println(!a)     // false — not

\t// Both short-circuit: if the left side already decides the answer,
\t// the right side is never run. That is what makes this safe:
\td := 0
\tif d != 0 && 10/d > 2 { // 10/d is never reached when d is 0
\t\tfmt.Println("big")
\t} else {
\t\tfmt.Println("d is zero, skipped the division")
\t}
}`,
          canRun: true,
          note: 'Short-circuiting is not a micro-optimisation. Without it, `10/d` would crash the program with "integer divide by zero".',
        },
      },
      {
        heading: 'Bitwise',
        body: [
          'These work on the individual bits (the 1s and 0s) of an integer. `%b` prints a number in binary so you can watch them.',
          '**Shifts** move every bit left or right. `x << n` moves the bits `n` places left, which is the same as multiplying by 2, `n` times. `x >> n` moves them right, which is dividing by 2, `n` times (rounding down). So `1 << 10` is 1024 and `10 << 20` is 10 × 2²⁰ = 10 × 1,048,576, which is 10 MB. You will see that last one in real code as an upload size limit.',
        ],
        code: {
          label: 'bitwise.go',
          src: `a, b := 0b1100, 0b1010
fmt.Printf("%04b\\n", a&b)  // 1000  AND
fmt.Printf("%04b\\n", a|b)  // 1110  OR
fmt.Printf("%04b\\n", a^b)  // 0110  XOR
fmt.Printf("%04b\\n", a&^b) // 0100  AND NOT (bit clear) — this one is unique to Go
fmt.Println(a<<2, a>>2)     // 48 3 — shift left (a * 4), shift right (a / 4, rounding down)

// A common use: flags packed into one integer
const (
\tCanRead  = 1 << iota   // 1
\tCanWrite               // 2
\tCanAdmin               // 4
)

perms := CanRead | CanWrite          // set two flags
has := perms&CanWrite != 0           // test one
perms &^= CanWrite                   // clear one
fmt.Println(has, perms)              // true 1

// Shifts as sizes: 10 << 20 is 10 * 1,048,576 bytes
const maxUpload = 10 << 20           // 10 MB
fmt.Println(maxUpload)               // 10485760`,
        },
      },
      {
        heading: 'Two operators for later',
        body: [
          'You will also meet `&` and `*` in front of a variable, and `<-` next to a channel. Those are not maths: they belong to pointers and channels, and each gets its own lesson.',
        ],
        code: {
          label: '(preview — explained in Pointers, and Channels and select)',
          src: `p := &x   // p holds the address of x
v := <-ch // take a value out of channel ch`,
        },
      },
      {
        heading: 'What Go leaves out on purpose',
        bullets: [
          '**No ternary `?:`.** Write the `if`. The Go FAQ says the readability cost of nested ternaries is not worth the saved line.',
          '**No operator overloading.** You cannot define `+` for your own struct. `a + b` is numeric addition, or concatenation for strings, and nothing else.',
          '**No pointer arithmetic.** You cannot do `p + 1` to walk memory (outside the `unsafe` package). That is a large part of what makes Go memory-safe.',
          '**No `++` as an expression.** It is a statement, so `arr[i++]` does not compile, and neither do the order-of-evaluation bugs it allows in C.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'Precedence is simpler than in C: five levels, with `*` above `+` above comparison above `&&` above `||`. When in doubt, add brackets. `gofmt` keeps them, and the next reader does not have to remember the table.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import "fmt"

const (
	CanRead = 1 << iota // 1
	CanWrite            // 2
	CanAdmin            // 4
)

func loud(name string, v bool) bool {
	fmt.Println("  evaluated", name)
	return v
}

func main() {
	fmt.Println("7 / 2   =", 7/2)                        // 3, truncated
	fmt.Println("7.0 / 2 =", float64(7)/2)               // 3.5

	fmt.Println("short-circuit && :")
	_ = loud("left", false) && loud("right", true)       // right never runs

	perms := CanRead | CanWrite
	fmt.Printf("perms      = %04b\\n", perms)
	fmt.Println("can write? ", perms&CanWrite != 0)
	perms &^= CanWrite
	fmt.Printf("after clear= %04b\\n", perms)
}
`,
          canRun: true,
          note: 'Integer division, short-circuiting, and bit flags in one program.',
        },
      },
    ],
    keyPoints: [
      'Integer division truncates. Convert to float64 first if you want a decimal.',
      'Comparisons give a `bool`, and both sides must be the same type.',
      '`&&` and `||` short-circuit, which is what makes `x != nil && x.Field` safe.',
      'No ternary, no operator overloading, no pointer arithmetic. All three are left out on purpose.',
    ],
    remember:
      'None of Go’s operators can be redefined. `a + b` means addition, or concatenation for strings, in every file you will ever read.',
    task: 'Build a permissions integer with `iota` bit flags: set two permissions, test for one, clear one, and print the result with `%b` to watch the bits move.',
    exercises: [
      {
        task: 'Print `17 / 5`, `17 % 5`, and `float64(17) / 5`. Predict each before you run it.',
        answer: '`3`, `2`, `3.4`. Integer division throws away the remainder; `%` gives you the remainder; converting to float64 first keeps the decimal.',
      },
      {
        task: 'Write a permissions integer with three `iota` bit flags. Set two, test one, clear one, and print with `%03b` after each step.',
        answer:
          'With flags 1, 2 and 4: `001` after the first, `011` after the second, then `001` or `010` after clearing one, depending on which. Each flag owns one bit.',
      },
      {
        task: 'Prove short-circuiting to yourself: write `f()` and `g()` that each print their name and return a bool, then run `f() && g()`. Make `f` return false and see that `g` never runs.',
        answer: '`g` never prints when `f` returns false, because `false && anything` is already false. This is why `d != 0 && 10/d > 2` is safe.',
      },
      {
        task: 'Without running it, work out `1 << 3`, `40 >> 2`, and `3 << 10`. Then check.',
        answer: '`8` (1 × 2 × 2 × 2), `10` (40 ÷ 2 ÷ 2), `3072` (3 × 1024).',
      },
    ],
    challenge: {
      prompt: `Write \`IsLeapYear(year int) bool\` using only \`%\`, \`==\`, \`!=\`, \`&&\` and \`||\` (no \`if\`). A year is a leap year if it divides by 4, except years that divide by 100, unless they also divide by 400. Examples: \`2024 → true\`, \`1900 → false\`, \`2000 → true\`, \`2023 → false\`.`,
      starter: `package main

// IsLeapYear reports whether year is a leap year.
func IsLeapYear(year int) bool {
\treturn false
}
`,
      test: `package main

import "testing"

func TestIsLeapYear(t *testing.T) {
\tcases := []struct {
\t\tin   int
\t\twant bool
\t}{
\t\t{2024, true}, {2023, false}, {1900, false}, {2000, true}, {2100, false}, {1996, true},
\t}
\tfor _, c := range cases {
\t\tif got := IsLeapYear(c.in); got != c.want {
\t\t\tt.Errorf("IsLeapYear(%v) = %v, want %v", c.in, got, c.want)
\t\t}
\t}
}
`,
      solution: `package main

// IsLeapYear reports whether year is a leap year.
func IsLeapYear(year int) bool {
\treturn year%4 == 0 && (year%100 != 0 || year%400 == 0)
}
`,
    },
    refs: [
      { label: 'Language Specification — Operators', href: 'https://go.dev/ref/spec#Operators' },
      { label: 'FAQ: why no ternary operator?', href: 'https://go.dev/doc/faq#Does_Go_have_a_ternary_form' },
    ],
  },

  {
    slug: 'strings-and-formatting',
    title: 'Strings, bytes, and runes',
    navTitle: 'Strings and runes',
    oneLine: 'Why `len("héllo")` is 6, and the string operations you will use every day.',
    objectives: [
      'Explain why `len("héllo")` is 6 and not 5.',
      'Write a function that works per character with `[]rune` or `range` instead of bytes.',
      'Fix a string-building loop that uses `+=` by switching to `strings.Builder` or `strings.Join`.',
    ],
    blocks: [
      {
        heading: 'What a string is',
        body: [
          'A **string** in Go is a read-only sequence of **bytes**, almost always holding text encoded as UTF-8. The two important words are *bytes* and *read-only*.',
          '**Bytes, not characters.** In plain English text one character is one byte, so the difference never shows. Add an accent or an emoji and one character becomes two, three or four bytes. That is why `len` on a string does not tell you how many characters it has.',
          '**Read-only.** A string can never be changed after it is made. Joining two strings does not extend one of them; it builds a third and copies both in. That is fine once and expensive in a loop.',
        ],
      },
      {
        heading: 'A string is immutable bytes',
        body: [
          'Take a five-character word with one accent. Most beginner string bugs come from treating its bytes as characters.',
        ],
        code: {
          label: 'strings.go',
          src: `s := "héllo"

len(s)                        // 6  — BYTES. é takes two bytes in UTF-8.
utf8.RuneCountInString(s)     // 5  — actual characters

s[1]                          // 195 — a byte, not 'é'
string(s[1])                  // "Ã" — byte 195 read as code point U+00C3, not 'é'

for i, r := range s {         // range decodes UTF-8 for you
\tfmt.Printf("%d: %c\\n", i, r)   // i is 0, 1, 3, 4, 5 — é takes two bytes
}

rs := []rune(s)               // convert when you need character indexing
fmt.Println(string(rs[1]))    // "é"`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Indexing a string gives you a byte. `s[0:3]` slices bytes and can cut a character in half. If you are doing anything per-character, convert to `[]rune` first, or use `range`, which decodes for you.',
        },
      },
      {
        heading: 'Immutable means concatenation allocates',
        code: {
          label: 'builder.go',
          src: `// SLOW — every += allocates a whole new string. O(n²).
out := ""
for _, x := range items {
\tout += x
}

// FAST — one buffer that grows
var b strings.Builder
b.Grow(estimatedSize)          // optional, one allocation if you can estimate
for _, x := range items {
\tb.WriteString(x)
}
out := b.String()

// For a simple join, the stdlib already has it
out := strings.Join(items, ", ")`,
        },
      },
      {
        heading: 'The strings package',
        code: {
          label: 'ops.go',
          src: `strings.Contains(s, "ell")            // true
strings.HasPrefix(s, "he")
strings.HasSuffix(s, "lo")
strings.Index(s, "l")                 // first index, or -1
strings.Count(s, "l")

strings.ToLower(s)
strings.ToUpper(s)
strings.TrimSpace("  hi  ")           // "hi"
strings.Trim("xxhixx", "x")           // "hi"
strings.TrimPrefix("Bearer abc", "Bearer ")
strings.CutPrefix("Bearer abc", "Bearer ")   // "abc", true — Go 1.20+

strings.Split("a,b,c", ",")           // ["a" "b" "c"]
strings.SplitN("a,b,c", ",", 2)       // ["a" "b,c"]
strings.Fields("  a  b  c ")          // ["a" "b" "c"] — splits on any whitespace
strings.Join(parts, ",")
strings.Replace(s, "a", "b", 1)       // n replacements
strings.ReplaceAll(s, "a", "b")
strings.Repeat("ab", 3)               // "ababab"
strings.EqualFold("Go", "GO")         // true — case-insensitive compare`,
          note: 'Prefer `strings.EqualFold` over lowering both sides. Prefer `Cut`/`CutPrefix` over Index arithmetic: they are clearer, and there is no off-by-one to get wrong.',
        },
      },
      {
        heading: 'Cut: the one that replaced a lot of code',
        code: {
          label: 'cut.go',
          src: `before, after, found := strings.Cut("key=value", "=")
// "key", "value", true

// The same shape parses an Authorization header
token, ok := strings.CutPrefix(header, "Bearer ")`,
        },
      },
      {
        heading: 'Raw strings',
        code: {
          label: 'raw.go',
          src: `regular := "line one\\nline two\\tindented"     // escapes are processed

raw := \`line one
line two   C:\\path\\here   "quotes" fine\`      // nothing is processed

// This is why every SQL query in this track is a raw string:
const q = \`
SELECT id, name FROM users
 WHERE id = $1 AND active = true\``,
          note: 'Backticks: no escaping, newlines allowed. Use them for SQL, JSON literals, regexes, and struct tags.',
        },
      },
      {
        heading: 'Bytes when performance matters',
        body: [
          'Every `strings` function has a `bytes` twin that works on `[]byte`. Converting between `string` and `[]byte` copies, so in a hot loop reading from a network or a file, staying in `[]byte` avoids that copy. Everywhere else, use `string`: it is immutable, safe to share between goroutines, and usable as a map key.',
        ],
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import (
	"fmt"
	"strings"
	"unicode/utf8"
)

func main() {
	s := "héllo"
	fmt.Println("len (bytes)  :", len(s))
	fmt.Println("runes (chars):", utf8.RuneCountInString(s))
	fmt.Printf("s[1] is a byte: %d %q\\n", s[1], s[1])

	for i, r := range s {
		fmt.Printf("  index %d -> %c\\n", i, r) // the index jumps
	}

	var b strings.Builder
	for i := 0; i < 5; i++ {
		b.WriteString("ab")
	}
	fmt.Println("builder:", b.String())

	before, after, found := strings.Cut("Bearer abc123", " ")
	fmt.Println("cut:", before, "|", after, "|", found)
}
`,
          canRun: true,
          note: 'Bytes versus characters, a `strings.Builder`, and `Cut`.',
        },
      },
    ],
    keyPoints: [
      '`len` counts bytes. `range` and `[]rune` give you characters.',
      'Strings are immutable, so `+=` in a loop is O(n²). Use `strings.Builder` or `Join`.',
      '`Cut`, `CutPrefix`, `Fields`, and `EqualFold` replace most hand-written parsing.',
      'Backtick raw strings for SQL, regexes, and anything with backslashes.',
    ],
    remember:
      'A string is bytes, not characters. The moment you index or slice one, ask yourself whether you meant a byte or a character.',
    task: 'Write a function that reverses a string correctly for "héllo" and for an emoji. Do it with `[]byte` first and watch it break. That failure is the lesson.',
    challenge: {
      prompt: `Write \`Reverse(s string) string\` that reverses a string by characters, not bytes, so accents and emoji survive. Examples: \`"abc" → "cba"\`, \`"héllo" → "olléh"\`, \`"" → ""\`.`,
      starter: `package main

// Reverse returns s with its characters in reverse order.
func Reverse(s string) string {
\treturn s
}
`,
      test: `package main

import "testing"

func TestReverse(t *testing.T) {
\tcases := []struct{ in, want string }{
\t\t{"abc", "cba"}, {"héllo", "olléh"}, {"", ""}, {"go🙂", "🙂og"}, {"a", "a"},
\t}
\tfor _, c := range cases {
\t\tif got := Reverse(c.in); got != c.want {
\t\t\tt.Errorf("Reverse(%q) = %q, want %q", c.in, got, c.want)
\t\t}
\t}
}
`,
      solution: `package main

// Reverse returns s with its characters in reverse order.
func Reverse(s string) string {
\tr := []rune(s)
\tfor i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {
\t\tr[i], r[j] = r[j], r[i]
\t}
\treturn string(r)
}
`,
    },
    refs: [
      { label: 'strings package', href: 'https://pkg.go.dev/strings' },
      { label: 'Go blog: Strings, bytes, runes and characters', href: 'https://go.dev/blog/strings' },
    ],
  },

  {
    slug: 'pointers-and-memory',
    title: 'Pointers',
    navTitle: 'Pointers',
    oneLine: 'What `&` and `*` do, when you need them, and why Go pointers cannot hurt you the way C ones can.',
    objectives: [
      'Predict whether a function call changes the caller\'s value when it takes a value versus a pointer.',
      'Write a function that changes its argument through a pointer.',
      'Explain how a nil `*int` tells "no value" apart from zero.',
    ],
    blocks: [
      {
        heading: 'What a pointer is',
        body: [
          'Every value your program holds lives somewhere in memory, and every location has an address. A **pointer** is a value that holds one of those addresses instead of the data itself. It is a way of saying “the thing over there” rather than carrying a copy of the thing around.',
          'You need them for two reasons. Go copies values when you pass them to a function, so without a pointer a function cannot change what the caller gave it. And copying a large value on every call costs time you may not want to spend.',
          'Pointers have a bad reputation from C, where they can be moved around arithmetically and freed by hand. Go removes both of those, which takes away almost everything that made them dangerous.',
        ],
      },
      {
        heading: 'The two operators',
        code: {
          label: 'pointers.go',
          src: `x := 42

p := &x           // & takes the ADDRESS. p is of type *int.
fmt.Println(p)    // 0xc000018030 — an address
fmt.Printf("%p\\n", p) // %p is the verb for printing an address
fmt.Println(*p)   // 42 — * DEREFERENCES: "the value at this address"

*p = 100          // write through the pointer
fmt.Println(x)    // 100 — x changed

var q *int        // the zero value of a pointer is nil
fmt.Println(q == nil)   // true
// fmt.Println(*q)      // PANIC: nil pointer dereference`,
          run: `package main

import "fmt"

func main() {
	x := 42

	p := &x           // & takes the ADDRESS. p is of type *int.
	fmt.Println(p)    // 0xc000018030 — an address
	fmt.Printf("%p\\n", p) // %p is the verb for printing an address
	fmt.Println(*p)   // 42 — * DEREFERENCES: "the value at this address"

	*p = 100          // write through the pointer
	fmt.Println(x)    // 100 — x changed

	var q *int        // the zero value of a pointer is nil
	fmt.Println(q == nil)   // true
	// fmt.Println(*q)      // PANIC: nil pointer dereference
}
`,
        },
      },
      {
        heading: 'Why you would want one',
        body: [
          'Go passes everything by value, so a function receives a **copy**. A pointer is how you let a function change the caller’s variable.',
        ],
        code: {
          label: 'why.go',
          src: `func double(n int)   { n *= 2 }    // changes the copy. Caller sees nothing.
func doubleP(n *int) { *n *= 2 }   // changes the caller's variable.

x := 5
double(x)
fmt.Println(x)     // 5
doubleP(&x)
fmt.Println(x)     // 10`,
          note: 'Pointers to structs (`&User{...}`, and why you can write `p.Name` without a `*`) come in **Structs**, once you have met structs.',
        },
      },
      {
        heading: 'When to use a pointer',
        table: {
          headers: ['Use a pointer', 'Use a value'],
          rows: [
            ['the function must change the argument', 'the function only reads it'],
            ['"no value" and zero must be different (see below)', 'zero is a fine default'],
            ['the value is large and copying is measurable', 'the value is a number, a bool or a short string'],
          ],
        },
      },
      {
        heading: 'A pointer as "maybe a value"',
        body: [
          'Because a pointer can be `nil`, it can say "there is no value here", which a plain `int` cannot: an `int` is always some number, even if it is 0. `*int` lets `nil` mean "not given" while `0` still means zero.',
        ],
        code: {
          label: 'optional.go',
          src: `func describe(age *int) string {
	if age == nil {
		return "age not given"
	}
	return fmt.Sprint("age ", *age)   // could be 0, and that is a real answer
}`,
          note: 'This trick matters most for struct fields read from JSON, where it tells "the client did not send this" from "the client sent 0 or an empty string". You will see it in **Structs** and **JSON**.',
        },
      },
      {
        heading: 'new versus make',
        code: {
          label: 'new-make.go',
          src: `p := new(int)              // *int pointing at a zero int. Rarely used.

// make is ONLY for slices, maps, and channels — it initialises them
s := make([]int, 0, 10)
m := make(map[string]int)
ch := make(chan int, 5)

// new(map[string]int) gives you a POINTER TO A NIL MAP. Writing to it panics.`,
          note: 'Rule of thumb: `make` for slices, maps and channels, and you will almost never type `new`. For structs you will write `&T{...}`, shown in **Structs**.',
        },
      },
      {
        heading: 'What Go pointers cannot do',
        bullets: [
          '**No pointer arithmetic.** You cannot do `p + 1` to walk through memory, so buffer overruns through a pointer are ruled out.',
          '**No dangling pointers.** Returning `&x` from a function is safe, because the garbage collector keeps `x` alive. In C that returns a pointer into a stack frame that no longer exists; in Go, escape analysis moves `x` to the heap.',
          '**No manual free.** The GC handles it. You cannot double-free or use-after-free.',
          '**The main thing that can bite you: a nil dereference**, which panics rather than corrupting memory. A crash with a stack trace beats silent corruption.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'Do not sprinkle pointers everywhere "for performance". A copy of a small value is often faster than a pointer, because it can stay on the stack or in registers, while a pointer can force the value onto the heap where the garbage collector has to track it. Reach for a pointer when you need to mutate or when you have measured a copy cost, not by default.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import "fmt"

func double(n int)   { n *= 2 }  // gets a copy
func doubleP(n *int) { *n *= 2 } // gets the address

func describe(age *int) string {
	if age == nil {
		return "age not given"
	}
	return fmt.Sprint("age ", *age)
}

func main() {
	x := 5
	double(x)
	fmt.Println("after value call  :", x)
	doubleP(&x)
	fmt.Println("after pointer call:", x)

	var missing *int
	zero := 0
	fmt.Println(describe(missing)) // age not given
	fmt.Println(describe(&zero))   // age 0
}
`,
          canRun: true,
          note: 'A copy versus a pointer, and nil as "no value".',
        },
      },
    ],
    keyPoints: [
      '`&x` takes an address, `*p` reads and writes through it.',
      'Pointers let a function change the caller’s variable instead of a copy.',
      'A `nil` pointer can mean "no value", which zero cannot.',
      '`make` for slices/maps/channels. No pointer arithmetic, no manual free.',
    ],
    remember:
      'A pointer is a value holding an address. Go removes the dangerous parts (arithmetic and manual freeing) and keeps the useful part.',
    task: 'Write `func swap(a, b *int)` that swaps two variables, and `func maxOf(nums []int) *int` that returns `nil` for an empty slice. Call both and print the results.',
    refs: [
      { label: 'A Tour of Go — Pointers', href: 'https://go.dev/tour/moretypes/1' },
      { label: 'FAQ: pointer or value receiver?', href: 'https://go.dev/doc/faq#methods_on_values_or_pointers' },
    ],
  },

  {
    slug: 'type-switches',
    title: 'Type assertions and type switches',
    navTitle: 'Type switches',
    oneLine: 'Getting the concrete value back out of an interface, safely.',
    objectives: [
      'Write a comma-ok type assertion that never panics.',
      'Write a type switch that handles several concrete types and a default.',
      'Fix a type switch where a broad interface case hides a more specific one.',
    ],
    blocks: [
      {
        heading: 'The problem',
        body: [
          'An interface value hides what is inside it. A variable of type `any` might hold an `int`, a `string`, or your own struct. Most of the time that is the point: you call the methods and do not care.',
          'Sometimes you do care. A **type assertion** asks "is the value inside this interface of type T?", and if so gives it back to you as a T.',
        ],
      },
      {
        heading: 'Type assertions, and the comma-ok form',
        code: {
          label: 'assert.go',
          src: `package main

import "fmt"

func main() {
	var v any = "hello"

	s := v.(string) // "I am sure it is a string"
	fmt.Println(s, len(s))

	n, ok := v.(int) // "is it an int?" — no panic, just ok=false
	fmt.Println(n, ok) // 0 false

	if s, ok := v.(string); ok {
		fmt.Println("it was a string:", s)
	}

	// v.(int) without the ok would panic:
	// interface conversion: interface {} is string, not int
}
`,
          canRun: true,
          note: 'Use the one-value form only when a wrong type is a bug that should crash. Everywhere else, use comma-ok.',
        },
      },
      {
        heading: 'Type switches',
        body: [
          'When there are several types to check, a **type switch** does all the assertions in one go. Inside each case, the variable already has that case’s type.',
        ],
        code: {
          label: 'switch.go',
          src: `package main

import "fmt"

type Point struct{ X, Y int }

func describe(v any) string {
	switch x := v.(type) {
	case nil:
		return "nothing"
	case int:
		return fmt.Sprintf("an int, doubled is %d", x*2) // x is an int here
	case string:
		return fmt.Sprintf("a string of %d bytes", len(x)) // x is a string here
	case Point:
		return fmt.Sprintf("a point at %d,%d", x.X, x.Y)
	case error:
		return "an error: " + x.Error() // cases can be interfaces too
	default:
		return fmt.Sprintf("something else: %T", x)
	}
}

func main() {
	fmt.Println(describe(nil))
	fmt.Println(describe(21))
	fmt.Println(describe("héllo"))
	fmt.Println(describe(Point{1, 2}))
	fmt.Println(describe(fmt.Errorf("boom")))
	fmt.Println(describe(3.5))
}
`,
          canRun: true,
          note: '`.(type)` only works inside a `switch`. Cases are checked top to bottom, so put specific types before broad interfaces.',
        },
      },
      {
        body: [
          'Errors are often wrapped inside other errors, which a plain type assertion cannot see through. The tool for that is covered in **Error values in depth**.',
        ],
      },
      {
        callout: {
          tone: 'warn',
          text: 'A long type switch over your own types is often a sign that a method is missing. If every case calls a different "area" formula, give the types an `Area()` method and an interface instead. Switch on types at the edges, where values arrive as `any` (JSON, config, errors).',
        },
      },
    ],
    keyPoints: [
      '`v.(T)` gets a T out of an interface, and panics if it is not one.',
      '`t, ok := v.(T)` never panics. `ok` tells you whether it worked.',
      '`switch x := v.(type)` checks many types at once; in each case `x` has that type.',
      'Cases run top to bottom, so put specific types before broad interfaces.',
    ],
    remember:
      'Comma-ok unless a wrong type is a bug.',
    task: 'Write `func sum(values []any) (float64, error)` that adds up ints, float64s and numeric strings (use `strconv.ParseFloat`), and returns an error naming the first value of any other type.',
    exercises: [
      {
        task: 'Assert `any(42).(string)` without comma-ok and read the panic.',
        answer:
          '`panic: interface conversion: interface {} is int, not string`. The message names both types, which makes it easy to debug, but it is still a crash.',
      },
      {
        task: 'In a type switch, put `case error:` above `case *MyError:` and see what happens.',
        answer:
          '`*MyError` implements `error`, so the first case always wins and the second never runs. Order specific types before broad interfaces.',
      },
      {
        task: 'Write a case that lists two types, `case int, int64:`, and print `%T` of the variable inside it.',
        answer:
          'With more than one type in a case, the variable keeps the type of the switch expression (here, `any`), because Go cannot know which one it is. `%T` still shows the real type underneath.',
      },
    ],
    challenge: {
      prompt: `Write \`Describe(v any) string\` with a type switch. An \`int\` gives \`"int N"\`, a \`string\` gives \`"string of N bytes"\`, a \`bool\` gives \`"bool"\`, and anything else gives \`"unknown"\`. Examples: \`21 → "int 21"\`, \`"héllo" → "string of 6 bytes"\`, \`true → "bool"\`, \`3.5 → "unknown"\`.`,
      starter: `package main

// Describe names the type of v.
func Describe(v any) string {
\treturn ""
}
`,
      test: `package main

import "testing"

func TestDescribe(t *testing.T) {
\tcases := []struct {
\t\tin   any
\t\twant string
\t}{
\t\t{21, "int 21"}, {"héllo", "string of 6 bytes"}, {true, "bool"}, {3.5, "unknown"}, {nil, "unknown"},
\t}
\tfor _, c := range cases {
\t\tif got := Describe(c.in); got != c.want {
\t\t\tt.Errorf("Describe(%v) = %v, want %v", c.in, got, c.want)
\t\t}
\t}
}
`,
      solution: `package main

import "fmt"

// Describe names the type of v.
func Describe(v any) string {
\tswitch x := v.(type) {
\tcase int:
\t\treturn fmt.Sprintf("int %d", x)
\tcase string:
\t\treturn fmt.Sprintf("string of %d bytes", len(x))
\tcase bool:
\t\treturn "bool"
\tdefault:
\t\treturn "unknown"
\t}
}
`,
    },
    refs: [
      { label: 'A Tour of Go — Type assertions', href: 'https://go.dev/tour/methods/15' },
      { label: 'A Tour of Go — Type switches', href: 'https://go.dev/tour/methods/16' },
    ],
  },

  {
    slug: 'iterators',
    title: 'Iterators and range over functions',
    navTitle: 'Iterators',
    oneLine: 'What `range` can loop over since Go 1.22 and 1.23, and why `maps.Keys` returns a function.',
    objectives: [
      'Write a loop with `range` over an integer.',
      'Write an `iter.Seq[int]` function that stops when `yield` returns false.',
      'Predict what printing `maps.Keys(m)` shows, and fix it with `slices.Sorted`.',
    ],
    blocks: [
      {
        heading: 'range over an int',
        body: [
          'Since Go 1.22, `range` works on a plain integer. `for i := range 5` counts 0 to 4. It is the three-part loop with less to get wrong.',
        ],
        code: {
          label: 'range-int.go',
          src: `package main

import "fmt"

func main() {
	for i := range 3 {
		fmt.Println("attempt", i+1)
	}
}
`,
          canRun: true,
        },
      },
      {
        heading: 'What an iterator is',
        body: [
          'An **iterator** is a function that produces values one at a time by calling a function you give it, called `yield`. When `yield` returns false, the loop has stopped (a `break`, say), and the iterator must stop too.',
          'Since Go 1.23 you can `range` over such a function directly. The `iter` package names the two shapes: `iter.Seq[V]` gives one value per step, `iter.Seq2[K, V]` gives two, like a map’s key and value.',
        ],
        code: {
          label: 'countdown.go',
          src: `package main

import (
	"fmt"
	"iter"
)

// Countdown yields n, n-1, ... 1.
func Countdown(n int) iter.Seq[int] {
	return func(yield func(int) bool) {
		for i := n; i > 0; i-- {
			if !yield(i) { // the loop said stop
				return
			}
		}
	}
}

func main() {
	for v := range Countdown(5) {
		if v == 2 {
			break // yield returns false, and Countdown returns
		}
		fmt.Println(v)
	}
}
`,
          canRun: true,
          note: 'Forget the `if !yield(...)` check and the program panics when the loop breaks early. Always check it.',
        },
      },
      {
        heading: 'Two values per step: iter.Seq2',
        code: {
          label: 'seq2.go',
          src: `package main

import (
	"fmt"
	"iter"
)

// Lines yields each line number with its text.
func Lines(lines []string) iter.Seq2[int, string] {
	return func(yield func(int, string) bool) {
		for i, l := range lines {
			if !yield(i+1, l) {
				return
			}
		}
	}
}

func main() {
	for n, text := range Lines([]string{"package main", "", "func main() {}"}) {
		fmt.Printf("%d: %q\\n", n, text)
	}
}
`,
          canRun: true,
        },
      },
      {
        heading: 'The standard library speaks iterators',
        body: [
          '`maps.Keys(m)` and `maps.Values(m)` return an `iter.Seq`, not a slice, so nothing is copied until you ask. `slices.Collect` turns any `iter.Seq` into a slice, and `slices.Sorted` collects and sorts in one step. `slices.All` and `slices.Values` go the other way, turning a slice into an iterator.',
        ],
        code: {
          label: 'stdlib-iter.go',
          src: `package main

import (
	"fmt"
	"maps"
	"slices"
)

func main() {
	stock := map[string]int{"pears": 3, "apples": 5, "figs": 1}

	keys := slices.Sorted(maps.Keys(stock)) // sorted []string, every run
	fmt.Println(keys)

	counts := slices.Collect(maps.Values(stock)) // a []int, in random order
	fmt.Println(len(counts), "values")

	for _, k := range keys {
		fmt.Println(k, stock[k])
	}
}
`,
          canRun: true,
          note: '`slices.Sorted(maps.Keys(m))` is the one-line answer to "print a map in order".',
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Do not turn every loop into an iterator. Return a slice when the caller wants all the values anyway. Iterators earn their place when the sequence is large, endless, or expensive to build, or when the caller may stop early.',
        },
      },
    ],
    keyPoints: [
      '`for i := range n` counts from 0 to n-1 (Go 1.22).',
      'An iterator is a function that calls `yield` for each value, and stops when `yield` returns false (Go 1.23).',
      '`iter.Seq[V]` yields one value per step, `iter.Seq2[K, V]` yields two.',
      '`maps.Keys` returns an iterator. `slices.Collect` and `slices.Sorted` turn one into a slice.',
    ],
    remember:
      'An iterator is just a function you can range over. Always check what yield returns.',
    task: 'Write `func Fib() iter.Seq[int]` that yields Fibonacci numbers forever. Range over it and break after the first value above 1000. Then write `Evens(seq iter.Seq[int]) iter.Seq[int]` that filters another iterator.',
    exercises: [
      {
        task: 'Remove the `if !yield(i)` check from `Countdown`, call `yield(i)` on its own, and break out of the loop early.',
        answer:
          'It panics: `range function continued iteration after function for loop body returned false`. Go checks that an iterator stops when it is told to.',
      },
      {
        task: 'Print `maps.Keys(m)` directly with `fmt.Println`.',
        answer:
          'You get a function address like `0x47b0e0`, not the keys. It is a function, so collect it first with `slices.Collect` or `slices.Sorted`.',
      },
      {
        task: 'Loop over `slices.All([]string{"a", "b"})` and print what you get each step.',
        answer:
          'The index and the value, exactly like ranging over the slice itself. `slices.All` is an `iter.Seq2[int, E]`, so you can pass a slice to anything that accepts one.',
      },
    ],
    challenge: {
      prompt: `Write \`Evens(seq iter.Seq[int]) iter.Seq[int]\` that yields only the even numbers from \`seq\`, and stops when \`yield\` returns false. Examples: \`1 2 3 4 → 2 4\`, \`1 3 5 → (nothing)\`, \`0 -2 7 → 0 -2\`.`,
      starter: `package main

import "iter"

// Evens yields the even numbers from seq.
func Evens(seq iter.Seq[int]) iter.Seq[int] {
\treturn func(yield func(int) bool) {}
}
`,
      test: `package main

import (
\t"slices"
\t"testing"
)

func TestEvens(t *testing.T) {
\tcases := []struct{ in, want []int }{
\t\t{[]int{1, 2, 3, 4}, []int{2, 4}}, {[]int{1, 3, 5}, nil}, {[]int{0, -2, 7}, []int{0, -2}},
\t}
\tfor _, c := range cases {
\t\tif got := slices.Collect(Evens(slices.Values(c.in))); !slices.Equal(got, c.want) {
\t\t\tt.Errorf("Evens(%v) = %v, want %v", c.in, got, c.want)
\t\t}
\t}
\tfor v := range Evens(slices.Values([]int{2, 4, 6})) {
\t\tif v != 2 {
\t\t\tt.Errorf("Evens([2 4 6]) after break = %v, want %v", v, 2)
\t\t}
\t\tbreak
\t}
}
`,
      solution: `package main

import "iter"

// Evens yields the even numbers from seq.
func Evens(seq iter.Seq[int]) iter.Seq[int] {
\treturn func(yield func(int) bool) {
\t\tfor v := range seq {
\t\t\tif v%2 == 0 && !yield(v) {
\t\t\t\treturn
\t\t\t}
\t\t}
\t}
}
`,
    },
    refs: [
      { label: 'Go blog: Range over function types', href: 'https://go.dev/blog/range-functions' },
      { label: 'iter package', href: 'https://pkg.go.dev/iter' },
      { label: 'Language Specification — For range', href: 'https://go.dev/ref/spec#For_range' },
    ],
  },
]
