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
  oneLine: string
  /** why a total beginner should care, before any jargon */
  body: string[]
  visual?: ConceptVisual
  keyPoints: string[]
  /** the one thing to remember */
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
  oneLine: string
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
}

/** A topic group in the sidebar. Order is a suggestion, not a schedule. */
export interface LangSection {
  id: string
  name: string
  blurb: string
  /** lesson slugs, in the order they build on each other */
  lessons: string[]
}

export interface Language {
  id: string
  name: string
  tagline: string
  blurb: string
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
  /** matches a LangSection id, or "all" for the mixed final test */
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
