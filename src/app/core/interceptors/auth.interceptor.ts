import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { FirebaseAuthService } from '../services/firebase-auth.service';

/** Adjunta el Firebase ID Token vigente a cada petición al backend. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const firebase = inject(FirebaseAuthService);

  return from(firebase.getIdToken()).pipe(
    switchMap((token) => {
      const request = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;
      return next(request);
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && typeof window !== 'undefined') {
        // Respeta el base href (/dasi/) y evita bucles en la pantalla de login.
        const signInUrl = new URL('signin', document.baseURI);
        if (!window.location.pathname.startsWith(signInUrl.pathname)) {
          window.location.assign(signInUrl.toString());
        }
      }
      return throwError(() => error);
    }),
  );
};
