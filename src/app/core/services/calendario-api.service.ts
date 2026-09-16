import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiListResponse } from '../models/api-response.model';
import {
  EventoCalendario,
  CreateEvento,
  UpdateEvento,
  EventoQuery,
} from '../models/evento-calendario.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class CalendarioApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: EventoQuery = {}): Observable<ApiListResponse<EventoCalendario>> {
    return this.api.get<ApiListResponse<EventoCalendario>>('/calendario', query);
  }

  findOne(id: string): Observable<EventoCalendario> {
    return this.api.getById<EventoCalendario>('/calendario', id);
  }

  create(dto: CreateEvento): Observable<EventoCalendario> {
    return this.api.post<EventoCalendario>('/calendario', dto);
  }

  update(id: string, dto: UpdateEvento): Observable<EventoCalendario> {
    return this.api.patch<EventoCalendario>('/calendario', id, dto);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/calendario', id);
  }
}