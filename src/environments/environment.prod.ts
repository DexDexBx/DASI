import { firebaseConfig } from './firebase.config';

export const environment = {
  production: true,
  // El navegador usa /dasi/api; Caddy retira /dasi y Nginx entrega /api a NestJS.
  apiUrl: '/dasi/api',
  firebaseConfig,
};
