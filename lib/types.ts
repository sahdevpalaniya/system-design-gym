// ---------- scoring ----------

export const AXES = [
  'requirements',
  'lifecycle',
  'numbers',
  'design',
  'tradeoffs',
  'defence',
] as const

export type Axis = (typeof AXES)[number]

export const AXIS_LABEL: Record<Axis, string> = {
  requirements: 'Requirements',
  lifecycle: 'Lifecycle',
  numbers: 'Numbers',
  design: 'Design',
  tradeoffs: 'Tradeoffs',
  defence: 'Defence',
}

export const AXIS_EARNS: Record<Axis, string> = {
  requirements:
    'Assumptions stated aloud, questions that fork the design, scope proposed without being asked.',
  lifecycle: 'Failure branches present, not just the happy path.',
  numbers: 'Estimated and acted on — "so the hard part is ___".',
  design: 'Every component justified by a requirement or a number.',
  tradeoffs: 'Cost named after each decision, choices named as choices.',
  defence: 'Held up under follow-ups without folding or bluffing.',
}

export type Scores = Record<Axis, number>

// ---------- visuals ----------

export type NodeKind = 'client' | 'service' | 'store' | 'cache' | 'queue' | 'external' | 'note'

export interface DiagramNode {
  id: string
  label: string
  sub?: string
  kind: NodeKind
  /** grid column, 0-based */
  col: number
  /** grid row, 0-based */
  row: number
  /** how many columns wide, default 1 */
  span?: number
}

export interface DiagramEdge {
  from: string
  to: string
  label?: string
  dashed?: boolean
}

