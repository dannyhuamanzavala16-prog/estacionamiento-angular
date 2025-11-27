import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Vehiculo {
  espacio: number;
  placa: string;
  propietario: string;
  tipo: string;
  horaEntrada: string;
  horaSalida?: string;
  duracion?: string;
  estado: 'activo' | 'finalizado';
}

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos.html',
  styleUrls: ['./vehiculos.css'],
})
export class Vehiculos implements OnInit {

  vehiculos: Vehiculo[] = [];
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

    // Cargar vehículos
    this.cargarVehiculos();
    this.actualizarEstadisticas();
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

    const placa = placaInput?.value || '';
    const propietario = propietarioInput?.value || '';
    const tipo = tipoSelect?.value || '';

    console.log('📋 Datos del formulario:', { placa, propietario, tipo });

    if (!placa || !propietario || !tipo) {
      console.log('❌ Campos incompletos');
      this.mostrarMensaje('Todos los campos son obligatorios', 'error');
      return;
    }

    const espacioLibre = this.buscarEspacioLibre();
    console.log('🅿️ Espacio asignado:', espacioLibre);

    if (espacioLibre === -1) {
      console.log('❌ No hay espacios disponibles');
      this.mostrarMensaje('No hay espacios disponibles', 'error');
      return;
    }

    const nuevoVehiculo: Vehiculo = {
      espacio: espacioLibre,
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
    
    form.reset();
    this.mostrarMensaje('Vehículo registrado exitosamente', 'success');
    console.log('✅ Registro completado');
  }

  finalizarVehiculo(vehiculo: Vehiculo): void {
    console.log('🏁 Finalizando vehículo:', vehiculo.placa);
    
    vehiculo.horaSalida = new Date().toISOString();
    vehiculo.duracion = this.calcularDuracion(
      new Date(vehiculo.horaEntrada), 
      new Date(vehiculo.horaSalida)
    );
    vehiculo.estado = 'finalizado';
    
    this.guardarVehiculos();
    this.actualizarEstadisticas();
    console.log('✅ Vehículo finalizado');
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
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const min = minutos % 60;
    return `${horas}h ${min}m`;
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

    const duraciones = this.vehiculos
      .filter(v => v.duracion)
      .map(v => {
        const match = v.duracion!.match(/(\d+)h (\d+)m/);
        if (match) {
          return parseInt(match[1]) * 60 + parseInt(match[2]);
        }
        return 0;
      });
    
    const promedioMin = duraciones.length ? 
      Math.floor(duraciones.reduce((a,b)=>a+b,0)/duraciones.length) : 0;
    const promHoras = Math.floor(promedioMin / 60);
    const promMin = promedioMin % 60;
    this.tiempoPromedio = duraciones.length ? `${promHoras}h ${promMin}m` : '-';

    this.porcentajeOcupacion = Math.round((this.vehiculosActivos / this.totalEspacios) * 100);
    
    console.log('📊 Estadísticas:', {
      hoy: this.vehiculosHoy,
      activos: this.vehiculosActivos,
      libres: this.espaciosLibres,
      ocupados: this.espaciosOcupados
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
      console.log('🔄 Navegando a /inicio...');
      
      this.router.navigate(['/inicio'], { replaceUrl: true }).then(
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
      mensajeDiv.className = `mensaje ${tipo}`;
      mensajeDiv.style.display = 'block';

      setTimeout(() => {
        mensajeDiv.style.display = 'none';
      }, 3000);
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-PE');
  }
}