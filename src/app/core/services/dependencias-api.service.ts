import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiListResponse } from '../models/api-response.model';
import {
  Dependencia,
  CreateDependencia,
  UpdateDependencia,
  DependenciaQuery,
} from '../models/dependencia.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class DependenciasApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: DependenciaQuery = {}): Observable<ApiListResponse<Dependencia>> {
    return this.api.get<ApiListResponse<Dependencia>>('/dependencias', query);
  }

  findOne(id: string): Observable<Dependencia> {
    return this.api.getById<Dependencia>('/dependencias', id);
  }

  create(dto: CreateDependencia): Observable<Dependencia> {
    return this.api.post<Dependencia>('/dependencias', dto);
  }

  update(id: string, dto: UpdateDependencia): Observable<Dependencia> {
    return this.api.patch<Dependencia>('/dependencias', id, dto);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/dependencias', id);
  }
}