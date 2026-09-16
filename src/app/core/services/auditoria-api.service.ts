import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiListResponse } from '../models/api-response.model';
import {
  Auditoria,
  CreateAuditoria,
  AuditoriaQuery,
} from '../models/auditoria.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuditoriaApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: AuditoriaQuery = {}): Observable<ApiListResponse<Auditoria>> {
    return this.api.get<ApiListResponse<Auditoria>>('/auditoria', query);
  }

  findOne(id: string): Observable<Auditoria> {
    return this.api.getById<Auditoria>('/auditoria', id);
  }

  registrar(dto: CreateAuditoria): Observable<Auditoria> {
    return this.api.post<Auditoria>('/auditoria', dto);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/auditoria', id);
  }
}