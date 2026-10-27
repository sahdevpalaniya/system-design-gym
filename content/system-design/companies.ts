import { MERGED_COMPANY_QUESTIONS } from '@/lib/redirects'
import type { Company, CompanyQuestion } from '@/lib/types'

/**
 * Company practice sits outside the core curriculum on purpose. The curriculum stays
 * company-agnostic. Learning "the answer a company wants" falls apart the
 * moment an interviewer goes off script, so these pages teach the *style* of
 * the round, and the questions are ordinary problems with the house emphasis.
 */

export const COMPANIES: Company[] = [
  {
    id: 'google',
    name: 'Google',
    style:
      'Candidates commonly report a scale-first round. Expect very large numbers from the opening sentence, and be ready to justify a data structure choice in more detail than many rounds ask for. Interviewers often go deep on one subproblem rather than broad across the system.',
    weights: 'Numbers and Design weigh heaviest. Vague estimates cost you.',
    archetype: 'scale-breaker',
    guide: {
      loop: [
        "Google describes its process on its [How we hire](https://www.google.com/about/careers/applications/how-we-hire/) page. It starts with one or two shorter recruiter conversations. Some roles add an online assessment or a role-related exercise, such as coding. Then comes 'a panel of interviews, either over video or in person'. Google says every candidate for a role is assessed with the same rubrics, that questions are open-ended and role-related, and that there are no brainteasers. The same page links to a video of Google engineers running a mock system design interview. It is worth watching before your own.",
        "Google does not publish a fixed list of rounds for engineers, and the mix depends on the role and level. Candidates commonly report that early-career loops are mostly coding, and that a dedicated system design round usually appears for experienced hires. If you are not sure whether your loop has one, ask your recruiter. That is a normal question to ask.",
      ],
      emphasis: [
        "**Numbers that change the design.** Candidates often describe being asked for request rate, storage and bandwidth early, and then being asked which of those numbers changed a decision. A number that changes nothing looks like ritual. Practise this with [back-of-the-envelope estimation](/concepts/back-of-envelope).",
        "**One subproblem, in depth.** Many reports describe the interviewer picking one part, such as the index, the sharding scheme or the dedup step, and staying there for a long time. Be ready for three levels of detail: what it is, how it works, and what breaks.",
        "**Data structures, sized out loud.** Why a trie and not a general search index? How big is it? Does it fit in memory? Expect to say the size, not just the name.",
        "**What happens at ten times the load.** Hot keys, a lost region, a sudden spike. See [partitioning](/concepts/partitioning) and [consistent hashing](/concepts/consistent-hashing).",
      ],
      pitfalls: [
        'Drawing a generic diagram (load balancer, servers, cache, database) before stating a single requirement or number.',
        'Estimates with no consequence: working out 600,000 requests a second, then designing as if it were 600.',
        'Going broad when the interviewer wants depth. If they keep asking about one box, follow them into it.',
        'Naming a product instead of a mechanism. "Use a managed database" does not answer "how do you split the data?"',
      ],
      plan: [
        'Read [how a system design interview works](/learn/how-the-interview-works) and [the five stages](/learn/the-five-stages), so the structure is automatic and your attention goes to the problem.',
        'Get fast with numbers: [latency numbers](/concepts/latency-numbers), [back-of-the-envelope estimation](/concepts/back-of-envelope), then [capacity and cost](/concepts/capacity-and-cost).',
        'Work two scale-heavy problems in full: [search typeahead](/problems/typeahead) and the [web crawler](/problems/web-crawler). Then try the Google-style versions of both below.',
        'Add depth on what those problems lean on: [search indexing](/concepts/search-indexing), [caching](/concepts/caching), [Bloom filters](/concepts/bloom-filters) and [partitioning](/concepts/partitioning).',
        'Finish with a [timed mock](/practice/mock) with the [Scale Breaker](/archetypes#scale-breaker) as your interviewer, then the scale follow-ups in the [defence drills](/drills).',
      ],
      sources: [
        { label: 'Google Careers: How we hire', url: 'https://www.google.com/about/careers/applications/how-we-hire/' },
      ],
    },
  },
  {
    id: 'amazon',
    name: 'Amazon',
    style:
      'Operational reality and cost. Who gets paged, what does this cost per month, how does it degrade, what happens on the busiest day of the year. Amazon publishes its Leadership Principles, and they often surface in the technical round too, particularly Ownership and Frugality.',
    weights: 'Tradeoffs and Defence weigh heaviest, with real weight on operations.',
    archetype: 'cost-auditor',
    guide: {
      loop: [
        "Amazon's [interview loop](https://www.amazon.jobs/content/en/how-we-hire/interview-loop) page says you meet individually with current employees, and that each one assesses different aspects of your skills and experience. Its [SDE II interview prep](https://www.amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep) page is more specific. It describes four 55-minute interviews, tells you to 'expect at least one question on software systems design', and lists what a design is judged on: practicality, accuracy, efficiency, reliability, optimisation and scalability. It also asks you to ask questions that complete and validate your design.",
        "The same page says that a significant part of each conversation covers how you have shown the [Leadership Principles](https://www.amazon.jobs/content/en/our-workplace/leadership-principles) in past jobs, usually two or three behavioural questions per interviewer, answered in the STAR format. That description is for SDE II. Other levels and teams differ, so read the prep material your recruiter sends.",
      ],
      emphasis: [
        '**Cost and operations as real requirements.** Candidates often report questions such as what this costs per month, who gets paged, and what happens on the busiest day of the year. That matches two published principles, Frugality ("accomplish more with less") and Ownership. Read [capacity and cost](/concepts/capacity-and-cost) and [observability](/concepts/observability).',
        '**Degrading well, not just staying up.** What does the customer see when a dependency is slow? See [circuit breakers](/concepts/circuit-breakers) and [availability patterns](/concepts/availability-patterns).',
        '**Correctness under retries.** In a flash sale or a notification service, duplicates cost money or trust. [Idempotency](/concepts/idempotency) and [message queues](/concepts/message-queues) come up often.',
        '**Detail on request.** Dive Deep is one of the principles. Expect at least one "and how does that actually work?"',
      ],
      pitfalls: [
        "Treating the behavioural questions as a warm-up. By Amazon's own description they are a large part of every interview. Prepare real stories, with numbers where you have them.",
        'Designing for peak traffic and saying nothing about cost for the rest of the year.',
        'Having no answer to "who gets paged, and what do they see on the dashboard?"',
        'Claiming the design has no weak points. Name the weakest part yourself before the interviewer does.',
      ],
      plan: [
        'Write four to six STAR stories mapped to the [Leadership Principles](https://www.amazon.jobs/content/en/our-workplace/leadership-principles). Practise these separately from the design work.',
        'Work [ticket booking](/problems/ticket-booking) and the [notification system](/problems/notification-system) in full, then the Amazon-style flash sale and notification questions below.',
        'Study the concepts those lean on: [idempotency](/concepts/idempotency), [message queues](/concepts/message-queues), [rate limiting](/concepts/rate-limiting), [transactions and locking](/concepts/transactions-and-locking) and [capacity and cost](/concepts/capacity-and-cost).',
        'If the role touches money, add [payments and ledger](/problems/payment-ledger).',
        'Run a [timed mock](/practice/mock) with the [Cost Auditor](/archetypes#cost-auditor) as your interviewer, then drill cost and failure follow-ups in the [defence drills](/drills).',
      ],
      sources: [
        { label: 'Amazon Jobs: Interview loop', url: 'https://www.amazon.jobs/content/en/how-we-hire/interview-loop' },
        { label: 'Amazon Jobs: SDE II interview prep', url: 'https://www.amazon.jobs/content/en/how-we-hire/sde-ii-interview-prep' },
        { label: 'Amazon Jobs: Leadership Principles', url: 'https://www.amazon.jobs/content/en/our-workplace/leadership-principles' },
      ],
    },
  },
  {
    id: 'meta',
    name: 'Meta',
    style:
      'Product sense plus very large fan-out. Expect social-graph shaped problems, expect the celebrity-user case to come up early, and expect to be pushed on what the user experiences rather than what the diagram says.',
    weights: 'Requirements and Design, with fan-out and hot keys as the recurring pressure point.',
    archetype: 'pressure-tester',
    guide: {
      loop: [
        "Meta's careers site describes a 45-minute [initial technical screen](https://www.metacareers.com/swe-prep-techscreen/) with an engineer, followed by a [full loop](https://www.metacareers.com/swe-prep-onsite/) that 'will consist of several different conversations', meant to assess your technical skills and help hiring managers get to know you. That page offers a downloadable Full Loop Interview Guide. It is the best source for the current format, so read it rather than relying on second-hand summaries, including this one.",
        'Candidates report that the loop for experienced engineers mixes coding, design and behavioural conversations, and that design carries more weight at senior levels. Some candidates also report a choice between a distributed-systems design round and a more product-focused design round, depending on the role. The two reward different preparation, so ask your recruiter which one you have.',
      ],
      emphasis: [
        '**Fan-out and the celebrity case.** Social-graph problems, where one write must reach a very large number of readers. Know push, pull and the hybrid, and when each wins. See [fan-out](/concepts/fan-out).',
        '**What the user experiences.** If a feed is thirty seconds stale, does anyone notice? Candidates describe being pushed on the experience rather than the diagram. See [consistency models](/concepts/consistency-models).',
        "**Read-heavy data and caching.** Meta has written publicly about [TAO](https://engineering.fb.com/2013/06/25/core-infra/tao-the-power-of-the-graph/), its data store for the social graph, which puts a caching layer in front of MySQL to serve a very high volume of reads. It is useful background for why graph data gets cached so heavily. See [caching](/concepts/caching) and [partitioning](/concepts/partitioning).",
        '**Counting at scale.** Likes and views are small writes in huge numbers. See [distributed counters](/concepts/distributed-counter).',
      ],
      pitfalls: [
        'Choosing push or pull for every account. Strong answers usually treat the very large accounts differently.',
        'Spending the first ten minutes on infrastructure before saying what the product does and who sees what.',
        'Promising strong consistency for a feed that does not need it, and paying for it in latency.',
        'Forgetting the write cost of fan-out on write: one post multiplied by the follower count.',
      ],
      plan: [
        'Work the [follower timeline](/problems/social-timeline) in full, then read the Meta news feed angle in its [worked solution](/problems/social-timeline/solution).',
        'Add real-time delivery with [chat and messaging](/problems/chat-messaging) and [live score push](/problems/live-scores).',
        'Study [fan-out](/concepts/fan-out), [caching](/concepts/caching), [partitioning](/concepts/partitioning), [consistency models](/concepts/consistency-models), [distributed counters](/concepts/distributed-counter) and [real-time transports](/concepts/realtime-transports).',
        'If your round is product-focused, spend extra time on the requirements stage in [the five stages](/learn/the-five-stages) and on [API design](/concepts/api-design).',
        'Run a [timed mock](/practice/mock) with the [Pressure Tester](/archetypes#pressure-tester) as your interviewer, then the [defence drills](/drills).',
      ],
      sources: [
        { label: 'Meta Careers: Initial technical screen', url: 'https://www.metacareers.com/swe-prep-techscreen/' },
        { label: 'Meta Careers: Full loop interview', url: 'https://www.metacareers.com/swe-prep-onsite/' },
        { label: 'Engineering at Meta: TAO', url: 'https://engineering.fb.com/2013/06/25/core-infra/tao-the-power-of-the-graph/' },
      ],
    },
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    style:
      'Often described as calmer and more collaborative than most. The round tests whether you can be reasoned with: expect the interviewer to propose an alternative and watch whether you engage with it or defend by reflex.',
    weights: 'Lifecycle and Tradeoffs. Genuine openness to a better idea scores.',
    archetype: 'scope-shifter',
    guide: {
      loop: [
        "Microsoft's [interview tips](https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips.html) say that if you advance, 'the next interview steps will vary based on the role', and that your recruiter explains the format and timeline. Some roles include coding exercises, a portfolio review or work samples. Interviewers aim to 'assess fundamental knowledge, capability, and learning potential'.",
        "Its [technical interviewing](https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing) page lists problem solving, design, coding and testing as the areas assessed, refers to a 45-minute round, and names system design among the topics to prepare. On design, it says engineers should understand 'what it takes to build or design a new system or platform from scratch'. Its advice is to ask clarifying questions about anything ambiguous and to plan before you build. Whether you get a separate system design round, and how deep it goes, depends on the team and the level.",
      ],
      emphasis: [
        "**Clarifying before designing.** This is Microsoft's own published advice, and candidates report interviewers rewarding good questions about scope.",
        "**Engaging with a better idea.** Candidates describe interviewers proposing a different approach halfway through and watching how you respond. Microsoft's careers pages describe a growth mindset, being a 'learn-it-all' rather than a 'know-it-all', as part of its culture, which fits that pattern.",
        '**Lifecycle and correctness.** For collaborative or sync problems: what happens when two people edit the same thing, or one of them is offline? See [clocks and ordering](/concepts/clocks-and-ordering) and [replication](/concepts/replication).',
        '**Testing your own design.** The technical page tells candidates to test before saying "done". In a design round, the same habit means walking through failure cases yourself.',
      ],
      pitfalls: [
        'Defending your first design by reflex when the interviewer offers a better one. Weigh it out loud, and change your mind if it is better.',
        'Skipping the hard edge cases: offline edits, conflicting edits, partial failures.',
        'Drawing components before the requirements are agreed.',
        'Assuming every Microsoft loop looks the same. Ask your recruiter about the format for your team.',
      ],
      plan: [
        'Read [the five stages](/learn/the-five-stages), with extra care on requirements and the request lifecycle.',
        'Work [file sync across devices](/problems/file-sync) and [chat and messaging](/problems/chat-messaging) in full, then the Microsoft-style [collaborative document editor](/company/microsoft/ms-collab) question.',
        'Study [real-time transports](/concepts/realtime-transports), [consistency models](/concepts/consistency-models), [replication](/concepts/replication), [clocks and ordering](/concepts/clocks-and-ordering) and [idempotency](/concepts/idempotency).',
        "For background on real-time collaboration, Microsoft's open-source [Fluid Framework](https://fluidframework.com/) is a real system built for exactly this problem.",
        'Run a [timed mock](/practice/mock) with the [Scope Shifter](/archetypes#scope-shifter) as your interviewer, so a mid-round change of requirements stops being a surprise.',
      ],
      sources: [
        { label: 'Microsoft Careers: Interview tips', url: 'https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips.html' },
        { label: 'Microsoft Careers: Technical interviewing', url: 'https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing' },
        { label: 'Fluid Framework', url: 'https://fluidframework.com/' },
      ],
    },
  },
  {
    id: 'netflix',
    name: 'Netflix',
    style:
      'Often senior-heavy and direct. Expect few hand-holding questions, an assumption that you have run systems in production, and strong interest in failure modes, chaos testing and graceful degradation.',
    weights: 'Defence and Tradeoffs. Hand-waving is spotted quickly.',
    archetype: 'domain-specialist',
    guide: {
      loop: [
        "We could not find a published description of Netflix's engineering interview loop on its careers site. What Netflix does publish is its [culture memo](https://jobs.netflix.com/culture), which describes freedom and responsibility, 'context, not control', candour and the keeper test. Candidates commonly report that these ideas come up in interviews, in questions about how you make decisions and work with other people.",
        'Everything else about the format comes from candidate reports, and those vary a lot by team: the number of rounds, whether there is a separate design round, and how much of it is about your past work. Treat any fixed description you read online with caution, and ask your recruiter what your loop contains.',
      ],
      emphasis: [
        '**Production experience.** Reports describe interviewers assuming you have run systems, and asking what went wrong and what you changed afterwards, not only what you built.',
        "**Failure and resilience.** Netflix open-sourced [Chaos Monkey](https://github.com/Netflix/chaosmonkey), a tool that 'randomly terminates virtual machine instances and containers that run inside of your production environment'. Expect questions about what your design does when a node, a zone or a dependency disappears. See [circuit breakers](/concepts/circuit-breakers), [availability patterns](/concepts/availability-patterns) and [multi-region](/concepts/multi-region).",
        '**Delivery at scale.** Video problems are mostly about getting bytes close to the viewer. See [CDN](/concepts/cdn) and [object storage](/concepts/object-storage).',
        '**Honest tradeoffs.** Say what your design gives up before you are asked. That fits the candour the culture memo describes.',
      ],
      pitfalls: [
        'Saying "we would add retries" without bounding them. Unbounded retries turn a slow dependency into an outage.',
        'Treating the CDN as magic, with no word about load on the origin when a new title launches and every cache is empty.',
        'Claiming experience you cannot back up with detail. Follow-up questions find this quickly.',
        'No graceful degradation: what does the viewer see when a non-essential service, like recommendations, is down?',
      ],
      plan: [
        'Work [video upload and playback](/problems/video-platform) in full, then read the Netflix streaming angle in its [worked solution](/problems/video-platform/solution).',
        'Study [CDN](/concepts/cdn), [object storage](/concepts/object-storage), [message queues](/concepts/message-queues) and [circuit breakers](/concepts/circuit-breakers).',
        'Add the operations topics: [availability patterns](/concepts/availability-patterns), [multi-region](/concepts/multi-region), [observability](/concepts/observability) and [deploys and releases](/concepts/deploys-and-releases).',
        'Prepare two or three real incidents from your own work: what failed, how you found it, and what you changed.',
        'Run a [timed mock](/practice/mock) with the [Domain Specialist](/archetypes#domain-specialist) as your interviewer, then the failure follow-ups in the [defence drills](/drills).',
      ],
      sources: [
        { label: 'Netflix Jobs: Culture memo', url: 'https://jobs.netflix.com/culture' },
        { label: 'Netflix Chaos Monkey (GitHub)', url: 'https://github.com/Netflix/chaosmonkey' },
      ],
    },
  },
  {
    id: 'uber',
    name: 'Uber',
    style:
      'Real-time, geospatial and matching problems, because that is the business. Expect hard latency budgets, moving objects, and close attention to what happens when the match fails.',
    weights: 'Lifecycle and Numbers, with latency budgets treated as hard constraints.',
    archetype: 'constraint-setter',
    guide: {
      loop: [
        "We could not find a detailed engineering interview guide on Uber's careers site, so everything here about the format comes from candidate reports. Check it with your recruiter. Reports describe a familiar shape: a recruiter call, a technical screen, then a loop of coding, system design and behavioural conversations, with design carrying more weight for experienced hires. The details vary by team and level.",
        "The design problems tend to mirror the business: matching riders and drivers, location, pricing and trip state. One useful piece of public background is [H3](https://h3geo.org/), a hexagonal grid system for indexing locations that was developed at Uber and released as open source. You do not need to know H3 for the interview, but it shows how a company that lives on location data splits the map.",
      ],
      emphasis: [
        '**Latency budgets as hard limits.** Candidates report being given a time limit for a match or an update and being graded on everything inside it. That is the [Constraint Setter](/archetypes#constraint-setter) pattern.',
        '**Moving objects.** Drivers send frequent location updates, so the index changes all the time. See [geospatial indexing](/concepts/geospatial-indexing).',
        '**What happens when a match fails.** A driver declines, a phone drops off the network, two riders reach for the same driver. See [idempotency](/concepts/idempotency) and [transactions and locking](/concepts/transactions-and-locking).',
        '**The trip as a state machine.** Requested, matched, picked up, completed, paid. Candidates describe being asked what happens between each step, which is the lifecycle stage in [the five stages](/learn/the-five-stages).',
      ],
      pitfalls: [
        'Querying the main database for nearby drivers on every location update.',
        'Letting one driver be assigned to two riders because the assignment is not atomic.',
        'No plan for timeouts: what the rider sees when nobody accepts.',
        'Designing one global system when cities are a natural way to split the data. See [partitioning](/concepts/partitioning).',
      ],
      plan: [
        'Work [nearby places](/problems/nearby-places) first. It teaches the location index without the moving parts.',
        'Then [ride matching](/problems/ride-matching) in full, and read the Uber matching angle in its [worked solution](/problems/ride-matching/solution).',
        'Study [geospatial indexing](/concepts/geospatial-indexing), [real-time transports](/concepts/realtime-transports), [consensus](/concepts/consensus), [idempotency](/concepts/idempotency) and [partitioning](/concepts/partitioning).',
        'Add [payments and ledger](/problems/payment-ledger), because every trip ends in a payment that must happen exactly once.',
        'Run a [timed mock](/practice/mock) with the [Constraint Setter](/archetypes#constraint-setter) as your interviewer, then the [defence drills](/drills).',
      ],
      sources: [{ label: 'H3 geospatial index (developed at Uber)', url: 'https://h3geo.org/' }],
    },
  },
]

