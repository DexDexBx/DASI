import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../../../core/services/session.service';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-user-meta-card',
  imports: [ModalComponent, InputFieldComponent, ButtonComponent, FormsModule],
  templateUrl: './user-meta-card.component.html',
  styles: ``,
})
export class UserMetaCardComponent {
  constructor(private readonly session: SessionService) {
    this.buildUser();
  }

  isInfoModalOpen = false;
  openInfoModal() {
    this.isInfoModalOpen = true;
  }
  closeInfoModal() {
    this.isInfoModalOpen = false;
  }

  user = {
    firstName: '—',
    lastName: '',
    role: '—',
    location: '—',
    avatar: 'images/user/owner.png',
    social: {
      facebook: 'https://www.facebook.com/',
      x: 'https://x.com/',
      linkedin: 'https://www.linkedin.com/',
      instagram: 'https://instagram.com/',
    },
    email: '—',
    phone: '—',
    bio: '—',
  };

  private buildUser(): void {
    const sesion = this.session.sesion;
    const user = sesion?.user;
    if (!user) {
      return;
    }
    const names = user.nombre.split(' ');
    const dependencia = sesion?.dependencia?.nombre ?? '—';
    const cargo = sesion?.cargo?.nombre ?? '';
    const roles = sesion?.roles?.map((r) => r.nombre).join(', ');
    this.user = {
      firstName: names[0] ?? '—',
      lastName: names.slice(1).join(' ') || (names[0] ?? '—'),
      role: roles || '—',
      location: cargo ? `${dependencia} · ${cargo}` : dependencia,
      avatar: user.avatar_url ?? this.user.avatar,
      social: this.user.social,
      email: user.email || '—',
      phone: '—',
      bio: cargo || '—',
    };
  }

  handleInfoSave(): void {
    this.closeInfoModal();
  }
}