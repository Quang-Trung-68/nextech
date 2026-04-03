# NexTech - Modern E-commerce Platform 🚀

Welcome to **NexTech**, an open-source all-in-one e-commerce solution. NexTech is designed with a high-end interface (Apple-inspired UX), a robust processing system, high scalability, and a modern deployment process using Docker.

[![Frontend](https://img.shields.io/badge/Frontend-React%2019-blue.svg)](./frontend)
[![Backend](https://img.shields.io/badge/Backend-Nodejs-green.svg)](./backend)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED.svg)](https://www.docker.com/)

---

## 🔗 Project Links
- **Live Demo:** [https://nextech.io.vn](https://nextech.io.vn)
- **Main Repo:** `https://github.com/Quang-Trung-68/ecommerce`

---

## 🏗️ System Architecture

The project is organized in a micro-services model (monorepo), communicating via REST API and WebSockets:

| Service | Tech | Role |
|---|---|---|
| **Frontend** | React 19 (Vite) + Nginx | User interface, Mobile-first, SEO |
| **Backend** | Node.js (Express) | Business logic, Payments, Auth |
| **Database** | PostgreSQL (Prisma) | Relational data storage |
| **Real-time** | Soketi | WebSocket server for live notifications |
| **Reverse Proxy** | Nginx | Traffic routing, SSL (HTTPS), Security |

---

## 📊 Key Features

1. **Shopping Experience:** Intelligent searching and filtering, persistent cart, and Stripe/COD payments.
2. **Flash Sale Engine:** Automatic countdown and real-time inventory management for promotion periods.
3. **Digital Invoices:** Automatically generate and send professional PDF invoices upon order success.
4. **Admin Dashboard:** Manage products, orders, customers, and VAT/Tax configurations.
5. **Marketing & Loyalty:** Discount code (Coupon) system, email verification codes.
6. **Multi-language & Dark Mode:** Vietnamese/English switching and automatic Dark mode support.

---

## 🐳 Quick Start — Run Everything with Docker (Recommended)

> **This is the fastest way to get the entire stack running locally with a single command.**
> Requires: [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine + Docker Compose v2.

### Step 1: Clone the repository

```bash
git clone https://github.com/Quang-Trung-68/ecommerce.git
cd ecommerce
```

### Step 2: Create the environment file

Copy the local environment template and fill in your credentials:

```bash
cp .env.deploy.template .env
```

Open `.env` and fill in **all required values** (marked with `<your-...>`):

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | Any strong password for the local DB |
| `DATABASE_URL` | Must use the same password as above |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` / `COOKIE_SECRET` | Any long random strings |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | From [Stripe Dashboard](https://dashboard.stripe.com/) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | From [Stripe Dashboard](https://dashboard.stripe.com/) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | From [Cloudinary Console](https://cloudinary.com/console) |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Gmail + [App Password](https://myaccount.google.com/apppasswords) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From [Google Cloud Console](https://console.cloud.google.com/) (OAuth 2.0) |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | From [Meta Developers](https://developers.facebook.com/) |

> **Soketi variables** (`SOKETI_APP_ID`, `SOKETI_APP_KEY`, `SOKETI_APP_SECRET`, `VITE_SOKETI_*`) are pre-filled with safe defaults in the template — you do **not** need to change them for local development.

For local development, update these URLs in your `.env`:

```dotenv
# Override these for local Docker usage
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

### Step 3: Build and start all services

```bash
docker compose up --build
```

> On the first run, Docker will pull images, build the app (~3–5 minutes), and automatically run database migrations.

To run in the background (detached mode):

```bash
docker compose up --build -d
```

### Step 4: Access the application

| Service | URL |
|---|---|
| 🌐 **Web App** | [http://localhost](http://localhost) |
| ⚙️ **API** | [http://localhost/api](http://localhost/api) |
| 🔌 **Soketi WS** | `ws://localhost:6001` |

### Useful commands

```bash
# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove all data (database volumes)
docker compose down -v

# Rebuild a specific service after code changes
docker compose up --build backend
```

### Soketi (realtime) — Docker vs trình duyệt

| Thành phần | Host WebSocket / HTTP tới Soketi | Ghi chú |
|------------|-----------------------------------|--------|
| **Frontend (JS trong browser)** | `localhost:6001` | Map từ `services.soketi.ports`. Không dùng hostname `soketi` — chỉ resolve trong mạng Docker. |
| **Backend (container)** | `soketi:6001` | Đặt qua `SOKETI_HOST` / `SOKETI_PORT` trong Compose. |

**Vì sao local `nvm use 18` + `npm run soketi` thì OK nhưng Docker “tắt”?**

- Compose từng ghi `VITE_SOKETI_ENABLED=false` → `frontend/src/lib/pusher.js` dùng client **noop**, không mở WebSocket dù container `soketi` vẫn chạy.
- Cần **`VITE_SOKETI_ENABLED=true`** và `VITE_SOKETI_APP_KEY` / `HOST` / `PORT` khớp `backend/soketi.json` (mặc định `nextech-key`, `localhost`, `6001`).

**Debug nhanh**

1. `docker compose ps` — service `soketi` có **Up** và port `6001`?
2. `docker compose logs -f soketi` — có lỗi bind / config?
3. Trình duyệt: DevTools → **Network** → **WS** — có kết nối tới `ws://localhost:6001` khi đăng nhập?
4. Sau khi sửa biến `VITE_*`: `docker compose up -d --force-recreate frontend` (Vite embed env lúc start).
5. Image Soketi dùng **Debian (glibc)**, không dùng Alpine: binary `uWebSockets.js` cần `ld-linux-x86-64.so.2` (không có trên musl).

---

## 💻 Local Running Guide (Manual — Development)

Use this approach if you want to develop with hot-reload and don't want to rebuild Docker images on every change.

### Prerequisites

Ensure your machine has the following installed:
- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) v14+
- [Git](https://git-scm.com/)
- **Soketi** (WebSocket server — see below)

### Step 1: Install & Run Soketi

Soketi is a self-hosted, Pusher-compatible WebSocket server used for real-time notifications.

**Option A — Using `npx` (no installation needed):**

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

**Option B — Global install:**

```bash
npm install -g @soketi/soketi
soketi start --config='{"debug":true,"appManager.driver":"array","appManager.array.apps":[{"id":"nextech-app","key":"nextech-key","secret":"nextech-secret","maxConnections":100}]}'
```

Soketi will run on port **6001** by default. Keep this terminal open.

> Make sure the `id`, `key`, and `secret` above match the `SOKETI_APP_*` values in your backend `.env`.

### Step 2: Run the Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and fill in all required values

# Run database migrations
npx prisma migrate dev

# (Optional) Seed sample data
npm run db:seed

# Start the dev server
npm run dev
```

The API will be available at: `http://localhost:3000`

### Step 3: Run the Frontend

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env — set VITE_API_URL and Soketi connection parameters

# Start the dev server
npm run dev
```

The app will be available at: `http://localhost:5173`

### Environment Variables for Manual Local Dev

**`backend/.env` key values:**
```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/nextech_db?schema=public
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
SOKETI_APP_ID=nextech-app
SOKETI_APP_KEY=nextech-key
SOKETI_APP_SECRET=nextech-secret
SOKETI_HOST=localhost
SOKETI_PORT=6001
PUSHER_USE_TLS=false
```

**`frontend/.env` key values:**
```dotenv
VITE_API_URL=http://localhost:3000/api
VITE_SOKETI_APP_KEY=nextech-key
VITE_SOKETI_HOST=localhost
VITE_SOKETI_PORT=6001
VITE_SOKETI_FORCE_TLS=false
```

---

## 🌐 VPS Deployment Guide (Production)

NexTech is designed for fast deployment on VPS environments using **Docker & Docker Compose**.

### 1. VPS Preparation

- Install **Docker** and **Docker Compose** on your VPS.
- Point 2 domain/subdomains to your VPS IP:
  - `nextech.io.vn` → Frontend
  - `api.nextech.io.vn` → Backend API + Soketi

### 2. Clone & Configure

```bash
git clone https://github.com/Quang-Trung-68/ecommerce.git
cd ecommerce
cp .env.deploy.template .env
```

Open `.env` and fill in all values for production (DB password, API keys, domains, etc.).

### 3. Initialize SSL (Let's Encrypt)

Run the `init-letsencrypt.sh` script to automatically obtain free HTTPS certificates:

```bash
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
```

### 4. Deploy All Services

```bash
docker compose up -d --build
```

Docker will build and start all 6 services (DB, Soketi, Backend, Frontend, Nginx, Certbot). Monitor status:

```bash
docker compose ps
docker compose logs -f
```

---

## 📁 Main Directory Structure

```text
.
├── backend/                # Node.js/Express API source code
│   ├── src/                # Application source
│   ├── Dockerfile          # Backend Docker image definition
│   ├── docker-entrypoint.sh# DB migration + server startup script
│   └── .env.example        # Environment variable template
├── frontend/               # React 19 (Vite) application
│   ├── src/                # Application source
│   ├── Dockerfile          # Frontend Docker image (multi-stage build)
│   └── .env.example        # Environment variable template
├── nginx/                  # Nginx reverse proxy config (production)
├── certbot/                # SSL certificate storage (auto-generated)
├── docker-compose.yml      # Orchestration file for all services
├── .env.deploy.template    # Environment variables template
└── init-letsencrypt.sh     # SSL initialization script for VPS
```

---

## 📝 Contact and Contributions

Built with passion to bring the best E-commerce solution. Any feedback, please create a GitHub Issue or contact via email [INSERT CONTACT EMAIL HERE].

---
NexTech - Buy more, Build better.
