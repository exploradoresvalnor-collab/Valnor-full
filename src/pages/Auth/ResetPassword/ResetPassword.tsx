import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authService } from '../../../services/auth.service';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setInvalidToken(true);
      return;
    }

    const validateToken = async () => {
      try {
        await authService.validateResetToken(token);
      } catch {
        setInvalidToken(true);
      }
    };

    validateToken();
  }, [token]);

  // Redirect after success
  useEffect(() => {
    if (resetSuccess) {
      const timeout = setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [resetSuccess, navigate]);

  // Validation
  const getFieldError = (field: string): string | null => {
    if (!touched[field]) return null;

    switch (field) {
      case 'password':
        if (!formData.password) return 'La contraseña es requerida';
        if (formData.password.length < 6) return 'Mínimo 6 caracteres';
        break;
      case 'confirmPassword':
        if (!formData.confirmPassword) return 'Confirma tu contraseña';
        if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden';
        break;
    }
    return null;
  };

  const hasFieldError = (field: string): boolean => getFieldError(field) !== null;

  const isFormValid = 
    formData.password.length >= 6 && 
    formData.password === formData.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });

    if (!isFormValid || !token || loading) return;

    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, formData.password);
      setResetSuccess(true);
    } catch (err: any) {
      if (err.status === 400 || err.status === 404) {
        setInvalidToken(true);
      } else {
        setError(err.message || 'Error al restablecer la contraseña');
      }
    } finally {
      setLoading(false);
    }
  };

  // Invalid Token View
  if (invalidToken) {
    return (
      <div className="reset-password-page">
        <div className="reset-container">
          <div className="reset-card invalid-card">
            <div className="invalid-content">
              <div className="invalid-logo">
                <img src="/assets/icons/Logo_2.webp" alt="ValGame" />
              </div>
              <div className="invalid-text">
                <h3>Token Inválido o Expirado</h3>
                <p>El enlace de recuperación no es válido o ha caducado</p>
              </div>
              <div className="invalid-warning">
                <p>Los enlaces de recuperación expiran después de 1 hora por seguridad</p>
              </div>
              <button
                onClick={() => navigate('/auth/forgot-password')}
                className="primary-button"
              >
                Solicitar Nuevo Enlace
              </button>
              <button
                onClick={() => navigate('/auth/login')}
                className="text-button"
              >
                ← Volver a Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success View
  if (resetSuccess) {
    return (
      <div className="reset-password-page">
        <div className="reset-container">
          <div className="reset-card success-card">
            <div className="success-content">
              <div className="success-icon-wrapper">
                <div className="success-icon-bg">
                  <svg className="success-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <div className="success-text">
                <h3>✅ ¡Contraseña Actualizada!</h3>
                <p>Tu contraseña ha sido cambiada exitosamente</p>
                <p className="success-hint">Redirigiendo al login...</p>
              </div>
              <div className="success-arrow">
                <svg className="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form View
  return (
    <div className="reset-password-page">
      <div className="reset-container">
        <div className="reset-card form-card">
          {/* Header */}
          <div className="card-header">
            <img 
              src="/assets/icons/Logo_2.webp" 
              alt="ValGame Studio" 
              className="header-logo"
            />
            <div className="header-icon-wrapper">
              <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
            </div>
            <h1 className="header-title">Nueva Contraseña</h1>
            <p className="header-subtitle">Ingresa tu nueva contraseña segura</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <p>⚠️ {error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="reset-form">
            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Nueva Contraseña</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={hidePassword ? 'password' : 'text'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="Mínimo 6 caracteres"
                  autoFocus
                  className={`form-input ${hasFieldError('password') ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setHidePassword(!hidePassword)}
                  className="toggle-password"
                >
                  {hidePassword ? (
                    <svg className="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  ) : (
                    <svg className="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  )}
                </button>
              </div>
              {hasFieldError('password') && (
                <p className="error-text">⚠️ {getFieldError('password')}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña</label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  type={hideConfirmPassword ? 'password' : 'text'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Repite tu contraseña"
                  className={`form-input ${hasFieldError('confirmPassword') ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setHideConfirmPassword(!hideConfirmPassword)}
                  className="toggle-password"
                >
                  {hideConfirmPassword ? (
                    <svg className="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  ) : (
                    <svg className="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  )}
                </button>
              </div>
              {hasFieldError('confirmPassword') && (
                <p className="error-text">⚠️ {getFieldError('confirmPassword')}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="submit-button"
            >
              {!loading ? (
                <span>Cambiar Contraseña</span>
              ) : (
                <span className="loading-content">
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle className="spinner-bg" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="spinner-fg" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="card-footer">
            <Link to="/auth/login" className="footer-link">
              ← Volver a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
