import type { LangLesson } from '@/lib/types'

/** The mechanics a beginner needs before the core language: syntax, output, types, operators, strings, pointers. */
export const FUNDAMENTALS: LangLesson[] = [
  {
    slug: 'syntax-and-comments',
    title: 'Syntax, comments, and naming',
    navTitle: 'Syntax and comments',
    oneLine: 'The shape every Go file takes, and the naming rules the whole ecosystem follows.',
    blocks: [
      {
        heading: 'What syntax means here',
        body: [
          '**Syntax** is the set of rules for how Go code must be written down — where the braces go, what counts as a statement, what the compiler will and will not accept. Every language has its own, and Go keeps its set small on purpose: there is usually one way to write something.',
          'This topic covers the shape every Go file takes, how to write comments, and how to print things. Printing is worth a whole topic because it is how you will inspect your program before you ever touch a debugger.',
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
          '**Semicolons are inserted for you.** You never type one. This is also why the opening brace must be on the *same* line — `func main()` followed by `{` on the next line does not compile.',
          '**Tabs, not spaces.** `gofmt` decides, and it chooses tabs. Do not fight it.',
          '**Unused imports and unused variables are compile errors**, not warnings.',
          '**Capitalisation is access control.** `Println` is exported; `println` would be private.',
        ],
      },
      {
        heading: 'Comments',
        code: {
          label: 'comments.go',
          src: `// A line comment. This is what you use 99% of the time.

/*
A block comment.
Mostly used to comment out code temporarily.
*/

// Package calc does arithmetic on money amounts.
package calc

// Add returns the sum of a and b.
// A doc comment starts with the name of the thing it describes.
func Add(a, b int) int { return a + b }`,
          note: 'Doc comments starting with the identifier name are read by `go doc` and pkg.go.dev. They are the documentation, not decoration.',
        },
      },
      {
        heading: 'Multiple imports',
        code: {
          label: 'imports.go',
          src: `import (
\t"fmt"
\t"os"
\t"strings"

\t"github.com/jackc/pgx/v5/stdlib"     // gofmt groups third-party separately
)

import _ "net/http/pprof"    // blank import: run its init(), use nothing from it
import f "fmt"               // alias, when two packages share a name`,
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Learn `%+v` early. When something is wrong with a struct, `fmt.Printf("%+v\\n", x)` shows every field with its name, and it is the fastest debugging tool in Go.',
        },
      },
    ],
    keyPoints: [
      'Package, imports, code — in that order, in every file. Semicolons are automatic.',
      'The opening brace must be on the same line, because Go inserts semicolons for you.',
      'Unused imports and unused variables are compile errors, not warnings.',
      'MixedCaps naming, capital means exported, and never repeat the package name in a type.',
    ],
    remember:
      'Capitalisation is not style in Go — it is the access modifier.',
    task: 'Write a two-file package with one exported and one unexported function. Try calling the unexported one from the other file, then from a different package.',
    exercises: [
      {
        task: 'Put the opening brace of `func main()` on its own line and read the error.',
        answer:
          '`syntax error: unexpected semicolon or newline before {`. Go inserts a semicolon at the end of that line, so the brace must stay on it.',
      },
      {
        task: 'Add an unused import and an unused variable, and read both errors.',
        answer:
          '`"os" imported and not used` and `declared and not used: x`. Both are errors, not warnings — that is on purpose.',
      },
      {
        task: 'Write a doc comment on an exported function, then run `go doc ./yourpackage`.',
        answer:
          '`go doc` prints your comment under the function signature. That is the documentation — there is no separate doc format.',
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
    title: 'Printing and format verbs',
    navTitle: 'Printing and verbs',
    oneLine: 'The three printing functions, and the verbs you will use every day.',
    blocks: [
      {
        heading: 'The three printing functions',
        code: {
          label: 'output.go',
          src: `name, age := "Sahdev", 25

fmt.Print("no newline, no spaces between strings")
fmt.Println("adds spaces and a newline:", name, age)
fmt.Printf("formatted: %s is %d\\n", name, age)    // Printf needs its own \\n

s := fmt.Sprintf("%s is %d", name, age)            // returns the string instead
fmt.Fprintln(os.Stderr, "goes to stderr")          // writes to any io.Writer`,
          note: 'Sprintf builds a string; Fprintf writes to a Writer. The S and F prefixes work the same across the whole fmt package.',
        },
      },
      {
        heading: 'Formatting verbs',
        table: {
          headers: ['Verb', 'What it prints', 'Example output'],
          rows: [
            ['`%v`', 'the value in its default form — your default choice', '`{1 Sahdev}`'],
            ['`%+v`', 'a struct **with field names** — best for debugging', '`{ID:1 Name:Sahdev}`'],
            ['`%#v`', 'valid Go syntax for the value', '`main.User{ID:1, Name:"Sahdev"}`'],
            ['`%T`', 'the type', '`main.User`'],
            ['`%d`', 'an integer', '`25`'],
            ['`%s`', 'a string', '`Sahdev`'],
            ['`%q`', 'a quoted string — shows whitespace clearly', '`"Sahdev"`'],
            ['`%f` / `%.2f`', 'a float / to two decimal places', '`3.140000` / `3.14`'],
            ['`%t`', 'a bool', '`true`'],
            ['`%p`', 'a pointer address', '`0xc000010000`'],
            ['`%x`', 'hexadecimal', '`1f`'],
            ['`%w`', '**wraps an error** — only in `fmt.Errorf`', '—'],
            ['`%%`', 'a literal percent sign', '`%`'],
          ],
        },
      },
      {
        heading: 'Naming rules',
        bullets: [
          'Letters, digits, and underscore. Must not start with a digit. Case-sensitive.',
          '**MixedCaps, never under_scores.** `userID`, not `user_id`.',
          '**Capital = exported.** `Name` is visible outside the package, `name` is not.',
          '**Short names for short lives.** `i` in a loop, `r` for a reader, `u` for a user — but a package-level name gets a full word.',
          '**Do not stutter.** In package `user`, the type is `Service`, so callers write `user.Service`, not `user.UserService`.',
          'Initialisms stay uppercase: `URL`, `ID`, `HTTP`. So `userID` and `parseURL`, never `userId` or `parseUrl`.',
        ],
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import "fmt"

type User struct {
	ID   int
	Name string
}

func main() {
	u := User{ID: 1, Name: "sahdev"}

	fmt.Printf("%v\\n", u)    // just the values
	fmt.Printf("%+v\\n", u)   // with field names  <- the debugging one
	fmt.Printf("%#v\\n", u)   // valid Go syntax
	fmt.Printf("%T\\n", u)    // the type

	fmt.Printf("%s is %d years old (%.1f%% done)\\n", "sahdev", 25, 62.5)
	fmt.Printf("%q vs %s\\n", "  spaces  ", "  spaces  ")
}
`,
          canRun: true,
          note: 'Compare the four ways of printing the same struct. `%+v` is the one you will use most.',
        },
      },
    ],
    keyPoints: [
      '`Println` for quick output, `Printf` for formatted, `Sprintf` to build a string.',
      '`%v` is the default, `%+v` shows struct field names, `%T` shows the type.',
      '`Printf` needs its own `\\n`; `Println` adds one for you.',
      'The `S` and `F` prefixes work across the whole `fmt` package: `Sprintf`, `Fprintln`.',
    ],
    remember:
      '`%+v` is the fastest debugging tool in Go. Learn it before you learn a debugger.',
    task: 'Print the same struct with `%v`, `%+v`, `%#v` and `%T` and compare all four outputs.',
    exercises: [
      {
        task: 'Use `Fprintln(os.Stderr, ...)`, then pipe stdout to a file and see your message still appear.',
        answer:
          'Your message still appears on screen. stderr is a separate stream, which is why logs and errors go there rather than to stdout.',
      },
      {
        task: 'Format a float to two decimal places, and print a literal percent sign.',
        answer:
          '`fmt.Printf("%.2f%%\\\\n", 62.5)` prints `62.50%`. `%%` is how you get one literal percent sign.',
      },
      {
        task: 'Print a string with `%s` and `%q` and see which one shows the whitespace.',
        answer:
          '`%q` wraps it in quotes, so leading and trailing spaces become visible. That is why `%q` is the better choice when debugging strings.',
      },
    ],
    refs: [
      { label: 'fmt package', href: 'https://pkg.go.dev/fmt' },
      { label: 'Effective Go — Names', href: 'https://go.dev/doc/effective_go#names' },
      { label: 'Go Doc Comments', href: 'https://go.dev/doc/comment' },
    ],
  },

  {
    slug: 'basic-data-types',
    title: 'Basic data types',
    navTitle: 'Basic data types',
    oneLine: 'Every built-in type, why there are so many integer sizes, and what to actually use.',
    blocks: [
      {
        heading: 'What a type is, and why there are so many',
        body: [
          'A **type** tells Go two things: what kind of value a variable holds, and what you are allowed to do with it. `int` holds whole numbers and can be added; `string` holds text and can be joined. The compiler checks this before your program ever runs, which is how it catches a whole class of mistakes for free.',
          'Go\'s built-in types are called **basic types**. There are more of them than in a language like Python because Go lets you say exactly how big a number is — 8 bits or 64 — which matters when you are talking to a database, a file format, or another machine.',
          'A **constant** is a value fixed when the program is compiled and never changed afterwards. It is not a variable you promise not to touch; the compiler enforces it.',
        ],
      },
      {
        heading: 'The full list',
        table: {
          headers: ['Type', 'Holds', 'Zero value'],
          rows: [
            ['`bool`', '`true` or `false`', '`false`'],
            ['`string`', 'immutable bytes, usually UTF-8 text', '`""`'],
            ['`int`, `uint`', 'whole numbers, 64-bit on modern machines', '`0`'],
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
          '**`int` for counting anything.** It is the default, it is 64-bit on any machine you care about, and using `int32` "to save memory" on a loop counter is not an optimisation.',
          '**`int64` for database ids** and anything crossing a wire format where the size must be fixed.',
          '**`float64` for decimals.** `float32` only when you have a specific reason, like graphics.',
          '**Never `float` for money.** `0.1 + 0.2 != 0.3` in binary floating point. Use integer cents, or a decimal library.',
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

// Go 1.21+ gives you the limits
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

	// Go 1.21+ gives you the limits
	fmt.Println(math.MaxInt64, math.MinInt64)
}
`,
          note: 'This is exactly why Go refuses to convert between sizes implicitly — you have to write int8(x) and think about it.',
        },
      },
      {
        heading: 'Conversion is always explicit',
        code: {
          label: 'convert.go',
          src: `i := 42
f := float64(i)          // required
u := uint(i)
s := string(rune(65))    // "A" — converts a code point, NOT a number

// Number <-> string needs strconv, not a cast
s2 := strconv.Itoa(42)                   // "42"
n, err := strconv.Atoi("42")             // 42, nil
f2, err := strconv.ParseFloat("3.14", 64)
b, err := strconv.ParseBool("true")
s3 := strconv.FormatInt(255, 16)         // "ff"`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: '`string(65)` gives you `"A"`, not `"65"`. It converts a code point to a character. To turn a number into its text form you need `strconv.Itoa`. `go vet` catches the common version of this mistake.',
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

type Status int

const (
	Pending Status = iota // 0
	Active                // 1
	Done                  // 2
)

func (s Status) String() string {
	return [...]string{"pending", "active", "done"}[s]
}

func main() {
	var small int8 = 127
	small++
	fmt.Println("int8 overflow:", small) // -128, silently

	fmt.Println("string(65) =", string(rune(65)))  // "A", a character
	fmt.Println("Itoa(65)   =", strconv.Itoa(65))  // "65", the text

	n, err := strconv.Atoi("42")
	fmt.Println("Atoi:", n, err)

	fmt.Println(Active, "has value", int(Active))
}
`,
          canRun: true,
          note: 'Watch the int8 wrap around, and see what iota generates.',
        },
      },
    ],
    keyPoints: [
      '`int` for counting, `int64` for ids, `float64` for decimals, never a float for money.',
      'Overflow wraps silently. That is why every conversion between sizes is explicit.',
      '`byte` is `uint8` and `rune` is `int32` — the aliases exist to show intent.',
      '`strconv` converts between numbers and text. `string(65)` gives "A", not "65".',
    ],
    remember:
      'Go gives you exact-size types for when it matters, and `int` for when it does not.',
    task: 'Overflow an `int8` and a `uint8` on purpose, then convert between int, float64 and string in all six directions.',
    exercises: [
      {
        task: 'Print `math.MaxInt64` and `math.MinInt64`, then add one to each.',
        answer:
          '9223372036854775807 and -9223372036854775808. Adding one wraps to the other end — silently, with no panic.',
      },
      {
        task: 'Add 0.1 and 0.2 as float64 and print the result. That is why money is not a float.',
        answer:
          '0.30000000000000004. Binary floating point cannot represent 0.1 exactly, which is why money is stored as whole cents.',
      },
      {
        task: 'Convert a string to an int with `strconv.Atoi` and handle the error path.',
        answer:
          '`strconv.Atoi: parsing "abc": invalid syntax`, and the int is 0. Always check the error — the zero would otherwise look like a real value.',
      },
    ],
    refs: [
      { label: 'A Tour of Go — Basic types', href: 'https://go.dev/tour/basics/11' },
      { label: 'Go blog: Constants', href: 'https://go.dev/blog/constants' },
      { label: 'strconv package', href: 'https://pkg.go.dev/strconv' },
    ],
  },

  {
    slug: 'constants-and-iota',
    title: 'Constants and iota',
    navTitle: 'Constants and iota',
    oneLine: 'Values fixed at compile time, and how Go does enums without an enum keyword.',
    blocks: [
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

// An UNTYPED constant adapts to where it is used — this is unusual and useful
const big = 1 << 40          // no type yet
var f float64 = big          // fine
var i int64 = big            // also fine

// A typed constant does not adapt
const typed int32 = 100
var x int64 = typed          // COMPILE ERROR`,
          note: 'Untyped constants are arbitrary precision at compile time. `const huge = 1 << 100` is legal until you assign it to something that cannot hold it.',
        },
      },
      {
        heading: 'iota — numbering without typing numbers',
        code: {
          label: 'iota.go',
          src: `type Status int

const (
\tPending Status = iota    // 0
\tActive                   // 1
\tSuspended                // 2
\tDeleted                  // 3
)

// It is an expression, so you can do arithmetic with it
const (
\t_  = iota                // skip 0
\tKB = 1 << (10 * iota)    // 1024
\tMB                       // 1048576
\tGB                       // 1073741824
)

// Give it a String method and it prints readably
func (s Status) String() string {
\treturn [...]string{"pending", "active", "suspended", "deleted"}[s]
}`,
          run: `package main

type Status int

const (
	Pending Status = iota    // 0
	Active                   // 1
	Suspended                // 2
	Deleted                  // 3
)

// It is an expression, so you can do arithmetic with it
const (
	_  = iota                // skip 0
	KB = 1 << (10 * iota)    // 1024
	MB                       // 1048576
	GB                       // 1073741824
)

// Give it a String method and it prints readably
func (s Status) String() string {
	return [...]string{"pending", "active", "suspended", "deleted"}[s]
}

func main() {
	_ = 0
}
`,
          note: 'A named type plus iota plus a String method is how Go does enums. There is no enum keyword.',
        },
      },
    ],
    keyPoints: [
      'A constant is fixed at compile time — the compiler enforces it, it is not a promise.',
      'An untyped constant adapts to where it is used; a typed one does not.',
      '`iota` counts up through a const block, and it is an expression you can do maths with.',
      'A named type + iota + a `String()` method is how Go does enums.',
    ],
    remember:
      'There are no constant slices, maps or structs. Those are `var`.',
    task: 'Write a `Status` enum with `iota` and a `String()` method, then print a value with `%v` and `%d`.',
    exercises: [
      {
        task: 'Use `iota` with a shift to generate KB, MB and GB.',
        answer:
          '`_ = iota` then `KB = 1 << (10 * iota)` gives 1024, 1048576, 1073741824. iota is an expression, so arithmetic works.',
      },
      {
        task: 'Declare `const big = 1 << 40` and assign it to both a float64 and an int64.',
        answer:
          'Both compile. An untyped constant takes the type of wherever it is used, and it is arbitrary precision until then.',
      },
      {
        task: 'Give the same constant an explicit type and watch the second assignment stop compiling.',
        answer:
          '`cannot use typed (constant of type int32) as int64 value`. A typed constant no longer adapts.',
      },
    ],
    refs: [
      { label: 'A Tour of Go — Basic types', href: 'https://go.dev/tour/basics/11' },
      { label: 'Go blog: Constants', href: 'https://go.dev/blog/constants' },
      { label: 'strconv package', href: 'https://pkg.go.dev/strconv' },
    ],
  },

  {
    slug: 'operators',
    title: 'Operators',
    navTitle: 'Operators',
    oneLine: 'Arithmetic, comparison, logical, and bitwise — plus the three Go leaves out on purpose.',
    blocks: [
      {
        heading: 'What an operator is',
        body: [
          'An **operator** is a symbol that does something to one or two values: `+` adds them, `==` compares them, `&&` combines two true-or-false answers. They are the smallest building blocks of any expression you write.',
          'Go\'s operators are worth a proper look for two reasons. A few behave differently from other languages — integer division throws away the remainder, and `++` is a statement rather than something you can use inside an expression. And a few Go simply does not have, on purpose.',
        ],
      },
      {
        heading: 'Arithmetic',
        code: {
          label: 'arithmetic.go',
          src: `a, b := 10, 3

a + b      // 13
a - b      // 7
a * b      // 30
a / b      // 3   — INTEGER division truncates, it does not round
a % b      // 1   — remainder

float64(a) / float64(b)   // 3.333... — convert first if you want a decimal

a++        // a statement, NOT an expression. "x := a++" does not compile.
a--        // and there is no ++a either`,
          note: 'Integer division truncating toward zero is the single most common arithmetic surprise. 7/2 is 3, not 3.5.',
        },
      },
      {
        heading: 'Assignment',
        code: {
          label: 'assignment.go',
          src: `x := 10        // declare and assign (only inside a function)
x = 20         // assign to an existing variable
var y int = 5  // declare with an explicit type

x += 5         // x = x + 5
x -= 5
x *= 2
x /= 2
x %= 3
x <<= 1        // the bitwise ones work too
x &= 0xFF

a, b = b, a    // swap in one line, no temp variable`,
        },
      },
      {
        heading: 'Comparison',
        code: {
          label: 'comparison.go',
          src: `a == b     // equal
a != b
a < b      // < <= > >= work on numbers and strings (lexicographic)

// Structs compare field by field IF every field is comparable
type Point struct{ X, Y int }
Point{1, 2} == Point{1, 2}      // true

// Slices, maps, and funcs are NOT comparable — this does not compile
// []int{1} == []int{1}
slices.Equal([]int{1}, []int{1})   // use this instead
maps.Equal(m1, m2)
reflect.DeepEqual(a, b)            // last resort; slow, use only in tests`,
        },
      },
      {
        heading: 'Logical, and short-circuiting',
        code: {
          label: 'logical.go',
          src: `a && b     // and
a || b     // or
!a         // not

// Both short-circuit, which is what makes this safe:
if u != nil && u.Active {        // u.Active is never reached when u is nil
\t...
}

if err == nil || retries > 3 {   // retries is not read when err is nil
\t...
}`,
          note: 'Short-circuiting is not a micro-optimisation — the nil check idiom above depends on it entirely.',
        },
      },
      {
        heading: 'Bitwise',
        code: {
          label: 'bitwise.go',
          src: `a & b      // AND
a | b      // OR
a ^ b      // XOR
a &^ b     // AND NOT (bit clear) — this one is unique to Go
a << 2     // shift left  (x * 4)
a >> 2     // shift right (x / 4)

// The real-world use: flags packed into one integer
const (
\tCanRead  = 1 << iota   // 1
\tCanWrite               // 2
\tCanAdmin               // 4
)

perms := CanRead | CanWrite          // set two flags
has := perms&CanWrite != 0           // test one
perms &^= CanWrite                   // clear one

// And sizes, which you have already seen
const maxUpload = 10 << 20           // 10 MB`,
        },
      },
      {
        heading: 'Pointer and channel operators',
        code: {
          label: 'other.go',
          src: `&x         // address of x
*p         // the value p points at

ch <- v    // send to a channel
v := <-ch  // receive from a channel`,
        },
      },
      {
        heading: 'What Go leaves out on purpose',
        bullets: [
          '**No ternary `?:`.** Write the `if`. The Go FAQ says the readability cost of nested ternaries is not worth the saved line.',
          '**No operator overloading.** `+` on your struct will never mean something surprising. `a + b` is always addition.',
          '**No pointer arithmetic.** You cannot do `p + 1` to walk memory. That is what makes Go memory-safe.',
          '**No `++` as an expression.** It is a statement, so `arr[i++]` is impossible — and so is the class of bugs it causes.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'Precedence is simpler than in C: five levels, with `*` above `+` above comparison above `&&` above `||`. When in doubt, add brackets — `gofmt` will keep them and the next reader will thank you.',
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
          note: 'Integer division, short-circuiting, and bit flags — all three surprises in one program.',
        },
      },
    ],
    keyPoints: [
      'Integer division truncates. Convert to float64 first if you want a decimal.',
      '`==` works on structs when every field is comparable; use `slices.Equal` for slices.',
      '`&&` and `||` short-circuit, which is what makes `x != nil && x.Field` safe.',
      'No ternary, no operator overloading, no pointer arithmetic — all left out on purpose.',
    ],
    remember:
      'Go’s operators do exactly one thing each, and none of them can be redefined. `a + b` is addition, everywhere, always.',
    task: 'Build a permissions integer with `iota` bit flags: set two permissions, test for one, clear one, and print the result with `%b` to watch the bits move.',
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
    blocks: [
      {
        heading: 'What a string really is',
        body: [
          'A **string** in Go is a read-only sequence of **bytes**, almost always holding text encoded as UTF-8. That definition is doing a lot of work, and the two important words are *bytes* and *read-only*.',
          '**Bytes, not characters.** In English text one character happens to be one byte, so the difference never shows. Add an accent or an emoji and one character becomes two, three or four bytes — which is why `len` on a string does not tell you how many characters it has.',
          '**Read-only.** A string can never be changed after it is made. Joining two strings does not extend one of them; it builds a third and copies both in. That is fine once and expensive in a loop.',
        ],
      },
      {
        heading: 'A string is immutable bytes',
        body: [
          'A Go string is a read-only slice of bytes, almost always holding UTF-8 text. It is **not** a sequence of characters, and that difference causes every string bug a beginner hits.',
        ],
        code: {
          label: 'strings.go',
          src: `s := "héllo"

len(s)                        // 6  — BYTES. é takes two bytes in UTF-8.
utf8.RuneCountInString(s)     // 5  — actual characters

s[1]                          // 195 — a byte, not 'é'
string(s[1])                  // garbage — half a character

for i, r := range s {         // range decodes UTF-8 for you
\tfmt.Printf("%d: %c\\n", i, r)   // i jumps by 1,1,2,1,1
}

rs := []rune(s)               // convert when you need character indexing
fmt.Println(string(rs[1]))    // "é"`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Indexing a string gives you a byte. `s[0:3]` slices bytes and can cut a character in half. If you are doing anything per-character, convert to `[]rune` first — or use `range`, which decodes for you.',
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
          note: 'Prefer `strings.EqualFold` over lowering both sides. Prefer `Cut`/`CutPrefix` over Index arithmetic — they are clearer and harder to get wrong.',
        },
      },
      {
        heading: 'Cut: the one that replaced a lot of code',
        code: {
          label: 'cut.go',
          src: `before, after, found := strings.Cut("key=value", "=")
// "key", "value", true

// This is exactly the shape of parsing an Authorization header
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
          'Every `strings` function has a `bytes` twin that works on `[]byte`. Converting between `string` and `[]byte` copies, so in a hot loop reading from a network or a file, staying in `[]byte` avoids that copy. Everywhere else, use `string` — it is immutable, safe to share, and usable as a map key.',
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
          note: 'Bytes versus characters — the reason `len` surprises everyone once.',
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
    task: 'Write a function that reverses a string correctly for "héllo" and for an emoji. Do it with `[]byte` first and watch it break — that failure is the lesson.',
    refs: [
      { label: 'strings package', href: 'https://pkg.go.dev/strings' },
      { label: 'Go blog: Strings, bytes, runes and characters', href: 'https://go.dev/blog/strings' },
    ],
  },

  {
    slug: 'pointers-and-memory',
    title: 'Pointers',
    navTitle: 'Pointers',
    oneLine: 'What `&` and `*` really do, when you need them, and why Go pointers cannot hurt you the way C ones can.',
    blocks: [
      {
        heading: 'What a pointer is',
        body: [
          'Every value your program holds lives somewhere in memory, and every location has an address. A **pointer** is a value that holds one of those addresses instead of the data itself. It is a way of saying “the thing over there” rather than carrying a copy of the thing around.',
          'You need them for two reasons. Go copies values when you pass them to a function, so without a pointer a function cannot change what the caller gave it. And copying a large struct on every call costs time you may not want to spend.',
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
          'Go passes everything by value, so a function receives a **copy**. A pointer is how you let a function change the caller’s data, and how you avoid copying something large.',
        ],
        code: {
          label: 'why.go',
          src: `func rename(u User)  { u.Name = "new" }   // changes the copy. Caller sees nothing.
func renameP(u *User) { u.Name = "new" }   // changes the caller's User.

u := User{Name: "old"}
rename(u)
fmt.Println(u.Name)     // "old"
renameP(&u)
fmt.Println(u.Name)     // "new"`,
        },
      },
      {
        heading: 'Go dereferences struct fields for you',
        code: {
          label: 'auto.go',
          src: `p := &User{Name: "sahdev"}

fmt.Println(p.Name)      // Go rewrites this as (*p).Name
p.Name = "changed"       // and this too
p.Rename("again")        // methods work the same way

// The only place you write * explicitly is for non-struct types
n := &count
*n++`,
        },
      },
      {
        heading: 'When to use a pointer',
        table: {
          headers: ['Use a pointer', 'Use a value'],
          rows: [
            ['the function must change the argument', 'the struct is small and you never mutate it'],
            ['the struct is large and copying is measurable', 'you want it usable as a map key'],
            ['the type contains a `sync.Mutex` (never copy a lock)', 'the type is naturally a value: `time.Time`, `Point`'],
            ['"absent" and "zero" must be different (see below)', 'you want it safe to share across goroutines'],
          ],
        },
      },
      {
        heading: 'The pointer-as-optional trick',
        body: [
          'Because a pointer can be `nil`, a pointer field distinguishes "the client did not send this" from "the client sent an empty value". That is exactly what a PATCH endpoint needs.',
        ],
        code: {
          label: 'optional.go',
          src: `type UpdateRequest struct {
\tTitle *string \`json:"title"\`   // nil = not provided at all
\tBody  *string \`json:"body"\`
}

if req.Title != nil {
\tn.Title = *req.Title           // they DID send it, even if it is ""
}`,
        },
      },
      {
        heading: 'new versus make',
        code: {
          label: 'new-make.go',
          src: `p := new(int)              // *int pointing at a zero int. Rarely used.
u := &User{Name: "x"}      // the idiomatic way to get a pointer to a struct

// make is ONLY for slices, maps, and channels — it initialises them
s := make([]int, 0, 10)
m := make(map[string]int)
ch := make(chan int, 5)

// new(map[string]int) gives you a POINTER TO A NIL MAP. Writing to it panics.`,
          note: 'Rule of thumb: `&T{}` for structs, `make` for slices/maps/channels, and you will almost never type `new`.',
        },
      },
      {
        heading: 'What Go pointers cannot do',
        bullets: [
          '**No pointer arithmetic.** You cannot do `p + 1` to walk through memory. This removes an entire class of security bugs.',
          '**No dangling pointers.** Returning `&x` from a function is safe — the garbage collector keeps `x` alive. In C that is a use-after-free; in Go the compiler just moves it to the heap.',
          '**No manual free.** The GC handles it. You cannot double-free or use-after-free.',
          '**The one thing that can bite you: a nil dereference**, which panics rather than corrupting memory. A crash you can read beats silent corruption.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'Do not sprinkle pointers everywhere "for performance". A copy of a small struct is often faster than a pointer, because it stays in a CPU register and creates no work for the garbage collector. Reach for a pointer when you need to mutate or when you have measured a copy cost — not by default.',
        },
      },
      {
        heading: 'Try it yourself',
        code: {
          label: 'press Run — this executes on the Go Playground',
          src: `package main

import "fmt"

type User struct{ Name string }

func rename(u User)   { u.Name = "changed" } // gets a copy
func renameP(u *User) { u.Name = "changed" } // gets the address

func main() {
	u := User{Name: "original"}

	rename(u)
	fmt.Println("after value call  :", u.Name)
	renameP(&u)
	fmt.Println("after pointer call:", u.Name)

	x := 42
	p := &x
	*p = 100
	fmt.Println("x through the pointer:", x)

	var absent *string
	empty := ""
	for _, f := range []*string{absent, &empty} {
		if f == nil {
			fmt.Println("field was not sent")
		} else {
			fmt.Printf("field was sent as %q\\n", *f)
		}
	}
}
`,
          canRun: true,
          note: 'A copy versus a pointer, and the nil-able field trick.',
        },
      },
    ],
    keyPoints: [
      '`&x` takes an address, `*p` reads through it. Go dereferences struct fields automatically.',
      'Pointers let a function mutate the caller’s value, and avoid copying large structs.',
      'A `nil`-able pointer field separates "absent" from "empty" — the PATCH pattern.',
      '`&T{}` for structs, `make` for slices/maps/channels. No pointer arithmetic, no manual free.',
    ],
    remember:
      'A pointer is just a value holding an address. Go removes the dangerous parts — arithmetic and manual freeing — and keeps the useful part.',
    task: 'Write `func double(n *int)` and call it. Then write a struct with a `*string` field, unmarshal `{}` and `{"name":""}` into it, and print whether the field is nil in each case.',
    refs: [
      { label: 'A Tour of Go — Pointers', href: 'https://go.dev/tour/moretypes/1' },
      { label: 'FAQ: pointer or value receiver?', href: 'https://go.dev/doc/faq#methods_on_values_or_pointers' },
    ],
  },
]
