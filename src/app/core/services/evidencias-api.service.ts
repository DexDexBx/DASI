import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiListResponse } from '../models/api-response.model';
import {
  Evidencia,
  CreateEvidencia,
  UpdateEvidencia,
  EvidenciaQuery,
} from '../models/evidencia.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class EvidenciasApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: EvidenciaQuery = {}): Observable<ApiListResponse<Evidencia>> {
    return this.api.get<ApiListResponse<Evidencia>>('/evidencias', query);
  }

  findOne(id: string): Observable<Evidencia> {
    return this.api.getById<Evidencia>('/evidencias', id);
  }

  create(dto: CreateEvidencia): Observable<Evidencia> {
    return this.api.post<Evidencia>('/evidencias', dto);
  }

  update(id: string, dto: UpdateEvidencia): Observable<Evidencia> {
    return this.api.patch<Evidencia>('/evidencias', id, dto);
  }

  cambiarEstado(
    id: string,
    dto: { estado: string; comentario?: string },
  ): Observable<Evidencia> {
    return this.api.patch<Evidencia>('/evidencias', `${id}/estado`, dto);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/evidencias', id);
  }
}