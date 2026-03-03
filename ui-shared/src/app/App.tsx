import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/Auth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UniversalCADViewTestPage from './pages/UniversalCADViewTest/UniversalCADViewTestPage';
import DrawingEditorPage from './pages/DrawingEditor/DrawingEditorPage';
import NestingPage from './pages/Nesting/NestingPage';
import { MainApp } from './layouts/MainApp';
import { AdminLayout } from './layouts/AdminLayout';

import { usePreventZoom } from './hooks/usePreventZoom';

function App() {
  usePreventZoom();
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Test page route - Protected */}
      <Route path="/universal-cadview-test" element={
        <ProtectedRoute>
          <UniversalCADViewTestPage />
        </ProtectedRoute>
      } />
      <Route path="/universal-cadview-test.html" element={
        <ProtectedRoute>
          <Navigate to="/universal-cadview-test" replace />
        </ProtectedRoute>
      } />
      <Route path="/drawing/editor" element={
        <ProtectedRoute>
          <DrawingEditorPage />
        </ProtectedRoute>
      } />
      <Route path="/nesting/workbench" element={
        <ProtectedRoute>
          <NestingPage />
        </ProtectedRoute>
      } />

      {/* Admin routes - Protected */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      />

      {/* Root redirect to protected page */}
      <Route path="/" element={<Navigate to="/drawing/editor" replace />} />

      {/* Protected routes catch-all */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
