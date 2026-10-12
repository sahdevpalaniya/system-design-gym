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
        'It compiles and runs. Files in the same folder are the same package, so there is nothing to import. That is what a package is.',
    },
    {
      task: 'Delete the `fmt` import while still calling `fmt.Println`, and read the error. Then add an unused variable and read that one too.',
      answer:
        '`undefined: fmt` for the import, and `declared and not used: x` for the variable. Both are errors, not warnings.',
    },
    {
      task: 'Build with `go build -o app .` and run `./app`. Copy the binary to another folder and run it there — nothing else needed.',
      answer:
        'The binary runs anywhere with the same OS and architecture. No Go installation is needed on the target machine. That is the payoff of a single static binary.',
    },
  ],
  operators: [
    {
      task: 'Write a permissions integer with three `iota` bit flags. Set two, test one, clear one, and print with `%b` after each step.',
      answer:
        'With flags 1, 2 and 4: `1` after the first, `11` after the second, then `1` or `10` after clearing one, depending on which. Each flag owns one bit. `%b` does not pad, so use `%03b` to see all three.',
    },
    {
      task: 'Prove short-circuiting to yourself: `f() && g()` where both print. Then swap `f` to return false and see that `g` never runs.',
      answer:
        '`g` never prints when `f` returns false. This is why `u != nil && u.Active` is safe.',
    },
    {
      task: 'Predict, then print: `7 / 2`, `-7 / 2`, `7 % 3`, `-7 % 3` and `float64(7) / 2`.',
      answer:
        '`3`, `-3`, `1`, `-1` and `3.5`. Integer division drops the fraction (it truncates toward zero), and the sign of `%` follows the left number. Convert to `float64` first when you want the fraction.',
    },
  ],
  'functions-and-errors': [
    {
      task: 'Write `divide(a, b float64) (float64, error)` and call it both ways: once handling the error, once ignoring it with `_`. Notice which one you would flag in review.',
      answer:
        'Ignoring the error compiles fine, and the caller carries on with 0 as if it were a real result. That is what a reviewer would flag.',
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
        'The byte version corrupts the accent into two broken characters. The rune version is correct.',
    },
    {
      task: 'Concatenate 100,000 strings with `+=`, time it, then do it with `strings.Builder` and compare.',
      answer:
        '`+=` takes seconds and allocates ~100,000 times; `strings.Builder` is milliseconds with a handful of allocations. Strings are immutable.',
    },
    {
      task: 'Parse `"Bearer abc123"` with `strings.CutPrefix`. Then do the same with `Index` arithmetic and decide which you trust more.',
      answer:
        '`CutPrefix` returns the rest plus a bool. The `Index` version needs arithmetic and is easy to get wrong when the prefix is missing.',
    },
  ],
  'pointers-and-memory': [
    {
      task: 'Write `double(n *int)` and call it. Then write `doubleVal(n int)` and confirm the caller sees nothing.',
      answer:
        'The pointer version changes the caller\'s value; the value version does not. Go copies arguments.',
    },
    {
      task: 'Write `safeDiv(a, b int) *int` that returns `nil` when `b` is 0 and a pointer to `a / b` otherwise. Print `safeDiv(0, 5)` and `safeDiv(5, 0)` and explain the difference.',
      answer:
        '`safeDiv(0, 5)` is a pointer to `0`, a real answer. `safeDiv(5, 0)` is `nil`: no answer at all. A plain `int` result could not tell those apart.',
    },
    {
      task: 'Return `&x` from a function where `x` is a local. Confirm it works, then read why with `go build -gcflags=-m`.',
      answer:
        'It works. `-gcflags=-m` says `moved to heap: x`. Escape analysis saw that it outlives the frame and put it on the heap, so there is no dangling pointer.',
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
        'Behaviour is the same until a client goes slow. Then the timeouts cut it off instead of holding the connection open forever.',
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
        'The connection count climbs until Postgres hits `max_connections`, and you start getting `too many clients already`. The pool limit is your backpressure.',
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
        'Roughly 201 round trips versus 1. On a local database that is typically tens of milliseconds against one or two, and the gap grows with row count and network latency.',
    },
    {
      task: 'Run `EXPLAIN ANALYZE` on your list query before and after adding the index.',
      answer:
        'On a table with enough rows: `Seq Scan` plus a sort before, `Index Scan` after. On a tiny table the planner may keep the sequential scan, because it is genuinely cheaper there.',
    },
    {
      task: 'Write a two-statement transaction where the second fails, and confirm the first was rolled back.',
      answer:
        'Neither change is there. Until `Commit` runs, nothing you did inside the transaction is visible to anyone else.',
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
        'Most small tools are flat; most services group by domain or by layer.',
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
        'The list usually splits into a few unrelated groups. Those are the packages it should have been.',
    },
  ],
  'folder-structure-crud': [
    {
      task: 'Try importing `net/http` inside your repository package. Nothing stops you — which is why the rule has to be a habit.',
      answer:
        'It compiles. Nothing enforces the layer rule, which is why it has to be a habit and why reviewers look for it.',
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
        'One new folder, four files, and three lines in `run()`. Nothing else changes. That is the test of a good layout.',
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
        'Without the allowlist the browser blocks it and logs a CORS error; with it the call goes through. Note that curl is unaffected: CORS is enforced by browsers.',
    },
    {
      task: 'Confirm `X-Content-Type-Options: nosniff` is present on an attachment download.',
      answer:
        'It should be on every attachment response. Without it a browser may guess the type and render a file you meant to be downloaded.',
    },
    {
      task: 'Make an outbound call with `http.DefaultClient` against a server that never responds, and watch it hang forever.',
      answer:
        'It hangs forever: `DefaultClient` has no timeout. That is why you build your own `http.Client` with `Timeout` set.',
    },
  ],
  'docker-and-deployment': [
    {
      task: 'Build the image and check its size with `docker images`. Then build without `CGO_ENABLED=0` and see what breaks.',
      answer:
        'About 15MB with `CGO_ENABLED=0`. Without it the build still succeeds, but if the binary uses `net` or `os/user` it links against libc and fails to start on `distroless/static` or `scratch` with a confusing `no such file or directory`.',
    },
    {
      task: 'Try `docker exec -it <container> sh` on the distroless image. There is no shell — that is the point.',
      answer:
        'An error ending in `executable file not found in $PATH`. There is no shell, which is the point, and also why you debug with logs.',
    },
    {
      task: 'Set `GOMEMLIMIT` far too low and watch the GC work harder with `GODEBUG=gctrace=1`.',
      answer:
        'The GC runs far more often and CPU rises. Set it too high and the container gets OOM-killed instead, so it is a real trade-off.',
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
        'Each improvised step is a missing line in the README. Fix them in the order you hit them.',
    },
    {
      task: 'Add `/v1` to the paths and find every place you hardcoded a URL.',
      answer:
        'Usually the tests, the requests file and the README. That is why versioning early is cheaper than versioning later.',
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
        'Most codebases have one. A deletion is often the highest-value edit in this step.',
    },
  ],
  'profiling-and-shipping': [
    {
      task: 'Load-test with `hey -n 2000 -c 50` and capture a 30-second CPU profile while it runs.',
      answer:
        'Expect a fairly flat graph: JSON encoding, syscalls, the driver. A CPU profile only counts time on the CPU, so time spent waiting for the database does not appear in it. Low CPU with slow requests means the wait is elsewhere, usually the database.',
    },
    {
      task: 'Find your slowest endpoint from request latency (not the CPU profile) and fix one real thing.',
      answer:
        'Most often an N+1 or a missing index. Fix the query before you touch any Go.',
    },
    {
      task: 'Benchmark that fix with `-count=10` and `benchstat`. If the difference is not significant, revert it.',
      answer:
        'If benchstat says the difference is not significant, it is not a speed-up: revert it and keep the simpler code.',
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
        'Imports resolve to your local copy with no `replace` line in `go.mod`. Add `go.work` to `.gitignore`: it is local state.',
    },
    {
      task: 'Add the four CI commands to a Makefile target called `check` and run it before your next push.',
      answer:
        'One command before every push. That habit catches more than any single tool does.',
    },
  ],
  'dsa-two-sum': [
    {
      task: 'The main task: Count the pairs in a slice that sum to `k` (each pair once, duplicates allowed in the input) with one map and one pass. State the complexity before you run it.',
      answer:
        'Keep `seen := map[int]int{}`, a count of each value met so far. For each `n`, add `seen[k-n]` to the total (every earlier value that completes a pair), then do `seen[n]++`. Reading a missing key gives 0, so there is no comma-ok needed. `[1, 5, 7, -1, 5]` with `k = 6` gives 3. O(n) time, O(n) space.',
    },
    {
      task: 'Change two sum to return **every** pair of indices that sums to the target, with duplicates allowed in the input.',
      answer:
        'Map from value to a slice of indices. For each element, append a pair for every index already stored under `target - n`, then append the current index. Still one pass; the output size can make it O(n²) in the worst case.',
    },
    {
      task: 'Solve two sum on an already **sorted** slice with O(1) extra space.',
      answer:
        'Two pointers: `i` at the start, `j` at the end. Sum too small, `i++`; too big, `j--`. O(n) time, no map.',
    },
    {
      task: "Dry run the map solution on `nums = [3 2 4]`, `target = 6`. What does it return, and why does it not return (0, 0)?",
      answer:
        "i=0: need 3, map is empty, store 3→0. i=1: need 4, not seen, store 2→1. i=2: need 2, found at 1, return (1, 2). It never returns (0, 0) because it looks up the partner **before** storing the current number.",
    },
    {
      task: "Write the brute-force version as a function `twoSumBrute(nums []int, target int) (int, int, bool)` and state its complexity.",
      answer:
        "`for i := range nums { for j := i + 1; j < len(nums); j++ { if nums[i]+nums[j] == target { return i, j, true } } }; return 0, 0, false`. O(n²) time, O(1) space. Starting `j` at `i+1` stops an element pairing with itself.",
    },
  ],
  'dsa-reverse-rotate': [
    {
      task: 'The main task: Rotate left by `k` with the same trick, and write a table test with k = 0, k = len, and k > len.',
      answer:
        'Rotate left by `k` is: reverse the first `k`, reverse the rest, then reverse the whole slice (or rotate right by `len-k`). Guard `len(s) == 0`, then `k %= len(s)`. Table test cases: `k = 0` and `k = len` both leave the slice unchanged; `k = len+2` gives the same result as `k = 2`. Compare with `slices.Equal`.',
    },
    {
      task: 'Predict the output: `a := []int{1,2,3,4}; b := a[1:3]; slices.Reverse(b); fmt.Println(a)`.',
      answer: '`[1 3 2 4]`. `b` is a window onto `a`, so reversing it reorders the middle of `a`.',
    },
    {
      task: 'Reverse the words in a sentence ("the sky is blue" → "blue is sky the") with `strings.Fields`, `slices.Reverse` and `strings.Join`.',
      answer: 'Three lines. `strings.Fields` also collapses repeated spaces, which is usually what the problem wants.',
    },
    {
      task: "Dry run the three-reversal rotate on `[1 2 3 4 5]` with `k = 7`. What is `k` after `k %= len(s)`, and what is the result?",
      answer:
        "`k = 7 % 5 = 2`. Reverse all: `[5 4 3 2 1]`. Reverse first 2: `[4 5 3 2 1]`. Reverse the rest: `[4 5 1 2 3]`.",
    },
    {
      task: "Check whether a string is a palindrome using two pointers, so that `\"नमन\"` and `\"madam\"` both work.",
      answer:
        "Convert to `r := []rune(s)`, then `for i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 { if r[i] != r[j] { return false } }; return true`. Runes, not bytes, so multi-byte characters compare as whole characters. O(n) time.",
    },
  ],
  'dsa-frequency-top-k': [
    {
      task: 'The main task: Return the top K most frequent **characters** in a string. Decide whether you count bytes or runes, and say why.',
      answer:
        'Count with `map[rune]int` by ranging over the string, which yields runes. Bytes would split `é` into two meaningless counts, so runes are right for text; bytes are fine only if the input is known to be ASCII. Then sort `(rune, count)` pairs by count descending, rune ascending, and take `[:min(k, len(pairs))]`.',
    },
    {
      task: 'Remove the tie-break from the comparator and run the program ten times with words that tie. What happens?',
      answer:
        'The order of tied words can change between runs, because it comes from map iteration order, which Go randomises. Deterministic output needs a full ordering.',
    },
    {
      task: 'Group anagrams: `["eat","tea","tan","ate","nat"]` → groups. Use a sorted-rune key in a `map[string][]string`.',
      answer:
        'Key each word by `string(sorted runes)`. Then sort the groups before printing, or the order will vary run to run.',
    },
    {
      task: "Dry run the sort on `\"b a b a c\"` with `k = 2`. Which tie-break decides the order?",
      answer:
        "Counts: `a 2, b 2, c 1`. `a` and `b` tie on count, so the word comparison puts `a` first. Result: `[{a 2} {b 2}]`.",
    },
    {
      task: "Return the `k` most frequent numbers in a `[]int` using the same pattern.",
      answer:
        "`counts := map[int]int{}`; count; move to a `[]struct{ n, c int }`; `slices.SortFunc` by `c` descending then `n` ascending; take `[:min(k, len(list))]`. O(n + m log m).",
    },
  ],
  'dsa-valid-parentheses': [
    {
      task: 'The main task: Solve "evaluate reverse Polish notation" (`["2","1","+","3","*"]` → 9) with a `[]int` stack and `strconv.Atoi`.',
      answer:
        'For each token: if it is `+ - * /`, pop `b` then `a` (order matters for `-` and `/`), push `a op b`. Otherwise `n, err := strconv.Atoi(tok)`, return the error if any, and push `n`. At the end the stack must hold exactly one value. `["2","1","+","3","*"]` gives `(2+1)*3 = 9`. Check the stack has two values before each pop.',
    },
    {
      task: 'Call `valid(")")` with the `len(stack) == 0` guard removed. What happens?',
      answer: 'A panic: index out of range [-1]. The guard is the whole edge case.',
    },
    {
      task: 'Return the length of the longest valid parentheses substring, using a stack of indices.',
      answer:
        'Push -1 first as a base. Push each `(` index; on `)`, pop, and if the stack is empty push the current index as the new base, otherwise the length is `i - top`. O(n).',
    },
    {
      task: "Dry run `\"([)]\"`. At which character does it fail, and why?",
      answer:
        "`(` push, `[` push (stack `([`). Then `)`: the top is `[`, which does not match `)`, so return false at index 2. The count of each bracket type is fine; the order is wrong, and only a stack catches that.",
    },
    {
      task: "Find the minimum number of brackets to add to make a string of `(` and `)` valid (`\"())(\"` needs 2).",
      answer:
        "You do not even need a slice: keep `open` (unmatched `(` so far) and `add`. On `(`, `open++`. On `)`, if `open > 0` then `open--` else `add++`. Answer is `add + open`. `\"())(\"` gives add=1, open=1, total 2. O(n) time, O(1) space.",
    },
  ],
  'dsa-binary-search': [
    {
      task: 'The main task: Find the first and last position of a target in a sorted slice with duplicates, using two `sort.Search` calls.',
      answer:
        '`first := sort.SearchInts(s, target)` (the first index with `s[i] >= target`). If `first == len(s) || s[first] != target`, return `-1, -1`. Otherwise `last := sort.SearchInts(s, target+1) - 1`. For `[5 7 7 8 8 10]` and 8 this gives `3, 4`. Both calls are O(log n).',
    },
    {
      task: 'Use `sort.Search` to find the integer square root of 2,000,000,000 without `math.Sqrt`.',
      answer: '`sort.Search(n, func(k int) bool { return k*k > n }) - 1` gives 44721. Binary search on the answer.',
    },
    {
      task: 'Search a rotated sorted slice (`[4 5 6 7 0 1 2]`) for a target in O(log n).',
      answer:
        'At each step one half is sorted. Check whether the target lies inside that sorted half; if so search it, otherwise search the other half.',
    },
    {
      task: "Dry run the hand-written search on `s = [1 3 5 7 9 11]` for `target = 4`. List `lo`, `hi`, `mid` each step and the final return value.",
      answer:
        "lo=0 hi=5 mid=2 (5 > 4) hi=1. lo=0 hi=1 mid=0 (1 < 4) lo=1. lo=1 hi=1 mid=1 (3 < 4) lo=2. Now lo > hi, return -1. Note `lo = 2` is the insertion point, which is what `slices.BinarySearch` would give you.",
    },
    {
      task: "Find the peak index in a \"mountain\" slice that strictly rises then falls (`[1 3 8 12 4 2]` → 3) in O(log n).",
      answer:
        "`sort.Search(len(s)-1, func(i int) bool { return s[i] > s[i+1] })`. The condition is false on the way up and true on the way down, so it is monotonic and binary search applies. Returns 3.",
    },
  ],
  'dsa-lru-cache': [
    {
      task: 'The main task: Add a `Peek(key)` method that returns the value without making it most recent. Show with a test that a peeked key can still be evicted.',
      answer:
        '`func (c *LRU) Peek(key int) (int, bool) { el, ok := c.items[key]; if !ok { return 0, false }; return el.Value.(*entry).val, true }` — no `MoveToFront`. Test: capacity 2, put 1 and 2, peek 1, put 3. Because peek did not refresh 1, it is still the oldest and gets evicted: `Get(1)` returns `0, false`.',
    },
    {
      task: 'Remove the `delete(c.items, ...)` line on eviction and write a test that catches it.',
      answer:
        'After evicting key 2, `len(c.items)` is still 3 for capacity 2, and `Get(2)` returns an element no longer in the list. Assert on `len(c.items) == c.ll.Len()`.',
    },
    {
      task: 'After the Concurrency section: make `Get` and `Put` safe for concurrent use and explain why `RLock` is wrong for `Get`.',
      answer:
        '`Get` calls `MoveToFront`, which writes to the list. Two readers under `RLock` would race. Use one `sync.Mutex` for both.',
    },
    {
      task: "Capacity 2. Run `Put(1,1)`, `Put(2,2)`, `Put(1,10)`, `Put(3,3)`. Which key is evicted, and what does `Get(1)` return?",
      answer:
        "`Put(1,10)` updates key 1 and moves it to the front, so the list is `1, 2`. `Put(3,3)` evicts the back, key 2. `Get(1)` returns `10 true`.",
    },
    {
      task: "Why does the brute-force slice version cost O(n) per `Get`, even though finding a key in a map is O(1)? What exactly does `container/list` fix?",
      answer:
        "Even if a map told you the index, removing an element from the middle of a slice shifts every element after it: O(n). A doubly linked list can unlink a node and push it to the front by changing a few pointers, O(1), as long as you already hold the node, which the map gives you.",
    },
  ],
  'dsa-reverse-linked-list': [
    {
      task: 'The main task: Reverse only the nodes between positions `m` and `n` (1-based) and leave the rest in place.',
      answer:
        'Use a dummy node before the head. Walk `m-1` steps to `before`, the node in front of the range. Then repeat `n-m` times: take the node after `cur` (where `cur := before.Next`) and move it to just after `before`. Return `dummy.Next`. O(n) time, O(1) space, and the dummy handles `m = 1`.',
    },
    {
      task: "Dry run the loop on a one-node list `5`. How many iterations, and what is returned?",
      answer:
        "One iteration: next = nil, 5.Next = nil, prev = 5, cur = nil. Return 5. No special case needed, and a nil head gives zero iterations and returns nil.",
    },
    {
      task: "Check whether a linked list is a palindrome (`1 → 2 → 2 → 1` is) in O(n) time and O(1) extra space.",
      answer:
        "Find the middle with slow/fast pointers, reverse the second half with the same three-pointer loop, then walk both halves comparing values. Optionally reverse the second half back so the caller's list is unchanged.",
    },
  ],
  'dsa-detect-cycle': [
    {
      task: 'The main task: Return the node where the cycle starts. Hint: after they meet, move one pointer back to the head and step both by one.',
      answer:
        'Run Floyd until `slow == fast` (return nil if `fast` reaches nil). Then set `slow = head` and step both by one until they meet again. That node is the start of the cycle. It works because the distance from the head to the start equals the distance from the meeting point to the start, going round the loop.',
    },
    {
      task: "Dry run Floyd on `1 → 2 → 3` with no cycle. Why does the loop stop, and after how many steps?",
      answer:
        "Step 1: slow = 2, fast = 3. Now `fast.Next` is nil, so the condition `fast != nil && fast.Next != nil` fails and the loop ends: return false after 1 step.",
    },
    {
      task: "Find the length of the cycle, once you know there is one.",
      answer:
        "After `slow == fast`, keep `fast` still and move `slow` one step at a time, counting, until it comes back to `fast`. The count is the cycle length. In the dry-run list (`2 → 3 → 4 → 2`) it is 3.",
    },
  ],
  'dsa-merge-sorted-lists': [
    {
      task: 'The main task: Merge `k` sorted lists. First do it pairwise, then with a min-heap from `container/heap`, and compare the complexity.',
      answer:
        'Pairwise: merge list 0 with 1, then the result with 2, and so on. That is O(k·N) for N total nodes. Better: push each list\'s head into a min-heap ordered by `Val` (`container/heap`), pop the smallest, attach it, and push its `Next` if not nil. That is O(N log k).',
    },
    {
      task: "Dry run the merge with `a = nil` and `b = 1 → 2`. Does the loop run at all?",
      answer:
        "No. The loop needs both lists non-nil, so it is skipped, and the leftover line attaches all of `b` to `dummy`. Return `dummy.Next`, which is `1 → 2`. The dummy node is why there is no special case.",
    },
    {
      task: "Merge two sorted **slices** `[]int` into a new sorted slice in O(n + m).",
      answer:
        "Two indices `i, j`. While both are in range, append the smaller of `a[i]`, `b[j]` and step that index. Then `out = append(out, a[i:]...)` and `out = append(out, b[j:]...)`. Pre-size with `make([]int, 0, len(a)+len(b))`.",
    },
  ],
  'dsa-binary-tree': [
    {
      task: 'The main task: Return the right side view of a tree: the last value of each level. Reuse the level-order code.',
      answer:
        'Run the level-order loop and append only the last value of each level: `view = append(view, queue[n-1].Val)` before `queue = queue[n:]`. For the example tree it gives `[3 20 7]`. O(n) time.',
    },
    {
      task: "Using the dry-run tree, trace `maxDepth`. What does each call return?",
      answer:
        "`maxDepth(9) = 1 + max(0, 0) = 1`. `maxDepth(15) = 1`, `maxDepth(7) = 1`, so `maxDepth(20) = 1 + max(1, 1) = 2`. `maxDepth(3) = 1 + max(1, 2) = 3`.",
    },
    {
      task: "Return the average value of each level (`[3 14.5 11]` for the dry-run tree).",
      answer:
        "Same level-order loop. Inside a level, add up the `n` values and append `float64(sum) / float64(n)`. Convert before dividing, or integer division turns 14.5 into 14.",
    },
  ],
  'dsa-subsets-permutations': [
    {
      task: 'The main task: Generate all combinations of `k` numbers out of `1..n`. Stop a branch early when there are not enough numbers left to fill it.',
      answer:
        'Backtrack with `walk(start int)`: if `len(cur) == k`, save `slices.Clone(cur)` and return. Loop `for x := start; x <= n - (k - len(cur)) + 1; x++` — the upper bound is the early stop, since there must be enough numbers left. Append `x`, call `walk(x+1)`, then `cur = cur[:len(cur)-1]`. `n=4, k=2` gives 6 combinations.',
    },
    {
      task: "How many subsets and how many permutations does `[1 2 3 4]` have? Explain each number.",
      answer:
        "Subsets: 2⁴ = 16, because each of the 4 elements is independently in or out. Permutations: 4! = 24, because there are 4 choices for the first place, 3 for the second, 2, then 1.",
    },
    {
      task: "Return all subsets whose sum equals a target (`[2 3 5]`, target 5 → `[2 3]` and `[5]`).",
      answer:
        "The same skip/take backtracking, carrying a running `sum`. At the end of a branch, save `slices.Clone(cur)` only if `sum == target`. If all numbers are positive, stop a branch early as soon as `sum > target`.",
    },
  ],
  'dsa-dynamic-programming': [
    {
      task: 'The main task: Solve "house robber": the most money from a row of houses when you cannot rob two next to each other. Write the recurrence before the code.',
      answer:
        'Recurrence: `best(i) = max(best(i-1), best(i-2) + houses[i])` — either skip this house or rob it and skip the one before. Keep two variables: `prev, cur := 0, 0; for _, h := range houses { prev, cur = cur, max(cur, prev+h) }`. `[2 7 9 3 1]` gives 12 (2 + 9 + 1). O(n) time, O(1) space.',
    },
    {
      task: "Fill the stairs table for `n = 6` and check it against the program (`climbStairs(5)` is 8).",
      answer:
        "`ways`: 1, 1, 2, 3, 5, 8, 13 for steps 0 to 6. So `climbStairs(6) = 13`. It is the Fibonacci sequence, shifted by one.",
    },
    {
      task: "Fill the `best` table for coins `[1 3 4]` and amount 6. Why is the greedy answer (take the biggest coin first) wrong here?",
      answer:
        "`best[0..6]` = 0, 1, 2, 1, 1, 2, 2. So 6 needs 2 coins (3 + 3). Greedy takes 4, then 1, then 1: 3 coins. Greedy fails for some coin sets, which is why coin change needs DP.",
    },
  ],
  'dsa-number-of-islands': [
    {
      task: 'The main task: Return the area of the largest island instead of the count. Make `sink` return how many cells it covered.',
      answer:
        'Make `sink` return an `int`: 0 for out of bounds or water, otherwise mark the cell and return `1 + sink(down) + sink(up) + sink(right) + sink(left)`. In the scan, `best = max(best, sink(r, c))` whenever you find land. O(rows·cols) time.',
    },
    {
      task: "Dry run `numIslands` on the 3×3 grid `101 / 010 / 101`. What is the answer, and would it change if diagonals counted?",
      answer:
        "No two land cells touch up, down, left or right, so each of the 5 is its own island: 5. If diagonals counted, the centre joins all four corners: 1. You would add four more neighbour calls to `sink`.",
    },
    {
      task: "Count the cells of water that touch at least one land cell (up, down, left or right).",
      answer:
        "No flood fill needed. Scan every `'0'` cell and check its four neighbours with the same bounds checks; count it if any is `'1'`. O(rows·cols) time, O(1) space.",
    },
  ],
  'dsa-merge-intervals': [
    {
      task: 'The main task: Insert a new interval into an already sorted, non-overlapping list and merge as needed, in O(n) without sorting again.',
      answer:
        'Three phases in one pass: append every interval that ends before the new one starts. Then, while intervals start at or before the new one\'s end, widen the new one to `min` of the starts and `max` of the ends. Append the new one, then append the rest. O(n) and no sort, because the input is already sorted.',
    },
    {
      task: "Dry run `[1,4] [2,3]`. Why must the merge use `max(last end, new end)` rather than just the new end?",
      answer:
        "`[2,3]` overlaps `[1,4]`. Taking the new end would shrink it to `[1,3]`, which is wrong; `max(4, 3) = 4` keeps `[1,4]`. An interval can sit entirely inside the previous one.",
    },
    {
      task: "Given meeting times, can one person attend all of them? (`[0,30] [5,10] [15,20]` → no.)",
      answer:
        "Sort by start, then check each meeting starts at or after the previous one ends: `if m[i][0] < m[i-1][1] { return false }`. O(n log n). Whether `[1,5] [5,8]` is allowed depends on `<` vs `<=`; ask.",
    },
  ],
  'dsa-sliding-window': [
    {
      task: 'The main task: Find the length of the longest substring with at most two distinct characters. Shrink the window from the left when a third one arrives.',
      answer:
        'Keep `count := map[rune]int{}` for the window. Add each rune on the right. While `len(count) > 2`, decrement the rune at `start`, `delete` it from the map when its count hits 0, and move `start` forward. Track `best = max(best, i-start+1)`. `"eceba"` gives 3 (`"ece"`). O(n).',
    },
    {
      task: "Dry run `\"abba\"`. At `i = 3` the `a` was last seen at index 0. What is `start`, and why does the `j >= start` check matter here?",
      answer:
        "At i=2 (`b`, last seen 1), start moves to 2. At i=3, `a` was seen at 0, but 0 < start = 2, so it is outside the window and start stays 2. Without the check start would jump back to 1, giving a wrong window `bba`. Answer: 2.",
    },
    {
      task: "Find the maximum sum of any `k` consecutive numbers (`[2 1 5 1 3 2]`, k = 3 → 9).",
      answer:
        "Sum the first `k`, then slide: `sum += s[i] - s[i-k]` for each `i` from `k`, tracking the max. O(n) instead of O(n·k). Sums: 8, 7, 9, 6, so 9.",
    },
  ],
}
