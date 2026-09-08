import type { DeepDive, WorkedExample } from '@/lib/types'

export const LOAD_BALANCING_DEEP: DeepDive = {
  intro:
    'The summary said "spread requests across servers and skip the broken ones". That is true and it hides every decision that matters. This page covers the two layers you can balance at, all six routing algorithms and when each is actually right, how health checks work and how they take down whole fleets, sticky sessions and why to avoid them, and the failure modes nobody plans for.',
  minutes: 18,
  sections: [
    {
      heading: 'Layer 4 vs Layer 7 — what the balancer is allowed to read',
      body: [
        'The first decision is how much of the request the balancer looks at, and it changes what it can do for you.',
        '**Layer 4** works at the TCP level. It sees an IP address and a port, and nothing else — it does not open the request. It picks a server and shovels bytes between the two connections. Because it never parses anything, it is extremely fast and works for any protocol: HTTP, database connections, game traffic, anything.',
        '**Layer 7** reads the actual HTTP request — the path, the headers, the cookies. That means it can send `/api` to one pool and `/images` to another, terminate HTTPS, add headers, and retry a failed request on a different server because it still has the request in hand. It costs more CPU per request because someone has to parse and re-serialise, and it only works for protocols it understands.',
      ],
      points: [
        'Layer 4 is faster and protocol-agnostic; it cannot make decisions based on what the request says.',
        'Layer 7 can route by path, host or header, terminate TLS, rewrite, compress and retry — because it understands the request.',
        'Only Layer 7 can safely retry, since Layer 4 has already streamed bytes to a server it cannot take back.',
        'Layer 7 sees the client IP and must forward it in `X-Forwarded-For`, or every backend thinks all traffic comes from the balancer.',
        'Default to Layer 7 for web traffic. Use Layer 4 for raw throughput, non-HTTP protocols, or when you must not decrypt.',
      ],
      table: {
        caption: 'The practical differences.',
        headers: ['', 'Layer 4', 'Layer 7'],
        rows: [
          ['Sees', 'IP and port only', 'Path, headers, cookies, body'],
          ['Speed', 'Very fast, minimal CPU', 'Slower — parses every request'],
          ['Protocols', 'Anything over TCP/UDP', 'Only what it understands (HTTP, gRPC)'],
          ['Can route by path', 'No', 'Yes'],
          ['Can terminate TLS', 'No (passes through)', 'Yes'],
          ['Can retry elsewhere', 'No', 'Yes'],
          ['Typical use', 'Databases, game servers, extreme scale', 'Web and API traffic — the default'],
        ],
      },
      callouts: [
        {
          variant: 'say-this',
          text: '"Layer 7, because I want path-based routing and TLS termination in one place, and because it can retry a failed request on another server. If this were database traffic I would use Layer 4 instead — it does not need to read anything and I do not want the overhead."',
        },
      ],
    },

    {
      heading: 'Round robin — take turns',
      body: [
        'The simplest possible rule: keep a list of servers and hand each new request to the next one in the list, wrapping around at the end. Server 1, 2, 3, 1, 2, 3.',
        'It is really fine when two things are true: every server is the same size, and every request costs about the same. In that world, taking turns spreads load perfectly and costs nothing to compute.',
        'It falls apart when requests differ. Imagine one request in twenty is a report that takes ten seconds while the rest take 20 ms. Round robin cheerfully sends the next request to a server already grinding on a report, because it is that server\'s turn. It has no idea anyone is busy — that is the whole limitation. It counts requests, not work.',
      ],
      points: [
        'Hands out requests in strict rotation, ignoring how busy anyone is.',
        'Perfect when servers are identical and requests cost the same.',
        'Bad when request cost varies — it will pile work onto a server that is already struggling.',
        'Costs almost nothing to compute and needs no state about the backends.',
      ],
      visuals: [
        {
          type: 'flow',
          flow: {
            scenario: 'round-robin',
            caption:
              'Strict rotation. Notice the balancer never checks whether a server is busy — it just advances the pointer.',
          },
        },
      ],
      callouts: [
        {
          variant: 'trap',
          text: 'Round robin looks fair and is not, whenever request cost varies. The distribution of *requests* is even; the distribution of *work* can be wildly uneven, and work is what saturates a server.',
        },
      ],
    },

    {
      heading: 'Weighted round robin — for servers that are not the same size',
      body: [
        'Same rotation, but each server gets a weight and receives requests in proportion. A machine with weight 3 gets three requests for every one that a weight-1 machine gets.',
        'This exists because real fleets are rarely uniform. You add newer, bigger instances over time, or you run a mix of instance types to control cost. Without weights, your biggest machine sits at 20% while your smallest is on fire.',
        'It is also the mechanism behind gradual rollouts: give the new version weight 1 against the old version\'s weight 99, watch the error rate, then shift the weights. That is a canary deploy, implemented entirely in the load balancer.',
      ],
      points: [
        'Traffic split in proportion to each server\'s weight.',
        'Use when the fleet is heterogeneous on purpose — mixed instance sizes.',
        'The mechanism behind canary releases and blue-green traffic shifting.',
        'Weights are static, so it still does not react to a server actually being busy.',
      ],
      visuals: [
        {
          type: 'flow',
          flow: {
            scenario: 'weighted',
            caption:
              'A 3:1:1 split. The same idea drives canary deploys — send 1% to the new version, watch, then shift the weight.',
          },
        },
      ],
    },

    {
      heading: 'Least connections — the one to actually use',
      body: [
        'Instead of taking turns, send each request to whichever server currently has the fewest open connections. It is a live measure of how busy each server is, rather than an assumption that they are all equal.',
        'This handles the case round robin cannot. When a server picks up a slow request, its connection count stays high, so the balancer naturally routes around it until it catches up. Nobody had to configure anything — the metric self-corrects.',
        'For most real web traffic, where some requests are easily fast and others are much slower, this is the sensible default. **Least response time** is a refinement that also weighs how quickly each server has been answering, which catches a server that is degraded but still accepting connections.',
      ],
      points: [
        'Routes to whichever backend has fewest connections open right now.',
        'Automatically avoids a server stuck on slow work — no configuration needed.',
        'The right default when request cost varies, which is most systems.',
        'Requires the balancer to track per-server state, so it is slightly more work than round robin.',
        'Least response time additionally accounts for how fast each server is replying.',
      ],
      visuals: [
        {
          type: 'flow',
          flow: {
            scenario: 'least-connections',
            caption:
              'Every request goes to the least busy server. When one gets stuck on slow work, traffic flows around it automatically.',
          },
        },
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Least connections rather than round robin, because request cost varies a lot here — some of these calls are 20 ms and some are multi-second exports. Round robin would keep feeding requests to a server already stuck on an export."',
        },
      ],
    },

    {
      heading: 'IP hash and consistent hashing — sending the same user to the same place',
      body: [
        'Hash something about the request — the client IP, a user id, a cache key — and use the hash to pick the server. The same input always produces the same server.',
        'The reason to want this is cache locality. If each server keeps an in-memory cache, sending the same user to the same server means their data is probably already there. Without it, every server ends up caching everything, which wastes memory and lowers hit rates.',
        'Plain modulo hashing has a serious flaw: `hash(key) % N` changes for almost every key when N changes. Add or remove one server and nearly every user moves, so every in-memory cache is suddenly wrong at the moment you were trying to add capacity.',
        '**Consistent hashing** fixes exactly this. Servers are placed around a circle, a key belongs to the first server clockwise from it, and adding a server only reassigns the slice behind it — about 1/N of keys, not all of them.',
      ],
      points: [
        'Same client, same server — which makes per-server caches actually work.',
        'Plain `% N` moves almost every key when the server count changes. Avoid it for anything cached.',
        'Consistent hashing moves only ~1/N of keys when the fleet changes size.',
        'IP-based hashing breaks when many users share one IP — an office, a university, a mobile carrier all land on one server.',
        'Any hashing scheme distributes *keys* evenly, never *traffic*. One very hot key still lands on exactly one server.',
      ],
      visuals: [
        {
          type: 'flow',
          flow: {
            scenario: 'ip-hash',
            caption: 'Deterministic routing — the same client lands on the same server every time.',
          },
        },
        {
          type: 'flow',
          flow: {
            scenario: 'consistent-hash-ring',
            caption:
              'Adding a node with consistent hashing. Only the keys in the arc behind it move; everyone else keeps their home.',
          },
        },
      ],
      callouts: [
        {
          variant: 'trap',
          text: 'Hashing balances keys, not load. If one key is 90% of your traffic, every hashing scheme in the world still sends 90% of traffic to one server. That is a hot-key problem and needs replication of that key, not a better hash.',
        },
      ],
    },

    {
      heading: 'Health checks — and how they take down entire fleets',
      body: [
        'A balancer is only useful if it stops sending traffic to broken servers, and health checks are how it knows. There are two kinds.',
        '**Passive** checks watch real traffic: if a server starts returning errors or timing out, mark it down. Free, since it uses requests you were sending anyway, but it only notices after real users have been affected.',
        '**Active** checks call a dedicated endpoint every couple of seconds. They catch a sick server before users do, at the cost of constant background traffic.',
        'Now the failure that catches people out, and it is worth remembering because it turns a small problem into a total outage. Suppose your health endpoint queries the database to prove the server "really works". The database gets slow. Every health check on every server times out simultaneously. The balancer dutifully marks the entire fleet unhealthy and removes all of it. Now nothing is serving — including all the requests that never needed the database.',
        'The fix is to separate two questions. **Liveness**: is this process alive and able to answer? Cheap, no dependencies, and the balancer uses this one. **Readiness**: is this instance ready for traffic, including its dependencies? Useful at startup and for orchestration, but dangerous as the sole routing signal. And a good balancer refuses to drain the last healthy instances — if everything looks unhealthy, keep serving anyway, because degraded beats dead.',
      ],
      points: [
        'Passive checks are free but only notice after users are hurt. Active checks catch it earlier and cost background traffic.',
        'A health check that touches shared dependencies can mark every server unhealthy at once.',
        'Liveness = is the process alive (cheap, no dependencies). Readiness = are dependencies fine. Route on liveness.',
        'Configure a minimum healthy pool, so the balancer never removes everything.',
        'Connection draining matters: take a server out, let in-flight requests finish, then stop it. Skipping this drops live traffic on every deploy.',
      ],
      visuals: [
        {
          type: 'flow',
          flow: {
            scenario: 'health-check',
            caption:
              'The balancer probes each backend. The one that stops answering is pulled from the pool and stops receiving traffic.',
          },
        },
      ],
      callouts: [
        {
          variant: 'trap',
          text: 'The health-check cascade is a real outage pattern, not a hypothetical: a slow database makes every health check time out, the balancer removes the whole fleet, and a partial degradation becomes a complete outage. Keep the liveness check dependency-free.',
        },
      ],
    },

    {
      heading: 'Sticky sessions — what they solve and why to avoid them',
      body: [
        'A sticky session pins a user to one server, usually with a cookie the balancer sets. Every request from that user goes back to the same place.',
        'People reach for it when servers keep session state in memory — logged-in user data, a shopping cart, a partially completed form. If request two lands on a different server, that state is not there, and the user gets logged out.',
        'It works, and it costs you more than it looks. Load becomes uneven, because users are not evenly distributed and long-lived sessions accumulate on whichever servers have been up longest. Scaling out helps less, because existing users stay pinned to existing servers and only new users reach the new ones. And when a server restarts — which happens on every deploy — everyone pinned to it loses their state at once.',
        'The better answer is nearly always to make servers stateless: put session data in a shared store like Redis, or in a signed token the client carries. Then any server can handle any request, restarts cost nothing, and the balancer is free to route on actual load.',
      ],
      points: [
        'Sticky sessions exist to work around in-memory state on the server.',
        'They cause uneven load, weaken horizontal scaling, and lose state on every restart.',
        'Prefer stateless servers with session state in a shared store or a signed token.',
        'If you must use them, keep the session data recoverable so a lost server is an inconvenience, not a logout.',
      ],
      callouts: [
        {
          variant: 'cost',
          text: 'Stickiness trades away the main benefit of horizontal scaling — that any server can serve any request — to avoid moving session state out of process. That is almost always the wrong trade.',
        },
      ],
    },

    {
      heading: 'The balancer itself is a single point of failure',
      body: [
        'This is the most common omission in interview diagrams. Someone draws one load balancer in front of five servers and calls the design highly available. It is not: those five servers are now protected by one box, and if it dies, all of them are unreachable.',
        'Real setups run at least two, and there are three ways to make that work. **Active-passive with a floating IP**: a standby takes over the address when the primary fails. **DNS round robin across several balancers**: crude, and DNS caching makes failover slow. **Anycast**: several locations announce the same IP address and the network routes to whichever is alive — the fastest failover available, and how large providers do it.',
        'In practice, if you are on a cloud provider, the managed load balancer already is a redundant distributed system, and the right answer in an interview is to say that explicitly rather than to draw a second box.',
      ],
      points: [
        'One load balancer in front of N servers means one failure takes out all N.',
        'Run at least two, or use a managed balancer that is already redundant.',
        'DNS failover between balancers is slow because clients cache DNS. Anycast is the fast option.',
        'Capacity planning must survive losing one: two balancers at 60% utilisation each cannot absorb the other\'s traffic.',
      ],
      visuals: [
        {
          type: 'flow',
          flow: {
            scenario: 'active-passive',
            caption: 'Active-passive: the standby is idle and unproven until the day it must take over.',
          },
        },
        {
          type: 'flow',
          flow: {
            scenario: 'active-active',
            caption:
              'Active-active: both take traffic constantly, so both are continuously proven. Losing one costs capacity, not availability.',
          },
        },
      ],
    },

    {
      heading: 'What to say in the interview',
      body: [
        'Compressed to the things that actually score.',
      ],
      points: [
        'Name the layer and why: "Layer 7, because I want path routing and TLS termination here."',
        'Name the algorithm and justify it from request shape: "Least connections, because these requests vary from 20 ms to several seconds."',
        'Say the health check is cheap and dependency-free, and say why — the cascade failure.',
        'Say your servers are stateless, so no sticky sessions and any server can take any request.',
        'Say the balancer is redundant, before the interviewer points out that it is not.',
        'Mention connection draining when you talk about deploys.',
      ],
      callouts: [
        {
          variant: 'say-this',
          text: '"Layer 7 balancer, least-connections, active health checks on a cheap endpoint that does not touch the database — if the check hit the database, one slow query would mark the whole fleet unhealthy. Servers hold no session state, so any server takes any request. At least two balancers, or a managed one, because otherwise the thing I just drew to provide availability is my single point of failure."',
        },
      ],
    },
  ],
}

