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
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

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
    DialogModule,
    InputTextModule,
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

  protected periodoCerradoManual = false;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const id = estudianteIdDesdeToken(this.auth.getToken());
    this.estudianteId = id;
    if (id == null) return;
    this.periodoCerradoManual = localStorage.getItem('periodoCerrado_' + id) === 'true';
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

  protected get totalMateriasContadas(): number {
    return this.inscripciones.length + this.materiasSeleccionadasIds.length;
  }

  protected get totalCreditosAcumulados(): number {
    return this.totalCreditosInscritos + this.totalCreditosSeleccionados;
  }

  protected get yaInscritoCompleto(): boolean {
    return this.inscripciones.length >= 3 || this.totalCreditosInscritos >= 9;
  }

  protected get inscripcionCerradaDefinitiva(): boolean {
    return this.yaInscritoCompleto || this.periodoCerradoManual;
  }

  protected get alcanzolimiteSeleccion(): boolean {
    return this.totalMateriasContadas >= 3 || this.totalCreditosAcumulados >= 9 || this.periodoCerradoManual;
  }

  /** Objetos completos de materias seleccionadas actualmente en tarjetas locales. */
  protected get materiasSeleccionadasObjs(): MateriaCatalogoDto[] {
    return this.materiasSeleccionadasIds
      .map((id) => this.materias.find((m) => m.materiaId === id))
      .filter((m): m is MateriaCatalogoDto => m != null);
  }

  /** Materias disponibles para agregar:
   * 1. No estar inscrita previamente en la Base de Datos.
   * 2. No estar seleccionada localmente en las tarjetas.
   * 3. No repetir profesor con materias inscritas en BD ni seleccionadas localmente.
   * 4. Que sus créditos no hagan superar el límite estricto de 9 créditos en total.
   */
  protected get opcionesDisponibles(): MateriaCatalogoDto[] {
    if (this.alcanzolimiteSeleccion) return [];

    const inscritasIds = new Set(this.inscripciones.map((i) => i.materiaId));
    const seleccionadasIds = new Set(this.materiasSeleccionadasIds);

    const profesoresOcupados = new Set<number>([
      ...this.inscripciones.map((i) => i.profesorId),
      ...this.materiasSeleccionadasObjs.map((m) => m.profesorId),
    ]);

    const creditosDisponibles = 9 - this.totalCreditosAcumulados;

    return this.materias.filter((row) => {
      if (inscritasIds.has(row.materiaId)) return false;
      if (seleccionadasIds.has(row.materiaId)) return false;
      if (profesoresOcupados.has(row.profesorId)) return false;
      if ((row.creditos || 3) > creditosDisponibles) return false;
      return true;
    });
  }

  /** Agrega la materia elegida en el selector único a las tarjetas seleccionadas. */
  protected agregarMateria(materiaId: number | null): void {
    if (materiaId == null) return;

    if (this.totalMateriasContadas >= 3) {
      void this.alerts.warning('Ha alcanzado el límite máximo de 3 materias entre inscritas y seleccionadas.');
      setTimeout(() => {
        this.materiaSeleccionadaTemp = null;
        this.cdr.markForCheck();
      }, 0);
      return;
    }

    const materiaObj = this.materias.find((m) => m.materiaId === materiaId);
    const creditosMateria = materiaObj ? (materiaObj.creditos || 3) : 3;

    if (this.totalCreditosAcumulados + creditosMateria > 9) {
      void this.alerts.warning(`No puede agregar esta materia porque superaría el máximo de 9 créditos (tendría ${this.totalCreditosAcumulados + creditosMateria} cr).`);
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

  /** Muestra la alerta de confirmación previa antes de registrar en el backend. */
  protected async registrar(): Promise<void> {
    if (this.estudianteId == null) return;
    
    if (this.materiasSeleccionadasIds.length === 0) {
      void this.alerts.warning('Seleccione al menos una materia para inscribir.');
      return;
    }

    const numNuevas = this.materiasSeleccionadasIds.length;
    const creditosNuevos = this.totalCreditosSeleccionados;
    const totalFinalMaterias = this.totalMateriasContadas;
    const totalFinalCreditos = this.totalCreditosAcumulados;

    // Caso 1: Se completa el máximo de 3 materias o 9 créditos
    if (totalFinalMaterias === 3 || totalFinalCreditos === 9) {
      const res = await this.alerts.fire({
        title: '¿Confirmar inscripción completa?',
        html: `Está a punto de inscribir <strong>${numNuevas} materia(s) (${creditosNuevos} créditos)</strong> para completar los <strong>9 créditos</strong> del periodo.<br><br>¿Desea proceder?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar e inscribir',
        cancelButtonText: 'Cancelar',
      });

      if (res?.isConfirmed) {
        this.ejecutarRegistro(false);
      }
      return;
    }

    // Caso 2: Inscripción parcial (3 o 6 créditos en total)
    const res = await this.alerts.fire({
      title: '¿Confirmar inscripción parcial?',
      html: `Inscribirá <strong>${numNuevas} materia(s) (${creditosNuevos} créditos)</strong>. Acumulará <strong>${totalFinalCreditos} de 9 créditos</strong>.<br><br>` +
            `¿Desea dejar <strong>ABIERTA</strong> su ventana para agregar más materias después, o <strong>CERRAR</strong> su periodo académico?`,
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '🟢 Inscribir y dejar abierta',
      denyButtonText: '🔒 Inscribir y cerrar periodo',
      cancelButtonText: 'Cancelar',
    });

    if (res?.isConfirmed) {
      this.ejecutarRegistro(false);
    } else if (res?.isDenied) {
      this.ejecutarRegistro(true);
    }
  }

  private ejecutarRegistro(cerrarPeriodo: boolean): void {
    if (this.estudianteId == null) return;

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

          if (cerrarPeriodo && this.estudianteId != null) {
            this.periodoCerradoManual = true;
            localStorage.setItem('periodoCerrado_' + this.estudianteId, 'true');
            void this.alerts.success('Inscripción registrada. Su periodo académico ha sido cerrado.');
          } else {
            void this.alerts.success('Inscripción registrada con éxito. Su ventana permanece abierta para agregar materias más adelante.');
          }

          this.materiasSeleccionadasIds = [];
          this.materiaSeleccionadaTemp = null;
          this.companerosPorMateria.clear();
          const eid = this.estudianteId;
          if (eid != null) this.refrescarCatalogoYInscripcion(eid);
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected async reabrirInscripcion(): Promise<void> {
    const res = await this.alerts.fire({
      title: '¿Reabrir periodo de inscripción?',
      html: '¿Desea reabrir su ventana de inscripción para poder seleccionar materias restantes?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, reabrir ventana',
      cancelButtonText: 'Cancelar',
    });

    if (res?.isConfirmed && this.estudianteId != null) {
      this.periodoCerradoManual = false;
      localStorage.removeItem('periodoCerrado_' + this.estudianteId);
      void this.alerts.success('Ventana de inscripción reabierta.');
    }
  }

  // ==========================================
  // ESTADOS DEL MODAL DE COMPAÑEROS
  // ==========================================
  protected mostrarModalCompaneros = false;
  protected tituloModalCompaneros = '';
  protected todosLosCompanerosActuales: string[] = [];
  protected companerosFiltrados: string[] = [];
  protected filtroCompaneros = '';

  protected verCompaneros(materiaId: number, nombreMateria: string): void {
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
          this.todosLosCompanerosActuales = res.resultado ?? [];
          this.companerosFiltrados = [...this.todosLosCompanerosActuales];
          this.filtroCompaneros = '';
          this.tituloModalCompaneros = nombreMateria;
          this.mostrarModalCompaneros = true;
          this.cdr.markForCheck();
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected filtrarCompaneros(): void {
    if (!this.filtroCompaneros) {
      this.companerosFiltrados = [...this.todosLosCompanerosActuales];
    } else {
      const txt = this.filtroCompaneros.toLowerCase();
      this.companerosFiltrados = this.todosLosCompanerosActuales.filter(n => n.toLowerCase().includes(txt));
    }
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
