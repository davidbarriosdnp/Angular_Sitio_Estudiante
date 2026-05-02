import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-inicio-page',
  standalone: true,
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class InicioPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected cerrarSesion(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
