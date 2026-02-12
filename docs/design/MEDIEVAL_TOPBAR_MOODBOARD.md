# Moodboard — Barra Superior (Estilo Medieval)

## Objetivo
Crear una identidad visual medieval para la barra superior del dashboard ("topbar") que refuerce la atmósfera del juego sin sacrificar legibilidad ni accesibilidad.

---

## Paleta de colores (tokens)
- Primary Gold: #C79A2A  (uso: monedas, acentos, highlights)
- Gem Purple: #7B3FA0   (uso: gems, botones de acción secundaria)
- Bronze Dark: #5B3E21  (bordes, iconos metálicos)
- Parchment: #F6EBD8 (opacidad sugerida 0.85) (fondo de tooltips/menus)
- Metal Highlight: #E0C88A (sutilezas de brillo)
- Alert Burn: #A83B2F (badges de notificaciones)
- Text Primary: #F5F2EB
- Text Secondary: #D6C7B0

### Variables (ejemplo)
- --topbar-bg: rgba(246,235,216,0.92);
- --accent-gold: #C79A2A;
- --accent-gem: #7B3FA0;
- --metal-bronze: #5B3E21;
- --text-primary: #F5F2EB;

---

## Tipografías
- Headline / Numbers: Cinzel / Cinzel Decorative (estilo serif con remates, carácter medieval)
- Body / Labels: EB Garamond o Merriweather (legibilidad y estética clásica)
- Fallbacks: 'Georgia', 'serif' (para sistemas sin webfont)

**Tamaños recomendados**
- Números (recursos): 14–16px (peso 600)
- Texto secundario: 12–13px
- Botones / chips: 13–14px

---

## Texturas y materiales (dirección)
- Parchment (papel pergamino) muy sutil como base de tooltips y dropdowns.
- Metal bruñido y bronce para bordes y marcos de chips (uso ligero, no saturar).
- Vetado de madera muy tenue bajo la barra para contexto si se desea (opcional).

---

## Iconografía y símbolos
- Iconos facetados para gems.
- Medallón / disco para金币 (oro) con relieve.
- Campana de bronce ornamentada para notificaciones.
- Avatar en marco circular con placa de nivel (pequeña placa metálica superpuesta).

Recomendación: usar iconos SVG con trazos simples y sombreado baked (no imágenes raster grandes).

---

## Textos / microcopy propuesto
- Gold: "100" → label aria "100 monedas"
- Gems: "10" → aria "10 gemas"
- Energy tooltip: "+1 en 4:30" → aria "1 energía en 4 minutos 30 segundos"
- Notif badge: "3" → aria "3 notificaciones sin leer"

---

## Ejemplos visuales a buscar (referencias)
- Ilustraciones de escudos medievales, medallones y ornamentos (para moodboard)
- Botones con borde metálico y brillo sutil
- Tipografía agresiva para números (Cinzel) + serif legible para labels

---

## Recursos y assets sugeridos
- Pack de texturas "parchment", "brushed-metal" y "wood-grain" (baja resolución para web, optimizados)
- SVGs para moneda, gema, campana, avatar rim

---

## Notas finales
- Mantener equilibrio: **estética medieval** + **claridad**. Evitar saturar la barra con texturas pesadas; preferir acentos y bordes decorativos.
- Para la implementación, proveer tokens CSS, SVGs y una guía breve de animaciones.

---

"Siguiente paso" sugerido: crear la maqueta Hi‑Fi (desktop + mobile) con esta guía y mockups detallados.