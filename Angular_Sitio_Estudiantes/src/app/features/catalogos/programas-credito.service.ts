import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../core/models/api-response';
import { ApiUrlService } from '../../core/services/api-url.service';

export interface ProgramaCreditoDto {
  programaCreditoId: number;
  nombre: string;
  creditosPorMateria: number;
  maxMateriasPorEstudiante: number;
  fechaRegistro: string;
  fechaModificacion: string | null;
  estado: number;
}

@Injectable({ providedIn: 'root' })
export class ProgramasCreditoService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiUrlService);

  listar(soloActivos = true): Observable<ApiResponse<ProgramaCreditoDto[]>> {
    const params = new HttpParams().set('soloActivos', soloActivos);
    return this.http.get<ApiResponse<ProgramaCreditoDto[]>>(this.api.v1('ProgramasCredito'), { params });
  }

  obtener(id: number): Observable<ApiResponse<ProgramaCreditoDto>> {
    return this.http.get<ApiResponse<ProgramaCreditoDto>>(this.api.v1(`ProgramasCredito/${id}`));
  }

  crear(data: CrearProgramaPayload): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.api.v1('ProgramasCredito'), data);
  }

  actualizar(id: number, data: ActualizarProgramaPayload): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(this.api.v1(`ProgramasCredito/${id}`), data);
  }

  eliminar(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(this.api.v1(`ProgramasCredito/${id}`));
  }
}

export interface CrearProgramaPayload {
  nombre: string;
  creditosPorMateria: number;
  maxMateriasPorEstudiante: number;
}

export interface ActualizarProgramaPayload {
  nombre: string;
  creditosPorMateria: number;
  maxMateriasPorEstudiante: number;
  estado: number;
}
