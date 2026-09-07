import type { Concept } from '@/lib/types'

/** Foundational topics that come before, or alongside, the original Tier 1 set. */
export const TIER1_EXTRA: Concept[] = [
  {
    slug: 'performance-vs-scalability',
    title: 'Performance vs scalability',
    tier: 1,
    oneLine: 'Fast for one person is not the same as staying fast for a million.',
    problem: [
      'These two words get used as if they mean the same thing. They do not, and mixing them up sends people to fix the wrong problem.',
      '**Performance** is: is it fast right now, for one user? **Scalability** is: does it stay just as fast when there are a hundred times more users?',
      'A system can be fast and not scale — quick with ten users, unusable with ten thousand. A system can scale and be slow — every request takes two seconds whether you have ten users or ten million, which is at least honest and predictable.',
    ],
    cost: 'Chasing the wrong one wastes weeks. Optimising code that was never the bottleneck buys nothing, and building for scale you do not have costs you every future feature, because a distributed system is slower to change than a simple one.',
    useWhen: [
      'Someone says "it is slow" — ask whether it is slow for everyone, or only when busy. That single question tells you which problem you have.',
      'Deciding whether to optimise code or add machines.',
    ],
    avoidWhen: [
      'Do not use the distinction to avoid measuring. Both questions are answered by looking at real numbers, not by arguing.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'Two different problems that both get called "slow".',
        a: {
          title: 'A performance problem',
          points: [
            'Slow even with one user and no load.',
            'Usually a missing index, an N+1 query, or work done that need not be.',
            'Adding machines does not help — every machine is equally slow.',
            'Fix: profile it, find the slow bit, make it do less work.',
          ],
        },
        b: {
          title: 'A scalability problem',
          points: [
            'Fine when quiet, falls apart when busy.',
            'Something shared is saturating: a database, a lock, a connection pool.',
            'Response times climb as users climb, then fall off a cliff.',
            'Fix: remove the shared bottleneck, or spread it across more machines.',
          ],
        },
        verdict:
          'Ask one question: is it slow when nobody else is using it? If yes, it is a performance problem and more machines will not save you. If no, something shared is saturating, and that is what you go and find.',
      },
    },
    body: [
      'The practical way to tell them apart is to look at a graph of response time against load. A performance problem is a flat line that sits too high — bad everywhere, equally. A scalability problem is a line that is fine, fine, fine, then bends sharply upward at some point. That bend is where a shared resource ran out.',
      'Two ways to grow, and the names matter. **Scaling up (vertical)** means a bigger machine — more CPU, more memory. It is simple, requires no code changes, and has a ceiling plus a restart. **Scaling out (horizontal)** means more machines. No ceiling, and it forces you to make servers stateless and to think about how they share data.',
      'Scaling up is genuinely underrated. Machines you can rent now are enormous, and one big database is far simpler to operate than twenty small ones. Reach for it first, and move to scaling out when you can name the limit you are hitting.',
    ],
    followUp: {
      q: '"Your service is slow. Do you add more servers?"',
      answer:
        'Not before I know which problem it is. If it is slow with one user and no load, more servers change nothing — every new server is equally slow, and I have just spent money to make the same request take the same time. That is a performance problem: I would profile one request and find where the time goes, and it is usually a missing index or a call made in a loop. If it is only slow under load, then something shared is saturating, and I would find out what before adding capacity — because if the bottleneck is the database, adding application servers makes it worse, not better, by piling on more connections.',
    },
    selfCheck: {
      q: 'Your app takes 3 seconds per request whether 1 person or 1,000 people are using it. Performance or scalability problem — and does adding servers help?',
      answer:
        'A performance problem, and no, adding servers does not help. The giveaway is that load makes no difference: the 3 seconds is work being done inside a single request, so every server you add will also take 3 seconds. You need to find what is spending those 3 seconds — profile it, look for a query without an index, a call in a loop, or something computed that could be precomputed. Adding machines only helps when the machines are the constraint, and here they clearly are not. Interestingly this system scales fine; it is just uniformly slow.',
    },
    traps: [
      'Adding servers to fix a problem that is present at zero load.',
      'Assuming a system that is fast today will stay fast — performance now says nothing about the shape of the curve.',
    ],
    sayThis:
      '"Is it slow with one user, or only when busy? If it is slow when quiet, that is a performance problem and more machines will not help. If it degrades with load, something shared is saturating and I want to know what before I spend money."',
    related: ['latency-vs-throughput', 'back-of-envelope', 'load-balancing'],
  },

  {
    slug: 'latency-vs-throughput',
    title: 'Latency vs throughput',
    tier: 1,
    oneLine: 'How long one thing takes, versus how many things you get done per second.',
    problem: [
      '**Latency** is how long a single request takes, measured in milliseconds. **Throughput** is how many requests you complete per second.',
      'They sound like the same thing said two ways, and they are not — you can improve one while making the other worse, which is exactly what a lot of real engineering decisions do.',
      'Getting them confused means optimising the wrong number and being surprised when nobody is happier.',
    ],
    cost: 'Almost every technique that raises throughput adds latency, and almost every technique that cuts latency wastes capacity. Batching, queueing and connection pooling all make the system do more work per second by making individual requests wait. You have to know which one your users actually feel.',
    useWhen: [
      'Deciding whether to batch. Batching always raises throughput and always raises latency.',
      'Setting a target. "Fast" is not a target; "p99 under 200 ms at 5,000 requests a second" is.',
      'Reading a benchmark someone hands you — check which of the two it measured.',
    ],
    avoidWhen: [
      'Do not optimise throughput on a path where one human is waiting. They cannot feel your requests per second; they feel their one request.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'A motorway is the standard analogy, and it is a good one.',
        items: [
          { label: 'Latency — how long your car takes to drive the route', value: 30, display: '30 minutes', tone: 'accent' },
          { label: 'Throughput — cars completing the route per hour', value: 2000, display: '2,000 cars / hour', tone: 'muted' },
        ],
        note: 'Adding lanes raises throughput and does nothing for your 30 minutes. Raising the speed limit cuts latency for everyone. They are separate levers, and most systems only have room to pull one.',
      },
    },
    body: [
      'The averages lie, and this is the part worth internalising. Nobody experiences your average latency. If your average is 100 ms but one request in a hundred takes four seconds, and a page makes twenty requests, then most page loads contain at least one slow request. So you quote **percentiles**: p50 is the median, p99 is the request that is worse than 99% of the others. p99 is what your unhappiest users are living in, and it is the number worth putting on a dashboard.',
      'The tradeoff, concretely. Batching a hundred database writes into one statement massively raises throughput, because you pay the round trip once instead of a hundred times — and it raises latency for the first write in the batch, which now waits for the other ninety-nine to arrive. That is a good trade for analytics and a terrible one for a checkout button.',
      'One more relationship worth knowing: when a system approaches its throughput ceiling, latency does not degrade gently. It stays flat, flat, flat, and then climbs almost vertically, because requests begin queueing behind each other. This is why "we are at 85% capacity" is much closer to trouble than it sounds.',
    ],
    followUp: {
      q: '"Your p50 is 20 ms and your p99 is 3 seconds. What is going on?"',
      answer:
        'A gap that big is not the same work being slower — it is a different path or a different data shape. The usual causes, in order: data skew, where a few users have far more rows than the median so their queries plan differently; queueing, where requests wait on a saturated resource like a connection pool, which shows as a bimodal distribution rather than a smooth curve; a dependency with its own bad tail that I am calling and waiting on; or garbage collection pauses. I would first check whether the distribution is bimodal, because that points straight at queueing, and then trace one slow request end to end. The structural cause worth naming: if a request fans out to many services and waits for all of them, my p99 becomes the p99 of the slowest one, which is far worse than any individual service\'s p99.',
    },
    selfCheck: {
      q: 'You batch 100 writes into one database call. What happened to latency, and what happened to throughput?',
      answer:
        'Throughput went up, probably a lot, because you now pay one network round trip and one transaction commit for a hundred writes instead of a hundred of each. Latency went up too, for the individual write: the first one in the batch has to wait until the batch fills or a timer fires before anything is sent. That is the trade in its purest form. It is the right call when nobody is waiting on any single write — analytics events, log lines, view counts — and the wrong call when a person is watching a spinner for their one specific write to finish.',
    },
    traps: [
      'Quoting averages. Nobody experiences the average; quote p50 and p99.',
      'Optimising throughput on a path where a human is waiting.',
      'Assuming latency degrades gently as you approach capacity. It does not — it climbs a wall.',
    ],
    sayThis:
      '"Latency is one request; throughput is requests per second. I would batch here because nothing is waiting on any individual write — that raises throughput and adds a little latency nobody can feel. On the checkout path I would not, because there one person is watching their one request."',
    related: ['performance-vs-scalability', 'latency-numbers', 'back-of-envelope'],
  },

  {
    slug: 'availability-patterns',
    title: 'Availability, failover and the nines',
    tier: 1,
    oneLine: 'How much downtime you are promising, and what it costs to promise less.',
    problem: [
      'Availability is the share of time your system actually answers. People say "highly available" as if it were a setting. It is a number, it has a price, and each extra nine costs roughly ten times the last one.',
      'The other half is failover: when a machine dies, what takes over, how fast, and what gets lost in the handover.',
    ],
    cost: 'Every nine costs money and complexity. Going from 99.9% to 99.99% means removing every single point of failure, automating recovery, and testing it — and the work is not linear, it compounds. Redundancy also adds its own failure modes: a failover that triggers wrongly can cause an outage that would not otherwise have happened.',
    useWhen: [
      'Agreeing a target with the business, before designing anything.',
      'Deciding how much redundancy a specific path needs — and they should differ per path.',
      'Working out whether a dependency is allowed to be in your critical path at all.',
    ],
    avoidWhen: [
      'Do not promise nines you have not costed. "Five nines" is 26 seconds of downtime a year, including deploys.',
      'Do not add redundancy uniformly. Some paths genuinely can be down for an hour.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'What each nine actually buys you, in downtime per year.',
        items: [
          { label: '99% — two nines', value: 3650, display: '3.65 days / year', tone: 'bad' },
          { label: '99.9% — three nines', value: 526, display: '8.8 hours / year', tone: 'muted' },
          { label: '99.99% — four nines', value: 52, display: '52 minutes / year', tone: 'muted' },
          { label: '99.999% — five nines', value: 5, display: '5.3 minutes / year', tone: 'accent' },
        ],
        note: 'Five nines is five minutes a year, total, including every deploy and every dependency failure. Most products do not need it and cannot afford it.',
      },
    },
    body: [
      'Two ways to arrange failover, and the difference matters. **Active-passive**: one machine serves, a standby sits idle watching heartbeats, and takes over when they stop. Simple, and you pay for hardware doing nothing, plus the standby is untested by real traffic — which is how you discover it does not work at the worst possible moment. **Active-active**: both serve traffic all the time and both are therefore continuously proven to work. Better use of money and no cold standby surprise, at the cost of needing to handle data written in two places.',
      'The maths of combining components is worth knowing because it is not intuitive. Components **in sequence** — a request that must pass through all of them — multiply: two components at 99.9% each give 99.8% together, so adding dependencies to a critical path always lowers availability. Components **in parallel** — either can serve — multiply their failure rates instead, so two 99.9% components in parallel give 99.9999%. That single fact is the entire argument for redundancy, and the entire argument against long dependency chains.',
      'The uncomfortable truth about failover: detection takes time. Something must notice the machine is gone, and if it decides too quickly it will fail over during a brief network blip and cause an outage; too slowly and you are down. That detection window is downtime you cannot design away, only shorten.',
      'And the thing nobody puts in the availability budget: most outages are not hardware. They are deploys and configuration changes. Redundancy protects you from a machine dying, which is rare. It does nothing about shipping a bug to every machine at once, which is common.',
    ],
    followUp: {
      q: '"You want four nines. What does that actually require?"',
      answer:
        'Fifty-two minutes of downtime a year, total. To get there: no single point of failure anywhere on the critical path, which means at least two of everything including the load balancer people forget about; automatic failover that has actually been tested, because an untested failover is a hypothesis; deploys that do not take the service down, so rolling releases and backwards-compatible migrations; and dependency isolation, so a slow third party degrades one feature instead of the whole product. Then the honest part — my dependencies cap me. If I call a payment provider that offers 99.9%, my checkout path cannot beat 99.9% no matter what I do, so either that call comes off the critical path or four nines on checkout is not a promise I can make. And I would point out that most of my real downtime will come from deploys and config changes, not hardware, so the highest-value work is probably progressive rollouts and fast rollback rather than more redundancy.',
    },
    selfCheck: {
      q: 'Two services, each 99.9% available. What is the combined availability if a request needs both? What if either will do?',
      answer:
        'If a request needs both — they are in sequence — you multiply the availabilities: 0.999 × 0.999 = 0.998, so 99.8%, which is worse than either one alone. Every dependency you add to a critical path drags the number down. If either will do — they are in parallel — you multiply the failure rates instead: 0.001 × 0.001 = 0.000001, so 99.9999%. That asymmetry is the whole game: chains of dependencies make you less available, and duplicated components make you more available. It is why designs try to keep critical paths short and to make anything on them redundant.',
    },
    traps: [
      'Promising nines without counting your dependencies — they cap you.',
      'An untested failover. If it has never been exercised, it is a guess.',
      'Forgetting that deploys and config changes cause most outages, and redundancy does not help with either.',
    ],
    sayThis:
      '"Three nines is nearly nine hours a year, four nines is under an hour. I would aim for three on this path and be honest that my payment provider caps me anyway. Active-active rather than active-passive, because a standby that never takes traffic is a standby I do not trust."',
    related: ['replication', 'load-balancing', 'circuit-breakers'],
  },

  {
    slug: 'dns',
    title: 'DNS — how a name becomes a server',
    tier: 1,
    oneLine: 'The phone book of the internet, and the first thing that happens on every request.',
    problem: [
      'People type names; machines need addresses. DNS turns `example.com` into an IP address, and it happens before your servers are involved at all.',
      'It matters in system design for two reasons: it is on the critical path of every first request, and it is the coarsest tool you have for sending users to different places.',
    ],
    cost: 'Answers are cached all over the internet — in the browser, the operating system, the router, the internet provider — and that cache respects your TTL only loosely. So a DNS change is not a switch you flip; it is a change that rolls out over minutes to hours, and some clients ignore it entirely. That makes DNS a poor failover mechanism on its own.',
    useWhen: [
      'Routing users to the nearest region (geographic routing).',
      'Coarse traffic splitting between environments or providers.',
      'Very slow, planned migrations where hours of rollout are acceptable.',
    ],
    avoidWhen: [
      'Fast failover. Minutes of cached answers means minutes of users hitting a dead address.',
      'Per-request load balancing. Use a real load balancer for that — DNS has no idea which server is busy or healthy.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The lookup, once. After this it is cached at every layer for the length of the TTL — which is why changes are slow to take effect.',
        nodes: [
          { id: 'b', label: 'Browser', kind: 'client', col: 0, row: 0 },
          { id: 'r', label: 'Resolver', sub: 'your ISP', kind: 'service', col: 1, row: 0 },
          { id: 'root', label: 'Root + TLD', sub: 'who owns .com', kind: 'external', col: 2, row: 0 },
          { id: 'auth', label: 'Your DNS', sub: 'the real answer', kind: 'store', col: 3, row: 0 },
          { id: 'srv', label: 'Your server', sub: '93.184.x.x', kind: 'service', col: 3, row: 1 },
        ],
        edges: [
          { from: 'b', to: 'r', label: 'example.com?' },
          { from: 'r', to: 'root' },
          { from: 'root', to: 'auth' },
          { from: 'auth', to: 'r', label: 'IP', dashed: true },
          { from: 'b', to: 'srv', label: 'then connect' },
        ],
      },
    },
    body: [
      'The record types you need, and no more. **A** maps a name to an IPv4 address, **AAAA** to IPv6. **CNAME** points one name at another name, which is how you point at a CDN or a managed service without hardcoding their addresses. **MX** is mail. That is enough for design conversations.',
      'The **TTL** is the number that controls everything. It tells everyone how long they may cache the answer. Long TTLs mean fast lookups and slow changes; short TTLs mean the opposite plus more load on your DNS. The standard trick before a planned migration is to drop the TTL to sixty seconds a day in advance, make the change, then put it back up.',
      'Routing policies are where DNS earns its place in a design. **Round robin** hands out different addresses in turn — crude balancing with no health awareness. **Geographic** sends users to the nearest region, which is how global products cut latency. **Latency-based** measures and sends users to whichever region is actually fastest for them. **Failover** returns the backup address when health checks fail — real, but bounded by cache TTLs, so treat it as minutes not seconds.',
      'The practical takeaway: DNS gets users to the right *region* or the right *front door*. A load balancer takes it from there and gets them to the right *server*. Do not ask DNS to do the second job.',
    ],
    followUp: {
      q: '"Your primary region is down. Can you just change DNS?"',
      answer:
        'You can, and you should not rely on it as your only answer, because it is slow and partly out of your control. Even with a sixty-second TTL, resolvers and browsers and corporate networks cache more aggressively than they promise, so a meaningful share of users keep hitting the dead address for minutes — some for much longer. So DNS failover is a real tool for the long tail but not a fast one. What actually gives you quick failover is something in front that is already receiving all the traffic and can redirect internally: anycast addressing, where the same IP is announced from several locations and the network routes to a live one, or a global load balancer that terminates connections and picks a healthy backend itself. My design would use DNS to get users to a nearby front door, and put the fast failover behind that front door where I control it.',
    },
    selfCheck: {
      q: 'Why is DNS a bad way to do fast failover, and what would you use instead?',
      answer:
        'Because the answer is cached in places you do not control — the browser, the OS, the router, the ISP\'s resolver — and many of them honour your TTL only loosely or ignore it entirely. So when you point the name at a new address, users keep going to the old one for minutes at best, sometimes far longer, and you cannot make them stop. For fast failover you want something already in the request path that can redirect without asking DNS again: anycast, where several locations announce the same IP and the network picks a live one, or a global load balancer that health-checks backends and routes internally. DNS is fine for getting users to a region; it is the wrong layer for reacting to an outage in seconds.',
    },
    traps: [
      'Treating DNS as a load balancer. It has no idea which servers are healthy or busy.',
      'Trusting your TTL. Plenty of resolvers do not.',
      'Forgetting DNS lookup time in the latency budget of a first request.',
    ],
    sayThis:
      '"DNS routes users to the nearest region, not to a specific server — that is the load balancer\'s job. I would not rely on DNS for failover, because cached answers mean minutes of users still hitting the dead address. Anycast or a global load balancer handles that properly."',
    related: ['load-balancing', 'cdn', 'availability-patterns'],
  },

  {
    slug: 'reverse-proxy',
    title: 'Reverse proxies and gateways',
    tier: 1,
    oneLine: 'One front door that handles the boring, repeated work before anything reaches your code.',
    problem: [
      'A reverse proxy sits in front of your servers and takes every request first. Clients talk to it; it talks to your services. It is a single place to do the work that would otherwise be repeated in every service.',
      'That work: terminating HTTPS, compressing responses, serving static files, rate limiting, authentication checks, routing by path, and logging.',
    ],
    cost: 'Another hop, another thing to configure, and another thing that can be misconfigured in a way that affects everything at once. It is also a single point of failure unless it is itself redundant. And putting too much logic in it creates a component nobody owns that quietly becomes load-bearing.',
    useWhen: [
      'Anything that should happen identically for every request: TLS, compression, request logging, rate limits.',
      'Routing several services behind one domain by path.',
      'Hiding internal topology from the outside world.',
      'Serving static assets so application servers never see those requests.',
    ],
    avoidWhen: [
      'Business logic. Once routing rules start expressing product decisions, you have a distributed system in a config file.',
      'A single service with no cross-cutting needs — it is a hop for nothing.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The proxy does the repeated work once, so no service needs its own TLS, compression or rate limiting.',
        nodes: [
          { id: 'c', label: 'Clients', kind: 'client', col: 0, row: 1 },
          { id: 'p', label: 'Reverse proxy', sub: 'TLS, gzip, limits', kind: 'service', col: 1, row: 1 },
          { id: 'a', label: '/api', kind: 'service', col: 2, row: 0 },
          { id: 's', label: '/static', kind: 'store', col: 2, row: 1 },
          { id: 'w', label: '/ws', kind: 'service', col: 2, row: 2 },
        ],
        edges: [
          { from: 'c', to: 'p', label: 'https' },
          { from: 'p', to: 'a', label: 'http' },
          { from: 'p', to: 's' },
          { from: 'p', to: 'w' },
        ],
      },
    },
    body: [
      'Reverse proxy versus load balancer is a question people get asked, and the honest answer is that they overlap heavily and the same software usually does both. The distinction: a **load balancer** exists to spread traffic across several identical servers. A **reverse proxy** exists to be a front door — it is useful even with exactly one server behind it, because it is still terminating TLS and serving static files. In practice nginx, Envoy and every cloud load balancer do both jobs, and you should say so rather than pretend they are separate boxes.',
      'An **API gateway** is a reverse proxy with more opinions: it authenticates, applies per-customer rate limits, transforms requests, and often aggregates several backend calls into one response. It is the natural home for the things every public API needs. The risk is that it grows until it contains business logic, at which point deploying anything means deploying the gateway.',
      'A **forward proxy** is the mirror image and worth one sentence so the names do not confuse you: it sits in front of *clients* rather than servers, and is what a company uses to control and inspect outbound traffic from its own network.',
      'Two things that catch people out. TLS terminating at the proxy means traffic behind it is plain HTTP, which is fine inside a trusted network and not fine across the public internet — so know which one you have. And the proxy is where the client\'s real IP address gets lost, which is why `X-Forwarded-For` exists and why rate limiting by IP breaks if you forget to read it.',
    ],
    followUp: {
      q: '"What is the difference between a reverse proxy and a load balancer?"',
      answer:
        'Mostly framing, and the same software usually does both, which is worth saying rather than inventing a clean separation. A load balancer\'s reason to exist is spreading traffic across several identical servers — it is meaningless with one server. A reverse proxy\'s reason to exist is being a front door: terminating TLS, compressing, serving static assets, applying rate limits, routing by path. That is useful even with a single backend. So the mental model I use is that load balancing is one feature a reverse proxy usually has. In a design I would draw one box and say what it is doing, rather than draw two boxes to satisfy a vocabulary distinction — and I would remember to make it redundant, because whatever I call it, it is now in front of everything.',
    },
    selfCheck: {
      q: 'Name three things worth doing in a reverse proxy rather than in each service, and one thing that should not go there.',
      answer:
        'Worth putting there: TLS termination, so no service handles certificates; rate limiting, because rejecting at the edge is cheap and rejecting after a request has reached a service wastes the resources you were protecting; and static asset serving, so application servers never see those requests at all. Compression and access logging are equally good answers. What should not go there: business logic. The moment routing rules start encoding product decisions — which customers see which feature, how a response is reshaped for a particular client — you have logic in a config file that no team owns, that cannot be tested like code, and that must be deployed to change anything. Keep the proxy doing cross-cutting mechanics, not decisions.',
    },
    traps: [
      'Forgetting the proxy needs to be redundant — it is now in front of everything.',
      'Losing the client IP and then rate limiting every user as if they were one.',
      'Letting the gateway accumulate business logic until it is the riskiest deploy you have.',
    ],
    sayThis:
      '"One reverse proxy in front doing TLS, compression and rate limiting, so no service repeats that work. It is also the load balancer — same box, and I will run at least two of them, because it is now in front of everything."',
    related: ['load-balancing', 'rate-limiting', 'cdn'],
  },

  {
    slug: 'communication-protocols',
    title: 'HTTP, TCP, UDP, REST and RPC',
    tier: 1,
    oneLine: 'How two machines actually talk, and which style to pick between your own services.',
    problem: [
      'Everything in a distributed system is machines sending each other messages. A handful of choices decide what those messages cost and what happens when they go missing.',
      'You do not need protocol internals. You need to know what each one guarantees, what it costs, and when to reach for it.',
    ],
    cost: 'Each step up in guarantees costs latency. TCP guarantees delivery and ordering, and pays with handshakes and retransmissions. HTTPS adds another round trip for encryption. Chatty request-response styles multiply those costs by the number of calls, which is how a design becomes slow without any single part being slow.',
    useWhen: [
      'TCP: anything where losing a message is unacceptable — which is almost everything.',
      'UDP: video, voice, games, metrics — where a late packet is worthless and a lost one is better than a slow one.',
      'REST over HTTP: public APIs, anything crossing an organisation, anything cached by a CDN.',
      'RPC (usually gRPC): high-volume internal service-to-service calls where you control both ends.',
    ],
    avoidWhen: [
      'Do not use UDP because it sounds faster. If you then rebuild delivery and ordering on top, you have written a worse TCP.',
      'Do not put gRPC on a public API. REST over HTTP is what the rest of the world can consume and cache.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The one protocol decision that actually changes a design.',
        a: {
          title: 'TCP — reliable, ordered',
          points: [
            'Every byte arrives, in order, or the connection fails loudly.',
            'Costs a handshake to set up, and retransmits anything lost.',
            'A lost packet stalls everything behind it while it is resent.',
            'Right for: APIs, databases, file transfer — nearly everything.',
          ],
        },
        b: {
          title: 'UDP — fast, no promises',
          points: [
            'Fire and forget. No handshake, no retries, no ordering.',
            'A lost packet is simply gone, and the next one still arrives on time.',
            'You handle loss yourself, or design so loss does not matter.',
            'Right for: live video and voice, games, high-volume metrics.',
          ],
        },
        verdict:
          'Default to TCP. Choose UDP only when a late message is worth less than no message — a video frame from two seconds ago is useless, so dropping it beats delaying everything behind it.',
      },
    },
    body: [
      'The layers, briefly, so the words are not mysterious. **IP** gets a packet to a machine. **TCP** sits on top and turns unreliable packets into a reliable ordered stream. **HTTP** sits on top of that and defines requests and responses. **TLS** wraps it for encryption, which is what the S in HTTPS means.',
      '**REST** is a style, not a technology: resources have URLs, and HTTP verbs act on them — GET reads, POST creates, PUT replaces, DELETE removes. Its real advantages are that everything understands it and that GETs are cacheable by browsers, proxies and CDNs, which is a large performance win you get for free.',
      '**RPC** flips the model: instead of resources, you call a function on another machine as if it were local. gRPC is the common modern version, using a compact binary format instead of JSON and HTTP/2 underneath, which makes it meaningfully faster and gives you generated clients and streaming. The cost is that it is awkward to consume from a browser, harder to debug because you cannot read it, and not cacheable by the HTTP machinery.',
      'The rule of thumb worth stating: **REST at the edge, RPC inside.** Public API where you do not control the caller and want caching — REST. Internal service-to-service calls at high volume where you control both ends — gRPC. And the leaky part of RPC deserves naming: making a remote call look like a local function call encourages people to forget it can fail, be slow, or happen twice. It cannot; it can; and it will.',
      'One design-level point that matters more than the protocol choice: the number of calls usually costs you more than the protocol does. Twenty sequential calls at 20 ms each is 400 ms whatever wire format you picked. Batching and parallelism beat protocol tuning nearly every time.',
    ],
    followUp: {
      q: '"Why would you use gRPC internally but REST at the edge?"',
      answer:
        'Different constraints on either side. Internally I control both ends, calls are high volume, and I care about the cost per call — gRPC gives me a compact binary encoding instead of JSON, HTTP/2 multiplexing so many calls share a connection, generated clients on both sides, and a schema that makes breaking changes visible at build time rather than in production. At the edge none of those matter as much as reach and caching: any client in the world can consume REST over HTTP, browsers speak it natively, and GET responses are cacheable by the CDN and the browser, which is a large win I would be throwing away. There is also a debugging argument — I can curl a REST endpoint and read the answer, which matters at three in the morning. The cost of running both is a translation layer at the boundary, which is usually the gateway, and I think that is worth it.',
    },
    selfCheck: {
      q: 'Live video streaming usually uses UDP rather than TCP. Why is losing data better than waiting for it here?',
      answer:
        'Because a video frame has an expiry. If a packet is lost, TCP will stop and resend it, and everything behind it waits — so a single lost packet becomes a visible stall, and when the missing frame finally arrives it is from two seconds ago and worthless. UDP just carries on: the lost frame leaves a momentary glitch, and the picture stays live. The general principle is that TCP\'s guarantee of ordered delivery is exactly wrong for data whose value drops to zero with age. The same reasoning applies to voice calls, multiplayer game positions, and high-volume metrics, where you would rather lose one sample than delay every sample after it.',
    },
    traps: [
      'Choosing UDP for speed and then reimplementing retries and ordering on top of it.',
      'Treating an RPC call like a local function — it can fail, hang, or execute twice.',
      'Optimising the wire format when the real cost is making twenty sequential calls.',
    ],
    sayThis:
      '"REST over HTTP at the edge, because anything can consume it and GETs are cacheable by the CDN. gRPC between internal services, because I control both ends and want the compact encoding and a schema. And I would batch these calls before I worry about either — twenty round trips costs more than the format does."',
    related: ['realtime-transports', 'reverse-proxy', 'latency-numbers'],
  },
]
