import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DasiModuleHeaderComponent } from '../../../shared/components/dasi/module-header/module-header.component';

interface InfoCard {
  title: string;
  body: string;
  icon: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-dasi-institucional',
  imports: [DasiModuleHeaderComponent],
  templateUrl: './institucional.component.html',
})
export class InstitucionalComponent implements OnInit {
  kind: 'ayuda' | 'acerca' = 'ayuda';
  cards: InfoCard[] = [];
  faqs: FaqItem[] = [];
  openFaq: number | null = 0;

  constructor(private readonly route: ActivatedRoute, private readonly router: Router) {}

  ngOnInit(): void {
    this.kind = (this.route.snapshot.data['kind'] as 'ayuda' | 'acerca') ?? 'ayuda';
    this.cards =
      this.kind === 'ayuda'
        ? []
        : [
            {
              title: 'Qué es DASI',
              body: 'DASI significa Digitalización, Administración y Seguimiento Institucional. Centraliza la gestión de proyectos de la institución: creación, aprobación, ejecución, evidencias y supervisión.',
              icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zM4 12c0 2.21 3.582 4 8 4s8-1.79 8-4s-3.582-4-8-4-8 1.79-8 4z',
            },
            {
              title: 'Versión y tecnología',
              body: 'DASI V.01 se construye con Angular (componentes standalone), TypeScript estricto, Tailwind CSS v4, RxJS y ApexCharts. El backend prepara NestJS con PostgreSQL para fases posteriores.',
              icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            },
            {
              title: 'Fase actual',
              body: 'El proyecto está en fase de diseño, navegación y validación visual, ya con la lógica del flujo demo: Proyecto → Workflow (fases) → Actividades base → Responsables → Calendario, sobre datos ficticios.',
              icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
            },
          ];
    this.faqs =
      this.kind === 'ayuda'
        ? [
            {
              question: '¿Cómo creo un proyecto?',
              answer:
                'Desde Proyectos → “Nuevo proyecto”. El coordinador (Christ, Jefe de TI) registra el proyecto; queda en estado Pendiente.',
            },
            {
              question: '¿Cómo derivo un proyecto a Administración General?',
              answer:
                'Abre el detalle del proyecto y pulsa “Derivar a Administración General”. Solo puedes derivar un proyecto Pendiente y si eres responsable/administrador del mismo.',
            },
            {
              question: '¿Cómo se aprueba un proyecto?',
              answer:
                'Juan (D.G. Administración) aprueba el proyecto desde el detalle o desde el Kanban (Acciones → Aprobar). Tras aprobarlo, el proyecto pasa a Aprobado.',
            },
            {
              question: '¿Qué pasa al aprobarse un proyecto?',
              answer:
                'DASI activa automáticamente el workflow con la plantilla base: las fases Planificación, Implementación, Pruebas y Cierre con sus actividades base. El coordinador es el responsable inicial de cada fase y actividad.',
            },
            {
              question: 'Mi proyecto no tiene workflow, ¿cómo lo creo?',
              answer:
                'Ve a Seguimiento → “Crear workflow”, selecciona el proyecto y pulsa “Activar workflow”. Se aplicará la plantilla base (puedes revisarla en “Plantillas”). También se activa solo al aprobar el proyecto.',
            },
            {
              question: '¿Cómo asigno responsables?',
              answer:
                'Desde Workflow → “Configurar etapa” solo puedes asignar a usuarios del equipo del proyecto (no a externos). Para actividades con fecha usa el detalle del proyecto o la lista de actividades.',
            },
            {
              question: '¿Cómo agrego evidencias?',
              answer:
                'Desde la página Evidencias o desde el detalle del proyecto. Las evidencias quedan asociadas al proyecto (y opcionalmente a una actividad).',
            },
            {
              question: '¿Qué significan los estados de un proyecto?',
              answer:
                'Pendiente (en espera de aprobación) → Aprobado → En curso → Implementado → En revisión → Completado. El Kanban refleja este flujo; el Workflow refleja las fases operacionales del proyecto.',
            },
            {
              question: '¿Cómo hago seguimiento?',
              answer:
                'Usa Dashboard (métricas), Workflow (avance de fases), Kanban (estado de proyectos) y Calendario (actividades con responsable y fecha). Reportes e Indicadores agregan la visión institucional.',
            },
          ]
        : [];
  }

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }

  irA(path: string): void {
    this.router.navigate([path]);
  }
}