import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AutenticacionServicio } from '../../compartido/servicios/autenticacion.servicio';
import { RolUsuario } from '../../compartido/modelos/usuario.modelo';

/**
 * Guardia para rutas exclusivas del Guardia
 * Permite acceso solo a usuarios con rol GUARDIA
 */
export const guardiaGuard = () => {
  const authService = inject(AutenticacionServicio);
  const router = inject(Router);

  console.log('🛡️ Guardia Guard: Verificando rol...');
  
  const rolActual = authService.obtenerRolActual();
  console.log('👤 Rol actual:', rolActual);
  
  // Solo permitir acceso a usuarios con rol GUARDIA
  if (rolActual === RolUsuario.GUARDIA) {
    console.log('✅ Acceso permitido - Usuario es Guardia');
    return true;
  }

  // Si es admin, también puede acceder (opcional)
  if (rolActual === RolUsuario.ADMINISTRADOR) {
    console.log('✅ Acceso permitido - Usuario es Admin');
    return true;
  }

  console.log('❌ Acceso denegado - Se requiere rol de Guardia');
  
  // Si no está autenticado, redirigir a login
  if (!authService.estaAutenticado()) {
    return router.parseUrl('/login');
  }
  
  // Si está autenticado pero no es guardia, redirigir a inicio
  return router.parseUrl('/inicio');
};