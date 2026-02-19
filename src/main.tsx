import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ── Cleanup: borrar keys obsoletas del modo invitado ─────
(() => {
  // 1. Borrar datos demo que ya no existen
  localStorage.removeItem('valnor-demo-data');

  // 2. Si la sesión persistida era guest, resetearla a none
  try {
    const raw = localStorage.getItem('valnor-session-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.mode === 'guest') {
        parsed.state.mode = 'none';
        parsed.state.guestProfile = null;
        parsed.state.isInitialized = false;
        localStorage.setItem('valnor-session-storage', JSON.stringify(parsed));
        console.info('[cleanup] sesión guest obsoleta reseteada a none');
      }
      // También limpiar guestProfile residual en cualquier modo
      if (parsed?.state?.guestProfile) {
        delete parsed.state.guestProfile;
        localStorage.setItem('valnor-session-storage', JSON.stringify(parsed));
      }
    }
  } catch { /* ignore */ }
})();

// DEV helper: forzar personaje de test (sir-nocturno) incluso si hay estado persistido
if (import.meta.env.DEV) {
  try {
    const { usePlayerStore } = require('./stores/playerStore');
    // Overwrite persisted characterId _only_ in dev for reliable local testing
    usePlayerStore.setState({ characterId: 'sir-nocturno' });
  } catch (err) {
    // ignore if store not yet available or SSR
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
