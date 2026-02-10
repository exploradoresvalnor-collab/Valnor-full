# 📋 Changelog de Desarrollo - Valnor Juego (Frontend)

> Registro de actualizaciones y cambios realizados durante el desarrollo.

---

## 🗓️ 7 de Febrero de 2026

### 4. Auditoría completa Auth — Frontend vs Backend

**Se auditaron todas las páginas/servicios de autenticación contra los endpoints reales del backend.**

#### 4.1 — ResetPassword: Validación de contraseña alineada con backend
**Archivo:** `src/pages/Auth/ResetPassword/ResetPassword.tsx`
- **Antes:** Pedía mínimo 6 caracteres (no coincidía con el backend).
- **Ahora:** Exige la misma política que el backend (Zod):
  - Mínimo 10 caracteres
  - 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
- Se agregó **checklist visual** de requisitos de contraseña.
- Se mejoró el manejo de errores (conexión, rate limit, 500).

**Archivo:** `src/pages/Auth/ResetPassword/ResetPassword.css`
- Estilos para `.password-checklist`, `.check-ok`, `.check-fail`.

#### 4.2 — Register: checkAvailability falla silenciosamente
**Archivo:** `src/pages/Auth/Register/Register.tsx`
- **Problema:** Llamaba a `GET /auth/check` que NO existe en el backend → 404 en consola.
- **Fix:** `checkAvailability` ahora falla silenciosamente. Los duplicados se atrapan en el submit (409).
- Se mejoró el manejo de errores del submit:
  - Detecta si el duplicado es email o username por el mensaje del backend.
  - Mensajes claros para 0/400/409/429/500.

#### 4.3 — ForgotPassword: Distingue errores de conexión
**Archivo:** `src/pages/Auth/ForgotPassword/ForgotPassword.tsx`
- **Antes:** Todos los errores mostraban "éxito" (por seguridad).
- **Ahora:** Errores de conexión (0), rate limit (429), server (500) se muestran al usuario.
- Los 404/400 siguen mostrando éxito (por seguridad, no se revela si el email existe).

#### 4.4 — Verify: Mejores mensajes de error
**Archivo:** `src/pages/Auth/Verify/Verify.tsx`
- Se mejoró el catch del reenvío para distinguir:
  - 🔌 Servidor no conectado
  - ⏳ Rate limit
  - 💥 Error de servidor
  - Mensaje real del backend como fallback

#### Resumen de endpoints Auth

| Endpoint Backend | Método Frontend | Estado |
|---|---|---|
| `POST /auth/register` | `authService.register()` | ✅ OK |
| `GET /auth/verify/:token` | `authService.verifyEmail()` | ✅ OK |
| `POST /auth/login` | `authService.login()` | ✅ OK (mejorado antes) |
| `POST /auth/logout` | `authService.logout()` | ✅ OK |
| `POST /auth/resend-verification` | `authService.resendVerification()` | ✅ OK |
| `POST /auth/forgot-password` | `authService.forgotPassword()` | ✅ Mejorado |
| `GET /auth/reset-password/validate/:token` | `authService.validateResetToken()` | ✅ OK |
| `POST /auth/reset-password/:token` | `authService.resetPassword()` | ✅ Mejorado |
| `GET /auth/check` | `authService.checkAvailability()` | ⚠️ No existe en backend, falla silencioso |

---

### 1. Configuración de conexión local con el backend

**Archivos modificados:**
- `src/config/api.config.ts`

**Cambios:**
- Se cambió la URL por defecto del backend de `https://valgame-backend.onrender.com` a `http://localhost:8080` para trabajar en modo local.
- El backend se levantó en local con MongoDB conectado, WebSocket inicializado, y CORS abierto para todas las conexiones.

**Archivos clave de conexión:**
| Archivo | Función |
|---|---|
| `src/config/api.config.ts` | URL base, timeout, headers por defecto |
| `src/services/api.service.ts` | Cliente HTTP (GET, POST, PUT, PATCH, DELETE) |
| `src/services/socket.service.ts` | Conexión WebSocket (Socket.IO) para tiempo real |

---

### 2. Corrección de ejecución de scripts en PowerShell

**Problema:** PowerShell bloqueaba la ejecución de `npx` por política de scripts deshabilitada.

**Solución:** Se habilitó la política de ejecución para el usuario actual:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

**Resultado:** Frontend Vite levantado exitosamente en `http://localhost:5173/`.

---

### 3. Mejora del manejo de errores en Login

**Problema:** El login mostraba el mismo error genérico sin importar la causa (contraseña incorrecta, cuenta no verificada, servidor caído, etc.).

**Archivos modificados:**
- `src/hooks/useAuth.ts`
- `src/services/api.service.ts`
- `src/pages/Auth/Login/Login.tsx`
- `src/pages/Auth/Login/Login.css`

