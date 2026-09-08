/**
 * The system design vocabulary, as drawable components.
 *
 * Every icon is drawn with canvas paths inside a 0..1 square rather than loaded
 * as an image or an icon font. One implementation serves both the board and the
 * menu, it stays sharp at any zoom, it costs no network request, and a saved
 * diagram stores a short type name instead of any artwork.
 *
 * Icons are composed from a handful of primitives so eighty of them still look
 * like one family rather than eighty separate drawings.
 */

export interface Stencil {
  id: string
  /** the label a freshly placed component starts with */
  label: string
  /** outline colour; the fill is the same colour, faint */
  colour: string
  group: string
  /** extra words to match when searching the menu */
  alt?: string
}

const CLIENT = '#1f2430'
const EDGE = '#7a52b3'
const COMPUTE = '#1f6fb2'
const DATA = '#2e8b57'
const FAST = '#c2831f'
const PIPE = '#0f766e'
const OPS = '#475569'
const OUTSIDE = '#d1493f'

export const STENCILS: Stencil[] = [
  // ---- who is asking ----
  { id: 'user', label: 'User', colour: CLIENT, group: 'Clients', alt: 'person customer actor' },
  { id: 'users', label: 'Many users', colour: CLIENT, group: 'Clients', alt: 'people crowd traffic' },
  { id: 'browser', label: 'Browser', colour: CLIENT, group: 'Clients', alt: 'web client desktop' },
  { id: 'mobile', label: 'Mobile app', colour: CLIENT, group: 'Clients', alt: 'phone ios android' },
  { id: 'desktop', label: 'Desktop app', colour: CLIENT, group: 'Clients', alt: 'native client' },
  { id: 'iot', label: 'IoT device', colour: CLIENT, group: 'Clients', alt: 'sensor embedded hardware' },
  { id: 'bot', label: 'Bot / crawler', colour: CLIENT, group: 'Clients', alt: 'scraper spider agent' },

  // ---- the way in ----
  { id: 'dns', label: 'DNS', colour: EDGE, group: 'Edge & network', alt: 'domain name resolver' },
  { id: 'cdn', label: 'CDN', colour: EDGE, group: 'Edge & network', alt: 'edge cache cloudflare' },
  { id: 'lb', label: 'Load balancer', colour: EDGE, group: 'Edge & network', alt: 'nginx haproxy elb' },
  { id: 'proxy', label: 'Reverse proxy', colour: EDGE, group: 'Edge & network', alt: 'nginx envoy sidecar' },
  { id: 'gateway', label: 'API gateway', colour: EDGE, group: 'Edge & network', alt: 'edge api bff' },
  { id: 'firewall', label: 'Firewall / WAF', colour: EDGE, group: 'Edge & network', alt: 'security ddos shield' },
  { id: 'ratelimit', label: 'Rate limiter', colour: EDGE, group: 'Edge & network', alt: 'throttle quota token bucket' },
  { id: 'websocket', label: 'WebSocket layer', colour: EDGE, group: 'Edge & network', alt: 'realtime push sse socket' },

  // ---- where code runs ----
  { id: 'service', label: 'Service', colour: COMPUTE, group: 'Compute', alt: 'app server backend api' },
  { id: 'micro', label: 'Microservice', colour: COMPUTE, group: 'Compute', alt: 'service mesh' },
  { id: 'worker', label: 'Worker', colour: COMPUTE, group: 'Compute', alt: 'consumer background job' },
  { id: 'serverless', label: 'Serverless', colour: COMPUTE, group: 'Compute', alt: 'lambda function faas' },
  { id: 'container', label: 'Container', colour: COMPUTE, group: 'Compute', alt: 'docker image pod' },
  { id: 'orchestrator', label: 'Orchestrator', colour: COMPUTE, group: 'Compute', alt: 'kubernetes k8s scheduler' },
  { id: 'server', label: 'Server / VM', colour: COMPUTE, group: 'Compute', alt: 'host machine instance ec2' },
  { id: 'cron', label: 'Scheduled job', colour: COMPUTE, group: 'Compute', alt: 'cron timer batch nightly' },

  // ---- where the truth lives ----
  { id: 'sql', label: 'SQL database', colour: DATA, group: 'Databases', alt: 'postgres mysql relational rdbms' },
  { id: 'nosql', label: 'NoSQL database', colour: DATA, group: 'Databases', alt: 'mongo dynamo cassandra document' },
  { id: 'replica', label: 'Read replica', colour: DATA, group: 'Databases', alt: 'follower secondary standby' },
  { id: 'shard', label: 'Sharded database', colour: DATA, group: 'Databases', alt: 'partition split horizontal' },
  { id: 'keyvalue', label: 'Key-value store', colour: DATA, group: 'Databases', alt: 'dynamo rocksdb kv' },
  { id: 'graphdb', label: 'Graph database', colour: DATA, group: 'Databases', alt: 'neo4j social relationships' },
  { id: 'timeseries', label: 'Time-series DB', colour: DATA, group: 'Databases', alt: 'metrics influx prometheus' },
  { id: 'vectordb', label: 'Vector database', colour: DATA, group: 'Databases', alt: 'embeddings similarity ann' },
  { id: 'warehouse', label: 'Data warehouse', colour: DATA, group: 'Databases', alt: 'olap snowflake bigquery redshift' },
  { id: 'ledger', label: 'Ledger', colour: DATA, group: 'Databases', alt: 'double entry accounting money' },

  // ---- speed and decoupling ----
  { id: 'cache', label: 'Cache', colour: FAST, group: 'Caching & messaging', alt: 'redis memcached fast' },
  { id: 'distcache', label: 'Distributed cache', colour: FAST, group: 'Caching & messaging', alt: 'redis cluster ring' },
  { id: 'queue', label: 'Queue', colour: FAST, group: 'Caching & messaging', alt: 'sqs rabbitmq jobs fifo' },
  { id: 'topic', label: 'Pub/sub topic', colour: FAST, group: 'Caching & messaging', alt: 'fanout broadcast subscribers' },
  { id: 'stream', label: 'Event log', colour: FAST, group: 'Caching & messaging', alt: 'kafka kinesis partition replay' },
  { id: 'eventbus', label: 'Event bus', colour: FAST, group: 'Caching & messaging', alt: 'broker routing' },
  { id: 'dlq', label: 'Dead letter queue', colour: FAST, group: 'Caching & messaging', alt: 'poison failed retry' },
  { id: 'outbox', label: 'Outbox', colour: FAST, group: 'Caching & messaging', alt: 'transactional relay saga' },

  // ---- files and finding things ----
  { id: 'objectstore', label: 'Object storage', colour: DATA, group: 'Storage & search', alt: 's3 gcs bucket blob' },
  { id: 'filestore', label: 'File storage', colour: DATA, group: 'Storage & search', alt: 'nfs disk volume' },
  { id: 'blockstore', label: 'Block storage', colour: DATA, group: 'Storage & search', alt: 'ebs disk volume ssd' },
  { id: 'search', label: 'Search index', colour: EDGE, group: 'Storage & search', alt: 'elasticsearch lucene inverted' },
  { id: 'bloom', label: 'Bloom filter', colour: EDGE, group: 'Storage & search', alt: 'probabilistic membership' },
  { id: 'blob', label: 'Media / blob', colour: DATA, group: 'Storage & search', alt: 'video image upload' },

  // ---- moving and shaping data ----
  { id: 'etl', label: 'ETL pipeline', colour: PIPE, group: 'Data processing', alt: 'transform ingest airflow' },
  { id: 'batch', label: 'Batch job', colour: PIPE, group: 'Data processing', alt: 'spark mapreduce nightly' },
  { id: 'streamproc', label: 'Stream processor', colour: PIPE, group: 'Data processing', alt: 'flink windowing realtime' },
  { id: 'cdc', label: 'Change data capture', colour: PIPE, group: 'Data processing', alt: 'debezium binlog wal' },
  { id: 'ml', label: 'ML model', colour: PIPE, group: 'Data processing', alt: 'inference ranking recommendation' },
  { id: 'analytics', label: 'Analytics', colour: PIPE, group: 'Data processing', alt: 'reporting dashboard bi' },

  // ---- keeping it alive ----
  { id: 'metrics', label: 'Metrics', colour: OPS, group: 'Operations', alt: 'prometheus grafana monitoring' },
  { id: 'logs', label: 'Logs', colour: OPS, group: 'Operations', alt: 'logging splunk elk' },
  { id: 'tracing', label: 'Tracing', colour: OPS, group: 'Operations', alt: 'jaeger spans distributed' },
  { id: 'alerts', label: 'Alerting', colour: OPS, group: 'Operations', alt: 'pagerduty oncall paging' },
  { id: 'config', label: 'Config service', colour: OPS, group: 'Operations', alt: 'feature flags settings' },
  { id: 'discovery', label: 'Service discovery', colour: OPS, group: 'Operations', alt: 'consul registry dns' },
  { id: 'consensus', label: 'Coordinator', colour: OPS, group: 'Operations', alt: 'zookeeper etcd raft leader election' },
  { id: 'secrets', label: 'Secrets', colour: OPS, group: 'Operations', alt: 'vault keys credentials kms' },
  { id: 'auth', label: 'Auth service', colour: OPS, group: 'Operations', alt: 'oauth identity login jwt sso' },
  { id: 'backup', label: 'Backup', colour: OPS, group: 'Operations', alt: 'snapshot restore disaster recovery' },

  // ---- other people's systems, and boundaries ----
  { id: 'external', label: 'Third party', colour: OUTSIDE, group: 'External & boundaries', alt: 'vendor partner saas' },
  { id: 'payment', label: 'Payment provider', colour: OUTSIDE, group: 'External & boundaries', alt: 'stripe card money' },
  { id: 'email', label: 'Email provider', colour: OUTSIDE, group: 'External & boundaries', alt: 'ses sendgrid smtp' },
  { id: 'sms', label: 'SMS provider', colour: OUTSIDE, group: 'External & boundaries', alt: 'twilio text message' },
  { id: 'push', label: 'Push notifications', colour: OUTSIDE, group: 'External & boundaries', alt: 'apns fcm mobile' },
  { id: 'webhook', label: 'Webhook', colour: OUTSIDE, group: 'External & boundaries', alt: 'callback outbound event' },
  { id: 'region', label: 'Region / AZ', colour: OPS, group: 'External & boundaries', alt: 'datacenter zone boundary vpc' },
  { id: 'cloud', label: 'Cloud / internet', colour: OPS, group: 'External & boundaries', alt: 'network public wan' },
]

