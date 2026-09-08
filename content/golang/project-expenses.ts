import type { LangLesson } from '@/lib/types'

/**
 * Project 2 — an expense tracker. This is where accounts and authentication
 * are taught, inside a project that needs them, one step at a time.
 */
export const PROJECT_EXPENSES: LangLesson[] = [
  {
    slug: 'expenses-overview',
    title: 'Project 2 — Expense tracker: what we are building',
    navTitle: 'Overview and plan',
    oneLine: 'A money app with accounts — which is why this is where login belongs.',
    blocks: [
      {
        heading: 'Why an expense tracker',
        body: [
          'The URL shortener had no users. Anyone could create a link and anyone could list them. That was fine for learning one service end to end, and it is not fine for anything holding personal data.',
          'An **expense tracker** records what somebody spent, on what, and when. It is a good second project because the requirement writes itself: **I must never see your expenses, and you must never see mine.** Everything about accounts and login exists to make that sentence true.',
        ],
      },
      {
        heading: 'The architecture: package by feature',
        body: [
          'Project 1 used a **layered** layout — a folder per kind of code. This project uses a different one, and it is the layout most experienced Go teams settle on: **package by feature**, sometimes called package-by-domain or vertical slicing.',
          'The difference is what a folder is named after. Layered folders are named after a job (`store`, `service`). Feature folders are named after a **thing your product has** (`user`, `expense`) — and everything about that thing lives inside: its type, its rules, its SQL, its HTTP handlers, its tests.',
        ],
        code: {
          label: 'the same code, two ways of grouping it',
          src: `LAYERED (project 1)              BY FEATURE (this project)

internal/                        internal/
  model/                           user/
    link.go                          user.go        the type
  store/                             service.go     the rules
    postgres.go                      repository.go  the SQL
  service/                           handler.go     the HTTP
    shortener.go                     token.go
  transport/http/                  expense/
    handler.go                       expense.go
                                     service.go
                                     repository.go
                                     handler.go

one CONCEPT split across          one FOLDER holds one concept,
four folders                      top to bottom`,
        },
      },
      {
        heading: 'Why the change matters here',
        body: [
          'The shortener had one concept, so a folder per layer was clear. This project has three — users, expenses, and sessions — and that is where layered layouts start to hurt.',
          'With layers, adding expenses means editing `model`, `store`, `service` and `transport`. Every folder grows with every feature, no feature can be read in one place, and `service` eventually needs something from `transport` — which is an import cycle.',
          'With feature folders, adding expenses is **one new folder**. Removing it is deleting that folder and one line in `main.go`. That is the whole test of the layout.',
        ],
      },
      {
        heading: 'The layers did not disappear',
        body: [
          'This is the part people miss. Package-by-feature does not throw the layers away — it turns them into **files inside each folder**, so you get the same separation with better locality.',
        ],
        table: {
          headers: ['File in each feature folder', 'Responsible for', 'Knows about'],
          rows: [
            ['`<name>.go`', 'the type, its request shapes, its errors', 'nothing outside its package'],
            ['`repository.go`', 'SQL and nothing else', '`database/sql`'],
            ['`service.go`', 'the rules — what is allowed, in what order', 'a repository interface it declares itself'],
            ['`handler.go`', 'reading requests, writing responses', '`net/http` and the service'],
          ],
        },
      },
      {
        heading: 'The rules',
        bullets: [
          '**Dependencies still point inward:** handler → service → repository. Never the reverse.',
          '**A feature package should not import another feature package.** If `expense` needs users, it takes an interface, or main wires them together. Feature-to-feature imports rebuild the tangle you were avoiding.',
          '**Shared, feature-neutral code gets its own package** — `config`, `database`, `httpx`, `middleware`. If it belongs to no feature, it is infrastructure.',
          '**Name the package after the concept, singular:** `user`, not `users` and not `userservice`.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'Use this when the service has more than about two concepts and is expected to grow — which is most real services. It is the default worth reaching for unless you have a specific reason not to. Project 3 shows that reason.',
        },
      },
      {
        heading: 'The endpoints',
        table: {
          headers: ['Method and path', 'What it does', 'Needs a login?'],
          rows: [
            ['`POST /v1/auth/register`', 'create an account', 'no'],
            ['`POST /v1/auth/login`', 'exchange email and password for a token', 'no'],
            ['`POST /v1/auth/refresh`', 'get a fresh token without logging in again', 'no (uses a refresh token)'],
            ['`POST /v1/auth/logout`', 'end the session', 'yes'],
            ['`GET /v1/me`', 'who am I', 'yes'],
            ['`POST /v1/expenses`', 'record a spend', 'yes'],
            ['`GET /v1/expenses`', 'list **my** expenses, filtered and paged', 'yes'],
            ['`GET /v1/expenses/{id}`', 'one of **my** expenses', 'yes'],
            ['`PATCH /v1/expenses/{id}`', 'change one', 'yes'],
            ['`DELETE /v1/expenses/{id}`', 'remove one', 'yes'],
            ['`GET /v1/reports/monthly`', 'totals by category for a month', 'yes'],
          ],
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'The paths start with `/v1`. Adding that now costs nothing; adding it after other people are using your API is close to impossible. Do it in every project from here on.',
        },
      },
      {
        heading: 'The data',
        body: [
          'Three tables. The important part is the line joining them: every expense points at exactly one user, and that link is what every query in this project will be built around.',
        ],
        code: {
          label: 'the shape, in words',
          src: `users        ── one user ──┐
                             │ has many
expenses     ←───────────────┘
   each row stores user_id, so it belongs to exactly one person

refresh_tokens  ← one per active session, so logout can end it`,
        },
      },
      {
        heading: 'The steps',
        bullets: [
          '**Step 1** — setup, config that fails loudly, and the database schema.',
          '**Step 2** — register: what a password hash is and why you never store the password.',
          '**Step 3** — login: what a token is, and issuing a JWT.',
          '**Step 4** — middleware: checking that token once, at the edge, for every protected route.',
          '**Step 5** — expenses CRUD, where every query is locked to the logged-in user.',
          '**Step 6** — filtering, paging and a monthly report.',
          '**Step 7** — refresh tokens and logout, so sessions can actually be ended.',
          '**Step 8** — the tests that prove one user cannot reach another user’s data.',
        ],
      },
      {
        heading: 'Two words you will need',
        body: [
          '**Authentication** is *who are you*. Checking an email and password, and handing back a token that proves it for later requests.',
          '**Authorisation** is *what are you allowed to do*. In this project it is one rule — you may only touch rows where `user_id` is yours — but it is a separate question, and mixing the two up is how security bugs happen.',
        ],
      },
    ],
    keyPoints: [
      'Accounts exist to make one sentence true: I must never see your data.',
      'Authentication is who you are; authorisation is what you may do. Different questions.',
      'Every expense row stores a `user_id`, and every query will use it.',
      'Version the path (`/v1`) from the first commit.',
    ],
    remember:
      'Login is not a feature you bolt on. It is the reason the data model has a `user_id` column in it at all.',
    task: 'Write out the endpoint table and the three tables by hand. For each endpoint, write down what should happen if the caller is logged in as a different user.',
    exercises: [
      {
        task: 'List three things that could go wrong if `expenses` had no `user_id` column.',
        answer:
          'Everyone sees everyone\'s spending; you cannot delete one person\'s data; and there is no way to build a per-user report.',
      },
      {
        task: 'Decide what should happen when somebody registers with an email that already exists.',
        answer:
          '409 Conflict with a generic message. Do not say whether the account is active — that would confirm the email is registered.',
      },
      {
        task: 'Decide whether an expense amount should be stored as a float. Then look up why the answer is no.',
        answer:
          'No. `0.1 + 0.2 != 0.3` in binary floating point, so totals drift. Store whole cents in an integer.',
      },
    ],
    refs: [
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
    ],
  },

  {
    slug: 'expenses-step-1-setup',
    title: 'Step 1 — Setup, config, and the schema',
    navTitle: 'Step 1 — Setup and schema',
    oneLine: 'Fail at startup rather than at 3am, and let the database enforce what it can.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `# 1. create the project
mkdir expenses && cd expenses
go mod init github.com/you/expenses

# 2. dependencies
go get github.com/jackc/pgx/v5/stdlib
go get golang.org/x/crypto/bcrypt
go get github.com/golang-jwt/jwt/v5
go get github.com/joho/godotenv

# 3. folders and files
mkdir -p cmd/api internal/{config,database,httpx,middleware,user,expense} migrations
touch cmd/api/main.go internal/config/config.go internal/database/db.go
touch internal/httpx/json.go migrations/001_init.up.sql
touch .env .env.example
printf '.env\\n' >> .gitignore

# 4. a database
docker run -d --name exp-pg \\
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=expenses \\
  -p 5432:5432 postgres:16

# 5. apply the schema
docker exec -i exp-pg psql -U postgres -d expenses < migrations/001_init.up.sql

# 6. check it
docker exec -it exp-pg psql -U postgres -d expenses -c '\\dt'
docker exec -it exp-pg psql -U postgres -d expenses -c '\\d expenses'

# 7. run it, and prove the config check works
go run ./cmd/api
JWT_SECRET=short go run ./cmd/api        # must refuse to start`,
        },
      },
      {
        heading: 'What config means here',
        body: [
          '**Configuration** is everything that changes between your laptop and a server: the database address, the port, the secret used to sign tokens. It does not belong in the code, because then it is in your git history forever.',
          'It comes from **environment variables** — values the operating system hands your process when it starts. Read them once, at startup, check them, and pass the result down. Nothing deeper in the program should ever call `os.Getenv`.',
        ],
      },
      {
        heading: 'File 1 — internal/config/config.go',
        code: {
          label: 'internal/config/config.go — create this file',
          src: `package config

import (
\t"errors"
\t"os"

\t"github.com/joho/godotenv"
)

type Config struct {
\tPort        string
\tDatabaseURL string
\tJWTSecret   []byte
}

func Load() (*Config, error) {
\t_ = godotenv.Load()          // loads .env in development; ignored in production

\tc := &Config{
\t\tPort:        env("PORT", "8080"),
\t\tDatabaseURL: os.Getenv("DATABASE_URL"),
\t\tJWTSecret:   []byte(os.Getenv("JWT_SECRET")),
\t}

\t// Check here, so a missing value stops the deploy instead of breaking a
\t// request later.
\tif c.DatabaseURL == "" {
\t\treturn nil, errors.New("DATABASE_URL is required")
\t}
\tif len(c.JWTSecret) < 32 {
\t\treturn nil, errors.New("JWT_SECRET must be at least 32 characters")
\t}

\treturn c, nil
}

func env(key, fallback string) string {
\tif v := os.Getenv(key); v != "" {
\t\treturn v
\t}
\treturn fallback
}`,
          note: 'A short JWT secret is a real weakness, so it is checked rather than trusted. Refusing to start is the correct response.',
        },
      },
      {
        heading: 'File 2 — .env.example',
        body: [
          'Commit an example with every key and no values. The real `.env` goes in `.gitignore`. This is how the next person knows what to set without you having to tell them.',
        ],
        code: {
          label: '.env.example — create this file, and gitignore .env',
          src: `PORT=8080
DATABASE_URL=postgres://postgres:secret@localhost:5432/expenses?sslmode=disable
JWT_SECRET=replace-me-with-32-or-more-random-characters`,
        },
      },
      {
        heading: 'File 3 — the schema',
        code: {
          label: 'migrations/001_init.up.sql — create this file',
          src: `CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         CITEXT UNIQUE NOT NULL,     -- CITEXT: A@x.com equals a@x.com
  password_hash TEXT NOT NULL,              -- the hash, never the password
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  category    TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  spent_on    DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- the exact shape of "list my expenses, newest first"
CREATE INDEX ON expenses (user_id, spent_on DESC);`,
        },
      },
      {
        heading: 'Three decisions in that schema worth explaining',
        table: {
          headers: ['Decision', 'Why'],
          rows: [
            [
              '`amount_cents BIGINT`, not a decimal or float',
              'Money in a float is wrong: `0.1 + 0.2` is not `0.3` in binary. Store whole cents as an integer and divide only when displaying.',
            ],
            [
              '`REFERENCES users(id) ON DELETE CASCADE`',
              'An expense cannot point at a user who does not exist, and deleting a user removes their expenses. The database enforces it, so no Go code can forget.',
            ],
            [
              '`CHECK (amount_cents > 0)`',
              'A negative expense makes no sense here. A rule the database enforces cannot be bypassed by a bug in one handler.',
            ],
          ],
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Never store money in a `float64`. It is the classic beginner bug and it is invisible until an accountant finds it. Integer cents, or a proper decimal type — nothing else.',
        },
      },
      {
        heading: 'Dependencies for the whole project',
        code: {
          label: 'terminal',
          src: `go get github.com/jackc/pgx/v5/stdlib     # Postgres driver
go get golang.org/x/crypto/bcrypt         # password hashing
go get github.com/golang-jwt/jwt/v5       # tokens
go get github.com/joho/godotenv           # .env in development`,
          note: 'Four, for a complete API with accounts. Everything else comes with Go.',
        },
      },
    ],
    keyPoints: [
      'Read config once at startup, check it, and refuse to start when something is missing.',
      'Store money as whole cents in an integer. Never a float.',
      'Let the database enforce what it can: foreign keys, cascades, unique and check constraints.',
      'Index the query you will actually run — here, `(user_id, spent_on DESC)`.',
    ],
    remember:
      'A rule the database enforces cannot be forgotten by a handler you write six months from now.',
    task: 'Create the config package, the `.env.example`, and the schema. Start Postgres, run the migration, and check the tables with `\\d expenses` in psql. Then delete `JWT_SECRET` and confirm the app refuses to start.',
    exercises: [
      {
        task: 'Try inserting an expense with a `user_id` that does not exist and read the error.',
        answer:
          '`violates foreign key constraint`. The database refuses, so no Go bug can create an orphan row.',
      },
      {
        task: 'Try inserting a negative amount and watch the CHECK constraint reject it.',
        answer:
          '`violates check constraint`. A rule in the schema cannot be bypassed by a handler you write later.',
      },
      {
        task: 'Insert `A@x.com` then `a@x.com` and see CITEXT treat them as the same email.',
        answer:
          'The second is rejected as a duplicate. That is `CITEXT` — without it you would get two accounts for one person.',
      },
      {
        task: 'Set `JWT_SECRET` to five characters and confirm startup fails with a clear message.',
        answer:
          'The program refuses to start and says why. Failing at boot is far cheaper than failing on the first login.',
      },
    ],
    refs: [
      { label: 'Accessing databases', href: 'https://go.dev/doc/database/index' },
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
    ],
  },

  {
    slug: 'expenses-step-2-register',
    title: 'Step 2 — Register: storing a password safely',
    navTitle: 'Step 2 — Register',
    oneLine: 'What hashing is, why you can never read a password back, and how bcrypt works.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `touch internal/user/user.go internal/user/service.go
touch internal/user/repository.go internal/user/handler.go

go build ./... && go run ./cmd/api

# register
curl -s -X POST localhost:8080/v1/auth/register \\
  -d '{"name":"Sahdev","email":"a@b.c","password":"password123"}' | jq

# the same email again — must be a clean 409
curl -si -X POST localhost:8080/v1/auth/register \\
  -d '{"name":"Sahdev","email":"a@b.c","password":"password123"}' | head -1

# validation failures
curl -s -X POST localhost:8080/v1/auth/register -d '{"email":"a@b.c","password":"password123"}'
curl -s -X POST localhost:8080/v1/auth/register -d '{"name":"x","email":"a@b.c","password":"short"}'

# confirm the hash is nowhere in the response, and look at it in the database
docker exec -it exp-pg psql -U postgres -d expenses -c 'SELECT email, password_hash FROM users;'`,
        },
      },
      {
        heading: 'The problem registration has to solve',
        body: [
          'You need to check a password later, but you must never be able to read it. Those sound contradictory. Databases get stolen, backups get left on laptops, and people reuse the same password on their bank.',
          'The answer is **hashing**. A hash function turns any input into a fixed-size jumble, and it only works one way — you cannot go from the jumble back to the password. To check a login you hash the attempt and compare the two hashes. If your database is stolen, the passwords are not in it.',
        ],
      },
      {
        heading: 'Why bcrypt and not SHA-256',
        body: [
          'A normal hash like SHA-256 is designed to be **fast**, which is exactly wrong here. An attacker with your table can try billions of guesses a second.',
          '**bcrypt** is designed to be **slow** on purpose, and you can tune how slow. At its default setting one hash takes around 100 milliseconds. That is nothing when a person logs in, and it turns billions of guesses per second into a few thousand.',
          'It also handles the **salt** for you. A salt is random data mixed into each password before hashing, so two people with the same password get different hashes, and a precomputed table of common passwords is useless. bcrypt generates one and stores it inside the hash string.',
        ],
      },
      {
        heading: 'File 1 — the type and the request',
        code: {
          label: 'internal/user/user.go — create this file',
          src: `package user

import (
\t"errors"
\t"time"
)

type User struct {
\tID           int64     \`json:"id"\`
\tName         string    \`json:"name"\`
\tEmail        string    \`json:"email"\`
\tPasswordHash string    \`json:"-"\`          // "-" means: never put this in JSON
\tCreatedAt    time.Time \`json:"created_at"\`
}

// RegisterRequest is what a client may send. It is not the User type, so
// nobody can post an "id" or a "password_hash" of their own.
type RegisterRequest struct {
\tName     string \`json:"name"\`
\tEmail    string \`json:"email"\`
\tPassword string \`json:"password"\`
}

var (
\tErrNotFound           = errors.New("user not found")
\tErrEmailTaken         = errors.New("email already registered")
\tErrInvalidCredentials = errors.New("invalid credentials")
\tErrValidation         = errors.New("invalid input")
)`,
          note: 'The `json:"-"` on PasswordHash is not a nicety. It makes leaking the hash in a response impossible by accident rather than something you have to remember.',
        },
      },
      {
        heading: 'File 2 — validation',
        code: {
          label: 'internal/user/user.go — add this below',
          src: `func (r RegisterRequest) Validate() error {
\tif strings.TrimSpace(r.Name) == "" {
\t\treturn fmt.Errorf("%w: name is required", ErrValidation)
\t}
\tif !strings.Contains(r.Email, "@") || len(r.Email) > 254 {
\t\treturn fmt.Errorf("%w: a valid email is required", ErrValidation)
\t}
\tif len(r.Password) < 8 {
\t\treturn fmt.Errorf("%w: password must be at least 8 characters", ErrValidation)
\t}
\tif len(r.Password) > 72 {
\t\treturn fmt.Errorf("%w: password must be at most 72 characters", ErrValidation)
\t}
\treturn nil
}`,
          note: 'The 72 is not arbitrary: bcrypt ignores anything past 72 bytes. Without this check a long password is silently cut short, and the user never knows.',
        },
      },
      {
        heading: 'File 3 — the service does the hashing',
        code: {
          label: 'internal/user/service.go — create this file',
          src: `package user

import (
\t"context"
\t"errors"
\t"strings"

\t"golang.org/x/crypto/bcrypt"
)

type Service struct{ repo *Repository }

func NewService(r *Repository) *Service { return &Service{repo: r} }

func (s *Service) Register(ctx context.Context, req RegisterRequest) (*User, error) {
\tif err := req.Validate(); err != nil {
\t\treturn nil, err
\t}

\t// One line, and it does the salting and the slowness for you.
\thash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
\tif err != nil {
\t\treturn nil, err
\t}

\tu := &User{
\t\tName:         strings.TrimSpace(req.Name),
\t\tEmail:        strings.ToLower(strings.TrimSpace(req.Email)),
\t\tPasswordHash: string(hash),
\t}

\tif err := s.repo.Create(ctx, u); err != nil {
\t\tif errors.Is(err, ErrEmailTaken) {
\t\t\treturn nil, ErrEmailTaken
\t\t}
\t\treturn nil, err
\t}

\t// req.Password is never stored, logged or returned. It ends here.
\treturn u, nil
}`,
        },
      },
      {
        heading: 'File 4 — the repository, and letting the database decide',
        body: [
          'A tempting mistake: `SELECT` to check the email is free, then `INSERT`. Two requests can both pass that check and both insert. The **unique constraint** is the only thing that actually guarantees it, so insert and translate the failure.',
        ],
        code: {
          label: 'internal/user/repository.go — create this file',
          src: `func (r *Repository) Create(ctx context.Context, u *User) error {
\terr := r.db.QueryRowContext(ctx,
\t\t\`INSERT INTO users (name, email, password_hash)
\t\t VALUES ($1, $2, $3) RETURNING id, created_at\`,
\t\tu.Name, u.Email, u.PasswordHash,
\t).Scan(&u.ID, &u.CreatedAt)

\tif isUniqueViolation(err) {
\t\treturn ErrEmailTaken
\t}
\treturn err
}

// Postgres reports a broken unique constraint as error code 23505.
func isUniqueViolation(err error) bool {
\tvar pgErr *pgconn.PgError
\treturn errors.As(err, &pgErr) && pgErr.Code == "23505"
}`,
        },
      },
      {
        heading: 'File 5 — the handler',
        code: {
          label: 'internal/user/handler.go — create this file',
          src: `func (h *Handler) register(w http.ResponseWriter, r *http.Request) {
\tvar in RegisterRequest

\tdec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
\tdec.DisallowUnknownFields()          // a client typo becomes an error, not silence

\tif err := dec.Decode(&in); err != nil {
\t\thttpx.Error(w, 400, "invalid json")
\t\treturn
\t}

\tu, err := h.svc.Register(r.Context(), in)
\tif err != nil {
\t\tswitch {
\t\tcase errors.Is(err, ErrEmailTaken):
\t\t\thttpx.Error(w, 409, "email already registered")
\t\tcase errors.Is(err, ErrValidation):
\t\t\thttpx.Error(w, 422, err.Error())
\t\tdefault:
\t\t\tslog.Error("register failed", "err", err)   // detail to the log
\t\t\thttpx.Error(w, 500, "could not register")   // nothing useful to the client
\t\t}
\t\treturn
\t}

\thttpx.JSON(w, 201, u)                // PasswordHash cannot appear here
}`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Never log the request body on this endpoint, not even at debug level. A log line containing a plaintext password is a breach, and log stores are usually readable by far more people than the database is.',
        },
      },
    ],
    keyPoints: [
      'Hashing is one-way. You store the hash and compare hashes; you never read the password back.',
      'bcrypt is slow on purpose and salts for you. Never use SHA-256 or anything reversible for passwords.',
      '`json:"-"` on the hash makes leaking it impossible rather than something to remember.',
      'Let the unique constraint decide, then translate error 23505. Check-then-insert is a race.',
    ],
    remember:
      'After `Register` returns, the plaintext password should exist nowhere — not in a variable you kept, not in a log, not in the response.',
    task: 'Build all five files and register a user with curl. Then register the same email again and confirm you get a clean 409, not a raw Postgres error.',
    exercises: [
      {
        task: 'Print the bcrypt hash of the same password twice and see that they differ — that is the salt.',
        answer:
          'Two different strings. The salt is generated per hash and stored inside it — which is why rainbow tables do not work.',
      },
      {
        task: 'Time `bcrypt.GenerateFromPassword` at cost 10, 12 and 14.',
        answer:
          'Roughly 60ms, 250ms, 1s — each step doubles. That cost is the feature; do not lower it to make a benchmark look good.',
      },
      {
        task: 'Send a 100-character password and confirm your validation rejects it instead of bcrypt quietly cutting it short.',
        answer:
          'Your validation rejects it. Without that check bcrypt silently ignores everything past 72 bytes, so the extra characters do nothing.',
      },
      {
        task: 'Check the register response body and confirm no hash appears anywhere in it.',
        answer:
          'No `password_hash` anywhere, because of `json:"-"`. If you see one, that tag is missing.',
      },
    ],
    refs: [
      { label: 'bcrypt', href: 'https://pkg.go.dev/golang.org/x/crypto/bcrypt' },
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
    ],
  },

  {
    slug: 'expenses-step-3-login',
    title: 'Step 3 — Login and what a token is',
    navTitle: 'Step 3 — Login and JWT',
    oneLine: 'Check a password without unhashing it, and hand back proof for the next request.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `touch internal/user/token.go

go build ./... && go run ./cmd/api

# log in and keep the token
TOKEN=$(curl -s -X POST localhost:8080/v1/auth/login \\
  -d '{"email":"a@b.c","password":"password123"}' | jq -r .access_token)
echo $TOKEN

# read your own claims — this is the lesson
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null; echo

# wrong password, and an email that does not exist: identical answers
curl -s -X POST localhost:8080/v1/auth/login -d '{"email":"a@b.c","password":"wrong"}'
curl -s -X POST localhost:8080/v1/auth/login -d '{"email":"no@x.c","password":"wrong"}'

# and similar timing
time curl -s -o /dev/null -X POST localhost:8080/v1/auth/login -d '{"email":"a@b.c","password":"wrong"}'
time curl -s -o /dev/null -X POST localhost:8080/v1/auth/login -d '{"email":"no@x.c","password":"wrong"}'`,
        },
      },
      {
        heading: 'Why a token is needed at all',
        body: [
          'HTTP has no memory. Each request arrives on its own, and the server has no idea it is the same person who logged in a moment ago. Without something to carry, every single request would have to include the password — which means the client stores it, and every request pays the bcrypt cost.',
          'So logging in hands back a **token**: a piece of text the client sends with later requests to prove who it is.',
        ],
      },
      {
        heading: 'What a JWT is',
        body: [
          'This project uses a **JWT** — a JSON Web Token. It is three chunks of base64 joined by dots: a header, a payload, and a signature.',
          'The **payload** holds a few facts, called **claims** — here, the user id and an expiry time. The **signature** is made from the first two parts plus a secret only your server knows. Change any part of the token and the signature no longer matches, so your server can trust it without looking anything up.',
          'That last part is the appeal. Checking a session in a database costs a query on every request; checking a signature costs nothing.',
        ],
        code: {
          label: 'what a token looks like',
          src: `eyJhbGciOiJIUzI1NiJ9  .  eyJzdWIiOiI0MiIsImV4cCI6MTc...  .  4pRXK9Bv2hZ...
└──── header ────┘      └──────── payload ────────┘      └── signature ──┘
  which algorithm            the claims: sub, exp          proof of the above`,
          note: 'Paste the middle chunk into any base64 decoder and you can read it. That is not a bug — see the warning below.',
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'A JWT is **signed, not encrypted**. Anyone holding it can read the payload. The signature only proves nobody changed it. Put an id in there and nothing else — never a password, never an email you would not want leaked, never anything secret.',
        },
      },
      {
        heading: 'File 1 — checking the password',
        code: {
          label: 'internal/user/service.go — add this',
          src: `func (s *Service) Login(ctx context.Context, email, password string) (string, error) {
\tu, err := s.repo.ByEmail(ctx, strings.ToLower(strings.TrimSpace(email)))
\tif err != nil {
\t\t// Hash anyway, so a missing account takes as long as a wrong password.
\t\tbcrypt.CompareHashAndPassword(dummyHash, []byte(password))
\t\treturn "", ErrInvalidCredentials
\t}

\t// Hashes the attempt with the salt stored inside u.PasswordHash and compares
\t// in constant time. Nothing is ever unhashed.
\tif bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)) != nil {
\t\treturn "", ErrInvalidCredentials     // the SAME error as above
\t}

