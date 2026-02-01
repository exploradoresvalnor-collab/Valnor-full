/**
 * Splash Screen - Pantalla de inicio
 * Migrado desde Angular splash-screen.component
 * Optimizado para orientación horizontal y vertical
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SplashScreen.css';

function SplashScreen() {
  const [isExiting, setIsExiting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const navigate = useNavigate();

  // Detectar orientación
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    
    // Set CSS variable for viewport height (mobile fix)
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('resize', setVH);
    };
  }, []);

  const handleStart = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsExiting(true);

    // Esperar animación y navegar a la landing
    setTimeout(() => {
      navigate('/landing');
    }, 600);
  }, [isAnimating, navigate]);

  return (
    <div 
      className={`splash-container ${isExiting ? 'exiting' : ''} ${isLandscape ? 'landscape' : 'portrait'}`}
      onClick={handleStart}
    >
      {/* Overlay cinematográfico */}
      <div className={`cinematic-overlay ${isExiting ? 'exit' : ''}`} />
      
      {/* Contenido principal */}
      <div className={`splash-content ${isExiting ? 'exit' : ''}`}>
        {/* Logo */}
        <div className="logo-wrapper">
          <div className="logo-glow"></div>
          <img
            src="/assets/logo.png"
            alt="Logo Exploradores de Valnor"
            className={`logo ${isExiting ? 'exit' : ''}`}
          />
        </div>
        
        {/* Texto */}
        <div className="text-wrapper">
          {/* Título */}
          <h1 className={`valnor-title ${isExiting ? 'exit' : ''}`}>
            EXPLORADORES DE VALNOR
          </h1>
          
          {/* Subtítulo */}
          <p className={`valnor-sub ${isExiting ? 'exit' : ''}`}>
            Toca para entrar
          </p>
        </div>
      </div>

      {/* Partículas decorativas */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
    </div>
  );
}

export default SplashScreen;
