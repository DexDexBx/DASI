import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthApiService } from './auth-api.service';
import { ApiError } from './api.service';
import { FirebaseAuthService } from './firebase-auth.service';
import { Sesion } from '../models/sesion.model';

/**
 * Estado de sesión de DASI. La identidad la gestiona Firebase (Google);
 * el perfil, roles y permisos se obtienen del backend con el Firebase ID Token.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly authApi = inject(AuthApiService);
  private readonly firebase = inject(FirebaseAuthService);
  private readonly router = inject(Router);

  private readonly sesionSubject = new BehaviorSubject<Sesion | null>(null);
  private readonly readyPromise: Promise<void>;

  readonly sesion$: Observable<Sesion | null> = this.sesionSubject.asObservable();
  readonly isLoggedIn$: Observable<boolean> = this.sesion$.pipe(map((s) => s !== null));

  constructor() {
    this.readyPromise = this.restoreSession();
  }

  get sesion(): Sesion | null {
    return this.sesionSubject.getValue();
  }

  get isLoggedIn(): boolean {
    return this.sesionSubject.getValue() !== null;
  }

  /** Resuelve cuando se conoce si hay una sesión válida al arrancar la app. */
  ready(): Promise<void> {
    return this.readyPromise;
  }

  /**
   * Inicia sesión con Google. Si el backend rechaza la cuenta (no registrada o
   * inactiva), cierra la sesión de Firebase y propaga el error.
   */
  async signInWithGoogle(): Promise<void> {
    await this.firebase.signInWithGoogle();

    try {
      const sesion = await firstValueFrom(this.authApi.iniciarSesion());
      this.sesionSubject.next(sesion);
    } catch (err) {
      await this.firebase.signOut().catch(() => undefined);
      throw err;
    }
  }

  signOut(): void {
    this.sesionSubject.next(null);
    this.firebase
      .signOut()
      .catch(() => undefined)
      .finally(() => this.router.navigate(['/signin']));
  }

  can(moduleSlug: string, accion: string): boolean {
    const sesion = this.sesionSubject.getValue();
    if (!sesion) return false;
    if (sesion.roles.some((rol) => rol.nombre === 'ADMINISTRADOR')) return true;
    return sesion.permisos.some(
      (p) => p.modulo_slug === moduleSlug && p.accion === accion,
    );
  }

  hasModulo(moduleSlug: string): boolean {
    const sesion = this.sesionSubject.getValue();
    if (!sesion) return false;
    if (sesion.roles.some((rol) => rol.nombre === 'ADMINISTRADOR')) return true;
    return sesion.modulos.some((m) => m.slug === moduleSlug);
  }

  redirectIfLogged(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/']);
    }
  }

  private async restoreSession(): Promise<void> {
    const usuarioFirebase = await this.firebase.whenReady().catch(() => null);
    if (!usuarioFirebase) {
      this.sesionSubject.next(null);
      return;
    }

    try {
      const sesion = await firstValueFrom(this.authApi.me());
      this.sesionSubject.next(sesion);
    } catch (err) {
      this.sesionSubject.next(null);
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        await this.firebase.signOut().catch(() => undefined);
      }
    }
  }
}
