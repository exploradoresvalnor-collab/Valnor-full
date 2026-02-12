# Hi‑Fi — Maqueta: Barra Superior (Medieval)

## Resumen
Maqueta conceptual (alto nivel) para la barra superior con estilo medieval. Incluye layout, dimensiones, espaciado, estados y micro-interacciones (desktop y mobile).

---

## Layout general (Desktop)
- Altura topbar: 64px
- Grid: 3 columnas (left: logo; center: nav links; right: resources + energy + notifications + profile)
- Padding lateral: 24px

Orden (L → R):
1. Logo (escudo + "VALNOR")
2. Navigation links (Inicio, Jugar, Inventario, etc.) — pequeño y con indicador activo
3. Recursos (chips medallón): Gold, Gems
4. EnergyBar (escudo con fill horizontal y badge LLENO)
5. NotificationBell (campana de bronce con badge)
6. Profile (avatar circular + placa nivel + nombre)

---

## Componentes: especificación visual

### 1) Logo
- Tamaño: 36px alto
- Espacio a su derecha: 24px
- Estilo: escudo en SVG, texto en Cinzel con tracking -0.5

### 2) Nav links
- Tipo: compact
- Active: underline metálico o pequeño medallón dorado
- Hover: ligero glow dorado (opacity 0.12)

### 3) Resource chips (Gold / Gems)
- Tamaño contenedor: 44x44 px (circular medallón)
- Inner layout: icon (20px) + value (12–14px) a la derecha
- Estado animado en aumento: scale 1.06 + gold shine (200ms)
- Colors: gold chip BG: radial-gradient(white 0%, #C79A2A 60%) con border bronze

### 4) EnergyBar (escudo)
- Tamaño: 150px width x 36px height (desktop compact)
- Track: metal brushed background, rounded corners 8px
- Fill: gradient from gold to amber; animate width on change
- Badge: small ribbon overlay when full ("✓ LLENO")
- Tooltip: parchment card on hover with time and short help text

### 5) NotificationBell
- Icon: bronze bell (SVG)
- Badge: red burn #A83B2F; show max '99+'
- Dropdown: parchment card with rounded corners and subtle border; scrollable list max-height 320px

### 6) Profile
- Avatar size: 40px
- Level plate: small bronze plate (Lv.{n}) bottom-right overlap
- Dropdown: list with links (Mi Perfil, Inventario, Logout)

---

## Mobile variant
- Topbar height: 56px
- Show: Logo left, energy (compact) center, icons: notifications + profile right
- Resource chips condensed into a single "recursos" mini-menu (tap opens overlay)
- Hamburger shows full navigation + resources + actions

---

## Micro-interactions (especificación)
- Resource received: pulse animation (scale 1.06) + glow fade (opacity 0.3) — duration 250ms
- Energy regen approaching: subtle breathing glow on fill (period 1500ms)
- Dropdown open: slide + fade (duration 180–220ms)
- Badges: appear with small vertical bounce (translateY -6px) + easing cubic

---

## Accessibility
- Each interactive control: aria-label and role
- Badges announce counts: aria-live polite when updating
- Keyboard nav: tab focus, enter to activate, esc to close menus
- Contrast: ensure number text contrast vs chip background >= WCAG AA

---

## Assets sugeridos (lista)
- `svg/valnor-shield.svg` (logo)
- `svg/gold-coin.svg`, `svg/gem.svg`, `svg/bell-bronze.svg`, `svg/avatar-frame.svg`
- Textures: `img/parchment-1.jpg`, `img/brushed-metal-1.jpg` (optimizar)

---

## Mockup (ASCII / wire-like) — Desktop (anchura > 1280px)

[LOGO]    [Inicio] [Jugar] [Inventario] [Tienda]          [🪙 100] [💎 10] [shield  █████  3:45] [🔔 3] [ (Avatar) Lv.7 Username ▼ ]

*Donde* [shield █████ 3:45] es un bloque con la barra de energía y contador de regeneración al lado.

---

## Checklist visual para QA
- [ ] Tipografías correctas (Cinzel para números/títulos)
- [ ] Paleta aplicada (tokens CSS ver moodboard)
- [ ] Animaciones sutiles implementadas y no distraen del gameplay
- [ ] Mobile: recursos comprimidos en overlay
- [ ] Badges y tooltips accesibles (aria, contrast)

---

## Entregables listos para dev
- Archivos: moodboard (MD), Hi‑Fi spec (este MD), assets list
- Siguientes: generar PNGs / Figma frames si quieres que los haga (puedo crear imágenes estáticas en el repo)

---

"Siguiente paso" sugerido: genero el **moodboard en imágenes** (PNG) o maquetas visuales (PNG/Sketch/Figma frames). ¿Cuál prefieres?