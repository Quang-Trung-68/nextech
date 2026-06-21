# NexTech Admin CMS 🛠️

The admin control panel for the NexTech e-commerce platform, built for store operators to manage products, orders, users, inventory, and system settings.

## 🛠️ Tech Stack

| Library / Framework | Role |
|---|---|
| [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) | Core framework + build tooling |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling v4 |
| [Shadcn UI](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) | UI components |
| [Lucide React](https://lucide.dev/) | Icon library |
| [TanStack Query v5](https://tanstack.com/query/latest) | Server state and caching |
| [Zustand](https://github.com/pmndrs/zustand) | Client state (auth, sidebar, notifications) |
| [React Router v7](https://reactrouter.com/) | Client-side routing |
| [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Form handling and validation |
| [Recharts](https://recharts.org/) | Dashboard charts and analytics |
| [Pusher JS](https://pusher.com/) | Real-time notifications via Soketi |
| [date-fns](https://date-fns.org/) | Date utilities |

---

## ✨ Key Features

- 📊 **Dashboard**: Revenue charts, top-selling products, order/user statistics.
- 👥 **User & Admin Management**: Separate tabs for regular users and admin accounts; search, pagination, lock/unlock users; view customer addresses.
- 📦 **Product Management**: CRUD with attribute/variant matrix, image upload to Cloudinary, AI-generated descriptions via Gemini.
- 📋 **Order Management**: Full order lifecycle, serial/IMEI assignment, internal notes.
- 🏷️ **Brand & Banner Management**: CRUD for brands and promotional banners.
- 📰 **Blog / News Editor**: TipTap rich text editor, categories, tags, scheduling.
- 📄 **VAT Invoicing**: Generate and download PDF invoices.
- 🏭 **Inventory & Serials**: Supplier management, stock imports, serial unit tracking.
- ⚙️ **Settings**: Shop configuration, tax rates, alert thresholds.
- 🔔 **Real-time Notifications**: New order alerts via Soketi WebSocket with localStorage persistence.

---

## 🚀 Local Running Guide (Manual)

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v20+ installed.
- The **Backend must be running** first — see [backend README](../backend/README.md).

### 2. Install Dependencies

```bash
cd admin
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

# Stripe (publishable key)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Start the Dev Server

```bash
npm run dev
```

The admin panel will run at: **`http://localhost:5174`**

---

## 🐳 Running with Docker (Recommended)

The admin panel is included in the Docker Compose stack. From the **project root**:

```bash
# Development
docker compose up --build

# Production (with full stack)
docker compose -f docker-compose.prod.yml up -d --build
```

In production, the admin panel is served at **`https://admin.nextech.io.vn`** through the Nginx reverse proxy.

---

## 🏗️ Directory Structure

```text
src/
├── pages/          # Page components (admin, auth)
│   ├── admin/      # Admin pages (dashboard, users, orders, products...)
│   └── auth/       # Login page
├── features/       # Feature modules
│   ├── admin/      # Admin hooks (useAdmin), DataTable, StatusBadge
│   └── auth/       # Auth hooks (useLogin), LoginForm
├── components/     # Shared UI (button, dialog, table, badge, etc.)
├── hooks/          # Custom hooks (debounce, page title, pusher)
├── stores/         # Zustand stores (auth, sidebar, notifications)
├── lib/            # Axios instance, toast, utilities
├── i18n/           # Multi-language locales (vi, en)
├── schemas/        # Zod validation schemas
└── configs/        # Route configuration
```

---

## 🌐 Deployment (VPS)

In production, the admin panel is:
1. **Built** as a production-optimized static bundle by Vite.
2. **Served** by Nginx inside the `admin` container.
3. **Accessible** at `https://admin.nextech.io.vn` through the outer Nginx reverse proxy.

> All `VITE_*` environment variables are embedded at **build time** — changing them requires a rebuild (`docker compose -f docker-compose.prod.yml build admin`).

See the [root README](../README.md) for the full VPS deployment guide.

---

NexTech Admin - CMS for modern e-commerce operations.
