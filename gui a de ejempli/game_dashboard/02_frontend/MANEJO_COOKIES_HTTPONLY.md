# 🍪 Manejo de Cookies HttpOnly - Backend a Frontend

**Fecha**: 3 de diciembre de 2025  
**Para**: Desarrollador Frontend  
**Backend**: https://valgame-backend.onrender.com

---

## 📋 ¿Qué son las Cookies HttpOnly?

Las **cookies httpOnly** son cookies que:

- ✅ **Solo el servidor puede leer/escribir** (el navegador las envía automáticamente)
- ✅ **JavaScript NO puede acceder a ellas** (protección contra XSS)
- ✅ **Se envían automáticamente** en cada petición al mismo dominio
- ✅ **Más seguras** que localStorage para tokens sensibles

---

## 🔄 Flujo Completo de Cookies

```
┌──────────────────────────────────────────────────────────┐
│  PASO 1: LOGIN (Backend setea cookie)                   │
├──────────────────────────────────────────────────────────┤
│  Frontend → POST /auth/login                             │
│             Body: { email, password }                    │
│             Headers: { withCredentials: true }           │
│                                                          │
│  Backend → Valida credenciales                           │
│         → Genera JWT token                               │
│         → Setea cookie httpOnly en la respuesta:         │
│                                                          │
│           Set-Cookie: token=eyJhbGc...;                  │
│                       HttpOnly;                          │
│                       Secure;                            │
│                       SameSite=Strict;                   │
│                       Max-Age=604800                     │
│                                                          │
│  Navegador → Guarda cookie automáticamente               │
│           → Frontend NO ve la cookie en JS               │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  PASO 2: PETICIONES AUTENTICADAS                         │
├──────────────────────────────────────────────────────────┤
│  Frontend → GET /api/users/profile                       │
│             Headers: {                                   │
│               withCredentials: true  ← CRÍTICO           │
│             }                                            │
│                                                          │
│  Navegador → Automáticamente adjunta cookie:             │
│              Cookie: token=eyJhbGc...                    │
│                                                          │
│  Backend → Lee cookie del header                         │
│         → Decodifica JWT                                 │
│         → Valida token                                   │
│         → Devuelve datos del usuario                     │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│  PASO 3: LOGOUT (Backend elimina cookie)                 │
├──────────────────────────────────────────────────────────┤
│  Frontend → POST /auth/logout                            │
│             Headers: { withCredentials: true }           │
│                                                          │
│  Backend → Elimina cookie:                               │
│           Set-Cookie: token=; Max-Age=0                  │
│                                                          │
│  Navegador → Elimina cookie automáticamente              │
└──────────────────────────────────────────────────────────┘
```

---

## 🎨 Implementación en el Frontend (React)

### 1. Hook de Autenticación (useAuth.ts)

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  username: string;
  isVerified: boolean;
  val: number;
  boletos: number;
  evo: number;
  personajes: any[];
  // ... otros campos
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = import.meta.env.VITE_API_URL || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * RESTAURAR SESIÓN
   * Verifica si hay una sesión activa (cookie válida)
   */
  const restoreSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        credentials: 'include', // ⚠️ Envía la cookie automáticamente
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user || data);
        // Opcional: guardar datos básicos en localStorage (NO el token)
        localStorage.setItem('user', JSON.stringify(data.user || data));
        console.log('✅ Sesión restaurada desde cookie');
      } else {
        setUser(null);
        localStorage.removeItem('user');
        console.log('ℹ️ No hay sesión activa');
      }
    } catch {
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  // Intentar restaurar sesión al montar
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  /**
   * LOGIN
   * La cookie se setea automáticamente por el navegador
   */
  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ⚠️ CRÍTICO: Permite enviar/recibir cookies
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en login');
    }

    const data = await response.json();
    // ✅ Cookie ya fue seteada por el navegador automáticamente
    // Solo guardamos datos del usuario en memoria
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    console.log('✅ Login exitoso. Cookie httpOnly seteada automáticamente.');
  }, []);

  /**
   * LOGOUT
   * El backend elimina la cookie
   */
  const logout = useCallback(async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // ⚠️ Para enviar la cookie al backend
    });

    // Limpiar estado local
    setUser(null);
    localStorage.removeItem('user');
    console.log('✅ Logout exitoso. Cookie eliminada por el backend.');
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: user !== null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
```

---

### 2. Hook useApi (para todas las peticiones)

```typescript
// src/hooks/useApi.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

