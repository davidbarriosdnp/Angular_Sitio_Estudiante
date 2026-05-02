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

  protected materia1: number | null = null;
  protected materia2: number | null = null;
  protected materia3: number | null = null;

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

  /** Opciones de materia respetando “un solo profesor por las tres” y sin repetir materia. */
  protected opcionesPara(slot: 1 | 2 | 3): MateriaCatalogoDto[] {
    const sel: (number | null)[] = [this.materia1, this.materia2, this.materia3];
    const idx = slot - 1;
    const current = sel[idx];
    const otherIds = sel
      .map((sid, i) => (i !== idx && sid != null ? sid : null))
      .filter((sid): sid is number => sid != null);
    const otherProfs = new Set<number>();
    for (let i = 0; i < 3; i++) {
      if (i === idx) continue;
      const mid = sel[i];
      if (mid == null) continue;
      const row = this.materias.find((m) => m.materiaId === mid);
      if (row) otherProfs.add(row.profesorId);
    }
    return this.materias.filter((row) => {
      if (current === row.materiaId) return true;
      if (otherIds.includes(row.materiaId)) return false;
      if (otherProfs.has(row.profesorId)) return false;
      return true;
    });
  }

  protected onMateriaChange(): void {
    this.companerosPorMateria.clear();
  }

  protected registrar(): void {
    if (this.estudianteId == null) return;
    if (this.materia1 == null || this.materia2 == null || this.materia3 == null) {
      void this.alerts.warning('Seleccione las tres materias.');
      return;
    }
    const ids = [this.materia1, this.materia2, this.materia3];
    if (new Set(ids).size !== 3) {
      void this.alerts.warning('Las tres materias deben ser distintas.');
      return;
    }
    const profs = ids.map((mid) => this.materias.find((m) => m.materiaId === mid)?.profesorId);
    if (profs.some((p) => p == null) || new Set(profs as number[]).size !== 3) {
      void this.alerts.warning('No puede elegir dos materias del mismo profesor.');
      return;
    }

    this.guardando = true;
    this.estudiantesApi
      .registrarInscripcion(this.estudianteId, {
        materiaId1: this.materia1,
        materiaId2: this.materia2,
        materiaId3: this.materia3,
      })
      .pipe(finalize(() => this.syncFinGuardado()))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo registrar la inscripción.');
            return;
          }
          void this.alerts.success(res.mensaje || 'Inscripción registrada.');
          this.materia1 = this.materia2 = this.materia3 = null;
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

  /** Cierra sesión y abre el registro público (usuario + expediente académico). */
  protected irARegistroEnLinea(): void {
    this.auth.logoutEIrA('/registro');
  }
}
