import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  nombreUsuario: string;
  password: string;
}

export interface LoginTokens {
  tokenAcceso: string;
  tokenRenovacion: string;
  expiraSegundosAcceso: number;
  tipoToken: string;
}

export interface LoginResponse {
  operacionExitosa: boolean;
  mensaje?: string;
  resultado?: LoginTokens;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private static readonly KEY_TOKEN_ACCESO = 'tokenAcceso';
  private static readonly KEY_TOKEN_RENOVACION = 'tokenRenovacion';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>('/api/v1/Auth/login', credentials)
      .pipe(tap((res) => this.persistTokensIfOk(res)));
  }

  getToken(): string | null {
    return localStorage.getItem(AuthService.KEY_TOKEN_ACCESO);
  }

  logout(): void {
    localStorage.removeItem(AuthService.KEY_TOKEN_ACCESO);
    localStorage.removeItem(AuthService.KEY_TOKEN_RENOVACION);
  }

  private persistTokensIfOk(res: LoginResponse): void {
    if (!res.operacionExitosa || !res.resultado) return;
    const { tokenAcceso, tokenRenovacion } = res.resultado;
    localStorage.setItem(AuthService.KEY_TOKEN_ACCESO, tokenAcceso);
    localStorage.setItem(AuthService.KEY_TOKEN_RENOVACION, tokenRenovacion);
  }
}