export function useApi() {
  const navigate = useNavigate();

  const fetchWithCredentials = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // ⚠️ Envía cookies automáticamente
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Si recibimos 401, la sesión expiró
    if (response.status === 401) {
      console.error('❌ Sesión expirada o no autenticado');
      localStorage.removeItem('user');
      navigate('/login');
      throw new Error('Sesión expirada');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }, [navigate]);

  const get = useCallback((endpoint: string) => 
    fetchWithCredentials(endpoint), [fetchWithCredentials]);

  const post = useCallback((endpoint: string, data: unknown) => 
    fetchWithCredentials(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }), [fetchWithCredentials]);

  const put = useCallback((endpoint: string, data: unknown) => 
    fetchWithCredentials(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }), [fetchWithCredentials]);

  const del = useCallback((endpoint: string) => 
    fetchWithCredentials(endpoint, { method: 'DELETE' }), [fetchWithCredentials]);

  return { get, post, put, del, fetchWithCredentials };
}
```

---

### 3. Componente RequireAuth (Protección de Rutas)

```tsx
// src/components/RequireAuth.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras verifica sesión
  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

---

### 4. Configuración del App (App.tsx y main.tsx)

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

```tsx
// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rutas protegidas */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
```

---

## 🔐 Configuración del Backend (Ya está implementada)

### Cookie Configuration

```typescript
res.cookie('token', token, {
  httpOnly: true,    // ⚠️ JavaScript no puede acceder
  secure: true,      // ⚠️ Solo HTTPS en producción
  sameSite: 'strict', // ⚠️ Protección CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 días
});
```

### CORS Configuration

```typescript
app.use(cors({
  origin: true,        // Permite todos los orígenes (cambiar en producción)
  credentials: true    // ⚠️ CRÍTICO: Permite cookies cross-origin
}));
```

---

## 🧪 Ejemplo Completo de Uso

### Componente de Login

```tsx
// src/pages/LoginPage.tsx
import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obtener URL de retorno si existe
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      console.log('✅ Login exitoso');
      // La cookie ya está seteada automáticamente
      navigate(from, { replace: true });
    } catch (err) {
      console.error('❌ Error en login:', err);
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading || !email || !password}>
        {loading ? 'Cargando...' : 'Login'}
      </button>
    </form>
  );
}
```

---

### Componente Protegido (Dashboard)

```tsx
// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { get } = useApi();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // La cookie se envía automáticamente con credentials: 'include'
    const loadProfile = async () => {
      try {
        const data = await get('/api/users/profile');
        setProfile(data.user || data);
      } catch (error) {
        console.error('Error al obtener perfil:', error);
        navigate('/login');
      }
    };
    loadProfile();
  }, [get, navigate]);

  const handleLogout = async () => {
    await logout();
    console.log('✅ Logout exitoso');
    navigate('/login');
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>VAL: {profile?.val ?? user?.val}</p>
      <button onClick={handleLogout}>Cerrar Sesión</button>
    </div>
  );
}
```

---

## 🔍 Debugging: Verificar Cookies

### En el Navegador (DevTools)

1. **Abrir DevTools**: F12
2. **Ir a "Application" o "Almacenamiento"**
3. **Cookies → https://valgame-backend.onrender.com**
4. **Buscar cookie "token"**

Deberías ver:

```
Name:     token
Value:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Domain:   valgame-backend.onrender.com
Path:     /
HttpOnly: ✓ (marcado)
Secure:   ✓ (marcado)
SameSite: Strict
Expires:  (7 días desde ahora)
```

### En Network Tab

1. **DevTools → Network**
2. **Hacer login**
3. **Click en la petición POST /auth/login**
4. **Ver "Response Headers"**:

```
Set-Cookie: token=eyJhbGc...; 
            Path=/; 
            HttpOnly; 
            Secure; 
            SameSite=Strict; 
            Max-Age=604800
```

5. **Ver petición siguiente (ej: GET /api/users/profile)**
6. **Ver "Request Headers"**:

```
Cookie: token=eyJhbGc...
```

---

