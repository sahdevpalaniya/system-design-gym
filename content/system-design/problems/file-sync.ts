import type { Problem } from '@/lib/types'

export const FILE_SYNC: Problem = {
  slug: 'file-sync',
  title: 'File sync across devices',
  navTitle: 'File sync',
  group: 'sync',
  difficulty: 'hard',
  concepts: [
    'object-storage',
    'clocks-and-ordering',
    'transactions-and-locking',
    'change-data-capture',
    'cdn',
    'message-queues',
    'auth-and-security',
  ],
  prompt:
    'Design a file sync service. A folder on several devices stays in step, edits made offline sync when the device reconnects, and history is recoverable. Files range from a few kilobytes to several gigabytes.',

  slack: {
    budget: 'Local edits: zero. Propagation: seconds. Full sync of a new device: hours.',
    headline:
      'The local device must feel instant even with no network at all. Everything else — reaching other devices, agreeing with the server, resolving conflicts — has real slack, and that asymmetry is the whole design.',
    body: [
      'A user saving a file has zero tolerance. The save writes to local disk and returns, always, even offline. Sync is something that happens afterwards, in the background, and the moment the product makes someone wait for the network to save a file it has failed at its core job.',
      'Propagation has seconds of slack. If a change reaches another device in three seconds rather than three hundred milliseconds, nobody notices, because they are not usually watching two devices at once. That means propagation can go through a queue and be batched, which matters enormously when someone drops a folder of 10,000 files in at once.',
      'A new device syncing 200 GB has hours of slack, and the user knows it. What it must not do is block anything else, or start from the beginning if it is interrupted at 90%.',
      'The place with no slack and no way to buy any: **not losing an edit**. If two devices both edited a file offline and one version silently disappears, that is not a sync delay, it is data loss — and the user will not know it happened.',
    ],
    consequence:
      'The client is the source of truth for local state and works fully offline. Sync is asynchronous, resumable and chunked. Conflicts are detected and preserved as both versions rather than resolved by picking a timestamp.',
  },

  stages: [
    {
      id: 1,
      ask: 'State your assumptions, ask one or two questions that would change a box, and propose the scope.',
      nudges: [
        'Is this one user with many devices, or many users sharing a folder? Very different systems.',
        'What happens when two people edit the same file offline? Is that a merge or a conflict?',
        'How much history do you keep?',
      ],
      model: [
        'Assumptions: desktop and mobile clients, folders can be shared between users, files from a few kilobytes to several gigabytes, and the client works fully offline with sync resuming on reconnect.',
        'The question that changes a box: do we need to merge concurrent edits to the same file, or is preserving both acceptable? Real merging means understanding file formats — you can merge text, you cannot merge a video — so a general file sync product cannot merge. I will assume we detect the conflict and keep both versions, naming one "Alice\'s conflicted copy". That sounds like a cop-out and it is the honest engineering answer, because the alternative is silently discarding somebody\'s work.',
        'Second question: is deduplication across users acceptable? Storing one copy of a file that ten thousand users all have saves an enormous amount, and it leaks information — an attacker can learn whether a file already exists by timing an upload. I will assume deduplication within a user\'s own account only, which is where most of the benefit is without the disclosure.',
        'Scope I propose: syncing a folder across a user\'s devices, sharing with other users, offline edits with conflict detection, resumable upload and download of large files, and version history. Out of scope: real-time collaborative editing inside a document, which is a really different system built on operational transforms or CRDTs rather than on file sync.',
      ],
      checklist: [
        'Established sharing between users, not just one user\'s devices',
        'Asked about merging and chose conflict preservation, with the reason',
        'Asked about cross-user deduplication and named the information leak',
        'Excluded real-time collaborative editing as a different system',
        'Committed to full offline operation as a requirement',
      ],
      tradeoffs: [
        {
          decision: 'Preserve both versions rather than merge',
          cost: 'The user sees a conflicted copy and has to deal with it. In exchange, we never silently lose an edit, which is the one unrecoverable failure here.',
        },
      ],
      sayThis:
        '"Shared folders, full offline operation, files up to several gigabytes. One question: do we merge concurrent edits? We cannot merge a video, so I would detect the conflict and keep both copies — that is the honest answer, because the alternative is discarding somebody\'s work silently."',
      trap: 'Designing a diff algorithm. Nobody asked, it only works for some file types, and chunk-level sync gets you most of the benefit with none of the complexity.',
    },

    {
      id: 2,
      ask: 'List the actors — including the system — then write a file\'s life as a chain of states, and add the failure branches.',
      nudges: [
        'Each device is a separate actor with its own view of the truth.',
        'What does the system decide about a change nobody told it about?',
        'What happens when a device has been offline for a month?',
      ],
      model: [
        'Actors: the user, each of their devices as a separate actor with its own local state, other users sharing the folder, and the system itself — which decides what counts as a change, which version is current, when two versions are in conflict, and what history to retain.',
        'A file\'s life: created or modified locally → detected by the client watcher → hashed and split into chunks → chunks not already on the server are uploaded → a new version is committed on the server → other devices are notified → they download the missing chunks → they apply the change locally. Plus deletion, which is a version like any other, and restore from history.',
        'Failure branches, and there are many because this system lives in a hostile environment. At detect: the file is still being written — someone is saving a 2 GB video — so uploading now captures a corrupt half-file. The client has to wait for the file to settle rather than react to the first event. At upload: the connection drops at 90% of 5 GB, which must resume from the last completed chunk, not restart. At commit: two devices commit versions derived from the same parent, which is the conflict case and the heart of the product. At notify: a device is offline, so it must find out on reconnect by asking what changed since the last version it saw, rather than depending on a push it missed.',
        'The branches the system owns. A device offline for a month reconnects: sending it every individual change since then could be a hundred thousand events, so it needs a compacted answer — the current state of everything that changed, not the full history of how it got there. A user drops in a folder of 50,000 small files: that must not become 50,000 separate round trips, so the client batches. And the local disk fills mid-sync, which has to fail gracefully and resumably rather than leaving a half-written file that looks complete.',
      ],
      checklist: [
        'Each device modelled as its own actor with its own state',
        'Waiting for a file to settle before uploading a partially written file',
        'Resumable upload from the last completed chunk',
        'Two versions from the same parent named as the conflict case',
        'Reconnect is a pull of what changed since a version, not a replayed push',
        'A long-absent device gets compacted current state, not full history',
      ],
      trap: 'Assuming the client always has a network. This product is defined by what it does without one, and every interesting branch starts with a device that was away.',
    },

    {
      id: 3,
      ask: 'Estimate storage, upload volume and the saving from chunking. Then finish: "So the hard part here is ___."',
      nudges: [
        'What does chunking actually save when someone edits a large file?',
        'How much metadata is there per file, and does it fit in a database?',
        'How many notifications per second, really?',
      ],
      model: [
        'Assume 50 million users, 50 GB each on average, so 2.5 exabytes of raw data. That is a very large number, and it goes straight to object storage — the only meaningful decision it forces is a serious retention and tiering policy, because keeping every version of everything hot is not affordable.',
        'Chunking is where the arithmetic becomes interesting. Split files into fixed 4 MB chunks and store each by content hash. A user edits one paragraph in a 2 GB presentation: without chunking that is a 2 GB upload, with chunking it is one 4 MB chunk, because every other chunk hashes the same and is already on the server. That is a 500-fold reduction for a common case, and it also means an interrupted upload resumes at chunk granularity. This single decision does more for the product than anything else on the board.',
        'Metadata is the part people underestimate. 50 million users times, say, 20,000 files each is a trillion file records. That does not fit on one machine and it is not object storage\'s job — it is a partitioned database, and the partition key has to be the user or the account, so that "list my folder" is one partition and never a scatter across the cluster.',
        'Change notifications: if 10 million users are online and each device sees a few changes a minute, that is only tens of thousands of notifications a second, which is small. The connections themselves are the cost, not the messages — the same shape as chat.',
        'So the hard part here is conflict handling and metadata at a trillion rows, not bandwidth. Chunking and object storage make the bytes a solved problem. Knowing which version is current for every file on every device, and detecting when two devices disagree, is the design.',
      ],
      checklist: [
        'Separated bulk data (object storage) from metadata (partitioned database)',
        'Quantified the chunking saving with a concrete example',
        'Estimated the metadata row count and said it must be partitioned by user',
        'Noted connections rather than message volume as the notification cost',
        'Finished the sentence: conflicts and metadata, not bandwidth',
      ],
      tradeoffs: [
        {
          decision: 'Content-addressed 4 MB chunks',
          cost: 'A chunk index per file and a garbage collection problem when versions are deleted — a chunk can only go when nothing references it. Worth it for a 500-fold saving on large-file edits.',
        },
      ],
      sayThis:
        '"2.5 exabytes in object storage, but the number that matters is chunking: editing a paragraph in a 2 GB file becomes a 4 MB upload. Metadata is a trillion rows, partitioned by user so listing a folder is one partition. So the hard part here is conflicts and metadata, not bytes."',
      trap: 'Estimating total storage and stopping. The chunking saving is the number that changes the design, and it is the one worth showing.',
    },

    {
      id: 4,
      ask: 'Draw the boxes and arrows in words. Justify every box with a requirement from Stage 1 or a number from Stage 3.',
      nudges: [
        'What does the client store locally, and why does it need its own database?',
        'How does a device know what it is missing?',
        'How do chunks get uploaded without passing through your servers?',
      ],
      model: [
        'The **client** is a first-class part of this system, not a thin caller. It holds a local database of every file, its version, its chunk hashes, and its sync state. That is what makes offline work possible, and it is why the client can answer "what changed" without asking anybody. A watcher observes the filesystem, waits for files to settle, hashes them, and compares against its local record.',
        'The **metadata service** owns the truth about versions, partitioned by account. Each file has a monotonically increasing version, and each account has a **cursor** — a single number that advances with every change in that account. A device syncs by saying "I am at cursor 8,412, what has changed since?" and getting back a compact list. That cursor is the single most useful design element here: it makes reconnecting after a month exactly as cheap as reconnecting after a minute, because the server answers with current state rather than replayed history.',
        '**Chunk storage** is object storage, keyed by content hash. The client asks "which of these 50 hashes do you already have", uploads only the missing ones over presigned URLs directly to storage, and then commits a new file version referencing the full list. The bytes never touch my servers, which at exabyte scale is not an optimisation but the only viable design.',
        '**Commit** is where correctness lives. A new version is accepted only if its parent version matches what the server currently has — a conditional update, exactly like the seat reservation. If the parent does not match, another device got there first, and this is a conflict rather than an overwrite. That single conditional check is what prevents silent loss, and it is a two-line answer that carries the whole product.',
        '**Notification** is a persistent connection per device, carrying only "the cursor moved" rather than the change itself. The device then pulls the delta over normal HTTP. That keeps the socket layer trivial and makes a missed notification harmless, since the next connection reveals the gap anyway.',
        '**Sharing** adds a folder-level access record, and a change in a shared folder advances the cursor for every member. Permission checks happen at the metadata service on every access, not at the edge, because a chunk hash is effectively a capability and must never be servable without an ownership check.',
      ],
      checklist: [
        'Client holds a local database and can operate entirely offline',
        'Per-account cursor so syncing is a delta, not a replay',
        'Chunks in object storage by content hash, uploaded over presigned URLs',
        '"Which of these hashes do you have" before uploading anything',
        'Commit is conditional on the parent version — this is what prevents loss',
        'Notifications carry only that the cursor moved; the client pulls the delta',
        'Permission checked at metadata access, never inferred from knowing a hash',
      ],
      tradeoffs: [
        {
          decision: 'Per-account cursor',
          cost: 'All changes in an account serialise through one counter, so a shared folder with very heavy write activity has a ceiling. In exchange, sync becomes easily correct and resumable.',
        },
        {
          decision: 'Direct-to-storage chunk transfer',
          cost: 'The server does not see the bytes, so it cannot scan for malware inline and must do it asynchronously afterwards.',
        },
      ],
      sayThis:
        '"Each account has a cursor, so a device says \'I am at 8,412, what changed?\' and reconnecting after a month costs the same as after a minute. Commits are conditional on the parent version — that one check is what turns silent overwrites into detected conflicts. Chunks go straight to object storage over presigned URLs."',
      trap: 'Syncing by comparing modification times. Clocks on user devices are wrong, sometimes by years, and users set them by hand. Version numbers and content hashes are the only things you can trust.',
    },

    {
      id: 5,
      ask: 'Pick the two hardest parts and go deep. After every decision, say what it costs.',
      nudges: [
        'Two devices edited the same file offline. Walk through what each one sees.',
        'A user drops in 50,000 files at once. What happens?',
        'What deletes a chunk, and how do you know it is safe?',
      ],
      model: [
        '**Hard part one: the offline conflict.** Two devices both had version 7 and both edited while disconnected. Device A reconnects and commits version 8 successfully, because its parent matched. Device B reconnects and tries to commit with parent 7, but the server is now at 8, so the conditional commit fails. That failure is the correct and important outcome — B has not lost anything, it has been told it is behind. B then downloads version 8, and because it cannot merge arbitrary files, it writes its own edit as a new file named for the conflict and syncs that as a separate object. Both versions now exist and both are visible. The costs I would name honestly: the user sees a file they did not create and has to deal with it, and a folder synced across many devices after a long offline period can produce several conflicted copies, which feels messy. It is still the right trade, because the alternative is choosing a winner by timestamp — and the device clocks here are consumer machines that are routinely wrong, so that choice would delete real work with no error and no way to notice.',
        '**Hard part two: 50,000 files at once.** A naive client does 50,000 hash checks, 50,000 uploads and 50,000 commits, and the round trips alone take hours while the metadata service sees a burst of writes for one account — a self-inflicted hot partition. So: the client batches. Hash existence is asked in batches of hundreds. Uploads run with bounded parallelism, a few at a time, so one user cannot saturate their own connection or my ingest. Commits are batched into a single call that advances the cursor once for the whole batch rather than 50,000 times, which is what stops every other device receiving 50,000 notifications. Cost: the batch commit is more complex, and a partial failure has to be resumable at file granularity within the batch.',
        '**Chunk garbage collection.** Chunks are shared between versions, between files and, within an account, between users. Deleting a file cannot delete its chunks, because another version or another file may reference them. So chunks are reference counted, or swept periodically by finding unreferenced hashes — and a sweep must be conservative, ignoring anything recently created, because a chunk uploaded seconds ago may not yet have a version referencing it. Deleting a chunk that is still needed is unrecoverable data loss, so the whole job errs toward keeping too much. Cost: real money spent on storage that nothing references, and a job that must never be made more aggressive without careful thought.',
        '**History and restore.** Versions are cheap because they share chunks, so keeping 30 days of history costs far less than 30 copies. Beyond that, thin them out. Restore is just committing an old version as a new one, which keeps history append-only and means restore is itself undoable.',
      ],
      checklist: [
        'Walked the conflict through both devices, not just the server',
        'Explained why timestamps cannot decide it — consumer clocks are wrong',
        'Batched hash checks, uploads and commits for a bulk import',
        'One cursor advance per batch, so other devices are not flooded',
        'Chunk garbage collection by reference, conservative on purpose',
        'History cheap because versions share chunks; restore is a new version',
      ],
      tradeoffs: [
        {
          decision: 'Conflicted copies visible to the user',
          cost: 'A messy folder after a long offline period. Accepted, because the alternative silently deletes work.',
        },
        {
          decision: 'Conservative chunk sweeping',
          cost: 'Paying to store orphaned chunks for a while. Correct — the failure in the other direction is unrecoverable.',
        },
      ],
      sayThis:
        '"Device B\'s commit fails because its parent version no longer matches, and that failure is the feature — it means B knows it is behind rather than overwriting A. Since we cannot merge arbitrary files, B keeps both as a conflicted copy. Choosing a winner by timestamp would silently delete real work, on clocks that are routinely wrong."',
      trap: 'Garbage collecting chunks aggressively. Deleting a chunk something still references is permanent data loss, and it is the one mistake in this system you cannot undo.',
    },
  ],

  lifecycle: {
    caption:
      'A file\'s life across devices. The failed conditional commit is not an error — it is the mechanism that turns a silent overwrite into a visible conflict.',
    states: [
      { id: 'edit', label: 'Edited locally', by: 'user device' },
      { id: 'settle', label: 'Settled + hashed', by: 'client watcher' },
      { id: 'up', label: 'Missing chunks uploaded', by: 'client' },
      { id: 'commit', label: 'Version committed', by: 'server' },
      { id: 'notify', label: 'Cursor moved, devices notified', by: 'system' },
      { id: 'apply', label: 'Applied on other devices', by: 'clients' },
    ],
    failures: [
      { after: 'edit', label: 'File still being written', handling: 'wait for it to settle, or you upload a corrupt half-file' },
      { after: 'up', label: 'Connection drops at 90% of 5 GB', handling: 'resume from the last completed chunk — never restart' },
      { after: 'commit', label: 'Parent version no longer matches', handling: 'conflict: keep both, as a named conflicted copy. Never pick by timestamp' },
      { after: 'notify', label: 'Device offline for a month', handling: 'pull the delta from its cursor — compact current state, not replayed history' },
      { after: 'apply', label: 'Local disk full mid-sync', handling: 'fail resumably; never leave a partial file that looks complete' },
      { after: 'apply', label: '50,000 files dropped in at once', handling: 'batch hashes, bound parallelism, one cursor advance for the whole batch' },
    ],
  },

  architecture: {
    caption:
      'Bytes go straight to object storage by content hash. The metadata service owns versions and the per-account cursor, which is what makes sync a delta rather than a replay.',
    nodes: [
      { id: 'd', label: 'Devices', sub: 'local DB, offline-capable', kind: 'client', col: 0, row: 0 },
      { id: 'meta', label: 'Metadata svc', sub: 'versions + cursor', kind: 'service', col: 1, row: 0 },
      { id: 'mdb', label: 'Metadata store', sub: 'partition: account', kind: 'store', col: 2, row: 0 },
      { id: 'obj', label: 'Chunk storage', sub: 'keyed by content hash', kind: 'store', col: 2, row: 1 },
      { id: 'n', label: 'Notify svc', sub: '"cursor moved"', kind: 'service', col: 1, row: 1 },
      { id: 'gc', label: 'Chunk GC', sub: 'conservative sweep', kind: 'service', col: 3, row: 1 },
      { id: 'q', label: 'Event queue', kind: 'queue', col: 3, row: 0 },
    ],
    edges: [
      { from: 'd', to: 'meta', label: 'have these hashes?' },
      { from: 'd', to: 'obj', label: 'presigned PUT' },
      { from: 'meta', to: 'mdb', label: 'conditional commit' },
      { from: 'meta', to: 'q' },
      { from: 'q', to: 'n' },
      { from: 'n', to: 'd', label: 'cursor moved', dashed: true },
      { from: 'q', to: 'gc' },
      { from: 'gc', to: 'obj', dashed: true },
    ],
  },

  numbers: {
    caption: 'Chunking is the number that changes the design. Everything else follows from it.',
    items: [
      { label: 'Edit a paragraph in a 2 GB file — no chunking', value: 2000, display: '2 GB uploaded', tone: 'bad' },
      { label: 'Same edit, 4 MB content-addressed chunks', value: 4, display: '4 MB uploaded — 500x less', tone: 'accent' },
      { label: 'File metadata rows', value: 1000, display: '~1 trillion — a partitioned database', tone: 'muted' },
    ],
    note: 'So the hard part is conflicts and metadata, not bandwidth. Chunking plus object storage makes the bytes a solved problem; knowing which version is current on every device is the design.',
  },

  compare: {
    caption: 'What to do when two devices committed edits from the same parent version.',
    a: {
      title: 'Pick a winner by timestamp',
      points: [
        'One version survives, so the folder stays tidy and the user is never confused.',
        'Depends on device clocks, which on consumer machines are routinely wrong.',
        'The loser is deleted with no error, no notification and no way to recover it.',
        'Feels clean right up until someone loses an afternoon of work.',
      ],
    },
    b: {
      title: 'Detect and keep both',
      points: [
        'The conditional commit fails, so the second device knows it is behind.',
        'Both versions exist; nothing is ever silently discarded.',
        'The user sees a conflicted copy they did not create and must resolve it.',
        'A long offline period across several devices can produce several such copies.',
      ],
    },
    verdict:
      'Keep both. The messy folder is a visible, recoverable annoyance; a silently deleted edit is invisible and permanent. The version check that produces the conflict is two lines of logic and it is the most important correctness property in the product.',
  },

  followUps: [
    'consistency-simultaneous',
    'scope-offline',
    'kill-worker-mid-job',
    'cost-storage-growth',
    'scale-growth',
    'consistency-two-systems',
    'scope-privacy',
    'ops-migration',
  ],
}
