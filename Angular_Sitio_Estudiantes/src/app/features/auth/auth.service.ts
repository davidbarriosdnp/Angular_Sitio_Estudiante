import { isPlatformBrowser } from '@angular/common';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiUrlService } from '../../core/services/api-url.service';
import { ApiResponse } from '../../core/models/api-response';
import { estudianteIdDesdeToken, rolDesdeToken } from '../../core/utils/jwt-payload';
import { ProgramaCreditoDto } from '../catalogos/programas-credito.service';

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

export interface RegistroEstudianteRequest {
  nombreUsuario: string;
  email: string;
  password: string;
  nombreCompleto: string;
  programaCreditoId: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private static readonly KEY_TOKEN_ACCESO = 'tokenAcceso';
  private static readonly KEY_TOKEN_RENOVACION = 'tokenRenovacion';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(this.apiUrl.v1('Auth/login'), credentials)
      .pipe(tap((res) => this.persistTokensIfOk(res)));
  }

  /** Registro público de estudiante; devuelve tokens igual que login. */
  registro(body: RegistroEstudianteRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(this.apiUrl.v1('Auth/registro'), body)
      .pipe(tap((res) => this.persistTokensIfOk(res)));
  }

  /** Programas activos para el formulario de registro (sin JWT). */
  programasParaRegistro(): Observable<ApiResponse<ProgramaCreditoDto[]>> {
    return this.http.get<ApiResponse<ProgramaCreditoDto[]>>(this.apiUrl.v1('Auth/programas'));
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(AuthService.KEY_TOKEN_ACCESO);
  }

  /** Perfil académico vinculado (necesario para inscripción y compañeros). */
  tienePerfilEstudiante(): boolean {
    return estudianteIdDesdeToken(this.getToken()) != null;
  }

  esAdministrador(): boolean {
    return rolDesdeToken(this.getToken()) === 'Administrador';
  }

  /** Rol `Estudiante` en el token (independiente de si ya hay `estudiante_id`). */
  esRolEstudiante(): boolean {
    return rolDesdeToken(this.getToken()) === 'Estudiante';
  }

  /**
   * Puede usar Mi inscripción y ver el flujo de materias/compañeros.
   * Incluye rol Estudiante aunque el token aún no traiga `estudiante_id` (se muestra ayuda en pantalla).
   * Excluye administradores sin perfil académico (gestionan el catálogo, no se inscriben aquí).
   */
  puedeAccederModuloInscripcion(): boolean {
    if (this.esAdministrador() && !this.tienePerfilEstudiante()) {
      return false;
    }
    return this.esRolEstudiante() || this.tienePerfilEstudiante();
  }

  /** Limpia tokens y, en el navegador, navega al login (sesión inválida o cierre). */
  logout(): void {
    this.limpiarTokensLocal();
    if (!isPlatformBrowser(this.platformId)) return;
    void this.router.navigateByUrl('/login');
  }

  /** Cierra sesión y abre una ruta pública (p. ej. registro en línea). */
  logoutEIrA(url: string): void {
    this.limpiarTokensLocal();
    if (!isPlatformBrowser(this.platformId)) return;
    void this.router.navigateByUrl(url);
  }

  private limpiarTokensLocal(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(AuthService.KEY_TOKEN_ACCESO);
    localStorage.removeItem(AuthService.KEY_TOKEN_RENOVACION);
  }

  private persistTokensIfOk(res: LoginResponse): void {
    if (!res.operacionExitosa || !res.resultado) return;
    if (!isPlatformBrowser(this.platformId)) return;
    const { tokenAcceso, tokenRenovacion } = res.resultado;
    localStorage.setItem(AuthService.KEY_TOKEN_ACCESO, tokenAcceso);
    localStorage.setItem(AuthService.KEY_TOKEN_RENOVACION, tokenRenovacion);
  }
}
