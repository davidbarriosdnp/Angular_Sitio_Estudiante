import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected nombreUsuario = '';
  protected password = '';
  protected errorMsg = '';
  protected loading = false;

  protected iniciarSesion(): void {
    this.errorMsg = '';
    const u = this.nombreUsuario.trim();
    if (!u || !this.password) {
      this.errorMsg = 'Usuario y contraseña son obligatorios.';
      return;
    }

    this.loading = true;
    this.auth
      .login({ nombreUsuario: u, password: this.password })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          if (res.operacionExitosa && res.resultado) void this.router.navigateByUrl('/inicio');
          else this.errorMsg = res.mensaje || 'Credenciales inválidas.';
        },
        error: () => (this.errorMsg = 'No se pudo contactar el servidor.'),
      });
  }
}
