import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AutenticacionServicio } from '../../compartido/servicios/autenticacion.servicio';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  email: string = '';
  password: string = '';
  mensaje: string = '';
  mensajeTipo: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AutenticacionServicio
  ) {
    console.log('✅ Login component initialized');
  }

  ngOnInit(): void {
    // No redirigir automáticamente, dejar que el usuario decida
    console.log('📋 Login page loaded');
  }

  onUsuarioChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.email = input.value.trim();
  }

  onPasswordChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.password = input.value;
  }

  async onSubmit(): Promise<void> {
    console.log('🚀 ===== LOGIN ATTEMPT =====');
    console.log('📧 Email:', this.email);
    
    // Limpiar mensaje anterior
    this.mensaje = '';
    this.isLoading = true;

    // Validar campos vacíos
    if (!this.email.trim() || !this.password) {
      console.log('❌ Empty fields detected');
      this.mostrarMensaje('✗ Por favor completa todos los campos.', 'error');
      this.isLoading = false;
      return;
    }

    // Validar formato de email básico
    if (!this.email.includes('@')) {
      console.log('❌ Invalid email format');
      this.mostrarMensaje('✗ Por favor ingresa un correo válido.', 'error');
      this.isLoading = false;
      return;
    }

    try {
      // Intentar iniciar sesión con Firebase
      await this.authService.iniciarSesion(this.email, this.password);
      
      // Login exitoso
      console.log('✅ LOGIN SUCCESSFUL!');
      this.mostrarMensaje('✓ Inicio de sesión exitoso. Redirigiendo...', 'success');
      
      // Redireccionar después de 1 segundo
      setTimeout(() => {
        this.router.navigate(['/inicio']);
      }, 1000);
      
    } catch (error: any) {
      // Login fallido
      console.log('❌ LOGIN FAILED:', error.message);
      this.mostrarMensaje(`✗ ${error.message}`, 'error');
      this.password = '';
      this.isLoading = false;
    }
  }

  private mostrarMensaje(texto: string, tipo: string): void {
    console.log('📢 Showing message:', tipo, '-', texto);
    this.mensaje = texto;
    this.mensajeTipo = tipo;

    if (tipo === 'error') {
      setTimeout(() => {
        this.mensaje = '';
      }, 4000);
    }
  }
}