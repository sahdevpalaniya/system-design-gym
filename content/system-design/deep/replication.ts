import type { DeepDive, WorkedExample } from '@/lib/types'

export const REPLICATION_DEEP: DeepDive = {
  intro:
    'The summary said "keep copies and decide who is allowed to write". That is true and it hides every decision that matters. This page covers the three topologies and when each is actually right, the exact difference synchronous replication makes to your data loss window, what happens second by second during a failover, split brain and how fencing prevents it, replication lag and the four ways to hide it from users, and the failure modes that only appear at three in the morning.',
  minutes: 20,
  sections: [
    {
      heading: 'The three topologies, and which one you actually want',
      body: [
        'Every replication scheme is one of three shapes, and the difference between them is simply where writes are allowed. That single question decides whether conflicts are possible at all.',
        '**Single leader** allows writes in exactly one place. **Multi-leader** allows writes in several places, usually one per region. **Leaderless** allows writes to any node and uses quorums to keep them consistent. Almost every design should use the first one, and the interesting part is being able to say why the other two are not needed.',
      ],
      points: [
        'Single leader: no conflicts are possible by construction, because there is only one writer. This is the default and it is what a normal relational database gives you.',
        'Multi-leader: local writes are fast in every region, and now the same row can be edited in two places, so you own a conflict problem forever.',
        'Leaderless: no leader to fail over, tunable durability, and conflict handling is pushed onto the application.',
        'The write ceiling is the same for all three: replication never adds write capacity, because every replica does every write.',
        'If you cannot name a specific reason single leader fails you, single leader is the answer.',
      ],
      table: {
        caption: 'What each topology costs you, honestly.',
        headers: ['', 'Single leader', 'Multi-leader', 'Leaderless'],
        rows: [
          ['Write conflicts', 'Impossible', 'Your problem, forever', 'Your problem, tunable'],
          ['Write latency', 'Remote users pay the trip', 'Local everywhere', 'Local-ish, quorum-bound'],
          ['Failover', 'Needed, and risky', 'Not needed', 'Not needed'],
          ['Operational load', 'Low', 'High', 'Medium'],
          ['Right for', 'Almost everything', 'Offline-first, per-region data', 'Very large key-value stores'],
        ],
      },
      callouts: [
        {
          variant: 'trap',
          text: 'Proposing multi-leader for "high availability" without a conflict resolution story. The conflict story *is* the question, and the follow-up will go straight to it.',
        },
      ],
    },
    {
      heading: 'Synchronous, asynchronous, and the honest middle',
      body: [
        'This is the single most consequential knob in replication, because it decides exactly how much confirmed data you lose when the leader dies.',
        '**Asynchronous**: the leader confirms the write as soon as it is durable locally, and ships it to followers afterwards. Writes are fast. If the leader dies before shipping, whatever it had not sent is gone — and it was confirmed to a user, which is the uncomfortable part.',
        '**Synchronous**: the leader does not confirm until at least one follower has the write too. Nothing confirmed is ever lost. But now every write waits for the follower, and if that follower is slow or down, writes stop entirely — so a fully synchronous setup has made your availability worse, not better.',
        '**Semi-synchronous** is what real systems run: one follower synchronous, the rest asynchronous. You get durability against losing the leader without depending on all of them, and if the synchronous follower fails, another is promoted into that role.',
      ],
      points: [
        'Asynchronous replication means your data loss window equals your replication lag. Say that number out loud.',
        'Fully synchronous replication to all followers means the slowest follower sets your write latency and any follower being down stops writes.',
        'Semi-synchronous — one synchronous, rest asynchronous — is the default worth proposing.',
        'Cross-region synchronous replication costs 80 ms or more per write, permanently. That is a product decision, not a configuration one.',
        'A write confirmed to a user and then lost in failover is the worst outcome in this whole topic, because there is no error anyone can see.',
      ],
      visuals: [
        {
          type: 'numbers',
          numbers: {
            caption: 'What each choice costs on a normal day, and what it loses on a bad one.',
            items: [
              { label: 'Async — added write latency', value: 0, display: '~0 ms, loses up to lag on failover', tone: 'accent' },
              { label: 'Semi-sync, same datacenter', value: 1, display: '~1 ms, loses nothing confirmed', tone: 'muted' },
              { label: 'Sync across regions', value: 80, display: '~80 ms on every write, forever', tone: 'bad' },
            ],
            note: 'The third row is the one people propose without pricing. It is not a failure-time cost — you pay it on every write, on every good day, for the life of the system.',
          },
        },
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Two async followers plus one semi-sync, so a failover does not lose committed writes. Cost: about a millisecond on every write, and if the sync follower is unhealthy I promote another into that role rather than letting writes block."',
        },
      ],
    },
    {
      heading: 'Failover, second by second',
      body: [
        'Failover is not a switch. It is a sequence, and every step in it has a cost that shows up as downtime or as lost data. Being able to talk through it is what separates someone who has run a database from someone who has read about one.',
        'The sequence: the leader stops responding. Something notices, after a detection timeout. A new leader is chosen. The rest are told. Clients discover the change. Writes resume. Then, later and much harder, the old leader comes back and has to be dealt with.',
      ],
      points: [
        'Detection has a timeout, and that timeout is pure downtime. Too short and a network blip triggers a failover; too long and you are down while everything is fine.',
        'Choosing a new leader must be done by majority agreement, or two nodes can both believe they won.',
        'Clients must be redirected — through a proxy, a virtual IP, or a service discovery layer. DNS is too slow for this.',
        'Anything the old leader accepted and had not replicated is gone. Someone has to decide whether that is acceptable, in advance.',
        'The old leader returning is the dangerous moment, not the failure itself.',
      ],
      visuals: [
        {
          type: 'diagram',
          diagram: {
            caption:
              'The old leader was never dead — only unreachable. Without fencing, it comes back still believing it is leader, and now two nodes accept writes.',
            nodes: [
              { id: 'c', label: 'Clients', kind: 'client', col: 0, row: 1 },
              { id: 'old', label: 'Old leader', sub: 'still accepting writes', kind: 'external', col: 1, row: 0 },
              { id: 'new', label: 'New leader', sub: 'promoted by majority', kind: 'service', col: 1, row: 2 },
              { id: 's', label: 'Storage', sub: 'rejects stale epoch', kind: 'store', col: 2, row: 1 },
              { id: 'n', label: 'fencing token: every write carries an epoch, and the old one is refused', kind: 'note', col: 0, row: 2, span: 2 },
            ],
            edges: [
              { from: 'c', to: 'old', dashed: true },
              { from: 'c', to: 'new' },
              { from: 'old', to: 's', label: 'epoch 4 — refused', dashed: true },
              { from: 'new', to: 's', label: 'epoch 5 — accepted' },
            ],
          },
        },
      ],
      callouts: [
        {
          variant: 'cost',
          text: 'Aggressive detection reduces downtime and increases the chance of failing over during a brief network blip — which can cause an outage that would never have happened. There is no setting that avoids both.',
        },
        {
          variant: 'trap',
          text: 'Saying "it fails over automatically" with no detection window, no majority requirement and no fencing. Each of those omissions is a separate incident waiting to happen.',
        },
      ],
    },
    {
      heading: 'Split brain, and how fencing actually stops it',
      body: [
        'Split brain is the failure that makes people afraid of automatic failover, and it is worth understanding precisely rather than as a scary phrase.',
        'The setup: the leader is healthy but the network between it and the rest is broken. From the cluster\'s point of view the leader is dead, so it promotes a new one. From the leader\'s point of view everything is fine and it keeps accepting writes. Now two nodes are taking writes for the same data, and the histories diverge in ways that cannot be merged afterwards.',
        'Two defences, and you need both. **Majority**: only a node that can reach more than half the cluster may be leader, so the isolated side stops accepting writes on its own. **Fencing**: every leadership term gets an increasing number, every write carries it, and the storage layer refuses any write with an old number. Majority prevents the promotion; fencing catches the case where the old leader was paused rather than partitioned and wakes up mid-write.',
      ],
      points: [
        'Majority alone is not enough, because a paused process — a long garbage collection, a frozen VM — can resume believing it is still leader and still within its lease.',
        'A fencing token is a number that only goes up, presented with every write and checked by the thing being written to.',
        'If you cannot fence, make the operation safe to repeat. That is usually easier and it is the better interview answer.',
        'Even-numbered clusters are worse than odd ones: four nodes tolerate the same single failure as three, while being slower.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Promotion requires a majority, and every leadership term carries an epoch number that storage checks — so if the old leader wakes up mid-write, its write is refused rather than accepted. Without fencing, a paused process is enough to cause split brain even with majority promotion."',
        },
      ],
    },
    {
      heading: 'Replication lag and the four ways to hide it',
      body: [
        'Lag is not a bug you fix, it is a property you design around. Asynchronous replication means followers are always behind, usually by milliseconds and occasionally by minutes when something is wrong.',
        'Users notice lag in three specific ways, and each has its own fix. They do not see their own write. They see time go backwards between two page loads. Or they see an effect before its cause — a reply above the comment it answers.',
      ],
      points: [
        'Read your own writes: route a user to the leader for a short window after they write, or track the write position and read from a replica that has caught up to it.',
        'Monotonic reads: pin a user to one replica so they never see a value older than one they already saw.',
        'Consistent prefix: route causally related writes through one partition, so a reply cannot arrive before the comment.',
        'The cheapest fix of all: render what the client already has instead of re-fetching. No replica involvement at all.',
        'Alert on lag, because a lag of 30 seconds is almost always a symptom — a long transaction, a bulk write, or a follower that cannot keep up.',
      ],
      compare: {
        caption: 'Two ways to give a user read-your-own-writes, and what each costs.',
        a: {
          title: 'Pin to the leader after a write',
          points: [
            'Simple: mark the session for ten seconds and send its reads to the leader.',
            'Works for every read that user makes, including ones you did not anticipate.',
            'Leader read load rises, driven by exactly your most active users.',
            'The window is a guess — too short and the bug returns, too long and the leader carries more.',
          ],
        },
        b: {
          title: 'Track the write position',
          points: [
            'The client carries the position it saw; reads wait for a replica at least that current.',
            'Precise — no guessed window, and no unnecessary leader load.',
            'Reads can now block, which is a new latency risk on a path that used to be fast.',
            'Every client and every read path has to carry and honour the token.',
          ],
        },
        verdict:
          'Start with leader pinning because it is two lines and it works. Move to write positions when leader read load becomes the problem, which is a real and measurable trigger rather than a guess.',
      },
      callouts: [
        {
          variant: 'cost',
          text: 'Every one of these fixes moves load onto the leader or adds a wait. There is no version where you get replicas for free and no user ever sees stale data.',
        },
      ],
    },
    {
      heading: 'The failure modes nobody plans for',
      body: [
        'These are the ones that produce three-in-the-morning incidents, and mentioning even one of them signals real experience.',
      ],
      points: [
        'A follower falls so far behind that the leader has discarded the log it needs. Its only recovery is a full rebuild from a snapshot — hours, not minutes.',
        'A long-running read on a replica blocks replication from applying, so the replica falls further behind exactly while someone is running a report on it.',
        'Failover promotes a follower that was behind, so the new leader is missing writes the old one had confirmed. This is silent unless you are checking.',
        'The read replica everyone uses for analytics is also the semi-synchronous one, so a heavy query slows down every write in the system.',
        'Schema changes replicate too, and a change that is fast on the leader can lock a follower for minutes.',
        'Adding a replica puts real load on the leader while it streams the initial snapshot. Doing it during peak makes an existing problem worse.',
      ],
      callouts: [
        {
          variant: 'trap',
          text: 'Treating replicas as free read capacity. Every replica does every write, consumes leader bandwidth, and adds an operational surface — the capacity is real but so is the cost.',
        },
        {
          variant: 'say-this',
          text: '"I would alert on replication lag rather than only on replica health, because a replica that is up and 40 seconds behind is serving wrong answers while looking perfectly healthy on every dashboard."',
        },
      ],
    },
  ],
}

