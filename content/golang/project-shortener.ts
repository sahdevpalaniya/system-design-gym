import type { LangLesson } from '@/lib/types'

/**
 * Project 1 — a URL shortener, built one file at a time.
 * Teaches: a real spec, folder structure in practice, validation, storage,
 * redirects, and moving from memory to Postgres.
 */
export const PROJECT_SHORTENER: LangLesson[] = [
  {
    slug: 'shortener-overview',
    title: 'Project 1 — URL shortener: what we are building',
    navTitle: 'Overview and plan',
    oneLine: 'The plan, the endpoints, and the data before a single line of Go.',
    blocks: [
      {
        heading: 'What a URL shortener does',
        body: [
          'A **URL shortener** takes a long web address and gives back a short one. When somebody opens the short one, your server looks up the original and sends the browser there. That is the whole product.',
          'It is the right first project because it is small enough to finish, and it still contains almost everything a real service has: input you cannot trust, an id you have to generate, storage, a lookup on the hot path, and a redirect.',
        ],
      },
      {
        heading: 'The architecture: layered (package by layer)',
        body: [
          'Each of the three projects in this track uses a **different** architecture on purpose, so you end up having built all three rather than read about them. This one is **layered**, also called package-by-layer or the n-tier layout. It is the most common shape for a small Go service and the one you will meet most often in tutorials and in older codebases.',
          'The idea is simple: a folder for each **kind** of code. Types in one place, storage in another, rules in another, HTTP in another. The folder answers the question *what kind of code is this?*',
        ],
        table: {
          headers: ['Layer', 'Folder', 'Job', 'May import'],
          rows: [
            ['Model', '`internal/model`', 'the types and their errors', 'nothing of yours'],
            ['Store', '`internal/store`', 'putting data somewhere and getting it back', '`model`'],
            ['Service', '`internal/service`', 'the rules — validation, code generation', '`model`, a store interface'],
            ['Transport', '`internal/transport/web`', 'reading requests, writing responses', '`model`, `service`'],
            ['Entry point', '`cmd/api`', 'build everything and start it', 'all of them'],
          ],
        },
      },
      {
        heading: 'The one rule',
        body: [
          'Dependencies point **downwards only**: transport → service → store → model. Nothing lower ever imports something higher. `store` must never import `transport`, and `model` must import none of them.',
          'That rule is the whole value of the layout. It is what lets you test the service without an HTTP server, and swap the store from a map to Postgres in step 5 by writing one file.',
        ],
        code: {
          label: 'the direction, as imports',
          src: `cmd/api          ->  transport, service, store, model
transport/web    ->  service, model
service          ->  model   (+ a store interface it declares itself)
store            ->  model
model            ->  nothing

// Every arrow points one way. If you ever need one to point back, the code
// on the far end belongs somewhere else.`,
        },
      },
      {
        heading: 'What it is good at, and what it is not',
        table: {
          headers: ['Good', 'Not so good'],
          rows: [
            ['Obvious where a new file goes', 'One feature is spread across four folders'],
            ['Easy to explain to anyone', 'Adding a second feature makes every folder grow'],
            ['Layer boundaries are easy to police', 'Import cycles appear once features need each other'],
            ['Perfect for one or two features', 'Strains at roughly ten features'],
          ],
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Use this when the service does **one thing**. A URL shortener has exactly one concept, so a folder per layer is clear and there is nothing to spread out. Project 2 has three concepts and uses a different layout for exactly that reason.',
        },
      },
      {
        heading: 'Decide the endpoints first',
        body: [
          'Before writing code, write down what the API accepts and what it returns. Doing this first is not paperwork — it is what stops you rewriting handlers twice.',
        ],
        table: {
          headers: ['Method and path', 'What it does', 'Returns'],
          rows: [
            ['`POST /links`', 'shorten a long URL', '201 with the short code'],
            ['`GET /links`', 'list the links you have made', '200 with a list'],
            ['`GET /links/{code}`', 'details and click count for one link', '200, or 404'],
            ['`DELETE /links/{code}`', 'remove a link', '204, or 404'],
            ['`GET /{code}`', '**the redirect** — the actual product', '301 to the long URL, or 404'],
            ['`GET /healthz`', 'is the service alive', '200'],
          ],
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Notice `GET /{code}` sits at the root, not under `/links`. Short URLs should be short — `sho.rt/aB3xK` beats `sho.rt/links/aB3xK`. That decision is worth making now, because it changes how you register routes.',
        },
      },
      {
        heading: 'Decide the data',
        body: [
          'One thing is being stored, so there is one table. Write it down before you write Go, because the struct will follow the table rather than the other way round.',
        ],
        table: {
          headers: ['Field', 'Type', 'Why it is there'],
          rows: [
            ['`id`', 'bigserial', 'the database’s own key'],
            ['`code`', 'text, unique', 'the short part of the URL — what people type'],
            ['`long_url`', 'text', 'where to send them'],
            ['`clicks`', 'bigint', 'how many times it has been opened'],
            ['`created_at`', 'timestamptz', 'so you can sort and expire old links'],
          ],
        },
      },
      {
        heading: 'The plan, step by step',
        body: [
          'You will build this in seven steps. Each step is one or two files, and after every step the program still runs. That matters: if you write all seven files and then run it for the first time, you will be debugging seven things at once.',
        ],
        bullets: [
          '**Step 1** — set up the module and the layered folders, with a health check that works.',
          '**Step 2** — the store, in memory, so you can build the API before touching a database.',
          '**Step 3** — creating a link: validating the URL and generating a code.',
          '**Step 4** — the redirect, which is the actual product.',
          '**Step 5** — move the store to Postgres. Nothing else changes.',
          '**Step 6** — list, fetch and delete links, plus click counting.',
          '**Step 7** — timeouts, shutdown, tests and a Dockerfile.',
        ],
      },
      {
        heading: 'What this project does not have',
        body: [
          'No user accounts, no login, no permissions. Anyone can create a link and anyone can read the list. That is on purpose — this project is about getting one service right end to end. Accounts are project two, and they are much easier to understand once you have already built a working service without them.',
        ],
      },
    ],
    keyPoints: [
      'Write the endpoint table and the data table before any Go. It is the cheapest planning you will ever do.',
      'The redirect lives at the root, `GET /{code}`, so the short URLs stay short.',
      'Build it in steps where the program runs after each one, not in one go.',
      'No accounts in this project. One thing at a time.',
    ],
    remember:
      'Decide what the API accepts and returns before you write code. A handler is easy to write and expensive to rewrite.',
    task: 'Write out the endpoint table and the data table by hand, then decide one thing yourself: how long should a short code be, and what happens if two links point at the same long URL?',
    exercises: [
      {
        task: 'Look at a real shortener and see which of these endpoints it has.',
        answer:
          'Most expose create and redirect publicly and hide the rest behind an account. The redirect is always at the root.',
      },
      {
        task: 'Work out how many links a 5-character code can hold if you use letters and digits.',
        answer:
          'With 62 characters, 62^5 ≈ 916 million. Plenty — but collisions start mattering long before you run out, which is why you retry.',
      },
      {
        task: 'Decide what should happen if somebody shortens a URL that is already shortened.',
        answer:
          'Either is defensible. Returning the existing code saves space but leaks that someone else shortened it; a new code is simpler and private.',
      },
    ],
    refs: [
      { label: 'Routing Enhancements for Go 1.22', href: 'https://go.dev/blog/routing-enhancements' },
      { label: 'Organizing a Go module', href: 'https://go.dev/doc/modules/layout' },
    ],
  },

  {
    slug: 'shortener-step-1-setup',
    title: 'Step 1 — Set up the project',
    navTitle: 'Step 1 — Set up',
    oneLine: 'The module, the folders, and one route that proves it runs.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `# 1. create the project
mkdir shortener && cd shortener
go mod init github.com/you/shortener

# 2. folders and empty files
mkdir -p cmd/api internal/transport/web
touch cmd/api/main.go internal/transport/web/respond.go

# 3. write the two files below, then
go mod tidy
go run ./cmd/api

# 4. in a second terminal
curl -s localhost:8080/healthz
curl -si -X POST localhost:8080/healthz | head -1   # 405, for free`,
        },
      },
      {
        heading: 'What this step gives you',
        body: [
          'By the end of this step you will have a running HTTP server that answers one request. No links, no database — just proof that the module, the folders and the server all work.',
          'This is the right way to start anything. A server you can curl is a foundation. Seven files written blind are a debugging session.',
        ],
      },
      {
        heading: 'Create the module',
        code: {
          label: 'terminal',
          src: `mkdir shortener && cd shortener
go mod init github.com/you/shortener`,
          note: 'The module path is the import prefix for every package inside. Use your real repository path if you have one.',
        },
      },
      {
        heading: 'The folders you are starting with',
        tree: {
          caption:
            'Folders are named after the JOB the code does, not the thing it is about. That is the layered style.',
          nodes: [
            { depth: 0, name: 'shortener', kind: 'dir' },
            { depth: 1, name: 'go.mod', kind: 'file', note: 'just created' },
            { depth: 1, name: 'cmd', kind: 'dir', note: 'runnable programs' },
            { depth: 2, name: 'api', kind: 'dir' },
            { depth: 3, name: 'main.go', kind: 'file', note: 'file 1 — wiring only' },
            { depth: 1, name: 'internal', kind: 'dir', note: 'private to this project' },
            { depth: 2, name: 'transport', kind: 'dir', note: 'everything that speaks HTTP' },
            { depth: 3, name: 'web', kind: 'dir' },
            { depth: 4, name: 'respond.go', kind: 'file', note: 'file 2 — JSON and error helpers' },
          ],
        },
      },
      {
        heading: 'File 1 — internal/transport/web/respond.go',
        body: [
          'Start with the helpers, because every handler you write afterwards will use them. Two functions: one writes any value as JSON, one writes an error in a consistent shape.',
        ],
        code: {
          label: 'internal/transport/web/respond.go — create this file',
          src: `package web

import (
\t"encoding/json"
\t"net/http"
)

// JSON writes v as the response body with the given status code.
func JSON(w http.ResponseWriter, status int, v any) {
\tw.Header().Set("Content-Type", "application/json")
\tw.WriteHeader(status)              // headers first, then status, then body
\tif v != nil {
\t\tjson.NewEncoder(w).Encode(v)
\t}
}

// Error writes one consistent error shape, so clients never have to guess.
func Error(w http.ResponseWriter, status int, msg string) {
\tJSON(w, status, map[string]string{"error": msg})
}`,
          note: 'Every error your API returns will look like {"error": "..."}. Deciding that once, here, is why it stays consistent.',
        },
      },
      {
        heading: 'File 2 — cmd/api/main.go',
        body: [
          'Now the program itself. It registers one route and starts a server. Note the `run() error` shape: `main` does nothing but call it and exit, so every `defer` you add later still runs.',
        ],
        code: {
          label: 'cmd/api/main.go — create this file',
          src: `package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/you/shortener/internal/transport/web"
)

func main() {
	if err := run(); err != nil {
		slog.Error("fatal", "err", err)
		os.Exit(1)                     // the only os.Exit in the program
	}
}

func run() error {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		web.JSON(w, 200, map[string]string{"status": "ok"})
	})

	srv := &http.Server{
		Addr:              ":8080",
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
	}

	slog.Info("listening", "addr", srv.Addr)
	return srv.ListenAndServe()
}
`,
        },
      },
      {
        heading: 'Run it',
        code: {
          label: 'terminal',
          src: `go run ./cmd/api

# in another terminal
curl -s localhost:8080/healthz
# {"status":"ok"}`,
          note: 'If you get "no required module provides package", check that the import path matches the module name in go.mod exactly.',
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'The timeouts on `http.Server` are here from the first line rather than added later. A server with no timeouts lets one slow client hold a connection open forever, and it is the single most common thing missing from Go tutorials.',
        },
      },
    ],
    keyPoints: [
      'Get one route answering before you build anything else.',
      '`main` calls `run() error` and exits — one `os.Exit`, so defers keep working.',
      'Decide your JSON error shape once, in a helper, not in each handler.',
      'Set server timeouts from the start, not as a later fix.',
    ],
    remember:
      'A server you can curl is a foundation you can build on. Files written before anything runs are just debt.',
    task: 'Create both files, run the server, and get a response from `/healthz`. Then try `POST /healthz` and see that you get 405 without writing any code for it.',
    exercises: [
      {
        task: 'Add a `GET /version` route that returns a hardcoded version string.',
        answer:
          'It works with no extra wiring. Adding routes to a `ServeMux` is one line each.',
      },
      {
        task: 'Remove the `Content-Type` header from `JSON` and see how curl and your browser react.',
        answer:
          'curl still shows the text, but a browser renders it as plain text and `jq` may still parse it. Clients that check the header will refuse it.',
      },
      {
        task: 'Change the port to come from the `PORT` environment variable, with 8080 as the fallback.',
        answer:
          '`os.Getenv("PORT")` returns an empty string when unset, so you need the fallback — that is why the `env` helper exists.',
      },
    ],
    refs: [{ label: 'net/http', href: 'https://pkg.go.dev/net/http' }],
  },

  {
    slug: 'shortener-step-2-store',
    title: 'Step 2 — The store, in memory',
    navTitle: 'Step 2 — The store',
    oneLine: 'Somewhere to keep links, so you can build the API before adding a database.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `mkdir -p internal/model internal/store internal/service internal/transport/web
touch internal/model/link.go internal/store/memory.go

# after writing them
go build ./...
go vet ./...

# a quick test of the store
touch internal/store/memory_test.go
go test ./internal/store/ -run TestMemory -v`,
        },
      },
      {
        heading: 'Why memory first',
        body: [
          'You could add Postgres now. Doing it later is better: an in-memory store takes ten minutes, has no setup, and lets you get the whole API working before you introduce anything that can fail for reasons unrelated to your code.',
          'It also forces a useful shape. If the rest of your program only talks to the store through a few methods, swapping those methods for SQL later touches one file — which is exactly what Step 5 does.',
        ],
      },
      {
        heading: 'One new folder',
        tree: {
          caption:
            'Three new packages, one per layer. `model` holds the type, `store` keeps it, `service` decides the rules.',
          nodes: [
            { depth: 0, name: 'internal', kind: 'dir' },
            { depth: 1, name: 'transport', kind: 'dir', note: 'from step 1' },
            { depth: 2, name: 'web', kind: 'dir' },
            { depth: 3, name: 'respond.go', kind: 'file' },
            { depth: 1, name: 'model', kind: 'dir', note: 'new — the types, and nothing else' },
            { depth: 2, name: 'link.go', kind: 'file', note: 'the Link struct and its errors' },
            { depth: 1, name: 'store', kind: 'dir', note: 'new — where links are kept' },
            { depth: 2, name: 'memory.go', kind: 'file', note: 'the in-memory store' },
          ],
        },
      },
      {
        heading: 'File 1 — internal/model/link.go',
        body: [
          'The type first. The struct tags decide what the JSON looks like, so this file also defines your API’s response shape.',
        ],
        code: {
          label: 'internal/model/link.go — create this file',
          src: `package model

import (
	"errors"
	"time"
)

// Link is the only type this service has. It lives in model/ because it is
// what the application is ABOUT — no HTTP, no SQL, just the shape.
type Link struct {
	Code      string    \`json:"code"\`
	LongURL   string    \`json:"long_url"\`
	Clicks    int64     \`json:"clicks"\`
	CreatedAt time.Time \`json:"created_at"\`
}

// The errors this service can return. The transport layer turns these into
// status codes, so it never needs to know how links are stored.
var (
	ErrNotFound   = errors.New("link not found")
	ErrCodeTaken  = errors.New("code already in use")
	ErrValidation = errors.New("invalid input")
)
`,
          note: 'Defining the errors here, next to the type, is what lets the handler write errors.Is(err, model.ErrNotFound) later.',
        },
      },
      {
        heading: 'File 2 — internal/store/memory.go',
        body: [
          'The store keeps links in a map. The mutex is not optional: an HTTP server handles each request in its own goroutine, so two requests can write to that map at the same moment, and Go will crash the process if they do.',
        ],
        code: {
          label: 'internal/store/memory.go — create this file',
          src: `package store

import (
	"sync"

	"github.com/you/shortener/internal/model"
)

// Memory keeps links in a map. Everything is lost on restart, which is fine
// until step 5 swaps this for Postgres.
type Memory struct {
	mu    sync.RWMutex             // guards the map below
	links map[string]*model.Link   // keyed by code
}

func NewMemory() *Memory {
	return &Memory{links: map[string]*model.Link{}}
}

func (s *Memory) Save(l *model.Link) error {
	s.mu.Lock()                    // a write: exclusive
	defer s.mu.Unlock()

	if _, exists := s.links[l.Code]; exists {
		return model.ErrCodeTaken
	}
	s.links[l.Code] = l
	return nil
}

func (s *Memory) ByCode(code string) (*model.Link, error) {
	s.mu.RLock()                   // a read: many at once are fine
	defer s.mu.RUnlock()

	l, ok := s.links[code]
	if !ok {
		return nil, model.ErrNotFound   // absent is not the same as an empty link
	}
	return l, nil
}
`,
        },
      },
      {
        heading: 'Why RWMutex here',
        body: [
          'A **mutex** lets one goroutine at a time into a section of code. An **RWMutex** is a mutex that also allows many readers at once, as long as nobody is writing.',
          'That fits a URL shortener exactly: every redirect is a read, and creating a link is comparatively rare. Reads outnumbering writes heavily is the one case where `RWMutex` clearly beats a plain `Mutex`.',
        ],
      },
      {
        callout: {
          tone: 'warn',
          text: 'Maps are not safe for use from several goroutines at once. Without the lock, Go detects the clash and crashes on purpose the whole process with "concurrent map writes". It does that instead of quietly corrupting your data, which is the right trade — but it will take your service down.',
        },
      },
    ],
    keyPoints: [
      'Build against memory first. A database is a step you take once the API already works.',
      'Keep the type, its errors and its storage in one package named after the thing.',
      'Every request is its own goroutine, so shared maps need a lock. Always.',
      '`RWMutex` when reads heavily outnumber writes, which is the case here.',
    ],
    remember:
      'Talk to storage through a few named methods. That is what makes swapping memory for Postgres a one-file change later.',
    task: 'Create both files. Write a small test that saves a link, reads it back, and checks that reading a missing code returns `ErrNotFound`.',
    exercises: [
      {
        task: 'Add a `Delete(code string) error` method that returns `ErrNotFound` when the code is not there.',
        answer:
          'It must return `ErrNotFound` when the key is absent, or deleting twice looks like success.',
      },
      {
        task: 'Remove the mutex, then run `go test -race` with two goroutines writing at once. Read the report.',
        answer:
          'The race detector prints both stack traces and the exact line. Without it the corruption is invisible until production.',
      },
      {
        task: 'Change `ByCode` to return `(Link, bool)` instead of an error, then decide which version you prefer and why.',
        answer:
          'Both work. The error version composes better once there are several failure reasons; the bool is fine while there is only one.',
      },
    ],
    refs: [
      { label: 'sync package', href: 'https://pkg.go.dev/sync' },
      { label: 'Effective Go — Concurrency', href: 'https://go.dev/doc/effective_go#concurrency' },
    ],
  },

  {
    slug: 'shortener-step-3-create',
    title: 'Step 3 — Creating a short link',
    navTitle: 'Step 3 — Create a link',
    oneLine: 'Validate the URL you are given, generate a code, and store it.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `touch internal/service/code.go internal/service/shortener.go internal/transport/web/handler.go

go build ./... && go run ./cmd/api

# in a second terminal — the happy path
curl -s -X POST localhost:8080/links -d '{"url":"https://go.dev/doc/"}' | jq

# and the failures
curl -s -X POST localhost:8080/links -d '{"url":""}'
curl -s -X POST localhost:8080/links -d '{"url":"hello"}'
curl -s -X POST localhost:8080/links -d '{"url":"javascript:alert(1)"}'
curl -s -X POST localhost:8080/links -d 'not json'`,
        },
      },
      {
        heading: 'What this step has to get right',
        body: [
          'This is the first endpoint that takes input from a stranger, so it is the first place things can go wrong. Three separate jobs: check the URL is really a URL, make a short code that is not already taken, and store the result.',
        ],
      },
      {
        heading: 'File 1 — internal/service/code.go',
        body: [
          'A **short code** is the part after the slash. It has to be short, safe in a URL, and hard to guess in order. Random characters from a fixed alphabet give you all three.',
        ],
        code: {
          label: 'internal/service/code.go — create this file',
          src: `package service

import (
	"crypto/rand"
	"math/big"
)

// No 0/O or 1/l/I — they are easy to misread when somebody types a code by hand.
const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

// NewCode returns a random code of n characters.
func NewCode(n int) (string, error) {
	b := make([]byte, n)
	max := big.NewInt(int64(len(alphabet)))

	for i := range b {
		k, err := rand.Int(rand.Reader, max)   // crypto/rand, not math/rand
		if err != nil {
			return "", err
		}
		b[i] = alphabet[k.Int64()]
	}
	return string(b), nil
}
`,
          note: 'crypto/rand matters even here. math/rand is predictable, so somebody could work out the next codes you will hand out and read links before their owners share them.',
        },
      },
      {
        heading: 'File 2 — internal/service/shortener.go',
        body: [
          'The **service** holds the rules. It validates the input, generates the code, retries if that code was taken, and asks the store to save. It knows nothing about HTTP, which is what lets you test it without a server.',
        ],
        code: {
          label: 'internal/service/shortener.go — create this file',
          src: `package service

import (
	"errors"
	"fmt"
	"time"

	"github.com/you/shortener/internal/model"
)

// Store is declared HERE, by the layer that uses it — not by the store package.
// It is exactly as big as this service needs, so a test fake has two methods.
type Store interface {
	Save(l *model.Link) error
	ByCode(code string) (*model.Link, error)
}

type Service struct{ store Store }

func New(s Store) *Service { return &Service{store: s} }

func (s *Service) Shorten(raw string) (*model.Link, error) {
	long, err := validateURL(raw)
	if err != nil {
		return nil, err
	}

	// Codes are random, so a clash is possible. Try a few times rather than
	// failing the request on bad luck.
	for attempt := 0; attempt < 5; attempt++ {
		code, err := NewCode(6)
		if err != nil {
			return nil, err
		}

		l := &model.Link{Code: code, LongURL: long, CreatedAt: time.Now()}
		err = s.store.Save(l)
		if err == nil {
			return l, nil
		}
		if !errors.Is(err, model.ErrCodeTaken) {
			return nil, err        // a real failure, not a clash
		}
	}
	return nil, fmt.Errorf("could not generate a free code")
}
`,
        },
      },
      {
        heading: 'File 3 — the validation',
        body: [
          'Validation deserves its own function because it is where you decide what you will accept from the internet. Parsing is not enough — `url.Parse` happily accepts a lot of things that are not usable web addresses.',
        ],
        code: {
          label: 'internal/service/shortener.go — add this below',
          src: `func validateURL(raw string) (string, error) {
\traw = strings.TrimSpace(raw)
\tif raw == "" {
\t\treturn "", fmt.Errorf("%w: url is required", ErrValidation)
\t}
\tif len(raw) > 2048 {
\t\treturn "", fmt.Errorf("%w: url is too long", ErrValidation)
\t}

\tu, err := url.Parse(raw)
\tif err != nil {
\t\treturn "", fmt.Errorf("%w: url is not valid", ErrValidation)
\t}

\t// Parse accepts "hello" as a valid relative URL, so check the parts we need.
\tif u.Scheme != "http" && u.Scheme != "https" {
\t\treturn "", fmt.Errorf("%w: url must start with http:// or https://", ErrValidation)
\t}
\tif u.Host == "" {
\t\treturn "", fmt.Errorf("%w: url has no host", ErrValidation)
\t}

\treturn u.String(), nil
}`,
          note: 'Restricting the scheme to http and https is a security check, not tidiness. Without it somebody can store javascript: or file: URLs and your redirect becomes an attack.',
        },
      },
      {
        heading: 'File 4 — the handler',
        code: {
          label: 'internal/transport/web/handler.go — create this file',
          src: `package web

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/you/shortener/internal/model"
	"github.com/you/shortener/internal/service"
)

