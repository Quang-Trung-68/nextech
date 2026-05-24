# Changelog

All notable changes to NexTech are documented in this file.

Format: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH — YYYY-MM-DD`

---

## v1.3.0 — 2026-05-24

### Added
- **Interactive Scalar API Reference**: Integration of self-hosted `@scalar/express-api-reference` at `/api-docs` using the full OpenAPI 3.0 specification with 3-column UI, interactive testing, and dark mode.
- **Homepage Live Flash Sale**: Interactive homepage showcase with high-performance real-time countdown, animated fire elements, and custom stock sold indicators with dynamic gradient progress bars.
- **Wishlist & Price Drop Alerts**: Trigger-based wishlist notification engine. Automatically detects price drops, updates database notifications, broadcasts real-time WebSockets via Soketi, and sends HTML transactional emails using Nodemailer and custom EJS templates.
- **Admin Dashboard leaderboards**: REST layout featuring top 5 best-selling products list side-by-side with Recharts revenue graphs, equipped with ranking medals, sales progress bars, and product thumbnails.
- **Customer Addresses Viewer**: Pop-up directory displaying full customer address books dynamically retrieved through database queries in the admin user panel.
- **Admin Order Notes**: Internal secure annotations (`adminNote` field in Prisma schema and database) with a `PATCH` route `/api/admin/orders/:id/note` and details modal text editor.

## v1.2.0 — 2026-04-07

### Added
- Production deployment on VPS with shared Nginx proxy and `shared-proxy-network` for multi-app routing
- Automated Let's Encrypt SSL via Certbot container with renewal loop
- GitHub Actions CI/CD pipeline: ESLint → Docker Buildx → push to GHCR → SSH deploy → `prisma migrate deploy`
- Multi-language support (Vietnamese / English) via i18next and browser language detection

### Changed
- Nginx config extended to support co-hosted NexChat on the same VPS
- `docker-entrypoint.sh` now runs `prisma migrate deploy` on every container start as a safety net

---

## v1.1.0 — 2026-03-28

### Added
- **IMEI / serial tracking** — `SerialUnit` model with `IN_STOCK → RESERVED → SOLD` lifecycle
- **Supplier & stock import management** — admin can create suppliers and record incoming stock with per-unit serial numbers
- **VAT invoice workflow** — VAT fields on checkout, `Invoice` / `InvoiceItem` models, PDF generation via PDFKit, email delivery
- **Blog / news module** — TipTap rich text editor, categories, tags, post scheduling, view counters
- **Coupon engine** — percentage and fixed-amount codes with per-user and global usage caps
- **Time-limited sale pricing** — `salePrice`, `saleExpiresAt`, `saleStock`, `saleSoldCount` on products and variants
- **Admin dashboard analytics** — revenue charts (Recharts), order volume stats, low-stock reports
- **Scheduled cron jobs** — low-stock alerts, low-order-volume alerts (hourly / daily / monthly in Asia/Ho_Chi_Minh), scheduled post publishing, failed email retry queue
- Dark mode support via next-themes

### Changed
- Order service refactored to use `orderStateMachine.js` for status transitions
- Payment webhook handlers unified into shared `finalizeOrderPaid()` logic

---

## v1.0.0 — 2026-03-14

### Added
- Project scaffolding: Express backend, React 19 + Vite frontend, PostgreSQL via Prisma ORM
- Product catalog with brands, images, specs JSON, per-product ratings and review counts
- **Product variant system** — dynamic attribute matrix (e.g. Color × Storage) with per-variant price and stock
- Shopping cart with variant support, persistent across sessions
- Order creation with COD payment method
- **Stripe payment integration** — PaymentIntents, webhook-driven confirmation, idempotent order finalization
- **SePay / VietQR integration** — Vietnamese bank transfer checkout with IPN webhook
- JWT authentication with HttpOnly cookie, refresh token rotation, and `RevokedToken` table
- OAuth2 social login — Google and Facebook via Passport.js
- Email verification and password reset (Nodemailer + EJS templates)
- Cloudinary image upload for products and user avatars
- Real-time notifications via self-hosted Soketi (Pusher protocol)
- Unpaid order expiry cron job (cancels Stripe/SePay orders after 15 minutes, restores stock)
- Admin panel: product CRUD, order management, user management, banner and brand management
- Docker Compose development stack (Postgres, Soketi, backend, frontend)
