import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AlertService } from '../../../../core/services/alert.service';
import { ApiResponse } from '../../../../core/models/api-response';
import {
  ActualizarUsuarioPayload,
  CrearUsuarioPayload,
  UsuarioDto,
  Usuarios,
} from '../../services/usuarios';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    FloatLabelModule,
    SelectModule,
    TagModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './lista-usuarios.html',
  styleUrl: './lista-usuarios.scss',
})
export class ListaUsuariosPage implements OnInit {
  private readonly usuariosApi = inject(Usuarios);
  private readonly fb = inject(FormBuilder);
  private readonly alerts = inject(AlertService);
  private readonly platformId = inject(PLATFORM_ID);

  protected filas: UsuarioDto[] = [];
  protected cargando = false;
  protected soloActivos = true;
  protected dialogoVisible = false;
  protected modoEdicion = false;
  protected usuarioEditId: number | null = null;

  /** Alineado con la política JWT `Administrador` del backend. */
  protected readonly roles = [
    { label: 'Administrador', value: 'Administrador' },
    { label: 'Estudiante', value: 'Estudiante' },
  ];

  protected readonly opcionesEstado = [
    { label: 'Activo', value: 1 },
    { label: 'Inactivo', value: 0 },
  ];

  protected readonly form = this.fb.group({
    nombreUsuario: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(120)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email, Validators.maxLength(256)]),
    rol: this.fb.nonNullable.control('Estudiante', [Validators.required]),
    password: ['', [Validators.minLength(8), Validators.maxLength(256)]],
    estado: this.fb.nonNullable.control(1),
    nuevaPassword: ['', [Validators.minLength(8), Validators.maxLength(256)]],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.refrescar();
  }

  protected refrescar(): void {
    this.cargando = true;
    this.usuariosApi
      .getUsuarios(this.soloActivos)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo obtener la lista de usuarios.');
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
    this.usuarioEditId = null;
    this.form.reset({
      nombreUsuario: '',
      email: '',
      rol: 'Estudiante',
      password: '',
      estado: 1,
      nuevaPassword: '',
    });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(256)]);
    this.form.get('password')?.updateValueAndValidity();
    this.form.get('nuevaPassword')?.clearValidators();
    this.form.get('nuevaPassword')?.updateValueAndValidity();
    this.dialogoVisible = true;
  }

  protected editar(row: UsuarioDto): void {
    this.modoEdicion = true;
    this.usuarioEditId = row.usuarioId;
    this.form.patchValue({
      nombreUsuario: row.nombreUsuario,
      email: row.email,
      rol: row.rol,
      estado: row.estado,
      password: '',
      nuevaPassword: '',
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.form.get('nuevaPassword')?.clearValidators();
    this.form.get('nuevaPassword')?.updateValueAndValidity();
    this.dialogoVisible = true;
  }

  protected guardar(): void {
    const passCtrl = this.form.get('password');
    const nuevaCtrl = this.form.get('nuevaPassword');
    if (!this.modoEdicion) {
      passCtrl?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(256)]);
    } else {
      passCtrl?.clearValidators();
    }
    passCtrl?.updateValueAndValidity();

    if (this.modoEdicion && nuevaCtrl?.value?.trim()) {
      nuevaCtrl.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(256)]);
    } else {
      nuevaCtrl?.clearValidators();
    }
    nuevaCtrl?.updateValueAndValidity();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      void this.alerts.warning('Revise los campos del formulario.');
      return;
    }

    const v = this.form.getRawValue();

    if (this.modoEdicion && this.usuarioEditId != null) {
      const payload: ActualizarUsuarioPayload = {
        nombreUsuario: v.nombreUsuario.trim(),
        email: v.email.trim(),
        rol: v.rol,
        estado: v.estado,
        nuevaPassword: v.nuevaPassword?.trim() ? v.nuevaPassword.trim() : null,
      };
      this.cargando = true;
      this.usuariosApi
        .actualizarUsuario(this.usuarioEditId, payload)
        .pipe(finalize(() => (this.cargando = false)))
        .subscribe({
          next: (res: ApiResponse<boolean>) => {
            if (!res.operacionExitosa) {
              void this.alerts.error(res.mensaje || 'No se pudo actualizar el usuario.');
              return;
            }
            void this.alerts.success(res.mensaje || 'Usuario actualizado.');
            this.dialogoVisible = false;
            this.refrescar();
          },
          error: (e: unknown) => void this.alerts.apiError(e),
        });
      return;
    }

    const crear: CrearUsuarioPayload = {
      nombreUsuario: v.nombreUsuario.trim(),
      email: v.email.trim(),
      password: v.password!.trim(),
      rol: v.rol,
    };
    this.cargando = true;
    this.usuariosApi
      .crearUsuario(crear)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo crear el usuario.');
            return;
          }
          void this.alerts.success(res.mensaje || 'Usuario creado.');
          this.dialogoVisible = false;
          this.refrescar();
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected async eliminar(row: UsuarioDto): Promise<void> {
    const r = await this.alerts.confirmDelete(row.nombreUsuario);
    if (!r?.isConfirmed) return;
    this.cargando = true;
    this.usuariosApi
      .eliminarUsuario(row.usuarioId)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (res) => {
          if (!res.operacionExitosa) {
            void this.alerts.error(res.mensaje || 'No se pudo eliminar el usuario.');
            return;
          }
          void this.alerts.success(res.mensaje || 'Usuario desactivado.');
          this.refrescar();
        },
        error: (e) => void this.alerts.apiError(e),
      });
  }

  protected severidadEstado(activo: number): 'success' | 'danger' {
    return activo === 1 ? 'success' : 'danger';
  }
}
