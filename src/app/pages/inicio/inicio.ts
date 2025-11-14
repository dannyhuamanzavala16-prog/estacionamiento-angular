import { Component } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,                  // ✅ IMPORTANTE
  imports: [CommonModule, DecimalPipe],  // ✅ NGFOR, NGIF, NGCLASS, |number
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css']
})
export class InicioComponent {

  TOTAL_ESPACIOS = 20;

  libres = 20;
  ocupados = 0;
  total = 20;

  horaActual = 'Cargando...';

  espacios: any[] = [];

  ngOnInit() {
    this.actualizarEstado();
    setInterval(() => this.actualizarEstado(), 30000);
  }

  actualizarEstado() {
    const vehiculos = JSON.parse(localStorage.getItem('vehiculos') ?? '[]');

    const ocupadosSet = new Set<number>();

    vehiculos.forEach((v: any) => {
      if (!v.horaSalida && v.espacio) {
        ocupadosSet.add(v.espacio);
      }
    });

    this.ocupados = ocupadosSet.size;
    this.libres = this.TOTAL_ESPACIOS - this.ocupados;
    this.total = this.TOTAL_ESPACIOS;

    this.espacios = [];

    for (let i = 1; i <= this.TOTAL_ESPACIOS; i++) {
      const ocupado = ocupadosSet.has(i);
      const vehiculo = vehiculos.find((v: any) => v.espacio === i && !v.horaSalida);

      this.espacios.push({
        numero: i,
        ocupado,
        vehiculo
      });
    }

    this.horaActual = new Date().toLocaleTimeString('es-PE');
  }

  mostrarInfoEspacio(vehiculo: any) {
    const entrada = new Date(vehiculo.horaEntrada);
    const ahora = new Date();

    alert(`
📍 Espacio E-${String(vehiculo.espacio).padStart(2, '0')}
🚙 Tipo: ${vehiculo.tipo}
📍 Columna: ${vehiculo.columna}
🕐 Entrada: ${entrada.toLocaleTimeString('es-PE')}
⏱️ Tiempo dentro: ${this.calcularTiempo(entrada, ahora)}
    `);
  }

  calcularTiempo(entrada: Date, salida: Date) {
    const segundos = Math.floor((salida.getTime() - entrada.getTime()) / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);

    if (horas > 0) return `${horas}h ${minutos % 60}m`;
    if (minutos > 0) return `${minutos}m`;

    return `${segundos}s`;
  }
}