export function getStencil(id: string): Stencil | undefined {
  return STENCILS.find((s) => s.id === id)
}

/**
 * Menu search across the name, the group and the product names people actually
 * think in — "redis", "kafka", "s3".
 *
 * Ranked, because matching alone is not enough: "cache" appears in the CDN's
 * keywords, so an unranked search offers you a CDN before the thing literally
 * called Cache.
 */
export function searchStencils(q: string): Stencil[] {
  const t = q.trim().toLowerCase()
  if (!t) return STENCILS

  const score = (s: Stencil): number => {
    const label = s.label.toLowerCase()
    if (label === t) return 0
    if (label.startsWith(t)) return 1
    if (label.includes(t)) return 2
    // a whole keyword, so "s3" beats something merely containing those letters
    if ((s.alt ?? '').split(/\s+/).some((w) => w === t)) return 3
    if ((s.alt ?? '').toLowerCase().includes(t)) return 4
    if (s.group.toLowerCase().includes(t)) return 5
    return 99
  }

  return STENCILS.map((s, i) => ({ s, r: score(s), i }))
    .filter((x) => x.r < 99)
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.s)
}

/** default size of a freshly dropped component, in board units */
export const NODE_W = 0.17
export const NODE_H = 0.115

/* ---------- drawing primitives, all inside the unit square ---------- */

