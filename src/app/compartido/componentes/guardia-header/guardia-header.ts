import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AutenticacionServicio } from '../../servicios/autenticacion.servicio';

@Component({
  selector: 'app-guardia-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guardia-header.html',
  styleUrl: './guardia-header.css'
})
export class GuardiaHeaderComponent implements OnInit {
  private router = inject(Router);
  private authServicio = inject(AutenticacionServicio);

  nombreGuardia = 'Guardia';
  rutaActual = '';

  ngOnInit(): void {
    // Obtener nombre del guardia
    const email = this.authServicio.obtenerEmailUsuario();
    if (email) {
      this.nombreGuardia = email.split('@')[0];
    }

    // Actualizar ruta actual
    this.rutaActual = this.router.url;
    
    // Escuchar cambios de ruta
    this.router.events.subscribe(() => {
      this.rutaActual = this.router.url;
    });
  }

  irA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  async cerrarSesion(): Promise<void> {
    const confirmar = confirm('¿Estás seguro de que deseas cerrar sesión?');
    
    if (confirmar) {
      try {
        await this.authServicio.cerrarSesion();
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    }
  }
}