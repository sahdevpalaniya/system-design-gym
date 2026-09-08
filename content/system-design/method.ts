import type { Axis, Group, GroupId, StageDef, StageId } from '@/lib/types'

/* ---------- the five stages ---------- */

export const STAGES: StageDef[] = [
  {
    id: 1,
    name: 'Requirements',
    minutes: 5,
    ask: 'State your assumptions, ask one or two questions that would change a box on the whiteboard, then propose the scope yourself.',
    method: [
      'Say your assumptions out loud — scale, region, auth, payments, read or write heavy.',
      'Ask one or two questions, each one line, each with a short "because".',
      'Propose the scope. Do not wait to be told.',
      'The test for asking: does the answer change a box on the whiteboard? If it only changes a screen or a setting, assume it aloud and move on.',
    ],
  },
  {
    id: 2,
    name: 'Actors and lifecycle',
    minutes: 6,
    ask: 'List who touches the system — including the system itself — then write the main thing\'s life as a chain of states. Then add the failure branches.',
    method: [
      'List the actors. Include the system itself: the decisions the platform makes silently are usually where the interesting design is.',
      'Write the main object\'s life as a chain of states, start to finish.',
      'Now the part everyone skips: at each state ask what if this never finishes, and what if either side quits here.',
      'A lifecycle with only the happy path is half a lifecycle. The missing half is where the design lives.',
    ],
  },
  {
    id: 3,
    name: 'Numbers',
    minutes: 6,
    ask: 'Estimate requests per second, storage and bandwidth. Then finish this sentence: "So the hard part here is ___."',
    method: [
      'Daily users × actions per user, divided by 100,000, gives roughly the average per second.',
      'Multiply by 2–10 for peak, and say which multiplier you chose and why.',
      'Storage: bytes per record × records per day × days retained.',
      'Then the mandatory sentence: "So the hard part here is ___." If the numbers did not change your mind, you did the maths wrong or you ignored the answer.',
    ],
  },
  {
    id: 4,
    name: 'High-level design',
    minutes: 12,
    ask: 'Draw the boxes and arrows in words. Every box must be justified by a requirement from Stage 1 or a number from Stage 3.',
    method: [
      'Start from the request and follow it all the way to storage and back.',
      'Every component gets a reason attached: which requirement, or which number, put it there.',
      'A component nobody asked for loses points. If you cannot justify it, delete it.',
      'Name the data model and the key you partition by. That is usually the most load-bearing decision on the board.',
    ],
  },
  {
    id: 5,
    name: 'Deep dive and tradeoffs',
    minutes: 14,
    ask: 'Pick the two hardest parts and go deep. After every decision, say what it costs.',
    method: [
      'Choose the two parts the numbers said were hard. Not the two you find easiest to talk about.',
      'After every decision, name the price: "I\'ll cache this. Cost: users might see data up to a minute old."',
      'Name the choice as a choice. "I could also have done X; I picked this because ___."',
      'Someone who picks a slightly worse option and names the tradeoff scores higher than someone who picks the best option silently.',
    ],
  },
]

export function getStage(id: StageId): StageDef {
  return STAGES.find((s) => s.id === id)!
}

/** which rubric axis each stage feeds */
export const STAGE_AXIS: Record<StageId, Axis> = {
  1: 'requirements',
  2: 'lifecycle',
  3: 'numbers',
  4: 'design',
  5: 'tradeoffs',
}

/* ---------- problem groups ---------- */

