import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio';
import { Historial } from './pages/historial/historial';
import { Estadisticas } from './pages/estadisticas/estadisticas';
import { Login } from './pages/login/login';
import { Vehiculos } from './pages/vehiculos/vehiculos';

export const routes: Routes = [
  { path: '', component: InicioComponent, title: 'Inicio' },

  { path: 'inicio', component: InicioComponent, title: 'Inicio' },
  { path: 'historial', component: Historial, title: 'Historial' },
  { path: 'estadisticas', component: Estadisticas, title: 'Estadísticas' },
  { path: 'login', component: Login, title: 'Acceso Admin' },
  { path: 'vehiculos', component: Vehiculos, title: 'Vehiculos' },


];
