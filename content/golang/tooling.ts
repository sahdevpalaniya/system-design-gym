import type { LangLesson } from '@/lib/types'

/** Modules, the go command, and the tools that run in CI. */
export const TOOLING: LangLesson[] = [
  {
    slug: 'modules-and-tooling',
    title: 'Modules, dependencies, and the go command',
    navTitle: 'Modules and the go command',
    oneLine: 'How Go finds your code and other people’s, and the commands worth memorising.',
    blocks: [
      {
        heading: 'What a module is, and what the go command does',
        body: [
          'A **module** is one project: a folder with a `go.mod` file at the top, containing one or more packages. `go.mod` records the module\'s name, the Go version it needs, and every outside package it depends on.',
          'A **dependency** is a package written by someone else that your code imports. Go fetches these from their source repository — there is no central registry to publish to, and the import path *is* the URL.',
          'The **go command** is the single tool that does everything: builds, tests, formats, fetches dependencies, and reads documentation. This topic covers the parts of it you will use weekly, and the four checks worth running before every push.',
        ],
      },
      {
        heading: 'go.mod and go.sum',
        code: {
          label: 'go.mod',
          src: `module github.com/you/snapnotes

go 1.22

require (
\tgithub.com/golang-jwt/jwt/v5 v5.2.1
\tgithub.com/jackc/pgx/v5 v5.5.5
\tgolang.org/x/crypto v0.21.0
)

require (
\tgithub.com/jackc/puddle/v2 v2.2.1 // indirect
)`,
          note: 'Direct dependencies in the first block, transitive ones marked // indirect. Commit both go.mod and go.sum.',
        },
      },
      {
        bullets: [
          '**`go.mod`** declares the module path, the minimum Go version, and your dependencies.',
          '**`go.sum`** holds cryptographic checksums of every module version you use. It is what makes a build reproducible and tamper-evident. **Commit it.**',
          '**The `go` line matters.** It gates language behaviour — a module declaring `go 1.21` keeps the old per-loop variable semantics even on a newer toolchain.',
        ],
      },
      {
        heading: 'Minimal Version Selection',
        body: [
          'Most package managers resolve to the *newest* version that satisfies everyone. Go picks the **oldest** version that satisfies everyone. That sounds backwards until you notice the consequence: your build does not change because someone else published a release. Upgrades only happen when you ask for one.',
          'This is why Go needs no lockfile. `go.mod` plus MVS is already deterministic.',
        ],
      },
      {
        heading: 'The commands',
        code: {
          label: 'terminal',
          src: `go mod init github.com/you/proj   # start a module
go get example.com/pkg@latest      # add or upgrade
go get example.com/pkg@v1.2.3      # pin an exact version
go get example.com/pkg@none        # remove
go mod tidy                        # add what is missing, drop what is unused
go mod why -m example.com/pkg      # why is this in my build?
go mod graph                       # the full dependency graph
go mod verify                      # do the downloaded modules match go.sum?
go mod vendor                      # copy deps into ./vendor (for air-gapped builds)

go build ./...                     # compile everything
go run ./cmd/api                   # compile and run
go test ./...                      # test everything
go vet ./...                       # find real bugs
go doc net/http.ServeMux           # read the docs offline
go clean -modcache                 # nuclear option when a download is corrupt`,
          note: 'Run `go mod tidy` before every commit. It is the gofmt of dependencies.',
        },
      },
      {
        heading: 'Workspaces, for working on two modules at once',
        code: {
          label: 'terminal',
          src: `go work init ./api ./sharedlib
go work use ./anothermodule

# now ./api's import of sharedlib resolves to your LOCAL copy,
# with no replace directive polluting go.mod`,
          note: 'go.work is local development state. Add it to .gitignore — do not commit it.',
        },
      },
      {
        heading: 'Build flags worth knowing',
        code: {
          label: 'terminal',
          src: `CGO_ENABLED=0 go build -ldflags="-s -w" -o api ./cmd/api    # static, stripped

go build -ldflags="-X main.version=$(git rev-parse --short HEAD)" ./cmd/api

GOOS=linux GOARCH=arm64 go build ./cmd/api      # cross-compile, no toolchain needed
go tool dist list                                # every supported target

go build -race ./...                             # binary with race checks built in
go build -gcflags='-m' ./... 2>&1 | head         # what escaped to the heap`,
        },
      },
      {
        heading: 'The tools that belong in CI',
        code: {
          label: '.github/workflows/ci.yml',
          src: `- run: go build ./...
- run: test -z "$(gofmt -l .)"          # fails if anything is unformatted
- run: go vet ./...
- run: go test -race -coverprofile=c.out ./...
- run: go run golang.org/x/vuln/cmd/govulncheck@latest ./...`,
        },
      },
      {
        bullets: [
          '**`gofmt`** — not a preference. Unformatted code fails the build.',
          '**`go vet`** — ships with Go, no false positives worth silencing. Mandatory.',
          '**`govulncheck`** — official, and low-noise because it only reports vulnerabilities in code paths you actually call.',
          '**`staticcheck`** — the best-value third-party linter. Add it once `vet` is clean.',
          '**`golangci-lint`** — a runner for many linters. Enable a small set, not sixty, or you will spend your life writing `//nolint`.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'Go’s standard library carries a compatibility promise: code written for Go 1 still compiles today. Upgrading the toolchain is normally a version bump and nothing else — which is why "what Go version should I use" has one answer: the latest.',
        },
      },
      {
        heading: 'Publishing a package',
        bullets: [
          'The module path **is** the repository URL: `github.com/you/thing`.',
          'Tag a release with a semver tag: `git tag v1.0.0 && git push --tags`. That is the whole publishing process — there is no registry to upload to.',
          'Breaking change? The major version goes in the path: `github.com/you/thing/v2`. That way v1 and v2 can coexist in one build.',
          'Before v1.0.0 you are allowed to break things. After it, you are not.',
        ],
      },
    ],
    keyPoints: [
      'Commit `go.mod` and `go.sum`. Minimal Version Selection makes builds reproducible with no lockfile.',
      '`go mod tidy` before every commit; `go work` for developing two modules together.',
      '`CGO_ENABLED=0` plus `GOOS`/`GOARCH` cross-compiles to anything with no toolchain.',
      'CI runs gofmt, vet, test -race, and govulncheck. That is the whole gate.',
    ],
    remember:
      'The module path is a URL, publishing is a git tag, and a breaking change means a new path with /v2 on the end.',
    task: 'Run `go mod why` on each of your dependencies and find out what actually pulls each one in. Then run `go mod tidy` and check whether anything disappears.',
    refs: [
      { label: 'Managing dependencies', href: 'https://go.dev/doc/modules/managing-dependencies' },
      { label: 'Go Modules Reference', href: 'https://go.dev/ref/mod' },
      { label: 'Organizing a Go module', href: 'https://go.dev/doc/modules/layout' },
    ],
  },

  {
    slug: 'popular-packages',
    title: 'The packages everyone actually uses',
    navTitle: 'Popular packages',
    oneLine: 'The well-known third-party libraries, what each is for, and when the standard library is still the better answer.',
    blocks: [
      {
        heading: 'Why this topic exists',
        body: [
          'Go has an unusually strong standard library, so the honest advice for most problems is **use the stdlib**. That is why this whole track ships three real projects on four dependencies.',
          'But you will read other people\'s code, join teams with existing choices, and hit problems the stdlib genuinely does not solve. This is the map: what the well-known packages are, what each one is for, and — for every single one — the stdlib alternative you should try first.',
        ],
      },
      {
        heading: 'How to judge a package before you add it',
        bullets: [
          '**Is it still alive?** Look at the last commit and the open issue count on GitHub, not the star count. Stars measure a blog post from 2019.',
          '**What does it drag in?** Run `go mod graph` after adding it. A logging library that pulls in forty modules is a supply-chain decision, not a convenience.',
          '**Could you write it in an afternoon?** If yes, and it is not security-critical, write it. Every dependency is code you must update forever.',
          '**Does it wrap something you should understand?** An ORM you adopt before you know SQL will cost you more than it saves.',
          '**Check `pkg.go.dev`** for the docs and the import count, and run **`govulncheck`** after adding anything.',
        ],
        code: {
          label: 'terminal — the checks worth running before you commit a new dependency',
          src: `go get example.com/thing
go mod graph | wc -l           # how much did that just pull in?
go mod why -m example.com/thing
go run golang.org/x/vuln/cmd/govulncheck@latest ./...
go doc example.com/thing       # read the API before you build on it`,
        },
      },
      {
        heading: 'Web frameworks and routing',
        table: {
          headers: ['Package', 'What it is', 'Try the stdlib first'],
          rows: [
            ['`net/http`', '**The standard library.** Since Go 1.22 it routes on method and path parameters.', '— this *is* the answer for most services'],
            ['`chi`', 'A thin router on top of `net/http`. Middleware chaining, route groups, sub-routers.', '`http.ServeMux` plus your own middleware'],
            ['`gin`', 'The most popular full framework. Its own context type, binding, validation.', '`net/http` — gin\'s context is not `context.Context`'],
            ['`echo`', 'Similar to gin, slightly cleaner API.', '`net/http`'],
            ['`fiber`', 'Express-style API built on `fasthttp`, not `net/http`.', '`net/http` — fiber cannot use standard middleware'],
            ['`gorilla/mux`', 'The classic router. Was unmaintained for a while, now revived.', '`http.ServeMux` does this in 1.22+'],
          ],
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'The honest position: on a new service in 2024 or later, start with `net/http`. Reach for `chi` when you want route groups and middleware helpers without leaving the standard interfaces. Reach for `gin` or `echo` when the team already uses them.',
        },
      },
      {
        heading: 'Databases',
        table: {
          headers: ['Package', 'What it is', 'When it is the right call'],
          rows: [
            ['`database/sql`', '**Standard library.** The common interface every driver implements.', 'always — everything below sits on top of it'],
            ['`pgx`', 'The Postgres driver. Used directly, or through `database/sql`.', 'any Postgres project — this is the default'],
            ['`go-sql-driver/mysql`', 'The MySQL driver.', 'MySQL projects'],
            ['`sqlx`', 'A thin layer over `database/sql` that scans rows into structs.', 'when hand-writing `Scan` calls gets tedious'],
            ['`sqlc`', 'Generates type-safe Go **from your SQL**. You keep writing SQL.', 'the best of both — strongly worth a look'],
            ['`ent`', 'A schema-as-code graph ORM from Facebook. Powerful, opinionated.', 'complex relational graphs'],
            ['`GORM`', 'A full ORM. Auto-migration, hooks, associations.', 'CRUD-heavy apps where SQL control matters less'],
            ['`golang-migrate` / `goose`', 'Schema migration runners.', 'every project with a database'],
            ['`go-redis`', 'The Redis client.', 'caching, rate limiting, queues'],
          ],
        },
      },
      {
        heading: 'Configuration and CLIs',
        table: {
          headers: ['Package', 'What it is', 'Try first'],
          rows: [
            ['`os.Getenv` + `flag`', '**Standard library.** Environment variables and command-line flags.', '— enough for most services'],
            ['`godotenv`', 'Loads a `.env` file in development.', 'used in this track — 1 file, no dependencies of its own'],
            ['`viper`', 'Config from files, env, flags and remote stores, merged together.', 'when you genuinely need layered config; it is large'],
            ['`kelseyhightower/envconfig`', 'Fills a struct from environment variables using tags.', 'a light middle ground'],
            ['`cobra`', 'The CLI framework behind `kubectl`, `hugo` and `gh`. Subcommands, help, completion.', 'multi-command CLIs'],
            ['`urfave/cli`', 'A lighter CLI framework.', 'simpler CLIs'],
          ],
        },
      },
      {
        heading: 'Logging',
        table: {
          headers: ['Package', 'What it is', 'Verdict'],
          rows: [
            ['`log/slog`', '**Standard library since Go 1.21.** Structured, levelled, with handlers.', '**start here** — this is what the track uses'],
            ['`zap`', 'Uber\'s logger. Extremely fast, more ceremony.', 'when profiling shows logging is your bottleneck'],
            ['`zerolog`', 'Zero-allocation JSON logger, chained API.', 'similar case to zap'],
            ['`logrus`', 'The original structured logger. **In maintenance mode.**', 'you will meet it in old code; do not start with it'],
          ],
        },
      },
      {
        heading: 'Testing',
        table: {
          headers: ['Package', 'What it is', 'Note'],
          rows: [
            ['`testing`', '**Standard library.** Tests, subtests, benchmarks, fuzzing.', 'no framework needed — see the Testing topic'],
            ['`testify`', 'Assertions (`assert`, `require`) plus mocks and suites.', 'by far the most common; `require.NoError` is the draw'],
            ['`google/go-cmp`', 'Deep comparison built for tests, with readable diffs.', 'better than `reflect.DeepEqual` for structs'],
            ['`testcontainers-go`', 'Starts real Postgres, Redis or Kafka in Docker for a test.', 'the right way to test a repository layer'],
            ['`ory/dockertest`', 'Lighter alternative to testcontainers.', 'same job, fewer features'],
            ['`uber-go/mock`', 'Generated mocks from interfaces (successor to `golang/mock`).', 'hand-written fakes are usually smaller'],
            ['`goleak`', 'Fails a test if goroutines are still running at the end.', 'catches leaks you would never notice'],
          ],
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'The one to think twice about is `testify`\'s mock and suite packages. Assertions are fine and save real typing. Generated mocks and test suites tend to hide what a test is doing — and because Go interfaces are small and implicit, a hand-written fake is usually shorter than the mock setup.',
        },
      },
      {
        heading: 'Concurrency helpers',
        table: {
          headers: ['Package', 'What it is', 'Why it matters'],
          rows: [
            ['`sync`, `context`', '**Standard library.** Mutex, WaitGroup, Once, cancellation.', 'covers most of what you need'],
            ['`golang.org/x/sync/errgroup`', 'Run goroutines, collect the first error, cancel the rest. `SetLimit` bounds concurrency.', '**the one worth adding** — see the Concurrency topics'],
            ['`golang.org/x/sync/singleflight`', 'Collapses duplicate concurrent calls into one.', 'cache stampede protection in ~5 lines'],
            ['`golang.org/x/sync/semaphore`', 'A weighted semaphore.', 'when a plain channel-as-semaphore is not enough'],
            ['`golang.org/x/time/rate`', 'Token-bucket rate limiter.', 'used in this track for rate limiting'],
            ['`sourcegraph/conc`', 'Structured concurrency helpers with panic handling built in.', 'newer; nice, but errgroup covers most cases'],
          ],
        },
      },
      {
        heading: 'Everything else you will meet',
        table: {
          headers: ['Package', 'What it is for'],
          rows: [
            ['`google/uuid`', 'UUID generation. The near-universal choice.'],
            ['`shopspring/decimal`', 'Exact decimal arithmetic — for money, when integer cents is not enough.'],
            ['`go-playground/validator`', 'Struct validation driven by tags. Common with gin.'],
            ['`golang-jwt/jwt`', 'JSON Web Tokens. Used in this track.'],
            ['`golang.org/x/crypto/bcrypt`', 'Password hashing. Used in this track.'],
            ['`golang.org/x/oauth2`', 'OAuth2 clients for Google, GitHub and friends.'],
            ['`prometheus/client_golang`', 'Metrics: counters, histograms, the `/metrics` endpoint.'],
            ['`open-telemetry/opentelemetry-go`', 'Traces and metrics across services.'],
            ['`grpc/grpc-go` + `protobuf`', 'gRPC services and protocol buffers.'],
            ['`segmentio/kafka-go`, `IBM/sarama`', 'Kafka clients.'],
            ['`nats-io/nats.go`', 'NATS messaging.'],
            ['`hibiken/asynq`', 'Background job queue backed by Redis.'],
            ['`uber-go/automaxprocs`', 'Sets `GOMAXPROCS` from the container CPU limit. One import, real fix.'],
            ['`samber/lo`', 'Lodash-style generic helpers. Check `slices` and `maps` first.'],
            ['`spf13/afero`', 'A filesystem interface, so you can fake the disk in tests.'],
            ['`swaggo/swag`, `oapi-codegen`', 'OpenAPI docs from comments, or Go from an OpenAPI spec.'],
          ],
        },
      },
      {
        heading: 'Tools you install, rather than import',
        code: {
          label: 'terminal',
          src: `# linting and safety
go install honnef.co/go/tools/cmd/staticcheck@latest       # the best-value linter
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
go install golang.org/x/vuln/cmd/govulncheck@latest        # official, low noise

# development
go install github.com/air-verse/air@latest                 # live reload
go install github.com/go-delve/delve/cmd/dlv@latest        # the debugger
go install golang.org/x/perf/cmd/benchstat@latest          # honest benchmark comparison
go install github.com/rakyll/hey@latest                    # simple load testing

# database
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`,
          note: 'These are binaries, not imports. They never appear in your go.mod.',
        },
      },
      {
        heading: 'What a typical production service actually imports',
        body: [
          'To make it concrete — this is a realistic dependency list for a Go API at a company, and it is short. That shortness is the point.',
        ],
        code: {
          label: 'go.mod — a normal, boring, production service',
          src: `require (
	github.com/go-chi/chi/v5 v5.1.0            // routing niceties
	github.com/jackc/pgx/v5 v5.6.0             // Postgres
	github.com/golang-jwt/jwt/v5 v5.2.1        // tokens
	github.com/google/uuid v1.6.0              // ids
	github.com/prometheus/client_golang v1.20  // metrics
	golang.org/x/crypto v0.27.0                // bcrypt
	golang.org/x/sync v0.8.0                   // errgroup
)

// Everything else — HTTP, JSON, SQL interface, logging, context,
// testing, templates, crypto — comes with Go.`,
        },
      },
      {
        callout: {
          tone: 'ok',
          text: 'If your `go.mod` has 200 lines, that is worth a look. Go culture leans hard towards fewer dependencies, and a reviewer will ask why each one is there. "Because the standard library already does it" is the most common reason to remove one.',
        },
      },
    ],
    keyPoints: [
      'Start with the standard library. It covers HTTP, SQL, JSON, logging, testing and crypto.',
      '`net/http` routes on method and path since 1.22, so a web framework is now a preference, not a need.',
      'The few genuinely worth adding: a database driver, `errgroup`, `bcrypt`, a JWT library, and metrics.',
      'Judge a package by its last commit and what it drags in — not by its star count.',
    ],
    remember:
      'Every dependency is code you have to update, audit and explain forever. The stdlib is the one you never have to justify.',
    task: 'Open the `go.mod` of a Go project you did not write and look up every dependency on pkg.go.dev. For each one, decide whether the standard library could have done it.',
    exercises: [
      {
        task: 'Add `gin` to a scratch project, run `go mod graph | wc -l`, then do the same for `chi`. Compare.',
        answer:
          'chi pulls in almost nothing; gin brings a validator, a JSON library and more. Neither is wrong — but you should know which you are choosing.',
      },
      {
        task: 'Rewrite one `reflect.DeepEqual` test assertion with `google/go-cmp` and compare the failure output.',
        answer:
          'go-cmp prints a readable diff showing exactly which field differs. DeepEqual prints two whole structs and leaves you to spot it.',
      },
      {
        task: 'Replace a hand-rolled worker pool with `errgroup.SetLimit` and count the lines removed.',
        answer:
          'Usually 25 lines become about 8, and you get first-error cancellation for free. This is the clearest case in Go for adding a dependency.',
      },
      {
        task: 'Run `govulncheck ./...` on any project you have and read what it reports.',
        answer:
          'It only reports vulnerabilities in code paths you actually call, so the list is short and every item is worth reading — unlike most scanners.',
      },
    ],
    refs: [
      { label: 'pkg.go.dev — the package index', href: 'https://pkg.go.dev/' },
      { label: 'Managing dependencies', href: 'https://go.dev/doc/modules/managing-dependencies' },
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
    ],
  },

  {
    slug: 'packages-in-code',
    title: 'What the famous packages look like in code',
    navTitle: 'Packages in code',
    oneLine: 'The same job written with each popular library, so you recognise them the moment you open somebody else\'s repo.',
    blocks: [
      {
        heading: 'Why compare them side by side',
        body: [
          'Reading a package\'s name tells you nothing. Reading twenty lines of it tells you almost everything — its style, what it takes over, and how hard it would be to leave.',
          'Every block below does **the same job**, written with each of the popular options. You are not learning all of these. You are learning to open an unfamiliar Go repo and immediately know what you are looking at.',
        ],
      },
      {
        heading: 'One HTTP route, five ways',
        code: {
          label: 'net/http — the standard library (Go 1.22+)',
          src: `mux := http.NewServeMux()

mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"id": id})
})

http.ListenAndServe(":8080", mux)`,
          note: 'No dependency. Since 1.22 this handles method + path params, which was the main reason people reached for a router.',
        },
      },
      {
        code: {
          label: 'chi — a thin router, still standard handlers',
          src: `r := chi.NewRouter()
r.Use(middleware.Logger)                     // chi ships common middleware

r.Route("/users", func(r chi.Router) {       // route groups
	r.Get("/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		render.JSON(w, r, map[string]string{"id": id})
	})
})

http.ListenAndServe(":8080", r)`,
          note: 'The handler signature is still `func(http.ResponseWriter, *http.Request)`, so every standard middleware works. That is chi\'s whole selling point.',
        },
      },
      {
        code: {
          label: 'gin — the most popular full framework',
          src: `r := gin.Default()                           // logger + recovery included

r.GET("/users/:id", func(c *gin.Context) {   // its OWN context type
	id := c.Param("id")
	c.JSON(http.StatusOK, gin.H{"id": id})   // gin.H is map[string]any
})

r.Run(":8080")`,
          note: '`*gin.Context` is not `context.Context`. It carries both the request and the response, which is convenient and is also what ties your handlers to gin.',
        },
      },
      {
        code: {
          label: 'echo — same idea, returns an error',
          src: `e := echo.New()

e.GET("/users/:id", func(c echo.Context) error {   // handlers RETURN an error
	return c.JSON(http.StatusOK, map[string]string{"id": c.Param("id")})
})

e.Start(":8080")`,
          note: 'Returning an error is genuinely nicer than gin\'s style — echo\'s central error handler turns it into a response.',
        },
      },
      {
        code: {
          label: 'fiber — Express-style, and NOT built on net/http',
          src: `app := fiber.New()

app.Get("/users/:id", func(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"id": c.Params("id")})
})

app.Listen(":8080")`,
          note: 'Fiber sits on `fasthttp`, so standard `net/http` middleware, `httptest` and most of the ecosystem do not work with it. Know that before choosing it.',
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Notice the pattern: `net/http` and `chi` share one handler type, so code moves between them freely. `gin`, `echo` and `fiber` each invent their own, so every handler you write is tied to that framework. That is the real cost, and it is rarely the one people compare.',
        },
      },
      {
        heading: 'One database query, four ways',
        code: {
          label: 'database/sql — the standard library',
          src: `var u User
err := db.QueryRowContext(ctx,
	` + "`SELECT id, name, email FROM users WHERE id = $1`" + `, id,
).Scan(&u.ID, &u.Name, &u.Email)

if errors.Is(err, sql.ErrNoRows) {
	return nil, ErrNotFound
}`,
          note: 'You write the SQL and you write the Scan. Verbose, and you can see exactly what runs.',
        },
      },
      {
        code: {
          label: 'sqlx — same SQL, it does the scanning',
          src: `var u User      // struct tags: ` + "`db:\"email\"`" + `

err := db.GetContext(ctx, &u,
	` + "`SELECT id, name, email FROM users WHERE id = $1`" + `, id)

var users []User
err = db.SelectContext(ctx, &users, ` + "`SELECT id, name FROM users LIMIT $1`" + `, 20)`,
          note: 'A thin layer over database/sql. You keep full control of the SQL and lose the Scan boilerplate. The smallest useful step up.',
        },
      },
      {
        code: {
          label: 'sqlc — you write SQL, it generates the Go',
          src: `-- query.sql
-- name: GetUser :one
SELECT id, name, email FROM users WHERE id = $1;

// then run: sqlc generate
// and call the generated, fully typed method:
u, err := q.GetUser(ctx, id)     // returns (User, error) — no reflection, no tags`,
          note: 'Compile-time safety with hand-written SQL. If you dislike ORMs but hate Scan, this is the one to look at.',
        },
      },
      {
        code: {
          label: 'GORM — a full ORM',
          src: `var u User
db.First(&u, id)                                  // SELECT ... WHERE id = ? LIMIT 1

db.Where("age > ?", 18).Order("name").Find(&users)

db.Model(&u).Update("name", "new")

// associations, hooks and auto-migration come with it:
db.AutoMigrate(&User{}, &Order{})
db.Preload("Orders").Find(&users)                 // loads the related rows`,
          note: 'Least typing, least visibility. You cannot see the query, and eventually GORM generates one you have to fight. Fine for CRUD-heavy apps; know what you are trading.',
        },
      },
      {
        heading: 'One test, two ways',
        code: {
          label: 'testing — the standard library',
          src: `got, err := Add(2, 3)
if err != nil {
	t.Fatalf("unexpected error: %v", err)
}
if got != 5 {
	t.Errorf("Add(2, 3) = %d, want 5", got)
}`,
        },
      },
      {
        code: {
          label: 'testify — assertions',
          src: `require.NoError(t, err)              // require: stops the test on failure
assert.Equal(t, 5, got)             // assert:  records it and carries on

assert.Len(t, users, 3)
assert.Contains(t, body, "not found")
assert.ErrorIs(t, err, ErrNotFound)`,
          note: '`require.NoError` is the reason most teams adopt testify — it replaces four lines with one, and the failure messages are good.',
        },
      },
      {
        heading: 'One CLI, and one logger',
        code: {
          label: 'cobra — the CLI framework behind kubectl and gh',
          src: `var rootCmd = &cobra.Command{
	Use:   "app",
	Short: "does the thing",
}

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "start the HTTP server",
	RunE: func(cmd *cobra.Command, args []string) error {
		port, _ := cmd.Flags().GetString("port")
		return run(port)
	},
}

func init() {
	serveCmd.Flags().String("port", "8080", "port to listen on")
	rootCmd.AddCommand(serveCmd)     // app serve --port 9000
}`,
          note: 'For a single command, the stdlib `flag` package is enough. Cobra earns its place once you have subcommands.',
        },
      },
      {
        code: {
          label: 'slog vs zap — the same log line',
          src: `// log/slog — standard library, Go 1.21+
slog.Info("request completed",
	"method", r.Method, "path", r.URL.Path, "status", 200, "ms", 14)

// zap — faster, more ceremony, typed fields
logger.Info("request completed",
	zap.String("method", r.Method),
	zap.String("path", r.URL.Path),
	zap.Int("status", 200),
	zap.Int("ms", 14))`,
          note: 'Both produce structured JSON. zap is measurably faster and noticeably wordier. Start with slog and move only if a profile tells you to.',
        },
      },
      {
        heading: 'How to read an unfamiliar Go repo',
        bullets: [
          '**Open `go.mod` first.** The dependency list tells you the framework, the database approach and the logging style before you read any code.',
          '**Find `func main`** — it is under `cmd/` in most projects, and it shows you how everything is wired in one screen.',
          '**A `*gin.Context` or `echo.Context` in a handler** means every handler is tied to that framework.',
          '**`db.First(&x)` or `AutoMigrate`** means GORM. **`.Scan(&`** means `database/sql`. **A `query.sql` file** means sqlc.',
          '**`assert.` or `require.`** means testify. **`zap.String(`** means zap.',
        ],
      },
      {
        callout: {
          tone: 'ok',
          text: 'You now know what most Go codebases are made of. The track itself deliberately used almost none of these, so that you learned the layer underneath first — which is exactly what makes each of these easy to pick up when a job needs one.',
        },
      },
    ],
    keyPoints: [
      '`net/http` and `chi` share the standard handler type; gin, echo and fiber each invent their own.',
      'Database options in order of control: `database/sql` → `sqlx` → `sqlc` → `ent`/`GORM`.',
      '`require.NoError` is why teams adopt testify; the mocks and suites are the parts to think twice about.',
      'Read `go.mod` and `func main` first when opening an unfamiliar repo.',
    ],
    remember:
      'You are not learning every framework. You are learning to recognise which one a codebase uses, and what that choice locked in.',
    task: 'Write the same "get a user by id" endpoint twice — once with `net/http`, once with `chi` or `gin`. Then count what you would have to change to move between them.',
    exercises: [
      {
        task: 'Find a Go project on GitHub, open its `go.mod`, and predict its framework, database approach and logger before reading any code.',
        answer:
          'You will usually be right. That is the point — the dependency list is the fastest summary of a codebase there is.',
      },
      {
        task: 'Take a `net/http` handler and port it to gin. Then port it back.',
        answer:
          'Going to gin is easy; coming back means rewriting every handler signature and every `c.JSON` call. That asymmetry is the lock-in.',
      },
      {
        task: 'Write one query with `database/sql`, then with `sqlx`, and count the lines.',
        answer:
          'sqlx typically halves it by removing the `Scan` call, while the SQL stays identical and fully visible.',
      },
    ],
    refs: [
      { label: 'chi', href: 'https://pkg.go.dev/github.com/go-chi/chi/v5' },
      { label: 'gin', href: 'https://pkg.go.dev/github.com/gin-gonic/gin' },
      { label: 'sqlc', href: 'https://sqlc.dev/' },
      { label: 'pkg.go.dev', href: 'https://pkg.go.dev/' },
    ],
  },
]