export const GROUPS: Group[] = [
  {
    id: 'read-heavy',
    name: 'Read-heavy / caching',
    shape: 'Almost nobody writes. Everybody reads, and they read the same few things.',
    tell: 'Your estimate comes back with reads outnumbering writes by 50x or more. The write path is a non-problem and you should say so out loud instead of designing it.',
    slackNote: 'Usually generous. Content that is a few seconds old is invisible to a human.',
    examples: ['URL shortener', 'Pastebin', 'News feed read path', 'Leaderboard'],
  },
  {
    id: 'write-heavy',
    name: 'Write-heavy / fan-out',
    shape: 'One action by one person creates work for thousands of other people.',
    tell: 'The question is always the same: do you do that work when they write, or when everyone else reads? And what do you do about the one user with 200 million followers?',
    slackNote: 'Moderate. Nobody knows exactly when a post should have appeared, so seconds of delay are free.',
    examples: ['Twitter timeline', 'Chat delivery', 'Notification system', 'Activity feed'],
  },
  {
    id: 'matching',
    name: 'Matching under time pressure',
    shape: 'Two sides need to find each other, and one of them is a human who is waiting.',
    tell: 'Supply moves, demand is impatient, and the interesting design is what happens when nobody accepts — not the happy path.',
    slackNote: 'Almost none. Somebody is standing on a street. This is the group where async ruins the product.',
    examples: ['Ride hailing', 'Food delivery dispatch', 'Any two-sided marketplace'],
  },
  {
    id: 'contested',
    name: 'Contested inventory',
    shape: 'A fixed number of things and more people who want them than there are things.',
    tell: 'If two people can end up with the same one, you have failed, no matter how fast the system is. Caching the availability number is the classic wrong turn.',
    slackNote: 'Zero on the commit, plenty on everything around it. Browsing can be stale; the reservation cannot.',
    examples: ['Ticket booking', 'Hotel booking', 'Flash sale', 'Seat reservation'],
  },
  {
    id: 'big-files',
    name: 'Big files',
    shape: 'The payload is far bigger than the metadata, and it should not go through your servers at all.',
    tell: 'The moment you draw the file passing through your application server, you have made bandwidth your problem. Let the client talk to storage directly.',
    slackNote: 'Large for processing, zero for playback start. Nobody minds a video taking a minute to become HD; everybody minds four seconds before it starts.',
    examples: ['Video upload and playback', 'Cloud file storage', 'Image hosting'],
  },
  {
    id: 'live-push',
    name: 'Live push',
    shape: 'The server has to speak first, to a lot of people, at the same time.',
    tell: 'Capacity is measured in concurrent connections, not requests per second, and the hard part is the fan-out layer, not the socket.',
    slackNote: 'Small but real. A second of delay on a live score is fine; ten is not.',
    examples: ['Live sports score', 'Live comments', 'Collaborative editor', 'Presence'],
  },
  {
    id: 'search',
    name: 'Search and ranking',
    shape: 'The user gives you a fragment and expects the right answer ranked first.',
    tell: 'Two systems: one that narrows millions to dozens, one that ranks the dozens. Confusing them is the usual mistake.',
    slackNote: 'Typeahead has ~100 ms. Full search has a second. Indexing has minutes.',
    examples: ['Typeahead', 'Product search', 'Log search'],
  },
  {
    id: 'limits',
    name: 'Limits and abuse',
    shape: 'Deciding whether to say no, cheaply, on every single request.',
    tell: 'The decision has to be faster than the work it protects, which rules out most of the accurate answers.',
    slackNote: 'Effectively zero — it is in the request path — but the accuracy budget is generous.',
    examples: ['API rate limiter', 'Distributed counter', 'Fraud checks'],
  },
  {
    id: 'location',
    name: 'Location',
    shape: 'Two dimensions pretending to be one, plus a very high write rate from things that move.',
    tell: 'Writes hugely outnumber reads, positions are stale the moment they land, and the index gives you candidates rather than an answer.',
    slackNote: 'A few seconds of staleness in a position is invisible; a minute is not.',
    examples: ['Nearby places', 'Delivery zones', 'Live location ingestion'],
  },
  {
    id: 'pipelines',
    name: 'Data pipelines',
    shape: 'Enormous volume in, aggregates out, and nobody is waiting for any single event.',
    tell: 'This is the one group where you are allowed to be minutes behind. Spend that slack — batch aggressively, and design for replay when a job is wrong.',
    slackNote: 'Huge. Minutes, often hours. The mistake is building this like a request path.',
    examples: ['Analytics ingestion', 'Click aggregation', 'Metrics'],
  },
  {
    id: 'crawling',
    name: 'Crawling and ingestion',
    shape: 'The work is unbounded, the sources are hostile or fragile, and you are a guest on someone else\'s machine.',
    tell: 'There is no fixed input size — the queue of work generates more work. So the interesting questions are what you refuse to fetch, how you avoid fetching the same thing twice, and how you avoid hurting the sites you depend on.',
    slackNote: 'Enormous. Hours or days. The mistake is building this like a request path instead of a background system that runs forever.',
    examples: ['Web crawler', 'Feed and API ingestion', 'Data scraping pipelines'],
  },
  {
    id: 'sync',
    name: 'Sync and offline',
    shape: 'The same data lives on several devices, all of which can be edited while disconnected.',
    tell: 'Two people — or one person on two devices — changed the same thing offline. Everything hinges on whether you detect that or silently pick a winner, and on how little you can transfer to bring a device up to date.',
    slackNote: 'Large for propagation, zero for local edits. The device must feel instant offline; agreeing with the server can take seconds or minutes.',
    examples: ['File sync', 'Offline-first notes', 'Collaborative editing', 'Mobile app caches'],
  },
  {
    id: 'storage-engine',
    name: 'Building the storage itself',
    shape: 'You are not using a database — you are being asked to design one.',
    tell: 'The vocabulary flips from "which store do I pick" to replication, quorums, partition assignment and durability. This is the group where every Tier 2 concept is the answer rather than the context.',
    slackNote: 'Depends entirely on the promise you make. Strong consistency means no slack on the write path; tunable quorums let you sell some.',
    examples: ['Distributed key-value store', 'Distributed cache', 'Object storage', 'Message broker'],
  },
  {
    id: 'money',
    name: 'Money and correctness',
    shape: 'Being fast is worthless if the number is wrong, and every mistake is somebody\'s actual money.',
    tell: 'The design is dominated by exactly-once effects, audit trails and reconciliation with a third party who holds the real truth. Availability is negotiable here; correctness is not.',
    slackNote: 'Seconds on the authorisation a human is waiting for, hours on everything behind it — settlement, ledgers, payouts and reconciliation.',
    examples: ['Payments', 'Digital wallet', 'Ledger', 'Billing and invoicing'],
  },
]

