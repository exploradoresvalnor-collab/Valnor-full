# 🎯 Flujo Completo de Registro y Verificación

**Fecha**: 3 de diciembre de 2025  
**Para**: Desarrollador Frontend  
**Backend**: https://valgame-backend.onrender.com

---

## 📋 Resumen Ejecutivo

Este documento explica **paso a paso** cómo implementar el registro de usuarios con verificación por email en el frontend.

**Tiempo de lectura**: 10 minutos  
**Dificultad**: Media

---

## 🔄 Flujo Visual Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    PASO 1: REGISTRO                         │
├─────────────────────────────────────────────────────────────┤
│  1. Usuario llena formulario (email, username, password)    │
│  2. Click en "Registrarse"                                  │
│  3. Frontend → POST /auth/register                          │
│  4. Backend → Crea usuario (estado: NO verificado)          │
│  5. Backend → Genera token único                            │
│  6. Backend → Envía email con link de verificación          │
│  7. Backend → Responde 201 "Revisa tu email"               │
│  8. Frontend → Muestra mensaje + redirige a /check-email   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   PASO 2: EMAIL                             │
├─────────────────────────────────────────────────────────────┤
│  1. Usuario recibe email de romerolivo1234@gmail.com        │
│  2. Asunto: "✨ Verifica tu cuenta de Valgame"              │
│  3. Email contiene botón "VERIFICAR CUENTA"                 │
│  4. Link: https://valgame-backend.onrender.com/auth/verify/TOKEN │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  PASO 3: VERIFICACIÓN                       │
├─────────────────────────────────────────────────────────────┤
│  1. Usuario hace click en "VERIFICAR CUENTA"                │
│  2. Abre navegador → GET /auth/verify/:token                │
│  3. Backend busca token en base de datos                    │
│  4. Backend verifica que no haya expirado (1 hora límite)   │
│  5. Backend marca usuario como VERIFICADO                   │
│  6. Backend muestra página HTML: "✅ Cuenta Verificada"     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PASO 4: LOGIN                            │
├─────────────────────────────────────────────────────────────┤
│  1. Usuario cierra la ventana de verificación               │
│  2. Usuario vuelve al frontend                              │
│  3. Usuario va a /login                                     │
│  4. Ingresa email y password                                │
│  5. Frontend → POST /auth/login                             │
│  6. Backend valida credenciales + verificación              │
│  7. Backend responde con JWT token                          │
│  8. Frontend guarda token y redirige a /dashboard           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 PASO 1: Formulario de Registro

### HTML (register.component.html)

```html
<div class="register-container">
  <h1>Crear Cuenta</h1>
  
  <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
    <!-- Email -->
    <div class="form-group">
      <label>Email</label>
      <input 
        type="email" 
        formControlName="email" 
        placeholder="tu@email.com"
        required
      />
      <span class="error" *ngIf="registerForm.get('email')?.errors?.['email']">
        Email inválido
      </span>
    </div>

    <!-- Username -->
    <div class="form-group">
      <label>Username</label>
      <input 
        type="text" 
        formControlName="username" 
        placeholder="jugador123"
        required
      />
      <span class="error" *ngIf="registerForm.get('username')?.errors?.['minlength']">
        Mínimo 3 caracteres
      </span>
    </div>

    <!-- Password -->
    <div class="form-group">
      <label>Contraseña</label>
      <input 
        type="password" 
        formControlName="password" 
        placeholder="••••••••"
        required
      />
      <span class="error" *ngIf="registerForm.get('password')?.errors?.['minlength']">
        Mínimo 6 caracteres
      </span>
    </div>

    <!-- Botón Submit -->
    <button 
      type="submit" 
      [disabled]="registerForm.invalid || isLoading"
    >
      {{ isLoading ? 'Registrando...' : 'Crear Cuenta' }}
    </button>
  </form>

  <!-- Link a Login -->
  <p class="footer-text">
    ¿Ya tienes cuenta? 
    <a routerLink="/login">Inicia sesión</a>
  </p>
</div>
```

---

### TypeScript (React - RegisterPage.tsx)

