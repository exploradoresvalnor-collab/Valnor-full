/**
 * Configuración de la API - Valnor Juego
 */

// URL base del backend
// Forzar URL absoluta correcta para evitar problemas con proxy
export const API_URL = 'http://localhost:8080';

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
