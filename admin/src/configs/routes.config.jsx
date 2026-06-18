/**
 * routes.config.jsx (Admin CMS Edition)
 * Central route configuration for NexTech Admin panel.
 */

import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// Layout & Route guards
import MainLayout from '@/components/layout/MainLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import AdminRoute from '@/components/auth/AdminRoute';

// ─── Authentication Routes (Centered clean layout) ───────────────────────────
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage  = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage   = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const OAuthCallbackPage   = lazy(() => import('@/pages/auth/OAuthCallbackPage'));

// ─── Admin Dashboard Pages ───────────────────────────────────────────────────
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminProductPage     = lazy(() => import('@/pages/admin/AdminProductPage'));
const AdminProductEditPage = lazy(() => import('@/pages/admin/AdminProductEditPage'));
const AdminOrdersPage    = lazy(() => import('@/pages/admin/orders/AdminOrdersPage'));
const AdminUserPage      = lazy(() => import('@/pages/admin/AdminUserPage'));
const AdminCouponsPage   = lazy(() => import('@/pages/admin/AdminCouponsPage'));
const AdminSettingsPage  = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminSuppliersPage = lazy(() => import('@/pages/admin/inventory/AdminSuppliersPage'));
const AdminStockImportPage = lazy(() => import('@/pages/admin/inventory/AdminStockImportPage'));
const AdminSerialsPage = lazy(() => import('@/pages/admin/inventory/AdminSerialsPage'));
const AdminNewsLayout = lazy(() => import('@/pages/admin/AdminNewsLayout'));
const AdminNewsPage = lazy(() => import('@/pages/admin/AdminNewsPage'));
const AdminNewsFormPage = lazy(() => import('@/pages/admin/AdminNewsFormPage'));
const AdminNewsCategoriesPage = lazy(() => import('@/pages/admin/AdminNewsCategoriesPage'));
const BannersAdminPage = lazy(() => import('@/features/admin/banners/BannersAdminPage'));
const BrandsAdminPage = lazy(() => import('@/features/admin/brands/BrandsAdminPage'));

const routes = [
  {
    // Public layout for Admin Authentication (No store headers/footers)
    element: <MainLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
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
        path: '/oauth/callback',
        element: <OAuthCallbackPage />,
      },
    ],
  },
  {
    // Root level path maps directly to Admin guarded CMS
    path: '/',
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
            path: 'products/:productId/edit',
            element: <AdminProductEditPage />,
          },
          {
            path: 'products',
            element: <AdminProductPage />,
          },
          {
            path: 'inventory/suppliers',
            element: <AdminSuppliersPage />,
          },
          {
            path: 'inventory/stock-imports',
            element: <AdminStockImportPage />,
          },
          {
            path: 'inventory/serials',
            element: <AdminSerialsPage />,
          },
          {
            path: 'orders',
            element: <AdminOrdersPage />,
          },
          {
            path: 'users',
            element: <AdminUserPage />,
          },
          {
            path: 'coupons',
            element: <AdminCouponsPage />,
          },
          {
            path: 'settings',
            element: <AdminSettingsPage />,
          },
          {
            path: 'news',
            element: <AdminNewsLayout />,
            children: [
              {
                index: true,
                element: <AdminNewsPage />,
              },
              {
                path: 'categories',
                element: <AdminNewsCategoriesPage />,
              },
              {
                path: 'create',
                element: <AdminNewsFormPage />,
              },
              {
                path: ':id/edit',
                element: <AdminNewsFormPage />,
              },
            ],
          },
          {
            path: 'banners',
            element: <BannersAdminPage />,
          },
          {
            path: 'brands',
            element: <BrandsAdminPage />,
          },
        ],
      },
    ],
  },
  {
    // Unknown paths → overview (not / which also works but is an extra redirect)
    path: '*',
    element: <Navigate to="/overview" replace />,
  },
];

export default routes;
