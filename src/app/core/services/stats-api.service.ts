import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StatsDashboard } from '../models/stats.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class StatsApiService {
  constructor(private readonly api: ApiClient) {}

  resumen(usuarioId?: string): Observable<StatsDashboard> {
    return this.api.get<StatsDashboard>('/stats', { usuario_id: usuarioId });
  }
}