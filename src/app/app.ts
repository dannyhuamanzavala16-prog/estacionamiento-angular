import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Cabecera } from "./pages/cabecera/cabecera";
import { PiePagina } from "./pages/pie-pagina/pie-pagina";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Cabecera, PiePagina],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('estacionamiento-angular');
}
