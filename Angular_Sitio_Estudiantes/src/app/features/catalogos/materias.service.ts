import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../core/models/api-response';
import { ApiUrlService } from '../../core/services/api-url.service';

export interface MateriaDetalleDto {
  materiaId: number;
  nombre: string;
  creditos: number;
  profesorId: number;
  programaCreditoId: number;
  fechaRegistro: string;
  fechaModificacion: string | null;
  estado: number;
  nombreProfesor: string;
}

@Injectable({ providedIn: 'root' })
export class MateriasService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiUrlService);

  listar(programaCreditoId: number | null, soloActivos = true): Observable<ApiResponse<MateriaDetalleDto[]>> {
    let params = new HttpParams().set('soloActivos', soloActivos);
    if (programaCreditoId != null) {
      params = params.set('programaCreditoId', programaCreditoId);
    }
    return this.http.get<ApiResponse<MateriaDetalleDto[]>>(this.api.v1('Materias'), { params });
  }

  obtener(id: number): Observable<ApiResponse<MateriaDetalleDto>> {
    return this.http.get<ApiResponse<MateriaDetalleDto>>(this.api.v1(`Materias/${id}`));
  }

  crear(data: CrearMateriaPayload): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.api.v1('Materias'), data);
  }

  actualizar(id: number, data: ActualizarMateriaPayload): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(this.api.v1(`Materias/${id}`), data);
  }

  eliminar(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(this.api.v1(`Materias/${id}`));
  }
}

export interface CrearMateriaPayload {
  nombre: string;
  creditos: number;
  profesorId: number;
  programaCreditoId: number;
}

export interface ActualizarMateriaPayload {
  nombre: string;
  creditos: number;
  profesorId: number;
  programaCreditoId: number;
  estado: number;
}
