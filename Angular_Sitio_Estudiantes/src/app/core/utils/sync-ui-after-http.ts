import { ChangeDetectorRef, NgZone } from '@angular/core';

/**
 * Tras HTTP + SweetAlert/modales externos, marca estado y fuerza CD para que PrimeNG actualice botones/tablas sin quedar el spinner pegado.
 */
export function finalizeHttpUiPatch(ngZone: NgZone, cdr: ChangeDetectorRef, patch: () => void): () => void {
  return () => {
    ngZone.run(() => {
      patch();
      cdr.detectChanges();
    });
  };
}
