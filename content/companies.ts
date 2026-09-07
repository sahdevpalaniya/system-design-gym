import type { Company, CompanyQuestion } from '@/lib/types'

/**
 * Company practice sits deliberately outside the core curriculum, which stays
 * company-agnostic. Learning "the answer a company wants" falls apart the
 * moment an interviewer goes off script — so these pages teach the *style* of
 * the round, and the questions are ordinary problems with the house emphasis.
 */

export const COMPANIES: Company[] = [
  {
    id: 'google',
    name: 'Google',
    style:
      'Scale first, and they mean it. Expect the numbers to be enormous from the opening sentence, and expect to be asked to justify a data structure choice at a level of detail other companies skip. Interviewers often go deep on one subproblem rather than broad across the system.',
    weights: 'Numbers and Design weigh heaviest. Vague estimates are punished hard.',
    archetype: 'scale-breaker',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    style:
      'Operational reality and cost. Who gets paged, what does this cost per month, how does it degrade, what happens on the busiest day of the year. Expect Leadership Principles to leak into the technical round — particularly ownership and frugality.',
    weights: 'Tradeoffs and Defence weigh heaviest, with real weight on operations.',
    archetype: 'cost-auditor',
  },
  {
    id: 'meta',
    name: 'Meta',
    style:
      'Product sense plus enormous fan-out. Expect social-graph shaped problems, expect the celebrity-user case to be raised early, and expect to be pushed on what the user actually experiences rather than what the diagram says.',
    weights: 'Requirements and Design, with fan-out and hot keys as the recurring pressure point.',
    archetype: 'pressure-tester',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    style:
      'Calmer and more collaborative than most. They are testing whether you can be reasoned with — expect the interviewer to propose an alternative and see whether you engage with it properly rather than defend by reflex.',
    weights: 'Lifecycle and Tradeoffs. Being genuinely open to a better idea scores.',
    archetype: 'scope-shifter',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    style:
      'Senior-heavy and blunt. Expect very few hand-holding questions, an assumption that you have run systems in production, and real interest in failure modes, chaos and graceful degradation.',
    weights: 'Defence and Tradeoffs. Hand-waving is spotted immediately.',
    archetype: 'domain-specialist',
  },
  {
    id: 'uber',
    name: 'Uber',
    style:
      'Real-time, geospatial and matching problems, because that is the business. Expect hard latency budgets, moving objects, and a lot of attention to what happens when the match fails.',
    weights: 'Lifecycle and Numbers, with latency budgets treated as hard constraints.',
    archetype: 'constraint-setter',
  },
]

