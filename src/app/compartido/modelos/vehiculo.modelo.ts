export interface Vehiculo {
  id?: string;
  placa: string;
  propietario: string;
  horaEntrada: Date;
  horaSalida?: Date;
  tipo: TipoVehiculo;
  estado: EstadoVehiculo;
}

export enum TipoVehiculo {
  AUTO = 'Auto',
  MOTO = 'Moto',
  CAMIONETA = 'Camioneta',
  CAMION = 'Camión'
}

export enum EstadoVehiculo {
  DENTRO = 'Dentro',
  FUERA = 'Fuera'
}