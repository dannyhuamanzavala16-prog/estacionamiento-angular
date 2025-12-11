import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AutenticacionServicio } from '../../compartido/servicios/autenticacion.servicio';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  mensaje: string = '';
  mensajeTipo: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AutenticacionServicio,
    private fb: FormBuilder
  ) {
    console.log('✅ Login component initialized with Reactive Forms');
  }

  ngOnInit(): void {
    // Inicializar el formulario reactivo
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    console.log('📋 Login page loaded with Reactive Forms');
  }

  // Getters para acceder fácilmente a los controles del formulario
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  async onSubmit(): Promise<void> {
    console.log('🚀 ===== LOGIN ATTEMPT =====');
    console.log('📧 Email:', this.loginForm.value.email);

    // Limpiar mensaje anterior
    this.mensaje = '';

    // Validar que el formulario sea válido
    if (this.loginForm.invalid) {
      console.log('❌ Form validation failed');

      // Marcar todos los campos como tocados para mostrar errores
      this.loginForm.markAllAsTouched();

      // Mostrar mensaje específico según el error
      if (this.email?.errors?.['required'] || this.password?.errors?.['required']) {
        this.mostrarMensaje('✗ Por favor completa todos los campos.', 'error');
      } else if (this.email?.errors?.['email']) {
        this.mostrarMensaje('✗ Por favor ingresa un correo válido.', 'error');
      } else if (this.password?.errors?.['minLength']) {
        this.mostrarMensaje('✗ La contraseña debe tener al menos 6 caracteres.', 'error');
      }

      return;
    }

    this.isLoading = true;

    try {
      // Intentar iniciar sesión con Firebase
      await this.authService.iniciarSesion(
        this.loginForm.value.email,
        this.loginForm.value.password
      );

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

      // Limpiar solo el campo de contraseña
      this.loginForm.patchValue({ password: '' });
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