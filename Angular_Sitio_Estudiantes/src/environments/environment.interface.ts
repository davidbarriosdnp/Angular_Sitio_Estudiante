export type AppEnvironmentName = 'local' | 'development' | 'qa' | 'production';

export interface AppEnvironment {
  /** Nombre lógico del entorno (logs, diagnóstico). */
  envName: AppEnvironmentName;
  /** Build de producción (optimizaciones, sin asserts). */
  production: boolean;
  /**
   * URL base del API **sin** barra final.
   * - Cadena vacía: se usan rutas relativas `/api/v1/...` (mismo origen o proxy inverso).
   * - Ejemplo local: `https://localhost:7020`
   */
  apiBaseUrl: string;
}
