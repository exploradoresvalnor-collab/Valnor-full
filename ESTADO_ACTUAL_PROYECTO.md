# ESTADO_ACTUAL_PROYECTO

**Fecha y hora:** 16 de febrero de 2026 — 22:22

## 1) Resumen ejecutivo
Hoy hemos avanzado fuertemente en la experiencia 3D de las Dungeons: implementamos la vista 3D (preview + cinematic), la página jugable `PlayDungeon` con Player + física (Rapier), y el flujo correcto de entrada (modal → preview → entrar → escena jugable). Además, mejoramos la robustez (fallbacks de GLB), corregimos errores de parseo y sustituimos placeholders por modelos 3D.

## 2) Qué hicimos hoy (detallado)
- Integración 3D completa para dungeons demo (`castle_low_poly.glb`) y fallback automático en DEV.
- `PlayDungeon` (nueva página): carga de GLB, spawn `Player`, trigger Rapier para iniciar combate, overlay `DungeonBattle`.
- `DungeonModelPreview`: cinematic preview en modal (team walk + cámara).
- Modal ya **no** inicia combate automáticamente; ahora lleva a `PlayDungeon`.
- Reemplazo del enemy placeholder (cubo) por `CharacterModel3D` (con `CharacterPlaceholder` como fallback).
- Debug / dev helpers: botón `Cargar demo GLB` y logs `[SceneFromGLB] loaded:`.
- Correcciones: eliminados marcadores de diff que provocaban parse errors; optimización de suscripciones en `EngineController`.

## 3) Archivos modificados / creados hoy
- `src/pages/Dungeon/PlayDungeon.tsx` — página jugable, triggers y fallbacks (principal trabajo de hoy)
- `src/engine/components/DungeonModelPreview.tsx` — cinematic & thumbnail
- `src/engine/components/CharacterModel3D.tsx` — usado para enemy (fallback ya existente)
- `src/engine/components/GameCanvas.tsx` — ajuste en EngineController (evitar render-loop)
- `src/engine/components/PhysicsWorld.tsx` — triggers/colisiones (usado por PlayDungeon)
- `public/assets/dungeons/Fortaleza/castle_low_poly.glb` — asset demo (fallback local)

## 4) Estado actual — funcionando ✔️
- Cargar dungeon: `/dungeon/play/:id` → carga escena (GLB demo fallback disponible).
- Player: spawn + movimiento (WASD/Space) + físicas Rapier.
- Enemy: `CharacterModel3D` spawneado y usado como trigger (inicia `DungeonBattle`).
- Modal: muestra preview/cinemática y no inicia combate por sí sola.
- Backend: `dungeonService.startDungeon()` se intenta en trigger; si falla, se aplica fallback local.

## 5) Cómo probar (rápido) 🔍
- Levantar servidor: `npm run dev` → abrir http://localhost:<puerto>/
- Entrar a Dungeons → seleccionar demo o abrir directamente: `/dungeon/play/demo-dungeon-1`.
- Si la escena no carga: pulsar "Cargar demo GLB" (arriba a la derecha).
- Confirmar en consola: `[SceneFromGLB] loaded: /assets/dungeons/Fortaleza/castle_low_poly.glb`.
- Controles: WASD (mover), Space (saltar), acercarse al enemigo y presionar `E` para abrir `DungeonBattle`.

## 6) Pendientes / riesgos (prioridad alta)
- Reemplazar IA/animaciones del enemigo (patrulla/idle → detectar jugador).  
- Pulir cámara/iluminación/escala del GLB.  
- Integración servidor de escenas + metadata (upload + endpoint faltante).  
- Tests unit/integration para preview → play → trigger.

## 7) Próximos pasos recomendados (corto plazo)
1. Añadir animaciones y orientación del enemigo hacia el jugador (mejora UX).  
2. Mover componentes HUD (TeamPanel / CombatLog / RewardsPanel) como overlays absolutos sobre Canvas.  
3. Añadir tests automatizados y probar WebView Android.

## 8) Checklist (estado parcial)
- [x] Agregar preview 3D en modal
- [x] `PlayDungeon` con Player + Física
- [x] Enemy proximity trigger (Rapier)
- [x] Fallback GLB demo (`Fortaleza`) y botón de carga manual
- [x] Reemplazo de placeholder por `CharacterModel3D`
- [ ] Animaciones/IA del enemigo (pendiente)
- [ ] HUD overlays y accesibilidad
- [ ] Tests unit/integration para flujo 3D

---
Si quieres, actualizo este archivo con más granularidad (por componente), genero issues desde los pendientes o implemento ahora la animación/patrulla del enemigo. ¿Cuál prefieres como siguiente tarea?

