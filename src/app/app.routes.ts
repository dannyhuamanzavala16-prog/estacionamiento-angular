import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio';
import { Historial } from './pages/historial/historial';
import { Estadisticas } from './pages/estadisticas/estadisticas';
import { Login } from './pages/login/login';
import { Vehiculos } from './pages/vehiculos/vehiculos';
import { authGuard } from './nucleo/guardias/auth-guard';

export const routes: Routes = [
  // Ruta raíz redirige a inicio
  { 
    path: '', 
    redirectTo: '/inicio', 
    pathMatch: 'full' 
  },
  
  // Rutas públicas (SIN protección)
  { 
    path: 'login', 
    component: Login, 
    title: 'Acceso Admin' 
  },
  { 
    path: 'inicio', 
    component: InicioComponent, 
    title: 'Inicio'
  },
  { 
    path: 'historial', 
    component: Historial, 
    title: 'Historial'
  },
  { 
    path: 'estadisticas', 
    component: Estadisticas, 
    title: 'Estadísticas'
  },
  { 
    path: 'vehiculos', 
    component: Vehiculos, 
    title: 'Vehículos'
  },
  
  // Ruta por defecto
  { 
    path: '**', 
    redirectTo: '/inicio' 
  }
];