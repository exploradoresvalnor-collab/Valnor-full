# Auditoría Frontend ↔ Backend — Valnor-full

> Documento de seguimiento de todas las correcciones realizadas comparando el frontend con el backend (`gui a de ejempli/valgame-backend`).

---

## Sesión 8 — Parte 7: Teams.tsx + PWA

| Archivo | Problema | Corrección |
|---------|----------|------------|
| `src/pages/Teams/Teams.tsx` | `handleSave` enviaba `personajeId` (string) al POST `/api/teams`, pero el backend espera MongoDB `_id` (ObjectId) | Mapeado `personajeId` → `_id` vía `allCharacters` antes de enviar |
| `vite.config.ts` | PWA workbox fallaba al cachear archivos >2MB | Añadido `maximumFileSizeToCacheInBytes: 4 * 1024 * 1024` |

---

## Sesión 8 — Parte 8: Auditoría masiva de servicios REST

### inventory.service.ts
| Método | Problema | Corrección |
|--------|----------|------------|
| `getEquipmentCatalog()` | Backend devuelve array plano, frontend esperaba `{equipment:[]}` | Maneja ambos formatos |
| `getConsumablesCatalog()` | Idem | Idem |
| `getMyEquipment()` | Idem | Idem |
| `getMyConsumables()` | Idem | Idem |
| `getItemsCatalog()` | Idem | Idem |

### combat.service.ts
| Método | Problema | Corrección |
|--------|----------|------------|
| `attack()` | Enviaba `{sessionId, targetId, skillId}` | Cambiado a `{combateId, characterId}` |
| `defend()` | Enviaba `{sessionId}` | Cambiado a `{combateId, characterId}` |
| `endCombat()` | Enviaba `{sessionId}` | Cambiado a `{combateId, characterId, resultado}` |

### marketplace.service.ts
| Método | Problema | Corrección |
|--------|----------|------------|
| `listItem()` | DTO enviaba `{itemId, priceVal}` | Cambiado a `{itemId, precio, descripcion?}` |

### shop.service.ts
| Método | Problema | Corrección |
|--------|----------|------------|
| `buyVal()` | Enviaba `{amount}` | Cambiado a `{packageId}` |
| `purchase()` | Enviaba `{packageId, quantity}` | Cambiado a `{purchaseType, amount}` |
| Catálogos | Esperaban objetos wrapeados | Manejan arrays planos |

### survival.service.ts
| Método | Problema | Corrección |
|--------|----------|------------|
| `startSession()` | `consumables` | Renombrado a `consumableIds` |
| `completeWave()` | `enemiesKilled` | Cambiado a `{waveNumber, enemiesDefeated, damageDealt}` |
| `pickupDrop()` | `dropId` | Cambiado a `{itemId, itemType, itemValue?}` |
| `endSession()` | 1 campo | Ahora envía `{finalWave, totalEnemiesDefeated, totalPoints, duration}` |
| `exchangeForItem()` | Faltaba `itemType` | Ahora envía `{points, itemType}` |

### user.service.ts
| Método | Problema | Corrección |
|--------|----------|------------|
| `addCharacter()` | Enviaba `{characterId}` | Cambiado a `{personajeId, rango}` |
| `getUsers()` | Esperaba wrapper | Maneja array plano |

### payment.service.ts
| Método | Problema | Corrección |
|--------|----------|------------|
| `createCheckout()` | DTO era `{packageId, quantity, currency}` | Cambiado a `{paqueteId, valorUSDT}` |
| `confirmBlockchain()` | Faltaban campos | Añadidos `chain`, `amountUSDT` |

### feedback.service.ts
| Método | Problema | Corrección |
|--------|----------|------------|
| `list()` | Leía campo incorrecto | Lee `response.feedback \|\| response.feedbacks` |

### ranking.service.ts
| Método | Problema | Corrección |
|--------|----------|------------|
| `getGeneralRanking()` | Leía campo incorrecto | Lee `response.rankings \|\| response.ranking` |

### dungeon.service.ts
| Método | Problema | Corrección |
|--------|----------|------------|
| `getDungeons()` | Esperaba wrapper | Maneja array plano + wrapper |
| `getDungeon()` | Idem | Idem |

### character.service.ts
| Método | Problema | Corrección |
|--------|----------|------------|
| `getMyCharacters()` | Leía `.characters` | Ahora lee `.data \|\| .characters` |
| `damage()` | Enviaba `{amount}` | Cambiado a `{damage: amount}` |

---

## Sesión 8 — Parte 9: Auditoría Socket.IO + Chat

### socket.service.ts
| Problema | Corrección |
|----------|------------|
| 5 métodos muertos (`joinRoom`, `leaveRoom`, `sendChatMessage`, `sendPlayerPosition`, `sendCombatAction`) emitían eventos que el backend NO escucha | Eliminados. Documentado que socket es solo para recibir push |

