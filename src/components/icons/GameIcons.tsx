/**
 * Iconos SVG vectoriales para el juego
 * Estilo RPG/Fantasy consistente
 */

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// ============================================
// RECURSOS
// ============================================

export const GoldIcon = ({ size = 24, color = '#ffd700', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill={color} />
    <circle cx="12" cy="12" r="8" fill="#ffaa00" />
    <path d="M12 6v12M8 9h8M8 15h8" stroke="#b8860b" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const GemIcon = ({ size = 24, color = '#9b59b6', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L4 8l8 14 8-14-8-6z" fill={color} />
    <path d="M12 2L4 8h16L12 2z" fill="#8e44ad" />
    <path d="M4 8l8 14V8H4z" fill="#a569bd" />
    <path d="M12 8v14l8-14h-8z" fill="#7d3c98" />
  </svg>
);

export const EnergyIcon = ({ size = 24, color = '#3498db', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M13 2L4 14h7l-2 8 11-12h-7l2-8z" fill={color} stroke="#2980b9" strokeWidth="1" />
  </svg>
);

// ============================================
// MODOS DE JUEGO
// ============================================

export const SwordIcon = ({ size = 24, color = '#e74c3c', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M19 2l-7 7M12 9l-7 7 2 2 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M5 16l-2 5 5-2-3-3z" fill={color} />
    <path d="M15 5l4 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="18" cy="3" r="2" fill={color} />
  </svg>
);

export const SkullIcon = ({ size = 24, color = '#9b59b6', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2C7 2 3 6 3 11c0 3 1.5 5.5 4 7v3h10v-3c2.5-1.5 4-4 4-7 0-5-4-9-9-9z" fill={color} />
    <circle cx="8" cy="10" r="2" fill="#1a1a2e" />
    <circle cx="16" cy="10" r="2" fill="#1a1a2e" />
    <path d="M9 16v2M12 16v2M15 16v2" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ShopIcon = ({ size = 24, color = '#e67e22', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 7h16l-1 11H5L4 7z" fill={color} />
    <path d="M4 7l2-4h12l2 4" stroke={color} strokeWidth="2" />
    <circle cx="9" cy="20" r="2" fill={color} />
    <circle cx="15" cy="20" r="2" fill={color} />
    <path d="M8 11v3M12 11v3M16 11v3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const MarketIcon = ({ size = 24, color = '#3498db', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 3h18v4H3V3z" fill={color} />
    <path d="M5 7v14h14V7" stroke={color} strokeWidth="2" />
    <path d="M3 3l2-1h14l2 1" stroke={color} strokeWidth="2" />
    <path d="M8 11h8M8 15h5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const TeamIcon = ({ size = 24, color = '#2ecc71', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="7" r="4" fill={color} />
    <circle cx="5" cy="9" r="3" fill={color} opacity="0.7" />
    <circle cx="19" cy="9" r="3" fill={color} opacity="0.7" />
    <path d="M12 13c-4 0-7 2-7 5v2h14v-2c0-3-3-5-7-5z" fill={color} />
    <path d="M5 14c-2 0-4 1.5-4 3.5V19h4" fill={color} opacity="0.7" />
    <path d="M19 14c2 0 4 1.5 4 3.5V19h-4" fill={color} opacity="0.7" />
  </svg>
);

export const TrophyIcon = ({ size = 24, color = '#f1c40f', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 4h12v6c0 3.3-2.7 6-6 6s-6-2.7-6-6V4z" fill={color} />
    <path d="M6 6H3c0 3 1.5 5 4 5.5" stroke={color} strokeWidth="2" />
    <path d="M18 6h3c0 3-1.5 5-4 5.5" stroke={color} strokeWidth="2" />
    <path d="M10 16v2h4v-2" fill={color} />
    <path d="M7 20h10v2H7v-2z" fill={color} />
  </svg>
);

// ============================================
// UI GENERAL
// ============================================

export const BellIcon = ({ size = 24, color = '#fff', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" fill="none" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" />
  </svg>
);

export const SettingsIcon = ({ size = 24, color = '#fff', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth="2" />
  </svg>
);

export const LogoutIcon = ({ size = 24, color = '#fff', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <polyline points="16,17 21,12 16,7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const LockIcon = ({ size = 24, color = '#888', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="5" y="11" width="14" height="10" rx="2" fill={color} />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="16" r="1.5" fill="#1a1a2e" />
  </svg>
);

export const UserIcon = ({ size = 24, color = '#fff', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="8" r="4" fill={color} />
    <path d="M4 20c0-4 4-7 8-7s8 3 8 7" fill={color} />
  </svg>
);

export const UsersIcon = ({ size = 24, color = '#fff', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="9" cy="7" r="4" fill={color} />
    <path d="M2 20c0-4 3-6 7-6s7 2 7 6" fill={color} />
    <circle cx="17" cy="7" r="3" fill={color} opacity="0.6" />
    <path d="M17 13c3 0 5 1.5 5 4.5V20" stroke={color} strokeWidth="2" opacity="0.6" />
  </svg>
);

// ============================================
// ESTADÍSTICAS Y BARRAS
// ============================================

export const HeartIcon = ({ size = 24, color = '#e74c3c', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={color} />
  </svg>
);

export const ManaIcon = ({ size = 24, color = '#3498db', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2l3 7h7l-6 4.5 2.5 8.5L12 17l-6.5 5 2.5-8.5L2 9h7l3-7z" fill={color} />
  </svg>
);

export const ExpIcon = ({ size = 24, color = '#2ecc71', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polygon points="12,2 15,9 22,9 16.5,13.5 18.5,21 12,16.5 5.5,21 7.5,13.5 2,9 9,9" fill={color} />
  </svg>
);

export const ChartIcon = ({ size = 24, color = '#ffd700', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="14" width="4" height="7" fill={color} opacity="0.6" />
    <rect x="10" y="10" width="4" height="11" fill={color} opacity="0.8" />
    <rect x="17" y="6" width="4" height="15" fill={color} />
  </svg>
);

// ============================================
// NAVEGACIÓN
// ============================================

export const BackpackIcon = ({ size = 24, color = '#fff', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M5 10v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10" stroke={color} strokeWidth="2" />
    <path d="M5 10a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4" stroke={color} strokeWidth="2" />
    <path d="M9 6V4a3 3 0 0 1 6 0v2" stroke={color} strokeWidth="2" />
    <path d="M8 14h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const BookIcon = ({ size = 24, color = '#fff', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 4h4a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H4V4z" stroke={color} strokeWidth="2" fill="none" />
    <path d="M20 4h-4a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h5V4z" stroke={color} strokeWidth="2" fill="none" />
  </svg>
);

export const RefreshIcon = ({ size = 24, color = '#fff', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M1 4v6h6M23 20v-6h-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PlusIcon = ({ size = 24, color = '#666', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CloseIcon = ({ size = 24, color = '#fff', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ============================================
// CLASES DE PERSONAJES
// ============================================

export const WarriorIcon = ({ size = 24, color = '#e74c3c', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M14 2l-4 4v5l-5 5v3l3-1 5-5h5l4-4-8-2z" fill={color} stroke={color} strokeWidth="1" />
    <path d="M5 16l-2 6 6-2" fill={color} />
  </svg>
);

export const MageIcon = ({ size = 24, color = '#9b59b6', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2l2 8h6l-5 4 2 8-5-4-5 4 2-8-5-4h6l2-8z" fill={color} />
  </svg>
);

export const ArcherIcon = ({ size = 24, color = '#2ecc71', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M18 2l-8 8M10 10L4 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M22 12c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2" stroke={color} strokeWidth="2" fill="none" />
    <path d="M18 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PaladinIcon = ({ size = 24, color = '#f1c40f', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L4 6v6c0 5.5 3.4 10.3 8 12 4.6-1.7 8-6.5 8-12V6l-8-4z" fill={color} />
    <path d="M12 7v6M9 10h6" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ============================================
// ACTIVIDAD
// ============================================

export const CombatIcon = ({ size = 24, color = '#e74c3c', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 2l4 4-8 8 4 4 8-8 4 4V2H6z" fill={color} />
  </svg>
);

export const LootIcon = ({ size = 24, color = '#ffd700', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="8" width="18" height="13" rx="2" fill={color} />
    <path d="M7 8V6a5 5 0 0 1 10 0v2" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="14" r="2" fill="#1a1a2e" />
    <path d="M12 16v2" stroke="#1a1a2e" strokeWidth="2" />
  </svg>
);

export const LevelUpIcon = ({ size = 24, color = '#2ecc71', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2l3 6 6 1-4.5 4 1 6.5L12 17l-5.5 2.5 1-6.5L3 9l6-1 3-6z" fill={color} />
    <path d="M12 8v4M10 10h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const QuestIcon = ({ size = 24, color = '#9b59b6', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill={color} />
    <path d="M14 2v6h6" fill="#7d3c98" />
    <path d="M9 13h6M9 17h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ============================================
// INVENTARIO
// ============================================

export const ShieldIcon = ({ size = 24, color = '#3498db', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L4 6v6c0 5.5 3.5 10.5 8 12.5 4.5-2 8-7 8-12.5V6l-8-4z" fill={color} />
    <path d="M12 2L4 6v6c0 5.5 3.5 10.5 8 12.5V2z" fill="#2980b9" />
  </svg>
);

export const PotionIcon = ({ size = 24, color = '#2ecc71', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 2h6v4l3 3v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9l3-3V2z" fill={color} />
    <path d="M9 2h6v3H9V2z" fill="#27ae60" />
    <path d="M6 9h12" stroke="#1a1a2e" strokeWidth="1" />
    <circle cx="10" cy="15" r="1.5" fill="#fff" opacity="0.5" />
    <circle cx="14" cy="13" r="1" fill="#fff" opacity="0.3" />
  </svg>
);

export const ChevronRightIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Brand / Logo
export const ValnorLogo = ({ size = 32, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <defs>
      <linearGradient id="valnorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" />
        <stop offset="100%" stopColor="#ff8c00" />
      </linearGradient>
    </defs>
    <path d="M16 2L4 8v8c0 8 5.3 15.1 12 18 6.7-2.9 12-10 12-18V8L16 2z" fill="url(#valnorGrad)" />
    <path d="M16 6L8 10v6c0 5.5 3.5 10.5 8 12.5 4.5-2 8-7 8-12.5v-6L16 6z" fill="#1a1a2e" />
    <path d="M16 10l5 3v4l-5 6-5-6v-4l5-3z" fill="url(#valnorGrad)" />
  </svg>
);

// ============================================
// ALIAS Icon* (compatibilidad con imports legacy)
// Estos alias permiten que cualquier archivo importe
// con el patrón IconNombre desde esta única fuente.
// ============================================

export const IconSword = WarriorIcon;
export const IconShield = ShieldIcon;
export const IconSkull = SkullIcon;
export const IconTrophy = TrophyIcon;
export const IconGold = GoldIcon;
export const IconGem = GemIcon;
export const IconHeart = HeartIcon;
export const IconBook = BookIcon;
export const IconBackpack = BackpackIcon;
export const IconUser = UserIcon;
export const IconDungeon = SwordIcon;
export const IconKey = LockIcon;
export const IconRefresh = RefreshIcon;
export const IconSettings = SettingsIcon;
export const IconLogout = LogoutIcon;
export const IconChart = ChartIcon;

export const IconStaff = ({ size = 24, color = 'currentColor', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 21L18 9" />
    <circle cx="19" cy="5" r="3" fill={color} fillOpacity="0.3" />
    <path d="M19 2v6" />
    <path d="M16 5h6" />
    <path d="M4 19l2 2" />
  </svg>
);

export const IconBow = ({ size = 24, color = 'currentColor', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 20c4-4 8-4 12-4s8-4 4-12" />
    <path d="M4 20L20 4" />
    <path d="M14 14l4-4" />
    <path d="M18 10l2-2" />
  </svg>
);

export const IconDagger = ({ size = 24, color = 'currentColor', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M6.5 6.5l11 11" />
    <path d="M15 15l6 6" />
  </svg>
);

export const IconHeal = ({ size = 24, color = 'currentColor', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v20" />
    <path d="M2 12h20" />
    <circle cx="12" cy="12" r="9" strokeOpacity="0.3" />
  </svg>
);

export const IconPlay = ({ size = 24, color = 'currentColor', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <polygon points="6,4 20,12 6,20" />
  </svg>
);

export const IconStar = ({ size = 24, color = '#f1c40f', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <polygon points="12,2 15,9 22,9 17,14 19,22 12,17 5,22 7,14 2,9 9,9" />
  </svg>
);

export const IconMana = ManaIcon;
export const IconInfo = ({ size = 24, color = 'currentColor', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <circle cx="12" cy="8" r="0.5" fill={color} />
  </svg>
);
export const IconGamepad = ({ size = 24, color = 'currentColor', className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="6" width="20" height="12" rx="2" fill={color} fillOpacity="0.15" />
    <line x1="6" y1="12" x2="10" y2="12" />
    <line x1="8" y1="10" x2="8" y2="14" />
    <circle cx="15" cy="11" r="1" fill={color} />
    <circle cx="18" cy="13" r="1" fill={color} />
  </svg>
);

// Exportación agrupada legacy
export const GameIcons = {
  Sword: IconSword,
  Staff: IconStaff,
  Bow: IconBow,
  Dagger: IconDagger,
  Heal: IconHeal,
  Shield: IconShield,
  Gold: IconGold,
  Gem: IconGem,
  Heart: IconHeart,
  Mana: IconMana,
  Star: IconStar,
  Dungeon: IconDungeon,
  Skull: IconSkull,
  Backpack: IconBackpack,
  Shop: ShopIcon,
  Market: MarketIcon,
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
