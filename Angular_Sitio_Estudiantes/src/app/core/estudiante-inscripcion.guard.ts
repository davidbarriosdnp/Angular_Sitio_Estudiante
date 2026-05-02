import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../features/auth/auth.service';

/**
 * Acceso a Mi inscripción: usuarios con rol Estudiante o con `estudiante_id` en el token.
 * Los administradores sin expediente académico van al inicio (no usan esta pantalla).
 */
export const estudianteInscripcionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  return auth.puedeAccederModuloInscripcion() ? true : router.createUrlTree(['/inicio']);
};
