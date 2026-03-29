import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DispatchBoardPage from './pages/DispatchBoardPage';
import TrucksPage from './pages/TrucksPage';
import DriversPage from './pages/DriversPage';
import ExceptionsPage from './pages/ExceptionsPage';

export default function App() {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DispatchBoardPage />} />
            <Route path="/trucks" element={<TrucksPage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/exceptions" element={<ExceptionsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

// Prevent unused import warning
void React;
