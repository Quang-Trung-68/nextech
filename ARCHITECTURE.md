# NexTech — Architecture

This document describes the system architecture, data flows, and key design decisions behind NexTech.

---

## System Overview

NexTech is a **monorepo** composed of a React SPA, an Express REST API, a self-hosted WebSocket server (Soketi), and a PostgreSQL database. All services are containerized and deployed together via Docker Compose, with Nginx as the edge proxy.

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                       │
└──────────────┬────────────────────────┬─────────────────┘
               │ HTTPS (REST)           │ WSS (Pusher protocol)
               ▼                        ▼
┌──────────────────────────────────────────────────────────┐
│                   Nginx (reverse proxy)                  │
│   nextech.io.vn → frontend                              │
│   api.nextech.io.vn → backend :3000                     │
│   api.nextech.io.vn/app/* → soketi :6001                │
└──────────┬──────────────────────────┬────────────────────┘
           │                          │
    ┌──────▼──────┐            ┌──────▼──────┐
    │   Frontend  │            │   Soketi    │
    │  (Nginx SPA)│            │ (WebSocket) │
    └─────────────┘            └──────▲──────┘
                                      │ trigger
    ┌─────────────┐            ┌──────┴──────┐
    │  PostgreSQL │◄───────────│   Backend   │
    │    (Prisma) │            │  (Express)  │
    └─────────────┘            └─────────────┘
```

---

## Backend Layer Structure

The backend follows a strict **layered architecture**:

```
Routes → Controllers → Services → Prisma (data access)
```

- **Routes** declare HTTP verbs, paths, and middleware chains.
- **Controllers** extract request inputs, call one service method, and return the response. No business logic.
- **Services** own all business rules, Prisma queries, and cross-cutting operations (emails, notifications, events).
- **Middleware** (`protect`, `restrictTo`, `requireEmailVerified`, `validateRequest`) are composed per route.
- **Jobs** (node-cron) run in-process as background tasks. They call the same service layer as controllers.
- **Errors** are handled globally via `AppError` + `catchAsync` + a single `errorHandler` middleware.

---

## Frontend Structure

The frontend is organized **by feature**, not by type:

```
src/
├── features/
│   ├── cart/
│   ├── checkout/
│   ├── admin/
│   ├── news/
│   └── ...
├── components/ui/       # Shared UI primitives (Shadcn/UI)
├── hooks/               # Shared custom hooks
└── configs/
    ├── routes.config.jsx
    └── axios.js
```

Server state is managed by **TanStack Query** (caching, background refetch, pagination). Client-only state (cart UI, modal open/close, auth) uses **Zustand**. Forms use **React Hook Form + Zod**.

---

## Authentication Flow

NexTech uses **short-lived JWT access tokens** paired with **long-lived refresh tokens**, both delivered as HttpOnly cookies.

```
Login request
     │
     ▼
Validate credentials / OAuth callback
     │
     ▼
Issue access token (15m) + refresh token (7d)
Set as HttpOnly cookies
     │
     ▼
Subsequent requests → `protect` middleware
  reads access_token cookie (falls back to Bearer header)
     │
     ├── Valid → proceed
     └── Expired (TOKEN_EXPIRED) → frontend calls /api/auth/refresh
              │
              ▼
         Verify refresh token exists in RefreshToken table
         and is NOT in RevokedToken table
              │
              ▼
         Issue new token pair (rotation)
```

**Token security:**
- On logout, the refresh token is moved to `RevokedToken`.
- Every refresh rotates both tokens (old refresh is revoked, new one is stored).
- Email verification is required before accessing user profile and checkout routes (`requireEmailVerified`).
- OAuth (Google, Facebook) uses Passport.js strategies; the callback issues the same cookie pair as password login, linking via `OAuthAccount` table.

---

## Payment Flow

### Stripe (international card payments)

```
User clicks "Pay with Card"
     │
     ▼
POST /api/payments/intent/:orderId
  → backend calls stripe.paymentIntents.create()
  → stores clientSecret + paymentIntentId on Order
     │
     ▼
Frontend renders Stripe Elements (card form)
User submits → Stripe confirms on their servers
     │
     ▼
Stripe sends webhook: payment_intent.succeeded
POST /api/payments/webhook (raw body, signature verified)
     │
     ▼
Transactional block:
  - Verify order is PENDING_PAYMENT
  - Deduct inventory (saleSoldCount for sale items)
  - Mark order PROCESSING
  - Clear user cart
  - Send order confirmation email
  - Trigger Pusher notification
```

### SePay / VietQR (Vietnamese bank transfer)

```
User clicks "Pay with Bank Transfer"
     │
     ▼
POST /api/payments/sepay/:orderId
  → createSepayCheckout() → returns payment page URL
     │
     ▼
User pays via banking app, returns to app
Frontend polls GET /api/payments/status/:orderId
     │
     ▼
SePay sends IPN webhook: ORDER_PAID
POST /api/payments/sepay/webhook
  → finalizeSepayOrderPaid() (same transactional block as Stripe)
```

Both gateways converge on the same `finalizeOrderPaid()` logic, keeping the post-payment business rules in one place.

---

## Real-time Notification Flow

NexTech uses **Soketi** — a self-hosted, open-source Pusher-compatible WebSocket server — instead of paying for managed Pusher.

```
Backend event occurs (order update, low stock, etc.)
     │
     ▼
service calls pusher.trigger(channel, event, data)
  via Node.js Pusher SDK → HTTP to Soketi :6001
     │
     ▼
Soketi broadcasts to all clients subscribed to that channel
     │
     ▼
Frontend (pusher-js) receives event → updates UI / shows toast
```

**Private channels** (`private-user-{id}`) require authentication: the frontend calls `POST /api/notifications/auth` which validates the user's JWT and returns the Pusher auth signature.

**Nginx** proxies `api.nextech.io.vn/app/*` and `/apps/*` to Soketi, handling the WSS upgrade.

---

## Scheduled Jobs (node-cron)

All jobs run in-process (same Node.js server). They use the same service layer as HTTP controllers.

| Job | Schedule | Purpose |
|---|---|---|
| `expirationJob` | Every 1 min | Cancel unpaid Stripe/SePay orders older than 15 min; restore stock |
| `lowStockJob` | Every hour | Alert admins if any product's serial stock falls below threshold |
| `lowOrderAlertJob` | Hourly / daily / monthly | Alert admins if order volume falls below configured threshold |
| `publishScheduledPostsJob` | Every 1 min | Publish blog posts whose `scheduledAt` has passed |
| `scheduledEmailJob` | Every 30 min | Retry emails that failed and are stored in the `FailedEmail` table |

---

## Inventory & Serial Tracking

Products can be tracked either by simple integer stock or at the individual serial/IMEI unit level.

```
Supplier → StockImport → SerialUnit (serial string, status: IN_STOCK)
                                │
                         Order confirmed
                                │
                                ▼
                     Admin assigns serial to OrderItem
                     SerialUnit.status → SOLD
                     OrderItem.serialUnitId set
```

`SerialStatus` state machine: `IN_STOCK → RESERVED → SOLD` (or `RETURNED`).

---

## Database Schema Highlights

The PostgreSQL schema (managed by Prisma) contains **26+ models**. Key relationships:

- `User` → `Order` → `OrderItem` → `Product` / `ProductVariant`
- `Product` → `ProductAttribute` → `ProductAttributeValue` ← `ProductVariantValue` → `ProductVariant`
- `Order` → `Invoice` → `InvoiceItem`
- `StockImport` → `SerialUnit` ← `OrderItem`
- `Coupon` ← `CouponUsage` → `User`

All monetary values use Prisma's `Decimal` type (mapped to `PostgreSQL NUMERIC`) to avoid floating-point precision issues.

---

## CI/CD Pipeline

```
git push → main
     │
     ▼
GitHub Actions
  1. ESLint on critical frontend + backend paths
  2. Docker Buildx: build backend image → push to GHCR
  3. Docker Buildx: build frontend image (with VITE_* build args) → push to GHCR
  4. SSH into VPS:
       git pull origin main
       docker compose -f docker-compose.prod.yml pull
       docker compose -f docker-compose.prod.yml up -d
       prisma migrate deploy (inside backend container)
```

The `backend/docker-entrypoint.sh` also runs `prisma migrate deploy` on container start as a safety net.

---

## Key Design Decisions

**Why Soketi instead of managed Pusher?**
Soketi is a drop-in Pusher-compatible server. Self-hosting eliminates per-message costs and keeps all data on the same VPS. The Pusher protocol means no client-side code changes.

**Why node-cron instead of a separate queue (BullMQ/Redis)?**
At NexTech's current scale, in-process cron jobs are simpler to operate — no Redis dependency, no separate worker process. The tradeoff is that jobs are tied to the web server's uptime and can't be distributed across instances.

**Why cookie-based JWT instead of localStorage?**
HttpOnly cookies are not accessible from JavaScript, protecting against XSS token theft. The `sameSite: lax` setting provides CSRF protection for same-origin navigation. A `RevokedToken` table provides server-side logout capability, which pure JWT cannot offer.

**Why Prisma's driver adapter (`@prisma/adapter-pg`)?**
Prisma 7 dropped the built-in connection pool in favor of an explicit adapter. Using `@prisma/adapter-pg` with a `pg.Pool` gives explicit control over pool size and reuse across requests.
