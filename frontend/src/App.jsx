import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import VerifiedRoute from './components/VerifiedRoute';
import AdminRoute from './components/AdminRoute';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';
import LoadingSkeleton from './components/LoadingSkeleton';
import ScrollToTop from './components/ScrollToTop';

// ─── Nhóm 1 Public — Loaded normally (small, critical pages) ─────────────────
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';

// ─── Nhóm 1 Public — Auth extra (lazy) ───────────────────────────────────────
const ForgotPasswordPage  = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage   = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage     = lazy(() => import('./pages/VerifyEmailPage'));

// ─── Nhóm 2 Login, chưa verify được ─────────────────────────────────────────
const VerifyEmailNoticePage = lazy(() => import('./pages/VerifyEmailNoticePage'));

// ─── Nhóm 3 Login + Email Verified ───────────────────────────────────────────
const CartPage             = lazy(() => import('./pages/CartPage'));
const CheckoutPage         = lazy(() => import('./pages/CheckoutPage'));
const CheckoutSuccessPage  = lazy(() => import('./pages/CheckoutSuccessPage'));
const CheckoutFailedPage   = lazy(() => import('./pages/CheckoutFailedPage'));

const OrderDetailPage      = lazy(() => import('./pages/OrderDetailPage'));
const ChangePasswordPage   = lazy(() => import('./pages/ChangePasswordPage'));

// ─── Profile — Lazy ──────────────────────────────────────────────────────────
const ProfileLayout        = lazy(() => import('./pages/ProfileLayout'));
const ProfileInfoPage      = lazy(() => import('./features/profile/pages/ProfileInfoPage'));
const ProfileOrdersPage    = lazy(() => import('./features/profile/pages/ProfileOrdersPage'));
const ProfileAddressesPage = lazy(() => import('./features/profile/pages/ProfileAddressesPage'));

// ─── Admin (role = ADMIN) — Lazy ─────────────────────────────────────────────
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminProductPage   = lazy(() => import('./pages/AdminProductPage'));
const AdminOrderPage     = lazy(() => import('./pages/AdminOrderPage'));
const AdminUserPage      = lazy(() => import('./pages/AdminUserPage'));

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<LoadingSkeleton />}>
        <Routes>

          {/* ================================================================
              MAIN LAYOUT — bao bọc tất cả route có Header + Footer
          ================================================================ */}
          <Route element={<MainLayout />}>

            {/* ----------------------------------------------------------
                NHÓM 1 — Public
                Ai cũng vào được, không cần đăng nhập.
            ---------------------------------------------------------- */}
            <Route path="/"              element={<HomePage />} />
            <Route path="/products"      element={<ProductsPage />} />
            <Route path="/products/:id"  element={<ProductDetailPage />} />
            <Route path="/login"         element={<LoginPage />} />
            <Route path="/register"      element={<RegisterPage />} />

            {/* Auth flows — public vì token đến từ email / không cần session */}
            <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
            <Route path="/reset-password"   element={<ResetPasswordPage />} />
            {/* /verify-email?token=... — public: user có thể mở trên thiết bị khác */}
            <Route path="/verify-email"     element={<VerifyEmailPage />} />

            {/* ----------------------------------------------------------
                NHÓM 2 — Login required, KHÔNG cần email verified
                Guard: ProtectedRoute (chỉ check isAuthenticated)
                Lý do: Chính vì chưa verify mới cần vào đây để resend email.
            ---------------------------------------------------------- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/verify-email-notice" element={<VerifyEmailNoticePage />} />
            </Route>

            {/* ----------------------------------------------------------
                NHÓM 3 — Login required + Email verified required
                Guard: VerifiedRoute (check cả isAuthenticated + isEmailVerified)
                Nếu chưa verify → redirect /verify-email-notice (không về /login).
            ---------------------------------------------------------- */}
            <Route element={<VerifiedRoute />}>
              {/* Giỏ hàng & Thanh toán */}
              <Route path="/cart"               element={<CartPage />} />
              <Route path="/checkout"           element={<CheckoutPage />} />
              <Route path="/checkout/success"   element={<CheckoutSuccessPage />} />
              <Route path="/checkout/failed"    element={<CheckoutFailedPage />} />

              {/* Đơn hàng standalone */}
              <Route path="/orders/:id"         element={<OrderDetailPage />} />

              {/* Đổi mật khẩu — standalone page (không có ProfileLayout sidebar) */}
              <Route path="/profile/change-password" element={<ChangePasswordPage />} />

              {/* ── Profile với sidebar layout ────────────────────────── */}
              <Route path="/profile" element={<ProfileLayout />}>
                <Route index element={<ProfileInfoPage />} />
                <Route path="orders" element={<ProfileOrdersPage />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
                <Route path="addresses" element={<ProfileAddressesPage />} />
              </Route>
            </Route>

          </Route>
          {/* END MAIN LAYOUT */}

          {/* ================================================================
              ADMIN ROUTES — role = ADMIN
              AdminRoute đã handle cả authentication + role check
          ================================================================ */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index             element={<AdminDashboardPage />} />
              <Route path="products"   element={<AdminProductPage />} />
              <Route path="orders"     element={<AdminOrderPage />} />
              <Route path="users"      element={<AdminUserPage />} />
            </Route>
          </Route>

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
