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
import { EXERCISES } from './exercises'
import { QUIZZES } from './quiz'

/**
 * The Go track. Topics, not a timetable — the sections build on each other, but
 * how fast you move through them is yours to decide.
 */
export const GO: Language = {
  id: 'go',
  name: 'Go',
  tagline: 'Start from nothing. Finish with a real API you could put online.',
  blurb:
    'Go is small enough to learn well, and big enough to build real things with. You start with variables. You finish with a working JSON API that has user accounts, a database, file uploads and tests. It uses only four outside packages. Everything else comes with Go.',
  home: 'https://go.dev/',
  sections: [
    {
      id: 'basics',
      name: 'Getting started',
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
        'error-values',
        'packages',
        'json',
        'testing',
      ],
    },
    {
      id: 'concurrency',
      name: 'Concurrency',
      blurb: 'The part people come to Go for. Run things at the same time, safely, and stop them when you need to.',
      lessons: ['goroutines', 'channels-and-select', 'mutex-and-races', 'context'],
    },
    {
      id: 'generics',
      name: 'Generics and stdlib',
      blurb: 'Write one function that works for many types, and learn which built-in packages you will really use.',
      lessons: ['generics', 'standard-library'],
    },
    {
      id: 'web',
      name: 'Web services',
      blurb: 'Build an HTTP API with no framework, add middleware, shut it down cleanly, and lay the folders out well.',
      lessons: ['http-server', 'middleware-and-shutdown'],
    },
    {
      id: 'practice',
      name: 'Practice projects',
      blurb:
        'Build the same CRUD API three times, in three layouts, so the trade-offs are something you have felt rather than read.',
      lessons: ['project-layouts', 'practice-crud-easy', 'practice-crud-moderate', 'folder-structure-crud'],
    },
    {
      id: 'database',
      name: 'Databases',
      blurb: 'Postgres through database/sql. No ORM, so you can see exactly which queries run.',
      lessons: ['postgres-and-sql', 'joins-transactions-n-plus-one'],
    },
    {
      id: 'project-shortener',
      name: 'Project 1 — URL shortener',
      blurb:
        'Built with a **layered** structure — a folder per kind of code. Validation, storage, a redirect, then Postgres and a container.',
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
        'Built **by feature** — one folder per concept. Accounts, passwords and login, taught inside the project that needs them.',
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
      id: 'tooling',
      name: 'Modules and packages',
      blurb: 'How Go finds your code, the packages everyone actually uses, and the four commands to run before every push.',
      lessons: ['modules-and-tooling', 'popular-packages', 'packages-in-code'],
    },
    {
      id: 'production',
      name: 'Production',
      blurb: 'The difference between something that works and something you can put online and keep running.',
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
      id: 'interview',
      name: 'Interview preparation',
      blurb: 'Everything above, written the way interviewers ask it. Plus the live coding round and a last checklist.',
      lessons: [
        'interview-language-fundamentals',
        'interview-concurrency',
        'interview-backend-and-design',
        'interview-live-coding',
        'interview-final-checklist',
      ],
    },
  ],
  quizzes: [...QUIZZES, mixedTest(QUIZZES)],
  lessons: withExercises([
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
    ...INTERVIEW,
  ]),
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
