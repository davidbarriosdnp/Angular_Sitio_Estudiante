import type { AppEnvironment } from './environment.interface';

/**
 * Producción: rutas relativas `/api/v1` bajo el mismo dominio que sirve el front
 * (recomendado con reverse proxy / Application Gateway que enrute `/api` al backend).
 *
 * Para API en otro dominio, define aquí la URL completa, p. ej. `https://api.tu-dominio.com`.
 */
export const environment: AppEnvironment = {
  envName: 'production',
  production: true,
  apiBaseUrl: '',
};
