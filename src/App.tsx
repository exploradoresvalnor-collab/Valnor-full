/**
 * App Principal - Valnor Juego
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RequireNoAuth } from './components/guards';
import { InstallPrompt } from './components/pwa';
import CookieConsent from './components/CookieConsent';

// SplashScreen - Carga directa (primera pantalla, no lazy)
import SplashScreen from './pages/SplashScreen';

// Pages - Lazy loaded
const Landing = lazy(() => import('./pages/Landing'));

// Auth Pages
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const Verify = lazy(() => import('./pages/Auth/Verify'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));

// Protected Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Shop = lazy(() => import('./pages/Shop'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Dungeon = lazy(() => import('./pages/Dungeon'));
const Ranking = lazy(() => import('./pages/Ranking'));
const Survival = lazy(() => import('./pages/Survival'));

// Public Pages
const Wiki = lazy(() => import('./pages/Wiki'));

// Loading component - Rápido y sutil
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* ============================================ */}
            {/* RUTAS PÚBLICAS - Cualquiera puede acceder   */}
            {/* ============================================ */}
            <Route path="/" element={<Navigate to="/splash" replace />} />
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/wiki" element={<Wiki />} />

            {/* ============================================ */}
            {/* RUTAS DE AUTH - Solo para NO logueados      */}
            {/* Si ya está logueado → redirige a /dashboard */}
            {/* ============================================ */}
            <Route path="/auth/login" element={
              <RequireNoAuth>
                <Login />
              </RequireNoAuth>
            } />
            <Route path="/auth/register" element={
              <RequireNoAuth>
                <Register />
              </RequireNoAuth>
            } />
            <Route path="/auth/forgot-password" element={
              <RequireNoAuth>
                <ForgotPassword />
              </RequireNoAuth>
            } />
            <Route path="/auth/reset-password/:token" element={
              <RequireNoAuth>
                <ResetPassword />
              </RequireNoAuth>
            } />
            
            {/* Verificación de email - puede acceder sin login */}
            <Route path="/auth/verify" element={<Verify />} />

            {/* ============================================ */}
            {/* RUTAS PROTEGIDAS - Requieren login          */}
            {/* Si no está logueado → redirige a /auth/login*/}
            {/* requireVerified=true → también debe tener   */}
            {/* el email verificado                         */}
            {/* ============================================ */}
            <Route path="/dashboard" element={
              <RequireAuth requireVerified>
                <Dashboard />
              </RequireAuth>
            } />
            <Route path="/inventory" element={
              <RequireAuth requireVerified>
                <Inventory />
              </RequireAuth>
            } />
            <Route path="/shop" element={
              <RequireAuth requireVerified>
                <Shop />
              </RequireAuth>
            } />
            <Route path="/marketplace" element={
              <RequireAuth requireVerified>
                <Marketplace />
              </RequireAuth>
            } />
            <Route path="/dungeon" element={
              <RequireAuth requireVerified>
                <Dungeon />
              </RequireAuth>
            } />
            <Route path="/ranking" element={
              <RequireAuth requireVerified>
                <Ranking />
              </RequireAuth>
            } />
            <Route path="/survival" element={
              <RequireAuth requireVerified>
                <Survival />
              </RequireAuth>
            } />

            {/* Demo - también protegido */}
            <Route path="/demo" element={
              <RequireAuth requireVerified>
                <Landing />
              </RequireAuth>
            } />

            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/splash" replace />} />
          </Routes>

          {/* PWA Install Prompt - Se muestra en web cuando está disponible */}
          <InstallPrompt />
          
          {/* Cookie Consent Banner */}
          <CookieConsent />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
