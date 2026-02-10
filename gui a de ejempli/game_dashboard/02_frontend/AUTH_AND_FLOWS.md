# Autenticación y Flujos (Frontend React)

> **Actualizado:** 7 de febrero de 2026  
> **Framework:** React + TypeScript + Vite  
> **Servicio:** `src/services/auth.service.ts`  
> **Context:** `src/context/AuthContext.tsx`  
> **Hook:** `src/hooks/useAuth.ts`

## Resumen

| Concepto | Valor |
|----------|-------|
| Base URL | `http://localhost:8080` (dev) / `https://valgame-backend.onrender.com` (prod) |
| Config | `src/config/api.config.ts` → `VITE_API_URL \|\| 'http://localhost:8080'` |
| Auth mechanism | **httpOnly cookie** (`Set-Cookie: token=<jwt>; HttpOnly; Path=/`) |
| Prefijo auth | `/auth/*` (**SIN** `/api`) |
| Prefijo protegido | `/api/*` |
| Cookies en fetch | `credentials: 'include'` **OBLIGATORIO** en cada request |

### ⚠️ NO se usa `Authorization: Bearer <token>` como mecanismo principal
El JWT viaja como **httpOnly cookie** establecida por el backend. El frontend solo necesita `credentials: 'include'` en cada fetch. Como fallback, `api.service.ts` también lee `localStorage['valnor_token']` y lo envía como `Authorization` header, pero la cookie es el mecanismo principal.

---

## Flujo de Registro

```
Usuario → POST /auth/register → Backend crea cuenta → Envía email verificación
         ↓
     Respuesta: { success: true, message: "..." }
         ↓
Usuario abre email → GET /auth/verify/:token → Cuenta verificada
```

**Endpoint:** `POST /auth/register`
```ts
// src/services/auth.service.ts
const res = await fetch(`${API_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email, password, username })
});
// Respuesta: { success, message }
```

**Reenviar verificación:** `POST /auth/resend-verification`

---

## Flujo de Login

```
Usuario → POST /auth/login → Backend valida → Set-Cookie: token=<jwt>; HttpOnly
         ↓
     Respuesta body: { success: true, message, user: { id, username, email, ... } }
     Cookie header: Set-Cookie: token=eyJhbG...
         ↓
     AuthContext guarda user en estado React
         ↓
     Todas las requests futuras llevan la cookie automáticamente
```

**Endpoint:** `POST /auth/login`
```tsx
// src/services/auth.service.ts → login()
const res = await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // ⚠️ OBLIGATORIO — sin esto no se guarda la cookie
  body: JSON.stringify({ email, password })
});

const data = await res.json();
// data = { success: true, message: "Login exitoso", user: { ... } }
// ⚠️ El token NO viene en data — viene como httpOnly cookie automática
```

**Cómo se usa en React:**
```tsx
// src/context/AuthContext.tsx
const { user, login, logout, isAuthenticated } = useAuth();

// Login
await login(email, password);  // Internamente llama auth.service.login()

