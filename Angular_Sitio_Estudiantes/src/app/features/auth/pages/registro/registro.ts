import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { finalizeHttpUiPatch } from '../../../../core/utils/sync-ui-after-http';
import { ProgramaCreditoDto } from '../../../catalogos/programas-credito.service';

@Component({
  selector: 'app-registro-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    SelectModule,
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class RegistroPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly finalizarSubmit = finalizeHttpUiPatch(this.ngZone, this.cdr, () => {
    this.loading = false;
  });

  protected nombreUsuario = '';
  protected email = '';
  protected password = '';
  protected nombreCompleto = '';
  protected programaCreditoId: number | null = null;
  protected programas: ProgramaCreditoDto[] = [];
  protected loading = false;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.auth.programasParaRegistro().subscribe({
      next: (res) => {
        if (res.operacionExitosa && res.resultado?.length) {
          this.programas = res.resultado;
          return;
        }
        void this.alerts.warning(res.mensaje || 'No se pudieron cargar los programas de crédito.');
      },
      error: (err) => void this.alerts.apiError(err, 'No se pudo cargar el catálogo de programas.'),
    });
  }

  protected registrarse(): void {
    const u = this.nombreUsuario.trim();
    const em = this.email.trim();
    const nom = this.nombreCompleto.trim();
    if (!u || !em || !this.password || !nom || this.programaCreditoId == null) {
      void this.alerts.warning('Complete todos los campos, incluido el programa.');
      return;
    }

    this.loading = true;
    this.auth
      .registro({
        nombreUsuario: u,
        email: em,
        password: this.password,
        nombreCompleto: nom,
        programaCreditoId: this.programaCreditoId,
      })
      .pipe(finalize(this.finalizarSubmit))
      .subscribe({
        next: (res) => {
          if (res.operacionExitosa && res.resultado) {
            void this.router.navigateByUrl('/inicio');
            this.alerts.successBrief('Cuenta creada.', res.mensaje || 'Ya puede usar el portal.');
            return;
          }
          void this.alerts.error(res.mensaje || 'No se pudo completar el registro.');
        },
        error: (err) => void this.alerts.apiError(err, 'No se pudo completar el registro.'),
      });
  }
}