### chat.service.ts
| Método | Problema | Corrección |
|--------|----------|------------|
| `getMessages()` | Backend devuelve `{data:[]}` no `{messages:[]}` | Normalizado: lee `response.data \|\| response.messages` |
| `sendGlobal()` | Esperaba `response.message` | Lee `response.data \|\| response.message` |
| `sendPrivate()` | Idem | Idem |
| `sendParty()` | Faltaba `partyId` + lectura incorrecta | Añadido `partyId` param + lee `response.data` |

### Problemas del BACKEND (no corregibles desde frontend)
- `ChatService` nunca se inicializa en `app.ts` → chat WebSocket no funciona
- `notifyResourceUpdate` no existe en `RealtimeService` → compras EVO/Boletos no notifican
- Auth post-conexión sin middleware → sockets reciben broadcasts antes de autenticarse
- `notifyBattleUpdate(playerId)` → sockets nunca se unen a salas `battle:*`
- `(req as any).user.userId` patrón roto en combat y marketplace controllers

---

## Sesión 8 — Parte 10: Auditoría profunda completa

### combat.service.ts — REESCRITURA de tipos de respuesta
| Problema | Corrección |
|----------|------------|
| Backend usa `exito` (ES), frontend esperaba `success` (EN) | Mapeado: `raw.exito ?? raw.success` |
| `attack()` backend devuelve `{ ataque: { dano, critico, ... } }`, frontend esperaba `{ log[], damage, enemyHp, playerHp }` | Nuevo `CombatActionResponse` lee `raw.ataque?.dano`, expone campo `raw` para acceso completo |
| `defend()` backend devuelve `{ defensa: { reduccionDano, estado, ... } }`, interfaz no coincidía | Nuevo tipo incluye `defensa` nativo |
| `endCombat()` backend devuelve `recompensas.experiencia/val`, frontend esperaba `expGanada/valGanado` | Mapeado explícito `experiencia → experiencia`, `val → val` + `raw` completo |
| Tipos `CombatEndResponse.stats` no existían en backend | Renombrado a `estadisticas: Record<string, unknown>` |

### ranking.service.ts — 6 métodos arreglados
| Método | Problema | Corrección |
|--------|----------|------------|
| `getLeaderboard()` | Backend devuelve `usuarios`, leía `ranking` | Lee `response.ranking \|\| response.usuarios` |
| `getRankingByPeriod()` | Backend devuelve `rankings` (plural), leía `ranking` (singular) | Lee `response.rankings \|\| response.ranking` |
| `getAllAchievements()` | Backend devuelve `logros`, leía `achievements` | Lee `response.logros \|\| response.achievements` |
| `getUserAchievements()` | Backend devuelve `logrosDesbloqueados`, leía `achievements` | Lee `response.logrosDesbloqueados \|\| response.logros \|\| response.achievements` |
| `unlockAchievement()` | Backend devuelve `{ exito, mensaje }`, frontend esperaba `{ success, message }` | Mapeado `exito → success`, `mensaje → message` |
| `getPublicProfile()` | Backend no wrappea en `.profile`, el objeto raíz ES el perfil | Lee `response.profile \|\| response` como fallback |

### marketplace.service.ts — 9 métodos arreglados
| Método | Problema | Corrección |
|--------|----------|------------|
| `listItem()` | Backend devuelve `{ exito }`, frontend esperaba `{ success }` | Mapeado `exito → success` |
| `buyItem()` | Backend devuelve `{ exito, transaccion }`, frontend esperaba `{ success, transaction }` | Mapeado `transaccion → transaction` |
| `cancelListing()` | Backend devuelve `{ exito, listing }`, frontend esperaba `{ success, message }` | Mapeado `exito → success`, `mensaje → message` |
| `getHistory()` | Backend devuelve `{ data: [] }` (es un stub), frontend leía `listings` | Lee `response.data \|\| response.listings` |
| `updatePrice()` | Backend devuelve `{ success, precio }`, frontend esperaba `{ success, listing }` | Tipo corregido a `{ success, precio? }` |
| `getMyTransactionHistory()` | Backend wrappea en `{ data: [...], pagination: { total } }`, frontend leía `transactions` | Lee `response.data \|\| response.transactions`, extrae `total` de `pagination` |
| `getMySales()` | Idem | Idem |
| `getMyPurchases()` | Idem | Idem |
| `getTransactionStats()` | Backend usa estructura ES `{ ventas: { totalVentas, ingresosBrutos }, compras: { totalCompras, gastoTotal } }`, frontend usaba campos EN | Mapeo explícito ES → EN: `totalVentas → totalSales`, `gastoTotal → totalSpent`, etc. |
| `getTransaction()` | Backend devuelve `{ data: Transaction[] }` (array), frontend esperaba un solo objeto | Toma `data[0]` del array |

### team.service.ts — 1 método arreglado
| Método | Problema | Corrección |
|--------|----------|------------|
| `activateTeam()` | Backend devuelve `{ success, message }` sin `.team`, frontend hacía `response.team` → undefined | Si `.team` no viene, hace `getTeam(teamId)` como fallback |

