import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Notificacion,
  CreateNotificacion,
  NotificacionQuery,
  NotificacionList,
} from '../models/notificacion.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificacionesApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: NotificacionQuery): Observable<NotificacionList> {
    return this.api.get<NotificacionList>('/notificaciones', query);
  }

  findOne(id: string): Observable<Notificacion> {
    return this.api.getById<Notificacion>('/notificaciones', id);
  }

  create(dto: CreateNotificacion): Observable<Notificacion> {
    return this.api.post<Notificacion>('/notificaciones', dto);
  }

  marcarLeida(id: string, leida: boolean): Observable<Notificacion> {
    return this.api.patch<Notificacion>('/notificaciones', `${id}/leida`, { leida });
  }

  marcarTodasLeidas(usuarioId: string): Observable<{ message: string; count: number }> {
    return this.api.patch<{ message: string; count: number }>(
      '/notificaciones',
      'marcar-todas-leidas',
      { usuario_id: usuarioId },
    );
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/notificaciones', id);
  }
}