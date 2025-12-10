/**
 * Validaciones del formulario de interconsulta
 */

import { InterconsultaFormData, ValidationResult, ValidationError } from '@/types';

/**
 * Valida los datos del formulario de interconsulta
 *
 * Campos requeridos:
 * - Servicio destino
 * - Prioridad
 * - Nombre/iniciales del paciente
 * - Edad del paciente
 * - Motivo principal
 * - Nombre del médico
 */
export function validateInterconsultaForm(data: InterconsultaFormData): ValidationResult {
  const errors: ValidationError[] = [];

  // Validar servicio destino
  if (!data.servicioDestino || data.servicioDestino.trim() === '') {
    errors.push({
      field: 'servicioDestino',
      message: 'El servicio destino es obligatorio',
    });
  }

  // Validar prioridad
  if (!data.prioridad) {
    errors.push({
      field: 'prioridad',
      message: 'La prioridad es obligatoria',
    });
  }

  // Validar datos del paciente
  if (!data.paciente.nombre || data.paciente.nombre.trim() === '') {
    errors.push({
      field: 'paciente.nombre',
      message: 'El nombre o iniciales del paciente es obligatorio',
    });
  }

  if (!data.paciente.edad || data.paciente.edad < 0 || data.paciente.edad > 150) {
    errors.push({
      field: 'paciente.edad',
      message: 'La edad del paciente debe ser un número válido entre 0 y 150',
    });
  }

  // Validar información clínica
  if (!data.informacionClinica.motivoPrincipal || data.informacionClinica.motivoPrincipal.trim() === '') {
    errors.push({
      field: 'informacionClinica.motivoPrincipal',
      message: 'El motivo principal de la interconsulta es obligatorio',
    });
  }

  // Validar datos del médico
  if (!data.medico.nombre || data.medico.nombre.trim() === '') {
    errors.push({
      field: 'medico.nombre',
      message: 'El nombre del médico remitente es obligatorio',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Obtiene el mensaje de error para un campo específico
 */
export function getFieldError(errors: ValidationError[], field: string): string | null {
  const error = errors.find(e => e.field === field);
  return error ? error.message : null;
}

/**
 * Verifica si un campo específico tiene error
 */
export function hasFieldError(errors: ValidationError[], field: string): boolean {
  return errors.some(e => e.field === field);
}
