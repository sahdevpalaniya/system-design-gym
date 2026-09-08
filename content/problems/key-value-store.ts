import type { Problem } from '@/lib/types'

export const KEY_VALUE_STORE: Problem = {
  slug: 'key-value-store',
  title: 'Distributed key-value store',
  group: 'storage-engine',
  difficulty: 'hard',
  concepts: [
    'replication',
    'partitioning',
    'write-ahead-log',
    'cap-pacelc',
    'bloom-filters',
    'consensus',
    'consistent-hashing',
    'backups-and-recovery',
    'multi-region',
  ],
  prompt:
    'Design a distributed key-value store. Get and put by key, data larger than one machine, survives machines failing, and configurable durability. You are building the database, not choosing one.',

  slack: {
    budget: 'Reads: milliseconds. Writes: milliseconds. Repair and rebalancing: hours.',
    headline:
      'The slack here is not in the request path at all — a get and a put are both something a caller is waiting on. All the slack lives in the background work, and the design succeeds by moving as much as possible into it.',
    body: [
      'Gets and puts have no slack. This store is a dependency of other systems, so its p99 is inside their p99, and being slow makes it useless. That rules out anything requiring wide coordination on the request path.',
      'Everything else has enormous slack, and that is what makes the system possible. Repairing a replica that has fallen behind, moving partitions when a machine joins, compacting on-disk files, taking backups, rebuilding a failed node — all of it can take hours, run at low priority, and be interrupted and resumed. The trick is making sure none of it ever blocks a get.',
      'The one place you get to sell slack is durability. "Confirmed when one node has it" is fast and can lose data. "Confirmed when a majority has it" is slower on every write, forever. That is not a failure-time decision, it is a permanent latency cost — the "else" half of PACELC — and letting the caller choose per operation is the design.',
    ],
    consequence:
      'Background work is aggressively deprioritised and never on the read path. Durability is a per-request knob rather than a system-wide property, so a session cache and a user record can use the same store with different promises.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that would change a box, and propose the scope.',
      nudges: [
        'What operations, exactly? Get and put is a very different system from range scans.',
        'What is the durability promise? That is the biggest single decision here.',
        'Is this one region or several?',
      ],
      model: [
        'Assumptions: get, put and delete by key only — no range scans, no secondary indexes, no transactions across keys. Values up to about a megabyte. A few hundred terabytes total. Running in one region to start, with multi-region as a later question.',
        'The question that changes everything: what is the consistency promise? Strong consistency means a read always sees the last confirmed write, which costs a majority round trip and makes the store unavailable on the minority side of a network split. Eventual consistency means fast local reads and writes, with the caller sometimes seeing stale data. These are two different products. I will assume **tunable per request**, defaulting to quorum, because that is what makes the store usable for both a session cache and a user profile, and it is the honest version of this design.',
        'Second question: do callers need range scans — "all keys with this prefix"? Because that decides partitioning. Hash partitioning spreads load evenly and destroys ranges. Range partitioning keeps neighbours together and invites hot spots. I will assume no range scans, which lets me hash and get even distribution, and I will name what I gave up.',
        'Scope I propose: the data path — partitioning, replication, the write path, the read path, failure handling and rebalancing. Out of scope: a query language, transactions across keys, and secondary indexes, all of which are separate systems built on top.',
      ],
      checklist: [
        'Limited the operations to get, put and delete, and said so explicitly',
        'Asked about the consistency promise and named it as the biggest decision',
        'Chose tunable consistency and justified it with two different use cases',
        'Asked about range scans and tied the answer to hash versus range partitioning',
        'Named what hash partitioning gives up',
      ],
      tradeoffs: [
        {
          decision: 'Hash partitioning',
          cost: 'Range scans become impossible — neighbouring keys land on unrelated machines. In exchange, load spreads evenly with no hot shard by construction.',
        },
      ],
      sayThis:
        '"Get, put and delete by key, a few hundred terabytes, no range scans. The question that decides the design is the consistency promise — I would make it tunable per request with quorum as the default, because a session cache and a user profile want different answers from the same store."',
      trap: 'Naming Dynamo or Cassandra and describing their features. You are being asked to design the machine, not to recall a product.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write a write\'s life as a chain of states, and add the failure branches.',
      nudges: [
        'What has to happen on disk before you can say "committed"?',
        'What does the system decide without being asked?',
        'A node comes back after being away for an hour. What state is it in?',
      ],
      model: [
        'Actors: the client, the coordinator node that receives the request, the replica nodes that hold the data, and the system itself — which decides which nodes own a key, when a node is considered dead, when to start moving data, and when a replica has fallen far enough behind to need repair rather than catch-up.',
        'A write\'s life: received by a coordinator → routed to the N nodes that own the key → appended to each node\'s write-ahead log and fsynced → applied to the in-memory table → acknowledged once W nodes have confirmed → later flushed to a sorted file on disk → later compacted with other files → eventually replicated to any node that missed it.',
        'Failure branches. At routing: the coordinator\'s view of who owns the key is stale because membership just changed, so it writes to the wrong node — which is why ownership comes from a small consensus-backed membership service rather than from each node\'s guess. At acknowledgement: only W-1 nodes responded before the timeout, so the write is not confirmed — but the nodes that did accept it still have it, which means a failed write may still be visible later, and that is a genuine property to state rather than hide. At flush: the node crashes with data only in memory, which is exactly what the write-ahead log exists for — replay it on restart and nothing confirmed is lost.',
        'The branches the system owns. A node is unreachable for an hour: writes during that window went to the other replicas, so on return it is stale, and it must not serve reads as if it were current until it has caught up. A **hinted handoff** — another node temporarily holding writes destined for it — lets the write succeed during the outage and be delivered afterwards. And if it is away long enough that hints have expired, it needs a full repair from a peer rather than a catch-up, which is hours of background work.',
        'The last one: two clients write the same key at the same moment to different coordinators. Both succeed. That is a genuine conflict and something has to decide, which is the version question rather than a failure to prevent.',
      ],
      checklist: [
        'Write-ahead log and fsync before acknowledgement — that is what "durable" means',
        'Ownership comes from a consensus-backed membership service, not from local guesses',
        'Named that a failed write can still be partially applied and visible',
        'Hinted handoff so a brief node outage does not fail writes',
        'A long-absent node needs full repair, not catch-up, and must not serve reads first',
        'Concurrent writes to one key named as a conflict needing a decision',
      ],
      trap: 'Saying a write is committed when it has only reached memory. Without an fsynced log, a power cut loses everything you confirmed, and that is the difference between a cache and a database.',
    },

    {
      id: 3,
      ask: 'Estimate the data size, node count, and what a quorum costs in latency. Then finish: "So the hard part here is ___."',
      nudges: [
        'How many machines does 300 TB actually need, with replication?',
        'What does waiting for a majority add to a write, in real milliseconds?',
        'How long does it take to rebuild one failed node?',
      ],
      model: [
        'Assume 300 TB of unique data with a replication factor of 3, so 900 TB stored. At 8 TB usable per node that is about 115 nodes, and I would round up to 150 for headroom, because a cluster running at 90% full cannot absorb a node failure.',
        'Throughput: assume 500,000 operations per second across the cluster. Spread over 150 nodes with a replication factor of 3, each node handles about 10,000 operations a second — well within what one machine does, which tells me this is a capacity and coordination problem rather than a per-node performance one.',
        'The latency arithmetic is the interesting part. A local disk write with fsync is under a millisecond with group commit. Waiting for two of three replicas inside one datacenter adds a round trip, about 0.5 ms, so a quorum write is maybe 2 ms — cheap. Across regions it is 80 ms or more, which is 40 times worse, and that single number is why cross-region strong consistency is a product decision rather than a configuration one.',
        'Rebuild time is the number people skip and it decides your replication factor. Restoring 8 TB from peers at 1 Gbit per second takes about 18 hours, and during those 18 hours that key range is down to two copies. If a second node fails in that window you are on one copy, and a third failure loses data. That arithmetic — not intuition — is why the replication factor is 3 and not 2.',
        'So the hard part here is failure recovery and membership, not throughput. Each node is barely working. What is hard is agreeing on who owns what while nodes come and go, and staying safe during the 18 hours it takes to rebuild one.',
      ],
      checklist: [
        'Turned data size and replication factor into a node count with headroom',
        'Showed per-node load is modest, so this is not a throughput problem',
        'Quantified quorum latency locally and across regions, with the 40x gap',
        'Calculated rebuild time and used it to justify the replication factor',
        'Finished the sentence: failure recovery and membership, not throughput',
      ],
      tradeoffs: [
        {
          decision: 'Replication factor of 3',
          cost: 'Three times the storage and every write done three times. Justified by the 18-hour rebuild window, during which a factor of 2 would leave you one failure from data loss.',
        },
      ],
      sayThis:
        '"About 150 nodes for 300 TB at replication factor 3. Each node does only 10,000 ops a second, so throughput is not the problem. Rebuilding one failed node takes 18 hours, and that window is exactly why the replication factor is 3. So the hard part here is membership and recovery."',
      trap: 'Never calculating rebuild time. It is the number that justifies your replication factor, and without it that choice is just a convention you repeated.',
    },

    {
      id: 4,
      ask: 'Draw the boxes and arrows in words. Justify every box with a requirement from Stage 1 or a number from Stage 3.',
      nudges: [
        'How does a client find the node holding a key?',
        'What does one node look like inside — what is on disk, and in what shape?',
        'Where does agreement about membership live?',
      ],
      model: [
        '**Placement.** Consistent hashing with about 150 virtual nodes per physical node decides which N nodes own a key. Virtual nodes are not optional: with one position each, adding a machine unbalances the ring and losing one dumps its entire load on a single neighbour. The N owners are the next N distinct physical nodes clockwise.',
        '**Membership** lives in a small consensus group — three or five nodes running Raft — holding the ring, the node list and their states. This is exactly the right use of consensus: tiny, critical, low-volume metadata that everyone must agree on. Application traffic never goes near it. If it is unreachable, existing routing keeps working from cached views; only membership changes stop.',
        '**Routing.** Any node can act as coordinator. Clients cache the ring and go straight to an owner, and a node that receives a request for a key it does not own forwards it and tells the client to refresh. That saves a hop in the normal case and stays correct when the client is stale.',
        '**Inside one node**, which is the part that separates this from a hand-wave. Writes append to a write-ahead log and fsync — that is the durability promise. They also go into a sorted in-memory table. When that table is full it is flushed to disk as an immutable sorted file, and the log up to that point can be discarded. Reads check the memory table first, then the on-disk files newest to oldest. Because there can be many files, each carries a **bloom filter** so a read can skip a file it definitely is not in, without touching the disk — that one structure is what makes reads affordable in this design. Background **compaction** merges files and drops superseded values, which is the "hours of slack" work that must never block a read.',
        '**Quorum reads and writes.** With N replicas, a write is confirmed when W accept it and a read consults R. If W plus R is greater than N, any read touches at least one node that saw the latest write. Defaults of N=3, W=2, R=2 give strong-enough behaviour with one node down. Callers can lower W or R per request when they want speed instead.',
        '**Repair.** Read repair fixes divergence noticed during a read, cheaply and lazily. Background anti-entropy compares replicas using Merkle trees, so two nodes can find exactly which key ranges differ by exchanging a few hashes rather than every key — that is what makes repairing terabytes practical.',
      ],
      checklist: [
        'Consistent hashing with virtual nodes, and said why one position each fails',
        'Membership in a small consensus group; application traffic never touches it',
        'Clients cache the ring; any node can coordinate and forward',
        'Described the node internals: log, memory table, sorted files, compaction',
        'Bloom filter per on-disk file, and named what it saves',
        'Quorum formula stated, with W and R tunable per request',
        'Merkle trees for anti-entropy, and why hashes beat comparing keys',
      ],
      tradeoffs: [
        {
          decision: 'Log-structured storage with compaction',
          cost: 'Writes are sequential and fast, and reads may check several files, which is why bloom filters are mandatory. Compaction also causes periodic disk and CPU spikes.',
        },
        {
          decision: 'Quorum rather than a single leader per key',
          cost: 'Every operation talks to several nodes, so latency is set by the slowest of them. In exchange, no leader election is needed on the data path.',
        },
      ],
      sayThis:
        '"Consistent hashing with 150 virtual nodes decides ownership, and membership lives in a small Raft group that application traffic never touches. Inside a node it is a write-ahead log plus sorted files, with a bloom filter per file so a read skips files it cannot be in. W plus R greater than N gives me the overlap guarantee."',
      trap: 'Putting the data path through the consensus group. Consensus is for membership and metadata — pushing 500,000 operations a second through it will not work and shows you have not understood what it costs.',
    },

    {
      id: 5,
      ask: 'Pick the two hardest parts and go deep. After every decision, say what it costs.',
      nudges: [
        'Two clients write the same key at once. Who wins, and how do you know?',
        'A node fails. Walk through the next 18 hours.',
        'What does adding 50 machines to a live cluster actually involve?',
      ],
      model: [
        '**Hard part one: conflicting writes.** Two clients write the same key through different coordinators. Both succeed under quorum, and now replicas disagree. The tempting answer is last-write-wins by timestamp, and I would name it as a decision to lose data rather than as conflict resolution — two servers never agree on the time, so the write that genuinely happened second can carry the earlier stamp and be discarded silently. That is acceptable for a session blob and unacceptable for anything a user typed. The better answer is **version vectors**: each replica tracks its own counter, so comparing two versions tells you not just which is newer but whether they are genuinely concurrent. Concurrent versions are returned to the client as siblings, and the application resolves them — which is honest, because only the application knows whether two shopping carts should merge or one should win. Cost: clients must handle siblings, vectors grow with the number of writers and need pruning, and the API is harder to use. I would offer last-write-wins as an opt-in for callers who genuinely do not care.',
        '**Hard part two: a node fails, hour by hour.** Within seconds, failure detection — gossip between nodes plus the membership service — marks it suspect rather than dead, because a brief network blip must not trigger a terabyte-scale data movement. After a grace period it is marked down. Its key ranges are now at two replicas, so reads and writes continue at quorum with no interruption, which is the whole point of N=3. Writes destined for it are held as hints by peers. If it returns within the hint window, it replays them and catches up in minutes. If it does not, a replacement is brought in and streams 8 TB from its peers — 18 hours at throttled speed, deliberately throttled so the rebuild does not degrade live traffic. Throughout, that range is one failure from being down to a single copy, which is why I would prioritise rebuilding ranges that are already degraded and alert on time-spent-under-replicated rather than just on node count. Cost: the throttle trades a longer risk window for stable latency, and that balance is a real operational judgement.',
        '**Adding capacity.** Adding 50 nodes means each new node takes over arcs of the ring, and the data for those arcs streams from the current owners. Consistent hashing means only about a quarter of the data moves rather than nearly all of it, and virtual nodes mean the source load is spread over every existing machine rather than a few. This runs for many hours at low priority. Ownership transfers only once the new node has the data and has caught up, so there is never a moment where reads go to a node that does not have the key. Cost: the cluster is doing background transfer for days, and its capacity is temporarily reduced.',
        '**Backups, separately from replication.** Replication does not protect against a client writing garbage to a million keys, because it faithfully replicates the garbage. So snapshots of the immutable sorted files go to object storage — they are immutable, which makes them ideal to back up incrementally — and I would test restores rather than assume them.',
      ],
      checklist: [
        'Named last-write-wins as data loss, not conflict resolution',
        'Version vectors with siblings returned to the application to resolve',
        'Failure detection with a grace period, so a blip does not move terabytes',
        'Hinted handoff for brief outages, full stream for long ones',
        'Rebuild deliberately throttled, and the risk window named',
        'Alerted on time-spent-under-replicated rather than node count',
        'Backups separate from replication, because replication copies mistakes',
      ],
      tradeoffs: [
        {
          decision: 'Version vectors over last-write-wins',
          cost: 'Clients must handle siblings and the vectors need pruning. Worth it for user data; I would offer last-write-wins to callers who explicitly do not care.',
        },
        {
          decision: 'Throttled rebuild',
          cost: 'A longer window at reduced replication, in exchange for live traffic not degrading during recovery.',
        },
      ],
      sayThis:
        '"Concurrent writes produce siblings resolved by version vectors, because last-write-wins on user data is not conflict resolution, it is silent data loss from clocks that disagree. On a node failure, quorum keeps serving at two replicas while a throttled 18-hour rebuild runs — and I alert on time-under-replicated, not on node count."',
      trap: 'Saying "eventually consistent" and stopping. The interviewer wants to know what happens to two conflicting writes, and "they converge" is not an answer — converge to what?',
    },
  ],

  lifecycle: {
    caption:
      'A write\'s life inside the store. The log entry before the acknowledgement is what makes this a database rather than a cache.',
    states: [
      { id: 'recv', label: 'Received by coordinator', by: 'any node' },
      { id: 'route', label: 'Routed to N owners', by: 'ring' },
      { id: 'log', label: 'Logged + fsynced', by: 'each replica' },
      { id: 'ack', label: 'Acknowledged at W', by: 'coordinator' },
      { id: 'flush', label: 'Flushed to sorted file', by: 'background' },
      { id: 'compact', label: 'Compacted', by: 'background' },
    ],
    failures: [
      { after: 'route', label: 'Stale ring, wrong node', handling: 'node forwards and tells the client to refresh its view' },
      { after: 'log', label: 'Replica unreachable', handling: 'hinted handoff — a peer holds the write and delivers it on return' },
      { after: 'ack', label: 'Only W-1 responded', handling: 'not confirmed to the client, but partially applied — say so rather than hide it' },
      { after: 'ack', label: 'Two concurrent writes', handling: 'version vectors detect concurrency; siblings returned for the app to resolve' },
      { after: 'flush', label: 'Crash with data in memory', handling: 'replay the write-ahead log on restart — nothing confirmed is lost' },
      { after: 'compact', label: 'Node gone for a day', handling: 'hints expired, so full stream from peers — 18 hours, throttled' },
    ],
  },

  architecture: {
    caption:
      'Membership lives in a tiny Raft group that data traffic never touches. Inside a node: a log for durability, sorted files for reads, bloom filters so reads skip files.',
    nodes: [
      { id: 'c', label: 'Client', sub: 'caches the ring', kind: 'client', col: 0, row: 0 },
      { id: 'co', label: 'Coordinator', sub: 'any node', kind: 'service', col: 1, row: 0 },
      { id: 'r1', label: 'Replica 1', kind: 'store', col: 2, row: 0 },
      { id: 'r2', label: 'Replica 2', kind: 'store', col: 2, row: 1 },
      { id: 'r3', label: 'Replica 3', sub: 'down — hints held', kind: 'external', col: 2, row: 2 },
      { id: 'm', label: 'Membership', sub: 'Raft, 5 nodes', kind: 'service', col: 1, row: 1 },
      { id: 'w', label: 'WAL + memtable', kind: 'cache', col: 3, row: 0 },
      { id: 's', label: 'Sorted files', sub: 'bloom per file', kind: 'store', col: 4, row: 0 },
      { id: 'b', label: 'Backups', sub: 'object storage', kind: 'store', col: 4, row: 1 },
    ],
    edges: [
      { from: 'c', to: 'co' },
      { from: 'co', to: 'r1' },
      { from: 'co', to: 'r2' },
      { from: 'co', to: 'r3', dashed: true },
      { from: 'co', to: 'm', label: 'who owns?' },
      { from: 'r1', to: 'w' },
      { from: 'w', to: 's', label: 'flush' },
      { from: 's', to: 'b', label: 'snapshot' },
    ],
  },

  numbers: {
    caption: 'The rebuild window, not the throughput, is what sets your replication factor.',
    items: [
      { label: 'Per-node load', value: 10000, display: '~10,000 ops / sec — modest', tone: 'muted' },
      { label: 'Quorum write, one datacenter', value: 2, display: '~2 ms', tone: 'accent' },
      { label: 'Quorum write, cross-region', value: 80, display: '~80 ms — 40x worse', tone: 'bad' },
      { label: 'Rebuilding one 8 TB node', value: 18, display: '~18 hours at two copies', tone: 'bad' },
    ],
    note: 'So the hard part is membership and recovery. Each node is barely working; agreeing who owns what while machines come and go, and staying safe for 18 hours at reduced replication, is the design.',
  },

  compare: {
    caption: 'What to do when two writes to one key genuinely conflict.',
    a: {
      title: 'Last-write-wins by timestamp',
      points: [
        'Trivial to implement, and every read returns exactly one value.',
        'Depends on clocks agreeing, and they never do.',
        'The write that really happened second can carry the earlier stamp and be discarded.',
        'The loss is silent — no error, no log line, nothing to alert on.',
        'Honest use: disposable values like a session blob or a presence flag.',
      ],
    },
    b: {
      title: 'Version vectors with siblings',
      points: [
        'Tells you whether one version is newer, or whether they are genuinely concurrent.',
        'Concurrent versions are handed to the application, which is the only layer that knows how to merge them.',
        'No silent loss — a conflict becomes a decision somebody makes.',
        'Vectors grow with the number of writers and need pruning.',
        'Clients get a harder API: a read can return more than one value.',
      ],
    },
    verdict:
      'Version vectors by default for anything a user created, with last-write-wins available as an opt-in for callers who genuinely do not care. The sentence worth saying: last-write-wins is not conflict resolution, it is a decision to lose one side, and it should be made deliberately rather than inherited from a default.',
  },

  followUps: [
    'kill-half',
    'consistency-simultaneous',
    'scale-write-ceiling',
    'kill-network',
    'choice-one-machine',
    'ops-capacity',
    'cost-multi-region',
    'scope-multiregion',
  ],
}
