/**
 * Login Page - Valnor Juego
 * Migrado desde Angular
 */

import { useState, FormEvent } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading, error, clearError } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Validaciones
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 6;

  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!emailValid || !passwordValid) return;

    setIsPageLoading(true);
    clearError();

    const success = await login({ email, password }, returnUrl);
    
    if (!success) {
      setIsPageLoading(false);
    }
  };

  const goToHome = () => {
    navigate('/');
  };

  return (
    <div className="login-page">
      {/* Animated Background Pattern */}
      <div className="bg-pattern" />

      {/* Background Image Overlay */}
      <div className="bg-image-overlay">
        <img src="/assets/icons/portada_pc.webp" alt="Valnor Background" />
        <div className="bg-gradient-overlay" />
      </div>

      {/* Glowing Orbs */}
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />

      {/* Back Button */}
      <div className="back-button-container">
        <button onClick={goToHome} className="back-button">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Volver al inicio</span>
        </button>
      </div>

      {/* Content Container */}
      <div className="content-container">
        <div className="form-wrapper">
          <form onSubmit={handleSubmit} className="login-form">
            {/* Animated Border Glow */}
            <div className="form-glow" />
            
            {/* Corner Accents */}
            <div className="corner-accent corner-top-right" />
            <div className="corner-accent corner-bottom-left" />
            
            {/* Glowing Corner Dots */}
            <div className="corner-dot dot-tl" />
            <div className="corner-dot dot-br" />
            <div className="corner-dot dot-tr" />
            <div className="corner-dot dot-bl" />

            {/* Título */}
            <div className="form-title">
              <h2>INICIO DE SESIÓN</h2>
            </div>

            {/* Mensajes de Error */}
            {error && (
              <div className={`error-message ${
                error.includes('verificada') || error.includes('verificar') ? 'error-warning' : 
                error.includes('conectar') || error.includes('servidor') ? 'error-server' : 
                'error-auth'
              }`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="error-text-container">
                  <span>{error}</span>
                  {(error.includes('verificada') || error.includes('verificar')) && (
                    <Link to="/auth/verify" className="error-action-link">
                      Reenviar correo de verificación →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Email
              </label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  className={`form-input ${touched.email && !emailValid ? 'input-error' : ''}`}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
                {touched.email && !emailValid && (
                  <div className="error-badge">
                    {!email ? 'Requerido' : 'Email inválido'}
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Contraseña
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={hidePassword ? 'password' : 'text'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  className={`form-input ${touched.password && !passwordValid ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setHidePassword(!hidePassword)}
                  className="password-toggle"
                >
                  {hidePassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
                {touched.password && !passwordValid && (
                  <div className="error-badge error-badge-left">
                    {!password ? 'Requerido' : 'Mín. 6 chars'}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              <div className="button-shine" />
              {!loading ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Iniciar Sesión</span>
                </>
              ) : (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Ingresando...</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line" />
              <span>O</span>
              <div className="divider-line" />
            </div>

            {/* Forgot Password Link */}
            <div className="link-container">
              <Link to="/auth/forgot-password" className="forgot-link">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Link to Register */}
            <div className="link-container">
              <span className="text-gray">¿No tienes cuenta? </span>
              <Link to="/auth/register" className="register-link">
                Regístrate aquí
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Loading Overlay */}
      {isPageLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <img src="/assets/icons/Logo_2.webp" alt="Valnor Logo" className="loading-logo" />
            <div className="loading-text">
              <h3>¡Bienvenido de nuevo!</h3>
              <p>Accediendo a tu aventura</p>
            </div>
            <div className="loading-spinner" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
