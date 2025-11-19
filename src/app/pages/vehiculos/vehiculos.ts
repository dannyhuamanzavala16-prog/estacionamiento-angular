import { Component } from '@angular/core';

interface Vehiculo {
  espacio: number;
  placa: string;
  propietario: string;
  tipo: string;
  horaEntrada: Date;
  horaSalida?: Date;
  duracion?: string;
  estado: 'activo' | 'finalizado';
}

@Component({
  selector: 'app-vehiculos',
  templateUrl: './vehiculos.html',
  styleUrls: ['./vehiculos.css'],
})
export class Vehiculos {

  vehiculos: Vehiculo[] = [];
  totalEspacios: number = 20;

  // Estadísticas
  vehiculosHoy: number = 0;
  vehiculosActivos: number = 0;
  tiempoPromedio: string = '-';
  porcentajeOcupacion: number = 0;

  constructor() { }

  registrarVehiculo(placa: string, propietario: string, tipo: string) {
    if (!placa || !propietario || !tipo) {
      alert('Todos los campos son obligatorios');
      return;
    }

    const espacioLibre = this.buscarEspacioLibre();
    if (espacioLibre === -1) {
      alert('No hay espacios disponibles');
      return;
    }

    const nuevoVehiculo: Vehiculo = {
      espacio: espacioLibre,
      placa: placa.toUpperCase(),
      propietario,
      tipo,
      horaEntrada: new Date(),
      estado: 'activo'
    };

    this.vehiculos.push(nuevoVehiculo);
    this.actualizarEstadisticas();
  }

  finalizarVehiculo(vehiculo: Vehiculo) {
    vehiculo.horaSalida = new Date();
    vehiculo.duracion = this.calcularDuracion(vehiculo.horaEntrada, vehiculo.horaSalida);
    vehiculo.estado = 'finalizado';
    this.actualizarEstadisticas();
  }

  buscarEspacioLibre(): number {
    for (let i = 1; i <= this.totalEspacios; i++) {
      if (!this.vehiculos.find(v => v.espacio === i && v.estado === 'activo')) {
        return i;
      }
    }
    return -1;
  }

  calcularDuracion(entrada: Date, salida: Date): string {
    const diff = salida.getTime() - entrada.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const min = minutos % 60;
    return `${horas}h ${min}m`;
  }

  actualizarEstadisticas() {
    const hoy = new Date().toDateString();
    this.vehiculosHoy = this.vehiculos.filter(v => v.horaEntrada.toDateString() === hoy).length;
    this.vehiculosActivos = this.vehiculos.filter(v => v.estado === 'activo').length;

    const duraciones = this.vehiculos
      .filter(v => v.duracion)
      .map(v => {
        const [h, m] = v.duracion!.split('h ').map(n => parseInt(n));
        return h * 60 + m;
      });
    const promedioMin = duraciones.length ? Math.floor(duraciones.reduce((a,b)=>a+b,0)/duraciones.length) : 0;
    const promHoras = Math.floor(promedioMin / 60);
    const promMin = promedioMin % 60;
    this.tiempoPromedio = duraciones.length ? `${promHoras}h ${promMin}m` : '-';

    this.porcentajeOcupacion = Math.round((this.vehiculosActivos / this.totalEspacios) * 100);
  }
}
