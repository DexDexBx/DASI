import { Component } from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';

@Component({
  selector: 'app-demographic-card',
  imports: [
    DropdownComponent,
    DropdownItemComponent,
  ],
  templateUrl: './demographic-card.component.html',
})
export class DemographicCardComponent {
  isOpen = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  projectStatuses = [
    {
      name: 'En ejecución',
      projects: '8 proyectos',
      percent: 44,
    },
    {
      name: 'En planificación',
      projects: '5 proyectos',
      percent: 28,
    },
    {
      name: 'En riesgo',
      projects: '3 proyectos',
      percent: 17,
    },
    {
      name: 'Finalizados',
      projects: '2 proyectos',
      percent: 11,
    },
  ];
}
