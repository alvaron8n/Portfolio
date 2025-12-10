/**
 * Configuración base para tipos de documento
 *
 * Define la estructura común para todos los tipos de documentos médicos.
 * Cada tipo de documento extiende esta configuración con sus campos específicos.
 */

import { z } from 'zod';

// =============================================================================
// TIPOS BASE
// =============================================================================

export type DocumentTypeId =
  | 'interconsulta'
  | 'informe-alta'
  | 'peticion-pruebas'
  | 'nota-evolutiva'
  | 'informe-social';

export interface DocumentTypeConfig {
  id: DocumentTypeId;
  name: string;
  shortName: string;
  description: string;
  icon: string; // Emoji o nombre de icono
  color: string; // Color Tailwind (ej: 'blue', 'green')
  schema: z.ZodSchema;
  defaultTemplate: string;
  placeholders: PlaceholderInfo[];
}

export interface PlaceholderInfo {
  key: string;
  label: string;
  description: string;
  required: boolean;
  section: string;
}

// =============================================================================
// SCHEMAS COMUNES (reutilizables entre documentos)
// =============================================================================

/**
 * Datos del paciente (común a todos los documentos)
 */
export const pacienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre/iniciales del paciente requerido'),
  edad: z.number().min(0, 'Edad inválida').max(150, 'Edad inválida'),
  sexo: z.enum(['Masculino', 'Femenino', 'No especificado']),
  identificador: z.string().optional(), // NHC, Historia Clínica
});

export type DatosPaciente = z.infer<typeof pacienteSchema>;

/**
 * Datos del médico (común a todos los documentos)
 */
export const medicoSchema = z.object({
  nombre: z.string().min(1, 'Nombre del médico requerido'),
  servicio: z.string().optional(),
  numeroColegiado: z.string().optional(),
  centro: z.string().optional(),
});

export type DatosMedico = z.infer<typeof medicoSchema>;

/**
 * Prioridades disponibles
 */
export const prioridadSchema = z.enum(['Urgente', 'Preferente', 'Normal']);
export type Prioridad = z.infer<typeof prioridadSchema>;

// =============================================================================
// REGISTRO DE TIPOS DE DOCUMENTO
// =============================================================================

/**
 * Registro centralizado de todos los tipos de documento disponibles
 * Se usa para generar navegación, selectores, etc.
 */
export const DOCUMENT_TYPES: Record<DocumentTypeId, Omit<DocumentTypeConfig, 'schema' | 'defaultTemplate' | 'placeholders'>> = {
  'interconsulta': {
    id: 'interconsulta',
    name: 'Interconsulta',
    shortName: 'IC',
    description: 'Solicitud de valoración por otra especialidad',
    icon: '📋',
    color: 'blue',
  },
  'informe-alta': {
    id: 'informe-alta',
    name: 'Informe de Alta',
    shortName: 'IA',
    description: 'Informe de alta hospitalaria',
    icon: '🏥',
    color: 'green',
  },
  'peticion-pruebas': {
    id: 'peticion-pruebas',
    name: 'Petición de Pruebas',
    shortName: 'PP',
    description: 'Solicitud de pruebas diagnósticas',
    icon: '🔬',
    color: 'purple',
  },
  'nota-evolutiva': {
    id: 'nota-evolutiva',
    name: 'Nota Evolutiva',
    shortName: 'NE',
    description: 'Nota de evolución clínica (SOAP)',
    icon: '📝',
    color: 'amber',
  },
  'informe-social': {
    id: 'informe-social',
    name: 'Informe Social',
    shortName: 'IS',
    description: 'Informe para trabajo social',
    icon: '👥',
    color: 'pink',
  },
};

/**
 * Lista ordenada de tipos de documento para mostrar en UI
 */
export const DOCUMENT_TYPE_LIST = Object.values(DOCUMENT_TYPES);

/**
 * Obtiene la configuración de un tipo de documento
 */
export function getDocumentTypeConfig(id: DocumentTypeId) {
  return DOCUMENT_TYPES[id];
}

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Formatea la fecha actual en formato dd/mm/aaaa
 */
export function formatearFechaActual(): string {
  const hoy = new Date();
  const dia = hoy.getDate().toString().padStart(2, '0');
  const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
  const anio = hoy.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

/**
 * Formatea una fecha para input type="date"
 */
export function formatDateForInput(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calcula días entre dos fechas
 */
export function calcularDiasEntre(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diffTime = Math.abs(fin.getTime() - inicio.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
