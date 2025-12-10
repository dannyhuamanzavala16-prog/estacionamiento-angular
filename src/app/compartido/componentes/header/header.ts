import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AutenticacionServicio } from '../../servicios/autenticacion.servicio';

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

  usuarioAutenticado = false;

  ngOnInit(): void {
    this.authServicio.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.usuarioAutenticado = !!user;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  irAPanelAdmin(): void {
    if (this.usuarioAutenticado) {
      // Si está autenticado, ir al panel de vehículos
      this.router.navigate(['/vehiculos']);
    } else {
      // Si no está autenticado, ir al login
      this.router.navigate(['/login']);
    }
  }
}