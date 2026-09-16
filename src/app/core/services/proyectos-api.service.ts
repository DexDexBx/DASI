import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiListResponse } from '../models/api-response.model';
import {
  Proyecto,
  CreateProyecto,
  UpdateProyecto,
  ProyectoQuery,
} from '../models/proyecto.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class ProyectosApiService {
  constructor(private readonly api: ApiClient) {}

  findAll(query: ProyectoQuery = {}): Observable<ApiListResponse<Proyecto>> {
    return this.api.get<ApiListResponse<Proyecto>>('/proyectos', query);
  }

  findOne(id: string, params: { usuario_id?: string } = {}): Observable<Proyecto> {
    return this.api.getById<Proyecto>('/proyectos', id, params);
  }

  create(dto: CreateProyecto): Observable<Proyecto> {
    return this.api.post<Proyecto>('/proyectos', dto);
  }

  update(id: string, dto: UpdateProyecto): Observable<Proyecto> {
    return this.api.patch<Proyecto>('/proyectos', id, dto);
  }

  cambiarEstado(
    id: string,
    dto: { estado: string; usuario_id: string; comentario?: string },
  ): Observable<Proyecto> {
    return this.api.patch<Proyecto>('/proyectos', `${id}/estado`, dto);
  }

  derivar(id: string, dto: { usuario_id: string; comentario?: string }): Observable<Proyecto> {
    return this.api.post<Proyecto>(`/proyectos/${id}/derivar`, dto);
  }

  activarWorkflow(id: string, dto: { usuario_id: string; comentario?: string }): Observable<Proyecto> {
    return this.api.post<Proyecto>(`/proyectos/${id}/activar-workflow`, dto);
  }

  agregarEtapa(
    id: string,
    dto: { usuario_id: string; etapa: string; accion_requerida?: string; responsable_id?: string },
  ): Observable<unknown> {
    return this.api.post<unknown>(`/proyectos/${id}/workflow`, dto);
  }

  updateWorkflow(
    id: string,
    etapa: string,
    dto: Record<string, unknown>,
  ): Observable<unknown> {
    return this.api.patch<unknown>('/proyectos', `${id}/workflow/${etapa}`, dto);
  }

  updateResponsabilidad(
    id: string,
    etapa: string,
    dto: Record<string, unknown>,
  ): Observable<unknown> {
    return this.api.patch<unknown>('/proyectos', `${id}/responsabilidades/${etapa}`, dto);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>('/proyectos', id);
  }
}