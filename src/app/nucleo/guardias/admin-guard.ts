import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AutenticacionServicio } from '../../compartido/servicios/autenticacion.servicio';
import { RolUsuario } from '../../compartido/modelos/usuario.modelo';

/**
 * Guardia para rutas exclusivas del Administrador
 * Permite acceso solo a usuarios con rol ADMINISTRADOR
 */
export const adminGuard = () => {
  const authService = inject(AutenticacionServicio);
  const router = inject(Router);

  console.log('🛡️ Admin Guard: Verificando rol...');
  
  const rolActual = authService.obtenerRolActual();
  console.log('👤 Rol actual:', rolActual);
  
  // Solo permitir acceso a usuarios con rol ADMINISTRADOR
  if (rolActual === RolUsuario.ADMINISTRADOR) {
    console.log('✅ Acceso permitido - Usuario es Administrador');
    return true;
  }

  console.log('❌ Acceso denegado - Se requiere rol de Administrador');
  
  // Si no está autenticado, redirigir a login
  if (!authService.estaAutenticado()) {
    return router.parseUrl('/login');
  }
  
  // Si está autenticado pero no es admin, redirigir a inicio
  return router.parseUrl('/inicio');
};