import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiListResponse } from '../models/api-response.model';
import {
  Observacion,
  CreateObservacion,
  UpdateObservacion,
  ObservacionQuery,
} from '../models/observacion.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class ObservacionesApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: ObservacionQuery = {}): Observable<ApiListResponse<Observacion>> {
    return this.api.get<ApiListResponse<Observacion>>('/observaciones', query);
  }

  findOne(id: string): Observable<Observacion> {
    return this.api.getById<Observacion>('/observaciones', id);
  }

  create(dto: CreateObservacion): Observable<Observacion> {
    return this.api.post<Observacion>('/observaciones', dto);
  }

  update(id: string, dto: UpdateObservacion): Observable<Observacion> {
    return this.api.patch<Observacion>('/observaciones', id, dto);
  }

  cambiarEstado(id: string, estado: string): Observable<Observacion> {
    return this.api.patch<Observacion>('/observaciones', `${id}/estado`, { estado });
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/observaciones', id);
  }
}