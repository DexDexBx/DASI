import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dasi-module-header',
  templateUrl: './module-header.component.html',
})
export class DasiModuleHeaderComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
