import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { guestGuard } from './core/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () => import('./features/layout/app-shell').then((m) => m.AppShell),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./features/home/pages/inicio/inicio').then((m) => m.InicioPage),
      },
      {
        path: 'estudiantes',
        loadComponent: () =>
          import('./features/estudiantes/pages/lista-estudiantes/lista-estudiantes').then(
            (m) => m.ListaEstudiantesPage,
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/usuarios/pages/lista-usuarios/lista-usuarios').then((m) => m.ListaUsuariosPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
