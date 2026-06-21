# NexTech — Architecture & Technical Design

This document details the system architecture, data flows, operational mechanics, and core technical decisions behind NexTech, a modern Vietnamese consumer electronics e-commerce platform.

---

## 1. System Overview

NexTech is built as a highly optimized, single-repository monorepo structure. It is composed of a responsive React Single Page Application (SPA), an Express.js REST API, a self-hosted Soketi WebSocket server (fully compatible with the Pusher protocol), and a PostgreSQL database. 

All services are containerized using **Docker** and orchestrated locally or in production via **Docker Compose**, with **Nginx** acting as the high-performance edge reverse proxy and TLS/SSL gateway.

```
┌────────────────────────────────────────────────────────────────────────┐
│                             Client Browser                             │
└──────────────────┬───────────────────────────┬─────────────────────────┘
                   │ HTTPS (REST)              │ WSS (Pusher Protocol)
                   ▼                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Nginx (Reverse Proxy & TLS)                     │
│    https://nextech.io.vn        → frontend (Port 80)                   │
│    https://admin.nextech.io.vn  → admin panel (Port 80)                │
│    https://api.nextech.io.vn    → backend (Port 3000)                  │
│    wss://api.nextech.io.vn/app/* → soketi (Port 6001)                  │
└──────────────┬──────────────────┬──────────────────┬───────────────────┘
               │                  │                  │
        ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
        │   Frontend  │    │   Admin     │    │   Soketi    │
        │ (Nginx SPA) │    │  CMS (React)│    │ (WebSockets)│
        └─────────────┘    └─────────────┘    └──────▲──────┘
               │                  │                  │ trigger events
               └──────────────────┼──────────────────┘
                                  │
            ┌─────────────┐       │       ┌──────────────┐
            │  PostgreSQL │◄──────┴───────│   Backend    │
            │ (Prisma ORM)│               │ (Express.js) │
            └─────────────┘               └──────────────┘
```

---

## 2. Core Components Structure

### 2.1 Backend Layered Architecture

The Express backend strictly implements a **layered architecture** design pattern. This decouples request-response concerns, validation constraints, data-mapping definitions, and actual business rules:

```
Request → Routes (Middleware) → Controllers → Services → Prisma ORM → PostgreSQL
```

*   **Routes Layer**: Mounts HTTP verbs, defines route endpoints, and chains necessary middlewares (e.g., Zod validator, passport oauth, JWT protector, role boundaries).
*   **Controllers Layer**: Extracts requested parameters, parses payloads, invokes a single core service method, and handles HTTP responses. Controllers do not house business or validation logic.
*   **Services Layer**: Fully encapsulates the platform's business logic, transactional blocks, Prisma queries, and external triggers (e.g., sending emails, pushing events via WebSockets, processing payment computations).
*   **Middleware Layer**: Composes cross-cutting concerns:
    *   `protect`: Validates cookie-based JWT access tokens (falls back to authorization headers).
    *   `adminProtect`: Validates admin-specific JWT access tokens against the separate `Admin` table (not the `User` table).
    *   `requireEmailVerified`: Demands a verified email flag prior to performing actions like checkouts or updates.
    *   `validateRequest(schema)`: Validates body, query, or path parameters against structured Zod schemas.
*   **Jobs (node-cron)**: Automated backend processes running in-process. They consume services directly, ensuring business validations are maintained during automated procedures.
*   **Error Handler**: Centrally captures exceptions via standard `AppError` objects, custom async error wrapper wrappers (`catchAsync`), and returns standard formats.

---

### 2.2 Admin CMS — Separate React Application

The admin control panel is built as a standalone React application in the `admin/` directory. It is served independently by Nginx at `admin.nextech.io.vn` and authenticates against a separate `Admin` database table (not the `User` table) with its own JWT token type (`ADMIN`). Key features include:

