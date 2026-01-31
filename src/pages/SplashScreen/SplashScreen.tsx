/**
 * Splash Screen - Pantalla de inicio
 * Migrado desde Angular splash-screen.component
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './SplashScreen.css';

function SplashScreen() {
  const [isExiting, setIsExiting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

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
      className={`splash-container ${isExiting ? 'exiting' : ''}`}
      onClick={handleStart}
    >
      {/* Overlay cinematográfico */}
      <div className={`cinematic-overlay ${isExiting ? 'exit' : ''}`} />
      
      {/* Logo */}
      <img
        src="/assets/logo.png"
        alt="Logo Exploradores de Valnor"
        className={`logo ${isExiting ? 'exit' : ''}`}
      />
      
      {/* Título */}
      <h1 className={`valnor-title ${isExiting ? 'exit' : ''}`}>
        EXPLORADORES DE VALNOR
      </h1>
      
      {/* Subtítulo */}
      <p className={`valnor-sub ${isExiting ? 'exit' : ''}`}>
        Toca para entrar
      </p>
    </div>
  );
}

export default SplashScreen;
