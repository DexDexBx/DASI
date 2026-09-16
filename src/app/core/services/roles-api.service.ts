import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Rol, CreateRol, UpdateRol, RolQuery } from '../models/rol.model';
import { ApiListResponse } from '../models/api-response.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class RolesApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: RolQuery = {}): Observable<ApiListResponse<Rol>> {
    return this.api.get<ApiListResponse<Rol>>('/roles', query);
  }

  findOne(id: string): Observable<Rol> {
    return this.api.getById<Rol>('/roles', id);
  }

  create(dto: CreateRol): Observable<Rol> {
    return this.api.post<Rol>('/roles', dto);
  }

  update(id: string, dto: UpdateRol): Observable<Rol> {
    return this.api.patch<Rol>('/roles', id, dto);
  }

  setPermisos(id: string, permiso_ids: string[]): Observable<Rol> {
    return this.api.patch<Rol>('/roles', `${id}/permisos`, { permiso_ids });
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/roles', id);
  }
}