/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { ConnectPage } from './components/ConnectPage';
import { FeedPage } from './components/FeedPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, casal, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-pink-50 text-pink-500">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!casal) return <Navigate to="/connect" replace />;

  return <>{children}</>;
}

function ConnectRoute({ children }: { children: React.ReactNode }) {
  const { user, casal, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-pink-50 text-pink-500">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (casal) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route
        path="/connect"
        element={
          <ConnectRoute>
            <ConnectPage />
          </ConnectRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FeedPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
