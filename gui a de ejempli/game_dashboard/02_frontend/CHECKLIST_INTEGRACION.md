# Checklist de Integración Front (Angular 17)

## Preparación
- [ ] Leer `CONFIGURACION_CONEXION_BACKEND.md` para URLs y prefijos correctos
- [ ] Configurar `API_URL` y CORS en backend/front.
- [ ] Interceptor JWT (Authorization: Bearer).
- [ ] Servicio `ApiService` y `WebsocketService` (Socket.IO con token).
- [ ] Configurar `withCredentials: true` para cookies HttpOnly (ver `MANEJO_COOKIES_HTTPONLY.md`)

## Orden sugerido
1) **Autenticación y onboarding** → ver `AUTH_AND_FLOWS.md`
   - [ ] Implementar registro/login/verificación/recuperación

2) **Dashboard principal** → ver `DASHBOARD_Y_TEAMS.md` ⭐
   - [ ] Header con recursos (VAL, EVO, Energía)
   - [ ] Cards de acción (Jugar, Tienda, Marketplace, Equipos)
   - [ ] Vista de equipo activo
   - [ ] Stats rápidos y actividad reciente

3) **Sistema de Equipos (Teams)** → ver `DASHBOARD_Y_TEAMS.md` ⭐
   - [ ] Listar personajes del usuario
   - [ ] Crear/editar/eliminar equipos
   - [ ] Seleccionar personajes (máx 9)
   - [ ] Activar equipo para jugar
   - [ ] Validaciones (máx 5 equipos)

4) **Inventarios y Paquetes** → ver `05_TIENDA_Y_PAQUETES.md`
   - [ ] Listar y abrir paquetes

5) **Marketplace P2P** → ver `06-Marketplace-P2P.md`
   - [ ] Listado/compra/cancelación + WS

6) **Dungeons (RPG)** → ver `11_COMBATE_Y_DUNGEONS.md`
   - [ ] Entrada y progreso con WS

7) **Survival Mode** → ver `ENDPOINTS_CATALOG.md`
   - [ ] Sesiones survival, oleadas, canjes

8) **Rankings** → ver `11_COMBATE_Y_DUNGEONS.md`
   - [ ] Posición personal y leaderboards

9) **Notifications** → ver `ENDPOINTS_CATALOG.md`
   - [ ] Centro de notificaciones

10) **Settings & Profile** → ver `ENDPOINTS_CATALOG.md`
   - [ ] Configuración de usuario

11) **Modo Invitado** → ver `MODO_INVITADO.md` ⭐
   - [ ] `guest.service.ts` (localStorage, sin backend)
   - [ ] `combat-simulator.service.ts` (combate local)
   - [ ] `demo-data.ts` (personajes, enemigos mock)
   - [ ] Landing con "Jugar Ahora" (sin registro)
   - [ ] Banner de invitado (sticky)
   - [ ] Bloquear Shop/Marketplace (solo ver, modal al intentar comprar)
   - [ ] Tutorial dungeon (simulación local)
   - [ ] 1 survival trial (simulación local)
   - [ ] Guard `RegisteredOnlyGuard`
   - [ ] Flujo de conversión guest → registrado

## Errores y límites
- [ ] Manejar 401/403/404/409/422/429/5xx
- [ ] Backoff en 429 y retires en 5xx controlados

## Validación final
- [ ] E2E: registro → equipo → abrir paquete → comprar en marketplace → dungeon → victoria → ranking actualizado
