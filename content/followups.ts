import type { FollowUp, FollowUpCategory } from '@/lib/types'

export const CATEGORY_INFO: Record<
  FollowUpCategory,
  { name: string; blurb: string; tell: string }
> = {
  'break-scale': {
    name: 'Break the scale',
    blurb: 'They multiply your traffic, add a celebrity, or make one key hot until something snaps.',
    tell: 'The answer they want is what fails FIRST, and in what order. "It scales" is not an answer.',
  },
  'kill-something': {
    name: 'Kill something',
    blurb: 'A component dies. They want to know what the user sees, not what your diagram looks like.',
    tell: 'Always answer in terms of the user experience and the blast radius, then the recovery.',
  },
  'attack-consistency': {
    name: 'Attack consistency',
    blurb: 'Two things happen at the same moment, or a message is lost, or a replica is behind.',
    tell: 'The winning move is naming which invariant must hold and where it is enforced — usually one line of SQL.',
  },
  'question-choice': {
    name: 'Question the choice',
    blurb: 'Why this database, this queue, this pattern? They are testing whether you chose or copied.',
    tell: 'A number or an access pattern justifies a choice. A brand name does not. Naming what you gave up is the strongest signal.',
  },
  'force-cost': {
    name: 'Force the cost',
    blurb: 'What does this cost per month, and would you take cheaper-but-worse?',
    tell: 'You do not need exact prices. You need to know which line item dominates and why.',
  },
  operations: {
    name: 'Operations',
    blurb: 'Deploys, alerts, debugging at 3am. Who gets paged and what do they look at?',
    tell: 'This separates people who have run systems from people who have only drawn them.',
  },
  'change-scope': {
    name: 'Change the scope',
    blurb: 'Halfway through, the requirements move. Multi-region, scheduled, privacy compliant.',
    tell: 'Say what stays, what changes, and what you would have done differently on day one if you had known.',
  },
}