const ALL_QUESTIONS: CompanyQuestion[] = [
  /* ---------------- Google ---------------- */
  {
    id: 'g-typeahead',
    company: 'google',
    title: 'Design search autocomplete',
    prompt:
      'Design the suggestions that appear as a user types into a search box. Assume global traffic and that suggestions come from what people have searched for before.',
    difficulty: 'hard',
    whatTheyWant:
      'Whether you notice the latency budget is set by typing speed, and whether you reach for precomputation rather than searching per keystroke. Expect them to go deep on the data structure: how the trie is stored and how big it is.',
    concepts: ['search-indexing', 'caching', 'cdn', 'rate-limiting'],
    hints: [
      {
        label: 'Where do I start?',
        text: 'Do the request-rate arithmetic before anything else. One search is not one request. If the user types six characters, it is roughly six requests. What does that do to your numbers?',
      },
      {
        label: 'What is the latency budget?',
        text: 'A person types a character every 150–250 ms. If your answer arrives after 300 ms, it is answering a prefix they have already moved past. So what does that rule out?',
      },
      {
        label: 'That rules out a lot. Now what?',
        text: 'If you cannot search at request time, the answer must already exist before the request arrives. What could you compute in advance, and how much freedom does that give you?',
      },
      {
        label: 'How fresh does it need to be?',
        text: 'Yesterday\'s popular queries predict today\'s almost perfectly. Which parts of this are allowed to be hours old, and which specifically are not?',
      },
      {
        label: 'How big is the data, really?',
        text: 'Should you suggest every query anyone has ever typed, or only the top ones? Work out the size of each option. One of them changes where the index can live.',
      },
    ],
    model: [
      '**Numbers first.** 100,000 searches a second at peak, about six requests each even after debouncing, so roughly 600,000 suggestion requests a second. The budget per request is about 100 ms, because a typist produces the next character in 150–250 ms and a late answer is for a stale prefix.',
      '**That budget rules out searching at request time.** No general search engine holds 100 ms at 600,000 requests a second while scoring documents. So the answer has to be precomputed.',
      '**The structure.** A trie over the top 10 million queries, where every node stores the top 10 completions beneath it, computed at build time. Answering a request is then a six-character walk plus reading a list that is already there. No ranking, no scoring: microseconds.',
      '**Bounding the data is what makes it work.** Do not index every query ever typed; the tail is enormous and worthless as a suggestion. The top 10 million at roughly 40 bytes each is a few gigabytes once the trie nodes and their top-10 lists are included, which fits in memory on one machine. So the index can be replicated to every serving node, and there is no network hop on the hot path at all.',
      '**Freshness, split three ways.** The base index rebuilds hourly, which is invisible for the long tail. Trending terms need minutes, so they get a small separate structure merged in at serve time. Blocklists need to apply immediately, so they are checked at serve time as well as build time. A build-time-only filter leaves an offensive suggestion live until the next rebuild.',
      '**Caching.** Short prefixes are requested constantly and are identical for everyone, so an edge cache keyed by prefix absorbs most traffic before it reaches a serving node.',
      '**Deployment.** Build a new index alongside the old and switch an atomic pointer. A failed build leaves the previous index serving, which is the failure behaviour you want. Cost: peak memory is roughly double during the swap.',
    ],
    checklist: [
      'Applied the keystroke multiplier: one search is ~6 requests',
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
        'A trie is exact by nature, so this needs a planned answer rather than hoping. Two mechanisms, and I would use both. Precompute common misspellings as extra entries pointing at the correct query. Typos cluster heavily, so a relatively small set covers most of them, and it costs only index size. Then, when an exact prefix lookup returns too few results, fall back to a fuzzy match. The fallback is much slower, so it gets a tight timeout and must degrade to returning nothing rather than blowing the 100 ms budget. What I would not do is make every lookup fuzzy. That turns the cheap common case into the expensive rare one.',
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
      '**The seen-set is the first thing that breaks.** Billions of URLs at ~70 bytes is hundreds of gigabytes, and every discovered link needs a membership check. A bloom filter in front makes the common answer ("already seen") a memory operation. The cost is occasionally skipping a page that was never crawled, because a bloom filter can give false positives. It never gives false negatives, which is why it is safe here: it never wrongly claims something is new, so nothing is fetched twice because of it.',
      '**Politeness is the requirement people miss.** Fetching a thousand pages a second from one host gets you blocked and can overload the site. So the frontier is not one queue. It is partitioned by host, with a per-host rate limit and a politeness delay, and workers pull from hosts that are due rather than from a global list. Respect robots.txt and cache it per host.',
      '**Deduplication, twice.** URL-level: normalise before hashing. Lowercase the host, strip default ports, sort or drop tracking query parameters, resolve redirects. Content-level: near-identical pages at different URLs are very common, so hash the content with a similarity-preserving hash rather than an exact one, and drop near-duplicates.',
      '**Prioritisation.** Not all pages deserve equal attention. Score by an importance signal and by observed change rate: recrawl a news homepage hourly and an archived page monthly. Storing the last-modified and the observed change frequency per URL lets this adapt on its own.',
      '**Traps.** Infinite spaces, such as calendars that generate a new URL forever, need depth limits and per-host page caps. Crawler traps and very large files need size and time limits per fetch.',
      '**Distribution.** Partition the frontier by host hash, so one host always belongs to one worker and the politeness limit is enforceable locally without coordination.',
    ],
    checklist: [
      'Described it as a graph traversal with a frontier',
      'Identified the seen-set size as a real problem and used a bloom filter',
      'Raised politeness (per-host rate limiting and robots.txt) unprompted',
      'Partitioned the frontier by host so politeness needs no coordination',
      'URL normalisation before deduplication',
      'Content-level near-duplicate detection with a similarity hash',
      'Recrawl frequency driven by observed change rate',
      'Handled crawler traps, infinite URL spaces and oversized responses',
    ],
    followUp: {
      q: '"Two URLs return the same page. How do you avoid storing it twice?"',
      answer:
        'Two different problems, and they need different tools. Identical content is caught by hashing the normalised body and checking the hash, which is cheap and exact. Near-identical content is the harder and more common case: the same article with a different sidebar, or a page with a rotating advert. An exact hash is useless there because one changed byte gives a completely different hash. So I would use a similarity-preserving hash like SimHash or MinHash, where similar documents produce similar fingerprints and you can cheaply find pairs within a small Hamming distance. Before either of those, normalise the URL: lowercase the host, strip the default port and fragment, drop known tracking parameters, and follow redirects to the final URL. A large share of duplication is the same page reachable at cosmetically different addresses.',
    },
    relatedProblem: 'web-crawler',
  },

  /* ---------------- Amazon ---------------- */
  {
    id: 'a-flash-sale',
    company: 'amazon',
    title: 'Design a flash sale / limited inventory drop',
    prompt:
      'Ten thousand units of a product go on sale at 10am sharp. A million people will try to buy them in the first minute. Nobody may buy a unit that does not exist.',
    difficulty: 'hard',
    whatTheyWant:
      'Correctness under extreme contention, and cost awareness. They will push on what happens when the cache is stale, and on whether you can justify the cost of the capacity you just asked for.',
    concepts: ['consistency-models', 'rate-limiting', 'caching', 'idempotency'],
    hints: [
      {
        label: 'Split the problem first',
        text: 'A million people arrive but only ten thousand can succeed. Are all of those requests doing the same kind of work? Which parts have to be exact, and which can be slightly wrong?',
      },
      {
        label: 'Count the successful writes',
        text: 'How many writes will ever succeed here, in total, across the whole sale? Compare that to the request rate. Does that change what the hard problem is?',
      },
      {
        label: 'Think about the traffic shape',
        text: 'This is not steady load. It is a wall arriving at a known second. What can you do with the fact that you know when it starts?',
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
      '**Split by what must be exact.** Browsing, product pages and the stock indicator can all be stale and cached hard, and that covers most of the million requests. Only the claim of a unit must be exact. The design is about keeping that exact tier small.',
      '**The number that changes the design:** only 10,000 writes will ever succeed. That is trivial. This is not a throughput problem, it is a contention problem. The work is rejecting the ~99% of attempts that must fail, cheaply, before they reach the database.',
      '**A waiting room in front.** At 10am, admit users at a controlled rate rather than letting a million hit the checkout path. This converts an uncontrolled burst into a known rate the exact tier can serve, makes the experience honest (a position and an estimate, not an error), and doubles as the main anti-bot control.',
      '**The claim itself.** One conditional update: decrement remaining where remaining is greater than zero, or insert a row for a specific unit with a unique constraint. If it affects one row you have it; if zero, you do not. Explicitly not a read-then-write in application code, because that gap is the race. And explicitly not a distributed lock: the database row is already a single point of serialisation, and a lock adds a failure mode where a paused holder\'s lease expires and two processes both believe they won.',
      '**Idempotency.** Mobile clients retry often. Every purchase attempt carries a client-generated key, inserted with a unique constraint in the same transaction as the claim, so a retry replays the original result rather than buying twice.',
      '**Numbers, said out loud.** A million people in the first minute is roughly 17,000 arrivals a second on average, and far more in the first few seconds, because people refresh at 09:59:59. Each person makes several requests (page, stock, buy), so plan for something like 50,000 to 100,000 requests a second at the peak. Against that, at most 10,000 claims can ever succeed, and the exact tier needs to handle only a few hundred claim attempts a second if admission control in front of it is doing its job.',
      '**Data model.** One row per sale: `sale(id, sku, starts_at, total, remaining)`. One row per successful claim: `claim(sale_id, user_id, idempotency_key, status, expires_at)`, with a unique constraint on `(sale_id, user_id)` if the rule is one unit per person, and on `idempotency_key`. The claim and the decrement happen in one transaction, so the count and the claims can never disagree.',
      '**The API.** `POST /sales/{id}/claims` with an `Idempotency-Key` header returns either a claim with a payment deadline or "sold out". The waiting room hands each admitted user a short-lived signed token, and the claim endpoint rejects requests without one, so nobody can skip the queue by calling the API directly.',
      '**A claim is a hold, not a sale.** Winning the claim reserves a unit for a few minutes while the person pays. If payment does not complete before `expires_at`, a background job marks the claim expired and increments `remaining` in the same transaction, and the unit goes back to the next person in the waiting room. Without this, abandoned checkouts would quietly sell out the stock with nothing paid for.',
      '**If one row is too hot.** A single `remaining` row serialises every claim, and at a few hundred claims a second that is fine on one database. If the rate were much higher, split the inventory into, say, 20 buckets of 500 units each, route each claim to a random bucket with stock, and treat the sale as sold out when every bucket is empty. The cost is that the last few units can be briefly reported as gone while one bucket still has some, which is acceptable for a sale page.',
      '**Fairness and bots.** The waiting room is where fairness lives: a randomised position for everyone who arrived before 10:00, then first come first served, per-account and per-payment-method limits, and the signed token so scripts cannot bypass it. Be honest that bot defence is an arms race; the design makes cheating expensive rather than impossible.',
      '**What to watch during the minute.** Admission rate, claim success and failure counts, `remaining` against the claim table, and payment completions against expired holds. If `remaining` plus active claims ever differs from the total, stop the sale: that alert is the oversell check.',
      '**Pre-scale, because the time is known.** This spike is scheduled, so pre-warm caches and scale out beforehand rather than relying on autoscaling that reacts over minutes to a spike that arrives in seconds.',
      '**The cost answer.** The expensive capacity is needed for one minute. So the waiting room and the static tier, both cheap, absorb the load, and only a small exact tier is scaled up, briefly. Serving the product page from a CDN means the million requests mostly never reach compute I pay for by the second.',
    ],
    checklist: [
      'Separated the cacheable stale tier from the small exact tier',
      'Noticed total successful writes are bounded by inventory, so it is contention not throughput',
      'Waiting room or admission control to convert the burst into a rate',
      'Claim is a single conditional update, not check-then-write',
      'Explicitly rejected a distributed lock and explained why',
      'Idempotency keys on purchase attempts',
      'Used the fact that the start time is known: pre-scaling and cache warming',
      'Answered the cost question: cheap tiers absorb the spike, expensive tier stays small',
      'Put numbers on the burst and on the exact tier',
      'Claim is a time-limited hold, released when payment does not complete',
      'Had an answer for a hot inventory row: split it into buckets',
      'Signed waiting-room token so the queue cannot be skipped',
    ],
    followUp: {
      q: '"Your stock counter is cached and shows 50 left when there are actually 0. What happens?"',
      answer:
        'Nothing bad, provided the cached number is only ever used for display. Users see "50 left", click buy, and the conditional update at the claim step returns zero rows for everyone after the real stock hit zero, so they get a clean "sold out" rather than a purchase. That is an acceptable experience, and it is why the design deliberately separates the displayed number from the decision. The disaster would be using the cached number to *decide*. If the code reads the cache, sees 50, and proceeds to create an order on that basis, you have oversold, and no amount of speed makes that acceptable. So the rule I would state plainly: cache the display, never cache the decision. I would also refresh the displayed count on a short TTL so it stays roughly right, and show "sold out" the moment a claim fails rather than letting someone retry into a wall.',
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
      '**Accept and acknowledge fast.** The API takes a notification, validates its shape, writes it to a durable queue and returns. Callers are not kept waiting on a third-party provider. That is the main reason the service exists.',
      '**Priority queues, separated by class.** Transactional messages (password resets, order confirmations) go in a separate queue from marketing. Without this, one team\'s 50-million-message blast sits in front of another team\'s password resets, and the second team\'s users cannot log in. Per-tenant rate limits on top, so no caller can monopolise the workers.',
      '**Idempotency, because at-least-once is what queues give you.** Every message carries a client-supplied key or a natural id. Workers record processed ids in the same transaction as marking the send, so a redelivery does not send a second copy. Receiving the same alert five times is one of the things users complain about most.',
      '**Provider failures.** Each provider gets a timeout, a circuit breaker and its own connection pool, so a slow SMS vendor cannot exhaust the workers that send email. When a breaker opens, either fail over to a secondary provider or park the message rather than burning retries against something known to be down.',
      '**Retries with backoff and jitter, capped**, then a dead letter queue with an alert on arrival rate. An unwatched DLQ loses messages without anyone noticing.',
      '**Expiry, which is easy to forget.** A "your driver is arriving" push delivered forty minutes late is worse than useless. Messages carry a time-to-live and are dropped rather than delivered stale.',
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
      'Message TTL: drop stale notifications rather than deliver them late',
      'Alert on message age, not queue depth',
    ],
    followUp: {
      q: '"Who gets paged when the SMS provider is down, and what do they do?"',
      answer:
        'Ideally nobody gets paged for the provider being down, because the system should absorb it. That is what the circuit breaker and the failover provider are for. What should page someone is user-visible impact: the oldest undelivered message in the transactional queue crossing a threshold, or the DLQ receiving messages at an unusual rate. When that fires, the runbook is: check whether it is one provider or all of them, flip the affected traffic to the secondary provider if the breaker has not already, and if there is no secondary, decide explicitly whether to hold messages or drop the ones whose TTL has passed. The thing I would want in place beforehand is per-provider dashboards, so the first minute is not spent working out which of three vendors is the problem. And I would treat "we had no secondary SMS provider" as the actual bug to fix afterwards.',
    },
    relatedProblem: 'notification-system',
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
      'The fan-out decision, and specifically what you do about accounts with tens of millions of followers. Expect the celebrity case to come up early. Having handled it before you are asked is what lifts a good answer to a great one.',
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
        text: 'If you split by follower count, how would you choose the number, and how would you know it was wrong?',
      },
    ],
    model: [
      '**The two options and why neither works alone.** Fan-out on write precomputes each follower\'s feed when someone posts: reads become one sequential lookup, and writes are multiplied by the follower count. Fan-out on read stores the post once and assembles feeds at read time: writes are trivial, reads become hundreds of queries plus a merge. At 20,000 feed opens a second, pull alone is impossible; at 30 million followers, push alone is impossible.',
      '**The numbers.** 1,000 posts a second is not the workload. At ~300 followers average, fan-out on write is 300,000 inbox writes a second. And one post from a 30-million-follower account is 30 million writes, which at realistic throughput takes minutes and blocks everyone else\'s posts behind it. The average hid the case that breaks the system.',
      '**The hybrid.** Push for ordinary accounts. Above a follower threshold (on the order of 100,000), do not fan out at all. Leave those posts in place and have readers pull them at read time, merged with their precomputed inbox. This works precisely because a huge account\'s recent posts are the most cacheable data in the system: millions of people want the same few rows, so the hit rate approaches 100%.',
      '**The threshold is tuned, not picked.** It comes from fan-out queue age: if delivery latency starts climbing, the threshold is too high. Quoting a round number as if it were derived is worse than saying how you would find it.',
      '**The inbox** holds post ids and timestamps only, not content. Otherwise editing or deleting a post means rewriting millions of rows. Capped at a few hundred entries, partitioned by user id so one feed is one partition and one sequential read. Reads hydrate ids into content with a batch lookup, never N lookups.',
      '**The author\'s own post is written synchronously to their own inbox**, because they will refresh immediately, and not seeing their own post looks like a bug.',
      '**Backpressure.** If the fan-out queue backs up, feeds go stale silently, because nothing errors. Alert on message age. Skip fan-out entirely for users inactive for months and rebuild their feed via the pull path when they return. That is one of the largest savings available.',
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
        'Nothing fans out, because they are far above the threshold. That is the point of having one. The post is written to the post store and to that author\'s own recent-posts list, which is a single small write, and it is done. No queue is touched, no inbox is written, and crucially nobody else\'s posts are delayed. Then, as their followers open the app over the following seconds and minutes, each feed read merges their precomputed inbox with the recent posts of the handful of large accounts they follow. That merge is a cache read that is almost always a hit, because millions of people are reading the same rows. This is the case where pull is far cheaper than push. What I would watch in those 60 seconds is the cache node holding that author\'s row, since it is now very hot. I would replicate that key across several nodes with a suffix and read a random one. The cost I would name: their post appears when a follower next refreshes rather than being pushed, so it can land slightly later than a small account\'s post would.',
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
      '**The estimate that decides the design.** Ingest might be ~8 GB/s; egress to viewers is on the order of 1,350 GB/s and never stops. Egress is roughly 170x ingest. So bandwidth dominates the cost of this system, and the design goal is that almost none of it comes from my origin.',
      '**Segmented adaptive streaming.** Each video is transcoded into several bitrate ladders and chopped into segments of a few seconds, with a manifest listing them. This solves three problems at once. Every segment is a static cacheable file, so a CDN can serve it; the player can switch quality per segment as the connection changes; and a failed segment retries without restarting the video.',
      '**Delivery.** Segments are immutable with long cache lifetimes, so CDN hit rates are very high and purging is rarely needed. The hard part is the long tail (content watched rarely), not the popular content, which caches itself. Tiered caching, where edge misses go to a regional cache rather than origin, collapses many edge misses into one origin fetch.',
      '**Processing has hours of slack** and is fully asynchronous: upload lands in object storage, a durable event triggers transcoding, workers are idempotent and run on interruptible capacity. Publish as soon as one usable rendition exists rather than waiting for all of them, and write the manifest last so publishing is effectively atomic.',
      '**Uploads never pass through application servers.** They go presigned direct-to-storage, chunked and resumable, because at this ingest volume routing bytes through your own compute means becoming a bandwidth company for no benefit.',
      '**Degradation, which is the point of the question.** The player measures throughput and steps down a rung rather than stalling, because a lower bitrate is far better than a spinner. If a CDN partner degrades, the player retries the segment against an alternate CDN, so multi-CDN is part of the failure story, not only a cost negotiation. Startup uses a low bitrate on purpose so playback begins fast, then steps up.',
      '**What I would monitor:** playback start time, rebuffer rate, and CDN hit ratio split by popularity tier. An aggregate hit rate hides the long tail.',
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
        'Ideally a brief quality drop and nothing else, and that is achievable because of decisions made in advance. The player is fetching short segments, measuring how fast each arrives, and choosing the next bitrate from that measurement. So as the CDN slows, the player steps down a rung and keeps playing rather than stalling. Meanwhile the buffer, often tens of seconds of video, absorbs the variation while that adjustment happens. If segments start failing outright rather than just arriving slowly, the player retries against an alternate CDN, because the manifest can carry more than one host and segments are immutable so it does not matter where a given segment comes from. That is why multi-CDN is a resilience decision and not only a commercial one. What the viewer must not see is a stall, because rebuffering is what drives people to give up. So the whole chain is biased toward degrading picture quality rather than pausing. I would be watching rebuffer rate by region, since that is where this shows up first.',
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
      'That you treat the latency budget as a hard constraint, and that the failure branches are the design. Expect to be asked what happens when nobody accepts, because at peak that happens often and is not an edge case.',
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
      '**The budget is the constraint.** A rider is physically standing outside. Ten seconds feels broken. That rules out batch optimisation entirely, which is worth saying explicitly: batching produces better assignments and is the right answer for food delivery, where fifteen minutes of cooking hides the delay. Here there is no slack, so matching is greedy: a good driver now beats the best driver in forty seconds.',
      '**The numbers, and the one that changes the design.** 100,000 active drivers pinging every 4 seconds is 25,000 location writes a second, against maybe 500 ride requests a second. Location writes outnumber requests fifty to one, the opposite of most systems. But all live positions are about 10 MB. That means the live index belongs in memory, not in a durable database, and paying for durability on a position that is worthless in four seconds is spending money to protect nothing.',
      '**The geo index.** Encode positions as geohash cells and keep, per cell, the drivers in it with their coordinates and last-seen time. Redis sorted sets fit this well. A search reads the rider\'s cell **plus the eight neighbours**, because a driver 100 metres away can easily be just over a cell boundary, and missing them is a real bug. Then filter out anyone whose position is more than ~15 seconds stale, and rank by estimated arrival time rather than straight-line distance. A driver 200 metres away across a motorway with no crossing is further away in practice than one 600 metres down the same road.',
      '**The offer protocol, which is where riders are lost.** Offer to the top candidate with a short timeout. Offers must expire **server-side**, not just in the driver\'s app, or a frozen client accepting 40 seconds late collides with a completed match. If the first couple time out, switch to offering a small batch simultaneously and take the first accept. That converts a latency problem into a correctness one, solved by making accept a conditional update on trip state so the first wins and the others get a clean "this trip is taken".',
      '**Nobody accepts: the branch candidates often skip.** After a bounded number of rounds, re-running the search each round because the world has moved on in ten seconds, stop and tell the rider honestly that no driver is available. An endless spinner is the worst outcome.',
      '**Trip state is the one durable, strongly consistent thing here**, because it decides who is going where and who gets paid. Everything about positions is stale on purpose and in memory.',
      '**Idempotency** on both request and accept, because mobile clients retry often and a duplicate must not create two trips or two assignments.',
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
        'This is the common case at peak, not an edge case, so it needs a real answer. Each offer has a short timeout (a few seconds) and expires server-side so a late accept cannot collide with anything. After a couple of timeouts I stop offering sequentially and offer to a small batch at once, because three sequential five-second timeouts have already consumed fifteen seconds of a ten-second budget. Between rounds I re-run the candidate search rather than reusing the original list, because in ten seconds drivers have moved and some have become free. Reusing a stale list is how you keep offering to the same unresponsive drivers. I widen the radius each round. Then the important part: after a bounded number of rounds, roughly three, I stop and tell the rider no driver is available, with a retry option and if possible an honest wait estimate. An infinite spinner is worse than a clear no, because the rider who is told no can decide what to do, and the rider watching a spinner just leaves. I would also record the decline, because a driver declining everything is a supply problem rather than a matching one, and acceptance rate by area is an early signal that something is wrong.',
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
        text: 'It is not the network. Two people type at the same position at the same moment. What has to be true about the result?',
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
      '**The hard part is concurrent edits, not transport.** Sending changes over a socket is straightforward. Deciding what the document *is* when two people edit the same position simultaneously is the problem.',
      '**Why the obvious options fail.** Storing the whole document and taking the last save silently destroys the other person\'s work. Sending positional operations naively fails because position 5 means different things depending on what has already been applied. Apply the same two operations in different orders on two machines and the documents diverge permanently.',
      '**Two real families.** **Operational Transformation** transforms an incoming operation against operations already applied locally, so the result converges. It works, Google Docs is publicly documented as using it, and it is hard to get right: the transformation functions are subtle and usually need a central server to impose an order. **CRDTs** design the data type so that concurrent changes merge to the same result regardless of order. Each character gets a unique identifier rather than an index, so "insert after character X" is unambiguous no matter what else happened. CRDTs are simpler to reason about and to distribute. They cost metadata per character, which means memory overhead, and they need care with tombstones for deleted content.',
      '**I would take a CRDT** for a new system, mainly because it does not require a central serialisation point and offline editing falls out naturally. But I would say plainly that OT is a legitimate choice with a longer production track record, and if the interviewer prefers it I would want to hear why. This is an open engineering disagreement, not a settled question.',
      '**Transport.** WebSockets, because edits flow both directions constantly. Server holds the authoritative document and broadcasts changes to everyone in the session. Clients apply their own edits optimistically so typing feels instant, then reconcile.',
      '**The boring parts that matter.** Presence and cursors are ephemeral and can be lossy, so do not persist them. A new joiner loads a snapshot plus operations since, so you periodically compact operations into snapshots or joining a long-lived document becomes slow. Persistence is the operation log, with snapshots as an optimisation; that also gives version history for free.',
      '**Numbers.** Most documents have one to five editors at a time; a popular one might have a hundred viewers and a dozen typists. A fast typist produces about five to ten keystrokes a second, so even a busy document is a few hundred operations a second. The scale problem is the number of documents open at once, not the traffic inside one, which means the design should keep each document on one server and spread documents across many.',
      '**One server owns each open document.** Route every connection for a document to the same session server, for example by consistent hashing on the document id. That server holds the live state in memory, orders incoming operations, and broadcasts them. Different documents land on different servers, so capacity grows by adding servers. If a server dies, its documents are reopened elsewhere from the last snapshot plus the operation log, and clients reconnect.',
      '**Data model.** `document(id, owner, latest_snapshot_version)`, `snapshot(doc_id, version, blob)` and an append-only `operation(doc_id, seq, client_id, client_seq, payload)`. The pair `(client_id, client_seq)` is unique, so an operation resent after a reconnect is recognised and applied once.',
      '**Messages.** Client to server: "here are my operations since sequence N". Server to clients: operations with their assigned sequence numbers, plus presence updates. A joining client asks for the latest snapshot and every operation after it.',
      '**Permissions.** Checked when the socket opens and again when access changes: if an editor is downgraded to viewer, the server must stop accepting their operations straight away, not at their next reconnect. Viewers receive the stream but cannot send operations.',
      '**Failure modes.** A reconnecting client sends operations it made while offline, which must merge rather than overwrite. The CRDT choice makes this ordinary rather than special. A slow client must not hold up others, so per-connection buffers are bounded and a client that falls too far behind is dropped and resyncs from a snapshot.',
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
      'Noticed the scale problem is open documents, not traffic per document',
      'One session server per open document, documents spread across servers',
      'Operation log with unique client sequence numbers, so resends apply once',
      'Permission changes take effect on the live connection',
    ],
    followUp: {
      q: '"I think operational transformation is the better choice here. Convince me otherwise — or agree."',
      answer:
        'I would engage rather than defend, because this is a real disagreement among people who build these systems. The case for OT is strong. It has the longer production track record, the documents are smaller because you are not carrying per-character identifiers, and if you already have a central server imposing an order (which I do here), then the main thing CRDTs buy you, order independence without coordination, is less valuable. Those are good arguments and I would say so. My case for CRDTs is that the transformation functions in OT are notoriously easy to get subtly wrong, and the failure mode is silent divergence that shows up as one user seeing different text from another, which is very hard to debug after the fact. CRDTs move that correctness into the data type where it can be tested in isolation. Offline editing also falls out naturally rather than needing special handling. But if the team already has OT expertise, or memory overhead is a real constraint for very large documents, I would take OT without much argument. The deciding factor is which failure mode you would rather debug, and that is a team judgement more than a technical one.',
    },
  },
]

