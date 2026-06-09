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

## 1. Đặt Vấn Đề & Lý Do Chọn Đề Tài

*   **Sự bùng nổ của TMĐT**: Thị trường đồ công nghệ tiêu dùng (Điện thoại, Laptop, Máy tính bảng...) đòi hỏi trải nghiệm mua sắm nhanh, tức thời và mượt mà.
*   **Thách thức đặc thù**:
    *   *Quản lý số IMEI/Serial*: Khác với quần áo hay thực phẩm, mỗi chiếc điện thoại bán ra cần được quản lý bảo hành theo một mã định danh **IMEI/Serial duy nhất**.
    *   *Yêu cầu Hóa đơn VAT*: Khách hàng doanh nghiệp yêu cầu xuất hóa đơn đỏ (VAT) chính xác theo thông tin tại thời điểm mua hàng.
    *   *Yêu cầu bảo mật*: Chống tấn công chiếm đoạt tài khoản (XSS/CSRF) và xử lý bất đồng bộ dữ liệu thanh toán.
*   ➔ **Giải pháp**: Xây dựng **NexTech** - Nền tảng TMĐT chuyên sâu, giải quyết triệt để các vấn đề quản lý kho IMEI, xuất hóa đơn VAT, thanh toán kép tự động và đồng bộ thời gian thực.

---

## 2. Mục Tiêu Đề Tài

*   **Về mặt hệ thống**:
    *   Thiết kế hệ thống dạng **Monorepo** với Frontend SPA riêng biệt và Backend REST API theo mô hình layered.
    *   Tự động hóa hoàn toàn luồng thanh toán qua Webhook của **Stripe** và **SePay / VietQR** (Ngân hàng nội địa).
*   **Về mặt nghiệp vụ**:
    *   Quản lý chính xác vòng đời thiết bị qua mã **SerialUnit** (`IN_STOCK → RESERVED → SOLD → RETURNED`).
    *   Tự sinh và phân phối hóa đơn điện tử **PDF VAT** tự động gửi qua email cho khách hàng.
*   **Về mặt trải nghiệm**:
    *   Cung cấp trợ lý mua sắm ảo **AI Chatbot** thông minh (Sử dụng Gemini API).
    *   Hệ thống thông báo tức thời (**Real-time WebSockets**) qua máy chủ tự dựng **Soketi**.

---

## 3. Kiến Trúc Tổng Quan Hệ Thống (Architecture)

Hệ thống được thiết kế tối ưu, điều phối thông qua **Nginx Reverse Proxy** và đóng gói bằng **Docker Containers**.

```
                           ┌──────────────────────────┐
                           │      Client Browser      │
                           └──────┬────────────┬──────┘
                   HTTPS (REST)   │            │  WSS (Pusher)
                                  ▼            ▼
                           ┌──────────────────────────┐
                           │   Nginx Reverse Proxy    │
                           └──────┬────────────┬──────┘
                                  │            │
                           ┌──────▼──────┐     │      ┌──────────────┐
                           │  Frontend   │     ├─────▶│    Soketi    │
                           │ (Nginx SPA) │     │      │ (WebSockets) │
                           └─────────────┘     │      └──────▲───────┘
                                               │             │ trigger
                           ┌─────────────┐     │      ┌──────┴───────┐
                           │ PostgreSQL  │◀────┴──────│   Backend    │
                           │(Prisma ORM) │            │ (Express.js) │
                           └─────────────┘            └──────────────┘
```

---

## 4. Công Nghệ Sử Dụng (Tech Stack)

| Tầng (Layer) | Công nghệ chính | Lý do lựa chọn |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, React Router v7, Tailwind CSS v4, Shadcn/UI | Giao diện hiện đại, tốc độ phản hồi cực nhanh, tối ưu SEO. |
| **State Management**| TanStack Query v5, Zustand | Đồng bộ server-state mượt mà, quản lý local-state tối giản. |
| **Backend API** | Node.js, Express 5, Passport.js | Xử lý bất đồng bộ tốt, định tuyến tường minh, mở rộng dễ dàng. |
| **Database & ORM** | PostgreSQL 16, Prisma ORM v7 | Đảm bảo toàn vẹn dữ liệu giao dịch, kiểu dữ liệu mạnh (Type-safe). |
| **Real-time Engine**| Soketi (Self-hosted Pusher protocol) | Tiết kiệm chi phí vận hành SaaS, độ trễ truyền tin dưới 10ms. |
| **DevOps & Deploy** | Docker, Docker Compose, GitHub Actions, Nginx | Đóng gói môi trường nhất quán, tự động hóa luồng CI/CD lên VPS. |