export function getGroup(id: GroupId): Group {
  return GROUPS.find((g) => g.id === id)!
}

/* ---------- what the bar actually is, by level ----------
   The same answer scores differently depending on the role you are interviewing
   for. Most people practise to one bar and are surprised by the gap. */

export interface LevelBar {
  level: string
  titles: string
  passes: string[]
  fails: string[]
  tell: string
}

export const LEVELS: LevelBar[] = [
  {
    level: 'Entry to mid',
    titles: 'L3–L4 · E3–E4 · SDE I–II',
    passes: [
      'Follows a clear structure instead of freezing or drawing immediately.',
      'Asks a couple of questions that really change the design.',
      'Does the arithmetic and reaches a sensible high-level design.',
      'Knows what a cache, a queue and a load balancer are for.',
    ],
    fails: [
      'Draws boxes before establishing any requirement.',
      'Cannot estimate, or estimates and then ignores the answer.',
      'Silent for long stretches.',
    ],
    tell: 'The bar is a coherent, justified design. Depth on any one component is a bonus, not a requirement.',
  },
  {
    level: 'Senior',
    titles: 'L5 · E5 · SDE III',
    passes: [
      'Names the cost of every decision without being asked.',
      'Goes deep on the two components the numbers said were hard.',
      'Handles failure branches, not just the happy path.',
      'Holds up under follow-ups: defends, or concedes and adapts, without bluffing.',
      'Knows where their own design breaks and says so first.',
    ],
    fails: [
      'A correct design with no tradeoffs named out loud.',
      'Only ever the happy path — no answer for a dead dependency or a hot key.',
      'Folds instantly when challenged, or refuses to move when clearly wrong.',
    ],
    tell: 'This is where most interviews are actually decided, and it is decided in the follow-ups rather than the diagram.',
  },
  {
    level: 'Staff and above',
    titles: 'L6+ · E6+ · Principal',
    passes: [
      'Questions the requirement itself, and proposes a simpler product where one exists.',
      'Talks about cost, operations, migration and team boundaries, not just architecture.',
      'Has a real position on build versus buy, with reasoning.',
      'Explains how the system evolves — what you build now, and what you defer until a number changes.',
      'Drives the conversation rather than answering it.',
    ],
    fails: [
      'Technically excellent and never mentions what it costs to run or to staff.',
      'Designs the end state with no path from where the company actually is.',
      'Waits to be asked.',
    ],
    tell: 'The design is assumed. What is being assessed is judgement, and whether you would make good decisions when nobody is watching.',
  },
]
