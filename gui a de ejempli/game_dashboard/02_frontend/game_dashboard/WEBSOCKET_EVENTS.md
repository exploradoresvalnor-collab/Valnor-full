# 📡 Especificación Completa de Eventos WebSocket

**Última actualización:** 1 de diciembre 2025
**Estado:** Draft inicial (auditoría completa)

---
## 1. Objetivos
Unificar nomenclatura, payloads y flujos de suscripción para todos los eventos tiempo real necesarios en el frontend. Minimizar eventos genéricos difusos y maximizar semántica clara y diferenciales por dominio.

---
## 2. Convenciones de Nombres
```
<dominio>:<subdominio>[::<acción>]
```
- Separador principal: `:`
- Acciones adicionales: `:` extra o usar sufijos `:update`, `:new`, `:error`, `:removed`, `:completed`.
- Evitar plural inconsistente. Usar singular donde representa entidad puntual (character:update) y plural donde es colección (rankings:update).

Prefijos reservados:
- auth:*  → autenticación de socket / sesión
- chat:*  → mensajería y salas
- marketplace:* → listados y transacciones
- inventory:* → cambios de inventario propio
- character:* → cambios directos a un personaje
- survival:* → sesión survival (oleadas, finalización)
- battle:* → combates instanciados (PvP/Arena/Survival internos)
- rankings:* → cambios globales en tablas de posiciones
- notification:* → notificaciones push
- achievement:* → logros nuevos
- payments:* → estados de procesos de compra
- feedback:* → recepción de feedback
- system:* → mantenimiento / anuncios / deploy

---
## 3. Eventos Actuales en Código (Detectados)
| Evento | Tipo | Alcance | Origen | Observaciones |
|--------|------|---------|--------|---------------|
| auth:success | simple | socket individual | realtime.service | OK
| auth:error | error | socket individual | realtime.service | Usar payload normalizado { message }
| chat:history | batch | socket individual (inicio) | chat.service | Limitar tamaño (paginación futura)
| chat:error | error | socket individual | chat.service | Estándar { code?, message }
| chat:message | stream | sala/global | chat.service | Renombrar a chat:message:new para semántica
| chat:private | stream | socket destino | chat.service | Mantener
| inventory:update | delta | socket usuario | realtime.service | Payload actual genérico
| reward:received | event | socket usuario | realtime.service | Considerar unir a inventory:update con tipo "reward"
| character:update | delta | socket usuario | realtime.service | OK
| marketplace:update | mixed | global | realtime.service | Desglosar en eventos específicos (ver sección 5)
| game:event | generic | global | realtime.service | Demasiado genérico, migrar a system:event o dominio específico
| rankings:update | batch | global | realtime.service | OK (añadir diff y timestamp)
| battle:update | delta | sala battle | realtime.service | OK (crear convención room: battle:<battleId>)

---
## 4. Propuesta de Normalización y Nuevos Eventos
### 4.1 Auth
| Evento | Payload | Trigger |
|--------|---------|---------|
| auth:success | { userId } | Validación token OK |
| auth:error | { message, code? } | Token inválido |
| auth:token:refresh | { expiresAt } | Renovación si se implementa |

### 4.2 Chat
| Evento | Payload | Trigger |
|--------|---------|---------|
| chat:message:new | { id, senderId, senderName, content, type, createdAt } | Mensaje global/room creado |
| chat:message:deleted | { id } | Moderación/borrado |
| chat:private | { id, fromUserId, toUserId, content, createdAt } | PM enviado |
| chat:error | { message, code? } | Límite o validación |

### 4.3 Marketplace
| Evento | Payload | Trigger |
|--------|---------|---------|
| marketplace:item:listed | { listingId, itemId, sellerId, precio, createdAt } | Listado creado |
| marketplace:item:sold | { listingId, buyerId, sellerId, precio, soldAt } | Venta exitosa |
| marketplace:item:cancelled | { listingId, sellerId, cancelledAt } | Cancelación |
| marketplace:refresh | { timestamp } | Reindex / limpieza expirados |

### 4.4 Inventory / Rewards
| Evento | Payload | Trigger |
|--------|---------|---------|
| inventory:update | { equipment[], consumables[], delta? } | Cambio significativo (añadir/quitar) |
| reward:received | { type, value, source, createdAt } | Recompensa directa (logro, dungeon, survival) |

### 4.5 Characters
| Evento | Payload | Trigger |
|--------|---------|---------|
| character:update | { characterId, changes, updatedAt } | Cambio genérico stats |
| character:level-up | { characterId, oldLevel, newLevel, rewards? } | Subida de nivel |
| character:evolved | { characterId, oldStage, newStage } | Evolución |

### 4.6 Survival
| Evento | Payload | Trigger |
|--------|---------|---------|
| survival:wave:new | { sessionId, waveNumber, enemiesRemaining, timestamp } | Oleada completada → siguiente |
| survival:enemy:defeated | { sessionId, enemyId, waveNumber } | Enemigo eliminado |
| survival:end | { sessionId, totalWaves, durationMs, rewards } | Fin sesión |
| survival:session:update | { sessionId, state, hpRemaining, waveNumber } | Tick periódico opcional |