export const COMPANY_QUESTIONS: CompanyQuestion[] = [
  /* ---------------- Google ---------------- */
  {
    id: 'g-typeahead',
    company: 'google',
    title: 'Design search autocomplete',
    prompt:
      'Design the suggestions that appear as a user types into a search box. Assume global traffic and that suggestions come from what people have searched for before.',
    difficulty: 'hard',
    whatTheyWant:
      'Whether you notice the latency budget is set by typing speed, and whether you reach for precomputation rather than searching per keystroke. They will go deep on the data structure — expect to be asked how the trie is stored and how big it is.',
    concepts: ['search-indexing', 'caching', 'cdn', 'rate-limiting'],
    hints: [
      {
        label: 'Where do I start?',
        text: 'Do the request-rate arithmetic before anything else. One search is not one request — the user types six characters, so it is roughly six requests. What does that do to your numbers?',
      },
      {
        label: 'What is the latency budget?',
        text: 'A person types a character every 150–250 ms. If your answer arrives after 300 ms, it is answering a prefix they have already moved past. So what does that rule out?',
      },
      {
        label: 'That rules out a lot — now what?',
        text: 'If you cannot search at request time, the answer must already exist before the request arrives. What could you compute in advance, and how much freedom does that give you?',
      },
      {
        label: 'How fresh does it need to be?',
        text: 'Yesterday\'s popular queries predict today\'s almost perfectly. Which parts of this are allowed to be hours old, and which specifically are not?',
      },
      {
        label: 'How big is the data, really?',
        text: 'Should you suggest every query anyone has ever typed, or only the top ones? Work out the size of each option — one of them changes where the index can live.',
      },
    ],
    model: [
      '**Numbers first.** 100,000 searches a second at peak, six keystrokes each with debouncing, so roughly 600,000 suggestion requests a second. The budget per request is about 100 ms, because a typist produces the next character in 150–250 ms and a late answer is answering a stale prefix.',
      '**That budget rules out searching at request time.** No general search engine holds 100 ms at 600,000 requests a second while scoring documents. So the answer has to be precomputed.',
      '**The structure.** A trie over the top 10 million queries, where every node stores the top 10 completions beneath it, computed at build time. Answering a request is then a six-character walk plus reading a list that is already there — no ranking, no scoring, microseconds.',
      '**Bounding the data is what makes it work.** Do not index every query ever typed; the tail is enormous and worthless as a suggestion. The top 10 million at roughly 40 bytes each is a few gigabytes with the structure — which fits in memory on one machine. That single fact means the index can be replicated to every serving node, so there is no network hop on the hot path at all.',
      '**Freshness, split three ways.** The base index rebuilds hourly, which is invisible for the long tail. Trending terms need minutes, so they get a small separate structure merged in at serve time. Blocklists need to apply immediately, so they are checked at serve time as well as build time — a build-time-only filter leaves an offensive suggestion live until the next rebuild.',
      '**Caching.** Short prefixes are requested constantly and are identical for everyone, so an edge cache keyed by prefix absorbs most traffic before it reaches a serving node.',
      '**Deployment.** Build a new index alongside the old and switch an atomic pointer. A failed build leaves the previous index serving, which is the right failure behaviour. Cost: peak memory is roughly double during the swap.',
    ],
    checklist: [
      'Applied the keystroke multiplier — one search is ~6 requests',
      'Derived the ~100 ms budget from human typing speed',
      'Concluded that per-request search cannot meet it, and said why',
      'Chose precomputation with top-N stored at each trie node',
      'Bounded the index to the top N queries, and noticed it then fits in memory',
      'Replicated the index to every node to remove the network hop',
      'Separated base freshness (hours) from trending (minutes) from blocklists (immediate)',
      'Edge caching keyed by prefix, justified by prefix concentration',
      'Atomic index swap, and named the 2x memory cost',
    ],
    followUp: {
      q: '"How do you handle typos?"',
      answer:
        'A trie is exact by nature, so this needs a deliberate answer rather than hoping. Two mechanisms, and I would use both. Precompute common misspellings as extra entries pointing at the correct query — real typos cluster heavily, so a relatively small set covers most of them, and it costs only index size. Then, when an exact prefix lookup returns too few results, fall back to a fuzzy match. The fallback is much slower, so it gets a tight timeout and must degrade to returning nothing rather than blowing the 100 ms budget. What I would not do is make every lookup fuzzy — that turns the cheap common case into the expensive rare one.',
    },
    relatedProblem: 'typeahead',
  },
  {
    id: 'g-crawler',
    company: 'google',
    title: 'Design a web crawler',
    prompt:
      'Design a system that crawls the web: fetches pages, extracts links, and keeps going. Assume you want to crawl billions of pages and keep them reasonably fresh.',
    difficulty: 'hard',
    whatTheyWant:
      'Politeness and deduplication, mostly. Plenty of candidates design a fast fetcher and forget that hammering one site is the fastest way to get blocked, and that the web is full of the same content at different URLs.',
    concepts: ['message-queues', 'bloom-filters', 'rate-limiting', 'consistent-hashing'],
    hints: [
      {
        label: 'What is the shape of this?',
        text: 'It is a graph traversal that never ends. What data structure does a traversal need, and what happens to it when the graph has billions of nodes?',
      },
      {
        label: 'What breaks first at that size?',
        text: 'You need to know whether you have already seen a URL. Storing every URL you have seen is how much data? And how fast does that check need to be?',
      },
      {
        label: 'Think about the sites you are crawling',
        text: 'What happens to a website if you fetch a thousand of its pages a second? What does that mean for how you order your work queue?',
      },
      {
        label: 'Same content, different URLs',
        text: 'The same page is reachable at many URLs, and many pages are near-identical. How would you detect that cheaply, before storing it?',
      },
      {
        label: 'Nothing stays fresh',
        text: 'A news homepage changes hourly; an archived page never changes. Should they be recrawled at the same rate?',
      },
    ],
    model: [
      '**Shape.** A never-ending breadth-first traversal: a frontier of URLs to fetch, workers that fetch and parse, and links discovered going back into the frontier.',
      '**The seen-set is the first thing that breaks.** Billions of URLs at ~70 bytes is hundreds of gigabytes, and every discovered link needs a membership check. A bloom filter in front makes the common answer — "already seen" — a memory operation, at the cost of occasionally skipping a page that was never crawled. That false-negative-free property is exactly why a bloom filter is safe here: it never wrongly claims something is new.',
      '**Politeness is the requirement people miss.** Fetching a thousand pages a second from one host gets you blocked and is genuinely rude. So the frontier is not one queue — it is partitioned by host, with a per-host rate limit and a politeness delay, and workers pull from hosts that are due rather than from a global list. Respect robots.txt and cache it per host.',
      '**Deduplication, twice.** URL-level: normalise before hashing — lowercase the host, strip default ports, sort or drop tracking query parameters, resolve redirects. Content-level: near-identical pages at different URLs are extremely common, so hash the content with a similarity-preserving hash rather than an exact one, and drop near-duplicates.',
      '**Prioritisation.** Not all pages deserve equal attention. Score by an importance signal and by observed change rate — recrawl a news homepage hourly and an archived page monthly. Storing the last-modified and the observed change frequency per URL lets this adapt on its own.',
      '**Traps.** Infinite spaces — calendars that generate a new URL forever — need depth limits and per-host page caps. Crawler traps and very large files need size and time limits per fetch.',
      '**Distribution.** Partition the frontier by host hash, so one host always belongs to one worker and the politeness limit is enforceable locally without coordination.',
    ],
    checklist: [
      'Described it as a graph traversal with a frontier',
      'Identified the seen-set size as a real problem and used a bloom filter',
      'Raised politeness — per-host rate limiting and robots.txt — unprompted',
      'Partitioned the frontier by host so politeness needs no coordination',
      'URL normalisation before deduplication',
      'Content-level near-duplicate detection with a similarity hash',
      'Recrawl frequency driven by observed change rate',
      'Handled crawler traps, infinite URL spaces and oversized responses',
    ],
    followUp: {
      q: '"Two URLs return the same page. How do you avoid storing it twice?"',
      answer:
        'Two different problems, and they need different tools. Exactly identical content is caught by hashing the normalised body and checking the hash — cheap and exact. Near-identical content is the harder and more common case: the same article with a different sidebar, or a page with a rotating advert. An exact hash is useless there because one changed byte gives a completely different hash. So I would use a similarity-preserving hash like SimHash or MinHash, where similar documents produce similar fingerprints and you can cheaply find pairs within a small Hamming distance. Before either of those, normalise the URL — lowercase the host, strip the default port and fragment, drop known tracking parameters, follow redirects to the final URL — because a large share of duplication is the same page reachable at cosmetically different addresses.',
    },
  },

  /* ---------------- Amazon ---------------- */
  {
    id: 'a-flash-sale',
    company: 'amazon',
    title: 'Design a flash sale / limited inventory drop',
    prompt:
      'Ten thousand units of a product go on sale at exactly 10am. A million people will try to buy them in the first minute. Nobody may buy a unit that does not exist.',
    difficulty: 'hard',
    whatTheyWant:
      'Correctness under extreme contention, and cost awareness. They will push on what happens when the cache is stale, and on whether you can justify the cost of the capacity you just asked for.',
    concepts: ['consistency-models', 'rate-limiting', 'caching', 'idempotency'],
    hints: [
      {
        label: 'Split the problem first',
        text: 'A million people arrive but only ten thousand can succeed. Are all of those requests doing the same kind of work? Which parts have to be exactly right, and which can be slightly wrong?',
      },
      {
        label: 'Count the successful writes',
        text: 'How many writes will ever succeed here, in total, across the whole sale? Compare that to the request rate. Does that change what the hard problem is?',
      },
      {
        label: 'Think about the traffic shape',
        text: 'This is not steady load — it is a wall arriving at a known second. What can you do with the fact that you know when it starts?',
      },
      {
        label: 'The dangerous bit',
        text: 'If you cache "units remaining" and two people read the same stale number, what happens? Which number is safe to cache and which is not?',
      },
      {
        label: 'Now the cost question',
        text: 'You have asked for capacity to absorb a million concurrent users. What does that cost for the 23 hours a day when nothing is happening?',
      },
    ],
    model: [
      '**Split by what must be exact.** Browsing, product pages and the stock indicator can all be stale and cached hard — that is the vast majority of the million requests. Only the claim of a unit must be exact. Keeping the exact tier small is the whole design.',
      '**The number that changes the design:** only 10,000 writes will ever succeed. That is trivial. This is not a throughput problem, it is a contention problem — the work is rejecting the ~99% of attempts that must fail, cheaply, before they reach the database.',
      '**A waiting room in front.** At 10am, admit users at a controlled rate rather than letting a million hit the checkout path. This converts an uncontrolled burst into a known rate the exact tier can actually serve, makes the experience honest (a position and an estimate, not an error), and doubles as the main anti-bot control.',
      '**The claim itself.** One conditional update: decrement remaining where remaining is greater than zero, or insert a row for a specific unit with a unique constraint. If it affects one row you have it; if zero, you do not. Explicitly not a read-then-write in application code — that gap is the race. And explicitly not a distributed lock: the database row is already a single point of serialisation, and a lock adds a failure mode where a paused holder\'s lease expires and two processes both believe they won.',
      '**Idempotency.** Mobile clients retry constantly. Every purchase attempt carries a client-generated key, inserted with a unique constraint in the same transaction as the claim, so a retry replays the original result rather than buying twice.',
      '**Pre-scale, because the time is known.** This spike is scheduled, so pre-warm caches and scale out beforehand rather than relying on autoscaling that reacts over minutes to a spike that arrives in seconds.',
      '**The cost answer.** The expensive capacity exists for one minute. So the waiting room and the static tier are what absorb the load — both cheap — and only a small exact tier is scaled up, briefly. Serving the product page from a CDN means the million requests mostly never reach compute I pay for by the second.',
    ],
    checklist: [
      'Separated the cacheable stale tier from the small exact tier',
      'Noticed total successful writes are bounded by inventory, so it is contention not throughput',
      'Waiting room or admission control to convert the burst into a rate',
      'Claim is a single conditional update, not check-then-write',
      'Explicitly rejected a distributed lock and explained why',
      'Idempotency keys on purchase attempts',
      'Used the fact that the start time is known — pre-scaling and cache warming',
      'Answered the cost question: cheap tiers absorb the spike, expensive tier stays small',
    ],
    followUp: {
      q: '"Your stock counter is cached and shows 50 left when there are actually 0. What happens?"',
      answer:
        'Nothing bad, provided the cached number is only ever used for display. Users see "50 left", click buy, and the conditional update at the claim step returns zero rows for everyone after the real stock hit zero — so they get a clean "sold out" rather than a purchase. That is an acceptable experience and it is why the design deliberately separates the displayed number from the decision. What would be a disaster is using the cached number to *decide* — if the code reads the cache, sees 50, and proceeds to create an order on that basis, you have oversold, and no amount of speed makes that acceptable. So the rule I would state plainly: cache the display, never cache the decision. I would also refresh the displayed count on a short TTL so it is directionally honest, and show "sold out" the moment a claim fails rather than letting someone retry into a wall.',
    },
    relatedProblem: 'ticket-booking',
  },
  {
    id: 'a-notification',
    company: 'amazon',
    title: 'Design a notification service',
    prompt:
      'Design a service other teams use to send notifications to users — push, email and SMS. It should handle hundreds of millions of notifications a day.',
    difficulty: 'core',
    whatTheyWant:
      'Operational thinking. Retries, dead letters, per-tenant fairness, and cost per message. Expect to be asked who gets paged when a downstream provider degrades.',
    concepts: ['message-queues', 'idempotency', 'rate-limiting', 'circuit-breakers'],
    hints: [
      {
        label: 'Who is the user here?',
        text: 'The caller is another team, not a person. What does that change about the API and about what happens when they misuse it?',
      },
      {
        label: 'How much slack is there?',
        text: 'Does a notification need to be delivered synchronously while the caller waits? What does the answer let you do?',
      },
      {
        label: 'The providers are not yours',
        text: 'Email and SMS go through third parties that will be slow or down sometimes. What must happen to a message when that occurs?',
      },
      {
        label: 'Fairness between callers',
        text: 'One team sends a 50-million-message marketing blast. What happens to the team sending password reset emails at the same time?',
      },
      {
        label: 'What can go wrong that is worse than not sending?',
        text: 'Think about retries. What is the failure mode users complain about loudest?',
      },
    ],
    model: [
      '**Accept and acknowledge fast.** The API takes a notification, validates its shape, writes it to a durable queue and returns. Callers are not kept waiting on a third-party provider — that is the whole point of the service existing.',
      '**Priority queues, separated by class.** Transactional messages — password resets, order confirmations — go in a separate queue from marketing. Without this, one team\'s 50-million-message blast sits in front of another team\'s password resets, and the second team\'s users cannot log in. Per-tenant rate limits on top, so no caller can monopolise the workers.',
      '**Idempotency, because at-least-once is what queues give you.** Every message carries a client-supplied key or a natural id. Workers record processed ids in the same transaction as marking the send, so a redelivery does not send a second copy. Sending someone the same alert five times is the complaint users make loudest.',
      '**Provider failures.** Each provider gets a timeout, a circuit breaker and its own connection pool, so a slow SMS vendor cannot exhaust the workers that send email. When a breaker opens, either fail over to a secondary provider or park the message rather than burning retries against something known to be down.',
      '**Retries with backoff and jitter, capped**, then a dead letter queue with an alert on arrival rate. A DLQ nobody watches is a silent data-loss machine.',
      '**Expiry, which people forget.** A "your driver is arriving" push delivered forty minutes late is worse than useless. Messages carry a time-to-live and are dropped rather than delivered stale.',
      '**User preferences and quiet hours** are checked at send time, not enqueue time, because they may change while a message waits.',
      '**Operationally:** alert on oldest-message-age rather than queue depth, because age maps to user pain; track per-provider success rate; and per-tenant dashboards, because the first question in an incident is which caller changed.',
    ],
    checklist: [
      'Accept-and-queue rather than sending synchronously',
      'Separate queues by priority class, not one shared queue',
      'Per-tenant rate limits for fairness',
      'Idempotency so a redelivery does not double-send',
      'Per-provider circuit breakers and isolated pools',
      'Backoff with jitter, capped retries, then a monitored DLQ',
      'Message TTL — drop stale notifications rather than deliver them late',
      'Alert on message age, not queue depth',
    ],
    followUp: {
      q: '"Who gets paged when the SMS provider is down, and what do they do?"',
      answer:
        'Ideally nobody gets paged for the provider being down, because the system should absorb it — that is what the circuit breaker and the failover provider are for. What should page someone is user-visible impact: the oldest undelivered message in the transactional queue crossing a threshold, or the DLQ receiving messages at an unusual rate. When that fires, the runbook is: check whether it is one provider or all of them, flip the affected traffic to the secondary provider if the breaker has not already, and if there is no secondary, decide explicitly whether to hold messages or drop the ones whose TTL has passed. The thing I would want in place beforehand is per-provider dashboards, so the first minute is not spent working out which of three vendors is the problem. And I would treat "we had no secondary SMS provider" as the actual bug to fix afterwards.',
    },
  },

  /* ---------------- Meta ---------------- */
  {
    id: 'm-newsfeed',
    company: 'meta',
    title: 'Design a news feed',
    prompt:
      'Design the feed a user sees when they open a social app: recent posts from the people and pages they follow, ordered sensibly.',
    difficulty: 'hard',
    whatTheyWant:
      'The fan-out decision, and specifically what you do about accounts with tens of millions of followers. They will raise the celebrity case early — having already handled it is the difference between a good and a great answer.',
    concepts: ['partitioning', 'caching', 'message-queues', 'distributed-counter'],
    hints: [
      {
        label: 'Two obvious designs',
        text: 'You could build each user\'s feed when someone posts, or when the user opens the app. Work out the cost of each before choosing.',
      },
      {
        label: 'Do the multiplication',
        text: 'Posts per second is not the workload. What do you have to multiply it by, and what does that number become?',
      },
      {
        label: 'Now look at the extreme',
        text: 'You used an average follower count. What is the maximum? What does one post from that account cost, and what does it do to everyone else\'s posts?',
      },
      {
        label: 'Neither pure option works',
        text: 'Push breaks at the top of the distribution; pull breaks for ordinary users. What if different accounts were treated differently?',
      },
      {
        label: 'Where does the threshold come from?',
        text: 'If you split by follower count, how would you actually choose the number — and how would you know it was wrong?',
      },
    ],
    model: [
      '**The two options and why neither works alone.** Fan-out on write precomputes each follower\'s feed when someone posts: reads become one sequential lookup, and writes are multiplied by the follower count. Fan-out on read stores the post once and assembles feeds at read time: writes are trivial, reads become hundreds of queries plus a merge. At 20,000 feed opens a second, pull alone is impossible; at 30 million followers, push alone is impossible.',
      '**The numbers.** 1,000 posts a second is not the workload. At ~300 followers average, fan-out on write is 300,000 inbox writes a second. And one post from a 30-million-follower account is 30 million writes, which at realistic throughput takes minutes and blocks everyone else\'s posts behind it. The average hid the case that breaks the system.',
      '**The hybrid.** Push for ordinary accounts. Above a follower threshold — order of 100,000 — do not fan out at all: leave those posts in place and have readers pull them at read time, merged with their precomputed inbox. This works precisely because a huge account\'s recent posts are the most cacheable data in the system: millions of people want the same few rows, so the hit rate approaches 100%.',
      '**The threshold is tuned, not picked.** It comes from fan-out queue age: if delivery latency starts climbing, the threshold is too high. Quoting a round number as if it were derived is worse than saying how you would find it.',
      '**The inbox** holds post ids and timestamps only, not content — otherwise editing or deleting a post means rewriting millions of rows. Capped at a few hundred entries, partitioned by user id so one feed is one partition and one sequential read. Reads hydrate ids into content with a batch lookup, never N lookups.',
      '**The author\'s own post is written synchronously to their own inbox**, because they will refresh immediately and not seeing their own post is the single most common complaint.',
      '**Backpressure.** If the fan-out queue backs up, feeds go stale silently — nothing errors. Alert on message age. Skip fan-out entirely for users inactive for months and rebuild their feed via the pull path when they return; that is one of the largest real savings available.',
    ],
    checklist: [
      'Named both fan-out strategies and why each fails alone',
      'Multiplied posts by follower count to get the real write rate',
      'Checked the tail of the distribution, not just the average',
      'Chose a hybrid with a follower threshold',
      'Said the threshold is tuned from queue age rather than picked',
      'Inbox stores ids not content, and is capped',
      'Author\'s own post written synchronously',
      'Batch hydration rather than N lookups',
      'Handled fan-out backpressure and inactive users',
    ],
    followUp: {
      q: '"A user with 200 million followers posts. Walk me through the next 60 seconds."',
      answer:
        'Nothing fans out, because they are far above the threshold — that is the point of having one. The post is written to the post store and to that author\'s own recent-posts list, which is a single small write, and it is done. No queue is touched, no inbox is written, and crucially nobody else\'s posts are delayed. Then, as their followers open the app over the following seconds and minutes, each feed read merges their precomputed inbox with the recent posts of the handful of large accounts they follow. That merge is a cache read that is almost always a hit, because millions of people are reading the exact same rows — this is the one case where pull is dramatically cheaper than push. What I would watch in those 60 seconds is the cache node holding that author\'s row, since it is now extremely hot; I would replicate that key across several nodes with a suffix and read a random one. The cost I would name: their post appears when a follower next refreshes rather than being pushed, so it can land slightly later than a small account\'s post would.',
    },
    relatedProblem: 'social-timeline',
  },

  /* ---------------- Netflix ---------------- */
  {
    id: 'n-video',
    company: 'netflix',
    title: 'Design video streaming',
    prompt:
      'Design a service that streams video to tens of millions of concurrent viewers worldwide, adapting to each viewer\'s connection.',
    difficulty: 'hard',
    whatTheyWant:
      'Whether you understand that this is a bandwidth problem before it is anything else, and whether you can talk about graceful degradation. Expect deep questions on what happens when a region or a CDN partner fails.',
    concepts: ['cdn', 'message-queues', 'caching', 'idempotency'],
    hints: [
      {
        label: 'Estimate two things and compare them',
        text: 'How much data comes in from uploads, and how much goes out to viewers? Which is bigger, and by how much?',
      },
      {
        label: 'That ratio should worry you',
        text: 'If all that egress came from your own servers, what would dominate your entire cost structure?',
      },
      {
        label: 'How do you serve one file at many qualities?',
        text: 'A viewer on a train and a viewer on fibre need different things from the same video. What has to happen to the file in advance?',
      },
      {
        label: 'Why chop it up?',
        text: 'Video is delivered in short segments rather than one big file. What three separate problems does that solve at once?',
      },
      {
        label: 'Now the failure question',
        text: 'A CDN partner degrades in one country mid-evening. What does a viewer experience, and what can the player do about it?',
      },
    ],
    model: [
      '**The estimate that decides everything.** Ingest might be ~8 GB/s; egress to viewers is on the order of 1,350 GB/s and never stops. Egress is roughly 170x ingest. So bandwidth dominates the cost of this system, and the design goal is that almost none of it comes from my origin.',
      '**Segmented adaptive streaming.** Each video is transcoded into several bitrate ladders and chopped into segments of a few seconds, with a manifest listing them. This solves three problems at once: every segment is a static cacheable file, so a CDN can serve it; the player can switch quality per segment as the connection changes; and a failed segment retries without restarting the video.',
      '**Delivery.** Segments are immutable with long cache lifetimes, so CDN hit rates are extremely high and purging is essentially never needed. The long tail — content watched rarely — is the real challenge, not the popular content, which caches itself. Tiered caching, where edge misses go to a regional cache rather than origin, collapses many edge misses into one origin fetch.',
      '**Processing has hours of slack** and is fully asynchronous: upload lands in object storage, a durable event triggers transcoding, workers are idempotent and run on interruptible capacity. Publish as soon as one usable rendition exists rather than waiting for all of them, and write the manifest last so publishing is effectively atomic.',
      '**Uploads never pass through application servers** — presigned direct-to-storage, chunked and resumable, because at this ingest volume routing bytes through your own compute means becoming a bandwidth company for no benefit.',
      '**Degradation, which is what they are really asking about.** The player measures throughput and steps down a rung rather than stalling — a lower bitrate is dramatically better than a spinner. If a CDN partner degrades, the player retries the segment against an alternate CDN, so multi-CDN is not just cost negotiation, it is the failure story. Startup uses a low bitrate deliberately so playback begins fast, then steps up.',
      '**What I would monitor:** playback start time, rebuffer rate, and CDN hit ratio split by popularity tier — an aggregate hit rate hides the long tail entirely.',
    ],
    checklist: [
      'Estimated ingest and egress and compared them',
      'Concluded bandwidth dominates and origin egress must be near zero',
      'Explained segmentation and the three problems it solves',
      'Adaptive bitrate driven by measured throughput, starting low',
      'Immutable segments with long TTLs; tiered caching for the long tail',
      'Identified the long tail rather than viral content as the caching challenge',
      'Direct-to-storage uploads, resumable and chunked',
      'Async idempotent transcoding on interruptible capacity',
      'Multi-CDN failover as the degradation story',
    ],
    followUp: {
      q: '"A CDN partner degrades in one country during peak hours. What does the viewer see?"',
      answer:
        'Ideally a brief quality drop and nothing else, and that is achievable because of decisions made in advance. The player is fetching short segments, measuring how fast each arrives, and choosing the next bitrate from that measurement — so as the CDN slows, the player steps down a rung and keeps playing rather than stalling. Meanwhile the buffer, typically ten to thirty seconds, absorbs the variation while that adjustment happens. If segments start failing outright rather than just arriving slowly, the player retries against an alternate CDN, because the manifest can carry more than one host and segments are immutable so it does not matter where a given segment comes from. That is why multi-CDN is a resilience decision and not only a commercial one. What the viewer must not see is a stall, because a stall is the metric that correlates with people giving up — so the whole chain is biased toward degrading picture quality rather than pausing. I would be watching rebuffer rate by region, since that is where this shows up first.',
    },
    relatedProblem: 'video-platform',
  },

  /* ---------------- Uber ---------------- */
  {
    id: 'u-matching',
    company: 'uber',
    title: 'Design driver-rider matching',
    prompt:
      'A rider requests a car from where they are standing. Find a nearby driver, offer them the trip, and confirm the match. Drivers move continuously and can decline.',
    difficulty: 'hard',
    whatTheyWant:
      'That you treat the latency budget as a hard constraint, and that the failure branches are the design. They will ask what happens when nobody accepts — because at peak that is a large share of requests, not an edge case.',
    concepts: ['geospatial-indexing', 'consensus', 'idempotency', 'realtime-transports'],
    hints: [
      {
        label: 'What is the budget?',
        text: 'Someone is standing outside holding a phone. How long before that feels broken? What does that rule out?',
      },
      {
        label: 'Count the writes',
        text: 'Drivers report position every few seconds. How many writes per second is that in one city, and how does it compare to the number of ride requests?',
      },
      {
        label: 'How big is that data?',
        text: 'What is a driver position, in bytes? Multiply by the number of drivers. Does the answer change where it should live?',
      },
      {
        label: 'Finding nearby',
        text: 'A database index sorts on one dimension. Location has two. How do you make "within 2 km" into something indexable?',
      },
      {
        label: 'Now the branch that matters',
        text: 'You offered the trip and the driver ignored it. Then the next one declined. Then the next. What now — and how long has the rider been waiting?',
      },
    ],
    model: [
      '**The budget is the constraint.** A rider is physically standing outside. Ten seconds feels broken. That rules out batch optimisation entirely — which is worth saying explicitly, because batching produces measurably better assignments and is the right answer for food delivery, where fifteen minutes of cooking hides the delay. Here there is no slack, so matching is greedy: a good driver now beats the best driver in forty seconds.',
      '**The numbers, and the one that changes the design.** 100,000 active drivers pinging every 4 seconds is 25,000 location writes a second, against maybe 500 ride requests a second — writes beat reads fifty to one, the opposite of most systems. But all live positions are about 10 MB. That means the live index belongs in memory, not in a durable database, and paying for durability on a position that is worthless in four seconds is spending money to protect nothing.',
      '**The geo index.** Encode positions as geohash cells and keep, per cell, the drivers in it with their coordinates and last-seen time — Redis sorted sets fit this exactly. A search reads the rider\'s cell **plus the eight neighbours**, because a driver 100 metres away can easily be just over a cell boundary, and missing them is a real bug not a theoretical one. Then filter out anyone whose position is more than ~15 seconds stale, and rank by estimated arrival time rather than straight-line distance — a driver 200 metres away across a motorway with no crossing is further away in practice than one 600 metres down the same road.',
      '**The offer protocol, which is where riders are actually lost.** Offer to the top candidate with a short timeout. Offers must expire **server-side**, not just in the driver\'s app, or a frozen client accepting 40 seconds late collides with a completed match. If the first couple time out, switch to offering a small batch simultaneously and take the first accept — which converts a latency problem into a correctness one, solved by making accept a conditional update on trip state so the first wins and the others get a clean "this trip is taken".',
      '**Nobody accepts — the branch people skip.** After a bounded number of rounds, re-running the search each round because the world has moved on in ten seconds, stop and tell the rider honestly that no driver is available. An infinite spinner is the worst outcome available.',
      '**Trip state is the one durable, strongly consistent thing here**, because it decides who is going where and who gets paid. Everything about positions is deliberately stale and in memory.',
      '**Idempotency** on both request and accept, because mobile networks retry constantly and a duplicate must not create two trips or two assignments.',
    ],
    checklist: [
      'Treated the ~10 second budget as a hard constraint and rejected batch optimisation with a reason',
      'Calculated location writes and compared to request rate',
      'Noticed all positions fit in memory, so no durable store for them',
      'Used a geospatial encoding and searched neighbouring cells',
      'Filtered stale positions before ranking',
      'Ranked by ETA rather than straight-line distance',
      'Offers expire server-side',
      'Accept is a conditional write so simultaneous accepts resolve cleanly',
      'Bounded rounds with re-search, then an honest no-driver result',
      'Idempotency keys on request and accept',
    ],
    followUp: {
      q: '"Nobody accepts the trip. What happens, and how long does the rider wait?"',
      answer:
        'This is the common case at peak, not an edge case, so it needs a real answer. Each offer has a short timeout — a few seconds — and expires server-side so a late accept cannot collide with anything. After a couple of timeouts I stop offering sequentially and offer to a small batch at once, because three sequential five-second timeouts have already consumed fifteen seconds of a ten-second budget. Between rounds I re-run the candidate search rather than reusing the original list, because in ten seconds drivers have moved and some have become free — reusing a stale list is how you keep offering to the same unresponsive drivers. I widen the radius each round. And then the important part: after a bounded number of rounds, roughly three, I stop and tell the rider no driver is available, with a retry option and if possible an honest wait estimate. An infinite spinner is worse than a clear no, because the rider who is told no can decide what to do, and the rider watching a spinner just leaves. I would also record the decline, because a driver declining everything is a supply problem rather than a matching one, and acceptance rate by area is the earliest signal that something is wrong.',
    },
    relatedProblem: 'ride-matching',
  },

  /* ---------------- Microsoft ---------------- */
  {
    id: 'ms-collab',
    company: 'microsoft',
    title: 'Design a collaborative document editor',
    prompt:
      'Several people edit the same document at the same time and see each other\'s changes live. Design it.',
    difficulty: 'hard',
    whatTheyWant:
      'How you handle concurrent edits to the same data, and whether you engage with alternatives properly. Expect the interviewer to suggest a different approach partway through and watch whether you evaluate it or defend by reflex.',
    concepts: ['realtime-transports', 'consistency-models', 'replication', 'idempotency'],
    hints: [
      {
        label: 'What is the hard part?',
        text: 'It is not the network. Two people type at the same position at the same moment — what has to be true about the result?',
      },
      {
        label: 'Why not just last-write-wins?',
        text: 'If you store the whole document and take the last save, what happens to the other person\'s work?',
      },
      {
        label: 'What if you sent changes instead?',
        text: 'Rather than the document, send "insert X at position 5". What goes wrong when two of those arrive in different orders on different machines?',
      },
      {
        label: 'Two known families of solution',
        text: 'One transforms incoming operations against ones already applied. The other designs the data type so merging is order-independent. What does each cost?',
      },
      {
        label: 'Do not forget the boring parts',
        text: 'Presence, cursors, offline editing, and what a new joiner loads. Which of these is actually hard?',
      },
    ],
    model: [
      '**The hard part is concurrent edits, not transport.** Sending changes over a socket is straightforward; deciding what the document *is* when two people edit the same position simultaneously is the actual problem.',
      '**Why the obvious options fail.** Storing the whole document and taking the last save silently destroys the other person\'s work. Sending positional operations naively fails because position 5 means different things depending on what has already been applied — apply the same two operations in different orders on two machines and the documents diverge permanently.',
      '**Two real families.** **Operational Transformation** transforms an incoming operation against operations already applied locally, so the result converges. It works, it is what several large editors use, and it is genuinely hard to get right — the transformation functions are subtle and usually need a central server to impose an order. **CRDTs** design the data type so that concurrent changes merge to the same result regardless of order — each character gets a unique identifier rather than an index, so "insert after character X" is unambiguous no matter what else happened. Simpler to reason about and to distribute; costs metadata per character, which means memory overhead and needs care with tombstones for deleted content.',
      '**I would take a CRDT** for a new system, mainly because it does not require a central serialisation point and offline editing falls out naturally. But I would say plainly that OT is a legitimate choice with a longer production track record, and if the interviewer prefers it I would want to hear why — this is a genuine engineering disagreement, not a settled question.',
      '**Transport.** WebSockets, because edits flow both directions constantly. Server holds the authoritative document and broadcasts changes to everyone in the session. Clients apply their own edits optimistically so typing feels instant, then reconcile.',
      '**The boring parts that matter.** Presence and cursors are ephemeral and can be lossy — do not persist them. A new joiner loads a snapshot plus operations since, so you periodically compact operations into snapshots or joining a long-lived document becomes slow. Persistence is the operation log, with snapshots as an optimisation; that also gives version history for free.',
      '**Failure modes.** A reconnecting client sends operations it made while offline, which must merge rather than overwrite — the CRDT choice makes this ordinary rather than special. A slow client must not hold up others, so per-connection buffers are bounded and a client that falls too far behind is dropped and resyncs from a snapshot.',
    ],
    checklist: [
      'Identified concurrent edits as the hard part, not the transport',
      'Explained why last-write-wins and naive positional ops both fail',
      'Named both OT and CRDTs and described the actual difference',
      'Made a choice and named what it costs',
      'Engaged with the alternative rather than dismissing it',
      'Optimistic local application so typing feels instant',
      'Snapshot plus operation log, with compaction for new joiners',
      'Presence and cursors treated as ephemeral',
      'Handled reconnect-after-offline and slow clients',
    ],
    followUp: {
      q: '"I think operational transformation is the better choice here. Convince me otherwise — or agree."',
      answer:
        'I would genuinely engage rather than defend, because this is a real disagreement among people who build these systems. The case for OT is strong: it has the longer production track record, the documents are smaller because you are not carrying per-character identifiers, and if you already have a central server imposing an order — which I do here — then the main thing CRDTs buy you, order independence without coordination, is less valuable. Those are good arguments and I would say so. My case for CRDTs is that the transformation functions in OT are notoriously easy to get subtly wrong, and the failure mode is silent divergence that shows up as one user seeing different text from another, which is very hard to debug after the fact. CRDTs move that correctness into the data type where it can be tested in isolation. Offline editing also falls out naturally rather than needing special handling. But if the team already has OT expertise, or memory overhead is a real constraint for very large documents, I would take OT without much argument — the deciding factor is honestly which failure mode you would rather debug, and that is a team judgement more than a technical one.',
    },
  },
]

export function getCompany(id: string): Company | undefined {
  return COMPANIES.find((c) => c.id === id)
}

export function questionsFor(companyId: string): CompanyQuestion[] {
  return COMPANY_QUESTIONS.filter((q) => q.company === companyId)
}

export function getQuestion(id: string): CompanyQuestion | undefined {
  return COMPANY_QUESTIONS.find((q) => q.id === id)
}
