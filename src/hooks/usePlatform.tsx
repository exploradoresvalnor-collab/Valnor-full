/**
 * Hook para detectar la plataforma del usuario
 * Útil para mostrar/ocultar funcionalidades según el entorno
 */

import { useState, useEffect, useMemo, ReactNode } from 'react';

export interface PlatformInfo {
  /** Si está ejecutando como PWA instalada */
  isPWA: boolean;
  /** Si está ejecutando como app nativa (Capacitor) */
  isNativeApp: boolean;
  /** Si está en navegador web normal */
  isWeb: boolean;
  /** Si es dispositivo móvil */
  isMobile: boolean;
  /** Si es iOS */
  isIOS: boolean;
  /** Si es Android */
  isAndroid: boolean;
  /** Si debe mostrar opciones de compra (solo web, no PWA ni native) */
  canShowPurchases: boolean;
  /** Nombre de la plataforma */
  platformName: 'web' | 'pwa' | 'ios' | 'android' | 'unknown';
}

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
    };
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export function usePlatform(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(() => detectPlatform());

  useEffect(() => {
    // Re-detectar si cambia el display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    
    const handleChange = () => {
      setPlatformInfo(detectPlatform());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return platformInfo;
}

function detectPlatform(): PlatformInfo {
  // Detectar si es app nativa de Capacitor
  const isNativeApp = typeof window !== 'undefined' && 
    window.Capacitor?.isNativePlatform?.() === true;

  // Detectar si es PWA instalada
  const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );

  // Detectar sistema operativo
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /webOS|BlackBerry|Opera Mini|IEMobile/.test(userAgent);

  // Plataforma de Capacitor si está disponible
  const capacitorPlatform = window.Capacitor?.getPlatform?.();

  // Es web normal si no es PWA ni nativa
  const isWeb = !isPWA && !isNativeApp;

  // Solo mostrar compras en web normal (no PWA, no nativa)
  // Esto evita las comisiones del 30% de las tiendas de apps
  const canShowPurchases = isWeb;

  // Determinar nombre de plataforma
  let platformName: PlatformInfo['platformName'] = 'unknown';
  if (isNativeApp) {
    platformName = capacitorPlatform === 'ios' ? 'ios' : 
                   capacitorPlatform === 'android' ? 'android' : 'android';
  } else if (isPWA) {
    platformName = 'pwa';
  } else {
    platformName = 'web';
  }

  return {
    isPWA,
    isNativeApp,
    isWeb,
    isMobile,
    isIOS,
    isAndroid,
    canShowPurchases,
    platformName
  };
}

/**
 * Componente helper para renderizar contenido solo en ciertas plataformas
 */
export function PlatformOnly({ 
  children, 
  platforms 
}: { 
  children: React.ReactNode; 
  platforms: Array<'web' | 'pwa' | 'ios' | 'android' | 'native' | 'mobile'>;
}) {
  const { isWeb, isPWA, isIOS, isAndroid, isNativeApp, isMobile } = usePlatform();

  const shouldRender = useMemo(() => {
    return platforms.some(platform => {
      switch (platform) {
        case 'web': return isWeb;
        case 'pwa': return isPWA;
        case 'ios': return isIOS;
        case 'android': return isAndroid;
        case 'native': return isNativeApp;
        case 'mobile': return isMobile;
        default: return false;
      }
    });
  }, [platforms, isWeb, isPWA, isIOS, isAndroid, isNativeApp, isMobile]);

  if (!shouldRender) return null;
  return <>{children}</>;
}

/**
 * Hook para verificar si debe mostrar compras
 * IMPORTANTE: Solo mostrar compras en web para evitar comisión del 30%
 */
export function useCanShowPurchases(): boolean {
  const { canShowPurchases } = usePlatform();
  return canShowPurchases;
}

export default usePlatform;
