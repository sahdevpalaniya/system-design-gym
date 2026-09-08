import type { LangExercise } from '@/lib/types'

/**
 * Small drills to do in your own editor after the main task for a topic.
 * Each one is 5-15 minutes and fits in a scratch file — the point is that you
 * type it, not that you ship it. Keyed by lesson slug.
 */
export const EXERCISES: Record<string, (string | LangExercise)[]> = {
  'setup-and-first-program': [
    {
      task: 'Make a second file in the same folder, put a function in it, and call that function from `main`. Notice you did not need an import.',
      answer:
        'It compiles and runs. Files in the same folder are the same package, so there is nothing to import — that is what a package is.',
    },
    {
      task: 'Delete the `fmt` import while still calling `fmt.Println`, and read the error. Then add an unused variable and read that one too.',
      answer:
        '`undefined: fmt` for the import, and `declared and not used: x` for the variable. Both are errors, not warnings.',
    },
    {
      task: 'Build with `go build -o app .` and run `./app`. Copy the binary to another folder and run it there — nothing else needed.',
      answer:
        'The binary runs anywhere with the same OS and architecture. No Go installation needed on the target machine — that is the single-static-binary payoff.',
    },
  ],
  operators: [
    {
      task: 'Write a permissions integer with three `iota` bit flags. Set two, test one, clear one, and print with `%b` after each step.',
      answer:
        '`0001` after one flag, `0011` after two, `0001` again after clearing. Each flag owns one bit.',
    },
    {
      task: 'Prove short-circuiting to yourself: `f() && g()` where both print. Then swap `f` to return false and see that `g` never runs.',
      answer:
        '`g` never prints when `f` returns false. This is why `u != nil && u.Active` is safe.',
    },
    {
      task: 'Compare two structs with `==`. Add a slice field and watch it stop compiling.',
      answer:
        'It works while every field is comparable. Add a slice and it stops compiling — use `slices.Equal` or `reflect.DeepEqual` in tests.',
    },
  ],
  'functions-and-errors': [
    {
      task: 'Write `divide(a, b float64) (float64, error)` and call it both ways: once handling the error, once ignoring it with `_`. Notice which one you would flag in review.',
      answer:
        'Ignoring the error compiles fine and silently returns 0. That is exactly what a reviewer would flag.',
    },
    {
      task: 'Write a closure counter, call it three times, then create a second one and confirm they count independently.',
      answer:
        '1, 2, 3 from the first; the second starts at 1 again. Each closure captured its own `c`.',
    },
    {
      task: 'Put three `defer` statements in one function and predict the order before you run it.',
      answer:
        'They run in reverse: the last one written runs first. LIFO, like a stack.',
    },
  ],
  'strings-and-formatting': [
    {
      task: 'Print `len(s)` and `utf8.RuneCountInString(s)` for a string with an accent and one with an emoji.',
      answer:
        'For an accent: 6 bytes, 5 runes. For an emoji it can be 4 bytes for 1 character. `len` counts bytes, always.',
    },
    {
      task: 'Reverse a string with `[]byte`, then with `[]rune`, and test both on `"héllo"`.',
      answer:
        'The byte version corrupts the accent into two broken characters. The rune version is correct — that is the whole lesson.',
    },
    {
      task: 'Concatenate 100,000 strings with `+=`, time it, then do it with `strings.Builder` and compare.',
      answer:
        '`+=` takes seconds and allocates ~100,000 times; `strings.Builder` is milliseconds with a handful of allocations. Strings are immutable.',
    },
    {
      task: 'Parse `"Bearer abc123"` with `strings.CutPrefix`. Then do the same with `Index` arithmetic and decide which you trust more.',
      answer:
        '`CutPrefix` returns the rest plus a bool. The `Index` version needs arithmetic and gets edge cases wrong when the prefix is missing.',
    },
  ],
  'pointers-and-memory': [
    {
      task: 'Write `double(n *int)` and call it. Then write `doubleVal(n int)` and confirm the caller sees nothing.',
      answer:
        'The pointer version changes the caller\'s value; the value version does not. Go copies arguments.',
    },
    {
      task: 'Make a struct with a `*string` field. Unmarshal `{}` and `{"name":""}` into it and print whether the field is nil in each case.',
      answer:
        '`{}` leaves it nil; `{"name":""}` gives a pointer to an empty string. That is how a PATCH tells absent from empty.',
    },
    {
      task: 'Return `&x` from a function where `x` is a local. Confirm it works, then read why with `go build -gcflags=-m`.',
      answer:
        'It works. `-gcflags=-m` says `moved to heap: x` — the compiler proved it outlives the frame, so there is no dangling pointer.',
    },
  ],
  'http-server': [
    {
      task: 'Add `GET /users/{id}` and read the parameter with `r.PathValue`. Try the wrong HTTP method and see the 405.',
      answer:
        '`r.PathValue("id")` returns it as a string. The wrong method on a right path gives 405 with no code from you.',
    },
    {
      task: 'Write a handler that sets a header after `WriteHeader` and confirm the header is silently dropped.',
      answer:
        'The header is missing from the response, with no error. Headers must be set before the status is written.',
    },
    {
      task: 'Write an error path that forgets to `return` after writing, then find "superfluous WriteHeader" in the log.',
      answer:
        '`http: superfluous response.WriteHeader call` in the log, and the client gets a mangled body. Always return after writing an error.',
    },
    {
      task: 'Swap `http.ListenAndServe` for a configured `http.Server` with all four timeouts.',
      answer:
        'Behaviour is the same until a client goes slow — then the timeouts cut it off instead of holding the connection open forever.',
    },
  ],
  'middleware-and-shutdown': [
    {
      task: 'Write a Logger middleware that also records the status code — you will need a small `ResponseWriter` wrapper.',
      answer:
        'You need a struct wrapping `http.ResponseWriter` that records the code in its own `WriteHeader`. `ResponseWriter` does not expose it.',
    },
    {
      task: 'Add a route that panics. Confirm the recover middleware returns JSON and the server stays up.',
      answer:
        'A JSON 500, a stack trace in the log, and the server still serving. That is what the recover middleware buys you.',
    },
    {
      task: 'Now panic inside a goroutine you start in that handler, and watch the whole process die.',
      answer:
        'The whole process dies. Recover only works in the panicking goroutine, so every goroutine you start needs its own.',
    },
    {
      task: 'Send SIGTERM during a slow request and confirm the request finishes before the process exits.',
      answer:
        'The request finishes, then the process exits. Without graceful shutdown it is cut off mid-response.',
    },
  ],
  'postgres-and-sql': [
    {
      task: 'Open a pool without calling `SetMaxOpenConns`, fire 500 concurrent requests, and watch the connection count in `pg_stat_activity`.',
      answer:
        'Connection count climbs past what Postgres allows and you start getting `too many clients already`. The pool limit is your backpressure.',
    },
    {
      task: 'Forget `defer rows.Close()` in a loop and watch the pool run out of connections.',
      answer:
        'Requests start hanging as the pool empties, then time out. The connections are held by rows nobody closed.',
    },
    {
      task: 'Try to inject SQL through a `fmt.Sprintf` query, then switch to `$1` and try the same input.',
      answer:
        'With Sprintf, an input containing a quote breaks or changes the query. With `$1` the same input is stored harmlessly as data.',
    },
    {
      task: 'Scan a NULL column into a `string` and read the error. Fix it three ways: `COALESCE`, `sql.NullString`, and `*string`.',
      answer:
        '`converting NULL to string is unsupported`. `COALESCE` is simplest, `sql.NullString` is explicit, `*string` is most Go-like.',
    },
  ],
  'joins-transactions-n-plus-one': [
    {
      task: 'Build the N+1 version with 200 rows and time it. Then do it with one JOIN and time that.',
      answer:
        'Roughly 201 round trips versus 1. Expect tens of milliseconds against one, and it grows with the row count.',
    },
    {
      task: 'Run `EXPLAIN ANALYZE` on your list query before and after adding the index.',
      answer:
        '`Seq Scan` plus a sort before; `Index Scan` after. The execution time usually drops by an order of magnitude.',
    },
    {
      task: 'Write a two-statement transaction where the second fails, and confirm the first was rolled back.',
      answer:
        'Neither change is there. Until `Commit` runs, nothing you did inside the transaction is real.',
    },
    {
      task: 'Open a transaction and sleep for 30 seconds inside it while running other requests. Watch the pool.',
      answer:
        'That connection is held the whole time. Enough concurrent ones and every other request queues waiting for the pool.',
    },
  ],
  'project-layouts': [
    {
      task: 'Open two Go projects on GitHub and work out which of the three layouts each one uses.',
      answer:
        'Most small tools are flat; most services group by domain or by layer. Layer-based ones are usually the older codebases.',
    },
    {
      task: 'Take a small program you have written and lay it out all three ways. Notice how much work the layer version creates for one small change.',
      answer:
        'The layered version needs edits in four folders for one small change. The flat one needs none. That gap is the whole argument.',
    },
    {
      task: 'Put a package under `internal/` and try to import it from a second module. Read the compiler error.',
      answer:
        '`use of internal package ... not allowed`. It is the compiler, not a convention.',
    },
    {
      task: 'Find a `utils` package in a project you have worked on and write down what is actually in it. That list is the packages it should have been.',
      answer:
        'The list is almost always three or four unrelated groups — which are the packages it should have been.',
    },
  ],
  'folder-structure-crud': [
    {
      task: 'Try importing `net/http` inside your repository package. Nothing stops you — which is why the rule has to be a habit.',
      answer:
        'It compiles. Nothing enforces the layer rule — which is exactly why it has to be a habit and why reviewers look for it.',
    },
    {
      task: 'Move a package under `internal/` and try to import it from a second module. Read the compiler error.',
      answer:
        '`use of internal package ... not allowed`. This one the compiler does enforce.',
    },
    {
      task: 'Rename `UserService` to `Service` and fix every call site. Notice how much better `user.Service` reads.',
      answer:
        'Call sites become `user.Service` instead of `user.UserService`. The package name is already part of the name.',
    },
    {
      task: 'Add a second domain package alongside `user/` and wire it in `run()` — no new frameworks, just more lines.',
      answer:
        'One new folder, four files, and three lines in `run()`. Nothing else changes — that is the test of a good layout.',
    },
  ],
  'errors-and-logging': [
    {
      task: 'Force a database error and confirm the client sees a generic 500 while the log has the detail and a request id.',
      answer:
        'The client gets `{"error":"internal server error"}` and the log has the driver message plus the request id. Never the other way round.',
    },
    {
      task: 'Add the request id to the response header, then find that one request in your logs by grepping the id.',
      answer:
        '`grep <id>` returns every line from that request. That is why the id is threaded through the context.',
    },
    {
      task: 'Kill a request mid-flight with Ctrl-C in curl and confirm it does not log as a 500.',
      answer:
        '`context.Canceled`, which should be logged at info and not counted as a server error. The client left; nothing failed.',
    },
    {
      task: 'Switch the handler from Text to JSON and diff how readable each is for a human and for `jq`.',
      answer:
        'Text is readable by eye, JSON is filterable by `jq` and by your log store. That is why it is text locally and JSON in production.',
    },
  ],
  'rate-limiting-cors-headers': [
    {
      task: 'Loop curl against your login endpoint until you get 429, and check the `Retry-After` header.',
      answer:
        '429 after the burst is used up, with `Retry-After: 60`. Check it is the auth limiter firing and not the general one.',
    },
    {
      task: 'Call your API from a browser page on a different origin, with and without the origin allowlisted.',
      answer:
        'Without the allowlist the browser blocks it and logs a CORS error; with it the call goes through. Note curl is unaffected — CORS is a browser rule.',
    },
    {
      task: 'Confirm `X-Content-Type-Options: nosniff` is present on an attachment download.',
      answer:
        'It should be on every attachment response. Without it a browser may guess the type and render a file you meant to be downloaded.',
    },
    {
      task: 'Make an outbound call with `http.DefaultClient` against a server that never responds, and watch it hang forever.',
      answer:
        'It hangs forever — `DefaultClient` has no timeout. That one line is why you always build your own client.',
    },
  ],
  'docker-and-deployment': [
    {
      task: 'Build the image and check its size with `docker images`. Then build without `CGO_ENABLED=0` and see what breaks.',
      answer:
        'About 15MB with `CGO_ENABLED=0`. Without it the build fails on a distroless base, because the binary now needs libc.',
    },
    {
      task: 'Try `docker exec -it <container> sh` on the distroless image. There is no shell — that is the point.',
      answer:
        '`exec failed: no such file or directory`. There is no shell — which is the point, and also why you debug with logs.',
    },
    {
      task: 'Set `GOMEMLIMIT` far too low and watch the GC work harder in the logs.',
      answer:
        'The GC runs far more often and CPU rises. Too high and the container gets OOM-killed instead — it is a real trade-off.',
    },
    {
      task: 'Cross-compile for `GOOS=darwin GOARCH=arm64` and confirm the binary is produced with no extra toolchain.',
      answer:
        'A macOS arm64 binary appears, built on Linux, with nothing extra installed. This works as long as CGO is off.',
    },
  ],
  'polish-and-docs': [
    {
      task: 'Clone your own repo into a fresh folder and follow your README exactly. Every improvised step is a README bug.',
      answer:
        'Every step you have to improvise is a missing line in the README. Most people find two or three.',
    },
    {
      task: 'Add `/v1` to the paths and find every place you hardcoded a URL.',
      answer:
        'Usually the tests, the requests file and the README. That is exactly why versioning early is cheaper than versioning later.',
    },
    {
      task: 'Write `requests.http` and run the whole flow — register, login, create, upload — from your editor.',
      answer:
        'The whole flow runs from your editor, and the token from the login response feeds the next request. Far faster than retyping curl.',
    },
  ],
  'hardening-and-review': [
    {
      task: 'Grep your own routes for a handler missing `protect`, and your queries for one missing `AND user_id`.',
      answer:
        'If you find one, that was a live security hole. This grep takes a minute and is worth doing before every release.',
    },
    {
      task: 'Run all four tools and fix everything they report before reading a line of your own code.',
      answer:
        'gofmt and vet are usually instant; `-race` sometimes finds something real; govulncheck flags dependencies you actually call.',
    },
    {
      task: 'Run the six attack curls from this topic and record what each returns.',
      answer:
        'Expect 401, 404, 401, 413, 415 and a clamped 200. Anything else is a bug you just found.',
    },
    {
      task: 'Delete one thing: a helper used once, a commented-out block, or an interface with one implementation.',
      answer:
        'Every codebase this age has one. Deleting is the highest-value edit you will make in this step.',
    },
  ],
  'profiling-and-shipping': [
    {
      task: 'Load-test with `hey -n 2000 -c 50` and capture a 30-second CPU profile while it runs.',
      answer:
        'The flame graph is dominated by the database call, not by your Go code. That is the normal result and the point of measuring.',
    },
    {
      task: 'Find your slowest endpoint in the flame graph and fix one real thing.',
      answer:
        'Almost always an N+1 or a missing index. Fix the query before you touch any Go.',
    },
    {
      task: 'Benchmark that fix with `-count=10` and `benchstat`. If the difference is not significant, revert it.',
      answer:
        'If benchstat says the difference is not significant, it is not a speed-up — revert it and keep the simpler code.',
    },
    {
      task: 'Watch the goroutine count during the load test and confirm it returns to baseline afterwards.',
      answer:
        'It should rise under load and return to its baseline afterwards. If it stays high, something is leaking.',
    },
  ],
  'modules-and-tooling': [
    {
      task: 'Run `go mod why -m` on each dependency and find out what actually pulls each one in.',
      answer:
        'Most are pulled in by one direct dependency. Anything nothing explains is a candidate for removal.',
    },
    {
      task: 'Run `go mod tidy` and check whether anything disappears.',
      answer:
        'Usually one or two leftovers from something you tried and removed. Run it before every commit.',
    },
    {
      task: 'Set up a `go.work` linking two local modules and edit one from the other with no `replace` directive.',
      answer:
        'Imports resolve to your local copy with no `replace` line in `go.mod`. Add `go.work` to `.gitignore` — it is local state.',
    },
    {
      task: 'Add the four CI commands to a Makefile target called `check` and run it before your next push.',
      answer:
        'One command before every push. That habit catches more than any single tool does.',
    },
  ],
}