- **Dashboard**: Revenue charts (Recharts), top-selling products, order/user statistics, low-stock alerts.
- **User & Admin Management**: Separate tabs for regular users (`/api/admin/users`) and admin accounts (`/api/admin/admins`) with search, pagination, lock/unlock, and address viewer.
- **Product Management**: Full CRUD with variant/attribute matrix, Cloudinary image upload, AI-generated descriptions via Gemini.
- **Order Management**: Status workflow, IMEI/serial assignment, internal notes (`adminNote`).
- **Inventory**: Supplier management, stock imports, serial unit tracking through lifecycle.
- **Brand & Banner Management**: CRUD with image upload and toggle activation.
- **Blog Editor**: TipTap rich text editor with categories, tags, scheduling, and archiving.
- **VAT Invoicing**: Generate PDF invoices, issue, cancel, resend email.
- **Coupon Management**: Create percentage/fixed coupons with usage caps and toggle activation.
- **Shop Settings**: Tax rates, low-stock thresholds, low-order alert configuration.
- **Real-time Notifications**: Soketi WebSocket alerts with localStorage persistence.

### 2.3 Frontend Modular Feature-Based Design

Rather than grouping components by their technical type (e.g., placing all buttons in `components/`, all routes in `pages/`), the React 19 application is organized **by feature**. This modular structure places all related components, state hooks, and API actions in a single feature directory, maximizing maintainability.

```
src/
├── features/
│   ├── admin/           # Admin dashboard, charts, user/admins management, order assignment, inventory imports
│   ├── auth/            # Signin, registration, email verifications, passwords
│   ├── blog/            # Customer articles list and details viewer
│   ├── cart/            # Sliding checkout drawer, item incrementors
│   ├── checkout/        # Checkout page containing address maps, discount card validations, VAT requests
│   ├── home/            # Storefront banners, product shelves, real-time Flash Sale count widget
│   ├── orders/          # Buyer order logs and interactive invoices
│   ├── payments/        # Payment gateway wrappers and checkout element forms
│   ├── products/        # Catalog grid, custom filtering tools, product specifications, wishlist
│   ├── reviews/         # Product evaluation comments
│   ├── support/         # FAQ, policies, contact form, support topics
│   └── user/            # Address books, notification cards, profile forms
├── components/          # Global shared UI components (Shadcn/UI primitives, Layout templates, AI chatbot floating widget)
├── api/                 # Global Axios instance configurations & TanStack Query hook definitions
├── hooks/               # Application custom React hook libraries (debounce, pusher, pagination, aiChat)
├── stores/              # Active client-state engines using Zustand (cart, sidebar, auth, aiChat, notifications)
└── i18n/                # Dynamic localized translations (English/Vietnamese) via i18next
```

*   **Server State**: Managed using **TanStack Query (v5)**. This provides automated background synchronization, query caching, pagination maps, and optimistic updates.
*   **Client State**: Managed via **Zustand**. Holds localized client session data, shopping cart elements, and UI triggers (e.g., sidebar toggles, theme states).
*   **Forms & Validation**: Standardized on **React Hook Form** paired with **Zod validation schemas**.

---

## 3. Operational Workflows & System Mechanics

### 3.1 Session Security & Token Rotation

NexTech guarantees robust user sessions by using short-lived JWT access tokens paired with long-lived rotate-on-demand refresh tokens, delivered exclusively via **HttpOnly, Secure, SameSite=Lax Cookies**. This structure completely eliminates risk vectors associated with token theft via Cross-Site Scripting (XSS).

```
User Login Request
        │
        ▼
Validate Credentials / Google OAuth callback
        │
        ▼
Generate Access Token (1h) + Generate Refresh Token (7d)
Save Refresh Token in RefreshToken table
Set tokens as HttpOnly, Secure, SameSite=Lax Cookies on Client
        │
        ▼
Subsequent Requests → `protect` Middleware
        │
        ├── [Access Token Valid] ──▶ Proceed with request
        │
        └── [Access Token Expired]
                    │
                    ▼
          Frontend interceptor triggers POST `/api/auth/refresh`
                    │
                    ▼
          Check if Cookie Refresh Token matches database active RefreshToken
          Ensure token is NOT present in RevokedToken table
                    │
                    ▼
          Issue new Access + Rotate to new Refresh Token pair
          Invalidate the old Refresh Token (move to RevokedToken)
          Set new HttpOnly cookies & complete client request
```

