---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #0f172a
color: #e2e8f0
style: |
  section {
    font-family: 'system-ui', -apple-system, sans-serif;
    font-size: 22px;
    padding: 40px 60px;
  }
  h1 {
    color: #38bdf8;
    font-size: 1.8em;
  }
  h2 {
    color: #38bdf8;
    font-size: 1.4em;
    border-bottom: 2px solid #38bdf8;
    padding-bottom: 5px;
  }
  footer {
    font-size: 0.5em;
    color: #94a3b8;
  }
  header {
    font-size: 0.5em;
    color: #94a3b8;
  }
  strong {
    color: #f43f5e;
  }
  code {
    background-color: #1e293b;
    color: #38bdf8;
  }
  table {
    font-size: 0.8em;
    width: 100%;
  }
  th {
    background-color: #1e293b;
    color: #38bdf8;
  }
---

# BÁO CÁO BẢO VỆ ĐỒ ÁN TỐT NGHIỆP / MÔN HỌC

## ĐỀ TÀI: NEXTECH - NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ THIẾT BỊ CÔNG NGHỆ TIÊU DÙNG CHUYÊN SÂU

**Sinh viên thực hiện:** Đặng Quang Trung  
**Email:** trungdang.dqt@gmail.com | **GitHub:** Quang-Trung-68  
**Giảng viên hướng dẫn:** [Tên Giảng Viên Hướng Dẫn]  
**Trường/Khoa:** [Tên Trường / Khoa Công Nghệ Thông Tin]  

---

## 1. Đặt Vấn Đề & Mục Tiêu

**Thách thức:** Thị trường đồ công nghệ (ĐT, Laptop, Tablet) có yêu cầu đặc thù:
- Quản lý kho theo **IMEI/Serial** từng thiết bị; xuất **hóa đơn VAT** cho doanh nghiệp
- Bảo mật tài khoản (XSS/CSRF), xử lý bất đồng bộ thanh toán qua Webhook
- Cần trải nghiệm mua sắm thời gian thực, mượt mà

**Mục tiêu:**
- Hệ thống **Monorepo**: Frontend SPA + Backend REST API layered
- Thanh toán kép tự động: **Stripe** (quốc tế) + **SePay/VietQR** (nội địa)
- Quản lý vòng đời thiết bị qua `SerialUnit` (`IN_STOCK → RESERVED → SOLD → RETURNED`)
- Thông báo thời gian thực (**WebSocket Soketi**), AI Chatbot (Gemini API), hóa đơn VAT PDF tự động

---

## 2. Kiến Trúc & Công Nghệ

**Kiến trúc tổng quan:** Nginx Reverse Proxy + Docker Containers điều phối 5 dịch vụ:

```
                     ┌──────────────────────────┐
                     │      Client Browser      │
                     └──────┬────────────┬──────┘
                             ▼            ▼
                     ┌──────────────────────────────┐
                     │     Nginx Reverse Proxy      │
                     │  nextech.io.vn → frontend    │
                     │  admin.nextech.io.vn → admin │
                     │  api.nextech.io.vn → backend │
                     └──────┬────────────┬──────────┘
                            │            │
       ┌────────────────────┼────────────┼─────────────────────┐
       │                    │            │                     │
┌──────▼──────┐     ┌──────▼──────┐     │      ┌──────────────┐
│  Frontend   │     │    Admin    │     ├─────▶│    Soketi    │
│ (Nginx SPA) │     │  CMS (React)│     │      │ (WebSockets) │
└─────────────┘     └─────────────┘     │      └──────▲───────┘
                                         │             │ trigger
             ┌─────────────┐     ┌──────┴──────┐
             │ PostgreSQL  │◀────│   Backend   │
             │(Prisma ORM) │     │(Express.js) │
             └─────────────┘     └─────────────┘
```

| Tầng (Layer) | Công nghệ chính |
| :--- | :--- |
| **Frontend (User)** | React 19, Vite 8, React Router v7, Tailwind CSS v3, Shadcn/UI |
| **Admin CMS** | React 19, Vite 8, Shadcn/UI, TanStack Table, Recharts, TipTap |
| **State Management** | TanStack Query v5, Zustand |
| **Backend API** | Node.js, Express 4, Passport.js |
| **Database & ORM** | PostgreSQL 16, Prisma ORM v7 |
| **Real-time Engine** | Soketi (Self-hosted Pusher protocol) |
| **DevOps & Deploy** | Docker, Docker Compose, GitHub Actions, Nginx |

---

## 3. Thiết Kế Cơ Sở Dữ Liệu

**PostgreSQL** với **37 Models** chia 6 phân vùng:

1. **Người dùng & Bảo mật**: `User`, `Address`, `RefreshToken`, `RevokedToken`,...
2. **Danh mục sản phẩm**: `Product`, `ProductVariant`, ma trận cấu hình `ProductAttribute`
3. **Giỏ hàng & Đơn hàng**: `Cart`, `Order`, `Review`, `Coupon`
4. **Kho hàng & Serial**: `Supplier`, `StockImport`, `SerialUnit` (IMEI từng máy)
5. **Tiện ích & Vận hành**: `Notification`, `Post`, `AIChatMessage`, `FailedEmail`
6. **Quản trị nội bộ**: `Admin`, `AdminRefreshToken`

➔ *Toàn bộ tiền tệ dùng kiểu **`Decimal`** để triệt tiêu lỗi làm tròn dấu phẩy động.*

