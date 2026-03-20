/**
 * routes.config.jsx
 * Central route configuration for NexTech frontend.
 * App.jsx reads this config and passes it to useRoutes() or <Routes>.
 */

import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// Layout & Route guards
import MainLayout from '@/components/layout/MainLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import VerifiedRoute from '@/components/auth/VerifiedRoute';
import AdminRoute from '@/components/auth/AdminRoute';

// ─── Nhóm 1 Public — Loaded normally (small, critical pages) ─────────────────
import HomePage from '@/pages/home/HomePage';
import ProductDetailPage from '@/pages/product/ProductDetailPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ProductsPage from '@/pages/product/ProductsPage';

// ─── Nhóm 1 Public — Auth extra (lazy) ───────────────────────────────────────
const ForgotPasswordPage  = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage   = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage     = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const OAuthCallbackPage   = lazy(() => import('@/pages/auth/OAuthCallbackPage'));

// ─── Nhóm 2 Login, chưa verify được ─────────────────────────────────────────
const VerifyEmailNoticePage = lazy(() => import('@/pages/auth/VerifyEmailNoticePage'));
const FavoritesPage         = lazy(() => import('@/pages/favorites/FavoritesPage'));

// ─── Nhóm 3 Login + Email Verified ───────────────────────────────────────────
const CartPage             = lazy(() => import('@/pages/cart/CartPage'));
const CheckoutPage         = lazy(() => import('@/pages/checkout/CheckoutPage'));
const CheckoutSuccessPage  = lazy(() => import('@/pages/checkout/CheckoutSuccessPage'));
const CheckoutFailedPage   = lazy(() => import('@/pages/checkout/CheckoutFailedPage'));

const OrderDetailPage      = lazy(() => import('@/pages/order/OrderDetailPage'));
const ChangePasswordPage   = lazy(() => import('@/pages/profile/ChangePasswordPage'));

// ─── Profile — Lazy ──────────────────────────────────────────────────────────
const ProfileLayout        = lazy(() => import('@/pages/profile/ProfileLayout'));
const ProfileInfoPage      = lazy(() => import('@/features/profile/pages/ProfileInfoPage'));
const ProfileOrdersPage    = lazy(() => import('@/features/profile/pages/ProfileOrdersPage'));
const ProfileAddressesPage = lazy(() => import('@/features/profile/pages/ProfileAddressesPage'));

// ─── Admin (role = ADMIN) — Lazy ─────────────────────────────────────────────
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminProductPage   = lazy(() => import('@/pages/admin/AdminProductPage'));
const AdminOrderPage     = lazy(() => import('@/pages/admin/AdminOrderPage'));
const AdminUserPage      = lazy(() => import('@/pages/admin/AdminUserPage'));

const routes = [
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/products',
        element: <ProductsPage />,
      },
      {
        path: '/products/:id',
        element: <ProductDetailPage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: '/verify-email',
        element: <VerifyEmailPage />,
      },
      {
        path: '/oauth/callback',
        element: <OAuthCallbackPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/verify-email-notice',
            element: <VerifyEmailNoticePage />,
          },
          {
            path: '/favorites',
            element: <FavoritesPage />,
          },
        ],
      },
      {
        element: <VerifiedRoute />,
        children: [
          {
            path: '/cart',
            element: <CartPage />,
          },
          {
            path: '/checkout',
            element: <CheckoutPage />,
          },
          {
            path: '/checkout/success',
            element: <CheckoutSuccessPage />,
          },
          {
            path: '/checkout/failed',
            element: <CheckoutFailedPage />,
          },
          {
            path: '/orders/:id',
            element: <OrderDetailPage />,
          },
          {
            path: '/profile/change-password',
            element: <ChangePasswordPage />,
          },
          {
            path: '/profile',
            element: <ProfileLayout />,
            children: [
              {
                index: true,
                element: <ProfileInfoPage />,
              },
              {
                path: 'orders',
                element: <ProfileOrdersPage />,
              },
              {
                path: 'orders/:id',
                element: <OrderDetailPage />,
              },
              {
                path: 'addresses',
                element: <ProfileAddressesPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="overview" replace />,
          },
          {
            path: 'overview',
            element: <AdminDashboardPage />,
          },
          {
            path: 'products',
            element: <AdminProductPage />,
          },
          {
            path: 'orders',
            element: <AdminOrderPage />,
          },
          {
            path: 'users',
            element: <AdminUserPage />,
          },
        ],
      },
    ],
  },
];

export default routes;
