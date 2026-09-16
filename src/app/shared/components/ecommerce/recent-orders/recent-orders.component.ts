import { Component } from '@angular/core';
import { BadgeComponent } from '../../ui/badge/badge.component';

interface Activity {
  id: number;
  activity: string;
  project: string;
  responsible: string;
  dueDate: string;
  status: 'Pendiente' | 'En curso' | 'Vencida' | 'Completada';
}

@Component({
  selector: 'app-recent-orders',
  imports: [BadgeComponent],
  templateUrl: './recent-orders.component.html'
})
export class RecentOrdersComponent {
  tableData: Activity[] = [
    { id: 1, activity: 'Validar informe de avance', project: 'Modernización institucional', responsible: 'María Torres', dueDate: '10 Sep 2026', status: 'Pendiente' },
    { id: 2, activity: 'Registrar evidencia fotográfica', project: 'Mejora de infraestructura', responsible: 'Carlos Rojas', dueDate: '11 Sep 2026', status: 'En curso' },
    { id: 3, activity: 'Actualizar matriz de riesgos', project: 'Gestión de calidad', responsible: 'Lucía Mendoza', dueDate: '08 Sep 2026', status: 'Vencida' },
    { id: 4, activity: 'Revisar observaciones registradas', project: 'Fortalecimiento académico', responsible: 'Jorge Salazar', dueDate: '13 Sep 2026', status: 'Pendiente' },
    { id: 5, activity: 'Consolidar reporte mensual', project: 'Seguimiento institucional', responsible: 'Andrea Castro', dueDate: '06 Sep 2026', status: 'Completada' },
  ];

  getBadgeColor(status: Activity['status']): 'success' | 'warning' | 'error' {
    if (status === 'Completada') return 'success';
    if (status === 'Pendiente' || status === 'En curso') return 'warning';
    return 'error';
  }
}
