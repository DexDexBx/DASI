import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiListResponse } from '../models/api-response.model';
import { Modulo, CreateModulo, UpdateModulo, ModuloQuery } from '../models/modulo.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class ModulosApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: ModuloQuery = {}): Observable<ApiListResponse<Modulo>> {
    return this.api.get<ApiListResponse<Modulo>>('/modulos', query);
  }

  findOne(id: string): Observable<Modulo> {
    return this.api.getById<Modulo>('/modulos', id);
  }

  create(dto: CreateModulo): Observable<Modulo> {
    return this.api.post<Modulo>('/modulos', dto);
  }

  update(id: string, dto: UpdateModulo): Observable<Modulo> {
    return this.api.patch<Modulo>('/modulos', id, dto);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/modulos', id);
  }
}