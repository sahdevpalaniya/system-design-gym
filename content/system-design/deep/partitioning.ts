import type { DeepDive, WorkedExample } from '@/lib/types'

export const PARTITIONING_DEEP: DeepDive = {
  intro:
    'The summary said "split the data and everything depends on the key". This page is about that key. It covers range against hash partitioning and what each destroys, how to choose a shard key from your actual queries, hot partitions and the three real defences, why the logical-partition trick makes rebalancing survivable, what breaks once data is split — joins, transactions, uniqueness, pagination — and how to reshard a live system without downtime.',
  minutes: 22,
  sections: [
    {
      heading: 'Range or hash, and what each one destroys',
      body: [
        'There are two ways to decide which machine owns a key, and they are mirror images: each gives you exactly what the other takes away.',
        '**Range** keeps neighbouring keys together, so range queries are efficient and skew is easy. **Hash** spreads keys evenly, so load is balanced and range queries become impossible. There is no third option that gives you both, and pretending otherwise is where designs go wrong.',
      ],
      table: {
        caption: 'The mirror image.',
        headers: ['', 'Range', 'Hash'],
        rows: [
          ['Neighbouring keys', 'Same partition', 'Scattered at random'],
          ['Range queries', 'One partition, efficient', 'Impossible — must ask everyone'],
          ['Load distribution', 'Uneven, often badly', 'Even by construction'],
          ['Sharding by timestamp', 'All writes hit the newest shard', 'Even, but you lose time ranges'],
          ['Adding a machine', 'Split a range, move part of it', 'Needs consistent hashing or everything moves'],
        ],
      },
      points: [
        'Sharding by timestamp with range partitioning is the classic mistake: every write goes to one shard while the rest idle.',
        'Plain modulo hashing has a second problem beyond losing ranges — adding a machine remaps almost every key. Consistent hashing exists for exactly that.',
        'A composite key often gets you both: hash on the tenant, range within it. One tenant\'s data is together and ordered, and tenants spread evenly.',
        'Choose based on your one hottest query, not on which sounds more scalable.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Hash on conversation id, range on timestamp within it. So one conversation lives on one partition and its recent messages are a single continuous read, while conversations spread evenly across the cluster."',
        },
      ],
    },
    {
      heading: 'Choosing the key, from your queries backwards',
      body: [
        'The shard key is the most load-bearing decision on the whiteboard and it is chosen from the query pattern, not from the data model. Work backwards from the one query that runs ten thousand times a second.',
        'A good key satisfies three tests, and failing any one of them is a design problem you will not be able to fix later without moving all your data.',
      ],
      points: [
        '**Is it in your hottest query?** If not, every read becomes a scatter-gather across every partition, and you have made reads worse to make writes better.',
        '**Does it have enough distinct values?** A key with 12 possible values cannot use 100 machines. Country is almost always a bad shard key for this reason.',
        '**Is the traffic per value roughly even?** This is the one people skip. Ten million users spread evenly by id is fine until one of them has 200 million followers.',
        'User id and tenant id usually pass all three. Timestamps fail the third badly. Status fields fail the second.',
        'When two queries want different keys, you either denormalise into a second table keyed differently, or you accept scatter-gather on the rarer one. Say which.',
      ],
      visuals: [
        {
          type: 'compare',
          compare: {
            caption: 'The same messaging system, two shard keys, and the query that decides it.',
            a: {
              title: 'Shard by message id (hashed)',
              points: [
                'Perfectly even write distribution — every partition takes the same load.',
                '"Last 50 messages in this conversation" hits every partition, then merges and sorts.',
                'That is the most common query in the product, made as expensive as possible.',
                'No hot partition, ever — which is worth nothing if every read is a scatter.',
              ],
            },
            b: {
              title: 'Shard by conversation id',
              points: [
                'The hot query is one partition and one continuous read.',
                'Ordering within a conversation is free — one partition, one sequence.',
                'A single enormous group chat becomes a hot partition.',
                'That is a rarer problem, affecting few conversations, and can be handled specifically.',
              ],
            },
            verdict:
              'Conversation id. Trading a guaranteed-even distribution for a rare hot partition is correct when the alternative makes your most common query a cluster-wide scatter — and the rare problem can be given its own path.',
          },
        },
      ],
    },
    {
      heading: 'Hot partitions, and the three defences',
      body: [
        'Every partitioned system meets this eventually. Keys are spread evenly and traffic is not, because one key — one celebrity, one product in a flash sale, one enormous tenant — attracts a disproportionate share of it.',
        'The sentence to say out loud: **an even distribution of keys does not mean an even distribution of traffic.** Then give a defence rather than a diagnosis.',
      ],
      points: [
        '**Sub-partition the hot key**: append a small random suffix so one key becomes ten, spread across partitions, and read all ten. Costs more read work for everyone and needs the hot key identified.',
        '**Give it a separate path**: above a threshold, handle that key completely differently — cached aggressively, served from memory, not fanned out. This is what most real systems end up doing.',
        '**Add a caching layer in front**: for read-hot keys this is the cheapest fix by far, and it does not touch the partitioning scheme at all.',
        'Detect them at runtime rather than hard-coding a list. A count-min sketch finds heavy hitters in a fixed small amount of memory.',
        'Write-hot and read-hot are different problems: caching solves the second and does nothing for the first.',
      ],
      callouts: [
        {
          variant: 'trap',
          text: 'Answering "how do you handle a hot partition" with "consistent hashing". It does not help — consistent hashing decides where a key lives, and a hot key is one key.',
        },
      ],
    },
    {
      heading: 'The logical partition trick',
      body: [
        'This is the single most useful practical idea in the topic, and mentioning it is a strong signal because it is what people learn after resharding once.',
        'Do not map keys directly to machines. Map keys to a large fixed number of **logical partitions** — say 1,024 — and map those partitions to machines. Growing the cluster means moving whole logical partitions from one machine to another. No key is ever rehashed, and the mapping is a small table anyone can read.',
      ],
      points: [
        'Pick the logical partition count once, generously, and never change it. 1,024 or 4,096 for something you expect to grow.',
        'Adding machines becomes an operational task — copy partitions, switch ownership — rather than a data migration.',
        'The partition-to-machine map is small enough to hold in a consensus store and cache on every client.',
        'It also gives you a natural unit for everything else: backups, rebalancing, and per-partition metrics.',
        'The cost is a fixed ceiling: you can never have more machines than logical partitions, which is why you over-provision the count at the start.',
      ],
      visuals: [
        {
          type: 'diagram',
          diagram: {
            caption:
              'Keys map to 1,024 logical partitions, which map to machines. Adding a machine moves partitions, not keys — no rehashing, and the map is one small table.',
            nodes: [
              { id: 'k', label: 'key', kind: 'client', col: 0, row: 0 },
              { id: 'h', label: 'hash % 1024', sub: 'never changes', kind: 'service', col: 1, row: 0 },
              { id: 'p', label: 'Logical partition 417', kind: 'cache', col: 2, row: 0 },
              { id: 'm', label: 'Machine 3', sub: 'owns 417 today', kind: 'store', col: 3, row: 0 },
              { id: 'n', label: 'growing = move partition 417 to machine 9. keys never move individually', kind: 'note', col: 1, row: 1, span: 3 },
            ],
            edges: [
              { from: 'k', to: 'h' },
              { from: 'h', to: 'p' },
              { from: 'p', to: 'm', label: 'lookup table' },
            ],
          },
        },
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"1,024 logical partitions mapped onto 16 machines, so growing to 32 means moving partitions rather than rehashing keys. Cost: a hard ceiling of 1,024 machines, which I am comfortable with, and a partition map every client has to cache."',
        },
      ],
    },
    {
      heading: 'What partitioning takes away',
      body: [
        'Splitting the data costs you four things that were free on one machine. Naming them unprompted is what shows you have actually thought about the consequences rather than just the mechanism.',
      ],
      points: [
        '**Joins**: a join across partitions means fetching from several machines and combining in application code. The usual answer is to denormalise so the data you read together lives together.',
        '**Transactions**: an atomic change across partitions needs a distributed protocol or a redesign. The better answer is almost always to arrange the data so a transaction never spans partitions.',
        '**Uniqueness**: a unique constraint only holds within a partition. Enforcing a globally unique username needs a separate table partitioned by that username, which is its own small system.',
        '**Pagination and sorting**: sorting across partitions means every partition produces its share, and deep pages get quadratically worse. Cursors help; offsets become unusable.',
        '**Counting**: "how many rows match" now means asking everyone. Approximate counts, or a maintained counter, replace a query that used to be trivial.',
      ],
      callouts: [
        {
          variant: 'cost',
          text: 'Every one of these was free before you partitioned. If your numbers do not force partitioning, keeping one machine buys back all five — which is why "I would not shard this" is often the strongest answer available.',
        },
      ],
    },
    {
      heading: 'Resharding a live system',
      body: [
        'This is where the real difficulty hides, and it is why the logical partition trick is worth so much. If you did not plan for it, changing the number of partitions on a system that is serving traffic is weeks of careful work.',
        'The general shape, when you cannot avoid it: dual-write, backfill, verify, switch reads, remove the old path. Each step is separately deployable and separately reversible, which is the property that makes it survivable.',
      ],
      points: [
        'Write to both old and new layouts for every change, so the new one is never behind on live data.',
        'Backfill history in batches, with pauses, so the migration does not saturate the system it is migrating.',
        'Verify by comparing — counts, checksums, sampled rows — rather than by assuming the backfill worked.',
        'Switch reads gradually, a percentage at a time, so a problem is discovered at 1% rather than at 100%.',
        'Only then stop dual-writing, and only later remove the old data. Deleting early removes your way back.',
        'Every one of those steps takes real time, so the honest answer to "how long" is weeks, not hours.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"I would start with far more logical partitions than machines specifically so I never have to do this. If I did have to reshard, it is dual-write, backfill in batches, verify by checksum, shift reads gradually, then contract — and I would budget weeks, not a weekend."',
        },
        {
          variant: 'trap',
          text: 'Saying "we would just rebalance". Rebalancing a live system is a project with a rollback plan, and treating it as a config change is the clearest sign someone has not done it.',
        },
      ],
    },
  ],
}

