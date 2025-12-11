import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AutenticacionServicio } from '../../servicios/autenticacion.servicio';
import { RolUsuario, PERMISOS_POR_ROL } from '../../modelos/usuario.modelo';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authServicio = inject(AutenticacionServicio);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Estado del usuario
  usuarioAutenticado = false;
  rolActual: RolUsuario = RolUsuario.PUBLICO;
  nombreRol: string = 'Público';
  iconoRol: string = '👤';
  textoBotonAccion: string = '🔐 Iniciar Sesión';

  ngOnInit(): void {
    // Suscribirse a cambios en el rol del usuario
    this.authServicio.rolActual$
      .pipe(takeUntil(this.destroy$))
      .subscribe(rol => {
        this.rolActual = rol;
        this.actualizarEstadoHeader();
        console.log('🔄 Rol actualizado en header:', rol);
      });

    // Suscribirse a cambios en la autenticación
    this.authServicio.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.usuarioAutenticado = !!user;
        this.actualizarEstadoHeader();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Actualiza el estado visual del header según el rol
   */
  private actualizarEstadoHeader(): void {
    const permisos = PERMISOS_POR_ROL[this.rolActual];
    
    this.nombreRol = permisos.nombre;
    this.iconoRol = permisos.icono;
    
    // Actualizar texto del botón de acción
    if (this.rolActual === RolUsuario.PUBLICO) {
      this.textoBotonAccion = '🔐 Iniciar Sesión';
    } else {
      this.textoBotonAccion = '🚪 Cerrar Sesión';
    }
  }

  /**
   * Acción principal del botón (Login o Logout)
   */
  async accionPrincipal(): Promise<void> {
    if (this.rolActual === RolUsuario.PUBLICO) {
      // Usuario público -> ir a login
      this.router.navigate(['/login']);
    } else {
      // Usuario autenticado -> cerrar sesión
      if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        try {
          await this.authServicio.cerrarSesion();
          console.log('✅ Sesión cerrada desde header');
        } catch (error) {
          console.error('❌ Error al cerrar sesión:', error);
          alert('Error al cerrar sesión. Intenta nuevamente.');
        }
      }
    }
  }
}