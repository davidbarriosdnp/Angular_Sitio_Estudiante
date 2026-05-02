import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
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
export class AppShell implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertService);

  /** Referencia estable (no getter) para evitar bucles de CD con p-menubar. */
  protected navItems: MenuItem[] = [];

  ngOnInit(): void {
    const items: MenuItem[] = [{ label: 'Inicio', icon: 'pi pi-home', routerLink: '/inicio' }];
    if (this.auth.puedeAccederModuloInscripcion()) {
      items.push({ label: 'Mi inscripción', icon: 'pi pi-book', routerLink: '/mi-inscripcion' });
    }
    items.push({ label: 'Estudiantes', icon: 'pi pi-users', routerLink: '/estudiantes' });
    if (this.auth.esAdministrador()) {
      items.push({
        label: 'Catálogo',
        icon: 'pi pi-list',
        items: [
          { label: 'Programas de crédito', icon: 'pi pi-folder', routerLink: '/programas-credito' },
          { label: 'Materias', icon: 'pi pi-bookmark', routerLink: '/materias' },
          { label: 'Profesores', icon: 'pi pi-user', routerLink: '/profesores' },
        ],
      });
      items.push({ label: 'Usuarios', icon: 'pi pi-id-card', routerLink: '/usuarios' });
    }
    this.navItems = items;
  }

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
    void this.alerts.info('Ha cerrado sesión correctamente.');
  }
}
