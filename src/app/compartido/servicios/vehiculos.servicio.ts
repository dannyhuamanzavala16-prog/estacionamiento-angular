import { Injectable, inject } from '@angular/core';
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
  Unsubscribe,
  getDoc
} from '@angular/fire/firestore';
import { Vehiculo, TipoVehiculo, EstadoVehiculo } from '../modelos/vehiculo.modelo';
import { Observable } from 'rxjs';
import { EspaciosServicio } from './espacios.servicio';

@Injectable({
  providedIn: 'root'
})
export class VehiculosServicio {
  private firestore = inject(Firestore);
  private espaciosServicio!: EspaciosServicio;
  private coleccion = collection(this.firestore, 'vehiculos');

  /**
   * Inyección manual de EspaciosServicio para evitar dependencia circular
   */
  setEspaciosServicio(servicio: EspaciosServicio): void {
    this.espaciosServicio = servicio;
  }

  /**
   * ✅ SOLUCIÓN: Obtiene TODOS los vehículos ordenados por fecha de entrada
   * SIN orderBy para evitar problemas de índice compuesto
   */
  obtenerVehiculos(): Observable<Vehiculo[]> {
    console.log('🔍 Iniciando listener de vehículos...');
    
    return new Observable(observer => {
      // Query simple sin orderBy para evitar índice compuesto
      const q = query(this.coleccion);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('📦 Snapshot recibido:', snapshot.size, 'documentos');
          
          const vehiculos = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              placa: data['placa'],
              propietario: data['propietario'],
              tipo: data['tipo'],
              estado: data['estado'],
              espacioNumero: data['espacioNumero'],
              horaEntrada: data['horaEntrada']?.toDate() || new Date(),
              horaSalida: data['horaSalida']?.toDate() || null
            } as Vehiculo;
          });

          // Ordenar en el cliente por fecha más reciente
          vehiculos.sort((a, b) => b.horaEntrada.getTime() - a.horaEntrada.getTime());
          
