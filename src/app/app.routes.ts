import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio';
import { Historial } from './pages/historial/historial';
import { Estadisticas } from './pages/estadisticas/estadisticas';
import { Login } from './pages/login/login';
import { Vehiculos } from './pages/vehiculos/vehiculos';
import { Buscar } from './pages/buscar/buscar';
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
  
  // RUTAS PÚBLICAS (Accesibles por todos)
  { 
    path: 'inicio', 
    component: InicioComponent, 
    title: 'Inicio - ZavalaTech Parking'
  },
  { 
    path: 'login', 
    component: Login, 
    title: 'Iniciar Sesión'
  },
  
  // RUTAS PARA GUARDIA Y ADMIN
  { 
    path: 'vehiculos', 
    component: Vehiculos, 
    title: 'Gestión de Vehículos',
    canActivate: [authGuard] // Requiere autenticación
  },
  
  // RUTAS SOLO PARA GUARDIA
  { 
    path: 'buscar', 
    component: Buscar, 
    title: 'Buscar Vehículo',
    canActivate: [guardiaGuard] // Solo guardia
  },
  
  // RUTAS SOLO PARA ADMIN
  { 
    path: 'historial', 
    component: Historial, 
    title: 'Historial de Vehículos',
    canActivate: [adminGuard] // Solo admin
  },
  { 
    path: 'estadisticas', 
    component: Estadisticas, 
    title: 'Estadísticas',
    canActivate: [adminGuard] // Solo admin
  },
  
  // RUTA POR DEFECTO
  { 
    path: '**', 
    redirectTo: '/inicio' 
  }
];