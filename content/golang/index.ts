import type { Language, LangLesson, QuizSet } from '@/lib/types'
import { BASICS } from './basics'
import { FUNDAMENTALS } from './fundamentals'
import { TOOLING } from './tooling'
import { CONCURRENCY } from './concurrency'
import { WEB } from './web'
import { PRACTICE } from './practice'
import { PROJECT_SHORTENER } from './project-shortener'
import { PROJECT_EXPENSES } from './project-expenses'
import { PROJECT_SHOP } from './project-shop'
import { DATABASE } from './database'
import { PRODUCTION } from './production'
import { INTERVIEW } from './interview'
import { COMPARE } from './compare'
import { EXTRAS } from './extras'
import { DSA } from './dsa'
import { EXERCISES } from './exercises'
import { QUIZZES } from './quiz'

/**
 * The Go track. Topics, not a timetable — the sections build on each other, but
 * how fast you move through them is yours to decide.
 */
export const GO: Language = {
  id: 'go',
  name: 'Go',
  alias: 'Golang',
  tagline: 'Start from nothing. Finish with a real API you could put online.',
  blurb:
    'Go is small enough to learn well, and big enough to build real things with. You start with variables. You finish with a working JSON API that has user accounts, a database, file uploads and tests. It uses only four outside packages. Everything else comes with Go. **Interview path:** if you are preparing for campus hiring, new-grad interviews or online assessments, do Getting started → Core language → Go for coding rounds → Interview preparation first, and come back for the rest.',
  metaDescription:
    'Golang tutorial for beginners: start with variables, finish with a JSON API with accounts, a database, file uploads and tests, using four outside packages.',
  home: 'https://go.dev/',
  sections: [
    {
      id: 'basics',
      name: 'Getting started',
      searchTitle: 'Golang basics: setup, syntax, types and control flow',
      blurb: 'Install it, run something, and meet the ideas that make Go different from what you already know.',
      lessons: [
        'setup-and-first-program',
        'syntax-and-comments',
        'printing-and-format-verbs',
        'basic-data-types',
        'constants-and-iota',
        'operators',
        'type-conversion',
        'control-flow',
      ],
    },
    {
      id: 'core',
      searchTitle: "Golang core language: functions, slices, maps, interfaces",
      name: 'Core language',
      blurb: 'Functions, errors as values, the two data structures you use all day, your own types, and tests.',
      lessons: [
        'functions-and-errors',
        'defer',
        'arrays-and-slices',
        'maps',
        'strings-and-formatting',
        'pointers-and-memory',
        'structs',
        'methods-and-embedding',
        'interfaces',
        'type-switches',
        'error-values',
        'json',
        'testing',
      ],
    },
    {
      id: 'dsa',
      searchTitle: 'DSA in Go (Golang): coding interview problems, solved',
      name: 'Go for coding rounds',
      blurb: 'How to read judge input fast, then fifteen problems campus hiring tests and online assessments ask most (maps, slices, linked lists, trees, recursion, DP, graphs, sliding windows), each solved idiomatically in Go with the trap that costs marks.',
      lessons: [
        'dsa-fast-io',
        'dsa-two-sum',
        'dsa-reverse-rotate',
        'dsa-frequency-top-k',
        'dsa-valid-parentheses',
        'dsa-binary-search',
        'dsa-lru-cache',
        'dsa-reverse-linked-list',
        'dsa-detect-cycle',
        'dsa-merge-sorted-lists',
        'dsa-binary-tree',
        'dsa-subsets-permutations',
        'dsa-dynamic-programming',
        'dsa-number-of-islands',
        'dsa-merge-intervals',
        'dsa-sliding-window',
      ],
    },
    {
      id: 'concurrency',
      name: 'Concurrency',
      searchTitle: 'Golang concurrency practice problems and exercises',
      metaDescription:
        'Golang concurrency practice problems with runnable code: goroutines, channels, mutexes, worker pools and race fixes. Try each one, then check the solution.',
      blurb: 'The part people come to Go for. Run things at the same time, safely, and stop them when you need to.',
      lessons: ['goroutines', 'channels-and-select', 'mutex-and-races', 'context', 'concurrency-patterns', 'sync-package', 'worker-pool'],
    },
    {
      id: 'generics',
      name: 'Generics and stdlib',
      blurb: 'Write one function that works for many types, and learn which built-in packages you will use most.',
      intro: {
        about: [
          'This section is about writing less code. **Generics**, added in Go 1.18, let one function or type work for many types: a single `Max` that handles `int`, `float64` and your own `type Celsius float64`, instead of three copies that differ only in the type name. **Iterators** let a function hand values to a `for ... range` loop one at a time. Range over functions arrived in Go 1.23, and it is why `maps.Keys` now returns a function rather than a slice.',
          'The third lesson is a tour of the **standard library** packages you will reach for most: `strings`, `strconv`, `time`, `slices`, `maps`, `errors`, `encoding/json`, `log/slog`, `crypto/rand` and more. A lot of beginner Go code is a hand-written helper for something the standard library already does, tested and fast.',
          'Generics are also the feature people overuse most, so the first lesson spends as much time on when not to use them, and when an interface is the better answer, as on the syntax.',
        ],
        outcomes: [
          'Write and read generic functions, including constraints such as `cmp.Ordered` and `~int | ~float64`.',
          'Choose between a type parameter and an interface, and explain why a generic `Repository[T]` usually costs more than it saves.',
          'Write your own iterator, and turn any iterator into a sorted slice with `slices.Sorted`.',
          'Find the standard library function that replaces a loop you were about to write.',
        ],
        order: [
          'Finish **Core language** first, especially functions, slices, maps and interfaces. Generics only make sense once you have felt the duplication they remove, and the comparison with interfaces assumes you have written some.',
          'Then read the lessons in order: Generics, then Iterators (`iter.Seq[V]` is itself a generic type), then The standard library. Do the graded `Max` challenge in Generics before you move on.',
          'Next comes **Web services**, which leans on `encoding/json` and `log/slog` from here and on `context` from Concurrency.',
        ],
      },
      lessons: ['generics', 'iterators', 'standard-library'],
    },
    {
      id: 'web',
      searchTitle: "Golang web services: a net/http API, no framework",
      metaDescription: "Golang web services with only net/http: method-and-path routing, JSON handlers, server timeouts, middleware and a graceful shutdown, with runnable code.",
      name: 'Web services',
      blurb: 'Build an HTTP API with no framework, add middleware, and shut it down cleanly.',
      intro: {
        about: [
          'This section builds an HTTP JSON API with nothing but the standard library. Since Go 1.22, `net/http` routes on method and path (`GET /tasks/{id}`) and reads path parameters with `r.PathValue`. That routing was the main reason projects used to add a framework such as gin, echo or chi. Learning the plain version first means any framework you meet later reads as a thin layer over code you already understand.',
          'The two lessons take you from a first handler to a server you could deploy: timeouts on `http.Server` (a zero-value server has none, so a slow client can hold a connection open forever), files embedded in the binary with `//go:embed`, middleware for logging and panic recovery, and a graceful shutdown that lets requests already in flight finish when the process is told to stop.',
        ],
        outcomes: [
          'Build a JSON API with method-and-path routing, where every handler sets headers, then the status, then the body, and returns straight after an error.',
          'Configure the server timeouts that a bare `http.ListenAndServe` leaves out.',
          'Wrap every route in middleware: a function that takes an `http.Handler` and returns one.',
          'Stop the server on SIGINT or SIGTERM without dropping anyone, inside the grace period your platform allows (30 seconds by default on Kubernetes).',
        ],
        order: [
          'Before you start, be comfortable with structs, methods, interfaces and JSON from **Core language**, and with `context` from **Concurrency**: every request carries a context, and the shutdown is built on one.',
          'Read An HTTP server with no framework first and get it answering curl requests. Then read Middleware and graceful shutdown, which wraps that same server.',
          'After this, **Modules and packages** and **Databases** fill in the rest, and the **Practice projects** rebuild the same API in three folder layouts so you can compare them.',
        ],
      },
      lessons: ['http-server', 'middleware-and-shutdown'],
    },
    {
      id: 'tooling',
      name: 'Modules and packages',
      blurb: 'How Go finds your code, the third-party packages you will meet most, and the four commands to run before every push.',
      lessons: ['modules-and-tooling', 'popular-packages', 'packages-in-code'],
    },
    {
      id: 'database',
      searchTitle: 'Databases in Go (Golang): PostgreSQL, SQL and pgx',
      metaDescription: "Golang with PostgreSQL through database/sql and pgx: safe queries, placeholders, nullable columns, transactions, the N+1 problem and query plans. No ORM.",
      name: 'Databases',
      blurb: 'Postgres through database/sql. No ORM, so you write and see every query that runs.',
      intro: {
        about: [
          'This section connects a Go program to PostgreSQL through `database/sql`, the database interface in the standard library, with `pgx` as the driver behind it. There is no ORM: you write each SQL query yourself, so you always know exactly what runs against the database, and the skill carries over to any language or framework you use later.',
          'The first lesson covers the everyday mechanics: why `*sql.DB` is a connection pool rather than one connection, reading one row and many rows, placeholders that stop SQL injection, and nullable columns. The second covers the problems that appear once there is real data: the N+1 query loop, transactions that either commit completely or roll back completely, and reading a query plan to find a missing index.',
        ],
        outcomes: [
          'Run Postgres locally in Docker and connect to it with one dependency, the `pgx` driver.',
          'Write queries that cannot be injected, that stop when the client goes away, and that never leak a connection.',
          'Turn an endpoint that makes one query per row into one that makes a single query, with a join or one batch query.',
          'Group writes in a transaction that rolls back on any error.',
        ],
        order: [
          'You need **Core language** (structs, errors, interfaces) and `context` from **Concurrency** first. You do not need to know Postgres already; knowing what SELECT, INSERT and WHERE do is enough to follow along.',
          'Read Postgres with database/sql first, then Joins, transactions, and the N+1 problem.',
          'Then put it to work: the second **Practice projects** lesson puts the CRUD API on a real database, and step 5 of **Project 1 — URL shortener** moves its storage to Postgres.',
        ],
      },
      lessons: ['postgres-and-sql', 'joins-transactions-n-plus-one'],
    },
    {
      id: 'practice',
      // not "with source code": the lessons show the key files and leave the
      // remaining handlers for you to write
      searchTitle: 'Golang practice projects for beginners: build a CRUD API',
      name: 'Practice projects',
      blurb:
        'Build the same CRUD API three times, in three layouts, so the trade-offs are something you have felt rather than read.',
      lessons: ['project-layouts', 'practice-crud-easy', 'practice-crud-moderate', 'folder-structure-crud'],
    },
    {
      id: 'project-shortener',
      metaDescription: "Build a URL shortener in Golang step by step, with a layered folder structure: validation, an in-memory store, the redirect, then Postgres and a container.",
      name: 'Project 1 — URL shortener',
      blurb:
        'Optional — after you finish the basics. Built with a **layered** structure: a folder per kind of code. Validation, storage, a redirect, then Postgres and a container.',
      lessons: [
        'shortener-overview',
        'shortener-step-1-setup',
        'shortener-step-2-store',
        'shortener-step-3-create',
        'shortener-step-4-redirect',
        'shortener-step-5-postgres',
        'shortener-step-6-finish',
      ],
    },
    {
      id: 'project-expenses',
      name: 'Project 2 — Expense tracker',
      blurb:
        'Built **by feature**: one folder per concept. Accounts, passwords and login, taught inside the project that needs them.',
      lessons: [
        'expenses-overview',
        'expenses-step-1-setup',
        'expenses-step-2-register',
        'expenses-step-3-login',
        'expenses-step-4-middleware',
        'expenses-step-5-crud',
        'expenses-step-6-reports',
        'expenses-step-7-refresh',
        'expenses-step-8-tests',
      ],
    },
    {
      id: 'project-shop',
      name: 'Project 3 — Small shop',
      blurb:
        'Built with **ports and adapters** (hexagonal). Roles, file uploads, and money that must not be lost.',
      lessons: [
        'shop-overview',
        'shop-step-1-setup',
        'shop-step-2-roles',
        'shop-step-3-uploads',
        'shop-step-4-serving',
        'shop-step-5-cart',
        'shop-step-6-checkout',
        'shop-step-7-production',
      ],
    },
    {
      id: 'production',
      searchTitle: "Golang in production: logging, Docker, deploys, profiling",
      name: 'Production',
      blurb: 'Optional — after you finish the basics. The difference between something that works and something you can put online and keep running.',
      lessons: [
        'errors-and-logging',
        'rate-limiting-cors-headers',
        'docker-and-deployment',
        'polish-and-docs',
        'hardening-and-review',
        'profiling-and-shipping',
      ],
    },
    {
      id: 'compare',
      name: 'Go comparisons',
      searchTitle: 'Go (Golang) comparisons: which one to use and why',
      blurb: 'The "X vs Y" questions people search and interviewers ask: goroutines vs threads, mutex vs channel, mutex vs RWMutex, arrays vs slices, buffered vs unbuffered channels, and Go vs Java vs Python for first-job interviews.',
      lessons: [
        'goroutines-vs-threads',
        'mutex-vs-channel',
        'mutex-vs-rwmutex',
        'arrays-vs-slices',
        'buffered-vs-unbuffered-channels',
        'go-vs-java-vs-python-for-placements',
      ],
    },
    {
      id: 'interview',
      name: 'Interview preparation',
      blurb: 'Everything above, written the way interviewers ask it. Plus the live coding round and a last checklist.',
      lessons: [
        'go-interview-questions',
        'interview-questions-experienced',
        'interview-language-fundamentals',
        'interview-concurrency',
        'interview-backend-and-design',
        'interview-live-coding',
        'interview-final-checklist',
      ],
    },
  ],
  quizzes: [...QUIZZES, mixedTest(QUIZZES)],
  lessons: mergeLessons(withExercises([
    ...BASICS,
    ...FUNDAMENTALS,
    ...TOOLING,
    ...CONCURRENCY,
    ...WEB,
    ...PRACTICE,
    ...PROJECT_SHORTENER,
    ...PROJECT_EXPENSES,
    ...PROJECT_SHOP,
    ...DATABASE,
    ...PRODUCTION,
    ...DSA,
    ...COMPARE,
    ...EXTRAS,
    ...INTERVIEW,
  ])),
}

