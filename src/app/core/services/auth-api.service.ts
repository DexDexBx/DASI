import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Sesion } from '../models/sesion.model';
import { ApiClient } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private readonly api: ApiClient) {}

  /** Registra el inicio de sesión (el backend valida el Firebase ID Token). */
  iniciarSesion(): Observable<Sesion> {
    return this.api.post<Sesion>('/auth/session', {});
  }

  me(): Observable<Sesion> {
    return this.api.get<Sesion>('/auth/me');
  }
}
