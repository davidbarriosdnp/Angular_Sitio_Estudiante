import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import { AuthService } from '../../../auth/auth.service';
import { Estudiantes, InscripcionEstudianteDto } from '../../../estudiantes/services/estudiantes';
import { estudianteIdDesdeToken } from '../../../../core/utils/jwt-payload';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-inicio-page',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule, TableModule, TagModule, DatePipe, FullCalendarModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class InicioPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly estudiantesApi = inject(Estudiantes);
  private readonly cdr = inject(ChangeDetectorRef);

  protected materiasInscritas: InscripcionEstudianteDto[] = [];
  protected cargandoHorario = false;

  protected calendarOptions: CalendarOptions = {
    plugins: [timeGridPlugin],
    initialView: 'timeGridWeek',
    weekends: false,
    slotMinTime: '07:00:00',
    slotMaxTime: '21:00:00',
    allDaySlot: false,
    headerToolbar: {
      left: '',
      center: 'title',
      right: ''
    },
    events: [],
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    },
    height: 'auto',
    eventContent: (arg) => {
      // Personalizar el contenido del evento (tarjeta)
      return {
        html: `
          <div class="fc-event-main-frame" style="padding: 2px 4px; overflow: hidden;">
            <div class="fc-event-title" style="font-weight: bold; white-space: normal;">${arg.event.title}</div>
            <div style="font-size: 0.85em; opacity: 0.9; margin-top: 2px;">
              <i class="pi pi-user" style="font-size: 0.8em"></i> ${arg.event.extendedProps['profesor']}
            </div>
          </div>
        `
      };
    }
  };

  ngOnInit() {
    if (this.auth.esRolEstudiante() && this.auth.tienePerfilEstudiante()) {
      const estudianteId = estudianteIdDesdeToken(this.auth.getToken());
      if (estudianteId) {
        this.cargandoHorario = true;
        this.estudiantesApi.inscripcion(estudianteId, true).subscribe({
          next: (res) => {
            if (res.operacionExitosa && res.resultado) {
              this.materiasInscritas = res.resultado;
              this.calendarOptions = {
                ...this.calendarOptions,
                events: this.mapToEvents(res.resultado)
              };
            }
            this.cargandoHorario = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.cargandoHorario = false;
            this.cdr.markForCheck();
          }
        });
      }
    }
  }

  private mapToEvents(materias: InscripcionEstudianteDto[]): EventInput[] {
    // Asignar das lgicos para visualizacin, ya que la BD no especifica das exactos
    const daysMap = [
      [1, 3], // Lunes, Mircoles
      [2, 4], // Martes, Jueves
      [5, 5], // Viernes
    ];
    
    return materias.map((mat, index) => {
      const days = daysMap[index % daysMap.length];
      
      return {
        title: mat.nombreMateria + ' - ' + (mat.nombreAula || 'TBD'),
        startTime: mat.horaInicio || '08:00:00',
        endTime: mat.horaFin || '10:00:00',
        daysOfWeek: days,
        startRecur: mat.fechaInicio || '2026-08-01',
        endRecur: mat.fechaFin || '2026-12-15',
        backgroundColor: this.getColor(index),
        borderColor: this.getColor(index),
        extendedProps: {
          profesor: mat.nombreProfesor
        }
      };
    });
  }

  private getColor(index: number): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];
    return colors[index % colors.length];
  }
}
