import { Injectable } from '@angular/core';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  Auth,
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { environment } from '../../../environments/environment';

/**
 * Servicio centralizado de Firebase Authentication (único proveedor: Google).
 * Inicializa Firebase de forma perezosa para que la app arranque aunque
 * firebaseConfig todavía no esté completado.
 */
@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private app?: FirebaseApp;
  private auth?: Auth;

  get isConfigured(): boolean {
    const config = environment.firebaseConfig;
    return Boolean(config.apiKey && config.projectId && config.appId);
  }

  /** Espera a que Firebase conozca el estado inicial de la sesión. */
  whenReady(): Promise<User | null> {
    if (!this.isConfigured) return Promise.resolve(null);

    return new Promise<User | null>((resolve, reject) => {
      let unsubscribe: (() => void) | undefined;
      unsubscribe = onAuthStateChanged(
        this.getAuth(),
        (user) => {
          unsubscribe?.();
          resolve(user);
        },
        reject,
      );
    });
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(this.getAuth(), provider);
  }

  /** Firebase ID Token vigente (se renueva automáticamente). */
  async getIdToken(): Promise<string | null> {
    if (!this.isConfigured) return null;
    const user = this.getAuth().currentUser;
    return user ? user.getIdToken() : null;
  }

  async signOut(): Promise<void> {
    if (!this.isConfigured) return;
    await signOut(this.getAuth());
  }

  private getAuth(): Auth {
    if (!this.isConfigured) {
      throw new Error(
        'Firebase no está configurado. Complete firebaseConfig en src/environments/environment.ts.',
      );
    }

    if (!this.auth) {
      this.app = initializeApp(environment.firebaseConfig as FirebaseOptions);
      this.auth = getAuth(this.app);
      // Analytics es opcional: solo se activa si el navegador lo soporta.
      void isSupported().then((ok) => {
        if (ok && this.app) getAnalytics(this.app);
      });
    }

    return this.auth;
  }
}
