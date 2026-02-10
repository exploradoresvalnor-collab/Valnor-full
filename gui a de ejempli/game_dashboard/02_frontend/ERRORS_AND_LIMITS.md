# Errores y Rate Limiting

## Formato de Error
- Estructura estándar: `{ error: string, code?: string, message?: string }`
- 400: validación
- 401: no autenticado
- 403: no autorizado
- 404: no encontrado
- 409: conflicto
- 429: rate limit excedido
- 500: error interno

## Rate Limiting
- Respuesta 429: respetar backoff (ej. 1s, 2s, 4s)
- Cabeceras:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Recomendaciones Frontend
- Retries idempotentes solo en 5xx/429 (con backoff exponencial y jitter)
- Validar entradas antes de enviar
- Mostrar mensajes claros según código HTTP

## Ejemplos
```ts
try {
  const res = await fetch(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${jwt}` }});
  if (!res.ok) {
    if (res.status === 429) {
      // aplicar backoff
    }
    const err = await res.json();
    throw new Error(err.error || 'Error de red');
  }
  const data = await res.json();
} catch (e) {
  // UI feedback
}
```

## Casos comunes – Tienda/Paquetes
- Abrir paquete (`POST /userPackages/open`):
  - 401: token inválido o expirado.
  - 404: sin paquetes pendientes.
  - 409: contención por lock (intentar nuevamente tras 500–1500ms con jitter).
  - 429: aplica backoff. Lee cabeceras `X-RateLimit-*` para planificar reintentos.

## Casos comunes – Marketplace
- Comprar item (`POST /marketplace/buy/:listingId`):
  - 400: fondos insuficientes o listing expirado.
  - 404: listing no encontrado.
  - 409: listing ya vendido (race condition).
  - 429: rate limit en transacciones.

## Casos comunes – Survival
- Iniciar sesión (`POST /survival/start`):
  - 400: ya tienes una sesión activa.
  - 409: servidor ocupado, retry con backoff.
- Canjear puntos (`POST /survival/exchange-points/*`):
  - 400: puntos insuficientes.
  - 429: límite de canjes por hora.

## Casos comunes – Dungeons
- Iniciar dungeon (`POST /dungeons/:dungeonId/start`):
  - 404: dungeon no existe.
  - 409: ya tienes una sesión activa.
- Progreso (`GET /dungeons/:dungeonId/progress`):
  - 404: sesión no encontrada o expirada.

## Casos comunes – Auth
- Login (`POST /auth/login`):
  - 400: credenciales inválidas.
  - 429: demasiados intentos fallidos.
- Registro (`POST /auth/register`):
  - 409: email ya registrado.
  - 429: límite de registros por IP.
