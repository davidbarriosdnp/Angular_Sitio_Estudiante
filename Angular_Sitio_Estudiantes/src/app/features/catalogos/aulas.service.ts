import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../core/models/api-response';
import { ApiUrlService } from '../../core/services/api-url.service';

export interface AulaDto {
  aulaId: number;
  nombre: string;
  capacidad: number;
  sedeId: number;
  sedeNombre: string;
  fechaRegistro: string;
  fechaModificacion: string | null;
  estado: number;
}

@Injectable({ providedIn: 'root' })
export class AulasService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiUrlService);

  listar(soloActivos = true): Observable<ApiResponse<AulaDto[]>> {
    const params = new HttpParams().set('soloActivos', soloActivos);
    return this.http.get<ApiResponse<AulaDto[]>>(this.api.v1('Aulas'), { params });
  }

  obtener(id: number): Observable<ApiResponse<AulaDto>> {
    return this.http.get<ApiResponse<AulaDto>>(this.api.v1(`Aulas/${id}`));
  }

  crear(data: CrearAulaPayload): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.api.v1('Aulas'), data);
  }

  actualizar(id: number, data: ActualizarAulaPayload): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(this.api.v1(`Aulas/${id}`), data);
  }

  eliminar(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(this.api.v1(`Aulas/${id}`));
  }
}

export interface CrearAulaPayload {
  nombre: string;
  capacidad: number;
  sedeId: number;
}

export interface ActualizarAulaPayload {
  nombre: string;
  capacidad: number;
  sedeId: number;
  estado: number;
}