---

## 5. Thiết Kế Cơ Sở Dữ Liệu (Database ERD)

PostgreSQL được quản lý bởi Prisma với **28 Models** chặt chẽ, chia làm 5 phân vùng nghiệp vụ chính:

*   **1. Người dùng & Bảo mật**: `User`, `Address`, `OAuthAccount`, `RefreshToken`, `RevokedToken`, `PasswordResetToken`.
*   **2. Danh mục sản phẩm**: `Product`, `ProductImage`, `Brand`, `ProductAttribute`, `ProductAttributeValue`, `ProductVariant`, `ProductVariantValue` (Ma trận cấu hình).
*   **3. Giỏ hàng & Đơn hàng**: `Cart`, `CartItem`, `Order`, `OrderItem`, `Review`, `Coupon`, `CouponUsage`.
*   **4. Kho hàng & Serial**: `Supplier`, `StockImport`, `SerialUnit` (Quản lý IMEI từng máy).
*   **5. Tiện ích & Vận hành**: `ShopSettings`, `Notification`, `Post`, `Category`, `Tag`, `AIChatMessage`, `FailedEmail` (Hàng đợi email lỗi).

➔ *Đặc biệt*: Toàn bộ tiền tệ dùng kiểu **`Decimal`** để triệt tiêu lỗi làm tròn dấu phẩy động.

---

## 6. Cơ Chế Xác Thực Bảo Mật (Session & Auth)

Áp dụng quy trình xoay vòng **HttpOnly Cookie JWT Access/Refresh Token rotation** bảo mật tuyệt đối.

*   **An toàn trước XSS**: Token không được lưu ở `localStorage` của JS, ngăn chặn mã độc đánh cắp.
*   **An toàn trước CSRF**: Cấu hình thuộc tính cookie `SameSite: Lax` và mã hóa chữ ký đầu vào qua `COOKIE_SECRET`.

```
Yêu cầu Đăng nhập ──▶ Xác thực ──▶ Tạo Access Token (1h) & Refresh Token (7d)
                                         │
                                         ▼
                                 HttpOnly Cookie (Set-Cookie)
                                         │
                         [Hết hạn Access Token sau 1h]
                                         │
                                         ▼
      Interceptor của React gọi POST `/api/auth/refresh` bằng Refresh Token
                                         │
                    Xác thực Refresh Token (Database & blacklist)
                                         │
                                         ▼
             Thu hồi Refresh Token cũ ──▶ Tạo mới cặp Access/Refresh mới
```

---

## 7. Giải Pháp Tích Hợp Cổng Thanh Toán Kép

Hỗ trợ đồng thời 2 luồng cổng thanh toán hoàn toàn tự động dựa trên **Webhook**.

### Luồng A: Stripe (Thẻ quốc tế Visa/Mastercard)
1. Khách hàng bấm thanh toán ➔ Backend tạo `PaymentIntent` thông qua Stripe SDK.
2. Khách hàng điền thông tin thẻ trên giao diện bảo mật của Stripe.
3. Stripe gửi webhook `payment_intent.succeeded` đến Backend ➔ Khởi chạy transactional tự động cập nhật đơn hàng sang `PROCESSING`, giảm kho và dọn giỏ hàng.

### Luồng B: SePay / VietQR (Chuyển khoản Ngân hàng Việt Nam)
1. Tạo mã QR động VietQR chứa số tiền và nội dung chuyển khoản định danh (Ví dụ: `NEX1234`).
2. Khách hàng quét mã QR trên ứng dụng Mobile Banking nội địa để chuyển khoản.
3. SePay bắt biến động số dư tài khoản ngân hàng và gọi IPN Webhook gửi về Backend ➔ Tự động khớp mã đơn hàng và cập nhật đơn hàng thành công ngay lập tức.

---

## 8. Quản Lý Kho & Số IMEI/Serial Độc Bản

