import type { Concept } from '@/lib/types'

/**
 * "X vs Y" decision pages. Each one sits next to the broader concept it builds
 * on (reverse proxies, caching, transactions) and covers the choice between the
 * options in depth, instead of the one-paragraph mention the broad page has
 * room for.
 *
 * House style: short sentences, everyday words, one idea per sentence.
 */
export const COMPARISONS: Concept[] = [
  {
    slug: 'api-gateway-vs-load-balancer-vs-reverse-proxy',
    title: 'API gateway vs load balancer vs reverse proxy',
    navTitle: 'Gateway vs LB vs proxy',
    heading: 'API gateway vs load balancer vs reverse proxy: what is the difference?',
    metaTitle: 'API Gateway vs Load Balancer vs Reverse Proxy (Explained)',
    metaDescription:
      'API gateway vs load balancer vs reverse proxy: what each one does, L4 vs L7, where each sits in the request path, and when one tool plays all three roles.',
    plural: true,
    subject: 'these three components',
    tier: 1,
    oneLine: 'Three names for the box in front of your services. They overlap, and the difference is which job you bought it for.',
    problem: [
      'A **reverse proxy** receives requests on behalf of your servers and forwards them: it is a front door. A **load balancer** spreads requests across several copies of the same service. An **API gateway** manages an API as a product: who may call it, how often, in what shape.',
      'In real systems the three blur together, because one piece of software (NGINX, Envoy, HAProxy, a cloud load balancer) can do some or all of the jobs. The interview question is really asking whether you know which job each box on your diagram is doing, and why it is there.',
    ],
    cost: 'Every box in the request path adds a network hop, a configuration you have to get right, and something that must itself be redundant. Stack a CDN, a load balancer, a gateway and a sidecar proxy and you have four hops before your code runs, four places a timeout can be set wrongly, and four teams who can each break every request. The gateway carries a further risk: it is the easiest place to put logic that belongs in a service.',
    useWhen: [
      'Reverse proxy: you want TLS, compression, static files or path routing handled once, in front of any number of backends, even one.',
      'Load balancer: you run more than one copy of a service and need traffic spread across them, with unhealthy copies taken out.',
      'API gateway: outside clients or many teams call many services, and you need API keys, per-client quotas, authentication and one public surface.',
    ],
    avoidWhen: [
      'Do not add an API gateway to a single service with one client. A reverse proxy or the load balancer you already have does the job.',
      'Do not put business rules in the gateway (pricing, which user sees which feature). It becomes a deploy bottleneck no team owns.',
      'Do not draw three boxes when one product plays all three roles. Draw one and say what it does.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'A typical public request path. Each hop has one main job, although a single product can collapse several hops into one.',
        nodes: [
          { id: 'c', label: 'Client', sub: 'app or browser', kind: 'client', col: 0, row: 1 },
          { id: 'cdn', label: 'CDN', sub: 'cache at the edge', kind: 'external', col: 1, row: 1 },
          { id: 'lb', label: 'Load balancer', sub: 'L4 or L7, health checks', kind: 'service', col: 2, row: 1 },
          { id: 'gw', label: 'API gateway', sub: 'auth, keys, quotas', kind: 'service', col: 3, row: 1 },
          { id: 'a', label: 'Orders service', sub: 'several copies', kind: 'service', col: 4, row: 0 },
          { id: 'b', label: 'Users service', sub: 'several copies', kind: 'service', col: 4, row: 2 },
          { id: 'n', label: 'Each arrow from the gateway is itself load balanced, often by a sidecar proxy or the platform', kind: 'note', col: 2, row: 2, span: 2 },
        ],
        edges: [
          { from: 'c', to: 'cdn', label: 'https' },
          { from: 'cdn', to: 'lb', label: 'cache miss' },
          { from: 'lb', to: 'gw' },
          { from: 'gw', to: 'a', label: '/orders' },
          { from: 'gw', to: 'b', label: '/users' },
        ],
      },
    },
    body: [
      'The one-line answer: a reverse proxy is a role (stand in front of servers), a load balancer is a function (spread load across copies), and an API gateway is a product decision (manage the API for its consumers). Most load balancers and gateways are reverse proxies, so the three are better seen as nested than as rivals.',
      '**The reverse proxy** terminates TLS, compresses responses, serves static files, routes by host or path and hides your internal layout. It is useful with one backend, which is the quickest way to tell it apart from a load balancer. Our [reverse proxy page](/concepts/reverse-proxy) covers it alone.',
      '**The load balancer** exists because you run several copies. It picks a healthy copy for each request or connection, using round robin, least connections or a hash, and drops copies that fail health checks. The [load balancing page](/concepts/load-balancing) covers the algorithms. What matters here is the layer it works at. A **layer 4** load balancer sees TCP or UDP connections: addresses and ports, nothing inside. It is fast and protocol-agnostic, and it cannot route by URL. A **layer 7** load balancer reads HTTP, so it can route `/api` and `/static` differently, retry a failed request and set headers, at the cost of terminating the connection and parsing every request.',
      '**The API gateway** is a layer 7 reverse proxy with opinions about APIs. Its usual features are authentication (validating a token or an API key), per-client rate limits and quotas, request and response transformation, routing one public API onto many internal services, and usage analytics per consumer. Some gateways also aggregate, turning one client call into several backend calls. That is the feature most likely to grow into business logic.',
      '**One tool, three roles.** An NGINX config can terminate TLS, rate-limit by IP and spread requests over an upstream group in the same `server` block (the example below). Managed cloud products split the roles more firmly: a network load balancer is layer 4, an application load balancer is layer 7, and an API gateway product adds keys, quotas and usage plans. In an interview, name the role, then name the product if asked.',
      '**Where each sits.** Outside to inside: CDN, then the load balancer that owns the public IP, then the gateway, then the services. Inside the cluster, calls between services (east-west traffic) are balanced by client libraries, the platform or a service mesh sidecar. The gateway is for traffic entering from outside (north-south). A gateway is not a replacement for a load balancer: it needs one in front of it, because the gateway itself runs as several copies.',
      '**Backend for frontend (BFF).** Instead of one gateway for every client, each client type (web, iOS, partner API) gets its own thin gateway shaped for it, owned by the team that builds that client. It keeps one client\'s needs from bloating a shared gateway, at the cost of more deployables.',
    ],
    table: {
      caption: 'The three roles side by side. Real products often cover two or three columns at once.',
      headers: ['', 'Reverse proxy', 'Load balancer', 'API gateway'],
      rows: [
        ['Main job', 'Front door for servers', 'Spread traffic over copies of one service', 'Manage an API for its consumers'],
        ['Layer', 'Usually 7 (HTTP)', '4 (TCP/UDP) or 7 (HTTP)', '7 (HTTP, gRPC, sometimes WebSocket)'],
        ['Decides by', 'Host, path, headers', 'Health, load, a hash of the client or key', 'Who the caller is, their plan and quota, the route'],
        ['Typical features', 'TLS, compression, caching, static files', 'Health checks, algorithms, connection draining', 'Auth, API keys, quotas, transformation, analytics'],
        ['Useful with one backend?', 'Yes', 'No', 'Only if the API has outside consumers'],
        ['Examples', 'NGINX, HAProxy, Envoy, Caddy', 'Cloud L4 and L7 load balancers, HAProxy, NGINX', 'Kong, cloud API gateway services, Envoy-based gateways'],
        ['Main risk', 'Misconfiguration affects everything', 'Becomes a single point of failure if not redundant', 'Accumulates business logic'],
      ],
    },
    examples: [
      {
        label: 'nginx.conf — one box doing all three jobs',
        src: `limit_req_zone $binary_remote_addr zone=perip:10m rate=10r/s;

upstream orders {                  # load balancer: several copies
    least_conn;
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
}

server {
    listen 443 ssl;                # reverse proxy: TLS ends here
    server_name api.example.com;
    ssl_certificate     /etc/ssl/api.crt;
    ssl_certificate_key /etc/ssl/api.key;

    location /static/ {
        root /var/www;             # reverse proxy: serve files itself
    }

    location /api/orders/ {
        limit_req zone=perip burst=20 nodelay;   # gateway-style rate limit
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://orders;                # balanced over the upstream
    }
}`,
        note: 'This covers rate limiting by IP. Per-customer API keys, quotas and usage plans are where a dedicated gateway starts to earn its place.',
      },
    ],
    traps: [
      'Saying an API gateway replaces the load balancer. The gateway runs as several copies, so something must balance across them.',
      'Drawing a gateway, a load balancer and a reverse proxy as three hops when one product does all three.',
      'Letting response aggregation in the gateway grow into business logic.',
      'Forgetting that layer 4 balancing cannot route by path or retry an HTTP request.',
    ],
    sayThis:
      '"One layer 7 load balancer in front, which also terminates TLS. Behind it an API gateway, because partners call us with API keys and need per-key quotas. Each internal service is balanced by the platform. If we only had our own web client, I would drop the gateway and do auth in the services."',
    faq: [
      {
        q: 'Does an API gateway replace a load balancer?',
        a: 'No. Many gateways can balance across backend copies, so inside the cluster they may do that job. But the gateway itself runs as several instances for availability, so you still need a load balancer (or DNS-level balancing) in front of it.',
      },
      {
        q: 'Is NGINX an API gateway?',
        a: 'NGINX is a reverse proxy and load balancer that can do gateway tasks: TLS, routing, rate limiting, basic auth checks. Teams build gateways on it (Kong is built on NGINX via OpenResty). A dedicated gateway adds API keys, per-consumer quotas, a developer portal and analytics without writing them yourself.',
      },
      {
        q: 'What is the difference between a layer 4 and a layer 7 load balancer?',
        a: 'Layer 4 balances TCP or UDP connections using addresses and ports, without reading the payload: fast, works for any protocol, cannot route by URL. Layer 7 reads HTTP requests, so it can route by path or header, retry, and insert headers, at the cost of parsing each request and terminating TLS.',
      },
      {
        q: 'API gateway vs service mesh?',
        a: 'A gateway handles traffic entering the system from outside (north-south): consumers, keys, quotas. A service mesh handles traffic between internal services (east-west): mutual TLS, retries, per-call metrics, usually through a sidecar proxy next to each service. Large systems often have both.',
      },
      {
        q: 'API gateway vs backend for frontend (BFF)?',
        a: 'A BFF is a gateway dedicated to one type of client and owned by that client\'s team, so the web app and the mobile app each get an API shaped for them. A single shared gateway is simpler to run; BFFs stop one client\'s needs from bloating everyone\'s gateway.',
      },
    ],
    followUp: {
      q: '"Do you need both a load balancer and an API gateway here?"',
      answer:
        'It depends on who calls us. If the only client is our own web app, no: one layer 7 load balancer can terminate TLS, route by path and spread traffic, and the services check the user\'s token themselves. The gateway would be an extra hop with nothing to do. If outside developers call the API with keys, yes, and here is why each exists. The load balancer owns the public address and keeps traffic flowing to healthy copies, including healthy copies of the gateway. The gateway decides whether this caller may make this call and how many they have left this minute, and it maps one public API onto several internal services. Cost: one more hop, maybe a millisecond or two, and one more component in every request\'s path, so it needs at least two instances and its own alerts. I would keep it to authentication, quotas and routing, and push anything that looks like a business rule back into a service.',
    },
    selfCheck: {
      q: 'Your service runs on two VMs behind one domain. A teammate proposes adding an API gateway "because microservices use one". What do you say?',
      answer:
        'That it solves a problem we do not have yet. Two copies of one service need a load balancer, and the same box can terminate TLS and route paths, which makes it our reverse proxy too. A gateway earns its place when there are many services behind one public API, or outside consumers that need API keys and per-client quotas. Adding it now costs an extra hop on every request, another component to make redundant, and a configuration that someone has to own, in exchange for features nobody is using. I would revisit it when we publish the API to partners or split into several services.',
    },
    related: ['reverse-proxy', 'load-balancing', 'rate-limiting', 'auth-and-security'],
    refs: [
      {
        label: 'NGINX — ngx_http_proxy_module',
        href: 'https://nginx.org/en/docs/http/ngx_http_proxy_module.html',
        note: 'The reverse proxy directives used in the example, from the reference documentation.',
      },
      {
        label: 'AWS — What is Elastic Load Balancing?',
        href: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html',
        note: 'A clear statement of the layer 4 (network) versus layer 7 (application) load balancer split, as a cloud vendor ships it.',
      },
      {
        label: 'microservices.io — API gateway pattern',
        href: 'https://microservices.io/patterns/apigateway.html',
        note: 'Chris Richardson on the gateway pattern and its variant, backend for frontend.',
      },
      {
        label: 'Sam Newman — Backends for frontends',
        href: 'https://samnewman.io/patterns/architectural/bff/',
        note: 'The original write-up of the BFF pattern and when it beats one shared gateway.',
      },
    ],
    hints: [
      'List what a gateway gives you that a load balancer does not. Does this system have anyone who needs those things?',
      'Two copies of one service: which of the three jobs is actually required?',
    ],
  },

  {
    slug: 'cache-write-strategies',
    title: 'Cache write strategies',
    heading: 'Cache write strategies: write-through, write-back, write-around and cache-aside',
    metaTitle: 'Write-Through vs Write-Back vs Write-Around vs Cache-Aside',
    metaDescription:
      'Write-through vs write-back vs write-around vs cache-aside: who writes the database, how stale the cache gets, data-loss risk, and when to use each.',
    plural: true,
    subject: 'cache write strategies',
    tier: 1,
    oneLine: 'When data changes, who updates the cache, who updates the database, and in what order. Each answer has a different failure.',
    problem: [
      'A cache holds a copy of data that lives in a database. Reads are the easy half. The hard half is writes: when a value changes, the cache and the database must be updated in some order, by someone, and every choice leaves a different window where they disagree or where data can be lost.',
      'Interviewers ask "write-through or write-back?" to see whether you know what each costs when something crashes halfway. The names matter less than being able to say what a user sees in that window.',
    ],
    cost: 'Every strategy picks two of three: fast writes, a cache that is never stale, and no risk of losing a write. Write-through gives fresh data and safety but every write waits on both systems. Write-back gives fast writes and fresh reads but loses whatever was not yet flushed when the cache dies. Write-around and cache-aside keep writes simple and safe, and pay with misses and stale windows.',
    useWhen: [
      'Cache-aside with delete-on-write: the default for read-heavy application data, such as profiles, products and settings.',
      'Write-through: data that is read straight after it is written, where a stale read would confuse the user.',
      'Write-back: very high write rates where losing the last second or two is acceptable, such as counters, metrics and presence.',
      'Write-around: data written once and rarely read soon after, such as logs, uploads and audit records.',
    ],
    avoidWhen: [
      'Write-back for money, orders or anything you cannot recompute. A cache crash becomes data loss.',
      'Write-through for data that is mostly written and rarely read. You pay twice per write to cache things nobody asks for.',
      'Any strategy for a value a commit decision depends on, such as remaining stock. Read that from the database inside the transaction.',
    ],
    visual: {
      type: 'flow',
      flow: {
        scenario: 'write-back',
        caption:
          'Write-back: the write is confirmed as soon as the cache has it, and reaches the database later. Fast, and anything not yet flushed is lost if the cache dies.',
      },
    },
    animation: {
      scenario: 'cache-miss',
      caption: 'Cache-aside on the read path: miss, read the database, fill the cache. The write path decides how long that filled value stays correct.',
    },
    body: [
      'Two of these names describe the read path and three describe the write path, which is why the comparison confuses people. **Cache-aside** (also called lazy loading) and **read-through** say what happens on a read miss. **Write-through**, **write-back** (also called write-behind) and **write-around** say what happens on a write. A real system picks one of each. The most common pairing is cache-aside reads with delete-on-write.',
      '**Cache-aside.** The application checks the cache; on a miss it reads the database, puts the value in the cache with a TTL, and returns it. On a write it updates the database and then deletes the cache key, so the next read reloads it. The cache only ever holds data someone asked for, and if the cache is down the application still works, just slower.',
      '**Read-through.** Same behaviour, but the cache layer loads from the database itself, so application code only ever talks to the cache. It is tidier, and it ties the cache to your database schema.',
      '**Write-through.** Every write goes to the cache and the database together, and returns only when both have it. Reads after a write are fresh. Write latency is the sum of both, and you cache everything written whether or not anyone reads it, which is why it is often paired with a TTL.',
      '**Write-back.** The write goes to the cache and returns at once; the cache writes to the database later, often batching many updates to one key into one write. That is the fastest option and it absorbs bursts. The cost is the window: if the cache node dies before flushing, those writes are gone, and if the flush fails, the database falls behind silently. Use it only where the data can be lost or rebuilt, or where the cache itself is replicated and persisted.',
      '**Write-around.** The write goes straight to the database and skips the cache (usually deleting any cached copy). The cache fills only when something is read. It suits write-heavy data that is rarely read back soon, and keeps one-off writes from pushing useful entries out of the cache.',
      '**The race that bites cache-aside.** Reader A misses and reads the old value from the database. Writer B updates the database and deletes the key. Reader A, slow, now writes its old value into the cache. The cache is stale until the TTL expires, and nothing errors. Defences, cheapest first: keep a TTL on every key as a safety net; delete after the transaction commits, never before; delete a second time a short moment later ("delayed double delete"); or use leases, where the cache hands a token to the first reader on a miss and rejects its fill if the key was deleted in the meantime. Facebook\'s memcache paper describes leases for exactly this race.',
      '**Order matters in write-through too.** Write the cache first and the database second, and a database failure leaves the cache holding a value that was never stored. Write the database first, then update or delete the cache; if the cache step fails, the TTL limits the damage.',
      '**Choosing by read/write ratio.** Mostly reads with occasional writes: cache-aside plus delete-on-write plus a TTL. Reads right after writes, where a stale read is visible: write-through. Huge write volume to a few hot keys, where some loss is fine: write-back. Many writes that are rarely read: write-around.',
    ],
    table: {
      caption: 'The five policies. Read policy and write policy are separate choices, so most systems combine two of these rows.',
      headers: ['Policy', 'Path', 'Who writes the database', 'Stale reads', 'Write latency', 'Can lose writes?'],
      rows: [
        ['Cache-aside (lazy loading)', 'Read', 'The application', 'Until delete or TTL; a race can extend it', 'Database only', 'No'],
        ['Read-through', 'Read', 'The application, or the cache library', 'Same as cache-aside', 'Depends on the write policy', 'No'],
        ['Write-through', 'Write', 'The cache layer, synchronously', 'Rare', 'Cache + database', 'No'],
        ['Write-back (write-behind)', 'Write', 'The cache, later', 'None from the cache; the database lags', 'Cache only', 'Yes, anything not yet flushed'],
        ['Write-around', 'Write', 'The application, directly', 'First read after a write is a miss', 'Database only', 'No'],
      ],
    },
    examples: [
      {
        label: 'cache-aside in Go — read path and write path',
        src: `func (s *Store) GetUser(ctx context.Context, id int64) (User, error) {
	key := fmt.Sprintf("user:%d", id)
	if u, ok := s.cache.Get(ctx, key); ok {
		return u, nil // hit
	}
	u, err := s.db.LoadUser(ctx, id) // miss: go to the source of truth
	if err != nil {
		return User{}, err
	}
	s.cache.Set(ctx, key, u, 10*time.Minute) // TTL is the safety net
	return u, nil
}

func (s *Store) RenameUser(ctx context.Context, id int64, name string) error {
	if err := s.db.UpdateName(ctx, id, name); err != nil { // database first
		return err
	}
	// then invalidate, after the commit; if this fails, the TTL caps the damage
	s.cache.Delete(ctx, fmt.Sprintf("user:%d", id))
	return nil
}`,
        note: 'Deleting rather than setting the new value on write avoids two writers racing to set different values. The next reader loads whatever the database holds.',
      },
    ],
    traps: [
      'Writing the cache before the database. A failed database write leaves a value in the cache that was never saved.',
      'Calling write-back "write-through with batching" and skipping the data-loss window.',
      'Cache-aside with no TTL. One missed delete and the stale value lives forever.',
      'Treating read-through and write-through as competitors. One is a read policy and one is a write policy.',
    ],
    sayThis:
      '"Cache-aside reads, delete-on-write after commit, ten-minute TTL as a backstop. Cost: a narrow race can leave a stale value until the TTL, which is fine for a profile page. For the view counter I would use write-back, batching increments in memory and flushing every second, and say that a crash loses about a second of views."',
    faq: [
      {
        q: 'What is the difference between write-through and write-back?',
        a: 'Write-through confirms a write only after both the cache and the database have it: slower writes, nothing lost. Write-back confirms once the cache has it and writes the database later: faster writes, and anything not flushed is lost if the cache fails.',
      },
      {
        q: 'Is write-behind the same as write-back?',
        a: 'Yes. Both names describe writing to the cache now and to the database asynchronously later. "Write-back" comes from CPU caches; "write-behind" is more common in application caching products.',
      },
      {
        q: 'Cache-aside vs read-through: which should I use?',
        a: 'They behave the same on a miss. In cache-aside the application loads from the database and fills the cache; in read-through the cache layer does it. Cache-aside is the usual choice with Redis or Memcached, because neither loads from your database for you.',
      },
      {
        q: 'What is write-around caching?',
        a: 'Writes go straight to the database and bypass the cache, which is only filled by reads. It suits data that is written often and read rarely or much later, and keeps one-off writes from evicting useful entries.',
      },
      {
        q: 'Which strategy does Redis use?',
        a: 'None by itself. Redis is the store; the strategy lives in your application code or in a caching library around it. Most applications use Redis with cache-aside reads and delete-on-write.',
      },
    ],
    followUp: {
      q: '"You use cache-aside and delete the key after every update. A user still saw an old value for ten minutes. How?"',
      answer:
        'The classic read-write race. A reader missed the cache and read the row from the database just before a writer updated it. The writer committed and deleted the key. Then the reader, which was slow, wrote the old row into the cache, after the delete. Nothing failed, so nothing logged it, and the old value lived until its ten-minute TTL. I would check first that the delete happens after the commit, because deleting before commit opens the same window wider. Then, depending on how much a stale read hurts: shorten the TTL for this kind of data, add a second delete a second or so after the write, or use leases so a fill from a reader that started before the delete is rejected. Cost: a shorter TTL means more misses and more database load, and leases need support in the cache client. For a profile page I would take the shorter TTL; for something like permissions I would read from the database.',
    },
    selfCheck: {
      q: 'Pick a write strategy for each and say why: (a) a video\'s view count, (b) a user\'s display name, (c) an account balance.',
      answer:
        'View count: write-back. It is written constantly, a few seconds of staleness is invisible, and losing a second of increments in a crash is acceptable, so batching in the cache saves an enormous number of database writes. Display name: cache-aside with delete-on-write and a TTL. It is read far more than written, and a brief stale window after a rename is a small annoyance. If the user must see their new name instantly, write-through, or show it from the client. Account balance: do not rely on the cache for it at all when making decisions. Reads that move money go to the database inside the transaction. You can cache it for display with a short TTL, but never write-back, because a crash would lose real transactions.',
    },
    related: ['caching', 'redis-vs-memcached', 'consistency-models', 'distributed-counter'],
    refs: [
      {
        label: 'Amazon ElastiCache — Caching strategies',
        href: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html',
        note: 'Lazy loading versus write-through, with the trade-offs and TTL advice, from a managed cache vendor.',
      },
      {
        label: 'Scaling Memcache at Facebook (NSDI 2013)',
        href: 'https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala',
        note: 'The look-aside cache at very large scale, including leases for the stale-set race described above.',
      },
    ],
    hints: [
      'For each one ask two things: how bad is a stale read, and how bad is losing the last few writes?',
      'Which of the three could you recompute or shrug off if a cache node died, and which is real money?',
    ],
  },

  {
    slug: 'redis-vs-memcached',
    title: 'Redis vs Memcached',
    heading: 'Redis vs Memcached: differences and which to choose',
    metaTitle: 'Redis vs Memcached: Differences and Which to Choose',
    metaDescription:
      'Redis vs Memcached: data types, persistence, replication, threading, eviction and licensing (including the Valkey fork), and when Memcached still wins.',
    subject: 'the Redis vs Memcached choice',
    tier: 1,
    oneLine: 'Both are in-memory caches. Memcached does one thing simply; Redis is a data-structure server that also caches.',
    problem: [
      '"Put Redis in front of it" has become a reflex, and interviewers sometimes ask why not Memcached. The honest answer is that for a plain look-aside cache of strings, both work, and the choice comes down to what else you need.',
      'Memcached stores opaque values by key, across many threads, and nothing more. Redis stores typed data structures, can persist and replicate them, and runs scripts against them. That extra power is why Redis gets used for rate limiters, queues and leaderboards, not just caching.',
    ],
    cost: 'Redis\'s features are also its operational surface: persistence settings, replication, failover, cluster slots and memory used by data structures all need understanding and monitoring, and a Redis that has become a database is no longer something you can flush. Memcached\'s simplicity costs you everything it does not do: no persistence, no built-in replication, no data types, so a node restart empties it and anything beyond get and set is your code\'s job.',
    useWhen: [
      'Memcached: a pure cache of serialised objects or HTML fragments, sharded by the client, where a lost node only means misses.',
      'Redis: anything that needs data structures or atomic operations on the server: counters, rate limits, sorted leaderboards, sets, streams.',
      'Redis: when cached data should survive a restart or fail over to a replica.',
    ],
    avoidWhen: [
      'Do not choose Redis for its persistence and then treat it as the system of record without understanding what its persistence settings can lose.',
      'Do not choose Memcached when you will soon need anything beyond get, set, delete and increment; you will end up adding Redis as well.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The same cache role, two very different tools.',
        a: {
          title: 'Memcached',
          points: [
            'Keys and opaque values (1 MB item limit by default, configurable).',
            'Multithreaded: one big node uses all its cores.',
            'No persistence and no built-in replication; clients shard keys across nodes.',
            'Evicts least-recently-used items when full, by default. A pure cache by design.',
          ],
        },
        b: {
          title: 'Redis',
          points: [
            'Strings, hashes, lists, sets, sorted sets, streams, bitmaps, HyperLogLog, geo.',
            'Commands execute on a main thread; optional I/O threads help with network work.',
            'Persistence (RDB snapshots, AOF log), replicas, Sentinel failover, Redis Cluster sharding.',
            'Eviction policy is configurable; the default is noeviction, which rejects writes when memory is full.',
          ],
        },
        verdict:
          'If all you need is a look-aside cache of blobs, either works and Memcached is the simpler thing to run. As soon as you need a data structure, an atomic server-side operation, or a cache that survives a restart, Redis.',
      },
    },
    body: [
      '**Data model.** Memcached maps a key to a blob of bytes; your application serialises and deserialises. Redis understands types, so it can increment a field inside a hash, add to a sorted set and fetch the top ten, or pop from a list, all atomically on the server without reading the value back.',
      '**Threading.** Memcached is multithreaded, so a single large node scales with its cores. Redis executes commands one at a time on a main thread, which is what makes each command atomic and makes Lua scripts and `MULTI`/`EXEC` transactions simple to reason about. Since Redis 6, optional I/O threads take over socket reads and writes. To use many cores for commands, you run more Redis processes, usually as a cluster.',
      '**Persistence and replication.** Memcached has neither built in; a restarted node is empty, and high availability means the client tolerates misses. Redis offers RDB snapshots, an append-only file (AOF) with a configurable fsync policy, asynchronous replicas, Sentinel for automatic failover and Redis Cluster for sharding across 16,384 hash slots. Asynchronous replication means a failover can lose the last writes acknowledged by the old primary, which matters if Redis holds anything you cannot rebuild.',
      '**Eviction.** Memcached evicts least-recently-used items when memory is full, by default (the `-M` flag makes it return errors instead); evicting is its job. Redis lets you choose: `allkeys-lru`, `allkeys-lfu`, the `volatile-*` policies that only evict keys with a TTL, or `noeviction`, the default, which returns errors on writes when memory is full. For a cache, set an eviction policy explicitly; for anything else, monitor memory.',
      '**Licensing and Valkey.** Memcached is BSD-licensed. Redis was BSD-licensed until March 2024, when Redis Ltd. moved new versions to a source-available dual licence (RSALv2 and SSPLv1). The Linux Foundation then started **Valkey**, a fork of Redis 7.2.4 under the BSD licence, which several cloud providers now offer. Redis 8 added the AGPLv3 as a third licence option. For most teams using a managed service this changes little, but it matters if you embed or redistribute it, so check the licence of the exact version you run.',
      '**When Memcached still wins.** A very large, simple cache of rendered pages or serialised objects, where multithreading lets a few big nodes replace many Redis processes, and where losing a node only costs misses. Some of the largest published caching deployments, such as the one described in Facebook\'s memcache paper, are built this way.',
    ],
    table: {
      caption: 'Feature comparison. Check the documentation of the version you run; both projects keep evolving.',
      headers: ['', 'Memcached', 'Redis'],
      rows: [
        ['Data model', 'Key to opaque bytes', 'Key to typed structures (strings, hashes, lists, sets, sorted sets, streams and more)'],
        ['Max value size', '1 MB by default (configurable)', '512 MB per string'],
        ['Threads', 'Multithreaded', 'Commands on a main thread; optional I/O threads'],
        ['Persistence', 'None built in', 'RDB snapshots and/or AOF log'],
        ['Replication and failover', 'None built in; client-side sharding', 'Async replicas, Sentinel, Redis Cluster'],
        ['Eviction', 'LRU by default', 'Configurable; default noeviction'],
        ['Server-side logic', 'Get, set, add, cas, incr/decr', 'Lua scripts, functions, MULTI/EXEC transactions'],
        ['Pub/sub, queues', 'No', 'Pub/sub, lists as queues, streams with consumer groups'],
        ['Licence', 'BSD', 'RSALv2/SSPLv1, plus AGPLv3 from Redis 8; Valkey fork is BSD'],
      ],
    },
    examples: [
      {
        label: 'redis-cli — things Memcached cannot do on the server',
        src: `# leaderboard: a sorted set keeps scores ordered for you
ZADD game:42 1500 asha 1320 ben 1710 chen
ZREVRANGE game:42 0 2 WITHSCORES      # top three, highest first

# fixed-window rate limit: atomic increment plus expiry
INCR rl:user:7:202610261405
EXPIRE rl:user:7:202610261405 60

# a field inside an object, without reading it back
HINCRBY cart:99 sku-123 1`,
        note: 'With Memcached each of these is a read, a change in your code and a write back, with a `cas` token to avoid lost updates.',
      },
    ],
    traps: [
      'Saying Redis is "multithreaded now" without qualification. I/O threads exist; commands still execute one at a time.',
      'Leaving Redis on the default noeviction policy and using it as a cache, then getting write errors when memory fills.',
      'Treating Redis replication as durable. It is asynchronous, so a failover can drop acknowledged writes.',
    ],
    sayThis:
      '"Redis, because besides caching I need atomic counters for rate limiting and a sorted set for the leaderboard. Eviction set to allkeys-lru for the cache keys, and I treat everything in it as rebuildable, because replication is asynchronous. If this were only a page cache I would be happy with Memcached."',
    faq: [
      {
        q: 'Is Redis faster than Memcached?',
        a: 'For simple get and set, both answer in well under a millisecond inside a data centre, and the network usually dominates. Memcached can use more cores on one node; Redis is scaled out with more processes. Pick on features, then benchmark your own workload.',
      },
      {
        q: 'What is Valkey?',
        a: 'An open-source (BSD) fork of Redis 7.2.4, created under the Linux Foundation in 2024 after Redis changed its licence. It is wire-compatible with Redis for the commands that existed at the fork, and several cloud providers offer it as a managed service.',
      },
      {
        q: 'Can Memcached persist data?',
        a: 'Not as a database would. It is designed as a cache, and a restarted node normally starts empty. Treat any data in it as something you can reload from the source of truth.',
      },
      {
        q: 'Should I use Redis as my primary database?',
        a: 'Only if you have configured persistence and replication for the loss you can accept, and your data fits in memory. Many teams use it for data that is valuable but rebuildable (sessions, rate limits, leaderboards) and keep the system of record elsewhere.',
      },
    ],
    followUp: {
      q: '"Why Redis and not Memcached for this cache?"',
      answer:
        'For the cache alone, either would do, and I would say so. Both are in-memory, sub-millisecond, and support the get, set and TTL I need for cache-aside. I am choosing Redis because the same design also needs a rate limiter and a leaderboard: an atomic increment with an expiry per user per minute, and a sorted set for the top scores. With Memcached I would implement both in application code with read, modify and compare-and-set loops, or run Redis anyway. The costs I accept: Redis executes commands on one main thread per process, so I scale it by sharding rather than with bigger machines, and its replication is asynchronous, so I treat everything in it as rebuildable. I would also set an explicit eviction policy, because the default refuses writes when memory fills, which is the wrong behaviour for a cache.',
    },
    selfCheck: {
      q: 'Your team caches rendered product pages (50 KB each, 200 GB total) and nothing else. A colleague insists on Redis Cluster with AOF persistence. What would you question?',
      answer:
        'Whether we need any of what Redis adds. Rendered pages are opaque blobs, rebuilt from the database on a miss, so data structures and server-side operations buy nothing. Persistence buys little too: after a restart we can refill from the source, and AOF adds disk writes for data we would happily lose. Memcached fits this exactly: a multithreaded LRU cache, so a few large nodes hold 200 GB with client-side sharding, and losing a node only means some misses. Redis Cluster would work, but it is more to run for the same result. I would ask what else is planned for the cache tier. If rate limiting or sessions are coming, Redis may still be the better single tool.',
    },
    related: ['caching', 'cache-write-strategies', 'rate-limiting', 'distributed-counter'],
    refs: [
      {
        label: 'Redis — Data types',
        href: 'https://redis.io/docs/latest/develop/data-types/',
        note: 'The data structures, with the commands each one supports.',
      },
      {
        label: 'Redis — Persistence',
        href: 'https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/',
        note: 'RDB versus AOF, fsync policies, and what each can lose.',
      },
      {
        label: 'Redis — Key eviction',
        href: 'https://redis.io/docs/latest/develop/reference/eviction/',
        note: 'Every maxmemory policy, including the noeviction default.',
      },
      {
        label: 'Memcached wiki',
        href: 'https://github.com/memcached/memcached/wiki',
        note: 'The project\'s own documentation: protocol, configuration and design.',
      },
      {
        label: 'Redis — Licenses',
        href: 'https://redis.io/legal/licenses/',
        note: 'The licence terms for current Redis versions.',
      },
      {
        label: 'Valkey',
        href: 'https://valkey.io/',
        note: 'The BSD-licensed fork maintained under the Linux Foundation.',
      },
    ],
    hints: [
      'List what Redis adds over Memcached. Which of those does a cache of rendered pages actually use?',
      'If a cache node restarts empty, what does this system lose, apart from some misses?',
    ],
  },

  {
    slug: 'isolation-levels',
    title: 'Isolation levels',
    heading: 'Transaction isolation levels in DBMS and SQL',
    metaTitle: 'Isolation Levels in DBMS: Read Committed to Serializable',
    metaDescription:
      'Transaction isolation levels in DBMS explained: dirty reads, non-repeatable reads, phantoms, lost updates and write skew, plus PostgreSQL and MySQL defaults.',
    plural: true,
    subject: 'isolation levels',
    tier: 2,
    oneLine: 'How much one transaction is allowed to see of another that is running at the same time. Each level removes specific anomalies.',
    problem: [
      'Two transactions running at once can interfere: one reads data the other has not committed, or reads the same row twice and gets two answers, or both read, both decide, and both write. The isolation level is the setting that decides which of these interferences the database prevents for you.',
      'It matters in interviews because the defaults are weaker than most people assume. PostgreSQL defaults to read committed and MySQL\'s InnoDB to repeatable read; neither is serializable. Bugs like double-booking and overdrawn balances are fully possible at the default level, and the database will not raise an error.',
    ],
    cost: 'Stronger isolation means more waiting or more aborted transactions. Locking implementations make transactions queue and deadlock more often. Snapshot-based implementations keep old row versions around and abort conflicting transactions, so the application must retry. Serializable is correct by construction and costs the most throughput under contention.',
    useWhen: [
      'Choose consciously whenever a transaction reads data and then writes based on what it read: balances, stock, seat maps, rotas.',
      'Serializable for invariants that span several rows ("at least one doctor on call", "total allocations under the budget").',
      'Read committed, the common default, for ordinary single-row updates written as atomic statements.',
    ],
    avoidWhen: [
      'Do not raise the whole database to serializable to fix one race. Fix that transaction, or use it only there.',
      'Do not rely on an isolation level you have not checked for your database: "repeatable read" means different things in PostgreSQL and MySQL.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Write skew, the anomaly snapshot isolation still allows. Each transaction checks the rule against its own snapshot, writes a different row, and both commit.',
        nodes: [
          { id: 'a1', label: 'T1 reads', sub: '2 doctors on call', kind: 'service', col: 0, row: 0 },
          { id: 'a2', label: 'T1 writes', sub: 'Alice off call', kind: 'store', col: 1, row: 0 },
          { id: 'b1', label: 'T2 reads', sub: '2 doctors on call', kind: 'service', col: 0, row: 1 },
          { id: 'b2', label: 'T2 writes', sub: 'Bob off call', kind: 'store', col: 1, row: 1 },
          { id: 'r', label: 'Both commit', sub: '0 on call: rule broken', kind: 'note', col: 2, row: 0 },
          { id: 'f', label: 'Serializable aborts one', sub: 'or lock the rows read', kind: 'note', col: 2, row: 1 },
        ],
        edges: [
          { from: 'a1', to: 'a2', label: 'ok, 1 left' },
          { from: 'b1', to: 'b2', label: 'ok, 1 left' },
          { from: 'a2', to: 'r' },
          { from: 'b2', to: 'f', dashed: true },
        ],
      },
    },
    body: [
      '**The anomalies, in the order levels remove them.** A **dirty read** sees another transaction\'s uncommitted change, which may be rolled back. A **non-repeatable read** reads the same row twice and gets different values because someone committed in between. A **phantom** runs the same query twice and gets a different set of rows, because someone inserted or deleted a matching row. A **lost update** happens when two transactions read a value, both change it, and the second write overwrites the first. **Write skew** happens when two transactions read the same rows, each checks a rule, and each writes a different row, so neither overwrites the other, yet together they break the rule.',
      '**The four SQL standard levels.** Read uncommitted allows all of them. Read committed prevents dirty reads. Repeatable read also prevents non-repeatable reads. Serializable guarantees the result is the same as running the transactions one at a time in some order. The standard defines the first three by which of three phenomena they forbid (dirty read, non-repeatable read, phantom), and a well-known 1995 paper by Berenson and colleagues showed that this leaves gaps: lost updates and write skew are not covered by those definitions, and it named **snapshot isolation**, which many databases implement.',
      '**Snapshot isolation.** Each transaction reads from a consistent snapshot taken when it started, using multiple row versions (MVCC), so readers never block writers. If two transactions update the same row, one of them fails, which prevents lost updates. It still allows write skew, because the two transactions write different rows.',
      '**PostgreSQL.** The default is read committed, where each statement sees a fresh snapshot. Read uncommitted behaves like read committed. Repeatable read is snapshot isolation: the whole transaction sees one snapshot, phantoms do not appear, and updating a row that another transaction changed since your snapshot fails with a serialization error. Serializable adds Serializable Snapshot Isolation (SSI), which tracks read/write dependencies and aborts a transaction that would make the result non-serializable, including write skew. Any transaction at repeatable read or serializable must be retried when it fails with SQLSTATE 40001.',
      '**MySQL (InnoDB).** The default is repeatable read. Plain `SELECT`s read from a snapshot established by the first read in the transaction. But `UPDATE`, `DELETE` and locking reads (`SELECT ... FOR UPDATE` or `FOR SHARE`) work on the latest committed rows and take next-key locks over the ranges they scan, which blocks inserts into those gaps. The consequence to know: a value you read with a plain `SELECT` may be older than the row your `UPDATE` changes, so computing a new value in application code and writing it back can silently lose someone else\'s update. Use a locking read or an atomic `UPDATE ... SET qty = qty - 1`. At serializable, InnoDB turns plain `SELECT`s into locking reads when autocommit is off.',
      '**Picking a level, by example.** A transfer between two accounts written as two atomic `UPDATE`s with a balance check in the `WHERE` clause is safe at read committed. A booking that reads "is this seat free?" and then inserts a booking needs either a unique constraint on the seat, a locking read, or serializable. A rota rule across several rows ("at least one doctor on call") needs serializable, or a `SELECT ... FOR UPDATE` on every row the rule reads. For inventory, the simplest safe pattern is a conditional decrement (`WHERE qty >= n`), which needs no special level.',
    ],
    table: {
      caption: 'Which anomaly each level allows. "Standard" is the SQL standard\'s definition; real databases differ, as the paragraphs above explain.',
      headers: ['Level', 'Dirty read', 'Non-repeatable read', 'Phantom', 'Lost update', 'Write skew'],
      rows: [
        ['Read uncommitted', 'Possible', 'Possible', 'Possible', 'Possible', 'Possible'],
        ['Read committed', 'Prevented', 'Possible', 'Possible', 'Possible', 'Possible'],
        ['Repeatable read (standard)', 'Prevented', 'Prevented', 'Possible', 'Prevented with locking', 'Possible'],
        ['Snapshot isolation (PostgreSQL repeatable read)', 'Prevented', 'Prevented', 'Prevented for reads', 'Prevented (one transaction fails)', 'Possible'],
        ['Serializable', 'Prevented', 'Prevented', 'Prevented', 'Prevented', 'Prevented'],
      ],
    },
    examples: [
      {
        label: 'write skew, and two fixes (PostgreSQL)',
        src: `-- the rule: at least one doctor on call for shift 7
-- run T1 and T2 at the same time, each at REPEATABLE READ:
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) FROM rota WHERE shift = 7 AND on_call;   -- both see 2
UPDATE rota SET on_call = false WHERE shift = 7 AND doctor = 'alice';  -- T2: 'bob'
COMMIT;                                                   -- both succeed: 0 on call

-- fix 1: SERIALIZABLE. One of the two commits fails with SQLSTATE 40001;
-- the application retries it, sees 1 on call, and refuses.
BEGIN ISOLATION LEVEL SERIALIZABLE;
-- ... same statements ...
COMMIT;

-- fix 2: lock the rows the rule reads, at any level.
BEGIN;
SELECT doctor FROM rota WHERE shift = 7 AND on_call FOR UPDATE;  -- T2 waits here
UPDATE rota SET on_call = false WHERE shift = 7 AND doctor = 'alice';
COMMIT;`,
        note: 'Fix 1 needs retry logic for serialization failures. Fix 2 needs every code path that changes the rota to take the same locks.',
      },
    ],
    traps: [
      'Assuming the default level is serializable. In PostgreSQL it is read committed; in MySQL InnoDB, repeatable read.',
      'Using serializable or repeatable read without retrying on serialization failures (SQLSTATE 40001).',
      'Treating "repeatable read" as one behaviour. PostgreSQL gives snapshot isolation; MySQL mixes snapshot reads with locking writes.',
      'Forgetting write skew: no row is overwritten, yet the rule is broken.',
    ],
    sayThis:
      '"Postgres at its default, read committed. The seat booking is a single conditional update, so it is safe at that level. The rota change checks a rule across several rows, so that one transaction runs at serializable with a retry on 40001. Cost: under contention some of those transactions abort and retry, which I accept because the rule cannot be broken."',
    faq: [
      {
        q: 'What is the default isolation level in PostgreSQL and MySQL?',
        a: 'PostgreSQL defaults to read committed. MySQL\'s InnoDB engine defaults to repeatable read. Both are documented in their manuals, and both allow anomalies that serializable would prevent.',
      },
      {
        q: 'What is the difference between repeatable read and serializable?',
        a: 'Repeatable read guarantees that rows you read do not change under you. Serializable guarantees the whole outcome is equivalent to running transactions one after another. The gap between them includes phantoms (in the standard) and write skew (in snapshot-based databases).',
      },
      {
        q: 'What is a phantom read?',
        a: 'Running the same query twice in one transaction and getting a different set of rows, because another transaction inserted or deleted a matching row and committed in between. It differs from a non-repeatable read, where an existing row\'s value changes.',
      },
      {
        q: 'What is snapshot isolation?',
        a: 'Each transaction reads from a consistent snapshot of the database as of its start, using row versions, and a transaction fails if it updates a row someone else changed since its snapshot. It prevents dirty reads, non-repeatable reads and lost updates, and still allows write skew.',
      },
      {
        q: 'Is serializable always slower?',
        a: 'It costs more under contention, through waiting (locking databases) or aborts and retries (PostgreSQL\'s SSI). With little contention the overhead can be modest. Measure on your workload rather than assuming either way.',
      },
    ],
    followUp: {
      q: '"Which isolation level would you use for a payments service?"',
      answer:
        'I would not answer with one level for the whole service, because the level matters per transaction. Most payment writes can be made safe at read committed by writing them as single atomic statements: debit with a condition that the balance stays non-negative, and check that one row changed. A ledger insert with a unique idempotency key cannot double-post, whatever the level. Where a transaction reads several rows and decides based on all of them, such as checking a daily limit across today\'s payments before inserting a new one, read committed is not enough: two payments can each see room under the limit and both commit. That transaction runs at serializable, with a retry loop on serialization failures, or takes a lock on the account row first so the checks queue. Cost: serializable transactions abort under contention and the client must retry, so I keep them short and only use them where a rule spans rows.',
    },
    selfCheck: {
      q: 'Two transactions each read "2 doctors on call", and each takes a different doctor off call. Both commit at PostgreSQL repeatable read. What anomaly is this, and name two fixes.',
      answer:
        'Write skew. Each transaction checked the rule against its own snapshot and wrote a different row, so snapshot isolation saw no conflict: nobody updated a row the other had updated. The result breaks the invariant that one doctor stays on call. Fix one: run the transaction at serializable. PostgreSQL detects the dangerous read/write pattern and aborts one of them with a serialization failure; the application retries, sees only one doctor left, and refuses. Fix two: make the conflict explicit by locking the rows the rule reads, with SELECT ... FOR UPDATE, so the second transaction waits for the first and then sees the true count. A third option is to give the invariant a single row to contend on, such as a per-shift counter both transactions must update.',
    },
    related: ['transactions-and-locking', 'optimistic-vs-pessimistic-locking', 'consistency-models', 'sql-vs-nosql'],
    refs: [
      {
        label: 'PostgreSQL — Transaction Isolation',
        href: 'https://www.postgresql.org/docs/current/transaction-iso.html',
        note: 'The levels as PostgreSQL implements them, including SSI and serialization failures.',
      },
      {
        label: 'MySQL 8.4 — Transaction Isolation Levels (InnoDB)',
        href: 'https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html',
        note: 'Consistent reads, locking reads and next-key locks at each level.',
      },
      {
        label: 'A Critique of ANSI SQL Isolation Levels (1995)',
        href: 'https://www.microsoft.com/en-us/research/publication/a-critique-of-ansi-sql-isolation-levels/',
        note: 'The paper that defined lost update, write skew and snapshot isolation precisely.',
      },
      {
        label: 'Jepsen — Consistency models',
        href: 'https://jepsen.io/consistency',
        note: 'Where the isolation levels sit among distributed consistency models.',
      },
    ],
    hints: [
      'Did either transaction overwrite a row the other wrote? If not, what did snapshot isolation have to detect?',
      'One fix changes the level. The other makes the second transaction wait for the first.',
    ],
  },

  {
    slug: 'optimistic-vs-pessimistic-locking',
    title: 'Optimistic vs pessimistic locking',
    heading: 'Optimistic vs pessimistic locking: which one, and when?',
    metaTitle: 'Optimistic vs Pessimistic Locking (Database, with Examples)',
    metaDescription:
      'Optimistic vs pessimistic locking with SQL examples: SELECT FOR UPDATE vs a version column, retries vs waiting, deadlocks, and choosing by contention.',
    subject: 'the optimistic vs pessimistic choice',
    tier: 2,
    oneLine: 'Lock first and make others wait, or go ahead and check for a conflict when you write. Choose by how often writers collide.',
    problem: [
      'When two requests may change the same record, something must stop the second from silently overwriting the first. **Pessimistic locking** assumes a conflict will happen: it locks the row before reading it, and anyone else who wants it waits. **Optimistic locking** assumes a conflict is rare: it reads without locking, and at write time checks that nobody changed the row in the meantime, retrying if they did.',
      'Both are correct. They differ in where the cost lands, waiting versus retrying, and that depends on how often writers actually collide. The broader page on [transactions and locking](/concepts/transactions-and-locking) introduces both; this one is about choosing between them.',
    ],
    cost: 'Pessimistic locking costs concurrency: writers to a hot row queue one at a time, a lock held across slow work blocks everyone behind it, and two transactions locking rows in different orders deadlock. Optimistic locking costs wasted work: every conflict throws away an attempt and repeats it, which is cheap when conflicts are rare and collapses into a retry storm when they are common.',
    useWhen: [
      'Optimistic: conflicts are rare, such as editing your own profile, admin screens, most CRUD, and any edit that spans user think-time across HTTP requests.',
      'Pessimistic: conflicts are frequent and retries are expensive, such as a hot inventory row, or a job queue where workers claim rows.',
      'Pessimistic with SKIP LOCKED: many workers pulling distinct jobs from one table without blocking each other.',
    ],
    avoidWhen: [
      'Pessimistic locking across a user\'s think-time or a network call. A lock held while someone types, or while a payment API responds, blocks everyone else.',
      'Optimistic locking on a row that thousands of requests update per second. Most attempts fail and retry, and throughput falls.',
      'Either one, when a single atomic statement can do the check and the write together.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'Average attempts per successful optimistic write, if each attempt conflicts with probability p (attempts follow 1 / (1 − p)).',
        items: [
          { label: 'p = 10%: most CRUD', value: 1.1, display: '1.1 attempts', tone: 'accent' },
          { label: 'p = 50%: a busy shared record', value: 2, display: '2 attempts', tone: 'muted' },
          { label: 'p = 90%: a flash sale on one row', value: 10, display: '10 attempts, all doing the work again', tone: 'bad' },
        ],
        note: 'The curve is why the choice depends on contention. At low p, optimistic locking is almost free. As p approaches 1, the retries are the workload, and making writers wait in line is cheaper.',
      },
    },
    body: [
      '**Pessimistic, in SQL.** Inside a transaction, `SELECT ... FOR UPDATE` locks the selected rows until commit or rollback. Another transaction that tries to lock or update them waits. Two options change the waiting: `NOWAIT` fails immediately if the row is locked, and `SKIP LOCKED` skips locked rows, which turns a table into a work queue that many workers can poll without blocking each other. Both are supported by PostgreSQL and by MySQL 8.0 and later. Set a lock timeout as well, so a stuck transaction cannot hold everyone up forever.',
      '**Optimistic, in SQL.** Add a `version` column (or use an update timestamp). Read the row and its version. Write with `UPDATE ... SET ..., version = version + 1 WHERE id = ? AND version = ?`, then check the number of rows affected. One row means you won. Zero means someone changed it after you read: re-read, re-apply your change if it still makes sense, and try again, with a cap on attempts. No lock is held between the read and the write, which is what lets the read happen in one HTTP request and the write in another, minutes later.',
      '**The option that beats both.** When the decision fits in one statement, let the database do it atomically: `UPDATE stock SET qty = qty - 1 WHERE sku = ? AND qty >= 1`. There is no separate read, so there is no gap to protect, no lock held across application code, and no retry. Reach for optimistic or pessimistic locking when the new value needs logic the database cannot express in the `WHERE` clause.',
      '**Deadlocks are a pessimistic problem.** Transaction A locks account 1 then wants account 2; transaction B locks 2 then wants 1. The database detects the cycle and aborts one. Prevent it by always locking in the same order (for example, lowest id first) and keeping transactions short. Optimistic locking cannot deadlock, because it holds nothing while it works.',
      '**The same idea outside the database.** HTTP has optimistic concurrency built in: the server returns an `ETag`, the client sends it back in `If-Match` with its update, and the server answers `412 Precondition Failed` if the resource changed. Redis offers `WATCH` with `MULTI`/`EXEC`: the transaction is discarded if a watched key changed. DynamoDB and many key-value stores offer conditional writes. ORMs wrap the version column for you, such as JPA\'s `@Version`.',
      '**Distributed locks are pessimistic locks with extra failure modes.** A lock held in Redis or ZooKeeper can expire while its holder is paused (a long GC pause, a network stall), and the holder then writes believing it still owns the lock. The standard defence is a fencing token: a number that increases with every lock grant, passed with each write, so the storage rejects writes carrying an older token. Martin Kleppmann\'s essay on distributed locking explains it well.',
      '**Choosing, in one sentence.** Estimate how often two writers touch the same record within the time it takes to do the work. Rarely: optimistic. Often, with expensive work: pessimistic. Often, with work that fits one statement: an atomic conditional update. The [ticket booking problem](/problems/ticket-booking) is a good place to practise all three.',
    ],
    table: {
      caption: 'Side by side. Neither is "better"; they put the cost in different places.',
      headers: ['', 'Pessimistic locking', 'Optimistic locking'],
      rows: [
        ['Mechanism', '`SELECT ... FOR UPDATE`, then update, then commit', 'Read with a version, then `UPDATE ... WHERE version = ?`'],
        ['Conflict detected', 'Before the work: the second writer waits', 'At write time: zero rows updated'],
        ['Cost with no conflict', 'A lock taken and released', 'Almost none'],
        ['Cost under contention', 'Writers queue; throughput is one at a time per row', 'Retries; wasted work grows quickly'],
        ['Deadlocks', 'Possible; lock in a fixed order', 'Not possible'],
        ['Holds a connection while you think', 'Yes, for the whole transaction', 'No'],
        ['Works across HTTP requests', 'No', 'Yes (version or ETag round-trips with the client)'],
        ['Good for', 'Hot rows, job queues (SKIP LOCKED), expensive work', 'Most CRUD, user edits, low-contention records'],
      ],
    },
    examples: [
      {
        label: 'both patterns in SQL (PostgreSQL)',
        src: `-- pessimistic: lock, decide, write, commit
BEGIN;
SELECT qty FROM stock WHERE sku = 'A1' FOR UPDATE;      -- others wait here
-- application checks qty, computes the new value
UPDATE stock SET qty = 4 WHERE sku = 'A1';
COMMIT;

-- a job queue: each worker claims a different row, nobody blocks
SELECT id FROM jobs WHERE state = 'ready'
ORDER BY id LIMIT 1
FOR UPDATE SKIP LOCKED;

-- optimistic: no lock; the WHERE clause detects a conflict
SELECT qty, version FROM stock WHERE sku = 'A1';         -- say qty 5, version 12
UPDATE stock SET qty = 4, version = version + 1
WHERE sku = 'A1' AND version = 12;                        -- 0 rows: someone won, retry`,
      },
      {
        label: 'optimistic retry loop in Go (database/sql)',
        src: `var ErrConflict = errors.New("stock changed too often, try again")

func Reserve(ctx context.Context, db *sql.DB, sku string, n int) error {
	for attempt := 0; attempt < 3; attempt++ {
		var qty, version int
		err := db.QueryRowContext(ctx,
			"SELECT qty, version FROM stock WHERE sku = $1", sku).Scan(&qty, &version)
		if err != nil {
			return err
		}
		if qty < n {
			return ErrOutOfStock
		}
		res, err := db.ExecContext(ctx,
			"UPDATE stock SET qty = $1, version = version + 1 WHERE sku = $2 AND version = $3",
			qty-n, sku, version)
		if err != nil {
			return err
		}
		if rows, _ := res.RowsAffected(); rows == 1 {
			return nil // nobody changed it between our read and our write
		}
		// zero rows: another writer got there first; read again and retry
	}
	return ErrConflict
}`,
        note: 'For this exact case the atomic `UPDATE ... SET qty = qty - $1 WHERE sku = $2 AND qty >= $1` is simpler. The loop is for when the new value needs logic that cannot go in SQL.',
      },
    ],
    traps: [
      'Holding a `FOR UPDATE` lock while calling a payment provider or waiting for a user.',
      'Optimistic locking with unlimited retries. Cap the attempts and return a clear conflict error.',
      'Forgetting to check rows affected, which turns the version check into a no-op.',
      'Reaching for either one when a single conditional `UPDATE` would do the check and the write atomically.',
    ],
    sayThis:
      '"Profile edits use optimistic locking with a version column, because two people rarely edit the same profile and it works across the form\'s two HTTP requests. The flash-sale stock is a single conditional decrement, so there is nothing to lock. The job table uses FOR UPDATE SKIP LOCKED so workers never block each other. Cost: optimistic writes can fail and the client must retry, which at this contention is about one in a hundred."',
    faq: [
      {
        q: 'Does optimistic locking actually lock anything?',
        a: 'Not in the sense of making others wait. The database still locks the row briefly while executing the UPDATE, as it does for any write, but nothing is held between your read and your write. The "lock" is the version check in the WHERE clause.',
      },
      {
        q: 'What is the difference between NOWAIT and SKIP LOCKED?',
        a: 'With NOWAIT, a locking read fails at once with an error if a row is already locked. With SKIP LOCKED, it silently leaves locked rows out of the result. NOWAIT suits "tell the user it is busy"; SKIP LOCKED suits queues where any free row will do.',
      },
      {
        q: 'How does optimistic locking work in a REST API?',
        a: 'The GET response carries an ETag (often the row version). The client sends it back in an If-Match header on PUT or PATCH. If the resource changed, the server responds 412 Precondition Failed, and the client re-fetches and retries or shows the conflict.',
      },
      {
        q: 'Which is better for high concurrency?',
        a: 'It depends on whether the concurrent requests touch the same rows. Many requests on different rows: optimistic, since conflicts stay rare. Many requests on the same row: pessimistic locking, a queue, or ideally an atomic conditional update, because optimistic retries multiply the load.',
      },
    ],
    followUp: {
      q: '"Flash sale: 10,000 people try to buy the same 100 items in one second. Optimistic or pessimistic?"',
      answer:
        'Neither as the first choice. Optimistic locking would be the worst here: nearly every attempt conflicts, so each buyer retries several times and the database does many times the useful work. Pessimistic locking is correct, but every buyer queues on one row lock, holding a connection while they wait, so the connection pool empties and unrelated pages slow down. The better answer is to remove the read-then-write entirely: one conditional decrement, update stock set quantity minus one where the item matches and quantity is at least one, and look at rows affected. The database serialises those statements on the row with no application logic in between, so each takes microseconds. If that row is still too hot, I would put a queue in front so requests are admitted at a rate the row can take, or split the stock into several rows and decrement any one with stock left. Cost: the queue adds waiting for buyers, and split stock means the last few units can sit in one row while another reports none left, which needs a sweep.',
    },
    selfCheck: {
      q: 'A wiki lets users edit a page in a form for several minutes and then save. Which locking approach, and why not the other?',
      answer:
        'Optimistic. When the user opens the editor, send the page\'s version with it (or an ETag). On save, update where the version still matches. If someone else saved in the meantime, zero rows change, and the app shows the conflict or a diff instead of overwriting their work. Pessimistic locking would mean holding a database lock, and a connection, for the minutes the user spends typing, across two separate HTTP requests, which databases are not built for and which blocks every other editor. Wikis that do lock pages implement it as an application-level "being edited" flag with an expiry, not a database row lock.',
    },
    related: ['transactions-and-locking', 'isolation-levels', 'idempotency', 'distributed-counter'],
    refs: [
      {
        label: 'PostgreSQL — The locking clause (FOR UPDATE, NOWAIT, SKIP LOCKED)',
        href: 'https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE',
        note: 'Exactly what each row-locking option does.',
      },
      {
        label: 'RFC 9110 — Conditional requests',
        href: 'https://www.rfc-editor.org/rfc/rfc9110#name-conditional-requests',
        note: 'ETag, If-Match and 412 Precondition Failed: optimistic concurrency in HTTP.',
      },
      {
        label: 'Redis — Transactions (WATCH)',
        href: 'https://redis.io/docs/latest/develop/interact/transactions/',
        note: 'Optimistic check-and-set with WATCH, MULTI and EXEC.',
      },
      {
        label: 'Martin Kleppmann — How to do distributed locking',
        href: 'https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html',
        note: 'Why lock expiry needs fencing tokens.',
      },
    ],
    hints: [
      'How long does the "think" part last here, and where is the user while it happens?',
      'Could you hold a database lock between two separate HTTP requests? What would it hold onto in the meantime?',
    ],
  },
]
