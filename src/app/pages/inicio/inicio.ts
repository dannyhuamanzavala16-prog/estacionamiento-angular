import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { EspaciosServicio } from '../../compartido/servicios/espacios.servicio';
import { VehiculosServicio } from '../../compartido/servicios/vehiculos.servicio';
import { EstadoEstacionamiento } from '../../compartido/modelos/espacio.modelo';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
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

  // Intervalo para actualizar la hora
  private intervaloHora?: any;

  ngOnInit(): void {
    console.log('🏠 Inicio component cargado con Firebase en tiempo real');
    
    // CRÍTICO: Inyectar el servicio de espacios en vehiculos para evitar dependencia circular
    this.vehiculosServicio.setEspaciosServicio(this.espaciosServicio);
    
    // Cargar datos en tiempo real
    this.cargarDatosEnTiempoReal();
    this.actualizarHora();
    
    // Actualizar hora cada segundo
    this.intervaloHora = setInterval(() => this.actualizarHora(), 1000);
  }

  ngOnDestroy(): void {
    console.log('🔌 Destruyendo componente Inicio - limpiando suscripciones');
    
    // Limpiar suscripciones
    this.destroy$.next();
    this.destroy$.complete();
    
    // Limpiar intervalo
    if (this.intervaloHora) {
      clearInterval(this.intervaloHora);
    }
  }

  /**
   * ✅ CORREGIDO: Carga los datos en tiempo real desde Firestore
   */
  private cargarDatosEnTiempoReal(): void {
    console.log('📡 Conectando a Firebase en tiempo real...');

    // 1️⃣ Suscribirse al ESTADO general del estacionamiento
    this.espaciosServicio.obtenerEstadoEstacionamiento()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estado: EstadoEstacionamiento) => {
          console.log('📊 Estado actualizado:', estado);
          
          this.total = estado.espaciosTotales;
          this.ocupados = estado.espaciosOcupados;
          this.libres = estado.espaciosLibres;
          this.porcentajeOcupacion = estado.porcentajeOcupacion;
          
          // Ocultar loading solo después de la primera carga
          if (this.cargando) {
            this.cargando = false;
            console.log('✅ Primera carga completada');
          }
          
          this.error = '';
        },
        error: (err) => {
          console.error('❌ Error al cargar estado del estacionamiento:', err);
          this.error = 'No se pudo conectar con Firebase. Verifica tu conexión.';
          this.cargando = false;
        }
      });

    // 2️⃣ Suscribirse a los ESPACIOS con vehículos en tiempo real
    this.espaciosServicio.obtenerEspaciosConVehiculos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (espacios) => {
          console.log('🅿️ Espacios actualizados:', {
            total: espacios.length,
            ocupados: espacios.filter(e => e.ocupado).length,
            libres: espacios.filter(e => !e.ocupado).length
          });
          
          this.espacios = espacios;

          // Log de espacios ocupados con detalles
          const ocupados = espacios.filter(e => e.ocupado && e.vehiculo);
          if (ocupados.length > 0) {
            console.log('🚗 Vehículos estacionados:');
            ocupados.forEach(e => {
              console.log(`  ✓ Espacio ${e.numero}: ${e.vehiculo.placa} (${e.vehiculo.tipo}) - ${e.vehiculo.propietario}`);
            });
          } else {
            console.log('✨ No hay vehículos estacionados actualmente');
          }
        },
        error: (err) => {
          console.error('❌ Error al cargar espacios:', err);
          
          // Mostrar error solo si no hay otro error activo
          if (!this.error) {
            this.error = 'Error al cargar los espacios del estacionamiento.';
          }
        }
      });
  }

  /**
   * ✅ Actualiza la hora actual en formato legible
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
   * ✅ Fuerza actualización manual con feedback visual
   */
  actualizarEstado(): void {
    console.log('🔄 Actualización manual solicitada por el usuario');
    
    // Mostrar indicador de carga brevemente para dar feedback
    const cargandoPrevio = this.cargando;
    this.cargando = true;
    
    // Como ya tenemos observables en tiempo real, solo mostramos feedback
    setTimeout(() => {
      this.cargando = cargandoPrevio;
      console.log('✅ Interfaz actualizada');
      
      // Mostrar notificación de actualización
      this.mostrarNotificacion('Datos actualizados correctamente');
    }, 500);
  }

  /**
   * ✅ MEJORADO: Muestra información detallada de un espacio ocupado
   */
  mostrarInfoEspacio(vehiculo: any): void {
    if (!vehiculo) {
      console.warn('⚠️ No hay vehículo en este espacio');
      return;
    }

    try {
      // Convertir la fecha correctamente
      let entrada: Date;
      if (vehiculo.horaEntrada?.toDate) {
        entrada = vehiculo.horaEntrada.toDate();
      } else if (vehiculo.horaEntrada instanceof Date) {
        entrada = vehiculo.horaEntrada;
      } else {
        entrada = new Date(vehiculo.horaEntrada);
      }
      
      const ahora = new Date();
      const tiempoTranscurrido = this.calcularTiempo(entrada, ahora);

      // Calcular costo estimado
      const costoEstimado = this.vehiculosServicio.calcularCosto(entrada, ahora);

      const mensaje = `
🚗 INFORMACIÓN DEL ESPACIO E-${String(vehiculo.espacioNumero || '??').padStart(2, '0')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Placa: ${vehiculo.placa}
🚙 Tipo: ${vehiculo.tipo}
👤 Propietario: ${vehiculo.propietario}
🕐 Hora de entrada: ${entrada.toLocaleString('es-PE', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
})}
⏱️ Tiempo estacionado: ${tiempoTranscurrido}
💰 Costo estimado: S/. ${costoEstimado.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `.trim();

      alert(mensaje);
      
      console.log('📄 Información mostrada para:', vehiculo.placa);
    } catch (error) {
      console.error('❌ Error al mostrar información:', error);
      alert('Error al cargar la información del vehículo. Intenta nuevamente.');
    }
  }

  /**
   * ✅ Calcula el tiempo transcurrido entre dos fechas
   */
  private calcularTiempo(entrada: Date, salida: Date): string {
    const milisegundos = salida.getTime() - entrada.getTime();
    
    // Validar que la fecha sea válida
    if (milisegundos < 0 || isNaN(milisegundos)) {
      return '0s';
    }

    const segundos = Math.floor(milisegundos / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    // Formato mejorado según el tiempo transcurrido
    if (dias > 0) {
      const horasRestantes = horas % 24;
      const minutosRestantes = minutos % 60;
      return `${dias}d ${horasRestantes}h ${minutosRestantes}m`;
    }
    
    if (horas > 0) {
      const minutosRestantes = minutos % 60;
      return `${horas}h ${minutosRestantes}m`;
    }
    
    if (minutos > 0) {
      const segundosRestantes = segundos % 60;
      return `${minutos}m ${segundosRestantes}s`;
    }
    
    return `${segundos}s`;
  }

  /**
   * ✅ Muestra una notificación temporal
   */
  private mostrarNotificacion(mensaje: string): void {
    // Crear elemento de notificación
    const notif = document.createElement('div');
    notif.textContent = '✅ ' + mensaje;
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(16, 185, 129, 0.95);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      z-index: 9999;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notif);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
      notif.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }
}