\treturn s.issueToken(u.ID)
}`,
          note: 'Both failures return the identical error, and the dummy hash makes them take a similar amount of time.',
        },
      },
      {
        heading: 'Why both failures must look the same',
        body: [
          'If "no such account" and "wrong password" give different messages, anyone can feed your login a list of emails and learn which ones have accounts here. That is a privacy leak on its own, and it is the first step of a targeted attack.',
          'Timing counts too. If a missing account returns instantly while a wrong password takes 100ms of bcrypt, the difference is measurable — so you hash against a throwaway value in the missing case as well.',
        ],
      },
      {
        heading: 'File 2 — issuing the token',
        code: {
          label: 'internal/user/token.go — create this file',
          src: `package user

import (
\t"strconv"
\t"time"

\t"github.com/golang-jwt/jwt/v5"
)

func (s *Service) issueToken(userID int64) (string, error) {
\tclaims := jwt.RegisteredClaims{
\t\tSubject:   strconv.FormatInt(userID, 10),   // "sub" — who this is about
\t\tIssuedAt:  jwt.NewNumericDate(time.Now()),
\t\tExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
\t}

\treturn jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secret)
}`,
        },
      },
      {
        heading: 'Why only fifteen minutes',
        body: [
          'Here is the catch with JWTs: **you cannot cancel one.** Once signed it stays valid until it expires. There is no list to remove it from — and if you added one, you would be doing a database lookup on every request, which is the thing the JWT was meant to avoid.',
          'So the token is short-lived. Fifteen minutes means a stolen token is useful for fifteen minutes. Step 7 adds a **refresh token**: long-lived, stored in the database, and therefore cancellable. The short token does the work; the long one can be revoked.',
        ],
      },
      {
        heading: 'File 3 — the handler',
        code: {
          label: 'internal/user/handler.go — add this',
          src: `func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
