import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, user } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Usuario, RolUsuario } from '../../compartido/modelos/usuario.modelo';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionServicio {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  
  user$ = user(this.auth);
  usuarioActual: Usuario | null = null;

  async iniciarSesion(email: string, password: string): Promise<void> {
    try {
      const credencial = await signInWithEmailAndPassword(this.auth, email, password);
      await this.cargarDatosUsuario(credencial.user.uid);
      this.router.navigate(['/inicio']);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
  }

  async registrar(email: string, password: string, nombre: string, rol: RolUsuario): Promise<void> {
    try {
      const credencial = await createUserWithEmailAndPassword(this.auth, email, password);
      const usuario: Usuario = {
        id: credencial.user.uid,
        email,
        nombre,
        rol
      };
      await setDoc(doc(this.firestore, `usuarios/${credencial.user.uid}`), usuario);
      this.usuarioActual = usuario;
    } catch (error) {
      console.error('Error al registrar:', error);
      throw error;
    }
  }

  async cerrarSesion(): Promise<void> {
    await signOut(this.auth);
    this.usuarioActual = null;
    this.router.navigate(['/login']);
  }

  async cargarDatosUsuario(uid: string): Promise<void> {
    const docRef = doc(this.firestore, `usuarios/${uid}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      this.usuarioActual = docSnap.data() as Usuario;
    }
  }

  esAdministrador(): boolean {
    return this.usuarioActual?.rol === RolUsuario.ADMINISTRADOR;
  }

  esGuardia(): boolean {
    return this.usuarioActual?.rol === RolUsuario.GUARDIA;
  }
}