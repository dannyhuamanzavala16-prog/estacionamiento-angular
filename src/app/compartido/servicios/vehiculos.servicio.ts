import { Injectable, inject, NgZone } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  onSnapshot,
  Unsubscribe
} from '@angular/fire/firestore';
import { Vehiculo, TipoVehiculo, EstadoVehiculo } from '../modelos/vehiculo.modelo';
import { Observable } from 'rxjs';
import { EspaciosServicio } from './espacios.servicio';

@Injectable({
  providedIn: 'root'
})
export class VehiculosServicio {
  private firestore = inject(Firestore);
  private espaciosServicio = inject(EspaciosServicio);
  private ngZone = inject(NgZone);
  private coleccion = collection(this.firestore, 'vehiculos');

  /**
   * Obtiene TODOS los vehículos en tiempo real (para historial)
   * SOLUCIÓN DEFINITIVA: Ejecuta onSnapshot dentro de NgZone
   */
  obtenerVehiculos(): Observable<Vehiculo[]> {
    console.log('🔍 Consultando vehículos en Firestore...');
    
    return new Observable(observer => {
      const q = query(
        this.coleccion,
        orderBy('horaEntrada', 'desc')
      );

      let unsubscribe: Unsubscribe;

      // Ejecutar dentro de NgZone para evitar el warning
      this.ngZone.runOutsideAngular(() => {
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            console.log('📦 Snapshot recibido, documentos:', snapshot.size);
            const vehiculos = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                horaEntrada: data['horaEntrada']?.toDate() || new Date(),
                horaSalida: data['horaSalida']?.toDate()
              } as Vehiculo;
            });
            console.log('✅ Vehículos procesados:', vehiculos.length);
            
            // Volver a entrar en la zona de Angular para actualizar la UI
            this.ngZone.run(() => {
              observer.next(vehiculos);
            });
          },
          (error) => {
            console.error('❌ Error en snapshot:', error);
            this.ngZone.run(() => {
              observer.error(error);
            });
          }
        );
      });

      // Cleanup cuando se desuscribe
      return () => {
        console.log('🔌 Desuscribiendo de vehículos');
        if (unsubscribe) {
          unsubscribe();
        }
      };
    });
  }

  /**
   * Registra la entrada de un vehículo y asigna un espacio
   */
  async registrarEntrada(vehiculo: Omit<Vehiculo, 'id' | 'estado' | 'horaEntrada' | 'espacioNumero'>): Promise<string> {
    try {
      // Buscar espacio libre del tipo adecuado
      const espaciosLibres = await this.espaciosServicio.obtenerEspaciosLibres(vehiculo.tipo);
      
      if (espaciosLibres.length === 0) {
        throw new Error(`No hay espacios disponibles para vehículo tipo ${vehiculo.tipo}`);
      }

      const espacioAsignado = espaciosLibres[0];

      const nuevoVehiculo = {
        ...vehiculo,
        placa: vehiculo.placa.toUpperCase(),
        horaEntrada: Timestamp.fromDate(new Date()),
        estado: EstadoVehiculo.DENTRO,
        espacioNumero: espacioAsignado.numero
      };

      const docRef = await addDoc(this.coleccion, nuevoVehiculo);
      
      // Marcar el espacio como ocupado
      await this.espaciosServicio.ocuparEspacio(espacioAsignado.numero, docRef.id);

      console.log(`✅ Vehículo ${vehiculo.placa} registrado en espacio ${espacioAsignado.numero}`);
      return docRef.id;
    } catch (error) {
      console.error('Error al registrar entrada:', error);
      throw error;
    }
  }

  /**
   * Registra la salida de un vehículo y libera el espacio
   */
  async registrarSalida(vehiculoId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, `vehiculos/${vehiculoId}`);
      
      // Obtener información del vehículo antes de actualizar
      const vehiculoData = await getDocs(query(this.coleccion, where('__name__', '==', vehiculoId)));
      
      if (!vehiculoData.empty) {
        const vehiculo = vehiculoData.docs[0].data() as Vehiculo;
        
        // Actualizar el vehículo
        await updateDoc(docRef, {
          horaSalida: Timestamp.fromDate(new Date()),
          estado: EstadoVehiculo.FUERA
        });

        // Liberar el espacio si estaba asignado
        if (vehiculo.espacioNumero) {
          await this.espaciosServicio.liberarEspacio(vehiculo.espacioNumero);
          console.log(`✅ Espacio ${vehiculo.espacioNumero} liberado`);
        }
      }
    } catch (error) {
      console.error('Error al registrar salida:', error);
      throw error;
    }
  }

  /**
   * Obtiene vehículos que están actualmente dentro en tiempo real
   */
  obtenerVehiculosDentro(): Observable<Vehiculo[]> {
    return new Observable(observer => {
      const q = query(
        this.coleccion,
        where('estado', '==', EstadoVehiculo.DENTRO),
        orderBy('horaEntrada', 'desc')
      );

      let unsubscribe: Unsubscribe;

      this.ngZone.runOutsideAngular(() => {
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const vehiculos = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                horaEntrada: data['horaEntrada']?.toDate() || new Date(),
                horaSalida: data['horaSalida']?.toDate()
              } as Vehiculo;
            });
            
            this.ngZone.run(() => {
              observer.next(vehiculos);
            });
          },
          (error) => {
            this.ngZone.run(() => {
              observer.error(error);
            });
          }
        );
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    });
  }

  /**
   * Obtiene vehículos que están dentro (versión promesa)
   */
  async obtenerVehiculosDentroPromise(): Promise<Vehiculo[]> {
    try {
      const q = query(
        this.coleccion,
        where('estado', '==', EstadoVehiculo.DENTRO),
        orderBy('horaEntrada', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          horaEntrada: data['horaEntrada']?.toDate() || new Date(),
          horaSalida: data['horaSalida']?.toDate()
        } as Vehiculo;
      });
    } catch (error) {
      console.error('Error al obtener vehículos:', error);
      return [];
    }
  }

  /**
   * Obtiene el historial completo de vehículos con filtros opcionales
   */
  async obtenerHistorial(fechaInicio?: Date, fechaFin?: Date, tipo?: TipoVehiculo): Promise<Vehiculo[]> {
    try {
      let q = query(this.coleccion, orderBy('horaEntrada', 'desc'));
      
      const snapshot = await getDocs(q);
      let vehiculos = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          horaEntrada: data['horaEntrada']?.toDate() || new Date(),
          horaSalida: data['horaSalida']?.toDate()
        } as Vehiculo;
      });

      // Filtrar por fecha y tipo en el cliente
      if (fechaInicio) {
        vehiculos = vehiculos.filter(v => v.horaEntrada >= fechaInicio);
      }
      if (fechaFin) {
        const fechaFinAjustada = new Date(fechaFin);
        fechaFinAjustada.setHours(23, 59, 59, 999);
        vehiculos = vehiculos.filter(v => v.horaEntrada <= fechaFinAjustada);
      }
      if (tipo) {
        vehiculos = vehiculos.filter(v => v.tipo === tipo);
      }

      return vehiculos;
    } catch (error) {
      console.error('Error al obtener historial:', error);
      return [];
    }
  }

  /**
   * Busca vehículos por placa (historial completo)
   */
  async buscarPorPlaca(placa: string): Promise<Vehiculo[]> {
    try {
      const placaUpper = placa.toUpperCase().trim();
      
      const q = query(
        this.coleccion,
        where('placa', '==', placaUpper),
        orderBy('horaEntrada', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          horaEntrada: data['horaEntrada']?.toDate() || new Date(),
          horaSalida: data['horaSalida']?.toDate()
        } as Vehiculo;
      });
    } catch (error) {
      console.error('Error al buscar por placa:', error);
      return [];
    }
  }

  /**
   * Busca un vehículo activo por placa (que está dentro)
   */
  async buscarVehiculoActivoPorPlaca(placa: string): Promise<Vehiculo | null> {
    try {
      const placaUpper = placa.toUpperCase().trim();
      
      const q = query(
        this.coleccion,
        where('placa', '==', placaUpper),
        where('estado', '==', EstadoVehiculo.DENTRO)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return {
          id: snapshot.docs[0].id,
          ...data,
          horaEntrada: data['horaEntrada']?.toDate() || new Date(),
          horaSalida: data['horaSalida']?.toDate()
        } as Vehiculo;
      }
      
      return null;
    } catch (error) {
      console.error('Error al buscar vehículo activo:', error);
      return null;
    }
  }

  /**
   * Genera estadísticas de uso del estacionamiento
   */
  async obtenerEstadisticas(fechaInicio: Date, fechaFin: Date) {
    const vehiculos = await this.obtenerHistorial(fechaInicio, fechaFin);
    
    const totalVehiculos = vehiculos.length;
    
    // Contar por tipo
    const porTipo = vehiculos.reduce((acc, v) => {
      const tipo = v.tipo as string;
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcular duración promedio (solo para vehículos que ya salieron)
    const duracionesEnMinutos = vehiculos
      .filter(v => v.horaSalida)
      .map(v => (v.horaSalida!.getTime() - v.horaEntrada.getTime()) / 60000);
    
    const duracionPromedio = duracionesEnMinutos.length > 0
      ? duracionesEnMinutos.reduce((a, b) => a + b, 0) / duracionesEnMinutos.length
      : 0;

    // Contar vehículos por día
    const porDia = vehiculos.reduce((acc, v) => {
      const fecha = v.horaEntrada.toLocaleDateString('es-PE');
      acc[fecha] = (acc[fecha] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcular pico de ocupación
    const ocupacionPorHora = vehiculos.reduce((acc, v) => {
      const hora = v.horaEntrada.getHours();
      acc[hora] = (acc[hora] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const horaPico = Object.entries(ocupacionPorHora).reduce((max, [hora, cantidad]) => 
      cantidad > max.cantidad ? { hora: parseInt(hora), cantidad } : max,
      { hora: 0, cantidad: 0 }
    );

    return {
      totalVehiculos,
      porTipo,
      duracionPromedioMinutos: Math.round(duracionPromedio),
      duracionPromedioHoras: (duracionPromedio / 60).toFixed(2),
      porDia,
      horaPico,
      vehiculosDentro: vehiculos.filter(v => v.estado === EstadoVehiculo.DENTRO).length,
      vehiculosFuera: vehiculos.filter(v => v.estado === EstadoVehiculo.FUERA).length
    };
  }

  /**
   * Calcula el costo de estacionamiento
   */
  calcularCosto(horaEntrada: Date, horaSalida: Date): number {
    const milisegundos = horaSalida.getTime() - horaEntrada.getTime();
    const horas = Math.ceil(milisegundos / (1000 * 60 * 60));
    
    const TARIFA_PRIMERA_HORA = 5;
    const TARIFA_HORA_ADICIONAL = 3;
    const TARIFA_DIARIA = 25;
    
    if (horas <= 0) return 0;
    
    // Si son más de 8 horas, aplicar tarifa diaria
    if (horas >= 9) {
      const dias = Math.ceil(horas / 24);
      return dias * TARIFA_DIARIA;
    }
    
    // Calcular por horas
    if (horas === 1) return TARIFA_PRIMERA_HORA;
    
    return TARIFA_PRIMERA_HORA + (horas - 1) * TARIFA_HORA_ADICIONAL;
  }
}