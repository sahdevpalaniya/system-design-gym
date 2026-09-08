import type { LangLesson } from '@/lib/types'

/** HTTP services with the standard library, and how to lay a project out. */
export const WEB: LangLesson[] = [
  {
    slug: 'http-server',
    title: 'An HTTP server with no framework',
    navTitle: 'HTTP server, no framework',
    oneLine: 'Go 1.22 routes by method and path in the standard library. You do not need gin, echo, or chi.',
    blocks: [
      {
        body: [
          'Most Go tutorials reach for a web framework on page one. Since Go 1.22 that advice is out of date. `net/http` routes on method and path parameters by itself, which was the only real reason to add one.',
          'Starting without a framework is not stubbornness. It means you learn what an HTTP handler actually is, and every framework you meet later makes immediate sense because they are all wrappers over this.',
        ],
      },
      {
        heading: 'The whole server',
        code: {
          label: 'main.go',
          src: `package main

import (
\t"encoding/json"
\t"log"
\t"net/http"
)

func main() {
\tmux := http.NewServeMux()

\t// Go 1.22: method and {param} routing, built in.
\tmux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
\t\twriteJSON(w, 200, map[string]string{"status": "ok"})
\t})

\tmux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
\t\tid := r.PathValue("id")
\t\twriteJSON(w, 200, map[string]string{"id": id})
\t})

\tmux.HandleFunc("POST /users", createUser)

\tlog.Println("listening on :8080")
\tlog.Fatal(http.ListenAndServe(":8080", mux))
}`,
        },
      },
      {
        heading: 'A handler is one function shape',
        body: [
          'Everything in `net/http` is built on this signature. `w` is where you write the response; `r` is everything the client sent. That is the entire interface.',
        ],
        code: {
          label: 'handler.go',
          src: `func writeJSON(w http.ResponseWriter, status int, v any) {
\tw.Header().Set("Content-Type", "application/json")   // headers FIRST
\tw.WriteHeader(status)                                // then the status
\tjson.NewEncoder(w).Encode(v)                         // then the body
}

func createUser(w http.ResponseWriter, r *http.Request) {
\tvar in struct {
\t\tName  string \`json:"name"\`
\t\tEmail string \`json:"email"\`
\t}

\tif err := json.NewDecoder(r.Body).Decode(&in); err != nil {
\t\twriteJSON(w, 400, map[string]string{"error": "invalid json"})
\t\treturn                          // ALWAYS return after writing an error
\t}

\tif in.Name == "" || in.Email == "" {
\t\twriteJSON(w, 422, map[string]string{"error": "name and email are required"})
\t\treturn
\t}

\twriteJSON(w, 201, in)
}`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'The order matters. Set headers, then call `WriteHeader`, then write the body. `WriteHeader` can only be called once — writing a body without it implies a 200. If you write an error after already writing a body you get "superfluous WriteHeader" in your logs and a corrupt response. Always `return` immediately after writing an error.',
        },
      },
      {
        heading: 'Test it',
        code: {
          label: 'terminal',
          src: `go run .

curl -s localhost:8080/health | jq
curl -s localhost:8080/users/42 | jq
curl -s -X POST localhost:8080/users -d '{"name":"a","email":"a@b.c"}' | jq
curl -s -X POST localhost:8080/users -d 'not json' -i`,
        },
      },
      {
        heading: 'The production settings, now rather than later',
        body: [
          '`http.ListenAndServe(":8080", mux)` is fine for a tutorial and wrong for anything you deploy. The zero-value server has **no timeouts at all**, so one slow client can hold a connection open forever.',
        ],
        code: {
          label: 'server.go',
          src: `srv := &http.Server{
\tAddr:              ":8080",
\tHandler:           mux,
\tReadHeaderTimeout: 5 * time.Second,    // the Slowloris defence people forget
\tReadTimeout:       15 * time.Second,
\tWriteTimeout:      30 * time.Second,
\tIdleTimeout:       60 * time.Second,
\tMaxHeaderBytes:    1 << 20,
}
log.Fatal(srv.ListenAndServe())`,
        },
      },
    ],
    keyPoints: [
      'Go 1.22 `net/http` routes on `"GET /users/{id}"` and reads params with `r.PathValue`. No framework needed.',
      'A handler is `func(http.ResponseWriter, *http.Request)`. Everything else is a wrapper over that.',
      'Headers, then `WriteHeader`, then body — and always `return` after writing an error.',
      'A bare `http.ListenAndServe` has no timeouts. Configure `http.Server` yourself.',
    ],
    remember:
      'A handler reads the request and writes the response. Everything a framework adds is convenience on top of that one function shape.',
    task: 'Build an in-memory user API: GET, POST, GET by id, DELETE. Keep the users in a map behind a mutex — you now know why the mutex is needed. Test every route with curl, including the failure cases.',
    refs: [
      { label: 'Routing Enhancements for Go 1.22', href: 'https://go.dev/blog/routing-enhancements' },
      { label: 'Go 1.22 release notes', href: 'https://go.dev/blog/go1.22' },
    ],
  },

  {
    slug: 'middleware-and-shutdown',
    title: 'Middleware and graceful shutdown',
    navTitle: 'Middleware and shutdown',
    oneLine: 'Wrap every request with logging, panic recovery, and auth — then stop the server without dropping anyone.',
    blocks: [
      {
        heading: 'What middleware is, and what graceful shutdown means',
        body: [
          '**Middleware** is code that runs around every request rather than inside one handler. Logging, catching panics, checking a token, limiting how often somebody can call you — none of that belongs to a single route, so it wraps all of them.',
          'In Go there is no middleware system to learn. A middleware is a function that takes a handler and returns a handler. You compose them by nesting one inside another, and that is the entire mechanism.',
          '**Graceful shutdown** is what happens when your server is told to stop. The default is to die instantly and drop every request that was in progress. Graceful shutdown means: stop accepting new connections, let the ones already running finish, then exit. Every deployment restarts your service, so this runs far more often than you would think.',
        ],
      },
      {
        heading: 'Middleware is a function that wraps a handler',
        body: [
          'There is no middleware system in Go. There does not need to be one. A middleware takes a handler and returns a handler, and you compose them by nesting. That is the entire mechanism.',
        ],
        code: {
          label: 'middleware.go',
          src: `type Middleware func(http.Handler) http.Handler

func Chain(h http.Handler, ms ...Middleware) http.Handler {
\tfor i := len(ms) - 1; i >= 0; i-- {   // apply in reverse so the first listed runs first
\t\th = ms[i](h)
\t}
\treturn h
}

handler := Chain(mux, Recover, RequestID, Logger)`,
        },
      },
      {
        heading: 'Logging',
        code: {
          label: 'logger.go',
          src: `func Logger(next http.Handler) http.Handler {
\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\tstart := time.Now()

\t\tnext.ServeHTTP(w, r)          // everything before this runs on the way in,

\t\tslog.Info("request",          // everything after, on the way out
\t\t\t"method", r.Method,
\t\t\t"path", r.URL.Path,
\t\t\t"duration_ms", time.Since(start).Milliseconds(),
\t\t)
\t})
}`,
          note: 'To log the status code you need a small wrapper around ResponseWriter that records what WriteHeader was called with — ResponseWriter does not expose it.',
        },
      },
      {
        heading: 'Panic recovery',
        body: [
          'A panic in a handler would otherwise kill the connection and dump a stack trace nobody sees. Recover it, log it properly, and return a clean 500.',
        ],
        code: {
          label: 'recover.go',
          src: `func Recover(next http.Handler) http.Handler {
\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\tdefer func() {
\t\t\tif rec := recover(); rec != nil {
\t\t\t\tslog.Error("panic", "err", rec, "stack", string(debug.Stack()))
\t\t\t\thttp.Error(w, "internal server error", 500)
\t\t\t}
\t\t}()
\t\tnext.ServeHTTP(w, r)
\t})
}`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'This recovers panics in the **handler’s own goroutine only**. A panic inside a goroutine you started yourself is not caught by any parent recover — it kills the entire process. Every long-lived goroutine you launch needs its own `defer recover()`.',
        },
      },
      {
        heading: 'Panic versus error, settled',
        bullets: [
          '**Panic means "this program’s assumptions are broken".** A nil dependency at startup, an impossible switch branch, a `regexp.MustCompile` on a literal.',
          '**Everything a user can cause is an error.** A bad request, a missing row, a network failure, a validation failure. Never panic on those.',
        ],
      },
      {
        heading: 'Graceful shutdown',
        body: [
          'When your deployment sends SIGTERM, the default behaviour is to die instantly and drop every request in flight. Graceful shutdown stops accepting new connections and lets the current ones finish.',
        ],
        code: {
          label: 'shutdown.go',
          src: `errCh := make(chan error, 1)

go func() {
\tif err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
\t\terrCh <- err
\t}
}()

quit := make(chan os.Signal, 1)         // buffered, or the signal is dropped
signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

select {
case err := <-errCh:
\treturn err
case <-quit:
\tslog.Info("shutting down")
\tctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
\tdefer cancel()
\treturn srv.Shutdown(ctx)        // stop accepting, drain what is in flight
}`,
          note: 'The signal channel MUST be buffered. signal.Notify never blocks, so an unbuffered channel with nobody receiving yet silently loses the signal.',
        },
      },
    ],
    keyPoints: [
      'Middleware is `func(http.Handler) http.Handler`. Compose by nesting — no framework required.',
      'Recover panics at the edge, log the stack, return a clean 500. Panic is for broken assumptions only.',
      'A panic inside a goroutine you started is not recovered by the parent. It kills the process.',
      '`srv.Shutdown(ctx)` drains in-flight requests. Buffer the signal channel.',
    ],
    remember:
      'A handler that wraps another handler is the only extension mechanism Go’s HTTP stack has, and it is enough for everything.',
    task: 'Add Logger, Recover, and RequestID middleware to yesterday’s API, plus graceful shutdown. Add a route that panics on purpose and check you get a JSON 500 and a stack trace in the log — and that the server is still running afterwards.',
    refs: [
      { label: 'net/http docs', href: 'https://pkg.go.dev/net/http' },
      { label: 'Effective Go — defer', href: 'https://go.dev/doc/effective_go#defer' },
    ],
  },

  {
    slug: 'project-layouts',
    title: 'How to lay a Go project out',
    navTitle: 'Project layouts',
    oneLine: 'What a package really is, the three layouts you will meet, and what every folder is for.',
    blocks: [
      {
        heading: 'First, what a package is',
        body: [
          'A **package** is a folder of `.go` files that are compiled together and share a name. Every file in one folder must declare the same package name, and that name is how other code refers to it.',
          'Packages are the only unit of privacy Go has. A name starting with a capital letter can be used from outside the package. A lowercase name cannot. There is no `public`, `private` or `protected` keyword — the folder boundary plus capitalisation is the whole system.',
          'A **module** is one level up. It is a whole project: a folder with a `go.mod` file, containing one or more packages. The module path in `go.mod` is the prefix for every import inside it.',
        ],
      },
      {
        heading: 'What "project layout" actually means',
        body: [
          'Laying out a project means deciding which folders exist and what goes in each one. It is not decoration. In Go the folder structure decides three real things: **what can import what**, **what outsiders can use**, and **how much you have to read to understand one feature**.',
          'Go has no official required layout. What it has instead is one enforced rule (`internal/`, below) and a set of conventions that most teams follow. Below are the three layouts you will actually meet, smallest first.',
        ],
      },
      {
        heading: 'Layout 1 — flat',
        body: [
          'Everything in one package at the top of the repository. There are no subfolders.',
          '**Use it for:** a command-line tool, a script, a small library, or the first two days of any project. Under roughly 1,000 lines it is the right answer, and reaching for more structure than this is the most common way beginners waste time.',
          '**It stops working when:** you cannot find things any more, or two unrelated parts of the file start needing the same helper with the same name.',
        ],
        tree: {
          caption:
            'Every file says `package main`, so nothing needs importing. Tests sit beside the code they test.',
          nodes: [
            { depth: 0, name: 'wordcount', kind: 'dir', note: 'the whole project' },
            { depth: 1, name: 'go.mod', kind: 'file', note: 'module name and Go version' },
            { depth: 1, name: 'main.go', kind: 'file', note: 'package main — where the program starts' },
            { depth: 1, name: 'count.go', kind: 'file', note: 'package main — more of the same program' },
            { depth: 1, name: 'count_test.go', kind: 'file', note: 'tests for count.go' },
          ],
        },

      },
      {
        heading: 'Layout 2 — grouped by layer',
        body: [
          'The next step most people take: a folder per *kind of file*. All the data types together, all the business logic together, all the HTTP handlers together.',
          'This is the layout most frameworks in other languages push you towards, so it feels familiar. It is worth understanding because you will inherit codebases built this way.',
          '**The problem** shows up at about ten features. Adding one feature means editing five folders, every package ends up importing every other package, and nothing can be understood — or deleted — on its own. You also hit Go import cycles quickly, because `models` wants something from `services` and `services` already imports `models`.',
        ],
        tree: {
          caption:
            'To change how orders work you open four folders. To delete orders you must find its pieces in all four.',
          nodes: [
            { depth: 0, name: 'shop', kind: 'dir' },
            { depth: 1, name: 'go.mod', kind: 'file' },
            { depth: 1, name: 'cmd', kind: 'dir', note: 'runnable programs' },
            { depth: 2, name: 'api', kind: 'dir' },
            { depth: 3, name: 'main.go', kind: 'file' },
            { depth: 1, name: 'internal', kind: 'dir', note: 'private to this project' },
            { depth: 2, name: 'models', kind: 'dir', note: 'User, Order, Product — all of them together' },
            { depth: 3, name: 'user.go', kind: 'file' },
            { depth: 3, name: 'order.go', kind: 'file' },
            { depth: 2, name: 'services', kind: 'dir', note: 'the logic for all of them' },
            { depth: 3, name: 'user.go', kind: 'file' },
            { depth: 3, name: 'order.go', kind: 'file' },
            { depth: 2, name: 'handlers', kind: 'dir', note: 'the HTTP layer for all of them' },
            { depth: 3, name: 'user.go', kind: 'file' },
            { depth: 3, name: 'order.go', kind: 'file' },
            { depth: 2, name: 'repository', kind: 'dir', note: 'the SQL for all of them' },
            { depth: 3, name: 'user.go', kind: 'file' },
            { depth: 3, name: 'order.go', kind: 'file' },
          ],
        },
      },
      {
        heading: 'Layout 3 — grouped by domain',
        body: [
          'A folder per *thing your product has*, not per kind of file. Everything about orders lives in the `order` package: its type, its rules, its SQL, its HTTP handlers, its tests.',
          'This is what most experienced Go teams settle on, and what the rest of this track uses. One feature is one folder, so you can read it, test it, hand it to someone else, or delete it without hunting.',
          '**Use it for:** anything that will grow — a web service, an API, a long-lived tool.',
        ],
        tree: {
          caption:
            'To delete the order feature you delete one folder and one line in main.go. That is the whole test of a good layout.',
          nodes: [
            { depth: 0, name: 'shop', kind: 'dir' },
            { depth: 1, name: 'go.mod', kind: 'file' },
            { depth: 1, name: 'cmd', kind: 'dir', note: 'runnable programs, no logic' },
            { depth: 2, name: 'api', kind: 'dir' },
            { depth: 3, name: 'main.go', kind: 'file', note: 'wiring only' },
            { depth: 1, name: 'internal', kind: 'dir', note: 'private to this project' },
            { depth: 2, name: 'config', kind: 'dir', note: 'reads the environment, once' },
            { depth: 2, name: 'database', kind: 'dir', note: 'opens the connection pool' },
            { depth: 2, name: 'user', kind: 'dir', note: 'EVERYTHING about users' },
            { depth: 3, name: 'model.go', kind: 'file', note: 'the User type' },
            { depth: 3, name: 'repository.go', kind: 'file', note: 'the SQL' },
            { depth: 3, name: 'service.go', kind: 'file', note: 'the rules' },
            { depth: 3, name: 'handler.go', kind: 'file', note: 'the HTTP layer' },
            { depth: 3, name: 'service_test.go', kind: 'file', note: 'its tests' },
            { depth: 2, name: 'order', kind: 'dir', note: 'everything about orders' },
            { depth: 2, name: 'product', kind: 'dir', note: 'everything about products' },
            { depth: 1, name: 'migrations', kind: 'dir', note: 'the database schema, as numbered .sql files' },
          ],
        },
      },
      {
        heading: 'The three side by side',
        table: {
          headers: ['Layout', 'Best for', 'Falls apart when'],
          rows: [
            ['**Flat** — one package', 'CLIs, scripts, small libraries, day one of anything', 'you can no longer find things (~1,000 lines)'],
            ['**By layer** — `models/`, `services/`', 'small apps; codebases you inherit', 'about ten features, or the first import cycle'],
            ['**By domain** — `user/`, `order/`', 'services and APIs meant to grow', 'rarely — but it is overkill for a 200-line tool'],
          ],
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Start flat. Move to domain folders when the flat file starts to hurt. Starting at layout 3 for a 200-line program is the same mistake as staying at layout 1 for a 20,000-line one — the layout should match the size of the problem.',
        },
      },
      {
        heading: 'The names you will hear, and where each one appears',
        body: [
          'Those three layouts have names, and people use them loosely. Here is what they actually mean, and which project in this track builds each one — so you finish having written all three rather than having read about them.',
        ],
        table: {
          headers: ['Layout', 'Also called', 'Built in', 'Reach for it when'],
          rows: [
            [
              '**Flat**',
              'single package',
              'Practice 1',
              'a CLI, a script, or under ~1,000 lines',
            ],
            [
              '**Layered**',
              'package-by-layer, n-tier, standard layout',
              'Practice 2, **Project 1 — URL shortener**',
              'the service has one concept',
            ],
            [
              '**By feature**',
              'package-by-domain, vertical slice, DDD-lite',
              'Practice 3, **Project 2 — Expense tracker**',
              'several concepts, and it will grow — the usual default',
            ],
            [
              '**Ports and adapters**',
              'hexagonal, clean, onion',
              '**Project 3 — Small shop**',
              'you expect to swap an external dependency',
            ],
          ],
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'There is no winner here. The layout should match the size and the shape of the problem, and moving between them is a normal thing to do as a service grows. Being able to say *why* you picked one is what an interviewer is actually listening for.',
        },
      },
      {
        heading: 'What every folder means',
        body: [
          'These names are conventions, not rules — except `internal/`, which the compiler enforces. Learn them because almost every Go repository you open will use them.',
        ],
        table: {
          headers: ['Folder', 'What goes in it', 'Why it exists'],
          rows: [
            [
              '`cmd/`',
              'One subfolder per runnable program, each with its own `main.go`.',
              'A project often ships more than one binary — an API, a worker, a seeder. `cmd/api/` and `cmd/worker/` keep them apart. Put **no logic here**, only wiring.',
            ],
            [
              '`internal/`',
              'Everything private to this project.',
              '**The compiler forbids any other module from importing it.** It is the only enforced boundary Go has, so you get a private API for free.',
            ],
            [
              '`pkg/`',
              'Code you intend outsiders to import.',
              'The opposite of `internal/`. Only add it if you are publishing a library. For a normal service it is noise — many teams skip it entirely.',
            ],
            [
              '`internal/<domain>/`',
              'One folder per business concept: `user/`, `order/`.',
              'Keeps one feature in one place. This is the folder you delete when a feature goes away.',
            ],
            [
              '`internal/config/`',
              'Reading and checking environment variables.',
              'Config is loaded once, at startup, and passed down. Nothing deeper should read the environment.',
            ],
            [
              '`internal/database/`',
              'Opening the connection pool, shared database helpers.',
              'One place that knows how to connect, so no domain package repeats it.',
            ],
            [
              '`internal/middleware/`',
              'Logging, panic recovery, auth checks, rate limiting.',
              'Cuts across every request, so it belongs to no single domain.',
            ],
            [
              '`internal/httpx/` (or `web/`)',
              'Shared HTTP helpers: JSON writing, error-to-status mapping.',
              'Stops every handler reinventing "how do I return an error".',
            ],
            [
              '`migrations/`',
              'Numbered `.sql` files that build the database schema.',
              'The schema is version-controlled like code, applied by a tool, never by hand.',
            ],
            [
              '`api/`',
              'OpenAPI or protobuf definitions.',
              'The contract with your clients, kept where they can find it. Optional.',
            ],
            [
              '`testdata/`',
              'Fixture files used by tests.',
              '**The go tool ignores any folder called `testdata`**, so nothing in it is compiled.',
            ],
            [
              '`scripts/`',
              'Build, deploy and helper scripts.',
              'Keeps shell scripts out of the root. Optional.',
            ],
            [
              '`vendor/`',
              'Copies of your dependencies.',
              'Created by `go mod vendor`. Only needed for builds with no network access.',
            ],
          ],
        },
      },
      {
        heading: 'internal/ is the one that is real',
        body: [
          'Everything above is a convention you could ignore. `internal/` is not. If a package sits anywhere under a folder named `internal`, only code rooted at that folder’s parent can import it. Anyone else gets a compile error.',
          'The practical advice: put almost everything in `internal/`. Move something out only when you have decided, on purpose, that outsiders may depend on it — because once they do, you cannot change it freely.',
        ],
        code: {
          label: 'what internal/ blocks',
          src: `github.com/you/shop/internal/user      ← lives here

github.com/you/shop/cmd/api            ✅ can import it (same module)
github.com/other/thing                 ❌ compile error, always`,
        },
      },
      {
        heading: 'Naming packages',
        bullets: [
          '**Short, lowercase, one word.** `user`, `order`, `config`. No underscores, no camelCase, no plurals.',
          '**The package name is part of every call**, so avoid repeating it. `user.Service` reads well; `user.UserService` stutters. Same for `user.New()` over `user.NewUser()`.',
          '**Name it for what it provides**, not what it contains. `store` not `structs`.',
          '**Never create `utils`, `helpers`, `common`, `base` or `shared`.** They have no meaning, so everything drifts into them and they end up importing everything, which causes import cycles. If you cannot name the package for what it does, you have not decided what it does.',
        ],
      },
      {
        heading: 'How to choose, in one line',
        body: [
          'One program and under a thousand lines: flat. A service you expect to grow: one folder per domain, everything under `internal/`, `main.go` doing nothing but wiring. You will never be criticised for either of those.',
        ],
      },
    ],
    keyPoints: [
      'A package is a folder; capitalisation decides what is visible outside it. A module is a project with a `go.mod`.',
      'Three layouts: flat for small things, grouped by layer (common but ages badly), grouped by domain for anything that grows.',
      '`cmd/` holds runnable programs and no logic. `internal/` is private and the compiler enforces it.',
      'Never make a `utils` or `common` package, and never let a package name stutter.',
    ],
    remember:
      'The layout should match the size of the problem. Start flat, move to one folder per feature when the flat version starts to hurt.',
    task: 'Take any small program you have written and lay it out all three ways. Notice how much work the layer version creates for one small change, and how little the flat version needs.',
    refs: [
      { label: 'Organizing a Go module', href: 'https://go.dev/doc/modules/layout' },
      { label: 'Effective Go — Package names', href: 'https://go.dev/doc/effective_go#package-names' },
      { label: 'How to Write Go Code', href: 'https://go.dev/doc/code' },
    ],
  },

  {
    slug: 'folder-structure-crud',
    title: 'Practice 3 — CRUD, one folder per feature',
    navTitle: 'Practice 3 — by feature',
    oneLine: 'The final layout, and the one the rest of this track is built on.',
    blocks: [
      {
        heading: 'The problem this one solves',
        body: [
          'In practice project two, everything about tasks was split across `internal/task` and `internal/api`. That is fine with one feature. Add users, orders and payments and every folder holds a bit of everything, so no feature can be read — or removed — in one place.',
          '**Grouping by feature** flips it. One folder holds one business concept and everything that concept needs: its type, its rules, its SQL, its HTTP handlers, its tests. The folder becomes the feature.',
          'The layers from practice project two do not go away. They become four files inside each feature folder, which is why building the layered version first was worth it.',
        ],
      },
      {
        heading: 'The four files, and what each one is responsible for',
        table: {
          headers: ['File', 'Responsible for', 'Knows about'],
          rows: [
            [
              '`model.go`',
              'The type itself and the shape of incoming requests. Field validation lives here.',
              'nothing outside its own package',
            ],
            [
              '`repository.go`',
              'Getting data in and out of storage. SQL and nothing else.',
              '`database/sql`',
            ],
            [
              '`service.go`',
              'The rules. What is allowed, what happens in what order, what counts as an error.',
              'the repository (through an interface it defines itself)',
            ],
            [
              '`handler.go`',
              'HTTP only. Read the request, call the service, write the response.',
              '`net/http` and the service',
            ],
          ],
        },
      },
      {
        body: [
          'Two words worth defining properly, because they get used loosely:',
          'A **repository** is the piece that stores and retrieves things. Its whole job is to hide *how* data is kept, so the rest of the program asks for "user 5" rather than writing SQL.',
          'A **service** is where the rules live. It is the part that says a password must be hashed before saving, that an email is lowercased first, that deleting a note you do not own is not allowed. If a rule would still be true with a different database and a different API, it belongs in the service.',
        ],
      },
      {
        heading: 'The layout',
        tree: {
          caption:
            'One folder per feature. To remove products you delete one folder and one line in main.go.',
          nodes: [
            { depth: 0, name: 'myapi', kind: 'dir', note: '' },
            { depth: 1, name: 'go.mod', kind: 'file', note: '' },
            { depth: 1, name: 'Makefile', kind: 'file', note: 'run, test, lint — so you stop retyping' },
            { depth: 1, name: 'cmd', kind: 'dir', note: '' },
            { depth: 2, name: 'api', kind: 'dir', note: '' },
            { depth: 3, name: 'main.go', kind: 'file', note: 'the only file that knows how it all connects' },
            { depth: 1, name: 'internal', kind: 'dir', note: 'private to this project, enforced by the compiler' },
            { depth: 2, name: 'config', kind: 'dir', note: 'reads and checks the environment, once' },
            { depth: 2, name: 'database', kind: 'dir', note: 'opens the pool' },
            { depth: 2, name: 'httpx', kind: 'dir', note: 'shared JSON and error helpers' },
            { depth: 2, name: 'middleware', kind: 'dir', note: 'logging, recovery, auth — applies to every request' },
            { depth: 2, name: 'user', kind: 'dir', note: 'ONE feature, top to bottom' },
            { depth: 3, name: 'model.go', kind: 'file', note: 'the type and its request shapes' },
            { depth: 3, name: 'repository.go', kind: 'file', note: 'SQL only' },
            { depth: 3, name: 'service.go', kind: 'file', note: 'the rules' },
            { depth: 3, name: 'handler.go', kind: 'file', note: 'HTTP only' },
            { depth: 3, name: 'errors.go', kind: 'file', note: 'this feature\'s error values' },
            { depth: 3, name: 'service_test.go', kind: 'file', note: '' },
            { depth: 2, name: 'note', kind: 'dir', note: 'the next feature, same five files' },
            { depth: 1, name: 'migrations', kind: 'dir', note: 'numbered .sql files' },
            { depth: 1, name: '.env.example', kind: 'file', note: 'every key, no values. The real .env is gitignored.' },
          ],
        },
      },
      {
        heading: 'The rule that holds it together',
        body: [
          'Dependencies point **inward**: handler → service → repository, and never the other way. The repository never imports `net/http`. The service ideally imports neither `net/http` nor `database/sql`.',
          'This is what makes each layer testable on its own. The service can be tested with a fake repository and no database. The repository can be tested against a real database and no HTTP server. Neither test needs the other layer to exist.',
        ],
        code: {
          label: 'the direction, as code',
          src: `handler.go    imports  net/http   +  service
service.go    imports  the repository interface it declares itself
repository.go imports  database/sql

// and never the reverse: no arrow points back up`,
        },
      },
      {
        heading: 'model.go — the type and its input',
        code: {
          label: 'internal/user/model.go',
          src: `package user

type User struct {
	ID           int64     \`json:"id"\`
	Name         string    \`json:"name"\`
	Email        string    \`json:"email"\`
	PasswordHash string    \`json:"-"\`          // never leaves the server
	CreatedAt    time.Time \`json:"created_at"\`
}

// CreateRequest is what a client is allowed to send. It is NOT
// the User type, so nobody can post an "id" or a "password_hash".
type CreateRequest struct {
	Name  string \`json:"name"\`
	Email string \`json:"email"\`
}

func (r CreateRequest) Validate() error {
	if strings.TrimSpace(r.Name) == "" {
		return fmt.Errorf("%w: name is required", ErrValidation)
	}
	if !strings.Contains(r.Email, "@") {
		return fmt.Errorf("%w: a valid email is required", ErrValidation)
	}
	return nil
}`,
          note: 'A separate request type is not extra work for its own sake. It is what stops a client setting fields you never meant them to control.',
        },
      },
      {
        heading: 'repository.go — storage, and nothing else',
        code: {
          label: 'internal/user/repository.go',
          src: `type Repository struct{ db *sql.DB }

func NewRepository(db *sql.DB) *Repository { return &Repository{db: db} }

func (r *Repository) Create(ctx context.Context, u *User) error {
	return r.db.QueryRowContext(ctx,
		\`INSERT INTO users (name, email, password_hash)
		 VALUES ($1, $2, $3) RETURNING id, created_at\`,
		u.Name, u.Email, u.PasswordHash,
	).Scan(&u.ID, &u.CreatedAt)
}

func (r *Repository) Delete(ctx context.Context, id int64) error {
	res, err := r.db.ExecContext(ctx, \`DELETE FROM users WHERE id = $1\`, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}`,
        },
      },
      {
        heading: 'service.go — the rules',
        code: {
          label: 'internal/user/service.go',
          src: `// Repository is declared HERE, by the code that uses it — not by the package
// that implements it. That way it is exactly as big as this service needs,
// and a test fake has two methods to write instead of fifteen.
type Repository interface {
	Create(ctx context.Context, u *User) error
	GetByID(ctx context.Context, id int64) (*User, error)
}

type Service struct{ repo Repository }

func NewService(r Repository) *Service { return &Service{repo: r} }

func (s *Service) Create(ctx context.Context, req CreateRequest) (*User, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	u := &User{Name: req.Name, Email: strings.ToLower(req.Email)}   // a rule
	if err := s.repo.Create(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}`,
          note: 'Lowercasing the email is a business rule, so it lives here — not in the handler and not in the SQL.',
        },
      },
      {
        heading: 'handler.go — HTTP, and nothing else',
        code: {
          label: 'internal/user/handler.go',
          src: `type Handler struct{ svc *Service }

func (h *Handler) Routes(mux *http.ServeMux) {
	mux.HandleFunc("POST /users", h.create)
	mux.HandleFunc("GET /users", h.list)
	mux.HandleFunc("GET /users/{id}", h.get)
	mux.HandleFunc("PATCH /users/{id}", h.update)
	mux.HandleFunc("DELETE /users/{id}", h.delete)
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		httpx.Error(w, 400, "invalid id")
		return
	}

	u, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		httpx.FromError(w, err)
		return
	}

	httpx.JSON(w, 200, u)
}`,
          note: 'Three steps: parse, call, encode. If a handler grows past that, the extra part belongs in the service.',
        },
      },
      {
        heading: 'main.go — wire it by hand',
        body: [
          'Nothing here decides anything. It reads config, opens the database, builds each feature from the inside out, and starts the server. You do not need a dependency injection framework; you need one function that builds objects in order.',
        ],
        code: {
          label: 'cmd/api/main.go',
          src: `func run() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	db, err := database.Open(cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer db.Close()

	userRepo := user.NewRepository(db)      // inside
	userSvc := user.NewService(userRepo)    // middle
	userH := user.NewHandler(userSvc)       // outside

	noteRepo := note.NewRepository(db)
	noteSvc := note.NewService(noteRepo)
	noteH := note.NewHandler(noteSvc)

	mux := http.NewServeMux()
	userH.Routes(mux)
	noteH.Routes(mux)

	handler := middleware.Chain(mux, middleware.Recover, middleware.RequestID, middleware.Logger)
	return serve(cfg.Port, handler)
}`,
          note: 'Adding a feature is three lines here and one new folder. Removing one is deleting both.',
        },
      },
      {
        heading: 'The habits that keep it clean',
        bullets: [
          '**No global state.** No package-level `var db *sql.DB`. Dependencies are struct fields, passed in. Globals are how a codebase becomes untestable.',
          '**`init()` is almost always wrong.** It runs in an order you do not control and cannot fail gracefully.',
          '**Config is read once, in main.** Never call `os.Getenv` deep inside a handler.',
          '**No `utils` or `common` package.** It becomes a dumping ground and causes import cycles.',
          '**No stuttering names.** `user.Service`, not `user.UserService`. The package name is already part of every call.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'This is the layout the rest of the track uses. Everything from here — auth, uploads, tests, deployment — is added into these folders, so it is worth building once now rather than reading about it.',
        },
      },
    ],
    keyPoints: [
      'One folder per feature, with model, repository, service and handler inside it.',
      'A repository hides how data is stored. A service holds the rules. A handler only speaks HTTP.',
      'Dependencies point inward: handler → service → repository, never the reverse.',
      'Wire it by hand in `run() error`. No framework, no globals, no `init()`.',
    ],
    remember:
      'The folders are not decoration. They are what stops your HTTP code and your SQL code from knowing about each other.',
    task: 'Build full CRUD for `users` in this exact layout, against Postgres, wired in main and checked with curl. This is the skeleton the whole second half of the track builds on, so take the time to get it right.',
    refs: [
      { label: 'Organizing a Go module', href: 'https://go.dev/doc/modules/layout' },
      { label: 'Effective Go — Names', href: 'https://go.dev/doc/effective_go#names' },
    ],
  },
]
