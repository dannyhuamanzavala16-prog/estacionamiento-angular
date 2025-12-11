import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { RolUsuario, Usuario } from '../modelos/usuario.modelo';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionServicio {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  
  user$ = user(this.auth);
  
  // BehaviorSubject para el rol actual del usuario
  private rolActualSubject = new BehaviorSubject<RolUsuario>(RolUsuario.PUBLICO);
  public rolActual$ = this.rolActualSubject.asObservable();

  // BehaviorSubject para los datos del usuario
  private usuarioActualSubject = new BehaviorSubject<Usuario | null>(null);
  public usuarioActual$ = this.usuarioActualSubject.asObservable();

  constructor() {
    this.inicializarEstadoUsuario();
  }

  /**
   * Inicializa el estado del usuario desde localStorage o Firebase
   */
  private async inicializarEstadoUsuario(): Promise<void> {
    const rolGuardado = localStorage.getItem('userRole') as RolUsuario;
    const emailGuardado = localStorage.getItem('adminEmail');
    
    if (rolGuardado && emailGuardado) {
      // Restaurar estado desde localStorage
      this.rolActualSubject.next(rolGuardado);
      
      const usuario: Usuario = {
        email: emailGuardado,
        nombre: emailGuardado.split('@')[0],
        rol: rolGuardado
      };
      this.usuarioActualSubject.next(usuario);
      
      console.log('✅ Estado de usuario restaurado:', rolGuardado);
    } else {
      // Usuario público por defecto
      this.rolActualSubject.next(RolUsuario.PUBLICO);
      this.usuarioActualSubject.next(null);
      console.log('👤 Usuario público (no autenticado)');
    }
  }

  /**
   * Obtiene el rol del usuario desde Firestore
   */
  private async obtenerRolUsuario(email: string): Promise<RolUsuario> {
    try {
      // Buscar en la colección de usuarios
      const userDoc = await getDoc(doc(this.firestore, 'usuarios', email));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData['rol'] || RolUsuario.GUARDIA;
      }
      
      // Si no existe en Firestore, asignar rol por defecto según el email
      if (email.includes('admin')) {
        return RolUsuario.ADMINISTRADOR;
      }
      
      return RolUsuario.GUARDIA;
    } catch (error) {
      console.error('Error al obtener rol:', error);
      return RolUsuario.GUARDIA; // Por defecto
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async iniciarSesion(email: string, password: string): Promise<void> {
    try {
      console.log('🔐 Intentando iniciar sesión con Firebase...');
      const credencial = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('✅ Autenticación exitosa:', credencial.user.email);
      
      // Obtener rol del usuario
      const rol = await this.obtenerRolUsuario(email);
      console.log('👤 Rol asignado:', rol);
      
      // Crear objeto usuario
      const usuario: Usuario = {
        email: credencial.user.email || email,
        nombre: credencial.user.email?.split('@')[0] || 'Usuario',
        rol: rol
      };
      
      // Guardar en localStorage
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('adminEmail', usuario.email);
      localStorage.setItem('userRole', rol);
      localStorage.setItem('loginTime', new Date().toISOString());
      
      // Actualizar estado
      this.rolActualSubject.next(rol);
      this.usuarioActualSubject.next(usuario);
      
      // Redirigir según el rol
      this.redirigirSegunRol(rol);
      
    } catch (error: any) {
      console.error('❌ Error al iniciar sesión:', error);
      
      let mensajeError = 'Error al iniciar sesión';
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        mensajeError = 'Usuario o contraseña incorrectos';
      } else if (error.code === 'auth/user-not-found') {
        mensajeError = 'Usuario no encontrado';
      } else if (error.code === 'auth/too-many-requests') {
        mensajeError = 'Demasiados intentos. Intenta más tarde';
      } else if (error.code === 'auth/network-request-failed') {
        mensajeError = 'Error de conexión. Verifica tu internet';
      }
      
      throw new Error(mensajeError);
    }
  }

  /**
   * Redirige al usuario según su rol
   */
  private redirigirSegunRol(rol: RolUsuario): void {
    switch (rol) {
      case RolUsuario.ADMINISTRADOR:
        this.router.navigate(['/inicio']);
        break;
      case RolUsuario.GUARDIA:
        this.router.navigate(['/inicio']);
        break;
      default:
        this.router.navigate(['/inicio']);
    }
  }

  /**
   * Cierra la sesión actual
   */
  async cerrarSesion(): Promise<void> {
    try {
      await signOut(this.auth);
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('loginTime');
      
      // Volver a usuario público
      this.rolActualSubject.next(RolUsuario.PUBLICO);
      this.usuarioActualSubject.next(null);
      
      this.router.navigate(['/inicio']);
      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  estaAutenticado(): boolean {
    const autenticado = this.auth.currentUser !== null || localStorage.getItem('adminLoggedIn') === 'true';
    return autenticado;
  }

  /**
   * Obtiene el rol actual del usuario
   */
  obtenerRolActual(): RolUsuario {
    return this.rolActualSubject.value;
  }

  /**
   * Obtiene el email del usuario actual
   */
  obtenerEmailUsuario(): string | null {
    return this.auth.currentUser?.email || localStorage.getItem('adminEmail');
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  tieneRol(rol: RolUsuario): boolean {
    return this.rolActualSubject.value === rol;
  }

  /**
   * Verifica si el usuario tiene acceso a una ruta
   */
  tieneAccesoARuta(ruta: string): boolean {
    const rol = this.obtenerRolActual();
    
    // Rutas públicas (accesibles por todos)
    const rutasPublicas = ['/inicio', '/login'];
    if (rutasPublicas.includes(ruta)) {
      return true;
    }
    
    // Rutas protegidas según rol
    switch (rol) {
      case RolUsuario.ADMINISTRADOR:
        return ['/vehiculos', '/historial', '/estadisticas'].includes(ruta);
      
      case RolUsuario.GUARDIA:
        return ['/vehiculos', '/buscar'].includes(ruta);
      
      case RolUsuario.PUBLICO:
      default:
        return false;
    }
  }
}