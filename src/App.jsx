import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// --- Guards (To protect pages) ---
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// --- Public Pages & Layouts ---
import Home from './pages/Home';
import AuthPages from './pages/AuthPages';
import Email2FA from './pages/Email2FA';
import TwoFactorVerifyAuth from './pages/TwoFactorVerifyAuth';
import ResetPassword from './pages/ResetPassword';
import DashboardLayout from './pages/DashboardLayout';
import TermsOfService from './pages/TermsOfService';
import About from './pages/About';
import Blog from './pages/Blog';

// Lazy load PrivacyPolicy to avoid privacy extension blocking
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicy'));

// --- User Pages (Protected) ---
import TwoFactorSetup from './pages/TwoFactorSetup';
import TwoFactorVerify from './pages/TwoFactorVerify- Authenticator';
import WatermarkUploader from './pages/dashboard/WatermarkUploader';
import VerificationUploader from './pages/dashboard/VerificationUploader';
import ActivityHistory from './pages/dashboard/ActivityHistory';
import UserProfile from './pages/dashboard/UserProfile';
import SupportChat from './pages/dashboard/SupportChat';
import AttackPlayground from './pages/dashboard/AttackPlayground';
import UserAnnouncements from './pages/dashboard/UserAnnouncements';
import UserSupportTickets from './pages/dashboard/UserSupportTickets';

// --- Admin Pages (Protected & Admin-Only) ---
import AdminAnalytics from './pages/dashboard/AdminAnalytics';
import AdminUserManagement from './pages/dashboard/AdminUserManagement';
import AdminFlaggedReports from './pages/dashboard/AdminFlaggedReports';
import AdminModels from './pages/dashboard/AdminModels';
import AdminAnnouncements from './pages/dashboard/AdminAnnouncements';
import AdminBlogs from './pages/dashboard/AdminBlogs';
import AdminSupportTickets from './pages/dashboard/AdminSupportTickets';
import AdminSecurityLogs from './pages/dashboard/AdminSecurityLogs';

// Loading fallback component
const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(18, 2, 2, 0.92), rgba(61, 14, 14, 0.85))',
    color: 'var(--accent-gold)',
    fontSize: '1.25rem',
  }}>
    Loading...
  </div>
);

export default function App() {
  console.log('App component rendering...');
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* --- 1. PUBLIC ROUTES --- */}
        {/* These are visible to everyone, logged out or in */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPages />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/2fa-verify" element={<Email2FA />} />
        <Route path="/2fa-verify-auth" element={<TwoFactorVerifyAuth />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />

        {/* --- 2. PROTECTED ROUTES (Outside Dashboard) --- */}
        {/* You must be logged in to see these */}
        <Route 
          path="/2fa-setup" 
          element={
            <ProtectedRoute>
              <TwoFactorSetup />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/verify-authenticator" 
          element={
            <ProtectedRoute>
              <TwoFactorVerify />
            </ProtectedRoute>
          } 
        />

        {/* --- 3. THE MAIN DASHBOARD (Protected & Nested) --- */}
        {/* All routes starting with '/dashboard' are protected
            and will be shown *inside* the DashboardLayout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* USER routes (default) */}
          <Route index element={<WatermarkUploader />} />
          <Route path="verify" element={<VerificationUploader />} />
          <Route path="history" element={<ActivityHistory />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="support" element={<SupportChat />} />
          <Route path="playground" element={<AttackPlayground />} />
          <Route path="announcements" element={<UserAnnouncements />} />
          <Route path="tickets" element={<UserSupportTickets />} />

          {/* ADMIN routes (must also pass AdminRoute guard) */}
          <Route path="admin" element={<AdminRoute />}>
            <Route index element={<AdminAnalytics />} />
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="reports" element={<AdminFlaggedReports />} />
            <Route path="models" element={<AdminModels />} />
            <Route path="announce" element={<AdminAnnouncements />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="tickets" element={<AdminSupportTickets />} />
            <Route path="security" element={<AdminSecurityLogs />} />
          </Route>
        </Route>

        {/* --- 4. CATCH-ALL 404 ROUTE --- */}
        <Route path="*" element={<h1>404: Page Not Found</h1>} />
      </Routes>
    </Suspense>
  );
}
