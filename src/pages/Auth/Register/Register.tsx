import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { authService } from '../../../services/auth.service';
import './Register.css';

interface ChecklistItem {
  key: string;
  label: string;
  ok: boolean;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading: isLoading, error, clearError } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  // UI state
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  // Duplicate check state
  const [emailDuplicate, setEmailDuplicate] = useState(false);
  const [usernameDuplicate, setUsernameDuplicate] = useState(false);

  // Password policy checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { key: 'length', label: 'Mínimo 10 caracteres', ok: false },
    { key: 'upper', label: 'Debe contener una mayúscula', ok: false },
    { key: 'lower', label: 'Debe contener una minúscula', ok: false },
    { key: 'digit', label: 'Debe contener un número', ok: false },
    { key: 'special', label: 'Debe contener un carácter especial', ok: false }
  ]);

  // Regex for password validation (backend requirement)
  const PASSWORD_REGEX = /(?=^.{10,}$)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).*/;

  // Update checklist when password changes
  useEffect(() => {
    const pw = formData.password;
    setChecklist([
      { key: 'length', label: 'Mínimo 10 caracteres', ok: pw.length >= 10 },
      { key: 'upper', label: 'Debe contener una mayúscula', ok: /[A-Z]/.test(pw) },
      { key: 'lower', label: 'Debe contener una minúscula', ok: /[a-z]/.test(pw) },
      { key: 'digit', label: 'Debe contener un número', ok: /\d/.test(pw) },
      { key: 'special', label: 'Debe contener un carácter especial', ok: /\W/.test(pw) }
    ]);
  }, [formData.password]);

  // Clear duplicate errors when user edits
  useEffect(() => {
    setEmailDuplicate(false);
  }, [formData.email]);

  useEffect(() => {
    setUsernameDuplicate(false);
  }, [formData.username]);

  // Strength percentage
  const strengthPercent = useMemo(() => {
    const okCount = checklist.filter(i => i.ok).length;
    return Math.round((okCount / checklist.length) * 100);
  }, [checklist]);

  // All checklist items passed
  const allChecklistOk = useMemo(() => checklist.every(i => i.ok), [checklist]);

  // Validation helpers
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getFieldError = (field: string): string | null => {
    if (!touched[field]) return null;

    switch (field) {
      case 'username':
        if (!formData.username) return 'Requerido';
        if (formData.username.length < 3) return 'Mín. 3 chars';
        if (formData.username.length > 20) return 'Máx. 20 chars';
        if (usernameDuplicate) return 'En uso';
        break;
      case 'email':
        if (!formData.email) return 'Requerido';
        if (!isValidEmail(formData.email)) return 'Email inválido';
        if (emailDuplicate) return 'Ya existe';
        break;
      case 'password':
        if (!formData.password) return 'Requerido';
        if (formData.password.length < 10) return 'Mín. 10 chars';
        break;
      case 'confirmPassword':
        if (!formData.confirmPassword) return 'Requerido';
        if (formData.password !== formData.confirmPassword) return 'No coinciden';
        break;
    }
    return null;
  };

  const hasFieldError = (field: string): boolean => {
    return getFieldError(field) !== null;
  };

  // Form validity
  const isFormValid = useMemo(() => {
    return (
      formData.username.length >= 3 &&
      formData.username.length <= 20 &&
      isValidEmail(formData.email) &&
      PASSWORD_REGEX.test(formData.password) &&
      formData.password === formData.confirmPassword &&
      formData.acceptTerms &&
      !emailDuplicate &&
      !usernameDuplicate
    );
  }, [formData, emailDuplicate, usernameDuplicate]);

  const canSubmit = isFormValid && allChecklistOk && !isLoading;

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    clearError();
    setServerError(null);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Check availability on blur (endpoint may not exist, fail silently)
  const checkEmailAvailability = async () => {
    if (!formData.email || !isValidEmail(formData.email)) return;
    try {
      const res = await authService.checkAvailability({ email: formData.email });
      if (res && res.existsEmail) {
        setEmailDuplicate(true);
      }
    } catch {
      // Endpoint may not exist in backend — skip silently
      // Duplicates will be caught on submit (409)
    }
  };

  const checkUsernameAvailability = async () => {
    if (!formData.username || formData.username.length < 3) return;
    try {
      const res = await authService.checkAvailability({ username: formData.username });
      if (res && res.existsUsername) {
        setUsernameDuplicate(true);
      }
    } catch {
      // Endpoint may not exist in backend — skip silently
      // Duplicates will be caught on submit (409)
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    // Mark all fields as touched
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
      acceptTerms: true
    });

    // Check password policy
    if (!allChecklistOk || !PASSWORD_REGEX.test(formData.password)) {
      setServerError('La contraseña no cumple los requisitos de seguridad.');
      return;
    }

    if (!isFormValid) return;

    setIsPageLoading(true);
    setServerError(null);

    try {
      // Only send username, email, password (NOT confirmPassword/confirmEmail)
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      // Save email for verify page
      sessionStorage.setItem('pendingEmail', formData.email);

      // Navigate to verify page after success
      setTimeout(() => {
        navigate(`/auth/verify?email=${encodeURIComponent(formData.email)}&from=register`);
      }, 2000);

    } catch (err: any) {
      setIsPageLoading(false);

      let message = 'Error al registrar';

      if (err.status === 0 || err.message === 'Failed to fetch') {
        message = '🔌 No se pudo conectar con el servidor. ¿Está encendido?';
      } else if (err.status === 400) {
        message = err.error || err.message || '❌ Datos inválidos. Revisa los campos.';
      } else if (err.status === 409) {
        message = '⚠️ Email o usuario ya existe';
        // Intentar detectar cuál es el duplicado
        const errMsg = (err.error || err.message || '').toLowerCase();
        if (errMsg.includes('email')) {
          setEmailDuplicate(true);
        } else if (errMsg.includes('username') || errMsg.includes('usuario')) {
          setUsernameDuplicate(true);
        } else {
          setEmailDuplicate(true);
          setUsernameDuplicate(true);
        }
        // Navigate to verify page
        setTimeout(() => {
          navigate(`/auth/verify?email=${encodeURIComponent(formData.email)}&from=duplicate`);
        }, 1500);
      } else if (err.status === 429) {
        message = '⏳ Demasiados intentos. Espera unos minutos.';
      } else if (err.status >= 500) {
        message = '💥 Error del servidor. Intenta más tarde.';
      } else if (err.error || err.message) {
        message = err.error || err.message;
      }

      setServerError(message);
    }
  };

  return (
    <div className="register-page">
      {/* Background Image Overlay */}
      <div className="bg-image-overlay">
        <img src="/assets/icons/portada_pc.webp" alt="Valnor Background" />
        <div className="bg-gradient-overlay"></div>
      </div>

      {/* Heroic Ambient Glow */}
      <div className="form-ambient-glow" />

      {/* Back Button (Simplified Circular) */}
      <div className="back-button-container">
        <Link to="/landing" className="back-button" title="Volver al inicio">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
      </div>

      {/* Content Container */}
      <div className="content-container">
        <div className="form-wrapper">
          <form onSubmit={handleSubmit} className="register-form">
            {/* Server error banner */}
            {(serverError || error) && (
              <div className="error-banner">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{serverError || error}</span>
              </div>
            )}

            {/* Title */}
            <div className="form-title">
              <h2>REGISTRO</h2>
            </div>

            {/* Username */}
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Usuario
              </label>
              <div className="input-wrapper">
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={() => {
                    handleBlur('username');
                    checkUsernameAvailability();
                  }}
                  className={`form-input ${hasFieldError('username') ? 'input-error' : ''}`}
                  placeholder="tu_usuario"
                />
                {hasFieldError('username') && (
                  <div className="error-badge">{getFieldError('username')}</div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                Email
              </label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => {
                    handleBlur('email');
                    checkEmailAvailability();
                  }}
                  autoComplete="email"
                  className={`form-input ${hasFieldError('email') ? 'input-error' : ''}`}
                  placeholder="tu@email.com"
                />
                {hasFieldError('email') && (
                  <div className="error-badge">{getFieldError('email')}</div>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Contraseña
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={hidePassword ? 'password' : 'text'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  autoComplete="new-password"
                  className={`form-input ${hasFieldError('password') ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setHidePassword(!hidePassword)}
                  className="toggle-password"
                >
                  {hidePassword ? (
                    <svg className="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Strength Container */}
            <div className="strength-container">
              <div className="strength-bar-wrapper">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{ width: `${strengthPercent}%` }}
                  ></div>
                </div>
                <div className="strength-text">Cumplimiento: {strengthPercent}%</div>
              </div>

              <details
                className="requirements-details"
                open={showRequirements}
                onToggle={(e) => setShowRequirements((e.target as HTMLDetailsElement).open)}
              >
                <summary className="requirements-summary">Ver Requisitos</summary>
                <ul className="requirements-list">
                  {checklist.map((item) => (
                    <li key={item.key} className="requirement-item">
                      {item.ok ? (
                        <svg className="check-icon ok" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="check-icon pending" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                        </svg>
                      )}
                      <span className={item.ok ? 'text-ok' : 'text-pending'}>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Confirmar
              </label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  type={hideConfirmPassword ? 'password' : 'text'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  autoComplete="new-password"
                  className={`form-input ${hasFieldError('confirmPassword') ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setHideConfirmPassword(!hideConfirmPassword)}
                  className="toggle-password"
                >
                  {hideConfirmPassword ? (
                    <svg className="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Accept Terms */}
            <div className="terms-container">
              <label className="terms-label">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="terms-checkbox"
                />
                Acepto los términos y la política de privacidad
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="submit-button"
            >
              {!isLoading ? (
                <span>UNIRSE A VALNOR</span>
              ) : (
                <span>Invocando Cuenta...</span>
              )}
            </button>

            {/* Link to Login */}
            <div className="login-link-container">
              <span>¿Ya eres un guerrero? </span>
              <Link to="/auth/login" className="login-link">
                Inicia sesión aquí
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Loading Overlay */}
      {isPageLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <img src="/assets/icons/Logo_2.webp" alt="Valnor" width="80" />
            <h3>Preparando tu aventura...</h3>
            <div className="loading-spinner" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
