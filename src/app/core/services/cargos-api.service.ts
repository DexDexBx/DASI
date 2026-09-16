import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiListResponse } from '../models/api-response.model';
import { Cargo, CreateCargo, UpdateCargo, CargoQuery } from '../models/cargo.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class CargosApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: CargoQuery = {}): Observable<ApiListResponse<Cargo>> {
    return this.api.get<ApiListResponse<Cargo>>('/cargos', query);
  }

  findOne(id: string): Observable<Cargo> {
    return this.api.getById<Cargo>('/cargos', id);
  }

  create(dto: CreateCargo): Observable<Cargo> {
    return this.api.post<Cargo>('/cargos', dto);
  }

  update(id: string, dto: UpdateCargo): Observable<Cargo> {
    return this.api.patch<Cargo>('/cargos', id, dto);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/cargos', id);
  }
}