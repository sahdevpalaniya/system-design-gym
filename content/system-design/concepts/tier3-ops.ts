import type { Concept } from '@/lib/types'

/**
 * Running it in production. These are the topics that separate a design that
 * looks good on a whiteboard from one someone can actually operate — and they
 * are exactly what the "operations" and "cost" follow-ups attack.
 */
export const TIER3_OPS: Concept[] = [
  {
    slug: 'auth-and-security',
    title: 'Authentication, authorization and secrets',
    navTitle: 'Auth and secrets',
    tier: 3,
    oneLine: 'Who are you, what are you allowed to do, and where do the keys live.',
    problem: [
      'Every design has a box labelled "auth" that nobody explains. Then the interviewer asks how a request proves who it is across five services, and the answer falls apart.',
      'Two different questions hide behind one word. **Authentication** is proving who you are. **Authorization** is deciding what you may do. They fail differently, they live in different places, and mixing them up is the most common mistake in this area.',
    ],
    cost: 'Security is friction you pay on every request, forever. Checking a token costs time. Checking permissions properly usually costs a lookup. Short token lifetimes mean more refreshes; long ones mean a stolen token stays useful for longer. Encryption costs CPU and makes debugging harder because you can no longer read what is going past. And every one of these is a place where being slightly wrong is much worse than being slow.',
    useWhen: [
      'Any system with users. Say how a request proves who it is, once, early, and move on.',
      'Any public API — the auth model decides the rate limiting story too.',
      'Anywhere one user\'s data must not reach another user. Which is everywhere.',
      'Whenever the design crosses a trust boundary: browser to server, your company to a partner.',
    ],
    avoidWhen: [
      'Do not design your own crypto, token format or password hashing. Use what exists. Saying that is the correct answer.',
      'Do not spend ten minutes on auth in a 45-minute interview unless it is the question. State the model in two sentences and move to the part they asked about.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The one decision that shapes everything else: is the token self-describing, or is it a lookup key?',
        a: {
          title: 'Stateless token (JWT)',
          points: [
            'The token carries the claims and a signature. Any service can verify it with a public key.',
            'No lookup on the auth path, so it scales without a shared store.',
            'You cannot revoke it. It is valid until it expires, and that is the whole problem.',
            'Fix: keep lifetimes short (minutes) with a refresh token, plus a small deny list.',
            'Right for: service-to-service calls, and short-lived access tokens.',
          ],
        },
        b: {
          title: 'Opaque session token',
          points: [
            'The token is a random id. The truth lives in a session store.',
            'Revocation is instant — delete the row and the session is gone.',
            'Every request costs a lookup, so that store is now on your critical path.',
            'Mitigated by caching, which quietly bring backs the revocation delay.',
            'Right for: browser sessions, anywhere "log out everywhere" must work now.',
          ],
        },
        verdict:
          'The honest hybrid, and what most real systems do: a short-lived stateless access token for the request path, plus a long-lived opaque refresh token held in the session store. You get verification with no lookup, and revocation that takes effect within the access token\'s lifetime rather than never.',
      },
    },
    body: [
      '**Authentication.** A user proves who they are once, and gets a token. Passwords are stored as a slow hash — bcrypt, scrypt or argon2 — never encrypted and certainly never in plain text, and the reason they are slow on purpose is to make guessing expensive. The credential check should also be rate limited per account and per IP, because that endpoint is the one people attack.',
      '**OAuth and OIDC**, in one honest paragraph, because people quote the names without the meaning. OAuth is about *delegated access*: it lets one application act on a user\'s behalf at another service without ever seeing their password. That is what "sign in with Google" is doing underneath. OIDC is a thin layer on top of OAuth that adds identity — it gives you a token that says who the user is, not just what you may do. If you are asked why not just take the user\'s password for the other service, the answer is that a password is unlimited and permanent, and a token is scoped and expiring.',
      '**Authorization** is the part that gets skipped and the part that leaks data. Two models cover almost everything. *Role-based*: a user has roles, and roles grant permissions. Simple, and it breaks the moment permissions depend on the specific object — "an editor, but only on documents in their team". *Attribute or relationship based*: the decision is computed from the user, the object and the context. More powerful, more expensive, and it usually needs its own service so the rules live in one place instead of being scattered across every endpoint.',
      'The rule that matters more than the model: **check authorization at the point of data access, not at the edge.** A gateway can confirm a request has a valid token. It usually cannot know that document 91 belongs to a different tenant. If the check lives only in the gateway, then the first internal service that forgets it leaks data. Every query should be scoped by the caller\'s identity, and the safest designs make it hard to write a query that is not.',
      '**Between services.** Do not let internal calls be unauthenticated just because they are on a private network. That is the assumption every large breach report describes afterwards. Use mutual TLS, or signed service tokens, and pass the end user\'s identity along explicitly so the service doing the data access can make the real decision. Also decide whether a service is acting for itself or on behalf of a user, because those are different permissions.',
      '**Secrets.** Keys and credentials do not live in the repository, in an environment variable pasted by hand, or in a config file. They live in a secret manager, they are injected at runtime, and they can be rotated without a code change. Say "rotatable" out loud, because the follow-up is always what you do when a key leaks, and the answer has to be better than "redeploy everything".',
      '**Encryption**, briefly and correctly. In transit means TLS everywhere, including inside your network. At rest means the disk or the field is encrypted, which mostly protects you against a stolen backup or a disposed disk — it does nothing against an attacker who has valid application credentials, and saying so shows you understand what it buys. Sensitive fields can be encrypted individually so that even a database dump is not enough, at the cost of not being able to query them.',
    ],
    followUp: {
      q: '"A user clicks log out on their laptop. How fast does that take effect on their phone?"',
      answer:
        'It depends entirely on the token design, and this is the question that exposes whether someone has actually shipped auth. With opaque session tokens, instantly — the session row is deleted, and the next request from any device fails its lookup. With stateless JWTs, not at all until the token expires, because every service can verify that token on its own without asking anybody, which is exactly the property that made it fast. That is not a bug in JWTs, it is the trade they make, and the mistake is choosing them and then promising instant revocation. What I would build is the hybrid: an access token with a five to fifteen minute life, and a refresh token that lives in a session store. Logging out deletes the refresh token, so the phone keeps working for up to fifteen minutes and then cannot renew. If the product really needs immediate revocation — a compromised account, a fired employee — I would add a small deny list of revoked token ids, checked on the request path and cached, which is cheap because it only ever holds tokens revoked in the last fifteen minutes. Cost: I have put a lookup back on the critical path for the case I said I was avoiding, so I would apply it only where it matters.',
    },
    selfCheck: {
      q: 'Your API gateway validates the token on every request. Is that enough to stop user A reading user B\'s invoice? Explain.',
      answer:
        'No, and the distinction is the whole point. The gateway is doing authentication — it has confirmed the token is genuine and unexpired, so it knows this request really is user A. It has not done authorization, because it has no idea that invoice 4471 belongs to user B. Unless something further in checks ownership, user A can simply ask for someone else\'s invoice id and get it, which is one of the most common real-world vulnerabilities there is. The fix is to make the authorization check happen where the data is accessed: the query itself is scoped by the caller, selecting the invoice by id *and* owner, so an invoice belonging to someone else returns nothing rather than returning data. Doing it in the query rather than as a separate check also removes the gap where someone remembers to fetch but forgets to verify. The gateway is still useful — it rejects unauthenticated traffic cheaply, before it costs you anything — but it can only answer "who", never "what may they touch".',
    },
    traps: [
      'Saying "JWT" and then promising instant logout everywhere. Pick one.',
      'Checking permissions only at the gateway, so any internal service that forgets leaks data.',
      'Trusting internal calls because they are on a private network.',
      'Secrets in environment variables or config files, with no rotation story.',
      'Designing your own token format or password hashing.',
    ],
    sayThis:
      '"Short-lived signed access tokens so services verify without a lookup, plus an opaque refresh token in a session store so logout actually works within fifteen minutes. Authorization is checked at data access — every query is scoped by the caller, not just by the gateway. Secrets come from a secret manager and are rotatable without a deploy."',
    related: ['api-design', 'reverse-proxy', 'rate-limiting', 'observability'],
  },

  {
    slug: 'observability',
    title: 'Observability — metrics, logs, traces and alerts',
    navTitle: 'Observability',
    tier: 3,
    oneLine: 'How you find out something is broken, and how you find out why, at three in the morning.',
    problem: [
      'A design that cannot be debugged is not finished. The interviewer asks "how do you know it is working?" and the answer cannot be "we would look at the logs".',
      'Three signals answer three different questions. **Metrics** tell you something is wrong. **Traces** tell you where. **Logs** tell you why. People collect all three and can still answer none of them, because they collected the wrong things.',
    ],
    cost: 'Observability is expensive, and the cost surprises people. High-volume logs can cost more than the service that produced them. Every metric with a high-cardinality label — user id, request id — multiplies your storage. Tracing every request is impractical, so you sample, and sampling means the rare failure you actually wanted is the one you did not capture. And instrumenting everything adds latency and code noise.',
    useWhen: [
      'Every production system. This is not optional, it is part of the design.',
      'Whenever you are asked how you would detect or debug a failure — which is a standard follow-up.',
      'Before you promise an availability number, because you cannot promise what you cannot measure.',
    ],
    avoidWhen: [
      'Do not log every request body at full volume. That is a cost problem and a privacy problem at the same time.',
      'Do not alert on every metric. An alert nobody acts on trains people to ignore alerts, which is worse than having none.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Three signals, three questions. Start at the metric, narrow with the trace, confirm with the log. Going straight to the logs is how people spend an hour on the wrong service.',
        nodes: [
          { id: 'm', label: 'Metrics', sub: 'is something wrong?', kind: 'service', col: 0, row: 0 },
          { id: 't', label: 'Traces', sub: 'where is the time going?', kind: 'service', col: 1, row: 0 },
          { id: 'l', label: 'Logs', sub: 'why did it fail?', kind: 'store', col: 2, row: 0 },
          { id: 'a', label: 'Alert', sub: 'on symptoms, not causes', kind: 'external', col: 0, row: 1 },
          { id: 'n', label: 'cheap and always on → expensive and sampled → most expensive per byte', kind: 'note', col: 1, row: 1, span: 2 },
        ],
        edges: [
          { from: 'm', to: 'a', label: 'threshold' },
          { from: 'm', to: 't', label: 'narrow' },
          { from: 't', to: 'l', label: 'confirm' },
        ],
      },
    },
    body: [
      '**Metrics** are numbers over time, cheap to store and always on. The four worth naming for any request-serving system are request rate, error rate, latency percentiles and saturation — how full the thing is. Quote p50 and p99, never the average, for the reason the latency page gives: nobody experiences the average. For a queue, the equivalents are consumer lag, oldest message age and dead letter arrival rate.',
      'The rule that keeps metrics affordable is **no unbounded labels**. A metric tagged with user id or request id creates a separate time series per value, and that is how a monitoring bill exceeds a hosting bill. Tag by endpoint, status code and region — things with a small fixed set of values.',
      '**Traces** follow one request across every service it touches, with a timing for each hop. This is the signal that answers "was it one slow call or two hundred fast ones", which is the question you actually have when something is slow. It needs a trace id created at the edge and passed through every call, including into queue messages, or the trace stops at the first async boundary — which is exactly where the interesting failures are. Because tracing every request is too expensive, you sample, and the right approach is to always keep traces for errors and slow requests, and sample the boring ones.',
      '**Logs** are the detail, and they are the most expensive per byte. Make them structured — key-value, not prose — so they can be searched and aggregated instead of grepped. Every line should carry the trace id, so a log and a trace can be joined. And logs are where personal data leaks by accident, so decide explicitly what may not be written.',
      '**SLIs and SLOs** are how you turn all of this into a decision. An SLI is the thing you measure — say, the share of requests that succeed in under 300 ms. An SLO is the target you commit to, say 99.9% over 30 days. The useful part is what falls out of it: an **error budget**. If the target allows 0.1% failure and you have used a quarter of it this month, you can keep shipping. If you have burned it, you stop shipping features and fix reliability. That converts an argument about "is this stable enough" into arithmetic, and mentioning it is a strong senior signal.',
      '**Alerting** has one rule that matters: **alert on symptoms, not causes.** Page someone when users are affected — error rate up, latency past the SLO, the queue\'s oldest message getting older. Do not page them because CPU hit 90%, because CPU at 90% with everything working fine is not a problem, and it teaches people to ignore the pager. Every alert should be actionable, should say what to do, and should be reviewed when it fires and turns out not to matter.',
      'Two more that come up. **Health checks** should distinguish liveness — is this process alive, cheap and dependency-free — from readiness, which may check dependencies. Confusing them takes down whole fleets, as the load balancing page describes. And **dashboards are not monitoring**: a dashboard nobody is looking at at 3am detects nothing. The alert is the detection; the dashboard is for the investigation afterwards.',
    ],
    followUp: {
      q: '"Something is slow. Users are complaining. Walk me through the first five minutes."',
      answer:
        'I start with the metric, not the logs, because the logs cannot tell me the shape of the problem. First: is it everyone or a subset? A dashboard of error rate and p50 and p99 by endpoint answers that in seconds. If p99 is bad and p50 is fine, it is data-dependent — some users have far more rows, or one tenant is hammering one path. If both are bad, something shared is saturating. Second: did it start? Almost every incident has a change behind it, so I look at what deployed or what config changed in the window when the graph bent. That single question resolves a large share of incidents on its own. Third: I take a trace of a slow request and see where the time went — one slow dependency, or many small calls. That tells me which service to look at, which is the thing I would otherwise have guessed. Fourth, and only now, logs for that service, filtered by the trace id, to find out why. Fifth, in parallel with all of it: mitigate before diagnosing. If a recent deploy is the suspect, roll it back before I finish understanding it, because the goal in the first five minutes is to stop the bleeding, not to be right. What I would want to have set up beforehand for this to work: trace ids propagated through queues as well as HTTP, structured logs carrying that id, and an alert that fired from the SLO rather than from a user complaint — because in this question the users told us, which means my monitoring already failed.',
    },
    selfCheck: {
      q: 'Why alert on error rate rather than on CPU usage? Give the failure mode of each choice.',
      answer:
        'Because error rate is a symptom users feel and CPU is a cause that may not matter. If you alert on CPU at 90%, you get paged for a service that is running hot and serving every request perfectly, which is not a problem — and you also miss the outage where CPU is low precisely because requests are failing fast or stuck waiting on a dependency. Both directions are wrong: false pages that train people to ignore the alert, and real outages that never fire. Alerting on error rate and on latency against the SLO means the page fires when and only when users are actually affected, whatever the underlying cause turns out to be, including causes nobody predicted. CPU is still worth collecting — it is exactly what you look at during the investigation, and it is useful for capacity planning — it just should not be what wakes someone up. The general rule is that you page on symptoms and you diagnose with causes.',
    },
    traps: [
      'Saying "we would monitor it" with no named signal, threshold or action.',
      'Metrics labelled with user id or request id, which explodes cardinality and cost.',
      'No trace id passed through queue messages, so the trace stops at the async boundary.',
      'Alerting on CPU and disk instead of on what users experience.',
      'Promising an availability number with nothing measuring it.',
    ],
    sayThis:
      '"Request rate, error rate, p50 and p99, and saturation per endpoint, with an SLO of 99.9% under 300 ms and an error budget that governs whether we keep shipping. Alerts fire on those symptoms, not on CPU. Traces carry an id through HTTP and queue messages, sampled but always kept for errors and slow requests. Cost: logs are the expensive signal, so they are structured, sampled, and scrubbed of personal data."',
    related: ['circuit-breakers', 'deploys-and-releases', 'availability-patterns', 'auth-and-security'],
  },

  {
    slug: 'deploys-and-releases',
    title: 'Deploys, migrations and safe releases',
    navTitle: 'Deploys and releases',
    tier: 3,
    oneLine: 'Most outages are something you did on purpose. This is how you make that survivable.',
    problem: [
      'People design for hardware failure, which is rare, and skip the thing that actually causes most downtime: someone shipped a change. Redundancy does nothing about a bug deployed to every machine at once.',
      'The interesting question is not "how do you deploy" but "how do you make a bad change cheap" — cheap to notice, cheap to stop, and cheap to undo.',
    ],
    cost: 'Safety slows you down. A canary means a release takes an hour instead of five minutes. Backwards-compatible migrations turn one schema change into three deploys across three releases. Feature flags accumulate until nobody knows which combinations are actually tested. And every one of these adds a state your system can be in, which is a state you have to reason about.',
    useWhen: [
      'Any system with an availability target. The deploy path is part of that number.',
      'Any schema change on a table big enough that people will notice.',
      'Whenever a follow-up asks how you ship without downtime, or how you undo a bad release.',
    ],
    avoidWhen: [
      'Do not build an elaborate release pipeline for a service with no users yet. Ship, then add safety as the stakes rise.',
      'Do not put a feature flag on everything. Each one doubles the number of paths you are not testing.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'Expand, migrate, contract. Each step is deployable on its own and each is safe to stop at — which is the property that makes a rollback possible at any point.',
        nodes: [
          { id: '1', label: '1. Expand', sub: 'add the new column', kind: 'store', col: 0, row: 0 },
          { id: '2', label: '2. Write both', sub: 'old code still works', kind: 'service', col: 1, row: 0 },
          { id: '3', label: '3. Backfill', sub: 'in batches', kind: 'service', col: 2, row: 0 },
          { id: '4', label: '4. Read new', sub: 'verify, then switch', kind: 'service', col: 3, row: 0 },
          { id: '5', label: '5. Contract', sub: 'drop the old column', kind: 'store', col: 4, row: 0 },
          { id: 'n', label: 'a rename is never one deploy — it is these five, over days', kind: 'note', col: 0, row: 1, span: 4 },
        ],
        edges: [
          { from: '1', to: '2' },
          { from: '2', to: '3' },
          { from: '3', to: '4' },
          { from: '4', to: '5' },
        ],
      },
    },
    body: [
      '**Rolling deploy** is the baseline, and the load balancing page covers the mechanics: take an instance out, drain its in-flight requests, update it, wait for the health check, put it back. The property that makes it work is that the new version has to run happily alongside the old one, because for a few minutes both are live. Everything else in this topic follows from that one constraint.',
      '**Canary** goes further: send a small share of traffic — 1%, then 5%, then 25% — to the new version, and compare error rate and latency against the old one before continuing. The value is that a bad release affects 1% of users for five minutes instead of 100% for however long it takes someone to notice. Say what you compare and what stops the rollout automatically, because "we would watch it" is not a mechanism.',
      '**Blue-green** runs two full environments and switches traffic between them. Rollback is instant, which is its selling point. It costs double the infrastructure during the switch, and it does not solve the database, which is shared between both and cannot be switched back.',
      'That last point is the important one: **rollback is easy for code and hard for data.** Once a migration has changed a schema or rewritten rows, going back is not a matter of redeploying. Which is why the safe pattern is **expand and contract**, and why it is worth being able to recite. Add the new column without touching the old one. Deploy code that writes both and reads the old. Backfill the existing rows in batches. Deploy code that reads the new column, and verify. Only then, in a later release, drop the old column. Five steps, several days, and at every point you can stop and go back.',
      'Some specifics that make migrations survivable. **Backfill in batches with a pause between them**, because one enormous update locks a table and takes the site down. **Adding a column with a default** rewrites the table on some database versions — know whether yours does. **Adding an index** should be done without blocking writes, which most databases support with an explicit option people forget to use. And a migration should be **separate from the deploy that uses it**, so a slow migration does not hold up a release, and a rollback of the code does not require a rollback of the schema.',
      '**Feature flags** separate deploying from releasing, which is really powerful: the code ships dark, is enabled for staff, then a percentage, then everyone, and switching it off does not need a deploy. Two disciplines keep them from becoming the problem. Flags need an owner and a removal date, or you accumulate hundreds and no combination is tested. And a flag that changes data shape is not a safe flag — turning it off later leaves rows written in the new shape.',
      'Finally, **the rollback decision should be automatic and boring**. Define, in advance, the error rate or latency that stops a rollout, and wire it up. An incident where someone has to decide whether to roll back, while being asked for updates, is an incident that lasts twice as long.',
    ],
    followUp: {
      q: '"You need to rename a column on a table with two billion rows, with no downtime. How?"',
      answer:
        'Never as a rename, because a rename breaks every running instance of the old code the moment it lands, and during any rolling deploy old and new code are live at the same time. So it is expand and contract, over several releases. First, add the new column, nullable, with no default so the table is not rewritten. That is deployable on its own and changes nothing. Second, deploy code that writes both columns and still reads the old one — now every new row is correct, and the old code that is still running is unaffected. Third, backfill the existing rows in batches, a few thousand at a time with a pause between them, so I never hold a long lock or saturate replication; this is a background job I can stop and resume, and I track progress. Fourth, once the backfill is complete and verified — I would compare counts and spot-check rows rather than assume — deploy code that reads the new column. At this point I can still roll back, because the old column is still being written. Fifth, in a later release, stop writing the old column, and finally drop it. The costs I would name: one logical change became five deploys over several days, the table carries duplicate data in the middle, and there is a window where a bug in the dual-write path silently corrupts the new column — so I would add a check comparing the two columns during the backfill, and drop the old column only when that has been clean for a while.',
    },
    selfCheck: {
      q: 'Redundancy protects you from a machine dying. What does it not protect you from, and what does instead?',
      answer:
        'It does not protect you from a change you made on purpose. A bad deploy or a bad config value goes to every machine, so having ten of them means ten machines running the same bug at the same moment — redundancy has bought you nothing, and since most real outages come from changes rather than hardware, it is not protecting you from the common case at all. What protects you is making bad changes cheap: a canary so a bad release reaches 1% of traffic instead of everyone, automatic rollback wired to an error rate threshold so nobody has to decide under pressure, backwards-compatible migrations so the code can go back without the data being stuck, and feature flags so a risky path can be turned off without a deploy. Those are also the things people skip in a design interview, which is why mentioning them is a strong signal — it says you have operated something, not just drawn it.',
    },
    traps: [
      'Promising four nines and never mentioning how you deploy.',
      'A migration that renames or drops in the same release that stops using the column.',
      'Backfilling two billion rows in one statement.',
      'Feature flags with no owner and no removal date.',
      'A rollback plan that depends on a human noticing and deciding.',
    ],
    sayThis:
      '"Rolling deploys with connection draining, and a canary at 1% comparing error rate and p99 against the current version, with an automatic stop. Schema changes are expand-and-contract across separate releases, backfilled in batches, so code can roll back without the data being stuck. Cost: a rename takes three deploys and several days instead of one."',
    related: ['load-balancing', 'observability', 'availability-patterns', 'backups-and-recovery'],
  },

  {
    slug: 'backups-and-recovery',
    title: 'Backups, disaster recovery, RPO and RTO',
    navTitle: 'Backups and DR',
    tier: 3,
    oneLine: 'Two numbers: how much data you can lose, and how long you can be gone.',
    problem: [
      'Replication is not a backup. A replica faithfully copies your mistakes — a bad migration, a wrong DELETE, a bug that corrupts rows — to every copy, instantly. Backups exist for the failures replication makes worse, not better.',
      'And the question that actually matters is not "do you have backups". It is "have you restored one", because an untested backup is a belief, not a plan.',
    ],
    cost: 'Backups cost storage, and the good ones cost more: frequent snapshots plus continuous log archiving is not cheap at scale. Restoring is slow — a multi-terabyte restore is measured in hours — and that time is your outage. Encrypted backups need key management that survives losing the primary system. And testing restores properly costs real engineering time on something that produces no features.',
    useWhen: [
      'Any data whose loss would be a serious event. Which is most of it.',
      'Whenever you are asked what happens if something is deleted or corrupted rather than merely down.',
      'Before promising an availability number — recovery time is part of it.',
    ],
    avoidWhen: [
      'Data you can rebuild from a source of truth: caches, search indexes, derived aggregates. Back up the recipe, not the result.',
      'Do not treat replicas or snapshots-only as a backup strategy. Neither survives a logical error.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'The two numbers that define your plan. Everything else is implementation.',
        items: [
          { label: 'RPO — how much data you accept losing', value: 5, display: 'e.g. 5 minutes of writes', tone: 'accent' },
          { label: 'RTO — how long you accept being down', value: 120, display: 'e.g. 2 hours to restore', tone: 'muted' },
        ],
        note: 'RPO is set by how often you capture. RPO of five minutes needs continuous log shipping, not a nightly snapshot. RTO is set by how fast you can restore and cut over — and it is almost always longer than people guess, because nobody has timed it.',
      },
    },
    body: [
      'Get the two words right, because interviewers use them. **RPO — recovery point objective** is how much data you are willing to lose, measured in time. A nightly backup means an RPO of up to 24 hours. **RTO — recovery time objective** is how long you are willing to be down while you recover. They are separate decisions with separate costs, and both should come from the business rather than from you.',
      '**What replication does and does not cover.** Replication protects against a machine or a datacenter failing. It does not protect against anything logical, because a replica applies whatever the primary did, faithfully and immediately. A DELETE without a WHERE clause reaches every replica in milliseconds. So the failures backups exist for are: someone ran the wrong statement, a deploy corrupted data, a bug wrote nonsense for six hours before anyone noticed, or an attacker deleted things on purpose.',
      'That last case is why **backups must be isolated**. If the credentials that run your application can also delete your backups, then a compromise takes both. Backups belong in a separate account or project, ideally write-once for a retention period, and the restore path should not depend on the system that is down.',
      '**The layers, in increasing cost.** Snapshots are a point-in-time copy — cheap, easy, and your RPO is the snapshot interval. Continuous log archiving ships the write-ahead log to storage as it is produced, which enables **point-in-time recovery**: restore last night\'s snapshot, then replay the log up to 14:32, one minute before the bad statement. That combination is what gets an RPO down to minutes, and it is the answer to "someone dropped a table at half past two".',
      '**Retention has a shape, not a single number.** Frequent recent backups, thinning out with age: hourly for a day, daily for a month, monthly for a year. The reason to keep old ones is the failure that is discovered late — corruption that started six weeks ago and nobody noticed, which every recent backup faithfully contains.',
      '**Testing is the whole thing.** A backup that has never been restored is unverified. The test has to be a real restore into a real environment, timed, because the timing is your RTO and it is always worse than the estimate. Restore regularly and automatically, verify row counts and spot-check content, and record how long it took. Saying "we restore to staging weekly and that is how I know the RTO is 90 minutes" is dramatically stronger than any backup schedule.',
      'Two more that come up. **Deletes should be soft first** for anything a user can trigger — mark it deleted, purge it later — so an accidental deletion is a database update rather than a restore. And **derived data does not need backing up**: a search index, a cache, an aggregate table can all be rebuilt from the source, so back up the source and make sure the rebuild path is something you have actually run.',
    ],
    followUp: {
      q: '"At 2:30pm someone runs a DELETE without a WHERE clause on your main table. What happens?"',
      answer:
        'Replication does not help me at all here — every replica has already applied it, within milliseconds, faithfully. So this is a backup question, and specifically a point-in-time recovery question. What I want is last night\'s snapshot plus the write-ahead log archived continuously since then, so I can restore to 14:29 and lose one minute of writes rather than a day. The part that decides whether this is a bad afternoon or a catastrophe is what I do next, and it is not restoring straight over production: I restore into a separate instance, verify the data looks right, and then decide how to bring it back — usually by copying the affected table across rather than swapping the whole database, because everything else that happened between 14:30 and now is real work I do not want to throw away. That reconciliation is the really hard part and it is where the time goes. I would also say the honest numbers: a multi-terabyte restore takes hours, so my RTO here is hours, not minutes, and if the business needs better than that the answer is not a better backup, it is preventing the event — production access through tooling rather than a direct console, statements requiring a WHERE clause, soft deletes so this is an UPDATE I can undo, and permissions that make a full-table delete something most people cannot do at all.',
    },
    selfCheck: {
      q: 'You have three replicas across two regions. Why do you still need backups? Give a specific failure.',
      answer:
        'Because replicas copy correctness and incorrectness equally. A specific failure: a deploy ships a bug that writes an empty string into a field for six hours before anyone notices. All three replicas contain exactly the same corrupted rows, because they faithfully applied every write the primary made. There is nothing to fail over to — every copy is wrong in the same way. The same applies to a mistaken DELETE, a bad migration, or an attacker with valid credentials. Replication is a solution to machines failing, and this class of failure is logical rather than physical, so replication actively propagates it. What you need is a copy of the data from before the mistake, kept somewhere the running system cannot alter, plus the archived write-ahead log so you can restore to a moment rather than to last midnight. And you need to have practised the restore, because discovering that it takes six hours during the incident is a very expensive way to learn your RTO.',
    },
    traps: [
      'Calling replication a backup. It replicates the mistake too.',
      'Backups reachable with the same credentials as the application.',
      'Never having run a restore, so the RTO is a guess.',
      'A nightly snapshot with no log archiving, then claiming an RPO of minutes.',
    ],
    sayThis:
      '"Nightly snapshots plus continuous log archiving, so point-in-time recovery gives an RPO of about five minutes. Backups live in a separate account the application cannot reach. We restore to a scratch environment weekly and time it, which is how I know the RTO is around 90 minutes — and user-facing deletes are soft, so the common case is an update rather than a restore."',
    related: ['replication', 'write-ahead-log', 'deploys-and-releases', 'availability-patterns'],
  },

  {
    slug: 'capacity-and-cost',
    title: 'Capacity planning and cost',
    tier: 3,
    oneLine: 'What the design costs per month, and which line of the bill you would attack first.',
    problem: [
      'Every design decision is also a spending decision, and interviewers at some companies ask about it directly. "How much does this cost to run?" is a question a lot of otherwise strong candidates cannot begin to answer.',
      'You are not expected to quote a price list. You are expected to know the shape: which component dominates, what drives it, and what you would change if the answer came back too high.',
    ],
    cost: 'Optimising for cost costs you something else, always. Cheaper storage tiers are slower to read. Fewer machines means less headroom for a spike. Reserved capacity is cheaper and locks you in. Aggressive caching cuts database cost and adds staleness. The point is not to be cheap, it is to know what you are buying.',
    useWhen: [
      'Whenever the numbers stage produces a big storage or bandwidth figure — say what it costs.',
      'When choosing between two designs that both work. Cost is a legitimate tiebreaker and a strong one.',
      'Any question about video, images, logs or analytics, where storage and egress dominate.',
    ],
    avoidWhen: [
      'Do not quote precise prices you are not sure of. Orders of magnitude and ratios are what matter.',
      'Do not optimise cost before the design works. A cheaper broken system is still broken.',
    ],
    visual: {
      type: 'numbers',
      numbers: {
        caption: 'Rough order-of-magnitude monthly costs, to reason with rather than to quote. The ratios are the point.',
        items: [
          { label: 'Object storage, cold tier', value: 1, display: '~$1 per TB per month', tone: 'muted' },
          { label: 'Object storage, hot tier', value: 23, display: '~$23 per TB per month', tone: 'muted' },
          { label: 'Block storage (database disk)', value: 100, display: '~$100 per TB per month', tone: 'accent' },
          { label: 'Bandwidth out to the internet', value: 90, display: '~$90 per TB transferred', tone: 'bad' },
        ],
        note: 'Storing a terabyte is cheap. Serving it repeatedly is not — which is why a CDN is a cost decision at least as much as a latency one. Cross-region transfer is a separate line people forget entirely.',
      },
    },
    body: [
      'The method is the same back-of-envelope you already do, with one more step. You already estimated requests per second, storage per year and bandwidth. Now attach a rough price to each and see which one dominates. It is almost never evenly spread — one line is usually 60 to 80% of the bill, and that line is the only one worth optimising.',
      '**The usual suspects, in the order they usually bite.** Bandwidth out to users, for anything media-heavy, which is why a CDN pays for itself. Storage, when you keep raw data forever because nobody decided a retention policy. Compute, which people assume is the big one and often is not. Managed services, which are excellent value until a per-request price meets a high-volume path. And the two nobody counts: cross-region transfer, and observability — logs and metrics can really cost more than the service that emits them.',
      '**Capacity planning** is the same arithmetic pointed at machines instead of money. Take peak requests per second, divide by what one instance handles, and then do not stop there: add headroom for a spike, and add enough that losing an availability zone or a region does not leave the survivors saturated. Two regions each running at 60% cannot absorb one failing. That is a capacity error, not an availability one, and it is a common real outage.',
      '**Autoscaling** is the standard answer and it deserves its caveats. It reacts, so it is always behind a sudden spike — a scale-up that takes three minutes does not help with a spike that arrives in thirty seconds. It scales the wrong thing if your bottleneck is the database, where adding application servers makes things worse. And it can scale you into a much larger bill during an incident or an attack, so it needs an upper bound. For predictable peaks, scaling on a schedule is simpler and works better.',
      '**The cost levers worth naming**, roughly in order of how much they usually move the number: cache more, so expensive backends are hit less; put a CDN in front of anything served repeatedly; set a retention policy and move old data to a colder tier; compress and choose a compact format for anything stored in bulk; batch small operations into larger ones where you are billed per request; and buy reserved or committed capacity for the baseline while leaving on-demand for the peak.',
      'One framing that lands well in an interview: **cost per unit of business value**. Cost per active user per month, per video minute served, per thousand API calls. A total is hard to judge; a unit cost tells you immediately whether the design is sane and whether it gets better or worse as you grow. If your cost per user rises with scale, something in the design is superlinear and that is worth finding.',
    ],
    followUp: {
      q: '"This design stores 500 TB of video and serves 10 PB a month. What does it cost, and what would you change?"',
      answer:
        'The shape matters more than the exact figure, so let me do it roughly. Storing 500 TB in a hot tier is order of ten thousand dollars a month, and dropping the raw originals to a cold tier after 30 days cuts that by most of it, because the originals are almost never read again — only the transcoded renditions are. That is real money for a policy change. But the storage is not the problem. Serving 10 petabytes a month at internet egress rates is order of a million dollars a month, so bandwidth is something like 99% of this bill and everything else is a rounding error. So there is only one thing worth optimising, and it is not storage. What I would change: put a CDN in front, which is the single biggest lever, because CDN egress is cheaper than origin egress and, more importantly, a 95% hit rate means the origin serves a twentieth of the traffic. Then negotiate committed volume, which at petabyte scale is a real discount rather than a rounding one. Then attack the bytes themselves: better codecs cut the same video by a third or more for the same perceived quality, and adaptive bitrate means people on small screens are not served the largest rendition. Each of those is a percentage off the dominant line, which is worth far more than anything I could do to compute or storage. The general point I would make is that I found the dominant line first and then only worked on that.',
    },
    selfCheck: {
      q: 'You run two regions, each sized at 70% of its own peak traffic. What breaks when one region fails, and what should the number have been?',
      answer:
        'The surviving region gets its own traffic plus all of the failed region\'s, so it needs to serve roughly double what it was handling. Sized at 70%, it is instantly at 140% of capacity, which means it saturates, latency climbs vertically, requests queue and it falls over too — so a single region failure becomes a total outage, which is precisely the thing multi-region was supposed to prevent. For two regions to really survive one failing, each has to run at or below 50% of its own capacity in normal times, which feels wasteful and is the actual price of that availability. With three regions it is much better: each carries a third normally and half after a failure, so around 65% utilisation is safe. That is one of the real arguments for three regions over two, and it is a capacity decision rather than an availability one — the redundancy on the diagram was never the thing that mattered.',
    },
    traps: [
      'Designing at scale and never mentioning what it costs.',
      'Optimising a line that is 3% of the bill while ignoring the one that is 80%.',
      'Autoscaling with no upper bound, so an attack becomes a bill.',
      'Sizing regions so that the survivors cannot absorb a failure.',
      'Forgetting egress and cross-region transfer entirely.',
    ],
    sayThis:
      '"Bandwidth dominates this bill by an order of magnitude, so the CDN is a cost decision before it is a latency one — a 95% hit rate takes the origin down to a twentieth of the traffic. Raw uploads move to cold storage after 30 days. Each region is sized to absorb another one failing, which is why utilisation looks low. I would track cost per video minute served rather than the total."',
    related: ['back-of-envelope', 'cdn', 'object-storage', 'multi-region'],
  },

  {
    slug: 'batch-vs-stream',
    title: 'Batch and stream processing',
    navTitle: 'Batch and stream',
    tier: 3,
    oneLine: 'Enormous volume in, aggregates out, and nobody waiting for any single event.',
    problem: [
      'Some systems are not request-response at all. Billions of events arrive, and what people want is a number: clicks per ad per hour, revenue per region per day, active users this week.',
      'You can compute those continuously as events arrive, or in large scheduled runs over stored data. Those two answers have different costs, different failure modes and different accuracy, and choosing without saying why is the mistake.',
    ],
    cost: 'Streaming buys freshness and pays with complexity: late and out-of-order events, state you must keep in the middle of a running job, and a much harder story when you need to fix a bug in yesterday\'s numbers. Batch buys simplicity and correctness and pays in latency — results are hours old — plus the cost of reprocessing everything each run. Running both, to get freshness and correctness, means writing the same logic twice and keeping the two agreeing.',
    useWhen: [
      'Stream: dashboards, fraud signals, live counters, anything where minutes-old is too old.',
      'Batch: billing, reporting, model training, anything that must be exactly right and can wait.',
      'Both: when a fast approximate number is shown immediately and corrected later by a definitive run.',
    ],
    avoidWhen: [
      'Do not build a streaming pipeline for a number someone looks at once a day. A scheduled query is enormously simpler.',
      'Do not build this like a request path. It has hours of slack and the whole design should spend it.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The same aggregate, computed two ways. The difference is when you pay and how right you are.',
        a: {
          title: 'Batch',
          points: [
            'Runs on a schedule over data already stored. Reads everything it needs.',
            'Simple to reason about, easy to test, easily re-runnable when logic changes.',
            'Late-arriving events are just included in the next run. No special handling.',
            'Results are hours old, and a run over a huge dataset is expensive each time.',
            'Right for: billing, reporting, anything definitive.',
          ],
        },
        b: {
          title: 'Stream',
          points: [
            'Processes each event as it arrives, updating aggregates continuously.',
            'Results are seconds old, which is the entire reason to do it.',
            'You must handle events arriving late and out of order, explicitly.',
            'The job holds state, so a restart has to resume rather than start over.',
            'Right for: live dashboards, anomaly detection, anything acted on quickly.',
          ],
        },
        verdict:
          'Start with batch unless someone can name what they will do differently with a fresher number. If they can, stream the approximate answer for immediacy and let a daily batch run produce the number of record — and be explicit that the two can briefly disagree.',
      },
    },
    body: [
      '**Windows** are the core idea in streaming, because an unbounded stream has no natural end to aggregate over. A *tumbling* window is fixed and non-overlapping — every hour, on the hour. A *sliding* window overlaps — the last hour, recomputed every minute. A *session* window groups events by activity with a gap between them, which is how you measure a user\'s visit. Say which one you are using; "count per hour" is a tumbling window and "trending in the last hour" is a sliding one, and they cost very different amounts.',
      '**Event time versus processing time** is the distinction that everything else depends on. An event happened at 13:59 on someone\'s phone and reaches you at 14:03, because they were in a tunnel. Do you count it in the 13:00 hour or the 14:00 hour? Processing time is easy and wrong for anything users will check against their own records. Event time is right and forces you to answer the next question: how long do you wait for stragglers?',
      'That answer is the **watermark** — a declaration that you believe you have seen everything up to a point in event time, so the window can be closed and emitted. Set it too tight and you drop real events; too loose and every result is delayed by the allowance. Then decide what to do with anything that arrives after the watermark: drop it and count how often that happens, send it to a side output for inspection, or re-emit a corrected aggregate. Having an answer here is what separates someone who has built this from someone describing it.',
      '**Exactly-once, honestly.** The stream framework can often give you exactly-once *within* the pipeline, by checkpointing its state and its input positions together. What it cannot do is make an external side effect happen exactly once. So the rule is the same as everywhere: at-least-once delivery plus writes that are safe to repeat. Aggregate into a store where writing the same window result twice is harmless — keyed by window and idempotent — and the problem disappears.',
      '**Reprocessing is a design requirement, not an incident response.** Logic will be wrong at some point, and you will need to recompute the last month with the fix. That means the raw events have to be kept, cheaply, in object storage, and the pipeline must be able to run over the archive as well as the live stream. Designing this in from the start is the difference between a bug being a re-run and a bug being permanent.',
      'On architecture names, be brief and useful. The **lambda architecture** runs a batch layer and a streaming layer in parallel and merges them, which works and means writing the logic twice. The **kappa architecture** runs only the stream and handles corrections by replaying it, which is simpler if your log retention lets you. Naming them is fine; explaining the trade — duplicate logic against dependence on replay — is what actually scores.',
      'Finally, **pre-aggregate early**. Counting a billion raw events at query time is hopeless. Roll up as the data flows — per minute, then per hour, then per day — so a dashboard reads a few hundred rows instead of a few billion. And decide where approximation is acceptable, because HyperLogLog for distinct counts and a sketch for top-N turn impossible queries into cheap ones.',
    ],
    followUp: {
      q: '"Your hourly click counts are wrong for last Tuesday. What do you do?"',
      answer:
        'The first question is whether they are wrong because of late data or because of a logic bug, since the fixes are different. If it is late data, the numbers were computed before some events arrived, so the pipeline needs to have kept those events and re-emitted the corrected windows — and if it dropped them past the watermark, I need the count of how many, because a small percentage may be acceptable and a large one means the watermark is set wrong. If it is a logic bug, the fix is a reprocessing run, and whether that is possible depends on a decision made long before this incident: are the raw events still there? That is why I would always land raw events in cheap object storage as well as feeding them to the stream. Then reprocessing is running the corrected job over Tuesday\'s archive, writing to a separate output, comparing the two, and swapping. Two details make that survivable. The aggregates have to be keyed by window and safe to overwrite, so re-running produces the same result rather than adding to it. And anything downstream that already consumed the wrong numbers — a billing run, an email — needs its own correction path, which is usually the really expensive part. Cost: keeping raw events costs storage forever, and I would put a retention and tiering policy on it rather than keeping everything hot.',
    },
    selfCheck: {
      q: 'An event happens at 13:59 but arrives at 14:03. Which hour does it count in, and what does your answer cost you?',
      answer:
        'It should count in the 13:00 hour, because that is when it actually happened, and any user checking against their own records is thinking in event time. Counting it at 14:03 — processing time — is easier, needs no waiting and no extra state, and produces numbers that are quietly wrong in a way people will eventually notice, especially for mobile clients that batch uploads or go offline. The cost of doing it properly is that the 13:00 window cannot be closed at 14:00. You have to hold it open for some grace period, which delays every result by that allowance, and you have to keep the window state in the job for longer, which is memory. Then you still need a decision for anything arriving after the grace period: drop it and monitor how often, or emit a corrected value and make sure everything downstream can handle a number changing after it was published. There is no option where you get correct event-time aggregation with no delay and no state — that trade is the whole of stream processing.',
    },
    traps: [
      'Building a streaming pipeline for a number nobody acts on quickly.',
      'Aggregating by processing time and calling it hourly counts.',
      'No answer for late events beyond the watermark.',
      'Not keeping the raw events, so a logic bug can never be corrected.',
      'Claiming exactly-once without idempotent writes at the output.',
    ],
    sayThis:
      '"Events land in object storage raw and also feed a stream that aggregates into tumbling hourly windows by event time, with a five minute watermark and late events sent to a side output. Aggregates are keyed by window so a re-run overwrites rather than double-counts. Cost: results are five minutes behind rather than instant, and I keep raw events forever so a logic fix is a re-run rather than a permanent hole."',
    related: ['message-queues', 'distributed-counter', 'object-storage', 'change-data-capture'],
  },
]