type C = CanvasRenderingContext2D

function rr(ctx: C, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function line(ctx: C, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function circle(ctx: C, cx: number, cy: number, r: number) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
}

/** a database cylinder, centred horizontally */
function cyl(ctx: C, cx = 0.5, top = 0.2, bot = 0.8, rx = 0.32) {
  const ry = rx * 0.35
  ctx.beginPath()
  ctx.ellipse(cx, top, rx, ry, 0, 0, Math.PI * 2)
  ctx.stroke()
  line(ctx, cx - rx, top, cx - rx, bot)
  line(ctx, cx + rx, top, cx + rx, bot)
  ctx.beginPath()
  ctx.ellipse(cx, bot, rx, ry, 0, 0, Math.PI)
  ctx.stroke()
}

function cloud(ctx: C, cx = 0.5, cy = 0.52, s = 1) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(s, s)
  ctx.beginPath()
  ctx.arc(-0.16, 0.04, 0.18, Math.PI * 0.5, Math.PI * 1.5)
  ctx.arc(0, -0.1, 0.2, Math.PI, Math.PI * 1.85)
  ctx.arc(0.2, 0.04, 0.17, Math.PI * 1.5, Math.PI * 0.5)
  ctx.closePath()
  ctx.stroke()
  ctx.restore()
}

function person(ctx: C, cx = 0.5, cy = 0.5, s = 1) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(s, s)
  circle(ctx, 0, -0.2, 0.16)
  ctx.beginPath()
  ctx.arc(0, 0.45, 0.32, Math.PI * 1.15, Math.PI * 1.85)
  ctx.stroke()
  ctx.restore()
}

function gear(ctx: C, cx = 0.5, cy = 0.5, r = 0.2, teeth = 6) {
  circle(ctx, cx, cy, r)
  for (let i = 0; i < teeth; i++) {
    const a = (i * Math.PI * 2) / teeth
    line(ctx, cx + Math.cos(a) * (r + 0.06), cy + Math.sin(a) * (r + 0.06),
             cx + Math.cos(a) * (r + 0.18), cy + Math.sin(a) * (r + 0.18))
  }
}

/** stacked plates, for anything that comes in copies */
function stack(ctx: C, n = 3, x = 0.16, y = 0.24, w = 0.68, h = 0.14, gap = 0.08) {
  for (let i = 0; i < n; i++) {
    rr(ctx, x, y + i * (h + gap), w, h, 0.035)
    ctx.stroke()
  }
}

/** vertical bars, for queues and charts */
function bars(ctx: C, xs: number[], y = 0.28, h = 0.44, w = 0.13) {
  for (const x of xs) {
    rr(ctx, x, y, w, h, 0.03)
    ctx.stroke()
  }
}

