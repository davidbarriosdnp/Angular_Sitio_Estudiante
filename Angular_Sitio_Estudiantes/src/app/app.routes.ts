import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { guestGuard } from './core/guest.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: 'inicio',
    loadComponent: () => import('./features/home/pages/inicio/inicio').then((m) => m.InicioPage),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'login' },
];
