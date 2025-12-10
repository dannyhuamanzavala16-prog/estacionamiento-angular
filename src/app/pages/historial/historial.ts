import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { VehiculosServicio } from '../../compartido/servicios/vehiculos.servicio';
import { AutenticacionServicio } from '../../compartido/servicios/autenticacion.servicio'; 
import { Vehiculo } from '../../compartido/modelos/vehiculo.modelo';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './historial.html',
  styleUrls: ['./historial.css']
})
export class Historial implements OnInit, OnDestroy {
  private vehiculosServicio = inject(VehiculosServicio);
  private authServicio = inject(AutenticacionServicio);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

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

  // Estados
  cargando = true;
  error = '';
  usuarioAutenticado = false;

  ngOnInit(): void {
    console.log('📋 Historial component cargado con Firebase');
    this.verificarAutenticacion();
    this.cargarVehiculosDesdeFirebase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  private verificarAutenticacion(): void {
    this.authServicio.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.usuarioAutenticado = !!user;
      });
  }

  /**
   * Carga vehículos desde Firebase en tiempo real
   * CAMBIADO A PUBLIC para poder ser llamado desde el template
   */
  cargarVehiculosDesdeFirebase(): void {
    console.log('🔄 Iniciando carga de vehículos...');
    this.cargando = true;
    this.error = '';
    
    this.vehiculosServicio.obtenerVehiculos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehiculos: Vehiculo[]) => {
          console.log('✅ Datos recibidos de Firebase:', vehiculos);
          this.vehiculos = vehiculos;
          this.cargando = false;
          this.error = '';
          console.log('🚗 Vehículos cargados exitosamente:', vehiculos.length);
          
          this.actualizarEstadisticas();
          this.actualizarTabla();
        },
        error: (err: any) => {
          console.error('❌ Error completo:', err);
          console.error('❌ Error mensaje:', err.message);
          console.error('❌ Error stack:', err.stack);
          this.error = `Error al cargar el historial: ${err.message || 'Error desconocido'}`;
          this.cargando = false;
        }
      });
  }

  /**
   * Actualiza las estadísticas del historial
   */
  private actualizarEstadisticas(): void {
    this.totalRegistros = this.vehiculos.length;

    // Registros de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    this.registrosHoy = this.vehiculos.filter(v => {
      const entrada = this.convertirADate(v.horaEntrada);
      entrada.setHours(0, 0, 0, 0);
      return entrada.getTime() === hoy.getTime();
    }).length;

    // Tiempo promedio
    const conSalida = this.vehiculos.filter(v => v.horaSalida);
    if (conSalida.length > 0) {
      const tiempoTotal = conSalida.reduce((sum, v) => {
        const entrada = this.convertirADate(v.horaEntrada);
        const salida = this.convertirADate(v.horaSalida!);
        return sum + (salida.getTime() - entrada.getTime());
      }, 0);
      const promedioMin = Math.floor((tiempoTotal / conSalida.length) / 60000);
      const horas = Math.floor(promedioMin / 60);
      const minutos = promedioMin % 60;
      this.tiempoPromedio = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
    } else {
      this.tiempoPromedio = '-';
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
    } else {
      this.tipoComun = '-';
    }
  }

  /**
   * Actualiza la tabla con los filtros aplicados
   */
  actualizarTabla(): void {
    const busquedaPlaca = this.filtroPlaca.trim().toUpperCase();
    const busquedaPropietario = this.filtroPropietario.trim().toUpperCase();

    this.vehiculosFiltrados = this.vehiculos.filter(v => {
      const cumplePlaca = !busquedaPlaca || v.placa.includes(busquedaPlaca);
      const cumplePropietario = !busquedaPropietario || 
        v.propietario.toUpperCase().includes(busquedaPropietario);
      const cumpleTipo = !this.filtroTipo || v.tipo === this.filtroTipo;
      
      // Filtro de fecha
      let cumpleFecha = true;
      if (this.filtroFecha) {
        const entrada = this.convertirADate(v.horaEntrada);
        const fechaEntrada = entrada.toISOString().split('T')[0];
        cumpleFecha = fechaEntrada === this.filtroFecha;
      }
      
      return cumplePlaca && cumplePropietario && cumpleTipo && cumpleFecha;
    });

    // Ordenar por fecha más reciente
    this.vehiculosFiltrados.sort((a, b) => {
      const fechaA = this.convertirADate(a.horaEntrada);
      const fechaB = this.convertirADate(b.horaEntrada);
      return fechaB.getTime() - fechaA.getTime();
    });

    console.log('🔍 Filtros aplicados. Resultados:', this.vehiculosFiltrados.length);
  }

  /**
   * Convierte un Timestamp de Firebase o Date a Date
   */
  private convertirADate(fecha: any): Date {
    if (!fecha) return new Date();
    // Si tiene el método toDate, es un Timestamp de Firebase
    if (fecha.toDate && typeof fecha.toDate === 'function') {
      return fecha.toDate();
    }
    // Si ya es un Date, lo retorna
    if (fecha instanceof Date) {
      return fecha;
    }
    // Intenta convertirlo
    return new Date(fecha);
  }

  /**
   * Obtiene la fecha formateada para el template
   */
  obtenerFecha(fecha: any): Date {
    return this.convertirADate(fecha);
  }

  /**
   * Calcula el tiempo transcurrido entre entrada y salida
   */
  calcularTiempo(entrada: any, salida?: any): string {
    if (!salida) return '-';
    
    const fechaEntrada = this.convertirADate(entrada);
    const fechaSalida = this.convertirADate(salida);
    
    const segundos = Math.floor((fechaSalida.getTime() - fechaEntrada.getTime()) / 1000);
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

  /**
   * Exporta el historial a CSV
   */
  exportarCSV(): void {
    if (this.vehiculos.length === 0) {
      alert('⚠️ No hay datos para exportar');
      return;
    }

    let csv = 'Espacio,Placa,Propietario,Tipo,Fecha,Hora Entrada,Hora Salida,Tiempo Total\n';
    
    this.vehiculos.forEach(v => {
      const entrada = this.convertirADate(v.horaEntrada);
      const fechaEntrada = entrada.toLocaleDateString('es-PE');
      const horaEntrada = entrada.toLocaleTimeString('es-PE');
      
      let horaSalida = '-';
      if (v.horaSalida) {
        const salida = this.convertirADate(v.horaSalida);
        horaSalida = salida.toLocaleTimeString('es-PE');
      }
      
      const tiempoTotal = this.calcularTiempo(v.horaEntrada, v.horaSalida);
      const espacio = v.espacioNumero ? `E-${String(v.espacioNumero).padStart(2, '0')}` : '-';
      
      csv += `${espacio},${v.placa},${v.propietario},${v.tipo},${fechaEntrada},${horaEntrada},${horaSalida},${tiempoTotal}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_zavalaTech_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    console.log('📥 CSV exportado correctamente');
  }

  /**
   * Navega a la página de login o panel admin
   */
  goToLogin(): void {
    if (this.usuarioAutenticado) {
      this.router.navigate(['/vehiculos']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}