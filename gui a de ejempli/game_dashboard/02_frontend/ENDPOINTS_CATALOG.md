# Catálogo de Endpoints (v3 — React)

> **Actualizado:** 7 de febrero de 2026  
> **Frontend:** React + TypeScript + Vite  
> **Backend:** Express + MongoDB Atlas (localhost:8080)

Este catálogo lista todos los endpoints HTTP expuestos por el backend (~135 rutas), agrupados por módulo.

- **Base URL:** `http://localhost:8080` (dev) / `https://valgame-backend.onrender.com` (prod)
- **Auth:** JWT vía httpOnly cookie (`Set-Cookie: token=...`). El frontend envía `credentials: 'include'` en cada request.
- **Prefijo `/api`:** Todas las rutas protegidas usan `/api/...`. Las rutas de auth NO usan `/api`.
- **Rate limiting y errores:** ver `ERRORS_AND_LIMITS.md`.

## Índice
- [Auth](#auth)
- [Users](#users)
- [User Settings](#user-settings)
- [User Characters](#user-characters)
- [Achievements](#achievements)
- [Items / Equipment / Consumables / Inventory](#items--equipment--consumables--inventory)
- [Characters (acciones)](#characters-acciones)
- [Dungeons](#dungeons)
- [Combat](#combat)
- [Survival](#survival)
- [Rankings / Player Stats](#rankings--player-stats)
- [Energy System](#energy-system)
- [Marketplace](#marketplace)
- [Marketplace Transactions](#marketplace-transactions)
- [Offers / Packages / Shop](#offers--packages--shop)
- [Payments](#payments)
- [Teams](#teams)
- [Notifications](#notifications)
- [Chat](#chat)
- [Feedback](#feedback)
- [Game Config](#game-config)
- [Health / Version](#health--version)

---

## Auth
> **Servicio React:** `src/services/auth.service.ts`  
> **⚠️ SIN prefijo `/api`** — Las rutas de auth van directo a `/auth/*`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | public | Registro (email, username, password) |
| POST | `/auth/login` | public | Login → devuelve JWT en httpOnly cookie |
| POST | `/auth/logout` | auth | Cierra sesión |
| GET | `/auth/verify/:token` | public | Verificar email |
| POST | `/auth/resend-verification` | public | Reenviar email de verificación |
| POST | `/auth/forgot-password` | public | Enviar email de reset |
| GET | `/auth/reset-password/validate/:token` | public | Validar token de reset |
| POST | `/auth/reset-password/:token` | public | Establecer nueva contraseña |
| GET | `/auth/reset-form/:token` | public | Formulario HTML de reset (backend) |
| GET | `/auth/test` | public | Test endpoint (dev only) |

**Ejemplo login (React):**
```tsx
const res = await fetch('http://localhost:8080/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // ⚠️ OBLIGATORIO para recibir cookie
  body: JSON.stringify({ email, password })
});
// Token NO viene en body — viene como Set-Cookie httpOnly
// El body contiene: { success, message, user }
```

---

## Users
> **Servicio React:** `src/services/user.service.ts` — basePath: `/api/users`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/users` | auth | Listar usuarios (con query params) |
| GET | `/api/users/me` | auth | Mi perfil completo |
| GET | `/api/users/profile/:userId` | public | Perfil público de usuario |
| GET | `/api/users/resources` | auth | Mis recursos (val, boletos, energía) |
| GET | `/api/users/dashboard` | auth | Dashboard data (actividad reciente) |
| PUT | `/api/users/tutorial/complete` | auth | Marcar tutorial como completado |
| POST | `/api/users/characters/add` | auth | Agregar personaje al usuario |
| PUT | `/api/users/set-active-character/:personajeId` | auth | Establecer personaje activo |
| DELETE | `/api/users/characters/:personajeId` | auth | Eliminar personaje del usuario |
| POST | `/api/users/energy/consume` | auth | Consumir energía (body: { amount }) |
| GET | `/api/users/energy/status` | auth | Estado de energía + regeneración |
| GET | `/api/users/debug/my-data` | auth | Debug data completa (dev only) |

---

## User Settings
> **Hook React:** `src/hooks/useSettings.ts`  
> **⚠️ Ruta:** `/api/user/settings` (NO `/api/user-settings`)

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/user/settings` | auth | Obtener configuración del usuario |
| PUT | `/api/user/settings` | auth | Guardar configuración |
| POST | `/api/user/settings/reset` | auth | Restaurar valores por defecto |

**Nota:** El backend puede también exponer `/api/user-settings` como alias, pero el frontend React usa `/api/user/settings`.

---

## User Characters
> **Servicio React:** `src/services/character.service.ts`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/user-characters` | auth | Mis personajes (lista completa) |
| GET | `/api/user-characters/:id` | auth | Detalle de un personaje mío |

---

## Achievements
> **Servicio React:** `src/services/ranking.service.ts` (método `getAllAchievements()`)

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/achievements` | public | Todos los logros disponibles |
| GET | `/api/achievements/:userId` | public | Logros de un usuario |
| POST | `/api/achievements/:userId/unlock` | auth | Desbloquear logro |

---

## Items / Equipment / Consumables / Inventory
> **Servicio React:** `src/services/inventory.service.ts`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/items` | public | Catálogo completo de items |
| GET | `/api/equipment` | public | Catálogo de equipamiento |
| GET | `/api/consumables` | public | Catálogo de consumibles |
| GET | `/api/inventory` | auth | Mi inventario completo |
| GET | `/api/inventory/equipment` | auth | Mi equipamiento |
| GET | `/api/inventory/consumables` | auth | Mis consumibles |

---

## Characters (acciones)
> **Servicio React:** `src/services/character.service.ts` — basePath: `/api/characters`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/characters/:id/stats` | auth | Stats del personaje |
| POST | `/api/characters/:id/use-consumable` | auth | Usar consumible en personaje |
| POST | `/api/characters/:id/revive` | auth | Revivir personaje |
| POST | `/api/characters/:id/damage` | auth | Aplicar daño |
| POST | `/api/characters/:id/heal` | auth | Curar personaje |
| POST | `/api/characters/:id/evolve` | auth | Evolucionar personaje |
| POST | `/api/characters/:id/add-experience` | auth | Agregar experiencia |
| POST | `/api/characters/:id/equip` | auth | Equipar item |
| POST | `/api/characters/:id/unequip` | auth | Desequipar item |
| PUT | `/api/characters/:id/level-up` | auth | Subir de nivel |

---

## Dungeons
> **Servicio React:** `src/services/dungeon.service.ts` — basePath: `/api/dungeons`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/dungeons` | public | Lista de mazmorras |
| GET | `/api/dungeons/:id` | public | Detalle de mazmorra |
| POST | `/api/dungeons/:dungeonId/start` | auth | Iniciar batalla en mazmorra |
| GET | `/api/dungeons/:dungeonId/progress` | auth | Progreso actual |
| GET | `/api/dungeons/:dungeonId/session/:sessionId` | auth | Alias de progress |
| POST | `/api/dungeons/enter/:dungeonId` | auth | Alias de start |

---

## Combat
> **Servicio React:** `src/services/combat.service.ts` — basePath: `/api`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/combat/dungeons/:dungeonId/start` | auth | Iniciar combate en dungeon |
| POST | `/api/attack` | auth | Ejecutar ataque |
| POST | `/api/defend` | auth | Ejecutar defensa |
| POST | `/api/end` | auth | Terminar combate |

---

## Survival
> **Servicio React:** `src/services/survival.service.ts` — basePath: `/api/survival`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/survival/start` | auth | Iniciar sesión survival |
| POST | `/api/survival/:sessionId/complete-wave` | auth | Completar oleada |
| POST | `/api/survival/:sessionId/use-consumable` | auth | Usar consumible |
| POST | `/api/survival/:sessionId/pickup-drop` | auth | Recoger drop |
| POST | `/api/survival/:sessionId/end` | auth | Terminar sesión (victoria) |
| POST | `/api/survival/:sessionId/death` | auth | Game over |
| POST | `/api/survival/:sessionId/abandon` | auth | Abandonar sesión |
| POST | `/api/survival/exchange-points/exp` | auth | Intercambiar puntos → EXP |
| POST | `/api/survival/exchange-points/val` | auth | Intercambiar puntos → VAL |
| POST | `/api/survival/exchange-points/guaranteed-item` | auth | Intercambiar puntos → item |
| GET | `/api/survival/leaderboard` | auth | Leaderboard survival |
| GET | `/api/survival/my-stats` | auth | Mis stats de survival |

---

## Rankings / Player Stats
> **Servicio React:** `src/services/ranking.service.ts` — basePath: `/api/rankings`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/rankings` | public | Ranking general |
| GET | `/api/rankings/leaderboard/:category` | public | Leaderboard por categoría |
| GET | `/api/rankings/period/:periodo` | public | Ranking por periodo |
| GET | `/api/rankings/stats` | public | Estadísticas generales |
| GET | `/api/rankings/me` | auth | Mi posición en ranking |
| POST | `/api/player-stats` | public | Registrar stats |
| GET | `/api/player-stats/usuario/:userId` | public | Stats de un usuario |
| GET | `/api/player-stats/personaje/:personajeId` | public | Stats de un personaje |

---

## Energy System
> **Servicio React:** `src/services/user.service.ts`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/users/energy/status` | auth | Energía actual + tiempo regeneración |
| POST | `/api/users/energy/consume` | auth | Consumir energía (body: { amount }) |

**Nota:** La energía también aparece en `GET /api/users/resources` y `GET /api/users/profile/:userId`.

---

## Marketplace
> **Servicio React:** `src/services/marketplace.service.ts` — basePath: `/api/marketplace`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/marketplace/list` | auth | Listar item en venta |
| POST | `/api/marketplace/buy/:listingId` | auth | Comprar item |
| POST | `/api/marketplace/cancel/:listingId` | auth | Cancelar listado |
| GET | `/api/marketplace/history` | auth | Historial / listings activos |
| GET | `/api/marketplace/:listingId` | public | Detalle de un listing |
| PATCH | `/api/marketplace/:listingId/price` | auth | Actualizar precio |

**⚠️ NO existe `/api/marketplace/listings`.** Usar `/api/marketplace/history` para obtener listings.

---

## Marketplace Transactions
> **Servicio React:** `src/services/marketplace.service.ts` — txPath: `/api/marketplace-transactions`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/marketplace-transactions/my-history` | auth | Mi historial completo |
| GET | `/api/marketplace-transactions/my-sales` | auth | Mis ventas |
| GET | `/api/marketplace-transactions/my-purchases` | auth | Mis compras |
| GET | `/api/marketplace-transactions/stats` | auth | Mis estadísticas |
| GET | `/api/marketplace-transactions/:listingId` | auth | Detalle transacción |

---

## Offers / Packages / Shop
> **Servicio React:** `src/services/shop.service.ts`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/offers` | public | Ofertas activas |
| GET | `/api/packages` | public | Catálogo de paquetes |
| GET | `/api/shop/info` | public | Info de la tienda |
| GET | `/api/shop/packages` | public | Paquetes de la tienda |
| POST | `/api/shop/buy-evo` | auth | Comprar EVO tokens |
| POST | `/api/shop/buy-boletos` | auth | Comprar boletos |
| POST | `/api/shop/buy-val` | auth | Comprar VAL |
| POST | `/api/shop/purchase` | auth | Compra genérica |
| GET | `/api/user-packages/:userId` | auth | Paquetes de un usuario |
| POST | `/api/user-packages/:id/open` | auth | Abrir paquete por ID |
| POST | `/api/user-packages/open` | auth | Abrir paquete pendiente más antiguo |
| POST | `/api/user-packages/agregar` | auth | Asignar paquete a usuario |
| POST | `/api/user-packages/quitar` | auth | Quitar paquete de usuario |
| POST | `/api/user-packages/por-correo` | auth | Asignar paquete por email |

---

## Payments
> **Servicio React:** `src/services/payment.service.ts` — basePath: `/api/payments`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/payments/checkout` | public | Iniciar checkout Stripe |
| POST | `/api/payments/webhook` | public | Webhook Stripe |
| POST | `/api/payments/blockchain/initiate` | auth | Pago blockchain |
| POST | `/api/payments/wallet/connect` | auth | Conectar wallet |
| GET | `/api/payments/history` | auth | Historial de pagos |

---

## Teams
> **Servicio React:** `src/services/team.service.ts` — basePath: `/api/teams`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/teams` | auth | Mis equipos |
| GET | `/api/teams/:id` | auth | Detalle de equipo |
| POST | `/api/teams` | auth | Crear equipo |
| PUT | `/api/teams/:id` | auth | Actualizar equipo |
| DELETE | `/api/teams/:id` | auth | Eliminar equipo |
| PUT | `/api/teams/:id/activate` | auth | Activar equipo |

---

## Notifications
> **Hook React:** `src/hooks/useNotifications.ts`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/notifications` | auth | Lista de notificaciones (paginada) |
| GET | `/api/notifications/unread/count` | auth | Cantidad de no leídas |
| GET | `/api/notifications/:id` | auth | Detalle de notificación |
| PUT | `/api/notifications/:id/read` | auth | Marcar como leída |
| PUT | `/api/notifications/read-all` | auth | Marcar todas como leídas |
| DELETE | `/api/notifications/:id` | auth | Eliminar notificación |

---

## Chat
> **Servicio React:** `src/services/chat.service.ts` — basePath: `/api/chat`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/chat/messages` | auth | Obtener mensajes (con query params) |
| POST | `/api/chat/global` | auth | Enviar mensaje global |
| POST | `/api/chat/private` | auth | Enviar mensaje privado |
| POST | `/api/chat/party` | auth | Enviar mensaje de party |

---

## Feedback
> **Servicio React:** `src/services/feedback.service.ts` — basePath: `/api/feedback`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/feedback` | auth | Enviar feedback |
| GET | `/api/feedback` | auth | Mi feedback enviado |

---

## Game Config
> **Servicio React:** `src/services/gameConfig.service.ts`

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/game-settings` | public | Configuración global del juego |
| GET | `/api/base-characters` | public | Personajes base disponibles |
| GET | `/api/categories` | public | Categorías de items |
| GET | `/api/level-requirements` | public | Requisitos por nivel |
| GET | `/api/events` | public | Eventos activos |
| GET | `/api/version` | public | Versión del backend |

---

## Health / Version

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | public | Health check (sin /api) |
| GET | `/api/version` | public | Versión del backend |

---

## Notas Importantes

### Autenticación: httpOnly Cookies
```
El login NO devuelve token en el body. El JWT viaja como httpOnly cookie.
- Frontend: SIEMPRE usar credentials: 'include' en fetch/axios
- El backend hace Set-Cookie: token=<jwt>; HttpOnly; Path=/
- Para requests API: api.service.ts agrega credentials: 'include' automáticamente
- También lee localStorage['valnor_token'] como backup para Authorization header
```

### Prefijos de ruta
```
/auth/*     → Sin /api (rutas públicas de autenticación)
/api/*      → Todas las demás rutas (protegidas y públicas)
/health     → Sin /api (health check)
```

### Socket.IO (Realtime)
```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:8080', {
  transports: ['websocket'],
  auth: { token: jwt },
  reconnection: true,
  reconnectionAttempts: 5,
});
```

### Alias de compatibilidad
- `POST /api/dungeons/enter/:dungeonId` → Alias de `POST /api/dungeons/:dungeonId/start`
- `GET /api/dungeons/:dungeonId/session/:sessionId` → Alias de `GET /api/dungeons/:dungeonId/progress`
- `GET /api/rankings/period/:period` → Alias con "period" en inglés (además de "periodo")
