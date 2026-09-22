import { Component, ElementRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SessionService } from '../../../../core/services/session.service';
import { Sesion } from '../../../../core/models/sesion.model';

@Component({
  selector: 'app-user-dropdown',
  standalone: true,
  templateUrl: './user-dropdown.component.html',
  imports: [CommonModule, RouterModule],
})
export class UserDropdownComponent implements OnInit {
  isOpen = false;
  readonly session = inject(SessionService);

  constructor(
    private elementRef: ElementRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const savedDir = localStorage.getItem('dir');
    document.documentElement.setAttribute('dir', savedDir === 'rtl' ? 'rtl' : 'ltr');
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
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}