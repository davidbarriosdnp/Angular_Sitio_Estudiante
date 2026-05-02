import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response';

const BASE = '/api/v1/Usuarios';

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

  getUsuarios(soloActivos = true): Observable<ApiResponse<UsuarioDto[]>> {
    const params = new HttpParams().set('soloActivos', soloActivos);
    return this.http.get<ApiResponse<UsuarioDto[]>>(BASE, { params });
  }

  getUsuario(id: number): Observable<ApiResponse<UsuarioDto>> {
    return this.http.get<ApiResponse<UsuarioDto>>(`${BASE}/${id}`);
  }

  crearUsuario(data: CrearUsuarioPayload): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(BASE, data);
  }

  actualizarUsuario(
    id: number,
    data: ActualizarUsuarioPayload,
  ): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${BASE}/${id}`, data);
  }

  eliminarUsuario(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${BASE}/${id}`);
  }
}
