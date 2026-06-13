import { Routes } from '@angular/router';

import { authGuard, guestGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard-layout/dashboard-layout').then((m) => m.DashboardLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tasks' },
      {
        path: 'tasks',
        loadComponent: () => import('./features/tasks/task-list/task-list').then((m) => m.TaskList),
      },
      {
        path: 'team',
        canActivate: [roleGuard(['Manager', 'TeamLead'])],
        loadComponent: () => import('./features/users/team/team').then((m) => m.Team),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
