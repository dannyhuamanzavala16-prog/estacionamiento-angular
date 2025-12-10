export interface Vehiculo {
  id?: string;
  placa: string;
  propietario: string;
  horaEntrada: any; 
  horaSalida?: any; 
  tipo: string; 
  estado: string; 
  espacioNumero?: number; // Número del espacio asignado
}

export enum TipoVehiculo {
  AUTO = 'Auto',
  MOTO = 'Moto',
  CAMIONETA = 'Camioneta',
  CAMION = 'Camión',
  SUV = 'SUV'
}

export enum EstadoVehiculo {
  DENTRO = 'Dentro',
  FUERA = 'Fuera'
}