On manual logout or session invalidation, the refresh token is logged in `RevokedToken` to immediately terminate the session server-side, a mechanism which stateless JWT setups alone cannot support.

---

### 3.2 Dual Payment Gateway Integrations

NexTech supports two distinct payment flows, both driven entirely via webhooks to automate order fulfillment safely and efficiently.

#### Flow A: Stripe (International Cards)
```
User selects "Stripe Card Payment" on checkout
        │
        ▼
POST `/api/payments/intent/:orderId`
  - Backend creates Stripe PaymentIntent via Stripe SDK
  - ClientSecret & PaymentIntentID are stored directly on the Order model
        │
        ▼
Frontend renders Stripe Elements Card Form
User enters payment details → Stripe confirms transaction on secure servers
        │
        ▼
Stripe dispatches raw HTTP webhook: `payment_intent.succeeded`
POST `/api/payments/webhook` (Verify Stripe-Signature Header)
        │
        ▼
Fulfillment Transaction Block:
  - Check order payment status is UNPAID (prevents double webhook triggers)
  - Transition order to PROCESSING
  - Deduct stock counts (or mark serials as RESERVED/SOLD)
  - Clear user's active Cart model
  - Queue transactional order confirmation email (via Nodemailer)
  - Dispatch real-time order update event to Soketi WebSocket
```

#### Flow B: SePay / VietQR (Local Vietnamese Bank Transfer)
```
User selects "VietQR Bank Transfer" on checkout
        │
        ▼
POST `/api/payments/sepay/:orderId`
  - Generate VietQR payment invoice image containing customized transfer memo: `NEX1234`
  - Returns SePay secure hosted checkout payment screen URL
        │
        ▼
User opens banking app, scans VietQR, and completes bank transfer
        │
        ▼
SePay processes bank notification and dispatches Instant Payment Notification (IPN) Webhook
POST `/api/payments/sepay/webhook` (Verify API-Key Token Header)
        │
        ▼
Parse transfer memo to locate target order ID
Execute identical Transactional Block as Stripe payment confirmation
```

---

### 3.3 WebSocket Notification Architecture & Wishlist Price Drop Engine

Rather than relying on expensive managed message brokers (like Pusher), NexTech uses a self-hosted **Soketi** container. This provides high-performance WebSocket broadcasting with zero additional messaging cost.

```
Product price updated by Admin (below original price)
        │
        ▼
Trigger Wishlist Price Drop Service
Scan `Favorite` table to locate all users who have favorited the product
        │
        ▼
For each target user:
  1. Write `wishlist_price_drop` alert entry to `Notification` table
  2. Read active Socket connection on private channel: `private-user-{id}`
  3. Dispatch instant WebSocket event using Pusher SDK to Soketi
  4. Soketi broadcasts to Client Browser websocket client
  5. Render instant live Toast alert directly on the user's screen
  6. Simultaneously render EJS `wishlistPriceDrop.ejs` HTML template
  7. Queue Priority HTML email notification via Nodemailer
```

#### Private Channel Security
All user channels (`private-user-{userId}`) require secure subscriptions. The client library (`pusher-js`) requests auth validation by calling `POST /api/notifications/auth`. The backend's validation middleware protects this route, ensuring users can only subscribe to channels that match their authenticated user ID.

---

### 3.4 AI Chatbot (Gemini Integration)

NexTech includes an AI-powered shopping assistant ("Mua Cùng AI") integrated with the Google Gemini API. The chatbot can answer product questions, provide recommendations, and assist with the shopping experience.

```
User opens chat widget → Types a message
        │
        ▼
POST /api/ai-chat/send (authenticated user)
POST /api/ai-chat/send-guest (guest — no JWT required)
        │
        ▼
Backend constructs a context-rich prompt including:
  - Active product catalog data (names, prices, categories)
  - User's chat history (last 20 messages from DB or localStorage)
  - Current shop settings
        │
        ▼
Send prompt to Gemini API (Google AI)
        │
        ▼
Parse response → Save to AIChatMessage table (if authenticated)
        │
        ▼
Return reply to client → Display in chat UI
```

