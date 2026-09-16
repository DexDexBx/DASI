import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../../ui/modal/modal.component';

@Component({
  selector: 'app-dasi-confirm-modal',
  imports: [ModalComponent],
  templateUrl: './confirm-modal.component.html',
})
export class DasiConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = '¿Confirmar acción?';
  @Input() message = '';
  @Input() confirmLabel = 'Confirmar';
  @Input() cancelLabel = 'Cancelar';
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();
}