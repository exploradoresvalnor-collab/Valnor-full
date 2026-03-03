import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../../services/auth.service';
import './ForgotPassword.css';

const ForgotPassword: React.FC = () => {

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(3600); // 1 hour
  const [resendCooldownRemaining, setResendCooldownRemaining] = useState(0);

  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      if (resendTimer.current) clearInterval(resendTimer.current);
    };
  }, []);

  // Validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = touched && (!email ? 'El email es requerido' : (!isValidEmail(email) ? 'Email inválido' : null));
  const isFormValid = email && isValidEmail(email);

  // Format remaining time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCountdown = () => {
    setSecondsRemaining(3600);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    countdownTimer.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          if (countdownTimer.current) clearInterval(countdownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startResendCooldown = () => {
    setResendCooldownRemaining(60);
    if (resendTimer.current) clearInterval(resendTimer.current);
    resendTimer.current = setInterval(() => {
      setResendCooldownRemaining(prev => {
        if (prev <= 1) {
          if (resendTimer.current) clearInterval(resendTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!isFormValid || loading) return;

    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setEmailSent(true);
      startCountdown();
      startResendCooldown();
    } catch (err: any) {
      // Errores de conexión sí se muestran
      if (err.status === 0 || err.message === 'Failed to fetch') {
        setEmailSent(false);
        setTouched(true);
        // Mostrar error de conexión con un state extra
        setEmail(email); // mantener email
        alert('🔌 No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
      } else if (err.status === 429) {
        setEmailSent(false);
        alert('⏳ Demasiados intentos. Espera unos minutos.');
      } else if (err.status >= 500) {
        setEmailSent(false);
        alert('💥 Error del servidor. Intenta más tarde.');
      } else {
        // Para 404/400 el backend responde igual por seguridad → mostrar éxito
        setEmailSent(true);
        startCountdown();
        startResendCooldown();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldownRemaining > 0 || loading || !email) return;

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      startResendCooldown();
    } catch {
      // Ignore errors, start cooldown anyway
      startResendCooldown();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      {/* Background Image Overlay */}
      <div className="bg-image-overlay">
        <img src="/assets/icons/portada_pc.webp" alt="Valnor Background" />
        <div className="bg-gradient-overlay" />
      </div>

      {/* Heroic Ambient Glow */}
      <div className="form-ambient-glow" />

      <div className="forgot-container">
        <div className="forgot-card">
          {/* Header */}
          <div className="card-header">
            <img
              src="/assets/icons/Logo_2.webp"
              alt="ValGame Studio"
              className="header-logo"
            />
            <h1 className="header-title">¿Olvidaste tu Contraseña?</h1>
            <p className="header-subtitle">
              Ingresa tu email y te enviaremos instrucciones épticas
            </p>
          </div>

          {/* Form - shown when email not sent */}
          {!emailSent && (
            <form onSubmit={handleSubmit} className="forgot-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="tu@email.com"
                  autoFocus
                  className={`form-input ${emailError ? 'input-error' : ''}`}
                />
                {emailError && (
                  <p className="error-text">⚠️ {emailError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="submit-button"
              >
                {!loading ? (
                  <span>Enviar Instrucciones</span>
                ) : (
                  <span>Enviando...</span>
                )}
              </button>
            </form>
          )}

          {/* Success message - shown after email sent */}
          {emailSent && (
            <div className="success-content">
              {/* Success Icon */}
              <div className="success-icon-wrapper">
                <div className="success-icon-bg">
                  <svg className="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
              </div>

              <div className="success-text">
                <h3 className="success-title">✅ ¡Email Enviado!</h3>
                <p className="success-message">
                  Si el email existe, recibirás un enlace para restablecer tu contraseña.
                </p>
              </div>

              {/* Actions */}
              <div className="success-actions">
                <div className="timer-box">
                  <p className="timer-text">
                    ⏱️ El enlace expira en: <strong>{formatTime(secondsRemaining)}</strong>
                  </p>
                  <button
                    onClick={handleResend}
                    disabled={resendCooldownRemaining > 0 || loading}
                    className="resend-button"
                  >
                    {resendCooldownRemaining === 0
                      ? 'Reenviar'
                      : `Reenviar (${resendCooldownRemaining}s)`
                    }
                  </button>
                </div>

                <Link to="/auth/login" className="back-button-link">
                  ← Volver al Portal
                </Link>
              </div>
            </div>
          )}

          {/* Footer Link - only when form is shown */}
          {!emailSent && (
            <div className="card-footer">
              <Link to="/auth/login" className="footer-link">
                ← Volver al Portal
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
