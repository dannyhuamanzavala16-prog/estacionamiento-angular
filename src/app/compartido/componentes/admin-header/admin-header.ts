import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AutenticacionServicio } from '../../servicios/autenticacion.servicio';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="admin-header">
      <div class="header-container">
        <h1>🅿️ ZavalaTech Parking</h1>
        <nav>
          <a (click)="irA('/inicio')" [class.activo]="rutaActual === '/inicio'">Inicio</a>
          <a (click)="irA('/vehiculos')" [class.activo]="rutaActual === '/vehiculos'">Vehículos</a>
          <a (click)="irA('/historial')" [class.activo]="rutaActual === '/historial'">Historial</a>
          <a (click)="irA('/estadisticas')" [class.activo]="rutaActual === '/estadisticas'">Estadísticas</a>
          <div class="admin-badge">
            <span>👤</span>
            <span>{{ nombreAdmin }}</span>
          </div>
          <button (click)="cerrarSesion()" class="btn-logout" type="button">🚪 Salir</button>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .admin-header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: white;
      padding: 1rem 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .header-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      color: #fbbf24;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }

    nav {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    nav a {
      color: #e2e8f0;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      transition: all 0.3s ease;
      font-weight: 500;
      cursor: pointer;
    }

    nav a:hover {
      background-color: rgba(251, 191, 36, 0.1);
      color: #fbbf24;
    }

    nav a.activo {
      background-color: #fbbf24;
      color: #0f172a;
      font-weight: 600;
    }

    .admin-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: rgba(251, 191, 36, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      color: #fbbf24;
      font-weight: 600;
      margin-left: auto;
    }

    .btn-logout {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
    }

    .btn-logout:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
    }

    @media (max-width: 768px) {
      .header-container {
        padding: 0 1rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      nav {
        gap: 0.5rem;
      }

      nav a, .btn-logout {
        font-size: 0.875rem;
        padding: 0.4rem 0.75rem;
      }

      .admin-badge {
        font-size: 0.875rem;
        padding: 0.4rem 0.75rem;
      }
    }
  `]
})
export class AdminHeaderComponent implements OnInit {
  private router = inject(Router);
  private authServicio = inject(AutenticacionServicio);

  nombreAdmin = 'Admin';
  rutaActual = '';

  ngOnInit(): void {
    // Obtener nombre del admin
    const email = this.authServicio.obtenerEmailUsuario();
    if (email) {
      this.nombreAdmin = email.split('@')[0];
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