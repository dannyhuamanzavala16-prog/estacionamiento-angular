import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';
import { VehiculosServicio } from '../../compartido/servicios/vehiculos.servicio';
import { EspaciosServicio } from '../../compartido/servicios/espacios.servicio';
import { AutenticacionServicio } from '../../compartido/servicios/autenticacion.servicio';
import { Vehiculo, TipoVehiculo, EstadoVehiculo } from '../../compartido/modelos/vehiculo.modelo';
import { Modal, ModalConfig } from '../../compartido/componentes/modal/modal';

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
  imports: [CommonModule, FormsModule, Modal],
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

  // 🆕 MODALES
  modalOpen = false;
  modalConfig: ModalConfig = {
    title: '',
    type: 'info',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    showCancel: true
  };
  vehiculoParaSalida: VehiculoExtendido | null = null;

  // Tipos de vehículos
  tiposVehiculo = Object.values(TipoVehiculo);

  ngOnInit(): void {
    console.log('🚀 Componente Vehículos iniciado');

    if (!this.authServicio.estaAutenticado()) {
      console.log('❌ No autenticado, redirigiendo...');
      this.router.navigate(['/login']);
      return;
    }

    this.vehiculosServicio.setEspaciosServicio(this.espaciosServicio);
    this.inicializarEspaciosUI();
    this.cargarDatosEnTiempoReal();
    this.iniciarActualizacionDuraciones();
  }

  ngOnDestroy(): void {
    console.log('🔌 Destruyendo componente Vehículos');
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  cargarDatosEnTiempoReal(): void {
    console.log('📡 Iniciando suscripciones en tiempo real...');

    this.vehiculosServicio.obtenerVehiculos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehiculos) => {
          console.log('🚗 Vehículos recibidos:', vehiculos.length);

          this.vehiculos = vehiculos.map(v => {
            const vehiculoExtendido: VehiculoExtendido = { ...v };

            if (v.horaSalida && v.horaEntrada) {
              vehiculoExtendido.duracion = this.calcularDuracion(
                v.horaEntrada,
                v.horaSalida
              );
            } else if (v.estado === EstadoVehiculo.DENTRO) {
              vehiculoExtendido.duracion = this.calcularDuracion(
                v.horaEntrada,
                new Date()
              );
            }

            return vehiculoExtendido;
          });

          this.aplicarFiltro();
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

  iniciarActualizacionDuraciones(): void {
    interval(30000)
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

  aplicarFiltro(): void {
    if (this.filtroActual === 'activos') {
      this.vehiculosFiltrados = this.vehiculos.filter(
        v => v.estado === EstadoVehiculo.DENTRO
      );
    } else {
      this.vehiculosFiltrados = [...this.vehiculos];
    }
  }

  cambiarFiltro(filtro: 'todos' | 'activos'): void {
    this.filtroActual = filtro;
    this.aplicarFiltro();
    console.log('🔍 Filtro aplicado:', filtro, '- Mostrando:', this.vehiculosFiltrados.length);
  }

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
    const tipo = (tipoSelect?.value as TipoVehiculo) || '';

    if (!placa || !propietario || !tipo) {
      this.mostrarMensaje('⚠️ Todos los campos son obligatorios', 'error');
      return;
    }

    if (placa.length < 3) {
      this.mostrarMensaje('⚠️ La placa debe tener al menos 3 caracteres', 'error');
      return;
    }

    if (this.espaciosLibres === 0) {
      this.mostrarMensaje('🚫 No hay espacios disponibles', 'error');
      return;
    }

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

      await new Promise(resolve => setTimeout(resolve, 800));

      const vehiculosActuales = await this.vehiculosServicio.obtenerVehiculosDentroPromise();
      const vehiculoRegistrado = vehiculosActuales.find(v => v.id === vehiculoId);

      if (vehiculoRegistrado && vehiculoRegistrado.espacioNumero) {
        this.mostrarMensaje(
          `✅ Vehículo ${placa} registrado en espacio E-${String(vehiculoRegistrado.espacioNumero).padStart(2, '0')}`,
          'success'
        );

        this.resaltarEspacio(vehiculoRegistrado.espacioNumero);
      } else {
        this.mostrarMensaje(`✅ Vehículo ${placa} registrado correctamente`, 'success');
      }

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

  // 🆕 NUEVO: Abrir modal de confirmación de salida
  finalizarVehiculo(vehiculo: VehiculoExtendido): void {
    if (!vehiculo.id) {
      console.error('❌ Vehículo sin ID');
      this.mostrarMensaje('Error: Vehículo sin identificador', 'error');
      return;
    }

    const duracionActual = this.calcularDuracion(vehiculo.horaEntrada, new Date());
    const costoActual = this.vehiculosServicio.calcularCosto(vehiculo.horaEntrada, new Date());

    this.vehiculoParaSalida = vehiculo;

    this.modalConfig = {
      title: '¿Registrar Salida?',
      type: 'confirm',
      confirmText: 'Sí, Registrar Salida',
      cancelText: 'Cancelar',
      showCancel: true,
      data: {
        placa: vehiculo.placa,
        espacioNumero: vehiculo.espacioNumero,
        propietario: vehiculo.propietario,
        duracion: duracionActual,
        costo: costoActual.toFixed(2)
      }
    };

    this.modalOpen = true;
  }

  // 🆕 NUEVO: Confirmar salida desde el modal
  async confirmarSalida(): Promise<void> {
    if (!this.vehiculoParaSalida || !this.vehiculoParaSalida.id) {
      return;
    }

    this.modalOpen = false;
    this.procesando = true;

    const vehiculo = this.vehiculoParaSalida;
    console.log('🚀 Registrando salida del vehículo:', vehiculo.placa);

    try {
      await this.vehiculosServicio.registrarSalida(vehiculo.id!);

      const horaSalida = new Date();
      const duracion = this.calcularDuracion(vehiculo.horaEntrada, horaSalida);
      const costo = this.vehiculosServicio.calcularCosto(vehiculo.horaEntrada, horaSalida);

      console.log('✅ Salida registrada exitosamente');

      // Mostrar ticket de salida
      this.mostrarTicketSalida(vehiculo, duracion, costo);

    } catch (error: any) {
      console.error('❌ Error al registrar salida:', error);
      this.mostrarMensaje(
        error.message || 'Error al registrar la salida del vehículo',
        'error'
      );
    } finally {
      this.procesando = false;
      this.vehiculoParaSalida = null;
    }
  }

  // 🆕 NUEVO: Mostrar ticket de salida
  mostrarTicketSalida(vehiculo: VehiculoExtendido, duracion: string, costo: number): void {
    const fecha = new Date().toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    this.modalConfig = {
      title: 'Salida Registrada',
      type: 'success',
      confirmText: 'Cerrar',
      showCancel: false,
      data: {
        placa: vehiculo.placa,
        propietario: vehiculo.propietario,
        duracion: duracion,
        costo: costo.toFixed(2),
        fecha: fecha
      }
    };

    this.modalOpen = true;
  }

  // 🆕 NUEVO: Mostrar detalles de espacio en modal
  mostrarDetallesEspacio(espacio: EspacioUI): void {
    if (!espacio.ocupado || !espacio.vehiculo) {
      console.log('ℹ️ Espacio libre:', espacio.numero);
      return;
    }

    const v = espacio.vehiculo;
    const tiempoActual = this.calcularTiempoTranscurrido(v.horaEntrada);
    const costoActual = this.vehiculosServicio.calcularCosto(v.horaEntrada, new Date());

    this.modalConfig = {
      title: `Espacio E-${String(espacio.numero).padStart(2, '0')}`,
      type: 'detail',
      confirmText: 'Cerrar',
      showCancel: false,
      data: {
        espacioNumero: espacio.numero,
        placa: v.placa,
        propietario: v.propietario,
        tipo: v.tipo,
        horaEntrada: this.formatearFecha(v.horaEntrada),
        duracion: tiempoActual,
        costo: costoActual.toFixed(2)
      }
    };

    this.modalOpen = true;
  }

  // 🆕 NUEVO: Cerrar modal
  cerrarModal(): void {
    this.modalOpen = false;
    this.vehiculoParaSalida = null;
  }

  // 🆕 NUEVO: Cancelar acción del modal
  cancelarModal(): void {
    this.modalOpen = false;
    this.vehiculoParaSalida = null;
  }

  resaltarEspacio(numeroEspacio: number): void {
    setTimeout(() => {
      const espacioElement = document.querySelector(
        `.space-card:nth-child(${numeroEspacio})`
      ) as HTMLElement;

      if (espacioElement) {
        espacioElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        espacioElement.style.transform = 'scale(1.15)';
        espacioElement.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.8)';

        setTimeout(() => {
          espacioElement.style.transform = '';
          espacioElement.style.boxShadow = '';
        }, 2000);
      }
    }, 500);
  }

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

  calcularTiempoTranscurrido(entrada: Date): string {
    return this.calcularDuracion(entrada, new Date());
  }

  actualizarEstadisticas(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    this.vehiculosHoy = this.vehiculos.filter(v => {
      const fecha = new Date(v.horaEntrada);
      fecha.setHours(0, 0, 0, 0);
      return fecha.getTime() === hoy.getTime();
    }).length;

    this.vehiculosActivos = this.vehiculos.filter(
      v => v.estado === EstadoVehiculo.DENTRO
    ).length;

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

    if (tipo === 'success') {
      console.log('✅', texto);
    } else {
      console.error('❌', texto);
    }
  }

  obtenerClaseEspacio(espacio: EspacioUI): string {
    return espacio.ocupado ? 'space-card ocupado' : 'space-card libre';
  }

  obtenerTextoEspacio(espacio: EspacioUI): string {
    return espacio.ocupado ? 'OCUPADO' : 'LIBRE';
  }
}