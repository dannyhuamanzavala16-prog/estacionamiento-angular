import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';
import { VehiculosServicio } from '../../compartido/servicios/vehiculos.servicio';
import { EspaciosServicio } from '../../compartido/servicios/espacios.servicio';
import { AutenticacionServicio } from '../../compartido/servicios/autenticacion.servicio';
import { Vehiculo, TipoVehiculo, EstadoVehiculo } from '../../compartido/modelos/vehiculo.modelo';

interface VehiculoExtendido extends Vehiculo {
  duracion?: string;
}

interface EspacioUI {
  numero: number;
  ocupado: boolean;
  placa?: string;
  vehiculo?: Vehiculo;
}

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos.html',
  styleUrls: ['./vehiculos.css'],
})
export class Vehiculos implements OnInit, OnDestroy {
  private vehiculosServicio = inject(VehiculosServicio);
  private espaciosServicio = inject(EspaciosServicio);
  private authServicio = inject(AutenticacionServicio);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Listas principales
  vehiculos: VehiculoExtendido[] = [];
  vehiculosFiltrados: VehiculoExtendido[] = [];
  espaciosUI: EspacioUI[] = [];
  
  // Estadísticas en tiempo real
  espaciosLibres: number = 20;
  espaciosOcupados: number = 0;
  espaciosTotal: number = 20;
  vehiculosHoy: number = 0;
  vehiculosActivos: number = 0;
  tiempoPromedio: string = '-';
  porcentajeOcupacion: number = 0;

  // Estado del componente
  cargando: boolean = true;
  procesando: boolean = false;
  filtroActual: 'todos' | 'activos' = 'todos';

  // Tipos de vehículos
  tiposVehiculo = Object.values(TipoVehiculo);

  ngOnInit(): void {
    console.log('🚀 Componente Vehículos iniciado');
    
    // Verificar autenticación
    if (!this.authServicio.estaAutenticado()) {
      console.log('❌ No autenticado, redirigiendo...');
      this.router.navigate(['/login']);
      return;
    }

    // ✅ CORRECCIÓN: Inyectar espaciosServicio en vehiculosServicio
    this.vehiculosServicio.setEspaciosServicio(this.espaciosServicio);

    // Inicializar espacios UI
    this.inicializarEspaciosUI();

    // Cargar datos en tiempo real
    this.cargarDatosEnTiempoReal();

    // Actualizar duraciones cada 30 segundos
    this.iniciarActualizacionDuraciones();
  }

  ngOnDestroy(): void {
    console.log('🔌 Destruyendo componente Vehículos');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ Inicializa la estructura de espacios para la UI
   */
  inicializarEspaciosUI(): void {
    this.espaciosUI = [];
    for (let i = 1; i <= 20; i++) {
      this.espaciosUI.push({
        numero: i,
        ocupado: false
      });
    }
    console.log('✅ Espacios UI inicializados:', this.espaciosUI.length);
  }

  /**
   * ✅ CORREGIDO: Carga todos los datos en tiempo real desde Firebase
   */
  cargarDatosEnTiempoReal(): void {
    console.log('📡 Iniciando suscripciones en tiempo real...');

    // 1. Suscribirse a TODOS los vehículos
    this.vehiculosServicio.obtenerVehiculos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehiculos) => {
          console.log('🚗 Vehículos recibidos:', vehiculos.length);
          
          // Procesar vehículos con duración calculada
          this.vehiculos = vehiculos.map(v => {
            const vehiculoExtendido: VehiculoExtendido = { ...v };
            
            // Calcular duración para vehículos que ya salieron
            if (v.horaSalida && v.horaEntrada) {
              vehiculoExtendido.duracion = this.calcularDuracion(
                v.horaEntrada,
                v.horaSalida
              );
            } else if (v.estado === EstadoVehiculo.DENTRO) {
              // Para vehículos activos, calcular duración hasta ahora
              vehiculoExtendido.duracion = this.calcularDuracion(
                v.horaEntrada,
                new Date()
              );
            }
            
            return vehiculoExtendido;
          });

          // Aplicar filtro actual
          this.aplicarFiltro();

          // Actualizar estadísticas
          this.actualizarEstadisticas();
          
          if (this.cargando) {
            this.cargando = false;
            console.log('✅ Carga inicial completada');
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar vehículos:', error);
          this.mostrarMensaje('Error al cargar vehículos desde Firebase', 'error');
          this.cargando = false;
        }
      });

