import { inject, Injectable } from '@angular/core';
import { APP_ENVIRONMENT } from '../tokens/app-environment.token';

@Injectable({ providedIn: 'root' })
export class ApiUrlService {
  private readonly env = inject(APP_ENVIRONMENT);

  /**
   * URL completa del API v1.
   * @param segment Ruta bajo `/api/v1/` sin barra inicial, p. ej. `Auth/login`, `Estudiantes`, `Estudiantes/3`.
   */
  v1(segment: string): string {
    const s = segment.replace(/^\/+/, '');
    const base = this.env.apiBaseUrl.replace(/\/$/, '');
    const path = `/api/v1/${s}`;
    if (!base) {
      return path;
    }
    return `${base}${path}`;
  }
}