export const LOAD_BALANCING_EXAMPLE: WorkedExample = {
  title: 'Putting it together: the front door of a link shortener',
  scenario:
    'Redirects have to answer in well under 200 ms, and the read path is about 4,000 requests a second with peaks near 12,000. Creating a link is rare — around 40 a second — and can afford to be slower. How should traffic actually reach the servers?',
  steps: [
    {
      step: 'Pick the layer',
      detail:
        'Layer 7, because the read path and the write path want different treatment: `/{code}` should go to the redirect pool and `/api/create` to the creation pool. A Layer 4 balancer cannot tell those apart — it never reads the path.',
    },
    {
      step: 'Pick the algorithm',
      detail:
        'Redirects are uniform — every one is a cache lookup and a 302, a millisecond or two. That is exactly the case round robin handles perfectly well. But creation involves a database write with a possible retry on collision, so those requests vary. Least connections across both pools is the safer single choice, and it costs nothing.',
    },
    {
      step: 'Health checks',
      detail:
        'A `/healthz` endpoint that returns 200 if the process is up. It does not check Redis on purpose or the database — if the cache is down, redirect servers can still serve from the database, and I do not want the balancer removing every server because one dependency is slow.',
    },
    {
      step: 'Keep servers stateless',
      detail:
        'Redirect servers hold only a small in-process cache of hot codes. Nothing user-specific lives in memory, so no sticky sessions are needed and any server can serve any request. Losing one costs a small cache warm-up, nothing more.',
    },
    {
      step: 'Make the balancer redundant',
      detail:
        'Two balancers, or a managed one. Drawing a single box in front of the fleet would make the component I added for availability the thing most likely to cause an outage.',
    },
    {
      step: 'Handle deploys',
      detail:
        'Remove an instance from the pool, drain in-flight requests, update, wait for the health check to pass, put it back. Without draining, every deploy drops the requests that were mid-flight — which is invisible in staging and obvious in production.',
    },
  ],
  outcome:
    'Redirects land on any healthy server in a couple of milliseconds, a dead server leaves the pool within a few seconds, and a slow database degrades link creation without touching the redirect path at all. The costs named out loud: an extra hop of roughly half a millisecond, and two balancers to run instead of one.',
  problemSlug: 'url-shortener',
}