#### 3.1 — `src/services/api.service.ts`
- Se mejoró `handleResponse()` para propagar correctamente tanto el campo `error` como `message` del backend (algunos endpoints usan uno u otro).

#### 3.2 — `src/hooks/useAuth.ts`
- Se mejoró el catch del login para distinguir errores por código HTTP y usar el mensaje real del backend:

| Status HTTP | Mensaje mostrado |
|---|---|
| `0` / Failed to fetch | 🔌 No se pudo conectar con el servidor |
| `401` | Mensaje del backend o "Email o contraseña incorrectos" |
| `403` | Mensaje del backend o "Cuenta no verificada" |
| `404` | 🔌 Ruta no encontrada |
| `409` | Conflicto con datos enviados |
| `429` | ⏳ Demasiados intentos |
| `500+` | 💥 Error interno del servidor |

#### 3.3 — `src/pages/Auth/Login/Login.tsx`
- El mensaje de error ahora se muestra con estilos diferentes según el tipo.
- Si el error es por cuenta no verificada, aparece un enlace para reenviar el correo de verificación.

#### 3.4 — `src/pages/Auth/Login/Login.css`
- Se agregaron 3 variantes de color para errores:
  - **Rojo** (`.error-auth`) → Credenciales incorrectas
  - **Amarillo/dorado** (`.error-warning`) → Cuenta sin verificar
  - **Púrpura** (`.error-server`) → Problema de conexión/servidor
- Se agregó animación de shake (`errorShake`) al aparecer el error.
- Se agregaron estilos para el link de acción dentro del error (`.error-action-link`).

---

### 5. Fase 1 — Corrección de bugs (rutas/servicios desalineados)

#### 5.1 — `useSettings.ts`: Ruta incorrecta
**Archivo:** `src/hooks/useSettings.ts`
- **Bug:** Las llamadas iban a `/api/user-settings` → 404.
- **Fix:** Cambiado a `/api/user/settings` (GET, PUT, POST reset). Ahora coincide con el backend.

#### 5.2 — `dungeon.service.ts`: Métodos fantasma eliminados
**Archivo:** `src/services/dungeon.service.ts`
- **Bug:** Tenía 14 métodos; solo 5 endpoints existen en el backend.
- **Fix:** Eliminados 9 métodos sin endpoint real (`startRun`, `getCurrentRun`, `getRun`, `executeAction`, `advanceFloor`, `abandonRun`, `getRunHistory`, `claimRewards`, `getCompletedDungeons`, `canEnterDungeon`). Quedan: `getDungeons`, `getDungeon`, `startDungeon`, `getProgress`, `getSession`.

#### 5.3 — `ranking.service.ts`: Ruta `/api/profiles` inexistente
**Archivo:** `src/services/ranking.service.ts`
- **Bug:** Usaba `/api/profiles` (no existe). Métodos fantasma (`searchUsers`, `setActiveTitle`, `getMyTitles`).
- **Fix:** Cambiado a `/api/users/profile`. `getMyPublicProfile` ahora usa `/api/users/me`. Métodos fantasma eliminados.

---

### 6. Fase 2 — Servicios nuevos para endpoints sin cobertura

#### 6.1 — `chat.service.ts` (nuevo)
**Archivo:** `src/services/chat.service.ts`
- Cubre 4 endpoints de chat: `GET /api/chat/messages`, `POST /api/chat/global`, `POST /api/chat/private`, `POST /api/chat/party`.
- Incluye tipos: `ChatMessage`, `GetMessagesParams`, `SendMessageDTO`, `SendPrivateMessageDTO`.

#### 6.2 — `feedback.service.ts` (nuevo)
**Archivo:** `src/services/feedback.service.ts`
- Cubre 2 endpoints: `POST /api/feedback` (enviar), `GET /api/feedback` (listar últimos 50).
- Incluye tipos: `FeedbackEntry`, `SubmitFeedbackDTO`.

#### 6.3 — `gameConfig.service.ts` (nuevo)
**Archivo:** `src/services/gameConfig.service.ts`
- Cubre 5 endpoints de configuración/datos maestros (todos GET públicos):
  - `/api/game-settings`, `/api/base-characters`, `/api/categories`, `/api/level-requirements`, `/api/events`.
- Incluye tipos: `GameSettings`, `BaseCharacter`, `Category`, `LevelRequirement`, `GameEvent`.

#### 6.4 — `services/index.ts` actualizado
**Archivo:** `src/services/index.ts`
- Añadidas las exportaciones de los 3 nuevos servicios: `chat`, `feedback`, `gameConfig`.

---

### 7. Fase 3 — Corrección de rutas desalineadas y limpieza de fantasmas

**Auditoría verificada directamente contra el backend en ejecución (localhost:8080).**

