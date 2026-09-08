import type { Concept } from '@/lib/types'

/**
 * Distributed-systems topics that the original Tier 2 set assumed you already
 * knew: how a single database keeps concurrent writers honest, how work fans
 * out to many readers, why clocks lie, and what changes across regions.
 */
export const TIER2_EXTRA: Concept[] = [
  {
    slug: 'transactions-and-locking',
    title: 'Transactions, isolation and locking',
    navTitle: 'Transactions and locking',
    tier: 2,
    oneLine: 'What actually stops two people buying the last seat, inside one database.',
    problem: [
      'Two requests read "1 seat left" at the same moment. Both decide it is fine. Both write. You have sold one seat twice, and no amount of scaling fixed it, because the bug is not about speed.',
      'This is the oldest problem in databases, and it has a precise set of answers. Almost every "contested resource" interview question — seats, stock, balances, unique names — is really this question.',
    ],
    cost: 'Every level of protection costs concurrency. Stronger isolation means more waiting, more lock contention and more deadlocks. Pessimistic locking makes writers queue. Optimistic locking makes writers retry, which is cheap when conflicts are rare and terrible when they are common. And a transaction held open across a network call ties up a connection while you wait on something you do not control.',
    useWhen: [
      'Anything where two people can want the same thing: seats, stock, balances, usernames.',
      'Any change that spans several rows and must land together, or not at all.',
      'Any read-check-then-write sequence. That gap is the bug.',
    ],
    avoidWhen: [
      'Independent writes that cannot conflict. Wrapping them in a strict transaction just adds waiting.',
      'Long-running work. Never hold a transaction open while calling an external API or waiting on a human.',
      'Counting things nobody competes for, like views. That is a counter problem, not a transaction problem.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The same "last seat" problem, solved two ways. Pick by how often people actually collide.',
        a: {
          title: 'Pessimistic — take the lock first',
          points: [
            'SELECT ... FOR UPDATE. The row is locked until you commit.',
            'The second request waits, then sees the true value. It cannot go wrong.',
            'Writers queue, so throughput on that row is one at a time.',
            'Deadlocks are possible if two transactions take locks in different orders.',
            'Right when conflicts are common: a flash sale on one item.',
          ],
        },
        b: {
          title: 'Optimistic — check on the way out',
          points: [
            'Read the row and its version. Write with WHERE version = the one you read.',
            'Zero rows updated means someone beat you, so you re-read and retry.',
            'No locks held while you think, so readers and writers do not block.',
            'A retry storm if conflicts are frequent — you do the work repeatedly.',
            'Right when conflicts are rare: editing your own profile, most CRUD.',
          ],
        },
        verdict:
          'Both are correct. They differ in where you pay. Say which one you picked and why, in terms of how often you expect two people to touch the same row — that sentence is the whole answer to a "how do you stop double booking" question.',
      },
    },
    body: [
      'Start with the thing people say and rarely explain: **ACID**. Atomic means all of the changes or none. Consistent means the database\'s own rules — constraints, foreign keys — are never broken. Isolated means concurrent transactions do not see each other\'s half-finished work. Durable means once it is committed, a crash cannot lose it. The one worth understanding properly is isolation, because it is the one you get to choose.',
      '**Isolation levels**, and the specific bug each one removes. *Read uncommitted* lets you see another transaction\'s uncommitted changes, which nobody wants. *Read committed* — the common default — means you only see committed data, but two reads inside your transaction can return different values, because someone committed in between. *Repeatable read* fixes that: rows you have read stay the same for the length of your transaction. *Serializable* is the strongest: the result is guaranteed to be the same as if the transactions had run one after another, in some order. It is also the slowest, and under load it aborts transactions that would have conflicted, so your code must be ready to retry.',
      'The trap here is assuming your database is stricter than it is. Postgres and MySQL default to read committed and repeatable read respectively, not serializable. So the classic read-then-write race is fully available to you by default, and the database will not save you. You have to ask for the protection.',
      '**How to actually make the seat safe**, in order of preference. Best: let the database decide in one statement, with no read-then-write at all — `UPDATE seats SET taken = true WHERE id = ? AND taken = false`, then check how many rows changed. One row means you got it. Zero means someone else did. There is no gap for a race to live in. Next best: a unique constraint, so the second insert simply fails — that is how you stop duplicate usernames, and it works no matter how many application servers you run. After that: `SELECT ... FOR UPDATE` to lock the row, when you really need to read and think before writing. Worst, and the one to name as wrong: read the value in application code, decide, then write.',
      '**MVCC** is why readers usually do not block writers. Instead of overwriting a row, the database keeps multiple versions of it, and each transaction sees the version that was current when it started. That is what makes a long report query possible without freezing everyone out. The costs are real and worth knowing: old versions have to be cleaned up later, and a very long-running transaction stops that cleanup, which is how a reporting query quietly bloats a production database.',
      '**Deadlocks** happen when two transactions hold what the other wants. The database notices and kills one, and your code sees an error it must retry. The prevention is boring and effective: always take locks in the same order — for example, always update the lower account id first when transferring money — and keep transactions short.',
      'One rule to carry everywhere: **a transaction is not a place to wait.** Do not call another service, charge a card, or send an email inside one. You are holding a database connection and a set of locks while depending on something you do not control, and that is how one slow third party takes down a database.',
    ],
    followUp: {
      q: '"Two people click Buy on the last ticket at the same millisecond. Walk me through what your database does."',
      answer:
        'It depends entirely on how I wrote it, so let me give the version I would build. The reservation is a single conditional statement: update the seat row setting it to held with this booking id, where the seat id matches and the current state is free. The database serialises that row internally, so exactly one of the two statements reports one row changed and the other reports zero. The one that changed a row proceeds to payment. The other gets an immediate "just sold" with alternatives. There is no window between checking and writing, because there was no separate check. The wrong version, which I want to name explicitly, is selecting the seat, seeing it free in application code, and then updating. Both requests can pass that check before either writes, and both proceed. That is not fixed by more servers or a faster database — it is fixed by moving the decision into the write. I would also add that the hold is not the end: it needs an expiry, so an abandoned checkout releases the seat, and the payment step needs an idempotency key so a retried payment does not charge twice for one hold. Cost: that seat row is a serialisation point, so a single very popular event has a throughput ceiling on it, which I would accept, because there are only so many seats anyway.',
    },
    selfCheck: {
      q: 'Your code does SELECT balance, checks it is enough, then UPDATE balance. What is the bug, and give two different fixes.',
      answer:
        'The bug is the gap between the read and the write. Two requests can both read a balance of 100, both decide a withdrawal of 80 is fine, and both write 20, so 160 came out of an account holding 100. The check was true when it was made and false by the time it was used. Fix one, the best: make the write do the checking — update the balance to balance minus 80 where the id matches and balance is at least 80, then look at how many rows changed. Zero rows means insufficient funds, and there is no gap because the database evaluates the condition and the change together. Fix two: lock the row first with SELECT ... FOR UPDATE, so the second request waits until the first commits and then reads the true value. That also works and it costs more concurrency, since writers now queue on that row. A third option is optimistic: read the balance along with a version number and write where the version still matches, retrying if it does not — good when collisions are rare, bad on a hot account.',
    },
    traps: [
      'Assuming the default isolation level protects you. It usually does not.',
      'Read, decide in application code, then write. That gap is the whole bug.',
      'Holding a transaction open across a network call to another service.',
      'Using serializable everywhere and being surprised by aborted transactions under load.',
    ],
    sayThis:
      '"The reservation is one conditional update — set the seat to held where it is still free — so there is no gap between checking and writing, and the loser gets zero rows changed. Holds expire after ten minutes. Cost: that row is a serialisation point, so a single hot event has a write ceiling on it, which I accept because the inventory is finite anyway."',
    related: ['consistency-models', 'idempotency', 'distributed-transactions', 'sql-vs-nosql'],
  },

  {
    slug: 'fan-out',
    title: 'Fan-out — push vs pull',
    tier: 2,
    oneLine: 'Do the work when one person writes, or when a million people read. This one choice designs the system.',
    problem: [
      'One person posts. A million followers should see it. Somewhere, a million pieces of work have to happen — and you get to choose whether they happen at write time or at read time.',
      'This is the single most-asked trade in feed, timeline, chat and notification design, and the answer "it depends" is only worth points if you can say what it depends on.',
    ],
    cost: 'Push costs write amplification: one action becomes a million writes, storage for a million copies, and a backlog that delays everybody when one big account posts. Pull costs read amplification: every timeline load becomes a query across everyone you follow, merged and sorted, which is expensive and repeated constantly. The hybrid costs you two code paths for one feature, forever, plus a threshold nobody wants to own.',
    useWhen: [
      'Push (fan-out on write): most users have few followers, reads massively outnumber writes, and the read must be instant.',
      'Pull (fan-out on read): writes are frequent, readers are few or infrequent, or the follower counts are enormous.',
      'Hybrid: a normal user base plus a handful of celebrity accounts. Which is every real social product.',
    ],
    avoidWhen: [
      'Pure push when a single account can have tens of millions of followers, unless you have a special path for them.',
      'Pure pull when the timeline is the main screen of the product and people open it constantly.',
      'Either one without saying what happens to the biggest account on the platform.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The same post reaching the same followers, paid for at two different moments.',
        a: {
          title: 'Push — fan-out on write',
          points: [
            'On post, write one copy into each follower\'s inbox list.',
            'Reading a timeline is one sequential read of a precomputed list. Very fast.',
            'One post by a big account is millions of writes, which floods the queue.',
            'Storage grows with followers, not with posts. You store the same post many times.',
            'Deleting or editing a post means finding every copy.',
          ],
        },
        b: {
          title: 'Pull — fan-out on read',
          points: [
            'On post, write once. Done.',
            'Reading means fetching recent posts from everyone you follow, then merging and sorting.',
            'Cheap writes, expensive reads — and reads happen far more often.',
            'No duplicated storage, and edits and deletes are trivial.',
            'A user following 5,000 accounts makes one very expensive query.',
          ],
        },
        verdict:
          'Push by default, because timelines are read far more than they are written. Then carve out the accounts where push breaks — above some follower count, do not fan out — and merge those in at read time. Saying "push for normal accounts, pull for the big ones, merged at read" is the answer the question is actually looking for.',
      },
    },
    body: [
      'The maths is what decides it, so do the maths out loud. If the average user has 200 followers and posts twice a day, push costs 400 writes per user per day, and a timeline load costs one read. If reads outnumber writes by fifty to one — which they do, because people scroll far more than they post — push is obviously right. Now change one number: a user with 50 million followers posts. That is 50 million writes from one action, and while the queue drains it, everyone else\'s posts are stuck behind it.',
      'So the real design is a **hybrid**, and the threshold is the interesting part. Below some follower count, fan out on write into each follower\'s inbox. Above it, do not fan out at all — leave the post where it is, and when a follower loads their timeline, merge their precomputed inbox with a live query for the handful of big accounts they follow. Most users follow only a few of those, so the extra query is small, and there are few enough big accounts to cache them very aggressively.',
      'What the threshold should be is a real answer, not a hand-wave: pick it from where the write cost starts to hurt the queue, measure, and make it a configuration value rather than a constant. Ten thousand followers is a reasonable starting guess, and saying "I would tune it from queue lag" is better than any specific number.',
      'A few details that separate a real answer from a sketch. **The inbox is capped** — you store the most recent few hundred entries per user, not their whole history, because nobody scrolls to last year and unbounded lists are how storage explodes. **You store references, not copies** — the inbox holds post ids, and the posts themselves are fetched and cached separately, so an edit or a delete happens once. **Inactive users are skipped** — do not fan out to someone who has not opened the app in six months; build their timeline on demand when they come back.',
      '**Ordering** is the part people forget. If the timeline is strictly chronological, merging two sources is easy. The moment ranking is involved — engagement, relevance, recency combined — the merge has to score items from both sources on the same scale, which means the ranking has to be computable at read time on a few hundred candidates. That is why real systems separate retrieval, which narrows to a few hundred, from ranking, which orders them.',
      'The same choice appears everywhere once you see it. Chat: write once to a conversation, or copy into each member\'s mailbox. Notifications: generate for everyone now, or evaluate on open. A group chat with 100,000 members is exactly the celebrity problem wearing a different hat, and the answer is the same shape.',
    ],
    followUp: {
      q: '"A user with 200 million followers posts. Walk me through the next 60 seconds."',
      answer:
        'If I fan out on write with no special case, the next 60 seconds are an outage. Two hundred million inbox writes get queued from one action. The queue backs up, and because everyone shares it, an ordinary user\'s post that should appear in two seconds appears in twenty minutes. The write amplification from one account has degraded the product for everyone. So the design has to already have decided this account is different. Above a follower threshold I do not fan out at all. The post is written once, and it is put into a heavily cached "recent posts by this account" list — one object that every one of those followers will read, which is the ideal cache shape, since it is one key with enormous read volume and it can sit at the edge. When a follower opens their timeline, I read their precomputed inbox and merge in the recent posts of the few big accounts they follow. Most people follow a handful, so that is a small extra cost paid at read time by the people who chose to follow them. The costs I would name: two code paths for one feature, permanently, and a threshold that has to be tuned from real queue lag rather than guessed. And the merge means the timeline is assembled from two sources, so ordering and pagination need care — a cursor over a merged list is harder than a cursor over one list.',
    },
    selfCheck: {
      q: 'Your product has 10 million users who each follow about 300 accounts, and people open the app 20 times a day but post once. Push or pull, and what is the number that decided it?',
      answer:
        'Push, and the number is the read-to-write ratio. Each user posts once a day and reads twenty times, so reads outnumber writes twenty to one per user — and each read under a pull model would mean querying 300 accounts and merging, while each write under a push model means 300 inbox inserts. Doing 300 units of work once per post is far better than doing 300 units of work twenty times a day per user. Push moves the cost to the rarer event, which is the whole point. What I would say next is the caveat: this holds because 300 is the typical follower count. The moment one account has ten million followers, push costs ten million writes from one action, so I need the hybrid — no fan-out above a threshold, merged at read. And I would cap each inbox at a few hundred entries, because nobody scrolls further and unbounded lists are how the storage estimate stops making sense.',
    },
    traps: [
      'Choosing push or pull without doing the read-to-write arithmetic out loud.',
      'No answer for the biggest account on the platform. That is the whole follow-up.',
      'Copying whole posts into inboxes instead of references, making edits and deletes a nightmare.',
      'Unbounded inbox lists, and fanning out to users who never open the app.',
    ],
    sayThis:
      '"Fan out on write into a capped inbox of post ids, because reads beat writes twenty to one. Above ten thousand followers I stop fanning out and merge those accounts in at read time from a heavily cached list. Cost: two code paths forever, and a threshold I tune from queue lag rather than guess."',
    related: ['partitioning', 'message-queues', 'caching', 'consistency-models'],
  },

  {
    slug: 'clocks-and-ordering',
    title: 'Clocks, ordering and why timestamps lie',
    navTitle: 'Clocks and ordering',
    tier: 2,
    oneLine: 'Two machines never agree on the time, so never let time decide who wins.',
    problem: [
      'Every machine has a clock, and no two of them agree. They drift apart by milliseconds normally, and by much more when something goes wrong. NTP corrects them by jumping, so a clock can even move backwards.',
      'This matters because people constantly use timestamps to decide things: which write is newer, which event happened first, whether a lease expired. Every one of those decisions is quietly wrong some of the time.',
    ],
    cost: 'Doing it properly costs you simplicity. Logical clocks give you correct ordering but no relation to real time, so you cannot use them to answer "how long ago". Version vectors grow with the number of writers. And ordering everything through one place is correct and puts a bottleneck in the middle of your system. Meanwhile the wrong-but-easy answer, wall clock timestamps, works fine right up until it silently loses somebody\'s data.',
    useWhen: [
      'Deciding which of two concurrent writes wins.',
      'Ordering events that arrive from different machines.',
      'Anything with a lease, a lock expiry or a token lifetime.',
      'Debugging across services, where you are lining up logs from several machines.',
    ],
    avoidWhen: [
      'Ordering events inside a single process or a single partition. There the sequence is already unambiguous, and a counter is enough.',
      'Displaying a time to a human. There a wall clock is exactly right — being 50 ms off does not matter.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Server B is 80 ms behind. The second write, made later in real life, carries an earlier timestamp — so last-write-wins keeps the older value and silently discards the newer one.',
        nodes: [
          { id: 'a', label: 'Server A', sub: 'clock 12:00:00.000', kind: 'service', col: 0, row: 0 },
          { id: 'b', label: 'Server B', sub: 'clock 11:59:59.920', kind: 'service', col: 0, row: 1 },
          { id: 'w1', label: 'write "red"', sub: 'stamped .000', kind: 'client', col: 1, row: 0 },
          { id: 'w2', label: 'write "blue"', sub: 'stamped 11:59:59.920', kind: 'client', col: 1, row: 1 },
          { id: 's', label: 'Store', sub: 'keeps "red"', kind: 'store', col: 2, row: 0 },
          { id: 'n', label: '"blue" really happened later — the user watches their change vanish', kind: 'note', col: 1, row: 2, span: 2 },
        ],
        edges: [
          { from: 'a', to: 'w1' },
          { from: 'b', to: 'w2' },
          { from: 'w1', to: 's' },
          { from: 'w2', to: 's', dashed: true },
        ],
      },
    },
    body: [
      'First, the size of the problem. A well-run fleet with NTP keeps clocks within a few milliseconds of each other most of the time. A badly configured or briefly disconnected machine can be seconds out. And NTP corrects by stepping the clock, so the same machine can read 12:00:00.100 and then, a moment later, 12:00:00.050. Any code that assumes time only moves forward has a bug it will hit rarely and struggle to reproduce.',
      'So: **last-write-wins is a decision to lose data, not a conflict resolution strategy.** It is legitimate when the value is really disposable — a presence status, a cached counter — and you should say that when you choose it. It is not legitimate for anything a user typed. If two people edit a document and one edit vanishes because a server\'s clock was 80 ms behind, you have not resolved a conflict, you have hidden one.',
      '**Logical clocks** fix ordering without needing real time. A Lamport clock is a counter each machine keeps: bump it on every event, and send it with every message, and when you receive a higher value, jump to it. That guarantees that if A caused B, then A has a lower number than B. What it cannot tell you is the reverse — a lower number does not prove causation, so you cannot use it to detect that two writes were really concurrent.',
      '**Version vectors** can. Each writer keeps its own counter, and the value carried around is the set of all of them. Comparing two versions gives you three answers, not two: this one is newer, that one is newer, or neither — they are concurrent and really conflict. That third answer is the useful one, because it hands the conflict to something that can actually resolve it: application logic, a merge rule, or the user. The cost is that the vector grows with the number of writers, so you need a way to prune retired ones.',
      '**Hybrid logical clocks** are the practical compromise most modern systems use. They combine a physical timestamp with a logical counter, so the value is close to real time — you can read it and it means something — while still guaranteeing correct causal order even when the physical clocks disagree. If someone asks how you would order events across regions, this is the answer to name.',
      'The other honest answer is to **stop needing global order**. Most systems do not need to order everything, only the things that touch each other. Ordering per key, per conversation, per account is usually enough, and it is much cheaper: route all writes for one key through one place, and the sequence is unambiguous with no clocks involved at all. That is exactly what partitioning by key already gives you. Reach for that before reaching for vector clocks.',
      'Two practical rules. **Never compare timestamps from different machines to decide a winner.** And **never trust a client-supplied timestamp for anything that matters**, because that clock is on a phone whose owner can set it to any value they like.',
    ],
    followUp: {
      q: '"You store a last-updated timestamp and use it to resolve conflicts. What goes wrong?"',
      answer:
        'Data disappears, quietly, and nobody can reproduce it. The concrete failure: two servers accept a write to the same key, one server\'s clock is 80 milliseconds behind, and the write that really happened second carries the earlier timestamp. Last-write-wins keeps the older value and drops the newer one, so a user watches their edit apply and then revert on refresh. There is no error, no log line, nothing to alert on. It is worse in a multi-leader or multi-region setup, where the two writes are naturally on different machines. What I would do instead depends on the data. If the value is really disposable, like a presence indicator, last-write-wins is fine and I would say out loud that I am choosing to lose the odd update. If it is user content, I want to detect the conflict rather than pick a winner, so I would carry a version — a version vector, or simply a version number with a compare-and-set write so the loser is told to retry rather than silently overwritten. Best of all, if the shape allows it, I remove the conflict: route all writes for that key through one partition, so there is a single order and no clock is involved.',
    },
    selfCheck: {
      q: 'Why is "order these events by their timestamp" unreliable across machines, and what is the cheapest way to avoid needing it?',
      answer:
        'Because each machine stamps events from its own clock, and those clocks disagree — usually by milliseconds, sometimes by much more, and they can jump backwards when NTP corrects them. So two events stamped a few milliseconds apart on different machines tell you nothing reliable about which really happened first, and any decision made from that comparison is right most of the time and silently wrong the rest. The cheapest way to avoid needing it is to stop trying to order everything globally and only order what actually interacts. Route all events for one key — one conversation, one account, one order — through a single partition or a single writer, and the order is simply the order they arrived there. No clocks, no vectors, no coordination. You only need logical clocks or version vectors when events on really different machines have to be compared, and most designs can be arranged so that they do not.',
    },
    traps: [
      'Last-write-wins on user content, described as if it resolved the conflict rather than discarded one side.',
      'Assuming time only moves forward. NTP steps clocks backwards.',
      'Trusting a timestamp sent by a client.',
      'Reaching for vector clocks when partitioning by key would have removed the problem entirely.',
    ],
    sayThis:
      '"I would not order these by wall clock, because two servers never agree and the loser is discarded silently. All writes for one conversation go through one partition, so the order is just arrival order. Where I really need cross-machine ordering I would use a hybrid logical clock, so the value still looks like real time but the causal order is correct."',
    related: ['replication', 'consistency-models', 'consensus', 'partitioning'],
  },

  {
    slug: 'multi-region',
    title: 'Multi-region and data residency',
    navTitle: 'Multi-region',
    tier: 2,
    oneLine: 'Users on the other side of the world, laws about where data may live, and one very expensive round trip.',
    problem: [
      'One region means everyone far away pays 150 ms per round trip, and a regional outage is a total outage. Both are real reasons to run in more than one place.',
      'But going multi-region does not just copy your system. It changes what is possible, because the speed of light now sits between your machines, and in some cases the law does too.',
    ],
    cost: 'Everything gets harder and more expensive. Cross-region replication lag is tens to hundreds of milliseconds, so consistency choices you did not have to think about become design decisions. You pay for duplicated infrastructure and for cross-region bandwidth, which is not cheap. Deploys have to be regional. Testing gets harder, because most failures only appear when the link between regions is slow rather than broken. And the failure mode people forget is that a bug now ships to every region.',
    useWhen: [
      'Users are spread worldwide and latency is part of the product.',
      'You have an availability target that a single region cannot meet.',
      'The law requires certain data to stay inside certain borders.',
      'A single region is really at capacity, which is rare and worth checking.',
    ],
    avoidWhen: [
      'You have not filled one region. Most systems never need this, and it makes every future feature slower to build.',
      'Uptime is the goal and the real cause of your outages is deploys. Multi-region does nothing about that.',
      'The data is inherently global and contested. Two regions cannot both authoritatively sell the same seat.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The two honest shapes. Almost every real system is the first one, and claims to be the second.',
        a: {
          title: 'One write region, read replicas everywhere',
          points: [
            'All writes travel to the home region. Reads are served locally and are fast.',
            'Simple. No write conflicts, because there is only one writer.',
            'A user far from the home region pays the full round trip on every write.',
            'Losing the home region means writes stop until you promote another one.',
            'Right for: most products, most of the time.',
          ],
        },
        b: {
          title: 'Write in every region',
          points: [
            'Writes are fast everywhere, because they are local.',
            'The same record can now be written in two places at once. You own that conflict.',
            'Needs a merge rule, or data partitioned so a record only ever belongs to one region.',
            'Survives losing a region without a promotion step.',
            'Right for: partitionable data — a user\'s own data, a region\'s own orders.',
          ],
        },
        verdict:
          'The trick that makes multi-region writes work in practice is not clever conflict resolution. It is partitioning the data so that any given record has exactly one home region, and routing that user\'s writes there. Then every region is a writer, and no two regions ever write the same row.',
      },
    },
    body: [
      'Start by separating the two reasons, because they lead to different designs. **Latency** is solved by putting reads close to users, and a CDN plus read replicas gets you most of it without touching your write path. **Availability** is solved by being able to take writes somewhere else, and that is the expensive part. Say which one you are buying.',
      'The pattern that actually works is **home region per record**. Pick a partitioning key that matches how the data is used — usually the user, the tenant, or the market — and give each one a home region where its writes happen. A user in Europe writes to Europe. Their data is replicated elsewhere for reading and for disaster recovery, but only one region ever accepts writes for them. You get local writes for almost everyone, no conflicts by construction, and a clean story for failover. The cost is routing: something has to know where each record lives, and a user who travels pays the round trip until you move them.',
      '**What cannot be partitioned** is the interesting part, and every system has some. A global unique username. Inventory sold worldwide. A shared balance. For those, accept one authoritative region and pay the round trip, or push the decision behind a queue where the ordering is done in one place. The mistake is pretending these can be regionally owned; the result is selling the same item twice, one sale per region.',
      '**Data residency** is a legal constraint, not a technical preference, and it changes the design more than latency does. Rules like the GDPR and various national laws can require that personal data stays inside a border. That means your partitioning key has to include the region, backups and logs have to respect it too — which people forget, because logs quietly contain personal data — and "just replicate everything everywhere" stops being an option. If a question mentions users in the EU, say this out loud; it is a real signal.',
      '**Failover between regions** is not the same as failover between machines. The data in the failed region may be seconds behind, so promoting another region means accepting the loss of whatever had not replicated, and you should say how much that is. The decision also needs to be made by something outside both regions, or a network split leaves both believing they should be primary. And failing back afterwards is really harder than failing over, because the recovered region now has writes that the promoted one never saw.',
      'Two operational things that separate people who have done this. Deploys go **one region at a time**, so a bad release hits a fraction of users and you can stop. And a **region needs to be able to run at higher load**, because when one fails, its traffic goes to the others — two regions at 60% capacity each cannot absorb one failing.',
    ],
    followUp: {
      q: '"You have users in the US and Europe. Where does the database live?"',
      answer:
        'My first question back is what kind of data, because the answer differs. For data that belongs to one user — their profile, their orders, their messages — I would give each user a home region based on where they signed up, write there, and replicate elsewhere for reads and disaster recovery. A European user gets a local write, no cross-Atlantic hop, and no conflict is possible because only one region ever writes their row. For data that is really global and contested — a unique username, or worldwide inventory — I would keep a single authoritative region and accept that some users pay 80 to 100 milliseconds on those specific operations, because being right matters more than being fast on a rare action. The costs I would name: a routing layer that knows where each user lives, and a real migration story for the person who moves from New York to Berlin. And if this is European personal data I would raise residency as a constraint before latency, because that decides whether replicating to the US is even allowed — and it applies to backups and logs too, which is the part people miss.',
    },
    selfCheck: {
      q: 'Why does going multi-region not automatically improve availability, and what usually causes your outages instead?',
      answer:
        'Because redundancy protects against a region failing, and that is not what usually takes systems down. The large majority of real outages come from deploys and configuration changes, and those ship to every region — so a second region gives you a second copy of the bug, at the same moment, and no protection at all. Multi-region also adds new failure modes of its own: a slow link between regions is much harder to handle than a broken one, cross-region failover can be triggered wrongly, and failing back afterwards is harder than failing over. It only improves availability if you also do the unglamorous work: deploy one region at a time so a bad release is contained, keep enough spare capacity that the surviving regions can absorb the failed one\'s traffic, and actually test the failover rather than assuming it works. Without that, you have doubled your cost and complexity and bought very little.',
    },
    traps: [
      'Going multi-region for uptime when deploys are what actually causes your outages.',
      'Claiming multi-region writes without saying how conflicts are handled or avoided.',
      'Forgetting that a surviving region has to absorb the failed one\'s traffic.',
      'Treating data residency as a detail. It constrains the design more than latency does.',
    ],
    sayThis:
      '"Each user has a home region where their writes happen, chosen at signup, with replicas elsewhere for reads and disaster recovery — so no two regions ever write the same row. Global uniqueness stays in one authoritative region and pays the cross-region hop. Cost: a routing layer, a migration path for users who move, and every region sized to absorb another one failing."',
    related: ['replication', 'cap-pacelc', 'dns', 'cdn'],
  },
]
