import type { Concept } from '@/lib/types'

/**
 * Storage and API shapes that come up in almost every design but were missing
 * from the original Tier 1 set.
 *
 * House style: short sentences, everyday words, one idea per sentence.
 */
export const TIER1_STORAGE: Concept[] = [
  {
    slug: 'object-storage',
    title: 'Object storage and presigned uploads',
    navTitle: 'Object storage',
    tier: 1,
    oneLine: 'Big files do not belong in your database, and they should not pass through your servers either.',
    problem: [
      'A photo, a video, a PDF, a backup. These are far bigger than the row that describes them, and a database is the wrong place for them. Storing a 200 MB file as a database blob makes every backup, every replica and every restore enormously slower.',
      'Object storage — S3, GCS, Azure Blob — is built for exactly this. You put a file in under a key, you get it back by that key, and it is cheap, effectively unlimited, and durable without you doing anything.',
    ],
    cost: 'You now have two stores that can disagree. A row can point at a file that was never uploaded, or a file can sit there with no row pointing at it, costing you money forever. Object storage is also slow per operation compared to a database, it cannot answer questions like "all files bigger than 10 MB" without a separate index, and permissions become your problem: a public bucket is one of the most common real-world data leaks.',
    useWhen: [
      'Any user-uploaded file: images, video, documents, avatars.',
      'Anything you generate and hand back: exports, reports, invoices, backups.',
      'Static assets that a CDN will sit in front of.',
      'Big append-only data you rarely read: logs, archives, raw events.',
    ],
    avoidWhen: [
      'Small structured data you query by fields. That is a database.',
      'Anything needing a transaction with your other data. There is no transaction across a database and a bucket.',
      'Very frequent small updates. You cannot edit part of an object. You replace the whole thing.',
    ],
    visual: {
      type: 'diagram',
      diagram: {
        caption:
          'The file never touches your servers. Your service only signs a short-lived permission slip, and the browser uploads straight to storage.',
        nodes: [
          { id: 'c', label: 'Browser', kind: 'client', col: 0, row: 0 },
          { id: 's', label: 'Your service', sub: 'signs a URL', kind: 'service', col: 1, row: 0 },
          { id: 'o', label: 'Object storage', sub: 'takes the bytes', kind: 'store', col: 2, row: 0 },
          { id: 'db', label: 'Database', sub: 'row + status', kind: 'store', col: 1, row: 1 },
          { id: 'n', label: 'your bandwidth cost for a 2 GB upload: a few hundred bytes', kind: 'note', col: 2, row: 1, span: 2 },
        ],
        edges: [
          { from: 'c', to: 's', label: '1. may I upload?' },
          { from: 's', to: 'c', label: '2. signed URL', dashed: true },
          { from: 'c', to: 'o', label: '3. PUT the file' },
          { from: 'c', to: 's', label: '4. done' },
          { from: 's', to: 'db' },
        ],
      },
    },
    body: [
      'The single most important pattern here is the **presigned URL**, and it is the answer to any question with a large upload in it. Your service creates a URL that grants permission to write one specific key, for a few minutes, and hands it to the client. The client uploads straight to the storage service. Your servers never see the bytes.',
      'Say why that matters, because the reason is the interview answer. If a 2 GB upload goes through your application server, then that server is holding a connection for minutes, you are paying for the bandwidth twice, and you cannot scale uploads without scaling application servers. With a presigned URL, your involvement is a few hundred bytes of signing. Downloads work the same way in reverse, for private files.',
      '**Multipart upload** is the companion. A big file is cut into parts, each part is uploaded on its own and can be retried on its own, and the storage service reassembles them. Without it, a failure at 95% of a 5 GB upload means starting again. Parts can also be uploaded at the same time, which is the only way to actually use a fast connection.',
      'Now the consistency problem, because it is the follow-up. Your database row and your file are two separate writes with no transaction across them. The standard fix is a status field. Create the row as `pending` before handing out the URL. The client tells you when it is done, or the storage service fires an event, and you flip the row to `ready`. Anything still `pending` after an hour is an abandoned upload, and a cleanup job deletes both. Never show a `pending` file to anyone.',
      '**Storage classes and lifecycle rules** are how the cost story stays sane. Hot storage is instant and costs the most. Colder tiers are cheaper per month and slower or more expensive to read. A lifecycle rule moves objects between them by age automatically. If you are asked about cost on a system that stores a lot, the answer is "raw uploads go to cold storage after 30 days, and the derived versions people actually watch stay hot".',
      'Two things that catch people out. **Object storage is not a filesystem.** There are no real directories, just keys that happen to contain slashes, and listing many keys with a common prefix is slow. Keep an index of your objects in your database, and never make the bucket listing part of a user-facing request. And **you cannot append**. Changing one byte means writing the whole object again, which is why logs go to object storage in whole files, not line by line.',
    ],
    followUp: {
      q: '"The user uploaded a 2 GB video. Walk me through it."',
      answer:
        'The client asks my API to start an upload. I create a row in the database marked pending, with the object key and the owner, and I return a presigned multipart upload — so the client can cut the file into parts, upload them in parallel straight to object storage, and retry any single part that fails without restarting the whole thing. My servers never see the video. When the client completes the upload, either it calls me or the storage service fires an event, and I flip the row to uploaded and put a job on a queue to transcode it. That job writes the output renditions back to storage as separate objects and marks the row ready. The costs I would name: the row and the object can disagree, so I need a sweeper that deletes pending rows older than an hour and their orphaned parts, because incomplete multipart uploads keep costing money silently. And the presigned URL is a real permission, so it is scoped to one key, expires in minutes, and the key is generated by me rather than taken from the client, or someone uploads over another user\'s file.',
    },
    selfCheck: {
      q: 'Why hand out a presigned URL instead of just accepting the file through your API? Give two reasons.',
      answer:
        'First, bandwidth and connections. A file going through your API means your servers carry every byte twice, in and then out again to storage, and hold a connection open for the whole upload. A thousand people uploading at once ties up a thousand of your workers doing nothing but copying. With a presigned URL your involvement is signing a short string. Second, scaling and reliability. The storage service is built for exactly this and handles resumable, parallel, multi-gigabyte transfers far better than your application server will. There is a third reason worth adding: cost, because you are not paying for the bandwidth on the way in and back out. The trade you accept is that the upload now happens outside your sight, so you need a status field and a completion signal to know whether it actually worked.',
    },
    traps: [
      'Storing files as database blobs, then wondering why backups and replicas are so slow.',
      'Streaming a large upload through the application server because it is easier to write.',
      'Signing a URL from a client-supplied key, letting one user write over another user\'s object.',
      'No cleanup for pending rows and abandoned multipart uploads. They cost money forever.',
    ],
    sayThis:
      '"The file goes straight to object storage over a presigned multipart URL — my servers only sign it and never touch the bytes. The database row is created as pending and flipped to ready on the completion event, with a sweeper for anything still pending after an hour. Cost: the row and the object can disagree, so that sweeper is not optional."',
    related: ['cdn', 'sql-vs-nosql', 'message-queues', 'auth-and-security'],
  },

  {
    slug: 'api-design',
    title: 'API design — pagination, versioning, errors',
    navTitle: 'API design',
    tier: 1,
    oneLine: 'The contract you cannot change later, so get the three boring parts right now.',
    problem: [
      'An API is a promise to people you will never meet. Once someone depends on it, you cannot quietly change it, and every mistake you made on day one you get to carry for years.',
      'Three of those mistakes come up in almost every design interview: how you page through a long list, how you change the shape of a response without breaking anyone, and what you say when something goes wrong.',
    ],
    cost: 'Doing this well costs you flexibility up front. A versioned API means running two versions at once for a while. Cursor pagination means clients cannot jump to page 500. Careful error contracts mean writing down failure cases instead of letting an exception leak out. All of that is work you do before anyone has complained.',
    useWhen: [
      'Any API other teams or other companies will call. This is a default.',
      'Any list endpoint that can grow. Which is nearly all of them.',
      'Any endpoint a mobile app calls, because old app versions live on phones for years.',
    ],
    avoidWhen: [
      'A private endpoint with exactly one caller you deploy at the same time. Then a simple shape and a simple change is fine.',
      'Do not build a version scheme before you have a single consumer. Ship v1 and mean it.',
    ],
    visual: {
      type: 'compare',
      compare: {
        caption: 'The pagination choice that decides whether your list endpoint survives growth.',
        a: {
          title: 'Offset — ?page=500&size=20',
          points: [
            'The database walks past 10,000 rows and throws them away to give you 20.',
            'Cost grows with how deep you page. Page 1 is instant, page 500 is a scan.',
            'Rows shift while the user pages, so they see duplicates or skip items.',
            'Lets the user jump to any page, which is sometimes a real product need.',
          ],
        },
        b: {
          title: 'Cursor — ?after=eyJpZCI6...',
          points: [
            'The cursor encodes where you stopped, so the next page is an index seek.',
            'Page 500 costs the same as page 1.',
            'Stable while data changes underneath, because it anchors on a real row.',
            'No jumping to an arbitrary page, and no total count without a separate query.',
          ],
        },
        verdict:
          'Use a cursor by default, and only offer offset paging where the product really needs page numbers and the list is small. If someone asks for both, cursor is the API and page numbers are a UI built on top of a capped result.',
      },
    },
    body: [
      '**Pagination.** An endpoint that returns "all" of something is a bug waiting for your biggest customer. Always page. A cursor is an opaque string that encodes the sort key of the last row you returned, so the next query is "give me rows after this point", which an index answers directly. Offset paging asks the database to count past everything before it, so it gets slower the further you go — and across a sharded store it gets much worse, because every shard has to produce all those rows for the merge. Make the cursor opaque and base64-encoded, so clients cannot build one by hand and you can change what is inside it later.',
      '**Versioning.** You will need to change a response shape. There are three ways to survive it. Put the version in the URL path (`/v2/orders`) — ugly, obvious, and by far the easiest to reason about and to route. Put it in a header — cleaner URLs, and harder to test with curl, which matters more than people admit. Or do not version at all, and only ever make additive changes: new fields are fine, removing or renaming a field is not. That last approach is the one that works best in practice, with a version bump reserved for a genuine break.',
      'Whichever you pick, say the two rules that actually keep you safe. **Adding a field is safe. Removing or renaming one is not.** And **clients must ignore fields they do not recognise**, which you have to document or nobody will.',
      '**Errors.** Return the right HTTP status, and a body that a machine can act on and a human can read: a stable machine-readable code, a message for the developer, and where relevant which field was wrong. The status code carries the category — 400 you sent something wrong, 401 who are you, 403 I know who you are and no, 404 not here, 409 that conflicts with the current state, 422 the shape was right but the values were not, 429 slow down, 5xx my fault. The part people get wrong is retryability. A client needs to know whether to try again, so 429 and 503 should carry `Retry-After`, and 4xx should be understood as "do not retry this unchanged".',
      '**Idempotency belongs in the API contract**, not only in the implementation. Any endpoint that creates something or moves money should accept an `Idempotency-Key` header, and you should say in the docs how long you remember it. That single header is what makes a mobile client on a bad connection safe.',
      'Two more that come up. **Filtering and sorting** should be a small fixed set of allowed fields, not arbitrary user input turned into a query, or you have handed people a way to run expensive scans. And **partial responses** — letting a client ask for only the fields it needs — save real bandwidth for mobile, at the cost of a caching layer that now has to key on the field list too.',
    ],
    followUp: {
      q: '"Your mobile app is on version 3 but half your users are still on version 1. How do you ship a breaking change?"',
      answer:
        'The honest first answer is that I do not ship it as a break. Old app versions live on phones for years, some of those users will never update, and you cannot force them. So the default move is expand and contract: add the new field alongside the old one, populate both, ship the new app version reading the new field, watch usage of the old field decay, and only remove it when the number is small enough to accept the loss. That can take a year, and it is fine. When the change really cannot be additive — the meaning of a field has changed, not just its name — then I version the endpoint, run both, and put a translation layer at the gateway so the old shape is produced from the new internal model rather than by maintaining two code paths. The costs I would name: two shapes to test, a translation layer that is easy to forget when adding features, and a deprecation date that I have to actually enforce with monitoring on old-version traffic, or v1 lives forever.',
    },
    selfCheck: {
      q: 'A user is on page 500 of a list, sorted by newest first, and new items keep arriving. What goes wrong with offset paging, and how does a cursor fix it?',
      answer:
        'Two things go wrong. The performance one: page 500 with a size of 20 makes the database walk past 10,000 rows and discard them just to return 20, so paging gets slower the deeper you go, and on a sharded store every shard has to produce those rows for the merge. The correctness one is worse and less obvious. New items arriving at the top shift everything down, so the row that was at position 10,000 is now at 10,003, and the user sees items they already saw. If items are deleted instead, rows shift up and the user skips some entirely without ever knowing. A cursor fixes both, because it says "give me rows after this specific sort key" rather than "skip this many". The database seeks straight to that point using the index, so cost is flat, and the anchor is a real row, so items arriving or leaving elsewhere in the list cannot shift the user\'s position.',
    },
    traps: [
      'A list endpoint with no pagination at all. It works until your biggest customer arrives.',
      'Offset paging on a sharded store, which gets dramatically worse as shards grow.',
      'Returning 200 with an error inside the body. Now nothing can retry correctly.',
      'Removing a field because "nobody uses it". Someone does, and you will hear about it from them.',
    ],
    sayThis:
      '"List endpoints are cursor-paginated, with the cursor opaque so I can change what is inside it. Changes are additive by default, and I only version when the meaning of a field changes. Errors carry a stable code plus Retry-After on 429 and 503, so clients know what is safe to retry. Cost: no jumping to page 500, and no total count without a separate query."',
    related: ['communication-protocols', 'idempotency', 'rate-limiting', 'search-indexing'],
  },
]
