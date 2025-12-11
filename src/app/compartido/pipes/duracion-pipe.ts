import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizado para formatear duraciones de tiempo
 * Convierte milisegundos o fechas en un formato legible
 * 
 * Uso:
 * {{ milisegundos | duracion }}
 * {{ fechaInicio | duracion:fechaFin }}
 */
@Pipe({
    name: 'duracion',
    standalone: true
})
export class DuracionPipe implements PipeTransform {

    transform(valor: Date | number, fechaFin?: Date): string {
        let milisegundos: number;

        // Si recibimos dos fechas, calculamos la diferencia
        if (valor instanceof Date && fechaFin instanceof Date) {
            milisegundos = fechaFin.getTime() - valor.getTime();
        }
        // Si recibimos una fecha y no hay fecha fin, usamos la fecha actual
        else if (valor instanceof Date) {
            milisegundos = new Date().getTime() - valor.getTime();
        }
        // Si recibimos milisegundos directamente
        else if (typeof valor === 'number') {
            milisegundos = valor;
        }
        else {
            return '0s';
        }

        // Validar que sea un número válido
        if (milisegundos < 0 || isNaN(milisegundos)) {
            return '0s';
        }

        const segundos = Math.floor(milisegundos / 1000);
        const minutos = Math.floor(segundos / 60);
        const horas = Math.floor(minutos / 60);
        const dias = Math.floor(horas / 24);

        // Formato según la magnitud del tiempo
        if (dias > 0) {
            const h = horas % 24;
            const m = minutos % 60;
            return `${dias}d ${h}h ${m}m`;
        }

        if (horas > 0) {
            const m = minutos % 60;
            return `${horas}h ${m}m`;
        }

        if (minutos > 0) {
            const s = segundos % 60;
            return `${minutos}m ${s}s`;
        }

        return `${segundos}s`;
    }
}
