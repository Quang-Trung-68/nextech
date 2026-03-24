# NexTech E-commerce Project

Dự án NexTech là một ứng dụng thương mại điện tử (e-commerce) đầy đủ chức năng, bao gồm cả Frontend (FE) và Backend (BE). Dự án được thiết kế với kiến trúc hiện đại, khả năng mở rộng tốt và tích hợp các công cụ thanh toán, quản lý hình ảnh chuyên nghiệp.

## 🚀 Công nghệ sử dụng

### Frontend (FE)
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack Query v5 (React Query)](https://tanstack.com/query/latest)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), [Shadcn UI](https://ui.shadcn.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Internationalization**: [i18next](https://www.i18next.com/) (Hỗ trợ đa ngôn ngữ)
- **Payment**: [Stripe React](https://stripe.com/docs/stripe-js/react)

### Backend (BE)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: JWT (JSON Web Token), Passport.js (Google & Facebook OAuth)
- **File Storage**: Cloudinary (qua Multer)
- **Payment Gateway**: Stripe API
- **Email Service**: Nodemailer
- **Validation**: Zod & Express Validator
- **Cron Jobs**: Node-cron (Dùng cho các tác vụ định kỳ)

---

## 📁 Cấu trúc thư mục

### 1. Root Directory
```text
.
├── backend/          # Chứa toàn bộ mã nguồn Backend
├── frontend/         # Chứa toàn bộ mã nguồn Frontend
└── README.md         # File hướng dẫn dự án (file này)
```

### 2. Backend Structure (`/backend`)
```text
backend/
├── prisma/           # Cấu hình Database Schema (schema.prisma) và Migrations
├── src/
│   ├── assets/       # Tài liệu tĩnh (hình ảnh, fonts cho PDF)
│   ├── configs/      # Cấu hình hệ thống (Cloudinary, Passport, Stripe, v.v.)
│   ├── controllers/  # Xử lý logic nghiệp vụ cho từng API route
│   ├── errors/       # Định nghĩa các lớp lỗi tùy chỉnh (Custom Errors)
│   ├── jobs/         # Các tác vụ chạy ngầm định kỳ (Cron jobs)
│   ├── middleware/   # Middleware xử lý Auth, Error, Upload, v.v.
│   ├── resources/    # Chứa các tài nguyên bổ sung (ví dụ: Logo cho hóa đơn)
│   ├── routes/       # Định nghĩa các điểm cuối API (API Endpoints)
│   ├── services/     # Logic xử lý dữ liệu phức tạp (Email, PDF, Stripe)
│   ├── templates/    # File mẫu EJS cho Email hoặc PDF
│   ├── utils/        # Các hàm tiện ích dùng chung
│   └── validations/  # Các schema kiểm tra dữ liệu đầu vào (Zod)
├── .env              # Biến môi trường (Secret Keys, DB URL)
├── server.js         # Điểm khởi đầu của ứng dụng Backend
└── package.json      # Danh sách dependencies của Backend
```

### 3. Frontend Structure (`/frontend`)
```text
frontend/
├── public/           # Tài sản tĩnh công khai (Logo, Favicon)
├── src/
│   ├── api/          # Cấu hình Axios và các hàm gọi API bằng React Query
│   ├── assets/       # Hình ảnh, icon sử dụng trong code
│   ├── components/   # Các UI component dùng chung (Button, Input, Modal, v.v.)
│   ├── configs/      # Cấu hình app (i18n, router, v.v.)
│   ├── constants/    # Các hằng số định nghĩa trong toàn thẻ app
│   ├── features/     # Các logic theo tính năng (ví dụ: Auth, Cart, Admin)
│   ├── hooks/        # Các Custom Hooks cho React
│   ├── i18n/         # Cài đặt đa ngôn ngữ (Tiếng Việt/Tiếng Anh)
│   ├── lib/          # Thư viện bên ngoài (utils cho Tailwind, v.v.)
│   ├── pages/        # Các trang chính (Home, Products, Checkout, Admin, v.v.)
│   ├── resources/    # Dữ liệu tĩnh cục bộ
│   ├── schemas/      # Định nghĩa Zod schemas cho form validation
│   ├── stores/       # Quản lý Global State (Zustand)
│   ├── utils/        # Hàm helper xử lý chuỗi, ngày tháng, v.v.
│   ├── App.jsx       # Component gốc của ứng dụng
│   └── main.jsx      # Điểm entry chính của ReactDOM
├── tailwind.config.js# Cấu hình Tailwind CSS
└── vite.config.js    # Cấu hình công cụ build Vite
```

---

## 📊 Mô hình dữ liệu (Database Schema)

Hệ thống sử dụng **PostgreSQL** (hoặc tương thích) thông qua Prisma ORM với các Model chính:
- **User**: Quản lý thông tin người dùng, vai trò (ADMIN/USER), và Auth.
- **Product**: Thông tin sản phẩm, giá, kho hàng, flash sale.
- **Order / OrderItem**: Quản lý đơn hàng, trạng thái thanh toán và sản phẩm trong đơn.
- **Cart / CartItem**: Giỏ hàng của người dùng.
- **Review**: Đánh giá và bình luận sản phẩm từ khách hàng.
- **Coupon / CouponUsage**: Hệ thống mã giảm giá (Theo phần trăm hoặc số tiền cố định).
- **Invoice**: Thông tin hóa đơn VAT, bao gồm thông tin Snapshot người mua/người bán.
- **ShopSettings**: Cấu hình thông tin cửa hàng (Tên, MST, STK, v.v.).

---

## ✨ Tính năng chính

1.  **Hệ thống người dùng**: Đăng ký, đăng nhập (JWT), Đăng nhập bên thứ 3 (Google/Facebook), xác thực Email.
2.  **Quản lý sản phẩm**: Hiển thị sản phẩm theo danh mục, tìm kiếm, lọc theo giá, flash sale với đồng hồ đếm ngược.
3.  **Giỏ hàng & Thanh toán**: Thêm/sửa/xóa sản phẩm trong giỏ, áp dụng mã giảm giá, hỗ trợ thanh toán online qua Stripe hoặc COD.
4.  **Hóa đơn điện tử**: Tự động tạo file hóa đơn PDF sau khi đơn hàng thành công, gửi hóa đơn qua email khách hàng.
5.  **Quản trị (Admin Dashboard)**:
    - Quản lý đơn hàng, cập nhật trạng thái đơn hàng.
    - Quản lý sản phẩm, tồn kho, flash sale.
    - Quản lý mã giảm giá (Coupon).
    - Cấu hình thông tin cửa hàng (VAT, MST).
6.  **Đa ngôn ngữ**: Hỗ trợ chuyển đổi ngôn ngữ Việt - Anh linh hoạt.

---

## 🛠️ Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Node.js (v18 trở lên)
- PostgreSQL
- Cloudinary Account (Để lưu ảnh)
- Stripe Account (Nếu dùng thanh toán online)

### Cài đặt Backend
1. Di chuyển vào thư mục backend: `cd backend`
2. Cài đặt thư viện: `npm install`
3. Sao chép file `.env.example` thành `.env` và điền các thông số cần thiết.
4. Đẩy schema lên database: `npx prisma migrate dev`
5. Chạy server: `npm run dev`

### Cài đặt Frontend
1. Di chuyển vào thư mục frontend: `cd frontend`
2. Cài đặt thư viện: `npm install`
3. Sao chép file `.env.example` thành `.env` và điền URL của backend API.
4. Chạy ứng dụng: `npm run dev`

---

## 📝 Liên hệ & Đóng góp
Dự án được phát triển nhằm mục đích cung cấp một giải pháp thương mại điện tử trọn gói. Mọi đóng góp xin vui lòng gửi Pull Request hoặc liên hệ qua email quản trị.
