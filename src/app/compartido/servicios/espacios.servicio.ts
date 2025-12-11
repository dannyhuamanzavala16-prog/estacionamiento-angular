import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query,
  where,
  onSnapshot,
  getDocs,
  Unsubscribe
} from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';
import { Espacio, EstadoEstacionamiento } from '../modelos/espacio.modelo';
import { Vehiculo, EstadoVehiculo } from '../modelos/vehiculo.modelo';

@Injectable({
  providedIn: 'root'
})
export class EspaciosServicio {
  private firestore = inject(Firestore);
  private coleccionEspacios = collection(this.firestore, 'espacios');
  private coleccionVehiculos = collection(this.firestore, 'vehiculos');

  constructor() {
    this.inicializarEspacios();
  }

  /**
   * ✅ Inicializa los espacios en Firestore si no existen
   */
  private async inicializarEspacios(): Promise<void> {
    try {
      const configDoc = await getDoc(doc(this.firestore, 'configuracion/espacios'));
      
      if (!configDoc.exists()) {
        console.log('🏗️ Inicializando espacios en Firestore...');
        const TOTAL_ESPACIOS = 20;
        
        for (let i = 1; i <= TOTAL_ESPACIOS; i++) {
          const espacio: Espacio = {
            numero: i,
            tipo: i <= 15 ? 'Auto' : 'Camioneta',
            ocupado: false
          };
          
          await setDoc(doc(this.firestore, `espacios/${i}`), espacio);
        }

        await setDoc(doc(this.firestore, 'configuracion/espacios'), {
          total: TOTAL_ESPACIOS,
          inicializado: true,
          fechaCreacion: new Date()
        });

        console.log('✅ Espacios inicializados correctamente');
      }
    } catch (error) {
      console.error('❌ Error al inicializar espacios:', error);
    }
  }

  /**
   * ✅ CORREGIDO: Obtiene todos los espacios con información de vehículos en tiempo real
   */
  obtenerEspaciosConVehiculos(): Observable<any[]> {
    const espacios$ = new Observable<Espacio[]>(observer => {
      const unsubscribe = onSnapshot(
        this.coleccionEspacios,
        (snapshot) => {
          const espacios = snapshot.docs.map(doc => ({
            id: doc.id,
            numero: doc.data()['numero'],
            tipo: doc.data()['tipo'],
            ocupado: doc.data()['ocupado'] || false,
            vehiculoId: doc.data()['vehiculoId']
          } as Espacio));
          
          observer.next(espacios);
        },
        (error) => {
          console.error('❌ Error en snapshot de espacios:', error);
          observer.error(error);
        }
      );
      
      return () => unsubscribe();
    });
    
    const vehiculosDentro$ = new Observable<Vehiculo[]>(observer => {
      const q = query(this.coleccionVehiculos, where('estado', '==', EstadoVehiculo.DENTRO));
      
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
          
          observer.next(vehiculos);
        },
        (error) => {
          console.error('❌ Error en snapshot de vehículos dentro:', error);
          observer.error(error);
        }
      );
      
      return () => unsubscribe();
    });

    return combineLatest([espacios$, vehiculosDentro$]).pipe(
      map(([espacios, vehiculos]) => {
        return espacios
          .sort((a, b) => a.numero - b.numero)
          .map(espacio => {
            const vehiculo = vehiculos.find(v => v.espacioNumero === espacio.numero);
            
            return {
              ...espacio,
              ocupado: !!vehiculo,
              vehiculo: vehiculo ? {
                id: vehiculo.id,
                placa: vehiculo.placa,
                propietario: vehiculo.propietario,
                tipo: vehiculo.tipo,
                horaEntrada: vehiculo.horaEntrada,
                espacioNumero: vehiculo.espacioNumero
              } : null
            };
          });
      })
    );
  }

  /**
   * ✅ Obtiene el estado general del estacionamiento en tiempo real
   */
  obtenerEstadoEstacionamiento(): Observable<EstadoEstacionamiento> {
    return this.obtenerEspaciosConVehiculos().pipe(
      map(espacios => {
        const espaciosTotales = espacios.length;
        const espaciosOcupados = espacios.filter(e => e.ocupado).length;
        const espaciosLibres = espaciosTotales - espaciosOcupados;
        const porcentajeOcupacion = espaciosTotales > 0 
          ? Math.round((espaciosOcupados / espaciosTotales) * 100) 
          : 0;

        return {
          espaciosTotales,
          espaciosOcupados,
          espaciosLibres,
          porcentajeOcupacion
        };
      })
    );
  }

  /**
   * ✅ Obtiene un espacio específico
   */
  async obtenerEspacio(numero: number): Promise<Espacio | null> {
    try {
      const docRef = doc(this.firestore, `espacios/${numero}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
          id: docSnap.id, 
          numero: data['numero'],
          tipo: data['tipo'],
          ocupado: data['ocupado'] || false,
          vehiculoId: data['vehiculoId']
        } as Espacio;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener espacio:', error);
      return null;
    }
  }

  /**
   * ✅ CORREGIDO: Marca un espacio como ocupado
   */
  async ocuparEspacio(numero: number, vehiculoId: string): Promise<void> {
    try {
      console.log(`🔒 Ocupando espacio ${numero} con vehículo ${vehiculoId}`);
      
      const docRef = doc(this.firestore, `espacios/${numero}`);
      await setDoc(docRef, {
        numero: numero,
        tipo: numero <= 15 ? 'Auto' : 'Camioneta',
        ocupado: true,
        vehiculoId: vehiculoId
      }, { merge: true });
      
      console.log(`✅ Espacio ${numero} marcado como ocupado`);
    } catch (error) {
      console.error('❌ Error al ocupar espacio:', error);
      throw error;
    }
  }

  /**
   * ✅ CORREGIDO: Libera un espacio ocupado
   */
  async liberarEspacio(numero: number): Promise<void> {
    try {
      console.log(`🔓 Liberando espacio ${numero}`);
      
      const docRef = doc(this.firestore, `espacios/${numero}`);
      await setDoc(docRef, {
        numero: numero,
        tipo: numero <= 15 ? 'Auto' : 'Camioneta',
        ocupado: false,
        vehiculoId: null
      }, { merge: true });
      
      console.log(`✅ Espacio ${numero} liberado`);
    } catch (error) {
      console.error('❌ Error al liberar espacio:', error);
      throw error;
    }
  }

  /**
   * ✅ Obtiene los espacios libres de un tipo específico
   */
  async obtenerEspaciosLibres(tipo?: string): Promise<Espacio[]> {
    try {
      const snapshot = await getDocs(this.coleccionEspacios);
      let espacios = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          numero: data['numero'],
          tipo: data['tipo'],
          ocupado: data['ocupado'] || false,
          vehiculoId: data['vehiculoId']
        } as Espacio;
      });
      
      let espaciosLibres = espacios.filter(e => !e.ocupado);
      
      if (tipo) {
        espaciosLibres = espaciosLibres.filter(e => e.tipo === tipo);
      }
      
      return espaciosLibres.sort((a, b) => a.numero - b.numero);
    } catch (error) {
      console.error('Error al obtener espacios libres:', error);
      return [];
    }
  }
}