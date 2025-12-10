import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionServicio {
  private auth = inject(Auth);
  private router = inject(Router);
  
  user$ = user(this.auth);

  /**
   * Inicia sesión con email y contraseña
   */
  async iniciarSesion(email: string, password: string): Promise<void> {
    try {
      console.log('🔐 Intentando iniciar sesión con Firebase...');
      const credencial = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('✅ Inicio de sesión exitoso:', credencial.user.email);
      
      // Guardar en localStorage
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('adminEmail', credencial.user.email || '');
      localStorage.setItem('loginTime', new Date().toISOString());
      
      // Redirigir a inicio
      this.router.navigate(['/inicio']);
    } catch (error: any) {
      console.error('❌ Error al iniciar sesión:', error);
      
      // Mensajes de error más amigables
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
   * Cierra la sesión actual
   */
  async cerrarSesion(): Promise<void> {
    try {
      await signOut(this.auth);
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('loginTime');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  estaAutenticado(): boolean {
    return this.auth.currentUser !== null || localStorage.getItem('adminLoggedIn') === 'true';
  }

  /**
   * Obtiene el email del usuario actual
   */
  obtenerEmailUsuario(): string | null {
    return this.auth.currentUser?.email || localStorage.getItem('adminEmail');
  }
}