/**
 * LoadingScreen - Pantalla de carga con animación
 */

import { motion } from 'framer-motion';
import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export function LoadingScreen({ 
  message = 'Cargando...', 
  progress,
  showProgress = false 
}: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      {/* Fondo animado */}
      <div className="loading-background">
        <div className="loading-bg-gradient" />
        <div className="loading-particles" />
      </div>

      {/* Contenido */}
      <motion.div
        className="loading-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <motion.div
          className="loading-logo"
          animate={{ 
            scale: [1, 1.05, 1],
            filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)']
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <span className="logo-text">VALNOR</span>
        </motion.div>

        {/* Spinner con anillos */}
        <div className="loading-spinner-container">
          <motion.div
            className="spinner-ring ring-outer"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="spinner-ring ring-middle"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="spinner-ring ring-inner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <div className="spinner-center" />
        </div>

        {/* Mensaje */}
        <motion.p
          className="loading-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>

        {/* Barra de progreso opcional */}
        {showProgress && progress !== undefined && (
          <div className="loading-progress">
            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        )}
      </motion.div>

      {/* Tips de carga (opcional) */}
      <motion.div
        className="loading-tip"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.7, y: 0 }}
        transition={{ delay: 1 }}
      >
        <span className="tip-label">TIP:</span>
        <span className="tip-text">Mantén presionada la tecla Shift para correr más rápido.</span>
      </motion.div>
    </div>
  );
}

export default LoadingScreen;