## ⚠️ ERRORES COMUNES

### 1. Cookie NO se setea

**Síntoma**: No aparece en DevTools → Cookies

**Causas**:
- ❌ Falta `credentials: 'include'` en el frontend
- ❌ Falta `credentials: true` en CORS del backend
- ❌ `secure: true` pero estás en HTTP (no HTTPS)

**Solución**:
```typescript
// Frontend (React con fetch)
await fetch(url, { 
  method: 'POST',
  credentials: 'include',  // ⚠️ CRÍTICO
  body: JSON.stringify(body)
});

// Backend (ya configurado)
app.use(cors({ credentials: true }))
```

---

### 2. Cookie NO se envía en peticiones

**Síntoma**: Backend responde 401 "No token provided"

**Causas**:
- ❌ Falta `credentials: 'include'` en la petición
- ❌ Dominios diferentes (CORS issue)

**Solución**:
```typescript
// Agregar a TODAS las peticiones fetch
await fetch(url, { credentials: 'include' });

// O usar el hook useApi centralizado (ver arriba)
```

---

### 3. Cookie se borra al refrescar la página

**Síntoma**: Usuario logueado → F5 → se desloguea

**Causa**:
- ❌ No se está restaurando la sesión al iniciar la app

**Solución**:
```typescript
// En useAuth hook - el useEffect restaura sesión automáticamente
useEffect(() => {
  restoreSession();  // ⚠️ Se llama al montar AuthProvider
}, [restoreSession]);
```

---

### 4. "SameSite=Strict" bloquea la cookie

**Síntoma**: Cookie no funciona en iframe o cross-site

**Causa**:
- Backend usa `sameSite: 'strict'`

**Solución** (solo si necesitas cross-site):
```typescript
// Backend
res.cookie('token', token, {
  sameSite: 'none',  // Permite cross-site
  secure: true       // ⚠️ DEBE ser true con sameSite=none
});
```

---

## 📊 Comparación: Cookie vs localStorage

| Feature | HttpOnly Cookie | localStorage |
|---------|----------------|--------------|
| **Acceso desde JS** | ❌ No | ✅ Sí |
| **Protección XSS** | ✅ Sí | ❌ No |
| **Envío automático** | ✅ Sí | ❌ No (manual) |
| **Expiración automática** | ✅ Sí | ❌ No |
| **Cross-domain** | ⚠️ Complejo | ✅ Simple |
| **Tamaño máximo** | ~4KB | ~5-10MB |
| **Recomendado para tokens** | ✅ Sí | ⚠️ Solo si no hay alternativa |

---

## 🎯 Checklist de Implementación

### Backend (Ya listo ✅)
- [x] CORS con `credentials: true`
- [x] Cookie con `httpOnly: true`
- [x] Cookie con `secure: true` en producción
- [x] Cookie con `sameSite: 'strict'`
- [x] Endpoint de login setea cookie
- [x] Endpoint de logout borra cookie
- [x] Middleware de auth lee cookie

### Frontend (React - Implementar)
- [ ] `credentials: 'include'` en login
- [ ] `credentials: 'include'` en todas las peticiones fetch
- [ ] Hook `useApi` centralizado para peticiones
- [ ] Hook `useAuth` con Context + estado de usuario
- [ ] Método `restoreSession()` al montar AuthProvider
- [ ] Componente `RequireAuth` para rutas protegidas
- [ ] Manejo de 401 (sesión expirada) con redirección

---

## 🚀 Resumen Rápido

1. **Login**: Backend setea cookie → Navegador guarda automáticamente
2. **Peticiones**: Frontend usa `credentials: 'include'` → Navegador envía cookie automáticamente
3. **Logout**: Backend borra cookie → Navegador elimina automáticamente

**No necesitas**:
- ❌ Guardar token en localStorage
- ❌ Agregar manualmente headers `Authorization`
- ❌ Manejar expiración del token (lo hace el backend)

**Solo necesitas**:
- ✅ `credentials: 'include'` en TODAS las peticiones fetch
- ✅ CORS con `credentials: true` en el backend (ya está)

---

**Última Actualización**: 3 de diciembre de 2025  
**Backend**: https://valgame-backend.onrender.com  
**Cookie Name**: `token`  
**Cookie Duration**: 7 días
