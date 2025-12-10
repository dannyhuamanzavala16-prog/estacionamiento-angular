export interface Usuario {
  id?: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
}

export enum RolUsuario {
  GUARDIA = 'guardia',
  ADMINISTRADOR = 'administrador'
}