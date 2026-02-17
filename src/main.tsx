import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// DEV helper: forzar personaje de test (sir-nocturno) incluso si hay estado persistido
if (import.meta.env.DEV) {
  try {
    const { usePlayerStore } = require('./stores/playerStore');
    // Overwrite persisted characterId _only_ in dev for reliable local testing
    usePlayerStore.setState({ characterId: 'sir-nocturno' });
    console.info('[dev] forced playerStore.characterId = "sir-nocturno" for local testing');
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
