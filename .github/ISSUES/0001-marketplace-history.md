---
title: "Historial del Marketplace es un stub / rutas duplicadas"
labels: [bug, backend, high-priority]
assignees: []
---

## Resumen

El endpoint `GET /api/marketplace/history` en `src/routes/marketplace.routes.ts` actualmente devuelve un **stub** (`{ success: true, stub: true, data: [] }`) en lugar de devolver el historial real y paginado del usuario. Además, hay una duplicidad de montura en `src/app.ts` que genera rutas redundantes como `/api/marketplace/marketplace/history`.

## Reproducción

1. Levantar el backend:
   - cd "gui a de ejempli/valgame-backend"
   - npm run dev
2. Hacer petición autenticada:
   - GET /api/marketplace/history?page=0&limit=20
3. Resultado actual:
   - `{ success: true, stub: true, data: [] }`

## Comportamiento esperado

- `GET /api/marketplace/history` debe devolver `{ success: true, data: [...], pagination: { page, limit, total, hasMore } }` filtrado por el usuario autenticado.
- No deben existir rutas redundantes como `/api/marketplace/marketplace/*`.

## Propuesta de solución

1. Quitar la montura duplicada en `src/app.ts` (mantener `app.use('/api/marketplace', marketplaceRoutes)` y eliminar la montura que genera duplicados).
2. Normalizar rutas del router para que sean relativas (`/list`, `/buy/:id`, `/history`, `/cancel/:id`). Si no se desea cambiar rutas públicas, simplemente eliminar la montura duplicada.
3. Reemplazar el stub por un handler que recupere el historial del usuario (usar `marketplaceTransactions` o consulta equivalente), con paginación (page, limit) y validación `auth`.
4. Añadir tests unitarios/integración que verifiquen la respuesta y la paginación.

## Criterios de aceptación

- `GET /api/marketplace/history?page=0&limit=20` devuelve datos reales y `pagination` para usuarios autenticados.
- Se eliminan respuestas inconsistentes causadas por rutas duplicadas.
- Tests añadidos pasan en CI (`npm test`).

## Notas

- Archivo de referencia: `gui a de ejempli/valgame-backend/docs/02_frontend/MARKETPLACE_HISTORY_ISSUE.md` (contiene detalles, ejemplo de handler y comandos sugeridos).

---

Si quieres, puedo ahora crear un PR que implemente la solución mínima y añada tests (en una rama distinta `fix/marketplace-history`), o dejar el issue listo para que lo reviséis y se asigne a alguien.