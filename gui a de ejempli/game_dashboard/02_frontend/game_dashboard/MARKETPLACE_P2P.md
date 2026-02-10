# Marketplace P2P (Frontend React)

**Framework**: React + TypeScript

Guía completa para integrar el Marketplace entre usuarios: listar items, comprar, vender, historial y actualizar UI en tiempo real.

---

## Endpoints Principales

### Listar Items en Venta
```
GET /api/marketplace/listings?category=equipment&page=0&limit=20
```
**Query params** (todos opcionales):
- `category`: `equipment` | `consumable`
- `minPrice`, `maxPrice`: Filtros por rango de precio
- `page`, `limit`: Paginación (default: page=0, limit=20)

**Respuesta**:
```json
{
  "listings": [
    {
      "listingId": "...",
      "itemId": "...",
      "sellerId": "...",
      "precio": 1000,
      "estado": "activo",
      "fechaExpiracion": "2025-12-01T00:00:00Z",
      "item": { "nombre": "Espada de Fuego", "categoria": "equipment", ... }
    }
  ],
  "total": 45,
  "page": 0,
  "limit": 20
}
```

---

### Publicar Item para Venta
```
POST /api/marketplace/list
Body: {
  "itemId": "674abc123...",
  "precio": 1000,
  "duracion_horas": 48
}
```
**Auth**: JWT requerido  
**Tax**: 5% de comisión aplicada al vendedor al momento de la venta  
**Duración**: 24h, 48h, 72h (máximo)

**Respuesta exitosa** (201):
```json
{
  "listingId": "674def456...",
  "estado": "activo",
  "fechaExpiracion": "2025-11-26T12:00:00Z"
}
```

---

### Comprar Item
```
POST /api/marketplace/buy/:listingId
```
**Auth**: JWT requerido  
**Validaciones**:
- Fondos suficientes (VAL balance del comprador)
- Listing disponible y no expirado
- No puedes comprar tu propio listing

**Respuesta exitosa** (200):
```json
{
  "message": "Compra exitosa",
  "transactionId": "674ghi789...",
  "itemId": "...",
  "precio": 1000
}
```

**Transacción atómica**:
1. Descuenta VAL del comprador
2. Acredita VAL al vendedor (precio - 5% tax)
3. Transfiere item al inventario del comprador
4. Marca listing como vendido
5. Emite `marketplace:sold` vía WebSocket

---

### Cancelar Publicación
```
POST /api/marketplace/cancel/:listingId
```
**Auth**: JWT requerido  
**Validación**: Solo el vendedor puede cancelar su propio listing

**Respuesta**:
```json
{
  "message": "Listing cancelado",
  "listingId": "674def456...",
  "itemDevuelto": true
}
```

El item se devuelve al inventario del vendedor.

---

### Actualizar Precio
```
PATCH /api/marketplace/:listingId/price
Body: { "nuevoPrecio": 1500 }
```
**Auth**: JWT requerido  
**Validación**: Solo el vendedor puede actualizar el precio

---

### Historial de Transacciones
```
GET /api/marketplace-transactions/my-history    # Todo (compras + ventas)
GET /api/marketplace-transactions/my-sales      # Solo ventas
GET /api/marketplace-transactions/my-purchases  # Solo compras
```
**Auth**: JWT requerido

**Respuesta** (ejemplo `my-history`):
```json
{
  "transactions": [
    {
      "transactionId": "...",
      "tipo": "compra",
      "itemId": "...",
      "precio": 950,
      "fecha": "2025-11-24T14:30:00Z",
      "vendedor": { "userId": "...", "nombre": "Player1" },
      "comprador": { "userId": "...", "nombre": "Player2" }
    },
    {
      "tipo": "venta",
      "itemId": "...",
      "precio": 1200,
      "comision": 60,
      "fecha": "2025-11-23T10:15:00Z"
    }
  ],
  "total": 15
}
```

---

## Flujo Completo de Venta

