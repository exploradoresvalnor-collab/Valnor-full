import { useState, useEffect, useCallback } from 'react';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Verificar si el usuario ya descartó el banner recientemente
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // No mostrar por 7 días si ya lo descartó
      }
    }

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostrar el banner después de 3 segundos de carga
      setTimeout(() => setShowBanner(true), 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Usuario aceptó instalar la PWA');
      } else {
        console.log('Usuario rechazó instalar la PWA');
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }
    } catch (error) {
      console.error('Error al mostrar prompt de instalación:', error);
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  // No mostrar nada si ya está instalada o no hay prompt disponible
  if (isInstalled || !showBanner || !deferredPrompt) {
    return null;
  }

  return (
    <div className="install-prompt-banner">
      <div className="install-prompt-content">
        <div className="install-prompt-icon">
          <img 
            src="/assets/icons/icon-192x192.svg" 
            alt="Valnor" 
            className="install-prompt-app-icon"
          />
        </div>
        <div className="install-prompt-text">
          <h4>¡Instala Valnor!</h4>
          <p>Juega sin conexión y accede más rápido</p>
        </div>
        <div className="install-prompt-actions">
          <button 
            className="install-prompt-btn install-prompt-btn-primary"
            onClick={handleInstallClick}
          >
            Instalar
          </button>
          <button 
            className="install-prompt-btn install-prompt-btn-secondary"
            onClick={handleDismiss}
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;