function doc(ctx: C, x = 0.24, y = 0.14, w = 0.52, h = 0.72) {
  const fold = 0.16
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w - fold, y)
  ctx.lineTo(x + w, y + fold)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.closePath()
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x + w - fold, y)
  ctx.lineTo(x + w - fold, y + fold)
  ctx.lineTo(x + w, y + fold)
  ctx.stroke()
}

function shield(ctx: C) {
  ctx.beginPath()
  ctx.moveTo(0.5, 0.12)
  ctx.lineTo(0.84, 0.26)
  ctx.lineTo(0.84, 0.52)
  ctx.quadraticCurveTo(0.84, 0.78, 0.5, 0.9)
  ctx.quadraticCurveTo(0.16, 0.78, 0.16, 0.52)
  ctx.lineTo(0.16, 0.26)
  ctx.closePath()
  ctx.stroke()
}

function arrowTo(ctx: C, x1: number, y1: number, x2: number, y2: number, head = 0.1) {
  line(ctx, x1, y1, x2, y2)
  const a = Math.atan2(y2 - y1, x2 - x1)
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - head * Math.cos(a - 0.5), y2 - head * Math.sin(a - 0.5))
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - head * Math.cos(a + 0.5), y2 - head * Math.sin(a + 0.5))
  ctx.stroke()
}

function bolt(ctx: C) {
  ctx.beginPath()
  ctx.moveTo(0.58, 0.1)
  ctx.lineTo(0.3, 0.52)
  ctx.lineTo(0.5, 0.52)
  ctx.lineTo(0.42, 0.9)
  ctx.lineTo(0.72, 0.44)
  ctx.lineTo(0.5, 0.44)
  ctx.closePath()
  ctx.stroke()
}

function screen(ctx: C) {
  rr(ctx, 0.12, 0.18, 0.76, 0.5, 0.06)
  ctx.stroke()
  line(ctx, 0.5, 0.68, 0.5, 0.84)
  line(ctx, 0.3, 0.86, 0.7, 0.86)
}

function bucket(ctx: C) {
  ctx.beginPath()
  ctx.moveTo(0.18, 0.24)
  ctx.lineTo(0.28, 0.86)
  ctx.lineTo(0.72, 0.86)
  ctx.lineTo(0.82, 0.24)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(0.5, 0.24, 0.32, 0.11, 0, 0, Math.PI * 2)
  ctx.stroke()
}

/**
 * Draw a component's glyph into the unit square. The caller sets stroke colour
 * and line width and has already translated and scaled into place.
 */
