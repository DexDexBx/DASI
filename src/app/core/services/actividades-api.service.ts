import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiListResponse } from '../models/api-response.model';
import {
  Actividad,
  CreateActividad,
  UpdateActividad,
  ActividadQuery,
} from '../models/actividad.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class ActividadesApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: ActividadQuery = {}): Observable<ApiListResponse<Actividad>> {
    return this.api.get<ApiListResponse<Actividad>>('/actividades', query);
  }

  findOne(id: string): Observable<Actividad> {
    return this.api.getById<Actividad>('/actividades', id);
  }

  create(dto: CreateActividad): Observable<Actividad> {
    return this.api.post<Actividad>('/actividades', dto);
  }

  update(id: string, dto: UpdateActividad): Observable<Actividad> {
    return this.api.patch<Actividad>('/actividades', id, dto);
  }

  cambiarEstado(
    id: string,
    dto: { estado: string; comentario?: string },
  ): Observable<Actividad> {
    return this.api.patch<Actividad>('/actividades', `${id}/estado`, dto);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/actividades', id);
  }
}