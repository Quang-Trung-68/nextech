# NexTech

> Vietnamese consumer electronics e-commerce platform with dual payment gateways, IMEI/serial inventory tracking, VAT invoicing, and real-time notifications — built on a monorepo stack with automated CI/CD.

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2d3748?logo=prisma)](https://www.prisma.io/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635bff?logo=stripe&logoColor=white)](https://stripe.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-nextech.io.vn-brightgreen)](https://nextech.io.vn)

**Live Demo:** [nextech.io.vn](https://nextech.io.vn) &nbsp;·&nbsp; **GitHub:** [Quang-Trung-68/nextech](https://github.com/Quang-Trung-68/nextech)

---

## 📚 Technical Documentation Index

For in-depth explanations of the system's design, database relations, and API endpoints, please refer to our dedicated specifications:

*   **[System Architecture & Workflows](./docs/ARCHITECTURE.md)**: Deep-dive analysis of JWT HttpOnly session token rotations, dual Stripe/SePay webhook integrations, Soketi-driven WebSockets, and background cron jobs.
*   **[Database Schema & ERD](./docs/DATABASE_ERD.md)**: Full database reference covering all 37 tables managed by Prisma ORM, complete with an interactive **Mermaid ERD** diagram.
*   **[REST API Endpoints](./docs/API_ENDPOINTS.md)**: Structured reference of core client-facing and admin endpoints with request validation payloads and success responses.

---

## Features

- **Product catalog** — variants & attributes (e.g. Color × Storage), per-variant pricing, stock, and sale pricing. Equipped with an interactive homepage **Live Flash Sale** component featuring a live countdown timer and vibrant stock progress bars.
- **Wishlist & Price Drop Alerts** — user product wishlist (favorites) combined with an automated price drop detection engine. Triggers database notifications, real-time WebSockets, and HTML transactional emails.
- **Interactive Scalar API Reference** — 100% complete self-hosted API documentation at `/api-docs` built on OpenAPI 3.0, featuring a premium 3-column UI, dark mode, and direct interactive testing.
- **Dual payment gateway** — Stripe (international cards) and SePay/VietQR (Vietnamese bank transfer), each with webhook-driven order confirmation.
- **IMEI / serial tracking** — stock imports linked to suppliers; individual serial units tracked through `IN_STOCK → RESERVED → SOLD → RETURNED` lifecycle.
- **Order management & Internal Notes** — structured status workflow, cancellation/return flows, admin serial assignment, and secure admin-only internal order notes (`adminNote`).
- **Admin dashboard** — comprehensive admin dashboard with dynamic side-by-side Recharts area charts and a custom ranked list of top-selling products, user management (featuring dynamic customer addresses view), and invoice tracking.
- **AI Chatbot** — Gemini-powered shopping assistant ("Mua Cùng AI") with persistent history for logged-in users and guest mode support.
- **VAT invoices** — request VAT on checkout, generate PDF invoices with PDFKit, deliver by email.
- **Coupon engine** — percentage and fixed-amount codes with per-user and global usage caps.
- **Real-time notifications** — self-hosted Soketi (Pusher protocol) with private channel authentication.
- **Blog / news** — TipTap rich text editor, categories, tags, post scheduling, view counts.
- **OAuth2 login** — Google and Facebook authentication via Passport.js.
- **Product reviews** — rate and review purchased items with admin moderation.
- **Support center** — FAQ, policies, contact form, and support topics.
- **Transactional email** — order lifecycle, invoice PDF delivery, verification, password reset, price drop alerts; failed email retry queue.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend (Web)** | React 19 · Vite · React Router v7 · Tailwind CSS v4 · Shadcn/UI · Radix UI |
| **Admin CMS** | React 19 · Vite · Shadcn/UI · Recharts · TanStack Query v5 · Zustand |
| **State** | TanStack Query v5 · Zustand · React Hook Form + Zod · Lucide React |
| **Rich text** | TipTap |
| **Charts** | Recharts |
| **Backend** | Node.js · Express 5 · Passport.js · `@scalar/express-api-reference` |
| **Database** | PostgreSQL 16 · Prisma ORM v7 |
| **Auth** | JWT (cookie-based) · bcryptjs · Google/Facebook OAuth2 |
| **Payments** | Stripe SDK · SePay / VietQR (Vietnamese bank transfer) |
| **Media** | Cloudinary · Multer |
| **Email** | Nodemailer · EJS templates |
| **PDF** | PDFKit |
| **Real-time** | Soketi (self-hosted Pusher) · Pusher-js |
| **Scheduler** | node-cron (5 scheduled jobs) |
| **DevOps** | Docker · GitHub Actions · GHCR · Nginx · Certbot · VPS |

---

## Architecture

NexTech is organized as a **monorepo** with separate `frontend/` and `backend/` directories. The backend follows a layered architecture: **Routes → Controllers → Services → Prisma**. Business logic lives entirely in the service layer; controllers stay thin.

```
nextech/
├── backend/
│   ├── src/
│   │   ├── configs/         # Route registration, Passport, DB, mailer, Stripe, CORS, i18n
│   │   ├── controllers/     # Request/response handling
│   │   ├── docs/            # OpenAPI 3.0 specification
│   │   ├── services/        # Business logic (payments, orders, inventory…)
│   │   ├── middleware/       # Auth, upload, validation
│   │   ├── jobs/            # node-cron scheduled tasks
│   │   ├── errors/          # AppError hierarchy
│   │   ├── validations/     # Zod request validation schemas
│   │   ├── templates/       # EJS email templates
│   │   └── utils/           # Helpers, Prisma client, Pusher client
│   └── prisma/
│       ├── schema.prisma    # 37 models
│       └── migrations/
├── frontend/
│   └── src/
│       ├── features/        # Feature-based modules (cart, checkout, admin…)
│       ├── components/      # Shared UI components
│       ├── hooks/           # Reusable hooks
│       └── configs/         # Route config, axios instance
├── admin/                   # Admin CMS (React + Vite + Shadcn, served by Nginx)
├── nginx/                   # Production reverse proxy + TLS config
├── scripts/                  # deploy.sh, seed-all.sh, reset-and-seed.sh, crawlers
├── docker-compose.yml       # Development stack
└── docker-compose.prod.yml  # Production stack (GHCR images)
```

See the detailed [ARCHITECTURE.md](./docs/ARCHITECTURE.md) document for complete auth flows, payment flows, real-time architectures, and engineering design decisions.

---

## Screenshots

> Visit the [live demo](https://nextech.io.vn) to see NexTech in action.

<!-- Screenshots coming soon -->

---

## Demo accounts (for reviewers)

These accounts are created when you run the Prisma seed ([`backend/prisma/seed.js`](./backend/prisma/seed.js)). **They apply to a freshly seeded local or self-hosted database**, not necessarily to the public live site.

**1. Seed the database**

```bash
cd backend
npx prisma migrate deploy   # or: npx prisma migrate dev
npx prisma db seed
```

With Docker (from repo root):

```bash
docker compose exec backend npx prisma db seed
```

**2. Log in**

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@nextech.com` | `Admin123!` |
| **Customer** | `user1@nextech.com` | `User123!` |
| **Customer** | `user2@nextech.com` | `User123!` |

You can override the admin email and password at seed time with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (see `seed.js`). The full product catalog seed (`seed_products.js`) uses the same defaults unless those env vars are set.

**Admin login page:** `https://admin.nextech.io.vn` (production) or `http://localhost:5174` (local dev).

> **Note:** If [nextech.io.vn](https://nextech.io.vn) was deployed without this seed or with different credentials, use a local Docker setup above or contact the maintainer for demo access.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) & Docker Compose v2

### Option A — Docker (recommended)

> Starts the entire stack (database, backend, frontend, admin panel, Soketi) with a single command.

**Step 1: Clone the repository**

```bash
git clone https://github.com/Quang-Trung-68/nextech.git
cd nextech
```

**Step 2: Create the environment file**

```bash
cp .env.deploy.template .env
```

Open `.env` and fill in all values marked with `<your-...>`:

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | Any strong password for the local DB |
| `DATABASE_URL` | Must use the same password as above |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` / `COOKIE_SECRET` | Any long random strings |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | [Stripe Dashboard](https://dashboard.stripe.com/) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | [Cloudinary Console](https://cloudinary.com/console) |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Gmail + [App Password](https://myaccount.google.com/apppasswords) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/) OAuth 2.0 |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | [Meta Developers](https://developers.facebook.com/) |

> Soketi variables (`SOKETI_APP_ID`, `SOKETI_APP_KEY`, `SOKETI_APP_SECRET`, `VITE_SOKETI_*`) are pre-filled with safe defaults — no changes needed for local development.

For local Docker usage, set these overrides in `.env`:

```dotenv
NODE_ENV=development
CLIENT_URL=http://localhost
FRONTEND_URL=http://localhost
VITE_API_URL=http://localhost/api
VITE_SOKETI_HOST=localhost
VITE_SOKETI_PORT=6001
VITE_SOKETI_FORCE_TLS=false
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback
```

**Step 3: Build and start**

```bash
docker compose up --build
```

> First run takes ~3–5 minutes. Database migrations run automatically.

**Step 4: Access the app**

| Service | URL |
|---|---|---|
| Web app (customer) | http://localhost |
| API | http://localhost/api |
| Admin CMS | http://localhost:5174 (dev) / https://admin.nextech.io.vn (prod) |
| Soketi WebSocket | ws://localhost:6001 |

**Useful commands**

```bash
docker compose logs -f              # All service logs
docker compose logs -f backend      # Backend logs only
docker compose down                 # Stop all services
docker compose down -v              # Stop and delete database volumes
docker compose up --build backend   # Rebuild a single service
```

---

### Option B — Manual (development with hot reload)

**Prerequisites:** Node.js v20+, PostgreSQL v14+, Git

**Step 1: Run Soketi** (Pusher-compatible WebSocket server)

```bash
npx @soketi/soketi start --config='{
  "debug": true,
  "appManager.driver": "array",
  "appManager.array.apps": [{
    "id": "nextech-app",
    "key": "nextech-key",
    "secret": "nextech-secret",
    "maxConnections": 100
  }]
}'
```

**Step 2: Run the backend**

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values

npx prisma migrate dev
npm run dev       # API at http://localhost:3000
```

**Step 3: Run the frontend**

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with VITE_API_URL and Soketi variables

npm run dev       # App at http://localhost:5173
```

**Step 4: Run the admin panel**

```bash
cd admin
npm install
cp .env.example .env
# Edit .env with VITE_API_URL

npm run dev       # Admin CMS at http://localhost:5174
```

Key `.env` values for manual dev:

```dotenv
# backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/nextech_db?schema=public
PORT=3000
CLIENT_URL=http://localhost:5173
SOKETI_APP_KEY=nextech-key
SOKETI_HOST=localhost
SOKETI_PORT=6001

# frontend/.env
VITE_API_URL=http://localhost:3000/api
VITE_SOKETI_APP_KEY=nextech-key
VITE_SOKETI_HOST=localhost
VITE_SOKETI_PORT=6001
VITE_SOKETI_FORCE_TLS=false

# admin/.env
VITE_API_URL=http://localhost:3000/api
```

---

## Production Deployment

NexTech runs as a **7-service stack** (Postgres, Soketi, backend, frontend, admin panel, Nginx reverse proxy, Certbot).

**Step 1: Prepare the VPS**

Install Docker and Docker Compose. Point two DNS records to your VPS IP:
- `nextech.io.vn` → Frontend (customer-facing)
- `admin.nextech.io.vn` → Admin CMS
- `api.nextech.io.vn` → Backend API + Soketi WebSocket

**Step 2: Clone and configure**

```bash
git clone https://github.com/Quang-Trung-68/nextech.git
cd nextech
cp .env.deploy.template .env
# Edit .env with all production values
```

**Step 3: Initialize SSL**

```bash
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
```

**Step 4: Deploy**

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

The GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) automates this on every push to `main`: lint → build Docker images → push to GHCR → SSH deploy → run `prisma migrate deploy`.

---

## Directory Structure

```
.
├── docs/                     # Technical specifications (Architecture, Database ERD, REST API reference)
├── backend/
│   ├── src/                      # Application source code (configs, controllers, docs, validations, templates...)
│   │   ├── docs/            # OpenAPI 3.0 spec (openapi.js)
│   │   ├── templates/       # EJS email templates (14 templates)
│   │   └── validations/     # Zod request validation (18 schemas)
│   ├── prisma/                   # Schema, migrations, seed data (37 models)
│   ├── Dockerfile
│   ├── docker-entrypoint.sh      # Auto-runs migrations on container start
│   └── .env.example
├── frontend/
│   ├── src/                      # Application source code (features, components, hooks, api, stores, pages, i18n...)
│   │   ├── api/             # Axios instance & TanStack Query hooks
│   │   ├── stores/          # Zustand state stores (6 stores)
│   │   ├── pages/           # Main application pages (22+ pages)
│   │   └── i18n/            # i18next locales (vi, en)
│   ├── Dockerfile
│   └── .env.example
├── admin/                        # Admin CMS (React + Vite + Shadcn, served by Nginx)
│   ├── src/
│   │   ├── pages/           # Admin pages (users, orders, products, dashboard...)
│   │   ├── features/        # Admin feature modules (hooks, components)
│   │   └── stores/          # Zustand stores (auth, sidebar, notifications)
│   └── Dockerfile
├── nginx/                        # Production Nginx config (TLS, proxy, WS)
├── scripts/                      # deploy.sh, seed-all.sh, reset-and-seed.sh, Python crawlers
├── docker-compose.yml            # Development stack
├── docker-compose.prod.yml       # Production stack
└── .env.deploy.template          # Environment variable template
```

---

## Database backup (PostgreSQL in Docker)

Replace user, database, and compose file if your `.env` differs from the defaults (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — default `nextech` / `nextech` / `nextech` in [`docker-compose.yml`](./docker-compose.yml)).

**Plain SQL (good for reading or importing with `psql`):**

```bash
# Development stack (service name: postgres)
docker compose exec -T postgres \
  pg_dump -U nextech nextech \
  > nextech-backup-$(date +%Y-%m-%d).sql
```

**Custom format (recommended for large DBs — restore with `pg_restore`):**

```bash
docker compose exec -T postgres \
  pg_dump -U nextech -Fc nextech \
  > nextech-backup-$(date +%Y-%m-%d).dump
```

**Production compose file:**

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-nextech}" -Fc "${POSTGRES_DB:-nextech}" \
  > nextech-prod-backup-$(date +%Y-%m-%d).dump
```

If `pg_dump` asks for a password non-interactively, pass it once (avoid committing this line to git):

```bash
docker compose exec -T -e PGPASSWORD=your_db_password postgres \
  pg_dump -U nextech -Fc nextech > backup.dump
```

---

## Contributing

Contributions, issues, and feature requests are welcome. Please read [ARCHITECTURE.md](./ARCHITECTURE.md) for an overview of the system design before contributing.

Contact: [trungdang.dqt@gmail.com](mailto:trungdang.dqt@gmail.com) · [GitHub](https://github.com/Quang-Trung-68)

---

## License

MIT © 2026 [Đặng Quang Trung](https://github.com/Quang-Trung-68)
