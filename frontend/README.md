# NexTech Frontend 🚀

The user-facing part of the NexTech project, built to deliver a modern, smooth, and optimized e-commerce experience on all devices.

## 🛠️ Tech Stack

| Library / Framework | Role |
|---|---|
| [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) | Core framework + ultra-fast build tooling |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling with responsive design |
| [Radix UI](https://www.radix-ui.com/) + [Shadcn UI](https://ui.shadcn.com/) | Accessible, Apple-inspired UI components |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Zustand](https://github.com/pmndrs/zustand) | Lightweight global state management |
| [TanStack Query v5](https://tanstack.com/query/latest) | Server state, caching, and data synchronization |
| [React Router v7](https://reactrouter.com/) | Client-side routing and navigation |
| [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Form handling and input validation |
| [i18next](https://www.i18next.com/) | Multi-language support (Vietnamese & English) |
| [Pusher JS](https://pusher.com/) | WebSocket client (connects to Soketi server) |
| [Stripe React](https://stripe.com/docs/stripe-js/react) | Payment UI integration |
| [Recharts](https://recharts.org/) | Admin dashboard charts and analytics |

---

## ✨ Key Features

- 📱 **Mobile-First Design**: UI specially optimized for mobile devices with 44px tap targets.
- 🌓 **Dark Mode**: Automatic and manual light/dark theme support.
- ⚡ **Flash Sale**: Real-time countdown system with live inventory updates via WebSockets.
- 🛒 **Smart Cart**: Instant updates and session persistence for logged-in users.
- 🌍 **Multi-language**: Flexible switching between Vietnamese and English.
- 🔐 **Security**: JWT authentication with refresh tokens and OAuth (Google/Facebook).
- 📊 **Admin Dashboard**: Detailed administrative interface with charts and pagination.

---

## 🚀 Local Running Guide (Manual)

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v18+ installed.
- The **Backend must be running** first — see [backend README](../backend/README.md).
- **Soketi must be running** — see [Soketi Setup in backend README](../backend/README.md#-soketi-setup--websocket-server).

### 2. Install Dependencies

```bash
# From the project root, navigate to the frontend directory
cd frontend

npm install
```

### 3. Environment Configuration

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Update the values in `.env`:

```dotenv
# Backend API URL
VITE_API_URL=http://localhost:3000/api

# Stripe (from https://dashboard.stripe.com/ — use the PUBLISHABLE key)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Soketi WebSocket connection
# Must match the config used when starting Soketi (see backend README)
VITE_SOKETI_APP_KEY=nextech-key
VITE_SOKETI_HOST=localhost
VITE_SOKETI_PORT=6001
VITE_SOKETI_FORCE_TLS=false
```

> **Note on Soketi variables:** The `VITE_SOKETI_APP_KEY` must match the `key` you configured when starting Soketi. If you used the default config from the backend README (`nextech-key`), no changes are needed.

### 4. Start the Dev Server

```bash
npm run dev
```

The application will run at: **`http://localhost:5173`**

---

## 🐳 Running with Docker (Recommended for Full Stack)

If you want to run the entire stack (Frontend + Backend + Soketi + DB + Nginx) together, use Docker Compose from the **project root**. The frontend is built as a production bundle and served by Nginx inside Docker.

```bash
# From the project root
cd ..
docker compose up --build
```

Access the app at: **`http://localhost`**

> When running via Docker, all environment variables (including `VITE_*` Soketi settings) are passed as Docker build arguments and baked into the JavaScript bundle at build time. They come from the root `.env` file.

See the [root README](../README.md) for the complete Docker quickstart guide.

---

## 🏗️ Directory Structure

```text
src/
├── api/            # Axios config & TanStack Query hooks
├── components/     # Shared UI components (Atoms, Molecules, Layouts)
├── configs/        # Route & i18n configurations
├── features/       # Logic & UI by feature (Auth, Cart, Orders, Admin...)
├── hooks/          # Custom hooks for reusable logic
├── pages/          # Main application pages (mapped to routes)
├── stores/         # Global state management (Zustand stores)
└── utils/          # Helper functions (currency formatting, dates...)
```

---

## 🌐 Deployment (VPS)

When deployed using Docker Compose, the frontend is:
1. **Built** as a production-optimized static bundle by Vite (during `docker compose up --build`).
2. **Served** by Nginx inside the `frontend` container for fast, zero-runtime static delivery.
3. **Accessible** through the outer Nginx reverse proxy which also handles SSL termination.

> All `VITE_*` environment variables are embedded at **build time** — changing them requires a rebuild (`docker compose up --build frontend`).

See the [root README](../README.md) for the full VPS deployment guide.

---
NexTech - Premium tech shopping experience.