```tsx
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = 'https://valgame-backend.onrender.com';

export function RegisterPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.email || !formData.username || !formData.password) {
      setErrorMessage('Todos los campos son requeridos');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // ⚠️ IMPORTANTE: credentials: 'include' para cookies
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Manejar errores específicos
        if (response.status === 409) {
          throw new Error('Email o username ya existe');
        } else if (response.status === 400) {
          throw new Error(data.error || 'Datos inválidos');
        }
        throw new Error('Error al registrar. Intenta de nuevo.');
      }

      // ✅ Registro exitoso
      console.log('✅ Registro exitoso:', data);
      
      // Guardar email para mostrar en la página de verificación
      sessionStorage.setItem('pendingEmail', formData.email);
      
      // Redirigir a página "Revisa tu email"
      navigate('/check-email');
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h1>Crear Cuenta</h1>
      
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
          />
        </div>

        {/* Username */}
        <div className="form-group">
          <label>Username</label>
          <input 
            type="text" 
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="jugador123"
            minLength={3}
            required
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <label>Contraseña</label>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="mínimo 6 caracteres"
            minLength={6}
            required
          />
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}

        {/* Submit */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Registrando...' : 'Crear Cuenta'}
        </button>
      </form>

      <p className="footer-text">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}
```

---

## 📧 PASO 2: Página "Revisa tu Email" (React)

```tsx
// CheckEmailPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'https://valgame-backend.onrender.com';

export function CheckEmailPage() {
  const [email, setEmail] = useState('tu correo');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Obtener email del sessionStorage
    const pendingEmail = sessionStorage.getItem('pendingEmail');
    if (pendingEmail) setEmail(pendingEmail);
  }, []);

  useEffect(() => {
    // Countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const resendEmail = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        alert('✅ Email reenviado. Revisa tu bandeja.');
        setCountdown(60); // Iniciar countdown de 60 segundos
      } else {
        throw new Error('Error al reenviar');
      }
    } catch (error) {
      console.error('Error al reenviar email:', error);
      alert('Error al reenviar. Intenta de nuevo.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="check-email-container">
      <div className="icon">📧</div>
      
      <h1>Revisa tu correo</h1>
      
      <p className="main-text">
        Te enviamos un email a <strong>{email}</strong>
      </p>
      
      <p className="instructions">
        Haz click en el link que te enviamos para verificar tu cuenta.
      </p>
      
      <div className="warning">
        ⚠️ El link expira en <strong>1 hora</strong>
      </div>
      
      {/* Botón para reenviar email */}
      <button 
        onClick={resendEmail}
        disabled={isResending || countdown > 0}
        className="secondary-btn"
      >
        {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar email'}
      </button>
      
      {/* Link para volver al login */}
      <p className="footer-text">
        ¿Ya verificaste tu cuenta? 
        <Link to="/login">Ir al login</Link>
      </p>
    </div>
  );
}
```

---

## ✅ PASO 3: Verificación (Backend maneja esto)

**El usuario NO interactúa con el frontend aquí.**

### Lo que sucede:

1. Usuario hace click en el botón del email
2. Se abre: `https://valgame-backend.onrender.com/auth/verify/abc123token...`
3. Backend procesa la verificación
4. Backend muestra página HTML de confirmación:

```html
<!DOCTYPE html>
<html>
<head>
  <title>✅ Cuenta Verificada</title>
</head>
<body>
  <div style="text-align: center; padding: 50px;">
    <h1 style="color: #27ae60;">✅ ¡Cuenta Verificada!</h1>
    <p>Tu cuenta ha sido verificada exitosamente.</p>
    <p>Ya puedes cerrar esta ventana y hacer login.</p>
    <a href="http://localhost:4200/login" style="
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      margin-top: 20px;
    ">
      Ir al Login
    </a>
  </div>
</body>
</html>
```

---

## 🔐 PASO 4: Login

### HTML (login.component.html)

```html
<div class="login-container">
  <h1>Iniciar Sesión</h1>
  
  <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
    <!-- Email -->
    <div class="form-group">
      <label>Email</label>
      <input 
        type="email" 
        formControlName="email" 
        placeholder="tu@email.com"
        required
      />
    </div>

    <!-- Password -->
    <div class="form-group">
      <label>Contraseña</label>
      <input 
        type="password" 
        formControlName="password" 
        placeholder="••••••••"
        required
      />
    </div>

    <!-- Botón Submit -->
    <button 
      type="submit" 
      [disabled]="loginForm.invalid || isLoading"
    >
      {{ isLoading ? 'Entrando...' : 'Iniciar Sesión' }}
    </button>
  </form>

  <!-- Links -->
  <div class="footer-links">
    <a routerLink="/forgot-password">¿Olvidaste tu contraseña?</a>
    <br>
    <a routerLink="/register">¿No tienes cuenta? Regístrate</a>
  </div>
</div>
```

---

### TypeScript (React - LoginPage.tsx)

