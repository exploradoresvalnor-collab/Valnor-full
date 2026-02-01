import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, checkSession } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showUnderConstruction, setShowUnderConstruction] = useState(false);

  useEffect(() => {
    // Verify session on mount
    checkSession();
  }, []);

  // If no user and done loading, redirect to login
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      id: 'profile',
      icon: '👤',
      label: 'Perfil',
      color: 'blue',
      onClick: () => setShowSettings(true)
    },
    {
      id: 'inventory',
      icon: '🎒',
      label: 'Inventario',
      color: 'green',
      onClick: () => navigate('/inventory')
    },
    {
      id: 'marketplace',
      icon: '🏪',
      label: 'Marketplace',
      color: 'purple',
      onClick: () => navigate('/marketplace')
    },
    {
      id: 'shop',
      icon: '🛒',
      label: 'Tienda',
      color: 'orange',
      onClick: () => navigate('/shop')
    },
    {
      id: 'dungeon',
      icon: '🏰',
      label: 'Dungeon',
      color: 'red',
      onClick: () => navigate('/dungeon')
    },
    {
      id: 'ranking',
      icon: '🏆',
      label: 'Ranking',
      color: 'yellow',
      onClick: () => navigate('/ranking')
    },
    {
      id: 'survival',
      icon: '⚔️',
      label: 'Survival',
      color: 'cyan',
      onClick: () => navigate('/survival')
    },
    {
      id: 'wiki',
      icon: '📚',
      label: 'Wiki',
      color: 'indigo',
      onClick: () => navigate('/wiki')
    }
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="user-quick-info">
            <span className="user-stat val">💰 {user.val} VAL</span>
            <span className="user-stat boletos">🎫 {user.boletos} Boletos</span>
          </div>
        </header>

        {/* Welcome Card */}
        <div className="welcome-card">
          <h2 className="welcome-title">Bienvenido, {user.username}!</h2>
          <div className="user-stats">
            <div className="stat-item">
              <span className="stat-label">Email:</span>
              <span className="stat-value">{user.email}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">VAL:</span>
              <span className="stat-value highlight">{user.val}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Boletos:</span>
              <span className="stat-value">{user.boletos}</span>
            </div>
            {user.evo !== undefined && (
              <div className="stat-item">
                <span className="stat-label">EVO:</span>
                <span className="stat-value">{user.evo}</span>
              </div>
            )}
            {user.energia !== undefined && (
              <div className="stat-item">
                <span className="stat-label">Energía:</span>
                <span className="stat-value">{user.energia}</span>
              </div>
            )}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="menu-grid">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item menu-${item.color}`}
              onClick={item.onClick}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="modal-overlay" onClick={() => setShowSettings(false)}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Configuración</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowSettings(false)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <div className="profile-info">
                  <div className="profile-avatar">
                    <span className="avatar-icon">👤</span>
                  </div>
                  <div className="profile-details">
                    <h4>{user.username}</h4>
                    <p>{user.email}</p>
                  </div>
                </div>
                <div className="settings-section">
                  <h5>Estadísticas</h5>
                  <ul className="stats-list">
                    <li>VAL: <strong>{user.val}</strong></li>
                    <li>Boletos: <strong>{user.boletos}</strong></li>
                    {user.evo !== undefined && <li>EVO: <strong>{user.evo}</strong></li>}
                    {user.energia !== undefined && <li>Energía: <strong>{user.energia}</strong></li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Under Construction Modal */}
        {showUnderConstruction && (
          <div className="under-construction">
            <h3>🚧 En Construcción</h3>
            <p>Esta funcionalidad estará disponible próximamente.</p>
            <button
              onClick={() => setShowUnderConstruction(false)}
              className="close-construction-btn"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
