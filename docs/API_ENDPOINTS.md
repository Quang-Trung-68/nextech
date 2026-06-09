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
  "status": "success",
  "data": { ... }
}
```

**Error Response**:
```json
{
  "status": "error",
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
      "status": "success",
      "data": {
        "user": {
          "id": "clxb93jdf0000u8u084ksd8fk",
          "name": "Alex Mercer",
          "email": "alex.mercer@example.com",
          "role": "USER",
          "isEmailVerified": false
        }
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
      "status": "success",
      "data": {
        "user": {
          "id": "clxb93jdf0000u8u084ksd8fk",
          "name": "Alex Mercer",
          "email": "alex.mercer@example.com",
          "role": "USER",
          "isEmailVerified": false
        }
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

Requires authentication cookie and active role verification (`restrictTo('ADMIN')`).

### 3.1 Dashboards & Reporting (`/api/admin`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin | Fetches revenue, orders count, users count, and top selling products. |
| `GET` | `/api/admin/sales-chart` | Admin | Timed intervals sales statistics for Recharts chart render. |

---

### 3.2 Inventory & Serial Tracking (`/api/admin`)

Used to register stock imports from manufacturers and manage distinct IMEI / Serial units.

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/suppliers` | Admin | List registered suppliers. |
| `POST` | `/api/admin/suppliers` | Admin | Register a new supplier. |
| `POST` | `/api/admin/stock-imports` | Admin | Records bulk stock import from a supplier. |
| `GET` | `/api/admin/serial-units` | Admin | List individual serial units and filter by status or SKU. |

**POST `/api/admin/stock-imports`**
*   **Request Body**:
    ```json
    {
      "supplierId": "sup_apple_vn",
      "productId": "prod_iphone15",
      "variantId": "var_space_gray_256",
      "unitCost": 28000000.00,
      "notes": "Q2 Import Batch",
      "serials": ["IMEI99887711", "IMEI99887722", "IMEI99887733"] // Automatically creates 3 SerialUnits in IN_STOCK status
    }
    ```

---

### 3.3 Product & Matrix Setup (`/api/admin/products`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/products` | Admin | Create a new parent product listing. |
| `PATCH` | `/api/admin/products/:id` | Admin | Update product details. |
| `POST` | `/api/admin/products/:id/variants`| Admin | Setup a new matrix variant for a product. |
| `PATCH` | `/api/admin/products/variants/:id`| Admin | Update or soft-delete a product variant SKU. |

---

### 3.4 Order Operations & Serial Assignment (`/api/admin/orders`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/orders` | Admin | List all system orders with advanced filters. |
| `PATCH` | `/api/admin/orders/:id/status` | Admin | Transitions order status (e.g. `PENDING` -> `CONFIRMED`). |
| `PATCH` | `/api/admin/orders/:id/internal-note` | Admin | Update secure internal notes (`adminNote`) for reviews. |
| `POST` | `/api/admin/orders/assign-serial` | Admin | Assigns a physical IMEI serial number to a paid order item. |

**POST `/api/admin/orders/assign-serial`**
*   **Request Body**:
    ```json
    {
      "orderItemId": "ord_item_9911",
      "serialUnitId": "clxb9_serial_cuid" // Transitions SerialUnit.status to SOLD
    }
    ```
*   **Response (`200 OK`)**:
    ```json
    {
      "status": "success",
      "message": "Serial assigned successfully"
    }
    ```

---

### 3.5 Electronic VAT Invoicing (`/api/admin/invoices`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/invoices` | Admin | List generated VAT invoices. |
| `POST` | `/api/admin/invoices/generate/:orderId` | Admin | Compiles order snapshot, generates PDF, issues invoice. |
| `GET` | `/api/admin/invoices/:id/pdf` | Admin/User | Generates and pipes PDFKit invoice streams to browser. |

---

### 3.6 Shop Settings & Threshold Controls (`/api/admin/settings`)

| Method | Path | Auth Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/settings` | Admin | Fetch singleton shop and alert configuration variables. |
| `PATCH` | `/api/admin/settings` | Admin | Modify tax rates, brand headers, and cron parameters. |

**PATCH `/api/admin/settings`**
*   **Request Body**:
    ```json
    {
      "shopName": "NexTech HQ Store",
      "vatRate": 0.08, // 8% VAT rate (standard discount period)
      "lowStockAlertEnabled": true,
      "lowOrderAlertEnabled": true,
      "lowOrderAlertThreshold": 10,
      "lowOrderAlertInterval": "DAILY"
    }
    ```