---

## Registro — 17 de febrero de 2026 (resumen de hoy)
**Hora:** 17 de febrero de 2026 — 18:20

### Resumen corto
Hoy centramos el trabajo en la página `Teams`: implementamos un visor 3D «épico», migramos el panel de estadísticas dentro del Canvas (anclado al personaje), sustituimos partículas planas por orbes volumétricos, y mejoramos iluminación (modo diurno). Todo probado localmente y visualmente verificado; cambios todavía no push al remoto.

### Cambios realizados (detallado)
- `src/pages/Teams/Teams.tsx`
  - Visor 3D: suelo reflectante pulido, anillo mágico, partículas volumétricas (ArcaneEmbers).
  - Panel `ProStatsPanel` integrado dentro del Canvas (Html) y anclado al personaje; backdrop eliminado a petición.
  - Iluminación: añadido modo diurno y ajuste de luces (spot + direccional).  
  - Reducción y reubicación de partículas (evitan área del panel).
  - Mejoras en ergonomía: `Float` para presencia del personaje; panel sin recubrimiento gris.
- UI: `src/components/ui/ProStatsPanel.tsx`, `src/components/ui/ProStats.css` — nuevo componente de estadísticas estilo glassmorphism.
- Visual tuning: ajustes a `MeshReflectorMaterial` (suavizado del reflejo) y a parámetros de Bloom para que el personaje permanezca nítido.
- Sustitución de `Sparkles` por `ArcaneEmbers` (partículas volumétricas con blending aditivo y toneMapped=false).
- Ajustes en `src/engine/components/TeamShowcase3D.tsx` (previas mejoras de exhibición y limpieza de DoF).

### Estado actual
- Visual / UX: Panel legible e integrado en escena; partículas no interfieren; escenario con iluminación diurna. ✅
- Funcionalidad Demo: equip/use/save en modo Demo funcionan en cliente (no se tocó la lógica de backend). ✅
- Repositorio: cambios locales; **no** se han push a remoto (esperando tu OK). ⚠️

### Qué queda pendiente (sugerido)
- Añadir toggle "Modo Épico" (activar/desactivar partículas + espejo). (siguiente recommended)
- Añadir pruebas unitarias para handlers Demo en `Teams`. (importante)
- Pruebas de rendimiento en dispositivos de gama baja y ajustar `MeshReflectorMaterial` si hace falta.

### Acordado / decisiones tomadas hoy
- Mantener demo como cliente‑only. ✅
- Mostrar stats dentro del Canvas y anclar al personaje. ✅
- Priorizar legibilidad sobre efectos visuales excesivos. ✅

---

¿Deseas que haga commit + push de los cambios de hoy, o que implemente primero el toggle "Modo Épico" y las pruebas unitarias?

---

## Registro — 18 de febrero de 2026
**Hora:** 18 de febrero de 2026 — sesión de trabajo completa

### Resumen corto
Hoy se implementó el **Modo Demo / Invitado** de forma completa y limpia: arquitectura de sesión guest con persistencia F5, logout seguro sin tocar el backend, y modal de confirmación al salir. También se detectó (pero aún no se resolvió) un crash de render-loop en el Dashboard cuando hay sesión guest activa.

---

### Cambios realizados (detallado)

#### Arquitectura del Modo Guest — nuevo sistema
| Archivo | Qué se hizo |
|---|---|
| `src/stores/sessionStore.ts` | Añadido campo `isGuest: boolean`, acción `startGuestSession()` y selector helper `useIsGuestSession()`. El `startAsAuth()` ahora fuerza `isGuest: false` explícitamente. |
| `src/services/session.service.ts` | **Archivo nuevo.** `performLogout()` centralizado: si `isGuest=true` limpia entorno local sin llamar al backend; si no, delega en `authService.logout()`. |
| `src/services/guest.service.ts` | Corregido: ahora llama `startGuestSession()` en vez de `startAsAuth()` (antes el guest no se marcaba correctamente). |
| `src/utils/demoBootstrapper.ts` | Añadida función `clearDemoEnvironment()`: resetea stores + elimina claves de localStorage (`STORAGE_KEYS.USER`, `guest_user`). |
| `src/context/AuthContext.tsx` | `checkAuth()` hace short-circuit si detecta sesión guest (persisted o en store) → evita hacer fetch al backend y genera 401s en consola. |
| `src/hooks/useAuth.ts` | `logout()` ahora usa `performLogout()` en vez de `authService.logout()` + `endSession()` directamente. |
| `src/hooks/useNotifications.ts` | Refactorizado de `const store = useNotificationsStore()` a selectores individuales por campo → elimina una fuente de re-renders innecesarios. |

