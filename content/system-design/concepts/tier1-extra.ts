import type { Concept } from '@/lib/types'

/**
 * Foundational topics that come before, or alongside, the original Tier 1 set.
 *
 * House style: short sentences, everyday words, one idea per sentence.
 */
export const TIER1_EXTRA: Concept[] = [
  {
    slug: 'performance-vs-scalability',
    title: 'Performance vs scalability',
    tier: 1,
    oneLine: 'Fast for one person is not the same as staying fast for a million.',
    problem: [
      'These two words get used as if they mean the same thing. They do not. Mixing them up sends people off to fix the wrong problem.',
      '**Performance** asks: is it fast right now, for one user? **Scalability** asks: does it stay just as fast when there are a hundred times more users?',
      'A system can be fast and still not scale. It is quick with ten users and unusable with ten thousand. A system can scale and still be slow. Every request takes two seconds, whether you have ten users or ten million. At least that is honest and predictable.',
    ],
    cost: 'Chasing the wrong one wastes weeks. Speeding up code that was never the bottleneck buys you nothing. And building for scale you do not have costs you on every future feature, because a spread-out system is slower to change than a simple one.',
    useWhen: [
      'Someone says "it is slow". Ask whether it is slow for everyone, or only when busy. That one question tells you which problem you have.',
      'Deciding whether to speed up the code or add machines.',
    ],
    avoidWhen: [
      'Do not use this split as an excuse to skip measuring. Both questions are answered with real numbers, not with arguments.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'Two different problems that both get called "slow".',
        a: {
          title: 'A performance problem',
          points: [
            'Slow even with one user and no load.',
            'Usually a missing index, an N+1 query, or work being done that need not be.',
            'Adding machines does not help. Every machine is equally slow.',
            'Fix: profile it, find the slow part, make it do less work.',
          ],
        },
        b: {
          title: 'A scalability problem',
          points: [
            'Fine when quiet, falls apart when busy.',
            'Something shared is running out: a database, a lock, a connection pool.',
            'Response times climb as users climb, then fall off a cliff.',
            'Fix: remove the shared bottleneck, or spread it across more machines.',
          ],
        },
        verdict:
          'Ask one question: is it slow when nobody else is using it? If yes, it is a performance problem and more machines will not save you. If no, something shared is running out, and that is what you go and find.',
      },
    },
    body: [
      'The easy way to tell them apart is to look at a graph of response time against load. A performance problem is a flat line that sits too high. It is bad everywhere, equally. A scalability problem is a line that is fine, fine, fine, then bends sharply upward. That bend is the point where a shared resource ran out.',
      'There are two ways to grow, and the names matter. **Scaling up (vertical)** means a bigger machine: more CPU, more memory. It is simple and needs no code changes. It has a ceiling, and getting there needs a restart. **Scaling out (horizontal)** means more machines. There is no ceiling, but it forces you to keep state off your servers and to think about how they share data.',
      'Scaling up is honestly underrated. The machines you can rent today are huge, and one big database is far easier to run than twenty small ones. Reach for it first. Move to scaling out when you can name the limit you are hitting.',
    ],
    followUp: {
      q: '"Your service is slow. Do you add more servers?"',
      answer:
        'Not before I know which problem it is. If it is slow with one user and no load, more servers change nothing. Every new server is equally slow, and I have spent money to make the same request take the same time. That is a performance problem, so I would profile one request and find where the time goes. It is usually a missing index or a call made inside a loop. If it is only slow under load, then something shared is running out, and I want to know what before adding capacity. If the bottleneck is the database, adding application servers makes it worse, not better, because they pile on more connections.',
    },
    selfCheck: {
      q: 'Your app takes 3 seconds per request whether 1 person or 1,000 people are using it. Performance or scalability problem — and does adding servers help?',
      answer:
        'A performance problem, and no, adding servers does not help. The giveaway is that load makes no difference. Those 3 seconds are work done inside a single request, so every server you add will also take 3 seconds. You need to find what spends those 3 seconds. Profile it and look for a query with no index, a call inside a loop, or something being computed that could be prepared in advance. Adding machines only helps when the machines are the limit, and here they clearly are not. Interestingly, this system scales fine. It is just slow for everyone.',
    },
    traps: [
      'Adding servers to fix a problem that is already there at zero load.',
      'Assuming a system that is fast today will stay fast. Speed now tells you nothing about the shape of the curve.',
    ],
    sayThis:
      '"Is it slow with one user, or only when busy? If it is slow when quiet, that is a performance problem and more machines will not help. If it gets worse with load, something shared is running out and I want to know what before I spend money."',
    related: ['latency-vs-throughput', 'back-of-envelope', 'load-balancing'],
  },

  {
    slug: 'latency-vs-throughput',
    title: 'Latency vs throughput',
    tier: 1,
    oneLine: 'How long one thing takes, versus how many things you finish per second.',
    problem: [
      '**Latency** is how long a single request takes, measured in milliseconds. **Throughput** is how many requests you finish per second.',
      'They sound like the same thing said two ways. They are not. You can improve one and make the other worse, and that is exactly what many real engineering decisions do.',
      'Confusing them means you improve the wrong number, then wonder why nobody is happier.',
    ],
    cost: 'Almost everything that raises throughput adds latency. Almost everything that cuts latency wastes capacity. Batching, queueing and connection pooling all get more work done per second by making single requests wait. You have to know which of the two your users actually feel.',
    useWhen: [
      'Deciding whether to batch. Batching always raises throughput and always raises latency.',
      'Setting a target. "Fast" is not a target. "p99 under 200 ms at 5,000 requests a second" is.',
      'Reading a benchmark someone hands you. Check which of the two it measured.',
    ],
    avoidWhen: [
      'Do not chase throughput on a path where one person is waiting. They cannot feel your requests per second. They feel their one request.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'A motorway is the standard comparison, and it is a good one.',
        items: [
          { label: 'Latency — how long your car takes to drive the route', value: 30, display: '30 minutes', tone: 'accent' },
          { label: 'Throughput — cars completing the route per hour', value: 2000, display: '2,000 cars / hour', tone: 'muted' },
        ],
        note: 'Adding lanes raises throughput and does nothing for your 30 minutes. Raising the speed limit cuts latency for everyone. They are separate levers, and most systems only have room to pull one.',
      },
    },
    body: [
      'Averages lie, and this is the part worth taking to heart. Nobody experiences your average latency. Say your average is 100 ms, but one request in a hundred takes four seconds, and a page makes twenty requests. Then most page loads contain at least one slow request. So you quote **percentiles** instead. p50 is the middle. p99 is the request that is worse than 99% of the others. p99 is what your unhappiest users live in, and it is the number worth putting on a dashboard.',
      'Here is the trade in concrete terms. Batching a hundred database writes into one statement raises throughput a lot, because you pay the round trip once instead of a hundred times. It also raises latency for the first write in the batch, which now waits for the other ninety-nine to arrive. That is a good trade for analytics and a terrible one for a checkout button.',
      'One more relationship worth knowing. As a system nears its throughput limit, latency does not get slowly worse. It stays flat, flat, flat, and then climbs almost straight up, because requests start queueing behind each other. That is why "we are at 85% capacity" is much closer to trouble than it sounds.',
    ],
    followUp: {
      q: '"Your p50 is 20 ms and your p99 is 3 seconds. What is going on?"',
      answer:
        'A gap that big is not the same work running slower. It is a different path, or a different shape of data. The usual causes, in order. Skewed data, where a few users have far more rows than a typical user, so their queries run differently. Queueing, where requests wait on something that has run out, like a connection pool. That shows up as two clusters of response times rather than a smooth curve. A dependency with its own bad tail that I call and wait for. Or garbage collection pauses. I would first check whether the response times form two clusters, because that points straight at queueing, and then trace one slow request end to end. There is also a structural cause worth naming. If a request fans out to many services and waits for all of them, my p99 becomes the p99 of the slowest one, which is far worse than any single service\'s p99.',
    },
    selfCheck: {
      q: 'You batch 100 writes into one database call. What happened to latency, and what happened to throughput?',
      answer:
        'Throughput went up, probably a lot. You now pay one network round trip and one commit for a hundred writes, instead of a hundred of each. Latency went up too, for each individual write. The first one in the batch waits until the batch fills or a timer fires before anything is sent. That is the trade in its purest form. It is the right call when nobody is waiting on any single write: analytics events, log lines, view counts. It is the wrong call when a person is watching a spinner, waiting for their one write to finish.',
    },
    traps: [
      'Quoting averages. Nobody experiences the average. Quote p50 and p99.',
      'Chasing throughput on a path where a person is waiting.',
      'Assuming latency gets slowly worse as you near capacity. It does not. It hits a wall.',
    ],
    sayThis:
      '"Latency is one request. Throughput is requests per second. I would batch here, because nothing is waiting on any single write — that raises throughput and adds a little latency nobody can feel. On the checkout path I would not, because there one person is watching their one request."',
    related: ['performance-vs-scalability', 'latency-numbers', 'back-of-envelope'],
  },

  {
    slug: 'availability-patterns',
    title: 'Availability, failover and the nines',
    navTitle: 'Availability and failover',
    tier: 1,
    oneLine: 'How much downtime you are promising, and what it costs to promise less.',
    problem: [
      'Availability is the share of time your system actually answers. People say "highly available" as if it were a setting you turn on. It is a number, it has a price, and each extra nine costs roughly ten times the one before it.',
      'The other half is failover. When a machine dies, what takes over, how fast, and what gets lost in the handover?',
    ],
    cost: 'Every nine costs money and complexity. Going from 99.9% to 99.99% means removing every single point of failure, making recovery automatic, and testing it. The work does not add up in a straight line, it multiplies. Redundancy also brings its own new failures: a failover that triggers by mistake can cause an outage that would never have happened.',
    useWhen: [
      'Agreeing a target with the business, before you design anything.',
      'Deciding how much backup a specific path needs. Different paths should get different answers.',
      'Working out whether a dependency is allowed on your critical path at all.',
    ],
    avoidWhen: [
      'Do not promise nines you have not priced. "Five nines" is 26 seconds of downtime a year, including deploys.',
      'Do not add backups everywhere equally. Some paths really can be down for an hour.',
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
        note: 'Five nines is five minutes a year in total, including every deploy and every dependency failure. Most products do not need it and cannot afford it.',
      },
    },
    body: [
      'There are two ways to arrange failover, and the difference matters. **Active-passive**: one machine serves, and a standby sits idle watching for a heartbeat. When the heartbeat stops, it takes over. It is simple, but you pay for hardware doing nothing, and the standby never sees real traffic. That is how you discover it does not work at the worst possible moment. **Active-active**: both machines serve traffic all the time, so both are constantly proven to work. Better use of money, and no cold standby surprise. The cost is that you now have data being written in two places.',
      'The maths of combining parts is worth knowing, because it is not obvious. Parts **in sequence** — where a request must pass through all of them — multiply their availabilities. Two parts at 99.9% each give 99.8% together. So adding dependencies to a critical path always lowers availability. Parts **in parallel** — where either one can serve — multiply their failure rates instead. Two 99.9% parts in parallel give 99.9999%. That one fact is the whole argument for redundancy, and the whole argument against long chains of dependencies.',
      'Here is the uncomfortable truth about failover: noticing takes time. Something has to see that the machine is gone. If it decides too fast, it will fail over during a brief network hiccup and cause an outage. If it decides too slowly, you are down. That window is downtime you cannot design away. You can only make it shorter.',
      'And here is the thing nobody puts in the availability budget. Most outages are not hardware. They are deploys and config changes. Redundancy protects you from a machine dying, which is rare. It does nothing about shipping a bug to every machine at once, which is common.',
    ],
    followUp: {
      q: '"You want four nines. What does that actually require?"',
      answer:
        'Fifty-two minutes of downtime a year, in total. To get there you need several things. No single point of failure anywhere on the critical path, which means at least two of everything, including the load balancer people forget about. Automatic failover that has actually been tested, because an untested failover is only a theory. Deploys that do not take the service down, so rolling releases and backwards-compatible migrations. And isolated dependencies, so a slow third party breaks one feature instead of the whole product. Then the honest part: my dependencies cap me. If I call a payment provider that offers 99.9%, my checkout path cannot beat 99.9%, no matter what I do. So either that call comes off the critical path, or four nines on checkout is not a promise I can make. I would also point out that most of my real downtime will come from deploys and config changes, not hardware. So the highest-value work is probably gradual rollouts and fast rollback, not more redundancy.',
    },
    selfCheck: {
      q: 'Two services, each 99.9% available. What is the combined availability if a request needs both? What if either will do?',
      answer:
        'If a request needs both, they are in sequence, so you multiply the availabilities: 0.999 × 0.999 = 0.998, which is 99.8%. That is worse than either one alone. Every dependency you add to a critical path drags the number down. If either will do, they are in parallel, so you multiply the failure rates instead: 0.001 × 0.001 = 0.000001, which is 99.9999%. That difference is the whole game. Chains of dependencies make you less available. Duplicated parts make you more available. It is why good designs keep critical paths short and duplicate anything sitting on them.',
    },
    traps: [
      'Promising nines without counting your dependencies. They cap you.',
      'An untested failover. If it has never been used, it is a guess.',
      'Forgetting that deploys and config changes cause most outages, and redundancy helps with neither.',
    ],
    sayThis:
      '"Three nines is nearly nine hours a year, four nines is under an hour. I would aim for three on this path, and be honest that my payment provider caps me anyway. Active-active rather than active-passive, because a standby that never takes traffic is a standby I do not trust."',
    related: ['replication', 'load-balancing', 'circuit-breakers'],
  },
  {
    slug: 'dns',
    title: 'DNS — how a name becomes a server',
    navTitle: 'DNS',
    tier: 1,
    oneLine: 'The phone book of the internet, and the first thing that happens on every request.',
    problem: [
      'People type names. Machines need addresses. DNS turns `example.com` into an IP address, and it all happens before your servers are involved at all.',
      'It matters in system design for two reasons. It sits on the path of every first request. And it is the roughest tool you have for sending users to different places.',
    ],
    cost: 'Answers are cached all over the internet: in the browser, the operating system, the router, the internet provider. Those caches only loosely respect your TTL. So a DNS change is not a switch you flip. It rolls out over minutes to hours, and some clients ignore it completely. That makes DNS a poor way to fail over on its own.',
    useWhen: [
      'Sending users to the nearest region (geographic routing).',
      'Rough traffic splitting between environments or providers.',
      'Very slow, planned migrations, where hours of rollout are fine.',
    ],
    avoidWhen: [
      'Fast failover. Minutes of cached answers means minutes of users hitting a dead address.',
      'Balancing per request. Use a real load balancer for that. DNS has no idea which server is busy or healthy.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The lookup, once. After this it is cached at every layer for the length of the TTL — which is why changes take so long to take effect.',
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
      'You only need a few record types. **A** maps a name to an IPv4 address, and **AAAA** to IPv6. **CNAME** points one name at another name, which is how you point at a CDN or a managed service without writing their addresses down. **MX** is for mail. That is enough for design conversations.',
      'The **TTL** is the number that controls everything. It tells everyone how long they may keep the answer. Long TTLs mean fast lookups and slow changes. Short TTLs mean the opposite, plus more load on your DNS. The standard trick before a planned migration is to drop the TTL to sixty seconds a day in advance, make the change, then put it back up.',
      'Routing policies are where DNS earns its place in a design. **Round robin** hands out different addresses in turn. That is rough balancing with no idea of health. **Geographic** sends users to the nearest region, which is how global products cut latency. **Latency-based** measures and sends users to whichever region is actually fastest for them. **Failover** returns the backup address when health checks fail. That is real, but limited by cached answers, so think in minutes, not seconds.',
      'The practical takeaway: DNS gets users to the right *region* or the right *front door*. A load balancer takes over from there and gets them to the right *server*. Do not ask DNS to do the second job.',
    ],
    followUp: {
      q: '"Your primary region is down. Can you just change DNS?"',
      answer:
        'You can, but you should not rely on it as your only answer, because it is slow and partly out of your control. Even with a sixty-second TTL, resolvers, browsers and company networks cache more than they promise. So a real share of users keep hitting the dead address for minutes, and some for much longer. DNS failover is a real tool for the long tail, but it is not a fast one. What gives you quick failover is something in front that already receives all the traffic and can redirect internally. That means anycast, where the same IP is announced from several places and the network routes to a live one, or a global load balancer that ends connections itself and picks a healthy backend. My design would use DNS to get users to a nearby front door, and put the fast failover behind that front door where I control it.',
    },
    selfCheck: {
      q: 'Why is DNS a bad way to do fast failover, and what would you use instead?',
      answer:
        'Because the answer is cached in places you do not control: the browser, the operating system, the router, the internet provider\'s resolver. Many of them follow your TTL only loosely, or ignore it. So when you point the name at a new address, users keep going to the old one for minutes at best, sometimes far longer, and you cannot make them stop. For fast failover you want something already in the request path that can redirect without asking DNS again. That means anycast, where several locations announce the same IP and the network picks a live one, or a global load balancer that health-checks backends and routes internally. DNS is fine for getting users to a region. It is the wrong layer for reacting to an outage in seconds.',
    },
    traps: [
      'Treating DNS as a load balancer. It has no idea which servers are healthy or busy.',
      'Trusting your TTL. Plenty of resolvers do not.',
      'Forgetting DNS lookup time in the time budget of a first request.',
    ],
    sayThis:
      '"DNS routes users to the nearest region, not to a specific server — that is the load balancer\'s job. I would not rely on DNS for failover, because cached answers mean minutes of users still hitting the dead address. Anycast or a global load balancer handles that properly."',
    related: ['load-balancing', 'cdn', 'availability-patterns'],
  },

  {
    slug: 'reverse-proxy',
    title: 'Reverse proxies and gateways',
    navTitle: 'Reverse proxies',
    tier: 1,
    oneLine: 'One front door that handles the boring, repeated work before anything reaches your code.',
    problem: [
      'A reverse proxy sits in front of your servers and receives every request first. Clients talk to it, and it talks to your services. It gives you one place to do the work that every service would otherwise repeat.',
      'That work is: handling HTTPS, compressing responses, serving static files, rate limiting, checking logins, routing by path, and logging.',
    ],
    cost: 'One more hop, one more thing to configure, and one more thing that can be set up wrongly in a way that affects everything at once. It is also a single point of failure unless you run more than one. And putting too much logic in it creates a part that nobody owns and that everything quietly depends on.',
    useWhen: [
      'Anything that should happen the same way for every request: TLS, compression, request logging, rate limits.',
      'Putting several services behind one domain, routed by path.',
      'Hiding your internal layout from the outside world.',
      'Serving static files, so application servers never see those requests.',
    ],
    avoidWhen: [
      'Business logic. Once routing rules start expressing product decisions, you have a distributed system living in a config file.',
      'A single service with nothing shared to do. Then it is a hop for nothing.',
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
      'People get asked how a reverse proxy differs from a load balancer. The honest answer is that they overlap a lot, and the same software usually does both. Here is the difference. A **load balancer** exists to spread traffic across several identical servers. A **reverse proxy** exists to be a front door, and it is useful even with exactly one server behind it, because it still handles TLS and serves static files. In practice nginx, Envoy and every cloud load balancer do both jobs. Say that, rather than pretending they are separate boxes.',
      'An **API gateway** is a reverse proxy with stronger opinions. It checks logins, applies per-customer rate limits, reshapes requests, and often combines several backend calls into one response. It is the natural home for the things every public API needs. The risk is that it grows until it holds business logic, and then deploying anything means deploying the gateway.',
      'A **forward proxy** is the mirror image, and it deserves one sentence so the names do not confuse you. It sits in front of *clients* rather than servers. It is what a company uses to control and inspect traffic leaving its own network.',
      'Two things catch people out. First, if TLS ends at the proxy, then traffic behind it is plain HTTP. That is fine inside a trusted network and not fine across the public internet, so know which one you have. Second, the proxy is where the client\'s real IP address gets lost. That is why `X-Forwarded-For` exists, and why rate limiting by IP breaks if you forget to read it.',
    ],
    followUp: {
      q: '"What is the difference between a reverse proxy and a load balancer?"',
      answer:
        'Mostly framing, and the same software usually does both, which is worth saying instead of inventing a clean split. A load balancer exists to spread traffic across several identical servers, and it is meaningless with one server. A reverse proxy exists to be a front door: handling TLS, compressing, serving static files, applying rate limits, routing by path. That is useful even with a single backend. So the way I think about it is that load balancing is one feature a reverse proxy usually has. In a design I would draw one box and say what it does, rather than draw two boxes to satisfy a vocabulary question. And I would remember to run more than one of them, because whatever I call it, it is now in front of everything.',
    },
    selfCheck: {
      q: 'Name three things worth doing in a reverse proxy rather than in each service, and one thing that should not go there.',
      answer:
        'Worth putting there: TLS termination, so no service handles certificates. Rate limiting, because rejecting a request at the edge is cheap, and rejecting it after it has reached a service wastes the very thing you were protecting. And serving static files, so application servers never see those requests. Compression and access logging are equally good answers. What should not go there is business logic. The moment routing rules start encoding product decisions — which customers see which feature, how a response is reshaped for one client — you have logic in a config file that no team owns, that cannot be tested like code, and that must be deployed to change anything. Keep the proxy doing shared mechanics, not decisions.',
    },
    traps: [
      'Forgetting the proxy needs a backup of its own. It is now in front of everything.',
      'Losing the client IP, then rate limiting every user as if they were one person.',
      'Letting the gateway collect business logic until it is the riskiest deploy you have.',
    ],
    sayThis:
      '"One reverse proxy in front doing TLS, compression and rate limiting, so no service repeats that work. It is also the load balancer — same box — and I will run at least two of them, because it is now in front of everything."',
    related: ['load-balancing', 'rate-limiting', 'cdn'],
  },

  {
    slug: 'communication-protocols',
    title: 'HTTP, TCP, UDP, REST and RPC',
    navTitle: 'HTTP, TCP, UDP, RPC',
    tier: 1,
    oneLine: 'How two machines actually talk, and which style to pick between your own services.',
    problem: [
      'Everything in a distributed system is machines sending each other messages. A few choices decide what those messages cost, and what happens when one goes missing.',
      'You do not need the inner workings of each protocol. You need to know what each one promises, what it costs, and when to reach for it.',
    ],
    cost: 'Every step up in promises costs time. TCP promises delivery and order, and pays for it with handshakes and resends. HTTPS adds another round trip for encryption. Styles with lots of small calls multiply those costs by the number of calls, which is how a design gets slow without any single part being slow.',
    useWhen: [
      'TCP: anything where losing a message is not acceptable, which is almost everything.',
      'UDP: video, voice, games, metrics — where a late message is worthless, and losing one beats delaying the rest.',
      'REST over HTTP: public APIs, anything crossing between companies, anything a CDN should cache.',
      'RPC (usually gRPC): high-volume calls between your own services, where you control both ends.',
    ],
    avoidWhen: [
      'Do not use UDP because it sounds faster. If you then rebuild delivery and ordering on top, you have written a worse TCP.',
      'Do not put gRPC on a public API. REST over HTTP is what the rest of the world can use and cache.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The one protocol decision that actually changes a design.',
        a: {
          title: 'TCP — reliable, ordered',
          points: [
            'Every byte arrives, in order, or the connection fails loudly.',
            'Costs a handshake to set up, and resends anything lost.',
            'A lost packet holds up everything behind it while it is resent.',
            'Right for: APIs, databases, file transfer — nearly everything.',
          ],
        },
        b: {
          title: 'UDP — fast, no promises',
          points: [
            'Send and forget. No handshake, no retries, no ordering.',
            'A lost packet is simply gone, and the next one still arrives on time.',
            'You handle loss yourself, or you design so that loss does not matter.',
            'Right for: live video and voice, games, high-volume metrics.',
          ],
        },
        verdict:
          'Default to TCP. Choose UDP only when a late message is worth less than no message. A video frame from two seconds ago is useless, so dropping it beats delaying everything behind it.',
      },
    },
    body: [
      'Here are the layers, briefly, so the words stop being mysterious. **IP** gets a packet to a machine. **TCP** sits on top and turns unreliable packets into a reliable, ordered stream. **HTTP** sits on top of that and defines requests and responses. **TLS** wraps it all for encryption, which is what the S in HTTPS means.',
      '**REST** is a style, not a technology. Resources have URLs, and HTTP verbs act on them: GET reads, POST creates, PUT replaces, DELETE removes. Its real advantages are that everything understands it, and that GET requests can be cached by browsers, proxies and CDNs. That is a large speed win you get for free.',
      '**RPC** turns the model around. Instead of resources, you call a function on another machine as if it were local. gRPC is the common modern version. It uses a compact binary format instead of JSON, and HTTP/2 underneath, which makes it clearly faster and gives you generated clients and streaming. The cost is that it is awkward to use from a browser, harder to debug because you cannot read it, and not cacheable by the normal HTTP machinery.',
      'The rule of thumb is worth saying out loud: **REST at the edge, RPC inside.** A public API where you do not control the caller and want caching: REST. High-volume calls between your own services where you control both ends: gRPC. And RPC has one leak worth naming. Making a remote call look like a local function call tempts people to forget it can fail, be slow, or happen twice. It cannot be forgotten, it can happen, and it will.',
      'One design-level point matters more than the protocol choice: the number of calls usually costs you more than the format does. Twenty calls in a row at 20 ms each is 400 ms, whatever wire format you picked. Grouping calls and running them at the same time beats protocol tuning nearly every time.',
    ],
    followUp: {
      q: '"Why would you use gRPC internally but REST at the edge?"',
      answer:
        'The two sides have different constraints. Inside, I control both ends, calls are high volume, and I care about the cost of each call. gRPC gives me a compact binary encoding instead of JSON, HTTP/2 so many calls share one connection, generated clients on both sides, and a schema that makes breaking changes show up at build time instead of in production. At the edge, none of that matters as much as reach and caching. Any client in the world can use REST over HTTP, browsers speak it natively, and GET responses can be cached by the CDN and the browser, which is a big win I would be throwing away. There is also a debugging argument: I can curl a REST endpoint and read the answer, which matters at three in the morning. The cost of running both is a translation layer at the boundary, usually the gateway, and I think that is worth it.',
    },
    selfCheck: {
      q: 'Live video streaming usually uses UDP rather than TCP. Why is losing data better than waiting for it here?',
      answer:
        'Because a video frame goes out of date. If a packet is lost, TCP stops and resends it, and everything behind it waits. So one lost packet becomes a visible freeze, and when the missing frame finally arrives it is two seconds old and worthless. UDP just carries on. The lost frame leaves a brief glitch, and the picture stays live. The general principle is that TCP\'s promise of ordered delivery is exactly wrong for data whose value drops to zero with age. The same reasoning covers voice calls, player positions in games, and high-volume metrics, where you would rather lose one sample than delay every sample after it.',
    },
    traps: [
      'Choosing UDP for speed, then rebuilding retries and ordering on top of it.',
      'Treating an RPC call like a local function. It can fail, hang, or run twice.',
      'Tuning the wire format when the real cost is making twenty calls one after another.',
    ],
    sayThis:
      '"REST over HTTP at the edge, because anything can use it and GETs are cacheable by the CDN. gRPC between internal services, because I control both ends and want the compact encoding and a schema. And I would group these calls before I worry about either — twenty round trips costs more than the format does."',
    related: ['realtime-transports', 'reverse-proxy', 'latency-numbers'],
  },
]