type Handler struct{ svc *service.Service }

func NewHandler(s *service.Service) *Handler { return &Handler{svc: s} }

func (h *Handler) Routes(mux *http.ServeMux) {
	mux.HandleFunc("POST /links", h.create)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var in struct {
		URL string \`json:"url"\`
	}

	// Cap the body before reading it, or a huge request can take the server down.
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	if err := dec.Decode(&in); err != nil {
		Error(w, 400, "invalid json")   // no package name: respond.go is package web too
		return                          // always return after writing an error
	}

	l, err := h.svc.Shorten(in.URL)
	if err != nil {
		if errors.Is(err, model.ErrValidation) {
			Error(w, 422, err.Error())
			return
		}
		Error(w, 500, "could not shorten that url")
		return
	}

	JSON(w, 201, l)
}
`,
        },
      },
      {
        heading: 'Wire it into main',
        code: {
          label: 'cmd/api/main.go — add these lines inside run()',
          src: `st := store.NewMemory()
svc := service.New(st)
h := web.NewHandler(svc)

mux := http.NewServeMux()
h.Routes(mux)                      // built from the inside out: store, service, handler`,
        },
      },
      {
        heading: 'Try it, including the bad cases',
        code: {
          label: 'terminal',
          src: `curl -s -X POST localhost:8080/links -d '{"url":"https://go.dev/doc/"}'
# {"code":"kR7mQp","long_url":"https://go.dev/doc/", ...}

curl -s -X POST localhost:8080/links -d '{"url":"hello"}'
# {"error":"invalid input: url must start with http:// or https://"}

curl -s -X POST localhost:8080/links -d 'not json'
# {"error":"invalid json"}`,
          note: 'Test the failures, not just the happy path. Most bugs live in the branches you never ran.',
        },
      },
    ],
    keyPoints: [
      'The service holds the rules and knows nothing about HTTP. That is what makes it testable.',
      'Use `crypto/rand` for anything a stranger should not be able to guess.',
      '`url.Parse` succeeding does not mean the URL is usable. Check the scheme and the host.',
      'Cap the request body before decoding, and always `return` after writing an error.',
    ],
    remember:
      'Every value coming from a client is untrusted: its size, its shape and its contents. Decide what you accept in one place, and reject everything else.',
    task: 'Build all four files and get a short code back from curl. Then try five bad inputs — empty, not-a-url, a `javascript:` URL, a 3000-character URL, and malformed JSON — and check each gives a sensible status.',
    exercises: [
      {
        task: 'Let the client ask for a custom code, and return 409 when it is already taken.',
        answer:
          'You need the unique constraint to decide, not a SELECT — otherwise two requests can both claim the same custom code.',
      },
      {
        task: 'Write a table-driven test for `validateURL` with eight cases, half of them invalid.',
        answer:
          'Your invalid cases should include empty, no scheme, `javascript:`, and something over 2048 characters.',
      },
      {
        task: 'Work out how many 6-character codes exist with this alphabet, then decide whether 6 is enough.',
        answer:
          '62^6 ≈ 56 billion. Six is comfortable; four would collide constantly at any real volume.',
      },
      {
        task: 'Change the retry loop to give up after one attempt and work out how you would notice the problem in production.',
        answer:
          'It works almost always, then fails randomly under load. You would see it as a rare 500 with no pattern — the worst kind of bug.',
      },
    ],
    refs: [
      { label: 'net/url', href: 'https://pkg.go.dev/net/url' },
      { label: 'crypto/rand', href: 'https://pkg.go.dev/crypto/rand' },
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
    ],
  },

  {
    slug: 'shortener-step-4-redirect',
    title: 'Step 4 — The redirect',
    navTitle: 'Step 4 — The redirect',
    oneLine: 'The one endpoint the whole product exists for.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `# no new files — edit handler.go and service.go
go run ./cmd/api

# create a link and follow it
CODE=$(curl -s -X POST localhost:8080/links -d '{"url":"https://go.dev"}' | jq -r .code)
curl -si localhost:8080/$CODE | head -3
curl -sL localhost:8080/$CODE -o /dev/null -w '%{url_effective}\\n'
curl -si localhost:8080/nope | head -1

# check the click count went up
curl -s localhost:8080/links/$CODE | jq .clicks

# and check for races while you are here
go run -race ./cmd/api`,
        },
      },
      {
        heading: 'What a redirect is',
        body: [
          'A **redirect** is an HTTP response that says "what you asked for is somewhere else, go here instead". The browser then requests the new address on its own. You send a status code in the 300s and a `Location` header holding the destination.',
          'This is the endpoint that matters. Creating links happens rarely; redirects happen constantly, and they are what the user actually experiences.',
        ],
      },
      {
        heading: 'Which status code to send',
        table: {
          headers: ['Status', 'Means', 'Browser behaviour'],
          rows: [
            ['**301** Moved Permanently', 'this will never change', 'cached hard — later visits may skip your server entirely'],
            ['**302** Found', 'temporary', 'not cached, comes back to you every time'],
            ['**307/308**', 'same as 302/301 but keeps the HTTP method', 'used for non-GET requests'],
          ],
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'A 301 is cached aggressively, sometimes for months. If you send 301 and the user later deletes or edits that link, browsers that saw the first response may keep going to the old destination. Send **302** unless you are certain the link can never change — and if you want click counts at all, you have to send 302, because a cached 301 never reaches your server to be counted.',
        },
      },
      {
        heading: 'The handler',
        code: {
          label: 'internal/transport/web/handler.go — add this method',
          src: `func (h *Handler) redirect(w http.ResponseWriter, r *http.Request) {
\tcode := r.PathValue("code")

\tl, err := h.svc.Resolve(r.Context(), code)
\tif err != nil {
\t\t// A plain text 404, not JSON — a person is looking at this in a browser.
\t\thttp.NotFound(w, r)
\t\treturn
\t}

\thttp.Redirect(w, r, l.LongURL, http.StatusFound)   // 302
}`,
          note: 'http.Redirect sets the Location header and writes the status for you. Do not write those two by hand.',
        },
      },
      {
        heading: 'Register it carefully',
        body: [
          'The redirect lives at the root, which means its pattern is very broad. Go 1.22 picks the **most specific** matching pattern, so your other routes still win — but it is worth understanding rather than trusting.',
        ],
        code: {
          label: 'internal/transport/web/handler.go — update Routes',
          src: `func (h *Handler) Routes(mux *http.ServeMux) {
\tmux.HandleFunc("POST /links", h.create)
\tmux.HandleFunc("GET /{code}", h.redirect)      // the broad one
}

// "GET /links" is more specific than "GET /{code}", so it wins.
// "GET /healthz" likewise. You do not need to register in any special order.`,
        },
      },
      {
        heading: 'Counting clicks without slowing the redirect',
        body: [
          'You want to know how often a link is used. The obvious way — write to the store, then redirect — makes every visitor wait for a write they do not care about.',
          'Instead, send the redirect immediately and count in the background. The user gets the fastest possible response, and a lost count during a crash costs you nothing.',
        ],
        code: {
          label: 'internal/service/shortener.go — add this',
          src: `func (s *Service) Resolve(ctx context.Context, code string) (*Link, error) {
\tl, err := s.store.ByCode(code)
\tif err != nil {
\t\treturn nil, err
\t}

\t// Count in the background so the visitor does not wait for it.
\t// NOTE: this goroutine must not use ctx — that context is cancelled the
\t// moment the response is sent, which would cancel the count as well.
\tgo func() {
\t\tif err := s.store.Incr(code); err != nil {
\t\t\tslog.Error("click count failed", "code", code, "err", err)
\t\t}
\t}()

\treturn l, nil
}`,
          note: 'The comment about ctx is the real lesson here. A request context is cancelled when the handler returns, so passing it into background work cancels that work immediately.',
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'One unbounded goroutine per redirect is fine at small scale and is not fine at large scale — a traffic spike starts a goroutine per visitor. The grown-up version sends counts to a buffered channel that a single worker drains, so the number of goroutines stays fixed. Build the simple one now; you will meet the pattern again in the concurrency topics.',
        },
      },
      {
        heading: 'Test it in a real browser',
        code: {
          label: 'terminal',
          src: `CODE=$(curl -s -X POST localhost:8080/links -d '{"url":"https://go.dev"}' | jq -r .code)

curl -si localhost:8080/$CODE | head -3
# HTTP/1.1 302 Found
# Location: https://go.dev

curl -sL localhost:8080/$CODE -o /dev/null -w '%{url_effective}\\n'   # -L follows it
curl -si localhost:8080/nope | head -1                                # 404`,
        },
      },
    ],
    keyPoints: [
      'A redirect is a 3xx status plus a `Location` header. `http.Redirect` writes both.',
      'Use 302, not 301 — a cached 301 never reaches your server again, so you cannot count or change it.',
      'Go 1.22 matches the most specific pattern, so `GET /links` beats `GET /{code}`.',
      'Do the click count in the background, and do not give that goroutine the request context.',
    ],
    remember:
      'The redirect is the hot path. Everything the visitor does not need should happen after the response, not before it.',
    task: 'Add the redirect and click counting. Open a short link in a real browser, then check the count went up. Then try it with a 301 and see it cached — you will need a private window to test it again.',
    exercises: [
      {
        task: 'Return a proper HTML 404 page for a missing code instead of plain text.',
        answer:
          'Set `Content-Type: text/html` and write the markup. A person hitting a dead short link is in a browser, not a terminal.',
      },
      {
        task: 'Replace the goroutine-per-redirect with one buffered channel and a single worker draining it.',
        answer:
          'The goroutine count stays flat under load instead of growing with traffic. That is the difference between the simple and the grown-up version.',
      },
      {
        task: 'Log the referrer and user agent alongside each click, then decide whether you should be storing that.',
        answer:
          'It works, and it is personal data. Decide on purpose whether you need it and for how long — that decision is the exercise.',
      },
      {
        task: 'Measure how much slower the redirect gets if you count synchronously instead.',
        answer:
          'Typically an extra database round trip per visit, so a few milliseconds each. Small until it is your busiest endpoint.',
      },
    ],
    refs: [
      { label: 'http.Redirect', href: 'https://pkg.go.dev/net/http#Redirect' },
      { label: 'Routing Enhancements for Go 1.22', href: 'https://go.dev/blog/routing-enhancements' },
    ],
  },

  {
    slug: 'shortener-step-5-postgres',
    title: 'Step 5 — Swap memory for Postgres',
    navTitle: 'Step 5 — Postgres',
    oneLine: 'The same API, now with data that survives a restart. One new file.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `# 1. a database
docker run -d --name short-pg \\
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=shortener \\
  -p 5432:5432 postgres:16

# 2. the driver
go get github.com/jackc/pgx/v5/stdlib

# 3. new files
mkdir -p migrations
touch internal/store/db.go internal/store/postgres.go
touch migrations/001_links.up.sql migrations/001_links.down.sql

# 4. apply the schema (no migration tool needed for one file)
docker exec -i short-pg psql -U postgres -d shortener < migrations/001_links.up.sql

# 5. run it
export DATABASE_URL='postgres://postgres:secret@localhost:5432/shortener?sslmode=disable'
go run ./cmd/api

# 6. prove the data survives a restart
curl -s -X POST localhost:8080/links -d '{"url":"https://go.dev"}' | jq -r .code
# Ctrl-C, then go run ./cmd/api again, then fetch that code`,
        },
      },
      {
        heading: 'Why this step is small',
        body: [
          'Everything above the store talks to it through the `Store` interface: `Save`, `ByCode`, `Incr`. So switching to a database means writing one new type with those three methods and changing one line in `main.go`.',
          'That is the payoff for building against an interface in step 2. If the handler had written SQL directly, this step would touch every file.',
        ],
      },
      {
        heading: 'Start a database and add the driver',
        code: {
          label: 'terminal',
          src: `docker run -d --name pg \\
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=shortener \\
  -p 5432:5432 postgres:16

go get github.com/jackc/pgx/v5/stdlib`,
          note: 'database/sql is the standard library interface. pgx is the driver that actually speaks to Postgres. One dependency, not a framework.',
        },
      },
      {
        heading: 'File 1 — the schema',
        code: {
          label: 'migrations/001_links.up.sql — create this file',
          src: `CREATE TABLE links (
  id         BIGSERIAL PRIMARY KEY,
  code       TEXT UNIQUE NOT NULL,      -- UNIQUE does the clash check for you
  long_url   TEXT NOT NULL,
  clicks     BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON links (created_at DESC);   -- for the list endpoint`,
          note: 'The UNIQUE constraint on code is the real protection against two links getting the same code. Checking in Go first would still leave a gap between the check and the insert.',
        },
      },
      {
        heading: 'File 2 — opening the pool',
        code: {
          label: 'internal/store/db.go — create this file',
          src: `package store

import (
\t"database/sql"
\t"time"

\t_ "github.com/jackc/pgx/v5/stdlib"    // blank import: registers the driver
)

func Open(dsn string) (*sql.DB, error) {
\tdb, err := sql.Open("pgx", dsn)       // does NOT connect yet
\tif err != nil {
\t\treturn nil, err
\t}

\tdb.SetMaxOpenConns(25)                // never leave this unlimited
\tdb.SetMaxIdleConns(25)
\tdb.SetConnMaxLifetime(5 * time.Minute)

\treturn db, db.Ping()                  // Ping is what actually connects
}`,
          note: 'sql.DB is a pool, not a connection. Create one for the whole program and share it — it is safe to use from many goroutines.',
        },
      },
      {
        heading: 'File 3 — the SQL store',
        code: {
          label: 'internal/store/postgres.go — create this file',
          src: `package store

import (
\t"database/sql"
\t"errors"
)

type Postgres struct{ db *sql.DB }

func NewPostgres(db *sql.DB) *Postgres { return &Postgres{db: db} }

func (s *Postgres) Save(l *Link) error {
\terr := s.db.QueryRow(
\t\t\`INSERT INTO links (code, long_url) VALUES ($1, $2)
\t\t RETURNING id, clicks, created_at\`,
\t\tl.Code, l.LongURL,                   // $1 and $2 — never string formatting
\t).Scan(&l.ID, &l.Clicks, &l.CreatedAt)

\tif isUniqueViolation(err) {
\t\treturn ErrCodeTaken                  // same error the memory store returns
\t}
\treturn err
}

func (s *Postgres) ByCode(code string) (*Link, error) {
\tvar l Link
\terr := s.db.QueryRow(
\t\t\`SELECT code, long_url, clicks, created_at FROM links WHERE code = $1\`,
\t\tcode,
\t).Scan(&l.Code, &l.LongURL, &l.Clicks, &l.CreatedAt)

\tif errors.Is(err, sql.ErrNoRows) {
\t\treturn nil, ErrNotFound              // translate the driver's error to ours
\t}
\treturn &l, err
}

func (s *Postgres) Incr(code string) error {
\t_, err := s.db.Exec(\`UPDATE links SET clicks = clicks + 1 WHERE code = $1\`, code)
\treturn err
}`,
          note: 'clicks = clicks + 1 is done by the database, so two redirects at the same moment cannot lose a count. Reading the value into Go and adding one would.',
        },
      },
      {
        heading: 'Change one line',
        code: {
          label: 'cmd/api/main.go',
          src: `// before
st := store.NewMemory()

// after
db, err := store.Open(os.Getenv("DATABASE_URL"))
if err != nil {
\treturn err
}
defer db.Close()

st := store.NewPostgres(db)      // everything below is unchanged`,
          note: 'The service and the handler do not change at all. That is what the interface bought you.',
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Never build SQL with `fmt.Sprintf` or `+`. Use `$1`, `$2` placeholders, always. That is your entire defence against SQL injection, and there is no case where it is acceptable to skip it — not even for values you think you generated yourself.',
        },
      },
    ],
    keyPoints: [
      'Building against an interface means changing storage touches one file and one line.',
      '`sql.DB` is a pool. Create one, share it, and always set `SetMaxOpenConns`.',
      'Translate `sql.ErrNoRows` into your own `ErrNotFound` at the storage boundary.',
      'Let the database do `clicks = clicks + 1`, and let the UNIQUE constraint catch clashes.',
    ],
    remember:
      'Placeholders always. A query built by joining strings is a security bug waiting for the right input.',
    task: 'Run the migration, write the three files, change the one line in main, and confirm every endpoint behaves exactly as it did with the memory store. Then restart the server and check your links are still there.',
    exercises: [
      {
        task: 'Stop Postgres and hit the API. You should get a clean 500 and a useful log line, not a panic.',
        answer:
          'A clean 500 and a log line. If you get a panic, an error is being ignored somewhere.',
      },
      {
        task: 'Run `EXPLAIN ANALYZE` on the redirect lookup and confirm it uses the unique index on `code`.',
        answer:
          '`Index Scan using links_code_key`. If you see `Seq Scan`, the unique index is missing.',
      },
      {
        task: 'Insert a duplicate code by hand in psql and watch the constraint reject it.',
        answer:
          '`duplicate key value violates unique constraint`. That is the error your Go code translates into `ErrCodeTaken`.',
      },
      {
        task: 'Try rewriting one query with `fmt.Sprintf` and then shorten a URL containing a quote. Then put it back.',
        answer:
          'A URL containing a quote breaks the query or changes its meaning. That is SQL injection in one line — then put the placeholder back.',
      },
    ],
    refs: [
      { label: 'Accessing databases', href: 'https://go.dev/doc/database/index' },
      { label: 'Avoiding SQL injection risk', href: 'https://go.dev/doc/database/sql-injection' },
    ],
  },

  {
    slug: 'shortener-step-6-finish',
    title: 'Step 6 — List, delete, and finish the project',
    navTitle: 'Step 6 — Finish it',
    oneLine: 'The remaining endpoints, then shutdown, tests and a container.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `touch internal/transport/web/handler_test.go Dockerfile Makefile

# tests
go test ./... -race -cover
go test ./internal/transport/web/ -run TestCreate -v

# the container
docker build -t shortener:latest .
docker images shortener:latest          # ~15MB
docker run --rm -p 8080:8080 -e DATABASE_URL="$DATABASE_URL" shortener:latest

# the four checks before any push
gofmt -l .
go vet ./...
go test -race ./...
go run golang.org/x/vuln/cmd/govulncheck@latest ./...`,
        },
      },
      {
        heading: 'What is left',
        body: [
          'Three endpoints and the production edges. None of it is new material — it is applying what the earlier steps set up, which is what finishing a project usually looks like.',
        ],
      },
      {
        heading: 'Listing, with pagination from the start',
        body: [
          '**Pagination** means returning a page of results rather than all of them. Add it now, not later: an endpoint with no limit works with fifty rows and takes the server down at fifty thousand.',
        ],
        code: {
          label: 'internal/store/postgres.go — add this method',
          src: `func (s *Postgres) List(limit, offset int) ([]Link, error) {
\trows, err := s.db.Query(
\t\t\`SELECT code, long_url, clicks, created_at
\t\t   FROM links ORDER BY created_at DESC LIMIT $1 OFFSET $2\`,
\t\tlimit, offset,
\t)
\tif err != nil {
\t\treturn nil, err
\t}
\tdefer rows.Close()                  // or you leak a pooled connection

\tout := make([]Link, 0, limit)
\tfor rows.Next() {
\t\tvar l Link
\t\tif err := rows.Scan(&l.Code, &l.LongURL, &l.Clicks, &l.CreatedAt); err != nil {
\t\t\treturn nil, err
\t\t}
\t\tout = append(out, l)
\t}
\treturn out, rows.Err()              // iteration errors only appear here
}`,
          note: 'Three things people forget in this loop: Close, checking each Scan, and rows.Err() at the end.',
        },
      },
      {
        code: {
          label: 'internal/transport/web/handler.go — the list handler',
          src: `func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
\tlimit := intParam(r, "limit", 20, 1, 100)     // clamped, never unbounded
\toffset := intParam(r, "offset", 0, 0, 1_000_000)

\tlinks, err := h.svc.List(limit, offset)
\tif err != nil {
\t\tError(w, 500, "could not list links")
\t\treturn
\t}
\tJSON(w, 200, links)
}

// intParam reads a query parameter, falling back to def and clamping the range.
func intParam(r *http.Request, key string, def, min, max int) int {
\tv, err := strconv.Atoi(r.URL.Query().Get(key))
\tif err != nil {
\t\treturn def
\t}
\treturn Clamp(v, min, max)
}`,
          note: 'Clamp rather than reject. A client asking for 5000 gets 100 back, not a 400 they have to handle.',
        },
      },
      {
        heading: 'Delete: say when nothing happened',
        code: {
          label: 'internal/store/postgres.go',
          src: `func (s *Postgres) Delete(code string) error {
\tres, err := s.db.Exec(\`DELETE FROM links WHERE code = $1\`, code)
\tif err != nil {
\t\treturn err
\t}
\tif n, _ := res.RowsAffected(); n == 0 {
\t\treturn ErrNotFound        // deleting nothing is not success
\t}
\treturn nil
}`,
          note: 'A DELETE that matches no rows is not an error in SQL. Checking RowsAffected is how you turn it into a 404.',
        },
      },
      {
        heading: 'Graceful shutdown',
        body: [
          '**Graceful shutdown** means: when told to stop, refuse new connections but let the requests already running finish. Every deployment restarts your service, so this runs far more often than you would expect.',
        ],
        code: {
          label: 'cmd/api/main.go — replace srv.ListenAndServe()',
          src: `errCh := make(chan error, 1)
go func() {
\tif err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
\t\terrCh <- err
\t}
}()

quit := make(chan os.Signal, 1)          // MUST be buffered or the signal is lost
signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

select {
case err := <-errCh:
\treturn err
case <-quit:
\tslog.Info("shutting down")
\tctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
\tdefer cancel()
\treturn srv.Shutdown(ctx)
}`,
        },
      },
      {
        heading: 'One test that matters',
        code: {
          label: 'internal/transport/web/handler_test.go — create this file',
          src: `func TestCreateRejectsBadURLs(t *testing.T) {
\th := newTestHandler(t)

\ttests := []struct {
\t\tname string
\t\tbody string
\t\twant int
\t}{
\t\t{"valid", \`{"url":"https://go.dev"}\`, 201},
\t\t{"empty", \`{"url":""}\`, 422},
\t\t{"not a url", \`{"url":"hello"}\`, 422},
\t\t{"javascript scheme", \`{"url":"javascript:alert(1)"}\`, 422},
\t\t{"malformed json", \`nope\`, 400},
\t}

\tfor _, tt := range tests {
\t\tt.Run(tt.name, func(t *testing.T) {
\t\t\treq := httptest.NewRequest("POST", "/links", strings.NewReader(tt.body))
\t\t\trec := httptest.NewRecorder()
\t\t\th.ServeHTTP(rec, req)

\t\t\tif rec.Code != tt.want {
\t\t\t\tt.Errorf("status = %d, want %d — body %s", rec.Code, tt.want, rec.Body)
\t\t\t}
\t\t}) 
\t}
}`,
          note: 'httptest runs your real handler with no network involved. Adding the sixth case is one line.',
        },
      },
      {
        heading: 'The Dockerfile',
        code: {
          label: 'Dockerfile — create this file',
          src: `FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /api ./cmd/api

FROM gcr.io/distroless/static-debian12
COPY --from=build /api /api
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/api"]`,
          note: 'About 15MB, with no shell and no package manager. CGO_ENABLED=0 is what makes that possible.',
        },
      },
      {
        heading: 'The finished layout',
        tree: {
          caption:
            'The finished layered layout. Every folder answers one question: what KIND of code is this?',
          nodes: [
            { depth: 0, name: 'shortener', kind: 'dir' },
            { depth: 1, name: 'go.mod', kind: 'file' },
            { depth: 1, name: 'Dockerfile', kind: 'file' },
            { depth: 1, name: 'cmd', kind: 'dir' },
            { depth: 2, name: 'api', kind: 'dir' },
            { depth: 3, name: 'main.go', kind: 'file', note: 'config, wiring, shutdown' },
            { depth: 1, name: 'internal', kind: 'dir' },
            { depth: 2, name: 'model', kind: 'dir', note: 'types only — imports nothing of yours' },
            { depth: 3, name: 'link.go', kind: 'file', note: 'the Link struct and its errors' },
            { depth: 2, name: 'store', kind: 'dir', note: 'persistence only' },
            { depth: 3, name: 'db.go', kind: 'file', note: 'the connection pool' },
            { depth: 3, name: 'memory.go', kind: 'file', note: 'the map implementation' },
            { depth: 3, name: 'postgres.go', kind: 'file', note: 'the SQL implementation' },
            { depth: 2, name: 'service', kind: 'dir', note: 'the rules — imports model, never http' },
            { depth: 3, name: 'code.go', kind: 'file', note: 'short code generation' },
            { depth: 3, name: 'shortener.go', kind: 'file', note: 'validation and orchestration' },
            { depth: 2, name: 'transport', kind: 'dir', note: 'HTTP only — imports service, never store' },
            { depth: 3, name: 'web', kind: 'dir' },
            { depth: 4, name: 'respond.go', kind: 'file', note: 'JSON helpers' },
            { depth: 4, name: 'handler.go', kind: 'file', note: 'handlers and routes' },
            { depth: 4, name: 'handler_test.go', kind: 'file' },
            { depth: 1, name: 'migrations', kind: 'dir' },
            { depth: 2, name: '001_links.up.sql', kind: 'file' },
          ],
        },
      },
      {
        callout: {
          tone: 'ok',
          text: 'You have built a working service: validated input, generated ids, a database, a hot path that stays fast, graceful shutdown, a test and a container. Project two adds the one thing missing here — knowing who the user is.',
        },
      },
    ],
    keyPoints: [
      'Paginate every list endpoint from the first version, and clamp the limit rather than rejecting it.',
      'Check `RowsAffected` so deleting nothing returns 404 instead of pretending it worked.',
      '`srv.Shutdown(ctx)` drains in-flight requests. Buffer the signal channel or you lose the signal.',
      '`CGO_ENABLED=0` plus a distroless base gives a ~15MB image with nothing to attack.',
    ],
    remember:
      'Finishing a project is pagination, shutdown, a test and a container. None of it is hard, and skipping it is what separates a demo from a service.',
    task: 'Finish all three endpoints, add shutdown, write the handler test, and build the Docker image. Then check the image size with `docker images`.',
    exercises: [
      {
        task: 'Add an expiry date to links and stop resolving them once it passes.',
        answer:
          'Add `expires_at` and put `AND (expires_at IS NULL OR expires_at > now())` in the lookup, so the database enforces it.',
      },
      {
        task: 'Add rate limiting to `POST /links` so one IP cannot create a thousand links a minute.',
        answer:
          'Without it, one script can fill your table overnight. Creation endpoints need limits more than read endpoints do.',
      },
      {
        task: 'Send SIGTERM during a slow request and confirm the request finishes before the process exits.',
        answer:
          'The request finishes, then the process exits. Without graceful shutdown it is cut off mid-response.',
      },
      {
        task: 'Load-test the redirect with `hey` and see how many requests a second one instance handles.',
        answer:
          'A single Go instance handles thousands a second here — the database lookup is the limit, not Go.',
      },
    ],
    refs: [
      { label: 'httptest', href: 'https://pkg.go.dev/net/http/httptest' },
      { label: 'http.Server.Shutdown', href: 'https://pkg.go.dev/net/http#Server.Shutdown' },
    ],
  },
]
