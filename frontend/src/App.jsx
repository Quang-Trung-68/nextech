import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';
import LoadingSkeleton from './components/LoadingSkeleton';

// Public pages - Loaded normally
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Private/heavy pages - Lazy loaded
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage'));
const CheckoutFailedPage = lazy(() => import('./pages/CheckoutFailedPage'));
const OrderListPage = lazy(() => import('./pages/OrderListPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));

// Admin pages - Lazy loaded
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminProductPage = lazy(() => import('./pages/AdminProductPage'));
const AdminOrderPage = lazy(() => import('./pages/AdminOrderPage'));
const AdminUserPage = lazy(() => import('./pages/AdminUserPage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSkeleton />}>
        <Routes>
          {/* Main Public & Protected Routes inside MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected User Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
              <Route path="/checkout/failed" element={<CheckoutFailedPage />} />
              <Route path="/orders" element={<OrderListPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
            </Route>
          </Route>

          {/* Admin Routes inside AdminLayout */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductPage />} />
              <Route path="orders" element={<AdminOrderPage />} />
              <Route path="users" element={<AdminUserPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
