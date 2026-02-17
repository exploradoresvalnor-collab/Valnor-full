/**
 * Splash Screen - Pantalla de inicio
 * Migrado desde Angular splash-screen.component
 * Ahora con opciones: Jugar como invitado o Iniciar sesión
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/sessionStore';
import { GiPlayButton, GiSpellBook } from 'react-icons/gi';
import { FiUser } from 'react-icons/fi';
import './SplashScreen.css';

function SplashScreen() {
  const [isExiting, setIsExiting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const navigate = useNavigate();
  const { startAsGuest, isInitialized } = useSessionStore();

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

  // Mostrar opciones al tocar la pantalla
  const handleTap = useCallback(() => {
    if (isAnimating) return;
    setShowOptions(true);
  }, [isAnimating]);

  // Entrar como invitado
  const handleGuestMode = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsExiting(true);
    
    // Iniciar sesión como invitado
    startAsGuest();

    // Ir al dashboard
    setTimeout(() => {
      navigate('/dashboard');
    }, 600);
  }, [isAnimating, navigate, startAsGuest]);

  // Ir al landing (para registro/login)
  const handleEnter = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsExiting(true);

    setTimeout(() => {
      navigate('/landing');
    }, 600);
  }, [isAnimating, navigate]);

  // Ir a la wiki para más info
  const handleWiki = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsExiting(true);

    setTimeout(() => {
      navigate('/wiki');
    }, 600);
  }, [isAnimating, navigate]);

  return (
    <div 
      className={`splash-container ${isExiting ? 'exiting' : ''} ${isLandscape ? 'landscape' : 'portrait'}`}
      onClick={!showOptions ? handleTap : undefined}
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
          
          {/* Subtítulo o botones */}
          {!showOptions ? (
            <p className={`valnor-sub ${isExiting ? 'exit' : ''}`}>
              Toca para comenzar
            </p>
          ) : (
            <div className={`splash-options ${isExiting ? 'exit' : ''}`}>
              {/* Botón principal - Modo Invitado */}
              <button
                className="splash-btn splash-btn-primary minimal-portal"
                onClick={handleGuestMode}
              >
                <span className="btn-icon"><GiPlayButton size={24} /></span>
                <span className="btn-text">Invitado</span>
              </button>
              {/* Botones secundarios */}
              <div className="splash-btn-row">
                <button
                  className="splash-btn splash-btn-secondary minimal-seal"
                  onClick={handleEnter}
                >
                  <span className="btn-icon"><FiUser size={18} /></span>
                  <span className="btn-text">Entrar</span>
                </button>

                <button
                  className="splash-btn splash-btn-secondary minimal-book"
                  onClick={handleWiki}
                >
                  <span className="btn-icon"><GiSpellBook size={18} /></span>
                  <span className="btn-text">Wiki</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Partículas decorativas */}
      <div className="particles">
        {/* Partículas doradas ascendentes */}
        <div className="particle gold"></div>
        <div className="particle gold"></div>
        <div className="particle gold"></div>
        <div className="particle gold"></div>
        <div className="particle gold"></div>
        <div className="particle gold"></div>
        <div className="particle gold"></div>
        <div className="particle gold"></div>
        {/* Partículas de energía azul */}
        <div className="particle energy"></div>
        <div className="particle energy"></div>
        <div className="particle energy"></div>
        <div className="particle energy"></div>
        <div className="particle energy"></div>
        {/* Partículas de cristal púrpura */}
        <div className="particle crystal"></div>
        <div className="particle crystal"></div>
        <div className="particle crystal"></div>
        <div className="particle crystal"></div>
        {/* Partículas de brillo */}
        <div className="particle sparkle"></div>
        <div className="particle sparkle"></div>
        <div className="particle sparkle"></div>
        <div className="particle sparkle"></div>
        <div className="particle sparkle"></div>
        <div className="particle sparkle"></div>
        {/* Partículas flotantes laterales */}
        <div className="particle float"></div>
        <div className="particle float"></div>
        <div className="particle float"></div>
        <div className="particle float"></div>
      </div>
      
      {/* Rayos de luz */}
      <div className="light-rays">
        <div className="ray"></div>
        <div className="ray"></div>
        <div className="ray"></div>
      </div>
    </div>
  );
}

export default SplashScreen;
