import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GridShapeComponent } from '../../../shared/components/common/grid-shape/grid-shape.component';

@Component({
  selector: 'app-access-denied',
  imports: [RouterModule, GridShapeComponent],
  templateUrl: './access-denied.component.html',
  styles: ``,
})
export class AccessDeniedComponent {
  requested = false;
  currentYear: number = new Date().getFullYear();

  get message(): string {
    return 'La cuenta seleccionada no tiene permitido el acceso a DASI, o no está habilitada por el administrador.';
  }

  requestAccess(): void {
    if (this.requested) {
      return;
    }
    this.requested = true;
  }
}