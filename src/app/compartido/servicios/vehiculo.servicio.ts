import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, Timestamp, deleteDoc } from '@angular/fire/firestore';
import { Vehiculo, TipoVehiculo, EstadoVehiculo } from '../modelos/vehiculo.modelo';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VehiculosServicio {
  private firestore = inject(Firestore);
  private coleccion = collection(this.firestore, 'vehiculos');

  async registrarEntrada(vehiculo: Omit<Vehiculo, 'id' | 'estado'>): Promise<string> {
    try {
      const nuevoVehiculo = {
        ...vehiculo,
        horaEntrada: Timestamp.fromDate(new Date()),
        estado: EstadoVehiculo.DENTRO
      };
      const docRef = await addDoc(this.coleccion, nuevoVehiculo);
      return docRef.id;
    } catch (error) {
      console.error('Error al registrar entrada:', error);
      throw error;
    }
  }

  async registrarSalida(vehiculoId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, `vehiculos/${vehiculoId}`);
      await updateDoc(docRef, {
        horaSalida: Timestamp.fromDate(new Date()),
        estado: EstadoVehiculo.FUERA
      });
    } catch (error) {
      console.error('Error al registrar salida:', error);
      throw error;
    }
  }

  async obtenerVehiculosDentro(): Promise<Vehiculo[]> {
    try {
      const q = query(
        this.coleccion,
        where('estado', '==', EstadoVehiculo.DENTRO),
        orderBy('horaEntrada', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        horaEntrada: doc.data()['horaEntrada'].toDate(),
        horaSalida: doc.data()['horaSalida']?.toDate()
      } as Vehiculo));
    } catch (error) {
      console.error('Error al obtener vehículos:', error);
      return [];
    }
  }

  async obtenerHistorial(fechaInicio?: Date, fechaFin?: Date, tipo?: TipoVehiculo): Promise<Vehiculo[]> {
    try {
      let q = query(this.coleccion, orderBy('horaEntrada', 'desc'));
      
      const snapshot = await getDocs(q);
      let vehiculos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        horaEntrada: doc.data()['horaEntrada'].toDate(),
        horaSalida: doc.data()['horaSalida']?.toDate()
      } as Vehiculo));

      // Filtrar por fecha y tipo en el cliente
      if (fechaInicio) {
        vehiculos = vehiculos.filter(v => v.horaEntrada >= fechaInicio);
      }
      if (fechaFin) {
        vehiculos = vehiculos.filter(v => v.horaEntrada <= fechaFin);
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

  async buscarPorPlaca(placa: string): Promise<Vehiculo[]> {
    try {
      const q = query(
        this.coleccion,
        where('placa', '==', placa.toUpperCase()),
        orderBy('horaEntrada', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        horaEntrada: doc.data()['horaEntrada'].toDate(),
        horaSalida: doc.data()['horaSalida']?.toDate()
      } as Vehiculo));
    } catch (error) {
      console.error('Error al buscar por placa:', error);
      return [];
    }
  }

  async obtenerEstadisticas(fechaInicio: Date, fechaFin: Date) {
    const vehiculos = await this.obtenerHistorial(fechaInicio, fechaFin);
    
    const totalVehiculos = vehiculos.length;
    const porTipo = vehiculos.reduce((acc, v) => {
      acc[v.tipo] = (acc[v.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const duracionesEnMinutos = vehiculos
      .filter(v => v.horaSalida)
      .map(v => (v.horaSalida!.getTime() - v.horaEntrada.getTime()) / 60000);
    
    const duracionPromedio = duracionesEnMinutos.length > 0
      ? duracionesEnMinutos.reduce((a, b) => a + b, 0) / duracionesEnMinutos.length
      : 0;

    return {
      totalVehiculos,
      porTipo,
      duracionPromedioMinutos: Math.round(duracionPromedio)
    };
  }
}