### 1. Vendedor Lista Item
1. Usuario selecciona item de su inventario
2. Establece precio y duración (24h, 48h, 72h)
3. Frontend: `POST /api/marketplace/list`
4. Backend:
   - Valida que el item pertenezca al usuario
   - Remueve item del inventario (temporalmente)
   - Crea listing en estado `activo`
   - **Emite WS**: `marketplace:new` → notifica a todos los usuarios conectados
5. Frontend: Redirige a "Mis Publicaciones"

### 2. Comprador Ve Listing
1. Frontend: `GET /api/marketplace/listings?category=equipment`
2. Muestra listado con:
   - Imagen del item, nombre, stats
   - Precio en VAL
   - Tiempo restante (countdown desde `fechaExpiracion`)
3. Usuario hace clic → Vista de detalle: `GET /api/marketplace/:listingId`

### 3. Comprador Compra
1. Frontend: Confirma compra → `POST /api/marketplace/buy/:listingId`
2. Backend (transacción atómica):
   - Verifica fondos del comprador
   - Verifica que listing sigue disponible (no vendido por otro)
   - Descuenta VAL del comprador
   - Acredita VAL al vendedor: `precio * 0.95` (5% tax)
   - Transfiere item al inventario del comprador
   - Marca listing como `vendido`
3. **Emite WS**: `marketplace:sold` → notifica a vendedor y comprador
4. Frontend:
   - Comprador: Actualiza inventario + balance VAL + toast "¡Compra exitosa!"
   - Vendedor (si está online): Toast "Tu item 'Espada de Fuego' se vendió por 950 VAL"

### 4. Expiración (si no se vende)
- **Cron job**: Cada 5 minutos marca listings con `fechaExpiracion` pasada como `expirado`
- Item devuelto al inventario del vendedor
- **Emite WS**: `marketplace:cancelled` → `{ listingId, reason: 'expired' }`
- Frontend (vendedor online): Toast "Tu publicación expiró. Item devuelto a tu inventario."

---

## WebSocket Events

### marketplace:new
```json
{
  "event": "marketplace:new",
  "data": {
    "listingId": "...",
    "itemId": "...",
    "sellerId": "...",
    "precio": 1000,
    "item": { "nombre": "Espada de Fuego", "categoria": "equipment" }
  }
}
```
**Acción Frontend**: Refrescar listado de marketplace (si el usuario está en esa vista).

### marketplace:sold
```json
{
  "event": "marketplace:sold",
  "data": {
    "listingId": "...",
    "buyerId": "...",
    "sellerId": "...",
    "precio": 1000,
    "comision": 50
  }
}
```
**Acción Frontend**:
- Si `userId === sellerId`: Toast "¡Tu item se vendió por X VAL!" + actualizar balance
- Si `userId === buyerId`: Toast "Compra exitosa" + actualizar inventario

### marketplace:cancelled
```json
{
  "event": "marketplace:cancelled",
  "data": {
    "listingId": "...",
    "reason": "expired" | "seller_cancel"
  }
}
```
**Acción Frontend**: Remover listing de la vista; si `reason === 'expired'` → toast al vendedor.

---

## Errores Comunes

| Código | Causa | Acción Frontend |
|--------|-------|-----------------|
| **401** | Token inválido o expirado | Redirigir a login |
| **403** | Sin permisos (ej: cancelar listing ajeno) | Toast "No tienes permisos" |
| **404** | Listing no encontrado o ya vendido | Toast "Item ya no disponible" + refrescar listado |
| **409** | Fondos insuficientes / Item ya comprado | Toast "Fondos insuficientes" o "Otro usuario compró primero" |
| **429** | Rate limit excedido | Backoff (ver `ERRORS_AND_LIMITS.md`) |

---

## Snippets de Código

