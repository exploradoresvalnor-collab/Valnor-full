/**
 * Splash Screen - Pantalla de inicio
 * Diseño profesional estático con flujo cinematográfico (Press Start)
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GiSpellBook } from 'react-icons/gi';
import { FiLogIn } from 'react-icons/fi';
import './SplashScreen.css';

function SplashScreen() {
  const [isExiting, setIsExiting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  // Detectar orientación y móviles
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);

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

  // Activar el menú al tocar la pantalla (primera fase)
  const handleStartInteraction = useCallback(() => {
    if (showMenu || isAnimating) return;
    setShowMenu(true);
  }, [showMenu, isAnimating]);

  // Ir al landing (para registro/login)
  const handleEnter = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar activar el menú si ya está activo
    if (isAnimating) return;

    setIsAnimating(true);
    setIsExiting(true);

    setTimeout(() => {
      navigate('/landing');
    }, 600);
  }, [isAnimating, navigate]);

  // Ir a la wiki
  const handleWiki = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
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
      onClick={handleStartInteraction}
    >
      {/* Overlay cinematográfico */}
      <div className={`cinematic-overlay ${isExiting ? 'exit' : ''}`} />

      {/* Contenido principal */}
      <div className={`splash-content ${isExiting ? 'exit' : ''} ${showMenu ? 'with-menu' : ''}`}>

        {/* Logo que ya contiene el título */}
        <div className="title-group">
          <div className="logo-wrapper">
            <img
              src="/assets/icons/Logo_2.webp"
              alt="Logo Exploradores de Valnor"
              className={`logo-main ${isExiting ? 'exit' : ''}`}
            />
          </div>
        </div>

        {/* Fase 1: Call to Action inicial */}
        {!showMenu && (
          <div className="press-start-prompt">
            <p className="pulse-text">Haz clic para comenzar</p>
          </div>
        )}

        {/* Fase 2: Menú de opciones */}
        {showMenu && (
          <nav className={`splash-menu ${isExiting ? 'exit' : ''}`}>
            <button
              className="splash-btn splash-btn-primary ornate-btn"
              onClick={handleEnter}
            >
              <div className="btn-ornament ornate-left" />
              <FiLogIn className="btn-icon" />
              <span className="btn-label">Entrar al Reino</span>
              <div className="btn-ornament ornate-right" />
            </button>

            <button
              className="splash-btn splash-btn-secondary ornate-btn"
              onClick={handleWiki}
            >
              <div className="btn-ornament ornate-left" />
              <GiSpellBook className="btn-icon" />
              <span className="btn-label">Ver Wiki</span>
              <div className="btn-ornament ornate-right" />
            </button>
          </nav>
        )}
      </div>

      {/* Footer Info */}
      <div className="splash-footer">
        <span className="splash-version">© 2025 ValGame Studio</span>
      </div>
    </div>
  );
}

export default SplashScreen;
