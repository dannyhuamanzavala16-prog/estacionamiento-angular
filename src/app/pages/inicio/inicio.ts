import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { EspaciosServicio } from '../../compartido/servicios/espacios.servicio';
import { VehiculosServicio } from '../../compartido/servicios/vehiculos.servicio';
import { EstadoEstacionamiento } from '../../compartido/modelos/espacio.modelo';
import { HeaderComponent } from '../../compartido/componentes/header/header';
import { FooterComponent } from '../../compartido/componentes/footer/footer';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, DecimalPipe, HeaderComponent, FooterComponent],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css']
})
export class InicioComponent implements OnInit, OnDestroy {
  private espaciosServicio = inject(EspaciosServicio);
  private vehiculosServicio = inject(VehiculosServicio);
  private destroy$ = new Subject<void>();

  // Estado del estacionamiento
  libres = 0;
  ocupados = 0;
  total = 0;
  porcentajeOcupacion = 0;

  // Espacios con información
  espacios: any[] = [];

  // Información de actualización
  horaActual = '';
  cargando = true;
  error = '';

  ngOnInit(): void {
    console.log('🏠 Inicio component cargado con Firebase');
    this.cargarDatosEnTiempoReal();
    this.actualizarHora();
    
    // Actualizar hora cada segundo
    setInterval(() => this.actualizarHora(), 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los datos en tiempo real desde Firestore
   */
  private cargarDatosEnTiempoReal(): void {
    // Suscribirse al estado general
    this.espaciosServicio.obtenerEstadoEstacionamiento()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estado: EstadoEstacionamiento) => {
          this.total = estado.espaciosTotales;
          this.ocupados = estado.espaciosOcupados;
          this.libres = estado.espaciosLibres;
          this.porcentajeOcupacion = estado.porcentajeOcupacion;
          this.cargando = false;
          this.error = '';
          console.log('📊 Estado actualizado:', estado);
        },
        error: (err) => {
          console.error('❌ Error al cargar estado:', err);
          this.error = 'Error al cargar el estado del estacionamiento';
          this.cargando = false;
        }
      });

    // Suscribirse a los espacios con vehículos
    this.espaciosServicio.obtenerEspaciosConVehiculos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (espacios) => {
          this.espacios = espacios;
          console.log('🅿️ Espacios actualizados:', espacios.length);
        },
        error: (err) => {
          console.error('❌ Error al cargar espacios:', err);
          this.error = 'Error al cargar los espacios';
        }
      });
  }

  /**
   * Actualiza la hora actual
   */
  private actualizarHora(): void {
    const ahora = new Date();
    this.horaActual = ahora.toLocaleString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Fuerza actualización manual
   */
  actualizarEstado(): void {
    console.log('🔄 Actualizando estado manualmente...');
    this.cargando = true;
    
    // La suscripción en tiempo real ya maneja la actualización
    setTimeout(() => {
      this.cargando = false;
    }, 500);
  }

  /**
   * Muestra información detallada de un espacio ocupado
   */
  mostrarInfoEspacio(vehiculo: any): void {
    if (!vehiculo) return;

    const entrada = vehiculo.horaEntrada?.toDate ? vehiculo.horaEntrada.toDate() : new Date(vehiculo.horaEntrada);
    const ahora = new Date();
    const tiempoTranscurrido = this.calcularTiempo(entrada, ahora);

    const mensaje = `
🚗 INFORMACIÓN DEL ESPACIO E-${String(vehiculo.espacioNumero).padStart(2, '0')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Placa: ${vehiculo.placa}
🚙 Tipo: ${vehiculo.tipo}
👤 Propietario: ${vehiculo.propietario}
🕐 Hora de entrada: ${entrada.toLocaleTimeString('es-PE')}
⏱️ Tiempo estacionado: ${tiempoTranscurrido}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    alert(mensaje);
  }

  /**
   * Calcula el tiempo transcurrido entre dos fechas
   */
  private calcularTiempo(entrada: Date, salida: Date): string {
    const milisegundos = salida.getTime() - entrada.getTime();
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
      return `${minutos}m ${segundos % 60}s`;
    }
    return `${segundos}s`;
  }
}