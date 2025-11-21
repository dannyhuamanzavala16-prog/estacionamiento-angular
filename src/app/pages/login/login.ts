import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  usuario: string = '';
  password: string = '';
  mensaje: string = '';
  mensajeTipo: string = '';
  isLoading: boolean = false;

  // Credenciales de administradores
  private adminUsers: { [key: string]: string } = {
    'admin': 'admin123',
    'zavalaTech': 'parking2025',
    'administrador': 'zavala2025'
  };

  constructor(private router: Router) {
    console.log('✅ Login component initialized');
  }

  ngOnInit(): void {
    // Verificar si ya hay sesión activa
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    console.log('🔍 Checking existing session:', isLoggedIn);
    
    if (isLoggedIn === 'true') {
      console.log('✅ Session exists, redirecting to /vehiculos');
      this.router.navigate(['/vehiculos']);
    }
  }

  onUsuarioChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.usuario = input.value;
    console.log('👤 Usuario changed:', this.usuario);
  }

  onPasswordChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.password = input.value;
    console.log('🔒 Password changed (length):', this.password.length);
  }

  onSubmit(): void {
    console.log('🚀 ===== LOGIN ATTEMPT =====');
    console.log('📝 Usuario:', this.usuario);
    console.log('🔑 Password length:', this.password.length);
    
    // Limpiar mensaje anterior
    this.mensaje = '';
    this.isLoading = true;

    // Validar campos vacíos
    if (!this.usuario.trim() || !this.password) {
      console.log('❌ Empty fields detected');
      this.mostrarMensaje('✗ Por favor completa todos los campos.', 'error');
      this.isLoading = false;
      return;
    }

    // Validar credenciales
    const usuarioTrim = this.usuario.trim();
    console.log('🔍 Checking credentials for user:', usuarioTrim);
    console.log('🔍 Expected password:', this.adminUsers[usuarioTrim]);
    console.log('🔍 Provided password:', this.password);
    console.log('🔍 Match:', this.adminUsers[usuarioTrim] === this.password);
    
    if (this.adminUsers[usuarioTrim] && this.adminUsers[usuarioTrim] === this.password) {
      // Login exitoso
      console.log('✅ LOGIN SUCCESSFUL!');
      this.mostrarMensaje('✓ Inicio de sesión exitoso. Redirigiendo...', 'success');
      
      // Guardar sesión
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('adminUsername', usuarioTrim);
      localStorage.setItem('loginTime', new Date().toISOString());
      console.log('💾 Session saved to localStorage');

      // Redireccionar
      setTimeout(() => {
        console.log('🔄 Attempting navigation to /vehiculos');
        this.router.navigate(['/vehiculos']).then(
          success => console.log('✅ Navigation successful:', success),
          error => {
            console.error('❌ Navigation error:', error);
            this.mostrarMensaje('✗ Error al redireccionar. Verifica las rutas.', 'error');
            this.isLoading = false;
          }
        );
      }, 1000);
    } else {
      // Login fallido
      console.log('❌ LOGIN FAILED - Invalid credentials');
      this.mostrarMensaje('✗ Usuario o contraseña incorrectos.', 'error');
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