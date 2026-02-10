# Tienda vs Paquetes del Usuario (React + TypeScript)

Esta guía aclara la diferencia entre paquetes "disponibles para la compra" (Tienda) y los "paquetes que el usuario ya posee" (inventario), y define un orden de implementación claro para el frontend.

**Framework**: React + TypeScript

## Conceptos clave
- Tienda (Shop Packages):
  - Catálogo público/semipúblico de paquetes disponibles para comprar.
  - Endpoints típicos: `GET /packages`, `GET /shop/packages`, `POST /shop/purchase` (u opciones específicas como `POST /shop/buy-val`, `POST /shop/buy-evo`).
  - Integración de pagos (Stripe/Blockchain) → evento `payments:status` y `notification:new` en éxito.

- Paquetes del Usuario (User Packages):
  - Objetos acreditados al usuario tras una compra o promoción.
  - Se listan y se abren (consumen) desde el perfil del usuario.
  - Endpoints: `GET /user-packages/:userId`, `POST /user-packages/:id/open`, `POST /user-packages/open` (abre el siguiente paquete pendiente sin especificar id).

## Diferencias rápidas
- "Tienda" = lo que se puede comprar.
- "Paquetes del usuario" = lo que ya tiene y puede abrir para recibir recompensas.
- Una compra exitosa mueve un item del dominio "Tienda" → "Paquetes del usuario".

## ¿Dónde viven los paquetes sin abrir?
- En la UI deben mostrarse en la sección "Mis Paquetes" (no en el inventario de ítems).
- El inventario (`inventarioEquipamiento`, `inventarioConsumibles`) solo refleja lo ya abierto/asignado.
- Al abrir un paquete: los ítems/consumibles pasan al inventario y los personajes se agregan al perfil.

## Flujo recomendado (end-to-end)
1) Autenticación
   - `POST /auth/login` → guarda `token`.
   - Opcional: conecta WebSocket (`/socket.io`) con `auth: { token }`.

2) Explorar Tienda
   - Listar paquetes: `GET /shop/packages` (o `GET /packages`).
   - Mostrar detalles y precios.

3) Comprar
   - `POST /shop/purchase` con el paquete elegido (o endpoints específicos `buy-*`).
   - Espera confirmación por evento `payments:status=confirmed` y muestra `notification:new` si llega.

4) Acreditación
   - Tras `confirmed`, el backend crea `UserPackage` para el usuario.
   - Refrescar estado del usuario si procede (`GET /users/me`) o llamar `GET /user-packages/:userId`.

5) Apertura de Paquete(s)
   - Opción UX simple: `POST /user-packages/open` (sin body) para abrir el siguiente pendiente.
   - Opción dirigida: `POST /user-packages/:id/open`.
   - Tras abrir, refrescar inventario/recursos (`GET /users/me`, `GET /inventory`).

6) Feedback en UI
   - Mostrar recompensas, toasts, y actualizar HUD (balance, consumibles/equipamiento, personajes).
   - Listeners útiles: `notification:new`, `character:level-up`, `character:evolved`.

## Endpoints por módulo (resumen)
- Tienda
  - `GET /packages`, `GET /shop/packages`
  - `POST /shop/purchase`, `POST /shop/buy-val`, `POST /shop/buy-evo`, `POST /shop/buy-boletos`
- Paquetes del usuario
  - `GET /user-packages/:userId`
  - `POST /user-packages/:id/open`
  - `POST /user-packages/open` ← recomendado para UX simple
- Realtime
  - `payments:status` (estado de compra)
  - `notification:new|read`

## Manejo de errores esperado
- 401: requiere login.
- 404 (tienda): paquete no encontrado.
- 404 (usuario): sin paquetes pendientes para abrir.
- 409: contención/lock al abrir paquete (reintento con jitter 500–1500ms).
- 429: aplicar backoff exponencial (ver `ERRORS_AND_LIMITS.md`).

## Orden de implementación (React)
1) Infraestructura base
   - Hook `useApi` para HTTP con interceptor de Auth.
   - Hook `useWebSocket` para tiempo real.
2) Tienda (Listado + Compra)
   - Hook `useShop` (wrappers: `getPackages`, `purchase`...).
   - Componente de listado con CTA de compra.
   - Listener `payments:status` y `notification:new`.
3) Inventario de Paquetes del Usuario
   - Página "Mis Paquetes".
   - Llamadas a `GET /user-packages/:userId`.
4) Apertura de Paquete
   - Botón "Abrir" (usa `POST /user-packages/open` o por id).
   - Refrescar inventario/usuario; toasts de recompensa.
5) Three.js (presentación)
   - Integrar animación/modales de apertura usando `@react-three/fiber`.
6) Tests
   - Mocks de HTTP y simulación de eventos WS con vitest.

## Hook useShop (React)
```tsx
// hooks/useShop.ts
import { useState, useCallback } from 'react';
import { useApi } from './useApi';

export function useShop() {
  const { get, post, loading, error } = useApi();
  const [packages, setPackages] = useState([]);

  const getPackages = useCallback(async () => {
    const data = await get('/api/shop/packages');
    setPackages(data);
    return data;
  }, [get]);

  const purchase = useCallback(async (packageId: string) => {
    return post('/api/shop/purchase', { packageId });
  }, [post]);

  const getUserPackages = useCallback(async (userId: string) => {
    return get(`/api/user-packages/${userId}`);
  }, [get]);

  const openPackage = useCallback(async (packageId?: string) => {
    if (packageId) {
      return post(`/api/user-packages/${packageId}/open`, {});
    }
    return post('/api/user-packages/open', {});
  }, [post]);

  return {
    packages,
    getPackages,
    purchase,
    getUserPackages,
    openPackage,
    loading,
    error,
  };
}
```

## Snippets sugeridos
- Ver `WEBSOCKET_LISTENERS.md` → hook `useWebSocket` completo.
- Ver `../AUTH_AND_FLOWS.md` → sección "Apertura de paquete" (contratos + ejemplos).
- Ver `WEBSOCKET_LISTENERS_GUIDE.md` → eventos confirmados para toasts/UX.
