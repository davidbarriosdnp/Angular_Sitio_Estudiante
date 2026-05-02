import type { AppEnvironment } from './environment.interface';

/**
 * Entorno de desarrollo compartido (servidor de integración).
 * Sustituye la URL por la de tu API de desarrollo cuando exista.
 */
export const environment: AppEnvironment = {
  envName: 'development',
  production: false,
  apiBaseUrl: 'https://localhost:7020',
};
