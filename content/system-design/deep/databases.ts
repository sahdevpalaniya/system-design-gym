import type { DeepDive, WorkedExample } from '@/lib/types'

export const SQL_NOSQL_DEEP: DeepDive = {
  intro:
    'The summary said "pick by access pattern, not by which word sounds bigger". This page is the actual material: what ACID means one word at a time, how relational databases scale before you give up on them, all four kinds of NoSQL and what each is really for, what BASE means, and a decision procedure you can run in an interview instead of guessing.',
  minutes: 25,
  sections: [
    {
      heading: 'What a relational database actually gives you',
      body: [
        'Data lives in tables of rows and columns, the shape is fixed by a schema, and rows in different tables reference each other by id. That is the familiar part. The valuable part is what the database promises about *changes*.',
        'A **transaction** is a group of changes that happen together or not at all. Transfer money between two accounts and you have two writes — subtract from one, add to the other. A transaction guarantees you never get one without the other, even if the machine loses power between them.',
        'That guarantee has a four-letter name, and it is worth taking one word at a time rather than reciting the acronym.',
      ],
      points: [
        '**Atomicity** — all the changes happen, or none do. No half-finished transfers.',
        '**Consistency** — the database refuses to end up in a state that breaks your rules. A foreign key must point at something real; a balance column marked non-negative cannot go negative.',
        '**Isolation** — concurrent transactions do not see each other\'s half-finished work. Two people transferring at once get a result as if they had gone one after the other.',
        '**Durability** — once it says committed, it survives a power cut. This is what the write-ahead log is for.',
      ],
      table: {
        caption: 'Isolation levels, and the anomaly each one still allows. This is where "it worked in testing" bugs come from.',
        headers: ['Level', 'Still allows', 'In plain terms'],
        rows: [
          ['Read uncommitted', 'Dirty reads', 'You can read a change that later gets rolled back. Almost never worth using.'],
          ['Read committed', 'Non-repeatable reads', 'Read the same row twice in one transaction, get two different answers. The common default.'],
          ['Repeatable read', 'Phantom reads', 'Rows you already read stay stable, but new rows can appear in a range you queried.'],
          ['Serializable', 'Nothing', 'Behaves as if transactions ran one at a time. Correct, and slowest.'],
        ],
      },
      callouts: [
        {
          variant: 'cost',
          text: 'Stronger isolation costs throughput, because the database must hold more locks or do more conflict checking. Most systems run at read committed and never think about it — which is fine until you write a check-then-act sequence and discover it was never safe.',
        },
      ],
    },

    {
      heading: 'Normalisation and denormalisation',
      body: [
        '**Normalisation** means storing each fact exactly once. A customer\'s address lives in the customers table, and orders point at the customer by id rather than copying the address. Change the address once and every order reflects it.',
        'The benefit is that data cannot contradict itself, because there is only one copy to be wrong. The cost is joins: assembling a useful view means reading several tables and matching them up, and joins get expensive as tables grow — particularly once the tables live on different machines.',
        '**Denormalisation** stores a fact more than once on purpose to avoid the join. Copy the customer name onto the order row so displaying an order needs one read instead of two.',
        'You are trading write complexity and correctness risk for read speed. Now a name change has to update many rows, and if one update fails you have two versions of the truth. Denormalise when reads massively outnumber writes and you have measured the join as the problem — not before.',
      ],
      points: [
        'Normalised: each fact stored once, no contradictions, more joins at read time.',
        'Denormalised: facts copied, fewer joins, faster reads, and updates must now touch several places.',
        'Denormalise in response to a measurement, not a hunch.',
        'A materialised view is denormalisation the database maintains for you — often the better first move.',
        'NoSQL stores are usually denormalised by design; that is not a different philosophy so much as the same trade made up front.',
      ],
    },

    {
      heading: 'Scaling a relational database — the four moves, in order',
      body: [
        'People jump from "Postgres" to "we need NoSQL" while skipping four steps that would have solved it. Take them in order, because each is dramatically cheaper than the next.',
        '**1. Tune what you have.** Add the missing index. Fix the N+1 query. Stop selecting columns you do not use. This routinely finds 10x, costs an afternoon, and requires no architectural change at all.',
        '**2. Add read replicas.** Copies of the database that stay in step and serve reads. Read capacity multiplies; write capacity does not change at all, because every replica applies every write. The cost is replication lag — a replica is always slightly behind, so a user can write and then not see their own change.',
        '**3. Federation — split by feature.** Move whole tables to their own database: users here, products there, orders somewhere else. Each database gets smaller, and its working set is more likely to fit in memory. The cost is that you can no longer join across the boundary, and no transaction spans two of them.',
        '**4. Sharding — split by row.** Same table, split across machines by a key: users A–M here, N–Z there. This is the only one that raises write throughput, and it is by far the most expensive to do and to live with.',
      ],
      points: [
        'Tuning is free and usually finds more than people expect. Do it first, every time.',
        'Replicas scale reads only. If your problem is writes, replicas actively make it slightly worse.',
        'Federation splits by feature and is often enough — the cost is losing cross-database joins and transactions.',
        'Sharding is the only move that raises write capacity, and it is a project, not a setting.',
        'Most systems never get past step 2. Saying that out loud scores well.',
      ],
      visuals: [
        {
          type: 'flow',
          flow: {
            scenario: 'leader-follower',
            caption:
              'Step 2 in motion: one leader takes every write, followers copy from it and serve reads. Reads scale; writes do not.',
          },
        },
        {
          type: 'flow',
          flow: {
            scenario: 'sharding',
            caption:
              'Step 4: the key decides which machine owns the row. This is the only move that raises write throughput.',
          },
        },
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Before I reach for a different database, I would add the missing index, then add read replicas, then split by feature. At my estimated write rate I never hit the ceiling that would force sharding — so I would stay on Postgres and revisit at 20x."',
        },
      ],
    },

    {
      heading: 'NoSQL, type by type — and what each is really for',
      body: [
        '"NoSQL" is not one thing. It is four quite different families that share only the property of not being relational tables. Treating them as interchangeable is the most common mistake here.',
      ],
      points: [
        '**Key-value** (Redis, DynamoDB) — a giant dictionary. Give it a key, get a blob. Fastest possible lookup, no querying by anything but the key. For: caches, sessions, rate-limit counters, feature flags.',
        '**Document** (MongoDB, Couchbase) — stores JSON-ish documents and can query and index *inside* them. Fields can differ between documents. For: content, catalogues, user profiles, anything where the shape varies per record.',
        '**Wide-column** (Cassandra, HBase, Bigtable) — rows keyed by a partition key, with columns grouped and sorted inside each partition. Built for enormous write volume and for reading a contiguous slice of one partition. For: time series, event logs, message history, feeds.',
        '**Graph** (Neo4j) — nodes and the relationships between them, where the relationships are first-class. For: social graphs, fraud rings, recommendations — anything where "how are these two connected" is the actual question.',
      ],
      table: {
        caption: 'The same question asked of each family: what can you actually look things up by?',
        headers: ['Type', 'Query by', 'Strength', 'Bad at'],
        rows: [
          ['Key-value', 'The key, only', 'Microsecond lookups, trivial to scale', 'Any question that is not "give me this key"'],
          ['Document', 'Key or fields inside the document', 'Flexible shape, decent querying', 'Joins across documents, multi-document transactions'],
          ['Wide-column', 'Partition key, then a range within it', 'Huge write rates, fast contiguous reads', 'Ad hoc queries; you design tables per query'],
          ['Graph', 'Traversing relationships', 'Deep connection questions that would be many joins', 'Bulk scans and simple key lookups'],
        ],
      },
      callouts: [
        {
          variant: 'trap',
          text: 'Saying "we will use NoSQL" tells the interviewer nothing, and slightly suggests you think it is one product. Name the family and the access pattern: "a wide-column store partitioned by conversation id, clustered by timestamp descending, so one conversation\'s recent messages are a single contiguous read."',
        },
      ],
    },

    {
      heading: 'BASE — the other set of promises',
      body: [
        'ACID describes what relational databases promise. BASE describes what many distributed stores offer instead, and it is weaker on purpose.',
        '**Basically Available** — the system answers, even during failures, possibly with stale or partial data. **Soft state** — the data can change on its own as copies reconcile, without a write happening. **Eventually consistent** — stop writing and all copies converge, with no promise about when.',
        'This is not laziness; it is the direct consequence of wanting to survive machines and networks failing while still answering. If you insist every copy agrees before you answer, you cannot answer when a copy is unreachable. BASE chooses to answer.',
        'The practical consequence is that correctness moves into your application. If two people can edit the same thing, you decide what winning means. If a counter can be incremented in two places, you decide how to merge. The database will not stop you getting this wrong.',
      ],
      points: [
        'ACID: refuse the write rather than be inconsistent. BASE: accept the write and converge later.',
        'BASE buys availability and write throughput; it sells correctness guarantees back to your application code.',
        'Eventually consistent reads can go *backwards* — refresh and see an older value. This is legal and surprises people.',
        'Choose per operation, not per system. Likes are BASE; payments are ACID; both can live in one product.',
      ],
      compare: {
        caption: 'The same shopping app, two operations, two sets of promises.',
        a: {
          title: 'ACID — "confirm order"',
          points: [
            'Stock check and payment must both happen or neither does.',
            'Refuses rather than risks selling something twice.',
            'Slower per write, and unavailable if the owning partition is unreachable.',
            'Being wrong here costs money, support time and trust.',
          ],
        },
        b: {
          title: 'BASE — "add to cart"',
          points: [
            'Accept locally even during a network partition, reconcile after.',
            'Always available; nobody sees an error page.',
            'Worst case is a duplicate item the user removes in two seconds.',
            'Being briefly wrong here costs nothing.',
          ],
        },
        verdict:
          'The strong answer is not "we are an ACID shop" or "we use BASE". It is naming which operations get which guarantee and why — driven by what being wrong actually costs.',
      },
    },

    {
      heading: 'How to actually choose, in the room',
      body: [
        'A procedure you can run out loud, rather than a preference you assert.',
        'First: **is there an invariant that must never break under concurrency?** Seats, stock, balances, unique usernames. If yes, you want real transactions where that invariant lives, and that means relational unless you have a very good reason.',
        'Second: **what is the one query this system runs ten thousand times a second?** If it is "give me everything for this key", a key-value or wide-column store fits and its limits will not hurt. If you cannot predict the queries, you want the flexibility of SQL.',
        'Third: **do the numbers actually force it?** Estimate the write rate. If a single primary can commit it — and one modern machine commits far more than people assume — then the scale argument for going distributed does not exist yet, and you should say so.',
        'Fourth: **can you use both?** Most real systems do. Transactional core in Postgres, the enormous append-only event stream in a wide-column store, the cache in Redis, the search index in something built for search. Saying this is not indecision; it is what production looks like.',
      ],
      points: [
        'Invariant under contention → relational, for that part at least.',
        'One known access pattern at huge volume → key-value or wide-column.',
        'Unpredictable queries → relational, because you cannot design tables per query you have not thought of.',
        'No number forcing your hand → stay boring, and say why you are staying boring.',
        'Polyglot persistence is normal. Justify each store by the access pattern it serves.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Postgres for orders and inventory, because those need a real transaction and the write rate is only a few hundred a second. The click-event stream is 80,000 writes a second, append-only, read only by device id — that goes in a wide-column store partitioned by device. Two systems, and no transaction spans them, so the pipeline is idempotent instead."',
        },
        {
          variant: 'trap',
          text: 'Choosing a database by name rather than by access pattern. "Why this and not Postgres?" is the follow-up, and the only answers that survive it contain a number or a query shape.',
        },
      ],
    },
  ],
}

