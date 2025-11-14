
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cabecera',
  imports: [],
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.css',
})
export class Cabecera {
  
  constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
