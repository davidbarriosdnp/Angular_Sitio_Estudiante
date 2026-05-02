import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../auth/auth.service';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, MenubarModule, ButtonModule],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertService);

  protected readonly navItems: MenuItem[] = [
    {
      label: 'Inicio',
      icon: 'pi pi-home',
      routerLink: '/inicio',
    },
    {
      label: 'Estudiantes',
      icon: 'pi pi-users',
      routerLink: '/estudiantes',
    },
    {
      label: 'Usuarios',
      icon: 'pi pi-id-card',
      routerLink: '/usuarios',
    },
  ];

  protected async cerrarSesion(): Promise<void> {
    const r = await this.alerts.fire({
      icon: 'question',
      title: 'Cerrar sesión',
      text: '¿Desea salir de la aplicación?',
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    });
    if (!r?.isConfirmed) return;
    this.auth.logout();
    void this.router.navigateByUrl('/login');
    void this.alerts.info('Ha cerrado sesión correctamente.');
  }
}
