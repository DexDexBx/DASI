import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HealthResponse, HealthDbResponse } from '../models/health.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class HealthApiService {
  constructor(private readonly api: ApiClient) {}

  check(): Observable<HealthResponse> {
    return this.api.get<HealthResponse>('/health');
  }

  checkDb(): Observable<HealthDbResponse> {
    return this.api.get<HealthDbResponse>('/health/db');
  }
}