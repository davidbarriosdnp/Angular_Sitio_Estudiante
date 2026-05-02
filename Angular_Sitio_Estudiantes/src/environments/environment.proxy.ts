import type { AppEnvironment } from './environment.interface';

/**
 * Uso con `ng serve --configuration=proxy` y `proxy.conf.json`:
 * el navegador llama a `/api/...` en el mismo origen y el dev server reenvía al API.
 * Evita problemas de CORS en local.
 */
export const environment: AppEnvironment = {
  envName: 'local',
  production: false,
  apiBaseUrl: '',
};
