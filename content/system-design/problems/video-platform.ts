import type { Problem } from '@/lib/types'

export const VIDEO_PLATFORM: Problem = {
  slug: 'video-platform',
  title: 'Video upload and playback',
  navTitle: 'Video platform',
  group: 'big-files',
  difficulty: 'hard',
  concepts: [
    'cdn',
    'message-queues',
    'idempotency',
    'caching',
    'change-data-capture',
    'object-storage',
    'capacity-and-cost',
    'batch-vs-stream',
  ],
  prompt:
    'Design a service where people upload videos and other people watch them. Uploads come from phones on unreliable networks. Playback should start quickly and adapt to the viewer\'s connection.',

  slack: {
    budget: 'Processing: minutes. Playback start: under 2 seconds. Upload: hours if needed.',
    headline: 'Uploading and processing have enormous slack. Starting playback has almost none. Designing both the same way is how this problem gets failed.',
    body: [
      'Uploads have hours of slack. Nobody expects a video to be watchable the instant the progress bar completes — every product in this space shows "processing" and everybody accepts it. That is an enormous gift, and it is what makes the whole design tractable: transcoding into five resolutions is expensive, parallelisable, and completely off the user\'s critical path. You can retry it, queue it behind other work, and run it on cheap interruptible capacity.',
      'Playback start has a hard budget of about two seconds. Past that, viewers leave, and this is one of the few places in the app where the number is really measured and well known in the industry. Every design decision on the read path is aimed at that budget: content near the viewer, small first segments, a low starting bitrate that steps up.',
      'Mid-playback has a different budget again — the player has a buffer, typically 10 to 30 seconds, which is real slack it can spend fetching the next segments and adapting quality. That buffer is why adaptive streaming works at all.',
      'The asymmetry is the design. One system optimised for throughput and cost with hours to play with; another optimised for latency with two seconds. They share only a storage bucket.',
    ],
    consequence:
      'Hours of processing slack means transcoding is fully asynchronous, retryable, and can run on interruptible capacity. A two-second playback budget means segments must be static files on a CDN — which is exactly why video is chopped into segments in the first place.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that change a box, and propose the scope.',
      nudges: [
        'What is the single most important thing to say about where the bytes travel?',
        'Is playback public or access-controlled? That changes caching completely.',
        'Live or on-demand? Do not assume silently.',
      ],
      model: [
        'Assumptions: global audience, mobile-first for both upload and playback. Videos average a few minutes. Reads massively outnumber writes — one upload is watched many times, which is the ratio the whole design rests on. Storage is effectively unbounded and object storage is available.',
        'First question, and it changes the caching design entirely: is content public, or is it access-controlled per viewer? Because public content can be cached at the edge and served to everyone identically, while per-viewer authorisation means either signed URLs with short expiries or authorisation at the edge — and getting that wrong means one person\'s private video cached and served to a stranger. I will assume public with some private videos, handled by signed URLs.',
        'Second question: on-demand only, or live streaming too? These are really different systems — live has no processing slack at all, needs low-latency segment production, and cannot pre-transcode. I will assume on-demand, and say I am consciously excluding live because it would change the pipeline fundamentally.',
        'Scope: upload from an unreliable network, transcode to several qualities, and adaptive playback. Out of scope: recommendations, comments, monetisation, and copyright matching — though I would note the last one is a real production requirement that sits in the processing pipeline.',
      ],
      checklist: [
        'Stated the read:write ratio — one upload, many views',
        'Asked public versus access-controlled and named the edge-caching consequence',
        'Asked on-demand versus live and explained they are different systems',
        'Assumed mobile and unreliable networks for upload',
        'Proposed a scope and excluded recommendations and monetisation',
      ],
      tradeoffs: [
        {
          decision: 'Signed URLs for private content',
          cost: 'Short expiries mean the player must refresh them mid-playback for long videos, and a leaked URL is valid until it expires.',
        },
      ],
      sayThis:
        '"Assuming on-demand, mobile-first, global, and one upload watched many times. One question — is content public or per-viewer authorised? That decides whether I can cache segments at the edge for everyone or need signed URLs, and getting it wrong leaks private video. I will assume mostly public with signed URLs for private."',
      trap: 'Not asking about live streaming and then designing an on-demand pipeline. If the interviewer wanted live, you have designed the wrong system and spent twenty minutes on it.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write a video\'s life as a chain of states, and add the failure branches.',
      nudges: [
        'Phones on trains lose connections. What does that do to a 500 MB upload?',
        'Transcoding takes minutes and can fail. Then what?',
        'What does the uploader see between upload and watchable?',
      ],
      model: [
        'Actors: the uploader, the viewer, and the system — which decides which resolutions to produce, in what order, when a video is watchable, what to do with a file it cannot decode, and when to give up retrying.',
        'The chain: upload started → bytes stored → queued for processing → transcoded into renditions → published and playable → viewed → possibly taken down.',
        'Failure branches. At upload: the connection drops at 80% — with a single request that is 400 MB thrown away and a furious user, so uploads must be chunked and resumable, which is a requirement rather than an optimisation given the mobile assumption. At upload: the same chunk is sent twice after a retry — chunks are addressed by index so a repeat simply overwrites, which makes the upload naturally idempotent. At stored: the processing message is lost, so the video sits forever showing "processing" and nobody is alerted — this needs the event written durably alongside the upload record and a sweeper that finds videos stuck in a state too long. That stuck-state sweeper is the branch people forget and it is the one that generates support tickets.',
        'At transcoding: the worker crashes halfway through — the job retries, and because output is written per rendition to a deterministic path, a retry simply redoes work rather than corrupting anything. At transcoding: the file is actually broken or in an unsupported format — this is not retryable, so it must be distinguished from a transient failure and moved to a failed state with a real message to the uploader, rather than retried forever.',
        'At published: some renditions succeeded and others did not. The good decision is to publish as soon as one usable rendition exists and add the others as they finish, so the video becomes watchable in less time. At viewed: a segment is missing from the origin because of a partial publish, so the player stalls — publish atomically by writing the manifest last, since the manifest is what makes segments discoverable.',
        'At taken down: the video is cached at hundreds of edge locations, so removal is a purge with a real propagation delay, which matters for legal takedowns and is worth naming.',
      ],
      checklist: [
        'Named the system as an actor with real decisions',
        'Wrote the video lifecycle as a chain',
        'Chunked, resumable uploads justified by dropped connections',
        'Chunk uploads idempotent by index',
        'Handled the lost processing event, including a stuck-state sweeper',
        'Distinguished retryable failures from permanently broken files',
        'Publish when the first usable rendition is ready, not all of them',
        'Manifest written last so publishing is effectively atomic',
        'Noted takedown propagation delay at the edge',
      ],
      trap: 'A lifecycle that goes upload → transcode → play. The interesting states are "stuck in processing forever" and "three renditions worked and two did not", and both happen constantly in production.',
    },

    {
      id: 3,
      ask: 'Estimate ingest volume, storage, and — the number that matters most here — egress bandwidth. Then finish "So the hard part here is ___."',
      nudges: [
        'Storage is cheap and easy to estimate. Do not stop there.',
        'What does transcoding multiply your storage by?',
        'Compare the cost of storing a video with the cost of serving it.',
      ],
      model: [
        'Ingest: assume 500 hours uploaded per minute. At roughly 1 GB per hour for source quality, that is 500 GB a minute, about 8 GB per second arriving. Meaningful, but it goes straight into object storage and never through my application servers, so it is not a compute problem.',
        'Storage: 500 hours a minute is 720,000 hours a day, about 720 TB a day of source. Transcoding into five renditions roughly doubles to triples the total, so call it 2 PB a day. That is a lot, and it is also just money — object storage is cheap, and old, rarely-watched content moves to colder tiers.',
        'Now egress, which is the number that changes my mind. Assume 100 million viewing hours a day. At 3 Mbps average that is about 1,350 GB per second sustained, an order of magnitude more than ingest and continuous. If that traffic came from my origin servers, bandwidth would be by far the largest line item in the entire system — larger than storage, larger than compute, larger than everything.',
        'Transcoding compute: 500 hours a minute, and transcoding roughly real-time per rendition per core, so five renditions is 2,500 core-hours per minute of upload — thousands of cores running continuously. Significant, and entirely elastic because of the processing slack.',
        'So the hard part here is egress bandwidth, and the answer is that almost none of it may come from my origin. Everything else — storage, ingest, even the transcode fleet — is a smaller problem. This is the estimate that tells you the CDN is not an optimisation in this design, it is the product.',
      ],
      checklist: [
        'Estimated ingest and noted it bypasses application servers',
        'Estimated storage including the rendition multiplier',
        'Estimated egress and compared it to ingest — the key comparison',
        'Estimated transcoding compute and noted it is elastic',
        'Concluded egress dominates and the CDN is structural, not an add-on',
        'Finished the sentence',
      ],
      sayThis:
        '"Ingest is about 8 GB a second; egress is around 1,350 GB a second — a hundred and seventy times larger and continuous. So the hard part here is egress bandwidth. That single ratio means almost nothing may be served from my origin, and it is why video gets chopped into static segments in the first place."',
      trap: 'Estimating storage, saying "petabytes", and stopping. Storage is the cheap part. Egress is where the money and the engineering go, and skipping it means missing what the problem is about.',
    },

    {
      id: 4,
      ask: 'Draw the design. Justify each box, and be specific about how playback actually works.',
      nudges: [
        'Where do the bytes go on upload? Not through your servers, hopefully.',
        'What is a "segment" and why does it exist?',
        'How does the player decide which quality to fetch?',
      ],
      model: [
        'Upload path: the client asks the API for a presigned upload URL, then uploads chunks directly to object storage. The bytes never pass through my application servers — justified by the 8 GB per second ingest figure, since routing that through my services would mean building a bandwidth tier for no benefit. The API only records metadata and, when the upload completes, writes an upload record and a processing event in the same transaction so the event cannot be lost.',
        'Processing: workers pull from a queue and transcode into renditions — say 240p through 1080p — chopping each into segments of a few seconds and writing an adaptive streaming manifest. Justified by the slack analysis: hours available, so this is asynchronous, retryable and can run on interruptible capacity at a fraction of the cost. Workers are idempotent by writing to deterministic paths per rendition.',
        'Why segments, which is the part worth explaining properly: chopping video into short chunks turns playback into a series of ordinary static file requests. Every one of those is cacheable at the edge, resumable, and independently chooseable — which is what makes both CDN delivery and adaptive quality possible. It is the single decision the whole read path rests on.',
        'Playback: the player fetches the manifest, then requests segments from the CDN. It starts at a low bitrate so playback begins fast, measures how quickly segments arrive, and steps up or down per segment. Justified by the two-second start budget and the fact that a mobile connection changes constantly.',
        'Delivery: segments are static immutable files with long cache lifetimes and content-addressed paths, so the CDN hit rate is extremely high and purging is almost never needed. Justified by the egress number — the CDN is what makes this system affordable at all, and a high hit rate is the difference between a viable business and an impossible one.',
        'Metadata: a normal database holding video records, owner, status, and rendition list. Small, ordinary, and completely separate from the media path — it is worth saying that the interesting scale is entirely in the bytes, not in the metadata.',
        'Access control for private videos: signed URLs with short expiries, issued by the API after an authorisation check. The CDN validates the signature, so the origin is not consulted per segment. Cost: the player must refresh signatures during long videos.',
      ],
      checklist: [
        'Upload goes directly to object storage via presigned URLs, bypassing app servers',
        'Justified that with the ingest number',
        'Processing is asynchronous, queued, idempotent, and on interruptible capacity',
        'Explained why video is segmented, and connected it to caching and adaptivity',
        'Adaptive bitrate driven by measured throughput, starting low for fast start',
        'Segments are immutable with long TTLs — near-perfect CDN hit rate',
        'Metadata kept separate and acknowledged as the easy part',
        'Access control via signed URLs validated at the edge',
      ],
      tradeoffs: [
        {
          decision: 'Direct-to-storage upload',
          cost: 'Less control over the byte stream — validation and virus scanning happen after the fact rather than inline. Unavoidable at this volume.',
        },
        {
          decision: 'Five renditions per video',
          cost: 'Triples storage and multiplies transcode cost fivefold. Worth it because it is what allows a viewer on a bad connection to watch at all, and the alternative is them leaving.',
        },
        {
          decision: 'Interruptible capacity for transcoding',
          cost: 'Jobs get killed and must resume, so processing time is less predictable. Acceptable given hours of slack, and it is a large cost saving.',
        },
      ],
      trap: 'Drawing the upload passing through your application servers. At 8 GB per second you have just made yourself a bandwidth company for no reason. Presigned direct upload is the answer and the interviewer is waiting for it.',
    },

    {
      id: 5,
      ask: 'Go deep on the two hardest parts. Name a cost after every decision.',
      nudges: [
        'The numbers said egress. What actually drives the cache hit rate?',
        'A video goes viral in one country. What happens?',
        'How do you make a phone on a train succeed at a 500 MB upload?',
      ],
      model: [
        'Hard part one: keeping origin egress near zero, which means the cache hit rate is the number that matters. Popular videos are easily cached — a viral video is watched by millions and its segments are hot everywhere, so the hit rate approaches 100%. The problem is the long tail: an enormous number of videos watched a handful of times each. Those get evicted between views, so they miss, and while they are a small share of views they can be a large share of origin traffic. Mitigations: tiered caching, where edge misses go to a regional cache rather than straight to origin, which collapses many edge misses into one origin fetch; and keeping only the first few segments of unpopular videos warm, since most abandoned views never get past the first thirty seconds. Cost: another caching layer to run, and more storage held at regional tier.',
        'The first segments are worth special treatment generally: everyone who plays a video fetches segment one, and far fewer reach segment fifty. Prioritise transcoding and warming the opening segments so playback starts fast even for cold content. Cost: a more complex pipeline that treats parts of one video differently.',
        'Regional popularity: a video going viral in one country makes that region\'s edges hot while others stay cold. This is handled naturally by the CDN pulling on demand, but the origin sees a burst as many edges fetch simultaneously. Request coalescing at the regional tier turns thousands of simultaneous edge misses into one origin read. Cost: a small added latency on the very first fetch.',
        'Hard part two: uploads from unreliable networks. Chunked and resumable, with chunks of a few megabytes so a failure loses seconds of progress rather than everything. The client asks which chunks the server already has and sends only the missing ones, which makes resuming after an app restart or a day later work properly. Chunks are addressed by index so a duplicate is an overwrite, making retries safe with no extra machinery. Cost: more complex client code and server state tracking partial uploads, plus a cleanup job for abandoned ones — which needs to exist, or partial uploads accumulate silently and cost real money.',
        'Processing cost control: transcode lazily for rare resolutions. Produce the common renditions immediately, and generate 4K only when someone actually asks for it. For most videos, which are watched a few times at 720p, that avoids the majority of transcode cost. Cost: the first viewer wanting a rare rendition waits, or gets a lower quality — acceptable, and a large saving.',
        'The stuck-video problem, revisited because it is the most common real failure: a video whose processing event was lost or whose job failed silently sits in "processing" forever. A sweeper looking for videos in a non-terminal state past a threshold, which retries or fails them explicitly, is the fix. Cost: a background job to run and monitor. Without it, the failure is invisible to you and highly visible to the user.',
        'Consistency per feature: metadata is strongly consistent, since a user renaming their video should see it immediately. The published state is eventually consistent across regions and a few seconds of lag is fine. Segments are immutable, so consistency simply does not arise — which is one of the quiet benefits of content addressing. View counts are approximate and batched.',
        'What I would monitor: playback start time at p50 and p95, rebuffer rate, CDN hit ratio broken down by popularity tier, transcode queue age, and the count of videos stuck in processing.',
      ],
      checklist: [
        'Identified the long tail as the real cache challenge, not viral content',
        'Tiered caching with request coalescing to protect the origin',
        'Special-cased the first segments of a video',
        'Resumable chunked uploads with a query for missing chunks',
        'Cleanup job for abandoned partial uploads',
        'Lazy transcoding of rare renditions as a cost control',
        'Sweeper for videos stuck in processing',
        'Per-feature consistency answer',
        'Named what to monitor, including rebuffer rate and hit ratio by tier',
        'Cost named after every decision',
      ],
      tradeoffs: [
        {
          decision: 'Tiered caching',
          cost: 'An extra layer to operate and pay for, plus a little latency on first fetch. It is what keeps origin egress — the biggest cost in the system — near zero for the long tail.',
        },
        {
          decision: 'Lazy transcoding of rare renditions',
          cost: 'The first person wanting 4K waits or gets 1080p. Saves the majority of transcode spend, because most videos are never watched at high resolution.',
        },
        {
          decision: 'Chunked resumable uploads',
          cost: 'Real complexity in the client and partial-upload state on the server, plus a cleanup job. Non-negotiable when uploads come from phones on trains.',
        },
      ],
      sayThis:
        '"Segments are immutable and content-addressed with a one-year cache, so the CDN hit rate is near perfect for popular content and I never purge. The long tail is the real problem — rarely-watched videos get evicted between views — so edge misses go to a regional tier with request coalescing rather than to origin. Cost: another layer to run, and it is what keeps my largest bill near zero."',
      trap: 'Optimising for the viral video. That case is easy — it caches itself. The engineering is in the long tail of videos watched three times, which is where origin traffic actually comes from.',
    },
  ],

  lifecycle: {
    caption:
      'A video\'s life. "Stuck in processing forever" is the branch that generates the most support tickets and the one most often missing from a whiteboard.',
    states: [
      { id: 'up', label: 'Uploading', by: 'phone' },
      { id: 'stored', label: 'Stored', by: 'object storage' },
      { id: 'queued', label: 'Queued', by: 'system' },
      { id: 'trans', label: 'Transcoded', by: 'workers' },
      { id: 'pub', label: 'Published', by: 'system' },
    ],
    failures: [
      { after: 'up', label: 'Connection drops at 80%', handling: 'chunked and resumable — ask which chunks exist, send the rest' },
      { after: 'stored', label: 'Processing event lost', handling: 'event written in the same transaction; sweeper finds stuck videos' },
      { after: 'trans', label: 'Worker crashes mid-job', handling: 'retry; deterministic output paths make it idempotent' },
      { after: 'trans', label: 'File is unplayable', handling: 'not retryable — fail explicitly and tell the uploader why' },
      { after: 'trans', label: 'Only some renditions done', handling: 'publish on first usable rendition, add the rest as they land' },
      { after: 'pub', label: 'Takedown requested', handling: 'purge propagates across edges with real delay — say so' },
    ],
  },

  architecture: {
    caption:
      'Bytes never pass through the application servers. The upload path and the playback path share only a storage bucket.',
    nodes: [
      { id: 'up', label: 'Uploader', kind: 'client', col: 0, row: 0 },
      { id: 'api', label: 'API', sub: 'presigned URLs', kind: 'service', col: 1, row: 0 },
      { id: 'obj', label: 'Object storage', sub: 'source + segments', kind: 'store', col: 2, row: 0, span: 2 },
      { id: 'q', label: 'Transcode queue', kind: 'queue', col: 1, row: 1 },
      { id: 'w', label: 'Transcode workers', sub: 'interruptible', kind: 'service', col: 2, row: 1 },
      { id: 'md', label: 'Metadata DB', kind: 'store', col: 0, row: 1 },
      { id: 'cdn', label: 'CDN', sub: 'immutable segments', kind: 'cache', col: 3, row: 2 },
      { id: 'reg', label: 'Regional cache', sub: 'coalesces misses', kind: 'cache', col: 2, row: 2 },
      { id: 'v', label: 'Viewer', kind: 'client', col: 4, row: 2 },
    ],
    edges: [
      { from: 'up', to: 'api', label: 'get URL' },
      { from: 'up', to: 'obj', label: 'chunks, direct' },
      { from: 'api', to: 'md' },
      { from: 'api', to: 'q' },
      { from: 'q', to: 'w' },
      { from: 'w', to: 'obj' },
      { from: 'v', to: 'cdn' },
      { from: 'cdn', to: 'reg', label: 'miss', dashed: true },
      { from: 'reg', to: 'obj', label: 'miss', dashed: true },
    ],
  },

  numbers: {
    caption: 'The comparison that decides the design: what you serve dwarfs what you receive.',
    items: [
      { label: 'Ingest', value: 8, display: '~8 GB / sec', tone: 'muted' },
      { label: 'Egress to viewers', value: 1350, display: '~1,350 GB / sec', tone: 'bad' },
      { label: 'Storage added per day', value: 2000, display: '~2 PB / day (5 renditions)', tone: 'muted' },
    ],
    note: 'Egress is ~170x ingest and it never stops. So the hard part is bandwidth, and the answer is that almost none of it may come from your origin. That is why video is segmented into static files in the first place.',
  },

  flow: {
    scenario: 'queue-drain',
    caption: 'Transcoding: uploads arrive faster than workers finish. Hours of slack mean the queue absorbing this is fine — as long as you watch its age, not its length.',
  },

  compare: {
    caption: 'Where the upload bytes go. This is the first fork, and the wrong branch is expensive forever.',
    a: {
      title: 'Direct to object storage (presigned)',
      points: [
        'Bytes never touch your servers, so you never build a bandwidth tier.',
        'Storage handles resumption, parallel chunks and retries natively.',
        'Scales without you doing anything as upload volume grows.',
        'Validation and scanning happen after the fact, not inline.',
      ],
    },
    b: {
      title: 'Through your application servers',
      points: [
        'Full control — validate, scan and transform the stream as it arrives.',
        'Simpler client, one endpoint, no presigning dance.',
        'You now carry 8 GB/sec of ingest bandwidth and the servers to terminate it.',
        'Every upload holds a connection for minutes, which wrecks your capacity model.',
      ],
    },
    verdict:
      'Direct to storage, every time, once the payload is large. The control you give up is recoverable asynchronously; the bandwidth bill you take on is not. The same reasoning applies to any big-file problem — file storage, image hosting, backups.',
  },

  followUps: [
    'cost-monthly',
    'kill-cache',
    'scale-10x',
    'ops-debug-slow',
    'choice-queue',
    'kill-region',
    'scope-multiregion',
    'cost-cheaper-slower',
  ],
}
