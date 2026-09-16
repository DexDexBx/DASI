import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Permiso, CreatePermiso, UpdatePermiso, PermisoQuery } from '../models/permiso.model';
import { ApiListResponse } from '../models/api-response.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class PermisosApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: PermisoQuery = {}): Observable<ApiListResponse<Permiso>> {
    return this.api.get<ApiListResponse<Permiso>>('/permisos', query);
  }

  findOne(id: string): Observable<Permiso> {
    return this.api.getById<Permiso>('/permisos', id);
  }

  create(dto: CreatePermiso): Observable<Permiso> {
    return this.api.post<Permiso>('/permisos', dto);
  }

  update(id: string, dto: UpdatePermiso): Observable<Permiso> {
    return this.api.patch<Permiso>('/permisos', id, dto);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/permisos', id);
  }
}