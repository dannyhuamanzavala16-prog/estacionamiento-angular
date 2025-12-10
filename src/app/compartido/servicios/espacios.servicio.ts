import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  collectionData,
  query,
  where
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
   * Inicializa los espacios en Firestore si no existen
   */
  private async inicializarEspacios(): Promise<void> {
    try {
      const configDoc = await getDoc(doc(this.firestore, 'configuracion/espacios'));
      
      if (!configDoc.exists()) {
        // Crear 20 espacios por defecto
        const TOTAL_ESPACIOS = 20;
        
        for (let i = 1; i <= TOTAL_ESPACIOS; i++) {
          const espacio: Espacio = {
            numero: i,
            tipo: i <= 15 ? 'Auto' : 'Camioneta', // Primeros 15 para autos, resto para camionetas
            ocupado: false
          };
          
          await setDoc(doc(this.firestore, `espacios/${i}`), espacio);
        }

        // Guardar configuración
        await setDoc(doc(this.firestore, 'configuracion/espacios'), {
          total: TOTAL_ESPACIOS,
          inicializado: true,
          fechaCreacion: new Date()
        });

        console.log('✅ Espacios inicializados en Firestore');
      }
    } catch (error) {
      console.error('Error al inicializar espacios:', error);
    }
  }

  /**
   * Obtiene todos los espacios en tiempo real con información de vehículos
   */
  obtenerEspaciosConVehiculos(): Observable<any[]> {
    const espacios$ = collectionData(this.coleccionEspacios, { idField: 'id' }) as Observable<Espacio[]>;
    
    const vehiculosDentro$ = collectionData(
      query(this.coleccionVehiculos, where('estado', '==', EstadoVehiculo.DENTRO)),
      { idField: 'id' }
    ) as Observable<Vehiculo[]>;

    return combineLatest([espacios$, vehiculosDentro$]).pipe(
      map(([espacios, vehiculos]) => {
        return espacios
          .sort((a, b) => a.numero - b.numero)
          .map(espacio => {
            // Buscar si hay un vehículo en este espacio
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
   * Obtiene el estado general del estacionamiento en tiempo real
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
   * Obtiene un espacio específico
   */
  async obtenerEspacio(numero: number): Promise<Espacio | null> {
    try {
      const docRef = doc(this.firestore, `espacios/${numero}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Espacio;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener espacio:', error);
      return null;
    }
  }

  /**
   * Marca un espacio como ocupado
   */
  async ocuparEspacio(numero: number, vehiculoId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, `espacios/${numero}`);
      await setDoc(docRef, {
        ocupado: true,
        vehiculoId
      }, { merge: true });
    } catch (error) {
      console.error('Error al ocupar espacio:', error);
      throw error;
    }
  }

  /**
   * Libera un espacio ocupado
   */
  async liberarEspacio(numero: number): Promise<void> {
    try {
      const docRef = doc(this.firestore, `espacios/${numero}`);
      await setDoc(docRef, {
        ocupado: false,
        vehiculoId: null
      }, { merge: true });
    } catch (error) {
      console.error('Error al liberar espacio:', error);
      throw error;
    }
  }

  /**
   * Obtiene los espacios libres de un tipo específico
   */
  async obtenerEspaciosLibres(tipo?: string): Promise<Espacio[]> {
    try {
      const espacios$ = collectionData(this.coleccionEspacios) as Observable<Espacio[]>;
      
      return new Promise((resolve) => {
        espacios$.subscribe(espacios => {
          let espaciosLibres = espacios.filter(e => !e.ocupado);
          
          if (tipo) {
            espaciosLibres = espaciosLibres.filter(e => e.tipo === tipo);
          }
          
          resolve(espaciosLibres.sort((a, b) => a.numero - b.numero));
        });
      });
    } catch (error) {
      console.error('Error al obtener espacios libres:', error);
      return [];
    }
  }
}