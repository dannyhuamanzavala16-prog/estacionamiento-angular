import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

interface Vehiculo {
  espacio?: number;
  columna?: string;
  placa: string;
  propietario: string;
  tipo: string;
  horaEntrada: Date;
  horaSalida?: Date;
}

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './historial.html',
  styleUrls: ['./historial.css']
})
export class Historial implements OnInit {
  vehiculos: Vehiculo[] = [];
  vehiculosFiltrados: Vehiculo[] = [];

  // Estadísticas
  totalRegistros = 0;
  registrosHoy = 0;
  tiempoPromedio = '-';
  tipoComun = '-';

  // Filtros
  filtroPlaca = '';
  filtroPropietario = '';
  filtroTipo = '';
  filtroFecha = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('📋 Historial component cargado');
    this.cargarVehiculos();
    this.actualizarEstadisticas();
    this.actualizarTabla();
  }

  cargarVehiculos(): void {
    const stored = localStorage.getItem('vehiculos');
    if (stored) {
      this.vehiculos = JSON.parse(stored).map((v: any) => ({
        ...v,
        horaEntrada: new Date(v.horaEntrada),
        horaSalida: v.horaSalida ? new Date(v.horaSalida) : undefined
      }));
    }
  }

  actualizarEstadisticas(): void {
    this.totalRegistros = this.vehiculos.length;

    // Registros de hoy
    const hoy = new Date().toDateString();
    this.registrosHoy = this.vehiculos.filter(v => 
      v.horaEntrada.toDateString() === hoy
    ).length;

    // Tiempo promedio
    const conSalida = this.vehiculos.filter(v => v.horaSalida);
    if (conSalida.length > 0) {
      const tiempoTotal = conSalida.reduce((sum, v) => {
        return sum + (v.horaSalida!.getTime() - v.horaEntrada.getTime());
      }, 0);
      const promedioMin = Math.floor((tiempoTotal / conSalida.length) / 60000);
      const horas = Math.floor(promedioMin / 60);
      const minutos = promedioMin % 60;
      this.tiempoPromedio = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
    }

    // Tipo más común
    if (this.totalRegistros > 0) {
      const tipos: { [key: string]: number } = {};
      this.vehiculos.forEach(v => {
        tipos[v.tipo] = (tipos[v.tipo] || 0) + 1;
      });
      this.tipoComun = Object.keys(tipos).reduce((a, b) => 
        tipos[a] > tipos[b] ? a : b
      );
    }
  }

  actualizarTabla(): void {
    const busquedaPlaca = this.filtroPlaca.trim().toUpperCase();
    const busquedaPropietario = this.filtroPropietario.trim().toUpperCase();

    this.vehiculosFiltrados = this.vehiculos.filter(v => {
      const cumplePlaca = !busquedaPlaca || v.placa.includes(busquedaPlaca);
      const cumplePropietario = !busquedaPropietario || 
        v.propietario.toUpperCase().includes(busquedaPropietario);
      const cumpleTipo = !this.filtroTipo || v.tipo === this.filtroTipo;
      const cumpleFecha = !this.filtroFecha || 
        v.horaEntrada.toISOString().split('T')[0] === this.filtroFecha;
      
      return cumplePlaca && cumplePropietario && cumpleTipo && cumpleFecha;
    });

    // Ordenar por fecha más reciente
    this.vehiculosFiltrados.sort((a, b) => 
      b.horaEntrada.getTime() - a.horaEntrada.getTime()
    );
  }

  calcularTiempo(entrada: Date, salida?: Date): string {
    if (!salida) return '-';
    
    const segundos = Math.floor((salida.getTime() - entrada.getTime()) / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    const minRest = minutos % 60;
    const horasRest = horas % 24;
    
    if (dias > 0) {
      return `${dias}d ${horasRest}h ${minRest}m`;
    } else if (horas > 0) {
      return `${horas}h ${minRest}m`;
    } else if (minutos > 0) {
      return `${minutos}m`;
    } else {
      return `${segundos}s`;
    }
  }

  exportarCSV(): void {
    if (this.vehiculos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    let csv = 'Espacio,Columna,Placa,Propietario,Tipo,Fecha,Hora Entrada,Hora Salida,Tiempo Total\n';
    
    this.vehiculos.forEach(v => {
      const fechaEntrada = v.horaEntrada.toLocaleDateString('es-PE');
      const horaEntrada = v.horaEntrada.toLocaleTimeString('es-PE');
      const horaSalida = v.horaSalida ? 
        v.horaSalida.toLocaleTimeString('es-PE') : '-';
      const tiempoTotal = this.calcularTiempo(v.horaEntrada, v.horaSalida);
      
      csv += `E-${String(v.espacio || '-').padStart(2, '0')},${v.columna || '-'},${v.placa},${v.propietario},${v.tipo},${fechaEntrada},${horaEntrada},${horaSalida},${tiempoTotal}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_zavalaTech_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  goToLogin() {
    console.log('🔐 Navegando a login...');
    this.router.navigate(['/login']);
  }
}