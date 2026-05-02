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
}