export const SQL_NOSQL_EXAMPLE: WorkedExample = {
  title: 'Choosing storage for a link shortener',
  scenario:
    'Around 40 new links a second and 4,000 redirects a second. Roughly 1.2 TB after five years. Every read is "give me the destination for this code". Users can pick custom codes, so two people must never get the same one. Which database, and why?',
  steps: [
    {
      step: 'Look for an invariant first',
      detail:
        'There is one: no two links may share a code. That is a uniqueness constraint under concurrency — exactly the thing a database enforces well and application code enforces badly, because check-then-insert has a race between the check and the insert.',
    },
    {
      step: 'Check whether the numbers force a distributed store',
      detail:
        '40 writes a second is nothing. A single primary handles that with three orders of magnitude of headroom. 1.2 TB fits on one machine. So nothing here forces a distributed database — and saying that explicitly is worth more than reaching for one.',
    },
    {
      step: 'Look at the access pattern',
      detail:
        'Every read is a lookup by a single key. That is really key-value shaped, which is why people reach for a key-value store here — and the read path does use one, as a cache. The question is what holds the durable truth.',
    },
    {
      step: 'Decide',
      detail:
        'Postgres, keyed by the short code, with a unique constraint on it. The constraint gives collision handling and "that name is taken" for free, in one mechanism, with no race. Redis in front absorbs the 4,000 reads a second so the database rarely sees a redirect at all.',
    },
    {
      step: 'Name what it costs',
      detail:
        'One primary is the write ceiling. At 40 a second against a ceiling in the thousands, that is fine, and I would revisit at roughly 100x. The cache means a disabled link stays live for the length of its TTL.',
    },
    {
      step: 'Say what would change your mind',
      detail:
        'If writes reached tens of thousands a second, I would move to a key-value store partitioned by code — and then I would have to solve uniqueness myself, most likely by generating codes that cannot collide rather than by detecting collisions.',
    },
  ],
  outcome:
    'A boring relational database doing the correctness-critical work, and a cache doing the volume. The interesting part of the answer is not the choice — it is being able to say which number would change it.',
  problemSlug: 'url-shortener',
}
