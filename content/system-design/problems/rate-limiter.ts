import type { Problem } from '@/lib/types'

export const RATE_LIMITER: Problem = {
  slug: 'rate-limiter',
  searchTitle: "Design a rate limiter",
  title: 'Distributed API rate limiter',
  navTitle: 'Rate limiter',
  group: 'limits',
  difficulty: 'core',
  concepts: [
    'rate-limiting',
    'distributed-counter',
    'caching',
    'circuit-breakers',
    'consistency-models',
    'reverse-proxy',
    'api-design',
    'observability',
  ],
  prompt:
    'Design a rate limiter for a public API served from many machines across several regions. Each customer has a plan with a request quota. The limiter must not become the reason the API is slow or down.',

  slack: {
    budget: 'Decision: ~1 ms. Accuracy: generous.',
    headline: 'No time slack at all, because the decision sits in front of every request. But a lot of accuracy slack, and the design is built on that trade.',
    body: [
      'There is no latency to spend. The limiter runs before the work it protects, on every request, so it must cost a fraction of what it saves. A limiter that adds 20 ms to protect a 30 ms endpoint has made things worse. A realistic budget is about a millisecond, which rules out anything that needs coordination between regions.',
      'But the accuracy budget is wide, and seeing that is what makes the problem tractable. If a customer\'s limit is 1,000 requests a minute and they occasionally get 1,050 through, the backend barely notices. The limit exists to protect capacity and prevent abuse, and both goals survive a few percent of error, as long as capacity was planned with that margin.',
      'That asymmetry is unusual. Most systems in this app trade latency for accuracy in small amounts; here you can trade a lot of accuracy for a little latency, and you should say so out loud.',
      'The one place accuracy tightens is security limits: login attempts and password resets. There, being generous means letting an attacker have more guesses, so those get exact counting and a slower path, because they are rare enough to afford it.',
    ],
    consequence:
      'A millisecond budget plus generous accuracy means local decisions with asynchronous reconciliation instead of a globally consistent counter. It also means capacity limits must fail open, because a limiter outage must not become an API outage.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that change a box, and propose the scope.',
      nudges: [
        'Is the limit global across regions, or per region? That is the question.',
        'How exact does the limit need to be? Ask, do not assume silently.',
        'What is the limiter protecting — capacity, or fairness, or abuse?',
      ],
      model: [
        'Assumptions: a public API on tens of thousands of servers across several regions. Customers authenticate with an API key. Plans differ, so limits are per-key configuration rather than a constant. Request volume is hundreds of thousands per second, and the limiter sits in front of all of it.',
        'First question, and it decides whether this is easy or hard: is the quota global across all regions, or per region? A global quota means every decision needs information from every region, and a cross-region round trip is up to 150 ms against a 1 ms budget. So a strictly global quota is not achievable, and I need to say that rather than pretend. I will assume the quota is global as a business promise, but enforced approximately, with the error bounded and stated.',
        'Second question: how exact must it be? Exact counting forces coordination and approximate counting does not, so the answer changes the architecture. I will assume a few percent of over-admission is acceptable for normal quotas, and separately that security-sensitive limits like login attempts need exact counting on a slower path.',
        'Scope: decide allow or reject per request, support per-key limits, work across regions, and degrade safely. Out of scope: billing, quota purchasing, and the abuse detection system that decides who deserves a limit change.',
      ],
      checklist: [
        'Asked global versus per-region quota and named the latency problem with global',
        'Asked how exact the limit must be, and treated it as an architecture question',
        'Separated security limits from capacity limits',
        'Stated that limits are per-key configuration, not constants',
        'Proposed a scope and excluded billing and abuse detection',
      ],
      tradeoffs: [
        {
          decision: 'Approximate global enforcement',
          cost: 'A customer can exceed their quota by a few percent, most easily by spreading traffic across regions. In exchange the decision stays under a millisecond, which is the only way it can sit in front of every request.',
        },
      ],
      sayThis:
        '"One question: is the quota global across regions, or per region? Strictly global means a cross-region round trip on every request: 150 ms against a budget of about one. So I will enforce it approximately, and I will state the error bound up front rather than implying it is exact."',
      trap: 'Promising an exact global limit. It is not achievable inside the latency budget, and claiming otherwise is the fastest way to lose a Pressure Tester interviewer. Naming the impossibility scores.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write the life of a request through the limiter, and add the failure branches.',
      nudges: [
        'The system decides things silently here. What are they?',
        'What happens when the counter store is unreachable?',
        'What does a rejected client do next?',
      ],
      model: [
        'Actors: the API client, the API itself, the operator who sets limits, and the system. The system decides what key to count against, whether a request is cheap or expensive, what to do when it cannot reach the counter store, and whether a rejection should be counted at all.',
        'The chain: request arrives → identity resolved to a limit key → limit configuration looked up → counter checked and incremented → allowed or rejected → counters reconciled across regions.',
        'The failure branches matter more than usual because this component sits in front of everything. At identity resolved: there is no API key, so the request is anonymous and falls back to an IP-based limit. That punishes shared networks (an office behind one NAT), so it needs a looser threshold. At configuration lookup: the config store is unreachable. So configuration must be cached locally with a long TTL, because fetching it per request would be both slow and fragile.',
        'At counter checked: the counter store is down. This is the branch that defines the design. The choice is fail open (allow everything and lose protection) or fail closed (reject everything and take the API down). Fail open is almost always right, because a limiter outage that becomes a total API outage is a much worse incident than a window of unlimited traffic. But it must be a stated decision with a fallback: fall back to a coarse per-server local limit, so we are degraded rather than defenceless. The exception is security limits, which fail closed, because allowing unlimited password attempts is worse than rejecting logins.',
        'At counter checked: the store is slow rather than down. That is more dangerous than being down, because requests pile up waiting. So there is a hard timeout of a couple of milliseconds and the same fallback applies.',
        'At rejected: the client retries immediately and makes it worse. So the rejection must carry Retry-After, and it must be cheap to produce, since during an attack most responses are rejections. At reconciled: a region is partitioned, so counts drift and the customer gets more than their quota until it heals. That is bounded and acceptable, and worth saying.',
        'One decision the system makes without anyone asking: not all requests cost the same. A cheap read and an expensive export should not consume the same quota, so the design needs a notion of cost per request, or one export endpoint will let a customer consume everything.',
      ],
      checklist: [
        'Named the system as an actor with real decisions',
        'Traced a request through the limiter as a chain',
        'Handled anonymous requests with an IP fallback and noted the shared-network problem',
        'Cached limit configuration locally',
        'Made an explicit fail-open decision with a stated fallback',
        'Made security limits fail closed instead',
        'Handled a slow store, not just a dead one, with a hard timeout',
        'Rejections carry Retry-After and are cheap to produce',
        'Raised weighted cost per request',
      ],
      trap: 'Not deciding what happens when the counter store is down. That is the branch this design is judged on. Get it wrong and your protective component becomes the outage it was built to prevent.',
    },

    {
      id: 3,
      ask: 'Estimate the request rate, the counter operations, and the state size. Then finish "So the hard part here is ___."',
      nudges: [
        'How many counter operations per second? Compare to the request rate.',
        'How much state does one customer\'s counter need?',
        'What does a cross-region round trip cost against your budget?',
      ],
      model: [
        'Requests: 500,000 per second across the platform at peak. Every one needs a limit decision, so the limiter runs on every request. Nothing behind it runs more often.',
        'Naively that means 500,000 counter operations per second against a shared store, plus 500,000 network round trips. Even at 0.5 ms each, that is a network hop on every request and a store handling half a million operations a second. That is expensive and fragile.',
        'State size, which is the number that changes my mind: a counter is a key, a count and a window timestamp — under 100 bytes. Even a million active API keys is 100 MB. All the state fits comfortably in memory on one machine.',
        'That reframes the problem. This is a coordination problem, not a data problem: the state is small, and the difficulty is keeping many machines roughly in agreement about it, cheaply.',
        'Cross-region: up to 150 ms round trip against a 1 ms budget. So no request-path decision may cross a region. This is a structural constraint rather than something to tune, and it rules out global consistency on the request path.',
        'Rejection volume during an attack: an attacker sending 10 million requests a second means the limiter produces 10 million rejections a second, so the rejection path must be cheaper than the accept path: no database read, no logging of full request bodies, no expensive work at all.',
        'So the hard part here is making a decision without coordination, on every request, while keeping many machines approximately in agreement, and failing safely when that breaks.',
      ],
      checklist: [
        'Noted the limiter runs more often than anything it protects',
        'Calculated naive counter operations and identified the per-request network hop as the problem',
        'Concluded total state is tiny and fits in memory',
        'Reframed it as a coordination problem rather than a data problem',
        'Checked the cross-region latency against the budget and ruled global consistency out',
        'Noted the rejection path must be cheaper than the accept path',
        'Finished the sentence',
      ],
      sayThis:
        '"All the counter state is about a hundred megabytes, so this is not a data problem. Five hundred thousand decisions a second, each with a one-millisecond budget, and a cross-region hop is a hundred and fifty. So the hard part here is deciding without coordinating, and keeping thousands of machines roughly in agreement asynchronously."',
      trap: 'Designing for counter storage volume. The state is 100 MB. The difficulty is coordination latency, and confusing the two sends you off designing a sharded datastore for a problem that does not exist.',
    },

    {
      id: 4,
      ask: 'Draw the design. Justify each box, and pick an algorithm with a reason.',
      nudges: [
        'Which algorithm, and what specifically does it get you?',
        'Where does the counter live — locally, shared, or both?',
        'How do many servers agree without talking on every request?',
      ],
      model: [
        'Algorithm: token bucket. Tokens refill at a steady rate up to a maximum; a request takes one or is rejected. I choose it because real API traffic arrives in bursts, and the bucket size gives me an explicit, tunable burst allowance separate from the sustained rate. Fixed windows do not. It is also cheap to represent: a token count and a last-refill timestamp, with refill computed lazily on read rather than by a background process. So there are no timers and no sweeper.',
        'The architecture is local-first with asynchronous reconciliation, and this follows from the numbers. Each server keeps in-memory buckets for the keys it has recently seen and decides locally with no network call, which is what fits the 1 ms budget. Servers periodically, every hundred milliseconds or so, publish their consumption to a shared store and read back the aggregate, adjusting their local view. So the decision is instant and the agreement is eventual.',
        'The consequence: a customer can briefly exceed their quota, roughly by the number of servers times the amount consumed between syncs. I would bound that by making servers sync more often as a key approaches its limit (cheap, because only a few keys are near their limit at any moment) and by giving each server a share of the quota rather than the whole thing. Cost: a customer whose traffic is unevenly spread may be limited slightly early on some servers.',
        'Placement: the limiter runs at the gateway, before requests reach any service. Rejecting at the edge is what makes rejection cheap. Letting a request through to a service before rejecting it wastes the resources you were protecting.',
        'Configuration: limits per key are held in a config store, cached locally with a TTL of minutes and updated by push when changed. This comes from the Stage 2 branch: a per-request config lookup would be both a latency cost and a dependency on the request path.',
        'Regions: each region enforces its share of the global quota independently, with counts reconciled asynchronously across regions. There is no cross-region call on the request path, which is a hard requirement from the latency numbers. Cost: a customer spreading traffic across regions gets more than their nominal quota until reconciliation catches up. That is bounded, and I would state the bound.',
        'Security limits take a different path on purpose: login attempts go to a strongly consistent counter with an exact check, accepting the higher latency, because those are rare and being generous there has a real security cost. Two paths for two purposes.',
        'The response: 429 with Retry-After and headers showing limit, remaining and reset. This answers the retry-storm branch: a well-behaved client that knows when to come back waits, and a client that gets a bare error tends to retry immediately.',
      ],
      checklist: [
        'Chose token bucket and justified it with burst behaviour',
        'Local in-memory decision with no network call on the request path',
        'Asynchronous reconciliation, with the sync interval stated',
        'Quantified and bounded the over-admission error',
        'Placed the limiter at the gateway and said why',
        'Configuration cached locally rather than fetched per request',
        'Per-region enforcement with async reconciliation and a stated bound',
        'Separate exact path for security-sensitive limits',
        'Proper 429 with Retry-After and quota headers',
      ],
      tradeoffs: [
        {
          decision: 'Local decision, async reconciliation',
          cost: 'Over-admission bounded by servers times sync interval. The alternative is a network hop on every request, which does not fit the budget.',
        },
        {
          decision: 'Per-region quota shares',
          cost: 'A customer with lopsided regional traffic may be limited early in one region while under quota globally. Avoids any cross-region call.',
        },
        {
          decision: 'Exact path for security limits',
          cost: 'Higher latency on login and reset endpoints. They are rare, and being generous there costs security rather than capacity.',
        },
      ],
      trap: 'Putting a synchronous call to a shared counter on every request. It adds a network hop and a hard dependency to the most-executed code path you have, so your protective component becomes both a latency tax and a single point of failure.',
    },

    {
      id: 5,
      ask: 'Go deep on the two hardest parts. Name a cost after every decision.',
      nudges: [
        'What exactly happens when the shared store dies?',
        'One customer is 90% of your traffic. What breaks?',
        'How do you avoid punishing a customer during their busiest hour?',
      ],
      model: [
        'Hard part one: failure behaviour, which is what this component is judged on. If the shared store is unreachable, servers keep deciding from their local buckets. We degrade to per-server limits rather than losing all protection, which is better than either extreme. So the local bucket must always be maintained, not only used as a cache. If a server is new and has no local state, it starts with a conservative share of the quota rather than the whole thing, so a fleet-wide restart does not multiply everyone\'s effective limit by the server count. Cost: a newly started server is slightly stingy for its first few seconds.',
        'The fail-open decision, stated plainly: capacity limits fail open, security limits fail closed. The reasoning is what each failure costs. An outage of the limiter should not be an outage of the API, but unlimited password guessing is worse than rejected logins. I would also alert loudly in degraded mode, because failing open without an alert means running unprotected without knowing.',
        'Hot key: one large customer generating most of the traffic means their counter is updated by every server constantly, and their reconciliation traffic dominates. Since only a few keys are hot, handle them specifically: give a large customer a dedicated quota shard per region, and sync theirs more often. Cost: special handling for a small set of keys, which needs to be automatic (detected by traffic) rather than a manual list someone maintains and forgets.',
        'Hard part two: not punishing legitimate customers, which is where a limiter does business damage. Weighted costs so a cheap read and an expensive export do not draw on the same budget in the same way. Separate limits per endpoint class, so a burst of exports cannot lock a customer out of everything. And soft limits before hard ones: start shaping or queueing before rejecting outright, because for most API clients a slow answer is better than an error. Cost: shaping means holding requests, which consumes resources, so it needs a bound and a queue that can itself be rejected from.',
        'Because limits are per-key configuration, raising one during an incident is a config change rather than a deploy. That sounds minor, but it can be the difference between a five-minute fix and an hour. It is a day-one design decision and I would call it out.',
        'Time windows and clock skew: refill is computed from timestamps, so servers whose clocks disagree will compute different refills. Bound it by using a monotonic local clock for elapsed time rather than wall clock, so skew affects reconciliation rather than the local decision. Cost: a little more care in the implementation, and reconciliation needs to tolerate slightly inconsistent timestamps.',
        'Consistency per feature: capacity counters are eventually consistent with a bounded error I can state. Configuration is eventually consistent within minutes, or immediately on push. Security counters are strongly consistent. Say those three separately. A single blanket statement would be wrong for two of them.',
        'What I would monitor: rejection rate by customer (a jump means the customer is being attacked, is misbehaving, or has been misconfigured), decision latency at p99, reconciliation lag, and the count of servers currently in degraded local-only mode. That last number tells you the limiter is failing open right now. Without it you will not know.',
      ],
      checklist: [
        'Degrades to per-server limits rather than losing protection entirely',
        'New servers start with a conservative share to survive a fleet restart',
        'Fail open for capacity, fail closed for security, with reasons',
        'Alerts when in degraded mode',
        'Hot keys detected automatically and given dedicated shards',
        'Weighted request costs and per-endpoint-class limits',
        'Soft limiting before hard rejection, with a bound',
        'Limits changeable by config, not deploy',
        'Handled clock skew by using monotonic elapsed time locally',
        'Per-feature consistency answer and a monitoring list',
        'Cost named after every decision',
      ],
      tradeoffs: [
        {
          decision: 'Fail open on capacity limits',
          cost: 'A window of unprotected traffic during a counter-store outage. Chosen because the alternative is turning a limiter failure into a total API outage.',
        },
        {
          decision: 'Conservative quota share on server start',
          cost: 'Slightly early limiting for a few seconds after a restart. Prevents a fleet-wide restart from multiplying everyone\'s effective quota.',
        },
        {
          decision: 'Soft shaping before hard rejection',
          cost: 'Holding requests consumes resources and needs its own bound. Better for API clients than a hard error at the limit.',
        },
      ],
      sayThis:
        '"Capacity limits fail open. If the counter store is unreachable, servers keep enforcing from their local buckets, so I am degraded rather than defenceless. And I alert loudly, because failing open without an alert means running unprotected without knowing. Security limits fail closed, because unlimited password guessing is worse than rejected logins."',
      trap: 'Building an accurate limiter and never deciding what it does when its dependency is down. The accuracy is worth a few percent; the failure behaviour is worth the whole API.',
    },
  ],

  refs: [
    {
      label: "Using load shedding to avoid overload",
      href: "https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/",
      note: "The Amazon Builders' Library on rejecting work early, which is what a limiter does.",
    },
    {
      label: "Google SRE Book \u2014 Handling Overload",
      href: "https://sre.google/sre-book/handling-overload/",
      note: "Graceful degradation when the limit is reached.",
    },
  ],
  lifecycle: {
    caption:
      'A request through the limiter. The counter-store-down branch is the one that decides whether this component protects your API or takes it down.',
    states: [
      { id: 'arr', label: 'Request arrives', by: 'client' },
      { id: 'id', label: 'Key resolved', by: 'gateway' },
      { id: 'cfg', label: 'Limit looked up', by: 'local cache' },
      { id: 'cnt', label: 'Bucket checked', by: 'local memory' },
      { id: 'dec', label: 'Allowed / rejected', by: 'system' },
    ],
    failures: [
      { after: 'id', label: 'No API key', handling: 'fall back to a looser IP-based limit' },
      { after: 'cfg', label: 'Config store unreachable', handling: 'serve from the local cache; never fetch per request' },
      { after: 'cnt', label: 'Counter store down', handling: 'fail open to per-server local limits — and alert loudly' },
      { after: 'cnt', label: 'Counter store slow', handling: 'hard 2 ms timeout, then the same fallback' },
      { after: 'dec', label: 'Client retries instantly', handling: 'return 429 with Retry-After and quota headers' },
      { after: 'dec', label: 'Region partitioned', handling: 'counts drift; over-admission bounded and stated' },
    ],
  },

  architecture: {
    caption:
      'No network call on the request path. Decisions are local; agreement is asynchronous and approximate. That is what a 1 ms budget allows.',
    nodes: [
      { id: 'c', label: 'API client', kind: 'client', col: 0, row: 0 },
      { id: 'g1', label: 'Gateway', sub: 'local buckets', kind: 'service', col: 1, row: 0 },
      { id: 'g2', label: 'Gateway', sub: 'local buckets', kind: 'service', col: 1, row: 1 },
      { id: 'api', label: 'API services', kind: 'service', col: 2, row: 0 },
      { id: 'sh', label: 'Shared counters', sub: 'sync ~100 ms', kind: 'cache', col: 2, row: 1 },
      { id: 'cfg', label: 'Limit config', sub: 'cached locally', kind: 'store', col: 3, row: 1 },
      { id: 'sec', label: 'Security counters', sub: 'exact, fail closed', kind: 'store', col: 3, row: 0 },
    ],
    edges: [
      { from: 'c', to: 'g1' },
      { from: 'c', to: 'g2' },
      { from: 'g1', to: 'api', label: 'allowed' },
      { from: 'g1', to: 'sh', label: 'async', dashed: true },
      { from: 'g2', to: 'sh', label: 'async', dashed: true },
      { from: 'cfg', to: 'sh', dashed: true },
      { from: 'g1', to: 'sec', label: 'login only' },
    ],
  },

  numbers: {
    caption: 'All the state fits in memory. The difficulty is the latency budget.',
    items: [
      { label: 'Decisions required', value: 500000, display: '~500,000 / sec', tone: 'accent' },
      { label: 'Total counter state', value: 100, display: '~100 MB — one machine', tone: 'muted' },
      { label: 'Budget per decision', value: 1, display: '~1 ms', tone: 'muted' },
      { label: 'Cross-region round trip', value: 150, display: '150 ms — 150x the budget', tone: 'bad' },
    ],
    note: 'A cross-region hop is 150x the budget, so global consistency on the request path is ruled out. So the hard part is deciding without coordinating: trade accuracy, which you have plenty of, for latency, which you have none of.',
  },

  flow: {
    scenario: 'rate-limit',
    caption: 'The bucket refills steadily; a request takes a token or is rejected at the door. Rejection has to be cheaper than acceptance, because during an attack most responses are rejections.',
  },

  compare: {
    caption: 'Where the counter lives. The latency budget makes this decision for you.',
    a: {
      title: 'Local buckets, async reconciliation',
      points: [
        'Zero network calls on the request path, so comfortably inside 1 ms.',
        'Survives the counter store being down: degrades to per-server limits.',
        'Over-admission bounded by servers × sync interval, and you can state the bound.',
        'A customer spreading across regions gets somewhat more than their quota.',
      ],
    },
    b: {
      title: 'Shared counter, checked per request',
      points: [
        'Accurate within a region, and easy to explain to a customer.',
        'Adds a network hop to the most-executed code path in the system.',
        'The store becomes a hard dependency of every request.',
        'Still cannot be globally accurate: a cross-region hop is 150x the budget.',
      ],
    },
    verdict:
      'Local with async reconciliation. You have a lot of accuracy slack and none at all on latency, so spend the accuracy. The deciding argument is failure behaviour. With option B the limiter\'s outage is the API\'s outage, and a component built to protect availability must not reduce it.',
  },

  followUps: [
    'kill-cache',
    'scale-hot-key',
    'consistency-simultaneous',
    'choice-queue',
    'ops-alert-first',
    'kill-region',
    'cost-cheaper-slower',
    'scale-10x',
  ],
}