#### Corrección de bug real — `RequireAuth.tsx`
- `useSessionStore((s) => s.isGuest)` se estaba llamando **condicionalmente** (después de dos `return` tempranos), violando las reglas de hooks de React.
- Movido al nivel superior del componente junto con el resto de hooks. Esto podía causar crashes silenciosos en React 19.

#### UX — Modales de confirmación al salir del Demo
- `src/components/ui/GlobalNavbar.tsx`: nuevo modal "¿Salir del Modo Demo?" antes de ejecutar logout.
- `src/pages/Dashboard/Dashboard.tsx`: mismo modal en el botón de salir del header.
- `src/components/ui/GlobalNavbar.css`: estilos del modal (`.modal-overlay`, `.confirm-modal`, `.cancel-btn`, `.confirm-btn`) añadidos en scope global CSS — **se corrigió un bug del propio proceso**: los estilos se habían metido dentro del bloque `@media (max-width: 1024px)` y habían eliminado `.mobile-menu { display: block; }`. Ambas cosas reparadas.

#### Tests nuevos añadidos
- `src/services/guest.service.test.ts` — ampliado con 3 casos nuevos: `isGuest=true`, `clearDemoEnvironment`, persistencia F5.
- `src/services/session.service.test.ts` — **archivo nuevo**: 2 tests que verifican que guest → no llama backend; real → sí llama backend.
- `src/e2e/debug-dev-dashboard.e2e.test.ts` — **archivo nuevo**: test Puppeteer para capturar errores del Dashboard en dev.
- `src/e2e/demo-logout.e2e.test.ts` — **archivo nuevo**: test e2e completo del flujo demo (F5 + logout + sin llamada al backend + toast).

#### Limpieza de debug
- Eliminados todos los `console.log` de instrumentación temporal en `playerStore`, `teamStore`, `sessionStore`, `notificationsStore` y `main.tsx`.
- `package.json`: añadido script `"test:e2e": "vitest run src/e2e"`.

---

### Lo que NO se tocó (login normal intacto)
- `authService.login()`, `authService.logout()`, `authService.checkSession()` — sin cambios.
- `AuthContext` — solo se añadió el bloque de short-circuit para guest; el flujo real sigue igual.
- Páginas de login/registro, token JWT, WebSocket — intactos.

---

### Bug detectado pero PENDIENTE de resolver 🔴
**Error:** `Maximum update depth exceeded` / `The result of getSnapshot should be cached to avoid an infinite loop`

- **Afecta a:** `<Dashboard>` cuando hay sesión guest activa.
- **Causa raíz:** Algún selector de Zustand en Dashboard o sus hijos devuelve un objeto/array nuevo en cada render sin `useShallow`, causando que `useSyncExternalStore` de React 19 fuerce re-renders infinitos.
- **Stack trace apunta a:** `forceStoreRerender → updateStoreInstance → commitHookEffectListMount`
- **Sospechosos principales:** selectores de `usePlayerStore`, `useTeamStore` o `usePlayerHealth`/`usePlayerLevel` dentro de Dashboard o sus children que NO usen `useShallow`.
- **Dónde investigar próximo:** leer `Dashboard.tsx` completo buscando `usePlayerStore(s => ({ ... }))` inline (sin `useShallow`); revisar children como `InventorySummary`, `EnergyBar`, `NotificationBell`.
- **El resto del código (modo login real)** no presenta este crash.

---

### Estado actual de lo que funciona ✔️
- Modo Guest: iniciar demo → F5 → persiste → logout → limpia todo → redirige a landing. ✅
- Logout guest: NO llama al backend. ✅
- Logout cuenta real: SÍ llama al backend. ✅
- `RequireAuth`: permite acceso a rutas protegidas en sesión guest. ✅
- `AuthContext`: no genera 401s en consola en sesión guest. ✅
- Tests unitarios de session.service: pasan. ✅
- CSS móvil del Navbar: menú móvil visible (`.mobile-menu` restaurado). ✅

### Estado actual de lo que NO funciona ❌
- Dashboard en sesión guest: crash render-loop `Maximum update depth exceeded`. ❌ (pendiente)

---

### Próximos pasos recomendados
1. **[URGENTE]** Resolver el crash del Dashboard: leer `Dashboard.tsx` completo + hijos, identificar qué selector devuelve objeto inline sin `useShallow` y envolverlo.
2. Ejecutar `npm run test:e2e` una vez con el dev server en puerto 5187 para confirmar que los tests unitarios de guest pasan.
3. Una vez corregido el crash, probar el flujo end-to-end completo en navegador: landing → demo → dashboard → logout.
4. Considerar push al remoto del trabajo de hoy.