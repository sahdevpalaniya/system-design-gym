import type { Problem } from '@/lib/types'

export const DISTRIBUTED_MESSAGE_QUEUE: Problem = {
  slug: 'distributed-message-queue',
  searchTitle: 'Design a distributed message queue',
  solutionTitle: 'Distributed message queue system design: worked solution',
  solutionDescription:
    'Distributed message queue system design, solved: partitioned logs, replication, consumer groups and offsets, delivery guarantees, retention and failure drills.',
  title: 'Distributed message queue',
  navTitle: 'Message queue',
  group: 'storage-engine',
  difficulty: 'hard',
  concepts: [
    'message-queues',
    'partitioning',
    'replication',
    'write-ahead-log',
    'consensus',
    'idempotency',
    'back-of-envelope',
    'batch-vs-stream',
    'observability',
  ],
  prompt:
    'Design a distributed message queue: the broker itself, not a service that uses one. Producers publish messages to named topics, several independent consumer groups read them, messages survive machine failures, and the system carries hundreds of thousands of messages a second.',

  slack: {
    budget: 'Publish: a few milliseconds to tens of milliseconds. Consumption: seconds behind is normal. Rebalancing, retention and repair: hours.',
    headline:
      'A queue exists to create slack for everyone else, so its own publish path has very little. The one place it can trade time is durability: confirm a message before or after the replicas have it.',
    body: [
      'Producers are usually inside someone\'s request path: an order service publishes "order placed" before it answers the user. If publishing takes 200 ms, every caller of every producer is 200 ms slower. So the broker must accept and confirm writes quickly, which rules out anything heavy, like a per-message database transaction or a consensus round per message.',
      'Consumers are the opposite. A consumer group that is two seconds behind is healthy; one that is ten minutes behind after a deploy is fine as long as it catches up. The whole point of the queue is that consumers can be slower than producers for a while, so consumption has lots of slack, and so do background jobs like deleting old data and moving partitions between machines.',
      'Durability is where the slack gets spent or saved. Confirming a write when one machine has it is fast and loses data when that machine dies. Confirming when three machines have it costs a replication round trip on every publish, forever. That is a per-topic choice, because a click stream and a payment event do not deserve the same promise.',
    ],
    consequence:
      'Writes are sequential appends to a log, confirmed after a configurable number of replicas have them. Consumption is pull-based and tracked by an offset per consumer group, so slow consumers cost nothing but disk. Everything else runs in the background at low priority.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that would change a box, and propose the scope.',
      nudges: [
        'Does every consumer need to see every message, or does each message go to one worker?',
        'Ordering: across the whole topic, or only for messages with the same key?',
        'What may be lost, and what may be duplicated?',
      ],
      model: [
        'Assumptions: an internal platform used by many teams. Producers publish small messages (around 1 KB) to named topics. Several consumer groups read each topic independently, for example a search indexer, an analytics loader and a notifier all reading "orders". Messages are kept for seven days so a consumer can replay after a bug. Peak around a million messages a second across all topics.',
        'The question that changes the storage design: is this a **log** or a **work queue**? In a work queue, each message goes to one consumer and is deleted once acknowledged, so the broker tracks every message\'s state. In a log, messages stay for the retention period and each consumer group just remembers a position (an offset). The log makes several independent consumers and replay nearly free, and it is what lets throughput reach the numbers above. I will design a log, and offer work-queue behaviour on top through consumer groups.',
        'Second question: what ordering do producers need? A total order across a whole topic means one writer and one reader at a time, which caps throughput at one machine. What applications almost always need is order per key: all events for order 123 in sequence. I will promise ordering within a partition, and route messages by key, so per-key order holds.',
        'Third: delivery guarantee. I will default to at-least-once (a message is never lost once confirmed, but a consumer may see it twice after a failure) and say plainly that consumers must be idempotent. Exactly-once processing inside the log is possible with more machinery; exactly-once effects on outside systems are the consumer\'s job.',
        'Scope I propose: publish, storage and replication, consumer groups and offsets, retention, and failure handling. Out of scope: cross-region replication, schema management, delayed or priority messages, and a management UI.',
      ],
      checklist: [
        'Asked log versus work queue and named what each does to storage',
        'Scoped ordering to per key (per partition) rather than per topic, and said why',
        'Chose a delivery guarantee and made consumer idempotency an explicit requirement',
        'Stated retention and replay as requirements, with a number',
        'Proposed a scope and left something out on purpose',
      ],
      tradeoffs: [
        {
          decision: 'A log with consumer offsets instead of per-message acknowledgement',
          cost: 'No per-message delete or redelivery of one message by itself; a slow or stuck message blocks its partition for that consumer group. In exchange, many groups and replay cost almost nothing.',
        },
      ],
      sayThis:
        '"I will build a partitioned log. Order is promised per partition, and producers choose the partition by key, so all events for one order stay in sequence. Delivery is at-least-once, so consumers must be idempotent. Each consumer group tracks its own offset, which makes replay and extra consumers nearly free."',
      trap: 'Promising global ordering and exactly-once delivery up front. Both sound good and both make the system far slower or impossible; say what you promise instead.',
    },

    {
      id: 2,
      ask: 'List the actors, including the system, then write a message\'s life as a chain of states, and add the failure branches.',
      nudges: [
        'When exactly is a message "safe"? When one machine has it, or more?',
        'What happens if a consumer processes a message and crashes before saying so?',
        'What happens to a consumer that falls further behind than the retention period?',
      ],
      model: [
        'Actors: producers, the broker that leads each partition, follower brokers holding replicas, consumer group members, and a small controller that decides which broker leads which partition. The controller is the actor that acts on its own: when a broker dies, it picks new leaders without anyone asking.',
        'The chain: produced by a client → appended to the partition leader\'s log → copied by the in-sync followers → committed (every in-sync replica has it) → confirmed to the producer → fetched by a consumer → processed → offset committed by the consumer group → deleted when its segment ages past retention.',
        'Failure branches. Producer times out after the leader wrote the message: it retries, and without protection the message is stored twice. The fix is an idempotent producer: each producer has an id and numbers its messages per partition, and the leader drops a sequence number it has already appended. Leader dies after confirming but before followers copied: if the producer asked for leader-only confirmation, that message is gone, which is why important topics confirm only after the in-sync replicas have it. Consumer crashes after processing but before committing its offset: the next owner of that partition starts from the last committed offset and processes the message again. That is at-least-once, and why consumers must be idempotent. Committing the offset before processing flips it to at-most-once: a crash loses the message instead.',
        'The branch the system owns: a consumer group that falls behind further than the retention period. Retention deletes the oldest segments on schedule, whether or not anyone read them, so that group silently skips data. The system must alert on lag measured against retention, long before it gets there. Another branch: a poison message that crashes the consumer every time. With a log it blocks its whole partition for that group, so after a few attempts it goes to a dead-letter topic and the offset moves on.',
      ],
      checklist: [
        'Defined "committed" as present on every in-sync replica, and tied confirmation to it',
        'Producer retry duplicates fixed with producer ids and sequence numbers',
        'Consumer crash before offset commit leads to reprocessing (at-least-once)',
        'Offset commit before processing leads to loss (at-most-once), and said which you chose',
        'Lag compared against retention, with an alert',
        'Poison message moved to a dead-letter topic so the partition is not blocked',
      ],
      trap: 'Ending the chain at "consumer receives it". The interesting failures are between processing and committing the offset.',
    },

    {
      id: 3,
      ask: 'Estimate throughput, storage, partitions and machines. Then finish: "So the hard part here is ___."',
      nudges: [
        'Every byte is written more than once. How many times?',
        'Seven days of retention: how many terabytes is that, with replicas?',
        'How many consumers can one group run in parallel, and what limits it?',
      ],
      model: [
        'Peak 1 million messages a second at about 1 KB is about 1 GB/s coming in. With three replicas, the cluster writes 3 GB/s to disk and moves 2 GB/s between brokers for replication. If three consumer groups read everything, that is another 3 GB/s going out. Network, not CPU, is the first thing to size.',
        'Storage uses the average, not the peak. Say the average is a third of peak, about 330 MB/s. A day is roughly 100,000 seconds, so about 33 TB a day, 230 TB for seven days, and about 700 TB with three replicas. At around 20 TB of usable disk per broker that is 35 or more brokers for storage alone, while throughput alone might need a dozen. So retention decides the cluster size.',
        'Partitions set the parallelism. Within a consumer group, each partition is read by one member at a time, so a group can never use more consumers than there are partitions. If one consumer can process 5,000 messages a second and the busiest topic peaks at 500,000 a second, that topic needs at least 100 partitions, and more for headroom, because adding partitions later moves which partition each key maps to, which breaks per-key order for a while.',
        'Writes are sequential appends and reads are mostly sequential scans of recent data that is still in the operating system\'s page cache. A single disk that manages a few hundred random operations a second can sustain hundreds of MB/s sequentially. The design depends on keeping both paths sequential.',
        'So the hard part here is replication and retention at disk and network speed, while keeping per-key order. Moving bytes is the workload; the design is about never touching them more than necessary.',
      ],
      checklist: [
        'Multiplied ingress by the replication factor for disk and network',
        'Counted consumer egress per consumer group',
        'Sized retention storage from the average rate, including replicas',
        'Derived a partition count from per-consumer throughput',
        'Noted that adding partitions later remaps keys and disturbs ordering',
        'Finished the sentence: replication and retention at disk and network speed, with per-key order',
      ],
      tradeoffs: [
        {
          decision: 'Over-provisioning partitions up front',
          cost: 'More files, more leaders for the controller to track, and slower failover per broker. Accepted, because adding partitions later disturbs key-to-partition mapping.',
        },
      ],
      sayThis:
        '"A gigabyte a second in becomes three on disk and two across the network for replication, plus whatever the consumer groups read. Seven days of retention is around 700 TB with replicas, so storage, not throughput, sets the broker count. The busiest topic needs at least 100 partitions, or the consumers cannot keep up."',
      trap: 'Sizing only ingress. Replication and fan-out to consumer groups multiply it several times over.',
    },

    {
      id: 4,
      ask: 'Draw the boxes and arrows in words. Justify every box with a requirement from Stage 1 or a number from Stage 3.',
      nudges: [
        'What does one partition look like on disk?',
        'Who decides which broker leads a partition, and where is that decision stored?',
        'Where does a consumer group keep its position?',
      ],
      model: [
        '**Topics split into partitions**, each an ordered, append-only log. A partition is the unit of ordering, replication and consumer parallelism, which is exactly what Stage 1 and Stage 3 asked for. On disk, a partition is a series of segment files (say 1 GB each) plus a small index from offset to file position. Appending is a write to the end of the active segment; retention deletes whole old segments, which is cheap.',
        '**Producers** use a client library that batches messages per partition for a few milliseconds, compresses each batch, and picks the partition by hashing the key (or spreads keyless messages evenly). Batching is what makes a million small messages a second affordable: the broker handles thousands of batches, not a million requests.',
        '**Brokers** each hold many partition replicas. For each partition one replica is the leader, which takes all writes and, by default, all reads. Followers fetch from the leader like consumers do and append the same bytes. Leaders are spread across brokers so the load is too. Fetches are served largely from the page cache, and the bytes can go from file to socket without being copied through the application.',
        '**A controller** backed by a small consensus group (three or five nodes running Raft) stores the metadata: topics, partitions, which broker leads each one, and which replicas are in sync. It is the only place that decides a new leader. Message traffic never goes through it; it handles only metadata, which is what consensus is good at.',
        '**Consumer groups.** A coordinator assigns each partition of a topic to exactly one member of the group, and reassigns when members join, leave or stop sending heartbeats. Each group commits its offsets per partition into an internal, compacted topic, so positions are themselves replicated and durable without a separate database.',
        '**Retention and compaction.** Time- or size-based retention deletes old segments. For topics that represent the latest state per key (a user\'s current address), log compaction keeps only the newest message per key instead, which is also how the offsets topic stays small.',
      ],
      checklist: [
        'Partition as the unit of order, replication and parallelism, stored as segment files plus an index',
        'Producer-side batching, compression and key-based partitioning',
        'One leader per partition; followers fetch; leaders spread across brokers',
        'Metadata and leader election in a small consensus group, off the data path',
        'Consumer group coordinator assigning partitions, offsets stored in a replicated internal topic',
        'Retention by deleting whole segments; compaction for latest-value topics',
      ],
      tradeoffs: [
        {
          decision: 'Pull-based consumers instead of the broker pushing',
          cost: 'Consumers poll and add a little latency when idle. In exchange, each consumer controls its own pace, batches its fetches, and a slow consumer never makes the broker buffer for it.',
        },
        {
          decision: 'Reads served only by partition leaders',
          cost: 'Leaders carry all the read load for their partitions. In exchange, a consumer can never read a message that is not yet committed or that a failover might discard.',
        },
      ],
      sayThis:
        '"Each partition is an append-only log in 1 GB segment files, led by one broker and followed by two others. A small Raft group stores which broker leads what, and message traffic never touches it. Consumer groups get partitions assigned by a coordinator and commit offsets to an internal compacted topic."',
      trap: 'Putting every message through the consensus group. Consensus is for the metadata; a Raft round per message caps the whole cluster at one leader\'s speed.',
    },

    {
      id: 5,
      ask: 'Pick the two hardest parts and go deep. After every decision, say what it costs.',
      nudges: [
        'A leader dies. Which messages are guaranteed to survive, and who decides the new leader?',
        'How do you get exactly-once, and where does that promise stop?',
        'What happens to consumption while a group rebalances?',
      ],
      model: [
        '**Hard part one: replication and leader failover.** The leader keeps a list of in-sync replicas (ISR): followers that have caught up within a time limit. A message is committed when every replica in the ISR has it, and the leader tracks this as a high watermark; consumers only see messages below it. A producer that asks for confirmation from all in-sync replicas, on a topic configured to require at least two of them, gets a confirmation that survives the loss of any one broker. When the leader dies, the controller picks a new leader from the ISR, so no committed message is lost, and bumps a leader epoch so the old leader, if it comes back, is fenced and truncates anything it wrote that was never committed. Cost: every publish waits for the slowest in-sync follower, and if the ISR shrinks below the minimum, the partition refuses writes rather than accept them unsafely.',
        'The setting interviewers probe here: what if every in-sync replica is gone? Waiting for one to return keeps every committed message and leaves the partition unavailable until then. Electing an out-of-sync replica restores service at once and silently discards whatever it was missing. That is the CAP trade-off as a single configuration flag, and the right answer differs for a click stream and a payments topic.',
        '**Hard part two: delivery semantics.** At-most-once: commit the offset, then process; a crash loses the message. At-least-once: process, then commit; a crash reprocesses it. Exactly-once within the log: the idempotent producer removes duplicate writes from retries, and transactions let a consumer write its output messages and its input offset atomically, so a read-process-write pipeline inside the queue neither loses nor repeats. Once a consumer touches the outside world (charges a card, sends an email), the queue cannot make that exactly-once. The consumer has to: store an idempotency key with the side effect, or record the processed offset in the same database transaction as its result. Cost: transactions add latency and coordination, so they are opt-in per producer.',
        '**Rebalancing and hot partitions.** When a member joins or leaves, partitions move between members. A simple protocol pauses the whole group while it reassigns, which shows up as a lag spike on every deploy; an incremental protocol moves only the partitions that need to move. A key that is far hotter than others (one huge customer) overloads its partition and its consumer, and adding partitions does not help, because one key always maps to one partition. Options are to split that key with a suffix where per-key order is not needed, or give that customer its own topic. Cost: either breaks strict ordering for that key, or adds operational special cases.',
        '**What to watch.** Consumer lag per group and partition, and lag compared with retention; ISR shrink events and partitions below minimum in-sync replicas; publish latency at p99; disk usage against retention; and controller leader changes. Lag is the number the product teams feel.',
      ],
      checklist: [
        'In-sync replicas and the high watermark define "committed"',
        'Confirmation from all in-sync replicas plus a minimum ISR of two',
        'New leader chosen from the ISR; leader epoch fences the old leader',
        'Named the unclean leader election trade-off as availability versus losing data',
        'At-most-once, at-least-once and exactly-once within the log, each by mechanism',
        'Exactly-once side effects outside the queue are the consumer\'s job (idempotency key or offset in the same transaction)',
        'Rebalance pauses and hot keys, with a mitigation and its cost',
      ],
      tradeoffs: [
        {
          decision: 'Requiring at least two in-sync replicas for important topics',
          cost: 'If two of three replicas are down, the partition stops accepting writes. Correct for payments; probably wrong for a metrics stream.',
        },
        {
          decision: 'Offering transactions for exactly-once pipelines',
          cost: 'Extra latency and a coordinator on the write path, so they are opt-in rather than the default.',
        },
      ],
      sayThis:
        '"A message is committed when every in-sync replica has it, and producers on important topics wait for exactly that, with a minimum of two in sync. On failover the controller picks a new leader from the in-sync set and fences the old one with an epoch. Delivery is at-least-once; consumers that touch the outside world store an idempotency key with the side effect, because the queue cannot make an email exactly-once."',
      trap: 'Claiming the queue gives exactly-once delivery end to end. It can within the log; the consumer\'s side effects are still at-least-once unless the consumer makes them idempotent.',
    },
  ],

  refs: [
    {
      label: 'Apache Kafka documentation — Design',
      href: 'https://kafka.apache.org/documentation/#design',
      note: 'A production log-based queue explained by its authors: persistence on the file system, batching, replication and in-sync replicas, delivery semantics.',
    },
    {
      label: 'Jay Kreps — The Log',
      href: 'https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying',
      note: 'Why an append-only log is the right abstraction for moving data between systems.',
    },
    {
      label: 'RabbitMQ — Reliability guide',
      href: 'https://www.rabbitmq.com/docs/reliability',
      note: 'The work-queue side: acknowledgements, publisher confirms and what each protects against.',
    },
    {
      label: 'Avoiding insurmountable queue backlogs',
      href: 'https://aws.amazon.com/builders-library/avoiding-insurmountable-queue-backlogs/',
      note: 'What happens to consumers and producers when a queue falls behind and stays behind.',
    },
  ],

  lifecycle: {
    caption:
      'A message is safe once it is committed (every in-sync replica has it), and processed once its consumer group has committed an offset past it. The failures live between those points.',
    states: [
      { id: 'produced', label: 'Produced', by: 'producer' },
      { id: 'appended', label: 'Appended to leader log', by: 'leader broker' },
      { id: 'committed', label: 'Committed (all in-sync replicas)', by: 'followers' },
      { id: 'fetched', label: 'Fetched by a consumer', by: 'consumer' },
      { id: 'processed', label: 'Processed + offset committed', by: 'consumer group' },
      { id: 'deleted', label: 'Deleted by retention', by: 'system' },
    ],
    failures: [
      { after: 'produced', label: 'Producer timed out and retried', handling: 'producer id + sequence number; the leader drops the duplicate' },
      { after: 'appended', label: 'Leader died before followers copied', handling: 'confirm only after the in-sync replicas have it; otherwise this message is lost' },
      { after: 'committed', label: 'Leader died after commit', handling: 'controller elects a new leader from the in-sync set; epoch fences the old leader' },
      { after: 'fetched', label: 'Consumer crashed before committing its offset', handling: 'next owner reprocesses from the last offset; consumer must be idempotent' },
      { after: 'fetched', label: 'Poison message crashes the consumer every time', handling: 'after N attempts, move it to a dead-letter topic and advance the offset' },
      { after: 'processed', label: 'Group fell behind past retention', handling: 'lag-versus-retention alert fires long before data is deleted unread' },
    ],
  },

  architecture: {
    caption:
      'Partitions are logs replicated across brokers. A small consensus group holds the metadata and never sees message traffic. Consumer groups pull and track their own offsets.',
    nodes: [
      { id: 'p', label: 'Producers', sub: 'batch, compress, hash key', kind: 'client', col: 0, row: 1 },
      { id: 'l', label: 'Partition leader', sub: 'append-only segments', kind: 'store', col: 1, row: 1 },
      { id: 'f1', label: 'Follower', sub: 'in-sync replica', kind: 'store', col: 2, row: 0 },
      { id: 'f2', label: 'Follower', sub: 'in-sync replica', kind: 'store', col: 2, row: 2 },
      { id: 'ctl', label: 'Controller', sub: 'Raft: leaders, ISR, topics', kind: 'service', col: 1, row: 0 },
      { id: 'cg', label: 'Consumer group', sub: 'one member per partition', kind: 'service', col: 3, row: 1 },
      { id: 'off', label: 'Offsets topic', sub: 'compacted, replicated', kind: 'queue', col: 3, row: 2 },
    ],
    edges: [
      { from: 'p', to: 'l', label: 'produce' },
      { from: 'f1', to: 'l', label: 'fetch' },
      { from: 'f2', to: 'l', label: 'fetch' },
      { from: 'ctl', to: 'l', label: 'who leads', dashed: true },
      { from: 'cg', to: 'l', label: 'pull' },
      { from: 'cg', to: 'off', label: 'commit offset' },
    ],
  },

  numbers: {
    caption: 'Ingress is the smallest number on the page. Replication, consumer fan-out and retention multiply it.',
    items: [
      { label: 'Peak ingress (1M msg/s × 1 KB)', value: 1, display: '~1 GB/s', tone: 'muted' },
      { label: 'Written to disk across the cluster (3 replicas)', value: 3, display: '~3 GB/s', tone: 'accent' },
      { label: 'Seven days of retention, with replicas', value: 700, display: '~700 TB: this sets the broker count', tone: 'bad' },
    ],
    note: 'So the hard part is moving and keeping bytes at disk and network speed, sequentially, while preserving per-key order. CPU is rarely the limit.',
  },

  flow: {
    scenario: 'duplicate-delivery',
    caption:
      'At-least-once in action: the consumer processed the message but crashed before committing its offset, so the next owner of the partition processes it again. The consumer has to make that harmless.',
  },

  followUps: [
    'kill-worker-mid-job',
    'scale-hot-key',
    'kill-half',
    'consistency-ordering',
    'consistency-retry',
    'ops-capacity',
    'cost-storage-growth',
    'choice-build-buy',
  ],
}
