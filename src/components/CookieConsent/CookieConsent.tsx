/**
 * Cookie Consent Banner - Valnor Game
 * Banner minimalista de consentimiento de cookies
 */

import { useState, useEffect } from 'react';
import './CookieConsent.css';

const COOKIE_CONSENT_KEY = 'valnor_cookie_consent';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setIsAnimating(true);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    localStorage.setItem(COOKIE_CONSENT_KEY + '_date', new Date().toISOString());
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleDecline = () => {
    setIsAnimating(true);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`cookie-overlay ${isAnimating ? 'hiding' : ''}`}>
      <div className={`cookie-banner ${isAnimating ? 'slide-out' : 'slide-in'}`}>
        <div className="cookie-content">
          <span className="cookie-icon">🍪</span>
          <span className="cookie-description">Usamos cookies para mejorar tu experiencia.</span>
          <div className="cookie-actions">
            <button onClick={handleDecline} className="cookie-btn cookie-btn-decline">No</button>
            <button onClick={handleAccept} className="cookie-btn cookie-btn-accept">OK</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
