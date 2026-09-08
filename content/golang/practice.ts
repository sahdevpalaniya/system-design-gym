import type { LangLesson } from '@/lib/types'

/**
 * Three CRUD practice projects, same feature each time, in a bigger layout.
 * You build all three. The third is the one the real project is built on.
 */
export const PRACTICE: LangLesson[] = [
  {
    slug: 'practice-crud-easy',
    title: 'Practice 1 — CRUD, the easy way',
    navTitle: 'Practice 1 — flat',
    oneLine: 'One file, one package, no database. Get the four operations working before you add anything else.',
    blocks: [
      {
        heading: 'What CRUD means',
        body: [
          '**CRUD** stands for Create, Read, Update, Delete. They are the four things you can do to a stored item, and almost every application is mostly these four repeated over different things.',
          'In an HTTP API each one maps to a method and a path. That mapping is a convention, not a rule, but it is followed widely enough that breaking it will confuse everyone who uses your API.',
        ],
        table: {
          headers: ['Operation', 'Method and path', 'What it does', 'Success status'],
          rows: [
            ['**Create**', '`POST /tasks`', 'adds a new item, server picks the id', '201 Created'],
            ['**Read** (one)', '`GET /tasks/{id}`', 'returns a single item', '200 OK'],
            ['**Read** (many)', '`GET /tasks`', 'returns a list, usually paginated', '200 OK'],
            ['**Update**', '`PATCH /tasks/{id}`', 'changes some fields of an item', '200 OK'],
            ['**Delete**', '`DELETE /tasks/{id}`', 'removes an item', '204 No Content'],
          ],
        },
      },
      {
        heading: 'The point of this first version',
        body: [
          'You are going to build the same task list three times, in three layouts. This first one exists so that you learn the four operations with nothing else in the way — no database, no folders, no packages to import.',
          'It is not a toy. A single-file program like this is the right answer for a small tool, and it is what you should write on day one of any project.',
        ],
      },
      {
        heading: 'The layout',
        tree: {
          caption:
            'Three files, one package, one folder. Nothing imports anything, because there is nothing else to import.',
          nodes: [
            { depth: 0, name: 'taskapi', kind: 'dir', note: 'the whole project' },
            { depth: 1, name: 'go.mod', kind: 'file', note: 'created by `go mod init taskapi`' },
            { depth: 1, name: 'main.go', kind: 'file', note: 'routes, handlers, storage — all of it' },
            { depth: 1, name: 'main_test.go', kind: 'file', note: 'tests, beside the code they test' },
          ],
        },
      },
      {
        heading: 'The store',
        body: [
          'Data lives in a map in memory. A **mutex** guards it because an HTTP server handles requests in separate goroutines, so two requests can touch the map at the same time — and a map is not safe for that.',
        ],
        code: {
          label: 'main.go — the data',
          src: `package main

type Task struct {
\tID    int64  \`json:"id"\`
\tTitle string \`json:"title"\`
\tDone  bool   \`json:"done"\`
}

// store holds every task. The mutex sits directly above what it guards.
type store struct {
\tmu     sync.Mutex
\ttasks  map[int64]Task
\tnextID int64
}

func newStore() *store {
\treturn &store{tasks: map[int64]Task{}, nextID: 1}
}`,
          note: 'Everything is lost when the program stops. That is fine for now — persistence is the next practice project.',
        },
      },
      {
        heading: 'The four operations',
        code: {
          label: 'main.go — create and read',
          src: `func (s *store) create(title string) Task {
\ts.mu.Lock()
\tdefer s.mu.Unlock()

\tt := Task{ID: s.nextID, Title: title}
\ts.tasks[t.ID] = t
\ts.nextID++
\treturn t
}

func (s *store) get(id int64) (Task, bool) {
\ts.mu.Lock()
\tdefer s.mu.Unlock()

\tt, ok := s.tasks[id]      // the two-value form: absent is not the same as zero
\treturn t, ok
}

func (s *store) list() []Task {
\ts.mu.Lock()
\tdefer s.mu.Unlock()

\tout := make([]Task, 0, len(s.tasks))
\tfor _, t := range s.tasks {
\t\tout = append(out, t)
\t}
\t// map order is random, so sort or the list jumps around between requests
\tslices.SortFunc(out, func(a, b Task) int { return cmp.Compare(a.ID, b.ID) })
\treturn out
}`,
        },
      },
      {
        code: {
          label: 'main.go — update and delete',
          src: `func (s *store) update(id int64, title *string, done *bool) (Task, bool) {
\ts.mu.Lock()
\tdefer s.mu.Unlock()

\tt, ok := s.tasks[id]
\tif !ok {
\t\treturn Task{}, false
\t}
\tif title != nil {          // nil means "the client did not send this field"
\t\tt.Title = *title
\t}
\tif done != nil {
\t\tt.Done = *done
\t}
\ts.tasks[id] = t
\treturn t, true
}

func (s *store) delete(id int64) bool {
\ts.mu.Lock()
\tdefer s.mu.Unlock()

\tif _, ok := s.tasks[id]; !ok {
\t\treturn false            // report "not there" rather than pretending it worked
\t}
\tdelete(s.tasks, id)
\treturn true
}`,
          note: 'Pointer fields on update are how you tell "set the title to empty" apart from "do not touch the title".',
        },
      },
      {
        heading: 'The routes',
        code: {
          label: 'main.go — wiring',
          src: `func main() {
\ts := newStore()
\tmux := http.NewServeMux()

\tmux.HandleFunc("POST /tasks", s.handleCreate)
\tmux.HandleFunc("GET /tasks", s.handleList)
\tmux.HandleFunc("GET /tasks/{id}", s.handleGet)
\tmux.HandleFunc("PATCH /tasks/{id}", s.handleUpdate)
\tmux.HandleFunc("DELETE /tasks/{id}", s.handleDelete)

\tlog.Println("listening on :8080")
\tlog.Fatal(http.ListenAndServe(":8080", mux))
}

func writeJSON(w http.ResponseWriter, status int, v any) {
\tw.Header().Set("Content-Type", "application/json")
\tw.WriteHeader(status)
\tif v != nil {
\t\tjson.NewEncoder(w).Encode(v)
\t}
}`,
        },
      },
      {
        code: {
          label: 'main.go — one handler, as the pattern for the rest',
          src: `func (s *store) handleGet(w http.ResponseWriter, r *http.Request) {
\tid, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
\tif err != nil {
\t\twriteJSON(w, 400, map[string]string{"error": "invalid id"})
\t\treturn                 // always return after writing an error
\t}

\tt, ok := s.get(id)
\tif !ok {
\t\twriteJSON(w, 404, map[string]string{"error": "not found"})
\t\treturn
\t}

\twriteJSON(w, 200, t)
}`,
          note: 'Every handler has the same shape: read the input, call the store, write the result. Write the other four yourself.',
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Notice that the store methods know nothing about HTTP, and the handlers know nothing about how tasks are stored. That separation is the whole idea behind the next two practice projects — here it happens to fit in one file.',
        },
      },
      {
        heading: 'What good looks like when you are done',
        bullets: [
          'All five routes work with curl, and the wrong method on a right path gives 405 without you writing anything.',
          'A missing task gives 404, not an empty object and not a 500.',
          'Deleting the same task twice gives 204 then 404.',
          '`go run -race .` is silent while you hit it with several requests at once.',
        ],
      },
    ],
    keyPoints: [
      'CRUD is Create, Read, Update, Delete — the four things almost every app does, repeated.',
      'A single file with one package is the right answer for something this size.',
      'A map plus a mutex is a store. Requests run in separate goroutines, so the lock is not optional.',
      'Pointer fields on an update tell "not sent" apart from "sent as empty".',
    ],
    remember:
      'Get the four operations right in one file before you add folders, packages or a database. Structure added too early hides whether the logic works.',
    task: 'Build the whole thing: `go mod init taskapi`, one `main.go`, all five routes, tested with curl. Then write a table-driven test for the store — create, get, update, delete, and get-a-missing-id.',
    exercises: [
      {
        task: 'Delete a task, then request it. You must get 404, not an empty task.',
        answer:
          '404. Returning 200 with an empty object is a common bug that makes clients much harder to write.',
      },
      {
        task: 'Send `{"done":true}` and then `{}` to the same task. Only the first should change anything.',
        answer:
          'The first sets it; the second changes nothing. That is what the pointer fields are for.',
      },
      {
        task: 'Run `go run -race .` and fire 50 requests at once with `hey` or a shell loop. It must stay silent.',
        answer:
          'Clean, because the mutex guards the map. Without it you get a race report or a hard crash.',
      },
      {
        task: 'Remove the mutex on purpose and repeat that test, so you see what a race actually looks like.',
        answer:
          '`fatal error: concurrent map writes`, and the process dies. Go crashes rather than corrupting quietly.',
      },
    ],
    refs: [
      { label: 'Routing Enhancements for Go 1.22', href: 'https://go.dev/blog/routing-enhancements' },
      { label: 'Tutorial: Get started with Go', href: 'https://go.dev/doc/tutorial/getting-started' },
    ],
  },

  {
    slug: 'practice-crud-moderate',
    title: 'Practice 2 — CRUD, split into layers',
    navTitle: 'Practice 2 — layered',
    oneLine: 'The same task list, now in packages with a real database behind it.',
    blocks: [
      {
        heading: 'Why split it at all',
        body: [
          'The one-file version works. It stops working when the file gets long enough that you cannot find anything, or when you want to test the logic without starting an HTTP server.',
          '**Splitting into layers** means separating code by the job it does: one part talks to the outside world, one part holds the rules, one part talks to storage. Each part can then be read, changed and tested without the others.',
          'This second version keeps things simple by grouping folders **by layer** — all the storage in one folder, all the HTTP in another. It is the layout you will meet most often in other people\'s code, and it is a good step up from one file. Its limits show up in practice project three.',
        ],
      },
      {
        heading: 'The layout',
        tree: {
          caption:
            'Four folders. Each one has a single job, and the arrows only ever point one way: handler → store → database.',
          nodes: [
            { depth: 0, name: 'taskapi', kind: 'dir', note: '' },
            { depth: 1, name: 'go.mod', kind: 'file', note: '' },
            { depth: 1, name: 'cmd', kind: 'dir', note: 'every runnable program lives under here' },
            { depth: 2, name: 'api', kind: 'dir', note: 'this one builds the ./api binary' },
            { depth: 3, name: 'main.go', kind: 'file', note: 'connects the pieces, holds no logic' },
            { depth: 1, name: 'internal', kind: 'dir', note: 'private — no other project can import this' },
            { depth: 2, name: 'task', kind: 'dir', note: 'the Task type and its storage' },
            { depth: 3, name: 'task.go', kind: 'file', note: 'the struct and its validation' },
            { depth: 3, name: 'store.go', kind: 'file', note: 'the SQL. Knows nothing about HTTP.' },
            { depth: 3, name: 'store_test.go', kind: 'file', note: 'tested against a real database' },
            { depth: 2, name: 'api', kind: 'dir', note: 'the HTTP layer' },
            { depth: 3, name: 'handler.go', kind: 'file', note: 'decode, call the store, encode' },
            { depth: 3, name: 'routes.go', kind: 'file', note: 'which path goes to which handler' },
            { depth: 2, name: 'database', kind: 'dir', note: 'opening the connection pool' },
            { depth: 3, name: 'db.go', kind: 'file', note: '' },
            { depth: 1, name: 'migrations', kind: 'dir', note: 'the schema, as numbered .sql files' },
            { depth: 2, name: '001_tasks.up.sql', kind: 'file', note: '' },
          ],
        },
      },
      {
        heading: 'What each folder is for',
        table: {
          headers: ['Folder', 'Holds', 'May import', 'Must never import'],
          rows: [
            ['`cmd/api/`', 'one `main.go` that builds everything and starts the server', 'everything', '—'],
            ['`internal/task/`', 'the Task type and all its SQL', '`database/sql`', '`net/http`'],
            ['`internal/api/`', 'handlers and routes', '`net/http`, `internal/task`', '`database/sql`'],
            ['`internal/database/`', 'opening and configuring the pool', '`database/sql`', 'anything of yours'],
            ['`migrations/`', 'the schema as `.sql` files', '— (not Go code)', '—'],
          ],
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'That last column is the rule the whole layout rests on. If `internal/task` ever imports `net/http`, you can no longer test your storage without HTTP, and the split has bought you nothing.',
        },
      },
      {
        heading: 'The schema',
        code: {
          label: 'migrations/001_tasks.up.sql',
          src: `CREATE TABLE tasks (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  done       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
        },
      },
      {
        heading: 'The store, now backed by Postgres',
        body: [
          'The methods have the same names and the same jobs as the map version. Only the inside changed, which is exactly what a layer boundary is supposed to give you.',
        ],
        code: {
          label: 'internal/task/store.go',
          src: `package task

type Store struct{ db *sql.DB }

func NewStore(db *sql.DB) *Store { return &Store{db: db} }

func (s *Store) Create(ctx context.Context, t *Task) error {
\treturn s.db.QueryRowContext(ctx,
\t\t\`INSERT INTO tasks (title) VALUES ($1) RETURNING id, done, created_at\`,
\t\tt.Title,
\t).Scan(&t.ID, &t.Done, &t.CreatedAt)
}

func (s *Store) GetByID(ctx context.Context, id int64) (*Task, error) {
\tvar t Task
\terr := s.db.QueryRowContext(ctx,
\t\t\`SELECT id, title, done, created_at FROM tasks WHERE id = $1\`, id,
\t).Scan(&t.ID, &t.Title, &t.Done, &t.CreatedAt)

\tif errors.Is(err, sql.ErrNoRows) {
\t\treturn nil, ErrNotFound        // translate to OUR error, not the driver's
\t}
\treturn &t, err
}

func (s *Store) Delete(ctx context.Context, id int64) error {
\tres, err := s.db.ExecContext(ctx, \`DELETE FROM tasks WHERE id = $1\`, id)
\tif err != nil {
\t\treturn err
\t}
\tif n, _ := res.RowsAffected(); n == 0 {
\t\treturn ErrNotFound
\t}
\treturn nil
}`,
          note: 'ErrNotFound is defined in this package. The HTTP layer turns it into a 404 without ever knowing SQL exists.',
        },
      },
      {
        heading: 'The HTTP layer',
        code: {
          label: 'internal/api/handler.go',
          src: `package api

type Handler struct{ tasks *task.Store }

func NewHandler(t *task.Store) *Handler { return &Handler{tasks: t} }

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
\tid, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
\tif err != nil {
\t\tErrorJSON(w, 400, "invalid id")
\t\treturn
\t}

\tt, err := h.tasks.GetByID(r.Context(), id)   // pass the request context down
\tif err != nil {
\t\tfromError(w, err)                        // one place maps errors to statuses
\t\treturn
\t}

\tWriteJSON(w, 200, t)
}

// fromError is the only function that decides HTTP status codes.
func fromError(w http.ResponseWriter, err error) {
\tswitch {
\tcase errors.Is(err, task.ErrNotFound):
\t\tErrorJSON(w, 404, "not found")
\tcase errors.Is(err, task.ErrValidation):
\t\tErrorJSON(w, 422, err.Error())
\tdefault:
\t\tslog.Error("unhandled", "err", err)
\t\tErrorJSON(w, 500, "internal server error")
\t}
}`,
        },
      },
      {
        heading: 'main.go builds the chain',
        code: {
          label: 'cmd/api/main.go',
          src: `func main() {
\tif err := run(); err != nil {
\t\tslog.Error("fatal", "err", err)
\t\tos.Exit(1)              // one exit, at the top, so every defer still runs
\t}
}

func run() error {
\tdb, err := database.Open(os.Getenv("DATABASE_URL"))
\tif err != nil {
\t\treturn err
\t}
\tdefer db.Close()

\tstore := task.NewStore(db)      // build from the inside out
\th := api.NewHandler(store)

\tmux := http.NewServeMux()
\th.Routes(mux)

\tsrv := &http.Server{
\t\tAddr:              ":8080",
\t\tHandler:           mux,
\t\tReadHeaderTimeout: 5 * time.Second,
\t\tReadTimeout:       15 * time.Second,
\t\tWriteTimeout:      30 * time.Second,
\t}
\treturn srv.ListenAndServe()
}`,
          note: 'This is dependency injection. There is no framework doing it — you pass things into constructors, in order, by hand.',
        },
      },
      {
        heading: 'What you gained, and what you did not',
        bullets: [
          '**Gained:** the store can be tested against a real database with no HTTP involved, and the handlers can be tested with `httptest` and a fake store.',
          '**Gained:** data survives a restart, and the database enforces rules Go code could forget.',
          '**Gained:** `main.go` shows the whole shape of the program on one screen.',
          '**Not gained:** with a second feature — say `users` — you now add a file to `internal/task`… no, to a new `internal/user`, plus another file in `internal/api`. That second folder is where this layout starts to strain, and it is what practice project three fixes.',
        ],
      },
    ],
    keyPoints: [
      'Splitting into layers means each part has one job and can be tested without the others.',
      '`cmd/` holds runnable programs. `internal/` is private and the compiler enforces that.',
      'The storage layer never imports `net/http`; the HTTP layer never imports `database/sql`.',
      'Translate driver errors like `sql.ErrNoRows` into your own errors at the storage boundary.',
    ],
    remember:
      'A layer boundary is only real if the import rule holds. The moment your storage code imports `net/http`, the folders are decoration.',
    task: 'Rebuild practice project one in this layout, backed by Postgres in Docker. All five routes must behave identically to the map version — same statuses, same JSON.',
    exercises: [
      {
        task: 'Try importing `net/http` inside `internal/task`. Nothing stops you, which is why the rule has to be a habit.',
        answer:
          'Nothing stops you — the compiler allows it. The rule is a habit, which is why the domain layout makes it easier to keep.',
      },
      {
        task: 'Write a store test against a real database, and truncate the table with `t.Cleanup`.',
        answer:
          'Truncate in `t.Cleanup` so tests do not depend on each other\'s leftovers.',
      },
      {
        task: 'Add a `users` table and a second store, and notice how many folders you have to touch.',
        answer:
          'You touch `internal/task`, `internal/api` and main — and the two features are now interleaved across folders. That is the strain project three fixes.',
      },
      {
        task: 'Stop Postgres and hit the API. You should get a clean 500 and a useful log line, not a panic.',
        answer:
          'A clean 500 and a log line. If you get a panic, an error is being ignored somewhere.',
      },
    ],
    refs: [
      { label: 'Organizing a Go module', href: 'https://go.dev/doc/modules/layout' },
      { label: 'Accessing databases', href: 'https://go.dev/doc/database/index' },
    ],
  },
]
