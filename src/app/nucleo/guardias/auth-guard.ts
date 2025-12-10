import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AutenticacionServicio } from '../../compartido/servicios/autenticacion.servicio';

/**
 * Guardia de autenticación para proteger rutas
 * Solo permite acceso si el usuario está autenticado
 */
export const authGuard = () => {
  const authService = inject(AutenticacionServicio);
  const router = inject(Router);

  console.log('🛡️ Auth Guard: Verificando autenticación...');
  
  if (authService.estaAutenticado()) {
    console.log('✅ Usuario autenticado, acceso permitido');
    return true;
  }

  console.log('❌ Usuario NO autenticado, redirigiendo a login');
  return router.parseUrl('/login');
};