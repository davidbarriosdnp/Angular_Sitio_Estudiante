import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import { authGuard } from './core/auth.guard';
import { estudianteInscripcionGuard } from './core/estudiante-inscripcion.guard';
import { guestGuard } from './core/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/auth/pages/registro/registro').then((m) => m.RegistroPage),
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
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/usuarios/pages/lista-usuarios/lista-usuarios').then((m) => m.ListaUsuariosPage),
      },
      {
        path: 'programas-credito',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/programas-credito/pages/lista-programas-credito/lista-programas-credito').then(
            (m) => m.ListaProgramasCreditoPage,
          ),
      },
      {
        path: 'materias',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/materias/pages/lista-materias/lista-materias').then((m) => m.ListaMateriasPage),
      },
      {
        path: 'profesores',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/profesores/pages/lista-profesores/lista-profesores').then((m) => m.ListaProfesoresPage),
      },
      {
        path: 'mi-inscripcion',
        canActivate: [estudianteInscripcionGuard],
        loadComponent: () =>
          import('./features/inscripcion/pages/mi-inscripcion/mi-inscripcion').then((m) => m.MiInscripcionPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
