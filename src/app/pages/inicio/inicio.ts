import { Component } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterModule],
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

  constructor(private router: Router) {}

  ngOnInit() {
    console.log('🏠 Inicio component cargado');
    this.actualizarEstado();
    setInterval(() => this.actualizarEstado(), 30000);
  }

  actualizarEstado() {
    const vehiculos = JSON.parse(localStorage.getItem('vehiculos') ?? '[]');

    const ocupadosSet = new Set<number>();

    vehiculos.forEach((v: any) => {
      if (v.estado === 'activo' && v.espacio) {
        ocupadosSet.add(v.espacio);
      }
    });

    this.ocupados = ocupadosSet.size;
    this.libres = this.TOTAL_ESPACIOS - this.ocupados;
    this.total = this.TOTAL_ESPACIOS;

    this.espacios = [];

    for (let i = 1; i <= this.TOTAL_ESPACIOS; i++) {
      const ocupado = ocupadosSet.has(i);
      const vehiculo = vehiculos.find((v: any) => v.espacio === i && v.estado === 'activo');

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
👤 Propietario: ${vehiculo.propietario}
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

  goToLogin() {
    console.log('🔐 Navegando a login...');
    this.router.navigate(['/login']);
  }
}