Giải pháp theo dõi vòng đời sản phẩm chi tiết đến từng thiết bị vật lý bằng cấu trúc **`SerialUnit`**.

```
Nhà Cung Cấp (Supplier) 
        │
        ▼
Phiếu Nhập Kho (StockImport) ──▶ Tự động tạo danh sách `SerialUnit` (Status: IN_STOCK)
                                                            │
                                             Khách hàng đặt mua & Đã thanh toán
                                                            │
                                                            ▼
Admin thực hiện chọn & gán mã IMEI cụ thể ➔ Đổi trạng thái sang `SOLD` (Bảo hành bắt đầu kích hoạt)
```

*   **Tính toàn vẹn**: Một số serial chỉ được gán cho một `OrderItem` duy nhất tại một thời điểm (`@@unique` constraint).
*   **Hỗ trợ bảo hành**: Tra cứu ngược từ số IMEI ra thông tin đơn hàng, khách mua, ngày mua và nhà cung cấp gốc.

---

## 9. Hệ Thống Real-time & Cảnh Báo Giảm Giá Yêu Thích

Tối ưu hóa chi phí bằng cách tự phát triển máy chủ WebSocket thông qua **Soketi Container** (giao thức Pusher).

*   **Bảo mật Private Channel**: Người dùng chỉ nhận được thông báo cá nhân thông qua cơ chế xác thực định danh riêng (`private-user-{userId}`).

### Động cơ tự động gửi cảnh báo giá (Wishlist Price Drop Alert)

```
Admin giảm giá sản phẩm điện thoại iPhone ➔ Kích hoạt Price Drop Engine
        │
        ▼
Quét bảng `Favorite` tìm tất cả khách hàng đã bấm "Yêu thích" sản phẩm này
        │
        ▼
Đồng thời thực hiện 3 hành động:
  1. Ghi thông báo vào bảng `Notification` trong DB.
  2. Gửi Websocket event qua Soketi đến Client ➔ Hiển thị live toast thông báo tức thì trên màn hình.
  3. Sử dụng Nodemailer kết hợp mẫu HTML EJS gửi email cảnh báo giá trực tiếp tới hòm thư khách hàng.
```

---

## 10. Hệ Thống Tác Vụ Nền Định Kỳ (Cron Jobs)

Xây dựng hệ thống 5 tác vụ chạy nền gọn nhẹ (sử dụng `node-cron`), vận hành trực tiếp trong tiến trình backend:

1.  **`expirationJob` (Mỗi 1 phút)**: Tự động hủy các đơn hàng chưa thanh toán quá 15 phút, đồng thời hoàn trả lại số lượng tồn kho tạm giữ.
2.  **`lowStockJob` (Mỗi 1 giờ)**: Quét danh sách các sản phẩm có số lượng serial còn dưới ngưỡng cảnh báo (`lowStockThreshold`) và gửi email báo cáo tổng hợp cho Admin.
3.  **`lowOrderAlertJob` (Theo cấu hình)**: Theo dõi tần suất đặt hàng. Nếu lượng đơn thấp hơn ngưỡng cấu hình, hệ thống sẽ cảnh báo Store Owner kiểm tra đường truyền hoặc cổng thanh toán.
4.  **`publishScheduledPostsJob` (Mỗi 1 phút)**: Đăng tải tự động các bài viết tin tức công nghệ đã lên lịch hẹn giờ từ trước.
5.  **`scheduledEmailJob` (Mỗi 30 phút)**: Kiểm tra bảng `FailedEmail` và tự động gửi lại các email giao dịch bị lỗi do sự cố SMTP tạm thời.

---

## 11. Hóa Đơn Điện Tử Tự Động (VAT E-Invoicing)

Hệ thống hỗ trợ xuất hóa đơn VAT điện tử định dạng PDF chuyên nghiệp cho khách hàng cá nhân hoặc doanh nghiệp.

```
Khách hàng điền thông tin VAT tại Checkout (Mã số thuế, Tên Công ty, Địa chỉ)
        │
        ▼
Đơn hàng được thanh toán thành công ──▶ Admin bấm "Xác nhận & Xuất Hóa Đơn"
                                                      │
                                                      ▼
                      Backend chụp lại snapshot tài chính tại thời điểm mua hàng
                      Sử dụng PDFKit tự sinh file PDF hóa đơn đỏ theo tiêu chuẩn
                                                      │
                                                      ▼
              Lưu trữ hóa đơn ──▶ Tự động đính kèm PDF gửi qua email cho doanh nghiệp
```

