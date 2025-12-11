import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizado para formatear porcentajes
 * Convierte números decimales o enteros en porcentajes formateados
 * 
 * Uso:
 * {{ 0.75 | porcentaje }} // "75%"
 * {{ 75 | porcentaje:true }} // "75%" (ya es porcentaje)
 * {{ 0.7534 | porcentaje:false:1 }} // "75.3%"
 */
@Pipe({
    name: 'porcentaje',
    standalone: true
})
export class PorcentajePipe implements PipeTransform {

    transform(
        valor: number,
        yaEsPorcentaje: boolean = false,
        decimales: number = 0
    ): string {
        // Validar que sea un número válido
        if (isNaN(valor) || valor === null || valor === undefined) {
            return '0%';
        }

        // Si ya es porcentaje (0-100), solo formateamos
        // Si no, multiplicamos por 100
        const porcentaje = yaEsPorcentaje ? valor : valor * 100;

        // Limitar entre 0 y 100
        const porcentajeLimitado = Math.max(0, Math.min(100, porcentaje));

        // Formatear con los decimales especificados
        return `${porcentajeLimitado.toFixed(decimales)}%`;
    }
}
w