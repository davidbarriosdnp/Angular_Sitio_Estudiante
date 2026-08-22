import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../core/models/api-response';
import { ApiUrlService } from '../../core/services/api-url.service';

export interface SedeDto {
  sedeId: number;
  nombre: string;
  direccion: string;
  fechaRegistro: string;
  fechaModificacion: string | null;
  estado: number;
}

@Injectable({ providedIn: 'root' })
export class SedesService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiUrlService);

  listar(soloActivos = true): Observable<ApiResponse<SedeDto[]>> {
    const params = new HttpParams().set('soloActivos', soloActivos);
    return this.http.get<ApiResponse<SedeDto[]>>(this.api.v1('Sedes'), { params });
  }

  obtener(id: number): Observable<ApiResponse<SedeDto>> {
    return this.http.get<ApiResponse<SedeDto>>(this.api.v1(`Sedes/${id}`));
  }

  crear(data: CrearSedePayload): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.api.v1('Sedes'), data);
  }

  actualizar(id: number, data: ActualizarSedePayload): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(this.api.v1(`Sedes/${id}`), data);
  }

  eliminar(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(this.api.v1(`Sedes/${id}`));
  }
}

export interface CrearSedePayload {
  nombre: string;
  direccion: string;
}

export interface ActualizarSedePayload {
  nombre: string;
  direccion: string;
  estado: number;
}
