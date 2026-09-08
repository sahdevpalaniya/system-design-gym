import type { Problem } from '@/lib/types'

export const CHAT_MESSAGING: Problem = {
  slug: 'chat-messaging',
  title: 'Chat and messaging',
  group: 'write-heavy',
  difficulty: 'core',
  concepts: [
    'realtime-transports',
    'fan-out',
    'message-queues',
    'consistency-models',
    'clocks-and-ordering',
    'partitioning',
    'object-storage',
  ],
  prompt:
    'Design a messaging service. One-to-one and group chats, messages delivered in order, delivery and read receipts, and history that survives a phone being lost. Assume mobile clients on unreliable networks.',

  slack: {
    budget: 'Delivery: under a second. Receipts: a few seconds. History sync: tens of seconds.',
    headline:
      'Two people are looking at the same screen expecting the message to appear. There is almost no slack on delivery — but there is plenty on everything around it, and that is what saves the design.',
    body: [
      'Delivery has near-zero slack when both people are in the conversation. A message that takes three seconds feels broken, because the sender is watching for the tick and the receiver is waiting to reply. So the delivery path has to be a push down an already-open connection, not a poll.',
      'Everything else has real slack, and spending it is the whole trick. Read receipts can be batched and sent every few seconds — nobody watches for the exact moment the second tick turns blue. Push notifications to an offline device go through a third party with its own latency, so seconds are already baked in. History sync after reinstalling can take a minute, because the user knows they just reinstalled.',
      'The one place with no slack at all and no way to buy any: **ordering within a conversation**. A reply appearing above the message it answers is not a latency problem, it is a correctness problem, and no amount of speed fixes it. That constraint, not throughput, is what decides how you partition.',
    ],
    consequence:
      'Persistent connections for delivery, a queue for everything after it, and all writes for one conversation routed through one partition so the sequence is unambiguous. Receipts and notifications are batched because nobody is watching them.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that would change a box, and propose the scope.',
      nudges: [
        'Group size is the assumption that changes the most boxes. Say a number.',
        'Is history stored on the server forever, or only until delivered? Those are different products.',
        'What does "delivered" mean — reached the server, or reached the device?',
      ],
      model: [
        'Assumptions, said quickly: mobile-first, global, 500 million users with about 50 million connected at any moment, messages are small text with occasional media, and history lives on the server so a new phone can restore it.',
        'The question that changes a box: how big can a group get? Ten people and a hundred thousand people are different systems. A small group can fan out on write into every member\'s mailbox. A hundred-thousand-member broadcast group cannot, and needs pull at read time. I will assume groups up to about 1,000 members fan out, and anything larger is a separate path — and I will say that out loud rather than pretend one design covers both.',
        'Second question: is this end-to-end encrypted? Because if it is, the server cannot search, cannot generate previews, cannot do server-side spam detection, and history restore depends on key backup rather than on my database. That single answer removes several features from the design. I will assume not encrypted end-to-end for this exercise, and flag it as the thing I would ask a real product owner first.',
        'Scope I propose: send and receive one-to-one and group messages, ordering within a conversation, delivered and read receipts, offline delivery via push, and history sync to a new device. Out of scope: voice and video calls, end-to-end encryption, and search — all real, all separate designs.',
      ],
      checklist: [
        'Stated connected-user count, not just registered users — capacity here is connections',
        'Asked about maximum group size, and said why it changes the fan-out decision',
        'Asked about end-to-end encryption and named what it removes from the design',
        'Defined what "delivered" means before designing receipts',
        'Proposed a scope and named something deliberately excluded',
      ],
      tradeoffs: [
        {
          decision: 'Server-side history',
          cost: 'Storage grows forever and I am now responsible for everyone\'s messages, including legally. The alternative — deliver and forget — makes new-device restore impossible.',
        },
      ],
      sayThis:
        '"Fifty million concurrent connections, groups up to a thousand, history on the server. One question: how big do groups get? That decides whether I fan out on write or pull at read, and it is the single most load-bearing decision here."',
      trap: 'Asking about message length limits or emoji support. Neither changes a box. Assume and move on.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write a message\'s life as a chain of states, and add the failure branches.',
      nudges: [
        'A message has more states than sent and received. What are the ticks actually showing?',
        'Who else touches this? The push notification provider is an actor you do not control.',
        'What happens to a message for a device that has been offline for two weeks?',
      ],
      model: [
        'Actors: the sender, each recipient, each of their devices separately — because one person with a phone and a laptop is two delivery targets — and the system itself, which assigns sequence numbers, decides when to give up on a device, and decides when to hand off to the push provider. The push provider is a fourth actor I do not control and cannot make reliable.',
        'The chain: composed on device → accepted by server and assigned a sequence number → fanned out to recipient mailboxes → delivered to a connected device → read by a human → retained → eventually deleted. The ticks people see map onto three of those: accepted, delivered, read.',
        'Failure branches, which is where the design is. At accepted: the client sent it twice because it lost the response, so the message needs a client-generated id and the server deduplicates on it — otherwise a flaky network produces double messages, which users notice immediately. At fan-out: a recipient is offline, so the message sits in their mailbox and a push notification is fired; if the push provider is down, the message is still safe and gets delivered on reconnect, because the mailbox is the truth and the push is only a hint. At delivered: the device receives it but crashes before storing it, so acknowledgement has to come after the client has persisted it, not on receipt. At read: the receipt itself is lost, which is fine — receipts are best-effort and I would say so rather than build guaranteed delivery for a tick.',
        'One the system owns: a device that has been offline for two weeks reconnects and has 4,000 messages waiting. That cannot be one enormous push down a socket. It is a paginated sync from a sequence number, over normal HTTP, with the socket only carrying new traffic.',
      ],
      checklist: [
        'Listed devices, not just users, as delivery targets',
        'Named the push provider as an actor outside your control',
        'Client-generated message id for deduplication on retry',
        'Mailbox is the truth; push notification is only a hint',
        'Acknowledgement after the client persists, not on receipt',
        'A reconnect after a long absence is a paginated sync, not a socket flood',
      ],
      trap: 'Drawing send → deliver and stopping. Duplicate sends on a flaky network and the two-week-offline reconnect are the two branches interviewers ask about, and both change the design.',
    },

    {
      id: 3,
      ask: 'Estimate messages per second, connections, and storage. Then finish: "So the hard part here is ___."',
      nudges: [
        'Connections are the capacity unit here, not requests per second.',
        'Group messages multiply. One send is how many deliveries?',
        'A text message is tiny. What actually fills the disk?',
      ],
      model: [
        'Assume 500 million users, 100 million active daily, sending 40 messages each. That is 4 billion messages a day, divided by 100,000 seconds, so roughly 40,000 messages per second average, and call it 120,000 at peak. That is a real number but not a frightening one.',
        'Deliveries are the number that actually matters. If the average conversation has 3 participants, each send becomes about 3 deliveries, so 120,000 sends per second is around 360,000 deliveries per second at peak. That is the write amplification, and it is why fan-out is the decision to get right.',
        'Connections: 50 million devices connected at once. If one tuned server holds 100,000 connections, that is 500 servers just to hold the sockets — before any messages flow. Capacity here is measured in connections, not requests per second, and that changes how I think about deploys, because restarting the fleet reconnects 50 million clients at once.',
        'Storage: a message row is roughly 300 bytes with metadata. 4 billion a day is about 1.2 TB a day, so 440 TB a year, which is significant but not exotic. Media is the real weight and it does not belong in the database — it goes to object storage, and the message row holds a reference.',
        'So the hard part here is fan-out and connection management, not raw message throughput. 120,000 writes a second is ordinary. Turning them into 360,000 ordered deliveries across 50 million live connections, without losing anything when a device is offline, is the design.',
      ],
      checklist: [
        'Produced messages per second with assumptions stated',
        'Multiplied sends into deliveries — named the write amplification',
        'Counted concurrent connections and turned it into a server count',
        'Separated media from message rows in the storage estimate',
        'Finished the sentence: fan-out and connections, not throughput',
      ],
      tradeoffs: [
        {
          decision: 'Storing history server-side forever',
          cost: '440 TB a year that only grows. I would tier older messages to colder storage and accept that fetching a two-year-old conversation is slower.',
        },
      ],
      sayThis:
        '"Around 120,000 sends a second at peak, becoming 360,000 deliveries, across 50 million live connections. Storage is about 440 TB a year with media held separately. So the hard part here is fan-out and connection management — the message rate itself is unremarkable."',
      trap: 'Estimating messages and forgetting deliveries. The multiplication by conversation size is the number the whole design turns on.',
    },

    {
      id: 4,
      ask: 'Draw the boxes and arrows in words. Justify every box with a requirement from Stage 1 or a number from Stage 3.',
      nudges: [
        'Where does the connection live, and how does a message reach the right server?',
        'What guarantees ordering within a conversation?',
        'What is stored per conversation, and what is stored per user?',
      ],
      model: [
        'Clients hold a WebSocket to a **connection service**, which does nothing but terminate sockets, authenticate, and hold a registry of which device is on which server. Those servers are sized by connection count, and they are deliberately dumb, because they are the layer that has to be restarted carefully.',
        'A send goes over the socket to the connection service, then to a **message service**, which is where the real work happens. It deduplicates on the client-generated id, assigns a **per-conversation sequence number**, and appends the message to the conversation\'s log. Everything is partitioned by conversation id, which gives ordering for free — all messages for one conversation are handled by one partition, so the sequence is simply arrival order, and no clocks are involved. That is the answer to ordering, and it is why the partition key is conversation and not user.',
        'Fan-out then writes a reference into each recipient\'s **mailbox** — recipient id, conversation id, sequence number — via a queue, because the sender must not wait for it. The mailbox is the durable truth of what a user has not yet seen. For groups above the threshold, no fan-out happens: members pull the conversation log when they open it.',
        'Delivery: the message service asks the connection registry where each recipient\'s devices are and pushes to those servers. A device that is not connected gets nothing now — its mailbox already has the entry — and a **push notification** is fired to Apple or Google as a hint to open the app. That push is best-effort by design.',
        'Storage: the conversation log is the source of truth, partitioned by conversation id and clustered by sequence number, so "last 50 messages" is one continuous read. Mailboxes are per user and capped. Media goes straight to object storage over a presigned URL, and the message row holds only the key — my servers never carry the bytes.',
        'Receipts flow the same way as messages but batched: a client sends "read up to sequence 812" rather than one receipt per message, which cuts that traffic by an order of magnitude for no cost anyone can perceive.',
      ],
      checklist: [
        'Separated the connection layer from the message logic and said why',
        'Partitioned by conversation id, and justified it with ordering rather than load',
        'Per-conversation sequence numbers rather than timestamps',
        'Mailbox as the durable truth, push notification as a best-effort hint',
        'Media to object storage via presigned URL, never through the servers',
        'Receipts sent as a high-water mark, not one per message',
      ],
      tradeoffs: [
        {
          decision: 'Partition by conversation id',
          cost: 'One enormous group chat becomes a hot partition. I would handle those specifically rather than change the scheme, because the alternative loses ordering for everybody.',
        },
        {
          decision: 'Separate connection service',
          cost: 'An extra hop on every message and a registry to keep current. In exchange, message logic can deploy freely without dropping 50 million sockets.',
        },
      ],
      sayThis:
        '"Partitioned by conversation id, because that is what gives me ordering without clocks — one partition, one sequence. Connections live in a separate dumb layer so message logic can deploy without dropping every socket. The mailbox is durable and the push notification is only a hint."',
      trap: 'Ordering by timestamp. Two clients and two servers never agree on the time, and a reply appearing above its message is a correctness bug no amount of speed fixes.',
    },

    {
      id: 5,
      ask: 'Pick the two hardest parts and go deep. After every decision, say what it costs.',
      nudges: [
        'What happens on deploy, when every connection drops at once?',
        'What does the 100,000-member group do to the fan-out design?',
        'How does a new phone get five years of history?',
      ],
      model: [
        '**Hard part one: the connection layer during a deploy.** Restarting the fleet disconnects 50 million clients, and they all reconnect within seconds — a self-inflicted spike bigger than normal traffic, and each reconnect costs an authentication and a sync query. Defences, in order: roll the fleet slowly, a few percent at a time, so the reconnect load is spread over an hour. Clients reconnect with randomised, growing delays, so even a sudden mass disconnect arrives smoothly. And the reconnect handshake is cheap by design — the client sends the last sequence number it has per conversation, and gets back only what is missing, rather than re-fetching state. Cost: deploys to that layer take an hour rather than five minutes, so I keep the layer small and change it rarely, which is exactly why it is separate from the message service.',
        '**Hard part two: the very large group.** A 100,000-member group posting actively would generate 100,000 mailbox writes per message, which floods the queue and delays everyone else. So above a threshold — a thousand members, tuned from queue lag — I stop fanning out entirely. The message is written once to the conversation log, and members read it when they open the conversation. That log is one key with enormous read volume, which is the ideal caching shape. Cost: two code paths for one feature forever, a threshold that needs an owner, and unread counts for those groups become approximate rather than exact, because there is no mailbox to count. I would show "99+" and accept it.',
        '**History sync to a new device.** Not over the socket. The client requests conversations in pages over normal HTTP, newest first, and gets recent messages per conversation immediately so the app is usable within seconds, with older history filling in in the background. Cost: full restore takes minutes, which is acceptable because the user knows they just installed the app.',
        '**Duplicate and out-of-order handling on the client.** The client can receive the same message twice — from the socket and again from a sync — so it deduplicates on message id, and it inserts by sequence number rather than by arrival. That means the client is idempotent too, not just the server, which is the part people forget.',
      ],
      checklist: [
        'Named the reconnect storm on deploy and gave three specific defences',
        'Set a fan-out threshold and said how you would tune it',
        'Accepted approximate unread counts for large groups, explicitly',
        'History sync over HTTP, paged, not down the socket',
        'Client-side deduplication and ordering by sequence number',
        'Named the cost after every decision',
      ],
      tradeoffs: [
        {
          decision: 'No fan-out above 1,000 members',
          cost: 'Unread counts become approximate for those groups, and reads get more expensive for their members.',
        },
        {
          decision: 'Slow rolling deploys on the connection layer',
          cost: 'An hour to ship a change there. Worth it — the alternative is a reconnect spike that looks like an outage.',
        },
      ],
      sayThis:
        '"Above a thousand members I stop fanning out and let members pull from a heavily cached conversation log — cost is two code paths and approximate unread counts, which I would show as 99+. And the connection layer rolls slowly with jittered client reconnects, because 50 million sockets reconnecting at once is a bigger spike than our normal peak."',
      trap: 'Treating a deploy as free. In a system whose capacity is measured in connections, the deploy is the biggest load event you will generate.',
    },
  ],

  lifecycle: {
    caption:
      'A message\'s life. The ticks a user sees map onto three of these states — and every branch below is a real failure that happens constantly at this scale.',
    states: [
      { id: 'composed', label: 'Composed', by: 'sender device' },
      { id: 'accepted', label: 'Accepted + sequenced', by: 'system' },
      { id: 'fanned', label: 'In recipient mailboxes', by: 'system' },
      { id: 'delivered', label: 'Delivered to device', by: 'system' },
      { id: 'read', label: 'Read', by: 'recipient' },
      { id: 'retained', label: 'Retained / deleted', by: 'system or user' },
    ],
    failures: [
      { after: 'composed', label: 'Client retried on a lost response', handling: 'client-generated id, server deduplicates — never two messages' },
      { after: 'accepted', label: 'Recipient offline', handling: 'mailbox holds it, push notification fired as a hint only' },
      { after: 'fanned', label: 'Push provider down', handling: 'nothing lost — delivery happens on reconnect from the mailbox' },
      { after: 'delivered', label: 'Device crashes before storing', handling: 'acknowledge after persisting, not on receipt, so it is re-sent' },
      { after: 'delivered', label: 'Offline two weeks, 4,000 waiting', handling: 'paged sync over HTTP from last sequence number, not a socket flood' },
      { after: 'read', label: 'Receipt lost', handling: 'best-effort by design — receipts are a high-water mark, resent on next activity' },
    ],
  },

  architecture: {
    caption:
      'Connections live in their own dumb layer so message logic can deploy freely. Everything is partitioned by conversation, which is what makes ordering free.',
    nodes: [
      { id: 'd', label: 'Devices', sub: '50M connected', kind: 'client', col: 0, row: 0 },
      { id: 'cs', label: 'Connection svc', sub: 'sockets only', kind: 'service', col: 1, row: 0 },
      { id: 'ms', label: 'Message svc', sub: 'dedupe + sequence', kind: 'service', col: 2, row: 0 },
      { id: 'log', label: 'Conversation log', sub: 'partition: conv id', kind: 'store', col: 3, row: 0 },
      { id: 'q', label: 'Fan-out queue', kind: 'queue', col: 2, row: 1 },
      { id: 'mb', label: 'Mailboxes', sub: 'per user, capped', kind: 'store', col: 3, row: 1 },
      { id: 'reg', label: 'Connection registry', sub: 'device → server', kind: 'cache', col: 1, row: 1 },
      { id: 'p', label: 'Push provider', sub: 'APNs / FCM', kind: 'external', col: 0, row: 1 },
      { id: 'o', label: 'Object storage', sub: 'media', kind: 'store', col: 4, row: 0 },
    ],
    edges: [
      { from: 'd', to: 'cs', label: 'websocket' },
      { from: 'cs', to: 'ms' },
      { from: 'ms', to: 'log', label: 'append' },
      { from: 'ms', to: 'q' },
      { from: 'q', to: 'mb' },
      { from: 'ms', to: 'reg', label: 'where?' },
      { from: 'ms', to: 'p', label: 'if offline', dashed: true },
      { from: 'd', to: 'o', label: 'presigned' },
    ],
  },

  numbers: {
    caption: 'The two numbers that decide the design: delivery amplification, and connections.',
    items: [
      { label: 'Messages sent', value: 120000, display: '~120,000 / sec at peak', tone: 'muted' },
      { label: 'Deliveries (×3 participants)', value: 360000, display: '~360,000 / sec at peak', tone: 'accent' },
      { label: 'Concurrent connections', value: 50000000, display: '50M — about 500 servers to hold', tone: 'bad' },
    ],
    note: 'So the hard part is fan-out and connection management. 120,000 writes a second is ordinary; turning them into 360,000 ordered deliveries across 50 million live sockets is not.',
  },

  compare: {
    caption: 'The decision that everything else follows from.',
    a: {
      title: 'Fan-out on write (mailbox per user)',
      points: [
        'Opening the app is one read of a precomputed list. Fast, which is what users feel.',
        'Exact unread counts, because the mailbox is countable.',
        'A 100,000-member group is 100,000 writes per message, flooding the shared queue.',
        'Storage grows with membership, not with messages.',
      ],
    },
    b: {
      title: 'Pull from the conversation log',
      points: [
        'One write per message regardless of group size. Enormous groups become free.',
        'Reading means querying every conversation you are in, then merging.',
        'Unread counts become approximate unless you track a read pointer per conversation.',
        'One cached log key serves everyone, which is the ideal cache shape.',
      ],
    },
    verdict:
      'Fan out on write below about a thousand members, pull above it, merged at read. Same answer as timelines, same reason — and saying "this is the celebrity problem wearing a different hat" is worth points on its own.',
  },

  followUps: [
    'scale-celebrity',
    'consistency-ordering',
    'kill-dependency',
    'choice-push-pull',
    'ops-deploy',
    'scope-offline',
    'cost-storage-growth',
    'kill-network',
  ],
}