```tsx
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = 'https://valgame-backend.onrender.com';

export function LoginPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setErrorMessage('Todos los campos son requeridos');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // ⚠️ IMPORTANTE: credentials: 'include' para cookies
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Manejar errores específicos
        if (response.status === 403) {
          throw new Error('⚠️ Cuenta no verificada. Revisa tu email.');
        } else if (response.status === 401) {
          throw new Error('❌ Email o contraseña incorrectos');
        }
        throw new Error('❌ Error al iniciar sesión. Intenta de nuevo.');
      }

      // ✅ Login exitoso
      console.log('✅ Login exitoso:', data);
      
      // Guardar token y usuario en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirigir al dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Iniciar Sesión</h1>
      
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <label>Contraseña</label>
          <input 
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}

        {/* Botón Submit */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Iniciar Sesión'}
        </button>
      </form>

      {/* Links */}
      <div className="footer-links">
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        <br />
        <Link to="/register">¿No tienes cuenta? Regístrate</Link>
      </div>
    </div>
  );
}
```

---

## 📊 Respuestas del Backend

### POST /auth/register

#### ✅ Éxito (201)
```json
{
  "message": "Registro exitoso. Por favor, revisa tu correo para verificar tu cuenta."
}
```

#### ❌ Email/Username Duplicado (409)
```json
{
  "error": "Email o username ya existe"
}
```

#### ⚠️ Registro OK pero Email NO enviado (201)
```json
{
  "message": "Registro exitoso pero hubo un problema al enviar el correo...",
  "warning": "Email no enviado"
}
```

---

### GET /auth/verify/:token

#### ✅ Verificación Exitosa
**Responde con página HTML** (no JSON)

#### ❌ Token Inválido o Expirado
**Responde con página HTML de error**

---

### POST /auth/login

#### ✅ Login Exitoso (200)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "674abc123...",
    "email": "usuario@gmail.com",
    "username": "jugador123",
    "verified": true
  }
}
```

#### ❌ Cuenta No Verificada (403)
```json
{
  "error": "Por favor verifica tu cuenta antes de hacer login"
}
```

#### ❌ Credenciales Incorrectas (401)
```json
{
  "error": "Email o contraseña incorrectos"
}
```

---

## 🔄 POST /auth/resend-verification

Para reenviar el email de verificación.

### Request
```typescript
POST https://valgame-backend.onrender.com/auth/resend-verification
Body: {
  "email": "usuario@gmail.com"
}
```

### Response ✅ (200)
```json
{
  "message": "Correo de verificación reenviado"
}
```

### Response ❌ (400)
```json
{
  "error": "Usuario no encontrado o ya verificado"
}
```

---

## ⚠️ IMPORTANTE: withCredentials

**Todas las peticiones HTTP deben incluir `withCredentials: true`:**

```typescript
this.http.post(url, body, {
  withCredentials: true  // ⚠️ CRÍTICO para que funcionen las cookies
}).subscribe(...);
```

Sin esto, las cookies `httpOnly` del backend NO funcionarán.

---

## 🧪 Checklist de Prueba

- [ ] Formulario de registro valida campos
- [ ] POST /auth/register devuelve 201
- [ ] Mensaje "Revisa tu email" se muestra
- [ ] Email llega a la bandeja (o spam)
- [ ] Link del email funciona
- [ ] Página de verificación se muestra correctamente
- [ ] Login con cuenta verificada funciona
- [ ] Login con cuenta NO verificada muestra error 403
- [ ] Token se guarda en localStorage
- [ ] Redirige a /dashboard después del login
- [ ] Botón "Reenviar email" funciona
- [ ] Countdown de 60 segundos funciona

---

## 🚨 Errores Comunes

### 1. "Email o username ya existe"
**Causa**: Usuario ya registrado  
**Solución**: Usar otro email/username o hacer login

### 2. "Email no enviado"
**Causa**: Problema con SMTP de Gmail  
**Solución**: Contactar soporte o usar endpoint de reenvío

### 3. "Token inválido o expirado"
**Causa**: Link usado después de 1 hora  
**Solución**: Solicitar nuevo email con "Reenviar"

### 4. "Cuenta no verificada"
**Causa**: Usuario no hizo click en el email  
**Solución**: Revisar email y verificar cuenta

### 5. "CORS error"
**Causa**: Falta `withCredentials: true`  
**Solución**: Agregar a todas las peticiones HTTP

---

## 📱 Email Que Recibirá el Usuario

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            🎮 VALGAME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

¡Bienvenido a Valgame!

Tu cuenta ha sido creada exitosamente con el
email: usuario@gmail.com

Para activar tu cuenta, haz click en el botón:

┌───────────────────────────────┐
│     VERIFICAR MI CUENTA       │
└───────────────────────────────┘

O copia este link en tu navegador:
https://valgame-backend.onrender.com/auth/verify/abc123...

⚠️ Este link expira en 1 hora.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Si no solicitaste esta cuenta, ignora este email.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔑 PASO 5: Recuperación de Contraseña (Forgot Password)

### Flujo Visual Completo

```
┌─────────────────────────────────────────────────────────────┐
│              PASO 5A: Olvidé mi Contraseña                  │
│                  (Solicitar Recuperación)                   │
├─────────────────────────────────────────────────────────────┤
│  1. Usuario hace click en "¿Olvidaste tu contraseña?"      │
│     desde la pantalla de Login                              │
│  2. Frontend navega a /forgot-password                      │
│  3. Usuario ingresa SOLO su email                           │
│  4. Frontend → POST /auth/forgot-password { email }         │
│  5. Backend → Genera token (32 bytes hex)                   │
│  6. Backend → Guarda token + expiración (1 hora)            │
│  7. Backend → Envía email con link                          │
│  8. Backend → Responde "Revisa tu email"                    │
│  9. Frontend → Navega a /check-email-reset                  │
│ 10. Usuario ve mensaje de confirmación                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              PASO 5B: Email de Recuperación                 │
├─────────────────────────────────────────────────────────────┤
│  1. Usuario recibe email                                    │
│  2. Email contiene link:                                    │
│     http://localhost:4200/reset-password/:token             │
│  3. Link expira en 1 hora                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│          PASO 5C: Resetear Contraseña                       │
│             (Formulario de Nueva Contraseña)                │
├─────────────────────────────────────────────────────────────┤
│  1. Usuario hace click en el link del email                 │
│  2. Frontend carga /reset-password/:token                   │
│  3. Frontend extrae token de la URL                         │
│  4. Usuario ve formulario con 3 campos:                     │
│     - Email (opcional: readonly para verificación)          │
│     - Nueva Contraseña (mínimo 6 caracteres)                │
│     - Confirmar Contraseña (debe coincidir)                 │
│  5. Usuario llena el formulario                             │
│  6. Frontend valida que las contraseñas coincidan           │
│  7. Frontend → POST /auth/reset-password/:token             │
│     Body: { password: "nuevaContraseña" }                   │
│  8. Backend → Valida token no expirado                      │
│  9. Backend → Hashea nueva contraseña (bcrypt)              │
│ 10. Backend → Actualiza passwordHash en User                │
│ 11. Backend → Limpia resetPasswordToken                     │
│ 12. Backend → Responde "Contraseña actualizada"             │
│ 13. Frontend → Muestra alerta de éxito                      │
│ 14. Frontend → Redirige a /login                            │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Opciones de Implementación

