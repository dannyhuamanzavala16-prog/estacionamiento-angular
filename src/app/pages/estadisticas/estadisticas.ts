import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Vehiculo {
  espacio?: number;
  placa: string;
  propietario: string;
  tipo: string;
  horaEntrada: Date;
  horaSalida?: Date;
}

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
  imports: [CommonModule],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.css']
})
export class Estadisticas implements OnInit {
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

  ngOnInit(): void {
    this.cargarVehiculos();
    this.calcularEstadisticasGenerales();
    this.calcularPorDiaSemana();
    this.calcularPorMes();
    this.calcularPorAnio();
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

  calcularEstadisticasGenerales(): void {
    this.totalVehiculos = this.vehiculos.length;

    // Vehículos hoy
    const hoy = new Date().toDateString();
    this.vehiculosHoy = this.vehiculos.filter(v => 
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
      this.promedioTiempo = horas > 0 ? `${horas}h ${minutos}m` : `${minutos}m`;
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
      const dia = v.horaEntrada.getDay();
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
      const mes = v.horaEntrada.getMonth();
      this.vehiculosPorMes[mes].total++;
      this.vehiculosPorMes[mes].tipos[v.tipo] = (this.vehiculosPorMes[mes].tipos[v.tipo] || 0) + 1;
      
      if (v.horaSalida) {
        const tiempo = (v.horaSalida.getTime() - v.horaEntrada.getTime()) / 60000;
        this.vehiculosPorMes[mes].tiempos.push(tiempo);
      }
    });

    this.maxMes = Math.max(...this.vehiculosPorMes.map(m => m.total), 1);

    // Datos para tabla
    this.datosTablaMeses = this.vehiculosPorMes
      .map((data, index) => {
        if (data.total === 0) return null;
        
        const tipoMasComun = Object.entries(data.tipos)
          .sort((a, b) => b[1] - a[1])[0];
        
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
      const anio = v.horaEntrada.getFullYear().toString();
      if (!this.vehiculosPorAnio[anio]) {
        this.vehiculosPorAnio[anio] = {
          total: 0,
          meses: Array(12).fill(0),
          tiempos: []
        };
      }
      
      this.vehiculosPorAnio[anio].total++;
      const mes = v.horaEntrada.getMonth();
      this.vehiculosPorAnio[anio].meses[mes]++;
      
      if (v.horaSalida) {
        const tiempo = (v.horaSalida.getTime() - v.horaEntrada.getTime()) / 60000;
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
}