\tvar in struct {
\t\tEmail    string \`json:"email"\`
\t\tPassword string \`json:"password"\`
\t}

\tif err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&in); err != nil {
\t\thttpx.Error(w, 400, "invalid json")
\t\treturn
\t}

\ttoken, err := h.svc.Login(r.Context(), in.Email, in.Password)
\tif err != nil {
\t\thttpx.Error(w, 401, "invalid credentials")   // never say which part was wrong
\t\treturn
\t}

\thttpx.JSON(w, 200, map[string]any{
\t\t"access_token": token,
\t\t"token_type":   "Bearer",
\t\t"expires_in":   900,              // seconds, so the client knows when to refresh
\t})
}`,
        },
      },
      {
        heading: 'Try it, then read your own token',
        code: {
          label: 'terminal',
          src: `TOKEN=$(curl -s -X POST localhost:8080/v1/auth/login \\
  -d '{"email":"a@b.c","password":"password123"}' | jq -r .access_token)

# Decode the middle chunk yourself
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null
# {"sub":"1","iat":1757...,"exp":1757...}

# Wrong password, and an email that does not exist — identical responses
curl -s -X POST localhost:8080/v1/auth/login -d '{"email":"a@b.c","password":"wrong"}'
curl -s -X POST localhost:8080/v1/auth/login -d '{"email":"nope@x.c","password":"wrong"}'`,
          note: 'Seeing your own user id in plain text is the lesson. That is what "signed, not encrypted" means in practice.',
        },
      },
    ],
    keyPoints: [
      'HTTP has no memory, so login hands back a token that later requests carry.',
      'A JWT payload is readable by anyone. The signature only proves it was not altered.',
      'Return the identical error and similar timing for a missing account and a wrong password.',
      'A JWT cannot be cancelled, so it is short-lived. Revoking is the refresh token’s job.',
    ],
    remember:
      'You never unhash a password. You hash the attempt and compare — which is why a stolen database gives an attacker very little.',
    task: 'Add login and get a token back. Decode the payload yourself and read the claims. Then check that a wrong password and an unknown email give byte-identical responses.',
    exercises: [
      {
        task: 'Set the expiry to 10 seconds, wait, and confirm the token stops working.',
        answer:
          '`token is expired`. The middleware rejects it with 401 — expiry is checked by the library, not by you.',
      },
      {
        task: 'Change one character in the middle of a token and confirm it is rejected.',
        answer:
          '401. The signature covers the header and payload, so any change invalidates it.',
      },
      {
        task: 'Time a login with a real email and with an unknown one. They should be close.',
        answer:
          'They should be within a few milliseconds. A large gap lets someone work out which emails have accounts.',
      },
      {
        task: 'Work out what an attacker gains from a stolen token, and what they do not.',
        answer:
          'Your account for up to fifteen minutes. They do not get your password, and they cannot mint new tokens without the server secret.',
      },
    ],
    refs: [
      { label: 'golang-jwt', href: 'https://pkg.go.dev/github.com/golang-jwt/jwt/v5' },
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
    ],
  },

  {
    slug: 'expenses-step-4-middleware',
    title: 'Step 4 — Checking the token on every request',
    navTitle: 'Step 4 — Auth middleware',
    oneLine: 'One middleware, at the edge, so no handler ever has to remember.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `touch internal/middleware/auth.go

go build ./... && go run ./cmd/api

# no token
curl -si localhost:8080/v1/me | head -1                                   # 401
# rubbish token
curl -si -H "Authorization: Bearer rubbish" localhost:8080/v1/me | head -1  # 401
# valid token
curl -si -H "Authorization: Bearer $TOKEN" localhost:8080/v1/me | head -1   # 200

# tampered signature
BAD="\${TOKEN%?}X"
curl -si -H "Authorization: Bearer $BAD" localhost:8080/v1/me | head -1     # 401`,
        },
      },
      {
        heading: 'The problem',
        body: [
          'Every protected route has the same four questions: is a token present, is the signature valid, has it expired, and which user is it? Writing that in ten handlers means repeating it ten times and forgetting it once — and forgetting it once is a security hole, not a bug.',
          'So it goes in **middleware**: one function that wraps a handler, runs before it, and either rejects the request or lets it through.',
        ],
      },
      {
        heading: 'How the client sends the token',
        code: {
          label: 'the convention',
          src: `Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.4pRXK...

# "Bearer" means: whoever bears this token is treated as that user.
# Which is exactly why it must travel over HTTPS and never appear in a URL.`,
        },
      },
      {
        heading: 'File 1 — the middleware',
        code: {
          label: 'internal/middleware/auth.go — create this file',
          src: `package middleware

// An unexported type, so no other package can collide with or read our key.
type ctxKey struct{}

func RequireAuth(secret []byte) func(http.Handler) http.Handler {
\treturn func(next http.Handler) http.Handler {
\t\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\t\traw, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
\t\t\tif !ok || raw == "" {
\t\t\t\thttpx.Error(w, 401, "missing bearer token")
\t\t\t\treturn
\t\t\t}

\t\t\ttok, err := jwt.ParseWithClaims(raw, &jwt.RegisteredClaims{},
\t\t\t\tfunc(t *jwt.Token) (any, error) {
\t\t\t\t\t// CRITICAL — see the warning below
\t\t\t\t\tif _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
\t\t\t\t\t\treturn nil, errors.New("unexpected signing method")
\t\t\t\t\t}
\t\t\t\t\treturn secret, nil
\t\t\t\t})

\t\t\tif err != nil || !tok.Valid {
\t\t\t\thttpx.Error(w, 401, "invalid token")
\t\t\t\treturn
\t\t\t}

\t\t\tsub, err := tok.Claims.GetSubject()
\t\t\tid, convErr := strconv.ParseInt(sub, 10, 64)
\t\t\tif err != nil || convErr != nil {
\t\t\t\thttpx.Error(w, 401, "invalid token")
\t\t\t\treturn
\t\t\t}

\t\t\t// Pass the user id down to the handler through the context.
\t\t\tctx := context.WithValue(r.Context(), ctxKey{}, id)
\t\t\tnext.ServeHTTP(w, r.WithContext(ctx))
\t\t})
\t}
}

// UserID is the only way any other package reads it.
func UserID(ctx context.Context) (int64, bool) {
\tid, ok := ctx.Value(ctxKey{}).(int64)
\treturn id, ok
}`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'That signing-method check is not optional. Without it an attacker sends a token whose header says `"alg": "none"`, the library accepts an unsigned token, and they can log in as any user they like. It is a complete authentication bypass and it has shipped in real products more than once.',
        },
      },
      {
        heading: 'Why the context key is a struct',
        body: [
          'Context values live in an untyped map. If the key were the string `"userID"`, any other package — including a library you did not write — could use the same string and either read your value or overwrite it.',
          'An unexported type fixes it completely. `ctxKey{}` from your package is a different key from `ctxKey{}` in anyone else’s, because the types differ. Export a typed function like `UserID` and never export the key itself.',
        ],
      },
      {
        heading: 'File 2 — applying it, one route at a time',
        code: {
          label: 'cmd/api/main.go',
          src: `protect := middleware.RequireAuth(cfg.JWTSecret)

// public
mux.HandleFunc("POST /v1/auth/register", userH.Register)
mux.HandleFunc("POST /v1/auth/login", userH.Login)

// protected — mux.Handle, because protect returns an http.Handler
mux.Handle("GET /v1/me", protect(http.HandlerFunc(userH.Me)))
mux.Handle("POST /v1/expenses", protect(http.HandlerFunc(expH.Create)))
mux.Handle("GET /v1/expenses", protect(http.HandlerFunc(expH.List)))`,
          note: 'Wrapping route by route is on purpose. "Protect everything under /v1 except these two" is easy to get subtly wrong, and a route that ends up public by accident is the worst bug in the file.',
        },
      },
      {
        heading: 'File 3 — reading it in a handler',
        code: {
          label: 'internal/user/handler.go',
          src: `func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
\tuserID, ok := middleware.UserID(r.Context())
\tif !ok {
\t\thttpx.Error(w, 401, "unauthorized")     // belt and braces
\t\treturn
\t}

\tu, err := h.svc.GetByID(r.Context(), userID)
\tif err != nil {
\t\thttpx.FromError(w, err)
\t\treturn
\t}
\thttpx.JSON(w, 200, u)
}`,
        },
      },
      {
        heading: 'Prove it works, including the attacks',
        code: {
          label: 'terminal',
          src: `curl -si localhost:8080/v1/me | head -1
# 401 — no token

curl -si -H "Authorization: Bearer rubbish" localhost:8080/v1/me | head -1
# 401 — not a token

curl -si -H "Authorization: Bearer $TOKEN" localhost:8080/v1/me | head -1
# 200 — and the body is your own user

# change one character of the signature
BAD="\${TOKEN%?}X"
curl -si -H "Authorization: Bearer $BAD" localhost:8080/v1/me | head -1
# 401 — the signature no longer matches`,
        },
      },
    ],
    keyPoints: [
      'Check the token once, in middleware, so no handler can forget to.',
      'Always assert the signing method, or `alg: none` gives an attacker any account.',
      'Use an unexported struct type as the context key, and export a typed accessor.',
      'Wrap protected routes individually so nothing becomes public by accident.',
    ],
    remember:
      'Authentication happens once, at the edge. Everything downstream reads the user id from the context and never parses a token again.',
    task: 'Add the middleware and `GET /v1/me`. Then run all four curl checks above, including the tampered signature.',
    exercises: [
      {
        task: 'Hand-craft a token with `"alg":"none"` and confirm yours rejects it.',
        answer:
          '401, because the key function asserts HMAC. Remove that check and the same token is accepted as whoever it claims to be.',
      },
      {
        task: 'Remove the signing-method check, try the same token, and see the bypass for yourself. Then put it back.',
        answer:
          'It is accepted. That is a complete authentication bypass — then put the check back.',
      },
      {
        task: 'Register a route without `protect` and see how easy that is to miss in a diff.',
        answer:
          'It works for anyone, with no error and no warning. This is why routes are wrapped one at a time rather than by prefix.',
      },
      {
        task: 'Call `middleware.UserID` from a handler that is not behind the middleware and handle the `false`.',
        answer:
          '`ok` is false and the id is zero. Always check the bool — a zero user id would silently read row 0.',
      },
    ],
    refs: [
      { label: 'Go blog: Context', href: 'https://go.dev/blog/context' },
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
    ],
  },

  {
    slug: 'expenses-step-5-crud',
    title: 'Step 5 — Expenses, locked to their owner',
    navTitle: 'Step 5 — Owner-scoped CRUD',
    oneLine: 'CRUD again — but now every single query has to know whose data it is.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `touch internal/expense/expense.go internal/expense/repository.go
touch internal/expense/service.go internal/expense/handler.go

go build ./... && go run ./cmd/api

# create one
curl -s -X POST localhost:8080/v1/expenses -H "Authorization: Bearer $TOKEN" \\
  -d '{"amount_cents":1250,"category":"food","note":"lunch","spent_on":"2026-09-08"}' | jq

# the cross-user check — register a second user first
B=$(curl -s -X POST localhost:8080/v1/auth/register \\
  -d '{"name":"B","email":"b@x.c","password":"password123"}' >/dev/null; \\
    curl -s -X POST localhost:8080/v1/auth/login \\
  -d '{"email":"b@x.c","password":"password123"}' | jq -r .access_token)

# all three MUST be 404
curl -si -H "Authorization: Bearer $B" localhost:8080/v1/expenses/1 | head -1
curl -si -X PATCH -H "Authorization: Bearer $B" localhost:8080/v1/expenses/1 -d '{"note":"x"}' | head -1
curl -si -X DELETE -H "Authorization: Bearer $B" localhost:8080/v1/expenses/1 | head -1`,
        },
      },
      {
        heading: 'The rule this whole project exists for',
        body: [
          'Requests now carry a user id. Every query must use it. There are two places you could do that check, and only one of them actually works.',
        ],
        code: {
          label: 'the wrong way and the right way',
          src: `// WRONG — two statements, and a check somebody will forget to write
e, err := repo.GetByID(ctx, expenseID)
if e.UserID != userID {
\treturn ErrForbidden
}

// RIGHT — one query. Not yours and not there give the same answer.
SELECT id, amount_cents, category FROM expenses WHERE id = $1 AND user_id = $2`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'The wrong version has a name: **IDOR**, Insecure Direct Object Reference. Someone changes `/expenses/41` to `/expenses/42` and reads a stranger’s spending. It is one of the most common real vulnerabilities in web APIs, and putting `AND user_id = $2` in the SQL means you cannot forget it.',
        },
      },
      {
        heading: 'Why 404 and not 403',
        body: [
          'When somebody asks for an expense that is not theirs, return **404 Not Found**, not 403 Forbidden. A 403 confirms the row exists — so an attacker can map out which ids are real even without reading them. Not yours and not there should be indistinguishable.',
        ],
      },
      {
        heading: 'File 1 — the type',
        code: {
          label: 'internal/expense/expense.go — create this file',
          src: `package expense

type Expense struct {
\tID          int64     \`json:"id"\`
\tUserID      int64     \`json:"-"\`              // internal; the client knows who it is
\tAmountCents int64     \`json:"amount_cents"\`
\tCategory    string    \`json:"category"\`
\tNote        string    \`json:"note"\`
\tSpentOn     time.Time \`json:"spent_on"\`
\tCreatedAt   time.Time \`json:"created_at"\`
}

type CreateRequest struct {
\tAmountCents int64  \`json:"amount_cents"\`
\tCategory    string \`json:"category"\`
\tNote        string \`json:"note"\`
\tSpentOn     string \`json:"spent_on"\`          // "2026-09-08"
}

// UpdateRequest uses pointers so "not sent" and "sent as empty" are different.
type UpdateRequest struct {
\tAmountCents *int64  \`json:"amount_cents"\`
\tCategory    *string \`json:"category"\`
\tNote        *string \`json:"note"\`
}`,
          note: 'UserID has json:"-" because the client never sets it and never needs to see it. It comes from the token, not the body.',
        },
      },
      {
        heading: 'File 2 — the repository, every method taking a userID',
        code: {
          label: 'internal/expense/repository.go — create this file',
          src: `// Notice: EVERY method takes userID. There is no way to call one without it.
func (r *Repository) GetByID(ctx context.Context, id, userID int64) (*Expense, error) {
\tvar e Expense
\terr := r.db.QueryRowContext(ctx,
\t\t\`SELECT id, user_id, amount_cents, category, note, spent_on, created_at
\t\t   FROM expenses WHERE id = $1 AND user_id = $2\`,
\t\tid, userID,
\t).Scan(&e.ID, &e.UserID, &e.AmountCents, &e.Category, &e.Note, &e.SpentOn, &e.CreatedAt)

\tif errors.Is(err, sql.ErrNoRows) {
\t\treturn nil, ErrNotFound        // covers both "not there" and "not yours"
\t}
\treturn &e, err
}

func (r *Repository) Delete(ctx context.Context, id, userID int64) error {
\tres, err := r.db.ExecContext(ctx,
\t\t\`DELETE FROM expenses WHERE id = $1 AND user_id = $2\`, id, userID)
\tif err != nil {
\t\treturn err
\t}
\tif n, _ := res.RowsAffected(); n == 0 {
\t\treturn ErrNotFound
\t}
\treturn nil
}`,
          note: 'Making userID a required parameter of every method is a small design choice that makes the mistake hard to make.',
        },
      },
      {
        heading: 'File 3 — the service, with the rules',
        code: {
          label: 'internal/expense/service.go — create this file',
          src: `func (s *Service) Create(ctx context.Context, userID int64, req CreateRequest) (*Expense, error) {
\tif req.AmountCents <= 0 {
\t\treturn nil, fmt.Errorf("%w: amount must be more than zero", ErrValidation)
\t}
\tif strings.TrimSpace(req.Category) == "" {
\t\treturn nil, fmt.Errorf("%w: category is required", ErrValidation)
\t}

\tspentOn, err := time.Parse("2006-01-02", req.SpentOn)
\tif err != nil {
\t\treturn nil, fmt.Errorf("%w: spent_on must look like 2026-09-08", ErrValidation)
\t}
\tif spentOn.After(time.Now()) {
\t\treturn nil, fmt.Errorf("%w: cannot record a future expense", ErrValidation)
\t}

\te := &Expense{
\t\tUserID:      userID,                    // from the token, never from the body
\t\tAmountCents: req.AmountCents,
\t\tCategory:    strings.ToLower(strings.TrimSpace(req.Category)),
\t\tNote:        req.Note,
\t\tSpentOn:     spentOn,
\t}
\treturn e, s.repo.Create(ctx, e)
}`,
          note: 'The Go date layout really is "2006-01-02" — it is a reference date, not a format string. It reads oddly and you will look it up more than once.',
        },
      },
      {
        heading: 'File 4 — the handler',
        code: {
          label: 'internal/expense/handler.go — create this file',
          src: `func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
\tuserID, ok := middleware.UserID(r.Context())
\tif !ok {
\t\thttpx.Error(w, 401, "unauthorized")
\t\treturn
\t}

\tid, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
\tif err != nil {
\t\thttpx.Error(w, 400, "invalid id")
\t\treturn
\t}

\te, err := h.svc.GetByID(r.Context(), id, userID)   // both ids, always
\tif err != nil {
\t\thttpx.FromError(w, err)                        // ErrNotFound becomes 404
\t\treturn
\t}

\thttpx.JSON(w, 200, e)
}`,
        },
      },
      {
        heading: 'Partial updates and why they need pointers',
        body: [
          '**PUT** replaces a whole resource. **PATCH** changes some of it. The problem in Go is telling "the client set the note to empty" apart from "the client did not mention the note" — both arrive as `""`.',
          'A pointer answers it. `nil` means the field was absent from the JSON; a pointer to an empty string means they sent it and meant it.',
        ],
        code: {
          label: 'internal/expense/service.go',
          src: `func (s *Service) Update(ctx context.Context, id, userID int64, req UpdateRequest) (*Expense, error) {
\te, err := s.repo.GetByID(ctx, id, userID)     // scoped read first
\tif err != nil {
\t\treturn nil, err
\t}

\tif req.AmountCents != nil {
\t\tif *req.AmountCents <= 0 {
\t\t\treturn nil, fmt.Errorf("%w: amount must be more than zero", ErrValidation)
\t\t}
\t\te.AmountCents = *req.AmountCents
\t}
\tif req.Category != nil {
\t\te.Category = strings.ToLower(*req.Category)
\t}
\tif req.Note != nil {
\t\te.Note = *req.Note                        // "" is a real value here
\t}

\treturn e, s.repo.Update(ctx, e, userID)
}`,
        },
      },
      {
        heading: 'The test you must run by hand',
        code: {
          label: 'terminal',
          src: `# as user A
A=$(login a@x.com); ID=$(create_expense $A)

# as user B — all three must be 404
curl -si -H "Authorization: Bearer $B" localhost:8080/v1/expenses/$ID | head -1
curl -si -X PATCH -H "Authorization: Bearer $B" localhost:8080/v1/expenses/$ID | head -1
curl -si -X DELETE -H "Authorization: Bearer $B" localhost:8080/v1/expenses/$ID | head -1`,
        },
      },
    ],
    keyPoints: [
      'Put ownership in the SQL: `WHERE id = $1 AND user_id = $2`. Never a separate check in Go.',
      'Return 404 for someone else’s row. A 403 confirms it exists.',
      'Make `userID` a required parameter of every repository method so it cannot be skipped.',
      'Pointer fields in a PATCH request separate "not sent" from "sent as empty".',
    ],
    remember:
      'If the ownership check lives in Go, someone will eventually write a query that skips it. If it lives in the WHERE clause, they cannot.',
    task: 'Build all five expense endpoints. Then create an expense as user A and try to read, change and delete it as user B. All three must return 404.',
    exercises: [
      {
        task: 'Remove `AND user_id = $2` from one query and re-run that test to watch it fail.',
        answer:
          'The cross-user test fails immediately with a 200 where you expected 404. That test is the only thing standing between you and an IDOR.',
      },
      {
        task: 'Try to create an expense with someone else’s `user_id` in the JSON body and confirm it is ignored.',
        answer:
          'Ignored. The user id comes from the token, and `CreateRequest` has no such field — that is why the request type is not the model.',
      },
      {
        task: 'Send a future date and confirm it is rejected.',
        answer:
          '422 with your message. Whether future expenses are valid is a product decision — the point is that you decided.',
      },
      {
        task: 'PATCH with `{}`, then `{"note":""}`, then `{"note":"x"}` — three different outcomes from one pointer field.',
        answer:
          'Nothing changes; the note is cleared; the note is set. One pointer field gives you all three.',
      },
    ],
    refs: [
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
      { label: 'time.Parse layouts', href: 'https://pkg.go.dev/time#pkg-constants' },
    ],
  },

  {
    slug: 'expenses-step-6-reports',
    title: 'Step 6 — Filtering, paging, and a monthly report',
    navTitle: 'Step 6 — Reports',
    oneLine: 'Let the database do the counting, and never return an unbounded list.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `touch internal/httpx/params.go

go build ./... && go run ./cmd/api

# filtering and paging
curl -s -H "Authorization: Bearer $TOKEN" 'localhost:8080/v1/expenses?limit=5&offset=0' | jq
curl -s -H "Authorization: Bearer $TOKEN" 'localhost:8080/v1/expenses?category=food' | jq
curl -s -H "Authorization: Bearer $TOKEN" 'localhost:8080/v1/expenses?limit=100000' | jq 'length'

# the report
curl -s -H "Authorization: Bearer $TOKEN" 'localhost:8080/v1/reports/monthly?month=2026-09-01' | jq

# check the index is actually used
docker exec -it exp-pg psql -U postgres -d expenses -c \\
  'EXPLAIN ANALYZE SELECT * FROM expenses WHERE user_id=1 ORDER BY spent_on DESC LIMIT 20;'`,
        },
      },
      {
        heading: 'What pagination is and why it is not optional',
        body: [
          '**Pagination** means returning one page of results instead of everything. `limit` says how many, `offset` says how many to skip.',
          'It is not a feature you add when the data grows. An endpoint with no limit works perfectly with fifty rows and takes the server down at fifty thousand — and by then it is in production and other people depend on the response shape.',
        ],
        code: {
          label: 'internal/httpx/params.go — create this file',
          src: `// IntParam reads a query parameter, falls back to def, and clamps the range.
func IntParam(r *http.Request, key string, def, min, max int) int {
\tv, err := strconv.Atoi(r.URL.Query().Get(key))
\tif err != nil {
\t\treturn def
\t}
\treturn Clamp(v, min, max)
}

// in the handler:
limit := httpx.IntParam(r, "limit", 20, 1, 100)      // hard ceiling of 100
offset := httpx.IntParam(r, "offset", 0, 0, 1_000_000)`,
          note: 'Clamp rather than reject. A client asking for 5000 gets 100 back, not a 400 they have to write code to handle.',
        },
      },
      {
        heading: 'Filtering without opening a hole',
        body: [
          'Users will want expenses by category and by date range. The tempting way to build a query with optional filters is to join strings together — and that is exactly how SQL injection happens.',
          'Build the **conditions** as fixed strings and collect the **values** separately, so every value still travels as a placeholder.',
        ],
        code: {
          label: 'internal/expense/repository.go',
          src: `func (r *Repository) List(ctx context.Context, userID int64, f Filter) ([]Expense, error) {
\t// $1 is always the user id. It is never optional.
\twhere := []string{"user_id = $1"}
\targs := []any{userID}

\tif f.Category != "" {
\t\targs = append(args, f.Category)
\t\twhere = append(where, fmt.Sprintf("category = $%d", len(args)))
\t}
\tif !f.From.IsZero() {
\t\targs = append(args, f.From)
\t\twhere = append(where, fmt.Sprintf("spent_on >= $%d", len(args)))
\t}

\targs = append(args, f.Limit, f.Offset)
\tq := fmt.Sprintf(\`
\t\tSELECT id, amount_cents, category, note, spent_on, created_at
\t\t  FROM expenses WHERE %s
\t\t ORDER BY spent_on DESC, id DESC
\t\t LIMIT $%d OFFSET $%d\`,
\t\tstrings.Join(where, " AND "), len(args)-1, len(args))

\trows, err := r.db.QueryContext(ctx, q, args...)
\t...
}`,
          note: 'The Sprintf here only ever inserts placeholder numbers like $2 and $3 — never a user value. Every actual value still goes through args.',
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Read that code twice. `fmt.Sprintf` near SQL is normally the injection warning sign — it is safe here **only** because the pieces being formatted in are `$2`, `$3` and fixed column names that you wrote. The moment a value from the request goes into that Sprintf, you have a vulnerability. If in doubt, do not do it.',
        },
      },
      {
        heading: 'The monthly report',
        body: [
          'A report is a question: how much did I spend per category last month? You could load every row and add them up in Go. Do not — the database can do it in one query, and it will do it faster than you can transfer the rows.',
        ],
        code: {
          label: 'internal/expense/repository.go — add this',
          src: `type CategoryTotal struct {
\tCategory string \`json:"category"\`
\tTotal    int64  \`json:"total_cents"\`
\tCount    int64  \`json:"count"\`
}

func (r *Repository) MonthlyReport(ctx context.Context, userID int64, month time.Time) ([]CategoryTotal, error) {
\trows, err := r.db.QueryContext(ctx, \`
\t\tSELECT category, SUM(amount_cents) AS total, COUNT(*) AS n
\t\t  FROM expenses
\t\t WHERE user_id = $1
\t\t   AND spent_on >= $2
\t\t   AND spent_on <  ($2::date + INTERVAL '1 month')
\t\t GROUP BY category
\t\t ORDER BY total DESC\`,
\t\tuserID, month)
\tif err != nil {
\t\treturn nil, err
\t}
\tdefer rows.Close()

\tvar out []CategoryTotal
\tfor rows.Next() {
\t\tvar c CategoryTotal
\t\tif err := rows.Scan(&c.Category, &c.Total, &c.Count); err != nil {
\t\t\treturn nil, err
\t\t}
\t\tout = append(out, c)
\t}
\treturn out, rows.Err()
}`,
          note: 'GROUP BY plus SUM is the database doing in one round trip what would otherwise be thousands of rows over the network and a loop in Go.',
        },
      },
      {
        heading: 'The mistake to avoid: N+1',
        body: [
          'Suppose you list twenty expenses and then, for each one, run a query to fetch something extra. That is 1 + 20 = 21 round trips. At two hundred expenses it is 201, and your endpoint takes seconds for reasons invisible in the Go code — the loop looks perfectly innocent.',
          'This is called the **N+1 problem**, and it is the most common real performance bug in web applications in every language. The fix is a `JOIN`, or one extra query that fetches everything at once with `WHERE id = ANY($1)`.',
        ],
      },
    ],
    keyPoints: [
      'Paginate from the first version, with a hard maximum, and clamp instead of rejecting.',
      'Build optional filters as fixed condition strings with the values in a separate args slice.',
      'Let the database aggregate. `GROUP BY` and `SUM` beat loading rows and looping.',
      'A query inside a loop is N+1 — the most common real performance bug there is.',
    ],
    remember:
      'Every list endpoint needs a ceiling, and every total belongs in the database. Both are much harder to add once people depend on your API.',
    task: 'Add filtering by category and date range, pagination on the list, and the monthly report. Check `EXPLAIN ANALYZE` on the list query and confirm it uses your `(user_id, spent_on DESC)` index.',
    exercises: [
      {
        task: 'Insert 5,000 expenses and compare the list endpoint with and without the index.',
        answer:
          'With the index it stays sub-millisecond; without it Postgres scans the whole table and sorts. `EXPLAIN ANALYZE` shows which.',
      },
      {
        task: 'Write the report the wrong way — load all rows, sum in Go — and time both.',
        answer:
          'Loading every row and summing in Go is slower and uses far more memory, because thousands of rows cross the network first.',
      },
      {
        task: 'Add a `?category=` filter and check that a category containing a quote cannot break the query.',
        answer:
          'It cannot, because the value travels as `$2`. Only the placeholder number is formatted into the query string.',
      },
      {
        task: 'Try `?limit=100000` and confirm your clamp caps it.',
        answer:
          'You get 100 rows. Clamping means the client never has to handle an error for asking too much.',
      },
    ],
    refs: [
      { label: 'Querying for data', href: 'https://go.dev/doc/database/querying' },
      { label: 'Avoiding SQL injection risk', href: 'https://go.dev/doc/database/sql-injection' },
    ],
  },

  {
    slug: 'expenses-step-7-refresh',
    title: 'Step 7 — Refresh tokens and logout',
    navTitle: 'Step 7 — Refresh tokens',
    oneLine: 'Make sessions endable, without a database lookup on every request.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `mkdir -p internal/auth
touch internal/auth/refresh.go internal/auth/service.go

go build ./... && go run ./cmd/api

# log in and keep both tokens
RESP=$(curl -s -X POST localhost:8080/v1/auth/login -d '{"email":"a@b.c","password":"password123"}')
ACCESS=$(echo $RESP | jq -r .access_token)
REFRESH=$(echo $RESP | jq -r .refresh_token)

# refresh once — works
curl -s -X POST localhost:8080/v1/auth/refresh -d "{\\"refresh_token\\":\\"$REFRESH\\"}" | jq

# use the SAME refresh token again — must fail, that is rotation
curl -si -X POST localhost:8080/v1/auth/refresh -d "{\\"refresh_token\\":\\"$REFRESH\\"}" | head -1

# nothing in the table can be used to log in
docker exec -it exp-pg psql -U postgres -d expenses -c 'SELECT token_hash, revoked_at FROM refresh_tokens;'`,
        },
      },
      {
        heading: 'The gap left in step 3',
        body: [
          'Your access token cannot be cancelled. If somebody steals it, or a user clicks "log out", the token keeps working until it expires. Fifteen minutes limits that, but "log out" doing nothing is not acceptable.',
          'The standard answer is **two tokens**. A short **access token** — the JWT you already have, never checked against the database. And a long **refresh token**: random, stored in the database, cancellable, and useful for exactly one thing, getting a new access token.',
        ],
        table: {
          headers: ['', 'Access token', 'Refresh token'],
          rows: [
            ['Lifetime', '15 minutes', '7 days'],
            ['Form', 'a signed JWT', 'random bytes, no meaning'],
            ['Stored server-side?', 'no', 'yes — as a hash'],
            ['Checked against the database?', 'never', 'on every use'],
            ['Can be cancelled?', 'no', 'yes'],
            ['Sent with normal requests?', 'yes', 'no — only to `/auth/refresh`'],
          ],
        },
      },
      {
        heading: 'File 1 — issuing one, and storing only the hash',
        code: {
          label: 'internal/auth/refresh.go — create this file',
          src: `func (s *Service) issueRefresh(ctx context.Context, userID int64) (string, error) {
\tvar b [32]byte
\tif _, err := rand.Read(b[:]); err != nil {        // crypto/rand
\t\treturn "", err
\t}
\ttoken := base64.RawURLEncoding.EncodeToString(b[:])

\t// Store the HASH, never the token itself.
\tsum := sha256.Sum256([]byte(token))
\t_, err := s.db.ExecContext(ctx,
\t\t\`INSERT INTO refresh_tokens (token_hash, user_id, expires_at)
\t\t VALUES ($1, $2, $3)\`,
\t\thex.EncodeToString(sum[:]), userID, time.Now().Add(7*24*time.Hour))

\treturn token, err        // the raw token goes to the client exactly once
}`,
          note: 'Same idea as a password: if somebody steals the table they get hashes, which cannot be used to log in.',
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Use `crypto/rand`, never `math/rand`. `math/rand` is predictable — given enough output an attacker can work out the seed and then generate every token you will ever issue. This applies to session ids, password reset codes, and anything else that must be unguessable.',
        },
      },
      {
        heading: 'Why SHA-256 here but bcrypt for passwords',
        body: [
          'A reasonable question. bcrypt is slow so that guessing *human* passwords is expensive — people choose short, predictable ones.',
          'A refresh token is 32 random bytes. There is nothing to guess: an attacker would have to try more combinations than there are atoms in reach. So a fast hash is fine, and being fast matters because this runs on every refresh.',
        ],
      },
      {
        heading: 'File 2 — rotation',
        body: [
          '**Rotation** means each refresh token can be used once. Using it gives you a new pair and cancels the old one.',
        ],
        code: {
          label: 'internal/auth/service.go — create this file',
          src: `func (s *Service) Refresh(ctx context.Context, token string) (access, refresh string, err error) {
\tsum := sha256.Sum256([]byte(token))
\thash := hex.EncodeToString(sum[:])

\tvar userID int64
\terr = s.db.QueryRowContext(ctx,
\t\t\`SELECT user_id FROM refresh_tokens
\t\t  WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()\`,
\t\thash,
\t).Scan(&userID)

\tif errors.Is(err, sql.ErrNoRows) {
\t\treturn "", "", ErrInvalidCredentials    // wrong, expired, or already used
\t}
\tif err != nil {
\t\treturn "", "", err
\t}

\t// Cancel the one just used — a refresh token works exactly once.
\tif _, err = s.db.ExecContext(ctx,
\t\t\`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1\`, hash); err != nil {
\t\treturn "", "", err
\t}

\tif access, err = s.issueToken(userID); err != nil {
\t\treturn "", "", err
\t}
\trefresh, err = s.issueRefresh(ctx, userID)
\treturn access, refresh, err
}`,
        },
      },
      {
        heading: 'Why single-use matters',
        body: [
          'Rotation is what makes theft **detectable**. If a refresh token is ever used twice, one of two things happened: your client has a bug, or somebody stole it and both parties are now using it.',
          'The safe response is to cancel every refresh token for that user and force a fresh login. Without rotation you cannot detect the theft at all — the attacker just keeps refreshing alongside the real user, indefinitely.',
        ],
      },
      {
        heading: 'File 3 — logout',
        code: {
          label: 'internal/auth/service.go — add this',
          src: `func (s *Service) Logout(ctx context.Context, token string) error {
\tsum := sha256.Sum256([]byte(token))
\t_, err := s.db.ExecContext(ctx,
\t\t\`UPDATE refresh_tokens SET revoked_at = now()
\t\t  WHERE token_hash = $1 AND revoked_at IS NULL\`,
\t\thex.EncodeToString(sum[:]))
\treturn err
}

// "Log out everywhere" is the same query without the token:
//   UPDATE refresh_tokens SET revoked_at = now()
//    WHERE user_id = $1 AND revoked_at IS NULL`,
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Be honest about what logout does. The refresh token stops working immediately, but the **access token** keeps working until it expires — up to fifteen minutes. That is the price of not checking the database on every request, and it is why fifteen minutes and not eight hours.',
        },
      },
    ],
    keyPoints: [
      'Two tokens: a short JWT that does the work, and a long stored token that can be cancelled.',
      'Store the SHA-256 of the refresh token, never the token.',
      'Rotate on every refresh. Single use is what makes theft detectable.',
      '`crypto/rand` for anything that must be unguessable. `math/rand` is a real vulnerability.',
    ],
    remember:
      'You cannot cancel a JWT. You cancel the refresh token and wait out the access token — which is exactly why it is short.',
    task: 'Add refresh and logout. Then use one refresh token twice and confirm the second attempt fails.',
    exercises: [
      {
        task: 'Log out, then keep using the access token. Time how long it keeps working.',
        answer:
          'It keeps working until it expires — up to fifteen minutes. That window is the price of not checking the database per request.',
      },
      {
        task: 'Look at the `refresh_tokens` table and confirm nothing in it can be used to log in.',
        answer:
          'Only SHA-256 hashes. Nothing in that table can be sent to `/auth/refresh` and work.',
      },
      {
        task: 'Add "log out everywhere" and test it from two different terminals.',
        answer:
          'Both terminals stop being able to refresh. It is the same UPDATE without the token condition.',
      },
      {
        task: 'Write the cleanup job that deletes tokens expired more than 30 days ago, and give its goroutine a way to stop.',
        answer:
          'It needs `case <-ctx.Done(): return` in its select, or the goroutine outlives the server and blocks shutdown.',
      },
    ],
    refs: [
      { label: 'crypto/rand', href: 'https://pkg.go.dev/crypto/rand' },
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
    ],
  },

  {
    slug: 'expenses-step-8-tests',
    title: 'Step 8 — Test that the walls actually hold',
    navTitle: 'Step 8 — Tests',
    oneLine: 'One test here matters more than all the others put together.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `# a separate database for tests, so your real data is never truncated
docker run -d --name exp-test-pg \\
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=expenses_test \\
  -p 5433:5432 postgres:16

export TEST_DATABASE_URL='postgres://postgres:secret@localhost:5433/expenses_test?sslmode=disable'
docker exec -i exp-test-pg psql -U postgres -d expenses_test < migrations/001_init.up.sql

touch internal/expense/handler_test.go internal/expense/helpers_test.go
touch internal/expense/service_test.go internal/user/auth_test.go

# run them
go test ./... -race -cover
go test ./internal/expense/ -run TestUserCannotTouch -v

# see what is untested
go test ./... -coverprofile=c.out && go tool cover -html=c.out`,
        },
      },
      {
        heading: 'What to test, and at which level',
        body: [
          'You have three layers, and each one is tested differently. Getting this right is the difference between tests that catch bugs and tests that only confirm your mocks work.',
        ],
        table: {
          headers: ['Layer', 'Test it with', 'Because'],
          rows: [
            ['Handler', '`httptest` and a real handler', 'you are checking statuses, JSON and auth — no network needed'],
            ['Service', 'a hand-written fake repository', 'you are checking rules, and a database would only slow it down'],
            ['Repository', 'a **real** throwaway Postgres', 'a fake cannot catch a mistyped column or a broken constraint'],
          ],
        },
      },
      {
        heading: 'The test that matters most',
        body: [
          'Everything in this project exists to stop one user reading another user’s data. So the most valuable test in the whole codebase is the one that proves it.',
        ],
        code: {
          label: 'internal/expense/handler_test.go — create this file',
          src: `func TestUserCannotTouchAnotherUsersExpense(t *testing.T) {
\th := newTestHandler(t)

\ttokenA := registerAndLogin(t, h, "a@x.com")
\ttokenB := registerAndLogin(t, h, "b@x.com")

\t// A creates an expense
\tid := createExpense(t, h, tokenA, 1200, "food")

\t// B tries everything. All of it must be 404 — never 403, never 200.
\ttests := []struct {
\t\tname   string
\t\tmethod string
\t\tbody   string
\t}{
\t\t{"read", "GET", ""},
\t\t{"update", "PATCH", \`{"note":"stolen"}\`},
\t\t{"delete", "DELETE", ""},
\t}

\tfor _, tt := range tests {
\t\tt.Run(tt.name, func(t *testing.T) {
\t\t\treq := httptest.NewRequest(tt.method,
\t\t\t\tfmt.Sprintf("/v1/expenses/%d", id), strings.NewReader(tt.body))
\t\t\treq.Header.Set("Authorization", "Bearer "+tokenB)
\t\t\trec := httptest.NewRecorder()

\t\t\th.ServeHTTP(rec, req)

\t\t\tif rec.Code != 404 {
\t\t\t\tt.Errorf("%s as another user = %d, want 404 — body %s",
\t\t\t\t\ttt.method, rec.Code, rec.Body)
\t\t\t}
\t\t})
\t}

\t// and A's expense is untouched
\tif got := getExpense(t, h, tokenA, id); got.Note == "stolen" {
\t\tt.Fatal("user B modified user A's expense")
\t}
}`,
          note: 'This one test is what stops you shipping an IDOR. Write it before you write anything else in this step.',
        },
      },
      {
        heading: 'Test helpers, and why t.Helper matters',
        code: {
          label: 'internal/expense/helpers_test.go — create this file',
          src: `func newTestDB(t *testing.T) *sql.DB {
\tt.Helper()                          // failures point at the CALLER's line

\tdb, err := sql.Open("pgx", os.Getenv("TEST_DATABASE_URL"))
\tif err != nil {
\t\tt.Fatal(err)
\t}
\tmustMigrate(t, db)

\tt.Cleanup(func() {                  // runs even if the test fails or panics
\t\tdb.Exec("TRUNCATE users, expenses, refresh_tokens RESTART IDENTITY CASCADE")
\t\tdb.Close()
\t})
\treturn db
}`,
          note: 'Without t.Helper, every failure reports the line inside this function rather than the line in the test that actually failed.',
        },
      },
      {
        heading: 'A fake, not a mocking library',
        body: [
          'Because Go interfaces are implicit and small, a hand-written fake is fifteen lines and reads better than any generated mock. You almost never need a mocking library.',
        ],
        code: {
          label: 'internal/expense/service_test.go',
          src: `type fakeRepo struct {
\titems map[int64]*Expense
\terr   error                         // set this to force the failure path
}

func (f *fakeRepo) GetByID(_ context.Context, id, userID int64) (*Expense, error) {
\tif f.err != nil {
\t\treturn nil, f.err
\t}
\te, ok := f.items[id]
\tif !ok || e.UserID != userID {
\t\treturn nil, ErrNotFound
\t}
\treturn e, nil
}`,
          note: 'This works because the service declares the interface it needs. Two methods to fake, not fifteen.',
        },
      },
      {
        heading: 'The auth cases worth covering',
        code: {
          label: 'internal/user/auth_test.go',
          src: `tests := []struct {
\tname string
\tbody string
\twant int
}{
\t{"valid", \`{"name":"a","email":"a@b.c","password":"password123"}\`, 201},
\t{"duplicate email", \`{"name":"a","email":"a@b.c","password":"password123"}\`, 409},
\t{"short password", \`{"name":"a","email":"c@b.c","password":"short"}\`, 422},
\t{"no email", \`{"name":"a","password":"password123"}\`, 422},
\t{"malformed json", \`nope\`, 400},
}`,
        },
      },
      {
        heading: 'Run them properly',
        code: {
          label: 'terminal',
          src: `go test ./... -race -cover

# -race finds data races that only appear under concurrency.
# Run it in CI, always.`,
          note: 'Coverage tells you what is definitely untested. It does not tell you what is well tested — chasing 100% produces tests that assert nothing.',
        },
      },
      {
        callout: {
          tone: 'ok',
          text: 'That is project two. You now have accounts, hashed passwords, tokens, middleware, per-user data, reports, sessions that can be ended, and tests proving the walls hold. Project three adds files, money and roles.',
        },
      },
    ],
    keyPoints: [
      'Handlers with `httptest`, services with a hand-written fake, repositories against a real database.',
      'The cross-user 404 test is the most valuable test in the project. Write it first.',
      '`t.Helper` and `t.Cleanup` do the plumbing; you rarely need a mocking library.',
      'Run `go test -race` in CI, always.',
    ],
    remember:
      'A test against a fake repository only proves your fake works. The rules go against a fake; the SQL goes against a real database.',
    task: 'Write the cross-user test first and watch it pass. Then break it on purpose by removing `AND user_id = $2` from one query, confirm the test fails, and put it back.',
    exercises: [
      {
        task: 'Add the same cross-user test for the monthly report endpoint.',
        answer:
          'User B\'s report must be empty, not user A\'s numbers. Reports are the easiest place to forget the scoping.',
      },
      {
        task: 'Write a fuzz test on your JSON decoding and run it for 60 seconds.',
        answer:
          'It should never panic, whatever it is fed. Fuzzing finds inputs you would never think to write a test for.',
      },
      {
        task: 'Check coverage with `go tool cover -html` and find one error path nothing reaches.',
        answer:
          'The red lines are almost always error branches. Those are the ones worth covering — the happy path is exercised by everything.',
      },
      {
        task: 'Delete the `t.Helper()` line and see how much worse the failure message gets.',
        answer:
          'Failures now point at the line inside the helper instead of the test that failed, so you cannot tell which case broke.',
      },
    ],
    refs: [
      { label: 'testing package', href: 'https://pkg.go.dev/testing' },
      { label: 'Tutorial: add a test', href: 'https://go.dev/doc/tutorial/add-a-test' },
    ],
  },
]
