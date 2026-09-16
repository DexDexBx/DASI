import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthApiService } from './auth-api.service';
import { ApiError } from './api.service';
import { Sesion } from '../models/sesion.model';

const SESSION_STORAGE_KEY = 'dasi_session';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  private readonly sesionSubject = new BehaviorSubject<Sesion | null>(null);

  readonly sesion$: Observable<Sesion | null> = this.sesionSubject.asObservable();
  readonly isLoggedIn$: Observable<boolean> = this.sesion$.pipe(map((s) => s !== null));

  constructor() {
    this.restoreSession();
  }

  get sesion(): Sesion | null {
    return this.sesionSubject.getValue();
  }

  get isLoggedIn(): boolean {
    return this.sesionSubject.getValue() !== null;
  }

  signIn(account: string): Observable<Sesion> {
    return this.authApi.login(account).pipe(
      tap((sesion) => this.setSession(sesion)),
    );
  }

  signOut(): void {
    this.sesionSubject.next(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  can(moduleSlug: string, accion: string): boolean {
    const sesion = this.sesionSubject.getValue();
    if (!sesion) return false;
    return sesion.permisos.some((p) => p.modulo_slug === moduleSlug && p.accion === accion);
  }

  hasModulo(moduleSlug: string): boolean {
    const sesion = this.sesionSubject.getValue();
    if (!sesion) return false;
    return sesion.modulos.some((m) => m.slug === moduleSlug);
  }

  redirectIfLogged(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/']);
    }
  }

  private restoreSession(): void {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return;

    try {
      const sesion = JSON.parse(raw) as Sesion;
      if (!sesion?.user?.account) {
        throw new Error('Sesión guardada inválida');
      }
      this.sesionSubject.next(sesion);
      this.revalidateSession(sesion.user.account);
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  private setSession(sesion: Sesion): void {
    this.sesionSubject.next(sesion);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sesion));
  }

  private revalidateSession(account: string): void {
    this.authApi.login(account).subscribe({
      next: (sesion) => this.setSession(sesion),
      error: (err: unknown) => {
        if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
          this.signOut();
          this.router.navigate(['/signin']);
        }
      },
    });
  }
}