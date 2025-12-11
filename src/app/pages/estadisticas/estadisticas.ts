import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { VehiculosServicio } from '../../compartido/servicios/vehiculos.servicio';
import { AutenticacionServicio } from '../../compartido/servicios/autenticacion.servicio';
import { Vehiculo } from '../../compartido/modelos/vehiculo.modelo';

interface TipoStats {
  tipo: string;
  cantidad: number;
}

interface MesData {
  total: number;
  tipos: { [key: string]: number };
  tiempos: number[];
}

interface AnioData {
  total: number;
  meses: number[];
  tiempos: number[];
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.css']
})
export class Estadisticas implements OnInit, OnDestroy {
  private vehiculosServicio = inject(VehiculosServicio);
  private authServicio = inject(AutenticacionServicio);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  vehiculos: Vehiculo[] = [];

  // Estadísticas generales
  totalVehiculos = 0;
  promedioTiempo = '-';
  vehiculosHoy = 0;
  vehiculosPorTipo: TipoStats[] = [];

  // Días de la semana
  diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  vehiculosPorDia: number[] = [];
  maxDia = 1;

  // Meses
  meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  nombresMesesCompletos = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  vehiculosPorMes: MesData[] = [];
  maxMes = 1;
  datosTablaMeses: any[] = [];

  // Años
  anios: string[] = [];
  vehiculosPorAnio: { [key: string]: AnioData } = {};
  maxAnio = 1;
  datosTablasAnios: any[] = [];

  // Estados
  cargando = true;
  usuarioAutenticado = false;

  ngOnInit(): void {
    console.log('📊 Estadísticas component cargado con Firebase');
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
   */
  private cargarVehiculosDesdeFirebase(): void {
    console.log('🔄 Cargando vehículos desde Firebase para estadísticas...');
    this.cargando = true;

    this.vehiculosServicio.obtenerVehiculos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehiculos: Vehiculo[]) => {
          console.log('✅ Vehículos recibidos:', vehiculos.length);
          this.vehiculos = vehiculos;
          this.cargando = false;
          
          // Calcular todas las estadísticas
          this.calcularEstadisticasGenerales();
          this.calcularPorDiaSemana();
          this.calcularPorMes();
          this.calcularPorAnio();
        },
        error: (err: any) => {
          console.error('❌ Error al cargar vehículos:', err);
          this.cargando = false;
        }
      });
  }

  calcularEstadisticasGenerales(): void {
    this.totalVehiculos = this.vehiculos.length;

    // Vehículos hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    this.vehiculosHoy = this.vehiculos.filter(v => {
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
      this.promedioTiempo = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
    } else {
      this.promedioTiempo = '-';
    }

    // Vehículos por tipo
    const tipos: { [key: string]: number } = {};
    this.vehiculos.forEach(v => {
      tipos[v.tipo] = (tipos[v.tipo] || 0) + 1;
    });

    this.vehiculosPorTipo = Object.entries(tipos)
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  calcularPorDiaSemana(): void {
    this.vehiculosPorDia = Array(7).fill(0);
    
    this.vehiculos.forEach(v => {
      const entrada = this.convertirADate(v.horaEntrada);
      const dia = entrada.getDay();
      this.vehiculosPorDia[dia]++;
    });

    this.maxDia = Math.max(...this.vehiculosPorDia, 1);
  }

  calcularPorMes(): void {
    this.vehiculosPorMes = Array(12).fill(0).map(() => ({
      total: 0,
      tipos: {},
      tiempos: []
    }));
    
    this.vehiculos.forEach(v => {
      const entrada = this.convertirADate(v.horaEntrada);
      const mes = entrada.getMonth();
      this.vehiculosPorMes[mes].total++;
      this.vehiculosPorMes[mes].tipos[v.tipo] = (this.vehiculosPorMes[mes].tipos[v.tipo] || 0) + 1;
      
      if (v.horaSalida) {
        const salida = this.convertirADate(v.horaSalida);
        const tiempo = (salida.getTime() - entrada.getTime()) / 60000;
        this.vehiculosPorMes[mes].tiempos.push(tiempo);
      }
    });

    this.maxMes = Math.max(...this.vehiculosPorMes.map(m => m.total), 1);

    // Datos para tabla
    this.datosTablaMeses = this.vehiculosPorMes
      .map((data, index) => {
        if (data.total === 0) return null;
        
        const tipoMasComun = Object.entries(data.tipos)
          .sort((a, b) => (b[1] as number) - (a[1] as number))[0];
        
        const promedioMes = data.tiempos.length > 0
          ? Math.floor(data.tiempos.reduce((a, b) => a + b, 0) / data.tiempos.length)
          : 0;
        
        const horas = Math.floor(promedioMes / 60);
        const mins = promedioMes % 60;
        const tiempoStr = horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
        
        return {
          mes: this.nombresMesesCompletos[index],
          total: data.total,
          tiempoPromedio: tiempoStr,
          tipoMasComun: tipoMasComun ? tipoMasComun[0] : '-'
        };
      })
      .filter(Boolean) as any[];
  }

  calcularPorAnio(): void {
    this.vehiculosPorAnio = {};
    
    this.vehiculos.forEach(v => {
      const entrada = this.convertirADate(v.horaEntrada);
      const anio = entrada.getFullYear().toString();
      
      if (!this.vehiculosPorAnio[anio]) {
        this.vehiculosPorAnio[anio] = {
          total: 0,
          meses: Array(12).fill(0),
          tiempos: []
        };
      }
      
      this.vehiculosPorAnio[anio].total++;
      const mes = entrada.getMonth();
      this.vehiculosPorAnio[anio].meses[mes]++;
      
      if (v.horaSalida) {
        const salida = this.convertirADate(v.horaSalida);
        const tiempo = (salida.getTime() - entrada.getTime()) / 60000;
        this.vehiculosPorAnio[anio].tiempos.push(tiempo);
      }
    });

    this.anios = Object.keys(this.vehiculosPorAnio).sort();
    this.maxAnio = Math.max(...Object.values(this.vehiculosPorAnio).map(a => a.total), 1);

    // Datos para tabla
    this.datosTablasAnios = this.anios.map(anio => {
      const data = this.vehiculosPorAnio[anio];
      
      const mesMaxIndex = data.meses.indexOf(Math.max(...data.meses));
      const mesMax = this.nombresMesesCompletos[mesMaxIndex];
      
      const promedioAnio = data.tiempos.length > 0
        ? Math.floor(data.tiempos.reduce((a, b) => a + b, 0) / data.tiempos.length)
        : 0;
      
      const horas = Math.floor(promedioAnio / 60);
      const mins = promedioAnio % 60;
      const tiempoStr = horas > 0 ? `${horas}h ${mins}m` : `${mins}m`;
      
      return {
        anio,
        total: data.total,
        tiempoPromedio: tiempoStr,
        mesMasActivo: mesMax
      };
    });
  }

  calcularAlturaBarra(valor: number, max: number): number {
    return (valor / max) * 100;
  }

  /**
   * Convierte un Timestamp de Firebase o Date a Date
   */
  private convertirADate(fecha: any): Date {
    if (!fecha) return new Date();
    if (fecha.toDate && typeof fecha.toDate === 'function') {
      return fecha.toDate();
    }
    if (fecha instanceof Date) {
      return fecha;
    }
    return new Date(fecha);
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