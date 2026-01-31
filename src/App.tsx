/**
 * App Principal - Valnor Juego
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

// Pages
const SplashScreen = lazy(() => import('./pages/SplashScreen'));

// Loading component
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>Cargando...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Splash Screen */}
          <Route path="/" element={<Navigate to="/splash" replace />} />
          <Route path="/splash" element={<SplashScreen />} />

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/splash" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
