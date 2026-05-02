import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../core/models/api-response';

const BASE = '/api/v1/Estudiantes';

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

@Injectable({
  providedIn: 'root',
})
export class Estudiantes {
  private readonly http = inject(HttpClient);

  getEstudiantes(soloActivos = true): Observable<ApiResponse<EstudianteRegistroDto[]>> {
    const params = new HttpParams().set('soloActivos', soloActivos);
    return this.http.get<ApiResponse<EstudianteRegistroDto[]>>(BASE, { params });
  }

  getEstudiante(id: number): Observable<ApiResponse<EstudianteDetalleDto>> {
    return this.http.get<ApiResponse<EstudianteDetalleDto>>(`${BASE}/${id}`);
  }
}
