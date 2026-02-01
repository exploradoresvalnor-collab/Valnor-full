import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../../services/auth.service';
import './Verify.css';

const Verify: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Get email from sessionStorage (priority) or queryParams
    const pendingEmail = sessionStorage.getItem('pendingEmail');
    const queryEmail = searchParams.get('email');
    const origin = searchParams.get('from') as 'register' | 'duplicate' | null;

    const userEmail = pendingEmail || queryEmail || '';
    setEmail(userEmail);

    // Clear sessionStorage after getting the email
    if (pendingEmail) {
      sessionStorage.removeItem('pendingEmail');
    }

    if (!userEmail) {
      setError('No se encontró el email. Por favor, regístrate nuevamente.');
      setTimeout(() => navigate('/auth/register'), 3000);
      return;
    }

    // Contextual message based on flow
    if (origin === 'register') {
      setBannerMessage('✉️ Te enviamos un correo de verificación. Revisa tu bandeja de entrada y spam.');
    } else if (origin === 'duplicate') {
      setBannerMessage('ℹ️ Este correo ya está registrado. Si no te llegó el correo, puedes reenviarlo ahora.');
    }

    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [searchParams, navigate]);

  const handleResend = async () => {
    if (!email || resendCooldown) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authService.resendVerification(email);
      setSuccess('Correo de verificación reenviado. Revisa tu bandeja.');
      setResendCooldown(true);
      setCountdown(60);

      // Start countdown
      countdownInterval.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownInterval.current) {
              clearInterval(countdownInterval.current);
            }
            setResendCooldown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err: any) {
      setError(err.message || 'No se pudo reenviar el correo. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-container">
        <div className="verify-wrapper">
          {/* Main Card */}
          <div className="verify-card">
            {/* Header */}
            <div className="card-header">
              <div className="header-icon">
                <span>📧</span>
              </div>
              <div className="header-content">
                <div className="header-title-row">
                  <img 
                    src="/assets/icons/Logo_2.webp" 
                    alt="Logo" 
                    className="header-logo"
                  />
                  <div>
                    <h2 className="header-title">Verifica tu Email</h2>
                    <p className="header-subtitle">
                      Te hemos enviado un correo de verificación. Sigue las instrucciones para activar tu cuenta.
                    </p>
                  </div>
                </div>
                {bannerMessage && (
                  <div className="banner-message">
                    {bannerMessage}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="card-content">
              {/* Email Display */}
              <div className="email-display">
                <p className="email-label">Revisa tu bandeja de entrada en:</p>
                <div className="email-badge">
                  <span>{email}</span>
                </div>
              </div>

              {/* Steps */}
              <div className="steps-container">
                <p className="steps-title">Pasos rápidos</p>
                <ul className="steps-list">
                  <li className="step-item">
                    <svg className="step-icon cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8z"/>
                    </svg>
                    <span>Abre el correo enviado a <strong>{email}</strong></span>
                  </li>
                  <li className="step-item">
                    <svg className="step-icon green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                    </svg>
                    <span>Haz clic en el botón <strong>VERIFICAR CUENTA</strong> dentro del correo</span>
                  </li>
                  <li className="step-item">
                    <svg className="step-icon yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3"/>
                    </svg>
                    <span>Se abrirá una página de confirmación; vuelve aquí y haz login</span>
                  </li>
                </ul>
                <p className="steps-warning">⚠️ El enlace expira en 1 hora</p>
              </div>

              {/* Success/Error Messages */}
              {success && (
                <div className="message success-message">
                  <svg className="message-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>{success}</span>
                </div>
              )}
              
              {error && (
                <div className="message error-message">
                  <svg className="message-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Resend Button */}
              <div className="resend-container">
                <button
                  onClick={handleResend}
                  disabled={loading || resendCooldown}
                  className="resend-button"
                >
                  {!loading && !resendCooldown && (
                    <>
                      <svg className="resend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 1113.9-6.1L20 13"/>
                      </svg>
                      <span>Reenviar correo</span>
                    </>
                  )}
                  {loading && <span>Enviando...</span>}
                  {resendCooldown && countdown > 0 && <span>Espera {countdown}s</span>}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="card-footer">
              <p>
                ¿No recibiste el correo? Revisa spam o{' '}
                <Link to="/auth/login" className="footer-link">
                  volver al login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
