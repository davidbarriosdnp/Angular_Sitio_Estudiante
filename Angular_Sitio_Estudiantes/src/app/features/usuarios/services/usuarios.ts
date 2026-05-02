import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response';
import { ApiUrlService } from '../../../core/services/api-url.service';

export interface UsuarioDto {
  usuarioId: number;
  nombreUsuario: string;
  email: string;
  rol: string;
  fechaRegistro: string;
  fechaModificacion: string | null;
  estado: number;
}

export interface CrearUsuarioPayload {
  nombreUsuario: string;
  email: string;
  password: string;
  rol: string;
}

export interface ActualizarUsuarioPayload {
  nombreUsuario: string;
  email: string;
  rol: string;
  estado: number;
  nuevaPassword: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class Usuarios {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiUrlService);

  getUsuarios(soloActivos = true): Observable<ApiResponse<UsuarioDto[]>> {
    const params = new HttpParams().set('soloActivos', soloActivos);
    return this.http.get<ApiResponse<UsuarioDto[]>>(this.api.v1('Usuarios'), { params });
  }

  getUsuario(id: number): Observable<ApiResponse<UsuarioDto>> {
    return this.http.get<ApiResponse<UsuarioDto>>(this.api.v1(`Usuarios/${id}`));
  }

  crearUsuario(data: CrearUsuarioPayload): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.api.v1('Usuarios'), data);
  }

  actualizarUsuario(
    id: number,
    data: ActualizarUsuarioPayload,
  ): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(this.api.v1(`Usuarios/${id}`), data);
  }

  eliminarUsuario(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(this.api.v1(`Usuarios/${id}`));
  }
}