### Opción A: Solo Contraseñas (Más Simple)
**Formulario pide:**
- Nueva Contraseña
- Confirmar Contraseña

**Ventajas:**
- Más simple para el usuario
- Menos campos

**Desventajas:**
- Usuario no ve para qué cuenta está cambiando la contraseña

---

### Opción B: Email + Contraseñas (Recomendado)
**Formulario pide:**
- Email (readonly - mostrado del token)
- Nueva Contraseña
- Confirmar Contraseña

**Ventajas:**
- Usuario confirma que está en la cuenta correcta
- Más seguro (doble verificación)
- Mejor UX

**Desventajas:**
- Campo extra (pero readonly)

---

## 📋 Formulario Recomendado (Opción B)

La documentación abajo muestra **Opción B** que incluye email para verificación visual

---

### HTML (forgot-password.component.html)

```html
<div class="forgot-password-container">
  <h1>¿Olvidaste tu contraseña?</h1>
  
  <p class="instructions">
    Ingresa tu email y te enviaremos un link para recuperar tu contraseña.
  </p>
  
  <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
    <!-- Email -->
    <div class="form-group">
      <label>Email</label>
      <input 
        type="email" 
        formControlName="email" 
        placeholder="tu@email.com"
        required
      />
      <span class="error" *ngIf="forgotForm.get('email')?.errors?.['email']">
        Email inválido
      </span>
    </div>

    <!-- Botón Submit -->
    <button 
      type="submit" 
      [disabled]="forgotForm.invalid || isLoading"
    >
      {{ isLoading ? 'Enviando...' : 'Enviar link de recuperación' }}
    </button>
  </form>

  <!-- Link para volver al login -->
  <p class="footer-text">
    <a routerLink="/login">← Volver al login</a>
  </p>
</div>
```

---

### TypeScript (React - ForgotPasswordPage.tsx)