- **Authenticated users**: History persisted in `AIChatMessage` table, accessible across sessions.
- **Guest users**: History stored in browser `localStorage`, sent with each request.
- **Rate limited**: 10 requests per minute per IP (`aiLimiter` middleware).
- **Admin**: Can use Gemini to auto-generate product descriptions (`POST /api/admin/products/generate-description`).

---

### 3.5 In-Process Scheduled Jobs (node-cron)

To keep server operations simple and lightweight, NexTech uses in-process **node-cron** workers to manage background schedules. This removes the need for complex, heavy message-queuing infrastructure like Redis and BullMQ.

| Job Name | Schedule | Purpose | Execution Logic |
| :--- | :--- | :--- | :--- |
| `expirationJob` | Every 1 minute | Cancels expired unpaid orders. | Scans `Order` table for items with PENDING status older than 15 minutes. Updates status to CANCELLED and restores stock counts. |
| `lowStockJob` | Every 1 hour | Alerts administrators of low inventory. | Scans `Product` and `ProductVariant` models where stock is below `lowStockThreshold`. Sends combined email digest to administrators. |
| `lowOrderAlertJob`| Hourly/Daily/Monthly | Sales drops detection system. | Counts orders inside current interval, matches with shop settings threshold, sends email warnings to store owners. |
| `publishScheduledPostsJob` | Every 1 minute | Publishes scheduled blog posts. | Scans `Post` table where status is `SCHEDULED` and `scheduledAt <= now()`. Flips status to `PUBLISHED`. |
| `scheduledEmailJob` | Every 30 minutes| Emails fallback queue processing. | Scans `FailedEmail` table for failed SMTP delivery rows. Retries delivery via Gmail transporter, updating retry counts. |

---

### 3.6 Serial & IMEI Tracking Mechanics

Premium electronics require precise unit tracking to handle warranty periods and prevent inventory loss. NexTech supports tracking inventory both via simple integer counts and at the individual item level using **Serial/IMEI numbers**.

```
Supplier Batch
    │
    ▼
Admin creates StockImport (Supplier, Product, Cost, list of Serials)
    │
    ▼
System automatically inserts n rows into `SerialUnit` table
  - SerialUnit.serial = "IMEI88771122"
  - SerialUnit.status = IN_STOCK
    │
    ▼
User places Order for the product & completes payment
    │
    ▼
OrderItem status transitions to PENDING_SERIAL_ASSIGNMENT
    │
    ▼
Admin views order dashboard, selects from list of available IN_STOCK SerialUnits
Updates assignment via POST `/api/admin/orders/assign-serial`
  - SerialUnit.status transitions to SOLD
  - SerialUnit.soldAt = now()
  - OrderItem.serialUnitId is locked to the specific SerialUnit ID
```

This tracking setup creates an immutable warranty chain, linking individual physical devices back to their specific supplier batch, order invoice, and customer record.

---

## 4. Notable Engineering Design Decisions

### 4.1 Why Soketi over Pusher SaaS?
Using Soketi gives us a self-hosted, local WebSocket server that operates completely free of charge. Since it uses the same protocol as Pusher, we can write our frontend and backend integrations using standard, highly-stable Pusher SDKs (`pusher-js` and `pusher` Node package). This means we can scale connections up indefinitely without paying for subscription tiers, and we can switch back to a managed SaaS platform in the future simply by updating our environment variables.

### 4.2 Why in-process node-cron over BullMQ/Redis?
At NexTech's current scale, managing background tasks with in-process `node-cron` workers drastically simplifies our deployment stack. There is no need to run and maintain separate worker processes or run a Redis instance just to handle basic timing routines. This keeps our memory footprint on virtual servers very low and lets us run the entire backend containerized on simple, low-cost VPS instances.

### 4.3 Why cookie-based JWT over LocalStorage?
Storing authentication tokens in standard web storage makes applications highly vulnerable to token hijacking via Cross-Site Scripting (XSS) attacks. By packing both access and refresh tokens into HttpOnly cookies, we guarantee that client-side JavaScript cannot read or modify the credentials, protecting our users' accounts. Additionally, our `sameSite: 'lax'` cookie flags protect against Cross-Site Request Forgery (CSRF) attacks for standard navigation flows.