export interface DiagramSpec {
  caption: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

export interface LifecycleState {
  id: string
  label: string
  /** who drives this transition */
  by?: string
}

export interface LifecycleFailure {
  /** id of the state this branch drops out of */
  after: string
  label: string
  /** what the system does about it */
  handling: string
}

export interface LifecycleSpec {
  caption: string
  states: LifecycleState[]
  failures: LifecycleFailure[]
}

export interface NumbersBarItem {
  label: string
  value: number
  display: string
  tone?: 'accent' | 'muted' | 'bad'
}

export interface NumbersBarSpec {
  caption: string
  items: NumbersBarItem[]
  note?: string
}

export interface CompareSpec {
  caption: string
  a: { title: string; points: string[] }
  b: { title: string; points: string[] }
  verdict: string
}

export type FlowScenario =
  | 'cache-hit'
  | 'cache-miss'
  | 'load-balancer'
  | 'replication-lag'
  | 'queue-drain'
  | 'sharding'
  | 'fan-out-write'
  | 'rate-limit'
  | 'round-robin'
  | 'least-connections'
  | 'ip-hash'
  | 'weighted'
  | 'health-check'
  | 'active-passive'
  | 'active-active'
  | 'write-through'
  | 'write-back'
  | 'cdn-pull'
  | 'cdn-push'
  | 'leader-follower'
  | 'multi-leader'
  | 'consistent-hash-ring'
  | 'two-phase-commit'
  | 'saga'
  | 'circuit-breaker'
  | 'read-your-writes'
  | 'duplicate-delivery'
  | 'wal-append'
  | 'cdc-stream'

// ---------- concepts ----------

export type Tier = 1 | 2 | 3

export interface ConceptVisual {
  type: 'diagram' | 'flow' | 'compare' | 'numbers'
  diagram?: DiagramSpec
  flow?: { scenario: FlowScenario; caption: string }
  compare?: CompareSpec
  numbers?: NumbersBarSpec
}

export interface Concept {
  slug: string
  title: string
  /** short title for the sidebar; falls back to `title` */
  navTitle?: string
  tier: Tier
  /** one line for cards and the curriculum map */
  oneLine: string
  /** section 1 — what problem does this solve, 2-3 plain sentences */
  problem: string[]
  /** section 2 — mandatory cost */
  cost: string
  /** section 3 */
  useWhen: string[]
  avoidWhen: string[]
  /** section 4 */
  visual: ConceptVisual
  /** optional extra teaching body, plain paragraphs */
  body?: string[]
  /** section 5 */
  followUp: { q: string; answer: string }
  /** section 6 */
  selfCheck: { q: string; answer: string }
  traps?: string[]
  sayThis?: string
  related?: string[]
  /** where to go and learn this properly — primary sources, not blog rehashes */
  refs?: { label: string; href: string; note?: string }[]
  /** the form people actually search for, when it differs from the nav title —
   *  an abbreviation spelled out, or the commoner phrasing */
  searchTitle?: string
  /** how the topic is named inside a sentence, when the nav title does not fit
   *  a heading like "When to reach for ___" — e.g. "a relational database" */
  subject?: string
  /** the subject is plural ("reverse proxies", "CDNs"), so headings say
   *  "what problem do … solve" and "what … cost you" */
  plural?: boolean
  /** progressive nudges for the self-check, revealed one at a time */
  hints?: string[]
  /** a second, moving visual — shows the mechanism the static one only labels */
  animation?: { scenario: FlowScenario; caption: string }
  /** full <title> override, for topics people search for outside interview prep */
  metaTitle?: string
  /** meta description override; keep it under 155 characters */
  metaDescription?: string
  /** real configuration or code, shown under "How it works" */
  examples?: { label: string; src: string; note?: string }[]
  /** visible questions and answers; also published as FAQPage markup */
  faq?: { q: string; a: string }[]
  /** the H1, when the search phrasing differs from `title` (which cards, the
   *  sidebar and prev/next keep using) */
  heading?: string
  /** a side-by-side table under "How it works", for comparison pages */
  table?: { caption: string; headers: string[]; rows: string[][] }
}

// ---------- problems ----------

export type GroupId =
  | 'read-heavy'
  | 'write-heavy'
  | 'matching'
  | 'contested'
  | 'big-files'
  | 'live-push'
  | 'search'
  | 'limits'
  | 'location'
  | 'pipelines'
  | 'crawling'
  | 'sync'
  | 'storage-engine'
  | 'money'

export interface Group {
  id: GroupId
  name: string
  shape: string
  tell: string
  slackNote: string
  examples: string[]
}

export type StageId = 1 | 2 | 3 | 4 | 5

export interface StageDef {
  id: StageId
  name: string
  minutes: number
  /** what the user is asked to write */
  ask: string
  /** short reminder of the method, shown before submitting */
  method: string[]
}

export interface ProblemStage {
  id: StageId
  /** problem-specific prompt shown in the writing box */
  ask: string
  /** shown before submit — never gives the answer away */
  nudges: string[]
  /** the model answer, revealed only after submit */
  model: string[]
  /** key points; the user ticks the ones they had. drives the score. */
  checklist: string[]
  /** named tradeoffs inside the model answer */
  tradeoffs?: { decision: string; cost: string }[]
  sayThis?: string
  trap?: string
}

export interface Problem {
  slug: string
  title: string
  /** short title for the sidebar; falls back to `title` */
  navTitle?: string
  group: GroupId
  difficulty: 'starter' | 'core' | 'hard'
  concepts: string[]
  prompt: string
  /** the "where's the slack?" section — mandatory */
  slack: {
    budget: string
    headline: string
    body: string[]
    consequence: string
  }
  stages: ProblemStage[]
  /** the phrase people actually search for, e.g. "Design a URL shortener" */
  searchTitle?: string
  /** full <title> override for the /solution page, when people search for it in other words */
  solutionTitle?: string
  /** meta description override for the /solution page; keep it under 155 characters */
  solutionDescription?: string
  /** the /solution page H1, when it should lead with the searched phrase */
  solutionHeading?: string
  /** full <title> override for the practice page */
  practiceTitle?: string
  /** where this problem is solved for real — engineering write-ups and papers */
  refs?: { label: string; href: string; note?: string }[]
  lifecycle: LifecycleSpec
  architecture: DiagramSpec
  numbers: NumbersBarSpec
  flow?: { scenario: FlowScenario; caption: string }
  compare?: CompareSpec
  followUps: string[]
}

// ---------- follow-up engine ----------

export type FollowUpCategory =
  | 'break-scale'
  | 'kill-something'
  | 'attack-consistency'
  | 'question-choice'
  | 'force-cost'
  | 'operations'
  | 'change-scope'

export interface FollowUp {
  id: string
  category: FollowUpCategory
  q: string
  weak: string
  strong: string
  trap: string
  groups?: GroupId[]
}

// ---------- archetypes ----------

export type ArchetypeId =
  | 'pressure-tester'
  | 'cost-auditor'
  | 'scale-breaker'
  | 'domain-specialist'
  | 'scope-shifter'
  | 'constraint-setter'

export interface Archetype {
  id: ArchetypeId
  name: string
  tagline: string
  behaviour: string[]
  failing: string[]
  surviving: string[]
  /** rubric weighting, multiplies each axis */
  weights: Partial<Record<Axis, number>>
  /** which follow-up categories this interviewer reaches for */
  categories: FollowUpCategory[]
  drill: { q: string; weak: string; strong: string; trap: string }[]
  sayThis: string
}

// ---------- progress ----------

export type NodeState = 'untouched' | 'attempted' | 'solid' | 'review'

export interface StageAttempt {
  answer: string
  submittedAt: string
  checked: number[]
  score: number
}

export interface ProblemProgress {
  stages: Partial<Record<StageId, StageAttempt>>
  completedAt?: string
  lastTouched: string
}

export interface ConceptProgress {
  reps: number
  /** 1 = missed it, 4 = solid */
  lastRating: 1 | 2 | 3 | 4
  lastSeen: string
  dueAt: string
  answers: { answer: string; at: string }[]
}

export interface FollowUpAttempt {
  id: string
  answer: string
  at: string
  rating: 1 | 2 | 3
  category: FollowUpCategory
}

export interface GapEntry {
  id: string
  at: string
  text: string
  tags: string[]
  source: string
}

export interface ScoreEntry {
  at: string
  scores: Partial<Scores>
  source: string
  label: string
}

export interface MockRun {
  id: string
  problemSlug: string
  archetype: ArchetypeId | null
  at: string
  durationMs: number
  scores: Scores
}

export interface ProgressState {
  version: 1
  createdAt: string
  theme: 'light' | 'dark' | 'system'
  archetype: ArchetypeId | null
  streak: { days: string[] }
  concepts: Record<string, ConceptProgress>
  /** pages you have read, keyed "lesson:<slug>" / "concept:<slug>" / "deep:<slug>" -> ISO date */
  read: Record<string, string>
  problems: Record<string, ProblemProgress>
  followUps: FollowUpAttempt[]
  gaps: GapEntry[]
  scores: ScoreEntry[]
  mocks: MockRun[]
  blank: { title: string; stages: Record<string, string>; drawing?: string; savedAt: string }[]
  /** MCQ results, keyed "quiz:<lang>:<section>". Optional: added after v1 shipped. */
  quiz?: Record<string, QuizResult>
}

/* ---------- from-scratch lessons ---------- */

export interface Lesson {
  slug: string
  title: string
  /** short title for the sidebar; falls back to `title` */
  navTitle?: string
  /** the exact phrase people search for, used as the page <title> when set */
  searchTitle?: string
  /** meta description override; keep it 120-155 characters */
  description?: string
  oneLine: string
  /** why a total beginner should care, before any jargon */
  body: string[]
  visual?: ConceptVisual
  keyPoints: string[]
  /** the one thing to remember */
  remember: string
}

/** a standalone interview guide under /learn, outside the numbered lessons */
export interface Guide {
  slug: string
  /** the H1 */
  title: string
  /** the page <title>, absolute, under ~60 characters */
  searchTitle: string
  navTitle: string
  /** meta description; keep it under 155 characters */
  description: string
  /** the 40-60 word answer shown first, before any section */
  answer: string
  sections: {
    /** written as the question the section answers */
    heading: string
    body: string[]
    points?: string[]
    table?: { caption: string; headers: string[]; rows: string[][] }
  }[]
  keyPoints: string[]
  remember: string
}

/* ---------- deep dives ("view more") ---------- */

export interface DeepSection {
  heading: string
  /** short lead-in, before any list or visual */
  body: string[]
  /** scannable takeaways for this sub-topic */
  points?: string[]
  /** several visuals per section — one per sub-technique, not one per page */
  visuals?: ConceptVisual[]
  compare?: CompareSpec
  table?: { caption: string; headers: string[]; rows: string[][] }
  callouts?: { variant: 'cost' | 'trap' | 'say-this'; text: string }[]
}

export interface DeepDive {
  /** one paragraph on what the deep version adds over the summary */
  intro: string
  /** meta description; keep it 120-155 characters and name what the sections cover */
  description?: string
  minutes: number
  sections: DeepSection[]
}

/** a concrete worked example closing a concept page */
export interface WorkedExample {
  title: string
  scenario: string
  steps: { step: string; detail: string }[]
  outcome: string
  /** full five-stage problem to go and try */
  problemSlug?: string
}

/* ---------- company practice ---------- */

export interface CompanyQuestion {
  id: string
  company: string
  title: string
  prompt: string
  difficulty: 'starter' | 'core' | 'hard'
  /** what this company is really testing with this question */
  whatTheyWant: string
  /** revealed one at a time, before the answer — nudges, never answers */
  hints: { label: string; text: string }[]
  /** the model answer, gated behind the user's own attempt */
  model: string[]
  checklist: string[]
  followUp: { q: string; answer: string }
  relatedProblem?: string
  concepts: string[]
}

export interface Company {
  id: string
  name: string
  /** how this company tends to run the round */
  style: string
  weights: string
  archetype: ArchetypeId
  /**
   * The long-form hub text. Format facts come only from the company's own
   * careers pages (listed in `sources`); everything else is framed as candidate
   * reports. Strings use the Rich mini-markdown, so links work inline.
   */
  guide?: {
    /** the loop and where system design sits in it */
    loop: string[]
    /** what interviewers emphasise, as candidates report it */
    emphasis: string[]
    pitfalls: string[]
    /** ordered steps, linking our own problem and concept pages */
    plan: string[]
    sources: { label: string; url: string }[]
  }
}

/* ---------- language tracks ---------- */

export interface LangCode {
  /** filename or a short caption above the block */
  label?: string
  src: string
  /** one line under the block explaining what to look at */
  note?: string
  /**
   * A complete, runnable program for the Run button, when `src` is only an
   * excerpt.
   */
  run?: string
  /**
   * Set only by the verification script, on snippets it has actually compiled
   * and run. The Run button never appears without this or `run`, so it can
   * never be offered on code that fails.
   */
  canRun?: boolean
}

/** One row of a drawn folder tree. */
export interface LangTreeNode {
  /** how deep to indent, 0 = top level */
  depth: number
  name: string
  kind: 'dir' | 'file'
  /** what this folder or file is for, shown beside it */
  note?: string
}

export interface LangTree {
  caption?: string
  nodes: LangTreeNode[]
}

/** One unit of a lesson. Blocks render in order, so prose and code interleave. */
export interface LangBlock {
  heading?: string
  body?: string[]
  code?: LangCode
  tree?: LangTree
  bullets?: string[]
  table?: { headers: string[]; rows: string[][] }
  callout?: { tone: 'warn' | 'ok' | 'note'; text: string }
}

/** A drill, with the answer hidden until the reader asks for it. */
export interface LangExercise {
  task: string
  /** what they should see, or the shape of the answer — revealed on click */
  answer?: string
}

export interface LangLesson {
  slug: string
  title: string
  /**
   * A short title for the sidebar, where there is room for roughly 24
   * characters. Falls back to `title`. The page heading stays descriptive.
   */
  navTitle?: string
  /** the exact phrase people search for (e.g. "Golang interview questions
   *  and answers"), used as the page <title> instead of the generated one */
  searchTitle?: string
  /** meta description override, for a lesson whose generated one does not
   *  say what the searcher is looking for; keep it under 155 characters */
  metaDescription?: string
  oneLine: string
  /** 2–3 measurable outcomes, each starting with a verb: "Write a function that…" */
  objectives?: string[]
  blocks: LangBlock[]
  keyPoints: string[]
  /** the one thing to remember */
  remember: string
  /** the one thing to build before moving on */
  task?: string
  /** short drills to do in your own editor after the main task */
  exercises?: (string | LangExercise)[]
  /** official documentation for this topic */
  refs?: { label: string; href: string }[]
  /** an auto-graded coding exercise, checked by hidden tests on the Playground */
  challenge?: LangChallenge
}

/**
 * The learner edits `starter` (package main, no func main) until the hidden
 * `test` passes. Both are merged into one file before running, because the
 * Playground runs `go test` only for a single file with Test funcs and no main.
 */
export interface LangChallenge {
  prompt: string
  /** package main, the function(s) to implement, no func main */
  starter: string
  /** package main, imports "testing", Test funcs only */
  test: string
  /** a passing implementation, revealed after an attempt */
  solution: string
}

/** A topic group in the sidebar. Order is a suggestion, not a schedule. */
export interface LangSection {
  id: string
  name: string
  /** the phrase people search for, used as the section hub's title and H1
   *  (e.g. "DSA in Go"); falls back to "<name> in <language>" */
  searchTitle?: string
  /** meta description override for the section hub; keep it under 155 characters */
  metaDescription?: string
  blurb: string
  /** longer copy for the section hub, for sections whose blurb and lesson
   *  list alone do not explain what the section is for */
  intro?: {
    /** what the section covers and why, one paragraph each */
    about: string[]
    /** what you can do by the end, at the level of the whole section */
    outcomes: string[]
    /** what to finish first, the order to read in, and where to go next */
    order: string[]
  }
  /** lesson slugs, in the order they build on each other */
  lessons: string[]
}

export interface Language {
  id: string
  name: string
  /** the other name people search for, e.g. "Golang"; used in page titles */
  alias?: string
  tagline: string
  blurb: string
  /** meta description for the track home; keep it 120-155 characters */
  metaDescription?: string
  /** where the official docs live */
  home: string
  sections: LangSection[]
  lessons: LangLesson[]
  /** multiple-choice questions, keyed by section id */
  quizzes?: QuizSet[]
}

/* ---------- multiple choice ---------- */

export interface QuizQuestion {
  id: string
  q: string
  /** exactly one is right; index into this array */
  options: string[]
  answer: number
  /** why that answer is right — shown after they commit */
  why: string
  /** the lesson this comes from, so a wrong answer links back */
  from?: string
}

export interface QuizSet {
  /** a LangSection id (that section's test), "all" (the mixed final test), or any
   *  other id for a cross-section set such as a checkpoint */
  id: string
  name: string
  blurb: string
  questions: QuizQuestion[]
}

/** best score per quiz, keyed "quiz:<lang>:<section>" */
export interface QuizResult {
  best: number
  total: number
  attempts: number
  at: string
}
