import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FooterComponent } from '../../compartido/componentes/footer/footer';
import { AdminHeaderComponent } from '../../compartido/componentes/admin-header/admin-header';

interface Vehiculo {
  espacio: number;
  columna: number;
  placa: string;
  propietario: string;
  tipo: string;
  horaEntrada: string;
  horaSalida?: string;
  duracion?: string;
  estado: 'activo' | 'finalizado';
}

interface Espacio {
  numero: number;
  ocupado: boolean;
  placa?: string;
  vehiculo?: Vehiculo;
}

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeaderComponent, FooterComponent],
  templateUrl: './vehiculos.html',
  styleUrls: ['./vehiculos.css'],
})
export class Vehiculos implements OnInit {

  vehiculos: Vehiculo[] = [];
  espacios: Espacio[] = [];
  totalEspacios: number = 20;
  adminName: string = 'Admin';

  // Estadísticas
  espaciosLibres: number = 20;
  espaciosOcupados: number = 0;
  espaciosTotal: number = 20;
  vehiculosHoy: number = 0;
  vehiculosActivos: number = 0;
  tiempoPromedio: string = '-';
  porcentajeOcupacion: number = 0;

  constructor(private router: Router) { }

  ngOnInit(): void {
    console.log('🚀 Vehiculos component iniciado');
    
    // Verificar autenticación
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    console.log('🔐 Estado de login:', isLoggedIn);
    
    if (isLoggedIn !== 'true') {
      console.log('❌ No autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return;
    }

    // Obtener nombre de admin
    this.adminName = localStorage.getItem('adminUsername') || 'Admin';
    console.log('👤 Admin:', this.adminName);

    // Inicializar espacios
    this.inicializarEspacios();

    // Cargar vehículos
    this.cargarVehiculos();
    this.actualizarEstadisticas();
    this.actualizarGridEspacios();
  }

  inicializarEspacios(): void {
    this.espacios = [];
    for (let i = 1; i <= this.totalEspacios; i++) {
      this.espacios.push({
        numero: i,
        ocupado: false,
        placa: undefined,
        vehiculo: undefined
      });
    }
    console.log('✅ Espacios inicializados:', this.espacios.length);
  }

  actualizarGridEspacios(): void {
    // Resetear todos los espacios
    this.espacios.forEach(espacio => {
      espacio.ocupado = false;
      espacio.placa = undefined;
      espacio.vehiculo = undefined;
    });

    // Marcar espacios ocupados
    this.vehiculos.filter(v => v.estado === 'activo').forEach(vehiculo => {
      const espacio = this.espacios.find(e => e.numero === vehiculo.espacio);
      if (espacio) {
        espacio.ocupado = true;
        espacio.placa = vehiculo.placa;
        espacio.vehiculo = vehiculo;
      }
    });

    console.log('🔄 Grid de espacios actualizado');
  }

  cargarVehiculos(): void {
    const stored = localStorage.getItem('vehiculos');
    console.log('📦 Datos en localStorage:', stored);
    
    if (stored) {
      this.vehiculos = JSON.parse(stored);
      console.log('✅ Vehículos cargados:', this.vehiculos.length);
    } else {
      console.log('ℹ️ No hay vehículos en localStorage');
      this.vehiculos = [];
    }
  }

  guardarVehiculos(): void {
    localStorage.setItem('vehiculos', JSON.stringify(this.vehiculos));
    console.log('💾 Vehículos guardados:', this.vehiculos.length);
  }

  registrarVehiculo(event: Event): void {
    event.preventDefault();
    console.log('📝 Intentando registrar vehículo...');

    const form = event.target as HTMLFormElement;
    const placaInput = form.querySelector('#placa') as HTMLInputElement;
    const propietarioInput = form.querySelector('#propietario') as HTMLInputElement;
    const tipoSelect = form.querySelector('#tipo') as HTMLSelectElement;

    const placa = placaInput?.value.trim() || '';
    const propietario = propietarioInput?.value.trim() || '';
    const tipo = tipoSelect?.value || '';

    console.log('📋 Datos del formulario:', { placa, propietario, tipo });

    if (!placa || !propietario || !tipo) {
      console.log('❌ Campos incompletos');
      this.mostrarMensaje('⚠️ Todos los campos son obligatorios', 'error');
      return;
    }

    // Verificar si el vehículo ya está registrado
    const yaRegistrado = this.vehiculos.find(
      v => v.placa.toUpperCase() === placa.toUpperCase() && v.estado === 'activo'
    );

    if (yaRegistrado) {
      console.log('❌ Vehículo ya registrado');
      this.mostrarMensaje('🚫 Este vehículo ya está registrado en el estacionamiento', 'error');
      return;
    }

    const espacioLibre = this.buscarEspacioLibre();
    console.log('🅿️ Espacio asignado:', espacioLibre);

    if (espacioLibre === -1) {
      console.log('❌ No hay espacios disponibles');
      this.mostrarMensaje('🚫 No hay espacios disponibles', 'error');
      return;
    }

    // Calcular columna (4 columnas de 5 espacios cada una)
    const columna = Math.ceil(espacioLibre / 5);

    const nuevoVehiculo: Vehiculo = {
      espacio: espacioLibre,
      columna: columna,
      placa: placa.toUpperCase(),
      propietario,
      tipo,
      horaEntrada: new Date().toISOString(),
      estado: 'activo'
    };

    console.log('✅ Nuevo vehículo:', nuevoVehiculo);

    this.vehiculos.push(nuevoVehiculo);
    this.guardarVehiculos();
    this.actualizarEstadisticas();
    this.actualizarGridEspacios();
    
    form.reset();
    this.mostrarMensaje(`✅ Vehículo registrado en E-${String(espacioLibre).padStart(2, '0')} (Columna ${columna})`, 'success');
    console.log('✅ Registro completado');
  }

  finalizarVehiculo(vehiculo: Vehiculo): void {
    console.log('🏁 Finalizando vehículo:', vehiculo.placa);
    
    const confirmar = window.confirm(
      `¿Registrar salida del vehículo ${vehiculo.placa}?`
    );

    if (!confirmar) {
      return;
    }

    vehiculo.horaSalida = new Date().toISOString();
    vehiculo.duracion = this.calcularDuracion(
      new Date(vehiculo.horaEntrada), 
      new Date(vehiculo.horaSalida)
    );
    vehiculo.estado = 'finalizado';
    
    this.guardarVehiculos();
    this.actualizarEstadisticas();
    this.actualizarGridEspacios();
    
    this.mostrarMensaje(
      `🚗 Salida registrada para ${vehiculo.placa}. Duración: ${vehiculo.duracion}`, 
      'success'
    );
    
    console.log('✅ Vehículo finalizado');
  }

  mostrarDetallesEspacio(espacio: Espacio): void {
    if (!espacio.vehiculo) return;

    const v = espacio.vehiculo;
    const tiempoActual = this.calcularTiempoActual(new Date(v.horaEntrada));
    
    const mensaje = `📋 Detalles del Espacio E-${String(v.espacio).padStart(2, '0')}

🚗 Placa: ${v.placa}
👤 Propietario: ${v.propietario}
🚙 Tipo: ${v.tipo}
📍 Columna: ${v.columna}
🕐 Entrada: ${this.formatearFecha(v.horaEntrada)}
⏱️ Tiempo: ${tiempoActual}`;

    alert(mensaje);
  }

  buscarEspacioLibre(): number {
    for (let i = 1; i <= this.totalEspacios; i++) {
      const ocupado = this.vehiculos.find(v => v.espacio === i && v.estado === 'activo');
      if (!ocupado) {
        return i;
      }
    }
    return -1;
  }

  calcularDuracion(entrada: Date, salida: Date): string {
    const diff = salida.getTime() - entrada.getTime();
    const segundos = Math.floor(diff / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    const min = minutos % 60;
    const h = horas % 24;

    if (dias > 0) {
      return `${dias}d ${h}h ${min}m`;
    } else if (horas > 0) {
      return `${horas}h ${min}m`;
    } else if (minutos > 0) {
      return `${minutos}m`;
    } else {
      return `${segundos}s`;
    }
  }

  calcularTiempoActual(entrada: Date): string {
    const ahora = new Date();
    const duracion = this.calcularDuracion(entrada, ahora);
    return `⏱️ ${duracion}`;
  }

  actualizarEstadisticas(): void {
    console.log('📊 Actualizando estadísticas...');
    
    const hoy = new Date().toDateString();
    this.vehiculosHoy = this.vehiculos.filter(v => 
      new Date(v.horaEntrada).toDateString() === hoy
    ).length;
    
    this.vehiculosActivos = this.vehiculos.filter(v => v.estado === 'activo').length;

    this.espaciosOcupados = this.vehiculosActivos;
    this.espaciosLibres = this.totalEspacios - this.espaciosOcupados;
    this.espaciosTotal = this.totalEspacios;

    // Calcular tiempo promedio
    const finalizados = this.vehiculos.filter(v => v.duracion);
    
    if (finalizados.length > 0) {
      const duraciones = finalizados.map(v => {
        const match = v.duracion!.match(/(?:(\d+)d\s*)?(?:(\d+)h\s*)?(?:(\d+)m)?/);
        if (match) {
          const dias = parseInt(match[1] || '0');
          const horas = parseInt(match[2] || '0');
          const minutos = parseInt(match[3] || '0');
          return dias * 24 * 60 + horas * 60 + minutos;
        }
        return 0;
      });
      
      const promedioMin = Math.floor(
        duraciones.reduce((a, b) => a + b, 0) / duraciones.length
      );
      
      const promHoras = Math.floor(promedioMin / 60);
      const promMin = promedioMin % 60;
      
      this.tiempoPromedio = promHoras > 0 
        ? `${promHoras}h ${promMin}m` 
        : `${promMin}m`;
    } else {
      this.tiempoPromedio = '-';
    }

    this.porcentajeOcupacion = Math.round(
      (this.vehiculosActivos / this.totalEspacios) * 100
    );
    
    console.log('📊 Estadísticas:', {
      hoy: this.vehiculosHoy,
      activos: this.vehiculosActivos,
      libres: this.espaciosLibres,
      ocupados: this.espaciosOcupados,
      promedio: this.tiempoPromedio,
      ocupacion: this.porcentajeOcupacion + '%'
    });
  }

  cerrarSesion(): void {
    console.log('🚪 ===== CERRANDO SESIÓN =====');
    
    const confirmar = window.confirm('¿Estás seguro de que deseas cerrar sesión?');
    
    if (confirmar) {
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminUsername');
      localStorage.removeItem('loginTime');
      
      console.log('🧹 localStorage limpiado');
      console.log('🔄 Navegando a /login...');
      
      this.router.navigate(['/login'], { replaceUrl: true }).then(
        (success) => {
          console.log('✅ Navegación exitosa:', success);
        },
        (error) => {
          console.error('❌ Error en navegación:', error);
        }
      );
    }
  }

  irAInicio(): void {
    console.log('🏠 Navegando a inicio...');
    this.router.navigate(['/inicio']);
  }

  irAHistorial(): void {
    console.log('📋 Navegando a historial...');
    this.router.navigate(['/historial']);
  }

  irAEstadisticas(): void {
    console.log('📊 Navegando a estadísticas...');
    this.router.navigate(['/estadisticas']);
  }

  private mostrarMensaje(texto: string, tipo: 'success' | 'error'): void {
    console.log('📢 Mensaje:', tipo, '-', texto);
    const mensajeDiv = document.getElementById('mensaje');
    if (mensajeDiv) {
      mensajeDiv.textContent = texto;
      mensajeDiv.className = `mensaje ${tipo === 'success' ? 'exito' : 'error'}`;
      mensajeDiv.style.display = 'block';

      setTimeout(() => {
        mensajeDiv.style.display = 'none';
      }, 4000);
    }
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
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
}