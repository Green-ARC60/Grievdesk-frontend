import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { HomePage } from '../pages/HomePage';
import { ProfilePage } from '../pages/ProfilePage';
import { PublicInboxPage } from '../pages/PublicInboxPage';
import { AnnouncementsDuesPage } from '../pages/AnnouncementsDuesPage';
import { MyTicketsPage } from '../pages/MyTicketsPage';
import { ResidentDirectoryPage } from '../pages/ResidentDirectoryPage';
import { AmenityBookingPage } from '../pages/AmenityBookingPage';
import { VendorAllocationPage } from '../pages/VendorAllocationPage';
import { AboutUsPage } from '../pages/AboutUsPage';
import { HelpPage } from '../pages/HelpPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Home Screen (ChatGPT-Style AI Entry) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* Sidebar Sections */}
        <Route
          path="/public-inbox"
          element={
            <ProtectedRoute>
              <PublicInboxPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/announcements-dues"
          element={
            <ProtectedRoute>
              <AnnouncementsDuesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-tickets"
          element={
            <ProtectedRoute>
              <MyTicketsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/directory"
          element={
            <ProtectedRoute>
              <ResidentDirectoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendor-allocation"
          element={
            <ProtectedRoute>
              <VendorAllocationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/amenities"
          element={
            <ProtectedRoute>
              <AmenityBookingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <AboutUsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpPage />
            </ProtectedRoute>
          }
        />

        {/* Public Only routes */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />

        {/* Fallback & Access Control */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
};