export const FOLLOW_UPS: FollowUp[] = [
  /* ---------------- break the scale ---------------- */
  {
    id: 'scale-10x',
    category: 'break-scale',
    q: '10x traffic tomorrow. What fails first?',
    weak: '"We would add more servers and scale horizontally." This says nothing. Every system has a first thing to break, and not naming it means you do not know your own design well enough to have found it.',
    strong:
      'Name a specific component and the reason. "The stateless services scale out fine — that is not the constraint. The database primary is, because every write goes through one machine and I am at roughly 40% of its write capacity now. So at 4x I am at the ceiling, and I would see write latency climb and connection pool waits before anything errors. The second thing is the cache, because 10x reads on a fixed working set is fine but 10x on a growing key space means my hit rate drops and the misses land on the database that is already the constraint. In order: database writes, then cache hit rate, then the connection pool. And I would find out from p99 write latency, not from errors."',
    trap: 'The trap is that "add more servers" is genuinely correct for the stateless tier, which makes it a comfortable answer. But the stateless tier is never what breaks — the interviewer is asking about the part that cannot be cloned, and answering about the part that can tells them you have not looked.',
  },
  {
    id: 'scale-celebrity',
    category: 'break-scale',
    q: 'One user has 200 million followers. What happens?',
    weak: '"The fan-out would be slow but it would eventually finish." It would, and by then the post is hours old and every other user\'s timeline was blocked behind it. Treating this as a latency inconvenience rather than a systemic failure misses the point entirely.',
    strong:
      '"One post becomes 200 million writes. At my fan-out capacity that is minutes, and worse, it occupies the pipeline so everyone else\'s posts are delayed behind one person\'s. So above a follower threshold I stop fanning out entirely — their posts stay in place and readers pull them at read time, merged with their normal inbox. That works precisely because a huge account\'s recent posts are the most cacheable data in the system: millions of people want the same few rows, so the hit rate is near perfect. Cost: two code paths for one feature forever, a threshold that needs tuning, and timelines assembled from two sources so pagination needs a cursor rather than an offset."',
    trap: 'The hidden trap is that averages hid this. Your estimate said 300 followers and you designed for 300. The interviewer is checking whether you understand that a skewed distribution means the average tells you almost nothing about what will break.',
  },
  {
    id: 'scale-sale-day',
    category: 'break-scale',
    q: '30x traffic for four hours on sale day. Same design?',
    weak: '"We would autoscale." Autoscaling takes minutes and this spike arrives in seconds. Also, the thing that breaks is usually the part that cannot autoscale, which is why naming autoscaling as the whole answer is a tell.',
    strong:
      '"Mostly the same design, but three things change. First, this spike is predictable — the date is known — so I pre-scale rather than relying on autoscaling, which reacts over minutes while the spike arrives in seconds. Second, the stateless tiers scale out, but the database and any shared counter do not, so I would protect them: a queue or waiting room in front to convert a burst into a rate, and aggressive caching of everything that does not need to be exact. Third, I would decide in advance what to shed — recommendations, analytics, non-essential enrichment — so degradation is a choice rather than a surprise. And I would load test at 30x before the day, because the failure I have not thought of is the one that matters."',
    trap: 'Predictability is the gift here and most people miss it. A scheduled spike lets you pre-scale, pre-warm caches, and freeze deploys. Answering as though it were a surprise spike throws away the main advantage you have.',
  },
  {
    id: 'scale-hot-key',
    category: 'break-scale',
    q: 'One key gets 90% of the traffic. What breaks, and what do you do?',
    weak: '"Consistent hashing spreads the load evenly." It spreads keys evenly, not traffic. All requests for one key go to one place no matter how elegant your hashing is — this answer confuses two different problems.',
    strong:
      '"Whichever node owns that key is saturated while the rest idle, and no partitioning scheme fixes it because partitioning distributes keys, not requests for a single key. Three real options. Replicate the hot key across N nodes with a suffix and read a random one — costs N times the memory and a fanned-out invalidation, and it is the right answer for a read-hot key. For a write-hot key, shard the counter and sum on read, accepting that the total is now a computed value. Or handle it on a separate path entirely — an in-process cache on every server absorbs a read-hot key almost completely. I would also detect hot keys automatically with a count-min sketch rather than maintaining a manual list, because yesterday\'s hot key is not today\'s."',
    trap: 'The trap is reaching for a partitioning answer to a single-key problem. Consistent hashing, better shard keys, more nodes — none of them help. Recognising that the tool does not apply is the point of the question.',
  },
  {
    id: 'scale-growth',
    category: 'break-scale',
    q: 'You grow 10x every year for three years. What do you rebuild?',
    weak: '"The design already scales to any size." No design does, and claiming so means you have not identified where your assumptions run out.',
    strong:
      '"Year one, nothing — I sized the current design with headroom and it absorbs 10x. Year two, the single-primary database stops being enough and I have to partition, which is the expensive one: it means choosing a shard key, dual-writing, backfilling and cutting over, and it takes a quarter. That is why I chose the data model on day one so the natural shard key was already the primary access key — the migration is painful but not a redesign. Year three, the thing I expect to hurt is not capacity but blast radius and operations: one global system serving 1,000x the original traffic needs regional isolation so one failure does not take everything down. So the honest answer is I rebuild the storage layer once, and I plan for it by picking the key correctly now."',
    trap: 'The question is really "did you make a decision now that makes the future migration cheap or impossible?" The shard key and the data model are the two answers. Everything else can be changed in an afternoon.',
  },
  {
    id: 'scale-write-ceiling',
    category: 'break-scale',
    q: 'Writes double every month. When do you shard, and how do you know?',
    weak: '"We would shard when it gets slow." By the time it is slow you are already in an incident, and sharding is a multi-week project you cannot do under pressure.',
    strong:
      '"I would pick the trigger in advance, from a measurement rather than a feeling: sustained write throughput above about 60% of what the primary can commit, or replication lag that stops recovering during peak. At 100% monthly growth, 60% gives me roughly a month of runway, which is not enough for a sharding project — so the real answer is that I start the work when I cross 40%. The order of cheaper options first: batch writes to reduce operation count, move non-essential writes off the hot path, and check whether one table is the problem rather than the database, in which case I move that table out first. Sharding is the last resort because it is the only one that is hard to undo."',
    trap: 'The trap is treating sharding as the response to a problem rather than a project planned ahead of it. Anyone who has done it knows it takes weeks; saying "when it gets slow" tells the interviewer you have not.',
  },
  {
    id: 'scale-fan-in',
    category: 'break-scale',
    q: 'A million clients all reconnect at the same second. What happens?',
    weak: '"They would reconnect and everything would be fine." A million simultaneous TLS handshakes and auth checks is usually a bigger load than your normal peak traffic — this is a real, self-inflicted outage.',
    strong:
      '"A reconnection storm, and it is often worse than the original failure. Each reconnect costs a handshake plus an auth check, so a million in one second can exceed my steady-state capacity many times over, and the fleet that just came back falls over again. Defences, in order of value: jittered exponential backoff on the client, which spreads the herd across tens of seconds and is one line of code; TLS session resumption so returning clients skip the expensive part; an auth check on connect that validates a token without a database call; and rolling deploys a few percent at a time so I never disconnect everyone at once. I would also make reconnection cheap by pushing full state rather than requiring a replay, so a reconnecting client just fetches current state from a cached endpoint."',
    trap: 'The trap is thinking about steady-state message delivery when the real peak is connection establishment. Handshakes are far more expensive than messages, and they all arrive together.',
  },
  {
    id: 'scale-tail-latency',
    category: 'break-scale',
    q: 'Your p50 is 20 ms and your p99 is 4 seconds. Why, and what do you do?',
    weak: '"We would optimise the slow queries." Maybe, but a 200x gap between median and tail is rarely one slow query — it is usually structural, and guessing at optimisation without finding the shape is how you spend a week on nothing.',
    strong:
      '"A gap that size means the tail is a different code path or a different data shape, not the same work being slower. The usual causes, in order of likelihood: data skew, where a small number of users have far more rows so their queries plan differently; queueing, where requests wait on a saturated resource like a connection pool, which shows as a bimodal distribution rather than a smooth curve; a dependency with its own bad tail that I am calling synchronously; and garbage collection or lock contention pauses. I would find out by looking at whether the distribution is bimodal — that points to queueing — and by tracing a slow request end to end. The fix depends on the cause, but the structural one worth naming is that if a request fans out to 100 shards and waits for all of them, my p99 becomes the p99 of the slowest of 100, which is close to certain to be slow. That needs hedged requests or partial results, not query tuning."',
    trap: 'The fan-out maths is the deep answer here: waiting on 100 parallel calls means your tail latency is dominated by the worst one, so a service with a good p99 becomes a service with a terrible p99 as soon as you call it a hundred times.',
  },

  /* ---------------- kill something ---------------- */
  {
    id: 'kill-cache',
    category: 'kill-something',
    q: 'The cache just died. What happens?',
    weak: '"Requests would go to the database instead, so it would be a bit slower." At the ratios that justify a cache, the database cannot take that load. This answer means you added a cache without checking what it was protecting you from.',
    strong:
      '"Every read that was being served from memory lands on the database at once. My cache was absorbing something like 99% of reads, so the database sees roughly 100x its normal load, and it will not survive that — so the honest answer is that a naive design goes down. What I would do about it, designed in advance: coalesce misses so a thousand simultaneous requests for the same key produce one database read rather than a thousand; keep a small in-process cache on each server as a second layer so the hottest keys never leave the machine; shed load at the edge rather than let the database die, because a degraded site beats a dead one; and bring the cache back warm rather than empty, because restarting into an empty cache reproduces the outage. Cost of the in-process layer: servers can briefly disagree with each other."',
    trap: 'The real trap is the cold restart. People plan for the cache being down and forget that bringing it back empty causes the same stampede a second time, which is how a ten-minute incident becomes an hour.',
  },
  {
    id: 'kill-region',
    category: 'kill-something',
    q: 'A whole region is down. What do users see?',
    weak: '"We failover to another region." That is the mechanism, not the answer. The question is what a user experiences, for how long, and what is lost.',
    strong:
      '"I would answer per path rather than globally. Reads: if replicas exist elsewhere, they keep working, possibly stale, and I would say how stale. Writes: if the leader was in the dead region, writes fail until a new leader is promoted, which is seconds to a minute — and being aggressive about promotion risks promoting during a brief network blip and ending up with two leaders. For contested resources like inventory I would rather be unavailable for that region\'s writes than risk selling the same thing twice, and I would say that explicitly as a choice. For non-contested writes like posting a comment, take it locally and reconcile. Data loss: with async replication, anything committed in the last few seconds and not yet replicated is gone, so I would use semi-synchronous replication for anything I cannot lose. And DNS-based failover is slow because clients cache DNS for minutes, so I would not rely on it alone."',
    trap: 'The trap is claiming everything keeps working. Something always degrades — the skill is knowing which thing you chose to sacrifice and being able to say why.',
  },
  {
    id: 'kill-queue',
    category: 'kill-something',
    q: 'The queue is backed up by an hour. What do you do?',
    weak: '"Add more consumers." Sometimes right, sometimes exactly wrong — if consumers are failing and retrying, adding more accelerates the failure. Not distinguishing the two cases is the tell.',
    strong:
      '"First I work out which of two things it is, because the fixes are opposite. If consumers are healthy and simply outnumbered, scale them out — and check what they are hitting, because often the real ceiling is a database and adding workers just moves the queue there. If consumers are failing and retrying, more consumers makes it worse; I find the poison message or the broken dependency and stop the retry storm. Then I triage rather than drain in order: if urgent and non-urgent work share a queue, the non-urgent is now delaying the urgent, which is a lesson for the design, not just the incident. Then I decide what to drop — an hour-old \'your driver is arriving\' notification is worse than useless and I would discard it rather than deliver it. And afterwards I alert on message age and backlog growth rate, not depth, because depth crossing a threshold tells you an hour too late."',
    trap: 'Dropping work is the answer most people will not say out loud, and it is often correct. Some messages are worthless once late, and delivering them is worse than discarding them.',
  },
  {
    id: 'kill-database',
    category: 'kill-something',
    q: 'The primary database is gone. Walk me through the next five minutes.',
    weak: '"The replica takes over automatically." Something has to notice, decide, and promote — and each of those has a timeout that is downtime. Saying it is automatic without saying how long skips the entire question.',
    strong:
      '"Minute one: writes are failing and the application is returning errors, because detection is not instant — a health check needs a few consecutive failures to avoid promoting on a blip, so call it 15 to 30 seconds before anything decides. Reads from replicas keep working, so a well-built app degrades to read-only rather than going dark, and I would have designed for that explicitly. Then promotion: a replica is promoted, which requires a majority to agree so that a network partition cannot produce two primaries. Anything the old primary accepted and had not replicated is lost — with async replication that is seconds of writes, and I need to know whether that is acceptable for this data or whether I should have been semi-synchronous. Then the application reconnects, which means connection pools need to actually notice and re-resolve rather than holding dead connections. Five minutes in, I am serving writes again and I have a list of possibly-lost transactions to reconcile. The thing I would rehearse is the promotion, because an untested failover is a hypothesis, not a plan."',
    trap: 'Read-only degradation is the strong detail. Most applications could keep serving most traffic without a write path, but only if someone designed for it — otherwise the whole product returns 500s for a problem affecting one code path.',
  },
  {
    id: 'kill-dependency',
    category: 'kill-something',
    q: 'A third-party API you depend on starts taking 30 seconds to respond. What happens?',
    weak: '"We would retry." Retrying against something already overloaded makes it worse, and retrying a 30-second call means holding your resources for a minute or more. This answer usually turns one slow dependency into your own outage.',
    strong:
      '"Slow is more dangerous than down, because down fails fast and slow holds resources. Without a timeout, every request calling that API holds a thread and a connection for 30 seconds, my pools exhaust, and endpoints that never touch that API start failing — one dependency becomes a total outage. So: a timeout set from their real latency distribution, not a round number; a circuit breaker that opens on failure rate so I stop waiting entirely once it is clearly bad; a bulkhead giving that dependency its own limited pool so it cannot consume capacity the checkout path needs; and a defined fallback — cached data, a degraded response, or dropping an optional feature. The fallback has to be decided before the incident, per dependency, or I fail fast into a blank page. And retries need backoff with jitter and a cap, or I contribute to keeping them down."',
    trap: 'The insight is that a slow dependency is worse than a dead one. Most people design for the failure case and get taken down by the degraded case, because nothing errors — everything just waits.',
  },
  {
    id: 'kill-half',
    category: 'kill-something',
    q: 'Half your servers vanish instantly. What is the user impact?',
    weak: '"The load balancer routes around them." That handles routing; it does not handle the fact that the remaining half now takes double the load and may not have the headroom.',
    strong:
      '"Two separate problems. Routing: health checks remove them within a few seconds, so there is a short window of failed requests for anyone routed to a dead instance — retries with backoff cover that. Capacity: the survivors now take 2x traffic, so if I was running above 50% utilisation, they saturate and I have turned a partial failure into a total one. That is why capacity planning has to assume losing a chunk of the fleet, not just the peak load. Third, the subtle one: if servers held any local state — in-memory caches, sticky sessions, open connections — that is gone, so the survivors face a cold cache and a reconnection surge at the same time as double traffic. That combination is what actually takes systems down. I would rather run more, smaller instances so losing half is less likely to be correlated, and keep utilisation low enough to absorb it."',
    trap: 'The compound failure is the real answer: double traffic plus cold caches plus reconnection storm, all at once. Handling any one of them in isolation is not enough.',
  },
  {
    id: 'kill-network',
    category: 'kill-something',
    q: 'Two halves of your cluster can see clients but not each other. What now?',
    weak: '"The system would heal itself when the network came back." It might heal, or it might have accepted conflicting writes on both sides for ten minutes and now has two versions of the truth with no way to merge them.',
    strong:
      '"This is a partition, and it is the case CAP is actually about. Both halves are up and serving, so the danger is not availability, it is divergence — if both sides accept writes, I get two conflicting histories. The defence is a majority rule: only the side that can reach more than half the nodes may accept writes, so the minority side refuses. That means some users get errors even though their servers are healthy, and I accept that deliberately for anything contested — inventory, balances, unique names. For non-contested data I would keep both sides available and reconcile afterwards, because the worst case is a merge rather than a double-sell. The failure to avoid is split brain: the old leader not knowing it lost, so I need fencing tokens so the storage layer rejects writes from a leader that has been superseded."',
    trap: 'This is the question where "pick two of three" gets exposed as a slogan. The interviewer wants to hear a per-operation decision, not a recitation.',
  },
  {
    id: 'kill-worker-mid-job',
    category: 'kill-something',
    q: 'A worker dies halfway through processing a batch. What is the state of the world?',
    weak: '"The job would be retried." Retried from where? If the first half already had side effects, retrying repeats them, and now you have sent 5,000 emails twice.',
    strong:
      '"It depends entirely on whether I made the work idempotent, which is a decision I have to have made beforehand. The message was not acknowledged, so it is redelivered — that is at-least-once and it is the only delivery I can actually get. So a retry reprocesses the first half. If each item\'s effect is idempotent — an upsert by a natural key, setting a status rather than incrementing — the retry is harmless and this is a non-event. If the effects are external, like sending an email or charging a card, each one needs its own idempotency key carried to the provider, and I need to record progress per item rather than per batch so a retry skips what is done. The design lesson is to record completion in the same transaction as the work where possible, so there is no window where the work happened and the record of it did not."',
    trap: 'The trap is thinking about the queue\'s guarantees instead of the side effects. The queue will redeliver — that is settled. The only question that matters is whether doing the work twice is harmless.',
  },

  /* ---------------- attack consistency ---------------- */
  {
    id: 'consistency-simultaneous',
    category: 'attack-consistency',
    q: 'Two users click at the same millisecond. What happens?',
    weak: '"We would use a lock." Which lock, held where, and what happens if the holder pauses? A lock is a mechanism, and reaching for it before asking whether the resource is contested at all is a reflex rather than an answer.',
    strong:
      '"First I would ask whether the thing is contested. If it is a like button, both writes land, the count converges, and I would deliberately not spend a transaction on it. If it is the last seat, exactly one must win, and I get that by making the decision at a single point of serialisation — a conditional update that only succeeds if the seat is still free, or a unique constraint so the second insert simply fails. Notice I am not proposing to read and then write in application code, because that gap is the race itself. The loser gets a clear message and an alternative, not an error. Cost: that path is now strongly consistent, so it is slower and it becomes unavailable if the owning partition is unreachable — which I accept, because selling one seat twice is worse than an error message. I would specifically not add a distributed lock, because the database row is already a single point of serialisation and a lock adds a failure mode where a paused holder\'s lease expires and two processes both think they won."',
    trap: 'The trap is that "use a lock" sounds sophisticated. Explaining why you do not need one — because you already have a serialisation point — is the stronger answer, and it is the one that shows you have actually built this.',
  },
  {
    id: 'consistency-retry',
    category: 'attack-consistency',
    q: 'The write worked but the response was lost and the client retried. What happens?',
    weak: '"The client would get an error and could try again." They already tried again — that is the premise. If the retry does the work a second time, you have charged the card twice.',
    strong:
      '"With idempotency keys, nothing bad: the retry carries the same key, the server finds it already claimed, and returns the original stored response, so the client sees success and the card is charged once. Without them, two charges and a customer complaint. The implementation detail that makes it airtight is inserting the key with a unique constraint in the same transaction as the work — two separate steps leave a crash window between them. Two things people get wrong: the client must reuse the key across retries rather than generating a fresh one each attempt, which quietly defeats the whole scheme; and if the retry arrives while the first request is still running, I return an in-progress status so the client backs off, rather than doing the work again or returning a wrong answer. Keys expire after a day or so, or the table grows forever."',
    trap: 'The hidden trap is client-side: a client that generates a new key on each attempt has an idempotency system that does nothing. It looks correct in code review and fails in production.',
  },
  {
    id: 'consistency-lag',
    category: 'attack-consistency',
    q: 'Replica lag is 30 seconds and a user reads their own write. What do they see?',
    weak: '"They might see slightly old data." They see their own comment missing, which they will report as data loss. Understating this suggests you have not watched users hit it.',
    strong:
      '"They see the state from before their write, and they will report it as the app losing their work — this is read-your-own-writes and it is the single most common consistency complaint in real products. The fix is not to make everything strongly consistent, which would slow every read for everyone. It is to route that user\'s reads to the leader for a short window after they write, or to have the client pass the write position it saw and let the read wait for a replica that has caught up. Cheapest of all for this specific case: render their own item from what the client already has and do not re-fetch. Cost of leader-pinning: my most active users generate the most leader load, which is a real but bounded price. And separately, 30 seconds of lag is itself a symptom — usually a long transaction or a bulk write hogging the leader — so I would alert on it rather than only design around it."',
    trap: 'The trap is over-correcting to strong consistency everywhere. Read-your-own-writes is dramatically cheaper and solves the actual user complaint; reaching for the heaviest guarantee shows you do not know the middle options exist.',
  },
  {
    id: 'consistency-own-write',
    category: 'attack-consistency',
    q: 'A user updates their profile and immediately sees the old version. How do you fix it without slowing everyone down?',
    weak: '"Make all reads go to the primary." That works and it throws away the entire benefit of having replicas — you have solved one user\'s problem by removing your read scaling.',
    strong:
      '"Scope the fix to the user who wrote. Options in increasing precision: pin that session to the leader for a short window after a write, which is simple and costs a little leader load; or record the write position at commit and have their subsequent reads wait for a replica that has reached it, which is exact and means reads can block briefly; or pin them to a single replica so they at least see a monotonic view, which is cheap and prevents flickering between old and new. For a profile edit specifically, the cheapest correct answer is to render the response from the write itself rather than re-reading — the server already knows the new state. Everyone else continues reading from replicas with normal lag, which is invisible to them because they were not the one who changed it."',
    trap: 'The insight is that consistency is per-user, not per-system. Only the person who wrote can tell that a read is stale, so only their reads need special handling.',
  },
  {
    id: 'consistency-double-charge',
    category: 'attack-consistency',
    q: 'A payment succeeded but your order write failed. What is the customer\'s experience, and what do you do?',
    weak: '"We would refund them." Eventually, maybe — but the customer currently has money missing and no order, and if nothing detects it, nobody will refund anything.',
    strong:
      '"First, I would say that ordering the steps that way was a choice and a poor one — I would authorise the payment, create the order, then capture, because voiding an authorisation is cheap and clean while refunding a capture is slow and visible. Given it has happened: the payment provider holds the truth, so I reconcile against them rather than my own logs. The order write should be retried using the payment reference as an idempotency key, since most of the time it failed transiently and the retry completes the order, which is what the customer actually wants. If it genuinely cannot complete — the item is gone — I refund as a compensating action and tell them what happened, proactively. The two things that make this survivable rather than a scramble: authorise-then-capture, and a reconciliation job comparing payments to orders. Any system doing this at volume will have stuck cases; the only choice is whether you find them or the customer does."',
    trap: 'The trap is answering only about recovery. The strong answer starts by fixing the ordering so the expensive compensation is rarely needed, then handles the residue.',
  },
  {
    id: 'consistency-two-systems',
    category: 'attack-consistency',
    q: 'You write to the database and then publish an event. Name the two failure modes.',
    weak: '"We would use a transaction." A database transaction does not cover the message broker — that is exactly the problem. This answer suggests not seeing that the two systems have no shared transaction.',
    strong:
      '"One: the row commits and the process dies before publishing, so downstream never learns about it — a lost event, and the worst kind because nothing looks broken and the drift is silent. Two: I publish first and the transaction rolls back, so consumers act on something that does not exist — a phantom event. Both are guaranteed to happen eventually because there is no transaction spanning both systems. The fix is the outbox pattern: write the event into a table in the same transaction as the data, so they are atomic by construction, and let a separate relay publish from that table. The remaining cost is that the relay can publish twice if it dies between publishing and marking sent, so consumers must be idempotent — which, given at-least-once delivery, they had to be anyway. Change data capture off the database log gets the same guarantee with less application code, and I would use that when the consumer is derived state like a search index."',
    trap: 'Dual writes are the trap, and they are seductive because they work in testing. The failure only appears under crash conditions, which means it reaches production and then drifts quietly for months.',
  },
  {
    id: 'consistency-ordering',
    category: 'attack-consistency',
    q: 'Two events for the same record arrive out of order. What happens?',
    weak: '"The queue guarantees ordering." Only within a partition, and only if you partitioned by the right key. Assuming global ordering is one of the most common wrong beliefs about queues.',
    strong:
      '"If they went to different partitions, they can absolutely arrive out of order, and the second one applied could overwrite the newer state with older data. Two answers. Structural: partition by the record\'s id, so all events for one record land on one partition and are ordered relative to each other — I do not need global ordering and would not pay for it, I need per-key ordering and that is cheap. Defensive: make the application tolerant anyway, by carrying a version or timestamp on each event and ignoring one that is older than what I have already applied. I would do both, because the partitioning can be right and a consumer restart or a retry can still deliver out of sequence. Where it really matters, pushing full current state rather than increments makes ordering almost irrelevant — a late message just re-applies a state that is already correct, or is discarded by version."',
    trap: 'The deep answer is that full-state messages make this whole class of problem disappear. Incremental messages require ordering guarantees; state messages do not.',
  },
  {
    id: 'consistency-cache-stale',
    category: 'attack-consistency',
    q: 'A user updates something but the cached version is served for another five minutes. Acceptable?',
    weak: '"We would set a shorter TTL." That trades hit rate for staleness across the board to fix one case, and it still leaves a window. It is a knob, not an answer.',
    strong:
      '"It depends entirely on what the data is, and I would answer per field rather than globally. For a like count or a view count, five minutes is fine and I would not spend anything to fix it. For something the user just changed themselves, it is not fine — they will think the save failed — so I delete the cache key on write and serve their own read from the source. For something with a safety or legal consequence, like a disabled link or a revoked permission, five minutes is unacceptable and I need explicit invalidation plus a much shorter TTL, and I would treat the TTL as a bound on exposure rather than a performance setting. The general pattern: TTL as a backstop, explicit deletion on write as the optimisation, and accept that a missed deletion means at most one TTL of staleness."',
    trap: 'The trap is answering with one number for the whole system. Different fields have wildly different staleness tolerances, and the security-relevant ones are where a generic TTL becomes an exposure window.',
  },

  /* ---------------- question the choice ---------------- */
  {
    id: 'choice-database',
    category: 'question-choice',
    q: 'Why this database and not Postgres?',
    weak: '"It scales better and is designed for high throughput." Vague and unfalsifiable. Postgres handles far more than most people assume, and an answer with no number in it sounds like a preference.',
    strong:
      '"The answer has to be a number or an access pattern. Something like: the write rate is around 80,000 a second sustained on one logical table, append-only, with no cross-row transactions. One Postgres primary will not commit that, so I would be sharding it myself — hand-building rebalancing and failover that a distributed store already has. The read pattern is a single-key lookup, so I am giving up joins I do not need. And then what it costs: no cross-partition transactions, so any invariant spanning partitions moves into application code, and analytics needs a separate copy of the data. If I cannot produce a sentence like that, then the correct answer is that Postgres is fine — and saying so is the stronger answer, because choosing the boring option deliberately is harder than reaching for the distributed one."',
    trap: 'The trap is that this question sounds like a challenge, so people defend. Often the right response is to agree — "you are right, at these numbers Postgres is the better choice" — which reads as judgement rather than weakness.',
  },
  {
    id: 'choice-queue',
    category: 'question-choice',
    q: 'Why a queue instead of just calling the service directly?',
    weak: '"Queues decouple services and are more scalable." True in the abstract and it does not explain why this particular call needs one. Queues also add duplicate delivery, ordering questions and debugging difficulty, and not mentioning those means you added one by reflex.',
    strong:
      '"Because the user does not need to wait for this work to finish, and because the downstream cannot absorb my spikes. Concretely: sending the receipt email takes 800 ms and can fail, and there is no reason to make the customer wait for it or to fail their order because a mail provider is down. The queue absorbs a 10x spike into a longer backlog instead of a broken service. What it costs: the customer gets \'received\' rather than \'done\', so the product has to be honest about that; every consumer must be idempotent because delivery is at-least-once; and a failure now happens in a worker minutes later, which is harder to debug. I would specifically not queue the stock check or the payment, because the user needs a real yes-or-no answer before they leave the page — a queue there adds latency and buys nothing."',
    trap: 'Knowing where NOT to put a queue is the signal. Anyone can add one; naming the synchronous path that must stay synchronous shows you understand what you are trading.',
  },
  {
    id: 'choice-one-machine',
    category: 'question-choice',
    q: 'Why not just one big machine?',
    weak: '"It would not scale." At what number? A modern server has enormous capacity, and dismissing it without arithmetic is exactly the reflex this question is designed to catch.',
    strong:
      '"Honestly, for a lot of systems one big machine is the right answer and I would say so. My estimate said 500 GB and 2,000 writes a second, which one machine handles comfortably — so size is not the reason. The reasons to distribute are: availability, because one machine means downtime during any restart or hardware failure, and I need a replica regardless; blast radius, because one machine means every customer shares one failure; and eventually write throughput, which I am nowhere near. So my actual design is one primary with a replica for failover, and I would revisit when writes approach 60% of what the primary can commit. Choosing not to distribute, deliberately, with a stated trigger for changing my mind, is the answer — distributing by reflex costs me every future feature."',
    trap: 'This question is a trap for people who distribute by default. The interviewer usually agrees with the simple answer and is checking whether you will defend complexity you do not need.',
  },
  {
    id: 'choice-microservices',
    category: 'question-choice',
    q: 'Why split this into services instead of one application?',
    weak: '"Microservices scale better and teams can work independently." A monolith scales horizontally perfectly well, and independent deployment is a team-structure argument, not an architecture one. This is a slogan.',
    strong:
      '"The honest reasons are organisational and operational, not performance. Splitting is worth it when parts have genuinely different scaling profiles — a transcoding fleet and an API tier have nothing in common — or different availability requirements, or when team ownership boundaries are causing real coordination cost. What it costs is substantial and I would name it: a function call becomes a network call that can fail; a transaction across two services becomes a saga; debugging needs distributed tracing; and you now have a deployment ordering problem. For the system as I have described it, I would start with one deployable and split out the transcoding workers, because that is where the scaling profile actually differs. Splitting for its own sake buys you distributed-systems problems in exchange for nothing."',
    trap: 'The trap is treating service boundaries as a performance decision. They are a coupling and ownership decision, and the performance argument almost never survives contact with the arithmetic.',
  },
  {
    id: 'choice-push-pull',
    category: 'question-choice',
    q: 'Why precompute this instead of computing it on read?',
    weak: '"Precomputing is faster." It is, at read time, and it costs you at write time and in storage and in freshness. Not naming what you traded means you have not made a decision.',
    strong:
      '"Because of the ratio and the slack. Reads outnumber writes here by a hundred to one, so paying once at write to save a hundred times at read is straightforwardly worth it. And the freshness budget is hours, so precomputing something that is a few minutes old costs nothing a user can perceive. What it costs: writes get more expensive and amplified, storage grows with the precomputed shape, and any change to the output format means a full rebuild. The place I would reverse this is where the write amplification becomes extreme — one account with millions of followers — so I compute those on read instead, and accept two code paths. The general rule I am applying: move work toward whichever side is rarer, and check the tail of the distribution before committing, because the average hides the case that breaks it."',
    trap: 'The tail is the trap. Precomputation is right on average and catastrophic at the extreme, so an answer that does not mention the outlier case is incomplete.',
  },
  {
    id: 'choice-sql-for-scale',
    category: 'question-choice',
    q: 'You picked a relational database for something with 50,000 writes a second. Defend that.',
    weak: '"Postgres is very fast these days." Not a defence. 50,000 writes a second on a single primary is genuinely beyond what one machine commits comfortably, and hand-waving it means you did not check.',
    strong:
      '"If those 50,000 writes are all on one logical table with no partitioning, I would not defend it — that is the wrong choice and I would change it. What I would defend is a version where the writes are partitioned across, say, sixteen shards by tenant id, giving about 3,000 writes a second each, which one primary handles well. Then I keep real transactions within a tenant, which is where all my invariants live, and I give up cross-tenant transactions, which I never needed. So the defence is not that relational scales to 50,000 on one box — it does not — it is that my access pattern shards cleanly and the guarantees I need are all within a shard. If the writes could not be partitioned that way, I would take a distributed store and redesign the invariants around what it can give me."',
    trap: 'The trap is defending the indefensible. Conceding the version that is wrong and defending the version that is right shows judgement; defending both shows you are arguing rather than thinking.',
  },
  {
    id: 'choice-build-buy',
    category: 'question-choice',
    q: 'Why build this rather than use a managed service?',
    weak: '"We would have more control and it would be cheaper at scale." Almost never true early, and control is usually a euphemism for work you have not costed.',
    strong:
      '"For most of this I would not build. A managed queue, a managed database and a CDN are all things where the operational burden of running them myself vastly exceeds the licence cost, and running them badly is worse than paying. The cases where building wins: when the managed option cannot meet a specific requirement I can name — a latency budget, a data residency rule, a scale beyond what they offer; when the cost genuinely crosses over, which happens at large scale for bandwidth and storage more than for compute; and when it is my actual product differentiator. For this system, the matching logic is the product and I would build that; the queue, the object storage and the CDN are commodity and I would buy. The cost of buying: vendor lock-in and a dependency whose outages are my outages, which I would mitigate by keeping the interface narrow enough to replace."',
    trap: 'The trap is treating this as an ideological question. It is a cost and risk calculation, and the strong answer buys most things and builds the one thing that is actually the product.',
  },
  {
    id: 'choice-simpler',
    category: 'question-choice',
    q: 'Could you build this with half the components? Which would you cut?',
    weak: '"Every component is necessary." Rarely true, and it signals that you added things by pattern rather than by requirement.',
    strong:
      '"Yes, and I would cut in this order. The queue on the write path goes first — at my write rate a synchronous call is simpler and gives the user a real answer. The separate search index goes next, because the built-in full-text search handles this data size and one system beats two. The in-process cache layer goes, keeping just the shared cache, because the extra hit rate is not worth servers disagreeing with each other. What I would not cut: the shared cache, because the database cannot take the read load, and the idempotency keys, because at-least-once delivery is not optional. If I were shipping this in a week, I would build the database, the cache and the stateless services, and add the rest when a measurement told me to. Most of what I drew is a response to scale I have estimated but not yet reached."',
    trap: 'This question rewards knowing which parts are load-bearing. Being able to strip your own design down and name the version you would actually ship first is a strong senior signal.',
  },

  /* ---------------- force the cost ---------------- */
  {
    id: 'cost-monthly',
    category: 'force-cost',
    q: 'What does this cost per month?',
    weak: '"I am not sure, it depends on the provider." Nobody wants exact prices. They want to know whether you understand which line item dominates — and that is answerable from your own estimates.',
    strong:
      '"I would not guess at prices, but I can tell you the shape, which is what matters. The dominant cost here is egress bandwidth by a wide margin — my estimate said 1,350 GB a second to viewers, and bandwidth is the most expensive thing you can buy at volume. Second is storage, because I keep raw data for two years and it grows every day whether anyone reads it or not. Third is compute, which is elastic and therefore the easiest to control. That ordering tells me where to spend engineering effort: a percentage point of CDN hit rate is worth more than any amount of compute optimisation, so cache hit rate is the number I would put on a dashboard and defend. Storage cost I would attack with lifecycle policies moving cold data to cheaper tiers and with tiered granularity. Compute I would run on interruptible capacity because the work has hours of slack."',
    trap: 'The trap is thinking this is a pricing question. It is a question about whether your engineering priorities match where the money actually goes, and most people optimise compute while bandwidth quietly dominates.',
  },
  {
    id: 'cost-cheaper-slower',
    category: 'force-cost',
    q: 'There is an option that is 40% cheaper but 10% slower. Do you take it?',
    weak: '"I would take the faster one because user experience matters." Reflexive. 10% slower may be entirely invisible, and 40% is a large amount of money that could fund things users would actually notice.',
    strong:
      '"It depends where in the system, and I would answer with the slack budget. On the playback start path, where the budget is two seconds and users leave past it, 10% slower is meaningful and I would not take it. On the transcoding pipeline, where I have hours of slack, 10% slower is invisible and I would take the 40% every time — that is exactly what the slack is for. So my answer is: take it everywhere the user cannot perceive the difference, refuse it on the paths where a human is waiting. Concretely that means interruptible capacity for batch work, cheaper storage tiers for cold data, and premium capacity only for the request path. And I would want to know whether the 10% is on the median or the tail, because a 10% worse p99 can be much more damaging than a 10% worse median."',
    trap: 'Median versus tail is the detail that separates a real answer. A 10% slower median is often nothing; a 10% wider tail can be a visible product regression.',
  },
  {
    id: 'cost-storage-growth',
    category: 'force-cost',
    q: 'Your storage bill doubles every six months. What do you do?',
    weak: '"We would delete old data." Which data, and who agreed you could? Retention is usually a product and legal decision, not an engineering one.',
    strong:
      '"First, find out what is actually growing, because it is rarely uniform — usually one dataset, often logs or raw events or derived copies nobody remembers creating. Then, in order of cheapness: lifecycle policies moving cold data to colder tiers, which is free to implement and often halves the bill because most data is never read after a week; compression and columnar formats, which for event data is a 5-10x reduction; tiered granularity, keeping recent data fine-grained and rolling older data up; and only then deletion, which needs a retention policy agreed with the product and legal side rather than decided by me. I would also check for duplication — a derived index, a backup of a backup, an old migration copy — because a surprising share of storage growth is copies. The one thing I would not do is delete raw data that lets me reprocess when a job turns out to be wrong, because that is the safety net that makes everything else correctable."',
    trap: 'The trap is jumping to deletion. Tiering and compression usually get most of the saving with no product decision required, and they are reversible.',
  },
  {
    id: 'cost-over-provisioned',
    category: 'force-cost',
    q: 'Your fleet runs at 15% CPU. Is that waste?',
    weak: '"Yes, we should run fewer servers." Sometimes — and sometimes 15% is correct, because CPU is not what you are provisioning for.',
    strong:
      '"Not necessarily, and I would want to know what the constraint actually is before cutting. If these are connection servers holding a million sockets, the constraint is memory and file descriptors, and CPU being low is expected. If they are request servers, 15% is likely over-provisioned — but I would check what happens at peak, not at average, and check what happens when I lose half the fleet, because capacity has to survive a partial failure without saturating. Also, if traffic is spiky and scaling takes minutes, headroom is the price of surviving the spike. So: if peak utilisation is also 15% and the fleet can lose half without trouble, yes, that is waste and I would cut it or move to smaller instances. If peak is 60% and losing half puts me at 120%, then 15% average is correct and cutting it causes an outage during the next incident."',
    trap: 'The trap is optimising the average. Capacity is set by peak plus failure tolerance, and a fleet sized for the average is a fleet that fails the first time something goes wrong.',
  },
  {
    id: 'cost-per-user',
    category: 'force-cost',
    q: 'What does one user cost you per month, and does that work?',
    weak: '"I have not calculated that." It is derivable from your own estimates, and not having connected the design to unit economics is a gap the Cost Auditor will keep pressing.',
    strong:
      '"I can derive it from my estimates. Each user generates a known amount of storage and bandwidth — for this design, roughly the bytes per action times actions per day times retention. The number that matters is whether the marginal cost per user is well below the revenue per user, and critically whether it is flat or growing. Flat is fine. Growing is the dangerous case, and it happens when storage is retained forever while revenue is monthly — every user gets more expensive every month they stay, which eventually inverts. That is a strong argument for retention limits and tiering, framed as a business requirement rather than a technical preference. The other thing I would check is whether the heaviest 1% of users cost far more than the median, because that usually decides whether you need usage limits in the product."',
    trap: 'The growing-cost-per-retained-user problem is the deep answer. Unlimited retention with recurring revenue is a business model that gets worse over time, and it is an architecture decision disguised as a product one.',
  },
  {
    id: 'cost-cache-worth',
    category: 'force-cost',
    q: 'Is that cache actually paying for itself?',
    weak: '"Caches are always worth it." No — a cache with a low hit rate costs money and adds a failure mode while saving nothing, and this is more common than people admit.',
    strong:
      '"It depends on the hit rate, and that is a number I would measure rather than assume. The maths: the cache pays for itself when the cost of the database capacity it saves exceeds the cost of the cache plus the complexity. At a 99% hit rate that is overwhelmingly true — I am avoiding a hundred times the database load. At a 20% hit rate it is probably not, because I am paying for memory, adding a network hop to every read, and adding an invalidation problem, to avoid a fifth of the reads. So I would look at hit rate per key pattern, not overall, because an overall number of 80% can hide one pattern at 99% and another at 5% — and the 5% one should be removed from the cache entirely, since caching it costs a miss check on every request for no benefit. Low hit rates usually mean the key space is too large or the TTL is too short."',
    trap: 'Segmenting the hit rate is the insight. An aggregate hit rate hides both the pattern worth caching and the pattern that is pure cost, and removing the second is often a bigger win than tuning the first.',
  },
  {
    id: 'cost-multi-region',
    category: 'force-cost',
    q: 'Multi-region doubles your bill. Justify it.',
    weak: '"It gives us high availability." At what cost per hour of downtime avoided? Without that comparison this is an assertion, not a justification.',
    strong:
      '"I would justify it with the cost of the downtime it prevents, and if I cannot, I would not do it. For a system where an hour of outage costs a large amount of revenue or breaks a contractual commitment, doubling infrastructure spend is easily worth it. For an internal tool, it obviously is not. There is also a second justification that is often the real one: latency. If a large share of users are on another continent, they are paying 150 ms per round trip, and a regional presence improves their experience measurably — that is a product benefit, not just insurance. What I would push back on is doing it for availability alone when the actual outages have been caused by bad deploys and bugs rather than regional failures, because a second region does not protect you from your own code — it duplicates it. Cheaper alternatives I would consider first: multi-zone within one region, which covers most real failures at a fraction of the cost."',
    trap: 'The observation that most outages are self-inflicted is the strong point. Multi-region protects against infrastructure failure, which is rare; it does nothing about the deploy that broke everything, which is common.',
  },
  {
    id: 'cost-engineer-time',
    category: 'force-cost',
    q: 'This design takes three months to build. A simpler one takes three weeks. Which do you ship?',
    weak: '"The full design, because we will need it eventually." You might, and three months of not shipping has a cost that never appears on an infrastructure bill.',
    strong:
      '"The three-week version, almost always, provided I have chosen the one decision that is expensive to reverse. Most of what I designed is a response to scale I have estimated but not reached, and I can add it when a measurement tells me to — caches, queues, extra services can all be introduced later without a rewrite. The exception is the data model and the partition key, because those are the things a migration makes painful, so I would spend the extra time getting those right and take the simple version of everything else. Concretely: relational database, straightforward schema keyed the way it will eventually shard, stateless services, one cache. Ship that, measure, and add the rest against real numbers rather than my estimates. The risk I am accepting is that if growth is much faster than expected I will be doing that work under pressure — which is why the key choice matters now."',
    trap: 'The trap is treating this as a technical question. It is about knowing which decisions are cheap to defer and which are one-way doors, and naming the difference is the whole answer.',
  },

  /* ---------------- operations ---------------- */
  {
    id: 'ops-deploy',
    category: 'operations',
    q: 'How do you deploy a new version with no downtime?',
    weak: '"Rolling deploy behind the load balancer." Correct and incomplete — the hard part is database changes and in-flight requests, and stopping there suggests you have only done it on a stateless service.',
    strong:
      '"Rolling deploy, taking instances out of the pool, draining in-flight requests — forgetting connection draining is how you drop live traffic during a supposedly zero-downtime deploy — then updating, waiting for health checks, and putting them back, keeping enough capacity in the pool throughout. The part that actually makes it work is that the new version must tolerate the old version running beside it, because for several minutes both are live. That means database migrations get split: add the new column, deploy code that writes both and reads the old, backfill, deploy code that reads the new, then remove the old column — three or four releases instead of one. Cost: every schema change is now a multi-deploy sequence, which is slower and is the price of not taking downtime. And I would rather roll forward to a known-good build than roll back, because undoing a migration is much harder than undoing code."',
    trap: 'Backwards compatibility during the deploy window is the real content. Two versions run simultaneously, and any change that assumes only one version exists breaks in exactly that window.',
  },
  {
    id: 'ops-alert-first',
    category: 'operations',
    q: 'Which alert fires first when this system starts failing?',
    weak: '"We would alert on CPU and memory." Those are symptoms of the machine, not of the user experience, and they fire either far too late or constantly for no reason.',
    strong:
      '"I would alert on user-visible symptoms first and causes second. The first alert should be error rate or latency at p99 on the main user path, because that is what actually maps to someone being unhappy. Then a small number of leading indicators that fire before users notice: queue age — not depth — because age maps directly to how late the work is; replication lag; cache hit rate dropping, which precedes database saturation; and connection pool wait time, which is the earliest sign of a slow dependency. For this system specifically, the earliest signal is usually cache hit rate, because everything downstream is sized assuming the cache absorbs most reads. I would deliberately not page on CPU — it is a dashboard metric, not an alert — because a machine at 90% CPU serving requests fine is not an incident, and a machine at 20% CPU timing out is."',
    trap: 'The trap is alerting on causes rather than symptoms. You cannot enumerate every cause, and you will page people for conditions that are not hurting anyone while missing the ones that are.',
  },
  {
    id: 'ops-debug-slow',
    category: 'operations',
    q: 'One user reports a slow request. How do you debug it?',
    weak: '"I would check the logs." Which logs, for what? At scale, "check the logs" without a way to find that specific request is a way of saying you have not thought about observability.',
    strong:
      '"Work down rather than guessing. First: is it slow for everyone or just them? A dashboard of that endpoint\'s p50 and p99 answers it in seconds — if p99 is bad and p50 is fine, it is data-dependent, meaning that user has far more rows than the median. Second: get a trace of their actual request, which requires request ids propagated through every service, and see whether the time went to one slow call or two hundred fast ones. Two hundred fast ones is an N+1, which is invisible in development and common in production. Third: if it is one slow query, run EXPLAIN with their parameters, not typical ones, because the plan can differ once their row count crosses a threshold. The common outcome is that they are a heavy account and the query has no index for their filter combination. What makes this possible at all is having decided beforehand to propagate request ids and to log with enough structure to find one user\'s request among billions."',
    trap: 'The real answer is what you built before the incident. Without request tracing and structured logs, debugging one request among billions is not possible, and the interviewer is checking whether you know that is a design decision.',
  },
  {
    id: 'ops-rollback',
    category: 'operations',
    q: 'You deployed something bad. How fast can you undo it, and what cannot be undone?',
    weak: '"We would roll back to the previous version." Some things cannot be rolled back, and not knowing which ones is how a five-minute incident becomes a data corruption incident.',
    strong:
      '"Code rolls back in the time it takes to redeploy, so a few minutes if the pipeline is fast — and having a fast path to deploy is itself the mitigation. What does not roll back: a schema migration that dropped a column, data written in a new format that the old code cannot read, messages already published to a queue and consumed, emails sent, and payments captured. So the practical answer is that I design so the risky parts are reversible: migrations are expand-then-contract so the destructive step happens days later once the new version is proven; new data formats are written alongside old ones during the transition; and anything with an external side effect gets a feature flag so I can turn the behaviour off without deploying at all. Feature flags are the fastest undo available — seconds rather than minutes — and for anything genuinely risky I would rather ship it behind a flag than rely on rollback."',
    trap: 'Knowing what is irreversible is the substance. Rollback is easy for code and impossible for side effects, and designing so the irreversible steps are separated and delayed is the actual skill.',
  },
  {
    id: 'ops-oncall',
    category: 'operations',
    q: 'It is 3am and this system is down. What does the on-call engineer do first?',
    weak: '"They would investigate the root cause." At 3am the goal is restoring service, not understanding it. Root cause is a daytime activity.',
    strong:
      '"First, stop the bleeding — restore service, then understand it. The first question is \'what changed?\', because the overwhelming majority of incidents are caused by a deploy, a config change, or a traffic change, so the first move is to look at the deploy timeline and roll back or flip the flag if anything correlates. Second, check whether a dependency is down, because that determines whether this is mine to fix at all. Third, if it is a capacity problem, shed load — turn off optional features, tighten rate limits, serve stale content — because a degraded service beats a dead one. What makes this possible is having prepared it: a runbook with those steps, a dashboard that shows deploys overlaid on error rate, and the ability to disable features without deploying. What I would not do at 3am is investigate a subtle root cause while the system is down, or make a clever fix under pressure — restore first, understand in the morning."',
    trap: '"What changed?" is the answer experienced operators give first, because it is right most of the time. Starting from first-principles diagnosis is what people do when they have not been on call.',
  },
  {
    id: 'ops-capacity',
    category: 'operations',
    q: 'How do you know when you are about to run out of capacity?',
    weak: '"We would monitor utilisation." Of what resource, and against what threshold? Utilisation of the wrong resource is exactly how people get surprised.',
    strong:
      '"I would identify the actual constraining resource per component, because it is different for each and rarely CPU. For the connection servers it is memory and file descriptors. For the database it is write throughput and connection count. For the queue it is consumer throughput against arrival rate. Then track headroom against those specific limits, and trend them, because the useful alert is not \'we are at 70%\' but \'at the current growth rate we hit the ceiling in three weeks\'. That gives time to act rather than a surprise. I would also load test to find the real ceiling rather than assuming a number, because the actual failure point is usually lower than the theoretical one and often in an unexpected place — a connection pool, a lock, a single-threaded component. And I would test the degraded case: what capacity do I have with a third of the fleet gone, because that is the number that matters during an incident."',
    trap: 'The trap is monitoring CPU because it is the default dashboard. The constraining resource is almost never CPU — it is connections, memory, locks, or a single-threaded bottleneck nobody profiled.',
  },
  {
    id: 'ops-migration',
    category: 'operations',
    q: 'You need to move this data to a new store with no downtime. How?',
    weak: '"We would migrate over a weekend." That is downtime, and at any real data volume a weekend is not long enough anyway.',
    strong:
      '"Dual-write and backfill, in phases. Phase one: start writing to both old and new stores, with the old one still authoritative — this is the risky part, because a write that succeeds in one and fails in the other creates drift, so I make the new-store write non-blocking and reconcilable rather than letting it fail user requests. Phase two: backfill history into the new store, in batches, throttled so it does not affect production. Phase three: verify, by comparing reads from both for a sample of traffic and measuring the disagreement rate — this is the step people skip and it is the one that tells you whether the migration is actually correct. Phase four: switch reads over gradually, a percentage at a time, with a fast way back. Phase five: stop writing to the old store, and only then, after a safe period, delete it. Cost: weeks of running both, double writes, and a comparison harness — which is why the shard key and data model choices made on day one matter so much."',
    trap: 'The verification phase is what separates people who have done a migration from people who have read about one. Dual-write and cut over is the easy part; proving the two stores agree before you trust the new one is the work.',
  },
  {
    id: 'ops-noisy-neighbour',
    category: 'operations',
    q: 'One customer\'s traffic is degrading everyone else. What do you do?',
    weak: '"We would rate limit them." Eventually, yes — but first you need to be able to see that it is them, and then you need a way to act without a deploy.',
    strong:
      '"First I need to be able to attribute load per customer, which means metrics tagged by tenant — a decision made in advance, not during the incident. Then immediate mitigation: tighten their rate limit, which must be per-key configuration so it is a config change rather than a deploy. Then the structural fix, which is isolation: separate connection pools or queues per tenant class so one customer cannot consume shared resources, which is the bulkhead pattern applied to tenancy. For a genuinely large customer, dedicated capacity is often the right answer commercially as well as technically. What I would also check is whether they are abusing the system or using it as intended in a way I did not anticipate — because if it is the latter, rate limiting them is treating a product problem as an abuse problem, and the real fix might be a bulk API that does in one call what they are doing in ten thousand."',
    trap: 'Per-tenant attribution is the prerequisite and it has to exist before the incident. Without tagged metrics you know something is wrong and cannot tell who is causing it.',
  },

  /* ---------------- change the scope ---------------- */
  {
    id: 'scope-multiregion',
    category: 'change-scope',
    q: 'Now make it multi-region.',
    weak: '"We would replicate the database to another region." That covers reads. The question is what happens to writes, and that is where the design actually changes.',
    strong:
      '"Reads are the easy half: replicas in each region, users read locally, and they may be slightly stale — I would say how stale and which reads cannot tolerate it. Writes are the real question and there are three options. Single write region: simplest, no conflicts, and users far away pay 150 ms per write, which is fine if writes are rare and unacceptable if they are not. Write region per data partition — each user\'s data has a home region near them — which gives local writes without conflicts, and needs a routing layer plus a plan for users who move. Multi-leader with conflict resolution: local writes everywhere, and now I own a conflict problem, which is only acceptable where merges are safe. I would pick the second for user-owned data and single-region for anything globally contested like inventory. What changes elsewhere: cross-region replication cost, a failover story per region, and data residency rules that may force certain data to stay in certain places — which is a constraint I would ask about rather than discover later."',
    trap: 'The trap is answering only about replication. Multi-region is a write-path decision; the read replication is the part that was already easy.',
  },
  {
    id: 'scope-scheduled',
    category: 'change-scope',
    q: 'Now it must support scheduled actions — do this thing at 8am next Tuesday.',
    weak: '"We would use a cron job." Cron per user does not scale, does not survive a machine dying, and has no answer for what happens when a scheduled time is missed.',
    strong:
      '"I would store scheduled items in a table indexed by due time, and have workers poll for items due now — that gives durability, survives restarts, and lets me see and cancel what is pending, none of which cron gives me. The interesting parts are the failure branches. If the system is down at 8am, the item is late rather than lost, and I need a policy: run it late, or skip it, and that differs per action — a reminder is worth sending late, a market order is not. Duplicate execution must be harmless, so each scheduled item carries an id and execution is idempotent. Time zones and daylight saving are a genuine source of bugs: \'8am next Tuesday\' means 8am in someone\'s local zone, which is a different UTC instant depending on the date, so I store the intent rather than a resolved timestamp. And a spike at popular times — everyone schedules 9am — means the due-time index gets hot, so I would jitter execution by a small window where the exact second does not matter."',
    trap: 'The 9am spike is the scale trap: scheduled work clusters heavily on round times, so a naive design has an idle system with enormous bursts on the hour.',
  },
  {
    id: 'scope-privacy',
    category: 'change-scope',
    q: 'Now it must be privacy compliant — users can demand deletion of everything about them.',
    weak: '"We would delete their row from the users table." Their data is in caches, replicas, backups, logs, analytics, search indexes and immutable event archives. One row is the easy 1%.',
    strong:
      '"The hard part is that data has been copied everywhere by design. I would inventory it: primary store, replicas, caches, search indexes, the raw event archive, backups, logs, and any third party I forwarded it to. Deleting from the primary is trivial; the archive is the hard one, because immutable columnar files cannot have a row removed cheaply. Two practical approaches: crypto-shredding, where each user\'s identifiers are encrypted with a per-user key and deleting the key makes the data unreadable — which is the technique that makes this tractable at scale; or periodic compaction that rewrites partitions with deleted users removed, which is expensive but complete. For backups, deletion usually cannot be immediate, so the policy is that backups expire within a stated window and deletion is applied on restore. What I would change on day one knowing this: keep identifying data in as few places as possible, reference it by id everywhere else, and never copy raw identifiers into derived stores — that single discipline turns this from an archaeology project into a manageable one."',
    trap: 'Backups and immutable archives are where this gets genuinely hard, and the crypto-shredding answer is the one that shows you have dealt with it rather than read about it.',
  },
  {
    id: 'scope-offline',
    category: 'change-scope',
    q: 'Now it must work offline and sync when the connection returns.',
    weak: '"We would cache data locally and sync later." That is the easy direction. The hard direction is writes made offline that conflict with writes made elsewhere, and sync order.',
    strong:
      '"Reads offline are straightforward: cache locally with a clear indication of how stale it is. Writes are the design. Every offline change becomes a queued operation with a client-generated id, applied optimistically to local state so the app feels responsive, and replayed on reconnection. Then the two hard problems. Conflicts: the same record was edited on the device and on the server, so I need a resolution rule — last-write-wins is simple and silently discards someone\'s work, per-field merging is better where fields are independent, and for genuinely collaborative data a merge-friendly data type is the right tool. Ordering: operations must replay in the order they were made, and one failing must not silently skip the rest. Also, an operation queued offline may no longer be valid — the item was deleted, the permission revoked — so the server must be able to reject it and the client must be able to show that rejection to the user rather than losing it silently. What I would flag: this is a much bigger change than it sounds, because it turns every write path into a distributed multi-leader system."',
    trap: 'The trap is treating this as a caching feature. Offline write support makes every client a write leader, which means you have signed up for conflict resolution across the entire product.',
  },
  {
    id: 'scope-audit',
    category: 'change-scope',
    q: 'Now every change must be auditable — who changed what, when, and what it was before.',
    weak: '"We would add a log line whenever something changes." Log lines get lost, get filtered, are not queryable and can be written when the transaction rolls back. An audit trail has to be as reliable as the data itself.',
    strong:
      '"The audit record has to be written in the same transaction as the change, or it is not an audit trail — it is a hopeful log. So an audit table written transactionally alongside, holding actor, timestamp, entity, and before and after values. If I want it without touching every write path, change data capture off the database log gives me every change including ones made by a script someone ran manually, which is exactly the case an audit is for. Retention and immutability matter: the audit store should be append-only with restricted permissions, because an audit trail an attacker can edit is worthless. The costs are real and I would name them: every write now writes twice, storage grows with change volume rather than data volume, and before-and-after values can contain sensitive data, so the audit store inherits the same privacy obligations as the primary — including deletion requests, which is an awkward interaction with immutability that needs a deliberate policy."',
    trap: 'The tension between audit immutability and privacy deletion is the sophisticated point, and it is a real conflict that has to be resolved by policy rather than engineering.',
  },
  {
    id: 'scope-tenancy',
    category: 'change-scope',
    q: 'Now it is multi-tenant, and some tenants demand their data be physically separate.',
    weak: '"We would add a tenant_id column." That is shared tenancy, which is exactly what those customers said they would not accept.',
    strong:
      '"Three models and they can coexist. Shared everything with a tenant id on every row: cheapest and most efficient, and the risk is a missing filter in one query leaking data across tenants — which I would defend against with row-level security in the database rather than relying on every query being written correctly, because that is a defence that holds even when someone makes a mistake. Shared infrastructure, separate schemas or databases per tenant: better isolation, and now migrations run N times and connection management gets harder. Fully separate deployment per tenant: what large regulated customers actually mean, and it means N of everything to operate, deploy and monitor. I would offer the first as standard and the third as a premium tier, priced accordingly, because it is genuinely much more expensive to run. What changes throughout the design: the tenant id becomes the natural shard key, which is convenient, and noisy-neighbour isolation becomes a requirement rather than a nicety."',
    trap: 'Row-level security in the database rather than in application queries is the strong detail: it is a defence that survives a developer forgetting a WHERE clause, which will happen.',
  },
  {
    id: 'scope-realtime',
    category: 'change-scope',
    q: 'Now the dashboard must update in real time instead of every five minutes.',
    weak: '"We would switch to a streaming pipeline." Rebuilding the whole pipeline to make one number fresher is usually a large cost for a small benefit, and it throws away the batch correctness you had.',
    strong:
      '"I would first ask which numbers actually need it, because the answer is usually one or two out of twenty — a live visitor count, not the full attribution report. So I would add a small fast path for those specific metrics rather than converting the pipeline: an approximate streaming counter feeding just those tiles, sitting alongside the existing batch aggregates which remain authoritative and correct. That keeps the batch path\'s ability to handle late events and to be reprocessed when a job is wrong, which real-time processing gives up. Costs I would name: two computations of similar things that can disagree, so the UI must be clear about which numbers are live-and-approximate and which are settled-and-exact; and the fast path is approximate, so someone will notice the live number does not match the settled one later, which is a product communication problem as much as a technical one. If instead every number had to be real-time, I would push back and ask what decision is being made on a number that could not wait five minutes."',
    trap: 'Pushing back is the right move here and most candidates will not. "What decision gets made on this number that cannot wait five minutes?" is a legitimate question, and often the honest answer is none.',
  },
  {
    id: 'scope-third-party',
    category: 'change-scope',
    q: 'Now a partner needs API access to this data. What changes?',
    weak: '"We would expose an API endpoint." Now you have an external contract you cannot change, an authentication system, and traffic patterns nothing was designed for.',
    strong:
      '"More changes than it sounds. Authentication and authorisation for a party that is not a user, which means API keys or OAuth and a permission model expressing what a partner may see. Rate limiting per partner, because they will write a script that pages through everything at 3am. Versioning, because the moment an external party depends on the shape of my response I cannot change it freely — so I would version from day one rather than retrofit it. Pagination with cursors rather than offsets, because a partner pulling a large dataset with offsets creates exactly the deep-pagination problem that gets expensive. And a read model separate from my internal one, so my schema stays free to evolve behind a stable contract. The traffic pattern is also completely different from user traffic: bulk, bursty, and often at off-peak hours, which is good for capacity and bad for any cache tuned around user access patterns. If they need large volumes regularly, a bulk export to object storage beats an API — cheaper for both sides and far kinder to my database."',
    trap: 'The version-and-decouple point is the one that costs most to get wrong. An external contract tied directly to your internal schema freezes your ability to change anything.',
  },
]

export function followUpsByCategory(c: FollowUpCategory): FollowUp[] {
  return FOLLOW_UPS.filter((f) => f.category === c)
}

export function getFollowUp(id: string): FollowUp | undefined {
  return FOLLOW_UPS.find((f) => f.id === id)
}
