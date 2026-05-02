import type { AppEnvironment } from './environment.interface';

/**
 * QA / preproducción.
 * Actualiza `apiBaseUrl` con la URL real del API en Azure u otro hosting.
 */
export const environment: AppEnvironment = {
  envName: 'qa',
  production: true,
  apiBaseUrl: 'https://qa-api.tu-dominio.com',
};
