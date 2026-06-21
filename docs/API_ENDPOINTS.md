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
| `GET` | `/api/auth/verify-email/:token` | Public | Verifies account email address via token link. |

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
| `GET` | `/api/products/:slug` | Public | Retrieves full product specification by URL slug. |
| `GET` | `/api/products/:id/reviews`| Public | Fetch product reviews. |

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
| `POST` | `/api/orders/:id/cancel`| Protected (User) | User-initiated order cancellation (only if status is PENDING). |

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
| `POST` | `/api/ai-chat` | Protected (User) | Interacts with the Gemini-powered shop assistant. |
| `GET` | `/api/ai-chat/history` | Protected (User) | Fetches historical messages for the customer's chat interface. |

**POST `/api/ai-chat`**
*   **Request Body**:
    ```json
    {
      "message": "I'm looking for a tablet under 15 million VND with good screen quality."
    }
    ```
*   **Response Example**:
    ```json
    {
      "status": "success",
      "data": {
        "response": "Based on your budget, I highly recommend the **iPad Air 5 M1**. It features a 10.9-inch Liquid Retina display with wide color gamut and True Tone. Our current price is **14,500,000 VND**, which fits perfectly under your budget of 15 million. Would you like me to add it to your shopping cart?"
      }
    }
    ```

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
| `GET` | `/api/admin/orders/:id` | Single order detail. |
| `PATCH` | `/api/admin/orders/:id/status` | Transition order status. |
| `PATCH` | `/api/admin/orders/:id/assign-serial` | Assign IMEI/serial to a paid order item. |
| `GET` | `/api/admin/orders/:id/available-serials` | List available serials for an order. |

---

### 3.5 Inventory & Serial Tracking

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/suppliers` | List registered suppliers. |
| `POST` | `/api/admin/suppliers` | Register a new supplier. |
| `POST` | `/api/admin/stock-imports` | Record bulk stock import with serial numbers. |
| `GET` | `/api/admin/serial-units` | List serial units with status/SKU filter. |
| `GET/PUT` | `/api/admin/products/:id/serials` | Manage serial numbers for a product. |

---

### 3.6 Brands & Banners

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/brands` | List all brands. |
| `POST` | `/api/admin/brands` | Create a brand. |
| `PUT` | `/api/admin/brands/:id` | Update a brand. |
| `DELETE` | `/api/admin/brands/:id` | Delete a brand. |
| `GET` | `/api/admin/banners` | List banners. |
| `POST` | `/api/admin/banners` | Create a banner. |
| `PUT` | `/api/admin/banners/:id` | Update a banner. |
| `DELETE` | `/api/admin/banners/:id` | Delete a banner. |

---

### 3.7 Blog / News Management

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/posts?page&limit&status&category` | List posts (including scheduled/drafts). |
| `POST` | `/api/admin/posts` | Create a post. |
| `PATCH` | `/api/admin/posts/:id` | Update a post. |
| `DELETE` | `/api/admin/posts/:id` | Delete a post. |
| `GET` | `/api/admin/tags?search` | Search/create tags for posts. |

---

### 3.8 Invoices, Settings & Notifications

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/invoices` | List generated VAT invoices. |
| `POST` | `/api/admin/invoices/generate/:orderId` | Generate VAT invoice PDF. |
| `GET` | `/api/admin/invoices/:id/pdf` | Download invoice PDF. |
| `GET/PATCH` | `/api/admin/settings` | Shop configuration (tax, thresholds, etc.). |
| `POST` | `/api/notifications/auth` | Pusher/Soketi private channel auth (rate limited: 60 req/min). |
