/**
 * GameIcons - Iconos SVG profesionales para el juego
 * Diseño de fantasía/RPG con estilo consistente
 */

import { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

// ============================================================
// ICONOS DE CLASE/PERSONAJE
// ============================================================

export function IconSword({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
      <path d="M14.5 6.5l-8 8" />
    </svg>
  );
}

export function IconStaff({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 21L18 9" />
      <circle cx="19" cy="5" r="3" fill={color} fillOpacity="0.3" />
      <path d="M19 2v6" />
      <path d="M16 5h6" />
      <path d="M4 19l2 2" />
    </svg>
  );
}

export function IconBow({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 20c4-4 8-4 12-4s8-4 4-12" />
      <path d="M4 20L20 4" />
      <path d="M14 14l4-4" />
      <path d="M18 10l2-2" />
    </svg>
  );
}

export function IconDagger({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M6.5 6.5l11 11" />
      <path d="M15 15l6 6" />
    </svg>
  );
}

export function IconHeal({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2v20" />
      <path d="M2 12h20" />
      <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
    </svg>
  );
}

export function IconShield({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={color} fillOpacity="0.15" />
      <path d="M12 8v6" />
      <path d="M9 11h6" />
    </svg>
  );
}

// ============================================================
// ICONOS DE RECURSOS
// ============================================================

export function IconGold({ size = 24, color = '#ffd700', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="10" fill={color} stroke="#b8860b" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="7" fill="none" stroke="#b8860b" strokeWidth="1" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#8b6914">$</text>
    </svg>
  );
}

export function IconGem({ size = 24, color = '#9b59b6', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <polygon points="12,2 22,9 12,22 2,9" fill={color} stroke="#6c3483" strokeWidth="1.5" />
      <polygon points="12,2 17,9 12,14 7,9" fill="#d4a5f9" fillOpacity="0.4" />
      <line x1="2" y1="9" x2="22" y2="9" stroke="#6c3483" strokeWidth="1" />
      <line x1="12" y1="2" x2="12" y2="22" stroke="#6c3483" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  );
}

// ============================================================
// ICONOS DE STATS
// ============================================================

export function IconHeart({ size = 24, color = '#e74c3c', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...props}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function IconMana({ size = 24, color = '#3498db', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...props}>
      <path d="M12 2L8 8h8l-4-6z" />
      <ellipse cx="12" cy="16" rx="8" ry="5" fillOpacity="0.6" />
      <ellipse cx="12" cy="13" rx="6" ry="3" fillOpacity="0.8" />
    </svg>
  );
}

export function IconStar({ size = 24, color = '#f1c40f', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...props}>
      <polygon points="12,2 15,9 22,9 17,14 19,22 12,17 5,22 7,14 2,9 9,9" />
    </svg>
  );
}

// ============================================================
// ICONOS DE MENÚ / ACCIONES
// ============================================================

export function IconDungeon({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <rect x="9" y="9" width="6" height="4" fill={color} fillOpacity="0.2" />
    </svg>
  );
}

export function IconSkull({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="10" r="8" />
      <circle cx="9" cy="9" r="2" fill={color} />
      <circle cx="15" cy="9" r="2" fill={color} />
      <path d="M8 18v4" />
      <path d="M12 18v4" />
      <path d="M16 18v4" />
      <path d="M9 14h6" />
    </svg>
  );
}

export function IconBackpack({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 10v10a2 2 0 002 2h12a2 2 0 002-2V10" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <rect x="4" y="6" width="16" height="4" rx="1" fill={color} fillOpacity="0.2" />
      <path d="M10 14h4" />
    </svg>
  );
}

export function IconShop({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <polyline points="9,22 9,12 15,12 15,22" />
      <path d="M3 9h18" fill={color} fillOpacity="0.2" />
    </svg>
  );
}

export function IconMarket({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 01-8 0" />
      <circle cx="12" cy="14" r="3" fill={color} fillOpacity="0.2" />
    </svg>
  );
}

export function IconTrophy({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9H3a1 1 0 01-1-1V4a1 1 0 011-1h3" />
      <path d="M18 9h3a1 1 0 001-1V4a1 1 0 00-1-1h-3" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 3h10v8a5 5 0 01-10 0V3z" fill={color} fillOpacity="0.2" />
    </svg>
  );
}

export function IconBook({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" fill={color} fillOpacity="0.15" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}

export function IconPlay({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...props}>
      <polygon points="6,4 20,12 6,20" />
    </svg>
  );
}

export function IconSettings({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export function IconLogout({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconRefresh({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="23,4 23,10 17,10" />
      <polyline points="1,20 1,14 7,14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

export function IconChart({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}

export function IconGamepad({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" fill={color} fillOpacity="0.15" />
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <circle cx="15" cy="11" r="1" fill={color} />
      <circle cx="18" cy="13" r="1" fill={color} />
    </svg>
  );
}

export function IconUser({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="7" r="4" fill={color} fillOpacity="0.2" />
      <path d="M5.5 21a8.38 8.38 0 0113 0" />
    </svg>
  );
}

export function IconInfo({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <circle cx="12" cy="8" r="0.5" fill={color} />
    </svg>
  );
}

export function IconKey({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="15" r="5" fill={color} fillOpacity="0.2" />
      <path d="M12 11l8-8" />
      <path d="M17 3l3 3" />
      <path d="M14 6l3 3" />
    </svg>
  );
}

// ============================================================
// EXPORTACIÓN AGRUPADA
// ============================================================

export const GameIcons = {
  // Clases
  Sword: IconSword,
  Staff: IconStaff,
  Bow: IconBow,
  Dagger: IconDagger,
  Heal: IconHeal,
  Shield: IconShield,
  // Recursos
  Gold: IconGold,
  Gem: IconGem,
  // Stats
  Heart: IconHeart,
  Mana: IconMana,
  Star: IconStar,
  // Menú
  Dungeon: IconDungeon,
  Skull: IconSkull,
  Backpack: IconBackpack,
  Shop: IconShop,
  Market: IconMarket,
  Trophy: IconTrophy,
  Book: IconBook,
  Play: IconPlay,
  Settings: IconSettings,
  Logout: IconLogout,
  Refresh: IconRefresh,
  Chart: IconChart,
  Gamepad: IconGamepad,
  User: IconUser,
  Info: IconInfo,
  Key: IconKey,
};

export default GameIcons;