```tsx
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = 'https://valgame-backend.onrender.com';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      // ✅ Solicitud procesada (incluso si el email no existe, por seguridad)
      console.log('✅ Email de recuperación enviado');
      
      // Guardar email para mostrar en la siguiente pantalla
      sessionStorage.setItem('resetEmail', email);
      
      // Mostrar mensaje
      alert('✅ ' + data.message);
      
      // Redirigir a página de confirmación
      navigate('/check-email-reset');
      
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Error al procesar solicitud. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h1>¿Olvidaste tu contraseña?</h1>
      
      <p className="instructions">
        Ingresa tu email y te enviaremos un link para recuperar tu contraseña.
      </p>
      
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
        </div>

        {/* Botón Submit */}
        <button type="submit" disabled={!email || isLoading}>
          {isLoading ? 'Enviando...' : 'Enviar link de recuperación'}
        </button>
      </form>

      {/* Link para volver al login */}
      <p className="footer-text">
        <Link to="/login">← Volver al login</Link>
      </p>
    </div>
  );
}
```

---

### HTML (reset-password.component.html)

```html
<div class="reset-password-container">
  <h1>Crear Nueva Contraseña</h1>
  
  <p class="instructions">
    Ingresa tu nueva contraseña para <strong>{{ userEmail }}</strong>
  </p>
  
  <form [formGroup]="resetForm" (ngSubmit)="onSubmit()">
    <!-- Email (Solo para verificación visual) -->
    <div class="form-group">
      <label>Email de la Cuenta</label>
      <input 
        type="email" 
        formControlName="email" 
        readonly
        class="readonly-field"
      />
      <small class="help-text">
        ℹ️ Verificación: Estás cambiando la contraseña de esta cuenta
      </small>
    </div>

    <!-- Nueva Contraseña -->
    <div class="form-group">
      <label>Nueva Contraseña *</label>
      <input 
        type="password" 
        formControlName="password" 
        placeholder="••••••••"
        required
      />
      <span class="error" *ngIf="resetForm.get('password')?.touched && resetForm.get('password')?.errors?.['required']">
        Campo obligatorio
      </span>
      <span class="error" *ngIf="resetForm.get('password')?.errors?.['minlength']">
        Mínimo 6 caracteres
      </span>
    </div>

    <!-- Confirmar Contraseña -->
    <div class="form-group">
      <label>Confirmar Contraseña *</label>
      <input 
        type="password" 
        formControlName="confirmPassword" 
        placeholder="••••••••"
        required
      />
      <span class="error" *ngIf="resetForm.get('confirmPassword')?.touched && resetForm.get('confirmPassword')?.errors?.['required']">
        Campo obligatorio
      </span>
      <span class="error" *ngIf="resetForm.get('confirmPassword')?.touched && resetForm.errors?.['mismatch']">
        Las contraseñas no coinciden
      </span>
    </div>

    <!-- Botón Submit -->
    <button 
      type="submit" 
      [disabled]="resetForm.invalid || isLoading"
      class="btn-primary"
    >
      {{ isLoading ? 'Actualizando...' : 'Actualizar Contraseña' }}
    </button>
  </form>

  <!-- Footer -->
  <p class="footer-text">
    <a routerLink="/login">← Volver al login</a>
  </p>
</div>

<!-- CSS Adicional -->
<style>
  .readonly-field {
    background-color: #f5f5f5;
    cursor: not-allowed;
    color: #666;
  }
  
  .help-text {
    display: block;
    margin-top: 4px;
    color: #666;
    font-size: 12px;
  }
</style>
```

---

### TypeScript (React - ResetPasswordPage.tsx)

```tsx
import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_URL = 'https://valgame-backend.onrender.com';

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Validar token al cargar
  useEffect(() => {
    if (!token) {
      alert('❌ Token inválido');
      navigate('/login');
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(
          `${API_URL}/auth/reset-password/validate/${token}`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          throw new Error('Token inválido');
        }

        const data = await response.json();
        console.log('✅ Token válido');
        console.log(`Expira en: ${data.expiresIn} segundos`);
        
        setUserEmail(data.email);
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ Token inválido:', error);
        alert('❌ Link inválido o expirado. Solicita uno nuevo.');
        navigate('/forgot-password');
      }
    };

    validateToken();
  }, [token, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/reset-password/${token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ password })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Token inválido o expirado. Solicita un nuevo link.');
        } else if (response.status === 422) {
          throw new Error('Contraseña inválida. Debe tener al menos 6 caracteres.');
        }
        throw new Error('Error al actualizar contraseña.');
      }

      // ✅ Contraseña actualizada
      console.log('✅ Contraseña actualizada');
      alert(`✅ ${data.message}\n\nYa puedes iniciar sesión con tu nueva contraseña.`);
      navigate('/login');
      
    } catch (error) {
      console.error('❌ Error:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !userEmail) {
    return <div className="loading">Validando token...</div>;
  }

  return (
    <div className="reset-password-container">
      <h1>Crear Nueva Contraseña</h1>
      
      <p className="instructions">
        Ingresa tu nueva contraseña para <strong>{userEmail}</strong>
      </p>
      
      <form onSubmit={handleSubmit}>
        {/* Email (Solo para verificación visual) */}
        <div className="form-group">
          <label>Email de la Cuenta</label>
          <input 
            type="email"
            value={userEmail}
            readOnly
            className="readonly-field"
          />
          <small className="help-text">
            ℹ️ Verificación: Estás cambiando la contraseña de esta cuenta
          </small>
        </div>

        {/* Nueva Contraseña */}
        <div className="form-group">
          <label>Nueva Contraseña *</label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
          />
        </div>

        {/* Confirmar Contraseña */}
        <div className="form-group">
          <label>Confirmar Contraseña *</label>
          <input 
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {/* Error */}
        {error && <div className="error-message">{error}</div>}

        {/* Botón Submit */}
        <button 
          type="submit" 
          disabled={isLoading || !password || !confirmPassword}
          className="btn-primary"
        >
          {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
        </button>
      </form>

      {/* Footer */}
      <p className="footer-text">
        <Link to="/login">← Volver al login</Link>
      </p>
    </div>
  );
}
```