export const REPLICATION_EXAMPLE: WorkedExample = {
  title: 'A user posts a comment and it disappears',
  scenario:
    'Support has 40 tickets this week saying "I posted a comment and it vanished, then came back later". Your database is one leader with three asynchronous read replicas, and all reads go to replicas through a load balancer. Nothing is down. Every dashboard is green.',
  steps: [
    {
      step: 'Reproduce the shape, not the bug',
      detail:
        'It is not reproducible on demand, which is itself the clue: it depends on timing rather than on data. The write goes to the leader; the refresh a moment later is served by whichever replica the load balancer picked. If that replica has not applied the write yet, the comment is not there. It appears "later" because a subsequent refresh happens to land on a caught-up replica.',
    },
    {
      step: 'Check the lag, and check its shape',
      detail:
        'Median lag is 15 ms, which is fine. But p99 lag is 4 seconds, and there are spikes to 30. The average hid the problem entirely. The spikes line up with a nightly bulk import and with a long analytics query someone runs on one replica — which blocks that replica from applying replication while it runs.',
    },
    {
      step: 'Fix the user-visible symptom first',
      detail:
        'Pin a user to the leader for ten seconds after they write. Two lines in the routing layer, and it removes the entire class of complaint immediately. Measure the extra leader read load before and after — it is small, because only actively-writing users are affected, and they are a minority at any moment.',
    },
    {
      step: 'Then fix the cause of the spikes',
      detail:
        'Move the analytics query to a dedicated replica that no user traffic touches, so a heavy report can no longer delay replication for real readers. Batch the nightly import with pauses so it does not saturate the replication stream. Both are cheap and both remove the tail rather than hiding it.',
    },
    {
      step: 'Make it impossible to miss next time',
      detail:
        'Alert on p99 replication lag, not on replica health. A replica that is up and 30 seconds behind looks perfectly healthy on every dashboard while serving wrong answers — that gap between "healthy" and "correct" is what let 40 tickets accumulate before anyone looked.',
    },
  ],
  outcome:
    'The complaints stop within an hour of the leader-pinning change, and the underlying lag spikes are gone within a day. The lasting lesson is the monitoring one: replica health and replica correctness are different questions, and only one of them was on the dashboard.',
  problemSlug: 'social-timeline',
}
