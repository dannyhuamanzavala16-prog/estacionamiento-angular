import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizado para formatear placas de vehículos
 * Convierte placas a mayúsculas y les da formato estándar
 * 
 * Uso:
 * {{ 'abc123' | placa }} // "ABC-123"
 * {{ 'xyz789' | placa:false }} // "ABC123" (sin guión)
 */
@Pipe({
    name: 'placa',
    standalone: true
})
export class PlacaPipe implements PipeTransform {

    transform(valor: string, conGuion: boolean = true): string {
        // Validar que sea una cadena válida
        if (!valor || typeof valor !== 'string') {
            return '';
        }

        // Convertir a mayúsculas y eliminar espacios
        const placaLimpia = valor.trim().toUpperCase().replace(/\s+/g, '');

        // Si no queremos guión, devolver tal cual
        if (!conGuion) {
            return placaLimpia;
        }

        // Formato peruano típico: ABC-123 o ABC-1234
        // Intentar separar letras de números
        const match = placaLimpia.match(/^([A-Z]+)(\d+)$/);

        if (match) {
            return `${match[1]}-${match[2]}`;
        }

        // Si no coincide con el patrón, devolver sin formato
        return placaLimpia;
    }
}
