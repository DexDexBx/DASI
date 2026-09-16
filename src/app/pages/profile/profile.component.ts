import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DasiModuleHeaderComponent } from '../../shared/components/dasi/module-header/module-header.component';
import { UserAddressCardComponent } from '../../shared/components/user-profile/user-address-card/user-address-card.component';
import { UserMetaCardComponent } from '../../shared/components/user-profile/user-meta-card/user-meta-card.component';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    DasiModuleHeaderComponent,
    UserMetaCardComponent,
    UserAddressCardComponent,
    FormsModule,
  ],
  templateUrl: './profile.component.html',
  styles: ``,
})
export class ProfileComponent {
  twoFactorEnabled = false;
}