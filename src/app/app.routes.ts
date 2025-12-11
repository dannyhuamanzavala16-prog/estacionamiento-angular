import { Routes } from '@angular/router';
import { authGuard } from './nucleo/guardias/auth-guard';
import { guardiaGuard } from './nucleo/guardias/guardia-guard';
import { adminGuard } from './nucleo/guardias/admin-guard';

export const routes: Routes = [
  // Ruta raíz redirige a inicio
  {
    path: '',
    redirectTo: '/inicio',
    pathMatch: 'full'
  },

  // RUTAS PÚBLICAS (Accesibles por todos) - CON LAZY LOADING
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio').then(m => m.InicioComponent),
    title: 'Inicio - ZavalaTech Parking'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login),
    title: 'Iniciar Sesión'
  },

  // RUTAS PARA GUARDIA Y ADMIN - CON LAZY LOADING
  {
    path: 'vehiculos',
    loadComponent: () => import('./pages/vehiculos/vehiculos').then(m => m.Vehiculos),
    title: 'Gestión de Vehículos',
    canActivate: [authGuard] // Requiere autenticación
  },

  // RUTAS SOLO PARA GUARDIA - CON LAZY LOADING
  {
    path: 'buscar',
    loadComponent: () => import('./pages/buscar/buscar').then(m => m.Buscar),
    title: 'Buscar Vehículo',
    canActivate: [guardiaGuard] // Solo guardia
  },

  // RUTAS SOLO PARA ADMIN - CON LAZY LOADING
  {
    path: 'historial',
    loadComponent: () => import('./pages/historial/historial').then(m => m.Historial),
    title: 'Historial de Vehículos',
    canActivate: [adminGuard] // Solo admin
  },
  {
    path: 'estadisticas',
    loadComponent: () => import('./pages/estadisticas/estadisticas').then(m => m.Estadisticas),
    title: 'Estadísticas',
    canActivate: [adminGuard] // Solo admin
  },

  // RUTA POR DEFECTO
  {
    path: '**',
    redirectTo: '/inicio'
  }
];