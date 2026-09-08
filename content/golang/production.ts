import type { LangLesson } from '@/lib/types'

/** What separates a working API from one you can deploy and keep running. */
export const PRODUCTION: LangLesson[] = [
  {
    slug: 'errors-and-logging',
    title: 'Error mapping and structured logging',
    navTitle: 'Errors and logging',
    oneLine: 'One place turns domain errors into HTTP statuses, and your logs become searchable.',
    blocks: [
      {
        heading: 'Two jobs that are easy to confuse',
        body: [
          'When something goes wrong, two different audiences need two different things. The **client** needs a status code and a short, safe message. **You** need the full detail, so you can find out what happened.',
          'Mixing these up causes real problems. Returning the internal error to the client leaks your table names, your file paths, and sometimes your data. Returning nothing to yourself means you cannot debug it at all.',
          '**Structured logging** is the second half. A log line written as a sentence cannot be searched. A log line written as key-and-value pairs can be filtered, counted and alerted on. Go has `log/slog` in the standard library for exactly this.',
        ],
      },
      {
        heading: 'One error boundary for the whole API',
        code: {
          label: 'internal/httpx/errors.go',
          src: `func FromError(w http.ResponseWriter, r *http.Request, err error) {
\tvar ve *ValidationError

\tswitch {
\tcase errors.Is(err, context.Canceled):
\t\treturn                                       // client went away; nothing to send

\tcase errors.Is(err, ErrNotFound):
\t\tError(w, 404, "not found")

\tcase errors.Is(err, ErrForbidden):
\t\tError(w, 404, "not found")                   // hide existence

\tcase errors.Is(err, ErrEmailTaken):
\t\tError(w, 409, "email already registered")

\tcase errors.Is(err, ErrInvalidCredentials):
\t\tError(w, 401, "invalid credentials")

\tcase errors.Is(err, ErrValidation):
\t\tError(w, 422, err.Error())

\tcase errors.As(err, &ve):
\t\tJSON(w, 422, map[string]string{ve.Field: ve.Msg})

\tdefault:
\t\t// the detail goes to the log, with the request id
\t\tslog.ErrorContext(r.Context(), "unhandled error", "err", err)
\t\tError(w, 500, "internal server error")       // the client learns nothing
\t}
}`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Never return an internal error message to a client. A raw SQL error leaks your table names and column names, and a stack trace leaks your source paths. Log the detail with a request id, return a generic message and a status.',
        },
      },
      {
        heading: 'Structured logging with log/slog',
        body: [
          'A log line as a sentence cannot be searched. A log line as key–value pairs can be filtered, grouped, and alerted on. `log/slog` has been in the standard library since 1.21, so there is no reason to add a logging dependency.',
        ],
        code: {
          label: 'internal/logging/logging.go',
          src: `func Setup(env string) {
\tvar h slog.Handler
\tif env == "production" {
\t\th = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})
\t} else {
\t\th = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug})
\t}
\tslog.SetDefault(slog.New(h))
}

slog.Info("request completed",
\t"method", r.Method,
\t"path", r.URL.Path,
\t"status", status,
\t"duration_ms", ms,
\t"request_id", rid,
)`,
          note: 'JSON in production because machines read it; text in development because you do.',
        },
      },
      {
        heading: 'Request IDs tie a failure together',
        code: {
          label: 'internal/middleware/requestid.go',
          src: `func RequestID(next http.Handler) http.Handler {
\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\tid := r.Header.Get("X-Request-ID")
\t\tif id == "" {
\t\t\tvar b [8]byte
\t\t\trand.Read(b[:])
\t\t\tid = hex.EncodeToString(b[:])
\t\t}
\t\tw.Header().Set("X-Request-ID", id)

\t\t// a logger carrying the id, put into the context
\t\tctx := context.WithValue(r.Context(), loggerKey{}, slog.Default().With("request_id", id))
\t\tnext.ServeHTTP(w, r.WithContext(ctx))
\t})
}`,
          note: 'Now every line from one request shares an id, and the client got it in the response header. "It failed at 2pm" becomes one grep.',
        },
      },
      {
        heading: 'Logging rules',
        bullets: [
          '**Never log** passwords, tokens, whole `Authorization` headers, card numbers, or full request bodies. This is the easiest way to turn a log store into a breach.',
          '**Handle an error once.** Log it or return it, never both — or one failure appears five times at five layers.',
          '**Log at the boundary**, where you decide the HTTP status. That is the place with the full context.',
          '**Levels mean something.** `Error` means a human should look. If everything is `Error`, nothing is.',
          '**A cancelled request is not a 500.** `context.Canceled` means the client left. Do not page anyone for it.',
        ],
      },
      {
        heading: 'Health checks: two, not one',
        code: {
          label: 'health.go',
          src: `mux.HandleFunc("GET /livez", func(w http.ResponseWriter, r *http.Request) {
\tw.WriteHeader(200)                     // is the process wedged? restart me if so
})

mux.HandleFunc("GET /readyz", func(w http.ResponseWriter, r *http.Request) {
\tctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
\tdefer cancel()
\tif err := db.PingContext(ctx); err != nil {
\t\thttpx.Error(w, 503, "database unavailable")   // stop sending me traffic
\t\treturn
\t}
\thttpx.JSON(w, 200, map[string]string{"status": "ok"})
})`,
          note: 'Keep them separate. Wiring a DB ping into liveness means a brief database blip restarts every instance at once.',
        },
      },
    ],
    keyPoints: [
      'One function maps domain errors to statuses. Handlers never choose a status themselves.',
      'Internal detail goes to the log with a request id; the client gets a generic message.',
      '`log/slog` with key–value pairs. JSON in production, text in development.',
      'Liveness and readiness are different checks. Do not merge them.',
    ],
    remember:
      'The client gets a status and a safe message. You get the detail, the request id, and enough to find it in the logs.',
    task: 'Add the error boundary, slog setup, request-id middleware, and both health endpoints. Force a database error and confirm the client sees a generic 500 while the log has the full detail and the id.',
    refs: [
      { label: 'log/slog', href: 'https://pkg.go.dev/log/slog' },
      { label: 'errors package', href: 'https://pkg.go.dev/errors' },
    ],
  },

  {
    slug: 'rate-limiting-cors-headers',
    title: 'Rate limiting, CORS, and security headers',
    navTitle: 'Rate limits, CORS, headers',
    oneLine: 'Stop somebody brute-forcing your login, and set the headers browsers rely on.',
    blocks: [
      {
        heading: 'Three defences, and what each one stops',
        body: [
          '**Rate limiting** caps how often one client can call you. Without it, somebody can try ten thousand passwords a minute against your login page. It is the cheapest security you will add all month.',
          '**CORS** — Cross-Origin Resource Sharing — is how your API tells a browser which websites are allowed to call it from a page. It is worth being clear that CORS is enforced *by the browser*, not by your server, so it protects your users from other sites. It is not a lock on your API.',
          '**Security headers** are short instructions to the browser: do not guess this file\'s type, do not let this page be framed, always use HTTPS. Three lines of code that close real classes of attack.',
        ],
      },
      {
        heading: 'Rate limiting',
        body: [
          'Without a limit, an attacker can try ten thousand passwords a minute against your login. `golang.org/x/time/rate` gives you a token-bucket limiter: a steady refill rate, plus a burst allowance for normal bursty traffic.',
        ],
        code: {
          label: 'internal/middleware/ratelimit.go',
          src: `// ponytail: one map + mutex per process. Fine for a single instance.
// Behind more than one, move to Redis or you get N times the limit.
type limiter struct {
\tmu      sync.Mutex
\tclients map[string]*rate.Limiter
\trps     rate.Limit
\tburst   int
}

func (l *limiter) get(key string) *rate.Limiter {
\tl.mu.Lock()
\tdefer l.mu.Unlock()
\tlim, ok := l.clients[key]
\tif !ok {
\t\tlim = rate.NewLimiter(l.rps, l.burst)
\t\tl.clients[key] = lim
\t}
\treturn lim
}

func RateLimit(rps float64, burst int) Middleware {
\tl := &limiter{clients: map[string]*rate.Limiter{}, rps: rate.Limit(rps), burst: burst}

\treturn func(next http.Handler) http.Handler {
\t\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\t\tip, _, _ := net.SplitHostPort(r.RemoteAddr)
\t\t\tif !l.get(ip).Allow() {
\t\t\t\tw.Header().Set("Retry-After", "60")
\t\t\t\thttpx.Error(w, 429, "too many requests")
\t\t\t\treturn
\t\t\t}
\t\t\tnext.ServeHTTP(w, r)
\t\t})
\t}
}`,
          note: 'The map grows forever as written. Add an eviction sweep, or use an LRU, before this goes anywhere real.',
        },
      },
      {
        heading: 'Limit the auth routes hardest',
        code: {
          label: 'main.go',
          src: `authLimit := middleware.RateLimit(0.2, 5)    // ~12/minute, burst 5
apiLimit := middleware.RateLimit(20, 40)     // generous for normal use

mux.Handle("POST /auth/login", authLimit(http.HandlerFunc(h.login)))
mux.Handle("POST /auth/register", authLimit(http.HandlerFunc(h.register)))`,
          note: 'Login, register, and password reset are where credential stuffing lands. They get their own, much tighter limit.',
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Behind a proxy or load balancer, `r.RemoteAddr` is the **proxy’s** IP, so everyone shares one bucket. Use the real client IP from a header your proxy sets — and only trust that header if your own proxy sets it, or anyone can spoof their way past the limit.',
        },
      },
      {
        heading: 'CORS',
        body: [
          'A browser refuses to let a page on one origin call your API on another, unless your API says it is allowed. CORS is that permission, and it is enforced *by the browser* — it is not a server-side security control.',
        ],
        code: {
          label: 'internal/middleware/cors.go',
          src: `func CORS(allowed []string) Middleware {
\tok := make(map[string]bool, len(allowed))
\tfor _, o := range allowed {
\t\tok[o] = true
\t}

\treturn func(next http.Handler) http.Handler {
\t\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\t\torigin := r.Header.Get("Origin")
\t\t\tif ok[origin] {
\t\t\t\tw.Header().Set("Access-Control-Allow-Origin", origin)
\t\t\t\tw.Header().Set("Access-Control-Allow-Credentials", "true")
\t\t\t\tw.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
\t\t\t\tw.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE")
\t\t\t\tw.Header().Set("Vary", "Origin")      // or a cache serves the wrong header
\t\t\t}
\t\t\tif r.Method == http.MethodOptions {
\t\t\t\tw.WriteHeader(http.StatusNoContent)   // the preflight
\t\t\t\treturn
\t\t\t}
\t\t\tnext.ServeHTTP(w, r)
\t\t})
\t}
}`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Never `Access-Control-Allow-Origin: *` on an authenticated API. It is also invalid to combine with `Allow-Credentials: true`. Keep an explicit allowlist from config.',
        },
      },
      {
        heading: 'Security headers',
        code: {
          label: 'internal/middleware/secure.go',
          src: `func SecureHeaders(next http.Handler) http.Handler {
\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\tw.Header().Set("X-Content-Type-Options", "nosniff")
\t\tw.Header().Set("X-Frame-Options", "DENY")
\t\tw.Header().Set("Referrer-Policy", "no-referrer")
\t\tw.Header().Set("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
\t\tnext.ServeHTTP(w, r)
\t})
}`,
          note: 'nosniff is the one that matters most for an API that serves uploads — it stops a browser guessing that your file is HTML and running it.',
        },
      },
      {
        heading: 'The HTTP client, while you are here',
        code: {
          label: 'client.go',
          src: `var client = &http.Client{
\tTimeout: 10 * time.Second,          // http.DefaultClient has NO timeout. Ever.
\tTransport: &http.Transport{
\t\tMaxIdleConns:        100,
\t\tMaxIdleConnsPerHost: 100,       // the default is 2 — a hidden bottleneck
\t\tIdleConnTimeout:     90 * time.Second,
\t},
}

resp, err := client.Do(req)
if err != nil {
\treturn err
}
defer resp.Body.Close()
defer io.Copy(io.Discard, resp.Body)   // drain it, or the connection is not reused`,
        },
      },
    ],
    keyPoints: [
      'Token-bucket rate limiting per IP, and a much tighter limit on the auth routes.',
      'CORS is an explicit allowlist, never `*` on an authenticated API. Set `Vary: Origin`.',
      '`nosniff`, `DENY`, and HSTS are three lines that close real attack classes.',
      'Never use `http.DefaultClient`. Set a timeout, reuse one client, drain every body.',
    ],
    remember:
      'Rate limiting is what turns "an attacker gets unlimited guesses" into "an attacker gets twelve a minute". It is the cheapest security you will add all month.',
    task: 'Add the rate limiter, CORS, and security headers. Then hammer your login with a curl loop and confirm you start getting 429s with a Retry-After.',
    refs: [
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
      { label: 'golang.org/x/time/rate', href: 'https://pkg.go.dev/golang.org/x/time/rate' },
    ],
  },

  {
    slug: 'docker-and-deployment',
    title: 'Docker, Makefile, and running in a container',
    navTitle: 'Docker and deployment',
    oneLine: 'A 15MB image with no operating system in it — and the two settings that stop Go misbehaving in Kubernetes.',
    blocks: [
      {
        heading: 'What containers give a Go program',
        body: [
          'A **container** is your program packaged with everything it needs to run, so it behaves the same on your machine, a colleague\'s, and a server. An **image** is the packaged thing; a container is a running copy of it.',
          'Go is unusually well suited to this. Because `go build` produces a single file with no runtime to install, the image can contain almost nothing but your binary — no operating system, no shell, no package manager. That makes it small and gives an attacker very little to work with.',
          'The catch is that Go\'s runtime reads the *machine* for its settings, not the container\'s limits. Two environment variables fix that, and they are the most common cause of Go services misbehaving in production.',
        ],
      },
      {
        heading: 'A multi-stage Dockerfile',
        code: {
          label: 'Dockerfile',
          src: `FROM golang:1.22-alpine AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download            # cached unless the deps change

COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /api ./cmd/api

FROM gcr.io/distroless/static-debian12
COPY --from=build /api /api
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/api"]`,
          note: 'The final image has no shell, no package manager, and no libc — just your binary. About 15MB, and almost nothing to attack.',
        },
      },
      {
        heading: 'Why each flag is there',
        bullets: [
          '**`CGO_ENABLED=0`** — a fully static binary with no libc dependency. This is what lets you use a distroless base at all, and what makes cross-compiling work.',
          '**`-ldflags="-s -w"`** — strips the symbol table and DWARF debug info. A few MB smaller, and you keep stack traces.',
          '**Copy `go.mod` first** — Docker caches that layer, so changing a `.go` file does not re-download every dependency.',
          '**`USER nonroot`** — if something does go wrong, it does not go wrong as root.',
        ],
      },
      {
        heading: 'The two container settings everybody gets wrong',
        code: {
          label: 'env',
          src: `GOMEMLIMIT=450MiB      # ~90% of the container's memory limit
GOMAXPROCS=2           # match the CPU limit, not the host's core count`,
        },
      },
      {
        body: [
          '**`GOMEMLIMIT`** is a soft ceiling on the heap. Without it, Go’s garbage collector happily grows the heap until the OOM killer takes your process. This is the single most common Go-in-Kubernetes production problem.',
          '**`GOMAXPROCS`** defaults to the *machine’s* CPU count, not your container’s limit. On a 64-core node with a 2-core quota, Go runs 64 schedulers fighting over 2 cores of CPU time, and your responses get very slow. Set it explicitly, or use `go.uber.org/automaxprocs`.',
        ],
      },
      {
        heading: 'docker compose for local development',
        code: {
          label: 'docker-compose.yml',
          src: `services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: api
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
    volumes: ["pgdata:/var/lib/postgresql/data"]

  api:
    build: .
    depends_on:
      db: { condition: service_healthy }
    environment:
      DATABASE_URL: postgres://postgres:secret@db:5432/api?sslmode=disable
      JWT_SECRET: dev-secret-at-least-32-characters-long
      GOMEMLIMIT: 450MiB
    ports: ["8080:8080"]

volumes:
  pgdata:`,
        },
      },
      {
        heading: 'A Makefile so you stop retyping',
        code: {
          label: 'Makefile',
          src: `.PHONY: run test lint build up down migrate check

run:     ; go run ./cmd/api
test:    ; go test -race -cover ./...
lint:    ; go vet ./... && gofmt -l .
build:   ; CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/api ./cmd/api
up:      ; docker compose up -d
down:    ; docker compose down
migrate: ; migrate -path migrations -database "$(DATABASE_URL)" up
check:   ; gofmt -l . && go vet ./... && go test -race ./... && govulncheck ./...`,
        },
      },
      {
        heading: 'Cross-compiling is two environment variables',
        code: {
          label: 'terminal',
          src: `GOOS=linux   GOARCH=amd64 go build ./cmd/api
GOOS=linux   GOARCH=arm64 go build ./cmd/api
GOOS=darwin  GOARCH=arm64 go build ./cmd/api
GOOS=windows GOARCH=amd64 go build ./cmd/api

go tool dist list      # everything Go can target`,
          note: 'No cross-toolchain, no container, no configure script. This works as long as CGO_ENABLED=0.',
        },
      },
    ],
    keyPoints: [
      'Multi-stage build + distroless gives a ~15MB image with no shell and no package manager.',
      '`CGO_ENABLED=0` is what makes both the static binary and cross-compiling work.',
      'Set `GOMEMLIMIT` and `GOMAXPROCS` in every container. They fix most Go-in-k8s complaints.',
      'A Makefile with `check` gives you one command to run before every push.',
    ],
    remember:
      'Go’s deployment story is one static binary. Do not undo it by shipping a full OS image or letting the runtime guess your container limits.',
    task: 'Dockerise the project, run it with compose, and check the image size with `docker images`. Then set `GOMEMLIMIT` and confirm the app still starts.',
    refs: [
      { label: 'Go modules reference', href: 'https://go.dev/ref/mod' },
      { label: 'runtime package — GOMEMLIMIT', href: 'https://pkg.go.dev/runtime#hdr-Environment_Variables' },
    ],
  },

  {
    slug: 'polish-and-docs',
    title: 'Polish: docs, seeds, and the finishing touches',
    navTitle: 'Polish and docs',
    oneLine: 'The difference between "it works on my machine" and something another person can run.',
    blocks: [
      {
        heading: 'What polish actually means',
        body: [
          'The API works. **Polish** is the difference between something that works on your machine and something another person can clone, run and use without asking you a single question.',
          'It is the least exciting hour of the project and the one most visible to anybody else — an interviewer, a teammate, or you in six months. Everything in this topic is small, and none of it is optional if somebody else will touch the code.',
        ],
      },
      {
        heading: 'Version your API from the start',
        body: [
          'Put `/v1` in the path now. It costs nothing today and is nearly impossible to retrofit once clients exist.',
        ],
        code: {
          label: 'routes.go',
          src: `v1 := http.NewServeMux()
userH.Routes(v1)
noteH.Routes(v1)

mux := http.NewServeMux()
mux.Handle("/v1/", http.StripPrefix("/v1", v1))
mux.HandleFunc("GET /livez", live)      // health checks stay unversioned`,
        },
      },
      {
        heading: 'A seed command',
        body: [
          'A second binary under `cmd/` that fills the database with sample data. Two minutes to write, and it saves you from hand-registering a user every time you reset the database.',
        ],
        code: { label: 'layout', src: `cmd/\n  api/main.go\n  seed/main.go      go run ./cmd/seed` },
      },
      {
        heading: 'The README someone can actually follow',
        code: {
          label: 'README.md',
          src: `# SnapNotes API

Notes with accounts and file attachments. Go 1.22, Postgres, no framework.

## Run it
    cp .env.example .env
    docker compose up -d
    make migrate
    make run

## Endpoints
    POST   /v1/auth/register
    POST   /v1/auth/login
    POST   /v1/auth/refresh
    POST   /v1/auth/logout
    GET    /v1/me

    POST   /v1/notes
    GET    /v1/notes?limit=20&offset=0
    GET    /v1/notes/{id}
    PATCH  /v1/notes/{id}
    DELETE /v1/notes/{id}

    POST   /v1/notes/{id}/attachments    multipart, field "file", max 10MB
    GET    /v1/notes/{id}/attachments
    GET    /v1/attachments/{id}
    DELETE /v1/attachments/{id}

    GET    /livez
    GET    /readyz

## Notes
- Access token 15 min, refresh token 7 days with rotation.
- All list endpoints paginated, max limit 100.
- Uploads: jpeg, png, gif, webp, pdf. Type sniffed, not trusted.`,
        },
      },
      {
        heading: 'A runnable request collection',
        code: {
          label: 'requests.http',
          src: `@host = http://localhost:8080/v1

### register
POST {{host}}/auth/register
Content-Type: application/json

{"name":"Sahdev","email":"s@example.com","password":"password123"}

### login
# @name login
POST {{host}}/auth/login
Content-Type: application/json

{"email":"s@example.com","password":"password123"}

### create a note
POST {{host}}/notes
Authorization: Bearer {{login.response.body.access_token}}
Content-Type: application/json

{"title":"First note","body":"hello"}`,
          note: 'VS Code REST Client and JetBrains both run this file directly. It lives in the repo, so it never goes stale like a Postman export.',
        },
      },
      {
        heading: 'Doc comments',
        body: [
          'A doc comment starts with the name of the thing it describes. `go doc` and pkg.go.dev read them, so they are the documentation, not a decoration.',
        ],
        code: {
          label: 'doc.go',
          src: `// Package note stores and retrieves a user's notes.
//
// Every repository method takes a userID and scopes its query to it, so a note
// belonging to another user is indistinguishable from one that does not exist.
package note

// Service applies the business rules for notes. It is safe for concurrent use.
type Service struct{ repo Repository }`,
          note: 'Comment WHY, not what. The code already says what.',
        },
      },
      {
        heading: 'Final touches worth the hour',
        bullets: [
          '`.env.example` committed with every key and no values. `.env` in `.gitignore`.',
          'A `/livez` and `/readyz` that actually reflect reality.',
          '`X-Request-ID` echoed on every response, so a user can quote it in a bug report.',
          'One consistent error shape everywhere: `{"error": "..."}`, never a bare string sometimes and an object other times.',
          'Consistent JSON casing. Pick `snake_case` and use it in every tag.',
        ],
      },
    ],
    keyPoints: [
      'Version the path now. Retrofitting `/v1` after clients exist is painful.',
      'A seed command and a `requests.http` file save you time every single day.',
      'The README is the run instructions plus the endpoint list. Nothing else is needed.',
      'Doc comments start with the identifier name and explain why, not what.',
    ],
    remember:
      'The project is finished when someone else can clone it and have it running in three commands.',
    task: 'Add `/v1`, the seed command, the README, and `requests.http`. Then clone your own repo into a fresh folder and follow your own instructions exactly — every step you have to improvise is a bug in the README.',
    refs: [
      { label: 'Go Doc Comments', href: 'https://go.dev/doc/comment' },
      { label: 'Effective Go — Commentary', href: 'https://go.dev/doc/effective_go#commentary' },
    ],
  },

  {
    slug: 'hardening-and-review',
    title: 'Harden it, and review your own code',
    navTitle: 'Harden and review',
    oneLine: 'Read what you wrote as if a stranger wrote it, hunting for the eight things that actually break.',
    blocks: [
      {
        heading: 'What hardening and self-review mean',
        body: [
          '**Hardening** is going back over working code specifically looking for ways it could be misused — not bugs that show up in normal use, but the request nobody sends by accident.',
          '**Self-review** is reading your own diff as if a stranger wrote it and you have to maintain it. It is uncomfortable and it is the highest-value hour in this whole track, because everything you find now is something you do not find in production.',
          'The order matters: run the automated tools first, so you spend your own attention on what they cannot see.',
        ],
      },
      {
        heading: 'Run the tools first',
        code: {
          label: 'terminal',
          src: `gofmt -l .              # must print nothing
go vet ./...            # must be silent
go test -race ./...     # must be green
govulncheck ./...       # must be clean

go install golang.org/x/vuln/cmd/govulncheck@latest`,
          note: 'govulncheck is official and low-noise because it only reports vulnerabilities in code you actually call, not every CVE in your dependency tree.',
        },
      },
      {
        heading: 'The self-review checklist',
        table: {
          headers: ['#', 'Check', 'What you are hunting for'],
          rows: [
            ['1', 'Every route’s auth', 'a handler registered without `protect` — grep your `Routes` functions'],
            ['2', 'Every query’s scope', '`WHERE id = $1` with no `AND user_id = $2`'],
            ['3', 'Every query’s SQL', 'any `fmt.Sprintf` or `+` near a query string'],
            ['4', 'Every error return', 'a bare `return err` with no context'],
            ['5', 'Every goroutine', 'one with no `ctx.Done()` case and no way to exit'],
            ['6', 'Every log line', 'a password, token, or whole request body'],
            ['7', 'Every list endpoint', 'a missing limit, or a limit with no ceiling'],
            ['8', 'Every file path', 'one built from something the client sent'],
          ],
        },
      },
      {
        heading: 'The anti-patterns to grep for',
        table: {
          headers: ['Anti-pattern', 'Fix'],
          rows: [
            ['`if err != nil { return err }` six layers deep', 'wrap with `%w` and what you were doing'],
            ['an ignored error with `_`', 'handle it, or write a comment saying why it is safe to skip'],
            ['`interface{}` / `any` in your own code', 'a concrete type, or generics'],
            ['an interface with one implementation', 'delete it; use the struct'],
            ['a `utils` or `common` package', 'name it for what it does'],
            ['a global `var db *sql.DB`', 'a struct field, injected in `run()`'],
            ['`time.Sleep` to wait for a goroutine', '`WaitGroup` or a channel'],
            ['`defer` inside a loop', 'move the body into a function'],
            ['`SELECT *`', 'list the columns'],
            ['`user.UserService`', '`user.Service` — do not stutter'],
            ['a context stored in a struct', 'first parameter'],
            ['business logic inside a handler', 'move it into the service'],
          ],
        },
      },
      {
        heading: 'Attack your own API',
        code: {
          label: 'terminal',
          src: `# no token
curl -i localhost:8080/v1/notes

# somebody else's note
curl -i -H "Authorization: Bearer $B_TOKEN" localhost:8080/v1/notes/$A_NOTE_ID

# a tampered token (change one character of the signature)
curl -i -H "Authorization: Bearer $TAMPERED" localhost:8080/v1/me

# oversized body
head -c 50M /dev/urandom > big.bin
curl -i -F "file=@big.bin" -H "Authorization: Bearer $T" \\
  localhost:8080/v1/notes/1/attachments

# a script pretending to be an image
cp evil.sh evil.jpg
curl -i -F "file=@evil.jpg" -H "Authorization: Bearer $T" \\
  localhost:8080/v1/notes/1/attachments

# SQL injection attempt
curl -i "localhost:8080/v1/notes?limit=1;DROP%20TABLE%20users"`,
          note: 'Expected: 401, 404, 401, 413, 415, and a clean 200 with a clamped limit. If any of those surprises you, you found today’s work.',
        },
      },
      {
        heading: 'The eight questions a Go reviewer asks',
        bullets: [
          'Are all errors handled, and wrapped with context?',
          'Can any goroutine leak? Is every one bounded and cancellable?',
          'Is shared state guarded? Would `-race` be clean?',
          'Is `ctx` threaded through to every I/O call?',
          'Is every query parameterised and owner-scoped?',
          'Do the tests cover the error paths, not just the happy one?',
          'Is there an abstraction here that nobody asked for?',
          'Would a new hire understand this in six months?',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'Then delete something. Every codebase this age has a helper used once, a commented-out block, an interface with one implementation, or a config value that never changes. Deleting is the highest-value edit you will make today.',
        },
      },
    ],
    keyPoints: [
      'gofmt, vet, race, govulncheck — all four clean before you review anything by hand.',
      'The eight-point sweep: auth, scope, SQL, errors, goroutines, logs, limits, paths.',
      'Attack your own API with curl. Six requests find most of what is wrong.',
      'Delete something. Unused abstraction is the debt you are least likely to notice.',
    ],
    remember:
      'Reviewing your own code means reading it as if someone else wrote it and you have to maintain it. Be unkind to it now so production is kind to you later.',
    task: 'Run all four tools, work the eight-point checklist line by line, run every attack above, and fix what falls out. Then delete at least one thing.',
    refs: [
      { label: 'Go Code Review Comments', href: 'https://go.dev/wiki/CodeReviewComments' },
      { label: 'govulncheck', href: 'https://go.dev/blog/govulncheck' },
    ],
  },

  {
    slug: 'profiling-and-shipping',
    title: 'Profile it, ship it, and what comes next',
    navTitle: 'Profile and ship',
    oneLine: 'Measure before you optimise, push it, and pick the right next thing to build.',
    blocks: [
      {
        heading: 'What profiling is',
        body: [
          '**Profiling** is measuring where a running program actually spends its time and memory. It matters because people are consistently wrong about this. The line you are sure is slow usually is not, and the real cost is somewhere you never looked.',
          'Go ships a profiler in the standard library, called **pprof**. You expose it on a port, take a sample while the program is under load, and it shows you exactly which functions the time went into.',
          'The rule that follows from this: correct first, clear second, fast only when a measurement says so. An optimisation without a profile is usually a guess that costs you readability and buys nothing.',
        ],
      },
      {
        heading: 'pprof: never guess about performance',
        code: {
          label: 'cmd/api/main.go',
          src: `import _ "net/http/pprof"       // registers handlers on the DEFAULT mux

// a SEPARATE, localhost-only port — never your public one
go func() {
\tslog.Info("pprof on localhost:6060")
\thttp.ListenAndServe("localhost:6060", nil)
}()`,
          note: 'Exposing /debug/pprof publicly leaks your source paths and lets anyone stall your process with a 30-second CPU profile. Bind it to localhost.',
        },
      },
      {
        code: {
          label: 'terminal',
          src: `# CPU: where is time going?
go tool pprof -http=:8081 http://localhost:6060/debug/pprof/profile?seconds=30

# memory in use right now
go tool pprof -http=:8081 http://localhost:6060/debug/pprof/heap

# total allocated over time — the allocation churn
go tool pprof -http=:8081 http://localhost:6060/debug/pprof/allocs

# goroutine leak hunting: does this number grow and never come back down?
curl -s 'localhost:6060/debug/pprof/goroutine?debug=1' | head -1`,
          note: 'In the web UI: Flame Graph for where time goes, Top for the honest list, Source for line by line.',
        },
      },
      {
        heading: 'What actually costs you, in order',
        table: {
          headers: ['#', 'Cause', 'Typical fix'],
          rows: [
            ['1', 'a query inside a loop (N+1)', 'a JOIN, or one batched query'],
            ['2', 'a missing database index', '`EXPLAIN ANALYZE`, then `CREATE INDEX`'],
            ['3', 'a pool that is too small, or unlimited', '`SetMaxOpenConns`'],
            ['4', 'unbounded concurrency', 'a semaphore, or `errgroup.SetLimit`'],
            ['5', 'allocations in a hot loop', 'preallocate with `make([]T, 0, n)`'],
            ['6', 'everything else', 'you will almost certainly never need to touch it'],
          ],
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Do not do these on faith: `sync.Pool`, `unsafe` string conversion, replacing a mutex with atomics, hand-rolled lock-free structures. Each needs a benchmark proving it *in your workload*, or it is just damage to readability.',
        },
      },
      {
        heading: 'Benchmark honestly',
        code: {
          label: 'bench_test.go',
          src: `func BenchmarkValidate(b *testing.B) {
\treq := CreateRequest{Title: "hello", Body: "world"}
\tb.ReportAllocs()
\tb.ResetTimer()                 // exclude the setup above
\tfor i := 0; i < b.N; i++ {
\t\t_ = req.Validate()
\t}
}`,
        },
      },
      {
        code: {
          label: 'terminal',
          src: `go test -bench=. -benchmem -count=10 ./... > old.txt
# ... make the change ...
go test -bench=. -benchmem -count=10 ./... > new.txt
benchstat old.txt new.txt

go install golang.org/x/perf/cmd/benchstat@latest`,
          note: 'A single benchmark run is noise. -count=10 plus benchstat is the only honest comparison.',
        },
      },
      {
        heading: 'Ship it',
        code: {
          label: 'terminal',
          src: `make check                     # fmt, vet, race, govulncheck — all clean

git init && git add -A
git commit -m "SnapNotes API"
git remote add origin git@github.com:you/snapnotes.git
git push -u origin main`,
        },
      },
      {
        heading: 'The habit that makes you senior',
        code: {
          label: 'before every push',
          src: `gofmt -l .              # silent
go vet ./...            # silent
go test -race ./...     # green
govulncheck ./...       # clean`,
          note: 'Then read the diff you are about to push as if someone else wrote it, and delete a third of it.',
        },
      },
      {
        heading: 'What to build next',
        bullets: [
          '**A CLI** with `flag` and subcommands — a completely different shape of program.',
          '**A concurrent web crawler** with bounded workers, dedup, and a context timeout. This is where concurrency finally clicks.',
          '**A rate limiter as a library**, with benchmarks and fuzz tests.',
          '**A queue worker** (Redis, NATS, or SQS) with graceful shutdown and retries.',
          '**Add caching, metrics, and tracing** to SnapNotes — the natural sequel.',
        ],
      },
      {
        heading: 'What to read next',
        bullets: [
          '[Effective Go](https://go.dev/doc/effective_go) — reread it in a month. It means much more once you have written real code.',
          '[Go Code Review Comments](https://go.dev/wiki/CodeReviewComments) — the official list of what reviewers flag.',
          '[The Go Memory Model](https://go.dev/ref/mem) — short, and it settles every concurrency argument.',
          '[The Go Blog](https://go.dev/blog/) — start with pipelines, context, and errors-are-values.',
          '**The standard library source.** `net/http`, `io`, `errors`, and `sync` are the best Go anyone has written, and it is already on your disk.',
        ],
      },
      {
        callout: {
          tone: 'ok',
          text: 'You started this month not knowing what a goroutine was. You now have a Go API with authentication, a database, file uploads, tests, and a container that runs it. That is a real portfolio project and a real skill. The best Go code is boring — if a reviewer says "this is clever", that is not the compliment it sounds like.',
        },
      },
    ],
    keyPoints: [
      'Profile before optimising. pprof on localhost only, never a public port.',
      'The database is where your latency lives. Micro-optimising Go is the last resort.',
      'Benchmark with `-count=10` and benchstat, or you are reading noise.',
      'fmt, vet, race, govulncheck before every push. Forever.',
    ],
    remember:
      'Correct, then clear, then fast — and only fast when a measurement told you to. Almost every optimisation written without a profile is a pessimisation with worse readability.',
    task: 'Profile the API under a `hey` or `ab` load test, find the slowest endpoint, and fix one real thing. Then run `make check`, push it, and take the rest of the day off.',
    refs: [
      { label: 'Profiling Go programs', href: 'https://go.dev/blog/pprof' },
      { label: 'Go Code Review Comments', href: 'https://go.dev/wiki/CodeReviewComments' },
    ],
  },
]
