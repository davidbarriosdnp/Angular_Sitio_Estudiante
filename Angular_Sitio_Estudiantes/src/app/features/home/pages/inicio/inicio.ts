import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../auth/auth.service';
import { Estudiantes, InscripcionEstudianteDto } from '../../../estudiantes/services/estudiantes';
import { estudianteIdDesdeToken } from '../../../../core/utils/jwt-payload';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-inicio-page',
  standalone: true,
  imports: [RouterLink, CardModule, ButtonModule, TableModule, TagModule, DatePipe],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class InicioPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly estudiantesApi = inject(Estudiantes);

  protected materiasInscritas: InscripcionEstudianteDto[] = [];
  protected cargandoHorario = false;

  ngOnInit() {
    if (this.auth.esRolEstudiante() && this.auth.tienePerfilEstudiante()) {
      const estudianteId = estudianteIdDesdeToken(this.auth.getToken());
      if (estudianteId) {
        this.cargandoHorario = true;
        this.estudiantesApi.inscripcion(estudianteId, true).subscribe({
          next: (res) => {
            if (res.operacionExitosa && res.resultado) {
              this.materiasInscritas = res.resultado;
            }
            this.cargandoHorario = false;
          },
          error: () => {
            this.cargandoHorario = false;
          }
        });
      }
    }
  }
}
