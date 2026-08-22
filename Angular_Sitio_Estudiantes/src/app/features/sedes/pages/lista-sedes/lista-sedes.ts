import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AlertService } from '../../../../core/services/alert.service';
import { finalizeHttpUiPatch } from '../../../../core/utils/sync-ui-after-http';
import {
  ActualizarSedePayload,
  CrearSedePayload,
  SedeDto,
  SedesService,
} from '../../../catalogos/sedes.service';

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
  selector: 'app-lista-sedes',
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
  templateUrl: './lista-sedes.html',
  styleUrl: './lista-sedes.scss',
})
export class ListaSedesPage implements OnInit {
  private readonly api = inject(SedesService);
  private readonly fb = inject(FormBuilder);
  private readonly alerts = inject(AlertService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly syncFinCarga = finalizeHttpUiPatch(this.ngZone, this.cdr, () => {
    this.cargando = false;
  });

  protected filas: SedeDto[] = [];
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
    direccion: ['', [Validators.required, Validators.maxLength(255)]],
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
      .pipe(finalize(this.syncFinCarga))
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
    this.form.reset({
      nombre: '',
      direccion: '',
      estado: 1,
    });
    this.dialogoVisible = true;
  }

  protected editar(row: SedeDto): void {
    this.modoEdicion = true;
    this.editId = row.sedeId;
    this.form.patchValue({
      nombre: row.nombre,
      direccion: row.direccion,
      estado: row.estado,
    });
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
      const payload: ActualizarSedePayload = {
        nombre: v.nombre.trim(),
        direccion: v.direccion.trim(),
        estado: v.estado,
      };
      this.cargando = true;
      this.api
        .actualizar(this.editId, payload)
        .pipe(finalize(this.syncFinCarga))
        .subscribe({
          next: (res) => {
            if (!res.operacionExitosa) {
              void this.alerts.error(res.mensaje || 'No se pudo actualizar.');
              return;
            }
            void this.alerts.success(res.mensaje || 'Sede actualizada.');
            this.dialogoVisible = false;
            this.refrescar();
          },
          error: (e) => void this.alerts.apiError(e),
        });
      return;
    }
    const crear: CrearSedePayload = {
      nombre: v.nombre.trim(),
      direccion: v.direccion.trim(),
    };
    this.cargando = true;
    this.api
      .crear(crear)
      .pipe(finalize(this.syncFinCarga))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo crear.');
            return;
          }
          void this.alerts.success(res.mensaje || 'Sede creada.');
          this.dialogoVisible = false;
          this.refrescar();
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected async eliminar(row: SedeDto): Promise<void> {
    const r = await this.alerts.confirmDelete(row.nombre);
    if (!r?.isConfirmed) return;
    this.cargando = true;
    this.api
      .eliminar(row.sedeId)
      .pipe(finalize(this.syncFinCarga))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo eliminar.');
            return;
          }
          void this.alerts.success(res.mensaje || 'Sede desactivada.');
          this.refrescar();
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected severidadEstado(activo: number): 'success' | 'danger' {
    return activo === 1 ? 'success' : 'danger';
  }
}