### gameConfig.service.ts — Documentación corregida
| Problema | Corrección |
|----------|------------|
| Documentación decía "todos GET públicos" | 3 endpoints (`categories`, `level-requirements`, `events`) están DESPUÉS de `checkAuth` en `app.ts` → son protegidos. Documentación actualizada |

### Verificaciones adicionales (sin errores)
| Componente | Estado |
|------------|--------|
| `auth.service.ts` | ✅ OK — Rutas correctas, maneja token en cookie httpOnly + body fallback |
| `api.service.ts` | ✅ OK — Wrapper HTTP limpio, `credentials: 'include'`, `Authorization: Bearer` |
| `character.service.ts` | ✅ OK — Ya corregido en parte 8 (`.data`, `{damage}`) |
| `dungeon.service.ts` | ✅ OK — Maneja arrays planos y wrapped |
| Páginas (Ranking, Marketplace, Teams, Dashboard) | ✅ OK — Acceso defensivo a respuestas con fallbacks múltiples |

### Problemas conocidos del BACKEND (frontend no puede arreglar)
| Problema | Impacto | Ubicación |
|----------|---------|-----------|
| `ChatService` nunca inicializado en `app.ts` | Chat WebSocket no funciona | `app.ts` |
| `notifyResourceUpdate` no existe en `RealtimeService` | Compras EVO/Boletos no notifican en tiempo real | `shop.controller.ts` |
| Auth post-conexión sin middleware | Sockets reciben broadcasts antes de autenticarse | `RealtimeService` |
| `notifyBattleUpdate(playerId)` → sockets nunca se unen a salas `battle:*` | Eventos combate no llegan | `CombatService` |
| `(req as any).user.userId` patrón roto | `req.user` es Mongoose doc (tiene `_id`, no `userId`) | `combat.controller`, `marketplace.controller` |
| Ruta duplicada `POST /api/dungeons/:id/start` | `dungeonRoutes` y `combatRoutes` definen la misma ruta | `app.ts` |
| `marketplace/history` es un stub | Devuelve array vacío siempre | `marketplace.controller` |
| Variables CORS inconsistentes | `FRONTEND_URL` vs `FRONTEND_ORIGIN` | `RealtimeService` vs `ChatService` |

### Desajustes de modelos/stores (no bloqueantes)
| Store | Problema | Impacto |
|-------|----------|---------|
| `dungeonStore` | Tipo `Dungeon` local ≠ tipo en `dungeon.types.ts` ≠ backend. Usa datos hardcodeados, no llama al servicio | **✅ RESUELTO** — Añadido `mapBackendDungeon()` y carga desde `dungeonService` con fallback |
| `playerStore` | Campos EN (`gold`, `gems`, `tickets`) ≠ campos ES del backend (`val`, `evo`, `boletos`) | **✅ RESUELTO** — Añadido `mapBackendPlayerData()` en `initPlayer()` |
| `teamStore` | `TeamMember` (EN) ≠ `TeamCharacter` del servicio (ES) | Bajo — ya existe `mapToTeamMember()` en mappers que debería usarse |
| `teamStore` | `useTeamPower()` usa fórmula de poder duplicada (no usa `calcCharacterPower()`) | **✅ VERIFICADO** — Ya usa `calcCharacterPower()` correctamente |

---

### Build final
```
✓ 1167 modules transformed
✓ built in 6.38s
PWA v1.2.0 — 72 entries precached
```

---

## Sesión 10 — Tests Unitarios y Mappers (11‑feb‑2026) ✅

**Framework añadido:** Vitest + jsdom para tests unitarios.

### Tests Implementados
| Archivo | Cobertura | Estado |
|---------|-----------|--------|
| `src/stores/__tests__/playerStore.test.ts` | Mapper ES→EN, initPlayer, gestión recursos | ✅ Pasan |
| `src/stores/__tests__/dungeonStore.test.ts` | Mapper backend, selección, requisitos entrada | ✅ Pasan |
| `src/stores/__tests__/teamStore.test.ts` | Gestión equipo, poder, líder | ✅ Pasan |

### Resultados
```
✅ All 24 tests passed
✅ TypeScript compilation successful  
✅ Build OK
✅ Mappers ES→EN implementados
✅ Fallbacks funcionando
```

### Cobertura de Tests
| Store | Tests | Estado | Funcionalidades |
|-------|-------|--------|----------------|
| `playerStore` | 6 ✅ | Completo | Mapper ES→EN, recursos, estado inicial |
| `dungeonStore` | 7 ✅ | Completo | Mapper backend, selección, requisitos |
| `teamStore` | 11 ✅ | Completo | Gestión equipo, poder, líder |

### Scripts Disponibles
```bash
npm run test:run    # Ejecutar todos los tests
npm run test:ui     # Interfaz visual de Vitest
npm run build       # Compilación TypeScript
```

---