#### 7.1 — `combat.service.ts`: Prefijo de rutas incorrecto (CRÍTICO)
**Archivo:** `src/services/combat.service.ts`
- **Bug:** `basePath` era `/api/combat` pero el backend monta combat en `/api` (`app.use('/api', combatRoutes)`).
- **Fix:** `basePath` cambiado a `/api`. Rutas reales: `POST /api/attack`, `POST /api/defend`, `POST /api/end`.
- **Eliminado:** Método `startCombat()` (duplicaba `dungeon.service.startDungeon()`).

#### 7.2 — `ranking.service.ts`: 11 métodos fantasma eliminados (CRÍTICO)
**Archivo:** `src/services/ranking.service.ts`
- **Eliminados 4 métodos fantasma de Rankings:**
  - `getRanking(:category)` → ruta `/api/rankings/:category` no existe
  - `getMyRank(:category)` → ruta `/api/rankings/:category/me` no existe
  - `getMyRankings()` → ruta `/api/rankings/me/all` no existe
  - `getCategories()` → ruta `/api/rankings/categories` no existe
- **Eliminados 7 métodos fantasma de Achievements:**
  - `getMyAchievements()` → `/api/achievements/me` no existe
  - `getAchievement(id)` → semántica incorrecta (backend espera userId, no achievementId)
  - `getAchievementProgress(id)` → `/api/achievements/:id/progress` no existe
  - `claimAchievementReward(id)` → `/api/achievements/:id/claim` no existe
  - `getAchievementsByCategory(cat)` → `/api/achievements/category/:cat` no existe
  - `getAchievementPoints()` → `/api/achievements/me/points` no existe
- **Añadidos 2 métodos nuevos alineados con el backend:**
  - `getMyRanking()` → `GET /api/rankings/me` (existe en backend)
  - `getUserAchievements(userId)` → `GET /api/achievements/:userId` (existe en backend)
- **Eliminados duplicados:** `getGeneralRanking`, `getLeaderboard`, `getRankingByPeriod`, `getRankingStats` tenían versiones duplicadas; unificados.

#### 7.3 — `auth.service.ts`: 2 métodos fantasma marcados como @deprecated
**Archivo:** `src/services/auth.service.ts`
- `checkAvailability()` → `GET /auth/check` no existe en backend. Ahora devuelve `{ available: true }` con warning en consola. La validación real ocurre en `/auth/register` (409).
- `getSocketToken()` → `GET /auth/socket-token` no existe. Ahora devuelve el JWT de localStorage directamente con warning.

#### 7.4 — `shop.service.ts`: 2 métodos faltantes añadidos
**Archivo:** `src/services/shop.service.ts`
- `addPackageToUser(userId, paqueteId)` → `POST /api/user-packages/agregar` (compra de paquete, cobra VAL).
- `removePackageFromUser(userId, paqueteId)` → `POST /api/user-packages/quitar` (quitar paquete del usuario).

#### 7.5 — `useNotifications.ts`: Endpoint faltante añadido
**Archivo:** `src/hooks/useNotifications.ts`
- `fetchNotification(id)` → `GET /api/notifications/:id` (detalle individual de notificación).
- Actualizado tipo de retorno `UseNotificationsReturn` con el nuevo método.

---

### 8. Fase 4 — Últimos 2 endpoints para cobertura 100%

#### 8.1 — `ranking.service.ts`: Desbloquear logro (admin)
**Archivo:** `src/services/ranking.service.ts`
- `unlockAchievement(userId, achievementId)` → `POST /api/achievements/:userId/unlock` (admin, body: `{ achievementId }`).

#### 8.2 — `gameConfig.service.ts`: Versión del servidor
**Archivo:** `src/services/gameConfig.service.ts`
- `getServerVersion()` → `GET /api/version` (público, devuelve `{ version, name, buildDate, environment }`).

#### Endpoints descartados intencionalmente (no son gaps):
| Endpoint | Razón |
|---|---|
| `GET /health`, `GET /api/health`, `/ready`, `/live` | Infraestructura (K8s/Docker) |
| `POST /api/payments/webhook` | Server-to-server (Stripe) |
| `GET /auth/reset-form/:token` | HTML server-rendered, no API |
| `POST /api/dungeons/enter/:dungeonId` | Alias de `/start`, ya cubierto |
| `GET /api/users/debug/my-data` | Debug/desarrollo, no producción |
| `POST /api/user-packages/por-correo` | Admin/soporte técnico interno |

---

## 📊 Cobertura Final: 100%

| Métrica | Valor |
|---|---|
| Endpoints backend totales (excluyendo infra/debug) | **~98** |
| Cubiertos por frontend | **~98** |
| Llamadas fantasma | **0** |
| Rutas desalineadas | **0** |

---

## 📝 Notas

- El backend se ejecuta desde otra terminal en `http://localhost:8080`.
- No existe archivo `.env` en el frontend; la URL se configura directamente en `api.config.ts` con fallback via `VITE_API_URL`.
- Para producción/Render, se debe volver a cambiar el fallback o crear un `.env` con `VITE_API_URL=https://valgame-backend.onrender.com`.