          console.log('✅ Vehículos procesados:', vehiculos.length);
          observer.next(vehiculos);
        },
        (error) => {
          console.error('❌ Error en snapshot de vehículos:', error);
          observer.error(error);
        }
      );

      return () => {
        console.log('🔌 Desuscribiendo de vehículos');
        unsubscribe();
      };
    });
  }

  /**
   * ✅ MEJORADO: Registra la entrada con manejo robusto de errores
   */
  async registrarEntrada(vehiculo: Omit<Vehiculo, 'id' | 'estado' | 'horaEntrada' | 'espacioNumero'>): Promise<string> {
    try {
      console.log('🚗 Iniciando registro de entrada para:', vehiculo.placa);

      // Verificar que EspaciosServicio esté disponible
      if (!this.espaciosServicio) {
        throw new Error('Servicio de espacios no disponible');
      }

      // Buscar espacio libre del tipo adecuado
      const espaciosLibres = await this.espaciosServicio.obtenerEspaciosLibres(vehiculo.tipo);
      
      if (espaciosLibres.length === 0) {
        throw new Error(`No hay espacios disponibles para vehículo tipo ${vehiculo.tipo}`);
      }

      const espacioAsignado = espaciosLibres[0];
      console.log('📍 Espacio asignado:', espacioAsignado.numero);

      // Crear el documento del vehículo
      const nuevoVehiculo = {
        placa: vehiculo.placa.toUpperCase(),
        propietario: vehiculo.propietario,
        tipo: vehiculo.tipo,
        horaEntrada: Timestamp.now(),
        estado: EstadoVehiculo.DENTRO,
        espacioNumero: espacioAsignado.numero
      };

      // Guardar en Firestore
      const docRef = await addDoc(this.coleccion, nuevoVehiculo);
      console.log('💾 Vehículo guardado con ID:', docRef.id);
      
      // Marcar el espacio como ocupado
      await this.espaciosServicio.ocuparEspacio(espacioAsignado.numero, docRef.id);
      console.log('✅ Espacio marcado como ocupado');

      return docRef.id;
    } catch (error) {
      console.error('❌ Error al registrar entrada:', error);
      throw error;
    }
  }

  /**
   * ✅ CORREGIDO: Registra la salida con validación mejorada
   */
  async registrarSalida(vehiculoId: string): Promise<void> {
    try {
      console.log('🚀 Iniciando registro de salida para ID:', vehiculoId);

      const docRef = doc(this.firestore, `vehiculos/${vehiculoId}`);
      
      // Obtener datos del vehículo primero
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Vehículo no encontrado');
      }

      const vehiculoData = docSnap.data() as Vehiculo;
      console.log('📋 Datos del vehículo:', vehiculoData);

      // Actualizar el documento
      await updateDoc(docRef, {
        horaSalida: Timestamp.now(),
        estado: EstadoVehiculo.FUERA
      });
      console.log('💾 Documento actualizado');

      // Liberar el espacio
      if (vehiculoData.espacioNumero) {
        await this.espaciosServicio.liberarEspacio(vehiculoData.espacioNumero);
        console.log('✅ Espacio liberado:', vehiculoData.espacioNumero);
      }

    } catch (error) {
      console.error('❌ Error al registrar salida:', error);
      throw error;
    }
  }

  /**
   * ✅ Obtiene vehículos que están actualmente dentro
   */
  obtenerVehiculosDentro(): Observable<Vehiculo[]> {
    return new Observable(observer => {
      const q = query(
        this.coleccion,
        where('estado', '==', EstadoVehiculo.DENTRO)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const vehiculos = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              placa: data['placa'],
              propietario: data['propietario'],
              tipo: data['tipo'],
              estado: data['estado'],
              espacioNumero: data['espacioNumero'],
              horaEntrada: data['horaEntrada']?.toDate() || new Date(),
              horaSalida: data['horaSalida']?.toDate() || null
            } as Vehiculo;
          });

          // Ordenar por hora de entrada descendente
          vehiculos.sort((a, b) => b.horaEntrada.getTime() - a.horaEntrada.getTime());
          
          observer.next(vehiculos);
        },
        (error) => observer.error(error)
      );

      return () => unsubscribe();
    });
  }

  /**
   * ✅ Versión Promise para obtener vehículos dentro
   */
  async obtenerVehiculosDentroPromise(): Promise<Vehiculo[]> {
    try {
      const q = query(
        this.coleccion,
        where('estado', '==', EstadoVehiculo.DENTRO)
      );
      
      const snapshot = await getDocs(q);
      const vehiculos = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          placa: data['placa'],
          propietario: data['propietario'],
          tipo: data['tipo'],
          estado: data['estado'],
          espacioNumero: data['espacioNumero'],
          horaEntrada: data['horaEntrada']?.toDate() || new Date(),
          horaSalida: data['horaSalida']?.toDate() || null
        } as Vehiculo;
      });

      vehiculos.sort((a, b) => b.horaEntrada.getTime() - a.horaEntrada.getTime());
      return vehiculos;
    } catch (error) {
      console.error('Error al obtener vehículos:', error);
      return [];
    }
  }

  /**
   * ✅ Busca un vehículo activo por placa
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
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          placa: data['placa'],
          propietario: data['propietario'],
          tipo: data['tipo'],
          estado: data['estado'],
          espacioNumero: data['espacioNumero'],
          horaEntrada: data['horaEntrada']?.toDate() || new Date(),
          horaSalida: data['horaSalida']?.toDate() || null
        } as Vehiculo;
      }
      
      return null;
    } catch (error) {
      console.error('Error al buscar vehículo activo:', error);
      return null;
    }
  }

  /**
   * ✅ Busca vehículos por placa (historial completo)
   */
  async buscarPorPlaca(placa: string): Promise<Vehiculo[]> {
    try {
      const placaUpper = placa.toUpperCase().trim();
      
      const q = query(
        this.coleccion,
        where('placa', '==', placaUpper)
      );
      
      const snapshot = await getDocs(q);
      const vehiculos = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          placa: data['placa'],
          propietario: data['propietario'],
          tipo: data['tipo'],
          estado: data['estado'],
          espacioNumero: data['espacioNumero'],
          horaEntrada: data['horaEntrada']?.toDate() || new Date(),
          horaSalida: data['horaSalida']?.toDate() || null
        } as Vehiculo;
      });

      vehiculos.sort((a, b) => b.horaEntrada.getTime() - a.horaEntrada.getTime());
      return vehiculos;
    } catch (error) {
      console.error('Error al buscar por placa:', error);
      return [];
    }
  }

  /**
   * ✅ Calcula el costo de estacionamiento
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