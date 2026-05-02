import { isPlatformBrowser } from '@angular/common';
import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector, PLATFORM_ID } from '@angular/core';
import { AuthService, LoginResponse } from '../features/auth/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

const KEY_ACC = 'tokenAcceso';
const KEY_REF = 'tokenRenovacion';
const REFRESH_URL = '/api/v1/Auth/refresh';

function isAuthRoute(url: string): boolean {
  return url.includes('/Auth/login') || url.includes('/Auth/refresh');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const backend = inject(HttpBackend);
  const platformId = inject(PLATFORM_ID);

  const raw = new HttpClient(backend);
  const browser = isPlatformBrowser(platformId);

  let out = req;
  if (browser) {
    const access = localStorage.getItem(KEY_ACC);
    if (access && !isAuthRoute(req.url) && !req.headers.has('Authorization')) {
      out = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${access}`),
      });
    }
  }

  return next(out).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }

      if (isAuthRoute(req.url)) {
        return throwError(() => err);
      }

      if (!browser) return throwError(() => err);

      if (req.headers.has('X-Auth-Reattempt')) {
        injector.get(AuthService).logout();
        return throwError(() => err);
      }

      const refresh = localStorage.getItem(KEY_REF);
      if (!refresh) {
        injector.get(AuthService).logout();
        return throwError(() => err);
      }

      return raw
        .post<LoginResponse>(REFRESH_URL, { tokenRenovacion: refresh })
        .pipe(
          switchMap((res) => {
            if (!res?.operacionExitosa || !res?.resultado) {
              injector.get(AuthService).logout();
              return throwError(() => err);
            }
            const r = res.resultado;
            localStorage.setItem(KEY_ACC, r.tokenAcceso);
            localStorage.setItem(KEY_REF, r.tokenRenovacion);
            const retry = req.clone({
              headers: req.headers
                .set('Authorization', `Bearer ${r.tokenAcceso}`)
                .set('X-Auth-Reattempt', '1'),
            });
            return next(retry);
          }),
          catchError(() => {
            injector.get(AuthService).logout();
            return throwError(() => err);
          }),
        );
    }),
  );
};