/**
 * Company questions that were the same design as one of the main problems.
 * They no longer have pages of their own: what the company is actually testing
 * and its follow-up are shown as a section of the matching worked solution
 * (/problems/<relatedProblem>/solution), and the old URLs redirect there.
 */
export const MERGED_INTO_SOLUTION = new Set(Object.keys(MERGED_COMPANY_QUESTIONS))

/** Questions with their own practice page. */
export const COMPANY_QUESTIONS: CompanyQuestion[] = ALL_QUESTIONS.filter((q) => !MERGED_INTO_SOLUTION.has(q.id))

/** The company angles shown on a problem's solution page. */
export function companyAnglesFor(problemSlug: string): CompanyQuestion[] {
  return ALL_QUESTIONS.filter((q) => MERGED_INTO_SOLUTION.has(q.id) && q.relatedProblem === problemSlug)
}

/** Every question for a company, merged ones included (for the company hub). */
export function allQuestionsFor(companyId: string): CompanyQuestion[] {
  return ALL_QUESTIONS.filter((q) => q.company === companyId)
}

export function getCompany(id: string): Company | undefined {
  return COMPANIES.find((c) => c.id === id)
}

export function questionsFor(companyId: string): CompanyQuestion[] {
  return COMPANY_QUESTIONS.filter((q) => q.company === companyId)
}

export function getQuestion(id: string): CompanyQuestion | undefined {
  return COMPANY_QUESTIONS.find((q) => q.id === id)
}
