import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../auth.service';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink, CardModule, InputTextModule, PasswordModule, ButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  protected nombreUsuario = '';
  protected password = '';
  protected loading = false;

  protected iniciarSesion(): void {
    const u = this.nombreUsuario.trim();
    if (!u || !this.password) {
      void this.alerts.warning('Ingrese usuario y contraseña.');
      return;
    }

    this.loading = true;
    this.auth
      .login({ nombreUsuario: u, password: this.password })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          if (res.operacionExitosa && res.resultado) {
            void this.router.navigateByUrl('/inicio');
            this.alerts.successBrief('Bienvenido al portal.', 'Sesión iniciada');
            return;
          }
          void this.alerts.error(res.mensaje || 'Credenciales inválidas.');
        },
        error: () => void this.alerts.error('No se pudo contactar el servidor.'),
      });
  }
}
