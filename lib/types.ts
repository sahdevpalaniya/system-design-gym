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
}

/* ---------- from-scratch lessons ---------- */

export interface Lesson {
  slug: string
  title: string
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
