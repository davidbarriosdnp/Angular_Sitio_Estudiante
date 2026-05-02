import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AlertService } from '../../../../core/services/alert.service';
import { finalizeHttpUiPatch } from '../../../../core/utils/sync-ui-after-http';
import { ProgramaCreditoDto, ProgramasCreditoService } from '../../../catalogos/programas-credito.service';
import {
  ActualizarMateriaPayload,
  CrearMateriaPayload,
  MateriaDetalleDto,
  MateriasService,
} from '../../../catalogos/materias.service';
import { ProfesorDto, ProfesoresService } from '../../../catalogos/profesores.service';

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
  selector: 'app-lista-materias',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  templateUrl: './lista-materias.html',
  styleUrl: './lista-materias.scss',
})
export class ListaMateriasPage implements OnInit {
  private readonly api = inject(MateriasService);
  private readonly programasApi = inject(ProgramasCreditoService);
  private readonly profesoresApi = inject(ProfesoresService);
  private readonly fb = inject(FormBuilder);
  private readonly alerts = inject(AlertService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly syncFinCarga = finalizeHttpUiPatch(this.ngZone, this.cdr, () => {
    this.cargando = false;
  });

  protected filas: MateriaDetalleDto[] = [];
  protected programas: ProgramaCreditoDto[] = [];
  protected profesores: ProfesorDto[] = [];
  protected nombrePrograma = new Map<number, string>();
  protected cargando = false;
  protected soloActivos = true;
  /** Filtro de listado; null = todos los programas (según API). */
  protected filtroProgramaId: number | null = null;
  protected dialogoVisible = false;
  protected modoEdicion = false;
  protected editId: number | null = null;

  protected readonly opcionesEstado = [
    { label: 'Activo', value: 1 },
    { label: 'Inactivo', value: 0 },
  ];

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    creditos: [3, [Validators.required]],
    profesorId: [null as number | null, [Validators.required]],
    programaCreditoId: [null as number | null, [Validators.required]],
    estado: [1 as number],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.cargarProgramasYProfesores();
    this.refrescar();
  }

  private cargarProgramasYProfesores(): void {
    this.programasApi.listar(true).subscribe({
      next: (res) => {
        if (res.operacionExitosa && res.resultado) {
          this.programas = res.resultado;
          this.nombrePrograma = new Map(this.programas.map((p) => [p.programaCreditoId, p.nombre]));
        }
      },
      error: (e) => void this.alerts.apiError(e),
    });
    this.profesoresApi.listar(true).subscribe({
      next: (res) => {
        if (res.operacionExitosa && res.resultado) {
          this.profesores = res.resultado;
        }
      },
      error: (e) => void this.alerts.apiError(e),
    });
  }

  protected programaLabel(id: number): string {
    return this.nombrePrograma.get(id) ?? `#${id}`;
  }

  protected refrescar(): void {
    this.cargando = true;
    this.api
      .listar(this.filtroProgramaId, this.soloActivos)
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

  protected onFiltroProgramaChange(): void {
    this.refrescar();
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
      creditos: 3,
      profesorId: null,
      programaCreditoId: this.filtroProgramaId,
      estado: 1,
    });
    this.dialogoVisible = true;
  }

  protected editar(row: MateriaDetalleDto): void {
    this.modoEdicion = true;
    this.editId = row.materiaId;
    this.form.patchValue({
      nombre: row.nombre,
      creditos: row.creditos,
      profesorId: row.profesorId,
      programaCreditoId: row.programaCreditoId,
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
    if (v.creditos !== 3) {
      void this.alerts.warning('Cada materia debe valer exactamente 3 créditos.');
      return;
    }
    if (this.modoEdicion && this.editId != null) {
      const payload: ActualizarMateriaPayload = {
        nombre: v.nombre.trim(),
        creditos: v.creditos,
        profesorId: v.profesorId!,
        programaCreditoId: v.programaCreditoId!,
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
            void this.alerts.success(res.mensaje || 'Materia actualizada.');
            this.dialogoVisible = false;
            this.refrescar();
          },
          error: (e) => void this.alerts.apiError(e),
        });
      return;
    }
    const crear: CrearMateriaPayload = {
      nombre: v.nombre.trim(),
      creditos: v.creditos,
      profesorId: v.profesorId!,
      programaCreditoId: v.programaCreditoId!,
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
          void this.alerts.success(res.mensaje || 'Materia creada.');
          this.dialogoVisible = false;
          this.refrescar();
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected async eliminar(row: MateriaDetalleDto): Promise<void> {
    const r = await this.alerts.confirmDelete(row.nombre);
    if (!r?.isConfirmed) return;
    this.cargando = true;
    this.api
      .eliminar(row.materiaId)
      .pipe(finalize(this.syncFinCarga))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo eliminar.');
            return;
          }
          void this.alerts.success(res.mensaje || 'Materia desactivada.');
          this.refrescar();
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected severidadEstado(activo: number): 'success' | 'danger' {
    return activo === 1 ? 'success' : 'danger';
  }
}
