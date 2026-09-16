import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Sesion } from '../models/sesion.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private readonly api: ApiClient) {}

  login(account: string): Observable<Sesion> {
    return this.api.post<Sesion>('/auth/login', { account });
  }
}