export function drawIcon(ctx: C, id: string) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  switch (id) {
    /* clients */
    case 'user': person(ctx); break
    case 'users':
      person(ctx, 0.34, 0.54, 0.82)
      person(ctx, 0.68, 0.46, 0.82)
      break
    case 'browser':
      rr(ctx, 0.12, 0.18, 0.76, 0.5, 0.06); ctx.stroke()
      line(ctx, 0.12, 0.32, 0.88, 0.32)
      circle(ctx, 0.2, 0.25, 0.025)
      line(ctx, 0.5, 0.68, 0.5, 0.84); line(ctx, 0.3, 0.86, 0.7, 0.86)
      break
    case 'mobile':
      rr(ctx, 0.3, 0.12, 0.4, 0.76, 0.08); ctx.stroke()
      circle(ctx, 0.5, 0.76, 0.04)
      break
    case 'desktop': screen(ctx); break
    case 'iot':
      rr(ctx, 0.26, 0.26, 0.48, 0.48, 0.07); ctx.stroke()
      for (const [x, y] of [[0.38, 0.14], [0.5, 0.14], [0.62, 0.14]]) line(ctx, x, y, x, 0.26)
      for (const [x, y] of [[0.38, 0.86], [0.5, 0.86], [0.62, 0.86]]) line(ctx, x, y, x, 0.74)
      line(ctx, 0.14, 0.44, 0.26, 0.44); line(ctx, 0.14, 0.58, 0.26, 0.58)
      line(ctx, 0.86, 0.44, 0.74, 0.44); line(ctx, 0.86, 0.58, 0.74, 0.58)
      break
    case 'bot':
      rr(ctx, 0.2, 0.3, 0.6, 0.46, 0.1); ctx.stroke()
      circle(ctx, 0.37, 0.5, 0.05); circle(ctx, 0.63, 0.5, 0.05)
      line(ctx, 0.5, 0.16, 0.5, 0.3); circle(ctx, 0.5, 0.14, 0.05)
      break

    /* edge and network */
    case 'dns':
      circle(ctx, 0.5, 0.5, 0.34)
      ctx.beginPath(); ctx.ellipse(0.5, 0.5, 0.14, 0.34, 0, 0, Math.PI * 2); ctx.stroke()
      line(ctx, 0.16, 0.5, 0.84, 0.5)
      break
    case 'cdn':
      cloud(ctx, 0.5, 0.44, 1)
      line(ctx, 0.5, 0.66, 0.5, 0.8)
      line(ctx, 0.26, 0.88, 0.74, 0.88)
      line(ctx, 0.26, 0.8, 0.26, 0.88); line(ctx, 0.74, 0.8, 0.74, 0.88)
      break
    case 'lb':
      line(ctx, 0.12, 0.5, 0.44, 0.5)
      line(ctx, 0.44, 0.5, 0.86, 0.18)
      line(ctx, 0.44, 0.5, 0.86, 0.5)
      line(ctx, 0.44, 0.5, 0.86, 0.82)
      break
    case 'proxy':
      rr(ctx, 0.4, 0.16, 0.2, 0.68, 0.05); ctx.stroke()
      arrowTo(ctx, 0.08, 0.5, 0.36, 0.5, 0.08)
      arrowTo(ctx, 0.64, 0.5, 0.92, 0.5, 0.08)
      break
    case 'gateway':
      ctx.beginPath()
      ctx.moveTo(0.4, 0.14); ctx.quadraticCurveTo(0.2, 0.14, 0.2, 0.5)
      ctx.quadraticCurveTo(0.2, 0.86, 0.4, 0.86)
      ctx.moveTo(0.6, 0.14); ctx.quadraticCurveTo(0.8, 0.14, 0.8, 0.5)
      ctx.quadraticCurveTo(0.8, 0.86, 0.6, 0.86)
      ctx.stroke()
      break
    case 'firewall':
      shield(ctx)
      line(ctx, 0.32, 0.42, 0.68, 0.42); line(ctx, 0.32, 0.6, 0.68, 0.6)
      line(ctx, 0.5, 0.26, 0.5, 0.42); line(ctx, 0.4, 0.42, 0.4, 0.6); line(ctx, 0.6, 0.42, 0.6, 0.6)
      break
    case 'ratelimit':
      circle(ctx, 0.5, 0.5, 0.32)
      line(ctx, 0.5, 0.5, 0.5, 0.26); line(ctx, 0.5, 0.5, 0.68, 0.6)
      break
    case 'websocket':
      arrowTo(ctx, 0.14, 0.34, 0.86, 0.34, 0.09)
      arrowTo(ctx, 0.86, 0.66, 0.14, 0.66, 0.09)
      break

    /* compute */
    case 'service':
      stack(ctx, 2, 0.12, 0.2, 0.76, 0.26, 0.08)
      circle(ctx, 0.24, 0.33, 0.035); circle(ctx, 0.24, 0.67, 0.035)
      break
    case 'micro':
      rr(ctx, 0.1, 0.14, 0.36, 0.32, 0.06); ctx.stroke()
      rr(ctx, 0.54, 0.14, 0.36, 0.32, 0.06); ctx.stroke()
      rr(ctx, 0.32, 0.56, 0.36, 0.32, 0.06); ctx.stroke()
      line(ctx, 0.46, 0.3, 0.54, 0.3); line(ctx, 0.28, 0.46, 0.42, 0.56); line(ctx, 0.72, 0.46, 0.58, 0.56)
      break
    case 'worker': gear(ctx); break
    case 'serverless':
      bolt(ctx)
      ctx.setLineDash([0.06, 0.05]); rr(ctx, 0.1, 0.1, 0.8, 0.8, 0.12); ctx.stroke(); ctx.setLineDash([])
      break
    case 'container':
      rr(ctx, 0.14, 0.3, 0.72, 0.46, 0.05); ctx.stroke()
      line(ctx, 0.38, 0.3, 0.38, 0.76); line(ctx, 0.62, 0.3, 0.62, 0.76)
      line(ctx, 0.14, 0.22, 0.86, 0.22)
      break
    case 'orchestrator':
      ctx.beginPath()
      ctx.moveTo(0.5, 0.1); ctx.lineTo(0.84, 0.3); ctx.lineTo(0.84, 0.7)
      ctx.lineTo(0.5, 0.9); ctx.lineTo(0.16, 0.7); ctx.lineTo(0.16, 0.3)
      ctx.closePath(); ctx.stroke()
      gear(ctx, 0.5, 0.5, 0.12, 5)
      break
    case 'server':
      stack(ctx, 3, 0.16, 0.16, 0.68, 0.18, 0.07)
      circle(ctx, 0.26, 0.25, 0.03); circle(ctx, 0.26, 0.5, 0.03); circle(ctx, 0.26, 0.75, 0.03)
      break
    case 'cron':
      circle(ctx, 0.5, 0.52, 0.32)
      line(ctx, 0.5, 0.52, 0.5, 0.3); line(ctx, 0.5, 0.52, 0.66, 0.62)
      line(ctx, 0.36, 0.12, 0.64, 0.12)
      break

    /* databases */
    case 'sql':
      cyl(ctx)
      line(ctx, 0.18, 0.5, 0.82, 0.5)
      break
    case 'nosql':
      cyl(ctx)
      circle(ctx, 0.5, 0.55, 0.08)
      break
    case 'replica':
      ctx.save(); ctx.translate(0.13, -0.09); ctx.scale(0.8, 0.8); cyl(ctx); ctx.restore()
      ctx.save(); ctx.translate(-0.13, 0.11); ctx.scale(0.8, 0.8); cyl(ctx); ctx.restore()
      break
    case 'shard':
      ctx.save(); ctx.translate(-0.24, 0); ctx.scale(0.46, 0.9); cyl(ctx, 0.5, 0.22, 0.78, 0.46); ctx.restore()
      ctx.save(); ctx.scale(0.46, 0.9); cyl(ctx, 1.08, 0.22, 0.78, 0.46); ctx.restore()
      ctx.save(); ctx.translate(0.24, 0); ctx.scale(0.46, 0.9); cyl(ctx, 1.66, 0.22, 0.78, 0.46); ctx.restore()
      break
    case 'keyvalue':
      rr(ctx, 0.12, 0.28, 0.32, 0.44, 0.05); ctx.stroke()
      rr(ctx, 0.56, 0.28, 0.32, 0.44, 0.05); ctx.stroke()
      line(ctx, 0.44, 0.5, 0.56, 0.5)
      break
    case 'graphdb':
      circle(ctx, 0.5, 0.2, 0.1); circle(ctx, 0.2, 0.74, 0.1); circle(ctx, 0.8, 0.74, 0.1)
      line(ctx, 0.44, 0.29, 0.26, 0.65); line(ctx, 0.56, 0.29, 0.74, 0.65); line(ctx, 0.3, 0.74, 0.7, 0.74)
      break
    case 'timeseries':
      ctx.beginPath()
      ctx.moveTo(0.12, 0.7); ctx.lineTo(0.3, 0.42); ctx.lineTo(0.46, 0.6)
      ctx.lineTo(0.62, 0.26); ctx.lineTo(0.88, 0.52)
      ctx.stroke()
      line(ctx, 0.12, 0.86, 0.88, 0.86)
      break
    case 'vectordb':
      arrowTo(ctx, 0.2, 0.8, 0.6, 0.34, 0.1)
      arrowTo(ctx, 0.2, 0.8, 0.82, 0.62, 0.1)
      break
    case 'warehouse':
      ctx.beginPath()
      ctx.moveTo(0.12, 0.44); ctx.lineTo(0.5, 0.16); ctx.lineTo(0.88, 0.44)
      ctx.stroke()
      rr(ctx, 0.18, 0.44, 0.64, 0.4, 0.04); ctx.stroke()
      line(ctx, 0.38, 0.84, 0.38, 0.56); line(ctx, 0.62, 0.84, 0.62, 0.56); line(ctx, 0.38, 0.56, 0.62, 0.56)
      break
    case 'ledger':
      doc(ctx)
      line(ctx, 0.34, 0.4, 0.66, 0.4); line(ctx, 0.34, 0.54, 0.66, 0.54); line(ctx, 0.34, 0.68, 0.54, 0.68)
      break

    /* caching and messaging */
    case 'cache': bolt(ctx); break
    case 'distcache':
      circle(ctx, 0.5, 0.5, 0.3)
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4
        circle(ctx, 0.5 + Math.cos(a) * 0.3, 0.5 + Math.sin(a) * 0.3, 0.075)
      }
      break
    case 'queue':
      bars(ctx, [0.2, 0.42, 0.64])
      line(ctx, 0.82, 0.5, 0.94, 0.5)
      break
    case 'topic':
      circle(ctx, 0.22, 0.5, 0.1)
      arrowTo(ctx, 0.34, 0.46, 0.76, 0.2, 0.08)
      arrowTo(ctx, 0.34, 0.5, 0.78, 0.5, 0.08)
      arrowTo(ctx, 0.34, 0.54, 0.76, 0.8, 0.08)
      break
    case 'stream':
      for (const y of [0.3, 0.5, 0.7]) line(ctx, 0.12, y, 0.76, y)
      arrowTo(ctx, 0.76, 0.5, 0.92, 0.5, 0.08)
      break
    case 'eventbus':
      line(ctx, 0.1, 0.6, 0.9, 0.6)
      for (const x of [0.24, 0.5, 0.76]) line(ctx, x, 0.6, x, 0.34)
      for (const x of [0.24, 0.5, 0.76]) { rr(ctx, x - 0.09, 0.14, 0.18, 0.2, 0.04); ctx.stroke() }
      break
    case 'dlq':
      bars(ctx, [0.16, 0.38])
      circle(ctx, 0.74, 0.5, 0.16)
      line(ctx, 0.64, 0.4, 0.84, 0.6); line(ctx, 0.84, 0.4, 0.64, 0.6)
      break
    case 'outbox':
      ctx.beginPath()
      ctx.moveTo(0.14, 0.5); ctx.lineTo(0.14, 0.84); ctx.lineTo(0.86, 0.84); ctx.lineTo(0.86, 0.5)
      ctx.lineTo(0.66, 0.5); ctx.lineTo(0.6, 0.62); ctx.lineTo(0.4, 0.62); ctx.lineTo(0.34, 0.5)
      ctx.closePath(); ctx.stroke()
      arrowTo(ctx, 0.5, 0.14, 0.5, 0.42, 0.09)
      break

    /* storage and search */
    case 'objectstore': bucket(ctx); break
    case 'filestore':
      ctx.beginPath()
      ctx.moveTo(0.12, 0.78); ctx.lineTo(0.12, 0.26); ctx.lineTo(0.4, 0.26)
      ctx.lineTo(0.48, 0.36); ctx.lineTo(0.88, 0.36); ctx.lineTo(0.88, 0.78)
      ctx.closePath(); ctx.stroke()
      break
    case 'blockstore':
      stack(ctx, 3, 0.2, 0.2, 0.6, 0.16, 0.06)
      break
    case 'search':
      circle(ctx, 0.44, 0.42, 0.24)
      line(ctx, 0.62, 0.6, 0.86, 0.86)
      break
    case 'bloom':
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const x = 0.2 + i * 0.24, y = 0.2 + j * 0.24
        if ((i + j) % 2 === 0) { circle(ctx, x, y, 0.07) } else { rr(ctx, x - 0.06, y - 0.06, 0.12, 0.12, 0.02); ctx.stroke() }
      }
      break
    case 'blob':
      rr(ctx, 0.12, 0.22, 0.76, 0.56, 0.06); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0.2, 0.7); ctx.lineTo(0.42, 0.44); ctx.lineTo(0.58, 0.62)
      ctx.lineTo(0.68, 0.52); ctx.lineTo(0.8, 0.7); ctx.stroke()
      circle(ctx, 0.34, 0.36, 0.05)
      break

    /* data processing */
    case 'etl':
      cyl(ctx, 0.16, 0.3, 0.7, 0.13)
      arrowTo(ctx, 0.34, 0.5, 0.62, 0.5, 0.09)
      cyl(ctx, 0.84, 0.3, 0.7, 0.13)
      break
    case 'batch':
      stack(ctx, 3, 0.18, 0.18, 0.5, 0.16, 0.06)
      arrowTo(ctx, 0.74, 0.5, 0.92, 0.5, 0.08)
      break
    case 'streamproc':
      for (const y of [0.32, 0.68]) line(ctx, 0.1, y, 0.36, y)
      rr(ctx, 0.36, 0.24, 0.28, 0.52, 0.06); ctx.stroke()
      arrowTo(ctx, 0.64, 0.5, 0.92, 0.5, 0.09)
      break
    case 'cdc':
      cyl(ctx, 0.28, 0.24, 0.76, 0.2)
      arrowTo(ctx, 0.52, 0.5, 0.9, 0.5, 0.09)
      line(ctx, 0.62, 0.36, 0.62, 0.64)
      break
    case 'ml':
      circle(ctx, 0.24, 0.3, 0.08); circle(ctx, 0.24, 0.7, 0.08)
      circle(ctx, 0.54, 0.5, 0.08); circle(ctx, 0.84, 0.5, 0.08)
      line(ctx, 0.31, 0.34, 0.47, 0.46); line(ctx, 0.31, 0.66, 0.47, 0.54); line(ctx, 0.62, 0.5, 0.76, 0.5)
      break
    case 'analytics':
      line(ctx, 0.14, 0.86, 0.88, 0.86)
      for (const [x, h] of [[0.22, 0.3], [0.42, 0.5], [0.62, 0.38]] as [number, number][]) {
        rr(ctx, x, 0.86 - h, 0.14, h, 0.02); ctx.stroke()
      }
      break

    /* operations */
    case 'metrics':
      ctx.beginPath(); ctx.moveTo(0.12, 0.62); ctx.lineTo(0.32, 0.62); ctx.lineTo(0.42, 0.3)
      ctx.lineTo(0.54, 0.78); ctx.lineTo(0.64, 0.5); ctx.lineTo(0.88, 0.5); ctx.stroke()
      break
    case 'logs':
      for (const y of [0.26, 0.42, 0.58, 0.74]) line(ctx, 0.16, y, y === 0.58 ? 0.62 : 0.84, y)
      break
    case 'tracing':
      for (const [x, y, w] of [[0.14, 0.26, 0.62], [0.26, 0.5, 0.44], [0.4, 0.74, 0.3]] as [number, number, number][]) {
        rr(ctx, x, y - 0.07, w, 0.14, 0.03); ctx.stroke()
      }
      break
    case 'alerts':
      ctx.beginPath()
      ctx.moveTo(0.26, 0.66); ctx.quadraticCurveTo(0.26, 0.24, 0.5, 0.2)
      ctx.quadraticCurveTo(0.74, 0.24, 0.74, 0.66); ctx.lineTo(0.8, 0.72); ctx.lineTo(0.2, 0.72)
      ctx.closePath(); ctx.stroke()
      ctx.beginPath(); ctx.arc(0.5, 0.78, 0.07, 0, Math.PI); ctx.stroke()
      break
    case 'config':
      for (const y of [0.28, 0.5, 0.72]) { line(ctx, 0.14, y, 0.86, y); circle(ctx, y === 0.5 ? 0.64 : 0.36, y, 0.065) }
      break
    case 'discovery':
      circle(ctx, 0.5, 0.5, 0.12)
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2
        circle(ctx, 0.5 + Math.cos(a) * 0.32, 0.5 + Math.sin(a) * 0.32, 0.075)
        line(ctx, 0.5 + Math.cos(a) * 0.14, 0.5 + Math.sin(a) * 0.14,
                 0.5 + Math.cos(a) * 0.24, 0.5 + Math.sin(a) * 0.24)
      }
      break
    case 'consensus':
      circle(ctx, 0.5, 0.22, 0.1)
      circle(ctx, 0.22, 0.72, 0.1); circle(ctx, 0.5, 0.72, 0.1); circle(ctx, 0.78, 0.72, 0.1)
      line(ctx, 0.44, 0.3, 0.28, 0.63); line(ctx, 0.5, 0.32, 0.5, 0.62); line(ctx, 0.56, 0.3, 0.72, 0.63)
      break
    case 'secrets':
      rr(ctx, 0.24, 0.44, 0.52, 0.42, 0.06); ctx.stroke()
      ctx.beginPath(); ctx.arc(0.5, 0.44, 0.17, Math.PI, 0); ctx.stroke()
      circle(ctx, 0.5, 0.64, 0.05)
      break
    case 'auth':
      person(ctx, 0.38, 0.5, 0.86)
      circle(ctx, 0.74, 0.42, 0.11)
      line(ctx, 0.74, 0.53, 0.74, 0.74); line(ctx, 0.74, 0.62, 0.86, 0.62)
      break
    case 'backup':
      cyl(ctx, 0.36, 0.26, 0.74, 0.22)
      arrowTo(ctx, 0.62, 0.5, 0.9, 0.5, 0.09)
      ctx.setLineDash([0.05, 0.04]); rr(ctx, 0.66, 0.28, 0.28, 0.44, 0.05); ctx.stroke(); ctx.setLineDash([])
      break

    /* external and boundaries */
    case 'external':
      ctx.setLineDash([0.07, 0.06]); rr(ctx, 0.14, 0.22, 0.72, 0.56, 0.08); ctx.stroke(); ctx.setLineDash([])
      arrowTo(ctx, 0.38, 0.62, 0.64, 0.36, 0.1)
      break
    case 'payment':
      rr(ctx, 0.12, 0.28, 0.76, 0.46, 0.06); ctx.stroke()
      line(ctx, 0.12, 0.44, 0.88, 0.44)
      line(ctx, 0.22, 0.62, 0.42, 0.62)
      break
    case 'email':
      rr(ctx, 0.12, 0.28, 0.76, 0.46, 0.05); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0.12, 0.32); ctx.lineTo(0.5, 0.56); ctx.lineTo(0.88, 0.32); ctx.stroke()
      break
    case 'sms':
      ctx.beginPath()
      ctx.moveTo(0.16, 0.24); ctx.lineTo(0.84, 0.24); ctx.lineTo(0.84, 0.66)
      ctx.lineTo(0.44, 0.66); ctx.lineTo(0.28, 0.82); ctx.lineTo(0.28, 0.66)
      ctx.lineTo(0.16, 0.66); ctx.closePath(); ctx.stroke()
      break
    case 'push':
      rr(ctx, 0.34, 0.14, 0.32, 0.6, 0.06); ctx.stroke()
      circle(ctx, 0.5, 0.66, 0.035)
      ctx.beginPath(); ctx.arc(0.72, 0.3, 0.12, -0.9, 0.9); ctx.stroke()
      ctx.beginPath(); ctx.arc(0.72, 0.3, 0.2, -0.8, 0.8); ctx.stroke()
      break
    case 'webhook':
      circle(ctx, 0.3, 0.3, 0.12)
      ctx.beginPath(); ctx.moveTo(0.36, 0.4); ctx.quadraticCurveTo(0.56, 0.62, 0.76, 0.56); ctx.stroke()
      arrowTo(ctx, 0.6, 0.78, 0.86, 0.78, 0.09)
      break
    case 'region':
      ctx.setLineDash([0.08, 0.06])
      rr(ctx, 0.1, 0.18, 0.8, 0.64, 0.08); ctx.stroke()
      ctx.setLineDash([])
      rr(ctx, 0.24, 0.34, 0.22, 0.3, 0.04); ctx.stroke()
      rr(ctx, 0.54, 0.34, 0.22, 0.3, 0.04); ctx.stroke()
      break
    case 'cloud': cloud(ctx, 0.5, 0.52, 1.15); break

    default:
      rr(ctx, 0.16, 0.24, 0.68, 0.52, 0.06)
      ctx.stroke()
  }
}
