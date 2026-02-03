/**
 * GuestBanner - Banner de atención para usuarios invitados
 * Se muestra en páginas donde el invitado tiene funcionalidad limitada
 */

import { useNavigate } from 'react-router-dom';
import './GuestBanner.css';

interface GuestBannerProps {
  message?: string;
  showRegisterButton?: boolean;
  variant?: 'warning' | 'info' | 'locked';
}

export function GuestBanner({ 
  message = 'Estás en modo demo. Tu progreso no se guardará.',
  showRegisterButton = true,
  variant = 'warning'
}: GuestBannerProps) {
  const navigate = useNavigate();
  
  const icons = {
    warning: '⚠️',
    info: 'ℹ️',
    locked: '🔒',
  };
  
  return (
    <div className={`guest-banner-component ${variant}`}>
      <div className="guest-banner-icon">
        {icons[variant]}
      </div>
      <div className="guest-banner-text">
        <span className="guest-banner-message">{message}</span>
        {showRegisterButton && (
          <button 
            className="guest-banner-cta"
            onClick={() => navigate('/auth/register')}
          >
            Crear cuenta gratis →
          </button>
        )}
      </div>
    </div>
  );
}

export default GuestBanner;
