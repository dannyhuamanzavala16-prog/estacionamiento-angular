export interface Espacio {
  id?: string;
  numero: number;
  tipo: string;
  ocupado: boolean;
  vehiculoId?: string;
}

export interface EstadoEstacionamiento {
  espaciosTotales: number;
  espaciosOcupados: number;
  espaciosLibres: number;
  porcentajeOcupacion: number;
}