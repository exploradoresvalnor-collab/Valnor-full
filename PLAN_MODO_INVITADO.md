# Plan de Implementación: Modo Invitado Mejorado

## Objetivo
Permitir que los usuarios invitados puedan jugar completamente (equipos, inventario, mazmorras, supervivencia) mientras restringen el acceso al marketplace y compras, diferenciando profesionalmente entre modo invitado y autenticado.

## Contexto Actual
- **GuestAccessGuard.tsx**: Bloquea rutas para equipos, inventario, mazmorra y supervivencia para invitados.
- **Páginas afectadas**: Teams.tsx, Inventory.tsx, Dungeon.tsx, Survival.tsx tienen restricciones.
- **Estado**: Invitados pueden ver pero no interactuar con elementos clave del juego.

## Checklist de Implementación

### Fase 1: Actualización de Guards y Acceso
- [x] Modificar `GuestAccessGuard.tsx` para permitir acceso a rutas de gameplay (teams, inventory, dungeon, survival)
- [x] Mantener bloqueo para marketplace y shop
- [x] Actualizar matriz de acceso GUEST_ACCESS_MATRIX

### Fase 2: Sistema de Datos Demo
- [x] Crear servicio de datos demo para invitados (personajes básicos, items iniciales)
- [x] Implementar localStorage para progreso temporal de invitados
- [x] Modificar servicios para cargar datos demo vs reales basado en modo

### Fase 3: Actualización de Páginas
- [x] **Teams.tsx**: Permitir armado de equipos con datos demo para invitados
- [x] **Inventory.tsx**: Permitir equipamiento con items demo
- [x] **Dungeon.tsx**: Permitir entrada a mazmorras con progreso temporal
- [x] **Survival.tsx**: Permitir modo supervivencia con datos demo
- [x] **Dashboard.tsx**: Corregir navegación a dungeons configurando modo correctamente
- [ ] **Shop.tsx**: Mantener banner de solo vista para invitados
- [ ] **Marketplace.tsx**: Mantener bloqueo completo

### Fase 4: Persistencia Temporal
- [x] Implementar guardado automático en localStorage para progreso de invitados
- [x] Crear sistema de limpieza al cambiar de modo o cerrar sesión
- [x] Asegurar que datos demo no interfieran con usuarios autenticados

### Fase 5: Testing y Validación
- [x] Probar flujo completo como invitado
- [x] Verificar restricciones de marketplace
- [x] Validar persistencia temporal
- [x] Ejecutar build y tests

### Fase 6: Documentación
- [x] Actualizar documentación de modo invitado
- [x] Agregar notas sobre diferenciación guest/auth

## Notas Técnicas
- Usar Zustand stores para estado de sesión
- Mantener separación clara entre datos demo y reales
- Implementar loading states apropiados
- Considerar UX para transición guest -> auth

## Estado Actual
- ✅ Análisis completado
- ✅ Plan creado
- ✅ Implementación completada
- ✅ Build validado
- ✅ Modo invitado mejorado listo para testing