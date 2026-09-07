import type { Problem } from '@/lib/types'

export const SOCIAL_TIMELINE: Problem = {
  slug: 'social-timeline',
  title: 'Follower timeline',
  group: 'write-heavy',
  difficulty: 'core',
  concepts: ['partitioning', 'caching', 'message-queues', 'consistency-models', 'distributed-counter'],
  prompt:
    'Design the home timeline for a social product. People follow each other; when you open the app you see recent posts from everyone you follow, newest first. Some accounts have tens of millions of followers.',

  slack: {
    budget: 'Reads: ~200 ms. Post visibility: seconds. Counts: minutes.',
    headline: 'Nobody knows exactly when a post was supposed to appear in their feed — so you have seconds of slack on delivery, and almost none on opening the app.',
    body: [
      'This is the key asymmetry. Opening the app has a hard budget: the timeline must render in a couple of hundred milliseconds or the product feels broken, and that budget is spent before you do anything clever. But nobody has a stopwatch on when someone else\'s post shows up. If it appears two seconds after they posted, or ten, no user can tell — there is no reference clock.',
      'That slack is the entire licence for fan-out on write. You are allowed to do a large amount of work asynchronously between "they posted" and "it appears in feeds", because nobody is watching that interval. Spend it. The one exception is the author themselves, who absolutely does know when they posted and will refresh immediately — so their own view of their own post has zero slack, and needs a different path.',
      'Counts — likes, replies, views — have minutes of slack. Nobody can tell 4,102 from 4,118. That is what lets you batch and approximate them instead of writing to a contended row on every interaction.',
    ],
    consequence:
      'Seconds of delivery slack means you can precompute timelines in the background rather than assembling them on read. Zero slack on the author\'s own view means you special-case it. Minutes of slack on counts means they never go near the hot path.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that would change a box, and propose the scope.',
      nudges: [
        'The follower distribution is the assumption that matters most here. Say it.',
        'Is the timeline strictly chronological, or ranked? That is a question that changes boxes.',
        'What is the read:write ratio for opening the app versus posting?',
      ],
      model: [
        'Assumptions: a few hundred million users, global, mostly mobile. Posts are small text plus optional media references. Reads dominate — people open the app far more than they post. Most people follow a few hundred accounts, and a handful of accounts have tens of millions of followers. Auth is solved elsewhere.',
        'First question, and it is the one that changes the most boxes: is the timeline strictly reverse-chronological, or ranked by relevance? Because ranked means I cannot simply precompute and append — every read may need scoring, and I need a feature store and a model serving path. I will assume reverse-chronological with a light recency-and-affinity ordering applied at read time, which keeps precomputation viable.',
        'Second question: must a post be visible in followers\' feeds immediately, or is a few seconds acceptable? This decides synchronous versus asynchronous fan-out, and it is worth asking because it sounds like a product nicety and is actually the central architectural constraint. I will assume a few seconds is fine.',
        'Scope I propose: post, follow and unfollow, and render the home timeline. Out of scope: ranking models, direct messages, notifications, and media storage — I will treat media as a reference to a separate service rather than pretend it does not exist.',
      ],
      checklist: [
        'Stated the follower distribution as skewed — a few accounts have tens of millions',
        'Asked whether the timeline is chronological or ranked, and said why it changes the design',
        'Asked whether delivery must be immediate or can take seconds',
        'Stated that reads dominate writes',
        'Proposed scope and named what is out of it',
      ],
      tradeoffs: [
        {
          decision: 'Chronological with light reordering',
          cost: 'Engagement will be lower than a ranked feed, and I have given up the ability to surface older-but-better posts. In exchange the timeline can be precomputed, which is what makes reads cheap.',
        },
      ],
      sayThis:
        '"Assuming hundreds of millions of users, most following a few hundred accounts, and a few accounts with tens of millions of followers — that skew is going to drive the whole design. One question: does a post need to appear in feeds instantly, or are a few seconds fine? Because that decides whether fan-out is synchronous. I will assume a few seconds."',
      trap: 'Asking about the character limit, or whether posts can be edited. Neither changes a box. The follower skew and the delivery deadline are the two things worth asking about.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write a post\'s life as a chain of states, and add the failure branches.',
      nudges: [
        'The system decides several things silently here. What are they?',
        'A post has a life, and so does a follow. Which one is more interesting?',
        'What happens to a post when the fan-out job dies halfway through?',
      ],
      model: [
        'Actors: the author, the followers who read, and the system. The system makes the decisions that matter — whether to fan this post out or leave it to be pulled, when a post is "delivered", what to do with followers who have not opened the app in months, and when to stop trying.',
        'A post\'s life: composed → accepted and durable → queued for fan-out → written into follower inboxes → read → possibly deleted.',
        'Failure branches. At accepted: the post is stored but the fan-out event is lost, so it never reaches anyone — this is why the event must be written in the same transaction as the post, via an outbox, rather than published separately. At queued: the author has 30 million followers, so this single job is 30 million writes and will flood the queue and delay everyone else\'s posts — the branch is to not fan out at all above a threshold and let readers pull instead. At writing to inboxes: the job crashes after 8 million of 30 million writes, so it retries and rewrites the first 8 million — which is fine only because inbox writes are idempotent on post id, and that is a requirement, not a bonus. At read: a follower\'s inbox is missing entries because their fan-out is still in flight, so their timeline is briefly short rather than wrong, which is acceptable and worth saying. At deleted: the post is now in millions of inboxes and cannot be deleted from all of them quickly — so deletion is a tombstone plus filtering at read time, and the inbox entries are cleaned up lazily.',
        'A follow also has a life worth a sentence: followed → backfill decision. Following someone does not retroactively insert their old posts into your inbox, because that would be another enormous write job. Their older posts appear via the pull path or simply are not shown. Saying this out loud is a good signal, because most people never consider it.',
      ],
      checklist: [
        'Named the system as an actor and listed decisions it makes silently',
        'Wrote the post lifecycle as a chain',
        'Handled the lost fan-out event — outbox, in the same transaction',
        'Handled the huge-account fan-out as a branch, not as a footnote',
        'Required inbox writes to be idempotent because fan-out jobs retry',
        'Handled deletion of a post already fanned out — tombstone and lazy cleanup',
        'Mentioned what happens on a new follow',
      ],
      trap: 'Treating fan-out as one atomic step. It is millions of individual writes that will partially fail, retry, and duplicate. If your lifecycle does not have a branch for "the job died at 8 million of 30 million", you have not thought about it.',
    },

    {
      id: 3,
      ask: 'Estimate the read rate, the write rate, and — the number that matters here — the fan-out write amplification. Then finish "So the hard part here is ___."',
      nudges: [
        'Posts per second is easy. Now multiply by the average follower count.',
        'What does the same number look like for the biggest account?',
        'Timeline opens per second — that is the read number.',
      ],
      model: [
        'Assume 200 million daily active users. Say each posts 0.5 times a day on average: 100 million posts a day, about 1,000 posts per second, peak maybe 3,000. That is a modest write rate on its own.',
        'Now the amplification, which is the real number. Average followers, say 300. Fan-out on write means every post becomes 300 inbox writes, so 1,000 posts a second becomes 300,000 inbox writes a second, peaking near a million. That is the number that decides everything, and it is three hundred times larger than the number you would have quoted if you stopped at "1,000 posts per second".',
        'The tail is worse than the average. One account with 30 million followers posting once produces 30 million writes. At 100,000 inbox writes a second of spare capacity, that single post takes five minutes to deliver and blocks everyone else\'s posts behind it. Averages hid this completely.',
        'Reads: 200 million users opening the app 10 times a day is 2 billion timeline reads a day, roughly 20,000 per second, peak 60,000. Each read returns maybe 50 posts.',
        'Storage: 100 million posts a day at ~300 bytes is 30 GB a day for posts, which is trivial. The inboxes are the cost — 300 million inbox entries a day at ~30 bytes each is about 9 GB a day, and it grows with follower count, not with post count. Bound it by capping each inbox at the most recent few hundred entries.',
        'So the hard part here is write amplification, and specifically its tail. Not the post rate, not storage, not read throughput. Everything I design next is aimed at the gap between 300 followers and 30 million.',
      ],
      checklist: [
        'Calculated posts per second',
        'Multiplied by average followers to get the real write rate — the amplification',
        'Calculated the same figure for the largest account and noticed it dominates',
        'Calculated timeline reads per second',
        'Noted that inbox storage is bounded by capping inbox length',
        'Finished the sentence naming write amplification and its tail',
      ],
      sayThis:
        '"A thousand posts a second sounds small, but at 300 followers each that is 300,000 inbox writes a second. And one account with 30 million followers turns a single post into 30 million writes, which at my throughput takes five minutes and blocks everyone behind it. So the hard part here is fan-out amplification at the tail, not the post rate."',
      trap: 'Reporting 1,000 posts per second and moving on. The post rate is not the workload; the post rate times the follower count is. Missing the multiplication is the single most common failure on this problem.',
    },

    {
      id: 4,
      ask: 'Draw the design. Justify every box by a requirement or a number, and say how you handle the huge accounts.',
      nudges: [
        'Push or pull — and why not just one of them?',
        'What is the inbox, physically? What is it keyed by?',
        'Where does the threshold between the two paths come from?',
      ],
      model: [
        'The core decision is push versus pull. Fan-out on write (push) precomputes each user\'s inbox when the author posts: reads are one sequential lookup, which is what a 20,000-reads-per-second budget wants, and writes are amplified 300x. Fan-out on read (pull) stores posts once and assembles the timeline by querying everyone you follow at read time: writes are trivial, reads are 300 queries plus a merge, which at 20,000 reads a second is impossible. Neither works alone, which is the answer: use both.',
        'The hybrid, which is the design. For ordinary accounts, push — fan out on write into follower inboxes. For accounts above a threshold, say 100,000 followers, do not fan out at all. Their posts stay in their own timeline, and at read time each user\'s feed is their precomputed inbox merged with the recent posts of the handful of huge accounts they follow. Most users follow only a few such accounts, so that merge is a small, cacheable read — and the huge accounts\' recent posts are the most cacheable data in the entire system, because millions of people want exactly the same rows.',
        'Justification by number: the 100,000 threshold comes from the amplification maths — below it, a post costs at most 100,000 writes, which the fan-out fleet absorbs in a second or two; above it, the job would monopolise the pipeline. It is a tunable number, and I would tune it by watching queue latency rather than by picking a round figure and defending it.',
        'The inbox itself: a list per user, keyed by user id, holding post ids and timestamps only — not post content, which would duplicate everything and make edits impossible. Capped at the most recent 500 entries, because nobody scrolls past that and unbounded inboxes are how this design runs out of disk. Partitioned by user id, so one user\'s timeline is one partition and one sequential read. Held in a store built for this shape: a wide-column store or Redis lists, not a relational table with an index.',
        'The write path: post accepted and written to the post store, with a fan-out event written in the same transaction via an outbox. A relay publishes it. Fan-out workers read the event, look up the author\'s followers, and write inbox entries in batches — idempotent on post id, because these workers will retry. Justified by the Stage 2 branch where a job dies partway through.',
        'The read path: timeline service reads the user\'s inbox (cached), merges in recent posts from the large accounts they follow (also cached), sorts, then hydrates post ids into full posts from a post-content cache. Hydration is a batch get, not 50 individual lookups.',
        'The author\'s own post: written to their own inbox synchronously, before the response returns. This costs one extra write and removes the single most common complaint in this kind of product — posting something and not seeing it.',
        'Counts — likes and replies — do not live in the post row. They are batched and aggregated separately, because a popular post would otherwise turn into a single contended row taking thousands of increments a second.',
      ],
      checklist: [
        'Chose a hybrid and explained why neither push nor pull works alone',
        'Named a follower threshold and justified it with the amplification number',
        'Inbox holds post ids, not post content, and is capped',
        'Inbox partitioned by user id so a timeline read is one partition',
        'Fan-out event written via an outbox in the same transaction as the post',
        'Fan-out workers are idempotent on post id',
        'Author\'s own post written synchronously to their own inbox',
        'Post hydration is a batch lookup, not N lookups',
        'Counts kept off the post row',
      ],
      tradeoffs: [
        {
          decision: 'Hybrid push and pull',
          cost: 'Two code paths for the same feature, forever, plus a threshold that needs tuning. Timelines are assembled from two sources, so ordering and pagination need care across the boundary.',
        },
        {
          decision: 'Inbox stores ids, not content',
          cost: 'Every read needs a hydration step, so a timeline is two round trips instead of one. In exchange, editing or deleting a post does not require rewriting millions of inbox rows.',
        },
        {
          decision: 'Capping inboxes at 500 entries',
          cost: 'Deep scrolling has to fall back to the pull path, which is slower. Almost nobody does it, so I am optimising for the 99%.',
        },
      ],
      trap: 'Picking push or pull and defending it to the end. The interviewer is waiting for you to notice that the follower distribution makes one answer wrong at each extreme. The hybrid is the answer; the threshold is the interesting part.',
    },

    {
      id: 5,
      ask: 'Go deep on the two hardest parts. Name a cost after every decision.',
      nudges: [
        'The numbers said amplification at the tail. What else did they say?',
        'What happens when the fan-out queue backs up an hour?',
        'How does pagination work when the feed comes from two sources?',
      ],
      model: [
        'Hard part one: the huge-account path, in detail. Above the threshold nothing is fanned out, so at read time I need the recent posts of every large account a user follows. I keep a per-author recent-posts list, capped at the last few hundred, cached aggressively — this is the highest-value cache in the system, because a single large account\'s recent posts are requested by millions of users, so the hit rate approaches 100% and one row serves enormous traffic. Cost: a post from a large account appears when the reader next refreshes rather than being pushed, so it can be slightly later than a small account\'s post — a subtle inconsistency I accept because the alternative is a five-minute fan-out.',
        'Merging the two sources correctly is the fiddly part. The inbox is ordered by time; so are the pulled lists. I merge and take the top N by timestamp. Pagination cannot be an offset, because the two sources shift independently — it has to be a cursor holding the timestamp and post id of the last item shown, and the next page asks both sources for items older than that cursor. Cost: a cursor is more work than an offset and cannot express "jump to page 5", which nobody wants in a feed anyway.',
        'Hard part two: fan-out backpressure. If the queue backs up, timelines silently get stale, and because nothing errors, nobody notices until users complain. Defences: separate queues by priority so a celebrity backfill cannot delay ordinary posts; alert on queue age rather than queue depth, because age is the number that maps to user pain; and scale workers off backlog growth rather than absolute size. If it backs up badly, I would rather drop fan-out for inactive users — someone who has not opened the app in 60 days does not need their inbox maintained in real time — and rebuild their timeline via the pull path when they return. Cost: a returning user\'s first load is slower, which is a good trade against delaying everyone else.',
        'Inactive users are worth raising unprompted: maintaining inboxes for accounts that never open the app is a large fraction of total fan-out work and produces zero value. Skipping them is one of the biggest real savings available here, and the cost is exactly the slower first load above.',
        'Hot key on read: a very large account\'s recent-posts row is read by millions. One cache key means one hot node. I would replicate that key across several cache nodes with a suffix and read a random one. Cost: N times the memory for those keys and slightly more complex invalidation — trivial, since there are only a few thousand such accounts.',
        'Consistency, said per feature: the timeline is eventually consistent and may be seconds behind, which is fine and matches how users perceive it. The author\'s own post is read-your-own-writes, guaranteed by the synchronous self-write. Like counts are eventually consistent and approximate. Follows are strongly consistent, because unfollowing someone and still seeing their posts is a trust problem, not a latency one — so the follow write is synchronous and the read path checks it.',
        'Deletion, revisited: a deleted post is tombstoned, filtered at hydration time, and its inbox entries are removed lazily. Cost: for a few seconds the post id sits in inboxes and is filtered out on read, which means a timeline can return 49 items instead of 50. Acceptable, and much cheaper than chasing millions of rows synchronously.',
      ],
      checklist: [
        'Detailed the large-account read path and why its cache hit rate is near perfect',
        'Merge and cursor-based pagination across two sources',
        'Fan-out backpressure — priority queues, alert on age not depth',
        'Skipping fan-out for inactive users, and the cost of doing so',
        'Handled the hot cache key with key replication',
        'Gave a per-feature consistency answer rather than one blanket statement',
        'Handled deletion through tombstones and lazy cleanup',
        'Named a cost after every decision',
      ],
      tradeoffs: [
        {
          decision: 'Skip fan-out for users inactive 60+ days',
          cost: 'Their first load on return is slow, built from the pull path. Saves a large share of total fan-out work.',
        },
        {
          decision: 'Replicate hot cache keys across nodes',
          cost: 'More memory and a fanned-out invalidation, for the few thousand accounts where one key would otherwise be a hot spot.',
        },
        {
          decision: 'Tombstone deletes instead of purging inboxes',
          cost: 'A timeline page can briefly come back one item short. Far cheaper than millions of synchronous deletes.',
        },
      ],
      sayThis:
        '"Above 100,000 followers I stop fanning out and pull at read time instead, because one post from a 30-million-follower account is 30 million writes that would block the queue for five minutes. Cost: their posts appear on refresh rather than being pushed, and I now maintain two paths forever. I would tune that threshold on queue age, not pick a round number."',
      trap: 'Going deep on the database schema and never mentioning what happens when the fan-out queue falls behind. Stale timelines fail silently — no errors, no alerts, just a product that quietly stops working.',
    },
  ],

  lifecycle: {
    caption:
      'A post\'s life. Every branch below is a real production failure mode — the fan-out job dying partway through is the one people forget.',
    states: [
      { id: 'composed', label: 'Composed', by: 'author' },
      { id: 'stored', label: 'Stored', by: 'system' },
      { id: 'queued', label: 'Queued', by: 'outbox relay' },
      { id: 'fanned', label: 'In inboxes', by: 'fan-out workers' },
      { id: 'read', label: 'Read', by: 'followers' },
    ],
    failures: [
      { after: 'stored', label: 'Fan-out event lost', handling: 'outbox in the same transaction — it cannot be lost' },
      { after: 'queued', label: 'Author has 30M followers', handling: 'above threshold, skip fan-out entirely; readers pull' },
      { after: 'fanned', label: 'Worker dies mid-job', handling: 'retry; inbox writes idempotent on post id' },
      { after: 'fanned', label: 'Queue backed up', handling: 'timelines silently stale — alert on message age, not depth' },
      { after: 'read', label: 'Post deleted', handling: 'tombstone, filter at hydration, clean inboxes lazily' },
    ],
  },

  architecture: {
    caption:
      'Two paths that meet at the timeline service. Ordinary accounts are pushed into inboxes; huge accounts are pulled at read time and cached hard.',
    nodes: [
      { id: 'a', label: 'Author', kind: 'client', col: 0, row: 0 },
      { id: 'ps', label: 'Post svc', kind: 'service', col: 1, row: 0 },
      { id: 'pdb', label: 'Posts + outbox', kind: 'store', col: 2, row: 0 },
      { id: 'q', label: 'Fan-out queue', kind: 'queue', col: 3, row: 0 },
      { id: 'fw', label: 'Fan-out workers', sub: 'idempotent', kind: 'service', col: 4, row: 0 },
      { id: 'in', label: 'Inboxes', sub: 'by user id, capped', kind: 'store', col: 4, row: 1 },
      { id: 'r', label: 'Reader', kind: 'client', col: 0, row: 1 },
      { id: 'ts', label: 'Timeline svc', sub: 'merge + hydrate', kind: 'service', col: 1, row: 1, span: 2 },
      { id: 'hot', label: 'Big-account cache', sub: 'recent posts', kind: 'cache', col: 1, row: 2, span: 2 },
    ],
    edges: [
      { from: 'a', to: 'ps' },
      { from: 'ps', to: 'pdb', label: 'one txn' },
      { from: 'pdb', to: 'q', label: 'relay' },
      { from: 'q', to: 'fw' },
      { from: 'fw', to: 'in' },
      { from: 'r', to: 'ts' },
      { from: 'ts', to: 'in', label: 'push path' },
      { from: 'ts', to: 'hot', label: 'pull path' },
    ],
  },

  numbers: {
    caption: 'The multiplication everyone forgets. The post rate is not the workload.',
    items: [
      { label: 'Posts created', value: 1000, display: '~1,000 / sec', tone: 'muted' },
      { label: 'Timeline opens', value: 20000, display: '~20,000 / sec', tone: 'muted' },
      { label: 'Inbox writes (fan-out at 300 followers)', value: 300000, display: '~300,000 / sec', tone: 'accent' },
      { label: 'One post from a 30M-follower account', value: 30000000, display: '30,000,000 writes', tone: 'bad' },
    ],
    note: 'So the hard part is fan-out amplification, and specifically its tail. The average says 300x; the worst case says 30 million, and the worst case is what takes the system down.',
  },

  flow: {
    scenario: 'fan-out-write',
    caption: 'One write in, many writes out. That is the deal: expensive writes buy cheap reads — until one author has 30 million followers.',
  },

  compare: {
    caption: 'Push versus pull. The reason the answer is "both" is the follower distribution.',
    a: {
      title: 'Fan-out on write (push)',
      points: [
        'Reads are one sequential lookup of a precomputed list. Fast and cheap.',
        'Write cost is multiplied by the follower count.',
        'A huge account turns one post into millions of writes and blocks the queue.',
        'Storage grows with follows, not with posts.',
      ],
    },
    b: {
      title: 'Fan-out on read (pull)',
      points: [
        'Writes are trivial — store the post once and stop.',
        'Reads query every account you follow and merge, which is hundreds of lookups.',
        'Perfect for huge accounts: their posts are read by millions, so cache hit rates are near 100%.',
        'Hopeless at 20,000 timeline opens a second for ordinary users.',
      ],
    },
    verdict:
      'Push for ordinary accounts, pull for the few above a follower threshold, and merge the two at read time. The threshold is the real design decision, and it should be tuned by watching fan-out queue age rather than picked as a round number.',
  },

  followUps: [
    'scale-celebrity',
    'scale-10x',
    'kill-queue',
    'consistency-own-write',
    'choice-queue',
    'cost-monthly',
    'ops-alert-first',
    'scope-multiregion',
  ],
}
