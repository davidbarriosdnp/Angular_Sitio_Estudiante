import type { AppEnvironment } from './environment.interface';

/** API en tu máquina (Kestrel / IIS Express). Requiere CORS en el backend hacia el origen del front (p. ej. http://localhost:4200). */
export const environment: AppEnvironment = {
  envName: 'local',
  production: false,
  apiBaseUrl: 'https://localhost:7020',
};
