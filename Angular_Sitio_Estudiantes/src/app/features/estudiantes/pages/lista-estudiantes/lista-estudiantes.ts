import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AlertService } from '../../../../core/services/alert.service';
import { finalizeHttpUiPatch } from '../../../../core/utils/sync-ui-after-http';
import { AuthService } from '../../../auth/auth.service';
import {
  ActualizarEstudiantePayload,
  CrearEstudiantePayload,
  EstudianteDetalleDto,
  EstudianteRegistroDto,
  Estudiantes,
} from '../../services/estudiantes';
import { ProgramaCreditoDto, ProgramasCreditoService } from '../../../catalogos/programas-credito.service';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-lista-estudiantes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    DialogModule,
    InputTextModule,
    FloatLabelModule,
    SelectModule,
    TagModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './lista-estudiantes.html',
  styleUrl: './lista-estudiantes.scss',
})
export class ListaEstudiantesPage implements OnInit {
  private readonly estudiantesApi = inject(Estudiantes);
  private readonly programasApi = inject(ProgramasCreditoService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly alerts = inject(AlertService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly syncFinCarga = finalizeHttpUiPatch(this.ngZone, this.cdr, () => {
    this.cargando = false;
  });

  protected filas: EstudianteRegistroDto[] = [];
  protected programas: ProgramaCreditoDto[] = [];
  protected nombrePrograma = new Map<number, string>();
  protected cargando = false;
  protected soloActivos = true;
  protected dialogoVisible = false;
  protected modoEdicion = false;
  protected estudianteEditId: number | null = null;

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    programaCreditoId: [null as number | null],
    estado: [1 as number],
  });

  protected readonly opcionesEstado = [
    { label: 'Activo', value: 1 },
    { label: 'Inactivo', value: 0 },
  ];

  protected esAdministrador(): boolean {
    return this.auth.esAdministrador();
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.cargarProgramas();
    this.refrescar();
  }

  protected programaLabel(id: number): string {
    return this.nombrePrograma.get(id) ?? `#${id}`;
  }

  private cargarProgramas(): void {
    this.programasApi.listar(true).subscribe({
      next: (res) => {
        if (!res.operacionExitosa) {
          void this.alerts.warning(res.mensaje || 'No se pudieron cargar los programas.');
          return;
        }
        this.programas = res.resultado ?? [];
        this.nombrePrograma = new Map(this.programas.map((p) => [p.programaCreditoId, p.nombre]));
      },
      error: (e) => void this.alerts.apiError(e),
    });
  }

  protected refrescar(): void {
    this.cargando = true;
    this.estudiantesApi
      .getEstudiantes(this.soloActivos)
      .pipe(finalize(this.syncFinCarga))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo obtener la lista.');
            this.filas = [];
            return;
          }
          this.filas = res.resultado ?? [];
        },
        error: (e) => {
          this.filas = [];
          void this.alerts.apiError(e);
        },
      });
  }

  protected toggleSoloActivos(): void {
    this.soloActivos = !this.soloActivos;
    this.refrescar();
  }

  protected abrirNuevo(): void {
    this.modoEdicion = false;
    this.estudianteEditId = null;
    this.form.reset({
      nombre: '',
      email: '',
      programaCreditoId: null,
      estado: 1,
    });
    this.dialogoVisible = true;
  }

  protected editar(row: EstudianteRegistroDto): void {
    this.modoEdicion = true;
    this.estudianteEditId = row.estudianteId;
    this.cargando = true;
    this.estudiantesApi
      .getEstudiante(row.estudianteId)
      .pipe(finalize(this.syncFinCarga))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa || !res.resultado) {
            void this.alerts.error(res.mensaje || 'No se pudo cargar el estudiante.');
            return;
          }
          this.rellenarFormulario(res.resultado);
          this.dialogoVisible = true;
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  private rellenarFormulario(d: EstudianteDetalleDto): void {
    this.form.patchValue({
      nombre: d.nombre,
      email: d.email,
      programaCreditoId: d.programaCreditoId || null,
      estado: d.estado,
    });
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.alerts.warning('Revise los campos marcados.');
      return;
    }
    const v = this.form.getRawValue();
    if (this.modoEdicion && this.estudianteEditId != null) {
      const payload: ActualizarEstudiantePayload = {
        nombre: v.nombre.trim(),
        email: v.email.trim(),
        programaCreditoId: v.programaCreditoId,
        estado: v.estado,
      };
      this.cargando = true;
      this.estudiantesApi
        .actualizar(this.estudianteEditId, payload)
        .pipe(finalize(this.syncFinCarga))
        .subscribe({
          next: (res) => {
            if (!res.operacionExitosa) {
              void this.alerts.error(res.mensaje || 'No se pudo actualizar.');
              return;
            }
            void this.alerts.success(res.mensaje || 'Estudiante actualizado.');
            this.dialogoVisible = false;
            this.refrescar();
          },
          error: (e) => void this.alerts.apiError(e),
        });
      return;
    }

    const crear: CrearEstudiantePayload = {
      nombre: v.nombre.trim(),
      email: v.email.trim(),
      programaCreditoId: v.programaCreditoId,
    };
    this.cargando = true;
    this.estudiantesApi
      .crear(crear)
      .pipe(finalize(this.syncFinCarga))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo crear el registro.');
            return;
          }
          void this.alerts.success(res.mensaje || 'Estudiante creado.');
          this.dialogoVisible = false;
          this.refrescar();
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected async eliminar(row: EstudianteRegistroDto): Promise<void> {
    const r = await this.alerts.confirmDelete(row.nombre);
    if (!r?.isConfirmed) return;
    this.cargando = true;
    this.estudiantesApi
      .eliminar(row.estudianteId)
      .pipe(finalize(this.syncFinCarga))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo eliminar.');
            return;
          }
          void this.alerts.success(res.mensaje || 'Registro desactivado.');
          this.refrescar();
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected severidadEstado(activo: number): 'success' | 'danger' {
    return activo === 1 ? 'success' : 'danger';
  }
}
