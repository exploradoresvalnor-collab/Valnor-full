/**
 * Configuración de la API - Valnor Juego
 */

// URL base del backend
// En desarrollo, Vite hace proxy de /auth y /api → localhost:8080
// Así las cookies HTTP-only funcionan correctamente (mismo origen)
export const API_URL = import.meta.env.VITE_API_URL || '';

// Configuración de la API
export const API_CONFIG = {
  baseUrl: API_URL,
  timeout: 30000,
  withCredentials: true, // Enviar cookies automáticamente
};

// Headers por defecto
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};
