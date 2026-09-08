import type { Archetype, ArchetypeId } from '@/lib/types'

export const ARCHETYPES: Archetype[] = [
  {
    id: 'pressure-tester',
    name: 'The Pressure Tester',
    tagline: 'Questions every decision. Keeps asking "why not the other way?"',
    behaviour: [
      'You say "I would use a cache." They say "why?" You explain. They say "why not just a bigger database?"',
      'They will push back on answers that are correct, to see whether you fold. They are not disagreeing — they are testing whether you know why you chose.',
      'They rarely move on quickly. Expect three or four rounds on a single decision that other interviewers would accept in one.',
      'They often argue for a position they do not hold, just to see whether you can defend yours.',
    ],
    failing: [
      'You change your answer the moment they push. If you switch from a queue to a direct call because they raised an eyebrow, you have told them the first answer was memorised.',
      'You repeat the same justification louder. "Because it scales better" three times is not a defence, it is a stall.',
      'You cannot say what you gave up. Every choice costs something, and not knowing the cost is proof you did not choose.',
      'You get defensive and treat the question as an attack rather than a request for reasoning.',
    ],
    surviving: [
      'Have a number or an access pattern behind every decision. "40 writes a second" ends an argument that "it scales" cannot.',
      'Name the alternative you rejected and why, before they ask. That converts a challenge into a discussion.',
      'When they are right, say so immediately and adjust. Conceding a good point is a strength signal, not a weakness one.',
      'Distinguish between "I chose this and here is the cost" and "I would need to measure that". Both are strong. Bluffing is not.',
    ],
    weights: { tradeoffs: 1.6, defence: 1.6, design: 1.1, requirements: 0.9, numbers: 1.0, lifecycle: 0.8 },
    categories: ['question-choice', 'force-cost', 'attack-consistency'],
    drill: [
      {
        q: 'You said you would add a cache. Why not just buy a bigger database instance?',
        weak: '"Caches are faster than databases." Not an argument — a bigger instance is also faster, and it is simpler. This answer does not engage with what they actually asked.',
        strong:
          '"Because the constraint is not the database being slow, it is the read:write ratio. I estimated 4,000 reads a second against 40 writes, so the same small set of rows is being read repeatedly — a bigger instance costs more to serve the same rows over and over, while a cache serves them from memory once. A bigger instance is really the right answer when the working set is large and access is uniform, which is not this case. Cost of my choice: a second system, stale data for the TTL window, and a stampede when it restarts, which I handle with coalescing."',
        trap: 'The trap is that a bigger instance is often correct, so a rehearsed pro-cache answer walks into it. Naming when their suggestion would win is what makes your answer credible.',
      },
      {
        q: 'You partitioned by user id. Why not by time? Time is simpler.',
        weak: '"Time-based partitioning does not scale." Too broad — it is used successfully in plenty of systems, particularly for time-series data.',
        strong:
          '"Time is the right key when queries are time-ranged and old data goes cold — logs and metrics, where you drop whole partitions by age. It is wrong here for two reasons. Write skew: every write goes to the newest partition, so one machine takes all the load while the others idle, which is the exact failure partitioning exists to prevent. And my dominant query is \'this user\'s recent items\', which under time partitioning has to scan every partition and merge. User id makes that one partition read. Cost: a single very heavy user can make one partition hot, which is a much rarer problem and one I can handle specifically."',
        trap: 'They may push again with "but you get free data expiry with time partitioning". That is true and worth conceding, then noting you can get expiry within a user partition too, at more effort.',
      },
      {
        q: 'You are using eventual consistency here. What if I told you the business needs it exact?',
        weak: '"Then we would make it strongly consistent." Fine — but at what cost, and to which operations? Agreeing instantly with no consequences means you had not thought about why it was eventual.',
        strong:
          '"Then I would want to know which operation, because I would not make the whole system strong. If it is the like count, exact costs a transaction per click on a contended row and buys nothing a user can perceive — I would push back and ask what decision depends on that number being exact. If it is the balance at the moment of payment, I agree completely, and that path should already be strongly consistent in my design. The general position: I pick consistency per operation based on what being wrong costs, and I would rather have this conversation per feature than apply one setting everywhere and pay latency on all of it."',
        trap: 'The trap is capitulating to a hypothetical. "The business needs it exact" is often a test of whether you will ask which part, or just make the whole system slower.',
      },
    ],
    sayThis:
      '"I chose X. The main alternative was Y, which is better when [condition], and that condition does not hold here because [number]. What X costs me is [cost], and I am accepting that because [reason]."',
  },

  {
    id: 'cost-auditor',
    name: 'The Cost Auditor',
    tagline: 'What does this cost per month? Is there a cheaper way? Who gets paged at 3am?',
    behaviour: [
      'Every component you draw, they attach a price to. "That is another service to run. Who runs it?"',
      'They ask about the bill, but they are equally interested in operational cost — deploys, on-call, the number of things that can page someone.',
      'They will offer you a cheaper-but-worse option and see whether you evaluate it or reject it reflexively.',
      'They are unimpressed by elegance. They want to know what it costs to keep alive for three years.',
    ],
    failing: [
      'You have no idea which line item dominates. If you cannot say whether bandwidth, storage or compute is the biggest cost, you have not connected your design to your estimates.',
      'You add components without noticing the operational cost. Five services is five deploy pipelines, five sets of alerts and five things to be woken up by.',
      'You reject the cheap option on principle. "We should not compromise on quality" is not an engineering position.',
      'You optimise the small line item. Tuning compute while bandwidth quietly dominates is the classic version.',
    ],
    surviving: [
      'Derive the cost shape from your own estimates. You do not need prices; you need to know which number is largest and why.',
      'Name the operational cost of every component, not just the infrastructure cost. "This is another thing to monitor" is a real price.',
      'Take the cheap option wherever the user cannot perceive the difference — and say exactly where that boundary is.',
      'Have an answer for what you would delete if the budget halved. Knowing your own load-bearing components is the whole skill here.',
    ],
    weights: { tradeoffs: 1.6, design: 1.3, numbers: 1.4, defence: 1.0, requirements: 0.9, lifecycle: 0.8 },
    categories: ['force-cost', 'operations', 'question-choice'],
    drill: [
      {
        q: 'You have drawn seven components. Who is on call for them, and what wakes them up?',
        weak: '"We would have monitoring and alerts on everything." That makes it worse — seven components with alerts on everything is a pager that fires constantly and gets ignored.',
        strong:
          '"Fair challenge, and it is an argument for fewer components. Of the seven, three are managed services I do not get paged for beyond their availability — the queue, object storage and the CDN. Two are stateless services where the alert is error rate on the user path and the fix is usually a rollback. The database is the one that really needs an experienced person at 3am, and the cache is the one that will page them most often for the least real impact. If I were cutting, I would drop the in-process cache layer first, because it adds a class of confusing bugs — servers disagreeing — for a marginal hit-rate gain. I would alert on user-visible symptoms and keep component-level metrics on dashboards rather than on the pager."',
        trap: 'The trap is treating monitoring as the answer to complexity. More components means more pages regardless of how good the monitoring is; the real answer is fewer components.',
      },
      {
        q: 'Your infrastructure budget is cut in half tomorrow. What goes?',
        weak: '"We would need to reduce capacity across the board." Uniform cuts degrade everything slightly and usually break the thing with the least headroom first.',
        strong:
          '"Not uniformly — I would cut where users cannot tell. In order: move batch processing to interruptible capacity, which is a large saving for work that has hours of slack; move cold storage to a colder tier and shorten fine-grained retention, keeping rollups; drop the second region if it exists for availability rather than latency, since most outages are self-inflicted and a second region does not protect against a bad deploy; and reduce redundancy on non-critical paths. What I would not cut: capacity headroom on the user request path, because that is what absorbs spikes and partial failures, and the cache, because the database is sized assuming it exists. If that is not enough, the next honest conversation is about reducing scope rather than degrading everything."',
        trap: 'The trap is cutting headroom because it looks like idle waste. Headroom is what survives losing half the fleet, and cutting it is how a cost saving becomes an outage.',
      },
      {
        q: 'This design costs three times the simpler one. Convince me.',
        weak: '"It is more robust and will scale better." Unquantified. Robustness has a value and you have not stated it.',
        strong:
          '"I might not convince you, and that would be a reasonable outcome. The extra cost buys three things and I would price them separately: surviving a regional failure, which is only worth it if an hour of downtime costs more than the annual difference — I would want that number from you; serving users on another continent locally, which is a product benefit rather than insurance; and headroom for growth, which is only worth paying for now if growth is imminent. If the answer is that downtime is tolerable and growth is uncertain, I would ship the simpler one and make sure the data model does not block the upgrade later, which is the only decision that is expensive to reverse. That is my actual recommendation unless one of those three numbers says otherwise."',
        trap: 'The strongest move is being willing to lose the argument. Defending the expensive design regardless of the numbers is exactly what this interviewer is testing for.',
      },
    ],
    sayThis:
      '"The dominant cost here is [X], because [number from my estimate]. [Y] is an order of magnitude smaller, so I would not spend engineering effort there. Operationally, this adds [N] things that can page someone, and if I had to cut, [component] goes first because [reason]."',
  },

  {
    id: 'scale-breaker',
    name: 'The Scale Breaker',
    tagline: 'Multiplies your traffic, adds celebrity users and hot keys, kills a region.',
    behaviour: [
      'Every time you settle on a design, they multiply something. 10x traffic. 100x one user. A region gone.',
      'They are looking for the specific component that breaks first, and whether you know what it is before they tell you.',
      'They love distributions. They will take your average and ask about the 99th percentile, then the maximum.',
      'They rarely care about the happy path at all — they are interested in your design at its limits.',
    ],
    failing: [
      '"It scales horizontally." Something never does, and not naming it means you have not looked.',
      'You designed for the average and have no answer for the tail. The average follower count tells you nothing about the account with 30 million.',
      'You add capacity as the answer to everything, including problems capacity does not fix — like a single hot key.',
      'You have no ordering. "Several things would struggle" is not an answer; they want first, second, third.',
    ],
    surviving: [
      'Know your own bottleneck before they ask, and volunteer it. "The thing that breaks first here is X, at about Y times current load."',
      'Answer with an ordered list, not a single component. Failures cascade in a sequence and knowing the sequence is the skill.',
      'Always check the tail of any distribution you used. Whenever you say "average", ask yourself what the maximum does.',
      'Distinguish problems that capacity solves from problems it does not. A hot key, a lock, a single-threaded component — more machines do nothing.',
    ],
    weights: { numbers: 1.6, design: 1.4, defence: 1.4, lifecycle: 1.1, tradeoffs: 1.0, requirements: 0.8 },
    categories: ['break-scale', 'kill-something', 'attack-consistency'],
    drill: [
      {
        q: 'Traffic is 100x tomorrow. Not 10x. What is the first, second and third thing to break?',
        weak: '"At 100x we would need to redesign significantly." Probably true, and it dodges the question — they want to know whether you can trace the failure sequence through your own design.',
        strong:
          '"First: the database primary, because writes go through one machine and I am at roughly 40% now, so I hit the ceiling somewhere around 2.5x — everything after that is theoretical unless I partition. Assume I have. Second: the cache, because at 100x the key space grows too and my hit rate drops, so misses multiply and land on a database that is now sharded but still finite. Third: the connection pools, because 100x application servers each with a pool means the database sees a hundred times the connections, which makes it slower rather than faster. And the one that is not about capacity at all: any single hot key, which 100x makes catastrophic and no amount of sharding fixes. Realistically at 100x I would be redesigning around partitioning and a much more aggressive caching strategy, but that sequence is what I would watch break on the way there."',
        trap: 'The connection-count point is the one most people miss: adding application servers makes the database slower, not faster, once connections exceed what it can usefully run in parallel.',
      },
      {
        q: 'One key is now 95% of your traffic. Sharding does not help. What do you do?',
        weak: '"We would add more shards for that key." Sharding distributes keys, not requests for one key. This answer applies the tool to a problem it does not fit.',
        strong:
          '"Correct that sharding does nothing here, so the answer depends on whether it is read-hot or write-hot. Read-hot: replicate the key across N cache nodes with a suffix and read a random one, and put an in-process cache on every server so the hottest key never leaves the machine — which effectively solves it, since one key is easily cacheable. Write-hot: shard the counter, so writers increment one of N rows and readers sum them, accepting that the total is now computed and slightly stale. If it is a contended resource rather than a counter — inventory — then neither works and the honest answer is that the write path has a throughput ceiling I cannot remove, so I queue behind it and manage expectations. I would also detect hot keys automatically with a sketch rather than maintaining a list, because the hot key changes daily."',
        trap: 'The distinction between read-hot and write-hot is the whole answer, and between a counter and a contended resource is the second half. Giving one generic answer misses both.',
      },
      {
        q: 'Your average request touches 3 shards. What is your p99 when you fan out to 100?',
        weak: '"It would be a bit slower." It is dramatically worse, and the reason is mathematical rather than about any component being slow.',
        strong:
          '"Much worse than intuition suggests, and this is the fan-out tail problem. If each shard has a 1% chance of being slow, then waiting on 100 of them means roughly a 63% chance that at least one is slow — so my p99 becomes close to the slowest of a hundred, which is nowhere near any individual shard\'s p99. Every shard can look healthy and the aggregate is terrible. Fixes: hedged requests, where I send a duplicate to another replica if the first is slow and take whichever returns; returning partial results after a deadline, accepting slightly incomplete answers rather than waiting; and reducing the fan-out itself, which is usually the real fix — if I can route by a key so the query touches 3 shards instead of 100, the problem disappears. That is an argument for choosing the partition key around the dominant query."',
        trap: 'This is a maths question disguised as a systems question. Not knowing that tail latency compounds with fan-out is a specific, findable gap, and this interviewer looks for it.',
      },
    ],
    sayThis:
      '"The first thing that breaks is [component], at roughly [N]x, because [reason]. Then [second], for a different reason. And [hot key / lock / single-threaded part] is not a capacity problem at all — more machines do nothing for it, so it needs [specific technique]."',
  },

  {
    id: 'domain-specialist',
    name: 'The Domain Specialist',
    tagline: 'Picks one hard subproblem and stays inside it for thirty minutes.',
    behaviour: [
      'You draw a whole system. They point at one box and say "let us talk about just this."',
      'They go several levels deeper than the rest of the interview — data structures, exact query shapes, failure modes at the level of individual operations.',
      'They are not interested in breadth. Covering all five stages quickly and moving on will frustrate them.',
      'They usually know this subproblem extremely well, so bluffing is detected immediately.',
    ],
    failing: [
      'You run out of depth after two levels. You can say "we would use a cache" and "cache-aside", and then nothing.',
      'You bluff. This is the interviewer most likely to know more than you about their chosen area, and a confident wrong answer costs more than an admission.',
      'You keep trying to zoom back out to the full architecture. They chose this box on purpose.',
      'You describe what a technology does rather than why it fits here.',
    ],
    surviving: [
      'Go deep willingly. Have at least three levels of detail on the mechanisms you name — what it is, how it works, what breaks.',
      'Say "I do not know" cleanly when you reach your limit, then reason forward from what you do know. That is a strong signal, not a weak one.',
      'Bring the failure modes yourself. Depth is mostly knowing how a thing fails, not how it works.',
      'Connect the detail back to the requirement occasionally, so the depth stays purposeful rather than trivia.',
    ],
    weights: { design: 1.5, tradeoffs: 1.4, defence: 1.3, lifecycle: 1.2, numbers: 0.9, requirements: 0.7 },
    categories: ['attack-consistency', 'kill-something', 'question-choice'],
    drill: [
      {
        q: 'Let us only talk about your cache. Walk me through what happens on a miss, in detail.',
        weak: '"On a miss we read from the database and write to the cache." That is one sentence and one level. They have thirty minutes and they are going to keep asking.',
        strong:
          '"Cache-aside, so the application asks the cache, gets nothing, reads the database, writes the result back and returns it. The details that matter start immediately. Concurrency: a thousand requests can miss on the same key simultaneously and all go to the database, so I coalesce — one request fetches while the others wait on the same in-flight promise. Correctness: writing back after reading has a race, where a concurrent write updates the database and deletes the key before my slower read writes its stale value back, so the cache holds stale data indefinitely — mitigated by short TTLs as a backstop and, where it matters, by versioned values. Missing keys: an id that does not exist cannot be cached normally, so repeated lookups always hit the database, which I fix with brief negative caching or a bloom filter. Expiry: TTLs need jitter, or a million keys written together all expire in the same second and I get a synchronised stampede."',
        trap: 'The stale-write-back race is the third-level detail this interviewer is fishing for. It is subtle, real, and almost never mentioned unprompted.',
      },
      {
        q: 'Just the partitioning. How do you actually reshard without downtime?',
        weak: '"We would migrate the data to the new shards." That is the goal, not the method, and the method is where all the difficulty is.',
        strong:
          '"The honest first answer is that I would try to avoid it, by starting with far more logical partitions than machines — say 1024 mapped onto 16 nodes — so growing means moving whole logical partitions with no re-hashing at all. If I have to really reshard: dual-write to old and new layouts, with the old still authoritative; backfill history in throttled batches; then verify by reading from both for a sample of traffic and measuring the disagreement rate, which is the step that tells you whether it actually worked; then shift reads gradually with a fast way back; then stop writing to the old layout; then, after a safe period, delete. The hard parts inside that: keeping dual writes consistent when one side fails, which I handle by making the new-side write reconcilable rather than blocking; and the backfill racing with live writes on the same key, which needs the live write to win — usually by version, not by timing."',
        trap: 'The backfill-versus-live-write race is where real resharding goes wrong, and naming it unprompted is what distinguishes having done this from having read about it.',
      },
      {
        q: 'Only the queue consumer. What exactly happens when it restarts mid-batch?',
        weak: '"The messages would be redelivered and processed again." Yes — the question is what that does to the side effects, which is the entire substance.',
        strong:
          '"Unacknowledged messages are redelivered, so the partially-processed batch comes back. Whether that is fine depends on what I did with the first half. If the effects are idempotent — upsert by natural key, set a status rather than increment — reprocessing is a no-op and this is a non-event. If they are external, each needs its own idempotency key carried to the provider, and I need per-item progress rather than per-batch, or I redo work that succeeded. The subtle failure: acknowledging before committing the work means a crash between them loses the message silently, so the order must be process, commit, then acknowledge — at-least-once by construction. There is also visibility timeout: if processing takes longer than it, the message is redelivered while I am still working on it, so two consumers run concurrently on one message. That needs either a heartbeat extending the timeout or, better, idempotency that makes concurrent duplicates harmless."',
        trap: 'The visibility timeout causing concurrent duplicate processing is the deep one. Most people handle sequential redelivery and miss that the duplicate can be running at the same time.',
      },
    ],
    sayThis:
      '"At the next level down, the thing that makes this hard is [specific mechanism]. It fails when [precise condition], and I handle that with [technique] — which costs [cost]. Below that I would be guessing, so I would want to measure rather than assert."',
  },

  {
    id: 'scope-shifter',
    name: 'The Scope Shifter',
    tagline: 'Changes the requirements halfway through, on purpose.',
    behaviour: [
      'Twenty minutes into a clean design, they add a requirement that invalidates part of it.',
      'They are testing adaptability and whether your design has joints — or whether one change means starting over.',
      'They often change the requirement to the thing you explicitly scoped out in Stage 1.',
      'They watch how you react emotionally as much as technically. Visible frustration is a signal to them.',
    ],
    failing: [
      'You start over. Most scope changes affect one part of a design, and rebuilding everything shows you cannot see the boundaries.',
      'You claim it changes nothing. It usually changes something, and pretending otherwise means you have not thought it through.',
      'You get visibly annoyed. In a real project, requirements change weekly; this is a preview of working with you.',
      'You bolt it on without saying what you would have done differently on day one.',
    ],
    surviving: [
      'Say what stays first. "The ingestion path and the storage layer are unaffected" is reassuring and usually true.',
      'Then say precisely what changes, and how much work it is. Be honest when the answer is "a lot".',
      'Then say what you would have done differently on day one knowing this — that is the reflective answer they are actually after.',
      'Treat the change as normal. "That is a fair requirement, here is what it costs" is exactly the right tone.',
    ],
    weights: { requirements: 1.5, design: 1.3, tradeoffs: 1.3, defence: 1.2, lifecycle: 1.0, numbers: 0.8 },
    categories: ['change-scope', 'question-choice', 'break-scale'],
    drill: [
      {
        q: 'Everything you designed is single-region. Now it has to be multi-region. Go.',
        weak: '"We would replicate the database to another region." That handles reads, which was already the easy part, and says nothing about the write path where the design actually changes.',
        strong:
          '"What stays: the stateless services, the caching strategy, the data model, the queue topology — all of that is unchanged and just gets deployed in each region. What changes is entirely the write path, and there are three options. Single write region: simplest, no conflicts, distant users pay 150 ms per write — acceptable if writes are rare. A home region per user, so writes are local and there are still no conflicts, at the cost of a routing layer and a story for users who relocate. Or multi-leader, which gives local writes everywhere and hands me a conflict resolution problem I only want for data where merging is safe. I would take home-region for user-owned data and keep globally contested things like inventory in one region. What I would have done differently on day one: chosen a partition key that already has a natural region affinity, because retrofitting that is the expensive part."',
        trap: 'The trap is answering only about replication. Naming what stays unchanged first is what makes this sound like adaptation rather than panic.',
      },
      {
        q: 'You scoped out the search feature. The interviewer now says it is the main requirement.',
        weak: '"We would add a search index." True and shallow, and it ignores that scoping it out shaped decisions you now need to revisit.',
        strong:
          '"Reasonable — I scoped it out to focus, so let me bring it back properly. What stays: the primary store remains the source of truth, and search is derived data, which is the most important thing to be clear about. What changes: I need an inverted index, kept in step by change data capture off the database log rather than by dual writes from the application, because dual writes drift silently. Ranking becomes a real design question — text relevance plus business signals — and it is where most of the product quality lives. And a new consistency wrinkle: the index lags by about a second, so a user searching for something they just created will not find it, which I handle by reading their own items from the primary. What I would have done differently on day one: nothing structural, actually — keeping the primary store authoritative and the derived stores fed from its log is the decision that makes adding search cheap, and I made it already."',
        trap: 'Being able to say "nothing structural changes, because of a decision I already made" is the strongest possible answer here — but only if it is true.',
      },
      {
        q: 'Actually, users must be able to edit and delete everything retroactively. Does that break your design?',
        weak: '"We would add update and delete endpoints." The endpoints are trivial. The problem is everywhere the data was copied, precomputed and aggregated.',
        strong:
          '"It breaks the parts that assumed append-only, and that is worth being direct about. What survives: the primary store handles updates and deletes fine. What breaks: anything precomputed. If I fanned a post out to millions of inboxes, deleting it means either chasing millions of rows or tombstoning and filtering at read time — I would take the tombstone, accepting that a page can briefly return one item short. Aggregates computed from events need to be recomputable rather than incrementally accumulated, which is an argument for keeping raw data and rebuilding, and I would have made that choice anyway. Caches need explicit invalidation on edit rather than relying on TTL. And the derived search index needs delete propagation, which CDC gives me. What I would have done differently on day one: made every aggregate a replacement computed from raw data rather than an accumulated counter, because accumulated counters cannot be corrected."',
        trap: 'Precomputed and fanned-out data is where retroactive edits actually hurt. An answer that only discusses the primary store has missed 90% of the problem.',
      },
    ],
    sayThis:
      '"What stays the same is [components] — that is most of it. What changes is [specific part], and that is roughly [effort]. And knowing this from the start, I would have [decision], because retrofitting it is the expensive bit."',
  },

  {
    id: 'constraint-setter',
    name: 'The Constraint Setter',
    tagline: 'Imposes a hard limit up front and grades everything within it.',
    behaviour: [
      'Before you draw anything: "assume users are on 2G", or "no data may leave the country", or "it must work offline".',
      'The constraint is not negotiable and is not a hint — it is the frame for the entire interview.',
      'They grade whether every decision respects it, and they notice immediately when one does not.',
      'They are usually testing whether you can design within a box rather than reaching for a standard answer.',
    ],
    failing: [
      'You design the normal system and then bolt the constraint on at the end. It has to shape the design from Stage 1.',
      'You forget the constraint halfway through. Proposing a chatty API forty minutes into a "bad network" interview is fatal.',
      'You treat it as an obstacle to argue with rather than a requirement to design for.',
      'You fail to notice which of your usual defaults the constraint invalidates.',
    ],
    surviving: [
      'Restate the constraint in your own words in Stage 1, and say what it rules out. That proves it has landed.',
      'Refer back to it explicitly at each decision. "Given the 2G constraint, that means..."',
      'Identify the standard answer the constraint kills, and say so — that is the insight they are looking for.',
      'Find what the constraint makes easier, not just harder. Constraints usually close some doors and open others.',
    ],
    weights: { requirements: 1.6, design: 1.4, tradeoffs: 1.3, lifecycle: 1.0, defence: 1.0, numbers: 0.8 },
    categories: ['change-scope', 'force-cost', 'question-choice'],
    drill: [
      {
        q: 'Assume every user is on an unreliable 2G connection. Design the read path.',
        weak: '"We would compress responses and use a CDN." Necessary and nowhere near sufficient — on 2G the round trip count matters more than the payload size.',
        strong:
          '"That constraint changes the shape of everything, so let me say what it rules out first: chatty APIs are dead, because on 2G a round trip can be a second or more, so ten sequential calls is ten seconds regardless of payload. So the read path becomes one request returning everything the screen needs, even at the cost of over-fetching — the opposite of what I would do on a fast network. Payloads get aggressively minimised and compressed, and images are served small by default rather than being resized client-side. The client caches aggressively and renders from cache first, then updates, so the app is usable before the network responds. Requests are resumable and idempotent, because connections drop mid-request constantly. And I would push more computation to the server, since one round trip returning a computed answer beats three fetching the ingredients. What it makes easier: the payloads are small enough that caching everything is cheap."',
        trap: 'Round trips, not bandwidth, are the constraint on high-latency networks. Optimising payload size while leaving a chatty API is the standard mistake.',
      },
      {
        q: 'No user data may leave its country of origin. Now design it.',
        weak: '"We would deploy in each country." That is the start, and it leaves open what happens to shared data, cross-border interactions and your central services.',
        strong:
          '"This makes data residency the partitioning key, which is the single biggest consequence — the country becomes the shard, and that decision propagates everywhere. What follows: an independent deployment per country, with its own database, and a routing layer that sends a user to their home deployment. Anything global — configuration, product catalogue, the code itself — replicates freely because it is not user data. The hard parts: cross-border interactions, where a user in one country messages a user in another, so I need a defined rule for whose jurisdiction the message lives under, and that is a legal answer more than a technical one. Analytics has to work on aggregates computed in-country and exported, never on raw records. Backups and disaster recovery must stay in-country, so my DR story is per-country rather than global. What it makes easier: blast radius is naturally contained, and per-country scaling is independent. What it costs: N of everything to operate, and features that assume a global view need rethinking."',
        trap: 'Analytics and backups are where residency constraints are usually violated by accident, because both quietly copy data somewhere central.',
      },
      {
        q: 'This must work fully offline for days at a time. Design the write path.',
        weak: '"We would queue writes locally and sync when online." The right direction and it skips the actual problem, which is conflicts and invalid operations.',
        strong:
          '"Offline writes make every client a write leader, which is the honest framing — I have signed up for a multi-leader system. Concretely: every change becomes an operation with a client-generated id, applied optimistically to local state so the app is responsive, queued durably on the device, and replayed in order on reconnection. Then the hard parts. Conflicts, because the same record may have changed on the server: last-write-wins is simple and silently loses work; per-field merging is better where fields are independent; and for really collaborative data I would use a merge-friendly data type rather than inventing resolution rules. Invalid operations, because after three days offline the item may be deleted or the permission revoked — the server must reject, and the client must surface that to the user rather than dropping it silently, which is a UI requirement as much as a technical one. And ordering, so one failed operation does not silently skip the rest. What it rules out: any server-side validation the client cannot replicate locally, because the user needs an answer while offline."',
        trap: 'The insight is that offline writes turn the whole product into a multi-leader distributed system. Treating it as a caching feature is how this design fails.',
      },
    ],
    sayThis:
      '"Given [constraint], the usual answer of [standard approach] is off the table, because [reason]. So instead I would [alternative], which costs me [cost]. The constraint also makes [something] easier, which I would take advantage of."',
  },
]

export function getArchetype(id: ArchetypeId): Archetype | undefined {
  return ARCHETYPES.find((a) => a.id === id)
}