---

### CSS Adicional para ResetPassword

```css
.readonly-field {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: #666;
}

.help-text {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 12px;
}
```

---

## 🔧 Endpoint Adicional en Backend (Validación de Token)

Para obtener el email antes de mostrar el formulario, el backend ya tiene este endpoint implementado:

**Archivo**: `src/routes/auth.routes.ts`

### GET /auth/reset-password/validate/:token

**Request:**
```http
GET /auth/reset-password/validate/abc123...
```

**Respuesta Exitosa (200):**
```json
{
  "ok": true,
  "email": "usuario@example.com",
  "expiresIn": 2847  // Segundos restantes de validez
}
```

**Respuesta de Error (400):**
```json
{
  "ok": false,
  "error": "Token de recuperación inválido o expirado",
  "code": "INVALID_TOKEN"
}
```

**Uso en Frontend:**
Este endpoint se llama automáticamente cuando el usuario abre el link del email, ANTES de mostrar el formulario. Permite:
- ✅ Validar que el token es válido
- ✅ Obtener el email del usuario para mostrarlo (readonly)
- ✅ Mostrar cuánto tiempo queda antes de expirar (opcional: countdown)

---

**Código del Backend:**

```typescript
router.get('/reset-password/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar usuario con el token válido y no expirado
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        error: 'Token de recuperación inválido o expirado',
        code: 'INVALID_TOKEN'
      });
    }

    // Calcular segundos restantes
    const expiresIn = Math.floor(
      (user.resetPasswordTokenExpires.getTime() - Date.now()) / 1000
    );

    // ✅ Token válido
    res.json({
      ok: true,
      email: user.email,
      expiresIn
    });

  } catch (error) {
    console.error('Error validando token:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al validar token'
    });
  }
});
```

---

### Página de Confirmación (check-email-reset.component.html)

```html
<div class="check-email-container">
  <div class="icon">📧</div>
  
  <h1>Revisa tu correo</h1>
  
  <p class="main-text">
    Si el email <strong>{{ email }}</strong> está registrado,
    recibirás un link para recuperar tu contraseña.
  </p>
  
  <p class="instructions">
    Haz click en el link que te enviamos para crear una nueva contraseña.
  </p>
  
  <div class="warning">
    ⚠️ El link expira en <strong>1 hora</strong>
  </div>
  
  <!-- Link para volver al login -->
  <p class="footer-text">
    <a routerLink="/login">← Volver al login</a>
  </p>
</div>
```

---

### TypeScript (React - CheckEmailResetPage.tsx)

```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function CheckEmailResetPage() {
  const [email, setEmail] = useState('tu correo');

  useEffect(() => {
    // Obtener email del sessionStorage
    const resetEmail = sessionStorage.getItem('resetEmail');
    if (resetEmail) setEmail(resetEmail);
  }, []);

  return (
    <div className="check-email-reset-container">
      <div className="icon">📧</div>
      
      <h1>Revisa tu correo</h1>
      
      <p className="main-text">
        Te enviamos un link de recuperación a <strong>{email}</strong>
      </p>
      
      <p className="instructions">
        Haz click en el link que te enviamos para crear una nueva contraseña.
      </p>
      
      <div className="warning">
        ⚠️ El link expira en <strong>1 hora</strong>
      </div>
      
      <p className="footer-text">
        <Link to="/login">← Volver al login</Link>
      </p>
    </div>
  );
}
```

---

