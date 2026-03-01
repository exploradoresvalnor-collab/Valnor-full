# Guía de Estilo UI - Botones Premium Valnor

Esta guía documenta el patrón de diseño utilizado para los botones ornatos del Splash Screen, diseñado para proyectar una estética de alta calidad (AAA) en juegos de fantasía.

## Estructura HTML (React)

Para que el CSS funcione, el botón debe tener contenedores para los ornamentos laterales:

```tsx
<button className="ornate-btn">
  <div className="btn-ornament ornate-left" />
  <span className="btn-label">Texto del Botón</span>
  <div className="btn-ornament ornate-right" />
</button>
```

## CSS Core (Tokens)

Utiliza estos colores para mantener la coherencia:
- `Gold`: `#c2a05d`
- `Gold Light`: `#fdf2c4`
- `Gold Dark`: `#6e4e1e`
- `Gold Glow`: `rgba(194, 160, 93, 0.45)`

## Lógica del Diseño

1. **Fondo Físico**: No usar colores planos. Usar `radial-gradient` para simular volumen (más claro en el centro).
2. **Triple Borde**:
    - Borde exterior sólido (`border`).
    - Borde interior tenue (`::before` con `inset: 2px`).
    - Borde de contraste (`::after` con `inset: -1px` y color oscuro).
3. **Bracketing (Ornamentos)**:
    - Se utilizan pseudoelementos `::before` y `::after` dentro de los contenedores `.btn-ornament` para crear las esquinas metálicas sin usar imágenes.
4. **Tipografía**: Fuente `Cinzel` con `letter-spacing` generoso (mínimo `0.12em`) y `text-transform: uppercase`.

## Comportamiento de Hover
- Aumentar la intensidad del `radial-gradient`.
- Inyectar un `box-shadow` con el color `Gold Glow`.
- Escalar ligeramente (`1.04`) y aplicar un pequeño `translateY(-2px)` para simular que el botón "flota" al ser seleccionado.

---
© 2025 ValGame Studio
