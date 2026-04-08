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

## Features

- **Product catalog** — variants & attributes (e.g. Color × Storage), per-variant pricing, stock, and sale pricing
- **Dual payment gateway** — Stripe (international cards) and SePay/VietQR (Vietnamese bank transfer), each with webhook-driven order confirmation
- **IMEI / serial tracking** — stock imports linked to suppliers; individual serial units tracked through `IN_STOCK → RESERVED → SOLD` lifecycle
- **Order management** — structured status workflow, user cancel/return, admin serial assignment
- **VAT invoices** — request VAT on checkout, generate PDF invoices with PDFKit, deliver by email
- **Coupon engine** — percentage and fixed-amount codes with per-user and global usage caps
- **Time-limited sale pricing** — products and variants support an optional discounted price with an expiry date and sale quota cap
- **Admin dashboard** — revenue analytics (Recharts), product/order/user/inventory management
- **Real-time notifications** — self-hosted Soketi (Pusher protocol) with private channel authentication
- **Blog / news** — TipTap rich text editor, categories, tags, post scheduling, view counts
- **OAuth2 login** — Google and Facebook authentication via Passport.js
- **Transactional email** — order lifecycle, invoice PDF delivery, verification, password reset; failed email retry queue

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · Vite · React Router · Tailwind CSS · Shadcn/UI |
| **State** | TanStack Query · Zustand · React Hook Form + Zod |
| **Rich text** | TipTap |
| **Charts** | Recharts |
| **Backend** | Node.js · Express · Passport.js |
| **Database** | PostgreSQL 16 · Prisma ORM v7 |
| **Auth** | JWT (cookie-based) · bcryptjs · Google/Facebook OAuth2 |
| **Payments** | Stripe SDK · SePay (VietQR) |
| **Media** | Cloudinary · Multer |
| **Email** | Nodemailer · EJS templates |
| **PDF** | PDFKit |
| **Real-time** | Soketi (self-hosted Pusher) · Pusher-js |
| **Scheduler** | node-cron (7+ jobs) |
| **DevOps** | Docker · GitHub Actions · GHCR · Nginx · Certbot · VPS |

---

## Architecture

NexTech is organized as a **monorepo** with separate `frontend/` and `backend/` directories. The backend follows a layered architecture: **Routes → Controllers → Services → Prisma**. Business logic lives entirely in the service layer; controllers stay thin.

```
nextech/
├── backend/
│   ├── src/
│   │   ├── configs/         # Route registration, Passport, DB, mailer
│   │   ├── controllers/     # Request/response handling
│   │   ├── services/        # Business logic (payments, orders, inventory…)
│   │   ├── middleware/       # Auth, upload, validation
│   │   ├── jobs/            # node-cron scheduled tasks
│   │   ├── errors/          # AppError hierarchy
│   │   └── utils/           # Helpers, Prisma client, Pusher client
│   └── prisma/
│       ├── schema.prisma    # 26+ models
│       └── migrations/
├── frontend/
│   └── src/
│       ├── features/        # Feature-based modules (cart, checkout, admin…)
│       ├── components/      # Shared UI components
│       ├── hooks/           # Reusable hooks
│       └── configs/         # Route config, axios instance
├── nginx/                   # Production reverse proxy + TLS config
├── docker-compose.yml       # Development stack
└── docker-compose.prod.yml  # Production stack (GHCR images)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for auth flows, payment flows, real-time architecture, and design decisions.

---

## Screenshots

> Visit the [live demo](https://nextech.io.vn) to see NexTech in action.

<!-- Screenshots coming soon -->

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) & Docker Compose v2

### Option A — Docker (recommended)

> Starts the entire stack (database, backend, frontend, Soketi) with a single command.

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
|---|---|
| Web app | http://localhost |
| API | http://localhost/api |
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
```

---

## Production Deployment

NexTech runs as a **6-container Docker stack** (Postgres, Soketi, backend, frontend/Nginx, Nginx reverse proxy, Certbot).

**Step 1: Prepare the VPS**

Install Docker and Docker Compose. Point two DNS records to your VPS IP:
- `nextech.io.vn` → Frontend
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
├── backend/
│   ├── src/                      # Application source code
│   ├── prisma/                   # Schema, migrations, seed data
│   ├── Dockerfile
│   ├── docker-entrypoint.sh      # Auto-runs migrations on container start
│   └── .env.example
├── frontend/
│   ├── src/                      # Application source code
│   ├── Dockerfile
│   └── .env.example
├── nginx/                        # Production Nginx config (TLS, proxy, WS)
├── scripts/                      # deploy.sh, seed scripts
├── docker-compose.yml            # Development stack
├── docker-compose.prod.yml       # Production stack
└── .env.deploy.template          # Environment variable template
```

---

## Contributing

Contributions, issues, and feature requests are welcome. Please read [ARCHITECTURE.md](./ARCHITECTURE.md) for an overview of the system design before contributing.

Contact: [trungdang.dqt@gmail.com](mailto:trungdang.dqt@gmail.com) · [GitHub](https://github.com/Quang-Trung-68)

---

## License

MIT © 2026 [Đặng Quang Trung](https://github.com/Quang-Trung-68)