### React Hook: useMarketplace
```tsx
// hooks/useMarketplace.ts
import { useState, useCallback } from 'react';
import { useApi } from './useApi';

interface ListingFilters {
  category?: 'equipment' | 'consumable';
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export function useMarketplace() {
  const { get, post, patch, loading, error } = useApi();
  const [listings, setListings] = useState([]);

  const getListings = useCallback(async (filters: ListingFilters = {}) => {
    const params = new URLSearchParams(filters as any).toString();
    const data = await get(`/api/marketplace/listings?${params}`);
    setListings(data.listings);
    return data;
  }, [get]);

  const listItem = useCallback(async (itemId: string, precio: number, duracion_horas: number) => {
    return post('/api/marketplace/list', { itemId, precio, duracion_horas });
  }, [post]);

  const buyItem = useCallback(async (listingId: string) => {
    return post(`/api/marketplace/buy/${listingId}`, {});
  }, [post]);

  const cancelListing = useCallback(async (listingId: string) => {
    return post(`/api/marketplace/cancel/${listingId}`, {});
  }, [post]);

  const updatePrice = useCallback(async (listingId: string, nuevoPrecio: number) => {
    return patch(`/api/marketplace/${listingId}/price`, { nuevoPrecio });
  }, [patch]);

  const getMyHistory = useCallback(() => 
    get('/api/marketplace-transactions/my-history'), [get]);

  return {
    listings,
    getListings,
    listItem,
    buyItem,
    cancelListing,
    updatePrice,
    getMyHistory,
    loading,
    error,
  };
}
```

### WebSocket Listener (React)
```tsx
// components/MarketplaceScreen.tsx
import { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

function MarketplaceScreen() {
  const { user, token } = useAuth();
  const { on, connected } = useWebSocket(token);
  const { getListings } = useMarketplace();

  useEffect(() => {
    if (!connected) return;

    const unsubNew = on('marketplace:new', (data: any) => {
      console.log('Nuevo item listado:', data);
      getListings(); // Refrescar listado
    });

    const unsubSold = on('marketplace:sold', (data: any) => {
      if (data.sellerId === user?.id) {
        toast.success(`¡Tu item se vendió por ${data.precio} VAL!`);
        // updateBalance();
      } else if (data.buyerId === user?.id) {
        toast.success('¡Compra exitosa!');
        // updateInventory();
      }
    });

    const unsubCancelled = on('marketplace:cancelled', (data: any) => {
      if (data.reason === 'expired') {
        toast('Tu publicación expiró. Item devuelto.');
      }
      getListings(); // Refrescar
    });

    return () => {
      unsubNew();
      unsubSold();
      unsubCancelled();
    };
  }, [connected, on, user]);

  return <div>...</div>;
}
```

---

## Checklist de Implementación

- [ ] **Vistas UI**:
  - [ ] Listado de items en venta (con filtros y paginación)
  - [ ] Detalle de listing (stats, precio, tiempo restante)
  - [ ] "Mis Publicaciones" (items que el usuario tiene en venta)
  - [ ] Historial de transacciones (compras + ventas)
- [ ] **Acciones**:
  - [ ] Publicar item (formulario: precio + duración)
  - [ ] Comprar item (confirmación + manejo de errores 409/404)
  - [ ] Cancelar publicación
  - [ ] Actualizar precio de un listing activo
- [ ] **WebSocket**:
  - [ ] Listeners configurados para `marketplace:new|sold|cancelled`
  - [ ] UI reactiva (refrescar listados, actualizar balance/inventario)
- [ ] **Manejo de Errores**:
  - [ ] 401/403 → Redirigir o mostrar mensaje
  - [ ] 404 → "Item ya no disponible"
  - [ ] 409 → "Fondos insuficientes" o "Otro usuario compró primero"
  - [ ] 429 → Backoff exponencial

---

## Notas Adicionales

- **Tax del 5%**: Es un VAL sink. El 5% desaparece del sistema para controlar inflación.
- **Expiración automática**: Cada 5 min un cron job marca listings expirados. No requiere intervención del frontend.
- **Atomicidad**: El backend usa transacciones Mongoose para evitar condiciones de carrera (double-spending).
