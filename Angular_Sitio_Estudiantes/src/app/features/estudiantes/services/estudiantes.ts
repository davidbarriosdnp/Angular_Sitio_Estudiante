import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response';
import { ApiUrlService } from '../../../core/services/api-url.service';

export interface EstudianteRegistroDto {
  estudianteId: number;
  nombre: string;
  email: string;
  programaCreditoId: number;
  fechaRegistro: string;
  fechaModificacion: string | null;
  estado: number;
  materiasInscritas: string;
}

export interface EstudianteDetalleDto {
  estudianteId: number;
  nombre: string;
  email: string;
  programaCreditoId: number;
  fechaRegistro: string;
  fechaModificacion: string | null;
  estado: number;
}

export interface CrearEstudiantePayload {
  nombre: string;
  email: string;
  programaCreditoId: number | null;
}

export interface ActualizarEstudiantePayload {
  nombre: string;
  email: string;
  programaCreditoId: number | null;
  estado: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class Estudiantes {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiUrlService);

  getEstudiantes(soloActivos = true): Observable<ApiResponse<EstudianteRegistroDto[]>> {
    const params = new HttpParams().set('soloActivos', soloActivos);
    return this.http.get<ApiResponse<EstudianteRegistroDto[]>>(this.api.v1('Estudiantes'), { params });
  }

  getEstudiante(id: number): Observable<ApiResponse<EstudianteDetalleDto>> {
    return this.http.get<ApiResponse<EstudianteDetalleDto>>(this.api.v1(`Estudiantes/${id}`));
  }

  crear(data: CrearEstudiantePayload): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.api.v1('Estudiantes'), data);
  }

  actualizar(id: number, data: ActualizarEstudiantePayload): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(this.api.v1(`Estudiantes/${id}`), data);
  }

  eliminar(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(this.api.v1(`Estudiantes/${id}`));
  }
}
