import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../core/models/api-response';
import { ApiUrlService } from '../../core/services/api-url.service';

export interface ProfesorDto {
  profesorId: number;
  nombre: string;
  fechaRegistro: string;
  fechaModificacion: string | null;
  estado: number;
}

@Injectable({ providedIn: 'root' })
export class ProfesoresService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiUrlService);

  listar(soloActivos = true): Observable<ApiResponse<ProfesorDto[]>> {
    const params = new HttpParams().set('soloActivos', soloActivos);
    return this.http.get<ApiResponse<ProfesorDto[]>>(this.api.v1('Profesores'), { params });
  }

  obtener(id: number): Observable<ApiResponse<ProfesorDto>> {
    return this.http.get<ApiResponse<ProfesorDto>>(this.api.v1(`Profesores/${id}`));
  }

  crear(data: CrearProfesorPayload): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.api.v1('Profesores'), data);
  }

  actualizar(id: number, data: ActualizarProfesorPayload): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(this.api.v1(`Profesores/${id}`), data);
  }

  eliminar(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(this.api.v1(`Profesores/${id}`));
  }
}

export interface CrearProfesorPayload {
  nombre: string;
}

export interface ActualizarProfesorPayload {
  nombre: string;
  estado: number;
}
