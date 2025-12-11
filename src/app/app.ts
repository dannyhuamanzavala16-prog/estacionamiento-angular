import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './compartido/componentes/header/header';
import { FooterComponent } from './compartido/componentes/footer/footer';
import { Subject, takeUntil, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Controla si se muestra el header/footer
  mostrarLayout = true;

  constructor(private router: Router) {
    console.log('🚀 App iniciado con sistema de roles');
    console.log('👤 Roles disponibles: Público, Guardia, Administrador');
  }

  ngOnInit(): void {
    // Escuchar cambios de ruta para ocultar/mostrar header y footer
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        // Ocultar header/footer solo en la página de login
        this.mostrarLayout = !event.url.includes('/login');
        console.log('📍 Ruta actual:', event.url, '- Mostrar layout:', this.mostrarLayout);
      });

    // Verificar ruta inicial
    this.mostrarLayout = !this.router.url.includes('/login');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}