    // 2. Suscribirse a espacios con vehículos (para el grid visual)
    this.espaciosServicio.obtenerEspaciosConVehiculos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (espacios) => {
          console.log('🅿️ Espacios actualizados:', espacios.length);
          
          this.espaciosUI = espacios.map(espacio => ({
            numero: espacio.numero,
            ocupado: espacio.ocupado,
            placa: espacio.vehiculo?.placa,
            vehiculo: espacio.vehiculo
          }));
        },
        error: (error) => {
          console.error('❌ Error al cargar espacios:', error);
          this.mostrarMensaje('Error al cargar espacios', 'error');
        }
      });

    // 3. Suscribirse al estado general
    this.espaciosServicio.obtenerEstadoEstacionamiento()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estado) => {
          this.espaciosTotal = estado.espaciosTotales;
          this.espaciosOcupados = estado.espaciosOcupados;
          this.espaciosLibres = estado.espaciosLibres;
          this.porcentajeOcupacion = estado.porcentajeOcupacion;
          
          console.log('📊 Estado actualizado:', estado);
        },
        error: (error) => {
          console.error('❌ Error al cargar estado:', error);
        }
      });
  }

  /**
   * ✅ NUEVO: Actualiza las duraciones de vehículos activos cada 30 segundos
   */
  iniciarActualizacionDuraciones(): void {
    interval(30000) // Cada 30 segundos
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.vehiculos = this.vehiculos.map(v => {
          if (v.estado === EstadoVehiculo.DENTRO) {
            return {
              ...v,
              duracion: this.calcularDuracion(v.horaEntrada, new Date())
            };
          }
          return v;
        });
        
        this.aplicarFiltro();
        console.log('🔄 Duraciones actualizadas');
      });
  }

  /**
   * ✅ NUEVO: Aplica el filtro actual a los vehículos
   */
  aplicarFiltro(): void {
    if (this.filtroActual === 'activos') {
      this.vehiculosFiltrados = this.vehiculos.filter(
        v => v.estado === EstadoVehiculo.DENTRO
      );
    } else {
      this.vehiculosFiltrados = [...this.vehiculos];
    }
  }

  /**
   * ✅ NUEVO: Cambia el filtro de visualización
   */
  cambiarFiltro(filtro: 'todos' | 'activos'): void {
    this.filtroActual = filtro;
    this.aplicarFiltro();
    console.log('🔍 Filtro aplicado:', filtro, '- Mostrando:', this.vehiculosFiltrados.length);
  }

  /**
   * ✅ MEJORADO: Registra la entrada de un nuevo vehículo
   */
  async registrarVehiculo(event: Event): Promise<void> {
    event.preventDefault();

    if (this.procesando) {
      console.log('⏳ Ya se está procesando un registro');
      return;
    }

    const form = event.target as HTMLFormElement;
    const placaInput = form.querySelector('#placa') as HTMLInputElement;
    const propietarioInput = form.querySelector('#propietario') as HTMLInputElement;
    const tipoSelect = form.querySelector('#tipo') as HTMLSelectElement;

    const placa = placaInput?.value.trim().toUpperCase() || '';
    const propietario = propietarioInput?.value.trim() || '';
    const tipo = tipoSelect?.value as TipoVehiculo || '';

    // Validaciones
    if (!placa || !propietario || !tipo) {
      this.mostrarMensaje('⚠️ Todos los campos son obligatorios', 'error');
      return;
    }

    // Validar formato de placa (básico)
    if (placa.length < 3) {
      this.mostrarMensaje('⚠️ La placa debe tener al menos 3 caracteres', 'error');
      return;
    }

    // Verificar espacios disponibles
    if (this.espaciosLibres === 0) {
      this.mostrarMensaje('🚫 No hay espacios disponibles', 'error');
      return;
    }

    // Verificar si el vehículo ya está dentro
    const vehiculoActivo = await this.vehiculosServicio.buscarVehiculoActivoPorPlaca(placa);
    
    if (vehiculoActivo) {
      this.mostrarMensaje(
        `🚫 El vehículo ${placa} ya está en el estacionamiento (Espacio E-${String(vehiculoActivo.espacioNumero).padStart(2, '0')})`,
        'error'
      );
      return;
    }

    this.procesando = true;
    console.log('💾 Registrando vehículo:', { placa, propietario, tipo });

    try {
      const vehiculoId = await this.vehiculosServicio.registrarEntrada({
        placa,
        propietario,
        tipo
      });

      console.log('✅ Vehículo registrado con ID:', vehiculoId);
      
      // Esperar un momento para que Firebase actualice
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Obtener el vehículo recién registrado para mostrar el espacio asignado
      const vehiculosActuales = await this.vehiculosServicio.obtenerVehiculosDentroPromise();
      const vehiculoRegistrado = vehiculosActuales.find(v => v.id === vehiculoId);
      
      if (vehiculoRegistrado && vehiculoRegistrado.espacioNumero) {
        this.mostrarMensaje(
          `✅ Vehículo ${placa} registrado en espacio E-${String(vehiculoRegistrado.espacioNumero).padStart(2, '0')}`,
          'success'
        );
        
        // Resaltar el espacio asignado brevemente
        this.resaltarEspacio(vehiculoRegistrado.espacioNumero);
      } else {
        this.mostrarMensaje(`✅ Vehículo ${placa} registrado correctamente`, 'success');
      }

      // Limpiar formulario
      form.reset();
      
    } catch (error: any) {
      console.error('❌ Error al registrar vehículo:', error);
      
      let mensajeError = 'Error al registrar el vehículo';
      
      if (error.message) {
        mensajeError = error.message;
      }
      
      this.mostrarMensaje(mensajeError, 'error');
    } finally {
      this.procesando = false;
    }
  }

  /**
   * ✅ MEJORADO: Registra la salida de un vehículo
   */
  async finalizarVehiculo(vehiculo: VehiculoExtendido): Promise<void> {
    if (!vehiculo.id) {
      console.error('❌ Vehículo sin ID');
      this.mostrarMensaje('Error: Vehículo sin identificador', 'error');
      return;
    }

    const duracionActual = this.calcularDuracion(vehiculo.horaEntrada, new Date());
    const costoActual = this.vehiculosServicio.calcularCosto(vehiculo.horaEntrada, new Date());

    const confirmar = window.confirm(
      `¿Registrar salida del vehículo ${vehiculo.placa}?\n\n` +
      `Espacio: E-${String(vehiculo.espacioNumero).padStart(2, '0')}\n` +
      `Propietario: ${vehiculo.propietario}\n` +
      `Duración: ${duracionActual}\n` +
      `Costo: S/. ${costoActual.toFixed(2)}`
    );

    if (!confirmar) return;

    this.procesando = true;
    console.log('🚀 Registrando salida del vehículo:', vehiculo.placa);

    try {
      await this.vehiculosServicio.registrarSalida(vehiculo.id);
      
      const horaSalida = new Date();
      const duracion = this.calcularDuracion(vehiculo.horaEntrada, horaSalida);
      const costo = this.vehiculosServicio.calcularCosto(vehiculo.horaEntrada, horaSalida);
      
      console.log('✅ Salida registrada exitosamente');
      
      // Mostrar resumen
      alert(
        `✅ SALIDA REGISTRADA\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🚗 Placa: ${vehiculo.placa}\n` +
        `👤 Propietario: ${vehiculo.propietario}\n` +
        `⏱️ Duración: ${duracion}\n` +
        `💰 Costo total: S/. ${costo.toFixed(2)}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      );
      
      this.mostrarMensaje(
        `✅ Salida registrada: ${vehiculo.placa} - S/. ${costo.toFixed(2)}`,
        'success'
      );
      
    } catch (error: any) {
      console.error('❌ Error al registrar salida:', error);
      this.mostrarMensaje(
        error.message || 'Error al registrar la salida del vehículo',
        'error'
      );
    } finally {
      this.procesando = false;
    }
  }

  /**
   * ✅ Muestra detalles de un espacio al hacer clic
   */
  mostrarDetallesEspacio(espacio: EspacioUI): void {
    if (!espacio.ocupado || !espacio.vehiculo) {
      console.log('ℹ️ Espacio libre:', espacio.numero);
      return;
    }

    const v = espacio.vehiculo;
    const tiempoActual = this.calcularTiempoTranscurrido(v.horaEntrada);
    const costoActual = this.vehiculosServicio.calcularCosto(v.horaEntrada, new Date());
    
    const mensaje = `
🅿️ ESPACIO E-${String(espacio.numero).padStart(2, '0')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚗 Placa: ${v.placa}
👤 Propietario: ${v.propietario}
🚙 Tipo: ${v.tipo}
🕐 Entrada: ${this.formatearFecha(v.horaEntrada)}
⏱️ Tiempo: ${tiempoActual}
💰 Costo actual: S/. ${costoActual.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    alert(mensaje);
  }

  /**
   * ✅ NUEVO: Resalta visualmente un espacio
   */
  resaltarEspacio(numeroEspacio: number): void {
    // Scroll suave hacia el espacio
    setTimeout(() => {
      const espacioElement = document.querySelector(
        `.space-card:nth-child(${numeroEspacio})`
      ) as HTMLElement;
      
      if (espacioElement) {
        espacioElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Efecto de resaltado
        espacioElement.style.transform = 'scale(1.15)';
        espacioElement.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.8)';
        
        setTimeout(() => {
          espacioElement.style.transform = '';
          espacioElement.style.boxShadow = '';
        }, 2000);
      }
    }, 500);
  }

  /**
   * ✅ Calcula la duración entre dos fechas
   */
  calcularDuracion(entrada: Date, salida: Date): string {
    const milisegundos = salida.getTime() - entrada.getTime();
    
    if (milisegundos < 0 || isNaN(milisegundos)) return '0s';

    const segundos = Math.floor(milisegundos / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) {
      const h = horas % 24;
      const m = minutos % 60;
      return `${dias}d ${h}h ${m}m`;
    }
    
    if (horas > 0) {
      const m = minutos % 60;
      return `${horas}h ${m}m`;
    }
    
    if (minutos > 0) {
      return `${minutos}m`;
    }
    
    return `${segundos}s`;
  }

  /**
   * ✅ Calcula el tiempo transcurrido desde la entrada
   */
  calcularTiempoTranscurrido(entrada: Date): string {
    return this.calcularDuracion(entrada, new Date());
  }

  /**
   * ✅ Actualiza las estadísticas basadas en los vehículos actuales
   */
  actualizarEstadisticas(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Vehículos de hoy
    this.vehiculosHoy = this.vehiculos.filter(v => {
      const fecha = new Date(v.horaEntrada);
      fecha.setHours(0, 0, 0, 0);
      return fecha.getTime() === hoy.getTime();
    }).length;

    // Vehículos activos
    this.vehiculosActivos = this.vehiculos.filter(
      v => v.estado === EstadoVehiculo.DENTRO
    ).length;

    // Calcular tiempo promedio de los que ya salieron hoy
    const finalizadosHoy = this.vehiculos.filter(v => {
      if (!v.horaSalida) return false;
      const fecha = new Date(v.horaEntrada);
      fecha.setHours(0, 0, 0, 0);
      return fecha.getTime() === hoy.getTime();
    });

    if (finalizadosHoy.length > 0) {
      const duracionesMinutos = finalizadosHoy.map(v => {
        if (!v.horaSalida) return 0;
        const diff = v.horaSalida.getTime() - v.horaEntrada.getTime();
        return Math.floor(diff / 60000);
      });

      const promedioMinutos = Math.floor(
        duracionesMinutos.reduce((a, b) => a + b, 0) / duracionesMinutos.length
      );

      const horas = Math.floor(promedioMinutos / 60);
      const minutos = promedioMinutos % 60;

      this.tiempoPromedio = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
    } else {
      this.tiempoPromedio = '-';
    }

    console.log('📊 Estadísticas actualizadas:', {
      hoy: this.vehiculosHoy,
      activos: this.vehiculosActivos,
      promedio: this.tiempoPromedio
    });
  }

  /**
   * ✅ Formatea una fecha para mostrar
   */
  formatearFecha(fecha: Date | string): string {
    if (!fecha) return '-';
    
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * ✅ Muestra un mensaje temporal
   */
  mostrarMensaje(texto: string, tipo: 'success' | 'error'): void {
    const mensajeDiv = document.getElementById('mensaje');
    if (mensajeDiv) {
      mensajeDiv.textContent = texto;
      mensajeDiv.className = `mensaje ${tipo === 'success' ? 'exito' : 'error'}`;
      mensajeDiv.style.display = 'block';

      setTimeout(() => {
        mensajeDiv.style.display = 'none';
      }, 6000);
    }

    // También mostrar en consola
    if (tipo === 'success') {
      console.log('✅', texto);
    } else {
      console.error('❌', texto);
    }
  }

  /**
   * ✅ Obtiene la clase CSS para un espacio
   */
  obtenerClaseEspacio(espacio: EspacioUI): string {
    return espacio.ocupado ? 'space-card ocupado' : 'space-card libre';
  }

  /**
   * ✅ Obtiene el texto para mostrar en un espacio
   */
  obtenerTextoEspacio(espacio: EspacioUI): string {
    return espacio.ocupado ? 'OCUPADO' : 'LIBRE';
  }
}