import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';

import { AuthService } from '../../../auth/auth.service';
import { estudianteIdDesdeToken } from '../../../../core/utils/jwt-payload';
import { finalizeHttpUiPatch } from '../../../../core/utils/sync-ui-after-http';
import { AlertService } from '../../../../core/services/alert.service';
import {
  Estudiantes,
  InscripcionEstudianteDto,
  MateriaCatalogoDto,
} from '../../../estudiantes/services/estudiantes';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-mi-inscripcion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    SelectModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    MessageModule,
  ],
  templateUrl: './mi-inscripcion.html',
  styleUrl: './mi-inscripcion.scss',
})
export class MiInscripcionPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly estudiantesApi = inject(Estudiantes);
  private readonly alerts = inject(AlertService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly syncFinCargaLista = finalizeHttpUiPatch(this.ngZone, this.cdr, () => {
    this.cargando = false;
  });

  private readonly syncFinGuardado = finalizeHttpUiPatch(this.ngZone, this.cdr, () => {
    this.guardando = false;
  });

  private readonly syncFinCompanerosRow = finalizeHttpUiPatch(this.ngZone, this.cdr, () => {
    this.cargandoCompaneros = null;
  });

  protected estudianteId: number | null = null;
  protected programaId: number | null = null;
  protected materias: MateriaCatalogoDto[] = [];
  protected inscripciones: InscripcionEstudianteDto[] = [];
  protected cargando = false;
  protected guardando = false;

  protected materiasSeleccionadasIds: number[] = [];
  protected materiaSeleccionadaTemp: number | null = null;

  protected companerosPorMateria = new Map<number, string[]>();
  protected cargandoCompaneros: number | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = estudianteIdDesdeToken(this.auth.getToken());
    this.estudianteId = id;
    if (id == null) return;
    this.cargarDatos(id);
  }

  private cargarDatos(id: number): void {
    this.cargando = true;
    this.estudiantesApi.getEstudiante(id).subscribe({
      next: (res) => {
        if (!res.operacionExitosa || !res.resultado) {
          void this.alerts.error(res.mensaje || 'No se pudo cargar su perfil.');
          this.syncFinCargaLista();
          return;
        }
        const pc = res.resultado.programaCreditoId;
        this.programaId = pc > 0 ? pc : null;
        this.refrescarCatalogoYInscripcion(id);
      },
      error: (e) => {
        void this.alerts.apiError(e);
        this.syncFinCargaLista();
      },
    });
  }

  /** Catálogo e inscripción en paralelo para menor espera que la cadena anterior. */
  private refrescarCatalogoYInscripcion(id: number): void {
    this.cargando = true;
    forkJoin({
      catalogo: this.estudiantesApi.catalogoMaterias(this.programaId, true),
      inscripcion: this.estudiantesApi.inscripcion(id, true),
    })
      .pipe(finalize(() => this.syncFinCargaLista()))
      .subscribe({
        next: ({ catalogo: rCat, inscripcion: rIns }) => {
          if (rCat.operacionExitosa && rCat.resultado) {
            this.materias = rCat.resultado;
          } else {
            this.materias = [];
            void this.alerts.warning(rCat.mensaje || 'No se cargó el catálogo de materias.');
          }
          if (rIns.operacionExitosa && rIns.resultado) {
            this.inscripciones = rIns.resultado;
          } else {
            this.inscripciones = [];
          }
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected get yaInscritoCompleto(): boolean {
    return this.inscripciones.length >= 3;
  }

  /** Objetos completos de materias seleccionadas actualmente. */
  protected get materiasSeleccionadasObjs(): MateriaCatalogoDto[] {
    return this.materiasSeleccionadasIds
      .map((id) => this.materias.find((m) => m.materiaId === id))
      .filter((m): m is MateriaCatalogoDto => m != null);
  }

  /** Materias disponibles para agregar: sin repetir materia y sin repetir profesor. */
  protected get opcionesDisponibles(): MateriaCatalogoDto[] {
    const selectedProfs = new Set(this.materiasSeleccionadasObjs.map((m) => m.profesorId));
    return this.materias.filter((row) => {
      if (this.materiasSeleccionadasIds.includes(row.materiaId)) return false;
      if (selectedProfs.has(row.profesorId)) return false;
      return true;
    });
  }

  /** Agrega la materia elegida en el selector único a las tarjetas seleccionadas. */
  protected agregarMateria(materiaId: number | null): void {
    if (materiaId == null) return;
    if (this.materiasSeleccionadasIds.length >= 3) {
      void this.alerts.warning('Solo puede seleccionar hasta 3 materias (9 créditos máximo).');
      setTimeout(() => {
        this.materiaSeleccionadaTemp = null;
        this.cdr.markForCheck();
      }, 0);
      return;
    }
    if (!this.materiasSeleccionadasIds.includes(materiaId)) {
      this.materiasSeleccionadasIds.push(materiaId);
    }
    setTimeout(() => {
      this.materiaSeleccionadaTemp = null;
      this.cdr.markForCheck();
    }, 0);
    this.companerosPorMateria.clear();
  }

  /** Quita una materia de la lista de tarjetas seleccionadas. */
  protected quitarMateria(materiaId: number): void {
    this.materiasSeleccionadasIds = this.materiasSeleccionadasIds.filter((id) => id !== materiaId);
    this.companerosPorMateria.clear();
  }

  protected registrar(): void {
    if (this.estudianteId == null) return;
    
    if (this.materiasSeleccionadasIds.length === 0) {
      void this.alerts.warning('Seleccione al menos una materia para inscribir.');
      return;
    }

    const id1 = this.materiasSeleccionadasIds[0] ?? null;
    const id2 = this.materiasSeleccionadasIds[1] ?? null;
    const id3 = this.materiasSeleccionadasIds[2] ?? null;

    this.guardando = true;
    this.estudiantesApi
      .registrarInscripcion(this.estudianteId, {
        materiaId1: id1,
        materiaId2: id2,
        materiaId3: id3,
      })
      .pipe(finalize(() => this.syncFinGuardado()))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo registrar la inscripción.');
            return;
          }
          void this.alerts.success(res.mensaje || 'Inscripción registrada con éxito.');
          this.materiasSeleccionadasIds = [];
          this.materiaSeleccionadaTemp = null;
          this.companerosPorMateria.clear();
          const eid = this.estudianteId;
          if (eid != null) this.refrescarCatalogoYInscripcion(eid);
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected verCompaneros(materiaId: number): void {
    if (this.estudianteId == null) return;
    this.cargandoCompaneros = materiaId;
    this.estudiantesApi
      .companeros(this.estudianteId, materiaId)
      .pipe(finalize(() => this.syncFinCompanerosRow()))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.warning(res.mensaje || 'No se pudieron cargar los compañeros.');
            return;
          }
          this.companerosPorMateria.set(materiaId, res.resultado ?? []);
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected nombresCompaneros(materiaId: number): string[] {
    return this.companerosPorMateria.get(materiaId) ?? [];
  }

  protected get totalCreditosSeleccionados(): number {
    return this.materiasSeleccionadasObjs.reduce((acc, m) => acc + (m.creditos || 3), 0);
  }

  protected get totalCreditosInscritos(): number {
    return this.inscripciones.reduce((acc, m) => acc + (m.creditos || 3), 0);
  }

  /** Cierra sesión y abre el registro público (usuario + expediente académico). */
  protected irARegistroEnLinea(): void {
    this.auth.logoutEIrA('/registro');
  }
}
