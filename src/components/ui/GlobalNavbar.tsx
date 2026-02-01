/**
 * GlobalNavbar - Barra de navegación global
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerStore } from '../../stores';
import './GlobalNavbar.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  requiresAuth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Inicio', icon: '🏠', requiresAuth: true },
  { path: '/demo', label: 'Jugar', icon: '⚔️', requiresAuth: true },
  { path: '/inventory', label: 'Inventario', icon: '🎒', requiresAuth: true },
  { path: '/shop', label: 'Tienda', icon: '🛒', requiresAuth: true },
  { path: '/dungeon', label: 'Mazmorras', icon: '🏰', requiresAuth: true },
  { path: '/survival', label: 'Survival', icon: '💀', requiresAuth: true },
  { path: '/ranking', label: 'Rankings', icon: '🏆', requiresAuth: true },
  { path: '/wiki', label: 'Wiki', icon: '📖' },
];

export function GlobalNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { gold, gems, level } = usePlayerStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/landing');
  };

  const filteredNavItems = NAV_ITEMS.filter(
    item => !item.requiresAuth || isAuthenticated
  );

  return (
    <nav className="global-navbar">
      {/* Logo */}
      <Link to={isAuthenticated ? '/dashboard' : '/landing'} className="navbar-logo">
        <span className="logo-icon">⚔️</span>
        <span className="logo-text">VALNOR</span>
      </Link>

      {/* Navigation Links - Desktop */}
      <div className="navbar-links">
        {filteredNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {location.pathname === item.path && (
              <motion.div
                className="nav-indicator"
                layoutId="navIndicator"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </Link>
        ))}
      </div>

      {/* User Section */}
      {isAuthenticated && user ? (
        <div className="navbar-user">
          {/* Recursos */}
          <div className="user-resources">
            <div className="resource gold">
              <span className="resource-icon">🪙</span>
              <span className="resource-value">{gold.toLocaleString()}</span>
            </div>
            <div className="resource gems">
              <span className="resource-icon">💎</span>
              <span className="resource-value">{gems.toLocaleString()}</span>
            </div>
          </div>

          {/* Perfil */}
          <div className="user-profile">
            <button
              className="profile-button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className="profile-avatar">
                <span className="avatar-level">Lv.{level}</span>
              </div>
              <span className="profile-name">{user.username}</span>
              <span className="profile-arrow">▼</span>
            </button>

            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  className="profile-dropdown"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                    <span>👤</span> Mi Perfil
                  </Link>
                  <Link to="/inventory" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                    <span>🎒</span> Inventario
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <span>🚪</span> Cerrar Sesión
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="navbar-auth">
          <Link to="/auth/login" className="auth-button login">
            Iniciar Sesión
          </Link>
          <Link to="/auth/register" className="auth-button register">
            Registrarse
          </Link>
        </div>
      )}

      {/* Mobile Menu Button */}
      <button
        className={`mobile-menu-button ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="mobile-menu-content">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}

              {isAuthenticated ? (
                <button className="mobile-logout" onClick={handleLogout}>
                  🚪 Cerrar Sesión
                </button>
              ) : (
                <div className="mobile-auth">
                  <Link to="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Iniciar Sesión
                  </Link>
                  <Link to="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default GlobalNavbar;
