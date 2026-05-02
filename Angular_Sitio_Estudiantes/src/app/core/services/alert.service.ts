import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

/** Opciones por defecto del sitio (tema alineado con PrimeNG Aura / indigo). */
const baseDefaults: SweetAlertOptions = {
  buttonsStyling: false,
  customClass: {
    popup: 'app-swal-popup',
    title: 'app-swal-title',
    htmlContainer: 'app-swal-html',
    confirmButton: 'p-button p-component app-swal-confirm',
    cancelButton: 'p-button p-component p-button-secondary app-swal-cancel',
    denyButton: 'p-button p-component p-button-secondary app-swal-deny',
  },
  showClass: { popup: 'app-swal-show' },
  hideClass: { popup: 'app-swal-hide' },
};

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly platformId = inject(PLATFORM_ID);

  private run<T>(fn: () => Promise<T>): Promise<T> | void {
    if (!isPlatformBrowser(this.platformId)) return;
    return fn();
  }

  success(message: string, title = 'Listo'): ReturnType<AlertService['run']> {
    return this.run(() =>
      Swal.fire({
        ...baseDefaults,
        icon: 'success',
        title,
        text: message,
        confirmButtonText: 'Aceptar',
      }),
    );
  }

  /** Éxito breve sin botón (ideal tras login u operaciones rápidas). */
  successBrief(message: string, title = 'Listo'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    void Swal.fire({
      ...baseDefaults,
      icon: 'success',
      title,
      text: message,
      timer: 1400,
      showConfirmButton: false,
    });
  }

  info(message: string, title = 'Información'): ReturnType<AlertService['run']> {
    return this.run(() =>
      Swal.fire({
        ...baseDefaults,
        icon: 'info',
        title,
        text: message,
        confirmButtonText: 'Aceptar',
      }),
    );
  }

  warning(message: string, title = 'Atención'): ReturnType<AlertService['run']> {
    return this.run(() =>
      Swal.fire({
        ...baseDefaults,
        icon: 'warning',
        title,
        text: message,
        confirmButtonText: 'Entendido',
      }),
    );
  }

  error(message: string, title = 'Error'): ReturnType<AlertService['run']> {
    return this.run(() =>
      Swal.fire({
        ...baseDefaults,
        icon: 'error',
        title,
        text: message,
        confirmButtonText: 'Cerrar',
      }),
    );
  }

  /** Errores HTTP / envoltorio API */
  apiError(err: unknown, fallback = 'No se pudo completar la operación.'): ReturnType<AlertService['run']> {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { mensaje?: string; errores?: string[] } | null;
      const detail =
        body?.mensaje ||
        (Array.isArray(body?.errores) && body!.errores!.length ? body!.errores!.join(' ') : null);
      if (err.status === 401) return this.error('Sesión expirada o no válida.', 'No autorizado');
      if (err.status === 403) return this.error('No tiene permisos para esta acción.', 'Acceso denegado');
      return this.error(detail || err.message || fallback);
    }
    return this.error(fallback);
  }

  confirmDelete(
    itemLabel: string,
    options?: Partial<SweetAlertOptions>,
  ): Promise<SweetAlertResult | undefined> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve(undefined);
    const merged = {
      ...baseDefaults,
      icon: 'warning' as const,
      title: '¿Eliminar?',
      html: `Se desactivará <strong>${itemLabel}</strong>. ¿Continuar?`,
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      ...options,
    } as SweetAlertOptions;
    return Swal.fire(merged);
  }

  /** Fire personalizado con los estilos base del proyecto */
  fire(options: SweetAlertOptions): Promise<SweetAlertResult | undefined> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve(undefined);
    return Swal.fire({ ...baseDefaults, ...options } as SweetAlertOptions);
  }
}
