import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizado para formatear moneda peruana (Soles)
 * Formatea números como moneda con símbolo S/. y decimales
 * 
 * Uso:
 * {{ precio | moneda }}
 * {{ precio | moneda:0 }} // sin decimales
 * {{ precio | moneda:3 }} // con 3 decimales
 */
@Pipe({
    name: 'moneda',
    standalone: true
})
export class MonedaPipe implements PipeTransform {

    transform(valor: number | string, decimales: number = 2): string {
        // Convertir a número si es string
        const numero = typeof valor === 'string' ? parseFloat(valor) : valor;

        // Validar que sea un número válido
        if (isNaN(numero)) {
            return 'S/. 0.00';
        }

        // Formatear con separadores de miles y decimales
        const partes = numero.toFixed(decimales).split('.');
        const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const decimal = partes[1] || '';

        if (decimales === 0) {
            return `S/. ${entero}`;
        }

        return `S/. ${entero}.${decimal}`;
    }
}
