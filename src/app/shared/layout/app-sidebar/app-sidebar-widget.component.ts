import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-sidebar-widget',
  imports: [RouterModule],
  template: `
    <div
      class="mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]"
    >
      @if (session.isLoggedIn) {
        <div
          class="mx-auto mb-3 flex size-12 items-center justify-center overflow-hidden rounded-full bg-brand-500 text-sm font-semibold text-white shadow-sm"
        >
          @if (user?.avatar_url) {
            <img [src]="user?.avatar_url" referrerpolicy="no-referrer" [alt]="user?.nombre" class="size-full object-cover" />
          } @else {
            {{ initials }}
          }
        </div>
        <h3
          class="truncate text-theme-sm font-semibold text-gray-900 dark:text-white"
        >
          {{ session.sesion?.user.nombre }}
        </h3>
        <p
          class="mt-0.5 truncate text-theme-xs font-medium text-brand-500 dark:text-brand-400"
        >
          {{ rolLabel }}
        </p>
        <p class="mt-1 truncate text-theme-xs text-gray-500 dark:text-gray-400">
          {{ session.sesion?.cargo?.nombre ?? 'Sin cargo' }}
        </p>
        <p class="truncate text-theme-xs text-gray-500 dark:text-gray-400">
          {{ session.sesion?.dependencia?.nombre ?? 'Sin dependencia' }}
        </p>
        <a
          routerLink="/profile"
          class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white/60 p-2.5 text-theme-xs font-medium text-gray-700 transition-colors hover:border-brand-300 hover:text-brand-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:border-brand-800 dark:hover:text-brand-400"
        >
          <svg
            class="fill-gray-500 dark:fill-gray-400"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z"
              fill=""
            />
          </svg>
          Mi perfil
        </a>
      } @else {
        <p class="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
          Inicia sesión para acceder a DASI.
        </p>
        <a
          routerLink="/signin"
          class="flex items-center justify-center w-full p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600"
        >
          Iniciar sesión
        </a>
      }
    </div>
  `,
})
export class SidebarWidgetComponent {
  readonly session = inject(SessionService);

  get user() {
    return this.session.sesion?.user ?? null;
  }

  get initials(): string {
    const nombre = this.user?.nombre ?? '';
    return (
      nombre
        .split(/\s+/)
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?'
    );
  }

  get rolLabel(): string {
    return this.session.sesion?.roles?.[0]?.nombre ?? 'Sin rol';
  }
}