// Check auth status
if (isAuthenticated) { /* render protected UI */ }
```

---

## Flujo de Logout

```
Usuario → POST /auth/logout → Backend borra cookie → Redirect a /login
```

```tsx
// src/services/auth.service.ts → logout()
await fetch(`${API_URL}/auth/logout`, {
  method: 'POST',
  credentials: 'include'
});
// El backend elimina la cookie token
```

---

## Reset Password

| Paso | Endpoint | Descripción |
|------|----------|-------------|
| 1 | `POST /auth/forgot-password` | Body: `{ email }` → envía email con link |
| 2 | `GET /auth/reset-password/validate/:token` | Valida que el token no expiró |
| 3 | `POST /auth/reset-password/:token` | Body: `{ password }` → establece nueva contraseña |
| Alt | `GET /auth/reset-form/:token` | Formulario HTML renderizado por el backend |

---

## Requests Autenticadas

Toda request a rutas `/api/*` después del login:

```tsx
// src/services/api.service.ts — wrapper genérico
const res = await fetch(`${API_URL}/api/users/me`, {
  credentials: 'include',  // La cookie token viaja automáticamente
});
```

**El `api.service.ts` maneja automáticamente:**
- `credentials: 'include'` en todas las requests
- Headers `Content-Type: application/json`
- Lectura de `localStorage['valnor_token']` como backup → `Authorization: Bearer <token>`
- Parseo de respuestas JSON
- Manejo de errores HTTP

**Manejo de 401/403:**
- 401 → Token expirado o ausente → `AuthContext` redirige a `/login`
- 403 → Sin permisos → Mostrar error en UI

---

## Socket.IO (Realtime)

> **Servicio:** `src/services/socket.service.ts`

```ts
import { io } from 'socket.io-client';

// Conectar al backend directamente (NO a /api)
const socket = io('http://localhost:8080', {
  transports: ['websocket'],
  auth: { token: jwt },     // Token para auth en WebSocket
  reconnection: true,
  reconnectionAttempts: 5,
});

socket.on('connect', () => console.log('WS conectado'));
```

**Eventos principales:**
- `combat:update` — Actualizaciones de combate
- `notification:new` — Nueva notificación
- `chat:message` — Mensaje de chat

---

## Obtener Estado del Usuario (tras login)

```tsx
// Típicamente en AuthContext o en Dashboard.tsx
const user = await userService.getMe();           // GET /api/users/me
const resources = await userService.getResources(); // GET /api/users/resources
```

| Endpoint | Datos |
|----------|-------|
| `GET /api/users/me` | Perfil completo, personajes, nivel, etc. |
| `GET /api/users/resources` | val, boletos, energía, evo |
| `GET /api/users/dashboard` | Actividad reciente |

---

## Seguridad

| Aspecto | Detalle |
|---------|---------|
| CORS | Backend usa `FRONTEND_ORIGIN` en allowedOrigins |
| Cookie flags | `HttpOnly`, `SameSite=Lax`, `Secure` (en prod) |
| JWT expiry | Configurable en backend (default: 7d) |
| Rate limiting | Ver `ERRORS_AND_LIMITS.md` |
| HTTPS | Obligatorio en producción |

---

## Tienda / Paquetes: Apertura de paquete

Flujo: **Comprar en Tienda → Pago confirmado → UserPackage creado → Abrir paquete → Inventario actualizado**

### Abrir paquete pendiente (sin especificar ID)
```tsx
// src/services/shop.service.ts
const res = await fetch(`${API_URL}/api/user-packages/open`, {
  method: 'POST',
  credentials: 'include',  // Cookie auth
});
```

### Abrir paquete por ID
```tsx
const res = await fetch(`${API_URL}/api/user-packages/${packageId}/open`, {
  method: 'POST',
  credentials: 'include',
});
```

### Respuesta 200 (ejemplo):
```json
{
   "ok": true,
   "assigned": {
      "userPackageId": "upkg_123",
      "paqueteId": "pkg_basic_01",
      "openedAt": "2025-12-01T22:00:00.000Z"
   },
   "summary": {
      "charactersReceived": 1,
      "itemsReceived": 2,
      "consumablesReceived": 1,
      "valReceived": 0,
      "totalCharacters": 3,
      "totalItems": 14,
      "totalConsumables": 5,
      "valBalance": 1200
   },
   "inventory": {
      "equipamientoNuevos": ["itm_eq_001"],
      "consumiblesNuevos": [{ "consumableId": "cons_001", "usos_restantes": 3 }]
   }
}
```

### Notas importantes
- **Auth:** Cookie httpOnly (NO `Authorization` header manual)
- **Idempotencia:** El backend usa lock por paquete. Si hay contención → 409
- **Tras abrir:** Refrescar `userService.getMe()` y/o `inventoryService.getInventory()`
- **Errores:** 401 (no auth), 404 (sin paquetes), 409 (lock/ya abierto), 429 (rate limit)

### Conceptos: Tienda vs Paquetes del Usuario
- **Tienda:** catálogo para comprar → `GET /api/shop/packages`, `POST /api/shop/purchase`
- **Paquetes del usuario:** ya acreditados → `GET /api/user-packages/:userId`, `POST /api/user-packages/open`
- **Flujo:** Comprar en Tienda → pago confirmado → aparece UserPackage → Abrir → refrescar inventario
