import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';

// Public pages
import LandingPage from '@/pages/landing/LandingPage';
import PricingPage from '@/pages/pricing/PricingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage';

// Protected pages
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ChatPage from '@/pages/chat/ChatPage';
import TemplatesPage from '@/pages/templates/TemplatesPage';
import ProfilePage from '@/pages/settings/ProfilePage';
import ApiKeysPage from '@/pages/settings/ApiKeysPage';
import BillingPage from '@/pages/settings/BillingPage';

// Admin pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';

// 404 page
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
      <h1 className="text-6xl font-bold text-brand-500 mb-4">404</h1>
      <p className="text-xl text-surface-600 dark:text-surface-400 mb-8">Page not found</p>
      <a
        href="/"
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-xl transition-all"
      >
        Go Home
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  // ── Public Routes ────────────────────────
  { path: '/', element: <LandingPage /> },
  { path: '/pricing', element: <PricingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/auth/callback', element: <OAuthCallbackPage /> },

  // ── Protected Routes (App Layout) ───────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/chat', element: <ChatPage /> },
          { path: '/templates', element: <TemplatesPage /> },
          { path: '/settings/profile', element: <ProfilePage /> },
          { path: '/settings/api-keys', element: <ApiKeysPage /> },
          { path: '/settings/billing', element: <BillingPage /> },

          // ── Admin Routes ──────────────────
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
            ],
          },
        ],
      },
    ],
  },

  // ── 404 Catch-all ───────────────────────
  { path: '*', element: <NotFoundPage /> },
]);
