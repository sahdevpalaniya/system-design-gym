import type { LangLesson } from '@/lib/types'

/**
 * Project 3 — a small shop. Adds the three things the first two projects did
 * not need: roles, files on disk, and money that must not be lost.
 */
export const PROJECT_SHOP: LangLesson[] = [
  {
    slug: 'shop-overview',
    title: 'Project 3 — Small shop: what we are building',
    navTitle: 'Overview and plan',
    oneLine: 'Products, images, a cart and a checkout — where roles, files and transactions arrive.',
    blocks: [
      {
        heading: 'Why a shop is the right third project',
        body: [
          'The expense tracker had accounts, but everybody was the same kind of user. A shop has two kinds: **customers**, who browse and buy, and **admins**, who add products. That difference introduces a new idea.',
          'It also brings two things neither earlier project needed. **Files** — product images have to be uploaded, stored and served. And **money** — when somebody checks out, stock must go down and an order must be created, and it is not acceptable for one of those to happen without the other.',
        ],
      },
      {
        heading: 'The architecture: ports and adapters (hexagonal)',
        body: [
          'Project 1 grouped code by **layer**. Project 2 grouped it by **feature**. This project uses a third shape, and it is the one large Go teams reach for: **ports and adapters**, usually called **hexagonal architecture**, and closely related to what people call Clean Architecture.',
          'The idea in one sentence: **your business rules sit in the middle and depend on nothing; everything that touches the outside world plugs into them.** HTTP, Postgres, the filesystem, a payment provider — none of those are the application. They are things the application talks to.',
        ],
      },
      {
        heading: 'The three words you need',
        table: {
          headers: ['Word', 'What it means', 'In this project'],
          rows: [
            [
              '**Domain**',
              'The types and rules that would still be true with no database and no API. Pure Go.',
              '`internal/core/domain` — Product, Order, Cart',
            ],
            [
              '**Port**',
              'An interface the core declares, describing something it needs. A hole in the side of the hexagon.',
              '`internal/core/port` — `ProductRepository`, `Storage`',
            ],
            [
              '**Adapter**',
              'A concrete implementation that plugs into a port, or drives the core from outside.',
              '`internal/adapter/storage/postgres`, `internal/adapter/handler/http`',
            ],
          ],
        },
      },
      {
        heading: 'The rule that makes it work: dependencies point inwards',
        body: [
          'The core declares the interfaces. The adapters implement them. So the arrow points from the outside **in** — Postgres depends on your core, not the other way around. That single inversion is the whole trick, and it is why this is also called **dependency inversion**.',
        ],
        code: {
          label: 'who imports whom',
          src: `           HTTP handler          Postgres repo        Disk storage
                \\                   |                    /
                 \\                  v                   /
                  ------->   internal/core/port   <------
                                     ^
                                     |            (interfaces, declared by the core)
                            internal/core/service
                                     |
                            internal/core/domain    (pure types, imports nothing)

// core/domain  imports: nothing of yours
// core/port    imports: core/domain
// core/service imports: core/domain, core/port
// adapter/*    imports: core/port, core/domain      <- inwards
// cmd/api      imports: everything, and wires it together`,
          note: 'Notice `core/service` never imports an adapter. It only ever knows the port. That is what lets you swap Postgres for anything else without touching a rule.',
        },
      },
      {
        heading: 'Why this project is the right place for it',
        body: [
          'Hexagonal costs more than the other two layouts: more folders, more interfaces, more indirection. It pays for itself when you really expect the outside world to change — and a shop is exactly that case.',
        ],
        bullets: [
          '**Images start on local disk** and will have to move to S3 once you run more than one instance. With a `Storage` port, that is a second adapter and nothing else changes.',
          '**Payments** are the obvious next feature, and payment providers get swapped. A `PaymentGateway` port keeps that decision out of your rules.',
          '**The rules are worth testing hard.** Checkout arithmetic and stock handling can be tested with fake adapters, with no database and no HTTP anywhere.',
        ],
      },
      {
        heading: 'The three architectures side by side',
        table: {
          headers: ['', 'Layered (P1)', 'By feature (P2)', 'Ports & adapters (P3)'],
          rows: [
            ['Folders named after', 'the kind of code', 'the business concept', 'inside vs outside'],
            ['Best when', 'one concept', 'several concepts, growing', 'the outside world will change'],
            ['Interfaces declared by', 'rarely used', 'the service that needs one', 'always, by the core'],
            ['Cost', 'lowest', 'low', 'highest — more indirection'],
            ['Fails when', 'you add features', 'features start needing each other', 'the app is small (overkill)'],
            ['Common name', 'n-tier, standard layout', 'package-by-feature, DDD-lite', 'hexagonal, clean, onion'],
          ],
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Do not reach for this by default. On a small service it buys you folders and interfaces you will never use, and reviewers will rightly ask why. Project 2\'s layout is the sensible default; this one is what you graduate to when swapping an external dependency stops being hypothetical.',
        },
      },
      {
        heading: 'The endpoints',
        table: {
          headers: ['Method and path', 'What it does', 'Who can call it'],
          rows: [
            ['`GET /v1/products`', 'browse the catalogue', 'anyone'],
            ['`GET /v1/products/{id}`', 'one product', 'anyone'],
            ['`POST /v1/products`', 'add a product', '**admin only**'],
            ['`PATCH /v1/products/{id}`', 'edit a product', '**admin only**'],
            ['`POST /v1/products/{id}/image`', 'upload a product photo', '**admin only**'],
            ['`GET /v1/images/{id}`', 'serve a photo', 'anyone'],
            ['`GET /v1/cart`', 'what is in my cart', 'logged in'],
            ['`POST /v1/cart/items`', 'add to cart', 'logged in'],
            ['`DELETE /v1/cart/items/{id}`', 'remove from cart', 'logged in'],
            ['`POST /v1/checkout`', 'turn the cart into an order', 'logged in'],
            ['`GET /v1/orders`', 'my past orders', 'logged in'],
          ],
        },
      },
      {
        heading: 'Authentication and authorisation are different',
        body: [
          'You already have **authentication**: the middleware from project two proves who somebody is. This project adds **authorisation**: deciding what that person is allowed to do.',
          'They fail differently, and the difference matters. Failing authentication means "I do not know who you are" — that is a **401**. Failing authorisation means "I know who you are and you may not do this" — that is a **403**.',
          'The exception is when confirming a resource exists would itself leak something. Asking for another customer’s order should be a **404**, not a 403, because a 403 tells them the order is real.',
        ],
      },
      {
        heading: 'The steps',
        bullets: [
          '**Step 1** — setup, the schema, and how to store money and stock.',
          '**Step 2** — products, plus the admin role and a second middleware.',
          '**Step 3** — uploading a product image, safely. This is the step with the most ways to go wrong.',
          '**Step 4** — serving images back, and what `io` actually gives you.',
          '**Step 5** — the cart.',
          '**Step 6** — checkout in a transaction, where stock and orders must agree.',
          '**Step 7** — orders, then the production pass: logging, rate limits, Docker.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: 'There is no payment provider in this project. Taking real card details brings legal requirements that are not a learning exercise. Checkout creates an order and reduces stock, which is where all the interesting Go and SQL is anyway.',
        },
      },
    ],
    keyPoints: [
      'Authentication is who you are (401). Authorisation is what you may do (403).',
      'A shop needs two things earlier projects did not: files on disk and money that cannot be lost.',
      'Use 404 instead of 403 when a 403 would confirm something exists.',
      'No real payments — the learning is in the transaction, not the card.',
    ],
    remember:
      'Roles are not a bigger login. They are a separate question asked after login has already been answered.',
    task: 'Write out the endpoint table and mark each row 401, 403 or 404 for the three cases: not logged in, logged in as a customer, logged in as an admin.',
    exercises: [
      {
        task: 'Decide what should happen if two people check out the last item at the same moment.',
        answer:
          'One succeeds, one gets a clear out-of-stock error. Stock must never go negative — that is what step 6 builds.',
      },
      {
        task: 'Decide whether prices should be stored on the product or copied onto the order line, and why.',
        answer:
          'Copied onto the order line. A price change must never rewrite what somebody already paid.',
      },
      {
        task: 'List three things that could go wrong if checkout were not a transaction.',
        answer:
          'Stock drops with no order; an order exists with no items; the cart is emptied but nothing was bought.',
      },
    ],
    refs: [{ label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' }],
  },

  {
    slug: 'shop-step-1-setup',
    title: 'Step 1 — Setup and the schema',
    navTitle: 'Step 1 — Setup and schema',
    oneLine: 'Every command to get from an empty folder to a running server with tables.',
    blocks: [
      {
        heading: 'Every command for this step',
        code: {
          label: 'terminal — run these in order',
          src: `# 1. create the project
mkdir shop && cd shop
go mod init github.com/you/shop

# 2. dependencies
go get github.com/jackc/pgx/v5/stdlib
go get golang.org/x/crypto/bcrypt
go get github.com/golang-jwt/jwt/v5
go get github.com/joho/godotenv

# 3. folders
mkdir -p cmd/api
mkdir -p internal/core/{domain,port,service}
mkdir -p internal/adapter/handler/http/middleware
mkdir -p internal/adapter/storage/{postgres,file}
mkdir -p internal/adapter/auth
mkdir -p internal/config
mkdir -p migrations uploads
echo "uploads/" >> .gitignore
echo ".env"     >> .gitignore

# 4. empty files, so the layout is visible before you fill them
touch cmd/api/main.go
touch internal/config/config.go internal/adapter/storage/postgres/db.go internal/adapter/handler/http/respond.go
touch migrations/001_init.up.sql
touch .env .env.example

# 5. a database
docker run -d --name shop-pg \\
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=shop \\
  -p 5432:5432 postgres:16

# 6. the migration tool
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest`,
        },
      },
      {
        heading: 'The .env file',
        code: {
          label: '.env — fill this in, and copy it to .env.example with empty values',
          src: `PORT=8080
DATABASE_URL=postgres://postgres:secret@localhost:5432/shop?sslmode=disable
JWT_SECRET=change-me-to-at-least-32-random-characters
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=5`,
        },
      },
      {
        heading: 'The schema',
        code: {
          label: 'migrations/001_init.up.sql — paste this in',
          src: `CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents BIGINT NOT NULL CHECK (price_cents >= 0),
  stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_id    BIGINT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE images (
  id          BIGSERIAL PRIMARY KEY,
  stored_name TEXT NOT NULL,
  mime        TEXT NOT NULL,
  size_bytes  BIGINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT NOT NULL CHECK (quantity > 0),
  UNIQUE (user_id, product_id)
);

CREATE TABLE orders (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id),
  total_cents  BIGINT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'placed',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id          BIGSERIAL PRIMARY KEY,
  order_id    BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products(id),
  name        TEXT NOT NULL,
  price_cents BIGINT NOT NULL,
  quantity    INT NOT NULL
);

CREATE INDEX ON orders (user_id, created_at DESC);`,
        },
      },
      {
        tree: {
          caption:
            'The hexagon, as folders. Everything under `core` is your application; everything under `adapter` is the world it talks to.',
          nodes: [
            { depth: 0, name: 'shop', kind: 'dir' },
            { depth: 1, name: 'cmd', kind: 'dir' },
            { depth: 2, name: 'api', kind: 'dir' },
            { depth: 3, name: 'main.go', kind: 'file', note: 'builds the adapters and plugs them into the core' },
            { depth: 1, name: 'internal', kind: 'dir' },
            { depth: 2, name: 'core', kind: 'dir', note: 'THE APPLICATION — knows nothing about HTTP or SQL' },
            { depth: 3, name: 'domain', kind: 'dir', note: 'pure types and rules' },
            { depth: 4, name: 'product.go', kind: 'file', note: 'Product, and what makes one valid' },
            { depth: 4, name: 'order.go', kind: 'file', note: 'Order, OrderItem' },
            { depth: 4, name: 'cart.go', kind: 'file' },
            { depth: 3, name: 'port', kind: 'dir', note: 'interfaces the core needs — the holes in the hexagon' },
            { depth: 4, name: 'repository.go', kind: 'file', note: 'ProductRepository, OrderRepository' },
            { depth: 4, name: 'storage.go', kind: 'file', note: 'Storage — Save, Open, Remove for files' },
            { depth: 3, name: 'service', kind: 'dir', note: 'the rules, written against ports only' },
            { depth: 4, name: 'product.go', kind: 'file' },
            { depth: 4, name: 'cart.go', kind: 'file' },
            { depth: 4, name: 'order.go', kind: 'file', note: 'checkout lives here' },
            { depth: 2, name: 'adapter', kind: 'dir', note: 'THE OUTSIDE WORLD — plugs into the ports' },
            { depth: 3, name: 'handler', kind: 'dir', note: 'driving adapters: things that call the core' },
            { depth: 4, name: 'http', kind: 'dir' },
            { depth: 5, name: 'product.go', kind: 'file' },
            { depth: 5, name: 'image.go', kind: 'file' },
            { depth: 5, name: 'respond.go', kind: 'file' },
            { depth: 5, name: 'middleware', kind: 'dir' },
            { depth: 6, name: 'role.go', kind: 'file' },
            { depth: 3, name: 'storage', kind: 'dir', note: 'driven adapters: things the core calls' },
            { depth: 4, name: 'postgres', kind: 'dir' },
            { depth: 5, name: 'product.go', kind: 'file', note: 'implements port.ProductRepository' },
            { depth: 5, name: 'order.go', kind: 'file' },
            { depth: 4, name: 'file', kind: 'dir' },
            { depth: 5, name: 'image.go', kind: 'file', note: 'implements port.Storage — swap for s3/ later' },
            { depth: 3, name: 'auth', kind: 'dir' },
            { depth: 4, name: 'jwt.go', kind: 'file' },
            { depth: 2, name: 'config', kind: 'dir' },
            { depth: 1, name: 'migrations', kind: 'dir' },
          ],
        },
      },
      {
        heading: 'Four decisions in that schema',
        table: {
          headers: ['Decision', 'Why'],
          rows: [
            [
              '`CHECK (stock >= 0)`',
              'The database refuses to go below zero. Even a buggy checkout cannot oversell — the transaction fails instead.',
            ],
            [
              '`UNIQUE (user_id, product_id)` on cart_items',
              'Adding the same product twice updates the quantity rather than creating a second row. The constraint makes that the only possible outcome.',
            ],
            [
              '`order_items` copies `name` and `price_cents`',
              'This looks like duplication, and it is on purpose. An order must show what was paid **then**. If it pointed at the product, changing the price would silently rewrite history.',
            ],
            [
              '`role` with a CHECK, not a boolean',
              'A boolean `is_admin` cannot grow. A text column with a CHECK adds a third role later by changing one line.',
            ],
          ],
        },
      },
      {
        callout: {
          tone: 'warn',
          text: 'Copying the price onto the order line is the most commonly missed decision in shop schemas. Without it, a price change rewrites every past order and your accounts stop adding up.',
        },
      },
      {
        heading: 'Run the migration and check it',
        code: {
          label: 'terminal',
          src: `# apply it
migrate -path migrations -database "$DATABASE_URL" up

# check
docker exec -it shop-pg psql -U postgres -d shop -c '\\dt'
docker exec -it shop-pg psql -U postgres -d shop -c '\\d products'

# make yourself an admin later with:
# UPDATE users SET role = 'admin' WHERE email = 'you@example.com';`,
        },
      },
      {
        heading: 'Copy the shared files from project two',
        body: [
          'The config package, the database pool, the JSON helpers, the user package and the auth middleware are the same as project two. Copy them across rather than retyping them — reusing your own earlier work is the point of having built it.',
        ],
        code: {
          label: 'terminal',
          src: `# The same code, but it moves to where this architecture expects it.
cp    ../expenses/internal/config/config.go        internal/config/
cp    ../expenses/internal/database/db.go          internal/adapter/storage/postgres/
cp    ../expenses/internal/httpx/json.go           internal/adapter/handler/http/respond.go
cp    ../expenses/internal/middleware/auth.go      internal/adapter/handler/http/middleware/
cp    ../expenses/internal/user/user.go            internal/core/domain/user.go
cp    ../expenses/internal/user/service.go         internal/core/service/user.go
cp    ../expenses/internal/user/repository.go      internal/adapter/storage/postgres/user.go
cp    ../expenses/internal/user/handler.go         internal/adapter/handler/http/user.go

# then fix the module path in every copied file
grep -rl 'github.com/you/expenses' internal/ | xargs sed -i 's|github.com/you/expenses|github.com/you/shop|g'

go mod tidy
go build ./...`,
          note: 'That grep + sed is worth learning. Renaming a module path by hand across twenty files is how you miss one.',
        },
      },
      {
        heading: 'Confirm it runs',
        code: {
          label: 'terminal',
          src: `go run ./cmd/api
# in another terminal
curl -s localhost:8080/healthz
curl -s -X POST localhost:8080/v1/auth/register \\
  -d '{"name":"Admin","email":"admin@shop.test","password":"password123"}'

# promote that user to admin
docker exec -it shop-pg psql -U postgres -d shop \\
  -c "UPDATE users SET role='admin' WHERE email='admin@shop.test';"`,
        },
      },
    ],
    keyPoints: [
      'Let the database enforce stock, quantities and roles with CHECK constraints.',
      'Copy the price and name onto the order line, so history does not change when a product does.',
      'A `role` text column with a CHECK beats a boolean, because a third role costs one line.',
      'Reuse the config, database, httpx, user and middleware packages you already built.',
    ],
    remember:
      'An order records what was true at the time it was placed. Anything it points at can change; anything it copies cannot.',
    task: 'Run every command in this step, apply the migration, register a user, and promote them to admin in psql. Then try to insert a product with negative stock and read the error.',
    exercises: [
      {
        task: 'Insert a `role` of `superuser` and watch the CHECK reject it.',
        answer:
          '`violates check constraint`. The list of valid roles lives in the schema, so no bug can invent one.',
      },
      {
        task: 'Add the same product to a cart twice and see the UNIQUE constraint stop the second row.',
        answer:
          'The second insert is rejected — which is exactly what `ON CONFLICT DO UPDATE` then turns into an increment.',
      },
      {
        task: 'Write the `001_init.down.sql` that undoes this migration cleanly.',
        answer:
          'Drop the tables in reverse dependency order: order_items, orders, cart_items, images, products, users.',
      },
      {
        task: 'Work out what breaks if `order_items` pointed at the product instead of copying its price.',
        answer:
          'Changing a price silently rewrites every past order, and deleting a product destroys order history. Your accounts stop reconciling.',
      },
    ],
    refs: [
      { label: 'Accessing databases', href: 'https://go.dev/doc/database/index' },
      { label: 'golang-migrate', href: 'https://github.com/golang-migrate/migrate' },
    ],
  },

  {
    slug: 'shop-step-2-roles',
    title: 'Step 2 — Products and the admin role',
    navTitle: 'Step 2 — Roles',
    oneLine: 'A second middleware, because knowing who somebody is does not tell you what they may do.',
    blocks: [
      {
        heading: 'What a role is',
        body: [
          'A **role** is a label on a user that decides what they are allowed to do. This shop has two: `customer` and `admin`. Adding a product is admin-only; browsing is open to everyone.',
          'The existing middleware answers "who are you" and puts the user id in the context. This step adds a second one that answers "may you do this" — and it has to run **after** the first, because it needs to know who the user is before it can look up their role.',
        ],
      },
      {
        heading: 'Carry the role in the token',
        body: [
          'You could look the role up in the database on every admin request. Putting it in the token avoids that query, at a cost worth stating plainly: if you demote an admin, their existing token keeps admin rights until it expires — up to fifteen minutes.',
          'For this project that is an acceptable trade. For a bank it would not be, and there you would take the extra query.',
        ],
        code: {
          label: 'internal/adapter/auth/jwt.go — add the role claim',
          src: `type Claims struct {
\tRole string \`json:"role"\`
\tjwt.RegisteredClaims
}

func (s *Service) issueToken(userID int64, role string) (string, error) {
\tclaims := Claims{
\t\tRole: role,
\t\tRegisteredClaims: jwt.RegisteredClaims{
\t\t\tSubject:   strconv.FormatInt(userID, 10),
\t\t\tIssuedAt:  jwt.NewNumericDate(time.Now()),
\t\t\tExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
\t\t},
\t}
\treturn jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secret)
}`,
        },
      },
      {
        heading: 'The second middleware',
        code: {
          label: 'internal/adapter/handler/http/middleware/role.go — create this file',
          src: `package middleware

type roleKey struct{}

// RequireRole must run AFTER RequireAuth, which is what puts the role in the
// context in the first place.
func RequireRole(role string) func(http.Handler) http.Handler {
\treturn func(next http.Handler) http.Handler {
\t\treturn http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
\t\t\tgot, ok := r.Context().Value(roleKey{}).(string)
\t\t\tif !ok {
\t\t\t\t// no role in the context means RequireAuth did not run
\t\t\t\thttpx.Error(w, 401, "unauthorized")
\t\t\t\treturn
\t\t\t}
\t\t\tif got != role {
\t\t\t\t// we know who they are; they simply may not do this
\t\t\t\thttpx.Error(w, 403, "forbidden")
\t\t\t\treturn
\t\t\t}
\t\t\tnext.ServeHTTP(w, r)
\t\t})
\t}
}`,
          note: '401 when we do not know you, 403 when we do and the answer is still no. Two different problems, two different codes.',
        },
      },
      {
        heading: 'Wiring public, private and admin routes',
        code: {
          label: 'cmd/api/main.go',
          src: `protect := middleware.RequireAuth(cfg.JWTSecret)
adminOnly := middleware.RequireRole("admin")

// public — anyone can browse
mux.HandleFunc("GET /v1/products", productH.List)
mux.HandleFunc("GET /v1/products/{id}", productH.Get)

// admin only — note the order: authenticate first, then check the role
mux.Handle("POST /v1/products",
\tprotect(adminOnly(http.HandlerFunc(productH.Create))))
mux.Handle("PATCH /v1/products/{id}",
\tprotect(adminOnly(http.HandlerFunc(productH.Update))))`,
          note: 'protect(adminOnly(handler)) reads inside-out: protect runs first, then adminOnly, then the handler. Getting that order backwards means the role check runs before anyone has been identified.',
        },
      },
      {
        heading: 'The product handler',
        code: {
          label: 'internal/adapter/handler/http/product.go — create this file',
          src: `func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
\tvar in CreateRequest

\tdec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
\tdec.DisallowUnknownFields()
\tif err := dec.Decode(&in); err != nil {
\t\thttpx.Error(w, 400, "invalid json")
\t\treturn
\t}

\tp, err := h.svc.Create(r.Context(), in)
\tif err != nil {
\t\thttpx.FromError(w, err)
\t\treturn
\t}
\thttpx.JSON(w, 201, p)
}`,
        },
      },
      {
        heading: 'Prices arrive as cents, and are validated',
        code: {
          label: 'internal/core/service/product.go — create this file',
          src: `func (s *Service) Create(ctx context.Context, req CreateRequest) (*Product, error) {
\tif strings.TrimSpace(req.Name) == "" {
\t\treturn nil, fmt.Errorf("%w: name is required", ErrValidation)
\t}
\tif req.PriceCents < 0 {
\t\treturn nil, fmt.Errorf("%w: price cannot be negative", ErrValidation)
\t}
\tif req.PriceCents > 100_000_000 {
\t\treturn nil, fmt.Errorf("%w: price is unrealistically high", ErrValidation)
\t}
\tif req.Stock < 0 {
\t\treturn nil, fmt.Errorf("%w: stock cannot be negative", ErrValidation)
\t}

\tp := &Product{
\t\tName:       strings.TrimSpace(req.Name),
\t\tPriceCents: req.PriceCents,      // the API speaks cents, never 12.99
\t\tStock:      req.Stock,
\t\tActive:     true,
\t}
\treturn p, s.repo.Create(ctx, p)
}`,
          note: 'The upper bound is not paranoia. Without it, one typo creates a £1,000,000 product, and someone will find it.',
        },
      },
      {
        heading: 'Test all three levels',
        code: {
          label: 'terminal',
          src: `# get two tokens
ADMIN=$(curl -s -X POST localhost:8080/v1/auth/login \\
  -d '{"email":"admin@shop.test","password":"password123"}' | jq -r .access_token)

CUST=$(curl -s -X POST localhost:8080/v1/auth/login \\
  -d '{"email":"customer@shop.test","password":"password123"}' | jq -r .access_token)

# no token at all → 401
curl -si -X POST localhost:8080/v1/products \\
  -d '{"name":"Mug","price_cents":999,"stock":10}' | head -1

# customer token → 403
curl -si -X POST localhost:8080/v1/products -H "Authorization: Bearer $CUST" \\
  -d '{"name":"Mug","price_cents":999,"stock":10}' | head -1

# admin token → 201
curl -si -X POST localhost:8080/v1/products -H "Authorization: Bearer $ADMIN" \\
  -d '{"name":"Mug","price_cents":999,"stock":10}' | head -1

# browsing needs no token at all → 200
curl -si localhost:8080/v1/products | head -1`,
          note: 'Those four requests are the whole feature. Run all four every time you touch the middleware.',
        },
      },
    ],
    keyPoints: [
      'Authentication and authorisation are separate middlewares, and the order matters.',
      '401 means we do not know you. 403 means we do, and the answer is no.',
      'A role in the token saves a query, at the cost of staying valid until the token expires. Say that out loud.',
      'Validate an upper bound on price, not just a lower one.',
    ],
    remember:
      'Knowing who somebody is tells you nothing about what they may do. Those are two questions and they deserve two checks.',
    task: 'Add the role claim, the role middleware, and product create/update. Then run all four curl checks and confirm you get 401, 403, 201 and 200.',
    exercises: [
      {
        task: 'Swap the wrapping order to `adminOnly(protect(...))` and work out what breaks.',
        answer:
          'The role check runs before anyone is identified, so there is no role in the context and every request gets 401 — including admins.',
      },
      {
        task: 'Demote an admin in psql and see how long their existing token still works.',
        answer:
          'Up to fifteen minutes, until their current token expires. That is the cost of putting the role in the token.',
      },
      {
        task: 'Add a third role, `staff`, that may edit products but not create them.',
        answer:
          'Add it to the CHECK constraint and write a middleware that accepts a set of roles rather than one. That is why role is text, not a boolean.',
      },
      {
        task: 'Try to create a product with a price of `-500` and with `999999999999`.',
        answer:
          'Both rejected — one by your lower bound, one by the upper. Without the upper bound a typo creates a product nobody can afford.',
      },
    ],
    refs: [
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
    ],
  },

  {
    slug: 'shop-step-3-uploads',
    title: 'Step 3 — Uploading a product image',
    navTitle: 'Step 3 — Image upload',
    oneLine: 'The endpoint with the most ways to go wrong, and the four defences that fix them.',
    blocks: [
      {
        heading: 'What multipart means',
        body: [
          'A normal JSON request has one body. Uploading a file usually needs two things at once — the file itself and some fields describing it — so browsers use a format called **multipart/form-data**, which packs several named parts into one body.',
          'Go parses it for you with `r.ParseMultipartForm`, and `r.FormFile("file")` hands back the part you want. The parsing is the easy bit. The safety is not.',
        ],
      },
      {
        heading: 'Every default here is wrong',
        bullets: [
          '**Size:** by default Go will read as much as the client sends. A 4GB upload takes your process down before any of your checks run.',
          '**Type:** the file extension and the `Content-Type` header both come from the client, so both can lie.',
          '**Name:** a filename of `../../etc/passwd` writes wherever it likes if you use it to build a path.',
          '**Cleanup:** if the file is written and the database row fails, you have a file nothing points at, forever.',
        ],
      },
      {
        heading: 'Part 1 — cap the body, then read the file',
        body: [
          'The size cap has to come first, before anything reads the body. `ParseMultipartForm` gets the same limit so it cannot buffer more than you allow.',
        ],
        code: {
          label: 'internal/adapter/handler/http/image.go — start the file',
          src: `func (h *Handler) Upload(w http.ResponseWriter, r *http.Request) {
\tconst maxBytes = 5 << 20                       // 5 MB

\t// DEFENCE 1 — cap the body before anything reads it.
\tr.Body = http.MaxBytesReader(w, r.Body, maxBytes)
\tif err := r.ParseMultipartForm(maxBytes); err != nil {
\t\thttpx.Error(w, 413, "file too large")
\t\treturn
\t}

\tfile, hdr, err := r.FormFile("file")
\tif err != nil {
\t\thttpx.Error(w, 400, "a file field is required")
\t\treturn
\t}
\tdefer file.Close()`,
        },
      },
      {
        heading: 'Part 2 — check what the file really is',
        body: [
          'Read the first 512 bytes, ask Go what they look like, and reject anything not on your list. Then rewind, because you have just consumed part of the file.',
        ],
        code: {
          label: 'internal/adapter/handler/http/image.go — continue',
          src: `\t// DEFENCE 2 — sniff the real type from the first 512 bytes.
\thead := make([]byte, 512)
\tn, _ := file.Read(head)
\tmime := http.DetectContentType(head[:n])
\tif !allowed[mime] {
\t\thttpx.Error(w, 415, "unsupported file type: "+mime)
\t\treturn
\t}
\tif _, err := file.Seek(0, io.SeekStart); err != nil {   // rewind before copying
\t\thttpx.Error(w, 500, "storage error")
\t\treturn
\t}`,
          note: 'Forgetting the Seek is a bug you only notice later: every stored file is missing its first 512 bytes.',
        },
      },
      {
        heading: 'Part 3 — you choose the filename, and you stream it',
        body: [
          'The client never gets to influence the path. Generate a random name, join it to your upload directory, and stream the bytes across.',
        ],
        code: {
          label: 'internal/adapter/handler/http/image.go — continue',
          src: `\t// DEFENCE 3 — we choose the filename. The client never touches the path.
\tvar b [16]byte
\tif _, err := rand.Read(b[:]); err != nil {              // crypto/rand
\t\thttpx.Error(w, 500, "storage error")
\t\treturn
\t}
\tstored := hex.EncodeToString(b[:]) + extFor(mime)
\tdst := filepath.Join(h.uploadDir, stored)

\tout, err := os.Create(dst)
\tif err != nil {
\t\thttpx.Error(w, 500, "storage error")
\t\treturn
\t}
\tdefer out.Close()

\tsize, err := io.Copy(out, file)                         // streams; memory stays flat
\tif err != nil {
\t\tos.Remove(dst)
\t\thttpx.Error(w, 500, "write failed")
\t\treturn
\t}`,
        },
      },
      {
        heading: 'Part 4 — record it, and clean up if that fails',
        body: [
          'The file is on disk. If the database row fails now, that file is orphaned — nothing will ever point at it or delete it. So remove it on the failure path.',
        ],
        code: {
          label: 'internal/adapter/handler/http/image.go — finish the file',
          src: `\timg := &Image{StoredName: stored, MIME: mime, SizeBytes: size}

\t// DEFENCE 4 — no orphans. If the row fails, the file goes too.
\tif err := h.svc.Save(r.Context(), img); err != nil {
\t\tos.Remove(dst)
\t\thttpx.FromError(w, err)
\t\treturn
\t}

\t_ = hdr.Filename          // keep only for display, never for a path
\thttpx.JSON(w, 201, img)
}

var allowed = map[string]bool{
\t"image/jpeg": true,
\t"image/png":  true,
\t"image/gif":  true,
\t"image/webp": true,
}`,
        },
      },
      {
        heading: 'Why io.Copy and not io.ReadAll',
        body: [
          '`io.ReadAll` pulls the entire file into memory before writing it. Ten people uploading 5MB at the same time is 50MB of heap, and it grows exactly as badly as that suggests.',
          '`io.Copy` streams through a small fixed buffer, so memory stays flat no matter how big the file is. This is what `io.Reader` and `io.Writer` exist for — an uploaded file and a file on disk are both just somewhere bytes come from and go to.',
        ],
      },
      {
        callout: {
          tone: 'warn',
          text: '`http.DetectContentType` reads the file’s magic bytes, so it tells you what the file really is. It is a **type** check, not a malware check. And never serve uploads from your own domain at a guessable path — a stored HTML or SVG that a browser renders is stored cross-site scripting on your own origin.',
        },
      },
      {
        heading: 'Try to break it yourself',
        code: {
          label: 'terminal — all five of these must be rejected or contained',
          src: `# a real image → 201
curl -si -X POST localhost:8080/v1/products/1/image \\
  -H "Authorization: Bearer $ADMIN" -F "file=@photo.jpg" | head -1

# too big → 413
head -c 50M /dev/urandom > big.bin
curl -si -X POST localhost:8080/v1/products/1/image \\
  -H "Authorization: Bearer $ADMIN" -F "file=@big.bin" | head -1

# a script wearing a .jpg name → 415
echo '#!/bin/sh' > evil.sh && cp evil.sh evil.jpg
curl -si -X POST localhost:8080/v1/products/1/image \\
  -H "Authorization: Bearer $ADMIN" -F "file=@evil.jpg" | head -1

# a path in the filename → stored under a name WE generated
curl -si -X POST localhost:8080/v1/products/1/image \\
  -H "Authorization: Bearer $ADMIN" \\
  -F "file=@photo.jpg;filename=../../../tmp/evil.jpg" | head -1
ls /tmp/evil.jpg          # must not exist

# a customer trying to upload → 403
curl -si -X POST localhost:8080/v1/products/1/image \\
  -H "Authorization: Bearer $CUST" -F "file=@photo.jpg" | head -1`,
        },
      },
    ],
    keyPoints: [
      '`MaxBytesReader` before anything reads the body, then `ParseMultipartForm` with the same limit.',
      'Sniff the type with `http.DetectContentType`. Never trust the extension or the client header.',
      'Generate the stored filename with `crypto/rand`. The client filename is display text only.',
      '`io.Copy` streams; if the database insert fails, `os.Remove` the file.',
    ],
    remember:
      'Every part of an upload is attacker-controlled: the size, the name, the type and the contents. Decide all four yourself.',
    task: 'Build the upload endpoint and run all five attacks above. Every one must be rejected or safely contained.',
    exercises: [
      {
        task: 'Replace `io.Copy` with `io.ReadAll` and watch memory while uploading a large file.',
        answer:
          'Memory rises by the size of the file, per concurrent upload. `io.Copy` stays flat because it streams through a small buffer.',
      },
      {
        task: 'Remove the MIME check and upload an SVG containing a script tag. Then put the check back.',
        answer:
          'It is stored, and served from your own domain a browser may execute it. That is stored cross-site scripting — put the check back.',
      },
      {
        task: 'Make the database insert fail on purpose and confirm the file is removed from disk.',
        answer:
          'The file is removed from disk. Without that cleanup you accumulate files nothing references and no job deletes.',
      },
      {
        task: 'Add SHA-256 dedup with `io.TeeReader`, so the same photo uploaded twice is stored once.',
        answer:
          'The hash comes free while streaming, so a second upload of the same photo stores one file and two rows.',
      },
    ],
    refs: [
      { label: 'mime/multipart', href: 'https://pkg.go.dev/mime/multipart' },
      { label: 'Go Security Best Practices', href: 'https://go.dev/doc/security/best-practices' },
    ],
  },

  {
    slug: 'shop-step-4-serving',
    title: 'Step 4 — Serving images, and what io gives you',
    navTitle: 'Step 4 — Serving files',
    oneLine: 'Send the file back safely, and see why one-method interfaces make everything fit together.',
    blocks: [
      {
        heading: 'The download handler',
        code: {
          label: 'internal/adapter/handler/http/image.go — add this',
          src: `func (h *Handler) Serve(w http.ResponseWriter, r *http.Request) {
\tid, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
\tif err != nil {
\t\thttp.NotFound(w, r)
\t\treturn
\t}

\timg, err := h.svc.Get(r.Context(), id)
\tif err != nil {
\t\thttp.NotFound(w, r)
\t\treturn
\t}

\tw.Header().Set("Content-Type", img.MIME)
\tw.Header().Set("X-Content-Type-Options", "nosniff")   // do not guess the type
\tw.Header().Set("Cache-Control", "public, max-age=31536000, immutable")

\t// Names are random and never reused, so this is safe to cache forever.
\thttp.ServeFile(w, r, filepath.Join(h.uploadDir, img.StoredName))
}`,
          note: 'http.ServeFile handles range requests, If-Modified-Since and Content-Length for you. Do not write those by hand.',
        },
      },
      {
        heading: 'Why nosniff matters here',
        body: [
          'Some browsers will ignore the `Content-Type` you send and guess from the file contents instead. If somebody sneaks past your upload checks, that guessing is what turns a stored file into running code on your domain.',
          '`X-Content-Type-Options: nosniff` tells the browser to believe your header and nothing else. One line, and it closes the whole category.',
        ],
      },
      {
        heading: 'What io.Reader and io.Writer actually are',
        body: [
          'These two interfaces are why the Go standard library fits together so well. One method each, and that is the whole definition:',
        ],
        code: {
          label: 'the standard library',
          src: `type Reader interface {
\tRead(p []byte) (n int, err error)
}

type Writer interface {
\tWrite(p []byte) (n int, err error)
}`,
        },
      },
      {
        body: [
          'A file, a network connection, an HTTP request body, a buffer in memory, a gzip stream, a hash and `os.Stdout` are all one or both of these. So any function written against them works with all of them — and, more usefully, you can stack them.',
        ],
        code: {
          label: 'stacking them',
          src: `// move bytes between ANY reader and ANY writer
io.Copy(dst, src)

// hash a file while you write it, at no extra read
h := sha256.New()
tee := io.TeeReader(file, h)
io.Copy(out, tee)
sum := h.Sum(nil)

// a writer wrapping a writer: encode → gzip → HTTP response
gz := gzip.NewWriter(w)
defer gz.Close()
json.NewEncoder(gz).Encode(data)

io.LimitReader(r, 1<<20)        // a reader that stops after 1MB
io.MultiWriter(f, os.Stdout)    // write to a file and the terminal at once`,
          note: 'This is the payoff of small interfaces. One method is why a file, a socket and a buffer can all be used the same way.',
        },
      },
      {
        heading: 'Local disk is fine, until it is not',
        body: [
          'Storing files on local disk is the right first choice: no credentials, no network, easy to debug. It stops working the moment you run more than one instance — instance B cannot serve a file that landed on instance A — or when your container has no disk that survives a restart.',
          'The fix is not to redesign now. Keep the storage calls behind a small type with `Save` and `Open` methods. Swapping local disk for S3 then means writing a second implementation, which is exactly when an interface earns its place.',
        ],
        code: {
          label: 'internal/core/port/storage.go — the shape to aim for',
          src: `// Storage is declared by the code that uses it, so it is exactly this small.
type Storage interface {
\tSave(name string, r io.Reader) (int64, error)
\tOpen(name string) (io.ReadCloser, error)
\tRemove(name string) error
}

// DiskStorage is the only implementation today. An S3 one would be a second
// type with the same three methods, and nothing else would change.
type DiskStorage struct{ dir string }`,
        },
      },
      {
        heading: 'Check it',
        code: {
          label: 'terminal',
          src: `ID=$(curl -s -X POST localhost:8080/v1/products/1/image \\
  -H "Authorization: Bearer $ADMIN" -F "file=@photo.jpg" | jq -r .id)

curl -si localhost:8080/v1/images/$ID | head -5
# Content-Type: image/jpeg
# X-Content-Type-Options: nosniff
# Cache-Control: public, max-age=31536000, immutable

# and it works in a browser
open http://localhost:8080/v1/images/$ID`,
        },
      },
    ],
    keyPoints: [
      '`http.ServeFile` handles ranges and caching. Set `nosniff` so the browser believes your Content-Type.',
      'Random, never-reused filenames mean images can be cached forever.',
      '`io.Reader` and `io.Writer` have one method each — that is why everything composes and stacks.',
      'Keep storage behind three methods so S3 later is a second implementation, not a refactor.',
    ],
    remember:
      'One-method interfaces are the reason files, sockets, buffers and HTTP bodies are interchangeable. It is the best design lesson in the standard library.',
    task: 'Serve images with the right headers, then load one in a real browser. Then write the `Storage` interface and move your disk code behind it.',
    exercises: [
      {
        task: 'Remove `nosniff`, upload an HTML file renamed to `.png`, and see what the browser does. Then put it back.',
        answer:
          'Some browsers ignore your Content-Type and render it as HTML. `nosniff` closes that entirely.',
      },
      {
        task: 'Add gzip to a JSON endpoint with `gzip.NewWriter` and compare response sizes.',
        answer:
          'Typically 70-90% smaller for JSON. Remember `defer gz.Close()`, or the last bytes are never flushed.',
      },
      {
        task: 'Write a second `Storage` implementation that keeps files in a map in memory, and use it in tests.',
        answer:
          'Your tests stop needing a filesystem. That is the moment the interface pays for itself.',
      },
      {
        task: 'Use `io.LimitReader` to cap a download at 1MB and see where it cuts off.',
        answer:
          'It stops at exactly 1MB and reports EOF. It is the reader-side twin of `MaxBytesReader`.',
      },
    ],
    refs: [
      { label: 'io package', href: 'https://pkg.go.dev/io' },
      { label: 'http.ServeFile', href: 'https://pkg.go.dev/net/http#ServeFile' },
    ],
  },

  {
    slug: 'shop-step-5-cart',
    title: 'Step 5 — The cart',
    navTitle: 'Step 5 — The cart',
    oneLine: 'Per-user rows again, plus one SQL trick that removes a whole branch of Go.',
    blocks: [
      {
        heading: 'What a cart is, in database terms',
        body: [
          'A cart is not a special thing. It is rows in `cart_items` belonging to one user: a product, a quantity, and nothing else. There is no cart object, no session, no expiry — the rows are the cart.',
          'Which means everything from project two applies unchanged. Every query is scoped with `WHERE user_id = $1`, and adding to somebody else’s cart has to be impossible rather than merely disallowed.',
        ],
      },
      {
        heading: 'Adding an item — the naive way, and the good one',
        body: [
          'Adding a product already in the cart should increase the quantity, not create a second row. The obvious approach is: SELECT to see if it is there, then INSERT or UPDATE. That is three round trips and a race between the check and the write.',
          'SQL has one statement that does the whole thing, and the `UNIQUE (user_id, product_id)` constraint from step 1 is what makes it work.',
        ],
        code: {
          label: 'internal/adapter/storage/postgres/cart.go — create this file',
          src: `func (r *Repository) AddItem(ctx context.Context, userID, productID int64, qty int) error {
\t_, err := r.db.ExecContext(ctx, \`
\t\tINSERT INTO cart_items (user_id, product_id, quantity)
\t\tVALUES ($1, $2, $3)
\t\tON CONFLICT (user_id, product_id)
\t\tDO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity\`,
\t\tuserID, productID, qty)
\treturn err
}`,
          note: 'ON CONFLICT ... DO UPDATE is called an upsert. One statement, no race, and the branch you would have written in Go disappears.',
        },
      },
      {
        heading: 'Reading the cart with a join',
        body: [
          'The cart rows hold only ids and quantities. To show a cart you also need names, prices and stock — which live on the product. One **join** brings them together in a single query.',
        ],
        code: {
          label: 'internal/adapter/storage/postgres/cart.go',
          src: `func (r *Repository) Items(ctx context.Context, userID int64) ([]Item, error) {
\trows, err := r.db.QueryContext(ctx, \`
\t\tSELECT ci.id, ci.quantity,
\t\t       p.id, p.name, p.price_cents, p.stock
\t\t  FROM cart_items ci
\t\t  JOIN products p ON p.id = ci.product_id
\t\t WHERE ci.user_id = $1
\t\t ORDER BY ci.id\`,
\t\tuserID)
\tif err != nil {
\t\treturn nil, err
\t}
\tdefer rows.Close()

\tvar out []Item
\tfor rows.Next() {
\t\tvar i Item
\t\tif err := rows.Scan(&i.ID, &i.Quantity,
\t\t\t&i.ProductID, &i.Name, &i.PriceCents, &i.Stock); err != nil {
\t\t\treturn nil, err
\t\t}
\t\tout = append(out, i)
\t}
\treturn out, rows.Err()
}`,
          note: 'The alternative — fetch the cart rows, then loop and fetch each product — is the N+1 problem. One join, one round trip.',
        },
      },
      {
        heading: 'Totals belong in Go here, not in SQL',
        body: [
          'A judgement call worth explaining. The monthly report in project two used SQL `SUM` because it added up thousands of rows. A cart has five. Adding those up in Go is clearer and the round trip saved is irrelevant.',
          'The rule is not "always use SQL" or "always use Go" — it is *do the work where the data already is*, and a cart is small enough that it does not matter.',
        ],
        code: {
          label: 'internal/core/service/cart.go',
          src: `func (s *Service) View(ctx context.Context, userID int64) (*Cart, error) {
\titems, err := s.repo.Items(ctx, userID)
\tif err != nil {
\t\treturn nil, err
\t}

\tvar total int64
\tfor _, i := range items {
\t\ttotal += i.PriceCents * int64(i.Quantity)   // integer cents, never floats
\t}

\treturn &Cart{Items: items, TotalCents: total}, nil
}`,
        },
      },
      {
        heading: 'Validate before you insert',
        code: {
          label: 'internal/core/service/cart.go',
          src: `func (s *Service) Add(ctx context.Context, userID, productID int64, qty int) error {
\tif qty < 1 || qty > 99 {
\t\treturn fmt.Errorf("%w: quantity must be between 1 and 99", ErrValidation)
\t}

\tp, err := s.products.GetByID(ctx, productID)
\tif err != nil {
\t\treturn err                     // no such product → 404
\t}
\tif !p.Active {
\t\treturn fmt.Errorf("%w: that product is not for sale", ErrValidation)
\t}
\tif p.Stock < qty {
\t\treturn fmt.Errorf("%w: only %d left", ErrValidation, p.Stock)
\t}

\treturn s.repo.AddItem(ctx, userID, productID, qty)
}`,
          note: 'This stock check is a courtesy, not a guarantee. Between here and checkout somebody else can buy the last one — which is exactly what step 6 has to handle.',
        },
      },
      {
        heading: 'Try it',
        code: {
          label: 'terminal',
          src: `curl -s -X POST localhost:8080/v1/cart/items -H "Authorization: Bearer $CUST" \\
  -d '{"product_id":1,"quantity":2}'

# add the same product again — quantity becomes 3, not a second row
curl -s -X POST localhost:8080/v1/cart/items -H "Authorization: Bearer $CUST" \\
  -d '{"product_id":1,"quantity":1}'

curl -s -H "Authorization: Bearer $CUST" localhost:8080/v1/cart | jq

# another customer sees an empty cart
curl -s -H "Authorization: Bearer $CUST2" localhost:8080/v1/cart | jq`,
        },
      },
    ],
    keyPoints: [
      'A cart is just rows scoped to a user. Nothing about it is special.',
      '`ON CONFLICT ... DO UPDATE` does insert-or-increment in one statement, with no race.',
      'One join beats fetching the cart then looping for each product — that loop is N+1.',
      'Do the arithmetic where the data is. Small set: Go. Large set: SQL.',
    ],
    remember:
      'A stock check when adding to a cart is a courtesy. The only check that counts is the one inside the checkout transaction.',
    task: 'Build the three cart endpoints. Add the same product twice and confirm you get one row with quantity 3. Then check another user sees an empty cart.',
    exercises: [
      {
        task: 'Write the add-to-cart the naive way with SELECT then INSERT, and work out where the race is.',
        answer:
          'Between the SELECT and the INSERT another request can insert the same row. Then your INSERT fails, or you create a duplicate.',
      },
      {
        task: 'Add a product to your cart, delete the product as admin, then view the cart. Decide what should happen.',
        answer:
          'The cascade removes the cart row too. Soft-deleting with `active = false` instead is usually the better product decision.',
      },
      {
        task: 'Try adding a quantity of 0 and of 1000.',
        answer:
          'Both rejected — 0 by the CHECK constraint and your validation, 1000 by your upper bound.',
      },
      {
        task: 'Add 20 different products, then check how many queries viewing the cart takes.',
        answer:
          'One. The join fetches products alongside cart rows — the loop version would be 21.',
      },
    ],
    refs: [
      { label: 'Querying for data', href: 'https://go.dev/doc/database/querying' },
      { label: 'Postgres INSERT ... ON CONFLICT', href: 'https://www.postgresql.org/docs/current/sql-insert.html' },
    ],
  },

  {
    slug: 'shop-step-6-checkout',
    title: 'Step 6 — Checkout, and what a transaction is for',
    navTitle: 'Step 6 — Checkout',
    oneLine: 'Five things must all happen, or none of them. This is what transactions exist for.',
    blocks: [
      {
        heading: 'What a transaction is',
        body: [
          'A **transaction** groups several database statements so they either all take effect or none of them do. You open it, run your statements, and then either **commit** — make it all real — or **roll back** — pretend none of it happened.',
          'Checkout is the textbook case. It has to create an order, copy each cart line onto it, reduce stock for each product, and empty the cart. If the server dies after reducing stock but before creating the order, a customer has been charged nothing and the shop has lost inventory. Without a transaction that is a real outcome.',
        ],
      },
      {
        heading: 'The three problems checkout has to solve',
        table: {
          headers: ['Problem', 'What goes wrong without it', 'The fix'],
          rows: [
            [
              'Partial failure',
              'stock drops but no order exists',
              'one transaction around everything',
            ],
            [
              'Two people, one last item',
              'both succeed, stock goes to -1',
              '`stock >= quantity` in the UPDATE, then check `RowsAffected`',
            ],
            [
              'Prices change mid-checkout',
              'the order total does not match what was charged',
              'copy the price onto the order line',
            ],
          ],
        },
      },
      {
        heading: 'The transaction, with the rollback that always runs',
        code: {
          label: 'internal/adapter/storage/postgres/order.go — create this file',
          src: `// The named return value err is what lets the deferred function know whether
// to roll back. This is the one place naming a return really earns its keep.
func (r *Repository) Checkout(ctx context.Context, userID int64) (o *Order, err error) {
\ttx, err := r.db.BeginTx(ctx, nil)
\tif err != nil {
\t\treturn nil, err
\t}

\tdefer func() {
\t\tif p := recover(); p != nil {
\t\t\ttx.Rollback()
\t\t\tpanic(p)                    // roll back first, then let the panic continue
\t\t}
\t\tif err != nil {
\t\t\ttx.Rollback()               // any error above undoes everything
\t\t}
\t}()

\t// ... the steps below all use tx, never r.db ...

\treturn o, tx.Commit()
}`,
          note: 'Every statement inside must use tx. One stray r.db call happens outside the transaction and will not be rolled back.',
        },
      },
      {
        heading: 'Inside, part 1 — read the cart and lock the products',
        body: [
          '`FOR UPDATE` locks those product rows until the transaction ends, so a second checkout waits rather than racing you. `ORDER BY` matters: two transactions locking the same rows in different orders can deadlock.',
        ],
        code: {
          label: 'internal/adapter/storage/postgres/order.go — inside Checkout',
          src: `\trows, err := tx.QueryContext(ctx, \`
\t\tSELECT ci.product_id, ci.quantity, p.name, p.price_cents
\t\t  FROM cart_items ci
\t\t  JOIN products p ON p.id = ci.product_id
\t\t WHERE ci.user_id = $1
\t\t ORDER BY ci.product_id
\t\t   FOR UPDATE OF p\`, userID)
\tif err != nil {
\t\treturn nil, err
\t}
\titems, err := scanItems(rows)
\tif err != nil {
\t\treturn nil, err
\t}
\tif len(items) == 0 {
\t\treturn nil, ErrEmptyCart
\t}`,
        },
      },
      {
        heading: 'Inside, part 2 — create the order',
        code: {
          label: 'internal/adapter/storage/postgres/order.go — continue',
          src: `\tvar total int64
\tfor _, i := range items {
\t\ttotal += i.PriceCents * int64(i.Quantity)
\t}

\to = &Order{UserID: userID, TotalCents: total, Status: "placed"}
\tif err = tx.QueryRowContext(ctx,
\t\t\`INSERT INTO orders (user_id, total_cents) VALUES ($1, $2)
\t\t RETURNING id, created_at\`,
\t\tuserID, total).Scan(&o.ID, &o.CreatedAt); err != nil {
\t\treturn nil, err
\t}`,
        },
      },
      {
        heading: 'Inside, part 3 — copy each line and take the stock',
        body: [
          'This is the important part of the whole project. Look at the `WHERE` on the UPDATE — the check and the change are one statement, so nothing can slip between them.',
        ],
        code: {
          label: 'internal/adapter/storage/postgres/order.go — continue',
          src: `\tfor _, i := range items {
\t\tif _, err = tx.ExecContext(ctx,
\t\t\t\`INSERT INTO order_items (order_id, product_id, name, price_cents, quantity)
\t\t\t VALUES ($1, $2, $3, $4, $5)\`,
\t\t\to.ID, i.ProductID, i.Name, i.PriceCents, i.Quantity); err != nil {
\t\t\treturn nil, err
\t\t}

\t\t// THE IMPORTANT LINE: only succeeds if there is still enough stock.
\t\tres, uErr := tx.ExecContext(ctx,
\t\t\t\`UPDATE products SET stock = stock - $1
\t\t\t  WHERE id = $2 AND stock >= $1\`,
\t\t\ti.Quantity, i.ProductID)
\t\tif uErr != nil {
\t\t\terr = uErr
\t\t\treturn nil, err
\t\t}
\t\tif n, _ := res.RowsAffected(); n == 0 {
\t\t\terr = fmt.Errorf("%w: %s is out of stock", ErrOutOfStock, i.Name)
\t\t\treturn nil, err       // the deferred rollback undoes everything above
\t\t}
\t}`,
        },
      },
      {
        heading: 'Inside, part 4 — empty the cart',
        code: {
          label: 'internal/adapter/storage/postgres/order.go — finish',
          src: `\tif _, err = tx.ExecContext(ctx,
\t\t\`DELETE FROM cart_items WHERE user_id = $1\`, userID); err != nil {
\t\treturn nil, err
\t}

\treturn o, tx.Commit()`,
          note: 'Only now does anything become real. Until Commit runs, every statement above can still be undone.',
        },
      },
      {
        heading: 'The line that prevents overselling',
        body: [
          'Look closely at `WHERE id = $2 AND stock >= $1`. The check and the change are the same statement, so nothing can happen between them.',
          'Do it the other way — read the stock, check it in Go, then update — and two checkouts can both read "1 left", both decide it is fine, and both subtract. That gap is called a **race condition**, and putting the condition inside the UPDATE removes it entirely.',
          '`RowsAffected() == 0` is then how you find out somebody else got there first.',
        ],
      },
      {
        callout: {
          tone: 'note',
          text: '`FOR UPDATE` locks the product rows until the transaction ends, so concurrent checkouts queue rather than clash. `ORDER BY ci.product_id` matters too: if two transactions lock the same rows in different orders they can deadlock. Always take locks in a consistent order.',
        },
      },
      {
        heading: 'Transaction rules',
        bullets: [
          '**Keep them short.** A transaction holds a connection from the pool for its whole life.',
          '**Never call an external service inside one.** A slow payment provider would hold a database connection and, with enough of them, use up the pool.',
          '**Always use `tx`, never `db`,** for every statement inside.',
          '**Lock rows in a consistent order** everywhere in your codebase, or two transactions will eventually deadlock.',
        ],
      },
      {
        heading: 'Prove it works',
        code: {
          label: 'terminal',
          src: `# set stock to exactly 1
docker exec -it shop-pg psql -U postgres -d shop \\
  -c "UPDATE products SET stock = 1 WHERE id = 1;"

# two customers both put it in their cart
curl -s -X POST localhost:8080/v1/cart/items -H "Authorization: Bearer $CUST"  -d '{"product_id":1,"quantity":1}'
curl -s -X POST localhost:8080/v1/cart/items -H "Authorization: Bearer $CUST2" -d '{"product_id":1,"quantity":1}'

# both check out at the same moment
curl -s -X POST localhost:8080/v1/checkout -H "Authorization: Bearer $CUST"  &
curl -s -X POST localhost:8080/v1/checkout -H "Authorization: Bearer $CUST2" &
wait

# exactly one order, and stock is 0 — never -1
docker exec -it shop-pg psql -U postgres -d shop \\
  -c "SELECT stock FROM products WHERE id=1; SELECT count(*) FROM orders;"`,
          note: 'This is the test that matters. Run it several times — a race that only shows up sometimes is still a race.',
        },
      },
    ],
    keyPoints: [
      'A transaction makes several statements all-or-nothing. Checkout is the textbook case.',
      'Put the condition inside the UPDATE: `WHERE id = $2 AND stock >= $1`, then check `RowsAffected`.',
      'Use a named return so the deferred rollback can see whether an error happened.',
      'Keep transactions short, never call an external service inside one, and lock rows in a consistent order.',
    ],
    remember:
      'Checking a value in Go and then changing it in SQL leaves a gap. Put the check in the WHERE clause and the gap disappears.',
    task: 'Build checkout as one transaction, then run the two-customers-one-item test several times. Stock must never go negative and exactly one order must exist.',
    exercises: [
      {
        task: 'Remove `AND stock >= $1` and run the race test again until you see stock go negative.',
        answer:
          'Stock goes negative and both orders succeed. You have sold something you do not have.',
      },
      {
        task: 'Force an error after the order insert and confirm the whole thing rolls back.',
        answer:
          'The order disappears entirely. Nothing between BeginTx and Commit is real until Commit runs.',
      },
      {
        task: 'Add a `time.Sleep` inside the transaction and watch the connection pool while sending several checkouts.',
        answer:
          'Connections are held for the whole sleep, and with enough concurrent checkouts the pool is exhausted and everything queues.',
      },
      {
        task: 'Change one query to use `r.db` instead of `tx` and work out exactly what breaks.',
        answer:
          'That statement runs outside the transaction, so a rollback does not undo it. This is a very nasty bug to find.',
      },
    ],
    refs: [
      { label: 'Executing transactions', href: 'https://go.dev/doc/database/execute-transactions' },
      { label: 'database/sql', href: 'https://pkg.go.dev/database/sql' },
    ],
  },

  {
    slug: 'shop-step-7-production',
    title: 'Step 7 — Orders, and getting it ready to deploy',
    navTitle: 'Step 7 — Ship it',
    oneLine: 'The last endpoints, then logging, limits, a container and the hardening pass.',
    blocks: [
      {
        heading: 'Orders: scoped, paged, and joined',
        body: [
          'Nothing new here, which is the point — it is the same three rules from earlier projects applied together.',
        ],
        code: {
          label: 'internal/adapter/storage/postgres/order.go',
          src: `func (r *Repository) ListByUser(ctx context.Context, userID int64, limit, offset int) ([]Order, error) {
\trows, err := r.db.QueryContext(ctx, \`
\t\tSELECT o.id, o.total_cents, o.status, o.created_at,
\t\t       count(oi.id) AS line_count
\t\t  FROM orders o
\t\t  LEFT JOIN order_items oi ON oi.order_id = o.id
\t\t WHERE o.user_id = $1                       -- scoped, always
\t\t GROUP BY o.id
\t\t ORDER BY o.created_at DESC
\t\t LIMIT $2 OFFSET $3\`,                      -- paged, always
\t\tuserID, limit, offset)
\t...
}`,
          note: 'The LEFT JOIN with count is what stops this being N+1. Without it you would loop and query per order.',
        },
      },
      {
        heading: 'Structured logging',
        code: {
          label: 'cmd/api/main.go',
          src: `var h slog.Handler
if cfg.Env == "production" {
\th = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})
} else {
\th = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug})
}
slog.SetDefault(slog.New(h))

slog.Info("order placed",
\t"order_id", o.ID, "user_id", userID,
\t"total_cents", o.TotalCents, "items", len(items))`,
          note: 'JSON in production because machines read it, text in development because you do. Never log a password, a token, or a whole request body.',
        },
      },
      {
        heading: 'Rate limits where they matter',
        code: {
          label: 'cmd/api/main.go',
          src: `authLimit := middleware.RateLimit(0.2, 5)     // ~12 a minute, burst 5
apiLimit := middleware.RateLimit(20, 40)      // generous for normal use

mux.Handle("POST /v1/auth/login", authLimit(http.HandlerFunc(userH.Login)))
mux.Handle("POST /v1/auth/register", authLimit(http.HandlerFunc(userH.Register)))
mux.Handle("POST /v1/checkout", apiLimit(protect(http.HandlerFunc(orderH.Checkout))))`,
          note: 'Login and register get the tight limit — that is where password-guessing attacks land.',
        },
      },
      {
        heading: 'Every command to containerise it',
        code: {
          label: 'terminal',
          src: `# 1. the Dockerfile
cat > Dockerfile <<'EOF'
FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /api ./cmd/api

FROM gcr.io/distroless/static-debian12
COPY --from=build /api /api
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/api"]
EOF

# 2. build and check the size
docker build -t shop:latest .
docker images shop:latest

# 3. run the whole stack
docker compose up -d
docker compose logs -f api

# 4. useful while developing
docker compose down             # stop
docker compose down -v          # stop and wipe the database
docker compose exec db psql -U postgres -d shop`,
        },
      },
      {
        heading: 'The two container settings people miss',
        code: {
          label: 'docker-compose.yml — the api service environment',
          src: `environment:
  DATABASE_URL: postgres://postgres:secret@db:5432/shop?sslmode=disable
  JWT_SECRET: dev-secret-at-least-32-characters-long
  UPLOAD_DIR: /data/uploads
  GOMEMLIMIT: 450MiB          # ~90% of the memory limit
  GOMAXPROCS: "2"             # match the CPU limit, not the host
volumes:
  - uploads:/data/uploads     # uploads must outlive the container`,
          note: 'Without GOMEMLIMIT the garbage collector grows the heap until the container is killed. Without GOMAXPROCS Go reads the host machine core count, not your limit.',
        },
      },
      {
        heading: 'The hardening pass',
        bullets: [
          '**Every route’s auth** — grep your `Routes` functions for a handler registered without `protect`, and every admin route without `adminOnly`.',
          '**Every query’s scope** — `WHERE id = $1` with no `AND user_id = $2` on anything user-owned.',
          '**Every query’s SQL** — any `fmt.Sprintf` or `+` near a query string that touches a request value.',
          '**Every file path** — anything built from something the client sent.',
          '**Every log line** — a password, a token, or a whole body.',
          '**Every goroutine** — one with no way to exit.',
        ],
      },
      {
        heading: 'The four checks, then ship',
        code: {
          label: 'terminal',
          src: `gofmt -l .              # must print nothing
go vet ./...            # must be silent
go test -race ./...     # must be green
go run golang.org/x/vuln/cmd/govulncheck@latest ./...

# then a Makefile so you stop retyping
cat > Makefile <<'EOF'
run:     ; go run ./cmd/api
test:    ; go test -race -cover ./...
lint:    ; go vet ./... && gofmt -l .
build:   ; CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/api ./cmd/api
up:      ; docker compose up -d
down:    ; docker compose down
migrate: ; migrate -path migrations -database "$(DATABASE_URL)" up
check:   ; gofmt -l . && go vet ./... && go test -race ./... 
EOF

make check`,
        },
      },
      {
        callout: {
          tone: 'ok',
          text: 'Three projects done. You have built a public service, a service with accounts and private data, and a service with roles, files and money that cannot be lost. That is a real portfolio, and every idea in the interview topics now has something of yours to point at.',
        },
      },
    ],
    keyPoints: [
      'Orders are the same three rules again: scoped, paged, joined rather than looped.',
      'Structured logs with `slog` — JSON in production, and never log secrets.',
      'Rate-limit login and register hardest. That is where attacks land.',
      '`GOMEMLIMIT` and `GOMAXPROCS` in every container, and a volume for uploads.',
    ],
    remember:
      'Shipping is pagination, logging, limits, a container and one hardening pass. None of it is hard, and skipping it is what separates a demo from a service.',
    task: 'Finish orders, add logging and rate limits, containerise it, and work the hardening checklist line by line. Then run `make check` and get it green.',
    exercises: [
      {
        task: 'Hammer login with a curl loop until you get 429, and check the `Retry-After` header.',
        answer:
          '429 with a `Retry-After` header after the burst is used. Check it is the auth limiter firing, not the general one.',
      },
      {
        task: 'Restart the container and confirm uploaded images are still there. Then remove the volume and see them vanish.',
        answer:
          'With the volume they survive; without it they are gone. Container filesystems do not persist.',
      },
      {
        task: 'Set `GOMEMLIMIT` far too low and watch the garbage collector work harder in the logs.',
        answer:
          'The GC runs far more often and CPU rises. Too high and the container gets OOM-killed instead — it is a real trade-off.',
      },
      {
        task: 'Find one thing to delete: a helper used once, or an interface with one implementation.',
        answer:
          'Every codebase this age has one. Deleting is the highest-value edit you will make today.',
      },
    ],
    refs: [
      { label: 'log/slog', href: 'https://pkg.go.dev/log/slog' },
      { label: 'govulncheck', href: 'https://go.dev/blog/govulncheck' },
    ],
  },
]
