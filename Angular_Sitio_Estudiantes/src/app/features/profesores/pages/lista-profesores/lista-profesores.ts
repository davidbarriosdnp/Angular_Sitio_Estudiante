import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AlertService } from '../../../../core/services/alert.service';
import {
  ActualizarProfesorPayload,
  CrearProfesorPayload,
  ProfesorDto,
  ProfesoresService,
} from '../../../catalogos/profesores.service';

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
  selector: 'app-lista-profesores',
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
  templateUrl: './lista-profesores.html',
  styleUrl: './lista-profesores.scss',
})
export class ListaProfesoresPage implements OnInit {
  private readonly api = inject(ProfesoresService);
  private readonly fb = inject(FormBuilder);
  private readonly alerts = inject(AlertService);
  private readonly platformId = inject(PLATFORM_ID);

  protected filas: ProfesorDto[] = [];
  protected cargando = false;
  protected soloActivos = true;
  protected dialogoVisible = false;
  protected modoEdicion = false;
  protected editId: number | null = null;

  protected readonly opcionesEstado = [
    { label: 'Activo', value: 1 },
    { label: 'Inactivo', value: 0 },
  ];

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    estado: [1 as number],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.refrescar();
  }

  protected refrescar(): void {
    this.cargando = true;
    this.api
      .listar(this.soloActivos)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo cargar la lista.');
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
    this.editId = null;
    this.form.reset({ nombre: '', estado: 1 });
    this.dialogoVisible = true;
  }

  protected editar(row: ProfesorDto): void {
    this.modoEdicion = true;
    this.editId = row.profesorId;
    this.form.patchValue({ nombre: row.nombre, estado: row.estado });
    this.dialogoVisible = true;
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.alerts.warning('Revise los campos.');
      return;
    }
    const v = this.form.getRawValue();
    if (this.modoEdicion && this.editId != null) {
      const payload: ActualizarProfesorPayload = {
        nombre: v.nombre.trim(),
        estado: v.estado,
      };
      this.cargando = true;
      this.api
        .actualizar(this.editId, payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: (res) => {
            if (!res.operacionExitosa) {
              void this.alerts.error(res.mensaje || 'No se pudo actualizar.');
              return;
            }
            void this.alerts.success(res.mensaje || 'Profesor actualizado.');
            this.dialogoVisible = false;
            this.refrescar();
          },
          error: (e) => void this.alerts.apiError(e),
        });
      return;
    }
    const crear: CrearProfesorPayload = { nombre: v.nombre.trim() };
    this.cargando = true;
    this.api
      .crear(crear)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo crear.');
            return;
          }
          void this.alerts.success(res.mensaje || 'Profesor creado.');
          this.dialogoVisible = false;
          this.refrescar();
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected async eliminar(row: ProfesorDto): Promise<void> {
    const r = await this.alerts.confirmDelete(row.nombre);
    if (!r?.isConfirmed) return;
    this.cargando = true;
    this.api
      .eliminar(row.profesorId)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo eliminar.');
            return;
          }
          void this.alerts.success(res.mensaje || 'Profesor desactivado.');
          this.refrescar();
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected severidadEstado(activo: number): 'success' | 'danger' {
    return activo === 1 ? 'success' : 'danger';
  }
}
