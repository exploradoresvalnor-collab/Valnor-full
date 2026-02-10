# Frontend Integration Guide (Angular 17)

**Punto de entrada único para desarrollo del Frontend.**  
**Última actualización**: 2 de febrero de 2026

---

## 🚀 ¿Primera vez aquí? Lee esto primero

👉 **[`00_COMIENZA_AQUI.md`](00_COMIENZA_AQUI.md)** ← EMPIEZA POR AQUÍ

Ese documento te explica:
- En qué orden leer los 19 documentos
- Cuánto tiempo te tomará cada fase
- Quick start para login funcional en 2 horas
- Flujo completo de lectura + implementación

---

##   Inicio Rápido

1. **Setup inicial**: `03_SETUP_ANGULAR17_THREEJS.md`
2. **Autenticación**: `AUTH_AND_FLOWS.md`
3. **Endpoints**: `ENDPOINTS_CATALOG.md` + `COMPATIBILITY_ALIASES.md`
4. **WebSocket**: `WEBSOCKET_LISTENERS_GUIDE.md`
5. **Errores**: `ERRORS_AND_LIMITS.md`
6. **Checklist**: `CHECKLIST_INTEGRACION.md`

## ��� Guías por Módulo

### Auth & Onboarding
- **Archivo**: `AUTH_AND_FLOWS.md`
- **Endpoints**: POST /auth/register, /auth/login, /auth/verify, /auth/forgot-password
- **Flujo**: Registro → Email verificación → Login → Token JWT

### Tienda & Paquetes
- **Archivo**: `05_TIENDA_Y_PAQUETES.md`
- **Endpoints**: GET /shop/packages, POST /shop/purchase, POST /user-packages/open
- **Flujo**: Compra → Acreditación (WS) → Apertura → Inventario actualizado

### Marketplace P2P
- **Archivo**: `06-Marketplace-P2P.md`
- **Endpoints**: GET /marketplace/listings, POST /marketplace/list, POST /marketplace/buy
- **WS**: `marketplace:new`, `marketplace:sold`, `marketplace:cancelled`

### Dashboard & Teams (Armado de Equipo)
- **Archivo**: `game_dashboard/DASHBOARD_Y_TEAMS.md` ⭐
- **Endpoints**: GET/POST/PUT/DELETE /teams, PUT /teams/:id/activate
- **Flujo**: Dashboard → Team Builder → Seleccionar personajes → Guardar → Activar → Jugar
- **Contenido**: Layout UI/UX, componentes Angular, flujo completo de jugabilidad

### Modo Invitado (Guest Mode)
- **Archivo**: `game_dashboard/MODO_INVITADO.md` ⭐
- **Concepto**: Permite probar el juego sin registro
- **Bloqueado**: Shop (comprar), Marketplace (comprar/vender), guardar progreso
- **Permitido**: Ver tienda, ver marketplace, tutorial dungeon, 1 partida survival
- **Contenido**: Dos tipos de cuenta, guards, UI de bloqueo, flujo de conversión

### Dungeons (RPG) & Rankings
- **Archivo**: `11_COMBATE_Y_DUNGEONS.md`
- **⚠️ IMPORTANTE**: Dungeons usa **EQUIPO** (múltiples personajes), Survival usa **1 SOLO** personaje
- **Endpoints canónicos**:
  - POST /api/dungeons/:id/start → `{ team: ["id1", "id2", ...] }`
  - POST /api/survival/start → `{ characterId: "id" }`
  - GET /api/dungeons/:id/progress
  - GET /api/rankings/me
  - GET /api/rankings/leaderboard/:category
- **Alias**: Ver `COMPATIBILITY_ALIASES.md`
- **WS**: `dungeon:entered`, `dungeon:progress`, `rankings:update`

### Configuración & Conexión
- **Archivo**: `CONFIGURACION_CONEXION_BACKEND.md`
- **Contenido**: URLs correctas, prefijos /api/, withCredentials, CORS
- **Crítico**: Diferencia entre rutas públicas y protegidas

### Registro & Verificación
- **Archivo**: `FLUJO_REGISTRO_VERIFICACION.md`
- **Contenido**: Flujo completo paso a paso con ejemplos Angular

### Cookies HttpOnly
- **Archivo**: `MANEJO_COOKIES_HTTPONLY.md`
- **Contenido**: Autenticación segura con cookies, withCredentials

## �� WebSocket & Real-time

**Guía completa**: `WEBSOCKET_LISTENERS_GUIDE.md`
**Especificación**: `WEBSOCKET_EVENT_SPEC.md`

Eventos principales:
- `dungeon:*` → RPG Dungeons
- `survival:*` → Modo Survival
- `marketplace:*` → Actualizaciones P2P
- `rankings:update` → Cambios en leaderboards
- `payments:*` → Confirmaciones de compra

## ⚠️ Errores & Rate Limits

**Archivo**: `ERRORS_AND_LIMITS.md`

- 401: Token inválido → relogin
- 429: Rate limit → backoff exponencial
- 5xx: Error servidor → retry con jitter

Cada módulo lista errores específicos de contexto.

## ��� Alias & Compatibilidad

**Archivo**: `COMPATIBILITY_ALIASES.md`

Endpoints canónicos vs alias temporales. **Usar siempre los canónicos**.

## ��� Checklist de Integración

**Archivo**: `CHECKLIST_INTEGRACION.md`

Orden recomendado: Auth → Paquetes → Marketplace → Dungeons → Rankings

## ��� Archivos Obsoletos (eliminados)

Los siguientes fueron consolidados o removidos:
- AUDITORIA_*.md → Ya no necesarios
- ORDENES_DESARROLLADOR.md → Info ya en guías específicas
- 01_GUIA_FRONTEND_MODULOS.md → Redundante con estructura actual
- 02_GUIA_FRONTEND_GUARDS_VALIDACIONES.md → Info en AUTH_AND_FLOWS
- DIAGRAMA_FLUJOS.md → Info dispersa en guías específicas
- INDEX.md → Reemplazado por este README

## ���️ Herramientas

- **Auditoría endpoints**: `npm run audit:endpoints` → genera `ENDPOINTS_AUDIT_REPORT.json`
- **Limpieza docs**: `npm run cleanup:docs`

---

**Última actualización**: 18 de diciembre de 2025
**Versión**: 2.1 (actualizada contra código)