### 4.7 Battle / Arena / PvP
| Evento | Payload | Trigger |
|--------|---------|---------|
| battle:update | { battleId, state, turn, characters[] } | Cambio turno/acción |
| battle:end | { battleId, winnerId, rewards? } | Conclusión |
| arena:challenge:received | { challengeId, fromUserId, toUserId, createdAt } | Reto emitido |
| arena:challenge:accepted | { challengeId } | Aceptación |
| arena:challenge:declined | { challengeId } | Rechazo |

### 4.8 Rankings / Achievements
| Evento | Payload | Trigger |
|--------|---------|---------|
| rankings:update | { category, entries[], generatedAt } | Recomputación tabla |
| achievement:unlocked | { achievementId, userId, title, points } | Nuevo logro |

### 4.9 Notifications
| Evento | Payload | Trigger |
|--------|---------|---------|
| notification:new | { id, type, message, createdAt } | Creación notificación |
| notification:read | { id, readAt } | Lectura individual |
| notification:bulk:read | { ids[], readAt } | Leer múltiples |

### 4.10 Payments
| Evento | Payload | Trigger |
|--------|---------|---------|
| payments:status | { paymentId, status, updatedAt } | Cambio estado stripe/web3 |
| payments:blockchain:pending | { tempId, walletAddress, amountUSDT } | Inicio stub |
| payments:blockchain:confirmed | { txHash, amountUSDT, creditedVal } | Verificación on-chain |
| payments:blockchain:error | { message, code? } | Error proceso |

### 4.11 Feedback & System
| Evento | Payload | Trigger |
|--------|---------|---------|
| feedback:received | { id, userId, category } | Nuevo feedback (opcional admin panel) |
| system:announcement | { id, level, message, createdAt } | Mensaje global |
| system:maintenance | { windowStart, windowEnd, message } | Aviso mantenimiento |
| system:version:deploy | { version, deployedAt } | Deploy backend nuevo |

---
## 5. Migración de marketplace:update
Reemplazar `marketplace:update { type }` por eventos dedicados:
- Al listar → `marketplace:item:listed`
- Al vender → `marketplace:item:sold`
- Al cancelar → `marketplace:item:cancelled`
- Cron expiración → `marketplace:refresh`

Backward compatibility: mantener emisión antigua paralela durante 1 sprint.

---
## 6. Salas (Rooms) Recomendadas
| Room | Uso |
|------|-----|
| user:<userId> | Comunicación privada (inventario, rewards, personajes, notificaciones) |
| global | Mensajes globales, anuncios |
| battle:<battleId> | Estado de batalla en tiempo real |
| survival:<sessionId> | Tick sesión survival (opcional) |
| marketplace | (Opcional) separar eventos marketplace si se requiera unsub |

---
## 7. Payload Estándar
Incluir siempre:
- `timestamp` ISO string
- `version` (opcional, evento spec versión)
- `traceId` (opcional debugging futuro)

Errores:
```json
{
  "event": "chat:error",
  "message": "Limite excedido",
  "code": "RATE_LIMIT",
  "timestamp": "2025-12-01T12:34:56.000Z"
}
```

---
## 8. Seguridad y Rate Limiting
- Validar token antes de unirse a rooms privadas.
- Emitir máximo N eventos por usuario por ventana para chat y feedback.
- Colas debounce para eventos muy frecuentes (battle:update, survival:enemy:defeated).

---
## 9. Prioridad de Implementación
1. Renombrar `chat:message` → `chat:message:new` (alias legacy ya activo).
2. Desglosar marketplace:update (item:listed, item:sold, item:cancelled) ✅ implemented.
3. survival:wave:new ✅ y survival:end (emitido al cerrar sesión) ✅.
4. payments:status y blockchain:* (cuando exista lógica real).
5. notification:new y achievement:unlocked.
6. character:level-up, character:evolved.
7. system:announcement / system:version:deploy.

---
## 10. Checklist de Adopción (Estado Actual)
```
[x] Refactor chat.service: emitir chat:message:new + legacy chat:message
[x] Desglosar marketplace:update → marketplace:item:listed|sold|cancelled (mantener legacy)
[x] Implementar emisión survival:wave:new en survival service
[x] Implementar emisión survival:end al cerrar sesión
[ ] Actualizar websocket-events.ts en frontend con nueva lista
[ ] Añadir notifyAchievementUnlocked en logro service
[ ] Añadir notifyPaymentStatus en webhook Stripe
[ ] Añadir notifyBlockchainPayment cuando se confirme tx real
[ ] Documentar en ORDENES_DESARROLLADOR.md (WebSocket sección) (parcial)
```

---
## 11. Versiónado de la Especificación
Incrementar `specVersion` en frontend constante cuando se agreguen nuevos eventos o se retiren alias.

---
## 12. Próximos Pasos
- Implementar capa de pruebas socket (mock io) para asegurar emisión correcta.
- Agregar métricas (contador eventos/min) para tuning.

---
**Fin del documento.**