/**
 * The final mixed test: every question from every section, in one go. The Quiz
 * component shuffles on each attempt, so this is a different paper every time.
 */
function mixedTest(sets: QuizSet[]): QuizSet {
  return {
    id: 'all',
    name: 'Mixed final test',
    blurb: 'Every question from every section. Save this one for just before an interview.',
    questions: sets.flatMap((s) => s.questions),
  }
}

/** Exercises live in one file so they are easy to review together, not scattered across ten. */
function withExercises(lessons: LangLesson[]): LangLesson[] {
  return lessons.map((l) => (l.exercises ? l : { ...l, exercises: EXERCISES[l.slug] }))
}

/**
 * "Packages" and "Packages in code" were two halves of one topic. The basics
 * now open the fuller lesson, and /languages/go/packages redirects to it
 * (lib/redirects.ts). The first block of the old lesson only previewed JSON
 * and testing, which have lessons of their own, so it is not repeated.
 */
function mergeLessons(lessons: LangLesson[]): LangLesson[] {
  const from = lessons.find((l) => l.slug === 'packages')
  if (!from) return lessons
  return lessons
    .filter((l) => l.slug !== 'packages')
    .map((l) =>
      l.slug !== 'packages-in-code'
        ? l
        : {
            ...l,
            oneLine:
              'A folder is a package and capitalisation is your access control. Then how a real module splits into many packages, what `internal/` hides, why imports cannot go in a circle, and what the popular libraries look like in code.',
            objectives: [...(from.objectives ?? []), ...(l.objectives ?? [])],
            blocks: [...from.blocks.slice(1), ...l.blocks],
            keyPoints: [...from.keyPoints, ...l.keyPoints],
            remember: `${from.remember} ${l.remember}`,
            exercises: [...(from.task ? [from.task] : []), ...(from.exercises ?? []), ...(l.exercises ?? [])],
            refs: [...(from.refs ?? []), ...(l.refs ?? [])].filter((r, i, a) => a.findIndex((x) => x.href === r.href) === i),
            challenge: l.challenge ?? from.challenge,
          },
    )
}
