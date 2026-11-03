import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { App, getApps, initializeApp } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';

/**
 * Verifica los Firebase ID Tokens.
 * Solo necesita FIREBASE_PROJECT_ID: la verificación usa las claves públicas
 * de Google, por lo que no se requiere ninguna credencial privada en el backend.
 */
@Injectable()
export class FirebaseAdminService {
  private app?: App;

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return getAuth(this.getApp()).verifyIdToken(idToken);
  }

  private getApp(): App {
    if (this.app) return this.app;

    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    if (!projectId) {
      throw new ServiceUnavailableException(
        'Firebase no está configurado en el servidor (FIREBASE_PROJECT_ID).',
      );
    }

    this.app = getApps()[0] ?? initializeApp({ projectId });
    return this.app;
  }
}