export const PARTITIONING_EXAMPLE: WorkedExample = {
  title: 'The shard key that looked fine for two years',
  scenario:
    'A B2B analytics product shards its events table by `event_id`, hashed. It has run happily for two years. Now the biggest customers are complaining that their dashboards take 40 seconds to load, while smaller customers see them load instantly. The cluster is not saturated — average CPU across 32 nodes is 30%.',
  steps: [
    {
      step: 'Notice that the resource graphs are lying',
      detail:
        'Average CPU at 30% with slow queries means the work is not evenly distributed in time, or the queries are doing something by design, expensive. Since every partition is roughly equally busy, this is not a hot partition problem — which rules out the usual suspect immediately and points somewhere else.',
    },
    {
      step: 'Look at what the dashboard query actually does',
      detail:
        'The query is "all events for customer 419 in the last 30 days". Events are hashed by event id, so that customer\'s events are scattered uniformly across all 32 partitions. Every dashboard load asks all 32 nodes, each scans for matching rows, and the coordinator merges. For a small customer that returns a few thousand rows and feels instant. For a large one it is millions of rows across 32 machines, and the merge is the 40 seconds.',
    },
    {
      step: 'Name the actual mistake',
      detail:
        'The shard key is not in the hot query. Hashing by event id gave a perfectly even write distribution, which is the thing that looked good for two years, and made the single most important read into a cluster-wide scatter-gather whose cost grows with customer size. Even distribution was optimising the wrong thing.',
    },
    {
      step: 'Choose the key that should have been there',
      detail:
        'Partition by `(customer_id, timestamp)` — hash on customer, range on time within it. Now one customer\'s events live on one partition, and "last 30 days" is a single continuous read. The known risk is that the largest customer becomes a hot partition, which is a real problem affecting a handful of accounts rather than a structural problem affecting every read.',
    },
    {
      step: 'Handle the hot customer on purpose',
      detail:
        'For the few accounts big enough to saturate a partition, sub-partition by adding a bucket suffix — customer 419 becomes 419-0 through 419-7 — and fan reads across those eight. Those customers pay a small fan-out; everyone else keeps the single-partition read. Two paths, with a threshold tuned from measurement.',
    },
    {
      step: 'Migrate without downtime',
      detail:
        'Dual-write to the old and new layouts. Backfill two years of history in batches with pauses, tracking progress so it can be stopped and resumed. Verify with row counts and checksums per customer. Shift dashboard reads to the new layout one percent at a time, watching latency. Only then stop dual-writing, and drop the old table a week later. Six weeks of work, most of it waiting for backfill.',
    },
  ],
  outcome:
    'Dashboard load times fall from 40 seconds to under a second for the largest customers. The lesson is the one the numbers stage exists to prevent: the shard key was chosen for even writes, which nobody was struggling with, rather than for the one query that runs constantly — and two years of it working fine is exactly what made it expensive to fix.',
  problemSlug: 'click-analytics',
}
