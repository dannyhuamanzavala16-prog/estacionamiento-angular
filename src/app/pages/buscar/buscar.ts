import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculosServicio } from '../../compartido/servicios/vehiculos.servicio';
import { Vehiculo } from '../../compartido/modelos/vehiculo.modelo';

interface HistorialBusqueda {
  placa: string;
  fecha: string;
}

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscar.html',
  styleUrls: ['./buscar.css']
})
export class Buscar implements OnInit {
  private vehiculosServicio = inject(VehiculosServicio);

  placaBusqueda = '';
  placaBuscada = '';
  vehiculoEncontrado: Vehiculo | null = null;
  busquedaRealizada = false;
  cargando = false;
  error = '';
  historialBusquedas: HistorialBusqueda[] = [];

  ngOnInit(): void {
    console.log('🔍 Buscar component cargado');
    this.cargarHistorial();
  }

  async buscarVehiculo(): Promise<void> {
    const placa = this.placaBusqueda.trim().toUpperCase();
    
    if (!placa) {
      this.error = 'Por favor ingresa una placa válida';
      return;
    }

    console.log('🔍 Buscando vehículo:', placa);
    this.cargando = true;
    this.error = '';
    this.busquedaRealizada = false;
    this.vehiculoEncontrado = null;

    try {
      const vehiculo = await this.vehiculosServicio.buscarVehiculoActivoPorPlaca(placa);
      
      this.vehiculoEncontrado = vehiculo;
      this.placaBuscada = placa;
      this.busquedaRealizada = true;
      this.cargando = false;

      // Guardar en historial
      this.agregarAlHistorial(placa);

      if (vehiculo) {
        console.log('✅ Vehículo encontrado:', vehiculo);
      } else {
        console.log('⚠️ Vehículo no encontrado');
      }
    } catch (err) {
      console.error('❌ Error al buscar:', err);
      this.error = 'Error al realizar la búsqueda';
      this.cargando = false;
    }
  }

  buscarDesdeHistorial(placa: string): void {
    this.placaBusqueda = placa;
    this.buscarVehiculo();
  }

  limpiarBusqueda(): void {
    this.placaBusqueda = '';
    this.placaBuscada = '';
    this.vehiculoEncontrado = null;
    this.busquedaRealizada = false;
    this.error = '';
  }

  private agregarAlHistorial(placa: string): void {
    // Evitar duplicados
    const existe = this.historialBusquedas.find(b => b.placa === placa);
    if (existe) return;

    const nuevaBusqueda: HistorialBusqueda = {
      placa,
      fecha: new Date().toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    this.historialBusquedas.unshift(nuevaBusqueda);

    // Mantener solo las últimas 5 búsquedas
    if (this.historialBusquedas.length > 5) {
      this.historialBusquedas = this.historialBusquedas.slice(0, 5);
    }

    // Guardar en localStorage
    localStorage.setItem('historialBusquedas', JSON.stringify(this.historialBusquedas));
  }

  private cargarHistorial(): void {
    const historial = localStorage.getItem('historialBusquedas');
    if (historial) {
      try {
        this.historialBusquedas = JSON.parse(historial);
      } catch (err) {
        console.error('Error al cargar historial:', err);
      }
    }
  }

  formatearFecha(fecha: any): string {
    const date = fecha?.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  calcularTiempoActual(entrada: any): string {
    const fechaEntrada = entrada?.toDate ? entrada.toDate() : new Date(entrada);
    const ahora = new Date();
    
    const milisegundos = ahora.getTime() - fechaEntrada.getTime();
    const segundos = Math.floor(milisegundos / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) {
      return `${dias}d ${horas % 24}h ${minutos % 60}m`;
    }
    if (horas > 0) {
      return `${horas}h ${minutos % 60}m`;
    }
    if (minutos > 0) {
      return `${minutos}m`;
    }
    return `${segundos}s`;
  }
}