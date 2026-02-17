/**
 * App Principal - Valnor Juego
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RequireNoAuth, GuestAccessGuard } from './components/guards';
import { InstallPrompt } from './components/pwa';
import CookieConsent from './components/CookieConsent';
import { useGameModeStore } from './stores/gameModeStore';

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

// Mode Selection
const PortalSelection = lazy(() => import('./pages/PortalSelection/PortalSelection'));

// Protected Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Shop = lazy(() => import('./pages/Shop'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Dungeon = lazy(() => import('./pages/Dungeon'));
const PlayDungeon = lazy(() => import('./pages/Dungeon/PlayDungeon'));
const Ranking = lazy(() => import('./pages/Ranking'));
const Survival = lazy(() => import('./pages/Survival'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Teams = lazy(() => import('./pages/Teams'));

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

// Guard para requerir selección de modo
function RequireModeSelection({ children }: { children: React.ReactNode }) {
  const { mode, isLoaded, loadMode } = useGameModeStore();
  
  useEffect(() => {
    if (!isLoaded) {
      loadMode();
    }
  }, [isLoaded, loadMode]);
  
  // Mientras carga, mostrar loading
  if (!isLoaded) {
    return <LoadingScreen />;
  }
  
  // Si no hay modo seleccionado, redirigir a portales
  if (!mode) {
    return <Navigate to="/portals" replace />;
  }
  
  return <>{children}</>;
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
            {/* SELECCIÓN DE MODO DE JUEGO                  */}
            {/* ============================================ */}
            <Route path="/portals" element={
              <RequireAuth>
                <PortalSelection />
              </RequireAuth>
            } />

            {/* ============================================ */}
            {/* RUTAS PROTEGIDAS - Requieren login          */}
            {/* Si no está logueado → redirige a /auth/login*/}
            {/* requireVerified=true → también debe tener   */}
            {/* el email verificado                         */}
            {/* ============================================ */}
            {/* Dashboard permite modo invitado - pero requiere selección de modo */}
            <Route path="/dashboard" element={
              <RequireAuth>
                <RequireModeSelection>
                  <Dashboard />
                </RequireModeSelection>
              </RequireAuth>
            } />
            <Route path="/inventory" element={
              <RequireAuth>
                <RequireModeSelection>
                  <GuestAccessGuard>
                    <Inventory />
                  </GuestAccessGuard>
                </RequireModeSelection>
              </RequireAuth>
            } />
            <Route path="/shop" element={
              <RequireAuth>
                <GuestAccessGuard>
                  <Shop />
                </GuestAccessGuard>
              </RequireAuth>
            } />
            <Route path="/marketplace" element={
              <RequireAuth>
                <RequireModeSelection>
                  <GuestAccessGuard>
                    <Marketplace />
                  </GuestAccessGuard>
                </RequireModeSelection>
              </RequireAuth>
            } />
            <Route path="/dungeon" element={
              <RequireAuth>
                <RequireModeSelection>
                  <GuestAccessGuard>
                    <Dungeon />
                  </GuestAccessGuard>
                </RequireModeSelection>
              </RequireAuth>
            } />
            <Route path="/dungeon/play/:id" element={
              <RequireAuth>
                <RequireModeSelection>
                  <GuestAccessGuard>
                    <PlayDungeon />
                  </GuestAccessGuard>
                </RequireModeSelection>
              </RequireAuth>
            } />
            <Route path="/ranking" element={
              <RequireAuth>
                <GuestAccessGuard>
                  <Ranking />
                </GuestAccessGuard>
              </RequireAuth>
            } />
            <Route path="/survival" element={
              <RequireAuth>
                <RequireModeSelection>
                  <GuestAccessGuard>
                    <Survival />
                  </GuestAccessGuard>
                </RequireModeSelection>
              </RequireAuth>
            } />
            <Route path="/profile" element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            } />
            <Route path="/settings" element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            } />
            <Route path="/teams" element={
              <RequireAuth>
                <GuestAccessGuard>
                  <Teams />
                </GuestAccessGuard>
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
