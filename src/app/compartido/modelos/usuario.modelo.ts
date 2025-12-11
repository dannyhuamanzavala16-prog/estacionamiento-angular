export interface Usuario {
  id?: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
}

export enum RolUsuario {
  PUBLICO = 'publico',      // Usuario no autenticado
  GUARDIA = 'guardia',       // Guardia de seguridad
  ADMINISTRADOR = 'admin'    // Administrador del sistema
}

// Configuración de permisos por rol
export const PERMISOS_POR_ROL = {
  [RolUsuario.PUBLICO]: {
    nombre: 'Público',
    icono: '👤',
    rutas: ['/inicio', '/login'],
    puedeVerVehiculos: false,
    puedeRegistrarVehiculos: false,
    puedeVerHistorial: false,
    puedeVerEstadisticas: false
  },
  [RolUsuario.GUARDIA]: {
    nombre: 'Guardia',
    icono: '🛡️',
    rutas: ['/inicio', '/vehiculos', '/buscar'],
    puedeVerVehiculos: true,
    puedeRegistrarVehiculos: true,
    puedeVerHistorial: false,
    puedeVerEstadisticas: false
  },
  [RolUsuario.ADMINISTRADOR]: {
    nombre: 'Administrador',
    icono: '👨‍💼',
    rutas: ['/inicio', '/vehiculos', '/historial', '/estadisticas'],
    puedeVerVehiculos: true,
    puedeRegistrarVehiculos: true,
    puedeVerHistorial: true,
    puedeVerEstadisticas: true
  }
};