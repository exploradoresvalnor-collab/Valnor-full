/**
 * Landing Page - Valnor Juego
 * Migrado desde Angular
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroState, setHeroState] = useState<'init-hidden' | 'showing' | 'exit'>('init-hidden');
  const [isEntering, setIsEntering] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Navigation handlers
  const goToLogin = () => {
    console.log('[Landing] Navegar a login');
    closeMobileMenu();
    navigate('/auth/login');
  };

  const goToRegister = () => {
    console.log('[Landing] Navegar a registro');
    closeMobileMenu();
    navigate('/auth/register');
  };

  // Demo button handler
  const onStartEpic = useCallback(() => {
    if (isEntering) return;
    setIsEntering(true);
    closeMobileMenu();
    setHeroState('exit');

    // Navigate after animation - ir al splash para elegir modo
    setTimeout(() => {
      navigate('/splash');
    }, 600);
  }, [isEntering, navigate]);

  // Preload hero images
  const preloadHeroImages = useCallback((timeoutMs = 3000): Promise<void> => {
    const images = ['/assets/icons/portada_pc.webp', '/assets/icons/portada_movil.webp'];
    
    return new Promise((resolve) => {
      let completed = 0;
      let finished = false;
      
      const markDone = () => {
        if (finished) return;
        finished = true;
        resolve();
      };

      const onLoad = () => {
        completed += 1;
        if (completed >= images.length) markDone();
      };

      images.forEach((src) => {
        const img = new Image();
        img.onload = onLoad;
        img.onerror = onLoad;
        img.src = src;
      });

      setTimeout(markDone, timeoutMs);
    });
  }, []);

  // Initialize landing page
  useEffect(() => {
    document.body.classList.add('landing-no-scroll');

    preloadHeroImages().then(() => {
      setHeroState('showing');
    }).catch(() => {
      setHeroState('showing');
    });

    return () => {
      document.body.classList.remove('landing-no-scroll');
    };
  }, [preloadHeroImages]);

  // Handle window resize for mobile menu
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  // Set CSS variable for viewport height (mobile fix)
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    return () => window.removeEventListener('resize', setVH);
  }, []);

  return (
    <div className="smooth-transition">
      {/* NAV */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="brand-text">Valnor</span>
          </div>

          {/* Desktop Menu */}
          <ul className="nav-menu">
            <li>
              <a className="nav-link" onClick={goToLogin}>
                Iniciar sesión
              </a>
            </li>
            <li>
              <a className="nav-link" onClick={goToRegister}>
                Registrarse
              </a>
            </li>
            <li>
              <a className="nav-link" onClick={() => navigate('/wiki')}>
                Wiki
              </a>
            </li>
          </ul>

          {/* Hamburger Button (Mobile) */}
          <button
            className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Menú"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <a className="mobile-link" onClick={goToLogin}>
            Iniciar sesión
          </a>
          <a className="mobile-link" onClick={goToRegister}>
            Registrarse
          </a>
          <a
            className="mobile-link"
            onClick={() => {
              closeMobileMenu();
              navigate('/wiki');
            }}
          >
            Wiki
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section
        ref={heroRef}
        className={`landing-hero ${heroState} ${heroState === 'showing' ? 'landing-enter' : ''} ${heroState === 'exit' ? 'hero-exit' : ''}`}
      >
        <div className="hero-background" aria-hidden="true"></div>

        <div className="hero-content">
          <div className="logo-container">
            <div className="logo-ambient-glow"></div>
            <img
              src="/assets/icons/Logo_2.webp"
              alt="ValGame Studio"
              className="hero-logo"
            />
          </div>

          {/* CTA: Entrar al Demo */}
          <div className="hero-cta-wrap">
            <button
              className="hero-cta hero-cta--primary"
              onClick={onStartEpic}
              aria-label="Entrar al Demo"
            >
              Entrar al Demo
              <span className="chev" aria-hidden="true">
                ➜
              </span>
            </button>
            <div className="cta-sub">Explora la Fortaleza — sin instalación</div>
          </div>
        </div>

        {/* Footer Content Transparente */}
        <div className="hero-footer-content">
          <div className="hero-footer-inner">
            <div className="hero-footer-brand">
              <img
                src="/assets/icons/Logo_2.webp"
                alt="ValGame Studio"
                className="hero-footer-logo"
              />
              <span className="hero-footer-text">ValGame Studio</span>
            </div>
            <p className="hero-footer-copy">&copy; 2025 ValGame Studio</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
