import type { LangLesson } from '@/lib/types'

/** Postgres through database/sql, with no ORM in the way. */
export const DATABASE: LangLesson[] = [
  {
    slug: 'postgres-and-sql',
    title: 'Postgres with database/sql',
    navTitle: 'Postgres and database/sql',
    oneLine: 'No ORM. Learn what the queries actually do, because SQL outlives every ORM.',
    blocks: [
      {
        heading: 'What a database layer is',
        body: [
          'So far everything your program stores disappears when it stops. A **database** keeps it, and it also enforces rules — this column cannot be empty, this email must be unique, this row must point at a real user — that your Go code would otherwise have to remember every time.',
          'Go talks to databases through **`database/sql`**, a package in the standard library. It does not know about any particular database on its own; it defines a common interface, and a **driver** — a separate package, in our case `pgx` for Postgres — does the real talking.',
          'There is no ORM here. An **ORM** turns database rows into objects for you and hides the SQL. That is convenient until it produces a query you have to fight. Learning `database/sql` first means you can see exactly which queries run, and SQL is a skill that outlives every ORM.',
        ],
      },
      {
        heading: 'Get a database running',
        code: {
          label: 'terminal',
          src: `docker run -d --name pg \\
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=api \\
  -p 5432:5432 postgres:16

go get github.com/jackc/pgx/v5/stdlib`,
          note: 'database/sql is the stdlib interface; pgx is the Postgres driver behind it. That is one dependency, not a framework.',
        },
      },
      {
        heading: '*sql.DB is a pool, not a connection',
        body: [
          'This surprises everyone once. `sql.Open` does not connect — it creates a **pool**. It is safe for concurrent use by many goroutines, you create exactly one for the whole program, and you never close it per request.',
        ],
        code: {
          label: 'db.go',
          src: `db, err := sql.Open("pgx", os.Getenv("DATABASE_URL"))
if err != nil {
\treturn err
}

db.SetMaxOpenConns(25)                   // MUST set this. The default is UNLIMITED.
db.SetMaxIdleConns(25)                   // match it, or you churn connections
db.SetConnMaxLifetime(5 * time.Minute)
db.SetConnMaxIdleTime(5 * time.Minute)

if err := db.PingContext(ctx); err != nil {   // Open is lazy — Ping actually connects
\treturn err
}`,
          note: 'Unlimited connections means a traffic spike opens 4000 connections and Postgres falls over. The pool limit is your backpressure.',
        },
      },
      {
        heading: 'One row',
        code: {
          label: 'query-one.go',
          src: `var u User
err := db.QueryRowContext(ctx,
\t\`SELECT id, name, email FROM users WHERE id = $1\`, id,
).Scan(&u.ID, &u.Name, &u.Email)

if errors.Is(err, sql.ErrNoRows) {
\treturn nil, ErrNotFound          // translate to YOUR domain error
}
if err != nil {
\treturn nil, err
}`,
          note: 'Scan takes pointers, in exactly the column order of the SELECT.',
        },
      },
      {
        heading: 'Many rows — and the three things people forget',
        code: {
          label: 'query-many.go',
          src: `rows, err := db.QueryContext(ctx,
\t\`SELECT id, name FROM users ORDER BY id LIMIT $1 OFFSET $2\`, limit, offset)
if err != nil {
\treturn nil, err
}
defer rows.Close()                   // 1. or you leak a pooled connection

var out []User
for rows.Next() {
\tvar u User
\tif err := rows.Scan(&u.ID, &u.Name); err != nil {
\t\treturn nil, err              // 2. check every Scan
\t}
\tout = append(out, u)
}

return out, rows.Err()               // 3. iteration errors surface ONLY here`,
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Never `SELECT *`. Someone adds a column, every `Scan` in the codebase breaks at once, and the error tells you nothing useful. List the columns.',
        },
      },
      {
        heading: 'Insert with a returned id, and transactions',
        code: {
          label: 'write.go',
          src: `err = db.QueryRowContext(ctx,
\t\`INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, created_at\`,
\tu.Name, u.Email,
).Scan(&u.ID, &u.CreatedAt)

// A transaction: all of it, or none of it
tx, err := db.BeginTx(ctx, nil)
if err != nil {
\treturn err
}
defer tx.Rollback()                  // a no-op once Commit has succeeded

if _, err := tx.ExecContext(ctx, q1, args...); err != nil {
\treturn err                       // the deferred Rollback undoes everything
}
if _, err := tx.ExecContext(ctx, q2, args...); err != nil {
\treturn err
}

return tx.Commit()`,
          note: 'A transaction holds a connection for its whole life. Keep them short, and never make an HTTP call inside one.',
        },
      },
      {
        heading: 'The two rules that are not negotiable',
        bullets: [
          '**Always use `$1, $2` placeholders. Never build SQL with `fmt.Sprintf`.** This is your entire defence against SQL injection, and it is not optional anywhere, ever, including "internal" endpoints.',
          '**Always use the `...Context` variants.** `QueryRowContext`, not `QueryRow`. A query without a context cannot be cancelled when the client disconnects, and you end up running work nobody is waiting for.',
        ],
      },
      {
        heading: 'Nullable columns',
        body: [
          'Scanning a SQL NULL into a Go `string` fails at runtime. Three ways out, easiest first: `COALESCE(col, \'\')` in the query, `sql.NullString` in the scan, or a `*string` field.',
        ],
      },
    ],
    keyPoints: [
      '`*sql.DB` is a pool. Create one, share it, always set `SetMaxOpenConns`.',
      'Placeholders always. `fmt.Sprintf` near a query is a SQL injection.',
      '`defer rows.Close()`, check each `Scan`, and check `rows.Err()` at the end.',
      'Translate `sql.ErrNoRows` into your own domain error at the repository boundary.',
    ],
    remember:
      'Learn SQL, not an ORM. `database/sql` shows you exactly which queries run, and that is a skill that outlives every library.',
    task: 'Create a `users` table and write five functions against it: Create, GetByID, List with limit/offset, Update, Delete. Make Delete return your `ErrNotFound` when `RowsAffected()` is zero.',
    refs: [
      { label: 'Accessing databases', href: 'https://go.dev/doc/database/index' },
      { label: 'Tutorial: database access', href: 'https://go.dev/doc/tutorial/database-access' },
    ],
  },

  {
    slug: 'joins-transactions-n-plus-one',
    title: 'Joins, transactions, and the N+1 problem',
    navTitle: 'Joins, transactions, N+1',
    oneLine: 'The single performance bug that shows up in every codebase in every language.',
    blocks: [
      {
        heading: 'N+1: one query, then one per row',
        body: [
          'You list twenty notes. For each one you fetch its attachment count. That is 1 + 20 = 21 round trips to the database. At two hundred notes it is 201, and your endpoint takes three seconds for no reason anyone can see in the Go code.',
        ],
        code: {
          label: 'n-plus-one.go',
          src: `// SLOW — a query per note
notes, _ := repo.List(ctx, userID, limit, offset)
for i := range notes {
\tnotes[i].Attachments, _ = attRepo.CountByNote(ctx, notes[i].ID)   // N queries
}

// FAST — one query
\`SELECT n.id, n.title, n.body, COUNT(a.id) AS attachments
   FROM notes n
   LEFT JOIN attachments a ON a.note_id = n.id
  WHERE n.user_id = $1
  GROUP BY n.id
  ORDER BY n.created_at DESC
  LIMIT $2 OFFSET $3\``,
        },
      },
      {
        heading: 'The other fix: fetch in one batch',
        body: [
          'When a join is awkward, collect the ids and do a second query for all of them at once. Two queries total, no matter how many rows.',
        ],
        code: {
          label: 'batch.go',
          src: `ids := make([]int64, len(notes))
for i, n := range notes {
\tids[i] = n.ID
}

rows, err := db.QueryContext(ctx,
\t\`SELECT note_id, id, filename FROM attachments WHERE note_id = ANY($1)\`,
\tpq.Array(ids))

// then group them into a map[int64][]Attachment and attach in one pass`,
        },
      },
      {
        callout: {
          tone: 'note',
          text: 'Turn on your database’s slow query log during development, or count queries in a test. N+1 is invisible when you read the Go code — the loop looks innocent — and obvious the moment you count round trips.',
        },
      },
      {
        heading: 'Transactions: all of it, or none of it',
        body: [
          'Some operations must not half-happen. Creating a note and its first attachment row is one unit: if the second insert fails, the first must be undone.',
        ],
        code: {
          label: 'tx.go',
          src: `func (r *Repository) CreateWithAttachment(ctx context.Context, n *Note, a *Attachment) (err error) {
\ttx, err := r.db.BeginTx(ctx, nil)
\tif err != nil {
\t\treturn err
\t}
\tdefer func() {
\t\tif p := recover(); p != nil {
\t\t\ttx.Rollback()
\t\t\tpanic(p)                 // roll back, then let the panic continue
\t\t}
\t\tif err != nil {
\t\t\ttx.Rollback()            // named return: this sees the real error
\t\t}
\t}()

\tif err = tx.QueryRowContext(ctx, insertNote, n.UserID, n.Title, n.Body).Scan(&n.ID); err != nil {
\t\treturn err
\t}
\ta.NoteID = n.ID
\tif _, err = tx.ExecContext(ctx, insertAttachment, a.NoteID, a.Filename); err != nil {
\t\treturn err
\t}

\treturn tx.Commit()
}`,
          note: 'The named return value `err` is what lets the deferred function know whether to roll back. This is the one place where naming a return value is really worth it.',
        },
      },
      {
        heading: 'Transaction rules',
        bullets: [
          '**Keep them short.** A transaction holds a pooled connection for its entire life. Long transactions use up the whole pool.',
          '**Never make an HTTP call inside one.** A slow third party then ties up a database connection that other requests need.',
          '**Take row locks in a consistent order** across the codebase, or two transactions grabbing the same two rows in opposite orders will deadlock.',
          '**Do not wrap reads in a transaction** out of habit. A single `SELECT` is already atomic.',
        ],
      },
      {
        heading: 'Read your query plan',
        code: {
          label: 'psql',
          src: `EXPLAIN ANALYZE
SELECT id, title FROM notes WHERE user_id = 1 ORDER BY created_at DESC LIMIT 20;

-- "Seq Scan on notes" means no index is being used. Add one.
-- "Index Scan using notes_user_id_created_at_idx" is what you want.`,
          note: 'A missing index is worth more than every Go optimisation you will write. Check the plan for every query on a table that grows.',
        },
      },
    ],
    keyPoints: [
      'A query inside a loop is N+1. Fix it with a JOIN, or one batched `WHERE id = ANY($1)`.',
      'A transaction is all-or-nothing. Use a named return so the deferred rollback sees the error.',
      'Transactions hold a connection: keep them short, and never call an external service inside one.',
      '`EXPLAIN ANALYZE` every query on a growing table. A sequential scan means a missing index.',
    ],
    remember:
      'The database is where your latency lives. One join beats twenty round trips, and one index beats a month of Go micro-optimisation.',
    task: 'Add an attachment count to your notes list — first with the naive loop, then with a JOIN. Time both with 200 notes. Then run `EXPLAIN ANALYZE` on the list query and confirm it uses your index.',
    refs: [
      { label: 'Accessing databases', href: 'https://go.dev/doc/database/index' },
      { label: 'database/sql package', href: 'https://pkg.go.dev/database/sql' },
    ],
  },
]
