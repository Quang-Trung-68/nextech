/**
 * routes.config.jsx
 * Central route configuration for NexTech frontend (Storefront Edition).
 * App.jsx reads this config and passes it to useRoutes() or <Routes>.
 */

import { lazy } from 'react';
import { Navigate, useParams } from 'react-router-dom';

// Layout & Route guards
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import VerifiedRoute from '@/components/auth/VerifiedRoute';

// ─── Nhóm 1 Public — Loaded normally (small, critical pages) ─────────────────
import HomePage from '@/pages/home/HomePage';
import ProductDetailPage from '@/pages/product/ProductDetailPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ProductsPage from '@/pages/product/ProductsPage';
import LegacyProductDetailRedirect from '@/pages/product/LegacyProductDetailRedirect';

function OldProductsCategoryRedirect() {
  const { categorySlug } = useParams();
  const map = { iphone: '/phone', mac: '/laptop', ipad: '/tablet', accessories: '/accessories' };
  const to = map[categorySlug];
  if (to) return <Navigate to={to} replace />;
  return <Navigate to="/" replace />;
}

// ─── Nhóm 1 Public — Support ─────────────────────────────────────────────────
const SupportPage = lazy(() => import('@/pages/support/SupportPage'));

// ─── Nhóm 1 Public — Auth extra (lazy) ───────────────────────────────────────
const ForgotPasswordPage  = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage   = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage     = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const OAuthCallbackPage   = lazy(() => import('@/pages/auth/OAuthCallbackPage'));

// ─── Nhóm 2 Login, chưa verify được ─────────────────────────────────────────
const VerifyEmailNoticePage = lazy(() => import('@/pages/auth/VerifyEmailNoticePage'));
const FavoritesPage         = lazy(() => import('@/pages/favorites/FavoritesPage'));
const NotificationsPage     = lazy(() => import('@/pages/notifications/NotificationsPage'));

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

// ─── News — Public — Lazy ────────────────────────────────────────────────────
const NewsPage = lazy(() => import('@/pages/news/NewsPage'));
const NewsDetailPage = lazy(() => import('@/pages/news/NewsDetailPage'));

const routes = [
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      { path: '/phone', element: <ProductsPage /> },
      { path: '/laptop', element: <ProductsPage /> },
      { path: '/tablet', element: <ProductsPage /> },
      { path: '/accessories', element: <ProductsPage /> },
      { path: '/phone/:slug', element: <ProductDetailPage /> },
      { path: '/laptop/:slug', element: <ProductDetailPage /> },
      { path: '/tablet/:slug', element: <ProductDetailPage /> },
      { path: '/accessories/:slug', element: <ProductDetailPage /> },
      { path: '/products/iphone', element: <Navigate to="/phone" replace /> },
      { path: '/products/mac', element: <Navigate to="/laptop" replace /> },
      { path: '/products/ipad', element: <Navigate to="/tablet" replace /> },
      { path: '/products/accessories', element: <Navigate to="/accessories" replace /> },
      { path: '/products/:categorySlug/:id', element: <LegacyProductDetailRedirect /> },
      { path: '/products/:categorySlug', element: <OldProductsCategoryRedirect /> },
      { path: '/products', element: <Navigate to="/" replace /> },
      {
        path: '/support',
        element: <SupportPage />,
      },
      {
        path: '/news',
        element: <NewsPage />,
      },
      {
        path: '/news/:slug',
        element: <NewsDetailPage />,
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
          {
            path: '/notifications',
            element: <NotificationsPage />,
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
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export default routes;
