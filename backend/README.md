# NexTech Backend ⚙️

The core logic and data processing system (Backend) of the NexTech project. Built on a REST API model with high scalability, security, and performance.

## 🛠️ Tech Stack

| Library / Framework | Role |
|---|---|
| [Node.js](https://nodejs.org/) v18+ | Runtime environment |
| [Express.js](https://expressjs.com/) | Web framework |
| [Prisma](https://www.prisma.io/) | ORM for PostgreSQL (type-safe queries) |
| [PostgreSQL](https://www.postgresql.org/) | Relational database |
| [Passport.js](https://www.passportjs.org/) | Auth: JWT, Google/Facebook OAuth |
| [Soketi](https://docs.soketi.app/) | Self-hosted Pusher-compatible WebSocket server |
| [Cloudinary](https://cloudinary.com/) | Cloud image storage & management |
| [Stripe API](https://stripe.com/docs/api) | Payment processing |
| [Nodemailer](https://nodemailer.com/) | Transactional emails via Gmail |
| [Node-cron](https://www.npmjs.com/package/node-cron) | Scheduled background tasks |
| [Bcrypt.js](https://www.npmjs.com/package/bcryptjs) + JWT | Password hashing & token security |
| [Zod](https://zod.dev/) + [Express Validator](https://express-validator.github.io/docs/) | Input validation |

---

## ✨ Key Features

- 🛡️ **Security**: JWT/Refresh token system for secure and convenient user authentication.
- ⚡ **Real-time**: Instant order status updates and system notifications via Soketi/WebSockets.
- 📉 **Flash Sale Engine**: Automatically manage inventory and promotion countdowns.
- 💶 **Coupon System**: Flexible discount code application (percentage or amount-based).
- 📜 **Digital Invoices**: Automatically generate professional PDF invoices upon order completion.
- ✉️ **Email Notifications**: Send order confirmations, invoices, and email verification codes.
- 📦 **Data Management**: Fast product lookup and filtering, with pagination support for large datasets.

---

## 🚀 Local Running Guide (Manual)

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v18+ installed.
- [PostgreSQL](https://www.postgresql.org/) v14+ running locally.
- A [Cloudinary](https://cloudinary.com/) account (free tier works).
- A Gmail account with [App Password](https://myaccount.google.com/apppasswords) enabled.
- **Soketi running** — see [Soketi Setup](#-soketi-setup--websocket-server) below.

---

## 🔌 Soketi Setup — WebSocket Server

NexTech uses **Soketi** as a self-hosted, Pusher-compatible WebSocket server for real-time features (order status updates, notifications, flash sale countdowns).

You must have Soketi running before starting the backend.

### Option A — Run via npx (no global install):

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

### Option B — Global install:

```bash
# Install globally
npm install -g @soketi/soketi

# Start the server
soketi start --config='{"debug":true,"appManager.driver":"array","appManager.array.apps":[{"id":"nextech-app","key":"nextech-key","secret":"nextech-secret","maxConnections":100}]}'
```

Soketi will run on **port 6001** by default. Keep the terminal open while developing.

> **Important:** The `id`, `key`, and `secret` in the config above must match the `SOKETI_APP_ID`, `SOKETI_APP_KEY`, and `SOKETI_APP_SECRET` values in your backend `.env` file.

---

### 2. Install Dependencies

```bash
# From the project root, navigate to the backend directory
cd backend

npm install
```

### 3. Environment Configuration

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Fill in all required values:

```dotenv
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nextech_db?schema=public

# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# JWT & Cookie Secrets (use long random strings)
ACCESS_TOKEN_SECRET=your-long-random-secret-1
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your-long-random-secret-2
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_SECRET=your-long-random-secret-3

# Stripe (from https://dashboard.stripe.com/)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=usd

# Cloudinary (from https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Gmail + App Password)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# App branding
APP_NAME=NexTech
FRONTEND_URL=http://localhost:5173

# Google OAuth (from https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Facebook OAuth (from https://developers.facebook.com/)
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback

# Soketi — must match your running Soketi instance config
SOKETI_APP_ID=nextech-app
SOKETI_APP_KEY=nextech-key
SOKETI_APP_SECRET=nextech-secret
SOKETI_HOST=localhost
SOKETI_PORT=6001
PUSHER_USE_TLS=false
```

### 4. Database Initialization

```bash
# Apply database schema migrations
npx prisma migrate dev

# (Optional) Seed sample data for testing
npm run db:seed
```

### 5. Start the Server

```bash
npm run dev
```

The API will run at: **`http://localhost:3000`**

---

## 🐳 Running with Docker (Recommended for Full Stack)

If you want to run the entire stack (DB + Soketi + Backend + Frontend + Nginx) together, use Docker Compose from the **project root**:

```bash
# From the project root directory
cd ..
docker compose up --build
```

> When running via Docker Compose, Soketi is automatically started as a container — no manual setup required. The backend connects to it via the internal Docker network using `soketi:6001`.

See the [root README](../README.md) for the complete Docker quickstart guide.

---

## 🏗️ Directory Structure

```text
src/
├── configs/        # Passport, Cloudinary, Stripe, i18n configuration
├── controllers/    # Business logic handlers for each endpoint
├── jobs/           # Cron jobs (Flash sale cleanup, Coupon expiry...)
├── middleware/     # Auth, Upload, Error handler, Role-based access
├── prisma/         # Database schema & migrations
├── routes/         # API endpoint definitions
├── services/       # Complex logic (Email, PDF generation, Stripe)
├── templates/      # EJS templates for Emails & Invoice PDFs
└── validations/    # Input validation schemas using Zod
```

---

## 🌐 Deployment (VPS)

In production, the backend is containerized via Docker Compose alongside PostgreSQL and Soketi. Nginx acts as a reverse proxy in front of all services with HTTPS provided by Let's Encrypt.

See the [root README](../README.md) for the full VPS deployment guide.

---
NexTech Backend - The backbone of modern commerce.
