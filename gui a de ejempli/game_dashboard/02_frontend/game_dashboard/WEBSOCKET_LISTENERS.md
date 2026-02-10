# Guía Rápida de Listeners WebSocket (Frontend React)

**Framework**: React + TypeScript

Base: usar `socket.io-client` y un hook `useWebSocket` centralizado.

## Eventos confirmados
- `chat:message:new`: actualiza feed de chat.
- `marketplace:item:listed|sold|cancelled`: refrescar listados y notificar.
- `survival:wave:new|end`: HUD de supervivencia.
- `character:level-up`: banner + refrescar stats locales.
- `character:evolved`: modal/alerta y recarga de ficha.
- `notification:new|read`: badge y centro de notificaciones.
- `payments:status`: estado de compra (toast + redirect si aplica).
 - `payments:status`: estado de compra (toast + redirect si aplica).

### Payloads de referencia
- payments:status
```json
{ "status": "confirmed", "externalPaymentId": "ext-1", "userId": "...", "valRecibido": 100 }
```
- notification:new
```json
{ "_id": "...", "title": "...", "message": "...", "type": "system_announcement", "isRead": false, "createdAt": "..." }
```
- notification:read
```json
{ "userId": "507f1f77bcf86cd799439011", "notificationId": "..." }
```
- character:level-up
```json
{ "userId":"...","characterId":"char-1","level":2,"levelsGained":1,"statsDelta":{ "atk":2,"defensa":2,"vida":10 }}
```
- character:update
```json
{ "userId":"...","characterId":"char-1","type":"EXP_GAIN","nivel":2,"experiencia":60,"stats":{"atk":12, "defensa":7, "vida":110}}
```
- survival:end
```json
{ "sessionId":"...","lastWave":5,"durationMs":123456,"summary":{"totalPoints":999} }
```

### Payments: estado de pagos (confirmado)

Payload:
```json
{
  "provider": "mock|blockchain|stripe",
  "state": "initiated|pending|confirmed|failed|refunded",
  "meta": {
    "externalPaymentId": "ext-1",
    "purchaseId": "p1",
    "onchainTxHash": "0xabc"
  }
}
```

Notas backend:
- El webhook ahora acepta cuerpo crudo (Buffer) y JSON anidado `{ type:"Buffer", data:[...] }`.
- En `succeeded`, acredita VAL, crea `UserPackage`, emite `payments:status=confirmed` y `notification:new` con `type='system_announcement'`.

---

## Hook useWebSocket (React)

```tsx
// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast'; // o tu librería de toasts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useWebSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('WebSocket conectado');
    });

    socket.on('auth:success', () => {
      setConnected(true);
    });

    socket.on('auth:error', (error) => {
      console.error('Auth WebSocket error:', error);
      setConnected(false);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Función para suscribirse a eventos
  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  return { socket: socketRef.current, connected, on };
}
```

---

## Hook usePaymentStatus (React)

```tsx
// hooks/usePaymentStatus.ts
import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { toast } from 'react-hot-toast';

interface PaymentStatus {
  provider: 'mock' | 'blockchain' | 'stripe';
  state: 'initiated' | 'pending' | 'confirmed' | 'failed' | 'refunded';
  meta?: {
    externalPaymentId?: string;
    purchaseId?: string;
  };
}

export function usePaymentStatus(token: string | null, onConfirmed?: () => void) {
  const { on, connected } = useWebSocket(token);

  useEffect(() => {
    if (!connected) return;

    const unsubscribe = on<PaymentStatus>('payments:status', (data) => {
      switch (data.state) {
        case 'initiated':
        case 'pending':
          toast.loading('Pago en proceso...');
          break;
        case 'confirmed':
          toast.success('¡Pago confirmado! VAL acreditado');
          onConfirmed?.();
          break;
        case 'failed':
          toast.error('Pago fallido. Intenta nuevamente.');
          break;
        case 'refunded':
          toast('Pago reembolsado');
          break;
      }
    });

    return unsubscribe;
  }, [connected, on, onConfirmed]);
}
```

---

## Uso en Componentes React

```tsx
// components/GameDashboard.tsx
import { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

function GameDashboard() {
  const { token } = useAuth();
  const { on, connected } = useWebSocket(token);

  useEffect(() => {
    if (!connected) return;

    // Character level up
    const unsubLevelUp = on('character:level-up', (data: any) => {
      toast.success(`¡Nivel ${data.level}! (+${data.levelsGained})`);
      // Actualizar estado local del personaje
    });

    // Character evolved
    const unsubEvolved = on('character:evolved', (data: any) => {
      toast.success(`¡${data.characterName} evolucionó!`);
    });

    // Notifications
    const unsubNotif = on('notification:new', (data: any) => {
      toast(data.title);
    });

    // Marketplace updates
    const unsubMarket = on('marketplace:item:sold', (data: any) => {
      toast.success(`¡Tu item se vendió por ${data.precio} VAL!`);
    });

    // Cleanup
    return () => {
      unsubLevelUp();
      unsubEvolved();
      unsubNotif();
      unsubMarket();
    };
  }, [connected, on]);

  return (
    <div>
      {connected ? '🟢 Conectado' : '🔴 Desconectado'}
      {/* ... resto del dashboard */}
    </div>
  );
}
```

---

## Survival WebSocket Events

```tsx
// components/SurvivalGame.tsx
import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

function SurvivalGame({ sessionId }: { sessionId: string }) {
  const { on, connected } = useWebSocket(token);
  const [currentWave, setCurrentWave] = useState(1);

  useEffect(() => {
    if (!connected) return;

    const unsubWaveNew = on('survival:wave:new', (data: any) => {
      setCurrentWave(data.waveNumber);
      // Spawn enemies, etc.
    });

    const unsubWaveEnd = on('survival:wave:end', (data: any) => {
      // Mostrar resumen de oleada
    });

    const unsubEnd = on('survival:end', (data: any) => {
      // Mostrar pantalla de resultados
      console.log('Puntos totales:', data.summary.totalPoints);
    });

    return () => {
      unsubWaveNew();
      unsubWaveEnd();
      unsubEnd();
    };
  }, [connected, on]);

  return <div>Oleada: {currentWave}</div>;
}
```

---

## Compatibilidad legacy
- Marketplace mantiene `marketplace:update` durante transición; escuchar ambos si es necesario.
- Chat legacy `chat:message` puede seguir emitiéndose; priorizar `chat:message:new`.