---

## 4. Cơ Chế Xác Thực Bảo Mật

**HttpOnly Cookie JWT Access/Refresh Token rotation** — token không lưu ở `localStorage` (chống XSS), `SameSite: Lax` (chống CSRF).

```
Đăng nhập ──▶ Tạo Access Token (1h) & Refresh Token (7d) ──▶ HttpOnly Cookie
                                                                     │
                              [Hết hạn Access Token sau 1h]          │
                                                                     ▼
               Interceptor React gọi POST `/api/auth/refresh` bằng Refresh Token
                                                                     │
                          Xác thực Refresh Token (Database + blacklist)
                                                                     │
                                                                     ▼
                           Thu hồi token cũ ──▶ Tạo cặp token mới
```

- **CSRF bổ sung**: Cookie `SameSite: Lax` + ký chữ ký request qua `COOKIE_SECRET`
- **Private channel Pusher**: Xác thực JWT riêng, ưu tiên `access_token` user trước, fallback `admin_access_token`

---

## 5. Thanh Toán Kép & Hóa Đơn VAT

### Stripe (Thẻ quốc tế)
1. Backend tạo `PaymentIntent` → Client redirect đến Stripe Checkout
2. Stripe gửi Webhook `payment_intent.succeeded` → Transactional cập nhật đơn hàng `CONFIRMED`, giảm kho, dọn giỏ

### SePay / VietQR (Chuyển khoản nội địa)
1. Tạo mã QR động chứa nội dung định danh (VD: `NEX1234`)
2. SePay bắt biến động số dư → IPN Webhook → tự động khớp mã & cập nhật đơn hàng

### Hóa đơn VAT điện tử
```
Điền MST tại Checkout ──▶ Admin xác nhận xuất hóa đơn
                                  │
                                  ▼
       Backend snapshot tài chính ──▶ PDFKit sinh PDF ──▶ Gửi email
```
➔ *Dữ liệu hóa đơn là **Immutable Snapshot** — giữ nguyên giá trị tại thời điểm mua.*

---

## 6. Quản Lý Serial IMEI & Real-time

### Vòng đời SerialUnit
```
Nhập kho (StockImport) ──▶ IN_STOCK ──▶ RESERVED (khi đặt) ──▶ SOLD (khi gán IMEI)
                                                                    │
                                                                     └── Bảo hành tra cứu ngược từ IMEI
```
➔ *Một serial chỉ gán cho một `OrderItem` duy nhất (`@@unique` constraint).*

### Hệ thống Real-time (Soketi)
- Máy chủ WebSocket tự dựng theo giao thức Pusher, chi phí thấp, độ trễ <10ms
- Private channel `private-user.{userId}` — bảo mật từng người dùng
- **Price Drop Alert**: Admin giảm giá → Quét `Favorite` → Đồng thời: ghi DB + gửi WebSocket toast + gửi Email HTML qua Nodemailer

---

## 7. Tác Vụ Nền & CI/CD

### Cron Jobs (node-cron, trong tiến trình backend)
| Tác vụ | Chu kỳ | Chức năng |
| :--- | :--- | :--- |
| `expirationJob` | 1 phút | Hủy đơn quá 15 phút chưa thanh toán, hoàn tồn kho |
| `lowStockJob` | 1 giờ | Cảnh báo Admin khi serial dưới ngưỡng |
| `lowOrderAlertJob` | Theo cấu hình | Cảnh báo Store Owner khi lượng đơn thấp |
| `publishScheduledPostsJob` | 1 phút | Đăng bài viết đã lên lịch |
| `scheduledEmailJob` | 30 phút | Gửi lại email lỗi từ bảng `FailedEmail` |

### CI/CD Pipeline
```
Commit `main` ──▶ GitHub Actions: Linter → Build Docker → Push GHCR → SSH vào VPS
                                                                                │
                                                                                ▼
                          docker compose pull + up -d + npx prisma migrate deploy
```

---

## 8. Kết Quả Demo & Kết Luận

- **Live Demo**: [nextech.io.vn](https://nextech.io.vn)
- **Admin CMS**: [admin.nextech.io.vn](https://admin.nextech.io.vn)
- **API Docs**: [api.nextech.io.vn/api-docs](https://api.nextech.io.vn/api-docs)

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| **Admin** | `admin@nextech.com` | `Admin123!` |
| **User** | `user1@nextech.com` | `User123!` |
| **User** | `user2@nextech.com` | `User123!` |

**Kết quả đạt được:** Hệ thống chạy mượt, đồng bộ; bảo mật JWT HttpOnly + thanh toán tự động; giải quyết bài toán IMEI & hóa đơn đỏ; tối ưu chi phí (Soketi tự dựng).

**Hạn chế & Hướng phát triển:** `node-cron` chưa scale ngang — cần nâng lên Redis + BullMQ; AI cá nhân hóa gợi ý sản phẩm và chatbot giọng nói.

---

# XIN CHÂN THÀNH CẢM ƠN HỘI ĐỒNG!

## TRANG DÀNH CHO CÂU HỎI THẢO LUẬN (Q&A)

- **Sinh viên thực hiện:** Đặng Quang Trung  
- **Email:** trungdang.dqt@gmail.com  
- **GitHub:** [Quang-Trung-68](https://github.com/Quang-Trung-68)  

*(Mời quý Thầy/Cô và các bạn đặt câu hỏi!)*