### Rutas en React Router (App.tsx)

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CheckEmailPage } from './pages/CheckEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { CheckEmailResetPage } from './pages/CheckEmailResetPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/check-email" element={<CheckEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/check-email-reset" element={<CheckEmailResetPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 📧 Email de Recuperación

El usuario recibe un email así:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            🎮 VALGAME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recuperación de Contraseña

Recibimos una solicitud para recuperar tu contraseña.

Haz click en el botón para crear una nueva contraseña:

┌───────────────────────────────┐
│   RECUPERAR CONTRASEÑA        │
└───────────────────────────────┘

O copia este link en tu navegador:
http://localhost:4200/reset-password/abc123...

⚠️ Este link expira en 1 hora.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Si no solicitaste este cambio, ignora este email.
Tu contraseña permanecerá sin cambios.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📊 Respuestas del Backend - Recuperación

### POST /auth/forgot-password

#### ✅ Solicitud Procesada (200)
```json
{
  "message": "Si el correo existe, se enviará un email con instrucciones para recuperar tu contraseña."
}
```

**Nota**: Por seguridad, siempre responde lo mismo, exista o no el email.

---

### POST /auth/reset-password/:token

#### ✅ Contraseña Actualizada (200)
```json
{
  "message": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión."
}
```

#### ❌ Token Inválido o Expirado (400)
```json
{
  "error": "Token de recuperación inválido o expirado"
}
```

---

## 📊 Flujo de Datos Paso a Paso

### Paso 1: Usuario olvida su contraseña

**Formulario muestra:**
```
┌──────────────────────────────┐
│ ¿Olvidaste tu contraseña?    │
├──────────────────────────────┤
│                              │
│ Email: [ tu@email.com    ]   │
│                              │
│    [Enviar Link]             │
└──────────────────────────────┘
```

**Datos enviados al backend:**
```json
POST /auth/forgot-password
{
  "email": "usuario@example.com"
}
```

**Backend guarda en MongoDB:**
```javascript
User.updateOne(
  { email: "usuario@example.com" },
  {
    resetPasswordToken: "abc123...",
    resetPasswordTokenExpires: Date.now() + 3600000 // 1 hora
  }
)
```

---

### Paso 2: Usuario recibe email

**Email contiene:**
```
Haz click aquí para recuperar tu contraseña:
http://localhost:4200/reset-password/abc123...

Este link expira en 1 hora.
```

---

### Paso 3: Usuario hace click en el link

**URL abierta:**
```
http://localhost:4200/reset-password/abc123...
                                     └─ Este es el token
```

**Frontend extrae token:**
```typescript
this.token = this.route.snapshot.params['token']; // "abc123..."
```

---

### Paso 4: Frontend valida token y obtiene email

**Request al backend:**
```json
GET /auth/reset-password/validate/abc123...
```

**Backend busca en MongoDB:**
```javascript
User.findOne({
  resetPasswordToken: "abc123...",
  resetPasswordTokenExpires: { $gt: Date.now() } // No expirado
})
```

**Backend responde:**
```json
{
  "valid": true,
  "email": "usuario@example.com"
}
```

**Frontend muestra formulario:**
```
┌──────────────────────────────────┐
│ Crear Nueva Contraseña           │
├──────────────────────────────────┤
│                                  │
│ Cuenta: usuario@example.com      │
│         (readonly - no editable) │
│                                  │
│ Nueva Contraseña:                │
│ [ ••••••••          ]            │
│                                  │
│ Confirmar Contraseña:            │
│ [ ••••••••          ]            │
│                                  │
│    [Actualizar Contraseña]       │
└──────────────────────────────────┘
```

---

### Paso 5: Usuario envía nueva contraseña

**Datos del formulario:**
```typescript
{
  email: "usuario@example.com",      // Solo visual (readonly)
  password: "nuevaPassword123",       // Lo que ingresó
  confirmPassword: "nuevaPassword123" // Confirmación
}
```

**Frontend valida:**
```typescript
✅ password.length >= 6
✅ password === confirmPassword
```

**Datos enviados al backend:**
```json
POST /auth/reset-password/abc123...
{
  "password": "nuevaPassword123"
}

⚠️ NOTA: Solo se envía la nueva contraseña
         El email NO se envía porque el token
         ya identifica al usuario
```

---

### Paso 6: Backend actualiza la contraseña

**Backend busca usuario por token:**
```javascript
const user = await User.findOne({
  resetPasswordToken: "abc123...",
  resetPasswordTokenExpires: { $gt: Date.now() }
});
```

**Backend hashea la nueva contraseña:**
```javascript
const hashedPassword = await bcrypt.hash("nuevaPassword123", 10);
// Resultado: "$2b$10$xYz..."
```

**Backend actualiza en MongoDB:**
```javascript
user.passwordHash = "$2b$10$xYz...";
user.resetPasswordToken = undefined;      // Limpia token
user.resetPasswordTokenExpires = undefined; // Limpia expiración
await user.save();
```

**Backend responde:**
```json
{
  "message": "Contraseña actualizada exitosamente. Ya puedes iniciar sesión."
}
```

---

### Paso 7: Usuario puede hacer login

**Ahora el usuario puede:**
```
Login con:
- Email: usuario@example.com
- Password: nuevaPassword123 (la nueva)
```

---

## 🔑 Resumen de Datos en Cada Paso

| Paso | Formulario Muestra | Datos Enviados | Backend Guarda |
|------|-------------------|----------------|----------------|
| **1. Forgot Password** | Email | `{ email }` | `resetPasswordToken` + expiration |
| **2. Email** | - | - | - |
| **3. Click Link** | - | - | - |
| **4. Validar Token** | Email (readonly) | Token en URL | - |
| **5. Reset Password** | Email + Password + Confirm | `{ password }` | `passwordHash` (bcrypt) |
| **6. Login** | Email + Password | `{ email, password }` | JWT token en cookie |

---

## ❓ Preguntas Frecuentes

### ¿Por qué pedir el email dos veces?

**Respuesta**: El email se pide UNA sola vez (en forgot-password).

En el formulario de reset, el email se **muestra** (readonly) para que el usuario confirme visualmente que está cambiando la contraseña de la cuenta correcta, pero **NO se envía** al backend porque el token ya identifica al usuario.

### ¿Qué pasa si el usuario cambia el email en DevTools?

**Respuesta**: No importa porque el campo es **readonly** y el backend **NO usa el email del formulario**. Solo usa el token de la URL para identificar al usuario.

### ¿Por qué pedir confirmar contraseña?

**Respuesta**: Para evitar errores de tipeo. Si el usuario escribe mal la contraseña y no hay confirmación, quedará bloqueado de su cuenta.

### ¿El backend valida que las contraseñas coincidan?

**Respuesta**: No, esa validación se hace en el **frontend**. El backend solo recibe una contraseña ya validada.

### ¿Qué pasa si el token expira?

**Respuesta**: 
- Si expira ANTES de abrir el link → Error 400 al validar token
- Si expira DESPUÉS de abrir pero ANTES de enviar → Error 400 al actualizar
- Solución: Usuario debe solicitar un nuevo link desde /forgot-password

---

## 🧪 Checklist de Prueba - Recuperación

- [ ] Formulario de "Olvidé mi contraseña" valida email
- [ ] POST /auth/forgot-password responde siempre igual (seguridad)
- [ ] Email de recuperación llega a la bandeja
- [ ] Link del email es correcto (frontend URL)
- [ ] Link expira después de 1 hora
- [ ] Formulario de reset valida contraseñas (mínimo 6 caracteres)
- [ ] Validación de "confirmar contraseña" funciona
- [ ] POST /auth/reset-password actualiza contraseña
- [ ] Usuario puede hacer login con nueva contraseña
- [ ] Token se limpia después del reset
- [ ] No se puede reutilizar el mismo link

---

## 🚨 Errores Comunes - Recuperación

### 1. "Link inválido o expirado"
**Causa**: Token usado después de 1 hora  
**Solución**: Solicitar nuevo link desde /forgot-password

### 2. "Las contraseñas no coinciden"
**Causa**: password !== confirmPassword  
**Solución**: Verificar validador personalizado

### 3. Email no llega
**Causa**: Email no registrado o problema SMTP  
**Solución**: Verificar que el email esté registrado

### 4. "FRONTEND_URL not defined"
**Causa**: Falta variable de entorno en backend  
**Solución**: Agregar `FRONTEND_URL=http://localhost:4200` en `.env`

---

## 🎯 Resumen Rápido

1. **Registro**: POST /auth/register → Email enviado
2. **Email**: Usuario recibe email con link
3. **Verificación**: GET /auth/verify/:token → Cuenta activada
4. **Login**: POST /auth/login → Token JWT recibido
5. **Olvidé Contraseña**: POST /auth/forgot-password → Email de recuperación
6. **Reset**: POST /auth/reset-password/:token → Nueva contraseña

**Tiempo total**: ~2 minutos desde registro hasta login  
**Recuperación**: ~1 minuto desde solicitud hasta nueva contraseña

---

**Última Actualización**: 3 de diciembre de 2025  
**Backend URL**: https://valgame-backend.onrender.com  
**Email SMTP**: romerolivo1234@gmail.com  
**Frontend URL**: http://localhost:4200
