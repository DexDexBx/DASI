import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { SessionService } from '../../../core/services/session.service';
import { FirebaseAuthService } from '../../../core/services/firebase-auth.service';
import { ApiError } from '../../../core/services/api.service';

interface FirebaseErrorLike {
  code?: string;
}

const MENSAJES_FIREBASE: Record<string, string> = {
  'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de completar el ingreso.',
  'auth/cancelled-popup-request': 'Se canceló el inicio de sesión con Google.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permita las ventanas emergentes e intente de nuevo.',
  'auth/network-request-failed': 'No hay conexión con Google. Verifique su red e intente de nuevo.',
};

@Component({
  selector: 'app-sign-in',
  imports: [RouterModule, AuthPageLayoutComponent],
  templateUrl: './sign-in.component.html',
})
export class SignInComponent implements OnInit {
  private readonly session = inject(SessionService);
  private readonly firebase = inject(FirebaseAuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal('');
  readonly firebaseConfigured = this.firebase.isConfigured;

  ngOnInit(): void {
    if (this.session.isLoggedIn) {
      this.router.navigate(['/']);
    }
  }

  async loginConGoogle(): Promise<void> {
    if (this.submitting()) return;

    this.error.set('');
    this.submitting.set(true);

    try {
      await this.session.signInWithGoogle();
      await this.router.navigate(['/']);
    } catch (err) {
      this.error.set(this.mensajeDeError(err));
    } finally {
      this.submitting.set(false);
    }
  }

  private mensajeDeError(err: unknown): string {
    if (err instanceof ApiError) return err.message;

    const code = (err as FirebaseErrorLike | null)?.code;
    if (code && MENSAJES_FIREBASE[code]) return MENSAJES_FIREBASE[code];

    return 'No se pudo iniciar sesión con Google. Intente nuevamente.';
  }
}
