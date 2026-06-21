# NexTech — REST API Reference Specification

This document provides a comprehensive list of core and administrative REST API endpoints for the NexTech platform. 

The API is self-documented in detail via a built-in **Scalar API Reference** interactive dashboard, mounted at `/api-docs` (and compiled from [openapi.js](file:///home/trungdang/Development/projects/nextech/backend/src/docs/openapi.js)).

---

## 1. Global API Conventions

### 1.1 Base URL
*   **Local Development**: `http://localhost:3000`
*   **Production**: `https://api.nextech.io.vn`

### 1.2 Authentication Schemes
NexTech uses two primary mechanisms of authentication:
1.  **HttpOnly Cookies (Recommended / Web client default)**:
    *   `access_token`: Short-lived session token (expires in 1h).
    *   `refresh_token`: Long-lived session renewal token (expires in 7d).
2.  **Bearer Headers (API Clients)**:
    *   `Authorization: Bearer <JWT_ACCESS_TOKEN>`

### 1.3 Common Response Wrapper
All standard JSON responses adhere to the following structures:

**Success Response**:
```json
{
  "success": true,
  ...data
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Detailed error explanation goes here",
  "stack": "..." // Only included in development (NODE_ENV=development)
}
```

---

## 2. Core Client APIs (Public & User-Protected)

### 2.1 Authentication & Session Management (`/api/auth`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new customer account. |
| `POST` | `/api/auth/login` | Public | Auths user, returns session tokens (HttpOnly cookies). |
| `POST` | `/api/auth/logout` | Public | Revokes refresh token, deletes client cookies. |
| `POST` | `/api/auth/refresh` | Public | Rotates access/refresh tokens. |
| `GET` | `/api/auth/me` | Protected (User) | Returns the currently authenticated user's profile. |
| `GET` | `/api/auth/verify-email` | Public | Verifies account email address via token link (query param `token`). |
| `POST` | `/api/auth/send-verification-email` | Protected (User) | Re-sends the verification email for unverified accounts. |
| `PATCH` | `/api/auth/change-password` | Protected (User, verified email) | Changes the user's password (requires current password). |
| `POST` | `/api/auth/forgot-password` | Public | Sends password reset email (anti-enumeration — always returns 200). |
| `POST` | `/api/auth/reset-password` | Public | Resets password using reset token from email link. |
| `GET` | `/api/auth/google` | Public | Initiates Google OAuth2 consent screen redirect. |
| `GET` | `/api/auth/google/callback` | Public | Google OAuth2 callback — creates/logs in user. |
| `GET` | `/api/auth/facebook` | Public | Initiates Facebook OAuth consent screen redirect. |
| `GET` | `/api/auth/facebook/callback` | Public | Facebook OAuth callback — creates/logs in user. |

#### Authentication Body Payload Examples

**POST `/api/auth/register`**
*   **Request Body**:
    ```json
    {
      "name": "Alex Mercer",
      "email": "alex.mercer@example.com",
      "password": "SecurePassword123!",
      "phone": "0987654321"
    }
    ```
*   **Response (`201 Created`)**:
    ```json
    {
      "success": true,
      "message": "Registration successful",
      "user": {
        "id": "clxb93jdf0000u8u084ksd8fk",
        "name": "Alex Mercer",
        "email": "alex.mercer@example.com",
        "isEmailVerified": false
      }
    }
    ```

**POST `/api/auth/login`**
*   **Request Body**:
    ```json
    {
      "email": "alex.mercer@example.com",
      "password": "SecurePassword123!"
    }
    ```
*   **Response (`200 OK`)**:
    *(Set-Cookie headers automatically dispatch `access_token` and `refresh_token` as HttpOnly, Secure, SameSite=Lax)*
    ```json
    {
      "success": true,
      "user": {
        "id": "clxb93jdf0000u8u084ksd8fk",
        "name": "Alex Mercer",
        "email": "alex.mercer@example.com",
        "isEmailVerified": false
      }
    }
    ```

---

### 2.2 Product Catalog (`/api/products`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | Retrieves products list with rich search/sort/filter options. |
| `GET` | `/api/products/brands` | Public | Retrieves distinct brands by product type/category. |
| `GET` | `/api/products/brands/top` | Public | Retrieves top brands by product count. |
| `GET` | `/api/products/by-slug/:slug` | Public | Retrieves full product specification by URL slug. |
| `GET` | `/api/products/:id` | Public | Retrieves product by ID. |
| `GET` | `/api/products/:id/related` | Public | Retrieves related products (same category, excl. current). |
| `GET` | `/api/products/:productId/reviews`| Public | Fetch product reviews with pagination. |

#### Product Filtering Parameters
**GET `/api/products`**
*   **Query Parameters**:
    *   `search` (String): Full-text search on product names/descriptions.
    *   `category` (String): Filter by category (e.g., `phone`, `laptop`, `tablet`).
    *   `brand` (String): Filter by Brand ID.
    *   `minPrice`, `maxPrice` (Number): Price range bounds.
    *   `sort` (String): `price_asc`, `price_desc`, `rating_desc`, `newest`.
    *   `page` (Number), `limit` (Number): Pagination boundaries.
*   **Response Example**:
    ```json
    {
      "status": "success",
      "data": {
        "products": [
          {
            "id": "prod_123",
            "name": "iPhone 15 Pro Max",
            "slug": "iphone-15-pro-max",
            "price": "34990000.00",
            "category": "phone",
            "stock": 42,
            "images": [{"url": "https://res.cloudinary.com/.../img.png"}],
            "brand": { "name": "Apple" }
          }
        ],
        "pagination": {
          "total": 1,
          "page": 1,
          "limit": 10,
          "pages": 1
        }
      }
    }
    ```

---

### 2.3 Shopping Cart (`/api/cart`)

User-protected. If unauthenticated, the React SPA client manages cart state in browser LocalStorage, merging it with the database on login.

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cart` | Protected (User) | Returns the user's active database cart. |
| `POST` | `/api/cart/items` | Protected (User) | Adds an item or product variant to the cart. |
| `PATCH` | `/api/cart/items/:id` | Protected (User) | Updates the quantity of a specific cart item. |
| `DELETE`| `/api/cart/items/:id` | Protected (User) | Removes an item from the cart. |
| `DELETE`| `/api/cart/clear` | Protected (User) | Fully empties the shopping cart. |

**POST `/api/cart/items`**
*   **Request Body**:
    ```json
    {
      "productId": "prod_123",
      "variantId": "var_space_gray_256", // Optional (if variants exist)
      "quantity": 2
    }
    ```

---

### 2.4 Order & Checkout Workflow (`/api/orders`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Verified User | Creates a pending order, lock-reserves inventory. |
| `GET` | `/api/orders` | Protected (User) | List authenticated user's orders with pagination. |
| `GET` | `/api/orders/:id` | Protected (User) | Fetch specific order details (including assigned IMEI serials). |
| `PATCH` | `/api/orders/:id/cancel`| Protected (User) | User-initiated order cancellation (only PENDING/CONFIRMED). |
| `PATCH` | `/api/orders/:id/return` | Protected (User) | Request return for completed orders (COMPLETED → RETURNED). |
| `GET`| `/api/orders/:orderId/reviewable-items` | Protected (User, verified email) | List order items eligible for review. |

**POST `/api/orders`**
*   **Request Body**:
    ```json
    {
      "paymentMethod": "STRIPE", // STRIPE, SEPAY, or COD
      "shippingAddressId": "addr_9988",
      "couponCode": "SUMMER10", // Optional
      "vatInvoiceRequested": true, // Optional VAT request
      "vatBuyerType": "COMPANY",
      "vatBuyerName": "Alex Mercer",
      "vatBuyerEmail": "billing@alexco.com",
      "vatBuyerCompany": "Alex Mercer Enterprises Co.",
      "vatBuyerTaxCode": "0102030405",
      "vatBuyerCompanyAddress": "456 Corporate Dr, District 1, HCMC"
    }
    ```
*   **Response Example**:
    ```json
    {
      "status": "success",
      "data": {
        "order": {
          "id": "ord_8877",
          "totalAmount": "31491000.00",
          "status": "PENDING",
          "paymentStatus": "UNPAID",
          "stripeClientSecret": "pi_123_secret_xyz..." // Returned if method is STRIPE
        }
      }
    }
    ```

---

### 2.5 Gateway Payments (`/api/payments`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/intent/:orderId` | Protected | Regenerates/fetches Stripe PaymentIntent client secret. |
| `POST` | `/api/payments/sepay/:orderId` | Protected | Generates QR payment checkout URL for SePay (VietQR). |
| `GET` | `/api/payments/status/:orderId` | Protected | Polls real-time payment completion status. |
| `POST` | `/api/payments/webhook` | Webhook (Stripe)| Stripe payment_intent.succeeded webhook handler. |
| `POST` | `/api/payments/sepay/webhook` | Webhook (SePay) | SePay Instant Payment Notification (IPN) webhook handler. |

---

### 2.6 AI Customer Service Assistant (`/api/ai-chat`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai-chat/send` | Protected (User) | Interacts with the Gemini-powered shop assistant. |
| `POST` | `/api/ai-chat/send-guest` | Public | Guest chat mode (history stored in localStorage). |
| `GET` | `/api/ai-chat/history` | Protected (User) | Fetches historical messages for the customer's chat interface. |
| `DELETE` | `/api/ai-chat/history` | Protected (User) | Clears the user's entire AI chat history. |

**POST `/api/ai-chat/send`**
*   **Request Body**:
    ```json
    {
      "message": "I'm looking for a tablet under 15 million VND with good screen quality."
    }
    ```
*   **Response Example**:
    ```json
    {
      "success": true,
      "data": {
        "reply": "Based on your budget, I highly recommend the **iPad Air 5 M1**. It features a 10.9-inch Liquid Retina display with wide color gamut and True Tone. Our current price is **14,500,000 VND**, which fits perfectly under your budget of 15 million. Would you like me to add it to your shopping cart?"
      }
    }
    ```

---

### 2.7 Product Reviews (`/api/reviews`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | Protected (User, verified email) | Create a review for a delivered order item. |
| `DELETE` | `/api/reviews/:reviewId` | Admin | Admin-only: delete a review (moderation). |

---

### 2.8 Favorites / Wishlist (`/api/favorites`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/favorites` | Protected (User) | List all favorited products with pagination. |
| `POST` | `/api/favorites/:productId` | Protected (User) | Toggle product in/out of wishlist. |

---

### 2.9 Coupon Validation (`/api/coupons`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/coupons/validate` | Protected (User) | Validate coupon code, return discount amount. |

---

### 2.10 Active Banners (`/api/banners`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/banners/active` | Public | Returns active promotional banners for the homepage. |

---

### 2.11 Public Blog / News (`/api/posts`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | Public | Published posts list with pagination, category/tag filter. |
| `GET` | `/api/posts/:slug` | Public | Single post detail by slug. |
| `GET` | `/api/posts/related/:slug` | Public | Related posts (same category, excl. current). |

---

### 2.12 Product Categories (`/api/categories`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | List all product categories. |

---

### 2.13 Tags (`/api/tags`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tags` | Public | List all blog tags. |

---

### 2.14 User Profile & Addresses (`/api/users`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/api/users/me` | Protected (User, verified email) | Update profile (name, phone, avatar). |
| `POST` | `/api/users/me/avatar` | Protected (User, verified email) | Upload avatar image (multipart). |
| `GET` | `/api/users/me/addresses` | Protected (User, verified email) | List saved shipping addresses. |
| `POST` | `/api/users/me/addresses` | Protected (User, verified email) | Create a new address. |
| `PATCH` | `/api/users/me/addresses/:id` | Protected (User, verified email) | Update an address. |
| `DELETE` | `/api/users/me/addresses/:id` | Protected (User, verified email) | Delete an address. |
| `PATCH` | `/api/users/me/addresses/:id/default` | Protected (User, verified email) | Set an address as default. |

---

### 2.15 Notifications (`/api/notifications`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/notifications/auth` | Protected (User or Admin) | Pusher/Soketi private channel auth (rate limited: 60 req/min). |
| `GET` | `/api/notifications` | Protected (User or Admin) | List user/admin notifications with pagination. |
| `GET` | `/api/notifications/unread-count` | Protected (User or Admin) | Get count of unread notifications. |
| `PATCH` | `/api/notifications/:id/read` | Protected (User or Admin) | Mark a single notification as read. |
| `PATCH` | `/api/notifications/read-all` | Protected (User or Admin) | Mark all notifications as read. |

---

## 3. Administrative Management APIs (Admin-Only)

Requires authentication cookie verified by `adminProtect` middleware (separate `Admin` table with its own JWT token type `ADMIN`).

### 3.1 Dashboard & Reporting

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/stats/overview?period=day\|week\|month` | Fetches revenue, orders, users, top products. |
| `GET` | `/api/admin/stats/revenue?year=YYYY&month=MM\|all` | Timed interval sales stats for Recharts. |

---

### 3.2 User Management

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/users?page&limit&search&isActive&sortBy&sortOrder` | Paginated list of regular users (excludes admin accounts). |
| `GET` | `/api/admin/users/:id` | Single user detail with paginated order history. |
| `PATCH` | `/api/admin/users/:id/toggle-status` | Activate / deactivate a user account. |
| `GET` | `/api/admin/admins?page&limit&search` | Paginated list of admin accounts. |

---

### 3.3 Product Management

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/products?page&limit&search&category&sort` | List products with rich filtering. |
| `GET` | `/api/admin/products/:id` | Single product detail + variants + attributes. |
| `POST` | `/api/admin/products` | Create a new product. |
| `PATCH` | `/api/admin/products/:id` | Update product details. |
| `DELETE` | `/api/admin/products/:id` | Delete a product. |
| `POST` | `/api/admin/products/upload-images` | Upload temporary images to Cloudinary (multipart). |
| `DELETE` | `/api/admin/products/images/:publicId` | Delete a temporary image from Cloudinary. |
| `POST` | `/api/admin/products/generate-description` | AI-generated product description via Gemini. |
| `GET/PUT` | `/api/admin/products/:id/attributes` | Manage product attribute definitions. |
| `GET/PUT` | `/api/admin/products/:id/variants` | Manage product variant matrix. |
| `PATCH` | `/api/admin/products/:id/variants/:variantId` | Update a specific variant. |
| `DELETE` | `/api/admin/products/:id/variants/:variantId` | Delete a variant. |

---

### 3.4 Order Operations & Serial Assignment (`/api/admin/orders`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/orders?page&limit&status&search` | List all orders with advanced filters. |
| `GET` | `/api/admin/orders/:id` | Single order detail including items, user, invoice. |
| `PATCH` | `/api/admin/orders/:id/status` | Transition order status through workflow. |
| `PATCH` | `/api/admin/orders/:id/assign-serial` | Assign IMEI/serial to a paid order item. |
| `GET` | `/api/admin/orders/:id/available-serials` | List available IN_STOCK serials for an order's items. |
| `PATCH` | `/api/admin/orders/:id/note` | Add/edit internal admin note on an order. |
| `GET` | `/api/admin/orders/:orderId/invoice` | Get invoice details for an order. |
| `POST` | `/api/admin/orders/:orderId/invoice` | Manually create invoice for an order. |

---

### 3.5 Inventory & Serial Tracking (`/api/admin/inventory`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/inventory/suppliers?page&limit&search` | List registered suppliers. |
| `POST` | `/api/admin/inventory/suppliers` | Register a new supplier. |
| `PATCH` | `/api/admin/inventory/suppliers/:id` | Update a supplier. |
| `GET` | `/api/admin/inventory/stock-imports?page&limit` | List stock import records. |
| `POST` | `/api/admin/inventory/stock-imports` | Record bulk stock import with serial numbers. |
| `GET` | `/api/admin/inventory/stock-imports/:id` | Get single stock import detail with serials. |
| `GET` | `/api/admin/inventory/serials?page&limit&status&search` | List serial units with status/product filter. |
| `GET` | `/api/admin/inventory/serials/lookup?serial=` | Lookup a specific serial number's details. |
| `GET` | `/api/admin/inventory/serials/low-stock` | Get low stock threshold alerts. |
| `GET` | `/api/admin/inventory/products/:id/serials` | List serials for a specific product. |

---

### 3.6 Brands & Banners

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/brands` | List all brands. |
| `POST` | `/api/admin/brands` | Create a brand (with logo upload). |
| `GET` | `/api/admin/brands/:id` | Get single brand details. |
| `PUT` | `/api/admin/brands/:id` | Update a brand (with logo upload). |
| `DELETE` | `/api/admin/brands/:id` | Delete a brand. |
| `POST` | `/api/admin/brands/upload-logo` | Upload a brand logo to Cloudinary (multipart). |
| `GET` | `/api/admin/banners` | List all banners (including inactive). |
| `POST` | `/api/admin/banners` | Create a banner (with image upload). |
| `PUT` | `/api/admin/banners/:id` | Update a banner (with image upload). |
| `DELETE` | `/api/admin/banners/:id` | Delete a banner. |
| `PATCH` | `/api/admin/banners/:id/toggle` | Toggle banner active/inactive. |
| `POST` | `/api/admin/banners/upload-image` | Upload a banner image to Cloudinary only. |

---

### 3.7 Blog / News Management (`/api/admin/posts`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/posts?page&limit&status&category` | List all posts (including drafts, scheduled, archived). |
| `POST` | `/api/admin/posts` | Create a post (TipTap content, cover image). |
| `GET` | `/api/admin/posts/:id` | Get single post by ID (all statuses). |
| `PATCH` | `/api/admin/posts/:id` | Update a post (content, cover image, category, tags). |
| `DELETE` | `/api/admin/posts/:id` | Delete a post (soft delete). |
| `PATCH` | `/api/admin/posts/:id/publish` | Publish a scheduled/draft post immediately. |
| `PATCH` | `/api/admin/posts/:id/schedule` | Set scheduled publish time for a post. |
| `PATCH` | `/api/admin/posts/:id/archive` | Archive a published post. |
| `POST` | `/api/admin/posts/upload-cover` | Upload a cover image to Cloudinary. |

### 3.8 Categories & Tags

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/categories` | Admin: Create a new category. |
| `PATCH` | `/api/categories/:id` | Admin: Update a category. |
| `DELETE` | `/api/categories/:id` | Admin: Delete a category. |
| `POST` | `/api/tags` | Admin: Create a new tag. |
| `DELETE` | `/api/tags/:id` | Admin: Delete a tag. |
| `GET` | `/api/admin/tags/search?q=` | Admin: Search tags by name (for autocomplete). |

### 3.9 Coupon Management (`/api/coupons`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/coupons` | Admin: List all coupons. |
| `POST` | `/api/coupons` | Admin: Create a new coupon (type, value, caps, expiry). |
| `DELETE` | `/api/coupons/:id` | Admin: Delete a coupon. |
| `PATCH` | `/api/coupons/:id/toggle` | Admin: Activate/deactivate a coupon. |

---

### 3.10 Invoices (`/api/admin/invoices`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/invoices/:invoiceId` | Get invoice detail (JSON). |
| `GET` | `/api/admin/invoices/:invoiceId/pdf` | Download invoice as PDF. |
| `POST` | `/api/admin/invoices/:invoiceId/resend` | Resend invoice email to customer. |
| `PATCH` | `/api/admin/invoices/:invoiceId/issue` | Transition invoice from DRAFT to ISSUED. |
| `PATCH` | `/api/admin/invoices/:invoiceId/cancel` | Cancel an invoice. |

### 3.11 Shop Settings (`/api/admin/settings`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/settings` | Get shop configuration (tax rates, low-stock threshold, order alert settings). |
| `PATCH` | `/api/admin/settings` | Update shop configuration. |

### 3.12 Admin Authentication (`/api/admin/auth`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/admin/auth/login` | Admin login (separate from user auth, rate limited). |
| `POST` | `/api/admin/auth/refresh` | Rotate admin refresh token. |
| `POST` | `/api/admin/auth/logout` | Admin logout (revoke tokens). |
| `GET` | `/api/admin/auth/me` | Get current admin profile. |

### 3.13 Product Variants & Attributes (`/api/admin/products/:id/...`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/products/:id/attributes` | List attribute definitions. |
| `PUT` | `/api/admin/products/:id/attributes` | Upsert attribute definitions. |
| `GET` | `/api/admin/products/:id/variants` | List variant matrix. |
| `PUT` | `/api/admin/products/:id/variants` | Upsert variant matrix (generates SKUs). |
| `PATCH` | `/api/admin/products/:id/variants/:variantId` | Update a single variant. |
| `DELETE` | `/api/admin/products/:id/variants/:variantId` | Delete a variant (soft). |

### 3.14 Product Images (`/api/admin/products/:id/images`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/admin/products/:id/images` | Upload images (max 10, multipart). |
| `DELETE` | `/api/admin/products/:id/images` | Delete specific images by public IDs. |
