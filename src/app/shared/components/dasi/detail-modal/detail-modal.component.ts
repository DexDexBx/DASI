import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalComponent } from '../../ui/modal/modal.component';

@Component({
  selector: 'app-dasi-detail-modal',
  imports: [ModalComponent],
  templateUrl: './detail-modal.component.html',
})
export class DasiDetailModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Detalle';
  @Input() items: { label: string; value: string }[] = [];
  @Output() close = new EventEmitter<void>();
}
