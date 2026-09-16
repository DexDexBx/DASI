import { Component, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../../../core/services/session.service';
import { Sesion } from '../../../../core/models/sesion.model';

export interface Language {
  id: string;
  name: string;
  shortName: string;
  flag: string;
  badge?: string;
}

@Component({
  selector: 'app-user-dropdown',
  standalone: true,
  templateUrl: './user-dropdown.component.html',
  imports: [CommonModule, RouterModule, FormsModule],
})
export class UserDropdownComponent implements OnInit {
  isOpen = false;
  subDropdownOpen = false;
  currentLocale = 'en';
  readonly session = inject(SessionService);

  languages: Language[] = [
    {
      id: 'en',
      name: 'English',
      shortName: 'English',
      flag: 'flag-us.svg',
    },
    {
      id: 'ar',
      name: 'Arabic (Saudi)',
      shortName: 'Arabic',
      flag: 'flag-sa.svg',
      badge: 'RTL',
    },
    {
      id: 'es',
      name: 'Español',
      shortName: 'Español',
      flag: 'flag-es.svg',
    },
    {
      id: 'de',
      name: 'Deutsch',
      shortName: 'Deutsch',
      flag: 'flag-de.svg',
    },
  ];

  constructor(
    private elementRef: ElementRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const savedDir = localStorage.getItem('dir');
    if (savedDir === 'rtl' || document.documentElement.getAttribute('dir') === 'rtl') {
      this.currentLocale = 'ar';
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      this.currentLocale = 'en';
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }

  get currentLang(): Language {
    return this.languages.find((l) => l.id === this.currentLocale) || this.languages[0];
  }

  get user(): Sesion['user'] | null {
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

  get dependenciaNombre(): string {
    return this.session.sesion?.dependencia?.nombre ?? 'Sin dependencia';
  }

  signOut(): void {
    this.session.signOut();
    this.closeDropdown();
    this.router.navigate(['/signin']);
  }

  toggleDropdown(event?: Event): void {
    event?.stopPropagation();
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.subDropdownOpen = false;
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.subDropdownOpen = false;
  }

  toggleSubDropdown(event: Event): void {
    event.stopPropagation();
    this.subDropdownOpen = !this.subDropdownOpen;
  }

  selectLanguage(id: string, event?: Event): void {
    event?.stopPropagation();
    this.currentLocale = id;
    if (id === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      localStorage.setItem('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      localStorage.setItem('dir', 'ltr');
    }
    this.closeDropdown();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}