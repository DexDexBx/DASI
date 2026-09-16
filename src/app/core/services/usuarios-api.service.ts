import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Usuario,
  CreateUsuario,
  UpdateUsuario,
  UsuarioQuery,
} from '../models/usuario.model';
import { ApiListResponse } from '../models/api-response.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class UsuariosApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: UsuarioQuery = {}): Observable<ApiListResponse<Usuario>> {
    return this.api.get<ApiListResponse<Usuario>>('/usuarios', query);
  }

  findOne(id: string): Observable<Usuario> {
    return this.api.getById<Usuario>('/usuarios', id);
  }

  create(dto: CreateUsuario): Observable<Usuario> {
    return this.api.post<Usuario>('/usuarios', dto);
  }

  update(id: string, dto: UpdateUsuario): Observable<Usuario> {
    return this.api.patch<Usuario>('/usuarios', id, dto);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/usuarios', id);
  }

  toggleEstado(id: string): Observable<Usuario> {
    return this.api.patch<Usuario>('/usuarios', `${id}/estado`, {});
  }
}