*   **Đảm bảo toàn vẹn**: Dữ liệu hóa đơn là **bất biến (Immutable Snapshot)**. Ngay cả khi sản phẩm thay đổi giá hoặc khách hàng đổi địa chỉ trong tương lai, hóa đơn đã xuất vẫn giữ nguyên giá trị tại thời điểm mua.

---

## 12. Quy Trình Đóng Gói & Triển Khai Tự Động (CI/CD)

Triển khai tự động hóa thông qua pipeline của **GitHub Actions**, tích hợp **GitHub Container Registry (GHCR)**.

```
Nhánh `main` nhận commit mới (git push)
        │
        ▼
Kích hoạt GitHub Actions:
  1. Thực hiện Linter kiểm tra lỗi cú pháp (ESLint).
  2. Sử dụng Docker Buildx đóng gói ảnh (Docker images) cho Frontend và Backend.
  3. Đẩy ảnh đã đóng gói lên kho chứa an toàn GHCR (GitHub Container Registry).
  4. Gửi tín hiệu SSH vào máy chủ VPS thực tế.
        │
        ▼
Trên máy chủ VPS:
  1. Thực hiện lệnh `docker compose pull` để tải ảnh mới nhất từ GHCR về.
  2. Thực hiện khởi chạy container mới thông qua `docker compose up -d`.
  3. Chạy lệnh di chuyển database tự động: `npx prisma migrate deploy`.
```

---

## 13. Kết Quả Đạt Được & Demo Thực Tế

*   **Địa chỉ Live Demo**: [https://nextech.io.vn](https://nextech.io.vn)  
*   **Địa chỉ Swagger API**: [https://api.nextech.io.vn/api-docs](https://api.nextech.io.vn/api-docs)  

### Tài Khoản Trải Nghiệm Demo (Dành cho Hội đồng / Người đánh giá)

| Vai trò (Role) | Địa chỉ Email | Mật khẩu (Password) | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@nextech.com` | `Admin123!` | Toàn quyền cấu hình, nhập kho, gán số Serial, xem biểu đồ tài chính. |
| **Khách hàng (User)** | `user1@nextech.com` | `User123!` | Trải nghiệm mua sắm, thanh toán, chatbot AI, nhận hóa đơn VAT. |
| **Khách hàng (User)** | `user2@nextech.com` | `User123!` | Tài khoản khách hàng phụ. |

---

## 14. Kết Luận & Hướng Phát Triển Tương Lai

### Ưu điểm đạt được:
*   Hệ thống chạy mượt mà, đồng bộ hóa cao nhờ kiến trúc Monorepo và TanStack Query.
*   Bảo mật tốt, xử lý thanh toán tự động hoàn toàn, giải quyết bài toán IMEI và hóa đơn đỏ.
*   Tối ưu hóa chi phí vận hành máy chủ nhờ việc tự phát triển hệ thống socket và hàng đợi nhẹ.

### Hạn chế & Hướng phát triển tương lai:
*   *Hạn chế*: Hệ thống node-cron chạy trong cùng một tiến trình web server, chưa thích hợp nếu cần scale ngang backend ra nhiều máy chủ khác nhau (lúc đó sẽ cần nâng cấp lên Redis + BullMQ).
*   *Tương lai*: Tích hợp sâu hơn công nghệ AI để tự động phân tích hành vi mua sắm của khách hàng, gợi ý sản phẩm cá nhân hóa, và nâng cấp chatbot hỗ trợ giọng nói trực tiếp.

---

# XIN CHÂN THÀNH CẢM ƠN HỘI ĐỒNG!

## TRANG DÀNH CHO CÂU HỎI THẢO LUẬN (Q&A)

*   **Sinh viên thực hiện:** Đặng Quang Trung  
*   **Email liên hệ:** trungdang.dqt@gmail.com  
*   **Kho lưu trữ mã nguồn:** [https://github.com/Quang-Trung-68/nextech](https://github.com/Quang-Trung-68/nextech)  

*(Mời quý Thầy/Cô trong Hội đồng và các bạn đưa ra câu hỏi đóng góp ý kiến!)*
